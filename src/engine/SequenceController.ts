// FILE-PATH: src/engine/SequenceController.ts

import type { ConfiguredShellName, ShellFactory, ShellName, ShellOptions } from './ShellTypes';

import type { Shell } from './Shell';

export interface RandomShellPosition {
    size: number;
    x: number;
    height: number;
}

export interface SequenceControllerDependencies {
    readonly isDesktop: boolean;
    readonly isHeader: boolean;

    getSelectedShellSize(): number;

    isFinaleEnabled(): boolean;

    getConfiguredShellName(): ConfiguredShellName;

    getShellFactory(shellName: ShellName): ShellFactory;

    createShell(options: ShellOptions): Shell;

    createShellFromConfig(size: number): ShellOptions;

    createRandomShell(size: number): ShellOptions;

    getRandomFastShellFactory(): ShellFactory;

    getRandomShellPosition(): RandomShellPosition;

    getCurrentTime(): number;

    schedule(callback: () => void, delay: number): number;

    random(): number;
}

export class SequenceController {
    private readonly dependencies: SequenceControllerDependencies;
    private isFirstSequence: boolean = true;
    private currentFinaleCount: number = 0;
    private readonly finaleCount: number = 32;
    private readonly smallBarrageCooldownMs: number = 15000;
    private lastSmallBarrageTime: number;

    public constructor(dependencies: SequenceControllerDependencies) {
        this.dependencies = dependencies;
        this.lastSmallBarrageTime = dependencies.getCurrentTime();
    }

    public startNextSequence(): number {
        if (this.isFirstSequence) {
            this.isFirstSequence = false;

            if (this.dependencies.isHeader) {
                return this.sequenceTwoRandom();
            }

            const crysanthemumFactory: ShellFactory = this.dependencies.getShellFactory('Crysanthemum');

            const shell: Shell = this.dependencies.createShell(
                crysanthemumFactory(this.dependencies.getSelectedShellSize()),
            );

            shell.launch(0.5, 0.5);

            return 2400;
        }

        if (this.dependencies.isFinaleEnabled()) {
            this.sequenceRandomFastShell();

            if (this.currentFinaleCount < this.finaleCount) {
                this.currentFinaleCount++;

                return 170;
            }

            this.currentFinaleCount = 0;

            return 6000;
        }

        const randomValue: number = this.dependencies.random();

        const smallBarrageReady: boolean =
            this.dependencies.getCurrentTime() - this.lastSmallBarrageTime > this.smallBarrageCooldownMs;

        if (randomValue < 0.08 && smallBarrageReady) {
            return this.sequenceSmallBarrage();
        }

        if (randomValue < 0.1) {
            return this.sequencePyramid();
        }

        if (randomValue < 0.6 && !this.dependencies.isHeader) {
            return this.sequenceRandomShell();
        }

        if (randomValue < 0.8) {
            return this.sequenceTwoRandom();
        }

        return this.sequenceTriple();
    }

    private sequenceRandomShell(): number {
        const position: RandomShellPosition = this.dependencies.getRandomShellPosition();

        const shell: Shell = this.dependencies.createShell(this.dependencies.createShellFromConfig(position.size));

        shell.launch(position.x, position.height);

        let extraDelay: number = shell.starLife;

        if (shell.fallingLeaves) {
            extraDelay = 4600;
        }

        return 900 + this.dependencies.random() * 600 + extraDelay;
    }

    private sequenceRandomFastShell(): number {
        const shellFactory: ShellFactory = this.dependencies.getRandomFastShellFactory();

        const position: RandomShellPosition = this.dependencies.getRandomShellPosition();

        const shell: Shell = this.dependencies.createShell(shellFactory(position.size));

        shell.launch(position.x, position.height);

        const extraDelay: number = shell.starLife;

        return 900 + this.dependencies.random() * 600 + extraDelay;
    }

    private sequenceTwoRandom(): number {
        const positionOne: RandomShellPosition = this.dependencies.getRandomShellPosition();

        const positionTwo: RandomShellPosition = this.dependencies.getRandomShellPosition();

        const shellOne: Shell = this.dependencies.createShell(
            this.dependencies.createShellFromConfig(positionOne.size),
        );

        const shellTwo: Shell = this.dependencies.createShell(
            this.dependencies.createShellFromConfig(positionTwo.size),
        );

        const leftOffset: number = this.dependencies.random() * 0.2 - 0.1;

        const rightOffset: number = this.dependencies.random() * 0.2 - 0.1;

        shellOne.launch(0.3 + leftOffset, positionOne.height);

        this.dependencies.schedule((): void => {
            shellTwo.launch(0.7 + rightOffset, positionTwo.height);
        }, 100);

        let extraDelay: number = Math.max(shellOne.starLife, shellTwo.starLife);

        if (shellOne.fallingLeaves || shellTwo.fallingLeaves) {
            extraDelay = 4600;
        }

        return 900 + this.dependencies.random() * 600 + extraDelay;
    }

    private sequenceTriple(): number {
        const shellFactory: ShellFactory = this.dependencies.getRandomFastShellFactory();

        const baseSize: number = this.dependencies.getSelectedShellSize();

        const smallSize: number = Math.max(0, baseSize - 1.25);

        const centerOffset: number = this.dependencies.random() * 0.08 - 0.04;

        const centerShell: Shell = this.dependencies.createShell(shellFactory(baseSize));

        centerShell.launch(0.5 + centerOffset, 0.7);

        const leftDelay: number = 1000 + this.dependencies.random() * 400;

        const rightDelay: number = 1000 + this.dependencies.random() * 400;

        this.dependencies.schedule((): void => {
            const offset: number = this.dependencies.random() * 0.08 - 0.04;

            const leftShell: Shell = this.dependencies.createShell(shellFactory(smallSize));

            leftShell.launch(0.2 + offset, 0.1);
        }, leftDelay);

        this.dependencies.schedule((): void => {
            const offset: number = this.dependencies.random() * 0.08 - 0.04;

            const rightShell: Shell = this.dependencies.createShell(shellFactory(smallSize));

            rightShell.launch(0.8 + offset, 0.1);
        }, rightDelay);

        return 4000;
    }

    private sequencePyramid(): number {
        const barrageCountHalf: number = this.dependencies.isDesktop ? 7 : 4;

        const largeSize: number = this.dependencies.getSelectedShellSize();

        const smallSize: number = Math.max(0, largeSize - 3);

        const randomMainShell: ShellFactory =
            this.dependencies.random() < 0.78
                ? this.dependencies.getShellFactory('Crysanthemum')
                : this.dependencies.getShellFactory('Ring');

        const randomSpecialShell: ShellFactory = (size: number): ShellOptions =>
            this.dependencies.createRandomShell(size);

        const configuredShellName: ConfiguredShellName = this.dependencies.getConfiguredShellName();

        const createPyramidShell: (useSpecial: boolean) => Shell = (useSpecial: boolean): Shell => {
            const shellSize: number = useSpecial ? largeSize : smallSize;

            const shellFactory: ShellFactory =
                configuredShellName === 'Random'
                    ? useSpecial
                        ? randomSpecialShell
                        : randomMainShell
                    : this.dependencies.getShellFactory(configuredShellName);

            return this.dependencies.createShell(shellFactory(shellSize));
        };

        const launchShell: (x: number, useSpecial: boolean) => void = (x: number, useSpecial: boolean): void => {
            const shell: Shell = createPyramidShell(useSpecial);

            const height: number = x <= 0.5 ? x / 0.5 : (1 - x) / 0.5;

            shell.launch(x, useSpecial ? 0.75 : height * 0.42);
        };

        let count: number = 0;
        let delay: number = 0;

        while (count <= barrageCountHalf) {
            if (count === barrageCountHalf) {
                this.dependencies.schedule((): void => {
                    launchShell(0.5, true);
                }, delay);
            } else {
                const offset: number = (count / barrageCountHalf) * 0.5;

                const delayOffset: number = this.dependencies.random() * 30 + 30;

                this.dependencies.schedule((): void => {
                    launchShell(offset, false);
                }, delay);

                this.dependencies.schedule((): void => {
                    launchShell(1 - offset, false);
                }, delay + delayOffset);
            }

            count++;
            delay += 200;
        }

        return 3400 + barrageCountHalf * 250;
    }

    private sequenceSmallBarrage(): number {
        this.lastSmallBarrageTime = this.dependencies.getCurrentTime();

        const barrageCount: number = this.dependencies.isDesktop ? 11 : 5;

        const specialIndex: number = this.dependencies.isDesktop ? 3 : 1;

        const shellSize: number = Math.max(0, this.dependencies.getSelectedShellSize() - 2);

        const randomMainShell: ShellFactory =
            this.dependencies.random() < 0.78
                ? this.dependencies.getShellFactory('Crysanthemum')
                : this.dependencies.getShellFactory('Ring');

        const randomSpecialShell: ShellFactory = this.dependencies.getRandomFastShellFactory();

        const configuredShellName: ConfiguredShellName = this.dependencies.getConfiguredShellName();

        const createBarrageShell: (useSpecial: boolean) => Shell = (useSpecial: boolean): Shell => {
            const shellFactory: ShellFactory =
                configuredShellName === 'Random'
                    ? useSpecial
                        ? randomSpecialShell
                        : randomMainShell
                    : this.dependencies.getShellFactory(configuredShellName);

            return this.dependencies.createShell(shellFactory(shellSize));
        };

        const launchShell: (x: number, useSpecial: boolean) => void = (x: number, useSpecial: boolean): void => {
            const shell: Shell = createBarrageShell(useSpecial);

            const height: number = (Math.cos(x * 5 * Math.PI + Math.PI * 0.5) + 1) / 2;

            shell.launch(x, height * 0.75);
        };

        let count: number = 0;
        let delay: number = 0;

        while (count < barrageCount) {
            if (count === 0) {
                launchShell(0.5, false);
                count += 1;
            } else {
                const offset: number = (count + 1) / barrageCount / 2;

                const delayOffset: number = this.dependencies.random() * 30 + 30;

                const useSpecial: boolean = count === specialIndex;

                this.dependencies.schedule((): void => {
                    launchShell(0.5 + offset, useSpecial);
                }, delay);

                this.dependencies.schedule((): void => {
                    launchShell(0.5 - offset, useSpecial);
                }, delay + delayOffset);

                count += 2;
            }

            delay += 200;
        }

        return 3400 + barrageCount * 120;
    }
}
