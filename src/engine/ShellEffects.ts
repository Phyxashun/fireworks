// FILE-PATH: src/engine/ShellEffects.ts

import { COLOR, INVISIBLE } from '../constants/colors';
import { ParticlePatterns } from './ParticlePatterns';
import type { ShellRuntime } from './ShellTypes';
import type { StarParticle } from './particles/Star';

// Various star effects.
// These are designed to be attached to a star's `onDeath` event.
export class ShellEffects {
    private readonly runtime: ShellRuntime;

    public constructor(runtime: ShellRuntime) {
        this.runtime = runtime;
    }

    // Crossette breaks star into four same-color pieces which branch in a cross-like shape.
    public crossette(star: StarParticle): void {
        const startAngle: number = Math.random() * Math.PI * 0.5;

        ParticlePatterns.createArc(startAngle, Math.PI * 2, 4, 0.5, (angle: number): void => {
            this.runtime.stars.add(star.x, star.y, star.color, angle, Math.random() * 0.6 + 0.75, 600);
        });
    }

    // Flower is like a mini shell
    public floral(star: StarParticle): void {
        const count: number = 12 + 6 * this.runtime.getQuality();

        ParticlePatterns.createBurst(count, (angle: number, speedMultiplier: number): void => {
            this.runtime.stars.add(
                star.x,
                star.y,
                star.color,
                angle,
                speedMultiplier * 2.4,
                1000 + Math.random() * 300,
                star.speedX,
                star.speedY,
            );
        });

        this.runtime.burstFlashes.add(star.x, star.y, 46);

        this.runtime.audio.playSound('burstSmall');
    }

    // Floral burst with willow stars
    public fallingLeaves(star: StarParticle): void {
        ParticlePatterns.createBurst(7, (angle: number, speedMultiplier: number): void => {
            const newStar: StarParticle = this.runtime.stars.add(
                star.x,
                star.y,
                INVISIBLE,
                angle,
                speedMultiplier * 2.4,
                2400 + Math.random() * 600,
                star.speedX,
                star.speedY,
            );

            newStar.sparkColor = COLOR.Gold;
            newStar.sparkFreq = 144 / this.runtime.getQuality();
            newStar.sparkSpeed = 0.28;
            newStar.sparkLife = 750;
            newStar.sparkLifeVariation = 3.2;
        });

        this.runtime.burstFlashes.add(star.x, star.y, 46);

        this.runtime.audio.playSound('burstSmall');
    }

    // Crackle pops into a small cloud of golden sparks.
    public crackle(star: StarParticle): void {
        const count: number = this.runtime.isHighQuality() ? 32 : 16;

        ParticlePatterns.createArc(0, Math.PI * 2, count, 1.8, (angle: number): void => {
            this.runtime.sparks.add(
                star.x,
                star.y,
                COLOR.Gold,
                angle,
                Math.pow(Math.random(), 0.45) * 2.4,
                300 + Math.random() * 200,
            );
        });
    }
}
