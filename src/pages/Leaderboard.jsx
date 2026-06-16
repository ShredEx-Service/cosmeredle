import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase.js';
import './Game.css';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('stats')
      .select('daily_streak, daily_best_streak, daily_won, daily_played, profiles(username)')
      .order('daily_best_streak', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="game-page">
      <h2 style={{ textAlign: 'center', color: '#c8a84b', marginBottom: 16 }}>Leaderboard</h2>
      {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>}
      {!loading && rows.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888' }}>No players yet. Sign in and play to be the first!</p>
      )}
      {!loading && rows.length > 0 && (
        <div className="guess-board-scroll">
          <div className="guess-board">
            <div className="guess-row header-row">
              <div className="cell name-cell">Player</div>
              <div className="cell">Streak</div>
              <div className="cell">Best Streak</div>
              <div className="cell">Won</div>
              <div className="cell">Played</div>
            </div>
            {rows.map((r, i) => (
              <div className="guess-row" key={i}>
                <div className="cell">{r.profiles?.username || 'Anonymous'}</div>
                <div className="cell">{r.daily_streak}</div>
                <div className="cell">{r.daily_best_streak}</div>
                <div className="cell">{r.daily_won}</div>
                <div className="cell">{r.daily_played}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
