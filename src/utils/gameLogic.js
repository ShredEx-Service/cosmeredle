import { VALID_ANSWERS } from '../data/characters.js';

// Epoch date for daily puzzle #1
const EPOCH = new Date('2024-01-01');

export function getDayNumber() {
  const now = new Date();
  const diff = Math.floor((now - EPOCH) / (1000 * 60 * 60 * 24));
  return diff;
}

export function getDailyCharacter(dayNumber = getDayNumber()) {
  const idx = dayNumber % VALID_ANSWERS.length;
  return VALID_ANSWERS[idx];
}

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
        guess.species.split(', ').some(s => target.species.split(', ').includes(s)),
    },
    abilities: {
      value: guess.abilities,
      correct: guess.abilities === target.abilities,
      partial: guess.abilities !== target.abilities &&
        guess.abilities.split(', ').some(a => target.abilities.split(', ').includes(a)),
    },
  };
}
