'use client';

import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScenarioCarousel } from '@/app/landing-page';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <div className="landing-container">
            <div className="landing-wrapper">
              <nav className="landing-nav">
                <ul className="nav-ul">
                  <li>
                    <Link href=""></Link>
                  </li>
                  <li>
                    <Link href=""></Link>
                  </li>
                  <li>
                    <Link href="#how-it-works">How it works ?</Link>
                  </li>
                </ul>
                <Link href="/login" className="ach-button-small">
                  Start Training Now
                </Link>
              </nav>

              <main className="landing-main">
                <div className="landing-content">
                  <div className="landing-text-section">
                    <h1 className="landing-title">
                      Master the 999 Call Before an Emergency Strikes.
                    </h1>
                    <p className="landing-subtitle">
                      Bobby is the interactive AI tutor that trains children
                      (ages 5-12) to handle police, fire, and ambulance calls
                      with confidence. Practice realistic voice simulations and
                      learn critical safety protocols in a secure environment.
                    </p>
                    <Link
                      href="/login"
                      className="ach-button ach-button-landing"
                    >
                      Start Training Now
                    </Link>
                    <Link
                      href="/#how-it-works"
                      className="landing-secondary-cta-button"
                    >
                      Watch How It Works
                    </Link>
                  </div>
                  <Image
                    preload
                    width={350}
                    height={275}
                    src="/bobby.png"
                    alt="Hero Image - smiling Bobby"
                  />
                </div>
              </main>

              <ScenarioCarousel />

              <footer className="landing-footer">
                <span className="landing-footer-text">
                  Ready to get started?
                </span>
                <div className="landing-footer-right">
                  <a href="#" className="landing-footer-link">
                    Privacy Policy
                  </a>
                </div>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
