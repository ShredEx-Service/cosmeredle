import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase.js';
import { OPTIONS as STATIC_OPTIONS } from '../components/CharacterForm.jsx';

const OptionsContext = createContext(null);

export function OptionsProvider({ children }) {
  const [options, setOptions] = useState(STATIC_OPTIONS);
  const [loaded, setLoaded] = useState(false);

  async function fetchOptions() {
    const { data, error } = await supabase
      .from('category_options')
      .select('category, value')
      .order('value');

    // Always start from static base, then add any Supabase-only entries on top
    const merged = {
      home_world: [...STATIC_OPTIONS.home_world],
      first_appearance: [...STATIC_OPTIONS.first_appearance],
      species: [...STATIC_OPTIONS.species],
      abilities: [...STATIC_OPTIONS.abilities],
    };

    if (!error && data) {
      for (const row of data) {
        if (merged[row.category] && !merged[row.category].includes(row.value)) {
          merged[row.category].push(row.value);
          merged[row.category].sort();
        }
      }
    }

    setOptions(merged);
    setLoaded(true);
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
