import { useState, useRef, useEffect } from 'react';
import { CHARACTERS } from '../data/characters.js';
import './GuessInput.css';

export default function GuessInput({ onGuess, guessedNames, disabled }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [focused, setFocused] = useState(false);
  const divRef = useRef(null);

  useEffect(() => {
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const q = normalize(query);
    const filtered = CHARACTERS
      .filter(c => !guessedNames.includes(c.name) && (!q || normalize(c.name).includes(q)))
      .slice(0, 300);
    setSuggestions(focused ? filtered : []);
    setHighlighted(-1);
  }, [query, guessedNames, focused]);

  function submit(char) {
    if (!char) return;
    onGuess(char);
    setQuery('');
    if (divRef.current) divRef.current.textContent = '';
    setSuggestions([]);
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) submit(suggestions[highlighted]);
      else if (suggestions.length === 1) submit(suggestions[0]);
    }
    else if (e.key === 'Escape') setSuggestions([]);
  }

  function handleInput() {
    setQuery(divRef.current?.textContent || '');
  }

  return (
    <div className="guess-input-wrapper">
      <div className="guess-input-row">
        <div
          ref={divRef}
          className={`guess-input${disabled ? ' disabled' : ''}`}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder="Type a character name..."
          onInput={handleInput}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-autocomplete="list"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        <button
          className="guess-btn"
          onClick={() => highlighted >= 0 ? submit(suggestions[highlighted]) : suggestions.length === 1 && submit(suggestions[0])}
          disabled={disabled || suggestions.length === 0}
        >
          Guess
        </button>
      </div>
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((c, i) => (
            <li
              key={c.name}
              className={i === highlighted ? 'highlighted' : ''}
              onMouseDown={() => submit(c)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
