// FILE-PATH: src/components/Controls.ts

// src/components/Controls.ts

import { Component } from './Component';

import type { AppNodes } from '../dom/AppNodes';

import type { AppState } from '../app/AppState';

import type { AppStore } from '../app/AppStore';

export interface ControlsActions {
    onTogglePause(): void;
    onToggleSound(): void;
    onToggleMenu(): void;
}

export class Controls extends Component {
    private readonly nodes: AppNodes;

    private readonly store: AppStore;

    private readonly actions: ControlsActions;

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

    private readonly handlePauseClick = (_event: MouseEvent): void => {
        this.actions.onTogglePause();
    };

    private readonly handleSoundClick = (_event: MouseEvent): void => {
        this.actions.onToggleSound();
    };

    private readonly handleSettingsClick = (_event: MouseEvent): void => {
        this.actions.onToggleMenu();
    };

    private readonly handlePointerEvent = (event: Event): void => {
        event.stopPropagation();
    };

    public constructor(nodes: AppNodes, store: AppStore, actions: ControlsActions) {
        super(nodes.controls);

        this.nodes = nodes;
        this.store = store;
        this.actions = actions;
    }

    public mount(): void {
        this.nodes.pauseBtn.addEventListener('click', this.handlePauseClick);

        this.nodes.soundBtn.addEventListener('click', this.handleSoundClick);

        this.nodes.settingsBtn.addEventListener('click', this.handleSettingsClick);

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

        const pauseIcon: string = state.paused ? '#icon-play' : '#icon-pause';

        const soundIcon: string = state.soundEnabled ? '#icon-sound-on' : '#icon-sound-off';

        this.nodes.pauseBtnSVG.setAttribute('href', pauseIcon);

        this.nodes.pauseBtnSVG.setAttribute('xlink:href', pauseIcon);

        this.nodes.soundBtnSVG.setAttribute('href', soundIcon);

        this.nodes.soundBtnSVG.setAttribute('xlink:href', soundIcon);

        this.element.classList.toggle('hide', state.menuOpen || state.config.hideControls);
    }

    public override destroy(): void {
        this.nodes.pauseBtn.removeEventListener('click', this.handlePauseClick);

        this.nodes.soundBtn.removeEventListener('click', this.handleSoundClick);

        this.nodes.settingsBtn.removeEventListener('click', this.handleSettingsClick);

        for (const eventType of this.blockedPointerEventTypes) {
            this.element.removeEventListener(eventType, this.handlePointerEvent, true);
        }

        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }
}
