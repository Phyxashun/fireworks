// FILE-PATH: src/app/AppInitializer.ts

import type { AppController } from './AppController';
import type { AppStateEffects } from './AppStateEffects';
import type { AppUi } from './AppUi';
import type { AppNodes } from '../dom/AppNodes';
import type { FireworksRuntime } from '../engine/FireworksRuntime';

export interface AppInitializerOptions {
    readonly nodes: AppNodes;
    readonly appController: AppController;
    readonly appStateEffects: AppStateEffects;
    readonly appUi: AppUi;
    readonly runtime: FireworksRuntime;

    removeLoadingState(): void;
    applyInitialConfiguration(): void;
}

export class AppInitializer {
    private readonly options: AppInitializerOptions;

    public constructor(options: AppInitializerOptions) {
        this.options = options;
    }

    public initialize(): void {
        this.options.removeLoadingState();
        this.options.nodes.stageContainer.classList.remove('remove');

        this.options.appController.togglePause(false);

        this.options.appUi.mount();
        this.options.appStateEffects.mount();

        this.options.runtime.initialize();

        this.options.applyInitialConfiguration();
    }
}
