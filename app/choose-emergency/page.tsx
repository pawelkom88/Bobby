'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import { setSelectedService } from '@/lib/storage';
import type { Service } from '@/types';
import Image from 'next/image';

export default function ChooseEmergencyPage() {
  const router = useRouter();
  const [selectedService, setSelected] = useState<Service | null>(null);

  const services: Array<{ id: Service; label: string; imagePath: string; color: string }> = [
    { id: 'fire', label: 'FIRE', imagePath: '/emergency-type-fire-brigade.png', color: '#F68941' },
    { id: 'ambulance', label: 'AMBULANCE', imagePath: '/emergency-type-ambulance.png', color: '#A5D967' },
    { id: 'police', label: 'POLICE', imagePath: '/emergency-type-police.png', color: '#299DED' },
  ];

  const handleSelectService = (service: Service) => {
    setSelected(service);
    setSelectedService(service);
    // Navigate to dial pad
    router.push('/app/dial');
  };

  const handleBack = () => {
    router.push('/your-age');
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
                {services.map((service) => (
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
                      <Image src={service.imagePath} alt={service.label} width={100} height={100} className="emergency-tile-icon" />
                      <div className="emergency-tile-text">
                        <span className="emergency-tile-label">{service.label}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="emergency-back-button">
                <CartoonButton containerClassName='emergency-back-button-container' onClick={handleBack}>BACK</CartoonButton>
              </div>
            </div>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}

