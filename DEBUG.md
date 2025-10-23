# 🐛 Debug Guide - Zeiterfassung Problem lösen

## Problem: Keine Einträge in Xano-Datenbank

Das häufigste Problem ist **CORS (Cross-Origin Resource Sharing)**.

---

## 🔍 Schritt 1: Problem diagnostizieren

### Option A: Debug-Seite verwenden

1. **Öffne die Debug-Seite:**
   ```
   https://localhost:8080/debug.html
   ```

2. **Klicke auf "Timer Starten"**

3. **Schaue im Debug-Log:**
   - ✅ Grün = Erfolgreich
   - ❌ Rot = Fehler (meist CORS)

### Option B: Browser Console öffnen

1. **Browser-Console öffnen:**
   - Chrome/Edge: `F12` oder `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
   - Firefox: `F12` oder `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Safari: `Cmd+Option+C`

2. **Gehe zum "Console" Tab**

3. **Klicke auf "Timer starten" im Element**

4. **Schaue nach Fehlern wie:**
   ```
   Access to fetch at 'https://xv05-su7k-rvc8.f2.xano.io/...' from origin
   'https://localhost:8080' has been blocked by CORS policy
   ```

---

## 🔧 Schritt 2: Problem lösen

### ✅ Lösung 1: CORS in Xano konfigurieren (EMPFOHLEN)

1. **Gehe zu deinem Xano-Dashboard:**
   - Login bei https://xano.io

2. **Wähle deine API aus** (`yiQZgKMy`)

3. **Gehe zu Settings:**
   - Klicke auf "Settings" im linken Menü
   - Oder gehe direkt zu "API Settings"

4. **CORS konfigurieren:**
   - Finde den Bereich **"CORS Settings"** oder **"Allowed Origins"**
   - Füge folgende Origins hinzu:
     ```
     https://localhost:8080
     http://localhost:8080
     *
     ```
   - **Für Production:** Füge später deine WeWeb-Domain hinzu

5. **Speichern** und neu testen

### ✅ Lösung 2: Browser-Extension (Schnell für Tests)

**Chrome/Edge:**
1. Installiere "CORS Unblock" oder "Allow CORS: Access-Control-Allow-Origin"
2. Aktiviere die Extension
3. Teste erneut

**Firefox:**
1. Installiere "CORS Everywhere"
2. Aktiviere die Extension
3. Teste erneut

⚠️ **Wichtig:** Deaktiviere die Extension nach dem Testen!

### ✅ Lösung 3: In WeWeb testen (Production)

Das Element funktioniert **ohne Probleme** wenn es in WeWeb läuft, weil:
- WeWeb läuft auf einer eigenen Domain
- Du kannst diese Domain in Xano als erlaubte Origin eintragen
- Keine CORS-Probleme in Production

---

## 📝 Schritt 3: Verifizieren

Nach der Lösung:

1. **Öffne die Debug-Seite:**
   ```
   https://localhost:8080/debug.html
   ```

2. **Klicke "Timer Starten"**

3. **Prüfe das Log:**
   - Du solltest eine ✅ grüne Nachricht sehen: "Timer gestartet!"

4. **Prüfe Xano:**
   - Gehe zu deiner Xano-Datenbank
   - Tabelle "time_entries" sollte einen neuen Eintrag haben

---

## 🧪 Test-Commands (Terminal)

**Wenn curl funktioniert, ist die API OK - dann ist es definitiv CORS:**

```bash
# Timer starten (sollte funktionieren)
curl -X POST https://xv05-su7k-rvc8.f2.xano.io/api:yiQZgKMy/start \
  -H "Content-Type: application/json" \
  -d '{"description":"Test via curl"}'

# Historie abrufen
curl -X GET "https://xv05-su7k-rvc8.f2.xano.io/api:yiQZgKMy/history?page=1&per_page=5"
```

---

## ❓ Weitere Probleme?

### Problem: "SSL Certificate Error"

Das ist normal für localhost. Klicke im Browser auf "Fortfahren" oder "Erweitert" → "Trotzdem fortfahren".

### Problem: "Element lädt nicht"

1. Stelle sicher, dass `npm run serve` läuft
2. Öffne https://localhost:8080
3. Akzeptiere das SSL-Zertifikat

### Problem: "API gibt 404 zurück"

Überprüfe die API-URL in `ww-config.js`:
```javascript
defaultValue: "https://xv05-su7k-rvc8.f2.xano.io/api:yiQZgKMy"
```

---

## 📞 Support

Wenn nichts funktioniert:

1. **Prüfe die Browser Console** (F12) für Fehler
2. **Nutze die Debug-Seite** (https://localhost:8080/debug.html)
3. **Teste mit curl** (siehe oben)
4. **Prüfe Xano API Settings**

---

## ✅ Checkliste

- [ ] Debug-Seite geöffnet und getestet
- [ ] Browser Console geöffnet und Fehler gelesen
- [ ] CORS in Xano konfiguriert ODER Browser-Extension installiert
- [ ] Timer-Start funktioniert (grün in Debug-Log)
- [ ] Eintrag in Xano-Datenbank sichtbar
- [ ] Historie lädt korrekt

**Wenn alle Punkte ✅ sind, funktioniert das Element!**
