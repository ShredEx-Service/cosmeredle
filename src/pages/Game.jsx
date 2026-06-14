import { useState, useEffect } from 'react';
import GuessInput from '../components/GuessInput.jsx';
import GuessRow, { GuessHeader } from '../components/GuessRow.jsx';
import { getDailyCharacter, getDayNumber, compareCharacters } from '../utils/gameLogic.js';
import './Game.css';

const STORAGE_KEY = 'cosmeredle_daily';

export default function Game() {
  const dayNumber = getDayNumber();
  const target = getDailyCharacter(dayNumber);
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.day === dayNumber) {
      setGuesses(saved.guesses || []);
      setWon(saved.won || false);
    }
  }, [dayNumber]);

  function saveState(newGuesses, newWon) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      day: dayNumber,
      guesses: newGuesses,
      won: newWon,
    }));
  }

  function handleGuess(char) {
    if (won) return;
    const result = compareCharacters(char, target);
    const newGuesses = [...guesses, result];
    const newWon = char.name === target.name;
    setGuesses(newGuesses);
    setWon(newWon);
    saveState(newGuesses, newWon);
  }

  const guessedNames = guesses.map(g => g.name);
  const timeUntilNext = getTimeUntilNextDay();

  return (
    <div className="game-page">
      <div className="game-status">
        {won ? (
          <div className="status-win">
            You got it in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}! 🎉
            <div className="next-puzzle">Next puzzle in {timeUntilNext}</div>
          </div>
        ) : (
          <div className="next-puzzle">New puzzle in {timeUntilNext}</div>
        )}
      </div>

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

      {(won || guesses.length >= 20) && !revealed && (
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

function getTimeUntilNextDay() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  const diff = next - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}
