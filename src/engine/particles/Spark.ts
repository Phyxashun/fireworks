// FILE-PATH: src/engine/particles/Spark.ts

import { type ParticleColor, type VisibleColor, COLOR } from '../../constants/colors';

import { createParticleCollection, type ParticleCollection } from './ParticleCollection';

export class SparkParticle {
    public x: number = 0;
    public y: number = 0;
    public prevX: number = 0;
    public prevY: number = 0;

    public color: VisibleColor;

    public speedX: number = 0;
    public speedY: number = 0;

    public life: number = 0;
    public fullLife: number = 0;

    public constructor() {
        this.color = COLOR.White;
    }

    public reset(x: number, y: number, color: VisibleColor, angle: number, speed: number, life: number): void {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;

        this.color = color;

        this.speedX = Math.sin(angle) * speed;
        this.speedY = Math.cos(angle) * speed;

        this.life = life;
        this.fullLife = life;
    }
}

export class SparkManager {
    public drawWidth: number = 0;
    public airDrag: number = 0.9;

    public readonly active: ParticleCollection<SparkParticle>;

    private readonly pool: SparkParticle[] = [];

    public constructor(colors: readonly ParticleColor[]) {
        this.active = createParticleCollection<SparkParticle>(colors);
    }

    public add(x: number, y: number, color: VisibleColor, angle: number, speed: number, life: number): SparkParticle {
        const instance: SparkParticle = this.pool.pop() ?? new SparkParticle();

        instance.reset(x, y, color, angle, speed, life);

        this.active[color].push(instance);

        return instance;
    }

    public returnInstance(instance: SparkParticle): void {
        this.pool.push(instance);
    }
}
