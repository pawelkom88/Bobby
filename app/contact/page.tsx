'use client';

import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="contact-page" role="main">
      <header className="contact-header">
        <h1 className="contact-title">CONTACT US</h1>
        <p className="contact-subtitle">Got a question? We're here to help!</p>
      </header>

      <div className="contact-options">
        <button
          type="button"
          className="contact-option chat-option"
          aria-label="Chat with Bobby's team"
        >
          <span className="contact-icon" aria-hidden="true">💬</span>
          <span className="contact-label">CHAT WITH BOBBY'S TEAM</span>
        </button>

        <a
          href="mailto:support@bobby.app"
          className="contact-option email-option"
          aria-label="Email support"
        >
          <span className="contact-icon" aria-hidden="true">✉️</span>
          <span className="contact-label">EMAIL SUPPORT</span>
        </a>

        <Link
          href="/faq"
          className="contact-option faq-option"
          aria-label="View frequently asked questions"
        >
          <span className="contact-icon" aria-hidden="true">❓</span>
          <span className="contact-label">FAQS</span>
        </Link>
      </div>

      <div className="contact-response-time">
        <p>We'll get back to you within 24 hours.</p>
      </div>

      <nav className="contact-navigation" role="navigation" aria-label="Main navigation">
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/app" className="nav-link">
          Scenarios
        </Link>
        <Link href="/settings" className="nav-link">
          Settings
        </Link>
      </nav>
    </main>
  );
}

