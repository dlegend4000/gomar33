# Backend Setup for ElevenLabs Voice Control

This backend uses Firebase Functions to process voice commands via ElevenLabs API.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/functions
npm install
```

### 2. Set Up ElevenLabs API Key

Set your ElevenLabs API key in Firebase Functions config:

```bash
firebase functions:config:set elevenlabs.api_key="YOUR_ELEVENLABS_API_KEY"
```

Or if using environment variables (Firebase Functions v2+):

```bash
firebase functions:secrets:set ELEVENLABS_API_KEY
```

### 3. Build the Functions

```bash
cd backend/functions
npm run build
```

### 4. Deploy Functions

From the project root:

```bash
firebase deploy --only functions
```

Or deploy a specific function:

```bash
firebase deploy --only functions:processVoiceCommand
```

### 5. Local Development

To test functions locally:

```bash
cd backend/functions
npm run serve
```

This will start the Firebase emulator. The functions will be available at:
- `http://localhost:5001/gomar33-cc75d/us-central1/processVoiceCommand`

## API Endpoints

### `processVoiceCommand`

Processes voice audio and returns tool calls for audio control.

**Request:**
```json
{
  "audioData": "base64-encoded-audio",
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "toolCalls": [
    {
      "name": "adjust_tempo",
      "arguments": { "rate": 1.25 }
    }
  ],
  "transcript": "make it faster"
}
```

### `transcribeVoice`

Simple transcription endpoint (fallback).

**Request:**
```json
{
  "audioData": "base64-encoded-audio"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": "transcribed text"
}
```

## Available Tools

The agent can call these tools:

- `adjust_tempo` - Change playback speed (rate: 0.5-2.0)
- `adjust_pitch` - Change pitch (pitch: 0.5-2.0)
- `play_audio` - Start playback
- `pause_audio` - Pause playback
- `seek_audio` - Jump to time (time: seconds)

## Notes

- The current implementation uses simple text parsing as a fallback
- For full agent functionality, integrate with ElevenLabs Conversational AI API
- Audio is expected in WebM format with Opus codec
- Make sure CORS is properly configured for your frontend domain

