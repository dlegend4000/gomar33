/**
 * Gemini Music Agent - Server-side implementation
 * Handles voice command interpretation using Google's Generative AI
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
	getInstrumentPrompt,
	getGenrePrompt,
	getMoodPrompt,
	calculateBpmChange,
	calculateDensityChange,
	calculateBrightnessChange,
	createWeightedPrompt,
	type WeightedPrompt,
	type MusicConfig,
} from "../src/lib/musicLogic";

// ============================================================================
// Gemini Function Schemas
// ============================================================================

const musicFunctions = [
	{
		name: "get_instrument_prompt",
		description:
			"Get the Lyria prompt text for a specific instrument (guitar, drums, synth, bass, etc.)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				instrument_name: {
					type: SchemaType.STRING,
					description:
						"Name of the instrument (e.g., 'guitar', 'drums', 'synth')",
				},
			},
			required: ["instrument_name"],
		},
	},
	{
		name: "get_genre_prompt",
		description:
			"Get the Lyria prompt text for a music genre (techno, jazz, hip hop, etc.)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				genre_name: {
					type: SchemaType.STRING,
					description: "Name of the genre (e.g., 'techno', 'jazz', 'hip hop')",
				},
			},
			required: ["genre_name"],
		},
	},
	{
		name: "get_mood_prompt",
		description:
			"Get the Lyria prompt text for a mood or feeling (chill, dark, energetic, etc.)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				mood_description: {
					type: SchemaType.STRING,
					description:
						"Description of the mood (e.g., 'chill', 'dark', 'energetic')",
				},
			},
			required: ["mood_description"],
		},
	},
	{
		name: "calculate_bpm_change",
		description:
			"Calculate new BPM based on a modification request (faster, slower, double time, etc.)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				current_bpm: {
					type: SchemaType.NUMBER,
					description: "Current BPM value (60-200)",
				},
				modification: {
					type: SchemaType.STRING,
					description:
						"Description of change (e.g., 'faster', 'slower', 'double time')",
				},
			},
			required: ["current_bpm", "modification"],
		},
	},
	{
		name: "calculate_density_change",
		description:
			"Calculate new density value (how busy/sparse the music is, 0.0-1.0)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				current_density: {
					type: SchemaType.NUMBER,
					description: "Current density value (0.0-1.0), or null if not set",
					nullable: true,
				},
				modification: {
					type: SchemaType.STRING,
					description: "Description of change (e.g., 'busier', 'more minimal')",
				},
			},
			required: ["modification"],
		},
	},
	{
		name: "calculate_brightness_change",
		description:
			"Calculate new brightness value (tonal quality, 0.0 dark to 1.0 bright)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				current_brightness: {
					type: SchemaType.NUMBER,
					description: "Current brightness value (0.0-1.0), or null if not set",
					nullable: true,
				},
				modification: {
					type: SchemaType.STRING,
					description: "Description of change (e.g., 'brighter', 'darker')",
				},
			},
			required: ["modification"],
		},
	},
	{
		name: "create_weighted_prompt",
		description:
			"Create a properly formatted weighted prompt for Lyria (weight cannot be 0)",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				text: {
					type: SchemaType.STRING,
					description: "The prompt text",
				},
				weight: {
					type: SchemaType.NUMBER,
					description: "The weight value (0.1-3.0, default 1.0, cannot be 0)",
				},
			},
			required: ["text"],
		},
	},
] as const;

// ============================================================================
// Function Call Handler
// ============================================================================

function handleFunctionCall(functionName: string, args: any): any {
	switch (functionName) {
		case "get_instrument_prompt":
			return getInstrumentPrompt(args.instrument_name);
		case "get_genre_prompt":
			return getGenrePrompt(args.genre_name);
		case "get_mood_prompt":
			return getMoodPrompt(args.mood_description);
		case "calculate_bpm_change":
			return calculateBpmChange(args.current_bpm, args.modification);
		case "calculate_density_change":
			return calculateDensityChange(args.current_density, args.modification);
		case "calculate_brightness_change":
			return calculateBrightnessChange(
				args.current_brightness,
				args.modification
			);
		case "create_weighted_prompt":
			return createWeightedPrompt(args.text, args.weight);
		default:
			return { error: `Unknown function: ${functionName}` };
	}
}

// ============================================================================
// Main Agent Interface
// ============================================================================

export interface MusicInterpretationResult {
	weighted_prompts: WeightedPrompt[];
	config: MusicConfig;
	requires_reset: boolean;
	action_type?: string;
	explanation?: string;
}

export interface InterpretOptions {
	isFirstCommand: boolean;
	currentBpm?: number;
	currentPrompts?: string[];
	currentConfig?: MusicConfig;
}

/**
 * Main function to interpret voice commands using Gemini
 */
export async function interpretVoiceCommand(
	transcript: string,
	options: InterpretOptions
): Promise<MusicInterpretationResult> {
	const apiKey = process.env.GOOGLE_API_KEY;
	if (!apiKey) {
		throw new Error("GOOGLE_API_KEY environment variable is not set");
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({
		model: "gemini-2.0-flash-exp",
		tools: [{ functionDeclarations: musicFunctions as any }],
	});

	const { isFirstCommand, currentBpm, currentPrompts } = options;

	// Build the system prompt
	let systemPrompt: string;

	if (isFirstCommand) {
		systemPrompt = `
You are a music production AI. The user is starting music for the FIRST TIME.

Your job:
1. Analyze their command for tempo (BPM), genre, mood, and instruments
2. Use the available functions to get proper Lyria prompts
3. Return a JSON object with this EXACT structure:
{
  "weighted_prompts": [
    {"text": "prompt text from functions", "weight": 1.0}
  ],
  "config": {
    "bpm": 60-200,
    "density": 0.0-1.0 (optional),
    "brightness": 0.0-1.0 (optional),
    "temperature": 1.1 (default)
  },
  "requires_reset": false
}

Steps:
1. Use get_genre_prompt(), get_mood_prompt(), get_instrument_prompt() to get prompt texts
2. Use create_weighted_prompt() to format each prompt with appropriate weight
3. Choose appropriate BPM (slow=75, medium=110, fast=150)
4. Return ONLY the JSON object, no explanations

Example:
User: "start something slow and chill"
You should:
1. Call get_mood_prompt("chill")
2. Call create_weighted_prompt(result.text, 1.0)
3. Return: {"weighted_prompts": [{"text": "Chill and relaxed atmosphere", "weight": 1.0}], "config": {"bpm": 75, "temperature": 1.1}, "requires_reset": false}
`;
	} else {
		systemPrompt = `
You are a music production AI. Music is ALREADY PLAYING.

Current state:
- BPM: ${currentBpm || "not set"}
- Prompts: ${JSON.stringify(currentPrompts || [])}

Your job:
1. Analyze what the user wants to CHANGE
2. Use functions to calculate new values or get new prompts
3. Return a JSON object with this EXACT structure:
{
  "weighted_prompts": [/* new prompts to ADD, or empty array */],
  "config": {/* only include fields that CHANGE */},
  "requires_reset": true/false,  // true if BPM or scale changes
  "action_type": "tempo|add_instrument|change_mood|adjust_density|adjust_brightness"
}

Steps:
- For tempo changes: use calculate_bpm_change() and set requires_reset=true
- For new instruments: use get_instrument_prompt() + create_weighted_prompt()
- For mood changes: use get_mood_prompt()
- For density: use calculate_density_change()
- For brightness: use calculate_brightness_change()
- Return ONLY the JSON object, no explanations

Example:
User: "add some drums"
You should:
1. Call get_instrument_prompt("drums")
2. Call create_weighted_prompt(result.text, 1.0)
3. Return: {"weighted_prompts": [{"text": "Dynamic drums with crisp hits", "weight": 1.0}], "config": {}, "requires_reset": false, "action_type": "add_instrument"}
`;
	}

	const userPrompt = `User said: "${transcript}"\n\nInterpret this and return the Lyria parameters.`;

	// Start chat
	const chat = model.startChat();

	// Send initial request
	let response = await chat.sendMessage(systemPrompt + "\n\n" + userPrompt);

	// Handle function calls in a loop
	while (
		response.response.candidates?.[0]?.content?.parts?.some(
			(part: any) => part.functionCall
		)
	) {
		const parts = response.response.candidates[0].content.parts;
		const functionResponses: any[] = [];

		for (const part of parts) {
			if (part.functionCall) {
				const { name, args } = part.functionCall;
				const result = handleFunctionCall(name, args);
				functionResponses.push({
					functionResponse: {
						name,
						response: result,
					},
				});
			}
		}

		// Send function results back
		response = await chat.sendMessage(functionResponses as any);
	}

	// Extract the final JSON response
	let responseText = response.response.text().trim();

	// Remove markdown code blocks if present
	if (responseText.startsWith("```")) {
		const parts = responseText.split("```");
		responseText = parts[1];
		if (responseText.startsWith("json")) {
			responseText = responseText.substring(4);
		}
		responseText = responseText.trim();
	}

	try {
		const result: MusicInterpretationResult = JSON.parse(responseText);
		return result;
	} catch (error) {
		console.error("Failed to parse Gemini response:", responseText);
		throw new Error("Failed to parse music interpretation result");
	}
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Initialize Gemini for first-time music start
 */
export async function interpretFirstCommand(transcript: string) {
	return interpretVoiceCommand(transcript, { isFirstCommand: true });
}

/**
 * Interpret modification to existing music
 */
export async function interpretModification(
	transcript: string,
	currentBpm: number,
	currentPrompts: string[]
) {
	return interpretVoiceCommand(transcript, {
		isFirstCommand: false,
		currentBpm,
		currentPrompts,
	});
}
