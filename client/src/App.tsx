import { Navigate, Route, Routes } from 'react-router';

import { Layout, SquadBuilder } from '@components';

import './App.css';

import { Faction } from '@shared/types';

function App() {
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
