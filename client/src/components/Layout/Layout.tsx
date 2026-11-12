import { Navigate, Outlet, useParams } from 'react-router';

import { Header } from '@/components/Header/Header';
import { FACTION } from '@/constants';
import { useTypedParams } from '@/hooks/useTypedParams';
import { isFaction } from '@/utils/isFaction';

import classes from './Layout.module.scss';

export function Layout() {
  const { faction } = useParams();
  const { lang } = useTypedParams();

  if (!isFaction(faction)) {
    return <Navigate replace to={`/${lang}/${FACTION.REBELS}`} />;
  }

  return (
    <>
      <Header />
      <div className={classes.contentSpacer} />
      <Outlet />
    </>
  );
}
