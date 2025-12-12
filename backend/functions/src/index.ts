import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import {
	interpretVoiceCommand,
	interpretFirstCommand,
	interpretModification,
	type InterpretOptions,
} from "./geminiMusicAgent";

admin.initializeApp();

const corsHandler = cors({ origin: true });

// Health check endpoint
export const health = functions.https.onRequest(async (req, res) => {
	return corsHandler(req, res, async () => {
		return res.json({
			status: "ok",
			message: "Gomar33 Music Agent API is running",
			timestamp: new Date().toISOString(),
		});
	});
});

// Voice command interpretation endpoint
export const interpret = functions.https.onRequest(async (req, res) => {
	return corsHandler(req, res, async () => {
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
					success: false,
					error: "Bad Request",
					message: "transcript is required and must be a string",
				});
			}

			if (typeof isFirstCommand !== "boolean") {
				return res.status(400).json({
					success: false,
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

			return res.json({
				success: true,
				result,
			});
		} catch (error: any) {
			console.error("Error interpreting voice command:", error);

			return res.status(500).json({
				success: false,
				error: "Internal Server Error",
				message: error.message || "Failed to interpret voice command",
			});
		}
	});
});

// First command convenience endpoint
export const interpretFirst = functions.https.onRequest(async (req, res) => {
	return corsHandler(req, res, async () => {
		try {
			const { transcript } = req.body;

			if (!transcript || typeof transcript !== "string") {
				return res.status(400).json({
					success: false,
					error: "Bad Request",
					message: "transcript is required and must be a string",
				});
			}

			const result = await interpretFirstCommand(transcript);

			return res.json({
				success: true,
				result,
			});
		} catch (error: any) {
			console.error("Error interpreting first command:", error);

			return res.status(500).json({
				success: false,
				error: "Internal Server Error",
				message: error.message || "Failed to interpret voice command",
			});
		}
	});
});

// Modification command convenience endpoint
export const interpretModify = functions.https.onRequest(async (req, res) => {
	return corsHandler(req, res, async () => {
		try {
			const { transcript, currentBpm, currentPrompts } = req.body;

			if (!transcript || typeof transcript !== "string") {
				return res.status(400).json({
					success: false,
					error: "Bad Request",
					message: "transcript is required and must be a string",
				});
			}

			if (!currentBpm || typeof currentBpm !== "number") {
				return res.status(400).json({
					success: false,
					error: "Bad Request",
					message: "currentBpm is required and must be a number",
				});
			}

			const result = await interpretModification(
				transcript,
				currentBpm,
				currentPrompts || []
			);

			return res.json({
				success: true,
				result,
			});
		} catch (error: any) {
			console.error("Error interpreting modification command:", error);

			return res.status(500).json({
				success: false,
				error: "Internal Server Error",
				message: error.message || "Failed to interpret voice command",
			});
		}
	});
});
