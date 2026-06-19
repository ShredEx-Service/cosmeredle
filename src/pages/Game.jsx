import { useState, useEffect } from 'react';
import GuessInput from '../components/GuessInput.jsx';
import GuessRow, { GuessHeader } from '../components/GuessRow.jsx';
import { getDailyCharacter, getDayNumber, compareCharacters } from '../utils/gameLogic.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCharacters } from '../contexts/CharactersContext.jsx';
import { supabase } from '../utils/supabase.js';
import './Game.css';

const STORAGE_KEY = 'cosmeredle_daily';

export default function Game() {
  const { shuffled } = useCharacters();
  const dayNumber = getDayNumber();
  const target = getDailyCharacter(shuffled, dayNumber);
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function loadState() {
      // Always load localStorage first for instant render
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const local = saved.day === dayNumber ? { guesses: saved.guesses || [], won: saved.won || false } : null;

      if (user) {
        const { data } = await supabase
          .from('game_states')
          .select('guesses, won')
          .eq('user_id', user.id)
          .eq('day_number', dayNumber)
          .single();
        if (data) {
          // Server state wins — it's the canonical cross-device state
          setGuesses(data.guesses || []);
          setWon(data.won || false);
          saveLocalState(data.guesses || [], data.won || false);
          return;
        }
        // No server state yet — if we have local guesses, push them up
        if (local && local.guesses.length > 0) {
          await supabase.from('game_states').upsert({
            user_id: user.id,
            day_number: dayNumber,
            guesses: local.guesses,
            won: local.won,
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (local) {
        setGuesses(local.guesses);
        setWon(local.won);
      }
    }
    loadState();
  }, [dayNumber, user]);

  function saveLocalState(newGuesses, newWon) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      day: dayNumber,
      guesses: newGuesses,
      won: newWon,
    }));
  }

  async function saveState(newGuesses, newWon) {
    saveLocalState(newGuesses, newWon);
    if (!user) return;
    await supabase.from('game_states').upsert({
      user_id: user.id,
      day_number: dayNumber,
      guesses: newGuesses,
      won: newWon,
      updated_at: new Date().toISOString(),
    });
  }

  async function syncDailyResult(newWon) {
    if (!user) return;
    const { data: existing } = await supabase.from('stats').select('*').eq('user_id', user.id).single();
    if (!existing) return;
    const alreadyPlayedToday = existing.daily_last_win_day === dayNumber || existing.daily_last_play_day === dayNumber;
    if (alreadyPlayedToday) return;
    const continuedStreak = existing.daily_last_win_day === dayNumber - 1;
    const newStreak = newWon ? (continuedStreak ? existing.daily_streak + 1 : 1) : 0;
    await supabase.from('stats').update({
      daily_played: existing.daily_played + 1,
      daily_won: existing.daily_won + (newWon ? 1 : 0),
      daily_streak: newStreak,
      daily_best_streak: Math.max(existing.daily_best_streak, newStreak),
      daily_last_win_day: newWon ? dayNumber : existing.daily_last_win_day,
      daily_last_play_day: dayNumber,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
  }

  async function handleGuess(char) {
    if (won) return;
    const result = compareCharacters(char, target);
    const newGuesses = [...guesses, result];
    const newWon = char.name === target.name;
    setGuesses(newGuesses);
    setWon(newWon);
    await saveState(newGuesses, newWon);
    if (newWon) syncDailyResult(true);
    else if (newGuesses.length >= 20) syncDailyResult(false);
  }

  const guessedNames = guesses.map(g => g.name);

  return (
    <div className="game-page">
      {won && (
        <div className="game-status">
          <div className="status-win">
            You got it in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}! 🎉
          </div>
        </div>
      )}

      {!won && (
        <GuessInput onGuess={handleGuess} guessedNames={guessedNames} disabled={won} />
      )}

      {guesses.length > 0 && (
        <div className="guess-board-scroll">
          <div className="guess-board">
            <GuessHeader />
            {[...guesses].reverse().map((r, i) => <GuessRow key={i} result={r} />)}
          </div>
        </div>
      )}

      {!won && guesses.length >= 20 && !revealed && (
        <button className="reveal-btn" onClick={() => setRevealed(true)}>
          Reveal Answer
        </button>
      )}

      {revealed && (
        <div className="answer-reveal">
          The character was: <strong>{target.name}</strong>
          <div className="answer-details">
            {target.homeWorld} · {target.firstAppearance} · {target.species}
          </div>
        </div>
      )}
    </div>
  );
}

