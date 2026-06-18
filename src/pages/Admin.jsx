import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase.js';
import './Admin.css';

const OPTIONS = {
  home_world: [
    'Ashyn','Canticle','Dhatri','First of the Sun','Komashi','Lumar','Nalthis',
    'Roshar','Scadrial','Sel','Silverlight','Taldain','The Grand Apparatus',
    'Threnody','Unknown','Unspecified','Yolen',
  ],
  first_appearance: [
    'Allomancer Jak and the Pits of Eltania','Dawnshard','Edgedancer','Elantris',
    'Isles of the Emberdark','Oathbringer','Rhythm of War','Secret History',
    'Shadows for Silence in the Forests of Hell','Sixth of the Dusk',
    'The Alloy of Law','The Bands of Mourning','The Eleventh Metal',
    "The Emperor's Soul",'The Final Empire','The Hero of Ages','The Lost Metal',
    'The Sunlit Man','The Way of Kings','The Well of Ascension',
    'Tress of the Emerald Sea','Warbreaker','White Sand','Wind and Truth',
    'Words of Radiance','Yumi and the Nightmare Painter',
  ],
  species: [
    'Aether (Roseite)','Aviar (Streamer)','Aviar (Unspecified)','Dragon',
    'Dragon (Unspecified)','Grass (Shin)','Greatshell (Tai-na)','Horse (Ryshadium)',
    'Human (Alethi)','Human (Aonic)','Human (Ashyn)','Human (Azish)',
    'Human (Darksider)','Human (Daysider)',"Human (Diggen's Point)",'Human (Dula)',
    'Human (Dzhamarian)','Human (Eelakin)','Human (Elendel)','Human (Fjordell)',
    'Human (Grand)','Human (Hallandren)','Human (Herdazian)','Human (Idrian)',
    'Human (Iriali)','Human (Islands of Lobu)','Human (JinDo)',
    'Human (Kharbranthian)','Human (Khlenni)','Human (Koloss)','Human (Lumaran)',
    'Human (MaiPon)','Human (Malwish)','Human (Nagadan)','Human (Noble)',
    'Human (Pahn Kahl)','Human (Reshi)','Human (Riran)','Human (Shin)',
    'Human (Skaa)','Human (Southern Scadrian)','Human (Teo)','Human (Terris)',
    'Human (Thaylen)','Human (Threnodite)','Human (Torish)','Human (Unkalaki)',
    'Human (Unspecified)','Human (Vaxilian)','Human (Veden)','Human (Yolish)',
    'Kandra (Seventh Generation)','Kandra (Third Generation)','Kandra (Unspecified)',
    'Koloss (Human)','Larkin','Lawnark','Plant (Stick)','Shade',
    'Sho Del (Unspecified)','Siah (Aimian)','Singer (Fused)','Singer (Listener)',
    'Sleepless','Sleepless (Aimian)','Sleepless (Nagadan)','Spren (Ancient)',
    'Spren (Ashspren)','Spren (Bondsmith)','Spren (Cryptic)',
    'Spren (Culitvation spren)','Spren (Highspren)','Spren (Honorspren)',
    'Spren (Inkspren)','Spren (Mistspren)','Spren (Peakspren)','Spren (Reacher)',
    'Spren (Unmade)','Sword (nimi)','Unknown',
  ],
  abilities: [
    'Aether','Aetherbound','Augur','Avatar','Aviar Bond','Awakener',
    'Blessing of Potency','Blessing of Presence','Bloodmaker','Bloodsealer',
    'Bondsmith','Brute','Charred','ChayShan','Cognitive Shadow','Coinshot',
    'Comedic timing','Consumes Investiture','Control of Roseite','Curse of Kind',
    'Dakhor','Dawnshard','Deadeye','Duralumin Gnat','Dustbringer','Edgedancer',
    'Elantrian','Elsecaller','Fannahn-im','Ferring','Feruchemist','Forger',
    'Forms of Power','Fused','Hemalurgy','Herald','Honorbearer','Hordelings',
    'Immortal','Knight Radiant','Leecher','Lifeless','Lightweaver','Luhel Bond',
    'Lurcher','Mastrell','Mental shielding','Mistborn','Misting','Nahel Bond',
    'Navigator','Nex-im','Nightmare','Nightmare Painter','Old Magic','Pewterarm',
    'Precognition','Pulser','Returned','Rioter','Royal Locks','Sand master',
    'Savant','Seeker','Seer','Shanay-im','Shapeshifter','Shapeshifting',
    'Shard Vessel','Shardbearer','Sighted','Skimmer','Skybreaker','Slider',
    'Sliver','Smoker','Soother','Splinter','Spore Eater','Sprouter',
    'Starcarved','Starmarks','Stoneward','Surgebinder','Tineye','Truthwatcher',
    'Twinborn','Undermastrell','Uninvested','Unknown','Unnamed electricity power',
    'Unoathed','Voidbinder','Willshaper','Windrunner','Windrunner Squire',
    'Windwhisperer','Worldhopper','Yoki-Hijo',
  ],
};

const MULTI_FIELDS = new Set(['abilities']);

function ChecklistField({ label, fieldKey, value, onChange }) {
  const isMulti = MULTI_FIELDS.has(fieldKey);
  const [extraOptions, setExtraOptions] = useState([]);
  const [addText, setAddText] = useState('');
  const addInputRef = useRef(null);

  const base = OPTIONS[fieldKey] || [];
  const allOptions = [...base, ...extraOptions];

  const selected = isMulti
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : value ? [value] : [];

  function toggle(opt) {
    if (isMulti) {
      const next = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt].sort();
      onChange(next.join(', '));
    } else {
      onChange(selected[0] === opt ? '' : opt);
    }
  }

  function addCustom() {
    const val = addText.trim();
    if (!val) return;
    if (!allOptions.includes(val)) setExtraOptions(e => [...e, val]);
    if (isMulti) {
      if (!selected.includes(val)) onChange([...selected, val].sort().join(', '));
    } else {
      onChange(val);
    }
    setAddText('');
    addInputRef.current?.focus();
  }

  return (
    <div className="admin-field">
      <label className="admin-label">
        {label}
        {selected.length > 0 && (
          <span className="admin-abilities-count">
            {isMulti ? ` (${selected.length} selected)` : `: ${selected[0]}`}
          </span>
        )}
      </label>
      <div className="admin-abilities-grid">
        {allOptions.map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <label key={opt} className={`admin-ability-item${isSelected ? ' selected' : ''}`}>
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                checked={isSelected}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          );
        })}
        <div className="admin-add-option">
          <input
            ref={addInputRef}
            className="admin-add-input"
            type="text"
            placeholder="Add new…"
            value={addText}
            onChange={e => setAddText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          />
          <button type="button" className="admin-add-btn" onClick={addCustom}>+</button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  name: '',
  home_world: '',
  first_appearance: '',
  species: '',
  abilities: '',
};

const COLUMNS = [
  { key: 'home_world', label: 'Home World' },
  { key: 'first_appearance', label: 'First Appearance' },
  { key: 'species', label: 'Species' },
  { key: 'abilities', label: 'Abilities' },
];

export default function Admin() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase.from('characters').select('*');
    if (!error) {
      const sortKey = s => s.name.replace(/^[^a-zA-Z]+/, '').toLowerCase();
      setCharacters((data || []).sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
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
      const { error } = await supabase
        .from('characters')
        .update(form)
        .eq('id', editing.id);
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
                value={form.home_world} onChange={v => setForm(f => ({ ...f, home_world: v }))} />
              <ChecklistField label="First Appearance" fieldKey="first_appearance"
                value={form.first_appearance} onChange={v => setForm(f => ({ ...f, first_appearance: v }))} />
              <ChecklistField label="Species" fieldKey="species"
                value={form.species} onChange={v => setForm(f => ({ ...f, species: v }))} />
              <ChecklistField label="Abilities" fieldKey="abilities"
                value={form.abilities} onChange={v => setForm(f => ({ ...f, abilities: v }))} />

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
