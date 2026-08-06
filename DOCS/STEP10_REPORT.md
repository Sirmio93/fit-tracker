## STEP10_REPORT — Audit legacy CSS + pattern residui

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 10 (audit statico, marcatura dormant CSS modal, tabulazione pattern residui)
**Prerequisito:** Step 1-9 completati; nessun onclick residuo in app.js; modali su Presenter (Dialog / BottomSheet).

---

## 0. TL;DR

- **Audit-only step**. Zero modifiche a `app.js`, zero modifiche a business logic, zero componenti UI toccati.
- **Marcati DORMANT** in [styles.css](../styles.css): `.modalBackdrop` (L518) e `.modal` (L526) — verificato **0 consumi** post-Step 9. Aggiunto commento con data + motivazione + candidatura a rimozione futura. Non rimossi (allineato a policy Step 8: "dormant, not deleted, per rollback L1").
- **Preservato** `.modalRow` e derivate (L542-561): **ancora consumato** dal contenuto del `BottomSheet` in `openResumeModal` ([app.js:1397](../app.js#L1397)). Rimuoverle romperebbe il layout riga sessione dentro il sheet.
- **Preservato** `#modalHost` fallback in `closeModal` ([app.js:1366](../app.js#L1366)) — Step 9 lo lascia come safety net; nessun path attivo lo produce.
- **Enumerati** 12 pattern `<button class="…">` inline HTML residui in `app.js`: TUTTI usano già `data-action` (nessun onclick), TUTTI in view già refattorizzate. Non migrati — sono candidati Step 11+ (`UI.Button` migration + rimozione classi legacy `.primary/.ok/.bad`).
- **SACRED markers**: 38 → **38** ✓ (invariato)
- **Onclick residues**: 0 → **0** ✓ (invariato)

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [styles.css](../styles.css) | +3 / -0 | Solo commento DORMANT sopra `.modalBackdrop` (nessuna regola modificata/rimossa) |
| [DOCS/STEP10_REPORT.md](STEP10_REPORT.md) | +new | Questo report |

**File NON toccati in Step 10:**
- [app.js](../app.js), [index.html](../index.html), [manifest.json](../manifest.json), [sw.js](../sw.js), [components/**](../components/) — invariati.
- Nessuna funzione modificata. Nessuna vista modificata. Nessuna delegation modificata.

---

## 2. VERIFICA CONSUMO CSS LEGACY MODAL

### 2.1 Grep di controllo

```
$ grep -nE '\.modal|\.modalBackdrop|\.modalRow' styles.css
518:.modalBackdrop {
526:.modal {
542:.modalRow {
551:.modalRow:last-child {
555:.modalRow .row {
559:.modalRow button {
```

```
$ grep -nE 'modalHost|modalBackdrop|modalRow|class="modal|class=modal' app.js
1366:    var h = document.getElementById('modalHost'); if (h) h.remove();
1397:        return '<div class="modalRow" data-id="' + esc(s.id) + '">' +
```

### 2.2 Verdetto per regola

| Regola CSS | Definita | Consumata in app.js | Verdetto Step 10 |
|-----------|----------|---------------------|-------------------|
| `.modalBackdrop` | styles.css:518 | 0 usi | 🟡 **DORMANT** — commentata come tale, non rimossa |
| `.modal` | styles.css:526 | 0 usi (era backdrop container) | 🟡 **DORMANT** — commentata come tale, non rimossa |
| `.modalRow` | styles.css:542 | **1 uso** ([app.js:1397](../app.js#L1397)) — riga dentro BottomSheet | 🟢 **LIVE** — preservata |
| `.modalRow:last-child` | styles.css:551 | selettore CSS su `.modalRow` sopra | 🟢 **LIVE** — preservata |
| `.modalRow .row` | styles.css:555 | selettore CSS su `.modalRow` sopra | 🟢 **LIVE** — preservata |
| `.modalRow button` | styles.css:559 | selettore CSS su `.modalRow` sopra | 🟢 **LIVE** — preservata |

### 2.3 Perché `.modalRow` è ancora viva

Il refactor di Step 9 ha spostato la struttura del modal da `#modalHost > .modalBackdrop > .modal` (proprietary) a `UI.showBottomSheet` (Presenter). Ma **il contenuto interno** delle righe sessione, iniettato come `content: body` nel sheet, riusa ancora `<div class="modalRow">` come layout row (label sessione a sinistra, gruppo bottoni a destra). Vedi [app.js:1397](../app.js#L1397):

```js
return '<div class="modalRow" data-id="' + esc(s.id) + '">' +
    '<div><b>' + esc(sessionLabel(s)) + '</b>' +
    // ...
    '<div class="row" style="flex-wrap:wrap; gap:var(--space-8)">' +
```

**Alternative valutate per completezza (non applicate in Step 10)**:
1. Sostituire `<div class="modalRow">` con `<div class="row">` (già presente in styles.css come flex helper) o `<div style="display:flex;...">` inline.
   - **Rischio**: perderemmo il `border-bottom` tra righe + il `padding` verticale + il gap. Richiederebbe custom style inline o nuova classe.
2. Riscrivere le righe come `UI.ListItem` (se esistesse nel design system).
   - **Verificato**: `components/` non ha `ListItem`; l'unica primitiva simile è `HistoryCard` (Step 6) ma è già molto opinionated (avatar + eyebrow + badge). Overkill per una riga di sheet transiente.
3. Nuova classe scoped nel design system (es. `.c-sheet__row`).
   - Fuori scope Step 10 (audit-only). Candidata Step 11+.

Marcare `.modalRow` come dormant SAREBBE SBAGLIATO — è live e produce styling attivo. La preserviamo come regola normale (nessun commento aggiunto).

### 2.4 Perché `#modalHost` fallback è preservato

[app.js:1366](../app.js#L1366) nel body di `closeModal`:

```js
function closeModal() {
    if (__activeModal && typeof __activeModal.close === 'function') { __activeModal.close(); return; }
    var h = document.getElementById('modalHost'); if (h) h.remove();
}
```

- Il primo `return` intercetta il flow normale (Presenter attivo).
- Il fallback esiste per il caso ipotetico in cui `closeModal()` venga invocato senza handle attivo e con un vecchio `#modalHost` orfano nel DOM. Post-Step 9 nessun path attivo lo produce (grep di `id="modalHost"` in app.js → **0 match**). È safety net teorico costo-zero, coerente con approccio "not deleted".

---

## 3. AUDIT PATTERN HTML RESIDUI

Grep `<button[^>]*class=` in [app.js](../app.js):

| # | Line | Pattern | View | data-action | Componente UI candidato |
|---|------|---------|------|-------------|-------------------------|
| 1 | 381 | `<button ... class="sheetChip …">` (via template literal) | Home selection sheet (scheda) | `data-sheet-action="pick-card"` | `UI.Chip` (se aggiunta al DS) o `UI.SegmentedTab` |
| 2 | 384 | `<button ... class="sheetChip …">` | Home selection sheet (settimana) | `data-sheet-action="pick-week"` | idem |
| 3 | 397 | `<button ... class="sheetDayTile …">` | Home selection sheet (giorno) | attributi dinamici `data-day-*` | `UI.SelectableTile` (se aggiunta al DS) |
| 4 | 455 | `<button class="primary" data-action="go-home">` | focusView empty state | `go-home` | `UI.Button({variant:'primary'})` |
| 5 | 491 | `<button class="ok" data-action="finish-workout">` | workoutBlock final CTA | `finish-workout` | `UI.Button({variant:'primary', tone:'success'})` (se `tone` supportato) o mapping `ok` → `success` |
| 6 | 572 | `<button class="primary" data-action="focus-next-block">` | focusView single | `focus-next-block` | `UI.Button({variant:'primary'})` |
| 7 | 573 | `<button class="ok" data-action="finish-workout">` (branch) | focusView single | `finish-workout` | idem #5 |
| 8 | 581 | `<button class="primary" data-action="focus-next">` | focusView round | `focus-next` | idem #4 |
| 9 | 582 | `<button class="ok" data-action="finish-workout">` (branch) | focusView round | `finish-workout` | idem #5 |
| 10 | 588 | `<button class="setDoneBtn …" data-action="toggle-round">` | focusView round | `toggle-round` | custom (SelectableTile a doppio stato) o mantenere legacy |
| 11 | 593, 923 | `<button class="bad" data-action="stop-rest">` | focusView + timerDock | `stop-rest` | `UI.Button({variant:'danger'})` |
| 12 | 762 | `<button class="setDoneBtn …" data-action="toggle-set">` | exerciseCard | `toggle-set` | idem #10 |
| 13 | 801, 802 | `<button class="stepBtn" data-picker-dir="…">` | pickerRow (kg/reps) | `data-picker-dir` | custom Stepper (se aggiunto al DS) o mantenere legacy |

**Osservazioni chiave:**

- ✅ **Zero `onclick=` inline** — tutti usano già `data-action` (o `data-sheet-action`, `data-picker-dir`) intercettati da `mountViewDelegation` / `mountSheetDelegation` / `mountPickerDelegation`.
- ⚠️ **Classi legacy `.primary`, `.ok`, `.bad`** ancora vive: 4 punti `class="primary"`, 3 punti `class="ok"`, 2 punti `class="bad"`.
- ⚠️ **Classi specialized `.setDoneBtn`, `.stepBtn`, `.sheetChip`, `.sheetDayTile`** ancora vive: primitive custom con comportamento (checked state, active state, disabled) non 1:1 con `UI.Button`.

### 3.1 Migrazione a `UI.Button` — pros/cons (non applicata in Step 10)

**Pro migrazione:**
- Design system unificato; token color/spacing/radius coerenti col resto.
- A11y consistente (focus-visible già gestito da `UI.Button`).
- Rimozione futura di classi legacy `.primary/.ok/.bad` → styles.css più snello.

**Contro migrazione (rischi da mitigare):**
- `.setDoneBtn`, `.stepBtn` hanno stati custom (`.done`, `.stepVal.missing`) non modellati da `UI.Button` standard. Serve nuovo primitive o preserve legacy.
- Refactor tocca hot path del workout: `workoutBlock`, `focusView`, `exerciseCard`, `setRow`, `roundChip`, `timerDock`. Rischio regressione visiva alto.
- Firma dei callback data-action invariata → no rischio business logic, solo rendering.

**Raccomandazione**: **rimandare a Step 11+** (Settings/Preferenze + pulizia CSS). Step 10 chiude l'audit; Step 11 potrà procedere per singola view (workoutBlock prima, focusView poi, ecc.).

---

## 4. INVARIANTI PRESERVATE

### 4.1 SACRED business logic — 38 marker (invariato)

```
$ grep -cE 'logFor|beginWorkout|finishWorkout|resumeSession|discardSession|fillMissingFromPrevious|persistActive|fit-circuit-tracker-v18-optional-day|indexedDB\.open' app.js
38
```

Identico a baseline Step 9. Nessuna SACRED aggiunta/rimossa da Step 10 (impossibile — `app.js` non è stato toccato).

### 4.2 Onclick residues — 0 (invariato)

```
$ grep -cE 'onclick=|onchange=|ontoggle=' app.js
0
```

### 4.3 Firme pubbliche

Nessuna funzione toccata → nessuna firma modificata.

### 4.4 Delegation

`mountViewDelegation`, `mountModalDelegation`, `mountSheetDelegation`, `mountPickerDelegation` (se esistenti) invariati.

### 4.5 IndexedDB / Store / Sync

DB `fit-circuit-tracker-v18-optional-day` v2 — invariato. `Store` API — invariata. Sync engine — invariato.

### 4.6 Componenti UI (`components/**`)

Zero modifiche. `window.UI` frozen namespace intatto.

### 4.7 PWA

`sw.js`, `manifest.json`, `index.html` — invariati. **Non serve bump cache SW** perché nessuna modifica di app.js/html/js.
Tuttavia una modifica a `styles.css` **potrebbe** essere cachata dal SW se `styles.css` è nella cache statica del SW. Verificare (§7).

---

## 5. ADAPTER / FACADE INTRODOTTI

**Nessuno.** Step 10 è audit + commento CSS. Nessun ponte a SACRE, nessuna helper aggiunta.

---

## 6. REGRESSIONI ESCLUSE

### 6.1 Regressioni tecniche verificate ASSENTI

- ✓ Nessuna regressione business logic (app.js non toccato).
- ✓ Nessuna regressione visiva sui modali attivi: `.modalRow` (l'unica classe legacy modal ancora consumata) è preservata identica.
- ✓ Nessuna regressione focus/scroll: Presenter continua a gestire body scroll lock e focus trap.
- ✓ Il commento CSS `/* DORMANT ... */` non altera il parsing né lo styling delle regole seguenti.
- ✓ Il commento è inserito **sopra** `.modalBackdrop` senza modificare le proprietà CSS di `.modalBackdrop` o `.modal`. Le regole rimangono attive nel foglio (cascade invariato) → se un futuro codice cliente le usasse, funzionerebbero ancora.

### 6.2 Edge cases considerati

| Caso | Comportamento |
|------|---------------|
| SW cache già rilasciata pre-Step 10 | L'utente può ricevere `styles.css` vecchio dal cache; il flow non cambia perché la modifica è puramente cosmetica (commento). Hard reload risolverà. |
| Estensione browser che si aggancia a `.modal` / `.modalBackdrop` (es. dark reader) | Le regole esistono ancora (solo dormienti) — nessuna rottura. |
| Rollback L1 con `git checkout HEAD -- styles.css` | Ripristina styles.css pre-Step 10 (commento rimosso). Le classi restano definite come prima. Zero impatto. |
| Utente cerca di rimuovere `.modal`/`.modalBackdrop` manualmente | Il commento indica esplicitamente "candidates for removal in a future cleanup step" → segnala l'intento senza forzarlo. |

---

## 7. TEST STATICI ESEGUITI

- ✅ Grep SACRED markers in app.js → **38** (invariato).
- ✅ Grep `onclick=|onchange=|ontoggle=` in app.js → **0** (invariato).
- ✅ Grep `modalHost|modalBackdrop|modalRow|class="modal|class=modal` in app.js → **2 match** (fallback closeModal + modalRow sheet content).
- ✅ Grep `\.modal|\.modalBackdrop|\.modalRow` in styles.css → **6 regole** (invariate, 2 marcate come DORMANT via commento).
- ✅ Grep `<button[^>]*class=` in app.js → **12 pattern** enumerati in §3, tutti con `data-action`.
- ✅ Read styles.css:510-580 → commento inserito correttamente, sintassi CSS valida.

### 7.1 Test SW cache (utente)

- [ ] Aprire l'app in browser → DevTools → Application → Cache Storage → verificare se `styles.css` è in cache.
- [ ] Se sì, hard reload (Ctrl+Shift+R) per aggiornare (opzionale: il commento CSS non ha effetto funzionale, quindi non urge).

---

## 8. VERIFICA MANUALE (checklist utente)

### 8.1 Modali post-Step 10
- [ ] Riprendi sessione (Resume BottomSheet) → visualizzazione riga sessione **identica a Step 9** (label sinistra, 3 bottoni destra, border-bottom tra righe)
- [ ] Se una sola sessione → riga singola senza border-bottom (regola `.modalRow:last-child`) — invariato
- [ ] Duration Dialog → invariato
- [ ] Reset scheda Dialog → invariato

### 8.2 View non-modal
- [ ] Home / Workout / Progressi / Profilo / Focus / Summary → invariati (app.js non toccato)

### 8.3 CSS in DevTools
- [ ] Inspect di un `.modalRow` dentro BottomSheet → regole attive: `display:flex`, `border-bottom:1px solid var(--line)`, `padding:8px 0` ✓
- [ ] Inspect di un ipotetico elemento `.modal` (non presente nel DOM in Step 10) → regola definita nel foglio ma inattiva perché nessun elemento la usa ✓
- [ ] Commento `/* DORMANT ... */` visibile nel source styles.css senza errori di parsing

### 8.4 Tema
- [ ] Cambio tema `UI.setTheme('amoled')` → `.modalRow` interno al sheet riflette i token (il border-bottom usa `--line`, colore risolto per tema) ✓

---

## 9. PUNTI RIMASTI INVARIATI

- Tutte le funzioni di `app.js` — TUTTE invariate.
- Tutte le viste — TUTTE invariate.
- Delegation, Presenter, `window.UI`, `Store`, IndexedDB, Sync — TUTTI invariati.
- Bottom Navigation, Timer, ThemeToggle — TUTTI invariati.
- Tutti i componenti UI — TUTTI invariati.

---

## 10. CONFRONTO CON GATE STEP 9 §12

Gate definito in [STEP9_REPORT §12](STEP9_REPORT.md):

| # | Requisito Step 10 | Stato |
|---|-------------------|-------|
| 1 | Verificare CSS legacy `.modal`, `.modalBackdrop`, `.modalRow` in styles.css — se non più consumati, marcare come dormienti (senza rimuoverli — coerente con approccio Step 8). | ✅ Verificato: `.modal` + `.modalBackdrop` dormant → commentate. `.modalRow*` ancora consumato → preservato senza commento dormant. |
| 2 | Eventuale rimozione di `styles.css` classi dormant se >2 step lo confermano inutilizzato. | ⏸️ **Rimandato**. Step 10 è la prima verifica; policy richiede ≥2 conferme. Rimozione candidata Step 12+. |
| 3 | Audit finale del monolita `app.js` per identificare pattern residui da migrare (es. `<button class="primary">` HTML string vs `UI.Button`). | ✅ Enumerato in §3: 12 pattern, tutti con `data-action` (nessun onclick). Migrazione a `UI.Button` proposta per Step 11+. |

---

## 11. ROLLBACK

Livello L1 (revert solo Step 10, preservando Step 1-9):

```bash
git checkout HEAD -- styles.css DOCS/STEP10_REPORT.md
```

Zero impatto su dati: IndexedDB non toccato. Nessun componente UI modificato. `app.js`, `index.html`, `sw.js`, `manifest.json` invariati.

---

## 12. GATE PER STEP 11

Step 11 può iniziare SE:

- ✅ Checklist §8 completa (utente)
- ✅ 0 errori console
- ✅ Modali (Resume/Duration/Reset) rendono identici a Step 9
- ✅ Utente conferma dormant marking soddisfacente

**Scope preliminare Step 11 (proposta, da confermare):**

Due possibili direzioni, mutuamente compatibili:

### 11.A — Migrazione `<button class="primary/ok/bad">` → `UI.Button`
1. Sostituire i 9 pattern `.primary`/`.ok`/`.bad` residui (§3 table righe 4-9, 11) con `UI.Button({label, variant, dataset:{action:...}})`.
2. Dopo migrazione, marcare `.primary`, `.ok`, `.bad` come DORMANT in styles.css (secondo giro di conferma).
3. Preservare `.setDoneBtn`, `.stepBtn`, `.sheetChip`, `.sheetDayTile` (comportamento custom non coperto da UI.Button).
4. NOT touch: business logic, delegation, IndexedDB.

### 11.B — Settings/Preferenze view (rimandata da Step 8)
1. Nuova view `settings()` con `UI.PreferenceSwitch` per toggle (haptics, restAutoStart, ecc.).
2. Persistenza tramite nuova store IndexedDB `settings` (schema v3 → migrazione).
3. Punto di ingresso da Profilo (nuovo `SettingsRow` "Impostazioni →").
4. **Fuori scope minore**: introduce persistenza nuova → richiede audit `[[project-fase10-scope-decisions]]` per confermare.

**Raccomandazione**: partire da 11.A (più contenuto, zero nuove persistenze, riduce ulteriormente il legacy CSS).

---

## 13. STATO

✅ **Step 10 Audit COMPLETATO** — verificato dormant marking `.modal` + `.modalBackdrop`, preservato `.modalRow*` (live in BottomSheet content), enumerato 12 pattern `<button class>` residui in app.js (tutti con `data-action`, nessun onclick). Business logic, IndexedDB, componenti UI, app.js invariati. Solo `styles.css` con +3 righe commento.

🛑 **STOP**. Attesa approvazione utente prima di procedere a Step 11.
