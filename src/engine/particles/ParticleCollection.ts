// FILE-PATH: src/engine/particles/ParticleCollection.ts

import type { ParticleColor } from '../../constants/colors';

export type ParticleCollection<TParticle> = Record<ParticleColor, TParticle[]>;

export function createParticleCollection<TParticle>(colors: readonly ParticleColor[]): ParticleCollection<TParticle> {
    const collection: ParticleCollection<TParticle> = {} as ParticleCollection<TParticle>;

    for (const color of colors) {
        collection[color] = [];
    }

    return collection;
}
