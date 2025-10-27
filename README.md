# ⏱️ Zeiterfassung App

Eine moderne, benutzerfreundliche Zeiterfassungs-App mit lokalem Speicher.

## Features

### Timer-Ansicht
- Großer, übersichtlicher Timer-Display
- Start/Stop Funktionalität
- Aufgabenbeschreibung hinzufügen
- Pulsierende Animation während der Timer läuft

### Historie-Ansicht
- Übersicht aller Zeiteinträge
- Statistiken:
  - Gesamtzeit aller Sitzungen
  - Anzahl der Sitzungen
  - Heutige Arbeitszeit
- Einträge löschen
- Laufende Timer werden hervorgehoben

### Technische Details
- Speicherung im Browser (localStorage)
- Keine Backend-Verbindung erforderlich
- Responsive Design für Desktop und Mobile
- Modernes Gradient-Design

## Verwendung

### Option 1: Direkt öffnen
Öffne einfach die `index.html` im Browser.

### Option 2: Mit Server
```bash
npm run serve
```

Die App öffnet sich automatisch unter `http://localhost:8080`

## Datenstruktur

Alle Daten werden lokal im Browser gespeichert. Beim Löschen der Browser-Daten gehen die Einträge verloren.

## Browser-Kompatibilität

- Chrome/Edge (empfohlen)
- Firefox
- Safari
- Mobile Browser
