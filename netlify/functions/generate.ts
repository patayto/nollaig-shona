import type { Handler } from '@netlify/functions';
import { generateSecretSanta, validateAssignments } from '../../src/secretSanta.js';
import { validateUKPhone } from '../../src/smsDistribution.js';
import type { Person } from '../../src/types.js';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { people } = JSON.parse(event.body || '{}');

    // Validate input
    if (!Array.isArray(people) || people.length < 2) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'At least 2 people are required'
        })
      };
    }

    // Validate people structure
    for (const person of people) {
      if (!person.name || !person.phone) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Each person must have a name and phone number'
          })
        };
      }

      if (!validateUKPhone(person.phone)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Invalid UK phone number for ${person.name}. Use format: +447XXXXXXXXX`
          })
        };
      }
    }

    // Add IDs if not present
    const peopleWithIds: Person[] = people.map((p: Partial<Person>, index: number) => ({
      id: p.id || `person-${index}`,
      name: p.name!,
      phone: p.phone!
    }));

    // Generate assignments
    const assignments = generateSecretSanta({ people: peopleWithIds });

    // Validate assignments
    const validation = validateAssignments(assignments);
    if (!validation.valid) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to generate valid assignments',
          details: validation.errors
        })
      };
    }

    // Return full assignments to client (client will handle display/SMS)
    const assignmentData = assignments.map(a => ({
      gifter: {
        id: a.gifter.id,
        name: a.gifter.name,
        phone: a.gifter.phone
      },
      recipient: {
        id: a.recipient.id,
        name: a.recipient.name,
        phone: a.recipient.phone
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        assignmentsCount: assignments.length,
        assignments: assignmentData
      })
    };

  } catch (error) {
    console.error('Error generating Secret Santa:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    };
  }
};
