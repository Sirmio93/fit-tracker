# 05_WORKOUT_SCREEN.md

Versione 4.0 (Sprint 4 · 2026-08-05)

---

# Filosofia

Durante l'allenamento l'utente NON deve navigare.

Deve solo allenarsi.

Ogni distrazione deve essere eliminata.

La schermata deve mostrare esclusivamente ciò che serve in quel momento.

Obiettivo: registrare una serie in meno di 3 secondi.

---

# Decisioni Sprint 4 (2026-08-05)

Approvate dall'utente e vincolanti per ogni futura modifica al Workout.

1. **Focus-first come default**: all'avvio di ogni workout `S.focus.on = true`. La Vista Completa resta accessibile via bottone esplicito nel WorkoutHeader (`toggle-focus`), utile solo per revisione. Nessuna modifica alla business logic (Focus Mode è puramente layer di presentazione).
2. **Rest Screen fullscreen overlay vero**: quando `S.timer` è attivo, l'overlay `#restOverlayRoot` copre l'intera UI con scrim dim + blur. Il workout dietro resta attivo ma non interagibile (`pointer-events: none` gestito via classe `body.has-rest-overlay`). Timer resta fonte della verità.
3. **WeightPicker / RepsPicker sul set attivo (Single block)**: nella Focus Mode single-block, solo il primo set non completato usa i picker touch-first. Le serie precedenti/successive appaiono come chip compatti readonly. Nei Circuit/Superset i picker restano attivi per tutti gli esercizi del giro corrente (semantica del circuito: esecuzione in sequenza senza pausa).
4. **Summary celebrativo**: nuova schermata `summaryV4` con badge di successo animato + 3 KPI (Volume/Serie/Durata) + card "Nuovi Personal Record" (solo se ne esistono davvero) + CTA primaria "Fine allenamento" + CTA secondaria "Condividi · in arrivo" (disabilitata, layout già predisposto). Nessuna modifica al modello dati; PR calcolati puramente da `S.sessions`.

---

# Vincoli

NON modificare:

- Business Logic (`beginWorkout`, `finishWorkout`, `toggleExerciseSet`, `toggleRound`, `startRestTimer`, `logFor`, `persistActive`)
- IndexedDB `fit-circuit-tracker-v18-optional-day` v2
- Modello dati (S shape, exerciseLogs, sessions)
- Algoritmi (progressione, calcolo volume, streak, PR)
- Persistenza (Store.put, refresh)
- Timer (S.timer fonte della verità, tick a 250ms per fluidità overlay ring)

Sostituire esclusivamente:

- Rendering (workout(), focusView(), summary())
- Componenti (integrazione WorkoutHeader/RestScreen/CompleteButton/NextExercise/ProgressRing/WeightPicker/RepsPicker)
- Layout (workoutV4 focus/vista completa, restOverlay panel, summaryV4 hero+kpi+pr+cta)
- Animazioni (fadeUp/fadeSlide/pulseActive/panelIn/badge-pop) — tutte GPU-friendly
- Microinterazioni (transizioni FAB, ring countdown fluido, badge pop)

---

# Struttura sequenziale (Focus-first)

WorkoutHeader (eyebrow settimana · giorno, titolo giornata, azioni Focus/Vista + INIZIO)

↓

Status Bar (timer sessione · barra progresso · %)

↓

Focus Card

- ProgressRing sessione + step "Blocco X/N · Giro Y/M"
- Hero esercizio (eyebrow muscolo, titolo nome, chip Target reps · Rest s)
- Set list (single) o Exercise list (circuit)
- Close-round CTA (solo circuit)
- NextExercise preview
- Nav prev/next

↓

Rest Overlay (fullscreen, appare quando S.timer ≠ null)

---

# WorkoutHeader

Contenuto:

- eyebrow: `<Settimana> · <nome giorno>`
- title: label giornata
- progress: `<done>/<total> serie · <pct>%`
- actions: bottone "◉ Focus" / "☰ Vista completa" (variant ghost sm) + "INIZIO" (variant primary sm, solo se non ancora startedAt)

Componente esistente: `WorkoutHeader({eyebrow, title, progress, actions})`.

---

# Focus Card

Focus View è un'unica card `focusCard` composta da:

**1. Ring Wrap** — ProgressRing 84px + info step "Blocco X/N · Giro Y/M" + "done/total serie".

**2. Hero esercizio (Single)** — eyebrow muscolo, titolo nome esercizio, chip "Target N reps" + chip "Rest Ns".

**Hero blocco (Circuit)** — eyebrow "Circuito", titolo label blocco, chip tipo + chip "Rest Ns a fine giro".

**3. Body**:

- **Single block**: N serie renderizzate come:
  - Serie attiva (`activeSetInSingle`): `setRow(...)` completo con WeightPicker + RepsPicker + CTA "Segna serie"
  - Altre serie: `setRowCompact(...)` chip readonly (mark ✓/○, label "Serie N", valore `<kg> × <reps>` o target)
- **Circuit / Superset**: M esercizi del giro corrente, ognuno con head (idx `i/M` + info esercizio + target) + `setRow(...)` completo

**4. Close-round CTA** — solo Circuit — `focusCloseRound` bottone gradient primary/secondary con "Chiudi giro X · rest Ys".

**5. NextExercise preview** — `NextExercise({title, eyebrow, progress})` mostra prossimo giro/blocco.

**6. Nav prev/next** — bottoni `focusNavBtn` per navigare blocchi/giri. All'ultima azione → CompleteButton "Fine sessione".

---

# Rest Screen (Fullscreen Overlay)

Attivo quando `S.timer` è non null e `window.UI.RestScreen` è disponibile.

Layer: `#restOverlayRoot` (nel body, fuori da `#view`).

Composizione (`.c-restOverlay`):

- `.c-restOverlay__scrim` — dim `color-mix(--color-background 82%, transparent)` + `backdrop-filter: blur(18px) saturate(140%)`
- `.c-restOverlay__panel` — card centrata max-width 480px con:
  - Label "RECUPERO" o `S.timer.label` (uppercase, primary)
  - Timer wrap: ProgressRing 220px (aria-label="Progresso recupero") + tempo grande centrato `#restTimerTime` (64→80px tabular-nums)
  - Next info: eyebrow "Prossima serie / Prossimo giro / Prossimo blocco" + titolo esercizio · Serie N/M + muscolo + stats (kg, reps del set prossimo se derivabili da `lastExerciseLog`)
  - Actions: primary "Riprendi ora" + ghost "Salta recupero" (entrambi `data-action="stop-rest"`; salta e riprendi sono azioni logicamente identiche — chiude il timer)

Animazioni:

- Ingresso overlay: `restOverlay-in` fade 200ms
- Ingresso panel: `restOverlay-panelIn` scale+translateY 320ms curve-default
- Countdown ring: `stroke-dashoffset` transition 250ms linear (aggiornato ogni 250ms dal `S.tick`)
- Uscita: overlay smontato via `mountRestOverlay()` al `stopRestTimer(true)`

Regole:

- **Body** riceve classe `has-rest-overlay` → `pointer-events: none` su `#view`, `#fabRoot`, `#bottomNavRoot`
- Overlay stesso ha eventi delegati sul root (`root.__delegated` guard)
- Timer resta fonte della verità: `updateRestTimerOnly` aggiorna `#restTimerTime` + `updateRestOverlayRing` aggiorna ring
- Chiusura automatica: quando `left <= 0` → `stopRestTimer(true)` → render → overlay smontato

---

# Summary v4

Composizione (`.summaryV4`):

**1. Hero celebrativo** — badge success circolare 72px con icona check + shadow soft; eyebrow "SESSIONE COMPLETATA"; titolo nome giornata (h1 800); body "Bel lavoro! I tuoi dati sono salvati in locale.". Animazione `summaryBadge-pop` (scale bounce).

**2. KPI grid 3 col** (1 col < 480px) — `StatisticCard × 3`:
- Volume totale (kg)
- Serie completate
- Durata (mm:ss o "—")

**3. PR sessione** (solo se `S.lastSummary.newPRs.length > 0`) — card con head (eyebrow "PR CONQUISTATO/I", titolo "N nuovi Personal Record") + lista `.summaryPr__row` (max 5) con info esercizio (nome, muscolo, "prec X kg") + valore (kg + delta "+Xkg" verde).

**4. CTA** — `Button ghost disabled` "Condividi · in arrivo" + `Button primary` "Fine allenamento" (fullWidth, in colonna, primary sotto).

Nessun bottone "Vedi progressi" — Fine allenamento porta a Home. Se serve accesso rapido a progressi, l'utente usa la BottomNavigation dalla Home.

Bottom Navigation nascosta su tab summary (via `bnRoot.style.display` in render()).

---

# WeightPicker / RepsPicker (integrazione Sprint 4)

Applicazione:

- **Single block**: solo la serie attiva (`activeSetInSingle(b, id, rounds)`) usa i picker. `setRowCompact()` mostra le altre serie come chip readonly.
- **Circuit / Superset**: ogni esercizio del giro corrente usa i picker (semantica: sequenza senza pausa, tutti gli esercizi sono "attivi").

API riusata (invariata):

- `WeightPicker({value, unit:'kg', step:2.5, min:0, max:500, ariaLabel})` — `data-picker="weight"`
- `RepsPicker({value, step:1, min:0, max:100, ariaLabel})` — `data-picker="reps"`
- Event delegation esistente in `view.addEventListener('click', ...)` gestisce `data-picker-dir="inc|dec"` invocando `bumpKg/bumpReps` invariati

Regole:

- Touch target ≥ 48px (garantito da `--touch-recommended` sui bottoni `.c-picker__btn`)
- ± single press
- Nessun popup extra (i picker sono in-place)
- Long press per repeat: gestito da business logic esistente (non modificata)

---

# CompleteButton

CTA sessione: `Button primary`/`CompleteButton` a fine focus card quando `blockDone && !next` OR nella Vista Completa come `.workoutFinalCta` in fondo.

Componente esistente: `CompleteButton({label:'Fine sessione'})` — gradient success, distinto dai Button standard.

---

# Toggle Focus / Vista Completa

Vista Completa resta accessibile per revisione (utile per correzioni post-workout o overview blocchi).

Regole:

- Focus-first default (`S.focus.on = true`)
- Bottone `[data-action="toggle-focus"]` in WorkoutHeader alterna con label "◉ Focus" / "☰ Vista completa"
- Business logic invariata: `toggleFocusMode()` esistente
- Vista Completa mostra `workoutBlock(b, bi)` per ogni blocco con `<details>` aperti/chiusi

---

# Timer sessione

Sempre attivo se `S.active.startedAt`. Elemento `#sessionTimerText` (tabular-nums, aggiornato ogni 1s da `startSessionTimer` → `updateSessionTimerOnly`).

Non modificato in Sprint 4.

---

# Rest timer (business logic invariata)

`startRestTimer(sec, label)` → `S.timer = {startedAt, end, label, totalSec}`, tick 250ms per fluidità countdown + ring.

`stopRestTimer(true|false)` → clearInterval + `S.timer = null` + render se true.

`updateRestTimerOnly()` → aggiorna `#restTimerTime` + `updateRestOverlayRing(left)` che rifluisce nel `.c-progressRing__fill` via `setProgressRing` esposto da `window.UI`.

Sprint 4 aggiunge SOLO `startedAt` e `totalSec` al payload S.timer per calcolare la percentuale ring. Business logic invariata (start/stop/tick handler identici).

---

# Personal Record (helper `newPRsInSession`)

Puro helper letterale su `S.sessions`. Zero side-effect. Zero modifiche a IndexedDB.

Algoritmo:

1. Estrai `bestInSession[exId]` = massimo kg per esercizio nella sessione appena finita.
2. Per ogni exId trova `prevMax` = massimo kg in tutte le sessioni completed diverse dalla corrente.
3. Se `cur.kg > prevMax` → è PR nuovo. Salva delta `cur.kg - prevMax`.
4. Ordina discendente per kg. Ritorna array.

Salvato in `S.lastSummary.newPRs` durante `finishWorkout()`. Consumato da `summary()`.

Nessuna nuova store, nessun campo persisted extra.

---

# Responsive

Breakpoint attivi:

- 390: base mobile-first
- 430: Rest overlay actions passa a row-reverse (primary a destra)
- 768: workoutV4 max-width 720px centrato, padding 24px, panel overlay 32px, timer 80px, ring 260px
- 1024: workoutV4 max-width 820px
- < 480: summaryKpi grid 1 col

Il layout resta a colonna verticale su tutte le larghezze.

---

# Accessibilità

- Touch target ≥ 48px per tutti i bottoni interattivi (picker, nav, close round, actions overlay)
- Contrasto AA (token semantici light/dark/amoled)
- ARIA:
  - `.workoutStatusBar` — `role="group"` + `aria-label="Stato sessione"`
  - `#sessionTimerText` — `role="timer"` + `aria-live="polite"`
  - `.focusCard` — `aria-label="Focus workout"`
  - `.focusRingWrap` — `role="group"` + `aria-label="Progresso sessione"`
  - ProgressRing overlay — `aria-label="Progresso recupero"`
  - `.c-restOverlay` — `role="dialog"` + `aria-modal="true"` + `aria-label="Recupero in corso"`
  - `#restTimerTime` — `aria-live="polite"` + `aria-atomic="true"`
  - `.summaryPr` — `aria-label="Nuovi personal record"`
- Focus visible: ereditato da `.c-btn` / `.c-completeBtn`
- Keyboard: tutti gli interattivi sono `<button>` reali; ordine tab = ordine DOM
- Reduced motion: rispettato (animazioni azzerate + transition ring azzerata)

---

# Performance

- 60 FPS attesi: solo `opacity` + `transform` + `stroke-dashoffset` (GPU)
- CLS ≈ 0: dimensioni fisse via padding/gap tokens
- Nessun re-render extra della focus card in caso di sola aggiornata timer (aggiornamento chirurgico di `#restTimerTime` e `.c-progressRing__fill`)
- Overlay: DOM cached in `root.__html`, riscritto solo su cambi
- Interval rest tick: 250ms (era 1000ms) per fluidità ring — costo trascurabile (≤4 render/sec di un textContent + attribute update)
- Nessuna nuova richiesta di rete
- Nessun asset extra

---

# Stati

| Stato | Trigger | Implementazione |
|-------|---------|-----------------|
| Nessuna giornata aperta | !ctx() | `EmptyCard` con CTA "Vai in Home" |
| Sessione non iniziata | S.active && !S.active.startedAt | WorkoutHeader con "INIZIO" |
| Sessione in corso | S.active.startedAt | Focus card + status bar |
| Recupero attivo | S.timer !== null | Rest overlay fullscreen |
| Blocco completato | blockAllDone(b) | CompleteButton in Nav |
| Sessione completata | finishWorkout() → go('summary') | Summary v4 celebrativo |
| Sessione con PR | newPRs.length > 0 | Card PR nella summary |

---

# Cosa NON fare

- Nuovi componenti UI (tutti già in `components/Workout/`)
- Modificare Business Logic
- Modificare IndexedDB
- Aggiungere preferenze utente
- Mostrare Rest Screen inline (deve essere sempre overlay fullscreen)
- Usare `alert()` / `confirm()` / `prompt()`
- Popup bloccanti per stati transitori
- Scroll orizzontale
- Cambiare la semantica del Circuit (multi-esercizio, close-round unico → rest fine giro)

---

# Checklist Sprint 4

☐ Focus-first come default (`S.focus.on = true` di partenza)

☐ Vista Completa accessibile via toggle in WorkoutHeader

☐ Set attivo con WeightPicker + RepsPicker (single block)

☐ Set inattivi come chip compatti readonly

☐ Rest Screen fullscreen overlay con blur/dim

☐ Rest overlay: timer + ring progresso + next info + actions

☐ Summary celebrativo con badge + KPI + PR + Condividi placeholder

☐ Bottom Navigation nascosta in summary

☐ Reduced motion supportato

☐ Business logic invariata

☐ IndexedDB invariato

☐ Zero nuovi componenti

---

# Obiettivo finale

Quando l'utente inizia un workout deve avere davanti agli occhi:

- **La serie corrente** con peso e ripetizioni pronte da editare
- **Il progresso** della sessione
- **Solo quello.**

Il resto (altri esercizi, altri blocchi, statistiche) sono a portata di 1 tap ma non competono con l'azione attuale.

Durante il recupero l'utente vede un timer immersivo che gli ricorda cosa lo aspetta dopo. Alla fine, una celebrazione discreta e i suoi eventuali nuovi record.
