import { slugify } from '@shared/utils';
import cn from 'classnames';

import { useTypedParams } from '@hooks';

import { AuthButtons } from './AuthButtons';
import { FactionSelector } from './FactionSelector';

import classes from './Header.module.scss';

export function Header() {
  const { faction } = useTypedParams();

  return (
    <header className={cn(classes['headerContainer'], classes[slugify(faction)])}>
      <FactionSelector />
      <div>XWA Squadbuilder</div>
      <AuthButtons />
    </header>
  );
}
