/**
 * Music Logic Library for Lyria RealTime
 * Contains instrument, genre, and mood definitions with prompt generation
 * Based on Lyria RealTime API documentation
 */

// ============================================================================
// Type Definitions
// ============================================================================

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

// ============================================================================
// Instrument Database
// ============================================================================

const INSTRUMENTS: Record<string, string> = {
	// Electronic/Synth
	"303 acid bass": "303 Acid Bass with squelchy analog character",
	"808 hip hop beat": "808 Hip Hop Beat with punchy low end",
	"dirty synths": "Dirty Synths with gritty analog distortion",
	"buchla synths": "Buchla Synths with complex modular textures",
	"moog oscillations": "Moog Oscillations with fat analog warmth",
	"spacey synths": "Spacey Synths with ethereal pads",
	"synth pads": "Synth Pads with lush atmospheric textures",
	"mellotron": "Mellotron with vintage tape-based sounds",
	"rhodes piano": "Rhodes Piano with warm electric tones",

	// String Instruments
	guitar: "Guitar with rich harmonic content",
	"acoustic guitar": "Warm Acoustic Guitar with natural resonance",
	"flamenco guitar": "Flamenco Guitar with percussive techniques",
	"shredding guitar": "Shredding Guitar with fast technical runs",
	"slide guitar": "Slide Guitar with smooth gliding notes",
	bass: "Bass with deep low frequencies",
	"precision bass": "Precision Bass with tight, focused tone",
	"boomy bass": "Boomy Bass with powerful sub frequencies",
	cello: "Cello with warm, singing tone",
	"viola ensemble": "Viola Ensemble with rich mid-range harmonies",
	violin: "Violin with expressive melodic lines",
	harp: "Harp with delicate arpeggiated patterns",
	sitar: "Sitar with resonant drone strings",
	banjo: "Banjo with bright, twangy character",
	mandolin: "Mandolin with crisp, bright timbre",
	bouzouki: "Bouzouki with shimmering doubled strings",
	balalaika: "Balalaika Ensemble with Russian folk character",
	lyre: "Lyre with ancient plucked string sound",
	koto: "Koto with Japanese pentatonic scales",
	pipa: "Pipa with Chinese traditional character",
	shamisen: "Shamisen with percussive Japanese style",
	dulcimer: "Dulcimer with resonant hammered strings",
	charango: "Charango with Andean folk character",
	fiddle: "Fiddle with folk and traditional style",
	"persian tar": "Persian Tar with Middle Eastern character",

	// Percussion
	drums: "Drums with dynamic rhythmic patterns",
	"funk drums": "Funk Drums with syncopated grooves",
	"tr-909 drum machine": "TR-909 Drum Machine with classic electronic beat",
	bongos: "Bongos with Latin hand percussion",
	"conga drums": "Conga Drums with Afro-Cuban rhythms",
	tabla: "Tabla with complex Indian rhythms",
	djembe: "Djembe with West African polyrhythms",
	maracas: "Maracas with rhythmic shaker patterns",
	"steel drum": "Steel Drum with Caribbean melodic percussion",
	"hang drum": "Hang Drum with resonant meditative tones",
	marimba: "Marimba with warm wooden mallet tones",
	glockenspiel: "Glockenspiel with bright metallic chimes",
	vibraphone: "Vibraphone with shimmering sustained notes",
	kalimba: "Kalimba with African thumb piano character",
	mbira: "Mbira with metallic plucked tines",
	drumline: "Drumline with marching percussion ensemble",

	// Wind Instruments
	woodwinds: "Woodwinds with organic breath tones",
	trumpet: "Trumpet with bright brass fanfares",
	tuba: "Tuba with deep brass foundation",
	"alto saxophone": "Alto Saxophone with smooth jazz character",
	"bass clarinet": "Bass Clarinet with dark woody tone",
	flute: "Flute with airy, ethereal quality",
	harmonica: "Harmonica with bluesy bent notes",
	accordion: "Accordion with European folk character",
	bagpipes: "Bagpipes with droning highland character",
	didgeridoo: "Didgeridoo with deep circular breathing",
	ocarina: "Ocarina with pure, simple tone",

	// Keyboard/Piano
	piano: "Piano with expressive dynamic range",
	"ragtime piano": "Ragtime Piano with syncopated stride patterns",
	"smooth pianos": "Smooth Pianos with polished tones",
	harpsichord: "Harpsichord with baroque plucked character",
	clavichord: "Clavichord with intimate expressive nuance",
	organ: "Organ with sustained harmonic richness",

	// Unique/Experimental
	"metallic twang": "Metallic Twang with industrial resonance",
	"hurdy-gurdy": "Hurdy-gurdy with droning wheel-bowed strings",
};

// ============================================================================
// Genre Database
// ============================================================================

const GENRES: Record<string, string> = {
	// Electronic
	techno: "Minimal Techno with hypnotic repetitive patterns",
	"minimal techno": "Minimal Techno with stripped-down elements",
	edm: "EDM with energetic build-ups and drops",
	house: "Deep House with groovy basslines",
	"deep house": "Deep House with soulful vibes",
	dubstep: "Dubstep with heavy wobble bass",
	"drum & bass": "Drum & Bass with fast breakbeats",
	"drum and bass": "Drum & Bass with rapid percussion",
	trance: "Trance with uplifting melodic progressions",
	psytrance: "Psytrance with psychedelic textures",
	breakbeat: "Breakbeat with syncopated rhythms",
	"glitch hop": "Glitch Hop with digital artifacts",
	electro: "Electro with robotic funk elements",
	"electro swing": "Electro Swing with vintage samples",
	chiptune: "Chiptune with 8-bit retro sounds",
	vaporwave: "Vaporwave with nostalgic 80s aesthetic",
	synthpop: "Synthpop with catchy electronic hooks",
	"indie electronic": "Indie Electronic with experimental textures",
	chillout: "Chillout with relaxed ambient vibes",
	downtempo: "Downtempo with laid-back grooves",

	// Hip Hop/Urban
	"hip hop": "Hip Hop with boom-bap beats",
	"lo-fi hip hop": "Lo-Fi Hip Hop with nostalgic samples",
	trap: "Trap Beat with hard-hitting 808s",
	"trap beat": "Trap Beat with modern urban edge",
	"g-funk": "G-funk with smooth West Coast vibes",
	grime: "Grime with UK underground energy",
	"new jack swing": "New Jack Swing with 90s R&B fusion",

	// Rock/Alternative
	rock: "Classic Rock with powerful guitar riffs",
	"classic rock": "Classic Rock with timeless energy",
	"blues rock": "Blues Rock with soulful guitar bends",
	"indie rock": "Indie Rock with alternative sensibilities",
	"garage rock": "Garage Rock with raw, unpolished energy",
	"surf rock": "Surf Rock with reverb-drenched guitars",
	punk: "Punk with fast aggressive energy",
	"post-punk": "Post-Punk with angular art-rock elements",
	"psychedelic rock": "60s Psychedelic Rock with swirling effects",
	"60s psychedelic rock": "60s Psychedelic Rock with vintage fuzz",
	shoegaze: "Shoegaze with walls of distorted guitars",
	grunge: "Grunge with heavy alternative sound",
	metal: "Metal with heavy distorted power",
	"funk metal": "Funk Metal with groovy aggressive fusion",

	// Jazz/Blues
	jazz: "Jazz with sophisticated improvisation",
	"acid jazz": "Acid Jazz with funky electronic elements",
	"jazz fusion": "Jazz Fusion with complex harmonic progressions",
	"latin jazz": "Latin Jazz with Afro-Cuban rhythms",
	blues: "Blues with soulful emotional depth",
	"delta blues": "Delta Blues with raw acoustic character",
	funk: "Funk with tight syncopated grooves",
	"disco funk": "Disco Funk with danceable basslines",

	// World/Folk
	"celtic folk": "Celtic Folk with traditional Irish melodies",
	"irish folk": "Irish Folk with jigs and reels",
	"indie folk": "Indie Folk with acoustic storytelling",
	bluegrass: "Bluegrass with fast string picking",
	country: "Country with twangy heartfelt melodies",
	"alternative country": "Alternative Country with modern edge",
	reggae: "Reggae with offbeat ska rhythms",
	"jamaican dub": "Jamaican Dub with heavy bass and echo",
	ska: "Ska with upbeat horn sections",
	salsa: "Salsa with Latin dance percussion",
	cumbia: "Cumbia with Colombian folk rhythms",
	merengue: "Merengue with fast Dominican beats",
	reggaeton: "Reggaeton with urban Latin flow",
	bossa: "Bossa Nova with smooth Brazilian jazz",
	"bossa nova": "Bossa Nova with gentle samba rhythms",
	samba: "Samba with Brazilian carnival energy",
	afrobeat: "Afrobeat with West African polyrhythms",
	bhangra: "Bhangra with Punjabi folk energy",
	"indian classical": "Indian Classical with raga structures",
	"bengal baul": "Bengal Baul with mystical folk character",
	flamenco: "Flamenco with passionate Spanish guitar",
	polka: "Polka with accordion-driven dance rhythms",

	// Classical/Orchestral
	classical: "Classical with orchestral arrangements",
	baroque: "Baroque with ornate counterpoint",
	"renaissance music": "Renaissance Music with early polyphony",
	"orchestral score": "Orchestral Score with cinematic sweep",
	"marching band": "Marching Band with brass and percussion",

	// R&B/Soul
	"r&b": "R&B with smooth vocal harmonies",
	"contemporary r&b": "Contemporary R&B with modern production",
	"neo-soul": "Neo-Soul with organic instrumentation",
	soul: "Soul with emotional vocal delivery",
	gospel: "Gospel with uplifting spiritual harmonies",

	// Other
	"piano ballad": "Piano Ballad with intimate emotional delivery",
	ambient: "Ambient with atmospheric soundscapes",
	"trip hop": "Trip Hop with downtempo beats",
	moombahton: "Moombahton with Latin-influenced house",
	"witch house": "Witch house with dark occult aesthetics",
	hyperpop: "Hyperpop with hyperactive maximalist production",
	"jam band": "Jam Band with extended improvisations",
};

// ============================================================================
// Mood/Description Database
// ============================================================================

const MOODS: Record<string, string> = {
	// Energy Levels
	chill: "Chill and relaxed atmosphere",
	relaxed: "Relaxed and easy-going vibe",
	mellow: "Mellow with smooth textures",
	calm: "Calm and peaceful mood",
	serene: "Serene with tranquil ambience",
	upbeat: "Upbeat with positive energy",
	energetic: "Energetic with driving momentum",
	intense: "Intense with powerful dynamics",
	aggressive: "Aggressive with raw energy",
	fierce: "Fierce with unrelenting force",

	// Emotional Quality
	happy: "Happy and joyful character",
	cheerful: "Cheerful with bright melodies",
	playful: "Playful with bouncy rhythms",
	romantic: "Romantic with tender emotions",
	melancholic: "Melancholic with wistful sadness",
	nostalgic: "Nostalgic with sentimental reflection",
	emotional: "Emotional with deep feeling",
	dramatic: "Dramatic with theatrical flair",
	epic: "Epic with grand cinematic scope",
	triumphant: "Triumphant with victorious spirit",

	// Darkness/Light
	dark: "Dark with ominous undertones",
	ominous: "Ominous Drone with foreboding atmosphere",
	mysterious: "Mysterious with enigmatic quality",
	haunting: "Haunting with eerie presence",
	unsettling: "Unsettling with disturbing textures",
	gloomy: "Gloomy with shadowy mood",
	bright: "Bright Tones with luminous quality",
	radiant: "Radiant with shimmering brilliance",
	sunny: "Sunny with warm optimism",
	ethereal: "Ethereal Ambience with otherworldly character",

	// Texture/Production
	dreamy: "Dreamy with hazy atmosphere",
	ambient: "Ambient with spacious soundscapes",
	atmospheric: "Atmospheric with immersive depth",
	lush: "Rich Orchestration with layered complexity",
	sparse: "Minimal with spacious arrangement",
	dense: "Dense with busy layered textures",
	raw: "Raw with unpolished edge",
	polished: "Polished with clean production",
	"lo-fi": "Lo-fi with vintage tape warmth",
	"hi-fi": "Hi-fi with pristine clarity",

	// Movement/Rhythm
	groovy: "Groovy with infectious rhythm",
	funky: "Funky with syncopated bass",
	danceable: "Danceable with compelling beat",
	swinging: "Swinging with jazz rhythm",
	driving: "Driving with propulsive energy",
	flowing: "Flowing with smooth progression",
	rhythmic: "Rhythmic with strong pulse",
	syncopated: "Syncopated with off-beat accents",

	// Special Effects
	psychedelic: "Psychedelic with mind-bending effects",
	"swirling phasers": "Swirling Phasers with modulated movement",
	echo: "Echo with repeating delays",
	reverb: "Reverb with spacious ambience",
	distorted: "Distorted with overdriven saturation",
	"crunchy distortion": "Crunchy Distortion with gritty edge",
	"saturated tones": "Saturated Tones with harmonic richness",
	"glitchy effects": "Glitchy Effects with digital artifacts",
	filtered: "Filtered with spectral shaping",

	// Performance Style
	"live performance": "Live Performance with human feel",
	improvisational: "Improvisational with spontaneous creativity",
	virtuoso: "Virtuoso with technical mastery",
	expressive: "Expressive with dynamic nuance",
	tight: "Tight Groove with precise timing",
	loose: "Loose with relaxed feel",

	// Descriptive
	experimental: "Experimental with unconventional sounds",
	"weird noises": "Weird Noises with unusual timbres",
	"acoustic instruments": "Acoustic Instruments with natural tone",
	electronic: "Electronic with synthesized sounds",
	organic: "Organic with natural character",
	mechanical: "Mechanical with robotic precision",
	futuristic: "Futuristic with sci-fi aesthetics",
	retro: "Retro with vintage character",
	vintage: "Vintage with classic sound",
	modern: "Modern with contemporary production",

	// Specific Qualities
	"sustained chords": "Sustained Chords with long harmonic pads",
	"subdued melody": "Subdued Melody with understated themes",
	"fat beats": "Fat Beats with thick punchy drums",
	"huge drop": "Huge Drop with massive energy release",
	smooth: "Smooth with polished transitions",
	crisp: "Crisp with sharp definition",
	warm: "Warm with rich low-mid frequencies",
	cool: "Cool with relaxed sophistication",
	hot: "Hot with fiery intensity",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get prompt for a specific instrument
 */
export function getInstrumentPrompt(instrumentName: string): { text: string } {
	const normalized = instrumentName.toLowerCase().trim();
	const prompt = INSTRUMENTS[normalized];

	if (prompt) {
		return { text: prompt };
	}

	// Fuzzy match - try to find partial matches
	for (const [key, value] of Object.entries(INSTRUMENTS)) {
		if (key.includes(normalized) || normalized.includes(key)) {
			return { text: value };
		}
	}

	// Fallback - create generic prompt
	return { text: `${instrumentName} with expressive character` };
}

/**
 * Get prompt for a music genre
 */
export function getGenrePrompt(genreName: string): { text: string } {
	const normalized = genreName.toLowerCase().trim();
	const prompt = GENRES[normalized];

	if (prompt) {
		return { text: prompt };
	}

	// Fuzzy match
	for (const [key, value] of Object.entries(GENRES)) {
		if (key.includes(normalized) || normalized.includes(key)) {
			return { text: value };
		}
	}

	// Fallback
	return { text: `${genreName} style with authentic character` };
}

/**
 * Get prompt for a mood or feeling
 */
export function getMoodPrompt(moodDescription: string): { text: string } {
	const normalized = moodDescription.toLowerCase().trim();
	const prompt = MOODS[normalized];

	if (prompt) {
		return { text: prompt };
	}

	// Fuzzy match
	for (const [key, value] of Object.entries(MOODS)) {
		if (key.includes(normalized) || normalized.includes(key)) {
			return { text: value };
		}
	}

	// Fallback
	return { text: `${moodDescription} atmosphere with emotional depth` };
}

/**
 * Create a weighted prompt (weight cannot be 0)
 */
export function createWeightedPrompt(
	text: string,
	weight: number = 1.0
): WeightedPrompt {
	if (weight === 0) {
		throw new Error("Weight cannot be 0. Use a value between 0.1 and 3.0.");
	}

	// Clamp weight to reasonable range
	const clampedWeight = Math.max(0.1, Math.min(3.0, weight));

	return {
		text,
		weight: clampedWeight,
	};
}

/**
 * Calculate new BPM based on modification request
 */
export function calculateBpmChange(
	currentBpm: number,
	modification: string
): number {
	const mod = modification.toLowerCase();

	if (mod.includes("double") || mod.includes("twice")) {
		return Math.min(200, Math.round(currentBpm * 2));
	}

	if (mod.includes("half") || mod.includes("slow down")) {
		return Math.max(60, Math.round(currentBpm / 2));
	}

	if (mod.includes("faster") || mod.includes("speed up") || mod.includes("quicker")) {
		return Math.min(200, Math.round(currentBpm * 1.2));
	}

	if (mod.includes("slower") || mod.includes("slow")) {
		return Math.max(60, Math.round(currentBpm * 0.8));
	}

	if (mod.includes("much faster") || mod.includes("way faster")) {
		return Math.min(200, Math.round(currentBpm * 1.5));
	}

	if (mod.includes("much slower") || mod.includes("way slower")) {
		return Math.max(60, Math.round(currentBpm * 0.6));
	}

	// No clear modification - return current
	return currentBpm;
}

/**
 * Calculate density change (0.0 = sparse, 1.0 = busy)
 */
export function calculateDensityChange(
	currentDensity: number | null,
	modification: string
): number {
	const mod = modification.toLowerCase();
	const current = currentDensity ?? 0.5; // Default to middle

	if (
		mod.includes("busier") ||
		mod.includes("more busy") ||
		mod.includes("denser") ||
		mod.includes("fuller")
	) {
		return Math.min(1.0, current + 0.2);
	}

	if (
		mod.includes("sparser") ||
		mod.includes("more sparse") ||
		mod.includes("minimal") ||
		mod.includes("simpler") ||
		mod.includes("stripped down")
	) {
		return Math.max(0.0, current - 0.2);
	}

	if (mod.includes("very busy") || mod.includes("maximum")) {
		return 1.0;
	}

	if (mod.includes("very sparse") || mod.includes("very minimal")) {
		return 0.1;
	}

	return current;
}

/**
 * Calculate brightness change (0.0 = dark, 1.0 = bright)
 */
export function calculateBrightnessChange(
	currentBrightness: number | null,
	modification: string
): number {
	const mod = modification.toLowerCase();
	const current = currentBrightness ?? 0.5; // Default to middle

	if (
		mod.includes("brighter") ||
		mod.includes("lighter") ||
		mod.includes("more bright")
	) {
		return Math.min(1.0, current + 0.2);
	}

	if (
		mod.includes("darker") ||
		mod.includes("more dark") ||
		mod.includes("dimmer")
	) {
		return Math.max(0.0, current - 0.2);
	}

	if (mod.includes("very bright") || mod.includes("brightest")) {
		return 1.0;
	}

	if (mod.includes("very dark") || mod.includes("darkest")) {
		return 0.0;
	}

	return current;
}

// ============================================================================
// List Functions (for UI/exploration)
// ============================================================================

export function listAvailableInstruments(): string[] {
	return Object.keys(INSTRUMENTS).sort();
}

export function listAvailableGenres(): string[] {
	return Object.keys(GENRES).sort();
}

export function listAvailableMoods(): string[] {
	return Object.keys(MOODS).sort();
}

// ============================================================================
// Scale Enum (from Lyria API)
// ============================================================================

export const SCALES = {
	C_MAJOR_A_MINOR: "C major / A minor",
	D_FLAT_MAJOR_B_FLAT_MINOR: "D♭ major / B♭ minor",
	D_MAJOR_B_MINOR: "D major / B minor",
	E_FLAT_MAJOR_C_MINOR: "E♭ major / C minor",
	E_MAJOR_D_FLAT_MINOR: "E major / C♯/D♭ minor",
	F_MAJOR_D_MINOR: "F major / D minor",
	G_FLAT_MAJOR_E_FLAT_MINOR: "G♭ major / E♭ minor",
	G_MAJOR_E_MINOR: "G major / E minor",
	A_FLAT_MAJOR_F_MINOR: "A♭ major / F minor",
	A_MAJOR_G_FLAT_MINOR: "A major / F♯/G♭ minor",
	B_FLAT_MAJOR_G_MINOR: "B♭ major / G minor",
	B_MAJOR_A_FLAT_MINOR: "B major / G♯/A♭ minor",
	SCALE_UNSPECIFIED: "Default / The model decides",
} as const;

