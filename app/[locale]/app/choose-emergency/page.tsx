'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import { useUserData } from '@/context/UserDataContext';
import { useSessionClear } from '@/hooks/useSessionClear';
import { ROUTES } from '@/lib/routes';
import { Service } from '@/types';
import { logger } from '@/lib/logger';
import { SpeculationRules } from '@/components/SpeculationRules';

const services: Array<{
  id: Service;
  labelKey: string;
  imagePath: string;
  color: string;
}> = [
  {
    id: 'fire',
    labelKey: 'fire',
    imagePath: '/emergency-type-fire-brigade.png',
    color: '#F68941',
  },
  {
    id: 'ambulance',
    labelKey: 'ambulance',
    imagePath: '/emergency-type-ambulance.png',
    color: '#A5D967',
  },
  {
    id: 'police',
    labelKey: 'police',
    imagePath: '/emergency-type-police.png',
    color: '#299DED',
  },
];

export default function ChooseEmergencyPage() {
  const router = useRouter();
  const t = useTranslations('chooseEmergency');
  const tCommon = useTranslations('common');
  const { setSelectedService } = useUserData();

  // Clear session data when in conversation setup flow
  useSessionClear();

  const handleSelectService = async (service: Service) => {
    try {
      await setSelectedService(service);
      // Navigate to package selection
      router.push(ROUTES.SELECT_PACKAGE);
    } catch (error) {
      logger.error('Error setting service:', error);
    }
  };

  const handleBack = () => {
    router.push(ROUTES.YOUR_AGE);
  };

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <main className="emergency-page" role="main">
            <div className="emergency-container">
              <div className="emergency-card accessibility-section">
                <div className="emergency-header">
                  <h1 className="emergency-title">{t('title')}</h1>
                  <p className="emergency-subtitle">{t('subtitle')}</p>
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
                      aria-label={`Select ${t(`services.${service.labelKey}`)}`}
                    >
                      <div className="emergency-tile-content">
                        <Image
                          src={service.imagePath}
                          alt={t(`services.${service.labelKey}`)}
                          width={120}
                          height={100}
                          className="emergency-tile-icon"
                        />
                        <div className="emergency-tile-text">
                          <span className="emergency-tile-label">
                            {t(`services.${service.labelKey}`)}
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
                    {tCommon('back')}
                  </CartoonButton>
                </div>
              </div>
            </div>
          </main>
        </PageWrapper>
      </ViewTransition>
      <SpeculationRules prerenderPaths={[ROUTES.DIAL]} />
    </>
  );
}
