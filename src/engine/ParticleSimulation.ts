// FILE-PATH: src/engine/ParticleSimulation.ts

import { type ParticleColor, INVISIBLE } from '../constants/colors';
import type { SparkManager, SparkParticle } from './particles/Spark';
import type { StarManager, StarParticle } from './particles/Star';

export interface ParticleSimulationOptions {
    readonly stars: StarManager;
    readonly sparks: SparkManager;

    readonly particleColors: readonly ParticleColor[];

    readonly gravity: number;

    isLowQuality(): boolean;
}

export class ParticleSimulation {
    private readonly options: ParticleSimulationOptions;

    private currentFrame: number = 0;

    public constructor(options: ParticleSimulationOptions) {
        this.options = options;
    }

    public update(timeStep: number, speed: number): void {
        this.currentFrame++;

        const starDrag: number = 1 - (1 - this.options.stars.airDrag) * speed;
        const starDragHeavy: number = 1 - (1 - this.options.stars.airDragHeavy) * speed;
        const sparkDrag: number = 1 - (1 - this.options.sparks.airDrag) * speed;
        const gAcc: number = (timeStep / 1000) * this.options.gravity;

        this.options.particleColors.forEach((color: string): void => {
            // Stars
            const stars: StarParticle[] = this.options.stars.active[color];

            for (let i: number = stars.length - 1; i >= 0; i = i - 1) {
                const star: StarParticle = stars[i];

                // Only update each star once per frame. Since color can change, it's possible
                // a star could update twice without this, leading to a "jump".
                if (star.updateFrame === this.currentFrame) continue;

                star.updateFrame = this.currentFrame;

                star.life -= timeStep;

                if (star.life <= 0) {
                    stars.splice(i, 1);

                    this.options.stars.returnInstance(star);
                } else {
                    const burnRate: number = Math.pow(star.life / star.fullLife, 0.5);
                    const burnRateInverse: number = 1 - burnRate;

                    star.prevX = star.x;
                    star.prevY = star.y;

                    star.x += star.speedX * speed;
                    star.y += star.speedY * speed;

                    // Apply air drag if star isn't "heavy". The heavy property is used for the
                    // shell comets.
                    if (!star.heavy) {
                        star.speedX *= starDrag;
                        star.speedY *= starDrag;
                    } else {
                        star.speedX *= starDragHeavy;
                        star.speedY *= starDragHeavy;
                    }
                    star.speedY += gAcc;

                    if (star.spinRadius) {
                        star.spinAngle += star.spinSpeed * speed;
                        star.x += Math.sin(star.spinAngle) * star.spinRadius * speed;
                        star.y += Math.cos(star.spinAngle) * star.spinRadius * speed;
                    }

                    if (star.sparkFreq) {
                        star.sparkTimer -= timeStep;
                        while (star.sparkTimer < 0) {
                            star.sparkTimer += star.sparkFreq * 0.75 + star.sparkFreq * burnRateInverse * 4;
                            this.options.sparks.add(
                                star.x,
                                star.y,
                                star.sparkColor,
                                Math.random() * (Math.PI * 2),
                                Math.random() * star.sparkSpeed * burnRate,
                                star.sparkLife * 0.8 + Math.random() * star.sparkLifeVariation * star.sparkLife,
                            );
                        }
                    }

                    // Handle star transitions
                    if (star.life < star.transitionTime) {
                        if (star.secondColor && !star.colorChanged) {
                            star.colorChanged = true;
                            star.color = star.secondColor;
                            stars.splice(i, 1);

                            this.options.stars.active[star.secondColor].push(star);

                            if (star.secondColor === INVISIBLE) {
                                star.sparkFreq = 0;
                            }
                        }

                        if (star.strobe) {
                            // Strobes in the following pattern: on:off:off:on:off:off in increments
                            // of `strobeFreq` ms.
                            star.visible = Math.floor(star.life / star.strobeFreq) % 3 === 0;
                        }
                    }
                }
            }

            // Sparks
            const sparks: SparkParticle[] = this.options.sparks.active[color];

            for (let i: number = sparks.length - 1; i >= 0; i = i - 1) {
                const spark: SparkParticle = sparks[i];
                spark.life -= timeStep;

                if (spark.life <= 0) {
                    sparks.splice(i, 1);

                    this.options.sparks.returnInstance(spark);
                } else {
                    spark.prevX = spark.x;
                    spark.prevY = spark.y;
                    spark.x += spark.speedX * speed;
                    spark.y += spark.speedY * speed;
                    spark.speedX *= sparkDrag;
                    spark.speedY *= sparkDrag;
                    spark.speedY += gAcc;
                }
            }
        });
    }
}
