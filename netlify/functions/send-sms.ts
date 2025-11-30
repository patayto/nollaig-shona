import type { Handler } from '@netlify/functions';
import { distributeViaSMS } from '../../src/smsDistribution.js';
import type { Person, SMSConfig } from '../../src/types.js';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { assignments } = JSON.parse(event.body || '{}');

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Assignments are required'
        })
      };
    }

    const smsConfig: SMSConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_PHONE_NUMBER || ''
    };

    if (!smsConfig.accountSid || !smsConfig.authToken || !smsConfig.fromNumber) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'SMS configuration is incomplete. Check environment variables.'
        })
      };
    }

    // Convert plain objects back to Assignment type
    const typedAssignments = assignments.map((a: any) => ({
      gifter: a.gifter as Person,
      recipient: a.recipient as Person
    }));

    const distribution = await distributeViaSMS(typedAssignments, smsConfig);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        smsDistribution: distribution
      })
    };

  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    };
  }
};
