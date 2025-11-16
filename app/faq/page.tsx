'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: 'What is this app for?',
    answer: 'Bobby helps kids practice calling 111 in a safe, fun way. It teaches children how to communicate clearly, stay calm, and understand when and how to call for help.',
  },
  {
    id: 2,
    question: 'How do the age scenarios work?',
    answer: 'The app offers three age tiers: Ages 4-6 (very simple language and short scenarios), Ages 7-10 (more realistic conversations), and Ages 11-13 (near-realistic operator flow with 111 vs 999 differences).',
  },
  {
    id: 3,
    question: 'Is my child\'s data safe?',
    answer: 'Yes! We store minimal data locally on your device only. No sensitive information is collected or stored. We only track scenario completion, XP, and badges to make learning fun.',
  },
  {
    id: 4,
    question: 'Does this app require internet?',
    answer: 'Yes, the app requires an internet connection to use the voice conversation features with Bobby. However, your progress is stored locally on your device.',
  },
  {
    id: 5,
    question: 'Can multiple children use the app?',
    answer: 'Yes! You can reset progress in the Settings page to allow different children to use the app. Each child will start fresh with their own progress and badges.',
  },
];

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleQuestion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <main className="faq-page" role="main">
      <header className="faq-header">
        <h1 className="faq-title">FREQUENT QUESTIONS</h1>
        <p className="faq-subtitle">Find answers here!</p>
      </header>

      <div className="faq-list" role="list">
        {FAQ_ITEMS.map((item) => (
          <div key={item.id} className="faq-item" role="listitem">
            <button
              type="button"
              className="faq-question"
              onClick={() => toggleQuestion(item.id)}
              aria-expanded={expandedId === item.id}
              aria-controls={`faq-answer-${item.id}`}
            >
              <span className="faq-question-text">{item.question}</span>
              <span className="faq-toggle" aria-hidden="true">
                {expandedId === item.id ? '▼' : '▶'}
              </span>
            </button>
            {expandedId === item.id && (
              <div
                id={`faq-answer-${item.id}`}
                className="faq-answer"
                role="region"
                aria-live="polite"
              >
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="faq-contact">
        <p>Still have questions?</p>
        <Link href="/contact" className="contact-link">
          Contact Us
        </Link>
      </div>

      <nav className="faq-navigation" role="navigation" aria-label="Main navigation">
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

