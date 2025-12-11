# Gemini Music Agent Integration Guide

## 🎵 Overview

Your Vite app now has a full-stack music agent powered by Google's Gemini AI! The integration includes:

- **Backend**: Express server with Gemini AI integration
- **Frontend**: React API client with hooks
- **Shared Logic**: Pure TypeScript music logic functions

## 📁 Project Structure

```
gomar33/
├── server/                      # Express backend
│   ├── index.ts                # API server with endpoints
│   └── geminiMusicAgent.ts     # Gemini AI integration
├── src/
│   ├── lib/
│   │   ├── musicLogic.ts       # Shared music logic (client & server)
│   │   └── api.ts              # Frontend API client
│   └── App.tsx                 # Your React app
├── env.template                # Environment variables template
├── tsconfig.server.json        # Backend TypeScript config
└── package.json                # Updated with new scripts
```

## 🚀 Getting Started

### 1. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp env.template .env
```

Edit `.env` and add your Google API key:

```env
GOOGLE_API_KEY=your_actual_google_api_key_here
PORT=3001
NODE_ENV=development
```

**Get your API key**: https://aistudio.google.com/app/apikey

### 2. Start the Development Servers

Run both frontend and backend concurrently:

```bash
npm run dev
```

This starts:

- **Vite dev server** on `http://localhost:5173` (frontend)
- **Express API server** on `http://localhost:3001` (backend)

Or run them separately:

```bash
npm run dev:client  # Frontend only
npm run dev:server  # Backend only
```

### 3. Test the API

Check if the backend is running:

```bash
curl http://localhost:3001/api/health
```

## 💻 Usage in Your React Components

### Basic Example

```typescript
import { interpretFirstCommand, interpretModifyCommand } from "@/lib/api";

function MusicPlayer() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentBpm, setCurrentBpm] = useState(120);
	const [prompts, setPrompts] = useState<string[]>([]);

	const handleVoiceCommand = async (transcript: string) => {
		try {
			if (!isPlaying) {
				// First command - start music
				const result = await interpretFirstCommand(transcript);

				console.log("Weighted prompts:", result.weighted_prompts);
				console.log("Config:", result.config);

				setCurrentBpm(result.config.bpm || 120);
				setPrompts(result.weighted_prompts.map((p) => p.text));
				setIsPlaying(true);
			} else {
				// Modify existing music
				const result = await interpretModifyCommand({
					transcript,
					currentBpm,
					currentPrompts: prompts,
				});

				if (result.requires_reset) {
					console.log("Music needs to be regenerated");
				}

				if (result.config.bpm) {
					setCurrentBpm(result.config.bpm);
				}

				// Add new prompts
				if (result.weighted_prompts.length > 0) {
					setPrompts([
						...prompts,
						...result.weighted_prompts.map((p) => p.text),
					]);
				}
			}
		} catch (error) {
			console.error("Failed to interpret command:", error);
		}
	};

	return (
		<div>
			<button onClick={() => handleVoiceCommand("start something chill")}>
				Start Music
			</button>
			<button onClick={() => handleVoiceCommand("add some drums")}>
				Add Drums
			</button>
		</div>
	);
}
```

### Using the React Hook

```typescript
import { useMusicAgent } from "@/lib/api";

function MusicControls() {
	const { interpretFirst, interpretModify, isLoading, error } = useMusicAgent();

	const startMusic = async () => {
		try {
			const result = await interpretFirst("start a techno beat at 128 bpm");
			console.log("Started:", result);
		} catch (err) {
			console.error("Error:", err);
		}
	};

	return (
		<div>
			{isLoading && <p>Processing...</p>}
			{error && <p>Error: {error}</p>}
			<button onClick={startMusic} disabled={isLoading}>
				Start Music
			</button>
		</div>
	);
}
```

## 🔌 API Endpoints

### Health Check

```
GET /api/health
```

### Interpret Voice Command

```
POST /api/interpret
Content-Type: application/json

{
  "transcript": "start something chill",
  "isFirstCommand": true,
  "currentBpm": 120,
  "currentPrompts": []
}
```

### First Command (Convenience)

```
POST /api/interpret/first
Content-Type: application/json

{
  "transcript": "start a techno beat"
}
```

### Modify Command (Convenience)

```
POST /api/interpret/modify
Content-Type: application/json

{
  "transcript": "add some drums",
  "currentBpm": 120,
  "currentPrompts": ["Techno beat"]
}
```

## 📦 Response Format

```typescript
{
  "success": true,
  "result": {
    "weighted_prompts": [
      { "text": "Chill and relaxed atmosphere", "weight": 1.0 }
    ],
    "config": {
      "bpm": 75,
      "density": 0.5,
      "brightness": 0.7,
      "temperature": 1.1
    },
    "requires_reset": false,
    "action_type": "add_instrument"
  }
}
```

## 🛠️ Available Music Logic Functions

You can also use the music logic functions directly in your frontend:

```typescript
import {
	getInstrumentPrompt,
	getGenrePrompt,
	getMoodPrompt,
	calculateBpmChange,
	listAvailableInstruments,
	listAvailableGenres,
	listAvailableMoods,
} from "@/lib/musicLogic";

// Get instrument prompt
const drums = getInstrumentPrompt("drums");
console.log(drums.text); // "Dynamic drums with crisp hits"

// List available options
const instruments = listAvailableInstruments();
const genres = listAvailableGenres();
const moods = listAvailableMoods();
```

## 🏗️ Building for Production

### Build both frontend and backend:

```bash
npm run build
```

This creates:

- `dist/` - Frontend build (Vite)
- `dist/server/` - Backend build (TypeScript)

### Start production server:

```bash
npm start
```

## 🔧 Scripts Reference

| Script                 | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start both frontend and backend |
| `npm run dev:client`   | Start Vite dev server only      |
| `npm run dev:server`   | Start Express server only       |
| `npm run build`        | Build both frontend and backend |
| `npm run build:client` | Build frontend only             |
| `npm run build:server` | Build backend only              |
| `npm start`            | Start production server         |

## 🎯 Next Steps

1. **Add Voice Recognition**: Integrate Web Speech API or a service like Deepgram
2. **Connect to Music Generation**: Use the Lyria API or another music generation service
3. **Add State Management**: Use Zustand or Redux for music state
4. **Add Audio Playback**: Integrate Howler.js or Web Audio API
5. **Add Real-time Updates**: Use WebSockets for live music modifications

## 📚 Example Voice Commands

- "start something chill and slow"
- "add some drums"
- "make it faster"
- "add a guitar"
- "make it darker"
- "increase the density"
- "double the tempo"

## 🐛 Troubleshooting

### Backend won't start

- Check if port 3001 is available
- Verify `GOOGLE_API_KEY` is set in `.env`
- Check `npm run dev:server` logs for errors

### Frontend can't connect to backend

- Verify backend is running on port 3001
- Check CORS settings in `server/index.ts`
- Set `VITE_API_URL` in `.env` if using different port

### TypeScript errors

- Run `npm run typecheck` to check for type errors
- Make sure all dependencies are installed

## 📝 Notes

- The backend uses `tsx watch` for hot reloading during development
- The frontend and backend share `musicLogic.ts` for consistency
- All music logic is type-safe with TypeScript
- The API uses standard REST conventions

Enjoy building your AI music producer! 🎵✨
