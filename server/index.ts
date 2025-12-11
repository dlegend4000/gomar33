/**
 * Express Backend for Gomar33 Music Agent
 * Provides API endpoints for voice command interpretation using Gemini AI
 */

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
	interpretVoiceCommand,
	type InterpretOptions,
} from "./geminiMusicAgent.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
	res.json({
		status: "ok",
		message: "Gomar33 Music Agent API is running",
		timestamp: new Date().toISOString(),
	});
});

// Voice command interpretation endpoint
app.post("/api/interpret", async (req: Request, res: Response) => {
	try {
		const {
			transcript,
			isFirstCommand,
			currentBpm,
			currentPrompts,
			currentConfig,
		} = req.body;

		// Validation
		if (!transcript || typeof transcript !== "string") {
			return res.status(400).json({
				error: "Bad Request",
				message: "transcript is required and must be a string",
			});
		}

		if (typeof isFirstCommand !== "boolean") {
			return res.status(400).json({
				error: "Bad Request",
				message: "isFirstCommand is required and must be a boolean",
			});
		}

		// Prepare options
		const options: InterpretOptions = {
			isFirstCommand,
			currentBpm,
			currentPrompts,
			currentConfig,
		};

		// Call Gemini agent
		const result = await interpretVoiceCommand(transcript, options);

		res.json({
			success: true,
			result,
		});
	} catch (error: any) {
		console.error("Error interpreting voice command:", error);

		res.status(500).json({
			error: "Internal Server Error",
			message: error.message || "Failed to interpret voice command",
			details: process.env.NODE_ENV === "development" ? error.stack : undefined,
		});
	}
});

// First command convenience endpoint
app.post("/api/interpret/first", async (req: Request, res: Response) => {
	try {
		const { transcript } = req.body;

		if (!transcript || typeof transcript !== "string") {
			return res.status(400).json({
				error: "Bad Request",
				message: "transcript is required and must be a string",
			});
		}

		const result = await interpretVoiceCommand(transcript, {
			isFirstCommand: true,
		});

		res.json({
			success: true,
			result,
		});
	} catch (error: any) {
		console.error("Error interpreting first command:", error);

		res.status(500).json({
			error: "Internal Server Error",
			message: error.message || "Failed to interpret voice command",
		});
	}
});

// Modification command convenience endpoint
app.post("/api/interpret/modify", async (req: Request, res: Response) => {
	try {
		const { transcript, currentBpm, currentPrompts } = req.body;

		if (!transcript || typeof transcript !== "string") {
			return res.status(400).json({
				error: "Bad Request",
				message: "transcript is required and must be a string",
			});
		}

		if (!currentBpm || typeof currentBpm !== "number") {
			return res.status(400).json({
				error: "Bad Request",
				message: "currentBpm is required and must be a number",
			});
		}

		const result = await interpretVoiceCommand(transcript, {
			isFirstCommand: false,
			currentBpm,
			currentPrompts: currentPrompts || [],
		});

		res.json({
			success: true,
			result,
		});
	} catch (error: any) {
		console.error("Error interpreting modification command:", error);

		res.status(500).json({
			error: "Internal Server Error",
			message: error.message || "Failed to interpret voice command",
		});
	}
});

// 404 handler
app.use((req: Request, res: Response) => {
	res.status(404).json({
		error: "Not Found",
		message: `Route ${req.method} ${req.path} not found`,
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`🎵 Gomar33 Music Agent API running on http://localhost:${PORT}`);
	console.log(`📡 API endpoints:`);
	console.log(`   GET  /api/health`);
	console.log(`   POST /api/interpret`);
	console.log(`   POST /api/interpret/first`);
	console.log(`   POST /api/interpret/modify`);

	if (!process.env.GOOGLE_API_KEY) {
		console.warn(
			"⚠️  WARNING: GOOGLE_API_KEY is not set in environment variables"
		);
	}
});
