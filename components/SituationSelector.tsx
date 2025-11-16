'use client';

import { useState } from 'react';
import type { Situation, Service } from '@/types';

const SITUATIONS: Situation[] = [
  {
    id: 'fire',
    label: 'Fire Emergency',
    icon: '🔥', // Placeholder icon
  },
  {
    id: 'ambulance',
    label: 'Ambulance',
    icon: '🚑', // Placeholder icon
  },
  {
    id: 'police',
    label: 'Police',
    icon: '🚔', // Placeholder icon
  },
];

interface SituationSelectorProps {
  onSelect?: (situation: Situation) => void;
  selectedSituation?: Service | null;
}

/**
 * Situation selector component with three situation tiles
 */
export default function SituationSelector({ onSelect, selectedSituation = null }: SituationSelectorProps) {
  const [selected, setSelected] = useState<Service | null>(selectedSituation);

  const handleSelect = (situation: Situation) => {
    setSelected(situation.id);
    if (onSelect) {
      onSelect(situation);
    }
  };

  return (
    <div className="situation-selector" role="radiogroup" aria-label="Select emergency situation">
      <h2 className="situation-selector-title">WHAT HAPPENED</h2>
      <p className="situation-selector-subtitle">Choose situation</p>
      
      <div className="situation-tiles">
        {SITUATIONS.map((situation) => (
          <button
            key={situation.id}
            type="button"
            className={`situation-tile ${selected === situation.id ? 'selected' : ''}`}
            onClick={() => handleSelect(situation)}
            aria-pressed={selected === situation.id}
            aria-label={`${situation.label} emergency`}
          >
            <span className="situation-icon" aria-hidden="true">
              {situation.icon}
            </span>
            <span className="situation-label">{situation.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

