// FILE-PATH: src/constants/help.ts

import type { HelpTopicKey } from '../app/AppState';

export interface HelpTopic {
    readonly header: string;
    readonly body: string;
}

export const HELP_CONTENT: Readonly<Record<HelpTopicKey, HelpTopic>> = {
    shellType: {
        header: 'Shell Type',
        body: 'The type of firework that will be launched. ' + 'Select "Random" for a nice assortment!',
    },

    shellSize: {
        header: 'Shell Size',
        body:
            'The size of the fireworks. Modeled after real ' +
            'firework shell sizes, larger shells have bigger ' +
            'bursts with more stars and sometimes more complex ' +
            'effects. Larger shells also require more processing ' +
            'power and may cause lag.',
    },

    quality: {
        header: 'Quality',
        body:
            'Overall graphics quality. If the animation is not ' +
            'running smoothly, try lowering the quality. High ' +
            'quality greatly increases the amount of sparks ' +
            'rendered and may cause lag.',
    },

    skyLighting: {
        header: 'Sky Lighting',
        body:
            'Illuminates the background as fireworks explode. ' +
            'If the background looks too bright on your screen, ' +
            'try setting it to "Dim" or "None".',
    },

    scaleFactor: {
        header: 'Scale',
        body:
            'Allows scaling the size of all fireworks, essentially ' +
            'moving you closer or farther away. For larger shell ' +
            'sizes, it can be convenient to decrease the scale a ' +
            'bit, especially on phones or tablets.',
    },

    autoLaunch: {
        header: 'Auto Fire',
        body:
            'Launches sequences of fireworks automatically. Sit ' +
            'back and enjoy the show, or disable it to have full ' +
            'control.',
    },

    finaleMode: {
        header: 'Finale Mode',
        body: 'Launches intense bursts of fireworks. May cause lag. ' + 'Requires "Auto Fire" to be enabled.',
    },

    hideControls: {
        header: 'Hide Controls',
        body:
            'Hides the translucent controls along the top of the ' +
            'screen. Useful for screenshots or a more seamless ' +
            'experience.',
    },

    fullscreen: {
        header: 'Fullscreen',
        body: 'Toggles fullscreen mode.',
    },

    longExposure: {
        header: 'Open Shutter',
        body:
            'Experimental effect that preserves long streaks of ' + 'light, similar to leaving a camera shutter open.',
    },
};
