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
import { useReducedMotion, useSettings } from '../store/settings.ts';
import type { CaseProgress } from '../engine/types.ts';
import styles from './Room.module.css';
import { scenePlaceOf, useT, type MessageKey } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

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
  const { t } = useT();

  useEffect(() => {
    if (room) visitRoom(caseKey, room.id);
  }, [caseKey, room]);

  if (!room) {
    return (
      <ScreenFrame title={t('room.missingTitle')} kicker={t('room.missingKicker')}>
        <p className={styles.lede}>{t('room.missingText')}</p>
        <ButtonLink to={casePath(caseKey, 'rooms')} variant="lamp">
          {t('room.backToScenes')}
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
  const bodyHere = caseFile.victim.found_in === room.id;
  const { t } = useT();

  return (
    <ScreenFrame
      wide
      title={room.name}
      actions={
        <>
          <ButtonLink to={casePath(caseKey, 'rooms')} variant="ghost">
            {t('room.allScenes')}
          </ButtonLink>
          <ButtonLink to={casePath(caseKey, 'suspects')}>{t('nav.suspects')}</ButtonLink>
          <ButtonLink to={casePath(caseKey, 'board')}>{t('nav.board')}</ButtonLink>
        </>
      }
    >
      <RoomStrip caseFile={caseFile} caseKey={caseKey} progress={progress} currentId={room.id} />

      <RoomSearch key={room.id} room={room} caseFile={caseFile} caseKey={caseKey} progress={progress} bodyHere={bodyHere} />
    </ScreenFrame>
  );
}

/** Scene and field notes for one room. Keyed by room id, so the open note resets per room. */
function RoomSearch({ room, caseFile, caseKey, progress, bodyHere }: RoomViewProps & { bodyHere: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // How many times the detective has looked at something that holds nothing (each miss gets its own line).
  const [misses, setMisses] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const searchAid = useSettings((s) => s.searchAid);
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const examined = useMemo(() => examinedIn(progress.examinedHotspots, room.id), [progress.examinedHotspots, room.id]);
  const active = room.hotspots.find((h) => h.id === activeId) ?? null;
  const evidenceHere = roomEvidenceIds(caseFile, room).filter((id) => progress.foundEvidence.includes(id));
  const searched = room.hotspots.filter((h) => examined.has(h.id));
  const left = room.hotspots.length - examined.size;
  const { t } = useT();

  // On narrow screens the notes sit under the scene; bring them into view without moving focus.
  const showNotes = () => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 899px)').matches) {
      panelRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  const onExamine = (h: Hotspot) => {
    setActiveId(h.id);
    const found = examineHotspot(caseFile, caseKey, room.id, h);
    if (found) setFlashKey((k) => k + 1);
    else sfx('page');
    showNotes();
  };

  const onMiss = () => {
    setActiveId(null);
    setMisses((n) => n + 1);
    sfx('hover');
    showNotes();
  };

  return (
    <div className={styles.layout}>
      <section className={`${styles.stage} fade-in`} aria-labelledby="room-scene-heading">
        <h2 id="room-scene-heading" className="visually-hidden">
          {t('room.searchHeading', { room: room.name })}
        </h2>
        <RoomScene
          background={room.background}
          hotspots={room.hotspots}
          examinedIds={examined}
          activeId={activeId}
          onExamine={onExamine}
          controlsId={DESCRIPTION_ID}
          label={t('room.placesLabel', { room: room.name })}
          flashKey={flashKey}
          place={scenePlaceOf(room, caseFile)}
          searchAid={searchAid}
          onMiss={onMiss}
        />
        <div className={styles.intro}>
          <p className={styles.lede}>{room.description}</p>
          {bodyHere && (
            <p className={styles.bodyNote}>
              <span className={`stamp ${styles.bodyStamp}`}>{t('room.bodyHere')}</span>
              <span>{t('room.bodyWhen', { name: caseFile.victim.name, when: caseFile.victim.found_at })}</span>
            </p>
          )}
        </div>
        <p className={styles.help}>
          {searchAid
            ? rich(t('room.help'), { tab: <span>{t('room.helpTab')}</span>, enter: <span>{t('room.helpEnter')}</span>, space: <span>{t('room.helpSpace')}</span> })
            : t('room.helpHidden')}
        </p>
      </section>

      <aside className={styles.panel} aria-label={t('room.fieldNotes')}>
        <div ref={panelRef} className={`paper ${styles.note}`}>
          <span className={styles.clip} aria-hidden="true" />
          <div id={DESCRIPTION_ID} data-testid="hotspot-description" aria-live="polite" className={styles.noteBody}>
            {active ? (
              <div key={active.id} className={`${styles.noteEntry} fade-up`}>
                <p className={styles.noteKicker}>{t('room.examined')}</p>
                <h2 className={styles.noteTitle}>{active.label}</h2>
                <p className={styles.noteText}>{active.description}</p>
                {active.evidence_id && (
                  <p className={styles.evidenceLine}>
                    <span className={styles.evidenceLabel}>{t('room.collected')}</span>{' '}
                    <strong>{evidenceName(caseFile, active.evidence_id)}</strong>
                  </p>
                )}
              </div>
            ) : misses > 0 ? (
              <div key={`miss-${misses}`} className={`${styles.noteEntry} fade-up`} data-testid="search-miss">
                <p className={styles.noteKicker}>{t('room.missKicker')}</p>
                <h2 className={styles.noteTitle}>{t(`room.miss.${misses % 6}` as MessageKey)}</h2>
              </div>
            ) : (
              <div className={`${styles.noteEntry} fade-up`}>
                <p className={styles.noteKicker}>{t('room.fieldNotes')}</p>
                <h2 className={styles.noteTitle}>{t('room.nothingInHand')}</h2>
              </div>
            )}
          </div>
        </div>

        <section className={styles.tally} aria-labelledby="room-tally-heading">
          <h2 id="room-tally-heading" className={styles.tallyTitle}>
            {t('room.searched', { n: examined.size, total: room.hotspots.length })}
          </h2>
          <div className={styles.meter} aria-hidden="true">
            <span style={{ width: `${room.hotspots.length ? (examined.size / room.hotspots.length) * 100 : 0}%` }} />
          </div>
          {left === 0 && <p className={styles.tallyText}>{t('room.turnedOver')}</p>}
          {searched.length > 0 && (
            <ul className={styles.searched}>
              {searched.map((h) => (
                <li key={h.id}>{h.label}</li>
              ))}
            </ul>
          )}
        </section>

        {evidenceHere.length > 0 && (
          <section className={styles.bagged} aria-labelledby="room-evidence-heading">
            <h2 id="room-evidence-heading" className={styles.tallyTitle}>
              {t('room.bagged')}
            </h2>
            <ul className={styles.evidenceList}>
              {evidenceHere.map((id) => (
                <li key={id}>{evidenceName(caseFile, id)}</li>
              ))}
            </ul>
            <Link className={styles.boardLink} to={casePath(caseKey, 'board')}>
              {t('room.pinIt')}
            </Link>
          </section>
        )}
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
  const { t } = useT();
  return (
    <nav className={styles.strip} aria-label={t('room.rooms')}>
      <ul>
        {caseFile.rooms.map((r) => {
          const done = examinedIn(progress.examinedHotspots, r.id).size;
          const total = r.hotspots.length;
          const current = r.id === currentId;
          return (
            <li key={r.id}>
              <Link
                to={casePath(caseKey, `room/${r.id}`)}
                className={[styles.tab, done >= total ? styles.tabDone : ''].filter(Boolean).join(' ')}
                aria-current={current ? 'page' : undefined}
                data-testid={`room-tab-${r.id}`}
                onClick={() => sfx('click')}
              >
                <span className={styles.tabName}>{r.name}</span>
                <span className={styles.tabCount}>
                  {done}/{total}
                  <span className="visually-hidden">{t('room.searchedHidden')}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
