// FILE-PATH: src/engine/ShellFactories.ts

import { type ParticleColor, type VisibleColor, COLOR, RANDOM, INVISIBLE, type ShellColor } from '../constants/colors';
import { type QualityLevel } from '../constants/config';

import type { ColorPicker } from './ColorPicker';
import type { ShellFactory, ShellName, ShellOptions, ShellTypes } from './ShellTypes';

export interface ShellFactoryDependencies {
    colorPicker: ColorPicker;

    /**
     * Callback instead of a fixed value so each created shell uses
     * the current quality setting.
     */
    getQuality: () => number;
}

export class ShellFactories {
    private readonly colorPicker: ColorPicker;
    private readonly getQuality: () => number;
    private readonly factories: ShellTypes;

    public constructor(dependencies: ShellFactoryDependencies) {
        this.colorPicker = dependencies.colorPicker;
        this.getQuality = dependencies.getQuality;

        this.factories = {
            Crackle: this.crackleShell.bind(this),
            Crossette: this.crossetteShell.bind(this),
            Crysanthemum: this.crysanthemumShell.bind(this),
            'Falling Leaves': this.fallingLeavesShell.bind(this),
            Floral: this.floralShell.bind(this),
            Ghost: this.ghostShell.bind(this),
            'Horse Tail': this.horsetailShell.bind(this),
            Palm: this.palmShell.bind(this),
            Ring: this.ringShell.bind(this),
            Strobe: this.strobeShell.bind(this),
            Willow: this.willowShell.bind(this),
        };
    }

    public create(name: ShellName, size = 1): ShellOptions {
        return this.factories[name](size);
    }

    public get(name: ShellName): ShellFactory {
        return this.factories[name];
    }

    private get quality(): QualityLevel {
        return this.getQuality() as QualityLevel;
    }

    public get isLowQuality(): boolean {
        return this.quality === 1;
    }

    public get isNormalQuality(): boolean {
        return this.quality === 2;
    }

    public get isHighQuality(): boolean {
        return this.quality === 3;
    }

    private crysanthemumShell(size = 1): ShellOptions {
        const glitter: boolean = Math.random() < 0.25;
        const singleColor: boolean = Math.random() < 0.72;

        const color: ShellColor = singleColor
            ? this.colorPicker.random({ limitWhite: true })
            : [this.colorPicker.random(), this.colorPicker.random({ notSame: true })];

        const pistil: boolean = singleColor && Math.random() < 0.42;

        const pistilColor: VisibleColor | null =
            pistil && !Array.isArray(color) ? this.colorPicker.makePistilColor(color) : null;

        const secondColor: ParticleColor | null =
            singleColor && !Array.isArray(color) && (Math.random() < 0.2 || color === COLOR.White)
                ? (pistilColor ??
                  this.colorPicker.random({
                      notColor: color,
                      limitWhite: true,
                  }))
                : null;

        const streamers: boolean = !pistil && !Array.isArray(color) && color !== COLOR.White && Math.random() < 0.42;

        let starDensity: number = glitter ? 1.1 : 1.25;

        if (this.isLowQuality) {
            starDensity *= 0.8;
        }

        if (this.isHighQuality) {
            starDensity = 1.2;
        }

        return {
            shellSize: size,
            spreadSize: 300 + size * 100,
            starLife: 900 + size * 200,
            starDensity,
            color,
            secondColor,
            glitter: glitter ? 'light' : '',
            glitterColor: this.colorPicker.whiteOrGold(),
            pistil,
            pistilColor,
            streamers,
        };
    }

    private ghostShell(size = 1): ShellOptions {
        const shell: ShellOptions = this.crysanthemumShell(size);

        shell.starLife *= 1.5;

        const ghostColor: VisibleColor = this.colorPicker.random({
            notColor: COLOR.White,
        });

        shell.streamers = true;

        shell.color = INVISIBLE;
        shell.secondColor = ghostColor;
        shell.glitter = '';

        return shell;
    }

    private crackleShell(size = 1): ShellOptions {
        const color: VisibleColor = Math.random() < 0.75 ? COLOR.Gold : this.colorPicker.random();

        return {
            shellSize: size,
            spreadSize: 380 + size * 75,
            starDensity: this.isLowQuality ? 0.65 : 1,
            starLife: 600 + size * 100,
            starLifeVariation: 0.32,
            glitter: 'light',
            glitterColor: COLOR.Gold,
            color,
            crackle: true,
            pistil: Math.random() < 0.65,
            pistilColor: this.colorPicker.makePistilColor(color),
        };
    }

    private strobeShell(size = 1): ShellOptions {
        const color: VisibleColor = this.colorPicker.random({ limitWhite: true });

        return {
            shellSize: size,
            spreadSize: 280 + size * 92,
            starLife: 1100 + size * 200,
            starLifeVariation: 0.4,
            starDensity: 1.1,
            color,
            glitter: 'light',
            glitterColor: COLOR.White,
            strobe: true,
            strobeColor: Math.random() < 0.5 ? COLOR.White : undefined,
            pistil: Math.random() < 0.5,
            pistilColor: this.colorPicker.makePistilColor(color),
        };
    }

    private palmShell(size = 1): ShellOptions {
        const color: VisibleColor = this.colorPicker.random();
        const thick: boolean = Math.random() < 0.5;

        return {
            shellSize: size,
            color,
            spreadSize: 250 + size * 75,
            starDensity: thick ? 0.15 : 0.4,
            starLife: 1800 + size * 200,
            glitter: thick ? 'thick' : 'heavy',
        };
    }

    private ringShell(size = 1): ShellOptions {
        const color: VisibleColor = this.colorPicker.random();
        const pistil: boolean = Math.random() < 0.75;

        return {
            shellSize: size,
            ring: true,
            color,
            spreadSize: 300 + size * 100,
            starLife: 900 + size * 200,
            starCount: 2.2 * (Math.PI * 2) * (size + 1),
            pistil,
            pistilColor: this.colorPicker.makePistilColor(color),
            glitter: !pistil ? 'light' : '',
            glitterColor: color === COLOR.Gold ? COLOR.Gold : COLOR.White,
            streamers: Math.random() < 0.3,
        };
    }

    private crossetteShell(size = 1): ShellOptions {
        const color: VisibleColor = this.colorPicker.random({ limitWhite: true });

        return {
            shellSize: size,
            spreadSize: 300 + size * 100,
            starLife: 750 + size * 160,
            starLifeVariation: 0.4,
            starDensity: 0.85,
            color,
            crossette: true,
            pistil: Math.random() < 0.5,
            pistilColor: this.colorPicker.makePistilColor(color),
        };
    }

    private floralShell(size = 1): ShellOptions {
        const color: ShellColor =
            Math.random() < 0.65
                ? RANDOM
                : Math.random() < 0.15
                  ? this.colorPicker.random()
                  : [this.colorPicker.random(), this.colorPicker.random({ notSame: true })];
        return {
            shellSize: size,
            spreadSize: 300 + size * 120,
            starDensity: 0.12,
            starLife: 500 + size * 50,
            starLifeVariation: 0.5,
            color,
            floral: true,
        };
    }

    private fallingLeavesShell(size = 1): ShellOptions {
        return {
            shellSize: size,
            color: INVISIBLE,
            spreadSize: 300 + size * 120,
            starDensity: 0.12,
            starLife: 500 + size * 50,
            starLifeVariation: 0.5,
            glitter: 'medium',
            glitterColor: COLOR.Gold,
            fallingLeaves: true,
        };
    }

    private willowShell(size = 1): ShellOptions {
        return {
            shellSize: size,
            spreadSize: 300 + size * 100,
            starDensity: 0.6,
            starLife: 3000 + size * 300,
            glitter: 'willow',
            glitterColor: COLOR.Gold,
            color: INVISIBLE,
        };
    }

    private horsetailShell(size = 1): ShellOptions {
        const color: VisibleColor = this.colorPicker.random();

        return {
            shellSize: size,
            horsetail: true,
            color,
            spreadSize: 250 + size * 38,
            starDensity: 0.9,
            starLife: 2500 + size * 300,
            glitter: 'medium',
            glitterColor: Math.random() < 0.5 ? this.colorPicker.whiteOrGold() : color,
            // Add strobe effect to white horsetails, to make them more interesting
            strobe: color === COLOR.White,
        };
    }
}
