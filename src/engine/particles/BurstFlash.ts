// FILE-PATH: src/engine/particles/BurstFlash.ts

export class BurstFlashParticle {
    public x: number = 0.0;
    public y: number = 0.0;
    public radius: number = 0.0;

    public reset(x: number, y: number, radius: number): void {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
}

export class BurstFlashManager {
    public readonly active: BurstFlashParticle[] = [];

    private readonly pool: BurstFlashParticle[] = [];

    public add(x: number, y: number, radius: number): BurstFlashParticle {
        const instance: BurstFlashParticle = this.pool.pop() ?? new BurstFlashParticle();
        instance.reset(x, y, radius);
        this.active.push(instance);
        return instance;
    }

    public returnInstance(instance: BurstFlashParticle): void {
        this.pool.push(instance);
    }
}
