import { AuthButtons } from './AuthButtons';
import { FactionSelector } from './FactionSelector';

import styles from './Header.module.scss';

export function Header() {
  return (
    <header className={styles['headerContainer']}>
      <FactionSelector />
      <div>XWA Squadbuilder</div>
      <AuthButtons />
    </header>
  );
}
