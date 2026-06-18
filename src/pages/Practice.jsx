import { useState } from 'react';
import GuessInput from '../components/GuessInput.jsx';
import GuessRow, { GuessHeader } from '../components/GuessRow.jsx';
import { compareCharacters } from '../utils/gameLogic.js';
import { useCharacters } from '../contexts/CharactersContext.jsx';
import './Game.css';

const STORAGE_KEY = 'cosmeredle_practice';

export default function Practice() {
  const { validAnswers } = useCharacters();

  function randomChar() {
    return validAnswers[Math.floor(Math.random() * validAnswers.length)];
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        target: validAnswers.find(c => c.name === saved.targetName) || randomChar(),
        guesses: saved.guesses || [],
        won: saved.won || false,
        revealed: saved.revealed || false,
        stats: saved.stats || { played: 0, guessTotal: 0 },
      };
    } catch {
      return { target: randomChar(), guesses: [], won: false, revealed: false, stats: { played: 0, guessTotal: 0 } };
    }
  }

  const [target, setTarget] = useState(() => loadState().target);
  const [guesses, setGuesses] = useState(() => loadState().guesses);
  const [won, setWon] = useState(() => loadState().won);
  const [revealed, setRevealed] = useState(() => loadState().revealed);
  const [stats, setStats] = useState(() => loadState().stats);

  function save(patch) {
    const current = { targetName: target.name, guesses, won, revealed, stats, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }

  function handleGuess(char) {
    if (won) return;
    const result = compareCharacters(char, target);
    const newGuesses = [...guesses, result];
    const newWon = char.name === target.name;
    const newStats = newWon ? { played: stats.played + 1, guessTotal: stats.guessTotal + newGuesses.length } : stats;
    setGuesses(newGuesses);
    setWon(newWon);
    if (newWon) setStats(newStats);
    save({ guesses: newGuesses, won: newWon, stats: newStats });
  }

  function newGame() {
    const newTarget = randomChar();
    setTarget(newTarget);
    setGuesses([]);
    setWon(false);
    setRevealed(false);
    save({ targetName: newTarget.name, guesses: [], won: false, revealed: false });
  }

  const guessedNames = guesses.map(g => g.name);
  const avgGuesses = stats.played ? (stats.guessTotal / stats.played).toFixed(1) : '—';

  return (
    <div className="game-page">
      <div className="practice-header">
        <div className="practice-stats">
          Played: {stats.played} &nbsp;|&nbsp; Avg guesses: {avgGuesses}
        </div>
      </div>

      {won && (
        <div className="status-win">
          Got it in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}! 🎉
          <button className="new-game-btn inline" onClick={newGame}>Play Again</button>
        </div>
      )}

      {!won && !revealed && (
        <GuessInput onGuess={handleGuess} guessedNames={guessedNames} disabled={false} />
      )}

      {!won && !revealed && (
        <button className="reveal-btn centered" onClick={() => { setRevealed(true); save({ revealed: true }); }}>
          Give Up &amp; Reveal
        </button>
      )}

      {guesses.length > 0 && (
        <div className="guess-board-scroll">
          <div className="guess-board">
            <GuessHeader />
            {[...guesses].reverse().map((r, i) => <GuessRow key={i} result={r} />)}
          </div>
        </div>
      )}

      {revealed && !won && (
        <div className="answer-reveal">
          The character was: <strong>{target.name}</strong>
          <div className="answer-details">
            {target.homeWorld} · {target.firstAppearance} · {target.species}
          </div>
          <button className="new-game-btn" onClick={newGame}>Try Another</button>
        </div>
      )}
    </div>
  );
}
