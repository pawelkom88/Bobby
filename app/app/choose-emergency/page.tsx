'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import { useUserData } from '@/context/UserDataContext';
import { ROUTES } from '@/lib/routes';
import { Service } from '@/types';
import { logger } from '@/lib/logger';

const services: Array<{
  id: Service;
  label: string;
  imagePath: string;
  color: string;
}> = [
  {
    id: 'fire',
    label: 'FIRE',
    imagePath: '/emergency-type-fire-brigade.png',
    color: '#F68941',
  },
  {
    id: 'ambulance',
    label: 'AMBULANCE',
    imagePath: '/emergency-type-ambulance.png',
    color: '#A5D967',
  },
  {
    id: 'police',
    label: 'POLICE',
    imagePath: '/emergency-type-police.png',
    color: '#299DED',
  },
];

export default function ChooseEmergencyPage() {
  const router = useRouter();
  const { setSelectedService } = useUserData();

  // Clear session data when in conversation setup flow
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('conversationComplete');
      sessionStorage.removeItem('lastAssessment');
      sessionStorage.removeItem('completionId');
      sessionStorage.removeItem('processedCompletionId');
    }
  }, []);

  const handleSelectService = async (service: Service) => {
    try {
      await setSelectedService(service);
      // Navigate to dial pad
      router.push(ROUTES.DIAL);
    } catch (error) {
      logger.error('Error setting service:', error);
    }
  };

  const handleBack = () => {
    router.push(ROUTES.YOUR_AGE);
  };

  return (
    <ViewTransition>
      <PageWrapper>
        <main className="emergency-page" role="main">
          <div className="emergency-container">
            <div className="emergency-card accessibility-section">
              <div className="emergency-header">
                <h1 className="emergency-title">WHAT'S THE EMERGENCY?</h1>
                <p className="emergency-subtitle">Choose the emergency type</p>
              </div>

              <div className="emergency-tiles-container">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service.id)}
                    className="emergency-tile"
                    style={{
                      backgroundColor: service.color,
                    }}
                    aria-label={`Select ${service.label}`}
                  >
                    <div className="emergency-tile-content">
                      <Image
                        src={service.imagePath}
                        alt={service.label}
                        width={120}
                        height={100}
                        className="emergency-tile-icon"
                      />
                      <div className="emergency-tile-text">
                        <span className="emergency-tile-label">
                          {service.label}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="emergency-back-button">
                <CartoonButton
                  containerClassName="emergency-back-button-container"
                  onClick={handleBack}
                >
                  ← BACK
                </CartoonButton>
              </div>
            </div>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
