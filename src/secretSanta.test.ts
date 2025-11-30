import { describe, it, expect } from 'vitest';
import { generateSecretSanta, validateAssignments } from './secretSanta.js';
import type { Person } from './types.js';

describe('Secret Santa Generator', () => {
  const createPeople = (count: number): Person[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `person-${i}`,
      name: `Person ${i + 1}`,
      phone: `+4477${String(i).padStart(8, '0')}`
    }));
  };

  describe('generateSecretSanta', () => {
    it('should generate assignments for valid input', () => {
      const people = createPeople(5);
      const assignments = generateSecretSanta({ people });

      expect(assignments).toHaveLength(5);
    });

    it('should ensure each person is a gifter exactly once', () => {
      const people = createPeople(5);
      const assignments = generateSecretSanta({ people });

      const gifterIds = assignments.map(a => a.gifter.id);
      const uniqueGifters = new Set(gifterIds);

      expect(uniqueGifters.size).toBe(5);
      expect(gifterIds.length).toBe(5);
    });

    it('should ensure each person is a recipient exactly once', () => {
      const people = createPeople(5);
      const assignments = generateSecretSanta({ people });

      const recipientIds = assignments.map(a => a.recipient.id);
      const uniqueRecipients = new Set(recipientIds);

      expect(uniqueRecipients.size).toBe(5);
      expect(recipientIds.length).toBe(5);
    });

    it('should ensure no person is assigned to themselves', () => {
      const people = createPeople(5);
      const assignments = generateSecretSanta({ people });

      for (const assignment of assignments) {
        expect(assignment.gifter.id).not.toBe(assignment.recipient.id);
      }
    });

    it('should throw error for less than 2 people', () => {
      const people = createPeople(1);

      expect(() => generateSecretSanta({ people })).toThrow('At least 2 people are required');
    });

    it('should throw error for duplicate IDs', () => {
      const people: Person[] = [
        { id: 'person-1', name: 'Alice', phone: '+447700000001' },
        { id: 'person-1', name: 'Bob', phone: '+447700000002' }
      ];

      expect(() => generateSecretSanta({ people })).toThrow('unique IDs');
    });

    it('should respect exclusions', () => {
      const people = createPeople(4);
      const exclusions = [
        { person1Id: 'person-0', person2Id: 'person-1' }
      ];

      const assignments = generateSecretSanta({ people, exclusions });

      // Check that person-0 is not assigned to person-1 and vice versa
      const assignment0 = assignments.find(a => a.gifter.id === 'person-0');
      const assignment1 = assignments.find(a => a.gifter.id === 'person-1');

      expect(assignment0?.recipient.id).not.toBe('person-1');
      expect(assignment1?.recipient.id).not.toBe('person-0');
    });

    it('should work with exactly 2 people', () => {
      const people = createPeople(2);
      const assignments = generateSecretSanta({ people });

      expect(assignments).toHaveLength(2);
      expect(assignments[0].gifter.id).toBe('person-0');
      expect(assignments[0].recipient.id).toBe('person-1');
      expect(assignments[1].gifter.id).toBe('person-1');
      expect(assignments[1].recipient.id).toBe('person-0');
    });

    it('should work with large groups', () => {
      const people = createPeople(100);
      const assignments = generateSecretSanta({ people });

      expect(assignments).toHaveLength(100);

      const validation = validateAssignments(assignments);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('validateAssignments', () => {
    it('should validate correct assignments', () => {
      const people = createPeople(3);
      const assignments = generateSecretSanta({ people });
      const validation = validateAssignments(assignments);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect self-assignment', () => {
      const people = createPeople(3);
      const invalidAssignments = [
        { gifter: people[0], recipient: people[0] }, // Self-assignment
        { gifter: people[1], recipient: people[2] },
        { gifter: people[2], recipient: people[1] }
      ];

      const validation = validateAssignments(invalidAssignments);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('assigned to themselves');
    });

    it('should detect duplicate gifters', () => {
      const people = createPeople(3);
      const invalidAssignments = [
        { gifter: people[0], recipient: people[1] },
        { gifter: people[0], recipient: people[2] }, // Duplicate gifter
        { gifter: people[2], recipient: people[1] }
      ];

      const validation = validateAssignments(invalidAssignments);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('more than once'))).toBe(true);
    });

    it('should detect duplicate recipients', () => {
      const people = createPeople(3);
      const invalidAssignments = [
        { gifter: people[0], recipient: people[1] },
        { gifter: people[1], recipient: people[2] },
        { gifter: people[2], recipient: people[1] } // Duplicate recipient
      ];

      const validation = validateAssignments(invalidAssignments);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('more than once'))).toBe(true);
    });
  });
});
