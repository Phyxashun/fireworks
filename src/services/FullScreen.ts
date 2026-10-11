// FILE-PATH: src/services/FullScreen.ts

// oxlint-disable typescript/no-explicit-any

type EventHandler = (this: FScreen, ev: Event) => any;
type EventHandlerOptions = AddEventListenerOptions | boolean | undefined;
type FullscreenEvent = 'fullscreenchange' | 'fullscreenerror' | '';

interface FScreen {
    requestFullscreen: (element: Element) => Promise<void> | void;
    requestFullscreenFunction: (element: Element) => Promise<void> | void;
    readonly exitFullscreen: () => Promise<void> | void;
    addEventListener: (type: FullscreenEvent, handler: EventHandler, options?: EventHandlerOptions) => void;
    removeEventListener: (type: FullscreenEvent, handler: EventHandler) => void;
    fullscreenEnabled: boolean;
    fullscreenElement: Element | null;
    onfullscreenchange: EventHandler | null;
    onfullscreenerror: EventHandler | null;
}

const KeyNames = [
    'fullscreenEnabled',
    'fullscreenElement',
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenchange',
    'fullscreenerror',
] as const;

type KeyName = typeof KeyNames;
type Keys = keyof typeof KeyNames;

type KeyRegistry = {
    [I in Keys as KeyName[I] extends string ? KeyName[I] : never]: I extends `${infer N extends number}` ? N : never;
};

const key: KeyRegistry = {
    fullscreenEnabled: 0,
    fullscreenElement: 1,
    requestFullscreen: 2,
    exitFullscreen: 3,
    fullscreenchange: 4,
    fullscreenerror: 5,
} as const;

const webkit: string[] = [
    'webkitFullscreenEnabled',
    'webkitFullscreenElement',
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
] as const;

const moz: string[] = [
    'mozFullScreenEnabled',
    'mozFullScreenElement',
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozfullscreenchange',
    'mozfullscreenerror',
] as const;

const ms: string[] = [
    'msFullscreenEnabled',
    'msFullscreenElement',
    'msRequestFullscreen',
    'msExitFullscreen',
    'MSFullscreenChange',
    'MSFullscreenError',
] as const;

const doc: any = typeof window?.document !== 'undefined' ? window.document : ({} as const);

const vendor: string[] =
    ('fullscreenEnabled' in doc && Object.keys(key)) ||
    (webkit[0] in doc && webkit) ||
    (moz[0] in doc && moz) ||
    (ms[0] in doc && ms) ||
    ([] as const);

const FSCREEN = {
    requestFullscreen: (element: Element): Promise<void> | void => {
        const method: string = vendor[key.requestFullscreen];
        return (element as any)[method]?.();
    },
    requestFullscreenFunction: (element: Element): Promise<void> | void => {
        return (element as any)[vendor[key.requestFullscreen]];
    },
    addEventListener: (type: string, handler: EventHandler, options?: EventHandlerOptions): void => {
        return doc.addEventListener?.(vendor[key[type]], handler, options);
    },
    removeEventListener: (type: string, handler: EventHandler): void => {
        return doc.removeEventListener?.(vendor[key[type]], handler);
    },
    get exitFullscreen(): () => Promise<void> | void {
        const method: string = vendor[key.exitFullscreen];
        return doc[method] ? doc[method].bind(doc) : (): void => {};
    },
    get fullscreenEnabled(): boolean {
        return Boolean(doc[vendor[key.fullscreenEnabled]]);
    },
    set fullscreenEnabled(_val: boolean) {},
    get fullscreenElement(): Element | null {
        return doc[vendor[key.fullscreenElement]] ?? null;
    },
    set fullscreenElement(_val: Element | null) {},
    get onfullscreenchange(): EventHandler | null {
        const vendorKey: string = vendor[key.fullscreenchange];
        return vendorKey ? doc[('on' + vendorKey).toLowerCase()] : null;
    },
    set onfullscreenchange(handler: EventHandler | null) {
        const vendorKey: string = vendor[key.fullscreenchange];
        if (vendorKey) doc[('on' + vendorKey).toLowerCase()] = handler;
    },
    get onfullscreenerror(): EventHandler | null {
        const vendorKey: string = vendor[key.fullscreenerror];
        return vendorKey ? doc[('on' + vendorKey).toLowerCase()] : null;
    },
    set onfullscreenerror(handler: EventHandler | null) {
        const vendorKey: string = vendor[key.fullscreenerror];
        if (vendorKey) doc[('on' + vendorKey).toLowerCase()] = handler;
    },
} as const;

export type FullScreen = typeof FSCREEN;

export interface FullscreenControllerOptions {
    readonly target: Element;

    onChange(isFullscreen: boolean): void;
}

export class FullscreenController {
    readonly fullscreen: FullScreen;
    private readonly options: FullscreenControllerOptions;

    public constructor(options: FullscreenControllerOptions) {
        this.options = options;
        this.fullscreen = FSCREEN;
    }

    // Fullscreen helpers, using Fscreen for prefixes.
    public get isSupported(): boolean {
        return this.fullscreen.fullscreenEnabled;
    }

    // Note that fullscreen state is synced to store, and the store should be the source
    // of truth for whether the app is in fullscreen mode or not.
    public get isActive(): boolean {
        return this.fullscreen.fullscreenElement !== null;
    }

    public mount(): void {
        this.fullscreen.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }

    public destroy(): void {
        this.fullscreen.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    }

    // Attempt to toggle fullscreen mode.
    public async toggle(): Promise<void> {
        if (!this.isSupported) {
            return;
        }

        if (this.isActive) {
            await this.fullscreen.exitFullscreen();
            return;
        }

        await this.fullscreen.requestFullscreen(this.options.target);
    }

    // Sync fullscreen changes with store. An event listener is necessary because the user can
    // toggle fullscreen mode directly through the browser, and we want to react to that.
    private readonly handleFullscreenChange: () => void = (): void => {
        this.options.onChange(this.isActive);
    };
}
