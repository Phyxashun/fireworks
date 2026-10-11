// FILE-PATH: src/debug/PerformancePane.ts

// oxlint-disable typescript/no-explicit-any

import { Pane, type FolderApi } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

const PANE_CONTAINER_SELECTOR: string = '.pane';

export class PerformancePane {
    private readonly pane: Pane;
    private readonly performanceFolder: FolderApi;
    private readonly fpsGraph: any;

    public constructor() {
        const container: HTMLElement | null = document.querySelector<HTMLElement>(PANE_CONTAINER_SELECTOR);

        if (container === null) {
            throw new Error(`Performance pane container was not found: ${PANE_CONTAINER_SELECTOR}`);
        }

        // Configure Tweakpane Dashboard and Elements
        this.pane = new Pane({
            title: 'Fireworks Debug Console',
            expanded: true,
            container,
        });

        this.pane.registerPlugin(EssentialsPlugin);

        this.performanceFolder = this.pane.addFolder({
            title: 'Performance',
            expanded: true,
        });

        this.fpsGraph = this.performanceFolder.addBlade({
            view: 'fpsgraph',
            label: 'Performance FPS',
            lineCount: 2,
        }) as any;

        /*
         * Ensure the pane remains visible above the canvas and application UI.
         * Adjust this value only if your application has a higher required
         * overlay layer.
         */
        this.pane.element.style.zIndex = '1000';
    }

    public begin(): void {
        this.fpsGraph.begin();
    }

    public end(): void {
        this.fpsGraph.end();
    }

    public destroy(): void {
        this.pane.dispose();
    }
}
