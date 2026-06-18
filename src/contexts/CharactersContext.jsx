import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase.js';
import { CHARACTERS as STATIC_CHARACTERS, VALID_ANSWERS as STATIC_VALID_ANSWERS } from '../data/characters.js';

const CharactersContext = createContext(null);

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Convert Supabase snake_case row to camelCase for game logic
function rowToChar(row) {
  return {
    name: row.name,
    homeWorld: row.home_world || 'Unknown',
    firstAppearance: row.first_appearance || 'Unknown',
    species: row.species || 'Unknown',
    abilities: row.abilities || 'None',
    validFrom: row.valid_from ?? 0,
  };
}

export function CharactersProvider({ children }) {
  const [characters, setCharacters] = useState(STATIC_CHARACTERS);
  const [validAnswers, setValidAnswers] = useState(STATIC_VALID_ANSWERS);
  const [shuffled, setShuffled] = useState(() => seededShuffle(STATIC_VALID_ANSWERS, 0xC05E4E));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('characters').select('*').then(({ data, error }) => {
      if (error || !data || data.length === 0) { setLoaded(true); return; }
      const chars = data.map(rowToChar);
      // Sort by name (ignoring leading non-letters) for stable shuffle order
      const sorted = [...chars].sort((a, b) =>
        a.name.replace(/^[^a-zA-Z]+/, '').toLowerCase()
          .localeCompare(b.name.replace(/^[^a-zA-Z]+/, '').toLowerCase())
      );
      setCharacters(sorted);
      setValidAnswers(sorted);
      setShuffled(seededShuffle(sorted, 0xC05E4E));
      setLoaded(true);
    });
  }, []);

  return (
    <CharactersContext.Provider value={{ characters, validAnswers, shuffled, loaded }}>
      {children}
    </CharactersContext.Provider>
  );
}

export function useCharacters() {
  return useContext(CharactersContext);
}
