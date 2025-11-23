'use client';

import { ViewTransition } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HomePage() {
  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <div className="landing-container">
            <div className="landing-wrapper">
              <nav className="landing-nav">
                <div className="landing-nav-placeholder"></div>
                <button className="landing-nav-button">GET STARTED</button>
              </nav>
              <main className="landing-main">
                <div className="landing-content">
                  <div className="landing-text-section">
                    <h1 className="landing-title">
                      Bobby: Your Child's Helpline Hero
                    </h1>
                    <p className="landing-subtitle">
                      Prepare kids for emergencies the safe & fun way
                    </p>
                    <button className="landing-cta-button">
                      <svg
                        className="landing-phone-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      START FREE TRAINING
                    </button>
                  </div>
                  <div className="landing-image-placeholder"></div>
                </div>
              </main>
              <footer className="landing-footer">
                <span className="landing-footer-text">
                  Ready to get started?
                </span>
                <div className="landing-footer-right">
                  <a href="#" className="landing-footer-link">
                    Privacy Policy
                  </a>
                  <a href="#" className="landing-twitter-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
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
