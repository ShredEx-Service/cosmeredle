import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChecklistField } from '../components/CharacterForm.jsx';
import { useOptions } from '../contexts/OptionsContext.jsx';
import './Suggest.css';

const EMPTY = { name: '', home_world: '', first_appearance: '', species: '', abilities: '', notes: '' };
const FIELDS = ['home_world', 'first_appearance', 'species', 'abilities'];
const LABELS = { home_world: 'Home World', first_appearance: 'First Appearance', species: 'Species', abilities: 'Abilities' };

export default function Suggest() {
  const { user } = useAuth();
  const { options, addOption } = useOptions();
  const [characters, setCharacters] = useState([]);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [selected, setSelected] = useState(null); // null = new character
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    supabase.from('characters').select('id, name, home_world, first_appearance, species, abilities')
      .then(({ data }) => {
        if (data) {
          const sortKey = s => s.name.replace(/^[^a-zA-Z]+/, '').replace(/^the\s+/i, '').toLowerCase();
          setCharacters(data.sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
        }
      });
  }, []);

  const normalize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const filtered = characters.filter(c => {
    const q = normalize(search);
    return !q || normalize(c.name).includes(q);
  }).sort((a, b) => {
    const q = normalize(search);
    if (!q) return 0;
    const aStarts = normalize(a.name).startsWith(q);
    const bStarts = normalize(b.name).startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  function handleSearchKey(e) {
    if (!dropdownOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && filtered[highlighted]) {
        pickCharacter(filtered[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  }

  function pickCharacter(char) {
    const vals = {
      name: char.name,
      home_world: char.home_world || '',
      first_appearance: char.first_appearance || '',
      species: char.species || '',
      abilities: char.abilities || '',
      notes: '',
    };
    setForm(vals);
    setOriginal(vals);
    setSelected(char);
    setShowSearch(false);
    setDropdownOpen(false);
    setDone(false);
    setError('');
  }

  function pickNew() {
    setForm(EMPTY);
    setOriginal(null);
    setSelected('new');
    setShowSearch(false);
    setDropdownOpen(false);
    setDone(false);
    setError('');
  }

  function isChanged(field) {
    return original && form[field] !== original[field];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError('');

    const { error } = await supabase.from('suggestions').insert([{
      type: selected === 'new' ? 'new' : 'edit',
      character_id: selected === 'new' ? null : selected.id,
      name: form.name,
      home_world: form.home_world,
      first_appearance: form.first_appearance,
      species: form.species,
      abilities: form.abilities,
      notes: form.notes,
      submitted_by: user?.id || null,
    }]);

    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  }

  function reset() {
    setSelected(null);
    setShowSearch(true);
    setSearch('');
    setForm(EMPTY);
    setOriginal(null);
    setDone(false);
    setError('');
  }

  if (done) {
    return (
      <div className="suggest-page">
        <div className="suggest-done">
          <p className="suggest-done-title">Suggestion submitted!</p>
          <p className="suggest-done-sub">An admin will review it shortly.</p>
          <button className="suggest-btn-primary" onClick={reset}>Suggest another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-page">
      <h2 className="suggest-title">Suggest a Change</h2>
      <p className="suggest-sub">Found an error or missing character? Submit a suggestion and an admin will review it.</p>

      {showSearch ? (
        <div className="suggest-search-wrap">
          <button className="suggest-btn-new" onClick={pickNew}>+ Suggest a new character</button>
          <div className="suggest-input-wrapper">
            <input
              className="suggest-search"
              type="text"
              placeholder="Search for a character to edit…"
              value={search}
              onChange={e => { setSearch(e.target.value); setDropdownOpen(true); setHighlighted(-1); }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              onKeyDown={handleSearchKey}
              autoFocus
            />
            {dropdownOpen && filtered.length > 0 && (
              <ul className="suggest-dropdown" ref={listRef}>
                {filtered.map((c, i) => (
                  <li
                    key={c.id}
                    className={i === highlighted ? 'highlighted' : ''}
                    onMouseDown={() => pickCharacter(c)}
                    onMouseEnter={() => setHighlighted(i)}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="suggest-form">
          <div className="suggest-form-header">
            <h3 className="suggest-char-name">
              {selected === 'new' ? 'New Character' : selected.name}
            </h3>
            <button type="button" className="suggest-change-btn" onClick={reset}>← Change</button>
          </div>

          {selected === 'new' && (
            <div className="suggest-field">
              <label className="suggest-label">Name *</label>
              <input
                className="suggest-input"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
          )}

          {FIELDS.map(key => (
            <ChecklistField
              key={key}
              label={LABELS[key]}
              fieldKey={key}
              value={form[key]}
              onChange={v => setForm(f => ({ ...f, [key]: v }))}
              highlight={isChanged(key)}
              optionsList={options[key]}
              onAddOption={addOption}
            />
          ))}

          <div className="suggest-field">
            <label className="suggest-label">Notes (optional)</label>
            <textarea
              className="suggest-input suggest-textarea"
              placeholder="Any context or source references…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {error && <p className="suggest-error">{error}</p>}

          <div className="suggest-actions">
            <button type="submit" className="suggest-btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Suggestion'}
            </button>
            <button type="button" className="suggest-btn-secondary" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
