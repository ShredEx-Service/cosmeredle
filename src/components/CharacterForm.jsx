import { useState, useRef } from 'react';
import './CharacterForm.css';

export const OPTIONS = {
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

export function ChecklistField({ label, fieldKey, value, onChange, highlight }) {
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
    <div className={`cf-field${highlight ? ' cf-field-highlight' : ''}`}>
      <label className="cf-label">
        {label}
        {selected.length > 0 && (
          <span className="cf-count">
            {isMulti ? ` (${selected.length})` : `: ${selected[0]}`}
          </span>
        )}
        {highlight && <span className="cf-changed"> ✦ changed</span>}
      </label>
      <div className="cf-grid">
        {allOptions.map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <label key={opt} className={`cf-item${isSelected ? ' selected' : ''}`}>
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                checked={isSelected}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          );
        })}
        <div className="cf-add-row">
          <input
            ref={addInputRef}
            className="cf-add-input"
            type="text"
            placeholder="Add new…"
            value={addText}
            onChange={e => setAddText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          />
          <button type="button" className="cf-add-btn" onClick={addCustom}>+</button>
        </div>
      </div>
    </div>
  );
}
