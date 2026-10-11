// FILE-PATH: src/engine/ColorPicker.ts

import { COLOR, VISIBLE_COLORS, type VisibleColor } from '../constants/colors';

interface RandomColorOptions {
    notSame?: boolean;
    notColor?: VisibleColor;
    limitWhite?: boolean;
}

class ColorPicker {
    private lastColor: VisibleColor | undefined;

    // Get a random color, with some customization options available.
    public random(options: RandomColorOptions = {}): VisibleColor {
        let notSame: boolean = options.notSame ?? false;
        let notColor: VisibleColor | undefined = options.notColor;
        let limitWhite: boolean = options.limitWhite ?? false;

        let color: VisibleColor = this.randomSimple();

        // limit the amount of white chosen randomly
        if (limitWhite && color === COLOR.White && Math.random() < 0.6) {
            color = this.randomSimple();
        }

        if (notSame) {
            while (color === this.lastColor) {
                color = this.randomSimple();
            }
        } else if (notColor) {
            while (color === notColor) {
                color = this.randomSimple();
            }
        }

        this.lastColor = color;
        return color;
    }

    // Get a random color.
    private randomSimple(): VisibleColor {
        const index: number = Math.floor(Math.random() * VISIBLE_COLORS.length);
        return VISIBLE_COLORS[index]!;
    }

    public whiteOrGold(): VisibleColor {
        return Math.random() < 0.5 ? COLOR.Gold : COLOR.White;
    }

    public makePistilColor(shellColor: VisibleColor): VisibleColor {
        return shellColor === COLOR.White || shellColor === COLOR.Gold
            ? this.random({ notColor: shellColor })
            : this.whiteOrGold();
    }
}

export { type RandomColorOptions, ColorPicker };
