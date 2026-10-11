// FILE-PATH: src/engine/FireworksRuntime.ts

import type { AppConfig } from '../app/AppState';
import type { AppNodes } from '../dom/AppNodes';
import type { ParticleColor } from '../constants/colors';
import type { SkylightLevel } from '../constants/config';
import type { Audio } from '../services/Audio';

import type { BurstFlashManager } from './particles/BurstFlash';
import type { SparkManager } from './particles/Spark';
import type { StarManager } from './particles/Star';
import type { ConfiguredShellName } from './ShellTypes';
import type { TickerEvent } from './Ticker';
import type { PointerEventPayload } from './Stage';

import { WebGLRenderer } from './WebGLRenderer';
import { Engine } from './Engine';
import { FireworksSimulation } from './FireworksSimulation';
import { InteractionController } from './InteractionController';
import { ParticleSimulation } from './ParticleSimulation';
import { ShellSystem } from './ShellSystem';
import type { PerformancePane } from '../debug/PerformancePane';

export interface FireworksRuntimeOptions {
    readonly nodes: AppNodes;

    readonly stars: StarManager;
    readonly sparks: SparkManager;
    readonly burstFlashes: BurstFlashManager;
    readonly audio: Audio;
    readonly performancePane: PerformancePane;

    readonly particleColors: readonly ParticleColor[];
    readonly gravity: number;

    readonly maxWidth: number;
    readonly maxHeight: number;

    readonly isDesktopMode: boolean;
    readonly isHeaderMode: boolean;

    isRunning(): boolean;
    getConfig(): Readonly<AppConfig>;

    togglePause(): void;
    toggleSound(): void;
    toggleMenu(open?: boolean): void;

    getScaleFactor(): number;
    isLongExposureEnabled(): boolean;
    getSkyLightingLevel(): SkylightLevel;

    getQuality(): number;
    isLowQuality(): boolean;
    isHighQuality(): boolean;

    getSelectedShellSize(): number;
    getConfiguredShellName(): ConfiguredShellName;
    isFinaleEnabled(): boolean;
}

export class FireworksRuntime {
    public readonly engine: Engine;
    public readonly shellSystem: ShellSystem;
    public readonly interactionController: InteractionController;
    public readonly webGLRenderer: WebGLRenderer;
    public readonly particleSimulation: ParticleSimulation;
    public readonly fireworksSimulation: FireworksSimulation;

    private readonly options: FireworksRuntimeOptions;

    private logicalWidth: number = 0;
    private logicalHeight: number = 0;
    private initialized: boolean = false;

    private fireworksSimulationReference: FireworksSimulation | null = null;

    public constructor(options: FireworksRuntimeOptions) {
        this.options = options;

        this.engine = new Engine({
            nodes: this.options.nodes,
            maxWidth: this.options.maxWidth,
            maxHeight: this.options.maxHeight,
            callbacks: {
                isRunning: (): boolean => this.options.isRunning(),
                getConfig: (): Readonly<AppConfig> => this.options.getConfig(),
                onPointerStart: (event: PointerEventPayload): void =>
                    this.interactionController.handlePointerStart(event),
                onPointerEnd: (event: PointerEventPayload): void => this.interactionController.handlePointerEnd(event),
                onPointerMove: (event: PointerEventPayload): void =>
                    this.interactionController.handlePointerMove(event),
                onTicker: (event: TickerEvent): void => this.getFireworksSimulation().update(event),
                onResize: (containerWidth: number, containerHeight: number): void =>
                    this.updateLogicalDimensions(containerWidth, containerHeight),
            },
        });

        this.shellSystem = new ShellSystem({
            stars: this.options.stars,
            sparks: this.options.sparks,
            burstFlashes: this.options.burstFlashes,
            audio: this.options.audio,
            isDesktopMode: this.options.isDesktopMode,
            isHeaderMode: this.options.isHeaderMode,
            getStageWidth: (): number => this.logicalWidth,
            getStageHeight: (): number => this.logicalHeight,
            getCanvasWidth: (): number => this.engine.mainStage.width,
            getCanvasHeight: (): number => this.engine.mainStage.height,
            getQuality: (): number => this.options.getQuality(),
            isHighQuality: (): boolean => this.options.isHighQuality(),
            getSelectedShellSize: (): number => this.options.getSelectedShellSize(),
            getConfiguredShellName: (): ConfiguredShellName => this.options.getConfiguredShellName(),
            isFinaleEnabled: (): boolean => this.options.isFinaleEnabled(),
        });

        this.interactionController = new InteractionController({
            getStageWidth: (): number => this.engine.mainStage.width,
            getStageHeight: (): number => this.engine.mainStage.height,
            isRunning: (): boolean => this.options.isRunning(),
            togglePause: (): void => this.options.togglePause(),
            toggleSound: (): void => this.options.toggleSound(),
            toggleMenu: (open?: boolean): void => this.options.toggleMenu(open),
            launchShell: (event: PointerEventPayload): void => this.shellSystem.launcher.launchFromPointer(event),
            getSimulationSpeed: (): number => this.getFireworksSimulation().getSimulationSpeed(),
            setSimulationSpeed: (speed: number): void => this.getFireworksSimulation().setSimulationSpeed(speed),
            showSpeedBar: (): void => this.getFireworksSimulation().showSpeedBar(),
        });

        this.webGLRenderer = new WebGLRenderer({
            trailsStage: this.engine.trailsStage,
            mainStage: this.engine.mainStage,
            stars: this.options.stars,
            sparks: this.options.sparks,
            burstFlashes: this.options.burstFlashes,
            canvasContainer: this.options.nodes.canvasContainer,
            getLogicalWidth: (): number => this.logicalWidth,
            getLogicalHeight: (): number => this.logicalHeight,
            getScaleFactor: (): number => this.options.getScaleFactor(),
            isLongExposureEnabled: (): boolean => this.options.isLongExposureEnabled(),
            getSkyLightingLevel: (): SkylightLevel => this.options.getSkyLightingLevel(),
            getSimulationSpeed: (): number => this.getFireworksSimulation().getSimulationSpeed(),
            getSpeedBarOpacity: (): number => this.getFireworksSimulation().getSpeedBarOpacity(),
            isLowQuality: (): boolean => this.options.isLowQuality(),
        });

        this.particleSimulation = new ParticleSimulation({
            stars: this.options.stars,
            sparks: this.options.sparks,
            particleColors: this.options.particleColors,
            gravity: this.options.gravity,
            isLowQuality: (): boolean => this.options.isLowQuality(),
        });

        this.fireworksSimulation = new FireworksSimulation({
            particleSimulation: this.particleSimulation,
            webGLRenderer: this.webGLRenderer,
            sequenceController: this.shellSystem.sequences,
            isRunning: (): boolean => this.options.isRunning(),
            isAutoLaunchEnabled: (): boolean => this.options.getConfig().autoLaunch,
            isSpeedAdjusting: (): boolean => this.interactionController.isUpdatingSpeed,
            beginPerformanceFrame: (): void => this.options.performancePane.begin(),
            endPerformanceFrame: (): void => this.options.performancePane.end(),
        });

        this.fireworksSimulationReference = this.fireworksSimulation;
    }

    public initialize(): void {
        if (this.initialized) return;
        this.initialized = true;
        window.addEventListener('keydown', this.handleKeydown);
        this.engine.initialize();
    }

    public destroy(): void {
        if (!this.initialized) return;
        this.initialized = false;
        window.removeEventListener('keydown', this.handleKeydown);
        this.engine.destroy();
    }

    public resize(): void {
        this.engine.resize();
    }

    private getFireworksSimulation(): FireworksSimulation {
        if (this.fireworksSimulationReference === null) {
            throw new Error('FireworksSimulation is unavailable before initialization.');
        }
        return this.fireworksSimulationReference;
    }

    private updateLogicalDimensions(containerWidth: number, containerHeight: number): void {
        const scaleFactor: number = this.options.getScaleFactor();
        this.logicalWidth = containerWidth / scaleFactor;
        this.logicalHeight = containerHeight / scaleFactor;
    }

    private readonly handleKeydown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
        this.interactionController.handleKeydown(event);
    };
}
