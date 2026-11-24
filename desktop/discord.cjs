// Discord Rich Presence over Discord's local IPC socket, without a library.
//
// Protocol: frames of [int32 LE opcode][int32 LE length][JSON]. Opcode 0 is the handshake
// ({ v: 1, client_id }), 1 a command or event, 2 close, 3 ping (answer with 4 pong). After the READY
// event, SET_ACTIVITY commands set or clear (activity: null) what friends see.
//
// Discord may not be installed or running. Then nothing happens and we look again every
// RECONNECT_MS. Discord also limits SET_ACTIVITY to about 5 per 20 seconds, so updates are throttled
// and only the latest one is sent.
const net = require('node:net');
const path = require('node:path');
const crypto = require('node:crypto');

const OP = { HANDSHAKE: 0, FRAME: 1, CLOSE: 2, PING: 3, PONG: 4 };
const RECONNECT_MS = 15_000;
const MIN_INTERVAL_MS = 4_000;

function socketPaths() {
  if (process.platform === 'win32') return Array.from({ length: 10 }, (_, i) => `\\\\?\\pipe\\discord-ipc-${i}`);
  const base = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
  const dirs = [base, path.join(base, 'app/com.discordapp.Discord'), path.join(base, 'snap.discord')];
  return dirs.flatMap((dir) => Array.from({ length: 10 }, (_, i) => path.join(dir, `discord-ipc-${i}`)));
}

function encode(op, payload) {
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(json.length, 4);
  return Buffer.concat([header, json]);
}

function tryConnect(paths) {
  return new Promise((resolve) => {
    const next = (i) => {
      if (i >= paths.length) return resolve(null);
      const sock = net.createConnection(paths[i]);
      sock.once('connect', () => resolve(sock));
      sock.once('error', () => next(i + 1));
    };
    next(0);
  });
}

/**
 * createPresence(clientId) -> { set(activity|null), stop() }
 * `activity` is a Discord activity object (details, state, timestamps, assets, buttons).
 */
function createPresence(clientId) {
  let sock = null;
  let ready = false;
  let stopped = false;
  let buffer = Buffer.alloc(0);
  let wanted = null; // the latest activity the game asked for
  let sentKey = undefined; // JSON of what Discord shows now
  let lastSentAt = 0;
  let sendTimer = null;
  let retryTimer = null;

  const log = (...args) => {
    if (process.env.RED_STRING_DISCORD_DEBUG) console.log('[discord]', ...args);
  };

  function scheduleReconnect() {
    if (stopped || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void connect();
    }, RECONNECT_MS);
  }

  function reset() {
    ready = false;
    sentKey = undefined;
    buffer = Buffer.alloc(0);
    if (sock) {
      sock.removeAllListeners();
      sock.destroy();
      sock = null;
    }
  }

  function flush() {
    sendTimer = null;
    if (!ready || !sock) return;
    const key = JSON.stringify(wanted);
    if (key === sentKey) return;
    const wait = lastSentAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) {
      sendTimer = setTimeout(flush, wait);
      return;
    }
    sock.write(
      encode(OP.FRAME, {
        cmd: 'SET_ACTIVITY',
        args: { pid: process.pid, activity: wanted },
        nonce: crypto.randomUUID(),
      }),
    );
    sentKey = key;
    lastSentAt = Date.now();
    log('activity', key);
  }

  function schedule() {
    if (!sendTimer) sendTimer = setTimeout(flush, 250);
  }

  function onMessage(op, body) {
    if (op === OP.PING) {
      sock.write(encode(OP.PONG, body));
    } else if (op === OP.CLOSE) {
      log('closed by Discord', body && body.message);
      reset();
      scheduleReconnect();
    } else if (op === OP.FRAME) {
      if (body.evt === 'READY') {
        ready = true;
        log('ready as', body.data && body.data.user && body.data.user.username);
        schedule();
      } else if (body.evt === 'ERROR') {
        log('error', body.data && body.data.message);
      }
    }
  }

  function onData(chunk) {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 8) {
      const op = buffer.readInt32LE(0);
      const len = buffer.readInt32LE(4);
      if (buffer.length < 8 + len) return;
      let body = null;
      try {
        body = JSON.parse(buffer.subarray(8, 8 + len).toString('utf8'));
      } catch {
        body = null;
      }
      buffer = buffer.subarray(8 + len);
      if (body) onMessage(op, body);
    }
  }

  async function connect() {
    if (stopped || sock || !clientId) return;
    const s = await tryConnect(socketPaths());
    if (!s) {
      scheduleReconnect();
      return;
    }
    if (stopped) {
      s.destroy();
      return;
    }
    sock = s;
    sock.on('data', onData);
    sock.on('error', () => {});
    sock.on('close', () => {
      log('socket closed');
      reset();
      scheduleReconnect();
    });
    sock.write(encode(OP.HANDSHAKE, { v: 1, client_id: clientId }));
  }

  void connect();

  return {
    set(activity) {
      wanted = activity || null;
      schedule();
    },
    /** Clear the status and disconnect (on quit). */
    stop() {
      stopped = true;
      clearTimeout(sendTimer);
      clearTimeout(retryTimer);
      if (sock && ready) {
        try {
          sock.write(encode(OP.FRAME, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity: null }, nonce: crypto.randomUUID() }));
        } catch {
          // Discord went away first; nothing to clear.
        }
      }
      reset();
    },
  };
}

module.exports = { createPresence };
