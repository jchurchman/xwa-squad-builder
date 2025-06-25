import { Navigate, Route, Routes } from 'react-router';

import { Layout } from './components/Layout';
import { SquadBuilder } from './components/SquadBuilder';

import './App.css';

function App() {

  return (
    <>
      <Routes>
        <Route element={<Navigate replace to="/en/rebels" />} path="/" />
        <Route element={<Layout />} path="/:lang/:faction">
          <Route element={<SquadBuilder />} index />
        </Route>
        <Route element={<Navigate replace to="/en/rebels" />} path="*" />
      </Routes>
    </>
  );
}

export default App;
