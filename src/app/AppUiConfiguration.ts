// FILE-PATH: src/app/AppUiConfiguration.ts

import type { HelpTopicKey } from './AppState';
import type { HelpNodeKey } from '../dom/AppNodes';
import type { SelectOption } from '../components/SettingsMenu';
import { QUALITY, SKYLIGHT } from '../constants/config';
import { SHELL_NAMES } from '../engine/ShellTypes';

export interface AppUiConfiguration {
    readonly shellNameOptions: readonly SelectOption[];
    readonly shellSizeOptions: readonly SelectOption[];
    readonly qualityOptions: readonly SelectOption[];
    readonly skyLightingOptions: readonly SelectOption[];
    readonly scaleFactorOptions: readonly SelectOption[];
    readonly helpNodeToTopic: Readonly<Record<HelpNodeKey, HelpTopicKey>>;
    readonly fullscreenSupported: boolean;
}

export interface AppUiConfigurationOptions {
    readonly fullscreenSupported: boolean;
}

// In inches
const shellSizes: readonly number[] = [3, 4, 6, 8, 12, 16];
const shellSizeOptions: readonly SelectOption[] = shellSizes.map((value: number): SelectOption => ({
    value: value,
    label: `${value}"`,
}));

// In percentages
const mobileScales: readonly number[] = [0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0];
const scaleFactorOptions: readonly SelectOption[] = mobileScales.map((value: number): SelectOption => ({
    value: value.toFixed(2),
    label: `${value * 100}%`,
}));

const qualityOptions: readonly SelectOption[] = [
    { label: 'Low', value: QUALITY.LOW },
    { label: 'Normal', value: QUALITY.NORMAL },
    { label: 'High', value: QUALITY.HIGH },
];

const skyLightingOptions: readonly SelectOption[] = [
    { label: 'None', value: SKYLIGHT.NONE },
    { label: 'Dim', value: SKYLIGHT.DIM },
    { label: 'Normal', value: SKYLIGHT.NORMAL },
];

const helpNodeToTopic: Readonly<Record<HelpNodeKey, HelpTopicKey>> = {
    shellTypeLabel: 'shellType',
    shellSizeLabel: 'shellSize',
    qualityLabel: 'quality',
    skyLightingLabel: 'skyLighting',
    scaleFactorLabel: 'scaleFactor',
    autoLaunchLabel: 'autoLaunch',
    finaleModeLabel: 'finaleMode',
    hideControlsLabel: 'hideControls',
    fullscreenLabel: 'fullscreen',
    longExposureLabel: 'longExposure',
};

export function createAppUiConfiguration(options: AppUiConfigurationOptions): AppUiConfiguration {
    const shellNameOptions: readonly SelectOption[] = SHELL_NAMES.map((shellName: string): SelectOption => {
        return {
            label: shellName,
            value: shellName,
        };
    });

    return {
        shellNameOptions,
        shellSizeOptions,
        qualityOptions,
        skyLightingOptions,
        scaleFactorOptions,
        helpNodeToTopic,
        fullscreenSupported: options.fullscreenSupported,
    };
}
