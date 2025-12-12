# Gemini Lyria RealTime Music Generation Setup

This guide will help you set up the Gemini Lyria RealTime music generation feature in your app.

## Prerequisites

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create or sign in to your Google account
   - Generate a new API key
   - Copy the API key

2. **Enable Lyria RealTime API**
   - The Lyria RealTime model is experimental and requires access to the v1alpha API
   - Make sure your API key has access to experimental models

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important:** Never commit your `.env` file to version control. It's already in `.gitignore`.

### 2. Start the Development Server

```bash
npm run dev
```

## How It Works

1. **Speech to Text**: Hold the spacebar and speak. Your speech is converted to text using the Web Speech API.

2. **Text to Music**: The transcript is automatically sent to Gemini's Lyria RealTime model as a prompt to generate music.

3. **Real-time Streaming**: Music is generated in real-time and streamed back via WebSocket.

4. **Audio Playback**: The generated audio chunks are decoded and played using the Web Audio API.

## Usage

### Basic Flow

1. Sign in to your app
2. Hold the spacebar and describe the music you want
   - Examples:
     - "Minimal techno with deep bass"
     - "Upbeat piano jazz"
     - "Calm acoustic guitar meditation"
3. Release the spacebar when done
4. The music will start generating and playing automatically

### Prompt Tips

The Lyria model responds well to:

- **Instruments**: "Piano", "Acoustic Guitar", "Synthesizer", "Drums"
- **Genres**: "Jazz", "Techno", "Classical", "Hip Hop", "Ambient"
- **Moods**: "Upbeat", "Calm", "Energetic", "Melancholic", "Dreamy"
- **Descriptions**: "with deep bass", "sparse percussion", "atmospheric synths"

### Advanced Configuration

You can modify the music generation parameters in [SpeechRecognition.tsx](src/components/SpeechRecognition.tsx):

```typescript
updateConfig({
  bpm: 120,           // Beats per minute (60-200)
  temperature: 1.0,   // Randomness (0.0-3.0)
  density: 0.7,       // Note density (0.0-1.0)
  brightness: 0.6,    // Tonal quality (0.0-1.0)
  guidance: 4.0,      // Prompt adherence (0.0-6.0)
});
```

## Architecture

### Files Created

- **[src/services/geminiMusic.ts](src/services/geminiMusic.ts)**: Core service for Gemini WebSocket connection and audio handling
- **[src/hooks/useGeminiMusic.ts](src/hooks/useGeminiMusic.ts)**: React hook for easy integration
- **[src/components/SpeechRecognition.tsx](src/components/SpeechRecognition.tsx)**: Updated to integrate speech-to-music

### Key Features

- ✅ Real-time WebSocket connection to Gemini
- ✅ Automatic audio buffering and playback
- ✅ Dynamic prompt updates
- ✅ Error handling and status indicators
- ✅ Clean disconnection and resource cleanup

## Troubleshooting

### "Gemini API key is required" Error

Make sure:
1. You created a `.env` file
2. You added `VITE_GEMINI_API_KEY=your_key`
3. You restarted the dev server after adding the env variable

### No Audio Playing

1. Check browser console for errors
2. Ensure your browser supports Web Audio API
3. Check that audio isn't muted in your browser
4. Try a different browser (Chrome/Edge recommended)

### Music Quality Issues

- Try adjusting the `guidance` parameter (higher = more adherence to prompt)
- Use more descriptive prompts
- Experiment with different `temperature` values

### Connection Errors

- Verify your API key is correct
- Check your internet connection
- Ensure you have access to the v1alpha API

## API Limits

- Check Google's [pricing page](https://ai.google.dev/pricing) for current limits
- Monitor your usage in [Google AI Studio](https://aistudio.google.com/)

## Learn More

- [Lyria RealTime Documentation](https://ai.google.dev/gemini-api/docs/music-generation)
- [Prompt DJ Demo](https://aistudio.google.com/apps/bundled/promptdj)
- [Google Gemini Cookbook](https://github.com/google-gemini/cookbook)
