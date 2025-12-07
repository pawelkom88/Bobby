'use client';

import type { ConversationAssessment } from '@/types';

interface AssessmentFeedbackProps {
  assessment: ConversationAssessment;
}

export default function AssessmentFeedback({
  assessment,
}: AssessmentFeedbackProps) {
  return (
    <div className="completion-card assessment-feedback" aria-live="polite">
      <div>
        <h3>What you did well</h3>
        <ul className="feedback-list">
          {assessment.positives.length > 0 ? (
            assessment.positives.map((item, index) => (
              <li key={`pos-${index}`}>{item}</li>
            ))
          ) : (
            <li>Great effort!</li>
          )}
        </ul>
      </div>

      <div>
        <h3>Next time try</h3>
        <ul>
          {assessment.improvements.length > 0 ? (
            assessment.improvements.map((item, index) => (
              <li key={`imp-${index}`}>{item}</li>
            ))
          ) : (
            <li>Keep practicing to stay sharp.</li>
          )}
        </ul>
      </div>

      {assessment.warnings.length > 0 && (
        <div>
          <h3>Friendly reminders</h3>
          <ul>
            {assessment.warnings.map((item, index) => (
              <li key={`warn-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

