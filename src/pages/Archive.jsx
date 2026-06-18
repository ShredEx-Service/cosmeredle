import { useState } from 'react';
import GuessInput from '../components/GuessInput.jsx';
import GuessRow, { GuessHeader } from '../components/GuessRow.jsx';
import { getDailyCharacter, getDayNumber, compareCharacters } from '../utils/gameLogic.js';
import { useCharacters } from '../contexts/CharactersContext.jsx';
import './Game.css';
import './Archive.css';

const EPOCH = new Date(2024, 0, 1); // Jan 1 2024

function dateToDayNumber(year, month, date) {
  const d = new Date(year, month, date);
  return Math.floor((d - EPOCH) / 86400000);
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Archive() {
  const { shuffled } = useCharacters();
  const currentDay = getDayNumber();
  const today = new Date();

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function selectDay(dayNum) {
    setSelectedDay(dayNum);
    setGuesses([]);
    setWon(false);
    setRevealed(false);
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  const canGoNext = !(calYear === today.getFullYear() && calMonth === today.getMonth());
  const canGoPrev = !(calYear === 2024 && calMonth === 0);

  // Build calendar grid
  const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const target = selectedDay !== null ? getDailyCharacter(shuffled, selectedDay) : null;

  function handleGuess(char) {
    if (!target || won) return;
    const result = compareCharacters(char, target);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    if (char.name === target.name) setWon(true);
  }

  const guessedNames = guesses.map(g => g.name);

  if (selectedDay !== null) {
    const puzzleDate = new Date(EPOCH.getTime() + selectedDay * 86400000);
    const dateLabel = `${MONTH_NAMES[puzzleDate.getMonth()]} ${puzzleDate.getDate()}, ${puzzleDate.getFullYear()}`;
    return (
      <div className="game-page">
        <div className="archive-nav">
          <button className="back-btn" onClick={() => setSelectedDay(null)}>← Back to Calendar</button>
          <span className="archive-label">{dateLabel} · Puzzle #{selectedDay + 1}</span>
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
      </div>
    );
  }

  return (
    <div className="archive-calendar-page">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prevMonth} disabled={!canGoPrev}>‹</button>
        <span className="cal-month-label">{MONTH_NAMES[calMonth]} {calYear}</span>
        <button className="cal-nav-btn" onClick={nextMonth} disabled={!canGoNext}>›</button>
      </div>

      <div className="cal-grid">
        {DAY_LABELS.map(d => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />;
          const dayNum = dateToDayNumber(calYear, calMonth, date);
          const isToday = dayNum === currentDay;
          const isPast = dayNum < currentDay;
          const hasPuzzle = dayNum >= 0 && dayNum <= currentDay;
          return (
            <button
              key={date}
              className={`cal-cell${isToday ? ' cal-today' : ''}${isPast ? ' cal-past' : ''}${!hasPuzzle ? ' cal-future' : ''}`}
              onClick={() => hasPuzzle && selectDay(dayNum)}
              disabled={!hasPuzzle}
            >
              <span className="cal-date-num">{date}</span>
              {hasPuzzle && <span className="cal-puzzle-num">#{dayNum + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
