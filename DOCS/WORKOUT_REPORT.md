# WORKOUT_REPORT — Step 5

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 5 (Workout view redesign — shell esterno)
**Prerequisito:** [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md), [THEME_REPORT.md](THEME_REPORT.md), [NAVIGATION_REPORT.md](NAVIGATION_REPORT.md), [HOME_REPORT.md](HOME_REPORT.md) completati.

---

## 0. TL;DR

- **workout() refattorizzata (shell esterno)** — header con `UI.WorkoutHeader` (gradient viola→magenta) + Button focus/INIZIO + CompleteButton "Termina sessione" a piena larghezza in fondo.
- **Empty state Workout** — `UI.EmptyCard` icona dumbbell con CTA "Vai in Home" via `data-action="go-home"`.
- **timerDock() → FloatingTimer** — pill del recupero via `UI.FloatingTimer` con Stop button (`data-action="stop-rest"`). Positioning fixed preservato via inline style sullo shell (documentato in §2.3 come compromesso pragmatico).
- **Event delegation esteso** — `mountViewDelegation` ora gestisce 9 nuove azioni workout: `begin-workout`, `finish-workout`, `toggle-focus`, `stop-rest`, `focus-prev`, `focus-next`, `focus-prev-block`, `focus-next-block`, `toggle-round`.
- **Focus mode navigation** — tutti gli `onclick="focusPrev/Next/PrevBlock/NextBlock/finishWorkout/toggleRound"` inline convertiti a `data-action`.
- **Business logic INTATTA** — `setRow`, `bumpKg`, `bumpReps`, `toggleExerciseSet`, `roundChip`, `workoutBlock`, `exerciseCard`, `focusSingleBody`, `focusRoundBody`, `beginWorkout`, `finishWorkout`, `toggleFocusMode`, `focusPrev/Next/PrevBlock/NextBlock`, `toggleRound`, `blockAllDone`, `blockRoundDone`, `startRestTimer/stopRestTimer/startSessionTimer/stopSessionTimer/sessionTime/updateRestTimerOnly/updateSessionTimerOnly`, `persistActive`, IndexedDB — tutto invariato.
- **DEFERITO a Step 5b (richiede autorizzazione utente)** — WeightPicker, RepsPicker, ExerciseCard, RestScreen, NextExercise, ProgressRing NON adottati: richiederebbero refactor di `setRow` (marcato SACRED in HOME_REPORT §6). Vedi §6.

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | ~-15 / +45 | Refactor `workout()`, `timerDock()`, nav focusView; +9 azioni in `mountViewDelegation` |

**File NON toccati:**
- [index.html](../index.html) — invariato dopo Step 3
- [styles.css](../styles.css) — invariato (positioning fixed del `.timerDock` legacy sostituito da inline style sullo shell, vedi §2.3)
- [components/Workout/*.js](../components/Workout/) — usati as-is (WorkoutHeader, CompleteButton, FloatingTimer)
- [components/Cards/EmptyCard.js](../components/Cards/EmptyCard.js) — usato as-is
- [components/Buttons/Button.js](../components/Buttons/Button.js) — usato as-is
- [components/index.js](../components/index.js), [components/bootstrap.js](../components/bootstrap.js) — invariati
- [sw.js](../sw.js), [manifest.json](../manifest.json), [components/Foundation/tokens.css](../components/Foundation/tokens.css) — invariati
- **IndexedDB, `S`, business logic, tutte le funzioni SACRE — invariate.**

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 `workout()` — shell esterno con componenti

**Prima:** header inline `.card.workoutHead` con h2 + meta line + row focus/main + `.bar`. Empty state con card legacy e onclick inline `go('home')`.

**Dopo — 3 sezioni:**

1. **Empty state** — `UI.EmptyCard` icona `dumbbell`, action `UI.Button` variant primary con `data-action="go-home"`.
2. **Header attivo** — `UI.WorkoutHeader` con:
   - eyebrow: `${week.label} · ${day.name}`
   - title: `${day.label}`
   - progress: `${done}/${total} serie · ${pct}%`
   - actions: `[focusBtn, mainBtn]`
     - `focusBtn` — `UI.Button` label toggling "◉ Focus" ↔ "☰ Vista completa", variant `secondary`/`primary`, `data-action="toggle-focus"`
     - `mainBtn` — quando NON started: `UI.Button` variant `primary` label "INIZIO" con `data-action="begin-workout"`. Quando started: vuoto (la CTA finale è in fondo).
3. **Status bar** — sotto l'header, un layout inline con:
   - `<span id="sessionTimerText" class="sessionTimer" role="timer" aria-live="polite">` (ID preservato per `updateSessionTimerOnly`)
   - `<div class="bar"><i style="width:X%"></i></div>` (bar legacy stylata da styles.css)
4. **Body** — invariato (`focusView(x, done, total)` o mapping `workoutBlock(b, bi)`)
5. **Final CTA** — quando `S.active.startedAt` truthy: `UI.CompleteButton` wrappata in `<div class="workoutFinalCta" data-action="finish-workout">`. Il click bubbla dal button al div che risolve `finish-workout` nel delegate.

**Fallback guard:** `if (UI && UI.WorkoutHeader && UI.Button)` prima del rendering header component. Fallback text-only per edge case (bootstrap.js non risolto).

**Rationale positioning CompleteButton in fondo:** design intent del componente (full-width success gradient, `min-height: var(--touch-fab)`). In header sarebbe out-of-place; a piena larghezza in fondo comunica "quando hai finito, tocca qui" nativamente. La legacy "Fine" button dell'header è sostituita da questa CTA.

### 2.2 `timerDock()` — `UI.FloatingTimer`

**Prima:**
```
<div class="timerDock"> (position:fixed by styles.css)
  <div class="between">
    <div>Recupero + timerTime#restTimerTime + label</div>
    <button class="bad" onclick="stopRestTimer()">Stop</button>
  </div>
</div>
```

**Dopo:**
```
<div class="timerDockShell" style="position:fixed;...pointer-events:none">
  <UI.FloatingTimer time=sec label=... state=running>
    (post-processed: #restTimerTime iniettato in .c-floatingTimer__time)
  </UI.FloatingTimer>
  <button class="timerDockStop" data-action="stop-rest">Stop</button>
</div>
```

**ID preserved:** `#restTimerTime` viene iniettato via string `.replace()` nel HTML restituito da `FloatingTimer`, così `updateRestTimerOnly()` continua a trovare l'elemento e aggiorna il testo ogni secondo (invariato).

**Positioning:** stile fixed applicato inline sullo shell (`.timerDockShell`) perché il componente `FloatingTimer` è agnostico rispetto alla posizione. Ne emerge un compromesso: usa inline style temporanei invece di aggiungere una regola in styles.css o components/index.css. La regola verrà spostata in Step 12 (CSS bonify). `pointer-events:none` sullo shell e `auto` sui figli permettono di cliccare solo su timer e Stop, non sul wrapper trasparente.

**Fallback:** se `UI.FloatingTimer` non è disponibile, rendering legacy `.timerDock` con `data-action="stop-rest"` (non più onclick inline).

### 2.3 `mountViewDelegation()` — 9 nuove azioni workout

Aggiunte al `switch(btn.dataset.action)`:

| Action | Handler | Dataset |
|--------|---------|---------|
| `begin-workout` | `beginWorkout()` | — |
| `finish-workout` | `finishWorkout()` | — |
| `toggle-focus` | `toggleFocusMode()` | — |
| `stop-rest` | `stopRestTimer()` | — |
| `focus-prev` | `focusPrev()` | — |
| `focus-next` | `focusNext()` | — |
| `focus-prev-block` | `focusPrevBlock()` | — |
| `focus-next-block` | `focusNextBlock()` | — |
| `toggle-round` | `toggleRound(blockId, round, checked)` | `data-block-id`, `data-round`, `data-checked` |

Tutte le SACRED functions vengono INVOCATE dal delegate senza modifiche alla loro implementazione.

### 2.4 Focus view navigation — data-action

Tutti gli `onclick` inline in `focusView()` sostituiti da `data-action`:

- `focusPrev()`, `focusNext()`, `focusPrevBlock()`, `focusNextBlock()` → data-action rispettivi
- `finishWorkout()` (bottone "✓ Fine sessione") → `data-action="finish-workout"`
- `toggleRound(id, round, !cur)` → `data-action="toggle-round" data-block-id="..." data-round="..." data-checked="true|false"`

**Bottoni disabled preservati:** `<button disabled style="opacity:.4">` invariato — il delegate salta i disabled.

**focusSingleBody / focusRoundBody:** INTATTE. Contengono chiamate a `setRow(...)` che genera HTML con `onclick="bumpKg/bumpReps/toggleExerciseSet(...)"` inline. Questi rimangono per Step 5b (vedi §6).

---

## 3. INVARIANTI PRESERVATE

### 3.1 Business logic — 38 marker SACRE

Verifica automatica su marker sacre:
`logFor`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`, `fillMissingFromPrevious`, `persistActive`, `fit-circuit-tracker-v18-optional-day`, `indexedDB.open` → **38 occorrenze** (era 39 in Step 3-4).

**Delta -1 spiegazione:** in Step 4 il conteggio 39 includeva `onclick="finishWorkout()"` letterale come 1 occorrenza aggiuntiva. Ho rimosso quel literal string (sostituito con `data-action="finish-workout"`), quindi il conteggio testuale scende. La FUNZIONE `finishWorkout` resta definita e chiamabile (dal delegate). Nessuna business logic è stata rimossa.

Verifica funzionale: tutte le 7 funzioni sacre restano definite (grep `^async? function (name)` → tutte presenti).

### 3.2 State model

- `S.active`: invariato — struttura + startedAt + exerciseLogs + rounds intatti.
- `S.focus`: invariato — `{on, blockIdx, round}`.
- `S.timer`: invariato — `{end, label}`.
- `S.tick`, `S.sessionTick`: invariati.

### 3.3 Funzioni non toccate

`setRow`, `bumpKg`, `bumpReps`, `toggleExerciseSet`, `roundChip`, `workoutBlock`, `exerciseCard`, `focusSingleBody`, `focusRoundBody`, `toggleFocusMode`, `focusPrev`, `focusNext`, `focusPrevBlock`, `focusNextBlock`, `toggleRound`, `blockAllDone`, `blockRoundDone`, `beginWorkout`, `finishWorkout`, `startRestTimer`, `stopRestTimer`, `startSessionTimer`, `stopSessionTimer`, `sessionTime`, `updateRestTimerOnly`, `updateSessionTimerOnly`, `persistActive`, `saveSetLog`, `saveBlockInputs`, `saveAllActiveInputs`, `fillMissingFromPrevious`, `parseRestToSeconds`.

### 3.4 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — invariato.

### 3.5 DOM IDs preservati

- `#sessionTimerText` — dentro `.workoutStatusBar` (aggiornato da `updateSessionTimerOnly` ogni sec)
- `#restTimerTime` — iniettato dentro `.c-floatingTimer__time` via string replace (aggiornato da `updateRestTimerOnly` ogni sec)
- `#kgVal_*`, `#repsVal_*` — invariati dentro `setRow` (aggiornati da `bumpKg`/`bumpReps`)
- `#fileImport`, `#modalHost` — invariati (fuori scope)

### 3.6 Onclick inline preservati (fuori scope Step 5)

Confermati con grep — tutti fuori dal shell workout:
- `setRow` (SACRED): `onclick="toggleExerciseSet(...)"`, `bumpKg/bumpReps` — Step 5b
- `stats()` view (Progressi): `onclick="go('home')"` — Step 6
- `data()` view (Profilo): `onclick="openSelectSheet/saveSyncConfig/clearSyncConfig/syncToRemote/restoreFromRemote/exportAll/confirmReset/openResumeModal"` — Step 8
- Modal handlers: `onclick="closeModal/openDurationModal/closeSessionNow/resumeSession/discardSession/saveManualDuration"` — Step 8/9

---

## 4. VERIFICA MANUALE

### 4.1 Workout empty state

- [ ] Nessuna sessione attiva → tab Workout → `EmptyCard` icona dumbbell "Nessuna giornata aperta"
- [ ] Tap "Vai in Home" → naviga a Home (tab Home attiva in BottomNav)
- [ ] Nessun errore console

### 4.2 Workout header attivo

- [ ] Da Home → Scegli allenamento → giorno con blocchi → naviga a Workout
- [ ] Header viola gradient (`.c-workoutHeader`) con eyebrow, titolo grosso (day.label), progress "0/N serie · 0%"
- [ ] Actions row: focus button + INIZIO button (variant primary)
- [ ] Status bar sotto: session timer "00:00" a sinistra, barra progresso vuota a destra
- [ ] Tap INIZIO → session timer inizia da 00:00 → aggiorna ogni secondo → header eyebrow/progress restano statici (aggiornati solo su re-render)

### 4.3 CompleteButton finale

- [ ] Dopo tap INIZIO, in fondo alla view appare bottone `CompleteButton` "Termina sessione" (gradient success)
- [ ] Il bottone finale sostituisce il vecchio "Fine" nell'header (regressione visiva accettata)
- [ ] Tap "Termina sessione" → `finishWorkout()` → naviga a Progressi (Step 3 route)

### 4.4 Focus mode navigation

- [ ] Tap focus toggle → passa in Focus Mode
- [ ] Focus button ora ha variant `primary` (evidenziato attivo)
- [ ] Bottoni ◀ Blocco prec. / Blocco succ. ▶ funzionano (data-action)
- [ ] Bottoni ◀ Giro prec. / Giro succ. ▶ funzionano (data-action)
- [ ] Bottone "○ Chiudi giro X" → toggleRound(bId, r, true) → segno serie di quel giro come done + start rest timer
- [ ] Bottone "✓ Giro X completato" → toggleRound(bId, r, false) → rimuove done
- [ ] Bottone "✓ Fine sessione" (last block done) → `finishWorkout()`
- [ ] Bottone toggle focus di nuovo → esce dal focus, torna a workoutBlock accordions

### 4.5 FloatingTimer (rest)

- [ ] Chiudi un giro in focus mode → apparire FloatingTimer in basso fixed
- [ ] Timer count-down aggiorna ogni secondo (`#restTimerTime` inside `.c-floatingTimer__time`)
- [ ] Stop button (fondo dx dello shell) → `stopRestTimer()` → timer sparisce
- [ ] Countdown a zero → `stopRestTimer(true)` automatico → timer sparisce + re-render
- [ ] Icona play accanto al tempo, label "Recupero"

### 4.6 Business logic regression

- [ ] Nuovo workout con bumpKg (dentro setRow) → valore persiste in `S.active.exerciseLogs` (verifica DevTools → localStorage/IndexedDB)
- [ ] toggleExerciseSet in blocco Single → done + start rest → funzionante
- [ ] toggleRound in blocco Circuit → tutti gli esercizi di quel giro segnati done → funzionante
- [ ] Focus auto-advance dopo close round (last exercise) → focus.blockIdx++ o focus.round++ → invariato
- [ ] finishWorkout con missing kg → fillMissingFromPrevious → banner rosso su set mancanti → invariato
- [ ] Resume Modal a metà sessione → invariato
- [ ] Discard/Chiudi ora dal Profilo → invariato

### 4.7 Tema + A11y

- [ ] `UI.setTheme('amoled')` da console → header viola gradient resta viola (usa var(--gradient-workout) che è indipendente dal tema effective — verifica)
- [ ] Focus visibile con Tab keyboard su tutti i data-action buttons
- [ ] `#sessionTimerText` con `role="timer" aria-live="polite"` → screen reader annuncia i cambiamenti
- [ ] `.c-floatingTimer` con `role="status" aria-live="polite" aria-atomic="true"` (dal componente)
- [ ] `.c-workoutHeader__title` è `<h1>` (dal componente) — accessibility landmark
- [ ] Reduced motion: durations 0 via tokens (Foundation)

### 4.8 PWA / cache

- [ ] SW `sw.js` v12 invariato
- [ ] Se cache serve vecchio app.js: DevTools → Application → Service Workers → Unregister + hard reload

### 4.9 Dead code (accettato in Step 5)

Classi ora orfane (nessun elemento DOM le matcha nel workout attivo):
- `.workoutHead` (era usata solo dentro `workout()`)
- `.timerDock`, `.timerDock .muted` — usate ancora nel fallback path (senza UI.FloatingTimer)
- `.timerTime` — usata ancora nel fallback path

**Ancora usate** in Step 5:
- `.sessionTimer` (styles.css:513) — riapplicata dentro `.workoutStatusBar`
- `.bar`, `.bar i` (styles.css:239,247) — riapplicate dentro `.workoutStatusBar`
- `.setDoneBtn`, `.setBlock`, `.setHead`, `.setLabel`, `.setDoneMark`, `.pickerGrid`, `.pickerWrap`, `.pickerLabel`, `.stepper`, `.stepBtn`, `.stepVal`, `.stepNote`, `.setRows`, `.exerciseCard`, `.exHead`, `.circuitBlock`, `.roundPanel`, `.roundChecks`, `.roundChip`, `.pill`, `.pillDone`, `.focusCard`, `.focusHead`, `.focusStep`, `.focusTitle`, `.focusMeta`, `.focusProgress`, `.focusProgressBar`, `.focusProgressText`, `.focusExHead`, `.focusExRow`, `.focusExInfo`, `.focusExList`, `.focusNav`, `.targetRep` — tutte usate ancora dentro `setRow`/`workoutBlock`/`exerciseCard`/`focusSingleBody`/`focusRoundBody` (INTATTI)

Cleanup completo styles.css → Step 12.

---

## 5. ROLLBACK

Livello L1 (revert Step 5 mantenendo Step 1-4):

```bash
git checkout HEAD -- app.js
```

Zero impatto su dati: IndexedDB non toccato. `styles.css`, `index.html`, `sw.js`, `manifest.json`, `components/*` non toccati in Step 5.

**Verifica post-rollback:** refresh browser → Workout torna al layout `.workoutHead` inline + `.timerDock` legacy.

---

## 6. STEP 5B — DEFERITO (richiede autorizzazione esplicita)

### 6.1 Cosa NON è stato fatto in Step 5 e perché

Le seguenti adozioni dei componenti erano nello scope §6 di HOME_REPORT ma **richiedono modifica di `setRow`** (marcato SACRED nella stessa lista):

| Componente | Blocco | Motivo del deferral |
|-----------|--------|---------------------|
| `UI.WeightPicker` | dentro `setRow` | Sostituire lo stepper KG richiede riscrivere setRow + adattare `bumpKg` per callback del picker (o preservare IDs `#kgVal_*`) |
| `UI.RepsPicker` | dentro `setRow` | Sostituire lo stepper REPS richiede riscrivere setRow + adattare `bumpReps` |
| `UI.ExerciseCard` | dentro `workoutBlock` → `exerciseCard` | Sostituire la Card esercizio richiede refactor `exerciseCard`, che chiama `setRow` |
| `UI.RestScreen` | in Focus Mode dopo close round | Sostituire il rest FloatingTimer con un layer fullscreen dentro focus richiede design decision + touch di `focusView`/`toggleRound` (SACRE) |
| `UI.NextExercise` | in Focus Mode preview | Aggiungere preview prossimo esercizio richiede touch a `focusView` |
| `UI.ProgressRing` | in header o Focus | Sostituire la `.bar` con ring richiede touch a `workout()` o `focusView` — potenzialmente fattibile ma non prioritario |

**Conflitto scope originale:** HOME_REPORT §6 elenca `setRow` sia come SACRED (da NON toccare) sia implicitamente refattorizzabile (per usare WeightPicker/RepsPicker). Interpretazione conservativa scelta: **non toccare setRow senza estensione esplicita dello scope da parte dell'utente.**

### 6.2 Proposta Step 5b (da autorizzare)

**Scope proposto per Step 5b Inner Workout:**
1. Refactor `setRow` per usare `UI.WeightPicker` + `UI.RepsPicker`
2. Adattamento `bumpKg`/`bumpReps` per:
   - Opzione A: callback picker via `mountWeightPicker/mountRepsPicker` (preserva state locale del picker, richiede mount N volte per view)
   - Opzione B: preservare IDs `#kgVal_*`/`#repsVal_*` iniettandoli nel HTML del picker via string replace (come `#restTimerTime`) — meno invasivo
3. Refactor `exerciseCard` per usare `UI.ExerciseCard` (opzionale — la struttura corrente funziona)
4. Refactor `toggleExerciseSet` → data-action con `data-block-id`, `data-exercise-id`, `data-set-no`, `data-checked` (rimuove ultimo onclick inline nel workout scope)
5. Refactor `roundChip` → checkbox con data-action delegation (richiede `change` event delegate)
6. Refactor `workoutBlock` `<details ontoggle>` → delegation su `toggle` event

**Cosa NON farebbe Step 5b:**
- Nessun cambio a business logic pura (`beginWorkout`, `finishWorkout`, `toggleRound`, `blockAllDone`, `blockRoundDone`, `startRestTimer/stopRestTimer`, `persistActive`)
- Nessun cambio a IndexedDB
- Nessun cambio a `focusPrev/Next/PrevBlock/NextBlock` (già delegated in Step 5)

### 6.3 Alternative

- **Skip Step 5b** — accettare che i pickers/ExerciseCard non vengano adottati. Il workout scope si dice "completato" con quello che è stato refattorizzato in Step 5.
- **Passare a Step 6 Stats/Progressi** — refactor di `stats()` con `StatisticCard`/`HistoryCard`/`RecordCard`/`GoalCard`/`WeeklyChart`/`MonthlyChart`/`ProgressChart`. Nessuna sovrapposizione con setRow.

---

## 7. GATE PER STEP 6 (Progressi redesign) O STEP 5B

Prossimo step può iniziare SE:

- ✅ Checklist §4.1-§4.8 completa (utente)
- ✅ 0 errori in console (in particolare nessun `Cannot read/set properties of null` su `data-action` handlers workout, `beginWorkout`, `finishWorkout`, `focusPrev/Next`, `toggleRound`)
- ✅ Session timer aggiorna ogni secondo (`#sessionTimerText`)
- ✅ Rest timer aggiorna ogni secondo (`#restTimerTime` iniettato in `.c-floatingTimer__time`)
- ✅ `finishWorkout` porta a Progressi
- ✅ `toggleFocusMode` toggle funziona

**Cosa farà Step 6 (Progressi redesign):**
1. Refactor `stats()` per usare `StatisticCard` (kpi) + `WeeklyChart` / `MonthlyChart` / `ProgressChart` per grafici
2. `HistoryCard` per la lista "Ultime sessioni"
3. `RecordCard` per Personal Records
4. `EmptyCard` per lo stato "Nessun allenamento ancora"
5. Convertire onclick `go('home')` → `data-action="go-home"` (già supportato)
6. NON toccare business logic (`completedSessions`, `sessionVolume`, `sessionSetsDone`, `streakDays`, `topPRs`, `recentSessions`, `isoDayKey`, `sessionLabel`, `fmtShortDate`, `fmtDurShort`, `fmtNum`)
7. NON toccare `data()` (Profilo) — Step 8

**Cosa NON farà Step 6:**
- Nessun cambio a DB schema
- Nessun tocco a service worker (Step 12)
- Nessun tocco a styles.css bonify (Step 12)

**Oppure autorizzare Step 5b** con lo scope elencato in §6.2.

---

## 8. STATO

✅ **Step 5 Workout (shell esterno) COMPLETATO** — header + finale via componenti, event delegation esteso a 9 nuove azioni workout, FloatingTimer per rest timer, business logic e IndexedDB invariati.

🛑 **STOP**. Attesa autorizzazione utente per una delle 3 opzioni:
- **A)** Step 5b Inner Workout (setRow + pickers + inner CTAs)
- **B)** Step 6 Progressi
- **C)** Skip Step 5b, andare direttamente a Step 6/altro
