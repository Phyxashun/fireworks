// FILE-PATH: src/components/HelpModal.ts

import { Component } from './Component';
import { HELP_CONTENT } from '../constants/help';
import type { AppState } from '../app/AppState';
import type { AppStore } from '../app/AppStore';
import type { AppNodes } from '../dom/AppNodes';

export interface HelpModalActions {
    onClose(): void;
}

export class HelpModal extends Component {
    private readonly nodes: AppNodes;

    private readonly store: AppStore;

    private readonly actions: HelpModalActions;

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

    private readonly handleCloseClick: (event: MouseEvent) => void = (_event: MouseEvent): void => {
        this.actions.onClose();
    };

    private readonly handleOverlayClick: (event: MouseEvent) => void = (_event: MouseEvent): void => {
        this.actions.onClose();
    };

    private readonly handlePointerEvent: (event: Event) => void = (event: Event): void => {
        event.stopPropagation();
    };

    public constructor(nodes: AppNodes, store: AppStore, actions: HelpModalActions) {
        super(nodes.helpModal);

        this.nodes = nodes;
        this.store = store;
        this.actions = actions;
    }

    public mount(): void {
        this.nodes.helpModalCloseBtn.addEventListener('click', this.handleCloseClick);

        this.nodes.helpModalOverlay.addEventListener('click', this.handleOverlayClick);

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

        const topicKey = state.openHelpTopic;

        this.element.classList.toggle('active', topicKey !== null);

        if (topicKey === null) {
            return;
        }

        const topic = HELP_CONTENT[topicKey];

        this.nodes.helpModalHeader.textContent = topic.header;

        this.nodes.helpModalBody.textContent = topic.body;
    }

    public override destroy(): void {
        this.nodes.helpModalCloseBtn.removeEventListener('click', this.handleCloseClick);

        this.nodes.helpModalOverlay.removeEventListener('click', this.handleOverlayClick);

        for (const eventType of this.blockedPointerEventTypes) {
            this.element.removeEventListener(eventType, this.handlePointerEvent, true);
        }

        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }
}
