'use client';

import { useState } from 'react';
import { getAllAgeTiers } from '@/lib/ageTiers';
import CartoonButton from './CartoonButton';
import type { AgeTierConfig, AgeTier } from '@/types';

interface AgeSelectorProps {
  onSelect?: (tier: AgeTierConfig) => void;
  selectedTier?: AgeTier | null;
  onBack?: () => void;
}

/**
 * Age selector component with three tier buttons
 */
export default function AgeSelector({ onSelect, selectedTier = null, onBack }: AgeSelectorProps) {
  const [selected, setSelected] = useState<AgeTier | null>(selectedTier);
  const ageTiers = getAllAgeTiers();

  const handleSelect = (tier: AgeTierConfig) => {
    setSelected(tier.id);
    if (onSelect) {
      onSelect(tier);
    }
  };

  return (
    <div className="age-selector" role="radiogroup" aria-label="Select age tier">
      <div className="selector-header">
        <h2 className="age-selector-title">WHO IS THIS FOR?</h2>
        {onBack && (
          <CartoonButton
            onClick={onBack}
            ariaLabel="Go back to welcome screen"
          >
            ← Back
          </CartoonButton>
        )}
      </div>
      <p className="age-selector-subtitle">Choose the age tier</p>
      
      <div className="age-tier-buttons">
        {ageTiers.map((tier) => (
          <CartoonButton
            key={tier.id}
            onClick={() => handleSelect(tier)}
            ariaLabel={`${tier.label} - ${tier.description}`}
          >
            👤 {tier.label}
          </CartoonButton>
        ))}
      </div>
    </div>
  );
}

