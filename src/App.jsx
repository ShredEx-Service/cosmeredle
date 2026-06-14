import { useState } from 'react';
import Game from './pages/Game.jsx';
import Practice from './pages/Practice.jsx';
import Archive from './pages/Archive.jsx';
import './App.css';

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'archive', label: 'Archive' },
  { id: 'practice', label: 'Practice' },
];

export default function App() {
  const [tab, setTab] = useState('daily');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Cosmeredle</h1>
        <p className="app-subtitle">Guess the Cosmere character</p>
        <nav className="app-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'daily' && <Game />}
        {tab === 'archive' && <Archive />}
        {tab === 'practice' && <Practice />}
      </main>

      <footer className="app-footer">
        <p>All Cosmere characters belong to Brandon Sanderson / Dragonsteel</p>
      </footer>
    </div>
  );
}
