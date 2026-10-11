// FILE-PATH: src/engine/particles/Star.ts

// src/engine/particles/Star.ts

import { createParticleCollection, type ParticleCollection } from './ParticleCollection.js';
import { COLOR, type ParticleColor, type VisibleColor, isVisibleColor } from '../../constants/colors';

export type StarDeathHandler = (star: StarParticle) => void;

export class StarParticle {
    public visible: boolean = true;
    public heavy: boolean = false;

    public x: number = 0;
    public y: number = 0;
    public prevX: number = 0;
    public prevY: number = 0;

    public color: ParticleColor = COLOR.White;

    public speedX: number = 0;
    public speedY: number = 0;

    public life: number = 0;
    public fullLife: number = 0;

    public updateFrame: number = -1;

    public spinAngle: number = 0;
    public spinSpeed: number = 0.8;
    public spinRadius: number = 0;

    public sparkFreq: number = 0;
    public sparkSpeed: number = 1;
    public sparkTimer: number = 0;
    public sparkColor: VisibleColor = COLOR.White;
    public sparkLife: number = 750;
    public sparkLifeVariation: number = 0.25;

    public strobe: boolean = false;
    public strobeFreq: number = 0;

    public secondColor: ParticleColor | null = null;
    public transitionTime: number = 0;
    public colorChanged: boolean = false;

    public onDeath: StarDeathHandler | null = null;

    public reset(
        x: number,
        y: number,
        color: ParticleColor,
        angle: number,
        speed: number,
        life: number,
        speedOffsetX = 0,
        speedOffsetY = 0,
    ): void {
        this.visible = true;
        this.heavy = false;

        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;

        this.color = color;

        this.speedX = Math.sin(angle) * speed + speedOffsetX;
        this.speedY = Math.cos(angle) * speed + speedOffsetY;

        this.life = life;
        this.fullLife = life;

        this.updateFrame = -1;

        this.spinAngle = Math.random() * Math.PI * 2;
        this.spinSpeed = 0.8;
        this.spinRadius = 0;

        this.sparkFreq = 0;
        this.sparkSpeed = 1;
        this.sparkTimer = 0;

        /*
         * Spark colors must be visible because SparkManager.add()
         * should accept VisibleColor only.
         */
        this.sparkColor = isVisibleColor(color) ? color : COLOR.White;

        this.sparkLife = 750;
        this.sparkLifeVariation = 0.25;

        this.strobe = false;
        this.strobeFreq = 0;

        this.secondColor = null;
        this.transitionTime = 0;
        this.colorChanged = false;

        this.onDeath = null;
    }
}

export class StarManager {
    public drawWidth: number = 3;
    public airDrag: number = 0.98;
    public airDragHeavy: number = 0.992;

    public readonly active: ParticleCollection<StarParticle>;

    private readonly pool: StarParticle[] = [];

    public constructor(colors: readonly ParticleColor[]) {
        this.active = createParticleCollection<StarParticle>(colors) as ParticleCollection<StarParticle>;
    }

    public add(
        x: number,
        y: number,
        color: ParticleColor,
        angle: number,
        speed: number,
        life: number,
        speedOffsetX = 0,
        speedOffsetY = 0,
    ): StarParticle {
        const instance: StarParticle = this.pool.pop() ?? new StarParticle();

        instance.reset(x, y, color, angle, speed, life, speedOffsetX, speedOffsetY);

        this.active[color].push(instance);

        return instance;
    }

    public returnInstance(instance: StarParticle): void {
        instance.onDeath?.(instance);

        instance.onDeath = null;
        instance.secondColor = null;
        instance.transitionTime = 0;
        instance.colorChanged = false;

        this.pool.push(instance);
    }
}
