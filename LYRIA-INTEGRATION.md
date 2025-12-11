# Lyria RealTime Music Integration

This document explains how Lyria RealTime music generation is integrated into the Gomar33 voice-controlled music agent.

## Overview

The integration combines three key technologies:
1. **Gemini AI** - Interprets voice commands and generates music parameters
2. **Lyria RealTime API** - Generates live music audio streams
3. **Voice Input** - Captures user voice commands

## Architecture

```
Voice Command → Gemini AI → Music Parameters → Lyria API → Audio Playback
                 (Server)                       (Client)
```

### Server-Side (Node.js/Express)

Located in `server/`:

- **`server/index.ts`** - Express API endpoints
- **`server/geminiMusicAgent.ts`** - Gemini function calling agent
- **`src/lib/musicLogic.ts`** - Music logic and prompt generation

The server receives voice transcripts and uses Gemini to interpret them into structured music parameters:

```typescript
{
  weighted_prompts: [{ text: "Chill and relaxed atmosphere", weight: 1.0 }],
  config: { bpm: 75, density: 0.5, brightness: 0.6 },
  requires_reset: false
}
```

### Client-Side (React)

Located in `src/`:

- **`src/lib/lyriaMusic.ts`** - Lyria session manager
- **`src/lib/lyriaAudio.ts`** - Audio encoding/decoding utilities
- **`src/components/MusicAgentDemo.tsx`** - UI component

The client connects to Lyria's WebSocket API and streams audio in real-time.

## How It Works

### 1. First Command (Starting Music)

```typescript
// User says: "start something chill"

// Server interprets command
const result = await interpretFirstCommand("start something chill");
// Returns: { weighted_prompts: [...], config: { bpm: 75 } }

// Client starts Lyria session
await lyriaHelper.setWeightedPrompts(result.weighted_prompts, result.config);
await lyriaHelper.play();
// Music starts playing!
```

### 2. Modification Commands (Changing Music)

```typescript
// User says: "add some drums"

// Server interprets modification
const result = await interpretModifyCommand({
  transcript: "add some drums",
  currentBpm: 75,
  currentPrompts: ["Chill and relaxed atmosphere"]
});
// Returns: { weighted_prompts: [{ text: "Dynamic drums...", weight: 1.0 }] }

// Client updates prompts without stopping
await lyriaHelper.setWeightedPrompts([...existing, ...new]);
// Drums smoothly added to existing music!
```

### 3. Reset Requirements

Some changes require restarting the music session:
- BPM changes
- Scale changes

```typescript
if (result.requires_reset) {
  lyriaHelper.stop();
  await lyriaHelper.setWeightedPrompts(newPrompts, newConfig);
  await lyriaHelper.play();
}
```

## Key Features

### Weighted Prompts

Prompts have weights (0.1-3.0) that control their influence:

```typescript
{
  text: "Guitar with rich harmonic content",
  weight: 1.5  // More prominent
}
```

### Music Configuration

Lyria supports various parameters:

```typescript
{
  bpm: 120,              // 60-200
  density: 0.7,          // 0.0-1.0 (sparse to busy)
  brightness: 0.5,       // 0.0-1.0 (dark to bright)
  temperature: 1.1,      // 0.0-3.0 (creativity)
  scale: "C major / A minor"
}
```

### Content Safety

Lyria filters inappropriate prompts:

```typescript
lyriaHelper.addEventListener("filtered-prompt", (e) => {
  console.log("Filtered:", e.detail.text);
  console.log("Reason:", e.detail.filteredReason);
});
```

## File Structure

```
gomar33/
├── server/
│   ├── index.ts                  # Express API
│   └── geminiMusicAgent.ts       # Gemini agent with function calling
├── src/
│   ├── lib/
│   │   ├── lyriaMusic.ts         # Lyria session manager
│   │   ├── lyriaAudio.ts         # Audio utilities
│   │   ├── musicLogic.ts         # Instruments/genres/moods database
│   │   └── api.ts                # API client
│   └── components/
│       └── MusicAgentDemo.tsx    # Main UI component
└── promptdj-midi/                # Google's reference example
```

## API Endpoints

### POST /api/interpret/first
Start music with first command

```json
{
  "transcript": "start something chill"
}
```

Response:
```json
{
  "success": true,
  "result": {
    "weighted_prompts": [{ "text": "Chill and relaxed atmosphere", "weight": 1.0 }],
    "config": { "bpm": 75, "temperature": 1.1 },
    "requires_reset": false
  }
}
```

### POST /api/interpret/modify
Modify existing music

```json
{
  "transcript": "add some drums",
  "currentBpm": 75,
  "currentPrompts": ["Chill and relaxed atmosphere"]
}
```

## Environment Variables

Required in `.env`:

```bash
# Server-side (for Gemini AI)
GOOGLE_API_KEY=your_api_key_here

# Client-side (for Lyria RealTime)
VITE_GOOGLE_API_KEY=your_api_key_here
```

## Usage Example

```typescript
import { LyriaMusicHelper } from "@/lib/lyriaMusic";

// Initialize
const lyria = new LyriaMusicHelper(apiKey);

// Listen for events
lyria.addEventListener("playback-state-changed", (e) => {
  console.log("State:", e.detail); // "playing", "paused", "stopped", "loading"
});

lyria.addEventListener("error", (e) => {
  console.error("Error:", e.detail);
});

// Start music
await lyria.setWeightedPrompts([
  { text: "Chill and relaxed atmosphere", weight: 1.0 }
], { bpm: 75 });
await lyria.play();

// Modify music
await lyria.setWeightedPrompts([
  { text: "Chill and relaxed atmosphere", weight: 1.0 },
  { text: "Dynamic drums with crisp hits", weight: 1.2 }
]);

// Control playback
lyria.pause();
lyria.play();
lyria.stop();
```

## Audio Processing

Lyria streams audio as base64-encoded PCM:
- Sample rate: 48kHz
- Channels: 2 (stereo)
- Format: 16-bit PCM

The `lyriaAudio.ts` module handles:
1. Base64 decoding
2. PCM to Float32 conversion
3. AudioBuffer creation
4. Seamless buffer scheduling

## Prompt Database

The system includes 100+ pre-defined prompts:

- **Instruments**: guitar, drums, synth, piano, etc.
- **Genres**: techno, jazz, hip hop, classical, etc.
- **Moods**: chill, energetic, dark, bright, etc.

See `src/lib/musicLogic.ts` for the full database.

## Troubleshooting

### No audio playing
- Check that `VITE_GOOGLE_API_KEY` is set
- Check browser console for errors
- Ensure user interaction before calling `.play()` (browser autoplay policy)

### Connection errors
- Verify API key is valid
- Check network connectivity
- Look for filtered prompts (content safety)

### Choppy audio
- Check buffer time (default 2s)
- Monitor `playback-state-changed` events
- Ensure stable internet connection

## Credits

Based on Google's PromptDJ MIDI example:
- Example code: `promptdj-midi/`
- Reference: [Google GenAI SDK](https://github.com/google-gemini/generative-ai-js)

## Next Steps

Potential enhancements:
- Voice activity detection for hands-free operation
- Visual audio analyzer
- Preset saving/loading
- Multi-user jam sessions
- MIDI controller support
