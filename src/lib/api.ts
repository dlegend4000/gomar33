/**
 * Frontend API Client for Gomar33 Music Agent
 * Communicates with the Express backend for voice command interpretation
 */

import type { MusicConfig, WeightedPrompt } from "./musicLogic";

// Always use relative URLs - Firebase Hosting rewrites handle /api/* routes to Firebase Functions
// This works for both local development (if backend is running) and production
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export interface MusicInterpretationResult {
	weighted_prompts: WeightedPrompt[];
	config: MusicConfig;
	requires_reset: boolean;
	action_type?: string;
	explanation?: string;
}

export interface InterpretVoiceCommandParams {
	transcript: string;
	isFirstCommand: boolean;
	currentBpm?: number;
	currentPrompts?: string[];
	currentConfig?: MusicConfig;
}

export interface InterpretFirstCommandParams {
	transcript: string;
}

export interface InterpretModifyCommandParams {
	transcript: string;
	currentBpm: number;
	currentPrompts?: string[];
}

export interface ApiResponse<T> {
	success: boolean;
	result?: T;
	error?: string;
	message?: string;
}

/**
 * Check if the API server is healthy
 */
export async function checkHealth(): Promise<{
	status: string;
	message: string;
	timestamp: string;
}> {
	const url = `${API_BASE_URL}/api/health`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Interpret a voice command using the Gemini AI agent
 */
export async function interpretVoiceCommand(
	params: InterpretVoiceCommandParams
): Promise<MusicInterpretationResult> {
	const url = `${API_BASE_URL}/api/interpret`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	const data: ApiResponse<MusicInterpretationResult> = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.message || "Failed to interpret voice command");
	}

	if (!data.result) {
		throw new Error("No result returned from API");
	}

	return data.result;
}

/**
 * Interpret the first voice command (starting music for the first time)
 */
export async function interpretFirstCommand(
	transcript: string
): Promise<MusicInterpretationResult> {
	const url = `${API_BASE_URL}/api/interpret/first`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ transcript }),
	});

	const data: ApiResponse<MusicInterpretationResult> = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.message || "Failed to interpret first command");
	}

	if (!data.result) {
		throw new Error("No result returned from API");
	}

	return data.result;
}

/**
 * Interpret a modification command (modifying existing music)
 */
export async function interpretModifyCommand(
	params: InterpretModifyCommandParams
): Promise<MusicInterpretationResult> {
	const url = `${API_BASE_URL}/api/interpret/modify`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	const data: ApiResponse<MusicInterpretationResult> = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.message || "Failed to interpret modification command");
	}

	if (!data.result) {
		throw new Error("No result returned from API");
	}

	return data.result;
}

/**
 * Hook for React components to easily use the API
 */
import { useState } from "react";

export function useMusicAgent() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const interpret = async (params: InterpretVoiceCommandParams) => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await interpretVoiceCommand(params);
			return result;
		} catch (err: any) {
			setError(err.message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const interpretFirst = async (transcript: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await interpretFirstCommand(transcript);
			return result;
		} catch (err: any) {
			setError(err.message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const interpretModify = async (params: InterpretModifyCommandParams) => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await interpretModifyCommand(params);
			return result;
		} catch (err: any) {
			setError(err.message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		interpret,
		interpretFirst,
		interpretModify,
		isLoading,
		error,
	};
}
