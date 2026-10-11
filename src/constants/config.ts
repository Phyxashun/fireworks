// FILE-PATH: src/constants/config.ts

// src/constants/config.ts

export const QUALITY = {
    LOW: '1',
    NORMAL: '2',
    HIGH: '3',
} as const;

export type QualityChoice = (typeof QUALITY)[keyof typeof QUALITY];

export type QualityLevel = 1 | 2 | 3;

export const QUALITY_CHOICES: readonly QualityChoice[] = [QUALITY.LOW, QUALITY.NORMAL, QUALITY.HIGH];

export function isQualityChoice(value: string): value is QualityChoice {
    return (QUALITY_CHOICES as readonly string[]).includes(value);
}

export function toQualityLevel(value: QualityChoice): QualityLevel {
    switch (value) {
        case QUALITY.LOW:
            return 1;

        case QUALITY.NORMAL:
            return 2;

        case QUALITY.HIGH:
            return 3;
    }
}

export const SKYLIGHT = {
    NONE: '0',
    DIM: '1',
    NORMAL: '2',
} as const;

export type SkylightChoice = (typeof SKYLIGHT)[keyof typeof SKYLIGHT];

export type SkylightLevel = 0 | 1 | 2;

export const SKYLIGHT_CHOICES: readonly SkylightChoice[] = [SKYLIGHT.NONE, SKYLIGHT.DIM, SKYLIGHT.NORMAL];

export function isSkylightChoice(value: string): value is SkylightChoice {
    return (SKYLIGHT_CHOICES as readonly string[]).includes(value);
}

export function toSkylightLevel(value: SkylightChoice): SkylightLevel {
    switch (value) {
        case SKYLIGHT.NONE:
            return 0;

        case SKYLIGHT.DIM:
            return 1;

        case SKYLIGHT.NORMAL:
            return 2;
    }
}
