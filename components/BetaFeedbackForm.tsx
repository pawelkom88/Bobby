'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from './PageWrapper';
import CartoonButton from './CartoonButton';
import { BetaFeedbackSchema } from '@/lib/schemas/beta-feedback';
import { logger } from '@/lib/logger';
import styles from './BetaFeedbackForm.module.css';

interface BetaFeedbackData {
  // Section 1: About your child
  childAge: string;
  scenarios: string[];

  // Section 2: Experience
  easeOfUnderstanding: number;
  childFeelings: string;
  uncomfortable: string;

  // Section 3: Safety & Trust
  safetyRating: number;
  practiceClarity: string;

  // Section 4: Value
  usefulness: string;
  wouldUseAgain: string;
  willingToPay: string;

  // Section 5: NPS and Open feedback
  npsScore: number;
  likedMost: string;
  improveFirst: string;
  contactOptIn: boolean;
  contactEmail: string;
}

export default function BetaFeedbackForm() {
  const t = useTranslations('betaFeedbackForm');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BetaFeedbackData>({
    childAge: '',
    scenarios: [],
    easeOfUnderstanding: 3,
    childFeelings: '',
    uncomfortable: '',
    safetyRating: 3,
    practiceClarity: '',
    usefulness: '',
    wouldUseAgain: '',
    willingToPay: '',
    npsScore: 5,
    likedMost: '',
    improveFirst: '',
    contactOptIn: false,
    contactEmail: '',
  });

  const conversationId = searchParams.get('conversationId');

  // Update handleInputChange to clear errors for new required fields
  const handleInputChange = (field: keyof BetaFeedbackData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  // Helper to render required label with asterisk
  const renderRequiredLabel = (labelKey: string) => (
    <>
      {t(labelKey)}
      <span className={styles['required-asterisk']} aria-label="required">
        *
      </span>
    </>
  );

  // Get field label translations for error summary
  const getFieldLabel = (fieldPath: string): string => {
    const labelMap: Record<string, string> = {
      childAge: t('section1.age'),
      scenarios: t('section1.scenarios.label'),
      childFeelings: t('section2.feelings.label'),
      practiceClarity: t('section3.practiceClarity.label'),
      usefulness: t('section4.usefulness.label'),
      wouldUseAgain: t('section4.useAgain.label'),
      willingToPay: t('section4.willingToPay.label'),
      contactEmail: t('section5.email'),
    };
    return labelMap[fieldPath] || fieldPath;
  };

  const handleScenarioToggle = (scenario: string) => {
    setFormData(prev => ({
      ...prev,
      scenarios: prev.scenarios.includes(scenario)
        ? prev.scenarios.filter(s => s !== scenario)
        : [...prev.scenarios, scenario],
    }));
    // Clear error for scenarios when user interacts
    if (fieldErrors.scenarios) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.scenarios;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    // Clear previous errors
    setFieldErrors({});

    // Client-side validation with Zod
    const validationResult = BetaFeedbackSchema.safeParse(formData);

    if (!validationResult.success) {
      // Map Zod errors to field errors
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        const fieldPath = issue.path.join('.');
        let errorMessage = '';

        // Translate error codes to user-friendly messages
        switch (issue.message) {
          case 'EMAIL_REQUIRED_WHEN_OPT_IN':
            errorMessage = t('contactOptInRequired');
            break;
          case 'INVALID_EMAIL':
            errorMessage = t('invalidEmail');
            break;
          case 'Child age is required':
            errorMessage = t('childAgeRequired');
            break;
          case 'At least one scenario is required':
            errorMessage = t('scenariosRequired');
            break;
          case 'Child feelings is required':
            errorMessage = t('childFeelingsRequired');
            break;
          case 'Practice clarity is required':
            errorMessage = t('practiceClarityRequired');
            break;
          case 'Usefulness is required':
            errorMessage = t('usefulnessRequired');
            break;
          case 'Would use again is required':
            errorMessage = t('wouldUseAgainRequired');
            break;
          case 'Willing to pay is required':
            errorMessage = t('willingToPayRequired');
            break;
          default:
            errorMessage = issue.message;
        }

        errors[fieldPath] = errorMessage;
      });

      setFieldErrors(errors);

      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const errorElement = document.querySelector(
            `[data-field="${firstErrorField}"]`
          );
          if (errorElement) {
            errorElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100);
      }

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          ...formData,
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'invalid-request' && errorData.message) {
          // Parse the error message to extract field path and error code
          const [fieldPath, errorCode] = errorData.message.split(': ');

          // Clear previous errors
          setFieldErrors({});

          // Translate error codes to user-friendly messages
          let errorMessage = '';
          switch (errorCode) {
            case 'EMAIL_REQUIRED_WHEN_OPT_IN':
              errorMessage = t('contactOptInRequired');
              break;
            case 'INVALID_EMAIL':
              errorMessage = t('invalidEmail');
              break;
            default:
              errorMessage = errorData.message;
          }

          // Set field error
          if (fieldPath) {
            setFieldErrors({ [fieldPath]: errorMessage });

            // Scroll to the first error field
            setTimeout(() => {
              const errorElement = document.querySelector(
                `[data-field="${fieldPath}"]`
              );
              if (errorElement) {
                errorElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }, 100);
          }
        } else {
          throw new Error('Failed to submit feedback');
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      // Handle error - could show a message
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PageWrapper>
        <div className={styles['beta-feedback-success']}>
          <div className={styles['beta-feedback-success-content']}>
            <h1 className={styles['beta-feedback-success-title']}>{t('thankYou')}</h1>
            <p className={styles['beta-feedback-success-message']}>
              {t('successMessage')}
            </p>
            <CartoonButton
              onClick={() => router.push('/app')}
              ariaLabel={t('backToApp')}
            >
              {t('backToApp')}
            </CartoonButton>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className={styles['beta-feedback-form-container']}>
        <header className={styles['beta-feedback-header']}>
          <h1 className={styles['beta-feedback-title']}>{t('title')}</h1>
          <p className={styles['beta-feedback-description']}>{t('description')}</p>
        </header>

        {Object.keys(fieldErrors).length > 0 && (
          <div className="reset-warning" role="alert" aria-live="polite">
            <h3 className={styles['beta-feedback-error-summary-title']}>
              {t('validationErrors')}
            </h3>
            <ol className={styles['beta-feedback-error-list']}>
              {Object.entries(fieldErrors).map(([fieldPath, error], index) => (
                <li key={fieldPath}>
                  <span className={styles['beta-feedback-error-number']}>
                    {index + 1}.
                  </span>
                  <strong>{getFieldLabel(fieldPath)}</strong>
                  <p className={styles['beta-feedback-error-paragraph']}>{error}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
        {Object.keys(fieldErrors).length > 0 && <br />}
        <section className={styles['beta-feedback-section']}>
          <div className={styles['beta-feedback-card']}>
            <form onSubmit={handleSubmit} className={styles['beta-feedback-form']}>
              {/* Section 1: About your child */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section1.title')}
                </h2>

                <div className={styles['beta-feedback-field']} data-field="childAge">
                  <label className={styles['beta-feedback-label']} id="childAge-label">
                    {renderRequiredLabel('section1.age')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="childAge-label"
                  >
                    {['5–6', '7–8', '9–10', '11–12'].map(age => (
                      <label
                        key={age}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`childAge-${age}`}
                      >
                        <input
                          type="radio"
                          id={`childAge-${age}`}
                          name="childAge"
                          value={age}
                          checked={formData.childAge === age}
                          onChange={e =>
                            handleInputChange('childAge', e.target.value)
                          }
                          aria-describedby={`childAge-label`}
                        />
                        <span>{age}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.childAge && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.childAge}
                    </span>
                  )}
                </div>

                <div className={styles['beta-feedback-field']} data-field="scenarios">
                  <label className={styles['beta-feedback-label']} id="scenarios-label">
                    {renderRequiredLabel('section1.scenarios.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-checkbox-group']}
                    role="group"
                    aria-labelledby="scenarios-label"
                  >
                    {['police', 'fire', 'ambulance', 'notSure'].map(
                      scenario => (
                        <label
                          key={scenario}
                          className={styles['beta-feedback-checkbox-label']}
                          htmlFor={`scenario-${scenario}`}
                        >
                          <input
                            type="checkbox"
                            id={`scenario-${scenario}`}
                            name={`scenario-${scenario}`}
                            checked={formData.scenarios.includes(scenario)}
                            onChange={() => handleScenarioToggle(scenario)}
                            aria-describedby="scenarios-label"
                          />
                          <span>{t(`section1.scenarios.${scenario}`)}</span>
                        </label>
                      )
                    )}
                  </div>
                  {fieldErrors.scenarios && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.scenarios}
                    </span>
                  )}
                </div>
              </section>

              {/* Section 2: Experience */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section2.title')}
                </h2>

                <div className={styles['beta-feedback-field']}>
                  <label className={styles['beta-feedback-label']} id="ease-label">
                    {t('section2.ease.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-scale']}
                    role="radiogroup"
                    aria-labelledby="ease-label"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <label
                        key={num}
                        className={styles['beta-feedback-scale-option']}
                        htmlFor={`ease-${num}`}
                      >
                        <input
                          type="radio"
                          id={`ease-${num}`}
                          name="easeOfUnderstanding"
                          value={num}
                          checked={formData.easeOfUnderstanding === num}
                          onChange={e =>
                            handleInputChange(
                              'easeOfUnderstanding',
                              parseInt(e.target.value)
                            )
                          }
                          aria-describedby="ease-label"
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles['beta-feedback-scale-labels']}>
                    <span>{t('section2.ease.1')}</span>
                    <span>{t('section2.ease.5')}</span>
                  </div>
                </div>

                <div className={styles['beta-feedback-field']} data-field="childFeelings">
                  <label className={styles['beta-feedback-label']} id="feelings-label">
                    {renderRequiredLabel('section2.feelings.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="feelings-label"
                  >
                    {[
                      'calm',
                      'littleNervous',
                      'nervousThenCalmer',
                      'overwhelmed',
                    ].map(feeling => (
                      <label
                        key={feeling}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`feeling-${feeling}`}
                      >
                        <input
                          type="radio"
                          id={`feeling-${feeling}`}
                          name="childFeelings"
                          value={feeling}
                          checked={formData.childFeelings === feeling}
                          onChange={e =>
                            handleInputChange('childFeelings', e.target.value)
                          }
                          aria-describedby="feelings-label"
                        />
                        <span>{t(`section2.feelings.${feeling}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.childFeelings && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.childFeelings}
                    </span>
                  )}
                </div>

                <div className={styles['beta-feedback-field']}>
                  <label
                    className={styles['beta-feedback-label']}
                    htmlFor="uncomfortable"
                  >
                    {t('section2.uncomfortable')}
                  </label>
                  <textarea
                    id="uncomfortable"
                    className={styles['beta-feedback-textarea']}
                    value={formData.uncomfortable}
                    onChange={e =>
                      handleInputChange('uncomfortable', e.target.value)
                    }
                    placeholder={t('optional')}
                  />
                </div>
              </section>

              {/* Section 3: Safety & Trust */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section3.title')}
                </h2>

                <div className={styles['beta-feedback-field']}>
                  <label className={styles['beta-feedback-label']} id="safety-label">
                    {t('section3.safety.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-scale']}
                    role="radiogroup"
                    aria-labelledby="safety-label"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <label
                        key={num}
                        className={styles['beta-feedback-scale-option']}
                        htmlFor={`safety-${num}`}
                      >
                        <input
                          type="radio"
                          id={`safety-${num}`}
                          name="safetyRating"
                          value={num}
                          checked={formData.safetyRating === num}
                          onChange={e =>
                            handleInputChange(
                              'safetyRating',
                              parseInt(e.target.value)
                            )
                          }
                          aria-describedby="safety-label"
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles['beta-feedback-scale-labels']}>
                    <span>{t('section3.safety.1')}</span>
                    <span>{t('section3.safety.5')}</span>
                  </div>
                </div>

                <div
                  className={styles['beta-feedback-field']}
                  data-field="practiceClarity"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="practiceClarity-label"
                  >
                    {renderRequiredLabel('section3.practiceClarity.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="practiceClarity-label"
                  >
                    {['veryClear', 'mostlyClear', 'notClear'].map(clarity => (
                      <label
                        key={clarity}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`practiceClarity-${clarity}`}
                      >
                        <input
                          type="radio"
                          id={`practiceClarity-${clarity}`}
                          name="practiceClarity"
                          value={clarity}
                          checked={formData.practiceClarity === clarity}
                          onChange={e =>
                            handleInputChange('practiceClarity', e.target.value)
                          }
                          aria-describedby="practiceClarity-label"
                        />
                        <span>{t(`section3.practiceClarity.${clarity}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.practiceClarity && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.practiceClarity}
                    </span>
                  )}
                </div>
              </section>

              {/* Section 4: Value */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section4.title')}
                </h2>

                <div className={styles['beta-feedback-field']} data-field="usefulness">
                  <label className={styles['beta-feedback-label']} id="usefulness-label">
                    {renderRequiredLabel('section4.usefulness.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="usefulness-label"
                  >
                    {['veryUseful', 'somewhatUseful', 'notVeryUseful'].map(
                      usefulness => (
                        <label
                          key={usefulness}
                          className={styles['beta-feedback-radio-label']}
                          htmlFor={`usefulness-${usefulness}`}
                        >
                          <input
                            type="radio"
                            id={`usefulness-${usefulness}`}
                            name="usefulness"
                            value={usefulness}
                            checked={formData.usefulness === usefulness}
                            onChange={e =>
                              handleInputChange('usefulness', e.target.value)
                            }
                            aria-describedby="usefulness-label"
                          />
                          <span>{t(`section4.usefulness.${usefulness}`)}</span>
                        </label>
                      )
                    )}
                  </div>
                  {fieldErrors.usefulness && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.usefulness}
                    </span>
                  )}
                </div>

                <div className={styles['beta-feedback-field']} data-field="wouldUseAgain">
                  <label className={styles['beta-feedback-label']} id="useAgain-label">
                    {renderRequiredLabel('section4.useAgain.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="useAgain-label"
                  >
                    {['yes', 'maybe', 'no'].map(useAgain => (
                      <label
                        key={useAgain}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`useAgain-${useAgain}`}
                      >
                        <input
                          type="radio"
                          id={`useAgain-${useAgain}`}
                          name="wouldUseAgain"
                          value={useAgain}
                          checked={formData.wouldUseAgain === useAgain}
                          onChange={e =>
                            handleInputChange('wouldUseAgain', e.target.value)
                          }
                          aria-describedby="useAgain-label"
                        />
                        <span>{t(`section4.useAgain.${useAgain}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.wouldUseAgain && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.wouldUseAgain}
                    </span>
                  )}
                </div>

                <div className={styles['beta-feedback-field']} data-field="willingToPay">
                  <label className={styles['beta-feedback-label']} id="willingToPay-label">
                    {renderRequiredLabel('section4.willingToPay.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="willingToPay-label"
                  >
                    {['yes', 'maybe', 'no'].map(wtp => (
                      <label
                        key={wtp}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`willingToPay-${wtp}`}
                      >
                        <input
                          type="radio"
                          id={`willingToPay-${wtp}`}
                          name="willingToPay"
                          value={wtp}
                          checked={formData.willingToPay === wtp}
                          onChange={e =>
                            handleInputChange('willingToPay', e.target.value)
                          }
                          aria-describedby="willingToPay-label"
                        />
                        <span>{t(`section4.willingToPay.${wtp}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.willingToPay && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.willingToPay}
                    </span>
                  )}
                </div>
              </section>

              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section5.nps.label')}
                </h2>
                <div className={styles['beta-feedback-field']}>
                  <label className={styles['beta-feedback-label']} id="nps-label">
                    {t('section5.nps.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-nps-scale']}
                    role="radiogroup"
                    aria-labelledby="nps-label"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <label
                        key={num}
                        className={styles['beta-feedback-nps-option']}
                        htmlFor={`nps-${num}`}
                      >
                        <input
                          type="radio"
                          id={`nps-${num}`}
                          name="npsScore"
                          value={num}
                          checked={formData.npsScore === num}
                          onChange={e =>
                            handleInputChange(
                              'npsScore',
                              parseInt(e.target.value)
                            )
                          }
                          aria-describedby="nps-label"
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles['beta-feedback-nps-labels']}>
                    <span>{t('section5.nps.0')}</span>
                    <span>{t('section5.nps.10')}</span>
                  </div>
                </div>
              </section>

              {/* Open feedback */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section5.openFeedback')}
                </h2>

                <div className={styles['beta-feedback-field']}>
                  <label className={styles['beta-feedback-label']} htmlFor="likedMost">
                    {t('section5.likedMost')}
                  </label>
                  <textarea
                    id="likedMost"
                    className={styles['beta-feedback-textarea']}
                    value={formData.likedMost}
                    onChange={e =>
                      handleInputChange('likedMost', e.target.value)
                    }
                    placeholder={t('optional')}
                  />
                </div>

                <div className={styles['beta-feedback-field']}>
                  <label className={styles['beta-feedback-label']} htmlFor="improveFirst">
                    {t('section5.improveFirst')}
                  </label>
                  <textarea
                    id="improveFirst"
                    className={styles['beta-feedback-textarea']}
                    value={formData.improveFirst}
                    onChange={e =>
                      handleInputChange('improveFirst', e.target.value)
                    }
                    placeholder={t('optional')}
                  />
                </div>

                <div className={styles['beta-feedback-field']}>
                  <label className={styles['beta-feedback-label']} id="contact-label">
                    {t('section5.contact.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="contact-label"
                  >
                    <label
                      className={styles['beta-feedback-radio-label']}
                      htmlFor="contact-yes"
                    >
                      <input
                        type="radio"
                        id="contact-yes"
                        name="contactOptIn"
                        value="yes"
                        checked={formData.contactOptIn}
                        onChange={() => handleInputChange('contactOptIn', true)}
                      />
                      <span>{t('section5.contact.yes')}</span>
                    </label>
                    <label
                      className={styles['beta-feedback-radio-label']}
                      htmlFor="contact-no"
                    >
                      <input
                        type="radio"
                        id="contact-no"
                        name="contactOptIn"
                        value="no"
                        checked={!formData.contactOptIn}
                        onChange={() =>
                          handleInputChange('contactOptIn', false)
                        }
                      />
                      <span>{t('section5.contact.no')}</span>
                    </label>
                  </div>
                </div>

                {formData.contactOptIn && (
                  <div
                    className={styles['beta-feedback-field']}
                    data-field="contactEmail"
                  >
                    <label
                      className={styles['beta-feedback-label']}
                      htmlFor="contactEmail"
                    >
                      {t('section5.email')}
                    </label>
                    <input
                      type="text"
                      id="contactEmail"
                      className={styles['beta-feedback-input']}
                      value={formData.contactEmail}
                      onChange={e =>
                        handleInputChange('contactEmail', e.target.value)
                      }
                      placeholder={t('optional')}
                    />
                    {fieldErrors.contactEmail && (
                      <span className={styles['beta-feedback-error']}>
                        {fieldErrors.contactEmail}
                      </span>
                    )}
                  </div>
                )}
              </section>

              <div className={styles['beta-feedback-submit']}>
                <CartoonButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('submitting') : t('submit')}
                </CartoonButton>
              </div>
            </form>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
