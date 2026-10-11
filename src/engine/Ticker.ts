// FILE-PATH: src/engine/Ticker.ts

// oxlint-disable typescript/no-explicit-any

/**
 * Ticker.ts
 * -----------
 * requestAnimationFrame helper. Provides elapsed time between frames and a lag compensation
 * multiplier to callbacks.
 *
 * Author: Caleb Miller
 *         caleb@caleb-miller.com
 */

export interface TickerEvent {
    readonly frameTime: number;
    readonly lag: number;
}

declare global {
    interface WindowEventMap {
        ticker: TickerEvent;
    }
}

type TickerCallbackFn = (this: Window, ev: TickerEvent) => any;

export class Ticker {
    private static started: boolean = false;
    private static lastTimestamp: number = 0;
    private static listeners: TickerCallbackFn[] = [];
    private static rafId: number | null = null;

    // Registers a callback to be fired on every animation frame.
    public static addListener = (callback: TickerCallbackFn): void => {
        if (typeof callback !== 'function') {
            throw new TypeError('Ticker.addListener() requires a function reference.');
        }

        // Avoid duplicate listeners
        if (Ticker.listeners.includes(callback)) return;

        Ticker.listeners.push(callback);

        // Lazily start the frame loop
        if (!Ticker.started) {
            Ticker.started = true;
            Ticker.lastTimestamp = 0;
            Ticker.queueFrame();
        }
    };

    // Unregisters a callback and stops the loop if no listeners remain.
    public static removeListener = (callback: TickerCallbackFn): void => {
        Ticker.listeners = Ticker.listeners.filter((listener) => listener !== callback);

        if (Ticker.listeners.length === 0) {
            Ticker.stop();
        }
    };

    // Explicitly stops the engine and clears any queued frames
    public static stop = (): void => {
        Ticker.started = false;

        if (Ticker.rafId !== null) {
            const cancelRaf = window.cancelAnimationFrame || (window as any).webkitCancelAnimationFrame;

            if (cancelRaf) {
                cancelRaf(Ticker.rafId);
            }

            Ticker.rafId = null;
        }
    };

    // Use arrow functions to automatically preserve the 'this' context
    private static queueFrame = (): void => {
        if (!Ticker.started) return; // Prevent queuing if stopped

        const raf = window.requestAnimationFrame || (window as any).webkitRequestAnimationFrame;

        if (raf) {
            // Capture the ID returned by the browser
            Ticker.rafId = raf(Ticker.frameHandler);
        }
    };

    private static frameHandler = (timestamp: number): void => {
        if (!Ticker.started) return;

        if (Ticker.lastTimestamp === 0) {
            Ticker.lastTimestamp = timestamp;
            Ticker.queueFrame();
            return;
        }

        let frameTime: number = timestamp - Ticker.lastTimestamp;
        Ticker.lastTimestamp = timestamp;

        if (frameTime < 0) frameTime = 16.6667;
        if (frameTime > 68) frameTime = 68;

        const ev: TickerEvent = {
            frameTime,
            lag: frameTime / 16.6667,
        };

        // Reference the array directly (Zero allocations, high performance)
        const activeListeners: TickerCallbackFn[] = Ticker.listeners;
        const len: number = activeListeners.length;

        for (let i: number = 0; i < len; i++) {
            activeListeners[i].call(window, ev);
        }

        Ticker.queueFrame();
    };
}
