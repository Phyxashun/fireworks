// FILE-PATH: src/components/SettingsMenu.ts

import { Component } from './Component';
import type { AppConfig, AppState, HelpTopicKey } from '../app/AppState';
import type { AppStore } from '../app/AppStore';
import type { AppNodes, HelpNodeKey } from '../dom/AppNodes';
import { isQualityChoice, isSkylightChoice, type QualityChoice, type SkylightChoice } from '../constants/config';

export type SettingsChangeConsoleOutput =
    | {
          readonly kind: 'select';
          readonly className: string;
          readonly value: string;
      }
    | {
          readonly kind: 'input';
          readonly className: string;
          readonly checked: boolean;
      };
export interface SelectOption {
    readonly label: string;
    readonly value: string | number;
}

export interface SettingsMenuOptions {
    readonly shellNameOptions: readonly SelectOption[];
    readonly shellSizeOptions: readonly SelectOption[];
    readonly qualityOptions: readonly SelectOption[];
    readonly skyLightingOptions: readonly SelectOption[];
    readonly scaleFactorOptions: readonly SelectOption[];
    readonly helpNodeToTopic: Readonly<Record<HelpNodeKey, HelpTopicKey>>;
    readonly fullscreenSupported: boolean;
}

export interface SettingsMenuActions {
    onClose(): void;
    onConfigChange(nextConfig: Partial<AppConfig>): void;
    onScaleFactorChange(): void;
    onToggleFullscreen(): void;
    onOpenHelp(topic: HelpTopicKey): void;
}

export class SettingsMenu extends Component {
    private readonly nodes: AppNodes;
    private readonly store: AppStore;
    private readonly options: SettingsMenuOptions;
    private readonly actions: SettingsMenuActions;
    private unsubscribe: (() => void) | undefined;

    private readonly blockedPointerEventTypes: readonly string[] = [
        'pointerdown',
        'pointerup',
        'pointermove',
        'mousedown',
        'mouseup',
        'mousemove',
        'touchstart',
        'touchend',
        'touchmove',
    ];

    private readonly helpHandlers: Map<HTMLLabelElement, (event: MouseEvent) => void> = new Map();

    private readonly handleCloseClick: (event: Event) => void = (_event: MouseEvent): void => {
        this.actions.onClose();
    };

    private readonly handleShellTypeChange: (event: Event) => void = (event: Event): void => {
        this.actions.onConfigChange({
            shell: this.nodes.shellType.value,
        });
        this.logConfigChange(event);
    };

    private readonly handleShellSizeChange: (event: Event) => void = (event: Event): void => {
        this.actions.onConfigChange({
            size: this.nodes.shellSize.value,
        });
        this.logConfigChange(event);
    };

    private readonly handleQualityChange: (event: Event) => void = (event: Event): void => {
        const qualityValue: string = this.nodes.quality.value;

        if (!isQualityChoice(qualityValue)) {
            throw new Error(`Invalid quality value: ${qualityValue}`);
        }

        const quality: QualityChoice = qualityValue;

        this.actions.onConfigChange({
            quality,
        });

        this.logConfigChange(event);
    };

    private readonly handleSkyLightingChange: (event: Event) => void = (event: Event): void => {
        const skyLightingValue: string = this.nodes.skyLighting.value;

        if (!isSkylightChoice(skyLightingValue)) {
            throw new Error(`Invalid sky-lighting value: ${skyLightingValue}`);
        }

        const skyLighting: SkylightChoice = skyLightingValue;

        this.actions.onConfigChange({
            skyLighting,
        });

        this.logConfigChange(event);
    };

    private readonly handleAutoLaunchChange: (event: Event) => void = (event: Event): void => {
        this.actions.onConfigChange({
            autoLaunch: this.nodes.autoLaunch.checked,
        });
        this.logConfigChange(event);
    };

    private readonly handleFinaleChange: (event: Event) => void = (event: Event): void => {
        this.actions.onConfigChange({
            finale: this.nodes.finaleMode.checked,
        });
        this.logConfigChange(event);
    };

    private readonly handleHideControlsChange: (event: Event) => void = (event: Event): void => {
        this.actions.onConfigChange({
            hideControls: this.nodes.hideControls.checked,
        });
        this.logConfigChange(event);
    };

    private readonly handleLongExposureChange: (event: Event) => void = (event: Event): void => {
        this.actions.onConfigChange({
            longExposure: this.nodes.longExposure.checked,
        });
        this.logConfigChange(event);
    };

    private readonly handleFullscreenChange: (event: Event) => void = (event: Event): void => {
        this.actions.onToggleFullscreen();
        this.logConfigChange(event);
    };

    private readonly handleScaleFactorChange: (event: Event) => void = (event: Event): void => {
        const scaleFactor: number = Number.parseFloat(this.nodes.scaleFactor.value);

        if (Number.isNaN(scaleFactor)) {
            throw new Error(`Invalid scale factor: ${this.nodes.scaleFactor.value}`);
        }

        this.actions.onConfigChange({
            scaleFactor,
        });

        this.actions.onScaleFactorChange();
        this.logConfigChange(event);
    };

    private readonly handlePointerEvent: (event: Event) => void = (event: Event): void => {
        event.stopPropagation();
    };

    public constructor(nodes: AppNodes, store: AppStore, options: SettingsMenuOptions, actions: SettingsMenuActions) {
        super(nodes.menu);

        this.nodes = nodes;
        this.store = store;
        this.options = options;
        this.actions = actions;
    }

    public mount(): void {
        this.populateSelect(this.nodes.shellType, this.options.shellNameOptions);

        this.populateSelect(this.nodes.shellSize, this.options.shellSizeOptions);

        this.populateSelect(this.nodes.quality, this.options.qualityOptions);

        this.populateSelect(this.nodes.skyLighting, this.options.skyLightingOptions);

        this.populateSelect(this.nodes.scaleFactor, this.options.scaleFactorOptions);

        if (!this.options.fullscreenSupported) {
            this.nodes.fullscreenFormOption.classList.add('remove');
        }

        this.nodes.closeMenuBtn.addEventListener('click', this.handleCloseClick);

        this.nodes.shellType.addEventListener('change', this.handleShellTypeChange);

        this.nodes.shellSize.addEventListener('change', this.handleShellSizeChange);

        this.nodes.quality.addEventListener('change', this.handleQualityChange);

        this.nodes.skyLighting.addEventListener('change', this.handleSkyLightingChange);

        this.nodes.autoLaunch.addEventListener('change', this.handleAutoLaunchChange);

        this.nodes.finaleMode.addEventListener('change', this.handleFinaleChange);

        this.nodes.hideControls.addEventListener('change', this.handleHideControlsChange);

        this.nodes.longExposure.addEventListener('change', this.handleLongExposureChange);

        this.nodes.fullscreen.addEventListener('change', this.handleFullscreenChange);

        this.nodes.scaleFactor.addEventListener('change', this.handleScaleFactorChange);

        this.mountHelpListeners();

        for (const eventType of this.blockedPointerEventTypes) {
            this.element.addEventListener(eventType, this.handlePointerEvent, true);
        }

        this.unsubscribe = this.store.subscribe((): void => {
            this.render();
        });

        this.render();
    }

    public render(): void {
        const state: Readonly<AppState> = this.store.state;

        this.element.classList.toggle('hide', !state.menuOpen);

        this.nodes.menuInnerWrap.style.opacity = state.openHelpTopic ? '0.12' : '1';

        this.nodes.shellType.value = state.config.shell;

        this.nodes.shellSize.value = state.config.size;

        this.nodes.quality.value = state.config.quality;

        this.nodes.skyLighting.value = state.config.skyLighting;

        this.nodes.scaleFactor.value = state.config.scaleFactor.toFixed(2);

        this.nodes.autoLaunch.checked = state.config.autoLaunch;

        this.nodes.finaleMode.checked = state.config.finale;

        this.nodes.hideControls.checked = state.config.hideControls;

        this.nodes.longExposure.checked = state.config.longExposure;

        this.nodes.fullscreen.checked = state.fullscreen;

        /*
         * Preserve existing behavior exactly.
         * This can be revisited when Finale Mode UI logic is refined.
         */
        this.nodes.finaleModeFormOption.style.opacity = '1';
    }

    public override destroy(): void {
        this.nodes.closeMenuBtn.removeEventListener('click', this.handleCloseClick);

        this.nodes.shellType.removeEventListener('change', this.handleShellTypeChange);

        this.nodes.shellSize.removeEventListener('change', this.handleShellSizeChange);

        this.nodes.quality.removeEventListener('change', this.handleQualityChange);

        this.nodes.skyLighting.removeEventListener('change', this.handleSkyLightingChange);

        this.nodes.autoLaunch.removeEventListener('change', this.handleAutoLaunchChange);

        this.nodes.finaleMode.removeEventListener('change', this.handleFinaleChange);

        this.nodes.hideControls.removeEventListener('change', this.handleHideControlsChange);

        this.nodes.longExposure.removeEventListener('change', this.handleLongExposureChange);

        this.nodes.fullscreen.removeEventListener('change', this.handleFullscreenChange);

        this.nodes.scaleFactor.removeEventListener('change', this.handleScaleFactorChange);

        for (const [helpNode, handler] of this.helpHandlers) {
            helpNode.removeEventListener('click', handler);
        }

        this.helpHandlers.clear();

        for (const eventType of this.blockedPointerEventTypes) {
            this.element.removeEventListener(eventType, this.handlePointerEvent, true);
        }

        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }

    private populateSelect(node: HTMLSelectElement, options: readonly SelectOption[]): void {
        const documentRef: Document = this.element.ownerDocument;

        node.replaceChildren(
            ...options.map((option: SelectOption): HTMLOptionElement => {
                const optionElement: HTMLOptionElement = documentRef.createElement('option');

                optionElement.value = String(option.value);

                optionElement.textContent = option.label;

                return optionElement;
            }),
        );
    }

    private mountHelpListeners(): void {
        for (const [nodeKey, helpTopic] of Object.entries(this.options.helpNodeToTopic) as Array<
            [HelpNodeKey, HelpTopicKey]
        >) {
            const helpNode: HTMLLabelElement = this.nodes.getHelpNode(nodeKey);

            const handler: (event: MouseEvent) => void = (event: MouseEvent): void => {
                /*
                 * Prevent the default label behavior.
                 *
                 * Checkbox labels use `for="checkbox-id"`, which would otherwise
                 * toggle the associated checkbox when the help label is clicked.
                 */
                event.preventDefault();

                /*
                 * Prevent this interaction from reaching other UI or stage handlers.
                 */
                event.stopPropagation();

                this.actions.onOpenHelp(helpTopic);
            };

            this.helpHandlers.set(helpNode, handler);

            helpNode.addEventListener('click', handler);
        }
    }

    private logConfigChange(event: Event): void {
        const node: EventTarget | null = event.currentTarget;

        if (node instanceof HTMLSelectElement) {
            const output: SettingsChangeConsoleOutput = {
                kind: 'select',
                className: node.className,
                value: node.value,
            };

            console.log('[SELECT CHANGE]', output);
            //this.store.logPersistedStore();
            return;
        }

        if (node instanceof HTMLInputElement) {
            const output: SettingsChangeConsoleOutput = {
                kind: 'input',
                className: node.className,
                checked: node.checked,
            };

            console.log('[INPUT CHANGE]', output);
            //this.store.logPersistedStore();
            return;
        }
    }
}
