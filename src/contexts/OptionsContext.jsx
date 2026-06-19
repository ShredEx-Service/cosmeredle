import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase.js';
import { OPTIONS as STATIC_OPTIONS } from '../components/CharacterForm.jsx';

const OptionsContext = createContext(null);

export function OptionsProvider({ children }) {
  const [options, setOptions] = useState(STATIC_OPTIONS);
  const [loaded, setLoaded] = useState(false);

  function buildOptions(rows) {
    const merged = { home_world: [], first_appearance: [], species: [], abilities: [] };
    for (const row of rows) {
      if (merged[row.category]) merged[row.category].push(row.value);
    }
    setOptions(merged);
    setLoaded(true);
  }

  async function fetchOptions() {
    const { data, error } = await supabase
      .from('category_options')
      .select('category, value')
      .order('value');

    if (error) {
      setOptions(STATIC_OPTIONS);
      setLoaded(true);
      return;
    }

    // Seed any static options not yet in Supabase (one-time migration)
    const existing = new Set(data.map(r => `${r.category}::${r.value}`));
    const toInsert = [];
    for (const [cat, vals] of Object.entries(STATIC_OPTIONS)) {
      for (const val of vals) {
        if (!existing.has(`${cat}::${val}`)) {
          toInsert.push({ category: cat, value: val });
        }
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('category_options').insert(toInsert);
      const { data: seeded } = await supabase
        .from('category_options')
        .select('category, value')
        .order('value');
      buildOptions(seeded || []);
    } else {
      buildOptions(data);
    }
  }

  useEffect(() => { fetchOptions(); }, []);

  async function addOption(category, value) {
    await supabase.from('category_options').insert([{ category, value }]);
    await fetchOptions();
  }

  return (
    <OptionsContext.Provider value={{ options, loaded, refetch: fetchOptions, addOption }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  return useContext(OptionsContext);
}
