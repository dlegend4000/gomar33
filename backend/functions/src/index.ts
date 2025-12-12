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

// Lyria connection endpoint - returns API key for client connection
// Note: This still exposes the key, but it's better than bundling it in the frontend
// For true security, implement a WebSocket proxy (requires Cloud Run or separate server)
export const lyriaConnection = functions.https.onRequest(async (req, res) => {
	return corsHandler(req, res, async () => {
		try {
			// Get API key from environment/Firebase config
			const apiKey = process.env.GOOGLE_API_KEY || 
				(process.env as any).GOOGLE_API_KEY_SECRET ||
				(require("firebase-functions").config().google?.api_key);

			if (!apiKey) {
				return res.status(500).json({
					success: false,
					error: "Configuration Error",
					message: "GOOGLE_API_KEY is not configured",
				});
			}

			// Return the API key (client will use it to connect)
			// TODO: For better security, implement a WebSocket proxy server
			return res.json({
				success: true,
				apiKey: apiKey,
				// Include expiration or other security measures if needed
			});
		} catch (error: any) {
			console.error("Error getting Lyria connection:", error);

			return res.status(500).json({
				success: false,
				error: "Internal Server Error",
				message: error.message || "Failed to get connection info",
			});
		}
	});
});
