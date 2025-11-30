/**
 * Charge Eligibility Checker
 * Pure function for determining if a conversation should be charged
 */

// Business rule: Charge only if duration > 30 seconds
const MINIMUM_DURATION_FOR_CHARGE_SECONDS = 30;

export interface ChargeEligibilityResult {
  isEligible: boolean;
  reason?: 'duration_below_threshold' | 'already_charged' | 'eligible';
  durationSeconds: number;
}

/**
 * Determines if a conversation is eligible for credit deduction
 *
 * Business Rules:
 * - Duration must be > 30 seconds (exclusive)
 * - Conversation must not already be charged
 *
 * @param durationSeconds - Duration of conversation in seconds
 * @param alreadyCharged - Whether the conversation has already been charged
 * @returns Object with eligibility status and reason
 */
export function isEligibleForCharge(
  durationSeconds: number,
  alreadyCharged: boolean = false
): ChargeEligibilityResult {
  // Check if already charged
  if (alreadyCharged) {
    return {
      isEligible: false,
      reason: 'already_charged',
      durationSeconds,
    };
  }

  // Check if duration meets minimum threshold
  if (durationSeconds <= MINIMUM_DURATION_FOR_CHARGE_SECONDS) {
    return {
      isEligible: false,
      reason: 'duration_below_threshold',
      durationSeconds,
    };
  }

  return {
    isEligible: true,
    reason: 'eligible',
    durationSeconds,
  };
}

/**
 * Simple boolean check for charge eligibility
 *
 * @param durationSeconds - Duration of conversation in seconds
 * @param alreadyCharged - Whether the conversation has already been charged
 * @returns true if eligible for charge, false otherwise
 */
export function shouldCharge(
  durationSeconds: number,
  alreadyCharged: boolean = false
): boolean {
  return isEligibleForCharge(durationSeconds, alreadyCharged).isEligible;
}

/**
 * Gets the minimum duration required for charging
 *
 * @returns Minimum duration in seconds
 */
export function getMinimumDurationForCharge(): number {
  return MINIMUM_DURATION_FOR_CHARGE_SECONDS;
}
