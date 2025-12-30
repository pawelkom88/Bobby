'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function HowItWorksSection() {
  const t = useTranslations('landing');

  const steps = [
    {
      number: 1,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      icon: '/how-it-works-3.webp',
    },
    {
      number: 2,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      icon: '/how-it-works-2.webp',
    },
    {
      number: 3,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      icon: '/how-it-works-4.webp',
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="how-it-works-container">
        <h2 className="how-it-works-title">{t('howItWorks.title')}</h2>
        <p className="how-it-works-subtitle">{t('howItWorks.subtitle')}</p>

        <div className="steps-grid">
          {steps.map(step => (
            <div key={step.number} className="step-card">
              <div className="step-number">
                <span className="step-number-text">{step.number}</span>
              </div>
              <div className="step-icon">
                <Image
                  width={150}
                  height={150}
                  src={step.icon}
                  alt={step.title}
                  className="step-icon-image"
                />
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
