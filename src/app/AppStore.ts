// FILE-PATH: src/app/AppStore.ts

import type { AppConfig, AppState } from './AppState.js';
import { isQualityChoice, isSkylightChoice } from '../constants/config';

const STORAGE_KEY: string = 'cm_fireworks_data';
const LEGACY_SCHEMA_VERSION_KEY: string = 'schemaVersion';
const LEGACY_CONFIG_SIZE_KEY: string = 'configSize';

interface PersistedConfigV11 {
    quality: string | number;
    size: string;
    skyLighting: string | number;
}

interface PersistedConfigV12 extends PersistedConfigV11 {
    scaleFactor: number;
}

interface PersistedConfigV2 extends PersistedConfigV12 {
    shell: string;
    autoLaunch: boolean;
    finale: boolean;
    hideControls: boolean;
    longExposure: boolean;
}

interface PersistedStoreV11 {
    schemaVersion: '1.1';
    data: PersistedConfigV11;
}

interface PersistedStoreV12 {
    schemaVersion: '1.2';
    data: PersistedConfigV12;
}

interface PersistedStoreV2 {
    schemaVersion: '2.0';
    data: PersistedConfigV2;
}

type PersistedStore = PersistedStoreV11 | PersistedStoreV12 | PersistedStoreV2;

export type StateListener = (state: Readonly<AppState>, previousState: Readonly<AppState>) => void;

export class AppStore {
    private readonly listeners = new Set<StateListener>();
    private currentState: AppState;
    private readonly storage: Storage;

    public constructor(currentState: AppState, storage?: Storage) {
        this.currentState = currentState;
        this.storage = storage ?? window.localStorage;
    }

    /**
     * Compatibility getter for the existing codebase.
     *
     * Existing main.ts references such as store.state.paused can remain in place
     * during this migration.
     */
    public get state(): Readonly<AppState> {
        return this.currentState;
    }

    public get(): Readonly<AppState> {
        return this.currentState;
    }

    public set(nextState: Partial<AppState>): void {
        const previousState: AppState = this.currentState;

        this.currentState = {
            ...this.currentState,
            ...nextState,
        };

        this.dispatch(previousState);
        this.persist();
    }

    public setConfig(nextConfig: Partial<AppConfig>): void {
        const previousState: AppState = this.currentState;

        this.currentState = {
            ...this.currentState,
            config: {
                ...this.currentState.config,
                ...nextConfig,
            },
        };

        this.dispatch(previousState);
        this.persist();
    }

    public subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Loads persisted settings. This should run once, before subscriptions.
     */
    public load(): void {
        const serializedData: string | null = this.storage.getItem(STORAGE_KEY);

        if (serializedData) {
            const persisted = JSON.parse(serializedData) as PersistedStore;
            const config: AppConfig = this.currentState.config;

            switch (persisted.schemaVersion) {
                case '1.1':
                    const qV11: string = String(persisted.data.quality);
                    const sV11: string = String(persisted.data.skyLighting);
                    if (isQualityChoice(qV11)) config.quality = qV11;
                    if (isSkylightChoice(sV11)) config.skyLighting = sV11;
                    config.size = persisted.data.size;
                    break;

                case '1.2':
                    const qV12: string = String(persisted.data.quality);
                    const sV12: string = String(persisted.data.skyLighting);
                    if (isQualityChoice(qV12)) config.quality = qV12;
                    if (isSkylightChoice(sV12)) config.skyLighting = sV12;
                    config.size = persisted.data.size;
                    config.scaleFactor = persisted.data.scaleFactor;
                    break;

                case '2.0':
                    const qV2: string = String(persisted.data.quality);
                    const sV2: string = String(persisted.data.skyLighting);

                    if (isQualityChoice(qV2)) config.quality = qV2;
                    if (isSkylightChoice(sV2)) config.skyLighting = sV2;

                    config.shell = persisted.data.shell;
                    config.size = persisted.data.size;
                    config.scaleFactor = persisted.data.scaleFactor;
                    config.autoLaunch = persisted.data.autoLaunch;
                    config.finale = persisted.data.finale;
                    config.hideControls = persisted.data.hideControls;
                    config.longExposure = persisted.data.longExposure;
                    break;

                default:
                    throw new Error('Version switch should be exhaustive');
            }

            this.logPersistedStore();
            return;
        }

        this.loadLegacyConfig();
    }

    public logPersistedStore = (): void => {
        const serializedData: string | null = this.storage.getItem(STORAGE_KEY);

        if (serializedData) {
            const store = JSON.parse(serializedData) as PersistedStore;
            console.table({
                'FIREWORKS LOADED CONFIGURATION': {
                    'Schema Version': store.schemaVersion,
                    Quality: store.data.quality,
                    Size: store.data.size,
                    'Sky Lighting': store.data.skyLighting,

                    // Optional chaining/nullish coalescing for version-specific fields
                    'Scale Factor': (store.data as PersistedConfigV12).scaleFactor ?? 'N/A',
                    Shell: (store.data as PersistedConfigV2).shell ?? 'N/A',
                    'Auto Launch': (store.data as PersistedConfigV2).autoLaunch ?? 'N/A',
                    Finale: (store.data as PersistedConfigV2).finale ?? 'N/A',
                    'Hide Controls': (store.data as PersistedConfigV2).hideControls ?? 'N/A',
                    'Long Exposure': (store.data as PersistedConfigV2).longExposure ?? 'N/A',
                },
            });
        }
    };

    private loadLegacyConfig(): void {
        if (this.storage.getItem(LEGACY_SCHEMA_VERSION_KEY) !== '1') {
            return;
        }

        let size: unknown;

        try {
            const sizeRaw: string | null = this.storage.getItem(LEGACY_CONFIG_SIZE_KEY);

            size = typeof sizeRaw === 'string' ? JSON.parse(sizeRaw) : undefined;
        } catch (error) {
            console.log('Recovered from error parsing saved config:');
            console.error(error);
            return;
        }

        const sizeInt: number = Number.parseInt(String(size), 10);

        if (sizeInt >= 0 && sizeInt <= 4) {
            this.currentState.config.size = String(sizeInt);
        }
    }

    public persist12(): void {
        const { config } = this.currentState;
        const qualityValue = String(config.quality);
        const skyLightingValue = String(config.skyLighting);
        if (isQualityChoice(qualityValue)) config.quality = qualityValue;
        if (isSkylightChoice(skyLightingValue)) config.skyLighting = skyLightingValue;

        const persisted: PersistedStoreV12 = {
            schemaVersion: '1.2',
            data: {
                quality: config.quality,
                size: config.size,
                skyLighting: config.skyLighting,
                scaleFactor: config.scaleFactor,
            },
        };

        this.storage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    }

    public persist(): void {
        const { config } = this.currentState;

        const persisted: PersistedStoreV2 = {
            schemaVersion: '2.0',
            data: {
                ...config,
                quality: config.quality,
                skyLighting: config.skyLighting,
            },
        };

        this.storage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    }

    private dispatch(previousState: Readonly<AppState>): void {
        for (const listener of this.listeners) {
            listener(this.currentState, previousState);
        }
    }
}
