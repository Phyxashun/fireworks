// FILE-PATH: src/engine/ShellLauncher.ts

import type { PointerEventPayload } from './Stage';
import type { ShellEffects } from './ShellEffects';
import type { ShellFactories } from './ShellFactories';
import {
    type ConfiguredShellName,
    type ShellFactory,
    type ShellName,
    type ShellOptions,
    type ShellRuntime,
    CONCRETE_SHELL_NAMES,
} from './ShellTypes';
import { Shell } from './Shell';

const FASTSHELLBLACKLIST: readonly ShellName[] = ['Falling Leaves', 'Floral', 'Willow'];

export interface ShellLaunchPosition {
    readonly size: number;
    readonly x: number;
    readonly height: number;
}

export interface ShellLauncherOptions {
    readonly shellFactories: ShellFactories;
    readonly shellRuntime: ShellRuntime;
    readonly shellEffects: ShellEffects;
    isHeaderMode(): boolean;
    getConfiguredShellName(): ConfiguredShellName;
    getSelectedShellSize(): number;
    getCanvasWidth(): number;
    getCanvasHeight(): number;
}

export class ShellLauncher {
    private readonly options: ShellLauncherOptions;

    public constructor(options: ShellLauncherOptions) {
        this.options = options;
    }

    public launchFromPointer(event: PointerEventPayload): void {
        const size: number = this.options.getSelectedShellSize();
        const shell: Shell = this.createShell(this.createConfiguredShellOptions(size));

        const canvasWidth: number = this.options.getCanvasWidth();
        const canvasHeight: number = this.options.getCanvasHeight();

        shell.launch(event.x / canvasWidth, 1 - event.y / canvasHeight);
    }

    public createShell(options: ShellOptions): Shell {
        return new Shell(options, this.options.shellRuntime, this.options.shellEffects);
    }

    public createConfiguredShellOptions(size: number): ShellOptions {
        const configuredShellName: ConfiguredShellName = this.options.getConfiguredShellName();

        if (configuredShellName === 'Random') {
            return this.createRandomShellOptions(size);
        }

        return this.options.shellFactories.create(configuredShellName, size);
    }

    public createRandomShellOptions(size: number): ShellOptions {
        if (this.options.isHeaderMode()) {
            return this.getRandomFastShellFactory()(size);
        }

        return this.options.shellFactories.create(this.getRandomShellName(), size);
    }

    // Get a random shell, not including processing intensive variants
    // Note this is only random when "Random" shell is selected in config.
    // Also, this does not create the shell, only returns the factory function.
    public getRandomFastShellFactory(): ShellFactory {
        const configuredShellName: ConfiguredShellName = this.options.getConfiguredShellName();

        if (configuredShellName !== 'Random') {
            return this.options.shellFactories.get(configuredShellName);
        }

        let shellName: ShellName = this.getRandomShellName();

        while (FASTSHELLBLACKLIST.includes(shellName)) {
            shellName = this.getRandomShellName();
        }

        return this.options.shellFactories.get(shellName);
    }

    public getRandomLaunchPosition(): ShellLaunchPosition {
        const baseSize: number = this.options.getSelectedShellSize();
        const maxVariance: number = Math.min(2.5, baseSize);
        const variance: number = Math.random() * maxVariance;

        const size: number = baseSize - variance;
        const height: number = maxVariance === 0 ? Math.random() : 1 - variance / maxVariance;
        const centerOffset: number = Math.random() * (1 - height * 0.65) * 0.5;
        const x: number = Math.random() < 0.5 ? 0.5 - centerOffset : 0.5 + centerOffset;

        return {
            size,
            x: this.fitPositionHorizontally(x),
            height: this.fitPositionVertically(height),
        };
    }

    private getRandomShellName(): ShellName {
        if (Math.random() < 0.5) return 'Crysanthemum';

        const index: number = Math.floor(Math.random() * CONCRETE_SHELL_NAMES.length);

        return CONCRETE_SHELL_NAMES[index]!;
    }

    private fitPositionHorizontally(position: number): number {
        const edge: number = 0.18;
        return (1 - edge * 2) * position + edge;
    }

    private fitPositionVertically(position: number): number {
        return position * 0.75;
    }
}
