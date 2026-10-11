// FILE-PATH: src/app/Bootstrap.ts

import type { AppConfig, AppState, InitialOptions } from './AppState';
import type { ConfiguredShellName } from '../engine/ShellTypes';
import type { SkylightLevel } from '../constants/config';

import { App } from './App';
import { AppController } from './AppController';
import { createInitialState } from './AppState';
import { AppStore } from './AppStore';
import { createAppUiConfiguration, type AppUiConfiguration } from './AppUiConfiguration';

import { COLOR_CODES_W_INVIS } from '../constants/colors';

import { AppNodes } from '../dom/AppNodes';

import { FireworksRuntime } from '../engine/FireworksRuntime';
import { BurstFlashManager } from '../engine/particles/BurstFlash';
import { SparkManager } from '../engine/particles/Spark';
import { StarManager } from '../engine/particles/Star';
import { SHELL_NAMES } from '../engine/ShellTypes';

import { Audio } from '../services/Audio';
import { FullscreenController } from '../services/FullScreen';
import { PerformancePane } from '../debug/PerformancePane';

export interface BootstrapOptions {
    readonly document: Document;
    readonly window: Window;
    readonly navigator: Navigator;
}

interface AppEnvironment {
    readonly isMobile: boolean;
    readonly isDesktop: boolean;
    readonly isHeader: boolean;
    readonly isHighEndDevice: boolean;
    readonly maxWidth: number;
    readonly maxHeight: number;
    readonly gravity: number;
    readonly defaultScaleFactor: number;
}

type RequireReference = <T>(value: T | null, name: string) => T;

const requireReference: RequireReference = <T>(value: T | null, name: string): T => {
    if (value === null) {
        throw new Error(`${name} is unavailable before bootstrap construction completes.`);
    }

    return value;
};

export class Bootstrap {
    private readonly options: BootstrapOptions;

    public constructor(
        options: BootstrapOptions = {
            document,
            window,
            navigator,
        },
    ) {
        this.options = options;
    }

    public create(): App {
        const environment: AppEnvironment = this.createEnvironment();
        const appNodes: AppNodes = new AppNodes(this.options.document);

        let storeReference: AppStore | null = null;

        const fullscreenController: FullscreenController = new FullscreenController({
            target: this.options.document.documentElement,

            onChange: (fullscreen: boolean): void => {
                const store: AppStore = requireReference(storeReference, 'AppStore');

                store.set({
                    fullscreen,
                });
            },
        });

        const initialOptions: InitialOptions = {
            isDesktop: environment.isDesktop,
            isHeader: environment.isHeader,
            isHighEndDevice: environment.isHighEndDevice,
            fullscreen: fullscreenController.isActive,
            defaultScaleFactor: environment.defaultScaleFactor,
        };

        const initialState: AppState = createInitialState(initialOptions);

        const store: AppStore = new AppStore(initialState);

        storeReference = store;

        if (!environment.isHeader) store.load();

        let appControllerReference: AppController | null = null;
        let runtimeReference: FireworksRuntime | null = null;

        const soundManager: Audio = new Audio({
            baseUrl: '/sounds/',

            canPlaySound: (): boolean => {
                const appController: AppController = requireReference(appControllerReference, 'AppController');

                return appController.canPlaySound();
            },

            getSimulationSpeed: (): number => {
                const runtime: FireworksRuntime = requireReference(runtimeReference, 'FireworksRuntime');

                return runtime.fireworksSimulation.getSimulationSpeed();
            },
        });

        const burstFlashes: BurstFlashManager = new BurstFlashManager();

        const stars: StarManager = new StarManager(COLOR_CODES_W_INVIS);

        const sparks: SparkManager = new SparkManager(COLOR_CODES_W_INVIS);

        const appController: AppController = new AppController({
            store,
            sparks,
            canvasContainer: appNodes.canvasContainer,
        });

        appControllerReference = appController;

        this.preventStagePointerHandling(appNodes.menu);

        if (!fullscreenController.isSupported) {
            appNodes.fullscreenFormOption.classList.add('remove');
        }

        const performancePane: PerformancePane = new PerformancePane();

        const runtime: FireworksRuntime = new FireworksRuntime({
            nodes: appNodes,

            stars,
            sparks,
            burstFlashes,
            audio: soundManager,
            performancePane,

            particleColors: COLOR_CODES_W_INVIS,
            gravity: environment.gravity,

            maxWidth: environment.maxWidth,
            maxHeight: environment.maxHeight,

            isDesktopMode: environment.isDesktop,
            isHeaderMode: environment.isHeader,

            isRunning: (): boolean => {
                return appController.isRunning();
            },

            getConfig: (): Readonly<AppConfig> => {
                return store.state.config;
            },

            togglePause: (): void => {
                appController.togglePause();
            },

            toggleSound: (): void => {
                appController.toggleSound();
            },

            toggleMenu: (open?: boolean): void => {
                appController.toggleMenu(open);
            },

            getScaleFactor: (): number => {
                return appController.getScaleFactor();
            },

            isLongExposureEnabled: (): boolean => {
                return store.state.config.longExposure;
            },

            getSkyLightingLevel: (): SkylightLevel => {
                return appController.getSkyLightingLevel();
            },

            getQuality: (): number => {
                return appController.getQuality();
            },

            isLowQuality: (): boolean => {
                return appController.isLowQuality;
            },

            isHighQuality: (): boolean => {
                return appController.isHighQuality;
            },

            getSelectedShellSize: (): number => {
                return appController.getSelectedShellSize();
            },

            getConfiguredShellName: (): ConfiguredShellName => {
                return this.readConfiguredShellName(appController);
            },

            isFinaleEnabled: (): boolean => {
                return appController.isFinaleEnabled();
            },
        });

        runtimeReference = runtime;

        const appUiConfiguration: AppUiConfiguration = createAppUiConfiguration({
            fullscreenSupported: fullscreenController.isSupported,
        });

        return new App({
            nodes: appNodes,
            store,

            appController,
            audio: soundManager,
            fullscreenController,

            runtime,
            performancePane,

            uiConfiguration: appUiConfiguration,

            isHeaderMode: environment.isHeader,

            removeLoadingState: (): void => {
                this.options.document.querySelector('.loading-init')?.remove();
            },
        });
    }

    private createEnvironment(): AppEnvironment {
        const isMobile: boolean = this.options.window.innerWidth <= 640;
        const isDesktop: boolean = this.options.window.innerWidth > 800;
        const isHeader: boolean = isDesktop && this.options.window.innerHeight < 300;

        const hardwareConcurrency: number = this.options.navigator.hardwareConcurrency;

        const minimumCoreCount: number = this.options.window.innerWidth <= 1024 ? 4 : 8;

        const isHighEndDevice: boolean = hardwareConcurrency >= minimumCoreCount;

        const defaultScaleFactor: number = isMobile ? 0.9 : isHeader ? 0.75 : 1.0;

        return {
            isMobile,
            isDesktop,
            isHeader,
            isHighEndDevice,
            maxWidth: 7680,
            maxHeight: 4320,
            gravity: 0.9,
            defaultScaleFactor,
        };
    }

    private preventStagePointerHandling(element: HTMLElement): void {
        const eventTypes: readonly string[] = [
            'pointerdown',
            'pointerup',
            'pointermove',
            'mousedown',
            'mouseup',
            'mousemove',
            'touchstart',
            'touchend',
            'touchmove',
        ];

        for (const eventType of eventTypes) {
            element.addEventListener(
                eventType,
                (event: Event): void => {
                    event.stopPropagation();
                },
                true,
            );
        }
    }

    private readConfiguredShellName(appController: AppController): ConfiguredShellName {
        const configuredName: string = appController.getConfiguredShellName();

        if (!this.isConfiguredShellName(configuredName)) {
            throw new Error(`Unknown configured shell: ${configuredName}`);
        }

        return configuredName;
    }

    private isConfiguredShellName(value: string): value is ConfiguredShellName {
        return (SHELL_NAMES as readonly string[]).includes(value);
    }
}
