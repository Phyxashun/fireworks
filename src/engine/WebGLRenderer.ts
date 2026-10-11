// FILE-PATH: src/engine/WebGLRenderer.ts

import type { Stage } from './Stage';
import type { BurstFlashManager, BurstFlashParticle } from './particles/BurstFlash';
import type { SparkManager } from './particles/Spark';
import type { StarManager } from './particles/Star';
import { BURSTCOLOR, COLOR_CODES, COLOR_TUPLES, RGBColor } from '../constants/colors';
import { type SkylightLevel, SKYLIGHT, toSkylightLevel } from '../constants/config';

export interface WebGLRendererOptions {
    readonly trailsStage: Stage; // Now housing public gl: WebGL2RenderingContext
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

// Minimalistic GLSL Shaders for fast 2D primitive rendering
const LINE_VS = `#version 300 es
    in vec2 a_position;
    in vec4 a_color;
    out vec4 v_color;
    uniform vec2 u_resolution;
    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        v_color = a_color;
    }
`;

const LINE_FS = `#version 300 es
    precision highp float;
    in vec4 v_color;
    out vec4 outColor;
    void main() {
        outColor = v_color;
    }
`;

// Trail Fade Shaders: Draws a full-screen quad to blend alpha frames backwards over time
const FADE_VS = `#version 300 es
    in vec2 a_quad_pos;
    void main() {
        gl_Position = vec4(a_quad_pos, 0.0, 1.0);
    }
`;

const FADE_FS = `#version 300 es
    precision highp float;

    uniform float u_fade_alpha;

    out vec4 outColor;

    void main() {
        /*
         * The RGB value is intentionally zero. The fade pass uses a
         * destination-only blend mode, so only alpha determines how much
         * existing trail color and transparency are retained.
         */
        outColor = vec4(0.0, 0.0, 0.0, u_fade_alpha);
    }
`;

export class WebGLRenderer {
    private readonly options: WebGLRendererOptions;
    private currentSkyColor = new RGBColor();
    private targetSkyColor = new RGBColor();

    private gl: WebGL2RenderingContext;
    private readonly mainContext: CanvasRenderingContext2D;
    private lineProgram!: WebGLProgram;
    private fadeProgram!: WebGLProgram;

    private positionBuffer!: WebGLBuffer;
    private colorBuffer!: WebGLBuffer;
    private quadBuffer!: WebGLBuffer;
    private lineVao!: WebGLVertexArrayObject;
    private fadeVao!: WebGLVertexArrayObject;

    private positionData = new Float32Array(60000);
    private colorData = new Float32Array(120000);

    public constructor(options: WebGLRendererOptions) {
        this.options = options;
        this.gl = this.options.trailsStage.getWebGLContext();
        this.mainContext = this.options.mainStage.getCanvasContext();
        this.initWebGLPipeline();
    }

    private initWebGLPipeline(): void {
        const gl = this.gl;

        // Compile and Link Line Drawing Programs
        const lvs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(lvs, LINE_VS);
        gl.compileShader(lvs);
        const lfs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(lfs, LINE_FS);
        gl.compileShader(lfs);
        this.lineProgram = gl.createProgram()!;
        gl.attachShader(this.lineProgram, lvs);
        gl.attachShader(this.lineProgram, lfs);
        gl.linkProgram(this.lineProgram);

        // Compile and Link Trail Fading Programs
        const fvs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(fvs, FADE_VS);
        gl.compileShader(fvs);
        const ffs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(ffs, FADE_FS);
        gl.compileShader(ffs);
        this.fadeProgram = gl.createProgram()!;
        gl.attachShader(this.fadeProgram, fvs);
        gl.attachShader(this.fadeProgram, ffs);
        gl.linkProgram(this.fadeProgram);

        // Configure Line Data Structures
        this.lineVao = gl.createVertexArray()!;
        gl.bindVertexArray(this.lineVao);
        this.positionBuffer = gl.createBuffer()!;
        this.colorBuffer = gl.createBuffer()!;

        gl.enableVertexAttribArray(gl.getAttribLocation(this.lineProgram, 'a_position'));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(gl.getAttribLocation(this.lineProgram, 'a_color'));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

        // Configure Fullscreen Trail-Fade Quad (2 Triangles forming a screen bounding box)
        this.fadeVao = gl.createVertexArray()!;
        gl.bindVertexArray(this.fadeVao);
        this.quadBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }

    private getParticleAlpha(life: number, fullLife: number): number {
        if (fullLife <= 0) {
            return 0;
        }

        const lifeRatio: number = life / fullLife;

        return Math.min(Math.max(lifeRatio, 0), 1);
    }

    private getColorComponent(value: number): number {
        return value / 255;
    }

    public render(speed: number): void {
        const gl = this.gl;
        const dpr: number = this.options.mainStage.dpr;
        const width: number = this.options.getLogicalWidth();
        const height: number = this.options.getLogicalHeight();
        const scaleFactor: number = this.options.getScaleFactor();

        const viewWidth = width * dpr * scaleFactor;
        const viewHeight = height * dpr * scaleFactor;

        if (this.options.getSkyLightingLevel() !== toSkylightLevel(SKYLIGHT.NONE)) {
            this.colorSky(speed);
        }

        this.updateCanvasBackground();

        // STEP 1: Apply Dynamic Trail Fading via Fullscreen WebGL Quad
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);

        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);

        /*
         * Fade existing framebuffer pixels without drawing a translucent black,
         * grey, or sky-colored layer over transparent regions.
         *
         * destination = destination * (1 - sourceAlpha)
         */
        gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(this.fadeProgram);
        gl.bindVertexArray(this.fadeVao);

        const fadeAlpha: number = this.options.isLongExposureEnabled() ? 0.0025 : 0.175 * speed;

        const fadeAlphaLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.fadeProgram, 'u_fade_alpha');

        if (fadeAlphaLocation === null) {
            throw new Error('WebGL fade shader uniform "u_fade_alpha" was not found.');
        }

        gl.uniform1f(fadeAlphaLocation, fadeAlpha);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // STEP 2: Draw High-Density Stars & Sparks
        /*
         * Firework particles should brighten existing trails rather than
         * replace their underlying pixels as standard alpha compositing does.
         */
        /*
         * Add stars and sparks on top of retained trails.
         */
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);

        gl.useProgram(this.lineProgram);
        gl.bindVertexArray(this.lineVao);
        gl.uniform2f(gl.getUniformLocation(this.lineProgram, 'u_resolution'), viewWidth, viewHeight);

        let posIdx = 0,
            colIdx = 0,
            lineVertexCount = 0;
        const colorsLen = COLOR_CODES.length;

        // Process Stars
        for (let c = 0; c < colorsLen; c++) {
            const colorStr = COLOR_CODES[c];
            const stars = this.options.stars.active[colorStr];
            const starsLen = stars.length;
            const tuple = COLOR_TUPLES[colorStr];

            const r: number = this.getColorComponent(tuple.r);
            const g: number = this.getColorComponent(tuple.g);
            const b: number = this.getColorComponent(tuple.b);

            for (let s = 0; s < starsLen; s++) {
                const star = stars[s];
                if (star.visible) {
                    this.positionData[posIdx++] = star.x * dpr * scaleFactor;
                    this.positionData[posIdx++] = star.y * dpr * scaleFactor;
                    this.positionData[posIdx++] = star.prevX * dpr * scaleFactor;
                    this.positionData[posIdx++] = star.prevY * dpr * scaleFactor;

                    const alpha: number = this.getParticleAlpha(star.life, star.fullLife);

                    for (let vertexIndex: number = 0; vertexIndex < 2; vertexIndex++) {
                        this.colorData[colIdx++] = r;
                        this.colorData[colIdx++] = g;
                        this.colorData[colIdx++] = b;
                        this.colorData[colIdx++] = alpha;
                    }
                    lineVertexCount += 2;
                }
            }
        }

        // Process Sparks
        for (let c = 0; c < colorsLen; c++) {
            const colorStr = COLOR_CODES[c];
            const sparks = this.options.sparks.active[colorStr];
            const sparksLen = sparks.length;
            const tuple = COLOR_TUPLES[colorStr];

            const r: number = this.getColorComponent(tuple.r);
            const g: number = this.getColorComponent(tuple.g);
            const b: number = this.getColorComponent(tuple.b);

            for (let sp = 0; sp < sparksLen; sp++) {
                const spark = sparks[sp];
                this.positionData[posIdx++] = spark.x * dpr * scaleFactor;
                this.positionData[posIdx++] = spark.y * dpr * scaleFactor;
                this.positionData[posIdx++] = spark.prevX * dpr * scaleFactor;
                this.positionData[posIdx++] = spark.prevY * dpr * scaleFactor;

                const alpha: number = this.getParticleAlpha(spark.life, spark.fullLife);

                for (let vertexIndex: number = 0; vertexIndex < 2; vertexIndex++) {
                    this.colorData[colIdx++] = r;
                    this.colorData[colIdx++] = g;
                    this.colorData[colIdx++] = b;
                    this.colorData[colIdx++] = alpha;
                }
                lineVertexCount += 2;
            }
        }

        if (lineVertexCount > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.positionData.subarray(0, posIdx), gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.colorData.subarray(0, colIdx), gl.DYNAMIC_DRAW);
            gl.lineWidth(this.options.stars.drawWidth * dpr);
            gl.drawArrays(gl.LINES, 0, lineVertexCount);
        }

        // --- STEP 3: SAFE 2D UI Overlay Layers (Resolves context null-crash!) ---
        // mainStage remains an independent 2D Canvas layered directly over top of WebGL via absolute positioning
        this.renderMainCanvas(width, height, scaleFactor);
    }

    private renderMainCanvas(width: number, height: number, scaleFactor: number): void {
        const mainContext: CanvasRenderingContext2D = this.mainContext;
        const dpr: number = this.options.mainStage.dpr;
        const finalScale: number = dpr * scaleFactor;

        mainContext.setTransform(finalScale, 0, 0, finalScale, 0, 0);
        mainContext.clearRect(0, 0, width, height);

        /*
         * Burst gradients use normal source-over compositing. Rendering them
         * with "lighter" can produce dark rectangular artifacts because the
         * transparent parts of the gradient still affect the compositing pass.
         */
        mainContext.globalCompositeOperation = 'source-over';

        const burstFlashes: BurstFlashParticle[] = this.options.burstFlashes.active;

        for (let index: number = burstFlashes.length - 1; index >= 0; index--) {
            const burstFlash: BurstFlashParticle = burstFlashes[index];

            const burstGradient: CanvasGradient = mainContext.createRadialGradient(
                burstFlash.x,
                burstFlash.y,
                0,
                burstFlash.x,
                burstFlash.y,
                burstFlash.radius,
            );

            burstGradient.addColorStop(0.024, BURSTCOLOR.Burst);
            burstGradient.addColorStop(0.125, BURSTCOLOR.Glow);
            burstGradient.addColorStop(0.32, BURSTCOLOR.Trail);
            burstGradient.addColorStop(1, BURSTCOLOR.Exhaust);

            mainContext.fillStyle = burstGradient;

            mainContext.fillRect(
                burstFlash.x - burstFlash.radius,
                burstFlash.y - burstFlash.radius,
                burstFlash.radius * 2,
                burstFlash.radius * 2,
            );

            burstFlashes.splice(index, 1);
            this.options.burstFlashes.returnInstance(burstFlash);
        }

        mainContext.globalCompositeOperation = 'source-over';
        mainContext.setTransform(1, 0, 0, 1, 0, 0);
    }

    private updateCanvasBackground(): void {
        const red: number = Math.round(this.currentSkyColor.r);
        const green: number = Math.round(this.currentSkyColor.g);
        const blue: number = Math.round(this.currentSkyColor.b);

        this.options.canvasContainer.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
    }

    private colorSky(speed: number): void {
        const maxSkySaturation: number = Number(this.options.getSkyLightingLevel()) * 15;
        const maxStarCount: number = 500;
        let totalStarCount: number = 0;
        this.targetSkyColor.r = 0;
        this.targetSkyColor.g = 0;
        this.targetSkyColor.b = 0;
        const colorsLen = COLOR_CODES.length;
        for (let c = 0; c < colorsLen; c++) {
            const color = COLOR_CODES[c];
            const tuple = COLOR_TUPLES[color];
            const count = this.options.stars.active[color].length;
            totalStarCount += count;
            this.targetSkyColor.r += tuple.r * count;
            this.targetSkyColor.g += tuple.g * count;
            this.targetSkyColor.b += tuple.b * count;
        }
        const intensity: number = Math.pow(Math.min(1, totalStarCount / maxStarCount), 0.3);
        const maxColor: number = Math.max(1, this.targetSkyColor.r, this.targetSkyColor.g, this.targetSkyColor.b);
        this.targetSkyColor.r = (this.targetSkyColor.r / maxColor) * maxSkySaturation * intensity;
        this.targetSkyColor.g = (this.targetSkyColor.g / maxColor) * maxSkySaturation * intensity;
        this.targetSkyColor.b = (this.targetSkyColor.b / maxColor) * maxSkySaturation * intensity;
        const colorChange = 10;
        this.currentSkyColor.r += ((this.targetSkyColor.r - this.currentSkyColor.r) / colorChange) * speed;
        this.currentSkyColor.g += ((this.targetSkyColor.g - this.currentSkyColor.g) / colorChange) * speed;
        this.currentSkyColor.b += ((this.targetSkyColor.b - this.currentSkyColor.b) / colorChange) * speed;
        // Dynamic sky illumination values are cleanly fed straight into WebGL's clearColor pipeline now!
    }
}
