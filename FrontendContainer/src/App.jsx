import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './routes/Home';
import Play from './routes/Play';
import Leaderboard from './routes/Leaderboard';
import Help from './routes/Help';
import './styles/app.css';

const Nav = () => (
  <nav className="top-nav">
    <div className="brand">{process.env.REACT_APP_APP_NAME || 'FlowQuest'}</div>
    <div className="links">
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/play">Play</NavLink>
      <NavLink to="/leaderboard">Leaderboard</NavLink>
      <NavLink to="/help">Help</NavLink>
    </div>
  </nav>
);

// PUBLIC_INTERFACE
export default function App() {
  /** Main application component that sets up routes and layout. */
  return (
    <div className="app">
      <Nav />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} FlowQuest</span>
      </footer>
    </div>
  );
}
