'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import { getAllAgeTiers } from '@/lib/ageTiers';
import { setSelectedAgeTier } from '@/lib/storage';
import type { AgeTier } from '@/types';

export default function YourAgePage() {
  const router = useRouter();
  const [selectedAge, setSelectedAge] = useState<AgeTier | null>(null);

  const handleSelectAge = (ageTier: AgeTier) => {
    setSelectedAge(ageTier);
    setSelectedAgeTier(ageTier);
    // Navigate to next step
    router.push('/choose-emergency');
  };

  const ageTiers = getAllAgeTiers();
  const tileColors = ['#F5A547', '#9C5FD5', '#4DB8B8']; // Orange, Purple, Teal

  return (
    <ViewTransition>
      <PageWrapper>
        <main className="age-page" role="main">
          <div className="age-container">
            <div className="age-card">
              <div className="age-header">
                <h1 className="age-title">WHO IS THIS FOR?</h1>
                <p className="age-subtitle">Choose the age tier</p>
              </div>

              <div className="age-tiles-container">
                {ageTiers.map((tier, index) => (
                  <button
                    key={tier.id}
                    onClick={() => handleSelectAge(tier.id)}
                    className="age-tile"
                    style={{
                      backgroundColor: tileColors[index % tileColors.length],
                    }}
                    aria-label={`Select ${tier.label}`}
                  >
                    <div className="age-tile-content">
                      <div className="age-tile-icon">
                        {tier.id === 1 && '👶'}
                        {tier.id === 2 && '👧'}
                        {tier.id === 3 && '👦'}
                      </div>
                      <div className="age-tile-text">
                        <span className="age-tile-label">{tier.label.toUpperCase()}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="age-back-button">
                <CartoonButton asLink href="/app">BACK</CartoonButton>
              </div>
            </div>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}

