/**
 * Music Agent Demo Component
 * Example of how to use the Gemini Music Agent in your React app
 */

import { useState, useEffect, useRef } from "react";
import {
	interpretFirstCommand,
	interpretModifyCommand,
	checkHealth,
} from "@/lib/api";
import type { MusicInterpretationResult } from "@/lib/api";
import { LyriaMusicHelper, type PlaybackState } from "@/lib/lyriaMusic";
import type { WeightedPrompt } from "@/lib/musicLogic";

export function MusicAgentDemo() {
	const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
	const [currentBpm, setCurrentBpm] = useState(120);
	const [activePrompts, setActivePrompts] = useState<WeightedPrompt[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastResult, setLastResult] =
		useState<MusicInterpretationResult | null>(null);
	const [transcript, setTranscript] = useState("");
	const [apiStatus, setApiStatus] = useState<"unknown" | "online" | "offline">(
		"unknown"
	);
	const [filteredPrompts, setFilteredPrompts] = useState<string[]>([]);

	const lyriaHelper = useRef<LyriaMusicHelper | null>(null);

	// Initialize Lyria helper
	useEffect(() => {
		// API key is now fetched from backend, not from env vars
		const helper = new LyriaMusicHelper();

		// Listen for playback state changes
		helper.addEventListener("playback-state-changed", ((e: Event) => {
			const customEvent = e as CustomEvent<PlaybackState>;
			setPlaybackState(customEvent.detail);
		}) as EventListener);

		// Listen for filtered prompts
		helper.addEventListener("filtered-prompt", ((e: Event) => {
			const customEvent = e as CustomEvent<{ text?: string; filteredReason?: string }>;
			if (customEvent.detail.text) {
				setFilteredPrompts(prev => [...prev, customEvent.detail.text!]);
			}
		}) as EventListener);

		// Listen for errors
		helper.addEventListener("error", ((e: Event) => {
			const customEvent = e as CustomEvent<string>;
			setError(customEvent.detail);
		}) as EventListener);

		lyriaHelper.current = helper;

		return () => {
			helper.stop();
		};
	}, []);

	// Check API health on mount
	useEffect(() => {
		checkHealth()
			.then(() => setApiStatus("online"))
			.catch(() => setApiStatus("offline"));
	}, []);

	const handleCommand = async () => {
		if (!transcript.trim() || !lyriaHelper.current) return;

		setIsLoading(true);
		setError(null);

		try {
			let result: MusicInterpretationResult;
			const isPlaying = playbackState === "playing" || playbackState === "paused";

			if (!isPlaying) {
				// First command - start music
				result = await interpretFirstCommand(transcript);

				// Start Lyria playback with initial prompts
				await lyriaHelper.current.setWeightedPrompts(
					result.weighted_prompts,
					result.config
				);
				await lyriaHelper.current.play();
			} else {
				// Modify existing music
				result = await interpretModifyCommand({
					transcript,
					currentBpm,
					currentPrompts: activePrompts.map(p => p.text),
				});

				// Handle reset requirement (BPM or scale change)
				if (result.requires_reset) {
					lyriaHelper.current.stop();
					await lyriaHelper.current.setWeightedPrompts(
						result.weighted_prompts,
						result.config
					);
					await lyriaHelper.current.play();
				} else {
					// Just update prompts/config
					const updatedPrompts = result.weighted_prompts.length > 0
						? [...activePrompts, ...result.weighted_prompts]
						: activePrompts;

					await lyriaHelper.current.setWeightedPrompts(
						updatedPrompts,
						result.config
					);
				}
			}

			// Update state with results
			setLastResult(result);

			if (result.config.bpm) {
				setCurrentBpm(result.config.bpm);
			}

			if (result.weighted_prompts.length > 0) {
				setActivePrompts(prev => [...prev, ...result.weighted_prompts]);
			}

			setTranscript("");
		} catch (err: any) {
			setError(err.message || "Failed to interpret command");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePlayPause = () => {
		if (lyriaHelper.current) {
			lyriaHelper.current.playPause();
		}
	};

	const reset = () => {
		if (lyriaHelper.current) {
			lyriaHelper.current.stop();
		}
		setCurrentBpm(120);
		setActivePrompts([]);
		setLastResult(null);
		setError(null);
		setFilteredPrompts([]);
	};

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-6">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
				<h2 className="text-2xl font-bold mb-4">🎵 Music Agent Demo</h2>

				{/* API Status */}
				<div className="mb-4 flex items-center gap-2">
					<span className="text-sm text-gray-600 dark:text-gray-400">
						API Status:
					</span>
					<span
						className={`px-2 py-1 rounded text-xs font-medium ${
							apiStatus === "online"
								? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
								: apiStatus === "offline"
								? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
								: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
						}`}
					>
						{apiStatus === "online"
							? "● Online"
							: apiStatus === "offline"
							? "● Offline"
							: "● Checking..."}
					</span>
				</div>

				{/* Current State */}
				<div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
					<h3 className="font-semibold mb-2">Current State</h3>
					<div className="space-y-1 text-sm">
						<p>
							Status:{" "}
							<span className="font-medium">
								{playbackState === "playing" && "▶️ Playing"}
								{playbackState === "paused" && "⏸️ Paused"}
								{playbackState === "loading" && "⏳ Loading..."}
								{playbackState === "stopped" && "⏹️ Stopped"}
							</span>
						</p>
						<p>
							BPM: <span className="font-medium">{currentBpm}</span>
						</p>
						<p>
							Active Prompts:{" "}
							<span className="font-medium">{activePrompts.length}</span>
						</p>
					</div>
				</div>

				{/* Input */}
				<div className="space-y-3">
					<div>
						<label className="block text-sm font-medium mb-2">
							Voice Command
						</label>
						<input
							type="text"
							value={transcript}
							onChange={(e) => setTranscript(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && handleCommand()}
							placeholder={
								playbackState === "playing" || playbackState === "paused"
									? "e.g., add some drums"
									: "e.g., start something chill"
							}
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
						/>
					</div>

					<div className="flex gap-2">
						<button
							onClick={handleCommand}
							disabled={isLoading || !transcript.trim()}
							className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
						>
							{isLoading
								? "Processing..."
								: playbackState === "playing" || playbackState === "paused"
								? "Modify Music"
								: "Start Music"}
						</button>
						{(playbackState === "playing" || playbackState === "paused") && (
							<>
								<button
									onClick={handlePlayPause}
									disabled={isLoading}
									className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
								>
									{playbackState === "playing" ? "⏸️ Pause" : "▶️ Play"}
								</button>
								<button
									onClick={reset}
									disabled={isLoading}
									className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
								>
									Reset
								</button>
							</>
						)}
					</div>
				</div>

				{/* Example Commands */}
				<div className="mt-4">
					<p className="text-sm font-medium mb-2">Example commands:</p>
					<div className="flex flex-wrap gap-2">
						{playbackState === "stopped" ? (
							<>
								<button
									onClick={() => setTranscript("start something chill")}
									className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
								>
									start something chill
								</button>
								<button
									onClick={() => setTranscript("techno beat at 128 bpm")}
									className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
								>
									techno beat at 128 bpm
								</button>
							</>
						) : (
							<>
								<button
									onClick={() => setTranscript("add some drums")}
									className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
								>
									add some drums
								</button>
								<button
									onClick={() => setTranscript("make it faster")}
									className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
								>
									make it faster
								</button>
								<button
									onClick={() => setTranscript("add a guitar")}
									className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
								>
									add a guitar
								</button>
							</>
						)}
					</div>
				</div>

				{/* Error Display */}
				{error && (
					<div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
						❌ {error}
					</div>
				)}

				{/* Active Prompts */}
				{activePrompts.length > 0 && (
					<div className="mt-4">
						<h3 className="font-semibold mb-2">Active Prompts:</h3>
						<div className="space-y-1">
							{activePrompts.map((prompt, idx) => (
								<div
									key={idx}
									className="text-sm px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded flex justify-between items-center"
								>
									<span>{prompt.text}</span>
									<span className="text-xs text-gray-500">
										weight: {prompt.weight.toFixed(1)}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Filtered Prompts */}
				{filteredPrompts.length > 0 && (
					<div className="mt-4">
						<h3 className="font-semibold mb-2 text-orange-600">Filtered Prompts:</h3>
						<div className="space-y-1">
							{filteredPrompts.map((prompt, idx) => (
								<div
									key={idx}
									className="text-sm px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded"
								>
									{prompt}
								</div>
							))}
						</div>
						<p className="text-xs text-gray-500 mt-2">
							These prompts were filtered by Lyria's content safety system.
						</p>
					</div>
				)}

				{/* Last Result */}
				{lastResult && (
					<details className="mt-4">
						<summary className="cursor-pointer font-semibold text-sm">
							View Last Result (JSON)
						</summary>
						<pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
							{JSON.stringify(lastResult, null, 2)}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}
