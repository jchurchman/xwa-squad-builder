import { Navigate, Outlet, useParams } from 'react-router';

import { Header } from '@/components/Header/Header';
import { useTypedParams } from '@/hooks/useTypedParams';
import { isFaction } from '@/utils/isFaction';

import classes from './Layout.module.scss';

import { Faction } from '@shared/types';

export function Layout() {
  const { faction } = useParams();
  const { lang } = useTypedParams();

  if (!isFaction(faction)) {
    return <Navigate replace to={`/${lang}/${Faction.rebels}`} />;
  }

  return (
    <>
      <Header />
      <div className={classes.contentSpacer} />
      <Outlet />
    </>
  );
}
