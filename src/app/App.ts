// FILE-PATH: src/app/App.ts

import type { AppController } from './AppController';
import type { AppStore } from './AppStore';
import type { AppUiConfiguration } from './AppUiConfiguration';
import type { Audio } from '../services/Audio';
import type { AppNodes } from '../dom/AppNodes';
import type { FireworksRuntime } from '../engine/FireworksRuntime';
import type { FullscreenController } from '../services/FullScreen';

import { AppInitializer } from './AppInitializer';
import { AppStateEffects } from './AppStateEffects';
import { AppUi } from './AppUi';
import { AppUiActionFactory } from './AppUiActionFactory';
import { StartupController } from './StartupController';
import type { PerformancePane } from '../debug/PerformancePane';

export interface AppOptions {
    readonly nodes: AppNodes;
    readonly store: AppStore;
    readonly appController: AppController;
    readonly audio: Audio;
    readonly fullscreenController: FullscreenController;
    readonly runtime: FireworksRuntime;
    readonly uiConfiguration: AppUiConfiguration;
    readonly isHeaderMode: boolean;
    readonly performancePane: PerformancePane;
    removeLoadingState(): void;
}

export class App {
    private readonly appUiActionFactory: AppUiActionFactory;
    private readonly appUi: AppUi;
    private readonly appStateEffects: AppStateEffects;
    private readonly appInitializer: AppInitializer;
    private readonly performancePane: PerformancePane;
    private readonly startupController: StartupController;
    private readonly options: AppOptions;

    private started: boolean = false;

    public constructor(options: AppOptions) {
        this.options = options;

        this.performancePane = this.options.performancePane;

        this.appUiActionFactory = new AppUiActionFactory({
            store: this.options.store,
            appController: this.options.appController,
            runtime: this.options.runtime,
            fullscreenController: this.options.fullscreenController,
        });

        this.appUi = new AppUi({
            nodes: this.options.nodes,
            store: this.options.store,

            configuration: this.options.uiConfiguration,
            actions: this.appUiActionFactory.create(),
        });

        this.appStateEffects = new AppStateEffects({
            store: this.options.store,
            appController: this.options.appController,
            audio: this.options.audio,
            nodes: this.options.nodes,
        });

        this.appInitializer = new AppInitializer({
            nodes: this.options.nodes,
            appController: this.options.appController,
            appStateEffects: this.appStateEffects,
            appUi: this.appUi,
            runtime: this.options.runtime,

            removeLoadingState: (): void => {
                this.options.removeLoadingState();
            },

            applyInitialConfiguration: (): void => {
                this.options.appController.initialize();
            },
        });

        this.startupController = new StartupController({
            audio: this.options.audio,
            isHeaderMode: this.options.isHeaderMode,

            initialize: (): void => {
                this.appInitializer.initialize();
            },

            setLoadingStatus: (status: string): void => {
                const loadingStatusNode: Element | null = document.querySelector('.loading-init__status');

                if (loadingStatusNode !== null) {
                    loadingStatusNode.textContent = status;
                }
            },
        });
    }

    public start(): void {
        if (this.started) return;

        this.started = true;

        this.options.fullscreenController.mount();
        this.startupController.start();
    }

    public destroy(): void {
        if (!this.started) return;

        this.started = false;

        this.options.fullscreenController.destroy();
        this.appStateEffects.destroy();
        this.appUi.destroy();
        this.performancePane.destroy();
        this.options.runtime.destroy();
    }
}
