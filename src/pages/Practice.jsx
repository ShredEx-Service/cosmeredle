import { useState, useCallback } from 'react';
import GuessInput from '../components/GuessInput.jsx';
import GuessRow, { GuessHeader } from '../components/GuessRow.jsx';
import { VALID_ANSWERS } from '../data/characters.js';
import { compareCharacters } from '../utils/gameLogic.js';
import './Game.css';

function randomChar() {
  return VALID_ANSWERS[Math.floor(Math.random() * VALID_ANSWERS.length)];
}

export default function Practice() {
  const [target, setTarget] = useState(randomChar);
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ played: 0, guessTotal: 0 });

  function handleGuess(char) {
    if (won) return;
    const result = compareCharacters(char, target);
    const newGuesses = [...guesses, result];
    const newWon = char.name === target.name;
    setGuesses(newGuesses);
    setWon(newWon);
    if (newWon) {
      setStats(s => ({ played: s.played + 1, guessTotal: s.guessTotal + newGuesses.length }));
    }
  }

  function newGame() {
    setTarget(randomChar());
    setGuesses([]);
    setWon(false);
    setRevealed(false);
  }

  const guessedNames = guesses.map(g => g.name);
  const avgGuesses = stats.played ? (stats.guessTotal / stats.played).toFixed(1) : '—';

  return (
    <div className="game-page">
      <div className="practice-header">
        <div className="practice-stats">
          Played: {stats.played} &nbsp;|&nbsp; Avg guesses: {avgGuesses}
        </div>
        <button className="new-game-btn" onClick={newGame}>New Character</button>
      </div>

      {won && (
        <div className="status-win">
          Got it in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}! 🎉
          <button className="new-game-btn inline" onClick={newGame}>Play Again</button>
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

      {!won && !revealed && (
        <button className="reveal-btn" onClick={() => setRevealed(true)}>
          Give Up &amp; Reveal
        </button>
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
