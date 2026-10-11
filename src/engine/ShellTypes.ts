// FILE-PATH: src/engine/ShellTypes.ts

import type { ParticleColor, ShellColor, VisibleColor } from '../constants/colors';

import type { Audio } from '../services/Audio';
import type { ColorPicker } from './ColorPicker';
import type { BurstFlashManager } from './particles/BurstFlash';
import type { SparkManager } from './particles/Spark';
import type { StarManager } from './particles/Star';

export type GlitterType = '' | 'light' | 'medium' | 'heavy' | 'streamer' | 'willow' | 'thick';

export interface ShellOptions {
    shellSize: number;
    spreadSize: number;
    starLife: number;
    color: ShellColor;

    secondColor?: ParticleColor | null;

    starCount?: number;
    starDensity?: number;
    starLifeVariation?: number;

    glitter?: GlitterType;
    glitterColor?: VisibleColor;

    pistil?: boolean;
    pistilColor?: VisibleColor | null;

    streamers?: boolean;
    crossette?: boolean;
    floral?: boolean;
    fallingLeaves?: boolean;
    crackle?: boolean;
    horsetail?: boolean;
    ring?: boolean;

    strobe?: boolean;
    strobeColor?: VisibleColor | null;
}

export interface ShellRuntime {
    readonly stars: StarManager;
    readonly sparks: SparkManager;
    readonly burstFlashes: BurstFlashManager;
    readonly audio: Audio;
    readonly colorPicker: ColorPicker;

    getStageWidth(): number;
    getStageHeight(): number;

    getQuality(): number;
    isHighQuality(): boolean;

    getSelectedShellSize(): number;
}

type ConcreteShellNames = readonly [
    'Crackle',
    'Crossette',
    'Crysanthemum',
    'Falling Leaves',
    'Floral',
    'Ghost',
    'Horse Tail',
    'Palm',
    'Ring',
    'Strobe',
    'Willow',
];

export const CONCRETE_SHELL_NAMES: ConcreteShellNames = [
    'Crackle',
    'Crossette',
    'Crysanthemum',
    'Falling Leaves',
    'Floral',
    'Ghost',
    'Horse Tail',
    'Palm',
    'Ring',
    'Strobe',
    'Willow',
] as const;

export type ShellFactory = (size: number) => ShellOptions;

export type ShellName = ConcreteShellNames[number];

export type ConfiguredShellName = 'Random' | ShellName;

export const SHELL_NAMES: readonly ConfiguredShellName[] = ['Random', ...CONCRETE_SHELL_NAMES];

export type ShellTypes = Record<ShellName, ShellFactory>;
