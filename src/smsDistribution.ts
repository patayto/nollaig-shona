import twilio from 'twilio';
import type { Assignment, SMSConfig } from './types.js';

/**
 * Default SMS template for Secret Santa notifications
 */
function defaultTemplate(gifterName: string, recipientName: string): string {
  return `🎅 Secret Santa Alert! 🎁\n\nHello ${gifterName}!\n\nYou are the Secret Santa for: ${recipientName}\n\nKeep it secret, keep it safe! 🤫`;
}

/**
 * Sends SMS notifications to all participants with their Secret Santa assignments
 */
export async function distributeViaSMS(
  assignments: Assignment[],
  config: SMSConfig,
  customTemplate?: (gifterName: string, recipientName: string) => string
): Promise<{ success: boolean; results: Array<{ name: string; status: string; error?: string }> }> {
  const client = twilio(config.accountSid, config.authToken);
  const template = customTemplate || defaultTemplate;
  const results: Array<{ name: string; status: string; error?: string }> = [];

  for (const assignment of assignments) {
    const { gifter, recipient } = assignment;
    const message = template(gifter.name, recipient.name);

    try {
      await client.messages.create({
        body: message,
        from: config.fromNumber,
        to: gifter.phone
      });

      results.push({
        name: gifter.name,
        status: 'sent'
      });
    } catch (error) {
      results.push({
        name: gifter.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const allSuccessful = results.every(r => r.status === 'sent');

  return {
    success: allSuccessful,
    results
  };
}

/**
 * Validates UK phone number format
 */
export function validateUKPhone(phone: string): boolean {
  // UK mobile numbers: +44 7XXX XXXXXX (with or without spaces)
  const ukMobilePattern = /^\+44\s?7\d{3}\s?\d{6}$/;
  return ukMobilePattern.test(phone.replace(/\s/g, ''));
}
