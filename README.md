# 🎅 Nollaig Shona - Secret Santa Generator

A web-based Secret Santa gift exchange organizer with automated SMS distribution for UK mobile numbers.

## Features

- **Web UI**: Easy-to-use interface for managing participants
- **Smart Algorithm**: Ensures each person:
  - Is a gifter exactly once (Rule A)
  - Is a recipient exactly once (Rule B)
  - Is never assigned to themselves (Rule C)
- **SMS Distribution**: Automatically sends assignments via text message using Twilio
- **Privacy First**: Each participant only knows who they're buying for
- **UK Mobile Support**: Validates and sends to UK phone numbers (+447XXXXXXXXX format)

## Requirements

- Node.js 18+
- npm or yarn
- Twilio account (for SMS sending)

## Installation

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+44XXXXXXXXXX
```

### Getting Twilio Credentials

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Get a UK phone number from the Twilio console
3. Find your Account SID and Auth Token in the Twilio console dashboard
4. Add these to your `.env` file

## Usage

### Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The app will be available at `http://localhost:3000`

### Using the Web Interface

1. Open `http://localhost:3000` in your browser
2. Add participants by clicking "Add Person"
3. Enter each person's name and UK mobile number (format: +447XXXXXXXXX)
4. Choose whether to send SMS notifications:
   - **Checked**: Sends SMS to all participants immediately
   - **Unchecked**: Shows assignments on screen (for testing)
5. Click "Generate Secret Santa Assignments"

### Phone Number Format

UK mobile numbers must be in international format:
- Format: `+447XXXXXXXXX`
- Example: `+447700900123`

## API Endpoints

### `POST /api/generate`

Generate Secret Santa assignments and optionally send via SMS.

**Request Body:**
```json
{
  "people": [
    {
      "name": "Alice",
      "phone": "+447700900001"
    },
    {
      "name": "Bob",
      "phone": "+447700900002"
    }
  ],
  "sendSMS": true
}
```

**Response (with SMS):**
```json
{
  "success": true,
  "assignmentsCount": 2,
  "smsDistribution": {
    "success": true,
    "results": [
      { "name": "Alice", "status": "sent" },
      { "name": "Bob", "status": "sent" }
    ]
  }
}
```

**Response (without SMS):**
```json
{
  "success": true,
  "assignmentsCount": 2,
  "assignments": [
    { "gifter": "Alice", "recipient": "Bob" },
    { "gifter": "Bob", "recipient": "Alice" }
  ]
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## How It Works

### Algorithm

The Secret Santa generator uses a randomized derangement algorithm:

1. Creates a shuffled copy of the participants list
2. Attempts to pair each person (in original order) with a shuffled recipient
3. Validates that no one is assigned to themselves
4. Validates any exclusion rules (future feature)
5. Retries up to 1000 times if constraints aren't met

This ensures a valid "derangement" where everyone gives and receives exactly once, and no one is matched with themselves.

### SMS Distribution

When SMS distribution is enabled:

1. Assignments are generated using the algorithm
2. For each assignment, Twilio sends an SMS to the gifter's phone
3. The message contains only the recipient's name (keeping the secret!)
4. Results are reported back showing success/failure for each message

**Example SMS:**
```
🎅 Secret Santa Alert! 🎁

Hello Alice!

You are the Secret Santa for: Bob

Keep it secret, keep it safe! 🤫
```

## Security Considerations

- Never commit your `.env` file (it's in `.gitignore`)
- Keep your Twilio credentials secure
- The server doesn't store assignments after sending
- Consider using environment variable management for production

## Project Structure

```
nollaig-shona/
├── src/
│   ├── index.ts              # Express server and API
│   ├── types.ts              # TypeScript type definitions
│   ├── secretSanta.ts        # Core algorithm
│   ├── smsDistribution.ts    # Twilio SMS service
│   └── secretSanta.test.ts   # Unit tests
├── public/
│   └── index.html            # Web UI
├── package.json
├── tsconfig.json
├── .env                      # Your configuration (not in repo)
└── README.md
```

## Troubleshooting

### SMS Not Sending

- Check that your `.env` file has correct Twilio credentials
- Verify your Twilio account has sufficient balance
- Ensure phone numbers are in correct UK format (+447XXXXXXXXX)
- Check Twilio console for error logs

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.
