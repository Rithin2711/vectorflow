import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import HelpPage from './pages/HelpPage';
import SettingsPage from './pages/SettingsPage';
import { useTheme } from './state/theme';

// PUBLIC_INTERFACE
function App() {
  /** Main app with routes and global nav. */
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="App" data-theme={theme}>
      <BrowserRouter>
        <header className="navbar">
          <div className="brand">
            <span className="brand-logo">🌀</span>
            <span className="brand-title">FlowQuest</span>
            <span className="brand-version" title="App version">frontend</span>
          </div>
          <nav className="nav-links">
            <Link to="/">Game</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/help">Help</Link>
            <Link to="/settings">Settings</Link>
          </nav>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <span>© {new Date().getFullYear()} FlowQuest</span>
          <span className="footer-right">Learn vector fields through play.</span>
        </footer>
      </BrowserRouter>
    </div>
  );
}

export default App;
