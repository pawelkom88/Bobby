'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import { logger } from '@/lib/logger';

interface NPSFeedbackProps {
  conversationId?: string | null;
}

export default function NPSFeedback({ conversationId }: NPSFeedbackProps) {
  const { user } = useAuth();
  const { isBetaUser } = useCredits();
  const t = useTranslations('feedback');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Only show for beta users
  if (!isBetaUser || !user) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Thank you for your feedback! 💙
        </h3>
        <p className="text-blue-700">
          Your response helps us improve Bobby for children.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (score === null) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          score,
          comment: comment.trim() || undefined,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      logger.log('NPS feedback submitted', { userId: user.uid, score, hasComment: !!comment });
      setIsSubmitted(true);
    } catch (error) {
      logger.error('Error submitting NPS feedback:', error);
      // Could show error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Help us improve Bobby
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        How likely are you to recommend Bobby to other parents?
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NPS Scale 0-10 */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Not at all</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                disabled={isSubmitting}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  score === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`Rate ${value} out of 10`}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">Definitely</span>
        </div>

        {/* Optional Comment */}
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's the main reason for your score? (optional)"
            disabled={isSubmitting}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={score === null || isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            score === null || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
