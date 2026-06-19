import { useState, useRef, useEffect } from 'react';
import { useCharacters } from '../contexts/CharactersContext.jsx';
import './GuessInput.css';

export default function GuessInput({ onGuess, guessedNames, disabled }) {
  const { characters: CHARACTERS } = useCharacters();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [displayAll, setDisplayAll] = useState(false); // true = ignore query, show full list
  const divRef = useRef(null);
  const listRef = useRef(null);
  const usingKeyboard = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);
  const highlightFirstOnOpen = useRef(false);
  const listLocked = useRef(false); // freeze list while navigating with arrow keys

  // Global key handler: focus input on arrow keys or typing, submit on Enter
  const submitRef = useRef(null);
  submitRef.current = submit;

  useEffect(() => {
    function onGlobalKey(e) {
      if (disabled) return;
      if (document.activeElement === divRef.current) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        usingKeyboard.current = true;
        highlightFirstOnOpen.current = true;
        divRef.current?.focus();
        setFocused(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitRef.current();
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        divRef.current?.focus();
        setFocused(true);
      }
    }
    document.addEventListener('keydown', onGlobalKey);
    return () => document.removeEventListener('keydown', onGlobalKey);
  }, [disabled]);

  // Rebuild suggestions whenever anything that affects the list changes
  useEffect(() => {
    if (!focused) { setSuggestions([]); return; }
    if (listLocked.current) return;
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const q = normalize(query);
    const fields = ['home_world', 'first_appearance', 'species', 'abilities'];
    const filtered = CHARACTERS
      .filter(c => !guessedNames.includes(c.name) && (displayAll || !q ||
        normalize(c.name).includes(q) ||
        fields.some(f => normalize(c[f] || '').includes(q))
      ))
      .sort((a, b) => {
        if (!q) return 0;
        const aName = normalize(a.name).startsWith(q);
        const bName = normalize(b.name).startsWith(q);
        if (aName && !bName) return -1;
        if (!aName && bName) return 1;
        const aNameMatch = normalize(a.name).includes(q);
        const bNameMatch = normalize(b.name).includes(q);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return 0;
      })
      .slice(0, 300);
    setSuggestions(filtered);
    if (highlightFirstOnOpen.current && filtered.length > 0) {
      setHighlighted(0);
      highlightFirstOnOpen.current = false;
    }
  }, [focused, query, guessedNames, displayAll]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);


  function selectSuggestion(char, fromKeyboard = false) {
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
    if (fromKeyboard) {
      setDisplayAll(true); // keep full list open
    } else {
      setSuggestions([]);
      setFocused(false);
    }
  }

  function submit() {
    const typed = divRef.current?.innerText.trim() || '';
    const exactMatch = CHARACTERS.find(c => c.name.toLowerCase() === typed.toLowerCase() && !guessedNames.includes(c.name));
    const char = selected || (suggestions.length === 1 ? suggestions[0] : null) || exactMatch;
    if (!char) return;
    onGuess(char);
    setSelected(null);
    setQuery('');
    setDisplayAll(false);
    setHighlighted(-1);
    if (divRef.current) divRef.current.textContent = '';
    setSuggestions([]);
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      usingKeyboard.current = true;
      listLocked.current = true;
      if (suggestions.length === 0) {
        listLocked.current = false;
        highlightFirstOnOpen.current = true;
        setFocused(true);
        return;
      }
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      usingKeyboard.current = true;
      listLocked.current = true;
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && suggestions[highlighted]) {
        const char = suggestions[highlighted];
        if (selected && selected.name === char.name) {
          submit();
        } else {
          selectSuggestion(char, true);
        }
      } else {
        submit();
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setHighlighted(-1);
    }
  }

  function handleInput(e) {
    // Strip any line breaks the browser inserted
    if (divRef.current) {
      const clean = divRef.current.innerText.replace(/[\r\n]+/g, '');
      if (divRef.current.innerText !== clean) {
        divRef.current.innerText = clean;
        // Restore cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(divRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    usingKeyboard.current = false;
    listLocked.current = false;
    setDisplayAll(false);
    setSelected(null);
    setQuery(divRef.current?.innerText.replace(/[\r\n]+/g, '') || '');
    setHighlighted(-1);
  }

  const canGuess = !!(selected || suggestions.length === 1);

  const FIELD_LABELS = { home_world: 'Home World', first_appearance: 'First Appearance', species: 'Species', abilities: 'Abilities' };
  function matchSubtitle(c) {
    if (!query) return null;
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const q = normalize(query);
    if (normalize(c.name).includes(q)) return null;
    for (const [f, label] of Object.entries(FIELD_LABELS)) {
      if (normalize(c[f] || '').includes(q)) return `${label}: ${c[f]}`;
    }
    return null;
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
          onClick={() => setFocused(true)}
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
        <ul className="suggestions" ref={listRef} onMouseMove={(e) => {
          const moved = e.clientX !== lastMousePos.current.x || e.clientY !== lastMousePos.current.y;
          lastMousePos.current = { x: e.clientX, y: e.clientY };
          if (moved) usingKeyboard.current = false;
        }}>
          {suggestions.map((c, i) => {
            const subtitle = matchSubtitle(c);
            return (
              <li
                key={c.name}
                className={i === highlighted ? 'highlighted' : ''}
                onMouseDown={() => selectSuggestion(c, false)}
                onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; touchMoved.current = false; }}
                onTouchMove={(e) => { if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) touchMoved.current = true; }}
                onTouchEnd={(e) => { if (!touchMoved.current) { e.preventDefault(); selectSuggestion(c, false); } }}
                onMouseEnter={() => { if (!usingKeyboard.current) setHighlighted(i); }}
              >
                <span className="suggestion-name">{c.name}</span>
                {subtitle && <span className="suggestion-sub">{subtitle}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
