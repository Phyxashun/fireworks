// FILE-PATH: src/engine/ShellSystem.ts

import type { Audio } from '../services/Audio';
import type { BurstFlashManager } from './particles/BurstFlash';
import type { SparkManager } from './particles/Spark';
import type { StarManager } from './particles/Star';

import type { ConfiguredShellName, ShellFactory, ShellName, ShellOptions, ShellRuntime } from './ShellTypes';

import { ShellEffects } from './ShellEffects';
import { ShellFactories } from './ShellFactories';
import { ShellLauncher, type ShellLaunchPosition } from './ShellLauncher';
import { SequenceController } from './SequenceController';
import { Shell } from './Shell';
import { ColorPicker } from './ColorPicker';

export interface ShellSystemOptions {
    readonly stars: StarManager;
    readonly sparks: SparkManager;
    readonly burstFlashes: BurstFlashManager;
    readonly audio: Audio;
    readonly isDesktopMode: boolean;
    readonly isHeaderMode: boolean;
    getStageWidth(): number;
    getStageHeight(): number;
    getCanvasWidth(): number;
    getCanvasHeight(): number;
    getQuality(): number;
    isHighQuality(): boolean;
    getSelectedShellSize(): number;
    getConfiguredShellName(): ConfiguredShellName;
    isFinaleEnabled(): boolean;
}

export class ShellSystem {
    public readonly runtime: ShellRuntime;
    public readonly effects: ShellEffects;
    public readonly factories: ShellFactories;
    public readonly launcher: ShellLauncher;
    public readonly sequences: SequenceController;

    public constructor(options: ShellSystemOptions) {
        const colorPicker: ColorPicker = new ColorPicker();

        this.runtime = {
            stars: options.stars,
            sparks: options.sparks,
            burstFlashes: options.burstFlashes,
            audio: options.audio,
            colorPicker,

            getStageWidth: (): number => options.getStageWidth(),
            getStageHeight: (): number => options.getStageHeight(),

            getQuality: (): number => options.getQuality(),
            isHighQuality: (): boolean => options.isHighQuality(),

            getSelectedShellSize: (): number => options.getSelectedShellSize(),
        };

        this.effects = new ShellEffects(this.runtime);

        this.factories = new ShellFactories({
            colorPicker,

            getQuality: (): number => options.getQuality(),
        });

        this.launcher = new ShellLauncher({
            shellFactories: this.factories,
            shellRuntime: this.runtime,
            shellEffects: this.effects,

            isHeaderMode: (): boolean => options.isHeaderMode,

            getConfiguredShellName: (): ConfiguredShellName => {
                return options.getConfiguredShellName();
            },

            getSelectedShellSize: (): number => {
                return options.getSelectedShellSize();
            },

            getCanvasWidth: (): number => {
                return options.getCanvasWidth();
            },

            getCanvasHeight: (): number => {
                return options.getCanvasHeight();
            },
        });

        this.sequences = new SequenceController({
            isDesktop: options.isDesktopMode,
            isHeader: options.isHeaderMode,

            getSelectedShellSize: (): number => {
                return options.getSelectedShellSize();
            },

            isFinaleEnabled: (): boolean => {
                return options.isFinaleEnabled();
            },

            getConfiguredShellName: (): ConfiguredShellName => {
                return options.getConfiguredShellName();
            },

            getShellFactory: (shellName: ShellName): ShellFactory => {
                return this.factories.get(shellName);
            },

            createShell: (shellOptions: ShellOptions): Shell => {
                return this.launcher.createShell(shellOptions);
            },

            createShellFromConfig: (size: number): ShellOptions => {
                return this.launcher.createConfiguredShellOptions(size);
            },

            createRandomShell: (size: number): ShellOptions => {
                return this.launcher.createRandomShellOptions(size);
            },

            getRandomFastShellFactory: (): ShellFactory => {
                return this.launcher.getRandomFastShellFactory();
            },

            getRandomShellPosition: (): ShellLaunchPosition => {
                return this.launcher.getRandomLaunchPosition();
            },

            getCurrentTime: (): number => Date.now(),

            schedule: (callback: () => void, delay: number): number => {
                return window.setTimeout(callback, delay);
            },

            random: (): number => Math.random(),
        });
    }
}
