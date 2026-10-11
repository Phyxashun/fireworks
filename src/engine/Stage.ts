// FILE-PATH: src/engine/Stage.ts

// oxlint-disable typescript/no-explicit-any

import { type TickerEvent, Ticker } from './Ticker';

/**
 * Stage.ts
 * -----------
 * Super simple "stage" abstraction for canvas. Combined with Ticker.ts, it helps simplify:
 *   - Preparing a canvas for drawing.
 *   - High resolution rendering.
 *   - Resizing the canvas.
 *   - Pointer events (mouse and touch).
 *   - Frame callbacks with useful timing data and calculated lag.
 *
 * This is no replacement for robust canvas drawing libraries; it's designed to be as
 * lightweight as possible and defers full rendering burden to user.
 *
 * Author: Caleb Miller
 *         caleb@caleb-miller.com
 */

export interface ResizeEvent {
    readonly width: number;
    readonly height: number;
}

interface Vector {
    x: number;
    y: number;
}

interface StageListeners {
    resize: ResizeEvent[];
    pointerstart: PointerEventPayload[];
    pointermove: PointerEventPayload[];
    pointerend: PointerEventPayload[];
    lastPointerPos: Vector;

    [key: string]: any; // Dynamic fallback string buckets
}

export interface PointerEventPayload {
    type: string;
    x: number;
    y: number;
    onCanvas: boolean;
}

export type StageEvent = {
    [K in keyof StageEventMap]: {
        readonly type: K;
    } & (Parameters<StageEventMap[K]> extends [infer T] ? T : {});
}[keyof StageEventMap];

export type myMap = WindowEventMap;

export interface StageEventMap {
    ticker: (this: Window, ev: TickerEvent) => void;
    click: (this: Stage, ev: MouseEvent) => void;
    resize: (this: Stage, ev: ResizeEvent) => void;
    touchstart: (this: Stage, ev: TouchEvent) => void;
    touchmove: (this: Stage, ev: TouchEvent) => void;
    touchend: (this: Stage, ev: TouchEvent) => void;
    pointermove: (this: Stage, ev: PointerEventPayload) => void;
    pointerstart: (this: Stage, ev: PointerEventPayload) => void;
    pointerend: (this: Stage, ev: PointerEventPayload) => void;

    [type: string]: (this: any, ev: any) => void;
}

export type StageRendererType = '2d' | 'webgl2';

export class Stage {
    // Track touch times to prevent redundant mouse events.
    private lastTouchTimestamp: number = 0;

    // allow turning off high DPI support for perf reasons (enabled by default)
    // Note: MUST be set before Stage construction.
    //       Each stage tracks its own DPI (initialized at construction time),
    //       so you can effectively allow some Stages to render high-res graphics
    //       but not others.
    disableHighDPI: boolean = false;

    public canvas!: HTMLCanvasElement;
    public readonly rendererType: StageRendererType;

    public ctx: CanvasRenderingContext2D | null = null;
    public gl: WebGL2RenderingContext | null = null;

    public speed: number = 1;
    public dpr: number = 1;
    public width: number = 0;
    public height: number = 0;
    public naturalWidth: number = 0;
    public naturalHeight: number = 0;

    private _listeners: StageListeners = {
        resize: [],
        pointerstart: [],
        pointermove: [],
        pointerend: [],
        lastPointerPos: { x: 0, y: 0 },
    };

    public stages: Stage[] = [];

    // Stage constructor (canvas can be a dom node, or an id string)
    constructor(canvas: HTMLCanvasElement | string, rendererType: StageRendererType = '2d') {
        this.rendererType = rendererType;

        if (typeof canvas === 'string') {
            const element: HTMLElement | null = document.getElementById(canvas);

            if (!(element instanceof HTMLCanvasElement)) {
                throw new Error(`Canvas element was not found: ${canvas}`);
            }

            this.canvas = element;
        } else {
            this.canvas = canvas;
        }

        if (this.rendererType === 'webgl2') {
            const options: WebGLContextAttributes = {
                alpha: true,
                premultipliedAlpha: false,
                antialias: false,
                preserveDrawingBuffer: true,
            };

            this.gl = this.canvas.getContext('webgl2', options);

            if (this.gl === null) {
                throw new Error('WebGL2 is not supported by this browser environment.');
            }
        } else {
            this.ctx = this.canvas.getContext('2d');

            if (this.ctx === null) {
                throw new Error('CanvasRenderingContext2D is not supported by this browser environment.');
            }
        }

        // Prevent gestures on stages (scrolling, zooming, etc)
        this.canvas.style.touchAction = 'none';

        this.initDimensions();

        this.stages.push(this);

        // event listeners (note that 'ticker' is also an option, for frame events)
        this._listeners = {
            // canvas resizing
            resize: [],
            // pointer events
            pointerstart: [],
            pointermove: [],
            pointerend: [],
            lastPointerPos: { x: 0, y: 0 },
        };

        document.addEventListener('mousedown', this.mouseHandler);
        document.addEventListener('mousemove', this.mouseHandler);
        document.addEventListener('mouseup', this.mouseHandler);
        document.addEventListener('touchstart', this.touchHandler);
        document.addEventListener('touchmove', this.touchHandler);
        document.addEventListener('touchend', this.touchHandler);
    }

    public getCanvasContext(): CanvasRenderingContext2D {
        if (this.ctx === null) {
            throw new Error('This stage was not created with a CanvasRenderingContext2D.');
        }

        return this.ctx;
    }

    public getWebGLContext(): WebGL2RenderingContext {
        if (this.gl === null) {
            throw new Error('This stage was not created with a WebGL2RenderingContext.');
        }

        return this.gl;
    }

    private initDimensions(): void {
        // physics speed multiplier: allows slowing down or speeding up simulation (must be manually implemented in physics layer)
        this.speed = 1;

        // devicePixelRatio alias (should only be used for rendering, physics shouldn't care)
        // avoids rendering unnecessary pixels that browser might handle natively
        // via CanvasRenderingContext2D.backingStorePixelRatio
        this.dpr = this.disableHighDPI ? 1 : window.devicePixelRatio || 1; // / ((this.ctx as any).backingStorePixelRatio ?? 1);

        // canvas size in DIPs and natural pixels
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.naturalWidth = this.width * this.dpr;
        this.naturalHeight = this.height * this.dpr;

        // size canvas to match natural size
        if (this.width !== this.naturalWidth) {
            this.canvas.width = this.naturalWidth;
            this.canvas.height = this.naturalHeight;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
        }

        if (this.gl !== null) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // events
    public addEventListener = <K extends keyof StageEventMap>(type: K, handler: StageEventMap[K]): void => {
        try {
            if (type === 'ticker') {
                // We cast to any here securely because the public signature
                // already strictly guaranteed the handler's type contract.
                Ticker.addListener(handler as any);
            } else {
                // Initialize the array bucket if it doesn't exist yet
                if (!this._listeners[type as string]) {
                    this._listeners[type as string] = [];
                }
                this._listeners[type as string].push(handler);
            }
        } catch (e: unknown) {
            if (e instanceof Error) throw new Error(`Invalid Event: ${e}`);
        }
    };

    public removeEventListener = <K extends keyof StageEventMap>(type: K, handler: StageEventMap[K]): void => {
        if (type === 'ticker') {
            Ticker.removeListener(handler as any);
        } else if (this._listeners[type as string]) {
            this._listeners[type as string] = (this._listeners[type as string] as Function[]).filter(
                (h: Function): boolean => h !== handler,
            );
        }
    };

    public dispatchEvent = <K extends keyof StageEventMap>(
        event: K,
        ...val: Parameters<StageEventMap[K]> extends [infer T] ? [val: T] : []
    ): void => {
        const listeners: any = this._listeners[event as string];

        if (listeners) {
            listeners.forEach((listener: any): void => {
                listener.call(this, ...val);
            });
        } else {
            throw new Error('Invalid Event');
        }
    };

    // resize canvas
    public resize = (w: number, h: number): void => {
        this.width = w;
        this.height = h;

        this.naturalWidth = w * this.dpr;
        this.naturalHeight = h * this.dpr;

        this.canvas.width = this.naturalWidth;
        this.canvas.height = this.naturalHeight;

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';

        if (this.gl !== null) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        this.dispatchEvent('resize', { width: w, height: h });
    };

    // utility function for coordinate space conversion
    public windowToCanvas = (canvas: HTMLCanvasElement, x: number, y: number): Vector => {
        const box: DOMRect = canvas.getBoundingClientRect();

        return {
            x: (x - box.left) * (canvas.width / box.width),
            y: (y - box.top) * (canvas.height / box.height),
        };
    };

    // handle interaction
    public mouseHandler = (evt: StageEvent): void => {
        // Prevent mouse events from firing immediately after touch events
        if (Date.now() - this.lastTouchTimestamp < 500) {
            return;
        }

        let type: string = 'start';
        if (evt.type === 'mousemove') {
            type = 'move';
        } else if (evt.type === 'mouseup') {
            type = 'end';
        }

        this.stages.forEach((stage: Stage): void => {
            const pos: Vector = this.windowToCanvas(stage.canvas, evt.clientX, evt.clientY);

            stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
        });
    };

    public touchHandler = (evt: StageEvent): void => {
        // Cast evt once up front so the entire handler treats it as a touch-driven event
        const touchEvt = evt as TouchEvent;

        // Safety check just in case a non-touch event accidentally routes here
        if (!touchEvt.changedTouches) return;

        this.lastTouchTimestamp = Date.now();

        // Set generic event type
        let type: string = 'start';
        if (evt.type === 'touchmove') {
            type = 'move';
        } else if (evt.type === 'touchend') {
            type = 'end';
        }

        // Dispatch "pointer events" for all changed touches across all stages.
        this.stages.forEach((stage: Stage): void => {
            // Clear loop variables! touch naturally infers as a true Touch object now
            for (const touch of Array.from(touchEvt.changedTouches)) {
                let pos: Vector;
                if (type !== 'end') {
                    pos = this.windowToCanvas(stage.canvas, touch.clientX, touch.clientY);
                    stage._listeners.lastPointerPos = pos;

                    if (type === 'start') {
                        stage.pointerEvent('move', pos.x / stage.dpr, pos.y / stage.dpr);
                    }
                } else {
                    pos = stage._listeners.lastPointerPos;
                }
                stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
            }
        });
    };

    // dispatch a normalized pointer event on a specific stage
    public pointerEvent = (
        type: string, // 'move' | 'start' | 'end',
        x: number,
        y: number,
    ): void => {
        // Build raw structure matching our targeted contract
        const evt: PointerEventPayload = {
            type: type,
            x: x,
            y: y,
            // Calculate whether pointer event was dispatched over canvas element
            onCanvas: x >= 0 && x <= this.width && y >= 0 && y <= this.height,
        };

        // Construct dynamic key safely
        const eventKey = `pointer${type}` as keyof StageEventMap;

        // Dispatch via your existing strongly-typed pipeline
        this.dispatchEvent(eventKey, evt as any);
    };
}
