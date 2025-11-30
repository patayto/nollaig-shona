/**
 * Represents a person participating in the Secret Santa exchange
 */
export interface Person {
  /** Unique identifier for the person */
  id: string;
  /** Person's display name */
  name: string;
  /** UK mobile phone number for SMS delivery (e.g., +447XXXXXXXXX) */
  phone: string;
}

/**
 * Represents a Secret Santa gift assignment
 */
export interface Assignment {
  /** The person giving the gift */
  gifter: Person;
  /** The person receiving the gift */
  recipient: Person;
}

/**
 * Configuration for Secret Santa generation
 */
export interface SecretSantaConfig {
  /** List of participants */
  people: Person[];
  /** Optional exclusions - pairs who should not be matched */
  exclusions?: Array<{ person1Id: string; person2Id: string }>;
}

/**
 * SMS configuration for sending notifications via Twilio
 */
export interface SMSConfig {
  /** Twilio Account SID */
  accountSid: string;
  /** Twilio Auth Token */
  authToken: string;
  /** Twilio phone number (sender) */
  fromNumber: string;
}

/**
 * Options for distributing Secret Santa assignments
 */
export interface DistributionOptions {
  /** SMS configuration */
  smsConfig?: SMSConfig;
  /** Custom SMS template function */
  templateFn?: (gifter: Person, recipient: Person) => string;
}
