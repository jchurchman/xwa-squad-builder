import cn from 'classnames';

import { useTypedParams } from '@/hooks/useTypedParams';
import { slugify } from '@/utils/slugify';

import { AuthButtons } from './AuthButtons/AuthButtons';
import { FactionSelector } from './FactionSelector/FactionSelector';

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
