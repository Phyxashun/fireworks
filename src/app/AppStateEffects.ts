// FILE-PATH: src/app/AppStateEffects.ts

import type { AppState } from './AppState';
import type { AppStore } from './AppStore';
import type { Audio } from '../services/Audio';
import type { AppController } from './AppController';
import type { AppNodes } from '../dom/AppNodes';

export interface AppStateEffectsOptions {
    readonly store: AppStore;
    readonly appController: AppController;
    readonly audio: Audio;
    readonly nodes: AppNodes;
}

export class AppStateEffects {
    private readonly options: AppStateEffectsOptions;

    private unsubscribeRender: (() => void) | undefined;
    private unsubscribeStateChange: (() => void) | undefined;

    public constructor(options: AppStateEffectsOptions) {
        this.options = options;
    }

    public mount(): void {
        this.unsubscribeRender = this.options.store.subscribe(
            (state: AppState): void => {
                this.render(state);
            },
        );

        this.unsubscribeStateChange = this.options.store.subscribe(
            (state: AppState, previousState: AppState): void => {
                this.handleStateChange(state, previousState);
            },
        );

        this.render(this.options.store.state);
    }

    public destroy(): void {
        this.unsubscribeRender?.();
        this.unsubscribeRender = undefined;

        this.unsubscribeStateChange?.();
        this.unsubscribeStateChange = undefined;
    }

    private render(state: AppState): void {
        this.options.nodes.canvasContainer.classList.toggle(
            'blur',
            state.menuOpen,
        );

        this.options.nodes.finaleModeFormOption.style.opacity = '1';
    }

    private handleStateChange(
        state: AppState,
        previousState: AppState,
    ): void {
        const canPlaySound: boolean = this.options.appController.canPlaySound(state);
        const couldPlaySound: boolean = this.options.appController.canPlaySound(previousState);

        if (canPlaySound === couldPlaySound) {
            return;
        }

        if (canPlaySound) {
            this.options.audio.resumeAll();
            return;
        }

        this.options.audio.pauseAll();
    }
}