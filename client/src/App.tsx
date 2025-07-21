import { Navigate, Route, Routes } from 'react-router';

import { Layout } from './components/Layout';
import { SquadBuilder } from './components/SquadBuilder';
import {
  useFetchAllPilotsQuery,
  useFetchAllPlatformsQuery,
  useFetchAllUpgradesQuery,
} from './state/slices/apiSlice';
import { Faction } from '@shared/types';

import './App.css';

function App() {
  useFetchAllPlatformsQuery();
  useFetchAllPilotsQuery();
  useFetchAllUpgradesQuery();
  return (
    <>
      <Routes>
        <Route element={<Navigate replace to={`/en/${Faction.rebels}`} />} path="/" />
        <Route element={<Layout />} path="/:lang/:faction">
          <Route element={<SquadBuilder />} index />
        </Route>
        <Route element={<Navigate replace to={`/en/${Faction.rebels}`} />} path="*" />
      </Routes>
    </>
  );
}

export default App;
