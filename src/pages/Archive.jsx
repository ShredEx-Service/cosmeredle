import { useState } from 'react';
import GuessInput from '../components/GuessInput.jsx';
import GuessRow, { GuessHeader } from '../components/GuessRow.jsx';
import { getDailyCharacter, getDayNumber, compareCharacters } from '../utils/gameLogic.js';
import './Game.css';
import './Archive.css';

export default function Archive() {
  const currentDay = getDayNumber();
  const [selectedDay, setSelectedDay] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const days = Array.from({ length: currentDay }, (_, i) => currentDay - 1 - i);

  function selectDay(day) {
    setSelectedDay(day);
    setGuesses([]);
    setWon(false);
    setRevealed(false);
  }

  const target = selectedDay !== null ? getDailyCharacter(selectedDay) : null;

  function handleGuess(char) {
    if (!target || won) return;
    const result = compareCharacters(char, target);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    if (char.name === target.name) setWon(true);
  }

  const guessedNames = guesses.map(g => g.name);

  return (
    <div className="game-page">
      {!selectedDay && selectedDay !== 0 ? (
        <div className="archive-list">
          <h2 className="archive-title">Past Puzzles</h2>
          <div className="archive-grid">
            {days.map(day => (
              <button key={day} className="archive-btn" onClick={() => selectDay(day)}>
                Puzzle #{day + 1}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="archive-nav">
            <button className="back-btn" onClick={() => setSelectedDay(null)}>← Back to Archive</button>
            <span className="archive-label">Puzzle #{selectedDay + 1}</span>
          </div>

          {won && (
            <div className="status-win">
              Got it in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}! 🎉
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

          {(won || guesses.length >= 20) && !revealed && (
            <button className="reveal-btn" onClick={() => setRevealed(true)}>Reveal Answer</button>
          )}

          {revealed && (
            <div className="answer-reveal">
              The character was: <strong>{target.name}</strong>
              <div className="answer-details">
                {target.homeWorld} · {target.firstAppearance} · {target.species}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
