export default {
  editor: {
    label: {
      en: "Zeit-Erfassung / Time Tracker",
      de: "Zeit-Erfassung"
    },
    icon: "clock",
  },
  properties: {
    apiBaseUrl: {
      label: {
        en: "API Base URL",
        de: "API Basis-URL"
      },
      type: "Text",
      defaultValue: "https://xv05-su7k-rvc8.f2.xano.io/api:qM5iOIQs",
      bindable: true,
    },
    primaryColor: {
      label: {
        en: "Primary Green Color",
        de: "Primäre Grün-Farbe"
      },
      type: "Color",
      defaultValue: "#A4FF6B",
    },
    successColor: {
      label: {
        en: "Success Color (Start)",
        de: "Erfolgsfarbe (Start)"
      },
      type: "Color",
      defaultValue: "#A4FF6B",
    },
    dangerColor: {
      label: {
        en: "Danger Color (Stop)",
        de: "Gefahrenfarbe (Stop)"
      },
      type: "Color",
      defaultValue: "#0A1612",
    },
    itemsPerPage: {
      label: {
        en: "Items per Page",
        de: "Einträge pro Seite"
      },
      type: "Number",
      defaultValue: 10,
      bindable: true,
    },
    autoRefreshInterval: {
      label: {
        en: "Auto-refresh Interval (seconds)",
        de: "Auto-Aktualisierung (Sekunden)"
      },
      type: "Number",
      defaultValue: 1,
      bindable: true,
    },
  },
};
