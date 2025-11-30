import type { Person, Assignment, SecretSantaConfig } from './types.js';

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Checks if an assignment violates any constraints
 */
function isValidAssignment(
  gifter: Person,
  recipient: Person,
  exclusions?: Array<{ person1Id: string; person2Id: string }>
): boolean {
  // Rule C: No self-assignment
  if (gifter.id === recipient.id) {
    return false;
  }

  // Check exclusions
  if (exclusions) {
    for (const exclusion of exclusions) {
      if (
        (gifter.id === exclusion.person1Id && recipient.id === exclusion.person2Id) ||
        (gifter.id === exclusion.person2Id && recipient.id === exclusion.person1Id)
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generates Secret Santa assignments ensuring each person is both a gifter and recipient exactly once
 * and no one is assigned to themselves.
 *
 * Uses a randomized algorithm with backtracking to find a valid derangement.
 */
export function generateSecretSanta(config: SecretSantaConfig): Assignment[] {
  const { people, exclusions } = config;

  if (people.length < 2) {
    throw new Error('At least 2 people are required for Secret Santa');
  }

  // Validate unique IDs
  const ids = new Set(people.map(p => p.id));
  if (ids.size !== people.length) {
    throw new Error('All people must have unique IDs');
  }

  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const gifters = [...people];
    const recipients = shuffle([...people]);
    const assignments: Assignment[] = [];
    let valid = true;

    for (let i = 0; i < gifters.length; i++) {
      const gifter = gifters[i];
      const recipient = recipients[i];

      if (!isValidAssignment(gifter, recipient, exclusions)) {
        valid = false;
        break;
      }

      assignments.push({ gifter, recipient });
    }

    if (valid) {
      return assignments;
    }
  }

  throw new Error(
    'Failed to generate valid Secret Santa assignments after ' + maxAttempts +
    ' attempts. This may happen with small groups and many exclusions.'
  );
}

/**
 * Validates that a set of assignments meets all Secret Santa requirements
 */
export function validateAssignments(assignments: Assignment[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const gifterIds = new Set<string>();
  const recipientIds = new Set<string>();

  for (const assignment of assignments) {
    const { gifter, recipient } = assignment;

    // Rule C: No self-assignment
    if (gifter.id === recipient.id) {
      errors.push(`Invalid: ${gifter.name} is assigned to themselves`);
    }

    // Track gifters and recipients for Rules A and B
    if (gifterIds.has(gifter.id)) {
      errors.push(`Invalid: ${gifter.name} appears as gifter more than once`);
    }
    gifterIds.add(gifter.id);

    if (recipientIds.has(recipient.id)) {
      errors.push(`Invalid: ${recipient.name} appears as recipient more than once`);
    }
    recipientIds.add(recipient.id);
  }

  // Rule A: Each person must be a gifter exactly once
  // Rule B: Each person must be a recipient exactly once
  if (gifterIds.size !== assignments.length) {
    errors.push('Invalid: Not all people are assigned as gifters exactly once');
  }

  if (recipientIds.size !== assignments.length) {
    errors.push('Invalid: Not all people are assigned as recipients exactly once');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
