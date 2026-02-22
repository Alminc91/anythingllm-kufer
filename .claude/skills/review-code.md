# Code Review Skill

**Name:** review-code
**Trigger:** Vor jedem Git-Commit, nach größeren Implementierungen
**Dauer:** ~3-5 Minuten

---

## Ziel

Systematische Code-Qualitätsprüfung nach AnythingLLM-Kufer Standards (siehe CLAUDE.md).

---

## Workflow

### 1. Geänderte Dateien identifizieren

```bash
git status --short
```

### 2. Backend-Dateien prüfen (falls vorhanden)

**Für jede geänderte .js-Datei in `/server`:**

- [ ] **Syntax-Check**
  ```bash
  cd server && node -c <dateiname>
  ```

- [ ] **Code-Standards (CLAUDE.md):**
  - ✅ JSDoc-Kommentare vorhanden?
  - ✅ Try-catch Blöcke mit console.error?
  - ✅ Number() für ID-Konvertierungen?
  - ✅ Prisma.sql für SQL-Injection-Schutz?
  - ✅ validatedRequest + flexUserRoleValid Middleware?

- [ ] **Performance:**
  - ⚠️ Keine N+1 Queries (findMany statt Loop mit findUnique)
  - ⚠️ Pagination bei großen Datenmengen
  - ⚠️ include: true Filter für DSGVO

- [ ] **SQLite $queryRaw:**
  - ⚠️ ALLE BigInt-Werte zu Number konvertieren vor JSON-Response
  - ⚠️ Test: COUNT, SUM, MIN, MAX → Number(result[0].value)

- [ ] **API-Endpoint Tests (falls neue Endpoints):**
  ```bash
  # Testdaten in DB einfügen
  sqlite3 server/storage/anythingllm.db

  # API mit curl testen
  curl -X POST http://localhost:3001/api/... \
    -H "Content-Type: application/json" \
    -d '{...}'
  ```

### 3. Frontend-Dateien prüfen (falls vorhanden)

**Für jede geänderte .jsx-Datei in `/frontend/src`:**

- [ ] **Build-Test**
  ```bash
  cd frontend && yarn build
  ```

- [ ] **Code-Standards (CLAUDE.md):**
  - ✅ useTranslation() für alle Texte (keine hardcoded Strings)?
  - ✅ formatDateTimeDE() für Zeitstempel?
  - ✅ toLocaleString("de-DE") für Zahlen?
  - ✅ showToast() für User-Feedback?
  - ✅ Loading States für async Operations?
  - ✅ Empty States ("Keine Daten vorhanden")?
  - ✅ Error-Handling mit Fallbacks (|| [], || "")?

- [ ] **React Hooks:**
  - ✅ Alle Dependencies in useEffect-Arrays?
  - ✅ Keine async Funktionen direkt in useEffect?

- [ ] **Styling:**
  - ✅ Theme-Variablen (bg-theme-*, text-theme-*)?
  - ✅ Hover-States (hover:bg-*)?
  - ✅ Responsive (md:, lg:)?
  - ✅ Disabled States (disabled:opacity-50)?

### 4. End-to-End Tests (HÖCHSTE PRIORITÄT)

**Manuelle Tests im Browser:**

- [ ] **Happy Path**: Hauptfunktion durchklicken
  - Beispiel: Neue Funktion öffnen → Daten eingeben → Speichern → Anzeigen

- [ ] **Edge Cases:**
  - [ ] Leere Datenbank (keine Daten)
  - [ ] Nur 1 Item
  - [ ] Viele Items (>100 für Pagination)

- [ ] **Error Cases:**
  - [ ] API offline (Server stoppen, Verhalten prüfen)
  - [ ] Ungültige Daten eingeben
  - [ ] Netzwerkfehler simulieren (Browser DevTools → Offline)

- [ ] **Mobile Responsive:**
  - [ ] Chrome DevTools → Toggle Device Toolbar
  - [ ] Funktioniert auf kleinen Screens?

### 5. Übersetzungen prüfen (falls UI-Änderungen)

- [ ] **Deutsche Übersetzungen** in `frontend/src/locales/de/common.js`?
- [ ] **Englische Übersetzungen** in `frontend/src/locales/en/common.js`?
- [ ] Keine hardcoded Strings im Code?

### 6. Report erstellen

**Zusammenfassung für User:**

```markdown
## ✅ Code Review Abgeschlossen

### Geprüfte Dateien
- `server/...` - Backend
- `frontend/src/...` - Frontend

### Backend-Checks
- ✅ Syntax: OK
- ✅ Code-Standards: Erfüllt
- ✅ Performance: Optimiert
- ✅ API-Tests: Bestanden

### Frontend-Checks
- ✅ Build: Erfolgreich
- ✅ Code-Standards: Erfüllt
- ✅ React Hooks: Korrekt
- ✅ Styling: Konsistent

### End-to-End Tests
- ✅ Happy Path: Funktioniert
- ✅ Edge Cases: Gehandelt
- ✅ Error Cases: Robust
- ✅ Mobile: Responsive

### Gefundene Issues
- [Keine] oder [Liste von Problemen]

### Empfehlung
✅ **BEREIT FÜR COMMIT** oder ⚠️ **Issues beheben vor Commit**
```

---

## Nutzung

### Automatisch (durch Claude)
Claude ruft diesen Skill proaktiv auf:
- Nach Implementierung neuer Features
- Nach größeren Code-Änderungen (>3 Dateien)
- Vor Git-Commit

### Manuell (durch User)
```bash
# Im Chat:
/review-code

# Oder spezifisch für eine Datei:
/review-code --file=server/models/embedChats.js
```

---

## Hinweise

- **Priorisierung:** End-to-End Tests > API-Tests > Syntax-Checks
- **Zeit:** Nimm dir Zeit für gründliche Tests (lieber 5min mehr als Bugs in Production)
- **Dokumentation:** Alle Checks sind in CLAUDE.md dokumentiert
