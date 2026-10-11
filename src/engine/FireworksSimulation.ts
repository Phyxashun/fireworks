// FILE-PATH: src/engine/FireworksSimulation.ts

import type { TickerEvent } from './Ticker';
import type { WebGLRenderer } from './WebGLRenderer';
import type { ParticleSimulation } from './ParticleSimulation';
import type { SequenceController } from './SequenceController';

export interface FireworksSimulationOptions {
    readonly particleSimulation: ParticleSimulation;
    readonly webGLRenderer: WebGLRenderer;
    readonly sequenceController: SequenceController;

    isRunning(): boolean;
    isAutoLaunchEnabled(): boolean;
    isSpeedAdjusting(): boolean;
    beginPerformanceFrame(): void;
    endPerformanceFrame(): void;
}

export class FireworksSimulation {
    private readonly options: FireworksSimulationOptions;

    private simulationSpeed: number = 1;
    private speedBarOpacity: number = 0;
    private autoLaunchTime: number = 0;

    public constructor(options: FireworksSimulationOptions) {
        this.options = options;
    }

    public getSimulationSpeed(): number {
        return this.simulationSpeed;
    }

    public setSimulationSpeed(speed: number): void {
        this.simulationSpeed = Math.min(Math.max(speed, 0), 1);
    }

    public getSpeedBarOpacity(): number {
        return this.speedBarOpacity;
    }

    public showSpeedBar(): void {
        this.speedBarOpacity = 1;
    }

    public update(tickerEvent: TickerEvent): void {
        if (!this.options.isRunning()) {
            return;
        }

        this.options.beginPerformanceFrame();

        try {
            const frameTime: number = tickerEvent.frameTime;
            const lag: number = tickerEvent.lag;

            if (!Number.isFinite(frameTime) || !Number.isFinite(lag)) {
                throw new Error(`Invalid ticker values: frameTime=${String(frameTime)}, lag=${String(lag)}`);
            }

            const timeStep: number = frameTime * this.simulationSpeed;
            const speed: number = this.simulationSpeed * lag;

            this.updateRuntimeState(timeStep, lag);

            // Particle physics and effects
            this.options.particleSimulation.update(timeStep, speed);

            // Canvas rendering
            this.options.webGLRenderer.render(speed);
        } finally {
            this.options.endPerformanceFrame();
        }
    }

    private updateRuntimeState(timeStep: number, lag: number): void {
        if (!this.options.isSpeedAdjusting()) {
            this.speedBarOpacity -= lag / 30;

            if (this.speedBarOpacity < 0) {
                this.speedBarOpacity = 0;
            }
        }

        if (this.options.isAutoLaunchEnabled()) {
            this.autoLaunchTime -= timeStep;

            if (this.autoLaunchTime <= 0) {
                this.autoLaunchTime = this.options.sequenceController.startNextSequence() * 1.25;
            }
        }
    }
}
