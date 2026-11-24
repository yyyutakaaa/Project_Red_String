import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CaseFile, Hotspot, Room as RoomData } from '@shared/caseSchema.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { RoomScene } from '../components/RoomScene.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { ambienceForBackground, sfx } from '../audio/audio.ts';
import { evidenceName, examineHotspot, visitRoom } from '../store/game.ts';
import { useReducedMotion } from '../store/settings.ts';
import type { CaseProgress } from '../engine/types.ts';
import styles from './Room.module.css';

const DESCRIPTION_ID = 'hotspot-description';

/** Hotspot ids examined in one room (progress stores them as "roomId/hotspotId"). */
function examinedIn(examinedHotspots: readonly string[], roomId: string): Set<string> {
  const prefix = `${roomId}/`;
  return new Set(examinedHotspots.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));
}

/** Evidence that belongs to a room: held by one of its hotspots or filed as found there. */
function roomEvidenceIds(c: CaseFile, room: RoomData): string[] {
  const ids = new Set<string>();
  for (const h of room.hotspots) if (h.evidence_id) ids.add(h.evidence_id);
  for (const e of c.evidence) if (e.found_in === room.id) ids.add(e.id);
  return [...ids];
}

export function Room() {
  const { roomId = '' } = useParams();
  const { caseFile, caseKey, progress } = useCaseContext();
  const room = caseFile.rooms.find((r) => r.id === roomId);

  useAmbience(ambienceForBackground(room?.background));

  useEffect(() => {
    if (room) visitRoom(caseKey, room.id);
  }, [caseKey, room]);

  if (!room) {
    return (
      <ScreenFrame title="Nothing behind this door" kicker="Dead end">
        <p className={styles.lede}>There is no room by that name in this case file. Somebody gave you a bad address.</p>
        <ButtonLink to={casePath(caseKey, 'rooms')} variant="lamp">
          Back to the scenes
        </ButtonLink>
      </ScreenFrame>
    );
  }

  return <RoomView room={room} caseFile={caseFile} caseKey={caseKey} progress={progress} />;
}

interface RoomViewProps {
  room: RoomData;
  caseFile: CaseFile;
  caseKey: string;
  progress: CaseProgress;
}

/**
 * The frame and the room strip stay mounted when the detective walks to another room, so keyboard
 * focus stays on the room tab that was clicked. Only the search area below is keyed by room.
 */
function RoomView({ room, caseFile, caseKey, progress }: RoomViewProps) {
  const index = caseFile.rooms.findIndex((r) => r.id === room.id);
  const bodyHere = caseFile.victim.found_in === room.id;

  return (
    <ScreenFrame
      kicker={`Scene ${index + 1} of ${caseFile.rooms.length}`}
      title={room.name}
      actions={
        <>
          <ButtonLink to={casePath(caseKey, 'rooms')} variant="ghost">
            All scenes
          </ButtonLink>
          <ButtonLink to={casePath(caseKey, 'suspects')}>Suspects</ButtonLink>
          <ButtonLink to={casePath(caseKey, 'board')}>Board</ButtonLink>
        </>
      }
    >
      <RoomStrip caseFile={caseFile} caseKey={caseKey} progress={progress} currentId={room.id} />

      <div className={styles.intro}>
        <p className={styles.lede}>{room.description}</p>
        {bodyHere && (
          <p className={styles.bodyNote}>
            <span className={`stamp ${styles.bodyStamp}`}>Body found here</span>
            <span>
              {caseFile.victim.name}, {caseFile.victim.found_at}.
            </span>
          </p>
        )}
      </div>

      <RoomSearch key={room.id} room={room} caseFile={caseFile} caseKey={caseKey} progress={progress} />
    </ScreenFrame>
  );
}

/** Scene and field notes for one room. Keyed by room id, so the open note resets per room. */
function RoomSearch({ room, caseFile, caseKey, progress }: RoomViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const examined = useMemo(() => examinedIn(progress.examinedHotspots, room.id), [progress.examinedHotspots, room.id]);
  const active = room.hotspots.find((h) => h.id === activeId) ?? null;
  const evidenceHere = roomEvidenceIds(caseFile, room).filter((id) => progress.foundEvidence.includes(id));
  const searched = room.hotspots.filter((h) => examined.has(h.id));
  const left = room.hotspots.length - examined.size;

  const onExamine = (h: Hotspot) => {
    setActiveId(h.id);
    const found = examineHotspot(caseFile, caseKey, room.id, h);
    if (!found) sfx('page');
    // On narrow screens the notes sit under the scene; bring them into view without moving focus.
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 899px)').matches) {
      panelRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div className={styles.layout}>
      <section className={`${styles.stage} fade-in`} aria-labelledby="room-scene-heading">
        <h2 id="room-scene-heading" className="visually-hidden">
          Search the {room.name}
        </h2>
        <RoomScene
          background={room.background}
          hotspots={room.hotspots}
          examinedIds={examined}
          activeId={activeId}
          onExamine={onExamine}
          controlsId={DESCRIPTION_ID}
          label={`${room.name}: places to search`}
        />
        <p className={styles.help}>
          <span>Tab</span> through the room. <span>Enter</span> or <span>Space</span> to look closer.
        </p>
      </section>

      <aside className={styles.panel} aria-label="Field notes">
        <div ref={panelRef} className={`paper ${styles.note}`}>
          <span className={styles.clip} aria-hidden="true" />
          <div id={DESCRIPTION_ID} data-testid="hotspot-description" aria-live="polite" className={styles.noteBody}>
            {active ? (
              <div key={active.id} className={`${styles.noteEntry} fade-up`}>
                <p className={styles.noteKicker}>Examined</p>
                <h2 className={styles.noteTitle}>{active.label}</h2>
                <p className={styles.noteText}>{active.description}</p>
                {active.evidence_id && (
                  <p className={styles.evidenceLine}>
                    <span className={styles.evidenceLabel}>Evidence collected:</span>{' '}
                    <strong>{evidenceName(caseFile, active.evidence_id)}</strong>
                  </p>
                )}
              </div>
            ) : (
              <div className={`${styles.noteEntry} fade-up`}>
                <p className={styles.noteKicker}>Field notes</p>
                <h2 className={styles.noteTitle}>Nothing in hand yet.</h2>
                <p className={styles.noteText}>
                  Every room keeps a secret or two. Run the light over anything that looks out of place and see what it gives up.
                </p>
              </div>
            )}
          </div>
        </div>

        <section className={styles.tally} aria-labelledby="room-tally-heading">
          <h2 id="room-tally-heading" className={styles.tallyTitle}>
            Searched {examined.size} of {room.hotspots.length}
          </h2>
          <div className={styles.meter} aria-hidden="true">
            <span style={{ width: `${room.hotspots.length ? (examined.size / room.hotspots.length) * 100 : 0}%` }} />
          </div>
          <p className={styles.tallyText}>
            {left === 0 ? 'Room turned over. Nothing left to touch.' : left === 1 ? 'One place left to search.' : `${left} places left to search.`}
          </p>
          {searched.length > 0 && (
            <ul className={styles.searched}>
              {searched.map((h) => (
                <li key={h.id}>{h.label}</li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.bagged} aria-labelledby="room-evidence-heading">
          <h2 id="room-evidence-heading" className={styles.tallyTitle}>
            Bagged here
          </h2>
          {evidenceHere.length > 0 ? (
            <ul className={styles.evidenceList}>
              {evidenceHere.map((id) => (
                <li key={id}>{evidenceName(caseFile, id)}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.tallyText}>Nothing bagged here yet.</p>
          )}
          {evidenceHere.length > 0 && (
            <Link className={styles.boardLink} to={casePath(caseKey, 'board')}>
              Pin it to the board
            </Link>
          )}
        </section>
      </aside>
    </div>
  );
}

interface RoomStripProps {
  caseFile: CaseFile;
  caseKey: string;
  progress: CaseProgress;
  currentId: string;
}

function RoomStrip({ caseFile, caseKey, progress, currentId }: RoomStripProps) {
  return (
    <nav className={styles.strip} aria-label="Rooms">
      <ul>
        {caseFile.rooms.map((r) => {
          const done = examinedIn(progress.examinedHotspots, r.id).size;
          const total = r.hotspots.length;
          const current = r.id === currentId;
          const visited = progress.visitedRooms.includes(r.id);
          return (
            <li key={r.id}>
              <Link
                to={casePath(caseKey, `room/${r.id}`)}
                className={[styles.tab, done >= total ? styles.tabDone : '', !visited && !current ? styles.tabNew : ''].filter(Boolean).join(' ')}
                aria-current={current ? 'page' : undefined}
                data-testid={`room-tab-${r.id}`}
                onClick={() => sfx('click')}
              >
                <span className={styles.tabName}>{r.name}</span>
                <span className={styles.tabCount}>
                  {done}/{total}
                  <span className="visually-hidden"> searched</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
