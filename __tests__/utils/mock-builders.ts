/**
 * Mock Builders
 * Utilities for constructing complex mock objects
 */

import { vi } from 'vitest';
import { createMockDocumentReference, createMockFirestoreTransaction } from '../mocks/firestore';

/**
 * Builds a mock Firestore conversation repository
 */
export function buildMockConversationRepository() {
  return {
    getConversation: vi.fn(),
    createConversation: vi.fn(),
    updateConversation: vi.fn(),
    markAsCharged: vi.fn(),
  };
}

/**
 * Builds a mock Firestore user repository
 */
export function buildMockUserRepository() {
  return {
    getUser: vi.fn(),
    updateCredits: vi.fn(),
    incrementCredits: vi.fn(),
    decrementCredits: vi.fn(),
  };
}

/**
 * Builds a mock token verifier
 */
export function buildMockTokenVerifier() {
  return {
    verify: vi.fn(),
    decode: vi.fn(),
  };
}

/**
 * Builds a mock ownership validator
 */
export function buildMockOwnershipValidator() {
  return {
    validate: vi.fn(),
    isOwner: vi.fn(),
  };
}

/**
 * Builds a mock duration calculator
 */
export function buildMockDurationCalculator() {
  return {
    calculate: vi.fn(),
    calculateInSeconds: vi.fn(),
  };
}

/**
 * Builds a mock charge eligibility checker
 */
export function buildMockChargeEligibilityChecker() {
  return {
    isEligible: vi.fn(),
    shouldCharge: vi.fn(),
  };
}

/**
 * Builds a mock credit transaction executor
 */
export function buildMockCreditTransactionExecutor() {
  return {
    deductCredit: vi.fn(),
    execute: vi.fn(),
  };
}

/**
 * Builds a complete mock service container
 */
export function buildMockServiceContainer() {
  return {
    conversationRepository: buildMockConversationRepository(),
    userRepository: buildMockUserRepository(),
    tokenVerifier: buildMockTokenVerifier(),
    ownershipValidator: buildMockOwnershipValidator(),
    durationCalculator: buildMockDurationCalculator(),
    chargeEligibilityChecker: buildMockChargeEligibilityChecker(),
    creditTransactionExecutor: buildMockCreditTransactionExecutor(),
  };
}

/**
 * Configures a mock conversation repository with test data
 */
export function configureConversationRepositoryWithData(
  repository: any,
  conversationId: string,
  conversationData: any
) {
  repository.getConversation.mockResolvedValue({
    id: conversationId,
    ...conversationData,
  });
  return repository;
}

/**
 * Configures a mock user repository with test data
 */
export function configureUserRepositoryWithData(
  repository: any,
  userId: string,
  userData: any
) {
  repository.getUser.mockResolvedValue({
    id: userId,
    ...userData,
  });
  return repository;
}

/**
 * Configures a mock token verifier to succeed
 */
export function configureTokenVerifierSuccess(
  verifier: any,
  decodedToken: any
) {
  verifier.verify.mockResolvedValue(decodedToken);
  verifier.decode.mockReturnValue(decodedToken);
  return verifier;
}

/**
 * Configures a mock token verifier to fail
 */
export function configureTokenVerifierFailure(
  verifier: any,
  error: Error
) {
  verifier.verify.mockRejectedValue(error);
  return verifier;
}

/**
 * Configures a mock ownership validator to allow access
 */
export function configureOwnershipValidatorAllow(
  validator: any
) {
  validator.validate.mockResolvedValue(true);
  validator.isOwner.mockReturnValue(true);
  return validator;
}

/**
 * Configures a mock ownership validator to deny access
 */
export function configureOwnershipValidatorDeny(
  validator: any
) {
  validator.validate.mockRejectedValue(new Error('Not authorized'));
  validator.isOwner.mockReturnValue(false);
  return validator;
}

/**
 * Configures a mock duration calculator
 */
export function configureDurationCalculator(
  calculator: any,
  startDate: Date,
  endDate: Date,
  expectedSeconds: number
) {
  calculator.calculateInSeconds.mockReturnValue(expectedSeconds);
  calculator.calculate.mockReturnValue({
    start: startDate,
    end: endDate,
    seconds: expectedSeconds,
  });
  return calculator;
}

/**
 * Configures a mock charge eligibility checker
 */
export function configureChargeEligibilityChecker(
  checker: any,
  isEligible: boolean
) {
  checker.isEligible.mockReturnValue(isEligible);
  checker.shouldCharge.mockReturnValue(isEligible);
  return checker;
}

/**
 * Configures a mock credit transaction executor to succeed
 */
export function configureCreditTransactionExecutorSuccess(
  executor: any,
  newCredits: number
) {
  executor.deductCredit.mockResolvedValue({
    success: true,
    newCredits,
    charged: true,
  });
  executor.execute.mockResolvedValue({
    success: true,
    newCredits,
    charged: true,
  });
  return executor;
}

/**
 * Configures a mock credit transaction executor to fail
 */
export function configureCreditTransactionExecutorFailure(
  executor: any,
  error: Error
) {
  executor.deductCredit.mockRejectedValue(error);
  executor.execute.mockRejectedValue(error);
  return executor;
}
