import { Navigate, Outlet, useParams } from 'react-router';

import { useTypedParams } from '@hooks';
import { isFaction } from 'src/utils/isFaction';

import { Header } from '../Header';

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
