// FILE-PATH: src/app/StartupController.ts

import type { Audio } from '../services/Audio';

export interface StartupControllerOptions {
    readonly audio: Audio;
    readonly isHeaderMode: boolean;

    setLoadingStatus(status: string): void;
    initialize(): void;
}

export class StartupController {
    private readonly options: StartupControllerOptions;

    public constructor(options: StartupControllerOptions) {
        this.options = options;
    }

    public start(): void {
        if (this.options.isHeaderMode) {
            this.options.initialize();
            return;
        }

        this.options.setLoadingStatus('Lighting Fuses');

        window.setTimeout((): void => {
            void this.options.audio.preload().then(
                (): void => {
                    this.options.initialize();
                },
                (reason: unknown): void => {
                    console.warn('Audio assets could not be loaded; starting without preloaded audio.', reason);

                    this.options.initialize();
                },
            );
        }, 0);
    }
}
