'use client';

import { useState } from 'react';
import CartoonButton from './CartoonButton';
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
  onBack?: () => void;
}

/**
 * Situation selector component with three situation tiles
 */
export default function SituationSelector({ onSelect, selectedSituation = null, onBack }: SituationSelectorProps) {
  const [selected, setSelected] = useState<Service | null>(selectedSituation);

  const handleSelect = (situation: Situation) => {
    setSelected(situation.id);
    if (onSelect) {
      onSelect(situation);
    }
  };

  return (
    <div className="situation-selector" role="radiogroup" aria-label="Select emergency situation">
      <div className="selector-header">
        <h2 className="situation-selector-title">WHAT HAPPENED</h2>
        {onBack && (
          <CartoonButton
            onClick={onBack}
            ariaLabel="Go back to age selection"
          >
            ← Back
          </CartoonButton>
        )}
      </div>
      <p className="situation-selector-subtitle">Choose situation</p>
      
      <div className="situation-tiles">
        {SITUATIONS.map((situation) => (
          <CartoonButton
            key={situation.id}
            onClick={() => handleSelect(situation)}
            ariaLabel={`${situation.label} emergency`}
          >
            {situation.icon} {situation.label.toUpperCase()}
          </CartoonButton>
        ))}
      </div>
    </div>
  );
}

