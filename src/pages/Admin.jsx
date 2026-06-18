import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase.js';
import './Admin.css';

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
  const [editing, setEditing] = useState(null); // character object or 'new'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete

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
              {[
                { key: 'name', label: 'Name', required: true },
                { key: 'home_world', label: 'Home World' },
                { key: 'first_appearance', label: 'First Appearance' },
                { key: 'species', label: 'Species' },
                { key: 'abilities', label: 'Abilities' },
              ].map(({ key, label, required }) => (
                <div className="admin-field" key={key}>
                  <label className="admin-label">{label}</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={required}
                  />
                </div>
              ))}
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
