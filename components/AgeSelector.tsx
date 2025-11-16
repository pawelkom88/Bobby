'use client';

import { useState } from 'react';
import { getAllAgeTiers } from '@/lib/ageTiers';
import type { AgeTierConfig, AgeTier } from '@/types';

interface AgeSelectorProps {
  onSelect?: (tier: AgeTierConfig) => void;
  selectedTier?: AgeTier | null;
}

/**
 * Age selector component with three tier buttons
 */
export default function AgeSelector({ onSelect, selectedTier = null }: AgeSelectorProps) {
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
      <h2 className="age-selector-title">WHO IS THIS FOR?</h2>
      <p className="age-selector-subtitle">Choose the age tier</p>
      
      <div className="age-tier-buttons">
        {ageTiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            className={`age-tier-button ${selected === tier.id ? 'selected' : ''}`}
            onClick={() => handleSelect(tier)}
            aria-pressed={selected === tier.id}
            aria-label={`${tier.label} - ${tier.description}`}
          >
            <span className="age-tier-icon" aria-hidden="true">
              {/* Placeholder icon - user will replace */}
              👤
            </span>
            <span className="age-tier-label">{tier.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

