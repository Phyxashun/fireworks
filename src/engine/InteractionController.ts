// FILE-PATH: src/engine/InteractionController.ts

import type { PointerEventPayload } from '../utils/Stage';

export interface InteractionControllerOptions {
    getStageWidth(): number;
    getStageHeight(): number;

    isRunning(): boolean;

    togglePause(): void;
    toggleSound(): void;
    toggleMenu(open?: boolean): void;

    launchShell(event: PointerEventPayload): void;

    getSimulationSpeed(): number;
    setSimulationSpeed(speed: number): void;

    showSpeedBar(): void;
}

export class InteractionController {
    private readonly options: InteractionControllerOptions;

    private activePointerCount: number = 0;
    public isUpdatingSpeed: boolean = false;

    public constructor(options: InteractionControllerOptions) {
        this.options = options;
    }

    public handlePointerStart(event: PointerEventPayload): void {
        if (!event.onCanvas) return;

        this.activePointerCount++;
        const btnSize = 50;

        if (event.y < btnSize) {
            if (event.x < btnSize) {
                this.options.togglePause();
                return;
            }
            if (
                event.x > this.options.getStageWidth() / 2 - btnSize / 2 &&
                event.x < this.options.getStageWidth() / 2 + btnSize / 2
            ) {
                this.options.toggleSound();
                return;
            }
            if (event.x > this.options.getStageWidth() - btnSize) {
                this.options.toggleMenu();
                return;
            }
        }

        if (!this.options.isRunning()) return;

        if (this.updateSpeedFromEvent(event)) {
            this.isUpdatingSpeed = true;
        } else if (event.onCanvas) {
            this.options.launchShell(event);
        }
    }

    public handlePointerEnd(_event: PointerEventPayload): void {
        this.activePointerCount--;
        this.isUpdatingSpeed = false;
    }

    public handlePointerMove(event: PointerEventPayload): void {
        if (!this.options.isRunning()) return;

        if (this.isUpdatingSpeed) {
            this.updateSpeedFromEvent(event);
        }
    }

    public handleKeydown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'Escape':
                this.options.toggleMenu(false);
                break;
            case 'KeyO':
                this.options.toggleMenu();
                break;
            case 'KeyP':
                this.options.togglePause();
                break;
            case 'KeyS':
                this.options.toggleSound();
                break;
            default:
                break;
        }
    }

    private updateSpeedFromEvent(event: PointerEventPayload): boolean {
        if (this.isUpdatingSpeed || event.y >= this.options.getStageHeight() - 44) {
            // On phones it's hard to hit the edge pixels in order to set speed at 0 or 1,
            // so some padding is provided to make that easier.
            const edge: number = 16;
            const newSpeed: number = (event.x - edge) / (this.options.getStageWidth() - edge * 2);
            this.options.setSimulationSpeed(Math.min(Math.max(newSpeed, 0), 1));

            // show speed bar after an update
            this.options.showSpeedBar();

            // If we updated the speed, return true
            return true;
        }
        // Return false if the speed wasn't updated
        return false;
    }
}
