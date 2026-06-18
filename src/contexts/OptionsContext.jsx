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
    if (error || !data || data.length === 0) { setLoaded(true); return; }

    const grouped = { home_world: [], first_appearance: [], species: [], abilities: [] };
    for (const row of data) {
      if (grouped[row.category]) grouped[row.category].push(row.value);
    }
    setOptions(grouped);
    setLoaded(true);
  }

  useEffect(() => { fetchOptions(); }, []);

  return (
    <OptionsContext.Provider value={{ options, loaded, refetch: fetchOptions }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  return useContext(OptionsContext);
}
