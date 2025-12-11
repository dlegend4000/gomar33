import { useState, useEffect, useRef } from "react";
import { Settings, Moon, Sun } from "lucide-react";
import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
} from "@clerk/clerk-react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import Waveform from "./components/Waveform";
import SpeechRecognition from "./components/SpeechRecognition";
import { AnimatedFolder } from "./components/ui/3d-folder";
import {
	interpretFirstCommand,
	interpretModifyCommand,
	type MusicInterpretationResult,
} from "@/lib/api";
import type { WeightedPrompt } from "@/lib/musicLogic";
import { LyriaMusicHelper, type PlaybackState } from "@/lib/lyriaMusic";

function App() {
	const [darkMode, setDarkMode] = useState(false);
	const [isRecording, setIsRecording] = useState(false);

	// Music state
	const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
	const [currentBpm, setCurrentBpm] = useState(120);
  const [weightedPrompts, setWeightedPrompts] = useState<WeightedPrompt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
	const [textInput, setTextInput] = useState("");

	const lyriaHelper = useRef<LyriaMusicHelper | null>(null);

	// Initialize Lyria helper
	useEffect(() => {
		const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
		if (!apiKey) {
			console.warn("⚠️ VITE_GOOGLE_API_KEY is not set - Lyria playback will not work");
			return;
		}

		const helper = new LyriaMusicHelper(apiKey);

		// Listen for playback state changes
		helper.addEventListener("playback-state-changed", ((e: Event) => {
			const customEvent = e as CustomEvent<PlaybackState>;
			setPlaybackState(customEvent.detail);
			console.log("🎵 Playback state:", customEvent.detail);
		}) as EventListener);

		// Listen for errors
		helper.addEventListener("error", ((e: Event) => {
			const customEvent = e as CustomEvent<string>;
			setError(customEvent.detail);
			console.error("❌ Lyria error:", customEvent.detail);
		}) as EventListener);

		// Listen for filtered prompts
		helper.addEventListener("filtered-prompt", ((e: Event) => {
			const customEvent = e as CustomEvent<{ text?: string; filteredReason?: string }>;
			console.warn("⚠️ Prompt filtered:", customEvent.detail);
		}) as EventListener);

		lyriaHelper.current = helper;

		return () => {
			helper.stop();
		};
	}, []);

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [darkMode]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space" && e.target === document.body && !e.repeat) {
				e.preventDefault();
				setIsRecording(true);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === "Space" && e.target === document.body) {
				e.preventDefault();
				setIsRecording(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};

	// Handle voice command completion
	const handleVoiceCommand = async (transcript: string) => {
		if (!transcript.trim() || !lyriaHelper.current) return;

		setIsProcessing(true);
		setError(null);

		try {
			let result: MusicInterpretationResult;
			const isPlaying = playbackState === "playing" || playbackState === "paused";

			if (!isPlaying) {
				// First command - start music
				console.log("🎵 Starting music with:", transcript);
				result = await interpretFirstCommand(transcript);

				// Start Lyria playback
				console.log("🎶 Starting Lyria with prompts:", result.weighted_prompts);
				await lyriaHelper.current.setWeightedPrompts(
					result.weighted_prompts,
					result.config
				);
				await lyriaHelper.current.play();
			} else {
				// Modify existing music
				console.log("🎵 Modifying music with:", transcript);
				result = await interpretModifyCommand({
					transcript,
					currentBpm,
					currentPrompts: weightedPrompts.map((p) => p.text),
				});

				// Combine old and new prompts
				const updatedPrompts = result.weighted_prompts.length > 0
					? [...weightedPrompts, ...result.weighted_prompts]
					: weightedPrompts;

				// Handle reset requirement (BPM or scale change)
				if (result.requires_reset) {
					console.log("🔄 Resetting Lyria session (keeping all prompts)");
					lyriaHelper.current.stop();
					await lyriaHelper.current.setWeightedPrompts(updatedPrompts, result.config);
					await lyriaHelper.current.play();
				} else {
					// Just update prompts/config without reset
					console.log("🎶 Updating Lyria prompts (adding to existing)");
					await lyriaHelper.current.setWeightedPrompts(
						updatedPrompts,
						result.config
					);
				}
			}

			// Update music state
			console.log("✅ Music interpretation result:", result);

			if (result.config.bpm) {
				setCurrentBpm(result.config.bpm);
			}

			if (result.weighted_prompts.length > 0) {
				setWeightedPrompts((prev) => [...prev, ...result.weighted_prompts]);
			}
		} catch (err: any) {
			console.error("❌ Error interpreting command:", err);
			setError(err.message || "Failed to interpret voice command");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col items-center justify-between p-6 transition-colors duration-300">
			<header className="w-full max-w-4xl flex justify-between items-center py-4">
				<div className="text-sm font-medium opacity-60 dark:opacity-40 tracking-wider">
					Gomar33
				</div>
				<div className="flex items-center gap-4">
					<SignedIn>
						<UserButton
							afterSignOutUrl="/"
							appearance={{
								elements: {
									footer: { display: "none" },
								},
							}}
						/>
					</SignedIn>
					<SignedOut>
						<SignInButton
							mode="modal"
							appearance={{
								elements: {
									footer: { display: "none" },
								},
							}}
						>
							<button className="px-4 py-2 rounded-lg bg-black hover:bg-gray-900 text-white transition-colors">
								Sign In
							</button>
						</SignInButton>
					</SignedOut>
					<button className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-gray-500 dark:text-gray-400">
						<Settings size={24} />
					</button>
				</div>
			</header>

			<main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl relative">
				<SignedIn>
					<div className="w-64 h-64 mb-8">
						<VoicePoweredOrb
							enableVoiceControl={isRecording}
							className="rounded-full shadow-none"
						/>
					</div>

					<div className="w-full space-y-6">
						<Waveform progress={0.3} />

						<div className="text-center font-mono text-lg tracking-widest text-gray-500 dark:text-gray-400">
							<span className="text-gray-800 dark:text-white font-medium">
								0:54
							</span>
							<span className="mx-2 opacity-50">/</span>
							<span>4:50</span>
						</div>
					</div>

          <SpeechRecognition
            onTranscriptComplete={handleVoiceCommand}
          />

					{/* Text Input */}
					<div className="mt-6 w-full max-w-md">
						<div className="flex gap-2">
							<input
								type="text"
								value={textInput}
								onChange={(e) => setTextInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && textInput.trim()) {
										handleVoiceCommand(textInput);
										setTextInput("");
									}
								}}
								placeholder={
									playbackState === "playing" || playbackState === "paused"
										? "Type to modify: add drums, make it faster..."
										: "Type to start: something chill, techno beat..."
								}
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isProcessing}
							/>
							<button
								onClick={() => {
									if (textInput.trim()) {
										handleVoiceCommand(textInput);
										setTextInput("");
									}
								}}
								disabled={isProcessing || !textInput.trim()}
								className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
							>
								{isProcessing ? "..." : "Send"}
							</button>
						</div>
						<p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
							Type a command or hold SPACEBAR to speak
						</p>
					</div>

					{/* Music State Display */}
					<div className="mt-6 space-y-3">
						{isProcessing && (
							<div className="text-center text-blue-600 dark:text-blue-400 text-sm animate-pulse">
								🎵 Processing command...
							</div>
						)}

						{error && (
							<div className="text-center text-red-600 dark:text-red-400 text-sm">
								❌ {error}
							</div>
						)}

						{(playbackState === "playing" || playbackState === "paused" || playbackState === "loading") && (
							<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
								<div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
									{playbackState === "playing" && "🎵 Music Playing"}
									{playbackState === "paused" && "⏸️ Music Paused"}
									{playbackState === "loading" && "⏳ Loading..."}
									<button
										onClick={() => lyriaHelper.current?.playPause()}
										className="ml-auto text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
									>
										{playbackState === "playing" ? "Pause" : "Play"}
									</button>
								</div>
								<div className="text-xs text-gray-600 dark:text-gray-400">
									BPM: {currentBpm}
								</div>
								{weightedPrompts.length > 0 && (
									<div className="space-y-1">
										<div className="text-xs font-medium text-gray-700 dark:text-gray-300">
											Active Prompts:
										</div>
										{weightedPrompts.map((prompt, idx) => (
											<div
												key={idx}
												className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
											>
												{prompt.text} (weight: {prompt.weight})
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</SignedIn>

				<SignedOut>
					<div className="flex items-center justify-center w-full">
						<AnimatedFolder
							title="Gomar"
							subtitle="music at the speed of thought"
							projects={[
								{
									id: "1",
									image:
										"https://plus.unsplash.com/premium_photo-1723489242223-865b4a8cf7b8?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
									title: "Lumnia",
								},
								{
									id: "2",
									image:
										"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
									title: "Prism",
								},
								{
									id: "3",
									image:
										"https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
									title: "Vertex",
								},
							]}
						/>
					</div>
				</SignedOut>
			</main>

			<footer className="w-full max-w-4xl flex justify-between items-center py-8 px-4 sm:px-0" />

			<div className="absolute top-4 right-4 sm:right-8">
				<button
					onClick={toggleDarkMode}
					className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
				>
					{darkMode ? <Sun size={20} /> : <Moon size={20} />}
				</button>
			</div>
		</div>
	);
}

export default App;
