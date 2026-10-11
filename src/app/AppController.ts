// FILE-PATH: src/app/AppController.ts

import type { AppConfig, AppState } from './AppState';
import type { AppStore } from './AppStore';
import type { SparkManager } from '../engine/particles/Spark';
import {
    type QualityLevel,
    type SkylightLevel,
    QUALITY,
    SKYLIGHT,
    toQualityLevel,
    toSkylightLevel,
} from '../constants/config';
import { COLOR_BLACK } from '../constants/colors';

export interface AppControllerOptions {
    readonly store: AppStore;
    readonly sparks: SparkManager;
    readonly canvasContainer: HTMLElement;
}

export class AppController {
    private readonly options: AppControllerOptions;

    private quality: QualityLevel = toQualityLevel(QUALITY.NORMAL);
    private lowQuality: boolean = false;
    private normalQuality: boolean = true;
    private highQuality: boolean = false;

    public constructor(options: AppControllerOptions) {
        this.options = options;
    }

    public initialize(): void {
        this.applyConfig();
    }

    public togglePause(toggle?: boolean): void {
        const paused: boolean = this.options.store.state.paused;
        const nextPaused: boolean = toggle ?? !paused;

        if (paused === nextPaused) {
            return;
        }

        this.options.store.set({
            paused: nextPaused,
        });
    }

    public toggleSound(toggle?: boolean): void {
        const soundEnabled: boolean = this.options.store.state.soundEnabled;
        const nextSoundEnabled: boolean = toggle ?? !soundEnabled;

        if (soundEnabled === nextSoundEnabled) {
            return;
        }

        this.options.store.set({
            soundEnabled: nextSoundEnabled,
        });
    }

    public toggleMenu(toggle?: boolean): void {
        const menuOpen: boolean = this.options.store.state.menuOpen;
        const nextMenuOpen: boolean = toggle ?? !menuOpen;

        if (menuOpen === nextMenuOpen) {
            return;
        }

        this.options.store.set({
            menuOpen: nextMenuOpen,
        });
    }

    public updateConfig(nextConfig?: Partial<AppConfig>): void {
        if (nextConfig !== undefined) this.options.store.setConfig(nextConfig);
        this.applyConfig();
    }

    public isRunning(state: Readonly<AppState> = this.options.store.state): boolean {
        return !state.paused && !state.menuOpen;
    }

    public isSoundEnabled(state: Readonly<AppState> = this.options.store.state): boolean {
        return state.soundEnabled;
    }

    public canPlaySound(state: Readonly<AppState> = this.options.store.state): boolean {
        return this.isRunning(state) && this.isSoundEnabled(state);
    }

    public getQuality(): QualityLevel {
        return this.quality;
    }

    public get isLowQuality(): boolean {
        return this.lowQuality;
    }

    public get isNormalQuality(): boolean {
        return this.normalQuality;
    }

    public get isHighQuality(): boolean {
        return this.highQuality;
    }

    public getConfiguredShellName(): string {
        return this.options.store.state.config.shell;
    }

    public getSelectedShellSize(): number {
        return Number(this.options.store.state.config.size);
    }

    public isFinaleEnabled(): boolean {
        return this.options.store.state.config.finale;
    }

    public isAutoLaunchEnabled(): boolean {
        return this.options.store.state.config.autoLaunch;
    }

    public isLongExposureEnabled(): boolean {
        return this.options.store.state.config.longExposure;
    }

    public getSkyLightingLevel(): SkylightLevel {
        return toSkylightLevel(this.options.store.state.config.skyLighting);
    }

    public getScaleFactor(): number {
        return this.options.store.state.config.scaleFactor;
    }

    private applyConfig(): void {
        const config: Readonly<AppConfig> = this.options.store.state.config;
        const quality: QualityLevel = toQualityLevel(config.quality);

        this.quality = quality;
        this.lowQuality = quality === toQualityLevel(QUALITY.LOW);
        this.normalQuality = quality === toQualityLevel(QUALITY.NORMAL);
        this.highQuality = quality === toQualityLevel(QUALITY.HIGH);

        if (config.skyLighting === SKYLIGHT.NONE) {
            this.options.canvasContainer.style.backgroundColor = COLOR_BLACK;
        }

        this.options.sparks.drawWidth = this.highQuality ? 0.75 : 1;
    }
}
