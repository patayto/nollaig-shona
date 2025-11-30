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
4. Click "Generate Secret Santa Assignments"
5. After generation, choose one of two actions:
   - **🔍 Reveal Assignments (Testing)**: Shows all assignments on screen for verification
   - **📱 Send via SMS**: Sends assignments to participants via Twilio

This two-step process allows you to verify assignments before sending them out.

### Phone Number Format

UK mobile numbers must be in international format:
- Format: `+447XXXXXXXXX`
- Example: `+447700900123`

## API Endpoints

### `POST /api/generate`

Generate Secret Santa assignments.

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
  ]
}
```

**Response:**
```json
{
  "success": true,
  "assignmentsCount": 2,
  "assignments": [
    {
      "gifter": { "id": "person-0", "name": "Alice", "phone": "+447700900001" },
      "recipient": { "id": "person-1", "name": "Bob", "phone": "+447700900002" }
    },
    {
      "gifter": { "id": "person-1", "name": "Bob", "phone": "+447700900002" },
      "recipient": { "id": "person-0", "name": "Alice", "phone": "+447700900001" }
    }
  ]
}
```

### `POST /api/send-sms`

Send Secret Santa assignments via SMS using Twilio.

**Request Body:**
```json
{
  "assignments": [
    {
      "gifter": { "id": "person-0", "name": "Alice", "phone": "+447700900001" },
      "recipient": { "id": "person-1", "name": "Bob", "phone": "+447700900002" }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "smsDistribution": {
    "success": true,
    "results": [
      { "name": "Alice", "status": "sent" }
    ]
  }
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
│   ├── types.ts              # TypeScript type definitions
│   ├── secretSanta.ts        # Core algorithm
│   ├── smsDistribution.ts    # Twilio SMS service
│   └── secretSanta.test.ts   # Unit tests
├── netlify/
│   └── functions/
│       ├── generate.ts       # Serverless function for generating assignments
│       └── send-sms.ts       # Serverless function for sending SMS
├── public/
│   └── index.html            # Web UI
├── package.json
├── tsconfig.json
├── netlify.toml              # Netlify configuration
└── README.md
```

## Deployment to Netlify

This app is configured for easy deployment to Netlify using serverless functions.

### Prerequisites

1. A [Netlify account](https://netlify.com) (free tier available)
2. A [Twilio account](https://www.twilio.com/try-twilio) with UK phone number
3. Your GitHub repository pushed to GitHub

### Deploy Steps

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your `nollaig-shona` repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. **Configure Environment Variables**

   In Site Settings → Environment Variables, add these:

   | Variable | Value |
   |----------|-------|
   | `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
   | `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
   | `TWILIO_PHONE_NUMBER` | Your Twilio UK phone number (e.g., +447700900123) |

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your app
   - You'll get a URL like `https://nollaig-shona.netlify.app`

### Automatic Deployments

Once set up, Netlify will automatically deploy:
- Every push to `main` branch → Production
- Every pull request → Deploy preview

### Custom Domain (Optional)

In Site Settings → Domain management, you can add a custom domain.

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

### Netlify Deployment Issues

- Check build logs in Netlify dashboard (Site Settings → Deploys)
- Ensure all environment variables are set (Site Settings → Environment Variables)
- Verify Node.js version compatibility (>=18.x)
- Check that Netlify Functions are building correctly (netlify/functions/)

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.
