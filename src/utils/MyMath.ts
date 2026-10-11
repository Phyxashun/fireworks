// FILE-PATH: src/utils/MyMath.ts

// oxlint-disable typescript/no-explicit-any
// OLD VERSION DO NOT USE
// Older pens still rely on this.

interface IVector {
    x: number;
    y: number;
}

/**
 * MyMath.ts
 * -----------
 * Handy math/trig reference.
 *
 * Migrator to Typescript: Dusty Dew
 *                         phyxashun@gmail.com
 *
 * Reference: MyMath.js by Caleb Miller
 *            caleb@caleb-miller.com
 */
export class MyMath {
    // degree/radian conversion constants
    public static readonly toDeg: number = 180 / Math.PI;
    public static readonly toRad: number = Math.PI / 180;
    public static readonly halfPI: number = Math.PI / 2;
    public static readonly twoPI: number = Math.PI * 2;

    // Pythagorean Theorem distance calculation
    public static dist(width: number, height: number): number {
        return Math.sqrt(width * width + height * height);
    }

    // Pythagorean Theorem point distance calculation
    public static pointDist(v1: IVector, v2: IVector): number;
    public static pointDist(x1: number, y1: number, x2: number, y2: number): number;
    public static pointDist(a: number | IVector, b: number | IVector, c?: number, d?: number): number {
        if (typeof a === 'object' && typeof b === 'object') {
            const distX: number = b.x - a.x;
            const distY: number = b.y - a.y;
            return Math.sqrt(distX * distX + distY * distY);
        }

        const distX: number = (c as number) - (a as number);
        const distY: number = (d as number) - (b as number);
        return Math.sqrt(distX * distX + distY * distY);
    }

    // Returns the angle (in radians) of a 2D vector
    public static angle(width: number, height: number): number {
        return MyMath.halfPI + Math.atan2(height, width);
    }

    // Returns the angle (in radians) between two points
    public static pointAngle(v1: IVector, v2: IVector): number;
    public static pointAngle(x1: number, y1: number, x2: number, y2: number): number;
    public static pointAngle(a: number | IVector, b: number | IVector, c?: number, d?: number): number {
        if (typeof a === 'object' && typeof b === 'object') {
            return MyMath.halfPI + Math.atan2(b.y - a.y, b.x - a.x);
        }

        return MyMath.halfPI + Math.atan2((d as number) - (b as number), (c as number) - (a as number));
    }

    // Splits a speed vector into x and y components (angle needs to be in radians)
    public static splitVector(speed: number, angle: number): IVector {
        return {
            x: Math.sin(angle) * speed,
            y: -Math.cos(angle) * speed,
        };
    }

    // Generate a random vector
    public static randomVector(min: number, max: number): IVector {
        return {
            x: this.random(min, max),
            y: this.random(min, max),
        };
    }

    // Generates a random float between min (inclusive) and max (exclusive).
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    // Generates a random integer between min (inclusive) and max (inclusive).
    public static randomInt(min: number, max: number): number {
        // Adjust bounds to ensure integers
        const ceilMin: number = Math.ceil(min);
        const floorMax: number = Math.floor(max);

        if (ceilMin > floorMax) {
            throw new RangeError('No integer exists between the specified min and max values');
        }

        return Math.floor(Math.random() * (floorMax - ceilMin + 1)) + ceilMin;
    }

    public static random(): number;
    public static random(number: number): number;
    public static random(min: number, max: number): number;
    public static random(min?: number, max?: number): number {
        // Handle no arguments
        if (min === undefined && max === undefined) {
            return Math.random();
        } else if (max === undefined) {
            // Handle the single argument case
            max = min ?? 0;
            min = 0;
        }

        // Validate that both are valid numbers and not NaN
        const validMin: number = MyMath.isValidNumber(min!);
        const validMax: number = MyMath.isValidNumber(max);

        // Determine if either parameter is a float
        const isMinFloat: boolean = validMin % 1 !== 0;
        const isMaxFloat: boolean = validMax % 1 !== 0;
        const standardFloat: boolean = isMinFloat || isMaxFloat;

        if (standardFloat) {
            // Returns a decimal between min (inclusive) and max (exclusive)
            return MyMath.randomFloat(validMin, validMax);
        } else {
            // Returns a whole number between min and max (inclusive)
            return MyMath.randomInt(validMin, validMax);
        }
    }

    // Returns a random element from an array, or simply the set of provided arguments when called
    public static randomChoice<T>(choices: T[]): T;
    public static randomChoice<T>(...args: T[]): T;
    public static randomChoice<T>(...args: any[]): T {
        if (args.length === 0) {
            throw new Error('randomChoice requires at least one choice or an array of choices.');
        }

        const choices: any[] = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;

        if (choices.length === 0) {
            throw new Error('randomChoice cannot select an element from an empty array.');
        }

        return choices[(Math.random() * choices.length) | 0];
    }

    // Clamps a number between min and max values
    public static clamp(num: number, min: number, max: number): number {
        return Math.min(Math.max(num, min), max);
    }

    // Validates if the input is a valid number. Falls back to 0 if invalid.
    private static isValidNumber(n: number): number {
        if (typeof n !== 'number' || Number.isNaN(n)) {
            console.warn(`random: n: ${String(n)}, must be a valid number, returning 0.`);
            return 0;
        }
        return n;
    }
}
