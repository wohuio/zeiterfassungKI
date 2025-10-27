export default {
    editor: {
        label: {
            en: 'Simple Timer',
            de: 'Einfacher Timer'
        },
        icon: 'clock'
    },
    properties: {
        // API Settings
        use_api: {
            label: { en: 'Use API', de: 'API verwenden' },
            type: 'OnOff',
            defaultValue: false,
            section: 'settings'
        },
        endpoint_start: {
            label: { en: 'API Endpoint: Start', de: 'API Endpoint: Start' },
            type: 'Text',
            defaultValue: '',
            bindable: true,
            section: 'settings',
            options: {
                placeholder: 'Endpoint URL or ID'
            }
        },
        endpoint_stop: {
            label: { en: 'API Endpoint: Stop', de: 'API Endpoint: Stop' },
            type: 'Text',
            defaultValue: '',
            bindable: true,
            section: 'settings',
            options: {
                placeholder: 'Endpoint URL or ID'
            }
        },

        // Design Settings
        background_color: {
            label: { en: 'Background Color', de: 'Hintergrundfarbe' },
            type: 'Color',
            defaultValue: '#FFFFFF',
            bindable: true,
            section: 'settings'
        },
        text_color: {
            label: { en: 'Text Color', de: 'Textfarbe' },
            type: 'Color',
            defaultValue: '#1F2937',
            bindable: true,
            section: 'settings'
        },
        timer_color: {
            label: { en: 'Timer Color (Running)', de: 'Timer Farbe (läuft)' },
            type: 'Color',
            defaultValue: '#6366f1',
            bindable: true,
            section: 'settings'
        },
        start_button_color: {
            label: { en: 'Start Button Color', de: 'Start Button Farbe' },
            type: 'Color',
            defaultValue: '#10b981',
            bindable: true,
            section: 'settings'
        },
        stop_button_color: {
            label: { en: 'Stop Button Color', de: 'Stop Button Farbe' },
            type: 'Color',
            defaultValue: '#ef4444',
            bindable: true,
            section: 'settings'
        },
        border_radius: {
            label: { en: 'Border Radius', de: 'Border Radius' },
            type: 'Length',
            defaultValue: '12px',
            bindable: true,
            section: 'settings'
        },
        timer_size: {
            label: { en: 'Timer Font Size', de: 'Timer Schriftgröße' },
            type: 'Length',
            defaultValue: '4em',
            bindable: true,
            section: 'settings'
        }
    }
};
