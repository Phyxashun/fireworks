// FILE-PATH: src/constants/colors.ts

export const COLOR_BLACK = '#000';

// Validate format using a regex pattern
const HEX_REGEX = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\$/;

interface ColorPalette {
    readonly Red: '#FF2400'; // Strontium / Lithium salts
    readonly Orange: '#FFA500'; // Calcium salts
    readonly Gold: '#FFD700'; // Charcoal / Iron / Lampblack
    readonly Yellow: '#FEE12B'; // Sodium salts
    readonly Green: '#39FF14'; // Barium salts
    readonly Jade: '#00A86B'; // Barium / Copper mix variant
    readonly Blue: '#1E7FFF'; // Copper compounds (hardest to produce)
    readonly Indigo: '#4B0082'; // Specialized Copper combinations
    readonly Purple: '#8A2BE2'; // Strontium + Copper mix
    readonly Silver: '#C0C0C0'; // Aluminum / Titanium / Magnesium flakes
    readonly White: '#FFFFFF'; // Magnesium / Aluminum burn

    // Advanced Pyrotechnic Colors
    readonly Pink: '#FF1493'; // Strontium + Potassium perchlorate mix
    readonly Aqua: '#00FFFF'; // Copper + Barium mix
    readonly Violet: '#9400D3'; // High-temperature Potassium / Copper variant
    readonly Bronze: '#B87333'; // Modified Calcium / Iron composition
    readonly Charcoal: '#8B5A2B'; // Slow-burning Carbon particles (Willow trail)
}

interface BurstColorPalette {
    // Spark Lifecycle Stages
    readonly Burst: 'rgba(255, 255, 255, 1)'; // FlashWhite
    readonly Glow: 'rgba(255, 160, 20, 0.2)'; // GlowOrange
    readonly Trail: 'rgba(255, 140, 20, 0.11)'; // FadeAmber
    readonly Exhaust: 'rgba(255, 120, 20, 0)'; // DissipateRust
}

const COLOR: ColorPalette = {
    Red: '#FF2400', // Strontium / Lithium salts
    Orange: '#FFA500', // Calcium salts
    Gold: '#FFD700', // Charcoal / Iron / Lampblack
    Yellow: '#FEE12B', // Sodium salts
    Green: '#39FF14', // Barium salts
    Jade: '#00A86B', // Barium / Copper mix variant
    Blue: '#1E7FFF', // Copper compounds (hardest to produce)
    Indigo: '#4B0082', // Specialized Copper combinations
    Purple: '#8A2BE2', // Strontium + Copper mix
    Silver: '#C0C0C0', // Aluminum / Titanium / Magnesium flakes
    White: '#FFFFFF', // Magnesium / Aluminum burn

    // Advanced Pyrotechnic Colors
    Pink: '#FF1493', // Strontium + Potassium perchlorate mix
    Aqua: '#00FFFF', // Copper + Barium mix
    Violet: '#9400D3', // High-temperature Potassium / Copper variant
    Bronze: '#B87333', // Modified Calcium / Iron composition
    Charcoal: '#8B5A2B', // Slow-burning Carbon particles (Willow trail)
} as const;

const BURSTCOLOR: BurstColorPalette = {
    // Spark Lifecycle Stages
    Burst: 'rgba(255, 255, 255, 1)', // FlashWhite
    Glow: 'rgba(255, 160, 20, 0.2)', // GlowOrange
    Trail: 'rgba(255, 140, 20, 0.11)', // FadeAmber
    Exhaust: 'rgba(255, 120, 20, 0)', // DissipateRust
} as const;

// Automatically extract the type safely from the object structure
export type ColorName = keyof ColorPalette;

export type RandomColor = '_RANDOM_';
export const RANDOM: RandomColor = '_RANDOM_';

// Special invisible color (not rendered, and therefore not in COLOR map)
export type InvisibleColor = '_INVISIBLE_';
export const INVISIBLE: InvisibleColor = '_INVISIBLE_';

export type VisibleColor = ColorPalette[ColorName];

export type ParticleColor = VisibleColor | InvisibleColor;

export type ColorPair = [VisibleColor, VisibleColor];

export type ShellColor = RandomColor | ParticleColor | ColorPair;

// Helper type to generate a union of numbers from 0 to N-1
export type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;

// Type that limits numbers between a Min and Max (inclusive)
export type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

// 0 to 255 range (using 256 since the upper bound is exclusive in Enumerate)
export type Byte = IntRange<0, 256>;

export type RGBComponents = 'r' | 'g' | 'b';

// Object structure type requiring absolute compile-time Bytes
export type IRGBColor = { [K in RGBComponents]: Byte };

/**
 * RGBColor class
 *
 * @param { Byte }
 */
export class RGBColor implements Record<RGBComponents, number> {
    // Internally tracked strictly as Byte for data integrity
    private _r!: Byte;
    private _g!: Byte;
    private _b!: Byte;

    // Public property to control case of hex string
    public uppercase: boolean = true;

    constructor(r?: number, g?: number, b?: number);
    constructor(hexString?: string);
    constructor(rOrHex?: number | string, g?: number, b?: number) {
        if (typeof rOrHex === 'string') {
            // Direct assignment to the hex setter
            this.hex = rOrHex;
        } else {
            // Fallback to numeric logic using the nullish coalescing operator
            this._r = this.validate(rOrHex ?? 0);
            this._g = this.validate(g ?? 0);
            this._b = this.validate(b ?? 0);
        }
    }

    // Getters and setters accept generic numbers to allow open assignment
    get r(): number {
        return this._r;
    }
    set r(value: number) {
        this._r = this.validate(value);
    }

    get g(): number {
        return this._g;
    }
    set g(value: number) {
        this._g = this.validate(value);
    }

    get b(): number {
        return this._b;
    }
    set b(value: number) {
        this._b = this.validate(value);
    }

    // Validates the value at runtime and safely casts it to Byte for internal storage
    private validate(value: number): Byte {
        // Force decimals to integers (e.g., 12.5 -> 13)
        const integerValue: number = Math.round(value);

        // Clamp the integer securely between 0 and 255
        const clampedValue: number = Math.max(0, Math.min(255, integerValue));

        // Return safely cast as your strict internal Byte type
        return clampedValue as Byte;
    }

    /**
     * Converts the RGB color to a hexadecimal string.
     */
    public get hex(): string {
        const hex: string = [this._r, this._g, this._b]
            .map((component: Byte): string => component.toString(16).padStart(2, '0'))
            .join('');

        return `#${this.uppercase ? hex.toUpperCase() : hex}`;
    }

    /**
     * Parses a hex string and updates the r, g, and b components.
     * Supports both 3-digit (#F80) and 6-digit (#FF8000) formats, with or without '#'.
     *
     * @param { string } hex - The hex string to convert to RGB
     * @todo Add support for 8-digit formats
     */
    public set hex(hex: string) {
        // Clean the string by removing the leading '#' if present
        const cleanHex: string = hex.trim().replace(/^#/, '');

        // Validate format using a regex pattern
        if (!HEX_REGEX.test(cleanHex)) {
            throw new Error(`Invalid hex color string: "${hex}". Must be a 3 or 6 digit hex format.`);
        }

        let rStr: string;
        let gStr: string;
        let bStr: string;

        // Extract components based on length
        switch (cleanHex.length) {
            case 3:
                // Shorthand format: expand "F80" into "FF", "88", "00"
                rStr = cleanHex[0] + cleanHex[0];
                gStr = cleanHex[1] + cleanHex[1];
                bStr = cleanHex[2] + cleanHex[2];
                break;
            // @ts-expect-error - intentional fallthrough
            case 8:
                // Future RGBA Expansion
                console.warn(`RGBA not implemented yet, truncating hex string to ${cleanHex.substring(0, 6)}`);
            default:
                // case 6:
                // Full format: "FF8000" -> "FF", "80", "00"
                rStr = cleanHex.substring(0, 2);
                gStr = cleanHex.substring(2, 4);
                bStr = cleanHex.substring(4, 6);
        }

        // Parse strings into integers (Base 16) and route through setters for validation
        this.r = parseInt(rStr, 16);
        this.g = parseInt(gStr, 16);
        this.b = parseInt(bStr, 16);
    }
}

export type ColorTuple = Record<ColorCode, RGBColor>;

// Constant derivations
const COLOR_NAMES: readonly ColorName[] = [
    'Red',
    'Orange',
    'Gold',
    'Yellow',
    'Green',
    'Jade',
    'Blue',
    'Indigo',
    'Purple',
    'Silver',
    'White',
    'Pink',
    'Aqua',
    'Violet',
    'Bronze',
    'Charcoal',
];

const VISIBLE_COLORS: readonly VisibleColor[] = [
    COLOR.Red, // Strontium / Lithium salts
    COLOR.Orange, // Calcium salts
    COLOR.Gold, // Charcoal / Iron / Lampblack
    COLOR.Yellow, // Sodium salts
    COLOR.Green, // Barium salts
    COLOR.Jade, // Barium / Copper mix variant
    COLOR.Blue, // Copper compounds (hardest to produce)
    COLOR.Indigo, // Specialized Copper combinations
    COLOR.Purple, // Strontium + Copper mix
    COLOR.Silver, // Aluminum / Titanium / Magnesium flakes
    COLOR.White, // Magnesium / Aluminum burn

    // Advanced Pyrotechnic Colors
    COLOR.Pink, // Strontium + Potassium perchlorate mix
    COLOR.Aqua, // Copper + Barium mix
    COLOR.Violet, // High-temperature Potassium / Copper variant
    COLOR.Bronze, // Modified Calcium / Iron composition
    COLOR.Charcoal, // Slow-burning Carbon particles (Willow trail)
];

const PARTICLE_COLORS: readonly ParticleColor[] = [...VISIBLE_COLORS, INVISIBLE];

/**
 * Transitional aliases.
 * Remove after every consumer uses VISIBLE_COLORS and PARTICLE_COLORS.
 */
const COLOR_CODES: readonly VisibleColor[] = VISIBLE_COLORS;

// Invisible stars need an identifier, even through they won't be rendered - physics still apply.
const COLOR_CODES_W_INVIS: readonly ParticleColor[] = PARTICLE_COLORS;

export type ColorCode = ParticleColor;

// Map of color codes to their index in the array. Useful for quickly determining
// if a color has already been updated in a loop.
const COLOR_CODE_INDEXES: Record<string, number> = COLOR_CODES_W_INVIS.reduce<Record<string, number>>(
    (obj: Record<string, number>, code: string, i: number): Record<string, number> => {
        obj[code] = i;
        return obj;
    },
    {},
);

// Tuples is a map keys by color codes (hex) with values of { r, g, b } tuples (still just objects).
const COLOR_TUPLES: ColorTuple = COLOR_CODES.reduce<ColorTuple>((obj: ColorTuple, hex: string): ColorTuple => {
    obj[hex] = {
        r: parseInt(hex.substring(1, 3), 16) as Byte,
        g: parseInt(hex.substring(3, 5), 16) as Byte,
        b: parseInt(hex.substring(5, 7), 16) as Byte,
    };
    return obj;
}, {} as ColorTuple);

// Typeguard
function isVisibleColor(color: ParticleColor): color is VisibleColor {
    return color !== INVISIBLE;
}

function isRandomColor(color: ShellColor): color is VisibleColor {
    return color !== RANDOM;
}

export {
    COLOR,
    BURSTCOLOR,
    COLOR_NAMES,
    COLOR_CODES,
    COLOR_CODES_W_INVIS,
    COLOR_CODE_INDEXES,
    COLOR_TUPLES,
    VISIBLE_COLORS,
    PARTICLE_COLORS,
    isVisibleColor,
    isRandomColor,
};
