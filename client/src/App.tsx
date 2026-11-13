import { Navigate, Route, Routes } from 'react-router';

import { Layout } from '@/components/Layout/Layout';
import { SquadBuilder } from '@/components/SquadBuilder';
import { FACTION } from '@/constants';

import './App.css';

function App() {
  return (
    <>
      <Routes>
        <Route element={<Navigate replace to={`/en/${FACTION.REBELS}`} />} path="/" />
        <Route element={<Layout />} path="/:lang/:faction">
          <Route element={<SquadBuilder />} index />
        </Route>
        <Route element={<Navigate replace to={`/en/${FACTION.REBELS}`} />} path="*" />
      </Routes>
    </>
  );
}

export default App;
