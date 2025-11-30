/**
 * Conversation Fixtures
 * Provides factory functions for creating test conversations
 */

export interface TestConversation {
  id: string;
  userId: string;
  ageTier: string;
  situation: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'abandoned';
  charged?: boolean;
}

/**
 * Creates a basic conversation
 */
export function createConversation(overrides?: Partial<TestConversation>): TestConversation {
  const now = new Date();
  return {
    id: 'conv-123',
    userId: 'user-123',
    ageTier: '13-17',
    situation: 'Test situation',
    startedAt: now,
    status: 'active',
    charged: false,
    ...overrides,
  };
}

/**
 * Creates a conversation with 45 seconds duration (eligible for charge)
 */
export function createUnchargedConversation45Sec(overrides?: Partial<TestConversation>): TestConversation {
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 45000); // 45 seconds later
  return createConversation({
    startedAt,
    endedAt,
    status: 'completed',
    charged: false,
    ...overrides,
  });
}

/**
 * Creates a conversation with 30 seconds duration (not eligible for charge)
 */
export function createUnchargedConversation30Sec(overrides?: Partial<TestConversation>): TestConversation {
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 30000); // 30 seconds later
  return createConversation({
    startedAt,
    endedAt,
    status: 'completed',
    charged: false,
    ...overrides,
  });
}

/**
 * Creates a conversation with 15 seconds duration (not eligible for charge)
 */
export function createUnchargedConversation15Sec(overrides?: Partial<TestConversation>): TestConversation {
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 15000); // 15 seconds later
  return createConversation({
    startedAt,
    endedAt,
    status: 'completed',
    charged: false,
    ...overrides,
  });
}

/**
 * Creates an already charged conversation
 */
export function createChargedConversation(overrides?: Partial<TestConversation>): TestConversation {
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 45000); // 45 seconds
  return createConversation({
    startedAt,
    endedAt,
    status: 'completed',
    charged: true,
    ...overrides,
  });
}

/**
 * Creates a conversation with exact 31 seconds (boundary test)
 */
export function createUnchargedConversation31Sec(overrides?: Partial<TestConversation>): TestConversation {
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 31000); // 31 seconds
  return createConversation({
    startedAt,
    endedAt,
    status: 'completed',
    charged: false,
    ...overrides,
  });
}

/**
 * Creates a conversation with 0 seconds duration
 */
export function createUnchargedConversation0Sec(overrides?: Partial<TestConversation>): TestConversation {
  const startedAt = new Date();
  return createConversation({
    startedAt,
    endedAt: startedAt,
    status: 'completed',
    charged: false,
    ...overrides,
  });
}
