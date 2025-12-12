import { useState, useEffect, useRef } from "react";
import { Settings, Moon, Sun, Play, Pause } from "lucide-react";
import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
	useUser,
} from "@clerk/clerk-react";

// Check if Clerk is available
const isClerkAvailable = () => {
	try {
		return !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
	} catch {
		return false;
	}
};
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
  const clerkAvailable = isClerkAvailable();
  const [darkMode, setDarkMode] = useState(false);
	const [isRecording, setIsRecording] = useState(false);

	// Music state
	const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
	const [currentBpm, setCurrentBpm] = useState(120);
  const [weightedPrompts, setWeightedPrompts] = useState<WeightedPrompt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
	const [textInput, setTextInput] = useState("");
	const [playbackTime, setPlaybackTime] = useState(0);

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

		// Listen for playback time updates
		helper.addEventListener("playback-time-updated", ((e: Event) => {
			const customEvent = e as CustomEvent<number>;
			setPlaybackTime(customEvent.detail);
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

	const formatTime = (seconds: number) => {
		if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
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

				// Validate prompts before proceeding
				if (!result.weighted_prompts || result.weighted_prompts.length === 0) {
					setError("No prompts generated. Please try a different command.");
					setIsProcessing(false);
					console.error("❌ No prompts returned from Gemini:", result);
					return;
				}

				// Start Lyria playback - ensure session connects first
				console.log("🎶 Starting Lyria with prompts:", result.weighted_prompts);
				console.log("🎶 Config:", result.config);
				
				// Connect session first, then set prompts
				await lyriaHelper.current.play(); // This connects the session
				await lyriaHelper.current.setWeightedPrompts(
					result.weighted_prompts,
					result.config
				);
				// Reset playback time when starting new music
				setPlaybackTime(0);
			} else {
				// Modify existing music
				console.log("🎵 Modifying music with:", transcript);
				const wasPlaying = playbackState === "playing";
				const wasPaused = playbackState === "paused";
				
				result = await interpretModifyCommand({
					transcript,
					currentBpm,
					currentPrompts: weightedPrompts.map((p) => p.text),
				});

				// Combine old and new prompts
				const updatedPrompts = result.weighted_prompts.length > 0
					? [...weightedPrompts, ...result.weighted_prompts]
					: weightedPrompts;

				// Validate prompts
				if (updatedPrompts.length === 0) {
					setError("No valid prompts after modification. Please try a different command.");
					setIsProcessing(false);
					return;
				}

				// Handle reset requirement (BPM or scale change)
				if (result.requires_reset) {
					console.log("🔄 Resetting Lyria session (keeping all prompts)");
					lyriaHelper.current.stop();
					// Ensure session is connected before setting prompts
					await lyriaHelper.current.setWeightedPrompts(updatedPrompts, result.config);
					// Resume playback if it was playing before
					if (wasPlaying) {
						await lyriaHelper.current.play();
					}
				} else {
					// Just update prompts/config without reset
					console.log("🎶 Updating Lyria prompts (adding to existing)");
					// Preserve current playback state - don't call play() if already playing
					await lyriaHelper.current.setWeightedPrompts(
						updatedPrompts,
						result.config
					);
					// If it was paused, ensure it stays paused (setWeightedPrompts won't change state)
					// If it was playing, it should continue playing automatically
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
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <header className="w-full max-w-4xl flex justify-between items-center py-2 sm:py-3 md:py-4 px-2 sm:px-4">
        <div className="text-xs sm:text-sm font-medium opacity-60 dark:opacity-40 tracking-wider">
          Gomar33
        </div>
				<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
					{clerkAvailable ? (
						<>
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
									<button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-black hover:bg-gray-900 text-white transition-colors">
										Sign In
									</button>
								</SignInButton>
							</SignedOut>
						</>
					) : null}
        <button className="p-1.5 sm:p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-gray-500 dark:text-gray-400">
          <Settings size={20} className="sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
        </button>
				</div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl relative px-2 sm:px-4">
				{clerkAvailable ? (
					<SignedIn>
					<div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mb-4 sm:mb-6 md:mb-8">
						<VoicePoweredOrb
							enableVoiceControl={isRecording}
							className="rounded-full shadow-none"
						/>
					</div>

					<div className="w-full space-y-3 sm:space-y-4">
						<Waveform 
							progress={playbackState === "playing" || playbackState === "paused" ? Math.min(playbackTime / 300, 1) : 0} 
						/>

						<div className="flex items-center justify-center gap-2 sm:gap-3">
							<button
								onClick={() => {
									if (lyriaHelper.current) {
										if (playbackState === "stopped") {
											// If stopped, need to start music first
											console.log("Music is stopped, start music with a voice command first");
										} else {
											lyriaHelper.current.playPause();
										}
									}
								}}
								disabled={playbackState === "loading" || playbackState === "stopped"}
								className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 active:scale-95 ${
									playbackState === "stopped" 
										? "opacity-30 cursor-not-allowed" 
										: playbackState === "loading"
										? "opacity-60 cursor-wait"
										: "opacity-90 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
								aria-label={playbackState === "playing" ? "Pause" : "Play"}
							>
								{playbackState === "playing" ? (
									<Pause className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" fill="currentColor" />
								) : playbackState === "loading" ? (
									<div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
								) : (
									<Play className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200 ml-0.5" fill="currentColor" />
								)}
							</button>
          <div className="text-center font-mono text-base sm:text-lg tracking-widest text-gray-500 dark:text-gray-400">
								<span className="text-gray-800 dark:text-white font-medium">
									{formatTime(playbackTime)}
								</span>
							</div>
          </div>
        </div>

          <SpeechRecognition
            onTranscriptComplete={handleVoiceCommand}
          />

					{/* Text Input */}
					<div className="mt-1 w-full max-w-md px-2 sm:px-0">
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
										? "Type to modify..."
										: "\"make a chill beat\""
								}
								className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
								className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
							>
								{isProcessing ? "..." : "Send"}
							</button>
						</div>
						<p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center px-2">
							Type a command or hold SPACEBAR to speak
						</p>
					</div>

					{/* Music State Display */}
					<div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 px-2 sm:px-0">
						{isProcessing && (
							<div className="text-center text-xs sm:text-sm animate-pulse opacity-60">
								Processing...
							</div>
						)}

						{error && (
							<div className="text-center text-xs sm:text-sm text-red-500 dark:text-red-400 opacity-80 px-2">
								{error}
							</div>
						)}

						{(playbackState === "playing" || playbackState === "paused" || playbackState === "loading") && (
							<div className="space-y-2 sm:space-y-3">
								{/* Playback Controls */}
								<div className="flex items-center justify-between text-xs sm:text-sm opacity-60">
									<div className="flex items-center gap-2 sm:gap-3">
										<span className="font-mono text-sm sm:text-base">
											{playbackState === "playing" && "▶"}
											{playbackState === "paused" && "⏸"}
											{playbackState === "loading" && "⏳"}
										</span>
										<span className="font-mono tracking-wider">{currentBpm} BPM</span>
									</div>
									<button
										onClick={() => lyriaHelper.current?.playPause()}
										className="px-2 sm:px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
									>
										{playbackState === "playing" ? "Pause" : "Play"}
									</button>
								</div>

								{/* Active Prompts */}
								{weightedPrompts.length > 0 && (
									<div className="space-y-1.5 sm:space-y-2">
										<div className="text-[10px] sm:text-xs font-medium opacity-40 tracking-wider uppercase">
											Active Elements
										</div>
										<div className="flex flex-wrap gap-1.5 sm:gap-2">
											{weightedPrompts.map((prompt, idx) => (
												<div
													key={idx}
													className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-[10px] sm:text-xs opacity-70 hover:opacity-100 transition-opacity max-w-full truncate"
													style={{
														backdropFilter: "blur(10px)",
													}}
													title={prompt.text}
												>
													{prompt.text}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
					</SignedIn>
				) : (
					<>
						<div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mb-4 sm:mb-6 md:mb-8">
							<VoicePoweredOrb
								enableVoiceControl={isRecording}
								className="rounded-full shadow-none"
							/>
						</div>

						<div className="w-full space-y-4">
							<Waveform 
								progress={playbackState === "playing" || playbackState === "paused" ? Math.min(playbackTime / 300, 1) : 0} 
							/>

							<div className="flex items-center justify-center gap-3">
								<button
									onClick={() => {
										if (lyriaHelper.current) {
											if (playbackState === "stopped") {
												console.log("Music is stopped, start music with a voice command first");
											} else {
												lyriaHelper.current.playPause();
											}
										}
									}}
									disabled={playbackState === "loading" || playbackState === "stopped"}
									className={`p-2.5 rounded-full transition-all duration-200 active:scale-95 ${
										playbackState === "stopped" 
											? "opacity-30 cursor-not-allowed" 
											: playbackState === "loading"
											? "opacity-60 cursor-wait"
											: "opacity-90 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
									}`}
									aria-label={playbackState === "playing" ? "Pause" : "Play"}
								>
									{playbackState === "playing" ? (
										<Pause className="w-6 h-6 text-gray-800 dark:text-gray-200" fill="currentColor" />
									) : playbackState === "loading" ? (
										<div className="w-6 h-6 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
									) : (
										<Play className="w-6 h-6 text-gray-800 dark:text-gray-200 ml-0.5" fill="currentColor" />
									)}
								</button>
								<div className="text-center font-mono text-lg tracking-widest text-gray-500 dark:text-gray-400">
									<span className="text-gray-800 dark:text-white font-medium">
										{formatTime(playbackTime)}
									</span>
								</div>
							</div>
						</div>

						<SpeechRecognition
							onTranscriptComplete={handleVoiceCommand}
						/>

						<div className="mt-1 w-full max-w-md px-2 sm:px-0">
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
											? "Type to modify..."
											: "\"make a chill beat\""
									}
									className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
									className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
								>
									{isProcessing ? "..." : "Send"}
								</button>
							</div>
							<p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center px-2">
								Type a command or hold SPACEBAR to speak
							</p>
						</div>

						<div className="mt-4 space-y-4">
							{isProcessing && (
								<div className="text-center text-sm animate-pulse opacity-60">
									Processing...
								</div>
							)}

							{error && (
								<div className="text-center text-sm text-red-500 dark:text-red-400 opacity-80">
									{error}
								</div>
							)}

							{(playbackState === "playing" || playbackState === "paused" || playbackState === "loading") && (
								<div className="space-y-3">
									<div className="flex items-center justify-between text-sm opacity-60">
										<div className="flex items-center gap-3">
											<span className="font-mono">
												{playbackState === "playing" && "▶"}
												{playbackState === "paused" && "⏸"}
												{playbackState === "loading" && "⏳"}
											</span>
											<span className="font-mono tracking-wider">{currentBpm} BPM</span>
										</div>
										<button
											onClick={() => lyriaHelper.current?.playPause()}
											className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium"
										>
											{playbackState === "playing" ? "Pause" : "Play"}
										</button>
									</div>

									{weightedPrompts.length > 0 && (
										<div className="space-y-2">
											<div className="text-xs font-medium opacity-40 tracking-wider uppercase">
												Active Elements
											</div>
											<div className="flex flex-wrap gap-2">
												{weightedPrompts.map((prompt, idx) => (
													<div
														key={idx}
														className="px-3 py-1.5 rounded-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-xs opacity-70 hover:opacity-100 transition-opacity"
														style={{
															backdropFilter: "blur(10px)",
														}}
													>
														{prompt.text}
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</>
				)}

				{clerkAvailable && (
					<SignedOut>
						<div className="flex items-center justify-center w-full px-2 sm:px-4">
							<AnimatedFolder
								title="Gomar33"
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
				)}
      </main>

      <footer className="w-full max-w-4xl flex justify-between items-center py-4 sm:py-6 md:py-8 px-2 sm:px-4" />
    </div>
  );
}

export default App;
