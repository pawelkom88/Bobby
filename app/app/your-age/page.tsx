'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import { getAllAgeTiers } from '@/lib/ageTiers';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { useSecureSession } from '@/hooks/useSecureSession';
import type { AgeTier } from '@/types';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
import { SpeculationRules } from '@/components/SpeculationRules';
import Image from 'next/image';

export default function YourAgePage() {
  const router = useRouter();
  const { setSelectedAgeTier } = useUserData();
  const { clearSession } = useSecureSession();
  const { user, loading } = useAuth();

  // Clear session data when starting a new conversation flow
  useEffect(() => {
    if (!loading && user) {
      clearSession();
    }
  }, [clearSession, user, loading]);

  const handleSelectAge = async (ageTier: AgeTier) => {
    try {
      await setSelectedAgeTier(ageTier);
      // Navigate to next step
      router.push(ROUTES.CHOOSE_EMERGENCY);
    } catch (error) {
      logger.error('Error setting age tier:', error);
    }
  };

  const ageTiers = getAllAgeTiers();
  const tileColors = ['#F58B47', '#9560ED', '#56C3C8']; // Orange, Purple, Teal

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <main className="age-page" role="main">
            <div className="age-container">
              <div className="age-card accessibility-section">
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
                          {tier.id === 1 && (
                            <Image
                              src="/age-4-6.png"
                              alt="Baby"
                              width={100}
                              height={100}
                            />
                          )}
                          {tier.id === 2 && (
                            <Image
                              src="/age-11-13.png"
                              alt="Teen"
                              width={100}
                              height={100}
                            />
                          )}
                          {tier.id === 3 && (
                            <Image
                              src="/age-7-9.png"
                              alt="Child"
                              width={100}
                              height={100}
                            />
                          )}
                        </div>
                        <div className="age-tile-text">
                          <span className="age-tile-label">
                            {tier.label.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="age-back-button">
                  <CartoonButton
                    containerClassName="age-back-button-container"
                    asLink
                    href={ROUTES.APP}
                  >
                    ← BACK
                  </CartoonButton>
                </div>
              </div>
            </div>
          </main>
        </PageWrapper>
      </ViewTransition>
      <SpeculationRules prerenderPaths={[ROUTES.CHOOSE_EMERGENCY]} />
    </>
  );
}
