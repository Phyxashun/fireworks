// FILE-PATH: src/app/AppUi.ts

import type { AppConfig, HelpTopicKey } from './AppState';
import type { AppUiConfiguration } from './AppUiConfiguration';
import type { AppStore } from './AppStore';
import type { AppNodes } from '../dom/AppNodes';
import { Controls } from '../components/Controls';
import { SettingsMenu } from '../components/SettingsMenu';
import { HelpModal } from '../components/HelpModal';

export interface AppUiActions {
    onTogglePause(): void;
    onToggleSound(): void;
    onToggleMenu(open?: boolean): void;
    onConfigChange(nextConfig: Partial<AppConfig>): void;
    onScaleFactorChange(): void;
    onToggleFullscreen(): void;
    onOpenHelp(topic: HelpTopicKey): void;
    onCloseHelp(): void;
}

export interface AppUiOptions {
    readonly nodes: AppNodes;
    readonly store: AppStore;
    readonly configuration: AppUiConfiguration;
    readonly actions: AppUiActions;
}

export class AppUi {
    private readonly controls: Controls;
    private readonly settingsMenu: SettingsMenu;
    private readonly helpModal: HelpModal;

    private mounted: boolean = false;

    public constructor(options: AppUiOptions) {
        this.controls = new Controls(options.nodes, options.store, {
            onTogglePause: (): void => options.actions.onTogglePause(),
            onToggleSound: (): void => options.actions.onToggleSound(),
            onToggleMenu: (): void => options.actions.onToggleMenu(),
        });

        this.settingsMenu = new SettingsMenu(
            options.nodes,
            options.store,
            {
                shellNameOptions: options.configuration.shellNameOptions,
                shellSizeOptions: options.configuration.shellSizeOptions,
                qualityOptions: options.configuration.qualityOptions,
                skyLightingOptions: options.configuration.skyLightingOptions,
                scaleFactorOptions: options.configuration.scaleFactorOptions,
                helpNodeToTopic: options.configuration.helpNodeToTopic,
                fullscreenSupported: options.configuration.fullscreenSupported,
            },
            {
                onClose: (): void => options.actions.onToggleMenu(false),
                onConfigChange: (nextConfig: Partial<AppConfig>): void => options.actions.onConfigChange(nextConfig),
                onScaleFactorChange: (): void => options.actions.onScaleFactorChange(),
                onToggleFullscreen: (): void => options.actions.onToggleFullscreen(),
                onOpenHelp: (topic: HelpTopicKey): void => options.actions.onOpenHelp(topic),
            },
        );

        this.helpModal = new HelpModal(options.nodes, options.store, {
            onClose: (): void => options.actions.onCloseHelp(),
        });
    }

    public mount(): void {
        if (this.mounted) return;
        this.mounted = true;
        this.controls.mount();
        this.settingsMenu.mount();
        this.helpModal.mount();
    }

    public destroy(): void {
        if (!this.mounted) return;
        this.mounted = false;
        this.controls.destroy();
        this.settingsMenu.destroy();
        this.helpModal.destroy();
    }
}
