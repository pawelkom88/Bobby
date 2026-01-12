'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useBetaFeedback } from '@/hooks/mutations/useBetaFeedback';
import { ApiError } from '@/lib/api/errors';
import PageWrapper from './PageWrapper';
import CartoonButton from './CartoonButton';
import { BetaFeedbackSchema } from '@/lib/schemas/beta-feedback';
import { logger } from '@/lib/logger';
import styles from './BetaFeedbackForm.module.css';

const DEFAULT_FORM_DATA: BetaFeedbackData = {
  numberOfChildren: '',
  priorPractice: '',
  discoveryChannels: [],
  childFeelingsBefore: '',
  childFeelingsAfter: '',
  easeOfUnderstanding: 3,
  discomfortLevel: '',
  discomfortDetails: '',
  usefulness: '',
  confidenceChange: '',
  desiredScenarios: [],
  desiredScenariosOther: '',
  starterPriceFeedback: '',
  heroPriceFeedback: '',
  preferredPricingModel: '',
  npsScore: 5,
  recommendReason: '',
  interests: [],
  improveFirst: '',
  contactMethod: '',
  contactEmail: '',
  contactPhone: '',
};

interface BetaFeedbackData {
  // Section 1: Segmentation
  numberOfChildren: string;
  priorPractice: string;
  discoveryChannels: string[];

  // Section 2: Emotional Journey
  childFeelingsBefore: string;
  childFeelingsAfter: string;
  easeOfUnderstanding: number;
  discomfortLevel: string;
  discomfortDetails: string;

  // Section 3: Value Perception
  usefulness: string;
  confidenceChange: string;
  desiredScenarios: string[];
  desiredScenariosOther: string;

  // Section 4: Pricing Validation
  starterPriceFeedback: string;
  heroPriceFeedback: string;
  preferredPricingModel: string;

  // Section 5: Referral & NPS
  npsScore: number;
  recommendReason: string;
  interests: string[];

  // Section 6: Closing
  improveFirst: string;
  contactMethod: string;
  contactEmail: string;
  contactPhone: string;
}

const getFieldLabel = (
  fieldPath: string,
  t: (key: string) => string
): string => {
  const labelMap: Record<string, string> = {
    numberOfChildren: t('section1.numberOfChildren.label'),
    priorPractice: t('section1.priorPractice.label'),
    discoveryChannels: t('section1.discoveryChannels.label'),
    childFeelingsBefore: t('section2.feelingsBefore.label'),
    childFeelingsAfter: t('section2.feelingsAfter.label'),
    discomfortLevel: t('section2.discomfort.label'),
    discomfortDetails: t('section2.discomfortDetails'),
    usefulness: t('section3.usefulness.label'),
    confidenceChange: t('section3.confidenceChange.label'),
    starterPriceFeedback: t('section4.starterPack.label'),
    heroPriceFeedback: t('section4.heroPack.label'),
    preferredPricingModel: t('section4.preferredModel.label'),
    improveFirst: t('section6.improveFirst'),
    contactMethod: t('section6.contactMethod.label'),
    contactEmail: t('section6.email'),
    contactPhone: t('section6.phone'),
  };
  return labelMap[fieldPath] || fieldPath;
};

export default function BetaFeedbackForm() {
  const t = useTranslations('betaFeedbackForm');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const betaFeedbackMutation = useBetaFeedback();
  const isSubmitting = betaFeedbackMutation.isPending;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<BetaFeedbackData>(DEFAULT_FORM_DATA);
  const conversationId = searchParams.get('conversationId') ?? undefined;

  // todo Paw: refactor naming
  const handleInputChange = (field: keyof BetaFeedbackData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleCheckboxToggle = (
    field: 'discoveryChannels' | 'desiredScenarios' | 'interests',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderRequiredLabel = (labelKey: string) => (
    <>
      {t(labelKey)}
      <span className={styles['required-asterisk']} aria-label="required">
        *
      </span>
    </>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setFieldErrors({});

    const validationResult = BetaFeedbackSchema.safeParse(formData);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        const fieldPath = issue.path.join('.');
        let errorMessage = issue.message;

        switch (issue.message) {
          case 'Number of children is required':
            errorMessage = t('numberOfChildrenRequired');
            break;
          case 'Prior practice is required':
            errorMessage = t('priorPracticeRequired');
            break;
          case 'At least one discovery channel is required':
            errorMessage = t('discoveryChannelsRequired');
            break;
          case 'Child feelings before is required':
            errorMessage = t('childFeelingsBeforeRequired');
            break;
          case 'Child feelings after is required':
            errorMessage = t('childFeelingsAfterRequired');
            break;
          case 'Discomfort level is required':
            errorMessage = t('discomfortLevelRequired');
            break;
          case 'DISCOMFORT_DETAILS_REQUIRED':
            errorMessage = t('discomfortDetailsRequired');
            break;
          case 'Usefulness is required':
            errorMessage = t('usefulnessRequired');
            break;
          case 'Confidence change is required':
            errorMessage = t('confidenceChangeRequired');
            break;
          case 'Starter price feedback is required':
            errorMessage = t('starterPriceFeedbackRequired');
            break;
          case 'Hero price feedback is required':
            errorMessage = t('heroPriceFeedbackRequired');
            break;
          case 'Preferred pricing model is required':
            errorMessage = t('preferredPricingModelRequired');
            break;
          case 'Improvement suggestion is required':
            errorMessage = t('improveFirstRequired');
            break;
          case 'Contact preference is required':
            errorMessage = t('contactMethodRequired');
            break;
          case 'EMAIL_REQUIRED':
            errorMessage = t('emailRequired');
            break;
          case 'INVALID_EMAIL':
            errorMessage = t('invalidEmail');
            break;
          case 'PHONE_REQUIRED':
            errorMessage = t('phoneRequired');
            break;
        }

        errors[fieldPath] = errorMessage;
      });

      setFieldErrors(errors);

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

    try {
      betaFeedbackMutation.reset();
      await betaFeedbackMutation.mutateAsync({
        ...formData,
        conversationId,
      });
      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.data) {
        const errorData = error.data as { error?: string; message?: string };
        if (errorData.error === 'invalid-request' && errorData.message) {
          const [fieldPath, errorCode] = errorData.message.split(': ');
          setFieldErrors({});

          let errorMessage = errorData.message;
          switch (errorCode) {
            case 'EMAIL_REQUIRED':
              errorMessage = t('emailRequired');
              break;
            case 'INVALID_EMAIL':
              errorMessage = t('invalidEmail');
              break;
            case 'PHONE_REQUIRED':
              errorMessage = t('phoneRequired');
              break;
          }

          if (fieldPath) {
            setFieldErrors({ [fieldPath]: errorMessage });
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
          return;
        }
      }

      logger.error('Error submitting feedback:', error);
    }
  };

  if (isSubmitted) {
    return (
      <PageWrapper>
        <div className={styles['beta-feedback-success']}>
          <div className={styles['beta-feedback-success-content']}>
            <h1 className={styles['beta-feedback-success-title']}>
              {t('thankYou')}
            </h1>
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
          <p className={styles['beta-feedback-description']}>
            {t('description')}
          </p>
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
                  <strong>{getFieldLabel(fieldPath, t)}</strong>
                  <p className={styles['beta-feedback-error-paragraph']}>
                    {error}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
        {Object.keys(fieldErrors).length > 0 && <br />}

        <section className={styles['beta-feedback-section']}>
          <div className={styles['beta-feedback-card']}>
            <form
              onSubmit={handleSubmit}
              className={styles['beta-feedback-form']}
            >
              {/* Section 1: Segmentation */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section1.title')}
                </h2>

                {/* Q1: Number of children */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="numberOfChildren"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="numberOfChildren-label"
                  >
                    {renderRequiredLabel('section1.numberOfChildren.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="numberOfChildren-label"
                  >
                    {['1', '2', '3plus'].map(count => (
                      <label
                        key={count}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`numberOfChildren-${count}`}
                      >
                        <input
                          type="radio"
                          id={`numberOfChildren-${count}`}
                          name="numberOfChildren"
                          value={count}
                          checked={formData.numberOfChildren === count}
                          onChange={e =>
                            handleInputChange(
                              'numberOfChildren',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section1.numberOfChildren.${count}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.numberOfChildren && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.numberOfChildren}
                    </span>
                  )}
                </div>

                {/* Q2: Prior practice */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="priorPractice"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="priorPractice-label"
                  >
                    {renderRequiredLabel('section1.priorPractice.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="priorPractice-label"
                  >
                    {[
                      'school',
                      'home',
                      'appOrVideo',
                      'firstTime',
                      'notSure',
                    ].map(practice => (
                      <label
                        key={practice}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`priorPractice-${practice}`}
                      >
                        <input
                          type="radio"
                          id={`priorPractice-${practice}`}
                          name="priorPractice"
                          value={practice}
                          checked={formData.priorPractice === practice}
                          onChange={e =>
                            handleInputChange('priorPractice', e.target.value)
                          }
                        />
                        <span>{t(`section1.priorPractice.${practice}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.priorPractice && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.priorPractice}
                    </span>
                  )}
                </div>

                {/* Q3: Discovery channels */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="discoveryChannels"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="discoveryChannels-label"
                  >
                    {renderRequiredLabel('section1.discoveryChannels.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-checkbox-group']}
                    role="group"
                    aria-labelledby="discoveryChannels-label"
                  >
                    {[
                      'socialMedia',
                      'friendFamily',
                      'googleSearch',
                      'school',
                      'parentingBlog',
                      'news',
                      'other',
                    ].map(channel => (
                      <label
                        key={channel}
                        className={styles['beta-feedback-checkbox-label']}
                        htmlFor={`discoveryChannel-${channel}`}
                      >
                        <input
                          type="checkbox"
                          id={`discoveryChannel-${channel}`}
                          checked={formData.discoveryChannels.includes(channel)}
                          onChange={() =>
                            handleCheckboxToggle('discoveryChannels', channel)
                          }
                        />
                        <span>
                          {t(`section1.discoveryChannels.${channel}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.discoveryChannels && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.discoveryChannels}
                    </span>
                  )}
                </div>
              </section>

              {/* Section 2: Emotional Journey */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section2.title')}
                </h2>

                {/* Q4: Feelings before */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="childFeelingsBefore"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="feelingsBefore-label"
                  >
                    {renderRequiredLabel('section2.feelingsBefore.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="feelingsBefore-label"
                  >
                    {[
                      'excited',
                      'aBitNervous',
                      'reluctant',
                      'anxious',
                      'neutral',
                    ].map(feeling => (
                      <label
                        key={feeling}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`feelingsBefore-${feeling}`}
                      >
                        <input
                          type="radio"
                          id={`feelingsBefore-${feeling}`}
                          name="childFeelingsBefore"
                          value={feeling}
                          checked={formData.childFeelingsBefore === feeling}
                          onChange={e =>
                            handleInputChange(
                              'childFeelingsBefore',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section2.feelingsBefore.${feeling}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.childFeelingsBefore && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.childFeelingsBefore}
                    </span>
                  )}
                </div>

                {/* Q5: Feelings after */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="childFeelingsAfter"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="feelingsAfter-label"
                  >
                    {renderRequiredLabel('section2.feelingsAfter.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="feelingsAfter-label"
                  >
                    {[
                      'proudConfident',
                      'relieved',
                      'mixed',
                      'stillNervous',
                      'upset',
                    ].map(feeling => (
                      <label
                        key={feeling}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`feelingsAfter-${feeling}`}
                      >
                        <input
                          type="radio"
                          id={`feelingsAfter-${feeling}`}
                          name="childFeelingsAfter"
                          value={feeling}
                          checked={formData.childFeelingsAfter === feeling}
                          onChange={e =>
                            handleInputChange(
                              'childFeelingsAfter',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section2.feelingsAfter.${feeling}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.childFeelingsAfter && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.childFeelingsAfter}
                    </span>
                  )}
                </div>

                {/* Q6: Ease of understanding */}
                <div className={styles['beta-feedback-field']}>
                  <label
                    className={styles['beta-feedback-label']}
                    id="ease-label"
                  >
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

                {/* Q7: Discomfort level */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="discomfortLevel"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="discomfort-label"
                  >
                    {renderRequiredLabel('section2.discomfort.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="discomfort-label"
                  >
                    {[
                      'nothing',
                      'minorIssues',
                      'someConcerns',
                      'significantConcerns',
                    ].map(level => (
                      <label
                        key={level}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`discomfort-${level}`}
                      >
                        <input
                          type="radio"
                          id={`discomfort-${level}`}
                          name="discomfortLevel"
                          value={level}
                          checked={formData.discomfortLevel === level}
                          onChange={e =>
                            handleInputChange('discomfortLevel', e.target.value)
                          }
                        />
                        <span>{t(`section2.discomfort.${level}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.discomfortLevel && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.discomfortLevel}
                    </span>
                  )}
                </div>

                {/* Conditional: Discomfort details */}
                {(formData.discomfortLevel === 'someConcerns' ||
                  formData.discomfortLevel === 'significantConcerns') && (
                  <div
                    className={styles['beta-feedback-field']}
                    data-field="discomfortDetails"
                  >
                    <label
                      className={styles['beta-feedback-label']}
                      htmlFor="discomfortDetails"
                    >
                      {renderRequiredLabel('section2.discomfortDetails')}
                    </label>
                    <textarea
                      id="discomfortDetails"
                      className={styles['beta-feedback-textarea']}
                      value={formData.discomfortDetails}
                      onChange={e =>
                        handleInputChange('discomfortDetails', e.target.value)
                      }
                    />
                    {fieldErrors.discomfortDetails && (
                      <span className={styles['beta-feedback-error']}>
                        {fieldErrors.discomfortDetails}
                      </span>
                    )}
                  </div>
                )}
              </section>

              {/* Section 3: Value Perception */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section3.title')}
                </h2>

                {/* Q8: Usefulness */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="usefulness"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="usefulness-label"
                  >
                    {renderRequiredLabel('section3.usefulness.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="usefulness-label"
                  >
                    {[
                      'extremelyUseful',
                      'veryUseful',
                      'somewhatUseful',
                      'slightlyUseful',
                      'notUseful',
                    ].map(level => (
                      <label
                        key={level}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`usefulness-${level}`}
                      >
                        <input
                          type="radio"
                          id={`usefulness-${level}`}
                          name="usefulness"
                          value={level}
                          checked={formData.usefulness === level}
                          onChange={e =>
                            handleInputChange('usefulness', e.target.value)
                          }
                        />
                        <span>{t(`section3.usefulness.${level}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.usefulness && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.usefulness}
                    </span>
                  )}
                </div>

                {/* Q9: Confidence change */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="confidenceChange"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="confidenceChange-label"
                  >
                    {renderRequiredLabel('section3.confidenceChange.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="confidenceChange-label"
                  >
                    {[
                      'muchMore',
                      'somewhatMore',
                      'same',
                      'lessConfident',
                      'notSure',
                    ].map(level => (
                      <label
                        key={level}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`confidenceChange-${level}`}
                      >
                        <input
                          type="radio"
                          id={`confidenceChange-${level}`}
                          name="confidenceChange"
                          value={level}
                          checked={formData.confidenceChange === level}
                          onChange={e =>
                            handleInputChange(
                              'confidenceChange',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section3.confidenceChange.${level}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.confidenceChange && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.confidenceChange}
                    </span>
                  )}
                </div>

                {/* Q10: Desired scenarios */}
                <div className={styles['beta-feedback-field']}>
                  <label
                    className={styles['beta-feedback-label']}
                    id="desiredScenarios-label"
                  >
                    {t('section3.desiredScenarios.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-checkbox-group']}
                    role="group"
                    aria-labelledby="desiredScenarios-label"
                  >
                    {[
                      'medical',
                      'fire',
                      'breakIn',
                      'lostInPublic',
                      'carAccident',
                      'other',
                    ].map(scenario => (
                      <label
                        key={scenario}
                        className={styles['beta-feedback-checkbox-label']}
                        htmlFor={`desiredScenario-${scenario}`}
                      >
                        <input
                          type="checkbox"
                          id={`desiredScenario-${scenario}`}
                          checked={formData.desiredScenarios.includes(scenario)}
                          onChange={() =>
                            handleCheckboxToggle('desiredScenarios', scenario)
                          }
                        />
                        <span>
                          {t(`section3.desiredScenarios.${scenario}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Conditional: Other scenarios */}
                {formData.desiredScenarios.includes('other') && (
                  <div className={styles['beta-feedback-field']}>
                    <label
                      className={styles['beta-feedback-label']}
                      htmlFor="desiredScenariosOther"
                    >
                      {t('section3.desiredScenariosOther')}
                    </label>
                    <input
                      type="text"
                      id="desiredScenariosOther"
                      className={styles['beta-feedback-input']}
                      value={formData.desiredScenariosOther}
                      onChange={e =>
                        handleInputChange(
                          'desiredScenariosOther',
                          e.target.value
                        )
                      }
                      placeholder={t('optional')}
                    />
                  </div>
                )}
              </section>

              {/* Section 4: Pricing Validation */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section4.title')}
                </h2>
                <p className={styles['beta-feedback-intro']}>
                  {t('section4.pricingIntro')}
                </p>

                {/* Q11a: Starter pack pricing */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="starterPriceFeedback"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="starterPack-label"
                  >
                    {renderRequiredLabel('section4.starterPack.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="starterPack-label"
                  >
                    {[
                      'tooCheap',
                      'bargain',
                      'aboutRight',
                      'gettingExpensive',
                      'tooExpensive',
                    ].map(feedback => (
                      <label
                        key={feedback}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`starterPack-${feedback}`}
                      >
                        <input
                          type="radio"
                          id={`starterPack-${feedback}`}
                          name="starterPriceFeedback"
                          value={feedback}
                          checked={formData.starterPriceFeedback === feedback}
                          onChange={e =>
                            handleInputChange(
                              'starterPriceFeedback',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section4.starterPack.${feedback}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.starterPriceFeedback && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.starterPriceFeedback}
                    </span>
                  )}
                </div>

                {/* Q11b: Hero pack pricing */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="heroPriceFeedback"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="heroPack-label"
                  >
                    {renderRequiredLabel('section4.heroPack.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="heroPack-label"
                  >
                    {[
                      'tooCheap',
                      'bargain',
                      'aboutRight',
                      'gettingExpensive',
                      'tooExpensive',
                    ].map(feedback => (
                      <label
                        key={feedback}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`heroPack-${feedback}`}
                      >
                        <input
                          type="radio"
                          id={`heroPack-${feedback}`}
                          name="heroPriceFeedback"
                          value={feedback}
                          checked={formData.heroPriceFeedback === feedback}
                          onChange={e =>
                            handleInputChange(
                              'heroPriceFeedback',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section4.heroPack.${feedback}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.heroPriceFeedback && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.heroPriceFeedback}
                    </span>
                  )}
                </div>

                {/* Q12: Preferred pricing model */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="preferredPricingModel"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="preferredModel-label"
                  >
                    {renderRequiredLabel('section4.preferredModel.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="preferredModel-label"
                  >
                    {[
                      'payPerCall',
                      'smallPack',
                      'largerPack',
                      'monthlySubscription',
                      'annualSubscription',
                      'oneTimePurchase',
                    ].map(model => (
                      <label
                        key={model}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`preferredModel-${model}`}
                      >
                        <input
                          type="radio"
                          id={`preferredModel-${model}`}
                          name="preferredPricingModel"
                          value={model}
                          checked={formData.preferredPricingModel === model}
                          onChange={e =>
                            handleInputChange(
                              'preferredPricingModel',
                              e.target.value
                            )
                          }
                        />
                        <span>{t(`section4.preferredModel.${model}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.preferredPricingModel && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.preferredPricingModel}
                    </span>
                  )}
                </div>
              </section>

              {/* Section 5: Referral & NPS */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section5.title')}
                </h2>

                {/* Q13: NPS */}
                <div className={styles['beta-feedback-field']}>
                  <label
                    className={styles['beta-feedback-label']}
                    id="nps-label"
                  >
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

                {/* Q14: Recommend reason */}
                <div className={styles['beta-feedback-field']}>
                  <label
                    className={styles['beta-feedback-label']}
                    htmlFor="recommendReason"
                  >
                    {t('section5.recommendReason')}
                  </label>
                  <textarea
                    id="recommendReason"
                    className={styles['beta-feedback-textarea']}
                    value={formData.recommendReason}
                    onChange={e =>
                      handleInputChange('recommendReason', e.target.value)
                    }
                    placeholder={t('optional')}
                  />
                </div>

                {/* Q15: Interests */}
                <div className={styles['beta-feedback-field']}>
                  <label
                    className={styles['beta-feedback-label']}
                    id="interests-label"
                  >
                    {t('section5.interests.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-checkbox-group']}
                    role="group"
                    aria-labelledby="interests-label"
                  >
                    {[
                      'freeTrialToShare',
                      'earnForReferrals',
                      'earlyAccess',
                      'parentCommunity',
                      'schoolLicensing',
                      'none',
                    ].map(interest => (
                      <label
                        key={interest}
                        className={styles['beta-feedback-checkbox-label']}
                        htmlFor={`interest-${interest}`}
                      >
                        <input
                          type="checkbox"
                          id={`interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onChange={() =>
                            handleCheckboxToggle('interests', interest)
                          }
                        />
                        <span>{t(`section5.interests.${interest}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section 6: Final Thoughts */}
              <section className={styles['beta-feedback-section']}>
                <h2 className={styles['beta-feedback-section-title']}>
                  {t('section6.title')}
                </h2>

                {/* Q16: Improve first */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="improveFirst"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    htmlFor="improveFirst"
                  >
                    {renderRequiredLabel('section6.improveFirst')}
                  </label>
                  <textarea
                    id="improveFirst"
                    className={styles['beta-feedback-textarea']}
                    value={formData.improveFirst}
                    onChange={e =>
                      handleInputChange('improveFirst', e.target.value)
                    }
                  />
                  {fieldErrors.improveFirst && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.improveFirst}
                    </span>
                  )}
                </div>

                {/* Q17: Contact method */}
                <div
                  className={styles['beta-feedback-field']}
                  data-field="contactMethod"
                >
                  <label
                    className={styles['beta-feedback-label']}
                    id="contactMethod-label"
                  >
                    {renderRequiredLabel('section6.contactMethod.label')}
                  </label>
                  <div
                    className={styles['beta-feedback-radio-group']}
                    role="radiogroup"
                    aria-labelledby="contactMethod-label"
                  >
                    {['email', 'phone', 'no'].map(method => (
                      <label
                        key={method}
                        className={styles['beta-feedback-radio-label']}
                        htmlFor={`contactMethod-${method}`}
                      >
                        <input
                          type="radio"
                          id={`contactMethod-${method}`}
                          name="contactMethod"
                          value={method}
                          checked={formData.contactMethod === method}
                          onChange={e =>
                            handleInputChange('contactMethod', e.target.value)
                          }
                        />
                        <span>{t(`section6.contactMethod.${method}`)}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.contactMethod && (
                    <span className={styles['beta-feedback-error']}>
                      {fieldErrors.contactMethod}
                    </span>
                  )}
                </div>

                {/* Conditional: Email */}
                {formData.contactMethod === 'email' && (
                  <div
                    className={styles['beta-feedback-field']}
                    data-field="contactEmail"
                  >
                    <label
                      className={styles['beta-feedback-label']}
                      htmlFor="contactEmail"
                    >
                      {renderRequiredLabel('section6.email')}
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      className={styles['beta-feedback-input']}
                      value={formData.contactEmail}
                      onChange={e =>
                        handleInputChange('contactEmail', e.target.value)
                      }
                    />
                    {fieldErrors.contactEmail && (
                      <span className={styles['beta-feedback-error']}>
                        {fieldErrors.contactEmail}
                      </span>
                    )}
                  </div>
                )}

                {/* Conditional: Phone */}
                {formData.contactMethod === 'phone' && (
                  <div
                    className={styles['beta-feedback-field']}
                    data-field="contactPhone"
                  >
                    <label
                      className={styles['beta-feedback-label']}
                      htmlFor="contactPhone"
                    >
                      {renderRequiredLabel('section6.phone')}
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      className={styles['beta-feedback-input']}
                      value={formData.contactPhone}
                      onChange={e =>
                        handleInputChange('contactPhone', e.target.value)
                      }
                    />
                    {fieldErrors.contactPhone && (
                      <span className={styles['beta-feedback-error']}>
                        {fieldErrors.contactPhone}
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
