// FILE-PATH: src/components/Component.ts

// components/Component.ts

export abstract class Component {
    protected readonly element: HTMLElement;

    protected constructor(element: HTMLElement) {
        this.element = element;
    }

    abstract mount(): void;

    abstract render(): void;

    destroy(): void {
        // Override when a component owns event listeners or other resources.
    }
}
