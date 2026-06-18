export function seededShuffle(arr, seed) {
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

export function getDayNumber() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const epoch = new Date(2024, 0, 1);
  return Math.floor((today - epoch) / (1000 * 60 * 60 * 24));
}

export function getDailyCharacter(shuffled, dayNumber = getDayNumber()) {
  if (!shuffled || shuffled.length === 0) return null;
  return shuffled[dayNumber % shuffled.length];
}

const baseSpecies = s => s.replace(/\s*\(.*\)/, '').trim();

export function compareCharacters(guess, target) {
  return {
    name: guess.name,
    correct: guess.name === target.name,
    homeWorld: {
      value: guess.homeWorld,
      correct: guess.homeWorld === target.homeWorld,
    },
    firstAppearance: {
      value: guess.firstAppearance,
      correct: guess.firstAppearance === target.firstAppearance,
    },
    species: {
      value: guess.species,
      correct: guess.species === target.species,
      partial: guess.species !== target.species &&
        baseSpecies(guess.species) === baseSpecies(target.species),
    },
    abilities: {
      value: guess.abilities,
      correct: guess.abilities === target.abilities,
      partial: guess.abilities !== target.abilities &&
        guess.abilities.split(', ').some(a => target.abilities.split(', ').includes(a)),
    },
  };
}
