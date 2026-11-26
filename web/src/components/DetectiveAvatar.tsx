import { LogoEye } from './LogoEye.tsx';
import { avatarUrl } from '../lib/avatars.ts';
import styles from './DetectiveAvatar.module.css';

/** The player's picked portrait in an ink frame, or the logo while none is picked. */
export function DetectiveAvatar({ avatar, size = 'large', className = '' }: { avatar?: string; size?: 'small' | 'large'; className?: string }) {
  const url = avatarUrl(avatar);
  return (
    <span className={`${styles.frame} ${styles[size]} ${url ? '' : styles.empty} ${className}`} aria-hidden="true">
      {url ? <img src={url} alt="" draggable={false} /> : <LogoEye />}
    </span>
  );
}
