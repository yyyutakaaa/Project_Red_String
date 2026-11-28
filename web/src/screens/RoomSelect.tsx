import { Link } from 'react-router-dom';
import type { CaseFile, Room } from '@shared/caseSchema.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { RoomScene } from '../components/RoomScene.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { ambienceForBackground, sfx } from '../audio/audio.ts';
import { evidenceName } from '../store/game.ts';
import styles from './RoomSelect.module.css';
import { scenePlaceOf, useT } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

/** Where the victim was found: a room name, an offstage location name, or the raw id. */
function foundLocationLabel(c: CaseFile): string {
  const id = c.victim.found_in;
  return c.rooms.find((r) => r.id === id)?.name ?? c.offstage_locations.find((o) => o.id === id)?.name ?? id;
}

function roomEvidenceIds(c: CaseFile, room: Room): string[] {
  const ids = new Set<string>();
  for (const h of room.hotspots) if (h.evidence_id) ids.add(h.evidence_id);
  for (const e of c.evidence) if (e.found_in === room.id) ids.add(e.id);
  return [...ids];
}

export function RoomSelect() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const victimRoom = caseFile.rooms.find((r) => r.id === caseFile.victim.found_in);
  useAmbience(ambienceForBackground(victimRoom?.background ?? caseFile.rooms[0]?.background));

  const totalSpots = caseFile.rooms.reduce((n, r) => n + r.hotspots.length, 0);
  const examinedSet = new Set(progress.examinedHotspots);
  const searchedTotal = caseFile.rooms.reduce((n, r) => n + r.hotspots.filter((h) => examinedSet.has(`${r.id}/${h.id}`)).length, 0);
  const { victim } = caseFile;
  const { t } = useT();

  return (
    <ScreenFrame
      wide
      title={t('scenes.title')}
    >
      <section className={styles.victim} aria-labelledby="victim-heading">
        <div className={styles.victimTag} aria-hidden="true">
          <span className={styles.tagHole} />
          <span>{t('scenes.deceased')}</span>
        </div>
        <div className={styles.victimText}>
          <h2 id="victim-heading" className={styles.victimName}>
            {t('scenes.victim', { name: victim.name, age: victim.age })}
          </h2>
          <p className={styles.victimWhere}>
            {rich(t('scenes.foundIn'), { place: <strong data-testid="victim-location">{foundLocationLabel(caseFile)}</strong>, when: victim.found_at })}
          </p>
          <p className={styles.victimCause}>{victim.cause_of_death}</p>
        </div>
        <p className={styles.overall}>
          <span className={styles.overallNum}>
            {searchedTotal}/{totalSpots}
          </span>
          <span>{t('scenes.placesSearched')}</span>
        </p>
      </section>

      <ul className={styles.grid}>
        {caseFile.rooms.map((room, i) => {
          const total = room.hotspots.length;
          const searched = room.hotspots.filter((h) => examinedSet.has(`${room.id}/${h.id}`)).length;
          const visited = progress.visitedRooms.includes(room.id);
          const found = roomEvidenceIds(caseFile, room).filter((id) => progress.foundEvidence.includes(id));
          const bodyHere = victim.found_in === room.id;
          const state = searched >= total ? 'done' : visited ? 'visited' : 'new';
          return (
            <li key={room.id} className={styles.card} data-state={state}>
              <div className={styles.thumb}>
                <RoomScene
                  background={room.background}
                  hotspots={room.hotspots}
                  thumbnail
                  className={styles.scene}
                  place={scenePlaceOf(room, caseFile)}
                />
                <span className={styles.number} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {bodyHere && <span className={`stamp ${styles.stamp}`}>{t('scenes.bodyFound')}</span>}
              </div>
              <div className={styles.body}>
                <h2 className={styles.name}>
                  <Link to={casePath(caseKey, `room/${room.id}`)} className={styles.link} data-testid={`room-link-${room.id}`} onClick={() => sfx('click')}>
                    {room.name}
                  </Link>
                </h2>
                <p className={styles.desc}>{room.description}</p>
                <div className={styles.meta}>
                  <span className={styles.count}>
                    {t('scenes.searched', { n: searched, total })}
                  </span>
                </div>
                <div className={styles.meter} aria-hidden="true">
                  <span style={{ width: `${total ? (searched / total) * 100 : 0}%` }} />
                </div>
                {found.length > 0 && (
                  <p className={styles.found}>
                    <span className={styles.foundLabel}>{t('scenes.foundHere')}</span> {found.map((id) => evidenceName(caseFile, id)).join(', ')}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </ScreenFrame>
  );
}
