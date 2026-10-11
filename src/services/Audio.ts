// FILE-PATH: src/services/Audio.ts

/**
 * Supported sound effect identifiers within the simulation application.
 * - 'lift': The launching whistle or rocket hiss sound.
 * - 'burst': The primary heavy detonation of a large firework.
 * - 'burstSmall': Secondary or smaller fragment explosions.
 * - 'crackle': Sharp, crackling background ambient sparks.
 * - 'crackleSmall': Rapid, micro-crackle sparkling noise.
 */
export type SoundType = 'lift' | 'burst' | 'burstSmall' | 'crackle' | 'crackleSmall';

/**
 * Internal configuration schema for a specific group of sound assets.
 */
interface AudioConfig {
    // The base volume scalar assigned to this sound group (0.0 to 1.0).
    volume: number;
    // The minimum pitch/playback scale boundary for randomization (e.g., 0.85).
    playbackRateMin: number;
    // The maximum pitch/playback scale boundary for randomization (e.g., 1.15).
    playbackRateMax: number;
    // An array of file name strings representing separate variations of the sound effect.
    readonly fileNames: readonly string[];
    // Caching array housing the fully parsed and decoded in-memory AudioBuffer streams.
    buffers?: AudioBuffer[];
}

/**
 * Configuration options required to instantiate the Audio manager class.
 */
export interface AudioOptions {
    // Dynamic callback function checking if primary audio playback is currently enabled.
    canPlaySound: () => boolean;
    // Dynamic callback evaluating the current speed modifier of the simulation loop.
    getSimulationSpeed: () => number;
    // The root deployment target folder or remote asset CDN url where files reside.
    baseUrl?: string;
}

/**
 * Structural type mapping the cross-browser constructor footprint
 * for the built-in Web Audio Context.
 */
type AudioContextConstructor = { new (contextOptions?: AudioContextOptions): AudioContext; prototype: AudioContext };

/**
 * High-performance audio manager utilizing the Web Audio API.
 *
 * Explicitly designed to handle low-latency playback of dense
 * overlapping sound effects (such as particles and fireworks)
 * by managing audio graphs natively on background browser threads.
 */
export class Audio {
    // The primary hardware execution node container handling memory audio charts.
    private readonly context: AudioContext;
    // Cached application callback validating if global sound playback rules are currently allowed.
    private readonly canPlaySound: () => boolean;
    // Cached application callback fetching real-time simulation speeds to scale playback pitches.
    private readonly getSimulationSpeed: () => number;
    // Sanitized absolute path target location pointing toward the raw static sound assets.
    private readonly baseUrl: string;

    // Internal registry detailing operational volumes, variance structures,
    // and file targets for each effect category.
    private readonly sources: Record<SoundType, AudioConfig> = {
        lift: {
            volume: 1,
            playbackRateMin: 0.85,
            playbackRateMax: 0.95,
            fileNames: ['lift1.mp3', 'lift2.mp3', 'lift3.mp3'],
        },
        burst: {
            volume: 1,
            playbackRateMin: 0.8,
            playbackRateMax: 0.9,
            fileNames: ['burst1.mp3', 'burst2.mp3'],
        },
        burstSmall: {
            volume: 0.25,
            playbackRateMin: 0.8,
            playbackRateMax: 1,
            fileNames: ['burst-sm-1.mp3', 'burst-sm-2.mp3'],
        },
        crackle: {
            volume: 0.2,
            playbackRateMin: 1,
            playbackRateMax: 1,
            fileNames: ['crackle1.mp3'],
        },
        crackleSmall: {
            volume: 0.3,
            playbackRateMin: 1,
            playbackRateMax: 1,
            fileNames: ['crackle-sm-1.mp3'],
        },
    };

    // Epoch timestamp track preventing rapid audio clipping overlaps during
    // heavy particle burst instances.
    private lastSmallBurstTime = 0;

    /**
     * Initializes the Web Audio environment configurations and ensures platform capability.
     * @param options Execution rule settings passed down from the root canvas initialization tree.
     * @throws {Error} If the runtime web browser environment does not support the Web Audio API.
     */
    public constructor(options: AudioOptions) {
        this.canPlaySound = options.canPlaySound;
        this.getSimulationSpeed = options.getSimulationSpeed;

        // Cleanse trailing forward slash symbols out of path strings
        // to prevent file interpolation breaks.
        const providedUrl = options.baseUrl ?? '/sounds/';
        this.baseUrl = providedUrl.endsWith('/') ? providedUrl : `${providedUrl}/`;

        // Resolve vendor prefixes natively mapping to older versions
        // of Apple Webkit engines.
        const AudioContextConstructor: AudioContextConstructor =
            window.AudioContext ??
            (
                window as Window & {
                    webkitAudioContext?: typeof AudioContext;
                }
            ).webkitAudioContext;

        if (!AudioContextConstructor) {
            throw new Error('Web Audio API is not supported in this browser.');
        }

        this.context = new AudioContextConstructor();
    }

    /**
     * Loops through registered configuration profiles to gather, download,
     * and decode audio buffers. Handles dynamic path constructions as basic
     * HTTP fetches to safely avoid build bundle compiler warnings.
     *
     * @returns A promise resolving completely once every single sound configuration group is loaded into memory cache.
     */
    public preload = async (): Promise<void> => {
        const allFilePromises: Promise<AudioBuffer>[] = [];

        for (const source of Object.values(this.sources)) {
            const filePromises: Promise<AudioBuffer>[] = source.fileNames.map(
                (fileName: string): Promise<AudioBuffer> => {
                    const fileUrl: string = `${this.baseUrl}${fileName}`;

                    const promise: Promise<AudioBuffer> = fetch(fileUrl)
                        .then((response: Response): Response => this.checkResponseStatus(response))
                        .then((response: Response): Promise<ArrayBuffer> => response.arrayBuffer())
                        .then((data: ArrayBuffer): Promise<AudioBuffer> => this.decodeAudioData(data));

                    allFilePromises.push(promise);

                    return promise;
                },
            );

            source.buffers = await Promise.all(filePromises);
        }

        await Promise.all(allFilePromises);
    };

    /**
     * Suspends the primary hardware contextual audio thread loop.
     * Instantly mutes all ongoing playback loops and decreases thread
     * processing load when the window minimizes.
     */
    public pauseAll(): void {
        void this.context.suspend();
    }

    /**
     * Wakes the background hardware execution thread stream context up.
     * Triggers a silent mock sound internally to gracefully bypass legacy
     * browser interaction autoplay security rules.
     */
    public resumeAll(): void {
        this.playSound('lift', 0);

        window.setTimeout((): void => {
            void this.context.resume();
        }, 250);
    }

    /**
     * Generates and fires a lightweight standalone hardware streaming
     * source channel loop. Dynamically calculates custom playback rates
     * and scaling nodes based on canvas particle physics sizes.
     *
     * @param type  The sound type profile to trigger.
     * @param scale A multiplier scalar value (0.0 to 1.0) generally
     *              reflecting firework size or proximity depth.
     */
    public playSound(type: SoundType, scale = 1): void {
        const clampedScale: number = this.clamp(scale, 0, 1);

        // Terminate play immediately if blocked by user choices or slow simulation rates.
        if (!this.canPlaySound() || this.getSimulationSpeed() < 0.95) return;

        // Throttling protection: prevents rapid crackles from overloading system speaker hardware.
        if (type === 'burstSmall') {
            const now: number = Date.now();
            if (now - this.lastSmallBurstTime < 20) return;
            this.lastSmallBurstTime = now;
        }

        const source: AudioConfig = this.sources[type];

        if (!source) throw new Error(`Sound of type "${type}" does not exist.`);
        if (!source.buffers?.length) return;

        const initialVolume: number = source.volume;
        const initialPlaybackRate: number = this.random(source.playbackRateMin, source.playbackRateMax);

        // Physics audio scaling mappings (smaller explosions sound lighter and
        // produce slightly snappier high-pitched pop waves).
        const scaledVolume: number = initialVolume * clampedScale;
        const scaledPlaybackRate: number = initialPlaybackRate * (2 - clampedScale);

        // Hardware Routing: Setup a programmable Gain control processor
        //  module inside the Context scope.
        const gainNode = this.context.createGain();
        gainNode.gain.value = scaledVolume;

        const buffer: AudioBuffer = this.randomChoice(source.buffers);

        // Hardware Routing: Instantiate an ultra-fast hardware pointer tracking
        // reference link node.
        const bufferSource: AudioBufferSourceNode = this.context.createBufferSource();
        bufferSource.playbackRate.value = scaledPlaybackRate;
        bufferSource.buffer = buffer;

        // Chain components:
        // [Raw Streaming Data Node] --->
        //                         [Volume Gain Modifier Module] --->
        //                                                     [System Main Output Speakers]
        bufferSource.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Deploy instantly into action (Zero seconds time-delay target).
        bufferSource.start(0);
    }

    /**
     * Decodes the raw binary array data into an AudioBuffer using the modern Promise API.
     * Fixes signature incompatibility errors introduced by strict compiler engine checks.
     *
     * @param data Raw compressed asset array chunks pulled downstream from network fetches.
     * @returns A promise resolving to a decoded hardware-built-in operational clip array.
     */
    private async decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer> {
        return this.context.decodeAudioData(data);
    }

    /**
     * Validates if HTTP operations returned standard success status flags.
     *
     * @param response The network response stream incoming from asset directories.
     * @returns The safe upstream verified response mapping configuration.
     * @throws {Error} If resource targets are missing (404) or blocked by CORS issues.
     */
    private checkResponseStatus(response: Response): Response {
        if (response.ok) return response;
        throw new Error(`Unable to load audio asset: ${response.status} ${response.statusText}`);
    }

    /**
     * Utility boundaries lock module keeping numbers comfortably
     * pinned between a minimum and maximum range.
     *
     * @param value Target metric evaluating variables.
     * @param min Lowest allowed constraint ceiling.
     * @param max Highest allowed constraint ceiling.
     * @returns The safely clamped final position outcome.
     */
    private clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Generates a pseudorandom floating-point value.
     * Used to vary sound effects slightly so repetitive firework
     * sounds don't sound mechanical or artificial.
     *
     * @param min Lower scope bounding value.
     * @param max Upper scope bounding value.
     * @returns A randomized entry matching the calculated layout bounds.
     */
    private random(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Picks an item completely at random from a given sequence list.
     *
     * @param items Shared generic collection array targets.
     * @returns A singular random array item selected from the collection.
     */
    private randomChoice<T>(items: readonly T[]): T {
        const index: number = Math.floor(Math.random() * items.length);
        return items[index]!;
    }
}
