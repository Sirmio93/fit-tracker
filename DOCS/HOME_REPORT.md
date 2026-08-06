# HOME_REPORT — Step 4

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 4 (Home redesign + selection sheet component)
**Prerequisito:** [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md), [THEME_REPORT.md](THEME_REPORT.md), [NAVIGATION_REPORT.md](NAVIGATION_REPORT.md) completati.

---

## 0. TL;DR

- **home() refattorizzata** — HTML string inline → `UI.WorkoutCard` (sessione attiva) · `UI.HeroCard` (welcome con scheda) · `UI.EmptyCard` (nessuna scheda).
- **Tile helper** — `homeChangeAction()` e `homeLastTile()` ora usano `UI.Card` + `UI.Button` del component library.
- **Selection sheet** riscritta usando `UI.showBottomSheet` (Presenter con scrim/focus-trap/ESC/scroll-lock automatici) — via il component `BottomSheet`.
- **Event delegation** — tutti gli `onclick="..."` inline della Home rimossi; nuovo handler mount-once su `#view` che risolve azioni tramite `data-action="..."`.
- **Business logic INTATTA** — `startDay`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`, `persistActive`, `ctx`, IndexedDB — tutto invariato.
- **Rimozione dead code** — `renderSheet` / `selectSheetHtml` / manipolazione manuale `#sheetHost` / ESC keydown handler ridondante (Presenter lo gestisce).

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | ~-95 / +85 | Refactor `home`/`homeChangeAction`/`homeLastTile` → componenti UI; refactor sheet → `UI.showBottomSheet`; +`mountViewDelegation`; -`renderSheet`/`selectSheetHtml`/ESC handler ridondante |

**File NON toccati in Step 4:**
- [index.html](../index.html) — invariato dopo Step 3
- [styles.css](../styles.css) — invariato (le classi legacy `.homeHero .metaLight .btnLight .lastDayTile .sheet .sheetBackdrop` diventano dead code; le classi `.sheetChip .sheetSection .sheetLabel .sheetChips .sheetDayList .sheetDayTile .sheetDayInfo .sheetDayArrow` sono ancora usate dentro `.c-bottomSheet__body`)
- [components/Cards/*.js](../components/Cards/) — usati as-is (WorkoutCard, HeroCard, EmptyCard, Card)
- [components/Buttons/Button.js](../components/Buttons/Button.js) — usato as-is (supporta `dataset` nativamente)
- [components/Feedback/BottomSheet.js](../components/Feedback/BottomSheet.js) + [Shared/Presenter.js](../components/Shared/Presenter.js) — usati as-is
- [components/index.js](../components/index.js), [components/bootstrap.js](../components/bootstrap.js) — invariati
- [sw.js](../sw.js), [manifest.json](../manifest.json), [components/Foundation/tokens.css](../components/Foundation/tokens.css) — invariati
- **IndexedDB, `S`, business logic, tutte le funzioni SACRE — invariate.**

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 `home()` — 3 stati con componenti

**Prima:** HTML string monolitico con `.card.homeHero.primary` (sessione attiva), `.card.homeHero` (welcome/import), inline `<button onclick="...">`.

**Dopo — tre percorsi mutuamente esclusivi:**

1. **Sessione attiva** (`x && x.day`) → `UI.WorkoutCard` con eyebrow "In corso", body `"<week> · <day> · done/total serie (pct%)"`, action ghost button `data-action="go-workout"`. Poi appende `homeChangeAction()`.
2. **Nessuna scheda importata** (`!S.cards.length`) → `UI.EmptyCard` icona `dumbbell`, action primary `data-action="go-profilo"`. Poi appende `homeLastTile()` (vuoto se nessuna sessione).
3. **Ha schede, nessuna attiva** → `UI.HeroCard` con eyebrow "Pronto", action ghost `data-action="open-select"`. Poi appende `homeLastTile()`.

**Design note (regressione visiva accettata):** la vecchia hero attiva mostrava una progress bar visiva a piena larghezza sopra il badge "done/total serie". Il nuovo `WorkoutCard` non ha slot per bar visive: il progresso è espresso testualmente nel `body`. La progress bar dettagliata resta comunque nella schermata **Workout**. Il bar visivo verrà eventualmente riadottato in Step 12 tramite `<Card variant="workout">` con `extra` slot se richiesto.

**Fallback guard:** `if (!UI || !UI.WorkoutCard) return '<div class="stack">…Caricamento…</div>'`. Difesa teorica — module + defer garantiscono `window.UI` prima del primo `render()`, ma la guardia evita crash in edge case (es. bootstrap.js caricato con `crossorigin` che ha fallito).

### 2.2 `homeChangeAction()` e `homeLastTile()` — `UI.Card` + `UI.Button`

- `homeChangeAction()` → `UI.Card({eyebrow, title, body, footer: Button(secondary, data-action=go-workout)})`
- `homeLastTile()` → `UI.Card({eyebrow: "Ultimo allenamento · <date>", title, body, footer: Button(primary, data-action=repeat-last, data-card-id, data-week-key, data-day-key)})`

**Business logic invariata:** entrambe le funzioni fanno solo consultazione di `S.cards`/`recentSessions()` (letture pure) e delegano l'azione a `startDay()` invocato dal delegation handler.

### 2.3 Selection sheet — `UI.showBottomSheet` + in-sheet delegation

**Prima:** `S.sheet` flag + `renderSheet()` che appendeva/rimuoveva manualmente `#sheetHost` al body; `selectSheetHtml()` restituiva HTML monolitico con `.sheetBackdrop .sheet .sheetHandle .sheetHead .sheetClose .sheetBody`; onclick inline per chip/tile/close.

**Dopo:** stato unico `let __sheetHandle = null` (handle del Presenter, `null` quando la sheet è chiusa).

```
openSelectSheet()
  ├─ init flow (cardId/weekKey default)
  ├─ S.sheet = 'select'  (retro-compat, letto da nessuno ora ma preserva semantica)
  ├─ window.UI.showBottomSheet({title, content: selectSheetBody(), onClose})
  │     └─ Presenter monta scrim + layer + ESC + focus trap + body scroll lock
  └─ mountSheetDelegation(handle.root)
        └─ un click listener che dispatcha su data-sheet-action:
             pick-card → sheetCardSelect(dataset.cardId)
             pick-week → sheetWeekSelect(dataset.weekKey)
             pick-day  → sheetPickDay(dataset.cardId, dataset.weekKey, dataset.dayKey)

closeSelectSheet()
  ├─ S.sheet = null
  └─ __sheetHandle.close() (idempotente, no-op se già null)
```

**Aggiornamenti dinamici** — quando l'utente cambia scheda o settimana, invece di distruggere/ricostruire l'intera sheet come faceva `renderSheet()`, `updateSheetBody()` riscrive solo `.c-bottomSheet__body` innerHTML → 0 flicker sullo scrim, focus preservato, animazioni di apertura non riattivate.

**Riuso classi legacy per il body:** `.sheetSection .sheetLabel .sheetChips .sheetChip .sheetDayList .sheetDayTile .sheetDayInfo .sheetDayArrow` sono ancora in styles.css e riapplicate al content dentro `.c-bottomSheet__body`. Selettori non dipendono da un contenitore `.sheet` root, quindi funzionano. Bonify CSS → Step 12.

**Chiusura tramite ESC / scrim / drag** — tutto gestito nativamente dal Presenter (`escToClose`, `dismissOnScrim`) e dal `BottomSheet` (drag handle `onDragY` con `dismissAt: 120`).

**Chiusura tramite `go(t)`** — [app.js:202-203](../app.js#L202-L203) continua a chiamare `closeSelectSheet()` su ogni cambio tab: `closeSelectSheet` è idempotente.

### 2.4 Mount-once `mountViewDelegation()` — [app.js:167-184](../app.js#L167-L184)

Nuovo listener `click` in bubble phase su `#view`, resistente a re-render di `innerHTML`:

```
data-action="go-home"      → go('home')
data-action="go-workout"   → go('workout')
data-action="go-progressi" → go('progressi')
data-action="go-profilo"   → go('profilo')
data-action="open-select"  → openSelectSheet()
data-action="repeat-last"  → startDay(dataset.cardId, dataset.weekKey, dataset.dayKey)
```

**Attivazione:** chiamata una sola volta nel boot IIFE [app.js:1373](../app.js#L1373) tra `loadSyncConfig()` e `refresh()`, prima del primo render → 0 race con eventuali click al primo idle.

**Perché su `#view` e non `document.body`:** limita lo scope e riduce falsi positivi. `data-action` è un attributo generico — restringere la delegation a `#view` evita di catturare accidentalmente elementi futuri fuori dal main.

### 2.5 Rimozione ESC handler ridondante

Rimossa la riga:
```js
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) closeSelectSheet(); });
```

**Motivo:** il Presenter usa `document.addEventListener('keydown', onKeydown, true)` in capture phase con `e.stopPropagation()` sull'ESC. Con la sheet aperta, l'handler legacy non riceveva mai l'evento. Senza sheet aperta, `S.sheet` era sempre `null` → no-op. Codice morto.

---

## 3. INVARIANTI PRESERVATE

### 3.1 Business logic

Verifica automatica su marker SACRE — **39 occorrenze** (identico allo Step 3):
`logFor`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`, `fillMissingFromPrevious`, `persistActive`, `fit-circuit-tracker-v18-optional-day`, `indexedDB.open`.

### 3.2 State model

- `S.sheet`: mantenuto come flag (`'select'` / `null`) per retro-compat. Nessun altro path lo legge dopo la rimozione dell'ESC handler ridondante, ma restare simmetrici a `openSelectSheet`/`closeSelectSheet` è low-cost e future-proof (Step 8 Profilo potrebbe aggiungere altre sheet).
- `S.flow.cardId` / `S.flow.weekKey`: invariati — la delegation modifica solo questi due, `startDay()` legge da queste chiavi come prima.
- `S.active`, `S.cards`, `S.sessions`, `S.exercises`, `S.focus`, `S.theme`, `S.tab`, `S.sync`, `S.rest`, `S.timer`: **zero modifiche**.

### 3.3 Funzioni SACRE non toccate

`ctx`, `resolveSessionCard`, `startDay`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`, `persistActive`, `fillMissingFromPrevious`, `Store`, `checkIncompleteSessions`, `migrateDedupExercises`, tutte le funzioni di Workout view (`workout`, `workoutBlock`, `focusView`, `focusSingleBody`, `focusRoundBody`, `focusPrev`, `focusNext`, `focusPrevBlock`, `focusNextBlock`, `toggleRound`, `setRow`, `blockAllDone`, `blockRoundDone`, `toggleFocusMode`).

### 3.4 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — schema, stores, index invariati.

### 3.5 Route dispatcher e Navigation

`go(t)` firma e comportamento identici. La `BottomNavigation` component continua a invocare `go(id)` come prima. `TAB_MIGRATION` invariato.

### 3.6 Sheet aperta dal Profilo

[app.js:944](../app.js#L944) contiene ancora `<button onclick="openSelectSheet()">` dentro `data()` (view Profilo). L'onclick funziona perché `openSelectSheet` resta una funzione globale. Sarà migrato in **Step 8 Profilo** con la stessa strategia (data-action delegation).

---

## 4. VERIFICA MANUALE

### 4.1 Home — 3 stati

**A. Nessuna scheda importata** (elimina IndexedDB, ricarica, non importare):
- [ ] Home mostra `EmptyCard` con icona dumbbell, titolo "Nessuna scheda", body con istruzioni
- [ ] Tap "Importa scheda" → naviga a Profilo (tab "Profilo" attiva in BottomNav)
- [ ] Nessun errore console

**B. Ha schede, nessuna sessione attiva:**
- [ ] Home mostra `HeroCard` eyebrow "Pronto", titolo "Pronto per allenarti?", body "Tocca qui sotto…", button "Scegli allenamento"
- [ ] Se esiste un ultimo allenamento chiuso → tile `Card` sotto con eyebrow "Ultimo allenamento · <data>", button "Ripeti"
- [ ] Tap "Ripeti" → `startDay` chiamato → naviga in Workout con giornata inizializzata (verifica in DevTools: `S.active` popolato)

**C. Sessione attiva in corso** (avvia workout, torna in Home):
- [ ] Home mostra `WorkoutCard` eyebrow "In corso", titolo = day.label, body = "<week> · <day> · X/Y serie (Z%)"
- [ ] Tap "Continua" → naviga in Workout
- [ ] Sotto la WorkoutCard: tile `Card` "Cambiare programma?" con button "Apri Workout" → anche questo naviga in Workout

### 4.2 Selection sheet

- [ ] Da Home stato B, tap "Scegli allenamento" → BottomSheet slide-up con scrim scuro, titolo "Scegli allenamento", chip Scheda (se >1), chip Settimana, lista Giorno
- [ ] Tap chip Scheda diverso → aggiorna body con settimane della nuova scheda (senza chiudere la sheet)
- [ ] Tap chip Settimana diverso → aggiorna lista giorni (senza chiudere)
- [ ] Tap day tile abilitato → chiude sheet + `startDay(...)` → naviga in Workout
- [ ] Tap day tile disabilitato ("Nessun esercizio") → nessuna azione
- [ ] Tap scrim → chiude sheet, `S.sheet = null`, focus restaurato al trigger
- [ ] Tasto ESC → chiude sheet (Presenter)
- [ ] Drag handle verso il basso >120px → chiude sheet (BottomSheet.onDragY)
- [ ] Body page scroll bloccato mentre sheet aperta (Presenter body scroll lock)

### 4.3 A11y

- [ ] `.c-bottomSheet` ha `role="dialog"`, `aria-modal="true"`, `aria-labelledby` sul titolo
- [ ] Focus va sul primo focusable della sheet all'apertura (Presenter)
- [ ] Tab e Shift+Tab restano dentro la sheet (focus trap)
- [ ] Alla chiusura, focus torna al bottone che ha aperto la sheet
- [ ] Bottoni Home hanno label leggibili (i data-action non sono usati per label — solo dispatch)

### 4.4 Business logic (regression)

- [ ] Importa scheda dal Profilo → torna in Home → "Ha schede, nessuna sessione" stato ✓
- [ ] Tap "Scegli allenamento" → sheet → Scheda/Settimana/Giorno → tap Giorno → **`startDay` chiamato, `S.active` valorizzato**, view Workout aperta
- [ ] In Workout: INIZIA → serie → completa → **`finishWorkout` → naviga a Progressi** (rotta Step 3)
- [ ] Torna in Home: `homeLastTile` mostra la sessione appena chiusa con button "Ripeti"
- [ ] Tap "Ripeti" → `startDay(cardId, weekKey, dayKey)` con parametri corretti dai `dataset.card-id` etc.
- [ ] Chiudi tab a metà sessione → riapri → Resume Modal (invariato)
- [ ] Discard sessione dal Profilo → torna in Home → stato B (welcome) ✓

### 4.5 Tema

- [ ] Cambia tema da console (`UI.setTheme('amoled')`) → Home riflette il tema (le Card usano `--color-surface` da tokens.css)
- [ ] Nessun errore ESC keydown (handler rimosso, Presenter gestisce)

### 4.6 PWA / cache

- [ ] SW `sw.js` v12 invariato
- [ ] Se cache serve vecchio app.js: DevTools → Application → Service Workers → Unregister + hard reload

### 4.7 Dead code (accettato in Step 4)

Classi CSS ora orfane in `styles.css` (nessun elemento DOM le matcha):
- `.homeHero`, `.homeHero.primary`, `.homeHero .metaLight`, `.homeHero .btnLight`, `.metaLight`, `.btnLight`
- `.lastDayTile`, `.lastDayTile h3`
- `.sheetBackdrop`, `.sheet`, `.sheetHead`, `.sheetHead h2`, `.sheetClose`, `.sheetHandle`, `.sheetBody`

**Ancora usate** (rimangono valide in `.c-bottomSheet__body`):
- `.sheetSection`, `.sheetSection:first-child`, `.sheetLabel`, `.sheetChips`, `.sheetChip`, `.sheetChip.active`, `.sheetDayList`, `.sheetDayTile`, `.sheetDayTile.disabled`, `.sheetDayInfo`, `.sheetDayArrow`

Cleanup completo styles.css → Step 12.

---

## 5. ROLLBACK

Livello L1 (revert Step 4 mantenendo Step 1-3):

```bash
git checkout HEAD -- app.js
```

Zero impatto su dati: IndexedDB non toccato. `styles.css`, `index.html`, `sw.js`, `manifest.json`, `components/*` non toccati in Step 4.

**Verifica post-rollback:** refresh browser → Home torna al layout `.homeHero`, sheet legacy con manipolazione manuale DOM torna operativa.

---

## 6. GATE PER STEP 5 (Workout redesign)

Step 5 può iniziare SE:

- ✅ Checklist §4.1-§4.6 completa (utente)
- ✅ 0 errori in console (in particolare nessun `Cannot read/set properties of null` su `data-action` handlers)
- ✅ Sheet apre/chiude senza glitch, chip aggiornano il body in-place
- ✅ `startDay` chiamato con parametri corretti dal delegation
- ✅ `finishWorkout` regressione: sessione salva, naviga a Progressi

**Cosa farà Step 5 (Workout redesign):**

1. Refactor `workout()` per usare `WorkoutHeader` + `ExerciseCard` + `CompleteButton` dal component library
2. Sostituzione di `focusView()` con `RestScreen` e `NextExercise` components quando pertinente (Focus Mode)
3. `WeightPicker` e `RepsPicker` component al posto degli input inline
4. `ProgressRing` per progresso Workout
5. `FloatingTimer` per session/rest timer (sostituendo `timerDock()` legacy)
6. `onclick` inline in Workout → event delegation
7. **NON toccare** business logic (`toggleFocusMode`, `focusPrev/Next`, `focusPrevBlock/NextBlock`, `toggleRound`, `blockAllDone`, `blockRoundDone`, `beginWorkout`, `finishWorkout`, `setRow`, `parseRestToSeconds`, `stopRestTimer/startRestTimer/stopSessionTimer/startSessionTimer/sessionTime`, `persistActive`)
8. **NON toccare** `stats()`, `data()` — arrivano in Step 6 e Step 8

**Cosa NON farà Step 5:**
- Nessun cambio al DB schema
- Nessun tocco al service worker (bump cache è Step 12)
- Nessun bonify di styles.css (Step 12)
- Nessun tocco all'`openSelectSheet` inline dal Profilo (Step 8)

---

## 7. STATO

✅ **Step 4 Home COMPLETATO** — Home refattorizzata su component library, selection sheet operativa via BottomSheet, event delegation attiva su `#view`, business logic e IndexedDB invariati.

🛑 **STOP**. Attesa autorizzazione per Step 5 Workout.
