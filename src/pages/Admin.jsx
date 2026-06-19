import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase.js';
import { ChecklistField, OPTIONS as STATIC_OPTIONS } from '../components/CharacterForm.jsx';
import { useOptions } from '../contexts/OptionsContext.jsx';
import './Admin.css';

const CATEGORY_LABELS = {
  home_world: 'Home World',
  first_appearance: 'First Appearance',
  species: 'Species',
  abilities: 'Abilities',
};

function OptionsManager() {
  const { options, refetch } = useOptions();
  const [activeTab, setActiveTab] = useState('home_world');
  const [addText, setAddText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function addOption() {
    const val = addText.trim();
    if (!val) return;
    setSaving(true);
    await supabase.from('category_options').insert([{ category: activeTab, value: val }]);
    setAddText('');
    setSaving(false);
    refetch();
  }

  async function deleteOption(value) {
    await supabase.from('category_options').delete()
      .eq('category', activeTab).eq('value', value);
    setDeleteConfirm(null);
    refetch();
  }

  const current = options[activeTab] || [];
  const staticSet = new Set(STATIC_OPTIONS[activeTab] || []);

  return (
    <div className="options-manager">
      <h3 className="options-title">Manage Options</h3>
      <div className="options-tabs">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`options-tab${activeTab === key ? ' active' : ''}`}
            onClick={() => { setActiveTab(key); setDeleteConfirm(null); setAddText(''); }}
          >
            {label} ({(options[key] || []).length})
          </button>
        ))}
      </div>
      <div className="options-add-row">
        <input
          className="options-add-input"
          type="text"
          placeholder={`Add new ${CATEGORY_LABELS[activeTab]}…`}
          value={addText}
          onChange={e => setAddText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
        />
        <button className="options-add-btn" onClick={addOption} disabled={saving || !addText.trim()}>
          {saving ? '…' : '+ Add'}
        </button>
      </div>
      <div className="options-list">
        {current.map(val => (
          <div key={val} className="options-item">
            <span className="options-item-label">{val}</span>
            {staticSet.has(val) ? (
              <span className="options-item-static">built-in</span>
            ) : deleteConfirm === val ? (
              <>
                <button className="options-btn-confirm" onClick={() => deleteOption(val)}>Delete</button>
                <button className="options-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </>
            ) : (
              <button className="options-btn-delete" onClick={() => setDeleteConfirm(val)}>✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'home_world', label: 'Home World' },
  { key: 'first_appearance', label: 'First Appearance' },
  { key: 'species', label: 'Species' },
  { key: 'abilities', label: 'Abilities' },
];

const EMPTY_FORM = { name: '', home_world: '', first_appearance: '', species: '', abilities: '' };

// ── Suggestions panel ──────────────────────────────────────────────────────────

function SuggestionsPanel({ onApproved }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => { fetchSuggestions(); }, []);

  async function fetchSuggestions() {
    setLoading(true);
    const { data } = await supabase
      .from('suggestions')
      .select('*, profiles(username)')
      .eq('status', 'pending')
      .order('submitted_at');
    setSuggestions(data || []);
    setLoading(false);
  }

  async function approve(s) {
    setBusy(s.id);
    const payload = {
      name: s.name,
      home_world: s.home_world,
      first_appearance: s.first_appearance,
      species: s.species,
      abilities: s.abilities,
    };
    if (s.type === 'new') {
      await supabase.from('characters').insert([payload]);
    } else {
      await supabase.from('characters').update(payload).eq('id', s.character_id);
    }
    await supabase.from('suggestions').update({ status: 'approved' }).eq('id', s.id);
    setBusy(null);
    fetchSuggestions();
    onApproved();
  }

  async function reject(s) {
    setBusy(s.id);
    await supabase.from('suggestions').update({ status: 'rejected' }).eq('id', s.id);
    setBusy(null);
    fetchSuggestions();
  }

  if (loading) return null;
  if (suggestions.length === 0) return null;

  return (
    <div className="suggestions-panel">
      <h3 className="suggestions-title">Pending Suggestions ({suggestions.length})</h3>
      {suggestions.map(s => (
        <div key={s.id} className={`suggestion-card${expanded === s.id ? ' expanded' : ''}`}>
          <div className="suggestion-header" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
            <div className="suggestion-meta">
              <span className={`suggestion-type ${s.type}`}>{s.type === 'new' ? 'New' : 'Edit'}</span>
              <span className="suggestion-name">{s.name}</span>
              <span className="suggestion-by">{s.profiles?.username || 'Anonymous'}</span>
            </div>
            <span className="suggestion-chevron">{expanded === s.id ? '▲' : '▼'}</span>
          </div>

          {expanded === s.id && (
            <div className="suggestion-body">
              {COLUMNS.map(col => (
                <div key={col.key} className="suggestion-row">
                  <span className="suggestion-field-label">{col.label}</span>
                  <span className="suggestion-field-value">{s[col.key] || '—'}</span>
                </div>
              ))}
              {s.notes && (
                <div className="suggestion-row">
                  <span className="suggestion-field-label">Notes</span>
                  <span className="suggestion-field-value suggestion-notes">{s.notes}</span>
                </div>
              )}
              <div className="suggestion-actions">
                <button
                  className="suggestion-btn-approve"
                  disabled={busy === s.id}
                  onClick={() => approve(s)}
                >
                  {busy === s.id ? '…' : 'Approve'}
                </button>
                <button
                  className="suggestion-btn-reject"
                  disabled={busy === s.id}
                  onClick={() => reject(s)}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main admin page ────────────────────────────────────────────────────────────

export default function Admin() {
  const { options, addOption } = useOptions();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { fetchAll(); }, [refreshKey]);

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase.from('characters').select('*');
    if (data) {
      const sortKey = s => s.name.replace(/^[^a-zA-Z]+/, '').toLowerCase();
      setCharacters(data.sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
    }
    setLoading(false);
  }

  function startNew() {
    setForm(EMPTY_FORM);
    setEditing('new');
    setDeleteConfirm(false);
    setError('');
  }

  function startEdit(char) {
    setForm({
      name: char.name,
      home_world: char.home_world || '',
      first_appearance: char.first_appearance || '',
      species: char.species || '',
      abilities: char.abilities || '',
    });
    setEditing(char);
    setDeleteConfirm(false);
    setError('');
  }

  function cancelEdit() {
    setEditing(null);
    setDeleteConfirm(false);
    setError('');
  }

  async function saveForm(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (editing === 'new') {
      const { error } = await supabase.from('characters').insert([form]);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('characters').update(form).eq('id', editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setEditing(null);
    fetchAll();
  }

  async function deleteChar() {
    const { error } = await supabase.from('characters').delete().eq('id', editing.id);
    if (error) { setError(error.message); return; }
    setEditing(null);
    setDeleteConfirm(false);
    fetchAll();
  }

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <SuggestionsPanel onApproved={() => setRefreshKey(k => k + 1)} />
      <OptionsManager />

      <div className="admin-header">
        <h2 className="admin-title">Characters ({characters.length})</h2>
        <button className="admin-btn-new" onClick={startNew}>+ Add Character</button>
      </div>

      <input
        className="admin-search"
        type="text"
        placeholder="Search characters..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : (
        <div className="admin-card-list">
          <div className="admin-card-header">
            <div className="admin-cell admin-cell-name">Name</div>
            {COLUMNS.map(col => (
              <div key={col.key} className="admin-cell">{col.label}</div>
            ))}
          </div>
          {filtered.map(char => (
            <div key={char.id} className="admin-card" onClick={() => startEdit(char)}>
              <div className="admin-cell admin-cell-name">{char.name}</div>
              {COLUMNS.map(col => (
                <div key={col.key} className="admin-cell admin-cell-value">
                  {char[col.key] || '—'}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) cancelEdit(); }}>
          <div className="admin-modal">
            <button className="admin-modal-close" onClick={cancelEdit}>✕</button>
            <h3 className="admin-modal-title">{editing === 'new' ? 'Add Character' : 'Edit Character'}</h3>
            <form onSubmit={saveForm} className="admin-form">
              <div className="admin-field">
                <label className="admin-label">Name *</label>
                <input
                  className="admin-input"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <ChecklistField label="Home World" fieldKey="home_world"
                value={form.home_world} onChange={v => setForm(f => ({ ...f, home_world: v }))}
                optionsList={options.home_world} onAddOption={addOption} />
              <ChecklistField label="First Appearance" fieldKey="first_appearance"
                value={form.first_appearance} onChange={v => setForm(f => ({ ...f, first_appearance: v }))}
                optionsList={options.first_appearance} onAddOption={addOption} />
              <ChecklistField label="Species" fieldKey="species"
                value={form.species} onChange={v => setForm(f => ({ ...f, species: v }))}
                optionsList={options.species} onAddOption={addOption} />
              <ChecklistField label="Abilities" fieldKey="abilities"
                value={form.abilities} onChange={v => setForm(f => ({ ...f, abilities: v }))}
                optionsList={options.abilities} onAddOption={addOption} />

              {error && <p className="admin-error">{error}</p>}
              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="admin-btn-cancel" onClick={cancelEdit}>Cancel</button>
                {editing !== 'new' && (
                  deleteConfirm ? (
                    <>
                      <button type="button" className="admin-btn-confirm-delete" onClick={deleteChar}>Confirm Delete</button>
                      <button type="button" className="admin-btn-cancel" onClick={() => setDeleteConfirm(false)}>No</button>
                    </>
                  ) : (
                    <button type="button" className="admin-btn-delete" onClick={() => setDeleteConfirm(true)}>Delete</button>
                  )
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
