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
    "Human (Alethi)",'Human (Aonic)','Human (Ashyn)','Human (Azish)',
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

// For single-value fields (home_world, first_appearance, species)
// For multi-value fields (abilities) — comma-separated
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
      if (!selected.includes(val)) {
        const next = [...selected, val].sort();
        onChange(next.join(', '));
      }
    } else {
      onChange(val);
    }
    setAddText('');
    addInputRef.current?.focus();
  }

  const count = selected.length;

  return (
    <div className="admin-field">
      <label className="admin-label">
        {label}
        {count > 0 && (
          <span className="admin-abilities-count">
            {isMulti ? ` (${count} selected)` : `: ${selected[0]}`}
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
  valid_from: 0,
};

export default function Admin() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('name');
    if (!error) setCharacters(data || []);
    setLoading(false);
  }

  function startNew() {
    setForm(EMPTY_FORM);
    setEditing('new');
    setError('');
  }

  function startEdit(char) {
    setForm({
      name: char.name,
      home_world: char.home_world || '',
      first_appearance: char.first_appearance || '',
      species: char.species || '',
      abilities: char.abilities || '',
      valid_from: char.valid_from ?? 0,
    });
    setEditing(char);
    setError('');
  }

  function cancelEdit() {
    setEditing(null);
    setError('');
  }

  async function saveForm(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, valid_from: Number(form.valid_from) || 0 };

    if (editing === 'new') {
      const { error } = await supabase.from('characters').insert([payload]);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('characters')
        .update(payload)
        .eq('id', editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setEditing(null);
    fetchAll();
  }

  async function deleteChar(id) {
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    setDeleteConfirm(null);
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
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>World</th>
                <th>First Appearance</th>
                <th>Species</th>
                <th>Abilities</th>
                <th>Valid From</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(char => (
                <tr key={char.id}>
                  <td className="admin-td-name">{char.name}</td>
                  <td>{char.home_world}</td>
                  <td>{char.first_appearance}</td>
                  <td>{char.species}</td>
                  <td className="admin-td-abilities">{char.abilities}</td>
                  <td>{char.valid_from}</td>
                  <td className="admin-td-actions">
                    <button className="admin-btn-edit" onClick={() => startEdit(char)}>Edit</button>
                    {deleteConfirm === char.id ? (
                      <>
                        <button className="admin-btn-confirm-delete" onClick={() => deleteChar(char.id)}>Confirm</button>
                        <button className="admin-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="admin-btn-delete" onClick={() => setDeleteConfirm(char.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) cancelEdit(); }}>
          <div className="admin-modal">
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

              <ChecklistField
                label="Home World"
                fieldKey="home_world"
                value={form.home_world}
                onChange={v => setForm(f => ({ ...f, home_world: v }))}
              />
              <ChecklistField
                label="First Appearance"
                fieldKey="first_appearance"
                value={form.first_appearance}
                onChange={v => setForm(f => ({ ...f, first_appearance: v }))}
              />
              <ChecklistField
                label="Species"
                fieldKey="species"
                value={form.species}
                onChange={v => setForm(f => ({ ...f, species: v }))}
              />
              <ChecklistField
                label="Abilities"
                fieldKey="abilities"
                value={form.abilities}
                onChange={v => setForm(f => ({ ...f, abilities: v }))}
              />

              <div className="admin-field">
                <label className="admin-label">Valid From (puzzle #)</label>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  value={form.valid_from}
                  onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                />
              </div>

              {error && <p className="admin-error">{error}</p>}
              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="admin-btn-cancel" onClick={cancelEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
