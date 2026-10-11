// FILE-PATH: src/engine/CanvasRenderer.ts

import type { Stage } from './Stage';
import type { BurstFlashManager, BurstFlashParticle } from './particles/BurstFlash';
import type { SparkManager, SparkParticle } from './particles/Spark';
import type { StarManager, StarParticle } from './particles/Star';
import { type VisibleColor, BURSTCOLOR, COLOR, COLOR_CODES, COLOR_TUPLES, RGBColor } from '../constants/colors';
import { type SkylightLevel, SKYLIGHT, toSkylightLevel } from '../constants/config';

export interface CanvasRendererOptions {
    readonly trailsStage: Stage;
    readonly mainStage: Stage;

    readonly stars: StarManager;
    readonly sparks: SparkManager;
    readonly burstFlashes: BurstFlashManager;

    readonly canvasContainer: HTMLElement;

    getLogicalWidth(): number;
    getLogicalHeight(): number;

    getScaleFactor(): number;
    isLongExposureEnabled(): boolean;

    getSkyLightingLevel(): SkylightLevel;

    getSimulationSpeed(): number;
    getSpeedBarOpacity(): number;
    isLowQuality(): boolean;
}

export class CanvasRenderer {
    private readonly options: CanvasRendererOptions;
    private currentSkyColor = new RGBColor();
    private targetSkyColor = new RGBColor();

    public constructor(options: CanvasRendererOptions) {
        this.options = options;
    }

    private clear(speed: number): void {
        const width: number = this.options.getLogicalWidth();
        const height: number = this.options.getLogicalHeight();

        // Convert current sky colors to clean integer values
        const skyR: number = this.currentSkyColor.r | 0;
        const skyG: number = this.currentSkyColor.g | 0;
        const skyB: number = this.currentSkyColor.b | 0;

        // Choose opacity blend based on long exposure selection
        const alpha: number = this.options.isLongExposureEnabled() ? 0.0025 : 0.175 * speed;

        // Clear and fade the trails using the dynamic sky color on the CANVAS instead of the DOM
        this.options.trailsStage.ctx.fillStyle = `rgba(${skyR}, ${skyG}, ${skyB}, ${alpha})`;
        this.options.trailsStage.ctx.fillRect(0, 0, width, height);

        this.options.mainStage.ctx.clearRect(0, 0, width, height);
    }

    public render(speed: number): void {
        const dpr: number = this.options.mainStage.dpr;
        const width: number = this.options.getLogicalWidth();
        const height: number = this.options.getLogicalHeight();

        const trailsCtx: CanvasRenderingContext2D = this.options.trailsStage.ctx;
        const mainCtx: CanvasRenderingContext2D = this.options.mainStage.ctx;

        if (this.options.getSkyLightingLevel() !== toSkylightLevel(SKYLIGHT.NONE)) {
            this.colorSky(speed);
        }

        // Cache parameters locally to avoid multiple cross-boundary object reads
        const scaleFactor: number = this.options.getScaleFactor();
        const finalScale: number = dpr * scaleFactor;
        const isLowQuality: boolean = this.options.isLowQuality();

        // Reset identity Matrix BEFORE setting the scaling factor
        // This eliminates exponential coordinate amplification
        trailsCtx.setTransform(finalScale, 0, 0, finalScale, 0, 0);
        mainCtx.setTransform(finalScale, 0, 0, finalScale, 0, 0);

        trailsCtx.globalCompositeOperation = 'source-over';

        this.clear(speed);

        /**
         ** Draw queued burst flashes
         */
        const bfActive: BurstFlashParticle[] = this.options.burstFlashes.active;
        while (bfActive.length > 0) {
            const bf: BurstFlashParticle = bfActive.pop()!;
            const bx: number = bf.x | 0;
            const by: number = bf.y | 0;
            const br: number = bf.radius;

            const burstGradient: CanvasGradient = trailsCtx.createRadialGradient(bx, by, 0, bx, by, br);

            burstGradient.addColorStop(0.024, BURSTCOLOR.Burst);
            burstGradient.addColorStop(0.125, BURSTCOLOR.Glow);
            burstGradient.addColorStop(0.32, BURSTCOLOR.Trail);
            burstGradient.addColorStop(1, BURSTCOLOR.Exhaust);

            trailsCtx.fillStyle = burstGradient;
            // Draw matching integer coordinate frames to prevent layout bleeding
            trailsCtx.fillRect(bx - br, by - br, br * 2, br * 2);

            this.options.burstFlashes.returnInstance(bf);
        }

        trailsCtx.globalCompositeOperation = 'lighten';

        /**
         ** Draw stars (Optimized Loop Structure)
         */
        trailsCtx.lineWidth = this.options.stars.drawWidth;
        trailsCtx.lineCap = isLowQuality ? 'square' : 'round';
        mainCtx.strokeStyle = COLOR.White;
        mainCtx.lineWidth = 1;

        mainCtx.beginPath();

        const colorsLen: number = COLOR_CODES.length;
        for (let c: number = 0; c < colorsLen; c++) {
            const color: VisibleColor = COLOR_CODES[c];
            const stars: StarParticle[] = this.options.stars.active[color];
            const starsLen: number = stars.length;

            trailsCtx.strokeStyle = color;
            trailsCtx.beginPath();

            for (let s: number = 0; s < starsLen; s++) {
                const star: StarParticle = stars[s];
                if (star.visible) {
                    // Whole number coordinates (| 0) prevent slow anti-aliasing math
                    const sx: number = star.x | 0;
                    const sy: number = star.y | 0;

                    trailsCtx.moveTo(sx, sy);
                    trailsCtx.lineTo(star.prevX | 0, star.prevY | 0);

                    mainCtx.moveTo(sx, sy);
                    mainCtx.lineTo((star.x - star.speedX * 1.6) | 0, (star.y - star.speedY * 1.6) | 0);
                }
            }
            trailsCtx.stroke();
        }
        mainCtx.stroke();

        /**
         ** Draw sparks (Optimized Loop Structure)
         */
        trailsCtx.lineWidth = this.options.sparks.drawWidth;
        trailsCtx.lineCap = 'butt';

        for (let c: number = 0; c < colorsLen; c++) {
            const color: VisibleColor = COLOR_CODES[c];
            const sparks: SparkParticle[] = this.options.sparks.active[color];
            const sparksLen: number = sparks.length;

            trailsCtx.strokeStyle = color;
            trailsCtx.beginPath();

            for (let sp: number = 0; sp < sparksLen; sp++) {
                const spark: SparkParticle = sparks[sp];
                trailsCtx.moveTo(spark.x | 0, spark.y | 0);
                trailsCtx.lineTo(spark.prevX | 0, spark.prevY | 0);
            }
            trailsCtx.stroke();
        }

        /**
         ** Render speed bar if visible
         */
        const barOpacity: number = this.options.getSpeedBarOpacity();
        if (barOpacity > 0) {
            const speedBarHeight = 6;
            mainCtx.globalAlpha = barOpacity;
            mainCtx.fillStyle = COLOR.Blue;
            mainCtx.fillRect(
                0,
                (height - speedBarHeight) | 0,
                (width * this.options.getSimulationSpeed()) | 0,
                speedBarHeight,
            );
            mainCtx.globalAlpha = 1;
        }

        // Return clean, unscaled space for container bindings
        trailsCtx.setTransform(1, 0, 0, 1, 0, 0);
        mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Draw colored overlay based on combined brightness of stars (light up the sky!)
    // Note: this is applied to the canvas container's background, so it's behind the particles
    private colorSky(speed: number): void {
        // The maximum r, g, or b value that will be used (255 would represent no maximum)
        const maxSkySaturation: number = Number(this.options.getSkyLightingLevel()) * 15;

        // How many stars are required in total to reach maximum sky brightness
        const maxStarCount: number = 500;
        let totalStarCount: number = 0;

        // Initialize sky as black
        this.targetSkyColor.r = 0;
        this.targetSkyColor.g = 0;
        this.targetSkyColor.b = 0;

        // Add each known color to sky, multiplied by particle count of that color. This will put
        // RGB values wildly out of bounds, but we'll scale them back later.
        // Also add up total star count.
        const colorsLen: number = COLOR_CODES.length;
        for (let c: number = 0; c < colorsLen; c++) {
            const color: VisibleColor = COLOR_CODES[c];
            const tuple: RGBColor = COLOR_TUPLES[color];
            const count: number = this.options.stars.active[color].length;

            totalStarCount += count;
            this.targetSkyColor.r += tuple.r * count;
            this.targetSkyColor.g += tuple.g * count;
            this.targetSkyColor.b += tuple.b * count;
        }

        // Clamp intensity at 1.0, and map to a custom non-linear curve. This allows few stars to
        // perceivably light up the sky, while more stars continue to increase the brightness but
        // at a lesser rate. This is more inline with humans' non-linear brightness perception.
        const intensity: number = Math.pow(Math.min(1, totalStarCount / maxStarCount), 0.3);

        // Figure out which color component has the highest value, so we can scale them without
        // affecting the ratios.
        // Prevent 0 from being used, so we don't divide by zero in the next step.
        const maxColor: number = Math.max(1, this.targetSkyColor.r, this.targetSkyColor.g, this.targetSkyColor.b);

        // Scale all color components to a max of `maxSkySaturation`, and apply intensity.
        this.targetSkyColor.r = (this.targetSkyColor.r / maxColor) * maxSkySaturation * intensity;
        this.targetSkyColor.g = (this.targetSkyColor.g / maxColor) * maxSkySaturation * intensity;
        this.targetSkyColor.b = (this.targetSkyColor.b / maxColor) * maxSkySaturation * intensity;

        // Animate changes to color to smooth out transitions.
        const colorChange: number = 10;
        this.currentSkyColor.r += ((this.targetSkyColor.r - this.currentSkyColor.r) / colorChange) * speed;
        this.currentSkyColor.g += ((this.targetSkyColor.g - this.currentSkyColor.g) / colorChange) * speed;
        this.currentSkyColor.b += ((this.targetSkyColor.b - this.currentSkyColor.b) / colorChange) * speed;

        // const r: number = this.currentSkyColor.r | 0;
        // const g: number = this.currentSkyColor.g | 0;
        // const b: number = this.currentSkyColor.b | 0;
        // this.options.canvasContainer.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
}
