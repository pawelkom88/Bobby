'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import styles from './HowItWorksSection.module.css';

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
    <section id="how-it-works" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('howItWorks.title')}</h2>
        <p className={styles.subtitle}>{t('howItWorks.subtitle')}</p>

        <div className={styles.stepsGrid}>
          {steps.map(step => (
            <div key={step.number} className={styles.stepCard}>
              <div className={styles.stepNumber}>
                <span className={styles.stepNumberText}>{step.number}</span>
              </div>
              <div className={styles.stepIcon}>
                <div className={styles.stepIconContainer}>
                  <Image
                    fill
                    src={step.icon}
                    alt={step.title}
                    className={styles.stepIconImage}
                    sizes="150px"
                    loading="lazy"
                  />
                </div>
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
