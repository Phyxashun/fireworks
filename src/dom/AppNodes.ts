// FILE-PATH: src/dom/AppNodes.ts

export type HelpNodeKey =
    | 'shellTypeLabel'
    | 'shellSizeLabel'
    | 'qualityLabel'
    | 'skyLightingLabel'
    | 'scaleFactorLabel'
    | 'autoLaunchLabel'
    | 'finaleModeLabel'
    | 'hideControlsLabel'
    | 'fullscreenLabel'
    | 'longExposureLabel';

interface AppNodeSelectors {
    readonly stageContainer: string;
    readonly canvasContainer: string;
    readonly trailsCanvas: string;
    readonly mainCanvas: string;

    readonly controls: string;
    readonly menu: string;
    readonly menuInnerWrap: string;

    readonly settingsBtn: string;
    readonly closeMenuBtn: string;

    readonly pauseBtn: string;
    readonly pauseBtnSVG: string;

    readonly soundBtn: string;
    readonly soundBtnSVG: string;

    readonly shellType: string;
    readonly shellTypeLabel: string;

    readonly shellSize: string;
    readonly shellSizeLabel: string;

    readonly quality: string;
    readonly qualityLabel: string;

    readonly skyLighting: string;
    readonly skyLightingLabel: string;

    readonly scaleFactor: string;
    readonly scaleFactorLabel: string;

    readonly autoLaunch: string;
    readonly autoLaunchLabel: string;

    readonly finaleModeFormOption: string;
    readonly finaleMode: string;
    readonly finaleModeLabel: string;

    readonly hideControls: string;
    readonly hideControlsLabel: string;

    readonly fullscreenFormOption: string;
    readonly fullscreen: string;
    readonly fullscreenLabel: string;

    readonly longExposure: string;
    readonly longExposureLabel: string;

    readonly helpModal: string;
    readonly helpModalOverlay: string;
    readonly helpModalHeader: string;
    readonly helpModalBody: string;
    readonly helpModalCloseBtn: string;
}

const APP_NODE_SELECTORS: Readonly<AppNodeSelectors> = {
    stageContainer: '.stage-container',
    canvasContainer: '.canvas-container',
    trailsCanvas: '#trails-canvas',
    mainCanvas: '#main-canvas',

    controls: '.controls',
    menu: '.menu',
    menuInnerWrap: '.menu__inner-wrap',

    settingsBtn: '.settings-btn',
    closeMenuBtn: '.close-menu-btn',

    pauseBtn: '.pause-btn',
    pauseBtnSVG: '.pause-btn use',

    soundBtn: '.sound-btn',
    soundBtnSVG: '.sound-btn use',

    shellType: '.shell-type',
    shellTypeLabel: '.shell-type-label',

    shellSize: '.shell-size',
    shellSizeLabel: '.shell-size-label',

    quality: '.quality-ui',
    qualityLabel: '.quality-ui-label',

    skyLighting: '.sky-lighting',
    skyLightingLabel: '.sky-lighting-label',

    scaleFactor: '.scaleFactor',
    scaleFactorLabel: '.scaleFactor-label',

    autoLaunch: '.auto-launch',
    autoLaunchLabel: '.auto-launch-label',

    finaleModeFormOption: '.form-option--finale-mode',
    finaleMode: '.finale-mode',
    finaleModeLabel: '.finale-mode-label',

    hideControls: '.hide-controls',
    hideControlsLabel: '.hide-controls-label',

    fullscreenFormOption: '.form-option--fullscreen',
    fullscreen: '.fullscreen',
    fullscreenLabel: '.fullscreen-label',

    longExposure: '.long-exposure',
    longExposureLabel: '.long-exposure-label',

    helpModal: '.help-modal',
    helpModalOverlay: '.help-modal__overlay',
    helpModalHeader: '.help-modal__header',
    helpModalBody: '.help-modal__body',
    helpModalCloseBtn: '.help-modal__close-btn',
};

export class AppNodes {
    public readonly stageContainer: HTMLElement;
    public readonly canvasContainer: HTMLElement;
    public readonly trailsCanvas: HTMLCanvasElement;
    public readonly mainCanvas: HTMLCanvasElement;

    public readonly controls: HTMLElement;
    public readonly menu: HTMLElement;
    public readonly menuInnerWrap: HTMLElement;

    public readonly settingsBtn: HTMLElement;
    public readonly closeMenuBtn: HTMLElement;

    public readonly pauseBtn: HTMLElement;
    public readonly pauseBtnSVG: SVGUseElement;

    public readonly soundBtn: HTMLElement;
    public readonly soundBtnSVG: SVGUseElement;

    public readonly shellType: HTMLSelectElement;
    public readonly shellTypeLabel: HTMLLabelElement;

    public readonly shellSize: HTMLSelectElement;
    public readonly shellSizeLabel: HTMLLabelElement;

    public readonly quality: HTMLSelectElement;
    public readonly qualityLabel: HTMLLabelElement;

    public readonly skyLighting: HTMLSelectElement;
    public readonly skyLightingLabel: HTMLLabelElement;

    public readonly scaleFactor: HTMLSelectElement;
    public readonly scaleFactorLabel: HTMLLabelElement;

    public readonly autoLaunch: HTMLInputElement;
    public readonly autoLaunchLabel: HTMLLabelElement;

    public readonly finaleModeFormOption: HTMLElement;
    public readonly finaleMode: HTMLInputElement;
    public readonly finaleModeLabel: HTMLLabelElement;

    public readonly hideControls: HTMLInputElement;
    public readonly hideControlsLabel: HTMLLabelElement;

    public readonly fullscreenFormOption: HTMLElement;
    public readonly fullscreen: HTMLInputElement;
    public readonly fullscreenLabel: HTMLLabelElement;

    public readonly longExposure: HTMLInputElement;
    public readonly longExposureLabel: HTMLLabelElement;

    public readonly helpModal: HTMLElement;
    public readonly helpModalOverlay: HTMLElement;
    public readonly helpModalHeader: HTMLElement;
    public readonly helpModalBody: HTMLElement;
    public readonly helpModalCloseBtn: HTMLButtonElement;

    public constructor(documentRef: Document = document) {
        this.stageContainer = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.stageContainer);

        this.canvasContainer = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.canvasContainer);

        this.trailsCanvas = this.getRequiredElement<HTMLCanvasElement>(documentRef, APP_NODE_SELECTORS.trailsCanvas);

        this.mainCanvas = this.getRequiredElement<HTMLCanvasElement>(documentRef, APP_NODE_SELECTORS.mainCanvas);

        this.controls = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.controls);

        this.menu = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.menu);

        this.menuInnerWrap = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.menuInnerWrap);

        this.settingsBtn = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.settingsBtn);

        this.closeMenuBtn = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.closeMenuBtn);

        this.pauseBtn = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.pauseBtn);

        this.pauseBtnSVG = this.getRequiredElement<SVGUseElement>(documentRef, APP_NODE_SELECTORS.pauseBtnSVG);

        this.soundBtn = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.soundBtn);

        this.soundBtnSVG = this.getRequiredElement<SVGUseElement>(documentRef, APP_NODE_SELECTORS.soundBtnSVG);

        this.shellType = this.getRequiredElement<HTMLSelectElement>(documentRef, APP_NODE_SELECTORS.shellType);

        this.shellTypeLabel = this.getRequiredElement<HTMLLabelElement>(documentRef, APP_NODE_SELECTORS.shellTypeLabel);

        this.shellSize = this.getRequiredElement<HTMLSelectElement>(documentRef, APP_NODE_SELECTORS.shellSize);

        this.shellSizeLabel = this.getRequiredElement<HTMLLabelElement>(documentRef, APP_NODE_SELECTORS.shellSizeLabel);

        this.quality = this.getRequiredElement<HTMLSelectElement>(documentRef, APP_NODE_SELECTORS.quality);

        this.qualityLabel = this.getRequiredElement<HTMLLabelElement>(documentRef, APP_NODE_SELECTORS.qualityLabel);

        this.skyLighting = this.getRequiredElement<HTMLSelectElement>(documentRef, APP_NODE_SELECTORS.skyLighting);

        this.skyLightingLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.skyLightingLabel,
        );

        this.scaleFactor = this.getRequiredElement<HTMLSelectElement>(documentRef, APP_NODE_SELECTORS.scaleFactor);

        this.scaleFactorLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.scaleFactorLabel,
        );

        this.autoLaunch = this.getRequiredElement<HTMLInputElement>(documentRef, APP_NODE_SELECTORS.autoLaunch);

        this.autoLaunchLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.autoLaunchLabel,
        );

        this.finaleModeFormOption = this.getRequiredElement<HTMLElement>(
            documentRef,
            APP_NODE_SELECTORS.finaleModeFormOption,
        );

        this.finaleMode = this.getRequiredElement<HTMLInputElement>(documentRef, APP_NODE_SELECTORS.finaleMode);

        this.finaleModeLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.finaleModeLabel,
        );

        this.hideControls = this.getRequiredElement<HTMLInputElement>(documentRef, APP_NODE_SELECTORS.hideControls);

        this.hideControlsLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.hideControlsLabel,
        );

        this.fullscreenFormOption = this.getRequiredElement<HTMLElement>(
            documentRef,
            APP_NODE_SELECTORS.fullscreenFormOption,
        );

        this.fullscreen = this.getRequiredElement<HTMLInputElement>(documentRef, APP_NODE_SELECTORS.fullscreen);

        this.fullscreenLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.fullscreenLabel,
        );

        this.longExposure = this.getRequiredElement<HTMLInputElement>(documentRef, APP_NODE_SELECTORS.longExposure);

        this.longExposureLabel = this.getRequiredElement<HTMLLabelElement>(
            documentRef,
            APP_NODE_SELECTORS.longExposureLabel,
        );

        this.helpModal = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.helpModal);

        this.helpModalOverlay = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.helpModalOverlay);

        this.helpModalHeader = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.helpModalHeader);

        this.helpModalBody = this.getRequiredElement<HTMLElement>(documentRef, APP_NODE_SELECTORS.helpModalBody);

        this.helpModalCloseBtn = this.getRequiredElement<HTMLButtonElement>(
            documentRef,
            APP_NODE_SELECTORS.helpModalCloseBtn,
        );
    }

    public getHelpNode(key: HelpNodeKey): HTMLLabelElement {
        return this[key];
    }

    private getRequiredElement<TElement extends Element>(documentRef: Document, selector: string): TElement {
        const element: TElement | null = documentRef.querySelector<TElement>(selector);

        if (element === null) {
            throw new Error(`Required DOM element was not found: ${selector}`);
        }

        return element;
    }
}
