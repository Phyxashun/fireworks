// FILE-PATH: src/app/AppState.ts

import { type QualityChoice, type SkylightChoice, QUALITY, SKYLIGHT } from '../constants/config';

export type HelpTopicKey =
    | 'shellType'
    | 'shellSize'
    | 'quality'
    | 'skyLighting'
    | 'scaleFactor'
    | 'autoLaunch'
    | 'finaleMode'
    | 'hideControls'
    | 'fullscreen'
    | 'longExposure';

export interface AppConfig {
    /**
     * A shell name, such as "Random", "Crysanthemum", or "Willow".
     * This will become a stricter union after shell factories are extracted.
     */
    shell: string;

    /**
     * Stored as a string because it is used directly by a <select> element.
     */
    size: string;

    /**
     * Stored as a string because it is used directly by <select> elements.
     * Convert with Number(...) or unary + when numeric behavior is required.
     */
    quality: QualityChoice;
    /**
     * Stored as a string because it is used directly by a <select> element.
     */
    skyLighting: SkylightChoice;

    scaleFactor: number;
    autoLaunch: boolean;
    finale: boolean;
    hideControls: boolean;
    longExposure: boolean;
}

export interface AppState {
    paused: boolean;
    soundEnabled: boolean;
    menuOpen: boolean;
    openHelpTopic: HelpTopicKey | null;
    fullscreen: boolean;
    config: AppConfig;
}

export interface InitialOptions {
    isDesktop: boolean;
    isHeader: boolean;
    isHighEndDevice: boolean;
    fullscreen: boolean;
    defaultScaleFactor: number;
}

type InitialStateFactory = (options: InitialOptions) => AppState;

export const createInitialState: InitialStateFactory = (options: InitialOptions): AppState => {
    return {
        paused: true,
        soundEnabled: false,
        menuOpen: false,
        openHelpTopic: null,
        fullscreen: options.fullscreen,

        config: {
            shell: 'Random',

            /*
             * This intentionally preserves the current application's behavior.
             *
             * Note: isHeader is derived from isDesktop, so the original ordering
             * means the "1.2" branch is currently unreachable:
             *
             * IS_DESKTOP ? "3" : IS_HEADER ? "1.2" : "2"
             *
             * Do not fix that behavior during this mechanical migration unless
             * changing the header default is an intentional requirement.
             */
            size: options.isDesktop ? '3' : options.isHeader ? '1.2' : '2',

            quality: options.isHighEndDevice ? QUALITY.HIGH : QUALITY.NORMAL,
            skyLighting: SKYLIGHT.NORMAL,
            scaleFactor: options.defaultScaleFactor,

            autoLaunch: true,
            finale: false,
            hideControls: options.isHeader,
            longExposure: false,
        },
    };
};
