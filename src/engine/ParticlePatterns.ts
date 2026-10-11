// FILE-PATH: src/engine/ParticlePatterns.ts

// src/engine/ParticlePatterns.ts

export type ArcParticleFactory = (angle: number) => void;

export type BurstParticleFactory = (angle: number, speedMultiplier: number) => void;

export class ParticlePatterns {
    public static createArc(
        start: number,
        arcLength: number,
        count: number,
        randomness: number,
        particleFactory: ArcParticleFactory,
    ): void {
        const angleDelta: number = arcLength / count;

        const end: number = start + arcLength - angleDelta * 0.5;

        if (end > start) {
            for (let angle: number = start; angle < end; angle = angle + angleDelta) {
                particleFactory(angle + Math.random() * angleDelta * randomness);
            }

            return;
        }

        for (let angle: number = start; angle > end; angle = angle + angleDelta) {
            particleFactory(angle + Math.random() * angleDelta * randomness);
        }
    }

    public static createBurst(
        count: number,
        particleFactory: BurstParticleFactory,
        startAngle: number = 0,
        arcLength: number = Math.PI * 2,
    ): void {
        const radius: number = 0.5 * Math.sqrt(count / Math.PI);

        const circumference: number = 2 * radius * Math.PI;

        const halfCircumference: number = circumference / 2;

        for (let index: number = 0; index <= halfCircumference; index++) {
            const ringAngle: number = (index / halfCircumference) * Math.PI * 0.5;

            const ringSize: number = Math.cos(ringAngle);

            const partsPerFullRing: number = circumference * ringSize;

            const partsPerArc: number = partsPerFullRing * (arcLength / (Math.PI * 2));

            const angleIncrement: number = (Math.PI * 2) / partsPerFullRing;

            const angleOffset: number = Math.random() * angleIncrement + startAngle;

            const maxRandomAngleOffset: number = angleIncrement * 0.33;

            for (let partIndex: number = 0; partIndex < partsPerArc; partIndex++) {
                const randomAngleOffset: number = Math.random() * maxRandomAngleOffset;

                const angle: number = angleIncrement * partIndex + angleOffset + randomAngleOffset;

                particleFactory(angle, ringSize);
            }
        }
    }
}
