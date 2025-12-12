/**
 * Shared Type Definitions for Gomar33 Music Agent
 * Used by both frontend and backend
 */

export interface WeightedPrompt {
	text: string;
	weight: number; // Cannot be 0, 1.0 is default
}

export interface MusicConfig {
	bpm?: number; // 60-200
	density?: number; // 0.0-1.0
	brightness?: number; // 0.0-1.0
	temperature?: number; // 0.0-3.0, default 1.1
	guidance?: number; // 0.0-6.0, default 4.0
	scale?: string; // Musical scale
	mute_bass?: boolean;
	mute_drums?: boolean;
	only_bass_and_drums?: boolean;
	music_generation_mode?: "QUALITY" | "DIVERSITY" | "VOCALIZATION";
	top_k?: number; // 1-1000, default 40
	seed?: number; // 0-2147483647
}

