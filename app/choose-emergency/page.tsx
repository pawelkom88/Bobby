'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import { setSelectedService } from '@/lib/storage';
import type { Service } from '@/types';

export default function ChooseEmergencyPage() {
  const router = useRouter();
  const [selectedService, setSelected] = useState<Service | null>(null);

  const services: Array<{ id: Service; label: string; icon: string; color: string }> = [
    { id: 'fire', label: 'FIRE', icon: '🔥', color: '#F5A547' },
    { id: 'ambulance', label: 'AMBULANCE', icon: '🚑', color: '#9C5FD5' },
    { id: 'police', label: 'POLICE', icon: '🚔', color: '#4DB8B8' },
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
                      <div className="emergency-tile-icon">{service.icon}</div>
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

