import { useState, useRef, useEffect } from 'react';
import { CHARACTERS } from '../data/characters.js';
import './GuessInput.css';

export default function GuessInput({ onGuess, guessedNames, disabled }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
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
    // If user edits after selecting, clear selection
    if (selected && query !== selected.name) setSelected(null);
  }, [query, guessedNames, focused]);

  function selectSuggestion(char) {
    setSelected(char);
    setQuery(char.name);
    if (divRef.current) {
      divRef.current.textContent = char.name;
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(divRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      divRef.current.focus();
    }
    setSuggestions([]);
  }

  function submit() {
    const char = selected || (suggestions.length === 1 ? suggestions[0] : null);
    if (!char) return;
    onGuess(char);
    setSelected(null);
    setQuery('');
    if (divRef.current) divRef.current.textContent = '';
    setSuggestions([]);
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) selectSuggestion(suggestions[highlighted]);
      else submit();
    }
    else if (e.key === 'Escape') setSuggestions([]);
  }

  function handleInput() {
    setQuery(divRef.current?.textContent || '');
  }

  const canGuess = !!(selected || suggestions.length === 1);

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
          onClick={submit}
          disabled={disabled || !canGuess}
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
              onMouseDown={() => selectSuggestion(c)}
              onTouchEnd={(e) => { e.preventDefault(); selectSuggestion(c); }}
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
