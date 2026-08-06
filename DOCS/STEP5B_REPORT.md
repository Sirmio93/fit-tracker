# STEP5B_REPORT — Inner Workout redesign

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 5b (Inner Workout: WeightPicker · RepsPicker · ExerciseCard · RestScreen · NextExercise · ProgressRing)
**Prerequisito:** [WORKOUT_REPORT.md](WORKOUT_REPORT.md) completato — Step 5 shell esterno approvato.

---

## 0. TL;DR

- **6 componenti UI integrati** nel layer di rendering di Workout: `WeightPicker`, `RepsPicker`, `ExerciseCard` (via `Card` variant=exercise), `RestScreen`, `NextExercise`, `ProgressRing`.
- **Pattern Adapter/Facade** applicato ovunque la business logic andasse toccata: nessuna funzione SACRA modificata nella firma o nel comportamento.
- **Business logic INTATTA** — `bumpKg`, `bumpReps`, `toggleExerciseSet`, `toggleRound`, `logFor`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`, `persistActive`, `saveSetLog`, `saveBlockInputs`, `saveAllActiveInputs`, `startRestTimer`, `stopRestTimer`, `updateRestTimerOnly`, `startSessionTimer`, `stopSessionTimer`, `updateSessionTimerOnly`, `blockAllDone`, `blockRoundDone`, `parseRestToSeconds`, `toggleFocusMode`, `focusPrev/Next/PrevBlock/NextBlock`, `fillMissingFromPrevious` — tutte identiche.
- **IndexedDB** — DB `fit-circuit-tracker-v18-optional-day` v2, schema, stores, index → invariati.
- **Data model** — `Card/Week/Day/Block/Exercise/Session/Log` → invariati.
- **Firme pubbliche invariate** — `setRow(b, bi, id, setNo, t)`, `exerciseCard(b, bi, id, rounds)`, `workoutBlock(b, bi)`, `roundChip(b, round)`, `focusView(x, done, total)`, `focusSingleBody(b, bi, rounds)`, `focusRoundBody(b, bi, round)`, `timerDock()` → tutte identiche.
- **Zero inline onclick / onchange / ontoggle nel workout scope** — tutti migrati a event delegation su `#view` (click + change + toggle capture).
- **1 nuova funzione helper** aggiunta: `nextExerciseInfo(x, bi, round)` — pura, side-effect-free, calcola le info del "prossimo esercizio/giro/blocco" per `NextExercise`.

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | ~+120 / -25 | Refactor rendering: setRow, exerciseCard, workoutBlock, roundChip, focusView, timerDock; +delegation picker/toggle-set/change round/toggle details; +nextExerciseInfo; +ProgressRing statusBar; +RestScreen focus |

**File NON toccati in Step 5b:**
- [index.html](../index.html) — invariato dopo Step 3
- [styles.css](../styles.css) — invariato (le nuove classi CSS `.c-picker`, `.c-restScreen`, `.c-nextExercise`, `.c-progressRing`, `.c-card--exercise` sono fornite da `components/index.css`)
- [components/**/*.js](../components/) — usati as-is
- [sw.js](../sw.js), [manifest.json](../manifest.json), [components/Foundation/tokens.css](../components/Foundation/tokens.css) — invariati
- IndexedDB, `S`, business logic, tutte le funzioni SACRE — invariate

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 Event delegation estesa — `mountViewDelegation()` [app.js:167](../app.js#L167)

Aggiunte 3 tipologie di handler nuove:

**A. Click delegation su picker `+ / -`** — [app.js:171-186](../app.js#L171)
```
e.target.closest('[data-picker-dir]')
   → estrae .pickerWrap[data-picker-kind]
   → weight → bumpKg(blockId, exId, setNo, ±2.5, bi)
   → reps   → bumpReps(blockId, exId, setNo, ±1, bi)
```
Il click delegate viene eseguito PRIMA del click delegate per `[data-action]`. Se il target è un picker button, il flusso ritorna subito. Altrimenti prosegue.

**B. Click delegation su `toggle-set`** — [app.js:204](../app.js#L204)
`data-action="toggle-set"` con `data-block-id`, `data-exercise-id`, `data-set-no`, `data-checked` → `toggleExerciseSet(...)`.

**C. Change delegation su round checkbox** — [app.js:207-213](../app.js#L207)
`data-change-action="toggle-round-check"` con `data-block-id`, `data-round` → `toggleRound(blockId, round, el.checked)`.

**D. Toggle delegation su `<details>` in capture phase** — [app.js:214-221](../app.js#L214)
`<details data-block-id="...">` toggle event catturato in capture phase (`toggle` è non-bubbling ma i listener capture sugli ancestor ricevono comunque l'evento) → aggiorna `window.OPEN_BLOCKS`.

**Motivazione capture phase:** `toggle` event ha `bubbles=false` per spec HTML, quindi listener bubble-phase su `#view` non lo riceverebbero. Il capture phase, per spec DOM, viene comunque traversato anche per eventi non-bubbling, quindi il listener su ancestor cattura correttamente. È un pattern documentato e supportato in tutti i browser moderni.

### 2.2 `setRow(b, bi, id, setNo, t)` — [app.js:729](../app.js#L729)

**Firma:** identica.
**Comportamento esterno:** identico (returns HTML string, mutamento stato via `bumpKg`/`bumpReps` invariato).
**Interno rifatto:**
- Rendering picker delegato a `UI.WeightPicker({value, unit:'kg', step:2.5, min:0, max:500, ariaLabel})` e `UI.RepsPicker({value, step:1, min:0, max:100, ariaLabel})`.
- **Adapter:** il template HTML del picker viene modificato via `.replace()` per iniettare `id="kgVal_<bi>_<id>_<setNo>"` e `id="repsVal_<bi>_<id>_<setNo>"` sulla `.c-picker__value`. Questi ID sono richiesti da `bumpKg`/`bumpReps` (`document.getElementById(...)`) per aggiornare il display senza render() completo.
- **Adapter classe hint:** se `curKg==0 && prevKg>0`, viene iniettata la classe `hint` sulla `.c-picker__value` insieme all'ID (idempotente con `bumpKg` che chiama `el.classList.remove('hint')`).
- **Adapter fallback per display "—":** WeightPicker rende `formatWeight(0)="0"`, RepsPicker rende `esc(value)`. Un secondo `.replace()` sostituisce il testo interno con `kgTxt` (che vale `'—'` quando `displayKg<=0`) o `repsTxt`, così l'UX legacy è preservata.
- **Wrapper `.pickerWrap`:** contiene i data-attrs richiesti dalla delegation:
  ```
  data-picker-kind="weight|reps"
  data-block-id, data-exercise-id, data-set-no, data-bi
  ```
  Mantiene anche la classe legacy `pickerWrap` (usata da `bumpKg`'s `.closest('.pickerWrap')` per rimuovere `.missing`).
- **Fallback graceful:** se `UI.WeightPicker` non disponibile (edge case), rende lo stepper legacy con `data-picker-dir` per continuare a funzionare via delegation.

**Zero cambi ai side-effect:** `bumpKg`/`bumpReps` continuano a fare esattamente lo stesso lavoro sul log.

### 2.3 `exerciseCard(b, bi, id, rounds)` — [app.js:823](../app.js#L823)

**Firma:** identica.
**Interno:** ora avvolto in `UI.Card({variant:'exercise', eyebrow, title, extra})`. Lo slot `extra` contiene il chip target-reps (allineato a destra) + le setRows generate da `setRow` (invariato).

**Motivazione:** `UI.ExerciseCard` "puro" è una card read-only con lista set statica (formattata `Set N — 12 × 40 kg`). Non ha slot per steppers editabili né callback. Usare direttamente `UI.Card` con `variant:'exercise'` fornisce le stesse classi CSS (`.c-card`, `.c-card--exercise`) e permette di iniettare i setRows interattivi via `extra`. Questa è la strada canonica per composizione: `ExerciseCard.js` stesso è implementato come `Card({variant:'exercise', extra: rows})`.

**Fallback graceful:** se `UI.Card` non disponibile, rende il markup legacy `.exerciseCard/.exHead/.setRows`.

### 2.4 `workoutBlock(b, bi)` — [app.js:672](../app.js#L672)

**Firma:** identica.
**Interno:** una sola modifica minima — rimosso `ontoggle="window.OPEN_BLOCKS[this.open?'add':'delete']('${b.id}')"`, sostituito da `data-block-id="${esc(b.id)}"`. Il listener di delega in `mountViewDelegation` gestisce l'aggiornamento di `window.OPEN_BLOCKS` in capture phase.

### 2.5 `roundChip(b, round)` — [app.js:829](../app.js#L829)

**Firma:** identica.
**Interno:** rimosso `onchange="toggleRound('${b.id}',${round},this.checked)"`, sostituito da:
```
data-change-action="toggle-round-check"
data-block-id="${esc(b.id)}"
data-round="${round}"
```
Il change delegate sul `#view` risolve → `toggleRound(blockId, round, el.checked)`.

### 2.6 `focusView(x, done, total)` — [app.js:551](../app.js#L551)

**Firma:** identica.
**Interno rifatto per Focus Mode:**

- **A. Body condizionale (RestScreen vs bodyMain):**
  - Se `S.timer` attivo E `UI.RestScreen` disponibile → il body principale del focus card è un `UI.RestScreen({time, label})` con `id="restTimerTime"` iniettato via `.replace()` sulla `.c-restScreen__time` così che `updateRestTimerOnly()` (invariato) continui a funzionare aggiornando il testo ogni secondo.
  - Altrimenti → `focusSingleBody(b, bi, rounds)` o `focusRoundBody(b, bi, round)` come prima (invariati).

- **B. NextExercise preview:**
  - Sempre visibile in Focus Mode (se disponibile): `UI.NextExercise({title, eyebrow, progress})` mostra il "prossimo blocco" o "prossimo giro" calcolato da `nextExerciseInfo(x, bi, round)` — una pura funzione side-effect-free aggiunta subito dopo `focusView`.
  - `progress` = `Math.round(done/total*100)`.

- **C. `closeRoundBtn` condizionale:**
  - Il bottone "○ Chiudi giro N (rest Xs)" viene mostrato solo se NON è già in corso un rest (`!S.timer`). Durante il rest, `RestScreen` occupa il body e il bottone di chiusura giro perde senso semantico.

- **D. Bottone stop-rest esplicito:**
  - Se `S.timer` attivo, appare un bottone "Ferma recupero" `data-action="stop-rest"` sotto il RestScreen — permette all'utente di skippare il recupero senza dover cercare il FloatingTimer.

### 2.7 `nextExerciseInfo(x, bi, round)` — [app.js:632](../app.js#L632)

**NUOVA funzione pura**, side-effect-free.
Ritorna `{title, eyebrow}` per il "prossimo esercizio/giro/blocco" a partire dal blocco corrente e giro corrente:
- Se `isSingle` → prossimo blocco (nome + primo esercizio).
- Se multi-esercizio e `round < rounds` → "Prossimo giro N+1/rounds".
- Se ultimo giro di blocco multi-esercizio → prossimo blocco (nome + primo esercizio o "Giro 1/rounds").
- Se ultimo blocco ultimo giro → `null` (NextExercise viene omesso).

**Motivazione:** funzione di rendering derivata, non tocca `S` né `Store`. Isolata per testabilità futura.

### 2.8 `timerDock()` — [app.js:898](../app.js#L898)

**Firma:** identica.
**Interno:** aggiunta una singola condizione all'inizio:
```js
if (S.focus && S.focus.on && window.UI && window.UI.RestScreen) return '';
```
In Focus Mode con rest attivo, il body del focus card ospita già RestScreen (con `id="restTimerTime"` iniettato). Restituire FloatingTimer aggiungerebbe un DUPLICATO `id="restTimerTime"` nel DOM — invalido HTML e problematico per `document.getElementById`. La condizione previene il conflitto.

**Fallback:** in modalità non-focus, `timerDock()` continua a rendere `UI.FloatingTimer` come prima (Step 5).

### 2.9 `workout()` — [app.js:399](../app.js#L399) — statusBar con ProgressRing

**Firma:** identica.
**Modifica:** aggiunta di `UI.ProgressRing({progress: pct, size: 40, stroke: 5, showLabel: false, ariaLabel: 'N di M serie'})` nella `.workoutStatusBar`, tra `#sessionTimerText` e la barra progresso legacy. Il ring piccolo (40px, stroke 5) è complementare alla bar orizzontale, fornisce un indicatore visivo compatto.

**Fallback graceful:** se `UI.ProgressRing` non disponibile, il ring è omesso.

---

## 3. ADAPTER / FACADE INTRODOTTI

Nessun cambio a firma pubblica delle funzioni SACRE. Tutti gli adapter agiscono sul layer di rendering:

### 3.1 Picker → bumpKg/bumpReps adapter

**Dove:** [app.js:171-186](../app.js#L171) (in `mountViewDelegation`).
**Cosa:** click sui bottoni `[data-picker-dir="inc|dec"]` dentro `.pickerWrap[data-picker-kind="weight|reps"]` vengono tradotti in chiamate ai SACRED `bumpKg(blockId, exId, setNo, ±2.5, bi)` / `bumpReps(blockId, exId, setNo, ±1, bi)` estraendo i data-attrs dal wrapper.
**Preserva:** step 2.5 (kg) e 1 (reps) identici a legacy. `bumpKg` continua a fare `Math.max(0, Math.round((cur+delta)*2)/2)`. `bumpReps` continua a fare `Math.max(0, Math.round(cur+delta))`.

### 3.2 Picker HTML → id injection adapter

**Dove:** [app.js:764-788](../app.js#L764) (in `setRow`).
**Cosa:** il markup di `UI.WeightPicker`/`UI.RepsPicker` non ha slot per ID custom sulla `.c-picker__value`. Via `.replace()` viene iniettato `id="kgVal_..."` / `id="repsVal_..."` così che `bumpKg`/`bumpReps` continuino a poter aggiornare il display via `document.getElementById(...)` tra un render() e l'altro.
**Preserva:** l'update DOM istantaneo di `bumpKg` (`el.textContent = next > 0 ? next : '—'`) senza `render()` completo — critico per la reattività percepita del picker.

### 3.3 RestScreen `#restTimerTime` id swap adapter

**Dove:** [app.js:568-579](../app.js#L568) (in `focusView`) + [app.js:900](../app.js#L900) (in `timerDock`).
**Cosa:** l'id `restTimerTime` (che `updateRestTimerOnly` cerca ogni secondo) è iniettato via `.replace()` sulla `.c-restScreen__time` di RestScreen quando in Focus Mode. `timerDock()` restituisce `''` in Focus Mode per non duplicare l'ID.
**Preserva:** `updateRestTimerOnly` (SACRO, non toccato) continua a funzionare identicamente: `document.getElementById('restTimerTime')` trova ora la RestScreen invece del FloatingTimer.

### 3.4 pickerWrap classe legacy adapter

**Dove:** [app.js:794-795](../app.js#L794) (in `setRow`).
**Cosa:** il wrapper mantiene la classe legacy `pickerWrap` (oltre ai data-attrs) così che `bumpKg`'s `.closest('.pickerWrap').classList.remove('missing')` continui a funzionare.
**Preserva:** la rimozione del flag `.missing` quando l'utente inserisce un kg > 0.

### 3.5 hint class conditional injection

**Dove:** [app.js:767, 783](../app.js#L767).
**Cosa:** quando `curKg==0 && prevKg>0`, la classe `hint` viene iniettata sulla `.c-picker__value` insieme all'ID. `bumpKg` continua a chiamare `el.classList.remove('hint')` — un'operazione idempotente (no-op se la classe non c'è).
**Preserva:** il feedback visivo "questo è il kg della sessione precedente, non ancora confermato".

### 3.6 `<details>` toggle → OPEN_BLOCKS capture-phase adapter

**Dove:** [app.js:214-221](../app.js#L214) (in `mountViewDelegation`).
**Cosa:** l'evento `toggle` non-bubbling viene catturato in capture phase su `#view`. Per `<details data-block-id="...">`, aggiorna `window.OPEN_BLOCKS`. Sostituisce l'inline `ontoggle="..."` senza modificare la logica di persistenza dello stato "aperto/chiuso".
**Preserva:** `workoutBlock` continua a leggere `window.OPEN_BLOCKS.has(b.id)` per decidere l'attributo `open` al render.

---

## 4. REGRESSIONI ESCLUSE

### 4.1 Business logic

Grep verifica: 38 occorrenze marker SACRE (identico allo Step 5). Funzioni definite:
`logFor` (711), `bumpKg` (799), `bumpReps` (816), `toggleExerciseSet` (876), `saveSetLog` (856), `saveBlockInputs` (878), `saveAllActiveInputs` (879), `toggleRound` (880), `beginWorkout` (847), `finishWorkout` (915), `resumeSession` (1266), `discardSession` (1301), `persistActive` (863), `fillMissingFromPrevious` (1418), `startRestTimer/stopRestTimer/updateRestTimerOnly` (897), `startSessionTimer/stopSessionTimer/sessionTime/updateSessionTimerOnly` (855), `blockAllDone` (671), `blockRoundDone` (829), `parseRestToSeconds` (31), `toggleFocusMode` (485), `focusPrev/Next/PrevBlock/NextBlock` (636/647/659/664), `Store` (17), `refresh` (18).

Nessuna modifica al corpo, tutte le firme identiche.

### 4.2 State model

- `S.active.exerciseLogs[]` — schema invariato (`blockId`, `exerciseId`, `setNo`, `kg`, `reps`, `done`, `updatedAt`).
- `S.focus` — invariato (`on`, `blockIdx`, `round`).
- `S.timer` — invariato (`end`, `label`).
- `S.missing` — invariato (mapping `<blockId>|<exId>|<setNo>` → bool).
- `window.OPEN_BLOCKS` — invariato (Set di block ids + `init_<id>` markers).

### 4.3 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — schema, stores (`cards`, `exercises`, `sessions`, `settings`), keyPath (`id`), operazioni Store → invariati.

### 4.4 Timer subsystem

- `startRestTimer(sec, label)` — invariato: crea `S.timer = {end, label}`, setInterval → `updateRestTimerOnly` ogni 1s, chiama `render()`.
- `stopRestTimer(r=true)` — invariato: clearInterval, `S.timer = null`, opzionale `render()`.
- `updateRestTimerOnly` — invariato: legge `document.getElementById('restTimerTime')`. Adesso l'ID è iniettato dinamicamente su RestScreen (in Focus Mode) o su FloatingTimer (altrimenti). Comportamento equivalente.
- `startSessionTimer` / `stopSessionTimer` / `updateSessionTimerOnly` — invariati.
- `sessionTime()` / `formatSec()` — invariati.

### 4.5 Persistence

- `persistActive(immediate)` — invariato. Autosave debounced 400ms, `immediate=true` bypass.
- Autosave delegates `['click', 'change', 'touchend', 'keyup']` su `document` — invariati.
- `visibilitychange`/`beforeunload` handlers — invariati.

### 4.6 Sync GitHub

- `loadSyncConfig`, `saveSyncConfig`, `clearSyncConfig`, `syncToRemote`, `restoreFromRemote`, `scheduleSync`, `renderSyncStatus` — non toccati.

### 4.7 Resume Modal + Duration Modal

- `checkIncompleteSessions`, `openResumeModal`, `closeModal`, `resumeSession`, `discardSession`, `closeSessionNow`, `openDurationModal`, `saveManualDuration` — non toccati (Step 9 scope).

---

## 5. TEST ESEGUITI (STATICI)

**5.1 Grep marker SACRE:** 38 occorrenze (identico a Step 5 post-shell). Nessun regresso.

**5.2 Grep onclick/onchange/ontoggle nel workout scope:** 0 occorrenze rimanenti.
Le occorrenze restanti nel file sono tutte in scope:
- `stats()` (Progressi) — Step 6 scope
- `data()` (Profilo) — Step 8 scope
- `openResumeModal`/`openDurationModal` — Step 9 scope

**5.3 Verifica firme pubbliche di rendering workout:**
```
setRow(b, bi, id, setNo, t)                 ← identica
exerciseCard(b, bi, id, rounds)             ← identica
workoutBlock(b, bi)                         ← identica
roundChip(b, round)                         ← identica
focusView(x, done, total)                   ← identica
focusSingleBody(b, bi, rounds)              ← identica (non toccata)
focusRoundBody(b, bi, round)                ← identica (non toccata)
timerDock()                                 ← identica (una condizione aggiunta)
workout()                                   ← identica (statusBar con ring)
```

**5.4 Verifica UI globale:** `window.UI` frozen, `UI.WeightPicker`, `UI.RepsPicker`, `UI.Card`, `UI.RestScreen`, `UI.NextExercise`, `UI.ProgressRing`, `UI.FloatingTimer`, `UI.WorkoutHeader`, `UI.CompleteButton`, `UI.EmptyCard`, `UI.Button` — tutti disponibili via `components/index.js` re-export.

**5.5 Verifica IndexedDB:** DB constant `fit-circuit-tracker-v18-optional-day`, v2, stores intatti (`cards`, `exercises`, `sessions`, `settings`).

---

## 6. VERIFICA MANUALE (checklist utente)

### 6.1 Picker peso (KG)

- [ ] Aprire una giornata, tap "INIZIO"
- [ ] Verificare che ogni serie mostri un `.c-picker--weight` (design Design Tokens: pill scuro con − VALORE + )
- [ ] Tap `+` → il kg aumenta di 2.5, la sessione autosalva, `l.kg` in `S.active.exerciseLogs` aggiornato
- [ ] Tap `−` → il kg diminuisce di 2.5, floor a 0
- [ ] Se sessione precedente esiste, il display mostra il kg prec (con classe `hint` — leggero opacity)
- [ ] Al primo tap `+` o `−`, l'hint sparisce (`el.classList.remove('hint')` in `bumpKg`)
- [ ] Se sessione precedente + max diverso → `<small class="stepNote">prec X · max Y kg</small>` visibile sotto il picker

### 6.2 Picker ripetizioni (REPS)

- [ ] Ogni serie mostra `.c-picker--reps` con − VALORE +
- [ ] Tap `+` → reps aumentano di 1
- [ ] Tap `−` → reps diminuiscono di 1, floor a 0 (display "—")
- [ ] Se target reps definito → `<small class="stepNote">target 12-15</small>` visibile

### 6.3 ExerciseCard (Card variant=exercise)

- [ ] In vista Blocchi (non-focus), ogni esercizio dentro un blocco è renderizzato come `.c-card.c-card--exercise` con eyebrow (target), title (nome esercizio), chip reps a destra, set rows sotto
- [ ] Comportamento invariato rispetto a setRow (steppers funzionanti)

### 6.4 workoutBlock (details toggle)

- [ ] `<details>` di ogni blocco: click sul summary apre/chiude
- [ ] Riaprire un blocco → riaprire pagina → il blocco resta aperto (persistenza via `window.OPEN_BLOCKS` aggiornato dal delegate capture-phase)
- [ ] Nessun errore in console tipo "OPEN_BLOCKS is not defined" o "Cannot read properties of null"

### 6.5 roundChip (change delegation)

- [ ] Sotto ogni blocco multi-esercizio, chip G1/G2/G3 checkbox
- [ ] Tap chip Gn → `toggleRound(blockId, n, true)` chiamato → tutti gli esercizi di quel giro marcati done, restart rest timer se sessione iniziata
- [ ] Untap chip Gn → `toggleRound(blockId, n, false)` chiamato → done rimosso, stop rest timer

### 6.6 Focus Mode + RestScreen

- [ ] Attivare Focus Mode (tap "◉ Focus" nel WorkoutHeader)
- [ ] Chiudere un giro → parte rest timer → il body del focus card mostra `.c-restScreen` con tempo grande (es. "00:45")
- [ ] Il tempo diminuisce ogni secondo (aggiornato via `updateRestTimerOnly` → `document.getElementById('restTimerTime')`)
- [ ] FloatingTimer NON è visibile in fondo (evita duplicato di id `restTimerTime`)
- [ ] Bottone "Ferma recupero" sotto RestScreen → tap → rest stoppato, torna al body normale
- [ ] Timer arriva a 0 → auto-stop → torna al body normale

### 6.7 Focus Mode + NextExercise

- [ ] In Focus Mode, sotto il body/rest, visibile un `.c-nextExercise` con eyebrow "Prossimo giro" o "Prossimo blocco" e title
- [ ] Su ultimo blocco ultimo giro → NextExercise omesso
- [ ] Progress ring dentro NextExercise mostra percentuale done/total

### 6.8 ProgressRing in Workout header/statusBar

- [ ] Aprire Workout (non-focus) → la workoutStatusBar mostra: session timer (MM:SS) + ProgressRing piccolo (40px) + barra orizzontale
- [ ] Chiudere serie → percentuale aggiornata (via render() dopo `toggleExerciseSet`/`toggleRound`)

### 6.9 Timer session (invariato)

- [ ] Session timer aggiorna ogni secondo tramite `#sessionTimerText` (updateSessionTimerOnly)
- [ ] Continua a funzionare in Focus Mode e in vista Blocchi

### 6.10 Rest timer (invariato)

- [ ] Timer aggiorna ogni secondo tramite `#restTimerTime` (updateRestTimerOnly)
- [ ] Se non-focus: `#restTimerTime` è sulla `.c-floatingTimer__time`
- [ ] Se focus: `#restTimerTime` è sulla `.c-restScreen__time`
- [ ] In entrambi casi, `document.getElementById('restTimerTime')` risolve → un elemento

### 6.11 Business logic (regression)

- [ ] Sequenza: startDay → INIZIA → bumpKg/bumpReps → toggleRound → RepeatN → finishWorkout → navigazione Progressi
- [ ] Sessione salvata correttamente in IndexedDB
- [ ] Volume totale calcolato: somma di `kg * repsNumber(reps)` per ogni log
- [ ] Resume Modal in caso di sessione aperta al reload
- [ ] Discard sessione dal Profilo → sessione marcata discarded, escluso da progressi
- [ ] fillMissingFromPrevious in `finishWorkout` funziona (missing markers → banner rosso)
- [ ] toggleExerciseSet su blocco Single → segna serie done → startRestTimer se startedAt
- [ ] persistActive debounced 400ms funziona

### 6.12 A11y

- [ ] Picker `aria-label="Peso serie N"` / `"Ripetizioni serie N"` letto da screen reader
- [ ] Bottoni picker `aria-label="Aumenta kg"` / `"Riduci kg"` etc.
- [ ] ProgressRing `aria-label="N di M serie"` (custom) o "62%" (default)
- [ ] RestScreen `role="status" aria-live="polite"` → il tempo viene annunciato
- [ ] Focus visibile con Tab su tutti i bottoni (picker, roundChip, closeRoundBtn, nav)

### 6.13 PWA / cache

- [ ] SW `sw.js` v12 invariato
- [ ] Se cache serve vecchio app.js: DevTools → Application → Service Workers → Unregister + hard reload

---

## 7. PUNTI RIMASTI INVARIATI

- **Data model:** Card/Week/Day/Block/Exercise/Session/Log — zero modifiche di schema.
- **IndexedDB:** DB name, versione, stores, index — zero modifiche.
- **Business logic:** tutte le funzioni SACRE — corpo invariato, firma invariata.
- **State machine:** `S.tab`, `S.active`, `S.focus`, `S.timer`, `S.missing`, `S.sheet`, `S.flow`, `S.cards`, `S.exercises`, `S.sessions`, `S.sync` — zero modifiche.
- **Route dispatcher `go(t)`:** invariato.
- **Sync GitHub:** invariato.
- **Modal Resume/Duration:** invariati (Step 9 scope).
- **Import/Export/Reset:** invariati.
- **Tema:** invariato (bridge Step 2, `S.theme`, `applyTheme`).
- **BottomNav:** invariata (Step 3).
- **Home + selection sheet:** invariati (Step 4).
- **WorkoutHeader + CompleteButton + FloatingTimer + EmptyCard:** invariati (Step 5 shell).

---

## 8. CONFRONTO CON IL BLUEPRINT

**Blueprint (WORKOUT_REPORT §6.2 + Step 5b user authorization):**

| Requisito | Stato | Nota |
|-----------|-------|------|
| WeightPicker adottato | ✅ | Adapter via `.replace()` per id injection + data-attrs wrapper per delegation |
| RepsPicker adottato | ✅ | Stesso pattern di WeightPicker |
| ExerciseCard adottato | ✅ | Via `Card({variant:'exercise'})` (stesso pattern usato da `ExerciseCard.js` stesso). `UI.ExerciseCard` puro non usato perché read-only |
| RestScreen adottato | ✅ | In Focus Mode + rest attivo, sostituisce body del focus card + swap id `restTimerTime` |
| NextExercise adottato | ✅ | In Focus Mode, sempre visibile sotto body, calcolato da `nextExerciseInfo()` |
| ProgressRing adottato | ✅ | Piccolo (40px) in workoutStatusBar accanto a session timer + bar; grande dentro NextExercise (via componente stesso) |
| setRow refactor | ✅ | Body rifatto, firma identica, adapter picker + id injection |
| bumpKg/bumpReps adapter | ✅ | Delegation su `[data-picker-dir]` → chiama funzioni SACRE identiche |
| toggleExerciseSet → data-action | ✅ | `data-action="toggle-set"` + data-attrs |
| roundChip → change delegation | ✅ | `data-change-action="toggle-round-check"` |
| workoutBlock ontoggle → delegation | ✅ | Capture-phase su `#view` per evento non-bubbling |
| Business logic invariata | ✅ | Zero modifiche a funzioni SACRE |
| IndexedDB invariato | ✅ | DB v2, schema stores index invariati |
| Data model invariato | ✅ | Card/Week/Day/Block/Exercise/Session/Log invariati |
| Firme pubbliche invariate | ✅ | setRow/exerciseCard/workoutBlock/roundChip/focusView/timerDock/workout: firme e side-effect esterni identici |
| Adapter/Facade dove necessario | ✅ | 6 adapter documentati in §3 |

**Deferiti a Step successivi (per esplicito scope):**
- `stats()` → Step 6 (Progressi redesign)
- `data()` → Step 8 (Profilo redesign)
- Modal Resume/Duration → Step 9
- Bonify CSS (dead classes: `.stepper`, `.stepVal`, `.stepBtn`) → Step 12

---

## 9. ROLLBACK

Livello L1 (revert Step 5b mantenendo Step 1-5):

```bash
git checkout HEAD -- app.js
```

Zero impatto su dati: IndexedDB non toccato. `styles.css`, `index.html`, `sw.js`, `manifest.json`, `components/*` non toccati in Step 5b.

**Verifica post-rollback:** refresh browser → workout torna al rendering di Step 5 (WorkoutHeader + FloatingTimer + CompleteButton, ma steppers legacy inline con `onclick`).

---

## 10. GATE PER STEP 6 (Progressi redesign)

Step 6 può iniziare SE:

- ✅ Checklist §6.1-§6.13 completa (utente)
- ✅ 0 errori in console (in particolare nessun `Cannot read properties of null` su `bumpKg`/`bumpReps`/`toggleExerciseSet`/`toggleRound`, e nessun warning HTML duplicate id `restTimerTime`)
- ✅ Session timer aggiorna ogni secondo (`#sessionTimerText`)
- ✅ Rest timer aggiorna ogni secondo (`#restTimerTime` — su FloatingTimer o su RestScreen a seconda del focus)
- ✅ `finishWorkout` porta a Progressi
- ✅ Picker peso/reps funzionanti (+/-, valore aggiornato, l.kg/l.reps salvati in `S.active`)
- ✅ Focus Mode entra ed esce; RestScreen appare durante rest in focus
- ✅ NextExercise mostra info coerenti col blocco/giro corrente

---

## 11. STATO

✅ **Step 5b Inner Workout COMPLETATO** — 6 componenti UI integrati via pattern Adapter/Facade, business logic e IndexedDB invariati, firme pubbliche identiche.

🛑 **STOP**. Attesa approvazione utente prima di procedere a Step 6 (Progressi).
