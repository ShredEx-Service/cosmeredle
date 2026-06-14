import './GuessRow.css';

const COLUMNS = [
  { key: 'homeWorld', label: 'Home World' },
  { key: 'firstAppearance', label: 'First Appearance' },
  { key: 'species', label: 'Species' },
  { key: 'abilities', label: 'Abilities / Investiture' },
];

export default function GuessRow({ result }) {
  const nameState = result.correct ? 'correct' : 'wrong';
  return (
    <div className="guess-row">
      <div className={`cell ${nameState}`}>{result.name}</div>
      {COLUMNS.map(col => {
        const field = result[col.key];
        const state = field.correct ? 'correct' : field.partial ? 'partial' : 'wrong';
        return (
          <div key={col.key} className={`cell ${state}`}>
            {field.value || '—'}
          </div>
        );
      })}
    </div>
  );
}

export function GuessHeader() {
  return (
    <div className="guess-row header-row">
      <div className="cell name-cell">Name</div>
      {COLUMNS.map(col => (
        <div key={col.key} className="cell">{col.label}</div>
      ))}
    </div>
  );
}
