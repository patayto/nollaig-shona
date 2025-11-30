import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSecretSanta, validateAssignments } from './secretSanta.js';
import { distributeViaSMS, validateUKPhone } from './smsDistribution.js';
import type { Person, SMSConfig } from './types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Generate Secret Santa assignments
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { people } = req.body;

    // Validate input
    if (!Array.isArray(people) || people.length < 2) {
      return res.status(400).json({
        error: 'At least 2 people are required'
      });
    }

    // Validate people structure
    for (const person of people) {
      if (!person.name || !person.phone) {
        return res.status(400).json({
          error: 'Each person must have a name and phone number'
        });
      }

      if (!validateUKPhone(person.phone)) {
        return res.status(400).json({
          error: `Invalid UK phone number for ${person.name}. Use format: +447XXXXXXXXX`
        });
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
      return res.status(500).json({
        error: 'Failed to generate valid assignments',
        details: validation.errors
      });
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

    res.json({
      success: true,
      assignmentsCount: assignments.length,
      assignments: assignmentData
    });

  } catch (error) {
    console.error('Error generating Secret Santa:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Send SMS notifications for Secret Santa assignments
 */
app.post('/api/send-sms', async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        error: 'Assignments are required'
      });
    }

    const smsConfig: SMSConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_PHONE_NUMBER || ''
    };

    if (!smsConfig.accountSid || !smsConfig.authToken || !smsConfig.fromNumber) {
      return res.status(500).json({
        error: 'SMS configuration is incomplete. Check environment variables.'
      });
    }

    // Convert plain objects back to Assignment type
    const typedAssignments = assignments.map((a: any) => ({
      gifter: a.gifter as Person,
      recipient: a.recipient as Person
    }));

    const distribution = await distributeViaSMS(typedAssignments, smsConfig);

    res.json({
      success: true,
      smsDistribution: distribution
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎅 Secret Santa app running on http://localhost:${PORT}`);
});
