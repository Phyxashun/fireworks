// FILE-PATH: src/engine/Shell.ts

import {
    COLOR,
    INVISIBLE,
    isVisibleColor,
    type ParticleColor,
    type ShellColor,
    type VisibleColor,
    RANDOM,
} from '../constants/colors';
import { MyMath } from '../utils/MyMath';
import type { GlitterType, ShellOptions, ShellRuntime } from './ShellTypes';
import type { ShellEffects } from './ShellEffects';
import { type BurstParticleFactory, ParticlePatterns } from './ParticlePatterns';
import type { StarParticle } from './particles/Star';

interface SmallSpark {
    freq: number;
    speed: number;
    life: number;
    lifeVariation: number;
}

const LIGHT_SPARK: SmallSpark = {
    freq: 400.0,
    speed: 0.3,
    life: 300.0,
    lifeVariation: 2.0,
} as const;

const MEDIUM_SPARK: SmallSpark = {
    freq: 200.0,
    speed: 0.44,
    life: 700.0,
    lifeVariation: 2.0,
} as const;

const HEAVY_SPARK: SmallSpark = {
    freq: 80.0,
    speed: 0.8,
    life: 1400.0,
    lifeVariation: 2.0,
} as const;

const THICK_SPARK: SmallSpark = {
    freq: 16.0,
    speed: 1.65, // this.runtime.isHighQuality() ? 1.65 : 1.5,
    life: 1400,
    lifeVariation: 3,
} as const;

const STREAMER_SPARK: SmallSpark = {
    freq: 32.0,
    speed: 1.05,
    life: 620,
    lifeVariation: 2.0,
} as const;

const WILLOW_SPARK: SmallSpark = {
    freq: 120.0,
    speed: 0.34,
    life: 1400.0,
    lifeVariation: 3.8,
} as const;

/**
 * Shell can be constructed with options:
 *
 * spreadSize:          Size of the burst.
 * starCount:           Number of stars to create. This is optional, and will
 *                      be set to a reasonable quantity for size if omitted.
 * starLife:
 * starLifeVariation:
 * color:
 * glitterColor:
 * glitter:             One of: 'light', 'medium', 'heavy', 'streamer', 'willow'
 * pistil:
 * pistilColor:
 * streamers:
 * crossette:
 * floral:
 * crackle:
 */
export class Shell {
    public shellSize: number = 0.0;
    public spreadSize: number = 0.0;
    public starLife: number = 0.0;
    public color: ShellColor;

    public secondColor: ParticleColor | null = null;

    public starCount: number = 0.0;
    public starDensity: number = 0.0;
    public starLifeVariation: number = 0.0;

    public glitter: GlitterType = '';
    public glitterColor: VisibleColor;

    public pistil: boolean = false;
    public pistilColor: VisibleColor | null = null;

    public streamers: boolean = false;
    public crossette: boolean = false;
    public floral: boolean = false;
    public fallingLeaves: boolean = false;
    public crackle: boolean = false;
    public horsetail: boolean = false;

    public strobe: boolean = false;
    public strobeColor: VisibleColor | null = null;

    public comet!: StarParticle;
    public ring!: StarParticle;

    private readonly runtime!: ShellRuntime;
    private readonly effects!: ShellEffects;

    constructor(options: ShellOptions, runtime: ShellRuntime, effects: ShellEffects) {
        this.effects = effects;
        this.runtime = { ...runtime };

        this.shellSize = options.shellSize ?? 0.0;
        this.spreadSize = options.spreadSize ?? 0.0;
        this.starLife = options.starLife ?? 0.0;
        this.starDensity = options.starDensity ?? 0.0;
        this.starLifeVariation = options.starLifeVariation ?? 0.125;
        this.color = options.color ?? this.runtime.colorPicker.random();
        this.secondColor = options.secondColor ?? null;
        this.glitter = options.glitter ?? '';
        this.glitterColor = options.glitterColor ?? this.getDefaultGlitterColor();
        this.pistil = options.pistil ?? false;
        this.pistilColor = options.pistilColor ?? null;
        this.streamers = options.streamers ?? false;
        this.crossette = options.crossette ?? false;
        this.floral = options.floral ?? false;
        this.crackle = options.crackle ?? false;
        this.strobe = options.strobe ?? false;
        this.strobeColor = options.strobeColor ?? null;
        this.fallingLeaves = options.fallingLeaves ?? false;
        this.horsetail = options.horsetail ?? false;

        // Set default starCount if needed, will be based on shell size and scale exponentially,
        // like a sphere's surface area.
        if (!this.starCount) {
            const density: number = options.starDensity ?? 1;
            const scaledSize: number = this.spreadSize / 54;
            this.starCount = Math.max(6, scaledSize * scaledSize * density);
        }
    }

    private getDefaultGlitterColor(): VisibleColor {
        if (typeof this.color === 'string' && this.color !== RANDOM && isVisibleColor(this.color)) {
            return this.color;
        }

        return COLOR.White;
    }

    public launch(position: number, launchHeight: number): void {
        const width: number = this.runtime.getStageWidth();
        const height: number = this.runtime.getStageHeight();
        // Distance from sides of screen to keep shells.
        const hpad: number = 60;
        // Distance from top of screen to keep shell bursts.
        const vpad: number = 50;
        // Minimum burst height, as a percentage of stage height
        const minHeightPercent: number = 0.45;
        // Minimum burst height in px
        const minHeight: number = height - height * minHeightPercent;

        const launchX: number = position * (width - hpad * 2) + hpad;
        const launchY: number = height;
        const burstY: number = minHeight - launchHeight * (minHeight - vpad);

        const launchDistance: number = launchY - burstY;
        // Using a custom power curve to approximate Vi needed to reach launchDistance under
        // gravity and air drag.
        // Magic numbers came from testing.
        const launchVelocity: number = Math.pow(launchDistance * 0.04, 0.64);

        const cometColor: ParticleColor = Array.isArray(this.color) || this.color === RANDOM ? COLOR.White : this.color;

        const comet: StarParticle = (this.comet = this.runtime.stars.add(
            launchX,
            launchY,
            cometColor,
            Math.PI,
            launchVelocity * (this.horsetail ? 1.2 : 1),
            // Hang time is derived linearly from Vi; exact number came from testing
            launchVelocity * (this.horsetail ? 100 : 400),
        ));

        // making comet "heavy" limits air drag
        comet.heavy = true;

        // comet spark trail
        comet.spinRadius = MyMath.random(0.32, 0.85);
        comet.sparkFreq = 32 / this.runtime.getQuality();
        if (this.runtime.isHighQuality()) comet.sparkFreq = 8;
        comet.sparkLife = 320;
        comet.sparkLifeVariation = 3;
        if (this.glitter === 'willow' || this.fallingLeaves) {
            comet.sparkFreq = 20 / this.runtime.getQuality();
            comet.sparkSpeed = 0.5;
            comet.sparkLife = 500;
        }
        if (this.color === INVISIBLE) {
            comet.sparkColor = COLOR.Gold;
        }

        // Randomly make comet "burn out" a bit early.
        // This is disabled for horsetail shells, due to their very short airtime.
        if (Math.random() > 0.4 && !this.horsetail) {
            comet.secondColor = INVISIBLE;
            comet.transitionTime = Math.pow(Math.random(), 1.5) * 700 + 500;
        }

        comet.onDeath = (comet: StarParticle): void => this.burst(comet.x, comet.y);

        this.runtime.audio.playSound('lift');
    }

    public burst(x: number, y: number): void {
        // Set burst speed so overall burst grows to set size. This specific formula was derived
        // from testing, and is affected by simulated air drag.
        const speed: number = this.spreadSize / 96;

        let color: ParticleColor;
        let onDeath: (star?: StarParticle) => void;
        let spark: SmallSpark = {
            freq: 0.0,
            speed: 0.0,
            life: 0.0,
            lifeVariation: 0.25,
        };

        // Some death effects, like crackle, play a sound, but should only be played once.
        let playedDeathSound: boolean = false;

        if (this.crossette) {
            onDeath = (star: StarParticle): void => {
                if (!playedDeathSound) {
                    this.runtime.audio.playSound('crackleSmall');
                    playedDeathSound = true;
                }
                this.effects.crossette(star);
            };
        }
        if (this.crackle) {
            onDeath = (star: StarParticle): void => {
                if (!playedDeathSound) {
                    this.runtime.audio.playSound('crackle');
                    playedDeathSound = true;
                }
                this.effects.crackle(star);
            };
        }
        if (this.floral) {
            onDeath = (star: StarParticle): void => this.effects.floral(star);
        }
        if (this.fallingLeaves) {
            onDeath = (star: StarParticle): void => this.effects.fallingLeaves(star);
        }

        if (this.glitter === 'light') {
            spark = { ...LIGHT_SPARK };
        } else if (this.glitter === 'medium') {
            spark = { ...MEDIUM_SPARK };
        } else if (this.glitter === 'heavy') {
            spark = { ...HEAVY_SPARK };
        } else if (this.glitter === 'thick') {
            spark = { ...THICK_SPARK };
            spark.speed = this.runtime.isHighQuality() ? 1.65 : 1.5;
        } else if (this.glitter === 'streamer') {
            spark = { ...STREAMER_SPARK };
        } else if (this.glitter === 'willow') {
            spark = { ...WILLOW_SPARK };
        }

        // Apply quality to spark count
        spark.freq /= this.runtime.getQuality();

        const starFactory: BurstParticleFactory = (angle: number, speedMult: number): void => {
            // For non-horsetail shells, compute an initial vertical speed to add to star burst.
            // The magic number comes from testing what looks best. The ideal is that all shell
            // bursts appear visually centered for the majority of the star life (except willows
            // etc.)
            const standardInitialSpeed: number = this.spreadSize / 1800;

            const star: StarParticle = this.runtime.stars.add(
                x,
                y,
                color ?? this.runtime.colorPicker.random(),
                angle,
                speedMult * speed,
                // add minor variation to star life
                this.starLife + Math.random() * this.starLife * this.starLifeVariation,
                this.horsetail ? this.comet?.speedX : 0,
                this.horsetail ? this.comet?.speedY : -standardInitialSpeed,
            );

            if (this.secondColor) {
                star.transitionTime = this.starLife * (Math.random() * 0.05 + 0.32);
                star.secondColor = this.secondColor;
            }

            if (this.strobe) {
                star.transitionTime = this.starLife * (Math.random() * 0.08 + 0.46);
                star.strobe = true;

                // How many milliseconds between switch of strobe state "tick". Note that the
                // strobe pattern is on:off:off, so this is the "on" duration, while the "off"
                // duration is twice as long.
                star.strobeFreq = Math.random() * 20 + 40;
                if (this.strobeColor) star.secondColor = this.strobeColor;
            }

            star.onDeath = onDeath;

            if (this.glitter) {
                star.sparkFreq = spark.freq;
                star.sparkSpeed = spark.speed;
                star.sparkLife = spark.life;
                star.sparkLifeVariation = spark.lifeVariation;
                star.sparkColor = this.glitterColor;
                star.sparkTimer = Math.random() * star.sparkFreq;
            }
        };

        if (typeof this.color === 'string') {
            if (this.color === RANDOM) {
                // was color = null, falsey value creates random color in starFactory
                color = this.runtime.colorPicker.random();
            } else {
                color = this.color;
            }

            // Rings have positional randomness, but are rotated randomly
            if (this.ring) {
                const ringStartAngle: number = Math.random() * Math.PI;
                const ringSquash: number = Math.pow(Math.random(), 2) * 0.85 + 0.15;

                ParticlePatterns.createArc(0, Math.PI * 2, this.starCount, 0, (angle) => {
                    // Create a ring, squashed horizontally
                    const initSpeedX: number = Math.sin(angle) * speed * ringSquash;
                    const initSpeedY: number = Math.cos(angle) * speed;
                    // Rotate ring
                    const newSpeed: number = MyMath.pointDist(0, 0, initSpeedX, initSpeedY);
                    const newAngle: number = MyMath.pointAngle(0, 0, initSpeedX, initSpeedY) + ringStartAngle;

                    const star: StarParticle = this.runtime.stars.add(
                        x,
                        y,
                        color,
                        newAngle,
                        // apply near cubic falloff to speed (places more particles towards outside)
                        newSpeed, //speed,
                        // add minor variation to star life
                        this.starLife + Math.random() * this.starLife * this.starLifeVariation,
                    );

                    if (this.glitter) {
                        star.sparkFreq = spark.freq;
                        star.sparkSpeed = spark.speed;
                        star.sparkLife = spark.life;
                        star.sparkLifeVariation = spark.lifeVariation;
                        star.sparkColor = this.glitterColor;
                        star.sparkTimer = Math.random() * star.sparkFreq;
                    }
                });
                // Normal burst
            } else {
                ParticlePatterns.createBurst(this.starCount, starFactory);
            }
        } else if (Array.isArray(this.color)) {
            if (Math.random() < 0.5) {
                const start: number = Math.random() * Math.PI;
                const start2: number = start + Math.PI;
                const arc: number = Math.PI;

                color = this.color[0];

                // Not creating a full arc automatically reduces star count.
                ParticlePatterns.createBurst(this.starCount, starFactory, start, arc);

                color = this.color[1];

                ParticlePatterns.createBurst(this.starCount, starFactory, start2, arc);
            } else {
                color = this.color[0];
                ParticlePatterns.createBurst(this.starCount / 2, starFactory);

                color = this.color[1];
                ParticlePatterns.createBurst(this.starCount / 2, starFactory);
            }
        } else {
            throw new Error('Invalid shell color. Expected string or array of strings, but got: ' + this.color);
        }

        if (this.pistil) {
            const innerShell: Shell = new Shell(
                {
                    shellSize: this.shellSize,
                    spreadSize: this.spreadSize * 0.5,
                    starLife: this.starLife * 0.6,
                    starLifeVariation: this.starLifeVariation,
                    starDensity: 1.4,
                    color: this.pistilColor!,
                    glitter: 'light',
                    glitterColor: this.pistilColor === COLOR.Gold ? COLOR.Gold : COLOR.White,
                },
                this.runtime,
                this.effects,
            );
            innerShell.burst(x, y);
        }

        if (this.streamers) {
            const innerShell: Shell = new Shell(
                {
                    shellSize: this.shellSize,
                    spreadSize: this.spreadSize * 0.9,
                    starLife: this.starLife * 0.8,
                    starLifeVariation: this.starLifeVariation,
                    starCount: Math.floor(Math.max(6, this.spreadSize / 45)),
                    color: COLOR.White,
                    glitter: 'streamer',
                },
                this.runtime,
                this.effects,
            );
            innerShell.burst(x, y);
        }

        // Queue burst flash render
        this.runtime.burstFlashes.add(x, y, this.spreadSize / 4);

        // Play sound, but only for "original" shell, the one that was launched.
        // We don't want multiple sounds from pistil or streamer "sub-shells".
        // This can be detected by the presence of a comet.
        if (this.comet) {
            // Scale explosion sound based on current shell size and selected (max) shell size.
            // Shooting selected shell size will always sound the same no matter the selected size,
            // but when smaller shells are auto-fired, they will sound smaller. It doesn't sound
            // great when a value too small is given though, so instead of basing it on
            // proportions, we just look at the difference in size and map it to a range known to
            // sound good.
            const maxDiff: number = 2;
            const sizeDifferenceFromMaxSize: number = Math.min(
                maxDiff,
                this.runtime.getSelectedShellSize() - this.shellSize,
            );
            const soundScale: number = (1 - sizeDifferenceFromMaxSize / maxDiff) * 0.3 + 0.7;
            this.runtime.audio.playSound('burst', soundScale);
        }
    }
}
