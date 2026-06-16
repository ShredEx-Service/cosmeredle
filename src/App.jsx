import { useState, useRef, useEffect } from 'react';
import Game from './pages/Game.jsx';
import Practice from './pages/Practice.jsx';
import Archive from './pages/Archive.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Admin from './pages/Admin.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import './App.css';

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'archive', label: 'Archive' },
  { id: 'practice', label: 'Practice' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

function useCountdown() {
  const [time, setTime] = useState(getTimeUntilNextDay());
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilNextDay()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function getTimeUntilNextDay() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = next - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('cosmeredle_tab') || 'daily');
  const { user, profile, isAdmin, signInWithGoogle, signInWithDiscord, signOut } = useAuth();

  function switchTab(id) {
    setTab(id);
    localStorage.setItem('cosmeredle_tab', id);
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const countdown = useCountdown();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const tabs = isAdmin ? [...TABS, { id: 'admin', label: 'Admin' }] : TABS;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-countdown"><span>RESET IN</span><span className="countdown-time">{countdown}</span></div>
          <div className="app-header-text">
            <h1 className="app-title">Cosmeredle</h1>
            <p className="app-subtitle">Guess the Cosmere character</p>
          </div>
          <div className="nav-menu" ref={menuRef}>
            <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
            {menuOpen && (
              <div className="nav-dropdown">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    className={`nav-dropdown-item ${tab === t.id ? 'active' : ''}`}
                    onClick={() => { switchTab(t.id); setMenuOpen(false); }}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="nav-dropdown-divider" />
                {user ? (
                  <>
                    <div className="nav-dropdown-account">{profile?.username || user.email}</div>
                    <button className="nav-dropdown-item" onClick={() => { signOut(); setMenuOpen(false); }}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button className="nav-dropdown-item" onClick={signInWithGoogle}>
                      Sign in with Google
                    </button>
                    <button className="nav-dropdown-item" onClick={signInWithDiscord}>
                      Sign in with Discord
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === 'daily' && <Game />}
        {tab === 'archive' && <Archive />}
        {tab === 'practice' && <Practice />}
        {tab === 'leaderboard' && <Leaderboard />}
        {tab === 'admin' && isAdmin && <Admin />}
      </main>

      <footer className="app-footer">
        <p>All Cosmere characters belong to Brandon Sanderson / Dragonsteel</p>
      </footer>
    </div>
  );
}
