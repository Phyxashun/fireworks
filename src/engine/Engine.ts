// FILE-PATH: src/engine/Engine.ts

import { Stage, type PointerEventPayload } from './Stage';
import type { TickerEvent } from './Ticker';
import type { AppNodes } from '../dom/AppNodes';
import type { AppConfig } from '../app/AppState';

export interface EngineCallbacks {
    isRunning(): boolean;
    getConfig(): Readonly<AppConfig>;
    onPointerStart(event: PointerEventPayload): void;
    onPointerEnd(event: PointerEventPayload): void;
    onPointerMove(event: PointerEventPayload): void;
    onTicker(event: TickerEvent): void;
    onResize(width: number, height: number): void;
}

export interface EngineOptions {
    readonly nodes: AppNodes;
    readonly callbacks: EngineCallbacks;
    readonly maxWidth: number;
    readonly maxHeight: number;
}

export class Engine {
    public readonly trailsStage: Stage;
    public readonly mainStage: Stage;
    public readonly stages: readonly Stage[];
    private readonly options: EngineOptions;

    public constructor(options: EngineOptions) {
        this.options = options;

        this.trailsStage = new Stage(this.options.nodes.trailsCanvas, 'webgl2');
        this.mainStage = new Stage(this.options.nodes.mainCanvas, '2d');
        this.stages = [this.trailsStage, this.mainStage];
    }

    public initialize(): void {
        this.mainStage.addEventListener('pointerstart', this.handlePointerStart);
        this.mainStage.addEventListener('pointerend', this.handlePointerEnd);
        this.mainStage.addEventListener('pointermove', this.handlePointerMove);
        this.mainStage.addEventListener('ticker', this.handleTicker);

        window.addEventListener('resize', this.handleWindowResize);
        this.resize();
    }

    public resize(): void {
        const windowWidth: number = window.innerWidth;
        const windowHeight: number = window.innerHeight;
        const containerWidth: number = Math.min(windowWidth, this.options.maxWidth);
        const containerHeight: number =
            windowWidth <= 420 ? windowHeight : Math.min(windowHeight, this.options.maxHeight);

        this.options.nodes.stageContainer.style.width = `${containerWidth}px`;
        this.options.nodes.stageContainer.style.height = `${containerHeight}px`;

        for (const stage of this.stages) {
            stage.resize(containerWidth, containerHeight);
        }

        // FOR DEBUGGING:
        //
        // const trailsRect: DOMRect = this.trailsStage.canvas.getBoundingClientRect();
        // const mainRect: DOMRect = this.mainStage.canvas.getBoundingClientRect();
        //
        // console.table([
        //     {
        //         canvas: 'trails',
        //         stageWidth: this.trailsStage.width,
        //         stageHeight: this.trailsStage.height,
        //         cssWidth: trailsRect.width,
        //         cssHeight: trailsRect.height,
        //         inlineWidth: this.trailsStage.canvas.style.width,
        //         inlineHeight: this.trailsStage.canvas.style.height,
        //     },
        //     {
        //         canvas: 'main',
        //         stageWidth: this.mainStage.width,
        //         stageHeight: this.mainStage.height,
        //         cssWidth: mainRect.width,
        //         cssHeight: mainRect.height,
        //         inlineWidth: this.mainStage.canvas.style.width,
        //         inlineHeight: this.mainStage.canvas.style.height,
        //     },
        // ]);

        this.options.callbacks.onResize(containerWidth, containerHeight);
    }

    public destroy(): void {
        this.mainStage.removeEventListener('pointerstart', this.handlePointerStart);
        this.mainStage.removeEventListener('pointerend', this.handlePointerEnd);
        this.mainStage.removeEventListener('pointermove', this.handlePointerMove);
        this.mainStage.removeEventListener('ticker', this.handleTicker);
        window.removeEventListener('resize', this.handleWindowResize);
    }

    private readonly handleWindowResize: (event: UIEvent) => void = (_event: UIEvent): void => {
        this.resize();
    };

    private readonly handlePointerStart: (event: PointerEventPayload) => void = (event: PointerEventPayload): void => {
        this.options.callbacks.onPointerStart(event);
    };

    private readonly handlePointerEnd: (event: PointerEventPayload) => void = (event: PointerEventPayload): void => {
        this.options.callbacks.onPointerEnd(event);
    };

    private readonly handlePointerMove: (event: PointerEventPayload) => void = (event: PointerEventPayload): void => {
        this.options.callbacks.onPointerMove(event);
    };

    private readonly handleTicker: (event: TickerEvent) => void = (event: TickerEvent): void => {
        this.options.callbacks.onTicker(event);
    };
}
