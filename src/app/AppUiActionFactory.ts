// FILE-PATH: src/app/AppUiActionFactory.ts

import type { AppConfig, HelpTopicKey } from './AppState';
import type { AppStore } from './AppStore';
import type { AppController } from './AppController';
import type { AppUiActions } from './AppUi';
import type { FireworksRuntime } from '../engine/FireworksRuntime';
import type { FullscreenController } from '../services/FullScreen';

export interface AppUiActionFactoryOptions {
    readonly store: AppStore;
    readonly appController: AppController;
    readonly runtime: FireworksRuntime;
    readonly fullscreenController: FullscreenController;
}

export class AppUiActionFactory {
    private readonly options: AppUiActionFactoryOptions;

    public constructor(options: AppUiActionFactoryOptions) {
        this.options = options;
    }

    public create(): AppUiActions {
        return {
            onTogglePause: (): void => {
                this.options.appController.togglePause();
            },

            onToggleSound: (): void => {
                this.options.appController.toggleSound();
            },

            onToggleMenu: (open?: boolean): void => {
                this.options.appController.toggleMenu(open);
            },

            onConfigChange: (nextConfig: Partial<AppConfig>): void => {
                this.options.appController.updateConfig(nextConfig);
            },

            onScaleFactorChange: (): void => {
                this.options.runtime.resize();
            },

            onToggleFullscreen: (): void => {
                void this.options.fullscreenController.toggle();
            },

            onOpenHelp: (topic: HelpTopicKey): void => {
                this.options.store.set({
                    openHelpTopic: topic,
                });
            },

            onCloseHelp: (): void => {
                this.options.store.set({
                    openHelpTopic: null,
                });
            },
        };
    }
}
