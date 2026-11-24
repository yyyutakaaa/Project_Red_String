// CORS and response helpers shared by the edge functions.
import { config } from './env.ts';

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (LOCAL_ORIGIN.test(origin)) return true;
  if (config.allowedOrigins().includes(origin)) return true;
  const project = config.vercelProject().replace(/[^a-z0-9-]/gi, '');
  // Production (<project>.vercel.app) and preview deployments (<project>-<hash>-<team>.vercel.app).
  const vercel = new RegExp(`^https://${project}(-[a-z0-9-]+)?\\.vercel\\.app$`, 'i');
  return vercel.test(origin);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, x-eval-token, x-eval-model',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/** Browsers send Origin; reject cross-site browser calls from origins we do not serve. */
export function originRejected(req: Request): boolean {
  const origin = req.headers.get('Origin');
  return origin !== null && !isAllowedOrigin(origin);
}

export function json(req: Request, body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

export function errorResponse(
  req: Request,
  status: number,
  code: string,
  message: string,
  extra: Record<string, string> = {},
  details: Record<string, unknown> = {},
): Response {
  return json(req, { error: { code, message, ...details } }, status, extra);
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  return fwd.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Minimal SSE writer over a ReadableStream. */
export class SseStream {
  readonly stream: ReadableStream<Uint8Array>;
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  private encoder = new TextEncoder();
  private closed = false;

  constructor() {
    this.stream = new ReadableStream<Uint8Array>({
      start: (c) => {
        this.controller = c;
      },
      cancel: () => {
        this.closed = true;
      },
    });
  }

  send(event: string, data: unknown): void {
    if (this.closed) return;
    try {
      this.controller.enqueue(this.encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      this.closed = true;
    }
  }

  comment(text: string): void {
    if (this.closed) return;
    try {
      this.controller.enqueue(this.encoder.encode(`: ${text}\n\n`));
    } catch {
      this.closed = true;
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    try {
      this.controller.close();
    } catch {
      /* already closed */
    }
  }

  response(req: Request): Response {
    return new Response(this.stream, {
      status: 200,
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }
}
