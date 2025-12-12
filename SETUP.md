# Setup Guide - Make Everything Functional

Follow these steps to get voice control working:

## 1. Install Backend Dependencies

```bash
cd backend/functions
npm install
cd ../..
```

## 2. Configure ElevenLabs API Key (Optional)

The system works with Web Speech API by default, but you can optionally configure ElevenLabs for better transcription.

### Option A: Using Firebase Functions Config (v1)
```bash
firebase functions:config:set elevenlabs.api_key="YOUR_ELEVENLABS_API_KEY"
```

### Option B: Using Environment Variables (Recommended)
Create a `.env` file in `backend/functions/`:
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Or set it when deploying:
```bash
firebase functions:config:set elevenlabs.api_key="YOUR_ELEVENLABS_API_KEY"
```

## 3. Build Backend Functions

```bash
cd backend/functions
npm run build
cd ../..
```

## 4. Deploy Functions

```bash
npm run deploy:functions
```

Or deploy everything:
```bash
npm run deploy:all
```

## 5. Test Locally (Optional)

To test functions locally before deploying:

```bash
cd backend/functions
npm run serve
```

This starts the Firebase emulator. Update the API URL in `src/hooks/useVoiceControl.ts` to use `http://localhost:5001/...` for local testing.

## How It Works

1. **Voice Input**: Hold spacebar to speak
2. **Transcription**: Web Speech API transcribes your speech in real-time
3. **Command Processing**: Backend parses the transcript and extracts commands
4. **Audio Control**: Commands are executed (tempo, pitch, play/pause)

## Supported Voice Commands

- **Tempo**: "slow down the tempo", "speed it up", "faster", "slower"
- **Pitch**: "change my pitch", "higher pitch", "lower pitch"
- **Playback**: "play", "pause", "start", "stop"

## Troubleshooting

### Functions not deploying?
- Make sure you're logged into Firebase: `firebase login`
- Check your Firebase project: `firebase projects:list`
- Verify project ID in `.firebaserc`

### Voice commands not working?
- Check browser console for errors
- Verify microphone permissions are granted
- Check function logs: `firebase functions:log`
- Make sure functions are deployed: `firebase functions:list`

### API key issues?
- The system works without ElevenLabs API key (uses Web Speech API)
- If you want to use ElevenLabs, make sure the key is set correctly
- Check function logs for API key errors

