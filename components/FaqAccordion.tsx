'use client';

import { useEffect, useState } from 'react';
import styles from './FaqAccordion.module.css';

interface FaqAccordionProps {
  ids: number[];
  getQuestion: (id: number) => string;
  getAnswer: (id: number) => string;
  resetKey?: string | number | boolean;
}

export default function FaqAccordion({
  ids,
  getQuestion,
  getAnswer,
  resetKey,
}: FaqAccordionProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setExpandedId(null);
  }, [resetKey]);

  const toggleQuestion = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (ids.length === 0) return;
    let targetIndex: number;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (index + 1) % ids.length;
        document.getElementById(`faq-question-${ids[targetIndex]}`)?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = (index - 1 + ids.length) % ids.length;
        document.getElementById(`faq-question-${ids[targetIndex]}`)?.focus();
        break;
      case 'Home':
        e.preventDefault();
        document.getElementById(`faq-question-${ids[0]}`)?.focus();
        break;
      case 'End':
        e.preventDefault();
        document.getElementById(`faq-question-${ids[ids.length - 1]}`)?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.accordion} role="list">
      {ids.map((id, index) => {
        const isExpanded = expandedId === id;
        const itemClassName = `${styles.accordionItem} ${
          isExpanded ? styles.accordionItemExpanded : ''
        }`.trim();

        return (
          <div key={id} className={itemClassName} role="listitem">
            <button
              type="button"
              id={`faq-question-${id}`}
              className={styles.accordionTrigger}
              onClick={() => toggleQuestion(id)}
              onKeyDown={e => handleKeyDown(e, index)}
              aria-expanded={isExpanded}
              aria-controls={`faq-answer-${id}`}
            >
              <span className={styles.accordionQuestion}>
                {getQuestion(id)}
              </span>
              <span className={styles.accordionIcon} aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            </button>
            <div
              id={`faq-answer-${id}`}
              className={styles.accordionContent}
              role="region"
              aria-labelledby={`faq-question-${id}`}
              hidden={!isExpanded}
            >
              <p>{getAnswer(id)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
