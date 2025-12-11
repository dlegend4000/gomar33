# 🎵 Gomar33 Music Agent - Setup Guide

Your push-to-talk is now fully integrated with the Gemini Music Agent!

## ✅ What's Integrated

- **Push-to-Talk**: Spacebar to record voice commands
- **Speech Recognition**: Web Speech API for voice-to-text
- **Gemini AI Agent**: Interprets natural language into music parameters
- **Lyria-Ready**: Outputs WeightedPrompts and MusicConfig for Lyria RealTime API

## 🚀 Quick Start

### 1. Set Up Environment

Create a `.env` file in the project root:

```bash
GOOGLE_API_KEY=your_google_api_key_here
PORT=3001
NODE_ENV=development
```

Get your API key: https://aistudio.google.com/app/apikey

### 2. Start Development Servers

```bash
npm run dev
```

This starts:
- **Frontend** (Vite) on http://localhost:5173
- **Backend** (Express) on http://localhost:3001

### 3. Try It Out!

1. Sign in to the app
2. **Hold SPACEBAR** to record
3. Say a command like:
   - "start something chill and slow"
   - "add some drums"
   - "make it faster"
   - "add a guitar"
4. Release SPACEBAR
5. Watch the console for Lyria-ready output!

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. User holds SPACEBAR                                 │
│     ↓                                                   │
│  2. SpeechRecognition captures voice                    │
│     ↓                                                   │
│  3. Transcript sent to App.tsx                          │
│     ↓                                                   │
│  4. App calls interpretFirstCommand() or                │
│     interpretModifyCommand()                            │
│     ↓                                                   │
│  5. API client sends to Express backend                 │
│     ↓                                                   │
│  6. Gemini AI interprets command using                  │
│     musicLogic.ts functions                             │
│     ↓                                                   │
│  7. Returns WeightedPrompts + MusicConfig               │
│     ↓                                                   │
│  8. App displays results and logs for Lyria             │
└─────────────────────────────────────────────────────────┘
```

## 📝 Example Output

When you say **"start something chill with piano"**, the system outputs:

```javascript
{
  weighted_prompts: [
    { text: "Chill and relaxed atmosphere", weight: 1.0 },
    { text: "Piano with expressive dynamic range", weight: 1.0 }
  ],
  config: {
    bpm: 75,
    temperature: 1.1
  },
  requires_reset: false
}
```

These `weighted_prompts` are ready to send directly to Lyria RealTime API!

## 🎵 Voice Commands You Can Try

### Starting Music (First Command)
- "start something chill and slow"
- "techno beat at 128 bpm"
- "slow jazz with piano"
- "dark ambient with synth pads"
- "upbeat funk with drums and bass"

### Modifying Music (After Starting)
- "add some drums"
- "add a guitar"
- "make it faster"
- "make it slower"
- "make it darker"
- "make it brighter"
- "increase the density"
- "make it more minimal"
- "double the tempo"

## 🔌 Connecting to Lyria RealTime

The integration outputs `WeightedPrompt[]` and `MusicConfig` that are ready for Lyria. To connect:

### 1. Install Lyria SDK

```bash
npm install @google/generative-ai
```

### 2. Create Lyria Client (example)

```typescript
import { genai } from '@google/generative-ai';

const client = genai.Client({ 
  http_options: { api_version: 'v1alpha' } 
});

// Connect to Lyria
const session = await client.aio.live.music.connect({
  model: 'models/lyria-realtime-exp'
});

// Use the weighted prompts from your voice command
await session.set_weighted_prompts({
  prompts: weightedPrompts // From the music agent!
});

// Set the config
await session.set_music_generation_config({
  config: {
    bpm: currentBpm,
    temperature: 1.1,
    // ... other config from result
  }
});

// Start playing
await session.play();
```

### 3. Handle Audio Stream

```typescript
// Receive audio chunks
for await (const message of session.receive()) {
  const audioData = message.server_content.audio_chunks[0].data;
  // Play audio using Web Audio API or Howler.js
}
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app with music state management |
| `src/components/SpeechRecognition.tsx` | Push-to-talk voice capture |
| `src/lib/api.ts` | Frontend API client |
| `src/lib/musicLogic.ts` | Music knowledge base (instruments, genres, moods) |
| `server/index.ts` | Express API server |
| `server/geminiMusicAgent.ts` | Gemini AI integration |

## 🎨 UI Features

The app now shows:
- ✅ Voice-powered orb that reacts to your voice
- ✅ Real-time transcript display
- ✅ Processing status
- ✅ Current BPM
- ✅ Active weighted prompts
- ✅ Error messages

## 🔧 Configuration

### Music Config Parameters (from Lyria API)

```typescript
interface MusicConfig {
  bpm?: number;              // 60-200, beats per minute
  density?: number;          // 0.0-1.0, how busy the music is
  brightness?: number;       // 0.0-1.0, tonal quality (dark to bright)
  temperature?: number;      // 0.0-3.0, default 1.1
  guidance?: number;         // 0.0-6.0, default 4.0
  scale?: string;            // Musical scale (C_MAJOR_A_MINOR, etc.)
  mute_bass?: boolean;       // Reduce bass output
  mute_drums?: boolean;      // Reduce drums output
  only_bass_and_drums?: boolean;  // Only output bass and drums
  music_generation_mode?: "QUALITY" | "DIVERSITY" | "VOCALIZATION";
}
```

### Weighted Prompts

```typescript
interface WeightedPrompt {
  text: string;    // The prompt text
  weight: number;  // 0.1-3.0 (cannot be 0, default 1.0)
}
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify `GOOGLE_API_KEY` is set in `.env`
- Run `npm install` to ensure all dependencies are installed

### Voice recognition not working
- Make sure you're using Chrome/Edge (best Web Speech API support)
- Allow microphone permissions when prompted
- Check browser console for errors

### Commands not being interpreted
- Check backend logs: `npm run dev:server`
- Verify API is running: http://localhost:3001/api/health
- Check browser console for API errors

### TypeScript errors
- Run `npm run typecheck` to see all errors
- Make sure all files are saved

## 📚 Next Steps

1. **Connect to Lyria RealTime API**
   - Set up WebSocket connection
   - Stream audio output
   - Handle real-time modifications

2. **Add Audio Playback**
   - Integrate Web Audio API
   - Or use Howler.js for easier audio handling
   - Add volume controls and visualization

3. **Enhance UI**
   - Add visual feedback for music generation
   - Show waveform of generated audio
   - Add preset buttons for common commands

4. **Add More Features**
   - Save/load music sessions
   - Export generated music
   - Share with others
   - Add MIDI input support

## 🎵 Music Prompt Examples

Based on Lyria API documentation, here are effective prompts:

**Instruments**: 303 Acid Bass, 808 Hip Hop Beat, Accordion, Guitar, Drums, Synth Pads, Rhodes Piano, Trumpet, Cello, Sitar, etc.

**Genres**: Techno, Jazz, Hip Hop, Ambient, Rock, Blues, Funk, Reggae, Classical, EDM, etc.

**Moods**: Chill, Dark, Energetic, Dreamy, Bright, Mysterious, Upbeat, Melancholic, etc.

**Effects**: Echo, Reverb, Distortion, Psychedelic, Lo-fi, Glitchy Effects, etc.

## ✨ Features

- ✅ Push-to-talk with spacebar
- ✅ Real-time speech recognition
- ✅ Gemini AI command interpretation
- ✅ Lyria-ready weighted prompts
- ✅ Music state management
- ✅ BPM and config tracking
- ✅ Error handling
- ✅ TypeScript throughout
- ✅ Hot reload for dev
- ✅ Production build support

## 🎉 You're Ready!

Your push-to-talk is now fully integrated with the music agent. The system:

1. ✅ Captures your voice with spacebar
2. ✅ Converts speech to text
3. ✅ Interprets commands using Gemini AI
4. ✅ Outputs Lyria-ready WeightedPrompts
5. ✅ Tracks music state (BPM, prompts, config)
6. ✅ Displays everything in the UI

**Next**: Connect to Lyria RealTime API to actually generate music! 🎵

---

For more details, check:
- `src/lib/musicLogic.ts` - Full list of instruments, genres, moods
- Lyria API Docs: https://ai.google.dev/api/music-generation
- Gemini API Docs: https://ai.google.dev/gemini-api/docs

