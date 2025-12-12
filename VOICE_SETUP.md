# Voice Control Setup Guide

This guide will help you set up ElevenLabs voice control for your audio player.

## Prerequisites

1. ElevenLabs API key (get one from https://elevenlabs.io)
2. Firebase project set up
3. Node.js 18+ installed

## Step 1: Install Backend Dependencies

```bash
cd backend/functions
npm install
cd ../..
```

## Step 2: Configure ElevenLabs API Key

Set your ElevenLabs API key in Firebase Functions:

```bash
firebase functions:config:set elevenlabs.api_key="YOUR_ELEVENLABS_API_KEY"
```

Or for Firebase Functions v2+ (using secrets):

```bash
firebase functions:secrets:set ELEVENLABS_API_KEY
```

Then update `backend/functions/src/index.ts` to use the secret:

```typescript
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || functions.config().elevenlabs?.api_key;
```

## Step 3: Build and Deploy Functions

```bash
npm run deploy:functions
```

Or deploy everything:

```bash
npm run deploy:all
```

## Step 4: Test Locally (Optional)

To test functions locally before deploying:

```bash
npm run functions:serve
```

This starts the Firebase emulator. Update the API URL in `src/hooks/useVoiceControl.ts` to use `http://localhost:5001/...` for local testing.

## Step 5: Use Voice Control

1. Upload an audio file
2. Click the microphone button to start voice control
3. Speak commands like:
   - "Play" or "Start" - Start playback
   - "Pause" or "Stop" - Pause playback
   - "Faster" or "Speed up" - Increase tempo
   - "Slower" - Decrease tempo
   - "Higher pitch" - Increase pitch
   - "Lower pitch" - Decrease pitch

## Troubleshooting

### Microphone Permission
Make sure your browser has permission to access the microphone.

### API Errors
- Check that your ElevenLabs API key is correctly set
- Verify the function is deployed: `firebase functions:list`
- Check function logs: `firebase functions:log`

### CORS Issues
The backend includes CORS handling. If you still see CORS errors, check:
- The function URL is correct
- The function is deployed and accessible
- Your Firebase project ID matches in the URL

## Advanced: Using ElevenLabs Conversational AI

For better command recognition, integrate with ElevenLabs Conversational AI API:

1. Create an agent in ElevenLabs dashboard
2. Configure tools in the agent settings
3. Update `backend/functions/src/index.ts` to use the agent API
4. Use the agent ID in your function calls

See the ElevenLabs documentation for the latest API structure.

