# PRE_MIGRATION_AUDIT

**Versione:** 1.0
**Data:** 2026-08-04
**Ambito:** Fit Circuit Tracker PWA — Fase 10 (Migrazione UI)
**Stato:** documento di lettura, nessuna modifica al codice
**Fonte primaria as-is:** [app.js](../app.js), [styles.css](../styles.css), [index.html](../index.html), [sw.js](../sw.js), [manifest.json](../manifest.json)
**Fonte primaria to-be:** [DOCS/10_NEW_DESIGN.md](10_NEW_DESIGN.md), [DOCS/11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md), [DOCS/12_COMPONENT_TREE.md](12_COMPONENT_TREE.md), [DOCS/13_DESIGN_TOKENS.md](13_DESIGN_TOKENS.md), [components/](../components/)

---

## 0. EXECUTIVE SUMMARY

- L'app è un **monolita single-file** ([app.js](../app.js) 1349 righe + [styles.css](../styles.css) 1538 righe) con **4 tab** (`home`, `workout`, `progressi`, `profilo`) — non 12 schermate.
- Esiste una **libreria di componenti Fase 9 pronta** in [components/](../components/) (74 file, 57 componenti pubblici + Foundation + Shared) **non ancora integrata** nell'app.
- Esiste una **sandbox Fase 8** in [sandbox/](../sandbox/) che è il **gold-standard visivo approvato**.
- Il **Blueprint v2** ([10_NEW_DESIGN.md](10_NEW_DESIGN.md)) e i **Hi-Fi Mockups** ([11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md)) definiscono il target.
- **La business logic è SACRA** — solo il rendering va sostituito ([08_AI_RULES.md](08_AI_RULES.md) P.2, [06_MASTER_PROMPT.md](06_MASTER_PROMPT.md)).
- Tre step dell'ordine FASE 10 (Workout Summary, History, Settings) non trovano riscontro 1:1 nel Blueprint v2 → vedi §7 Decisioni aperte.

---

## 1. STATO ATTUALE (AS-IS)

### 1.1 Struttura file

| File | Righe / Bytes | Ruolo |
|------|---------------|-------|
| [index.html](../index.html) | 33 righe | Shell HTML con hook DOM (`#view`, `#bottomNav`, `#themeBtn`, `#fileImport`) |
| [app.js](../app.js) | 1349 righe | TUTTA la logica applicativa (rendering + business + persistenza + sync) |
| [styles.css](../styles.css) | 1538 righe | CSS monolitico |
| [sw.js](../sw.js) | 37 righe | Service worker cache-first, `fit-tracker-v12` |
| [manifest.json](../manifest.json) | 20 righe | PWA manifest (standalone, portrait, theme `#7C3AED`) |

### 1.2 Modello dati (SACRO — mai modificare)

```
Card { id, name, weeks[], noteGenerali, createdAt, updatedAt }
Week { key, label, days[] }
Day  { key, label, name, blocks[] }
Block {
  id, section: 'circuito'|'core'|'tabata'|'hiit'|'superserie',
  type: 'Circuit'|'Core'|'Tabata'|'HIIT'|'Superset'|'Single',
  label, restText, restSec, rounds,
  exerciseIds[], exerciseTargets: { [exId]: { reps, target } }
}
Exercise { id, name, primary, source, createdAt, updatedAt }
Session {
  id, cardId, weekKey, dayKey,
  startedAt, endedAt, durationSec,
  exerciseLogs[], completedSets, totalVolume,
  discarded?, syncStatus, updatedAt
}
Log { blockId, exerciseId, setNo, kg, reps, done, updatedAt }
```

**IndexedDB**: `fit-circuit-tracker-v18-optional-day` v2 — stores `cards`, `exercises`, `sessions`, `settings` ([app.js:1-4](../app.js#L1-L4)).

### 1.3 Stato globale in-memory (oggetto `S` — [app.js:2](../app.js#L2))

```
S = {
  tab, cards, exercises, sessions,
  flow: {cardId, weekKey},
  active: Session|null,
  timer: {end,label}|null, tick, sessionTick,
  theme, missing, focus: {on,blockIdx,round},
  sheet, sync: {config, lastSyncAt, status, busy, pending, lastError}
}
```

Più: `window.OPEN_BLOCKS` ([app.js:442](../app.js#L442)), `window.__persistT` ([app.js:583](../app.js#L583)), `window.__syncT` ([app.js:1232](../app.js#L1232)), `localStorage.theme` ([app.js:1316](../app.js#L1316)).

### 1.4 Schermate attuali (4 tab reali)

| Tab | Range app.js | Container | Note |
|-----|--------------|-----------|------|
| **Home** (`home`) | [178-207](../app.js#L178-L207) | `#view` | Hero card + CTA condizionale su `S.active`/`S.cards` |
| **Workout** (`workout`) | [306-439](../app.js#L306-L439) + handler [481-607](../app.js#L481-L607) | `#view` | Due modalità: completa + Focus mode |
| **Progressi** (`progressi`) | [757-827](../app.js#L757-L827) | `#view` | Hero KPI + quickGrid + barChart + top PR + ultime sessioni |
| **Profilo** (`profilo`) | [829-889](../app.js#L829-L889) + handlers [1184-1220](../app.js#L1184-L1220), [1235-1312](../app.js#L1235-L1312) | `#view` | KPI + sessioni non chiuse + backup GitHub + reset |

Overlay/modali già presenti:
- **Select Sheet** (bottom sheet scelta scheda/settimana/giorno) [209-262](../app.js#L209-L262)
- **Resume Modal** (sessioni non chiuse) [922-1030](../app.js#L922-L1030)
- **Duration Modal** (>4h manuale) [1049-1093](../app.js#L1049-L1093)

**Rest Timer** e **Session Timer** sono dock overlay (`timerDock()` [608](../app.js#L608)), NON schermate. Update in-place su `#restTimerTime`, `#sessionTimerText`.

### 1.5 Servizi trasversali

| Servizio | Riferimento | Ruolo |
|----------|-------------|-------|
| `Store` (IndexedDB wrapper) | [app.js:4](../app.js#L4) | `open/all/get/put/del/clear` — unica astrazione già pulita |
| `render()` dispatcher | [app.js:158-166](../app.js#L158-L166) | Rimappa `TAB_MIGRATION` + `innerHTML = home/workout/stats/data + timerDock()` |
| `go(t)` router | [app.js:167-176](../app.js#L167-L176) | Cambio tab con anim class `tabAnim` |
| `applyTheme()` | [app.js:3](../app.js#L3) | `document.documentElement.dataset.theme` da `S.theme` |
| `startRestTimer/stopRestTimer` | [app.js:608](../app.js#L608) | `S.timer` + `setInterval` `S.tick` |
| `startSessionTimer/stopSessionTimer` | [app.js:566](../app.js#L566) | `S.sessionTick`, update solo `#sessionTimerText` |
| `persistActive()` | [app.js:574-586](../app.js#L574-L586) | Debounce 400ms su `Store.put('sessions')` |
| `importPlan/parseBlocks/mapType` | [app.js:30-97](../app.js#L30-L97) | Parser JSON scheda |
| `exportAll()` | [app.js:1184-1191](../app.js#L1184-L1191) | Dump JSON download |
| `migrateDedupExercises()` | [app.js:99-150](../app.js#L99-L150) | Dedup esercizi al boot |
| `loadSyncConfig/saveSyncConfig/syncToRemote/restoreFromRemote` | [app.js:1194-1312](../app.js#L1194-L1312) | GitHub Contents API + base64 |
| Service Worker | [sw.js](../sw.js) | Cache-first, bypass `api.github.com` |
| Autosave listener | [app.js:1321-1328](../app.js#L1321-L1328) | `click/change/touchend/keyup/visibilitychange/beforeunload` |

### 1.6 Business logic pura (SACRA)

| Funzione | Riga | Ruolo |
|----------|------|-------|
| `totalSetCount / doneSetCount` | [440](../app.js#L440) | Conteggio serie totali/completate |
| `blockAllDone / blockRoundDone` | [441](../app.js#L441), [540](../app.js#L540) | Condizioni completamento blocco |
| `logFor(blockId, exerciseId, setNo, create)` | [481](../app.js#L481) | Get-or-create log — chiave composta |
| `lastExerciseLog / maxExerciseKg / buildKgPlaceholder` | [444-480](../app.js#L444-L480) | Prev/PR/placeholder KG |
| `bumpKg / bumpReps` | [510-538](../app.js#L510-L538) | Stepper con update DOM in-place |
| `beginWorkout / finishWorkout / resumeSession / discardSession / closeSessionNow / saveManualDuration` | [558-1093](../app.js#L558-L1093) | State machine sessione |
| `fillMissingFromPrevious` | [1113-1182](../app.js#L1113-L1182) | Ricopia serie mancanti da sessione precedente |
| `sessionVolume / sessionSetsDone / streakDays / topPRs / recentSessions` | [680-740](../app.js#L680-L740) | Calcoli Progressi |
| `resolveSessionCard` | [263-280](../app.js#L263-L280) | Match sessione ↔ card con fallback |
| `repsNumber / esc / uid / now / label` | [2-6](../app.js#L2-L6) | Utility pure |

---

## 2. STATO TARGET (TO-BE)

### 2.1 Design system — [components/Foundation/](../components/Foundation/)

- [tokens.css](../components/Foundation/tokens.css) — v1.1.0 completi + `[data-theme="light|dark|amoled"]` + `prefers-reduced-motion`
- [typography.css](../components/Foundation/typography.css) — `.t-display .t-h1 .t-h2 .t-h3 .t-title .t-body .t-caption .t-small .t-mono .t-numeric`
- [utilities.css](../components/Foundation/utilities.css) — `.c-stack .c-row .c-grow .c-sr-only .c-surface`

### 2.2 Utility trasversali — [components/Shared/](../components/Shared/)

- [helpers.js](../components/Shared/helpers.js): `esc, cx, attr, clamp, uid`
- [Icon.js](../components/Shared/Icon.js): `icon(name, size)` — 22 nomi (13 SVG canonici + 9 glifi)
- [Presenter.js](../components/Shared/Presenter.js): `present({...})` — scrim, focus-trap, ESC, body-scroll-lock, restore-focus, refcount
- [Gestures.js](../components/Shared/Gestures.js): `onSwipe, onLongPress, onDragY`
- [Animate.js](../components/Shared/Animate.js): `animateOnce, afterTransition` — rispetta reduced-motion

### 2.3 Componenti pronti — [components/](../components/)

| Categoria | Componenti | File |
|-----------|-----------|------|
| **Buttons** | Button, IconButton, Fab | [components/Buttons/](../components/Buttons/) |
| **Cards** | Card, HeroCard, WorkoutCard, StatisticCard, HistoryCard, RecordCard, GoalCard, EmptyCard, LoadingCard, ExerciseCard | [components/Cards/](../components/Cards/) |
| **Navigation** | BottomNavigation, TabBar, Segmented, Header, Toolbar + mount helpers | [components/Navigation/](../components/Navigation/) |
| **Workout** | WeightPicker, RepsPicker, ProgressRing, FloatingTimer, NextExercise, WorkoutHeader, CompleteButton, RestScreen | [components/Workout/](../components/Workout/) |
| **Charts** | LineChart, AreaChart, BarChart, Heatmap, WeeklyChart, MonthlyChart, ProgressChart | [components/Charts/](../components/Charts/) |
| **Feedback** | Dialog, BottomSheet, Toast, Snackbar, Banner, Skeleton, StateEmpty, StateError, StateSuccess + show helpers | [components/Feedback/](../components/Feedback/) |
| **Profile** | Avatar, ProfileHeader, AchievementBadge, PreferenceSwitch, SettingsRow | [components/Profile/](../components/Profile/) |

Aggregatori: [components/index.js](../components/index.js) (re-export, no side-effect) + [components/index.css](../components/index.css) (`@import` ordinato).

### 2.4 Sandbox — [sandbox/](../sandbox/)

Gold-standard visivo Fase 8: [index.html](../sandbox/index.html), [tokens.css](../sandbox/tokens.css), [components.css](../sandbox/components.css), [components.js](../sandbox/components.js), [sandbox.css](../sandbox/sandbox.css), [sandbox.js](../sandbox/sandbox.js). **Non consumare direttamente** — riferimento per regressione visiva.

### 2.5 Regole non-negoziabili Blueprint v2 ([10_NEW_DESIGN.md:672-691](10_NEW_DESIGN.md))

R.1 Una frase per schermata · R.2 Un solo dominante · R.3 Nessun titolo · R.4 Un solo viola · R.5 Coerenza rigida (radius 16/12/8, scala XL/L/M/S/XS, spacing 4/8/16/24/32/48) · R.6 Mobile-first 390×844 · R.7 Ogni elemento eliminabile va eliminato · R.9 5-7 elementi max · R.10 1 dominante + max 2 primari · R.11 Nessuna dashboard · R.12 Pericoloso lontano dal frequente · R.14 Solo simboli `↑ ↓ ✓ • ○ ● ✕ + −` · R.15 Timestamp relativi · R.16 Sotto-viste chiudono con ✕.

### 2.6 Regole trasversali codice ([08_AI_RULES.md](08_AI_RULES.md))

P.2 Logica business SACRA · P.4 Mai regressioni · P.7-10 Design System obbligatorio · P.14 DOM ≤ 6 livelli · P.15 Mai `!important` · P.17 Solo transform/opacity · P.21 Mai input numerici → picker · P.22 Feedback su ogni interazione · P.23 Mai popup per info · P.24 Mai interrompere il Workout · P.25 Skeleton XOR Spinner · P.26 Un solo FAB · P.27 Touch ≥48px · P.44-48 Mai modificare schema DB/API/nomi pubblici/formato dati.

---

## 3. CLASSIFICAZIONE ELEMENTI (KEEP / REFACTOR / REPLACE / REMOVE)

**Definizioni:**
- **KEEP** — resta identico, importato dal nuovo layer
- **REFACTOR** — logica preservata ma estratta / spostata (funzione pura estratta da render function)
- **REPLACE** — sostituito 1:1 dai componenti nuovi (rendering, non logica)
- **REMOVE** — eliminato, non più necessario nel target

### 3.1 Business logic e algoritmi

| Elemento | Classificazione | Motivazione |
|----------|-----------------|-------------|
| Modello dati (Card/Week/Day/Block/Exercise/Session/Log) | **KEEP** | Sacro, R.44-45 [08_AI_RULES.md](08_AI_RULES.md) |
| IndexedDB `fit-circuit-tracker-v18-optional-day` v2 | **KEEP** | Mai bumpare versione |
| `Store` wrapper [app.js:4](../app.js#L4) | **REFACTOR** | Estrarre in modulo `services/store.js` — API identica |
| `logFor` [app.js:481](../app.js#L481) | **KEEP** | Chiave composta blockId+exerciseId+setNo |
| `totalSetCount / doneSetCount / blockAllDone / blockRoundDone` [app.js:440-540](../app.js#L440-L540) | **KEEP** (REFACTOR se estratti) | Pure functions |
| `beginWorkout / finishWorkout / resumeSession / discardSession / closeSessionNow / saveManualDuration` | **KEEP** | State machine sessione — mai toccare |
| `fillMissingFromPrevious` [app.js:1113](../app.js#L1113) | **KEEP** | Semantica sottile, chiamata da 3 punti |
| `persistActive()` debounce 400ms [app.js:574](../app.js#L574) | **KEEP** | Autosave, mai romperlo |
| `sessionVolume / streakDays / topPRs / recentSessions` [680-740](../app.js#L680-L740) | **KEEP** | Calcoli Progressi |
| `importPlan / parseBlocks / mapType / parseRestToSeconds / parseRoundsFromText / findOrCreateExercise` [30-97](../app.js#L30-L97) | **KEEP** | Parser scheda JSON |
| `migrateDedupExercises` [99-150](../app.js#L99-L150) | **KEEP** | Migrazione al boot |
| `resolveSessionCard` [263-280](../app.js#L263-L280) | **REFACTOR** | Bug latente su fallback (§4.3-8) — mantenere semantica |
| `exportAll` [1184-1191](../app.js#L1184-L1191) | **KEEP** | Backup JSON |
| GitHub sync (`loadSyncConfig/saveSyncConfig/syncToRemote/restoreFromRemote/scheduleSync`) [1194-1312](../app.js#L1194-L1312) | **KEEP** | Endpoint + base64 + queue |
| `bumpKg / bumpReps` [510-538](../app.js#L510-L538) | **REFACTOR** | Logica preservata; l'update DOM in-place va rimpiazzato dall'API di WeightPicker/RepsPicker |
| `applyTheme()` [app.js:3](../app.js#L3) + `localStorage.theme` | **KEEP** (allargato a `system|dark|light|amoled`) | Aggiungere `amoled` come 4ª opzione ([13_DESIGN_TOKENS.json:226](13_DESIGN_TOKENS.json)) |

### 3.2 Rendering per schermata

| Elemento | Classificazione | Sostituto |
|----------|-----------------|-----------|
| `home()` render [178-207](../app.js#L178-L207) | **REPLACE** | Composizione `Header + HeroCard + Button + BottomSheet` |
| `openSelectSheet/renderSheet/selectSheetHtml/sheetDayTile` [209-262](../app.js#L209-L262) | **REPLACE** | `showBottomSheet({...})` da [Feedback/BottomSheet.js](../components/Feedback/BottomSheet.js) |
| `workout()` + `workoutBlock/exerciseCard/setRow/roundChip` [306-539](../app.js#L306-L539) | **REPLACE** | `WorkoutHeader + ExerciseCard + WeightPicker + RepsPicker + CompleteButton + NextExercise` |
| `focusView / focusSingleBody / focusRoundBody / focusPrev / focusNext / focusPrevBlock / focusNextBlock` [337-439](../app.js#L337-L439) | **REPLACE** | Focus mode ricomposta con nuovi componenti workout |
| `timerDock()` overlay [608](../app.js#L608) | **REPLACE** | `FloatingTimer` + `updateFloatingTimer` |
| Rest timer UI | **REPLACE** | `RestScreen` (overlay 180px) da [Workout/RestScreen.js](../components/Workout/RestScreen.js) + `Presenter` per scrim |
| `stats()` [757-827](../app.js#L757-L827) | **REPLACE** | Blueprint v2 §6 = una metrica dominante (Volume mese) + trend + top 3 PR. Grafico ricomposto con `ProgressChart` |
| `data()` [829-886](../app.js#L829-L886) | **REPLACE** | `Profile + SyncStatusCard + Banner (sessioni non chiuse) + SettingsRow (backup/export/import)` |
| `openResumeModal / closeModal` [922-1030](../app.js#L922-L1030) | **REPLACE** | `showDialog` con `tone='warning'`, actions custom |
| `openDurationModal / saveManualDuration` [1049-1093](../app.js#L1049-L1093) | **REPLACE** | `showDialog` con form input HH:MM |
| `confirmReset()` [887-889](../app.js#L887-L889) — usa `confirm()` browser | **REPLACE** | `showDialog({tone: 'danger', ...})` — R.12 pericoloso lontano da frequente |
| Nav bar HTML inline in `render()` [161-163](../app.js#L161-L163) | **REPLACE** | `BottomNavigation` da [Navigation/BottomNavigation.js](../components/Navigation/BottomNavigation.js) |
| `#themeBtn` toggle in top-bar [index.html:23](../index.html#L23) | **REMOVE** | Blueprint v2 taglia top-bar globale ([10_NEW_DESIGN.md:81-85](10_NEW_DESIGN.md#L81-L85)); tema si sposta in SettingsSubView ([11_HI_FI_MOCKUPS.md:932-941](11_HI_FI_MOCKUPS.md#L932-L941)) |
| Top-bar `.top` + `.brand` + `h1 "Fit Circuit Tracker"` [index.html:15-25](../index.html#L15-L25) | **REMOVE** | R.3 nessun titolo di schermata; bottom-nav orienta |
| `alert() / confirm()` browser (5+ occorrenze) | **REPLACE** | `showToast` / `showDialog` da [Feedback](../components/Feedback/) — P.23 |
| `<input type="number">` per KG/reps | **REPLACE** | `WeightPicker` / `RepsPicker` — P.21 |

### 3.3 Stato UI in-memory / globali

| Elemento | Classificazione | Motivazione |
|----------|-----------------|-------------|
| `S.tab, S.cards, S.exercises, S.sessions, S.active, S.flow, S.theme, S.sync` | **KEEP** | Core state |
| `S.missing` (kg mancanti in finish) | **KEEP** | Feedback finish workout |
| `S.focus` ({on, blockIdx, round}) | **REFACTOR** | Preservare semantica; nuovi componenti Workout mantengono lo stato |
| `S.sheet` | **REMOVE** | Sostituito da Presenter di `showBottomSheet` |
| `S.timer, S.tick, S.sessionTick` (rest + session intervals) | **REFACTOR** | Unificare in servizio Timer con multi-subscriber (evita doppio interval) |
| `window.OPEN_BLOCKS` [442](../app.js#L442) — stato UI espando blocchi | **REMOVE** | Focus Mode è dominante; vista completa collapse tramite componente `ExerciseCard` locale |
| `window.__persistT` (debounce autosave) | **REFACTOR** | Chiudere in modulo `services/persist.js` |
| `window.__syncT` (debounce sync) | **REFACTOR** | Chiudere in modulo `services/sync.js` |
| `TAB_MIGRATION` [151](../app.js#L151) `stats→progressi`, `data→profilo`, `schede→home` | **REMOVE** | Rimozione legacy dopo migrazione completa |
| `NAV_ICONS` SVG inline [152-157](../app.js#L152-L157) | **REPLACE** | `Shared/Icon.js` — set unificato |

### 3.4 CSS

| Elemento | Classificazione | Motivazione |
|----------|-----------------|-------------|
| Intero [styles.css](../styles.css) (1538 righe) | **REMOVE** (progressivo) | Sostituzione step-by-step da `components/index.css`. Ultima riga eliminata solo dopo Step 12 Polish |
| CSS custom properties in `:root` di styles.css | **REPLACE** | `Foundation/tokens.css` v1.1.0 |
| Classi `.top .brand .sub .between .app` | **REMOVE** | Top-bar tagliata (R.3) |
| Classi `.bottomNav` custom | **REPLACE** | `.c-bottom-nav` da [Navigation/navigation.css](../components/Navigation/navigation.css) |
| Classi `.hero .card .btn .stat` custom | **REPLACE** | `.c-hero .c-card .c-btn .c-stat` |
| Media query e regole one-off ripetute | **REMOVE** | Design system copre le stesse casistiche via tokens |

### 3.5 Servizi trasversali

| Servizio | Classificazione | Note |
|----------|-----------------|------|
| Service Worker [sw.js](../sw.js) | **KEEP** (bump cache name in Step 12) | `fit-tracker-v12` → `v13` dopo Polish |
| Manifest [manifest.json](../manifest.json) | **REFACTOR** | Aggiornare `theme_color` da `#7C3AED` a nuovo token primario in Step 2 Theme |
| Autosave listeners [1321-1328](../app.js#L1321-L1328) | **KEEP** | Rimangono a boot livello |
| `render()` dispatcher [158-166](../app.js#L158-L166) | **REPLACE** progressivo | Sostituzione tab per tab, non tutta insieme |
| `go(t)` router [167-176](../app.js#L167-L176) | **REFACTOR** | Preservare anim class + delegare a `BottomNavigation` mount |
| `TAB_MIGRATION` | **REMOVE** finale | Solo dopo che nessun call site usa più `'stats'/'data'/'schede'` |

### 3.6 Componenti nuovi disponibili non ancora usati

Tutti i 57 componenti in [components/](../components/) sono **KEEP** (produzione). Ordine di adozione ottimale da [COMPONENT_BUILD_REPORT.md:184-193](COMPONENT_BUILD_REPORT.md#L184-L193):
1. Foundation + Shared
2. Buttons + Cards + Navigation (Home + Progressi)
3. Feedback (dialog/toast/bottomsheet)
4. Workout (per ultimo, dopo test device)
5. Profile
6. Charts

### 3.7 Gap identificati (componenti mancanti)

| Elemento richiesto dal Component Tree | Stato | Azione |
|--------------------------------------|-------|--------|
| **SectionHeader** ([12_COMPONENT_TREE.md:631](12_COMPONENT_TREE.md#L631)) | Assente in libreria | Comporre con `.t-eyebrow + .t-h3` da typography — o valutare creazione atomo |
| **FullscreenSubView** ([12_COMPONENT_TREE.md:593](12_COMPONENT_TREE.md#L593)) | Assente in libreria | Pattern applicativo, comporre in Step 11 con `Header (with close ✕) + main` |
| **DayTile** grid (ChangeDaySheet [11_HI_FI_MOCKUPS.md:798](11_HI_FI_MOCKUPS.md#L798)) | Assente | Comporre `Card interactive + iniziali` dentro `showBottomSheet({content})` |
| **DangerButton** | Non atomico | Usare `Button({variant: 'danger'})` |

---

## 4. ORDINE DI MIGRAZIONE + DIPENDENZE

### 4.1 Grafo delle dipendenze

```
STEP 1 Foundation  (tokens, typography, utilities)
   │
   ├──► STEP 2 Theme  (applyTheme esteso, SettingsSubView tema chip)
   │       │
   │       └──► richiede STEP 11 Settings per il selettore UI
   │           (in Step 2 si abilita solo il sistema; il selettore in Settings)
   │
   └──► STEP 3 Navigation  (BottomNavigation + rimozione top-bar)
           │
           ├──► STEP 4 Home  (composizione minimale + BottomSheet Cambia giorno)
           │       │
           │       └──► STEP 5 Workout esecuzione + mappa
           │               │
           │               ├──► STEP 6 Rest Timer  (RestScreen overlay)
           │               │
           │               └──► STEP 7 Workout Summary  ⚠ vedi §7
           │
           ├──► STEP 8 Progress  (StatHero + TrendBadge + top3 PR)
           │       │
           │       └──► STEP 9 History  ⚠ vedi §7
           │
           └──► STEP 10 Profile  (SyncStatusCard + banner + SettingsRow)
                   │
                   └──► STEP 11 Settings  (FullscreenSubView + tema + reset)
                           │
                           └──► STEP 12 Polish  (skeleton, animazioni, a11y sweep, bump SW)
```

### 4.2 Dipendenze specifiche per step

| Step | Dipende da | Perché |
|------|-----------|--------|
| 1 Foundation | — | Prerequisito assoluto (tokens) |
| 2 Theme | 1 | Applica tokens per light/dark/amoled |
| 3 Navigation | 1, 2 | Usa `.c-bottom-nav` e blur+glass tokens; safe area |
| 4 Home | 3 | La Home vive dentro shell con nav |
| 5 Workout | 4 | Home avvia il workout via CTA `INIZIA` |
| 6 Rest Timer | 5 | Il timer overlay è invocato da CompleteButton in Workout |
| 7 Workout Summary | 5, 6 | ⚠ opzionale — in Blueprint v2 la fine sessione è in Workout mappa |
| 8 Progress | 3 | Tab autonomo, ma richiede nav |
| 9 History | 3, 8 | ⚠ opzionale — assente in Blueprint v2 |
| 10 Profile | 3 | Tab autonomo |
| 11 Settings | 10 | È sotto-vista di Profile (chevron in SettingsRow) |
| 12 Polish | 1-11 | Sweep finale + rimozione styles.css residuo + bump SW cache |

### 4.3 Vincoli di co-esistenza (durante la migrazione)

Poiché ogni schermata si migra separatamente, **le vecchie e nuove convivono**. Regole:

1. **CSS cumulativo**: `<link rel="stylesheet" href="./styles.css">` e `<link rel="stylesheet" href="./components/index.css">` presenti insieme. Le nuove classi (`.c-*`) non collidono con le vecchie (naming diverso). `.c-*` ha specificità token-based, cascade prevedibile.
2. **JS coesistente**: `<script src="./app.js" defer>` resta. La libreria è ES modules, va aggiunta con `<script type="module">` — verificare che `defer` legacy non entri in race con moduli.
3. **State `S` immutato**: le nuove render function leggono `S` esattamente come le vecchie. Solo output HTML cambia.
4. **`render()` dispatcher progressivo**: dopo Step 3 nav, `render()` chiama la nuova funzione solo per il tab appena migrato; le altre funzioni continuano invariate.
5. **Timer dock**: durante Step 5-6 coesistenza `timerDock()` (vecchio) + `FloatingTimer/RestScreen` (nuovo); il vecchio va rimosso solo alla fine di Step 6.

---

## 5. REGRESSIONI POSSIBILI

### 5.1 Critiche (rompono l'app)

| # | Rischio | Step in cui può manifestarsi | Mitigazione |
|---|---------|------------------------------|-------------|
| C1 | **`S.active` diventa null durante interazioni** | Step 5 (Workout) | Test manuale intero flusso begin→bump→toggleRound→finish; snapshot IndexedDB pre/post |
| C2 | **Doppio interval `S.tick` o `S.sessionTick`** | Step 5, 6 | Verificare `stopRestTimer(false)` chiamato prima di ogni nuovo start; unificare in Timer service |
| C3 | **Persistenza non chiama `persistActive(true)` su beforeunload** | Step 5 | Test: chiudere tab a metà sessione, riaprire — sessione deve essere in Resume Modal |
| C4 | **`logFor` chiave cambiata** | Step 5 | Grep `logFor(` — deve rimanere 4 argomenti nell'ordine `blockId, exerciseId, setNo, create` |
| C5 | **`fillMissingFromPrevious` non chiamata da `finishWorkout`** | Step 5, 7 | Test: chiudere sessione con serie non completate — kg previsti da precedente devono comparire |
| C6 | **Migrazione `stats→progressi` rotta dopo rimozione TAB_MIGRATION** | Step 8, 12 | Grep tutti i `go('stats')` e `go('data')` in codebase; sostituire con nomi nuovi prima di rimuovere `TAB_MIGRATION` |
| C7 | **IndexedDB versione bumpata accidentalmente** | qualsiasi | Il costante `DB` [app.js:1](../app.js#L1) deve restare `fit-circuit-tracker-v18-optional-day`; version 2. NON toccare mai `onupgradeneeded` |
| C8 | **Service worker cache stale su rilascio** | Step 12 | Bump `fit-tracker-v12` → `v13` in [sw.js:1](../sw.js#L1) SOLO alla fine di Polish, non prima |

### 5.2 Alte (regressioni UX o dati)

| # | Rischio | Mitigazione |
|---|---------|-------------|
| A1 | Nuovi picker perdono l'accessibilità del vecchio `<input type=number>` | Verificare `role/aria` in `WeightPicker/RepsPicker`; keyboard `↑↓` support |
| A2 | Rest timer overlay non chiudibile su iOS Safari (100vh bug) | Uso di `dvh` o `svh` in `tokens.css`; test su Safari |
| A3 | `showBottomSheet` non ripristina focus sull'elemento aperto | Presenter già gestisce restore-focus — verificare in test |
| A4 | Toast/Snackbar sovrapposti al FloatingTimer | Z-index token `overlay: 800`, `toast: 900` — verificare |
| A5 | PAT GitHub esposto in DOM (view-source) dopo Step 10 | Mantenere `type="password"` su input SettingsSubView |
| A6 | `top-bar` rimossa in Step 3 lascia `#themeBtn` orfano | Rimuovere anche listener [app.js:1314-1318](../app.js#L1314-L1318) — riconnettere in Settings sotto-vista in Step 11 |
| A7 | `sessionTimer` update in-place (`#sessionTimerText`) rotto se rinominato | `FloatingTimer` accetta `updateFloatingTimer(el, {time, label, state})` — mappare correttamente |
| A8 | Focus mode auto-advance ([597-604](../app.js#L597-L604)) rotto dopo REPLACE workout | Preservare logica in nuovo layer; test: completa giro in Circuit → deve avanzare al giro successivo |
| A9 | Import JSON `#fileImport` non funziona dopo rimozione input in `index.html` | Mantenere `<input id="fileImport">` nascosto oppure ricreare in Profile |
| A10 | Sync GitHub silenziosamente disattivato dopo Step 10 | `scheduleSync` chiamato da `persistActive`+`finishWorkout` — deve continuare a funzionare; test dopo Step 5 |

### 5.3 Medie (bug latenti / debiti)

| # | Rischio | Note |
|---|---------|------|
| M1 | `topPRs` include kg di serie NON `done` [app.js:712-734](../app.js#L712-L734) | Bug preesistente — decidere se fixare in Step 8 (fuori scope migrazione) |
| M2 | `go('stats')` in `finishWorkout` [app.js:672](../app.js#L672) usa nome legacy | Sostituire con `'progressi'` in Step 5 |
| M3 | `topPRs/streakDays` O(n) su tutte le sessioni | Preesistente — considerare memoization se lentezza percepita |
| M4 | Nessun error boundary | Rischio: eccezione in una render → `#view` congelato. Considerare try/catch in dispatcher |
| M5 | PAT GitHub in cleartext in IDB + export JSON | Bug preesistente; non fixare in Fase 10 salvo esplicita richiesta |

### 5.4 Regressioni "silenziose" da monitorare

- **Sessioni orfane**: `resolveSessionCard` [263-280](../app.js#L263-L280) fa fallback su `S.cards[0]` se non trova match. Se cambi ordine cards o rinomini, "Ultimo allenamento" in Home mostra dati sbagliati.
- **`window.OPEN_BLOCKS` rimosso**: la vista completa Workout perde stato "quale blocco era aperto". Se Focus Mode è dominante (Blueprint v2), non è regressione — è consolidamento. Documentare in report Step 5.
- **`confirm()` browser sostituito**: verificare che il flusso "Reset" resti bloccante (Presenter dialog con `dismissOnScrim: false`).

---

## 6. PIANO DI ROLLBACK

### 6.1 Principio

Ogni step è **1 branch + 1 PR + 1 tag**. Rollback = revert PR o checkout tag precedente. Nessuno step può bloccare quelli successivi se abbandonato.

### 6.2 Livelli di rollback

| Livello | Trigger | Azione | Impatto |
|---------|---------|--------|---------|
| **L1 — Revert step corrente** | Regressione critica scoperta post-merge | `git revert <merge-commit>` + tag `rollback-stepN-YYYYMMDD` | UI schermata torna alla versione precedente; nessun impatto su dati |
| **L2 — Checkout tag pre-step** | Più regressioni concatenate | `git checkout tag/pre-stepN` in branch `hotfix/pre-stepN` | Tutte le schermate migrate dopo lo step riappaiono al vecchio design |
| **L3 — Restore da GitHub sync** | Corruzione dati IndexedDB | Da UI Profile: `Ripristina da GitHub` — usa `restoreFromRemote` [1285-1312](../app.js#L1285-L1312) | Cards/sessioni ripristinate dall'ultimo backup remoto |
| **L4 — Ripristino da export JSON** | Utente ha backup locale | Import via `#fileImport` | Ripristino manuale dati |

### 6.3 Pre-requisiti obbligatori prima di ogni step

- [ ] Working tree pulito (`git status`)
- [ ] Tag `pre-stepN-YYYYMMDD` creato **prima** di aprire branch
- [ ] Export JSON manuale eseguito dall'utente (Profile → Esporta) e archiviato fuori repo
- [ ] Snapshot IndexedDB via DevTools esportato (opzionale, per test)

### 6.4 Punti di non ritorno

Questi cambi sono difficili da revertire — pianificare con attenzione:

1. **Rimozione `styles.css`**: fare solo in Step 12. Prima è cumulativo con `components/index.css`.
2. **Rimozione `TAB_MIGRATION`**: solo dopo che `git grep` conferma zero occorrenze di `'stats'/'data'/'schede'` come stringhe.
3. **Bump `sw.js` cache name**: solo in Step 12 finale. Se bumpato prima, gli utenti vedono UI inconsistente durante la migrazione.
4. **Cambio schema IndexedDB**: **PROIBITO** in Fase 10 (R.44).
5. **Cambio `manifest.json theme_color`**: farlo in Step 2 Theme; se utente ha installato PWA, il colore in status bar cambia — non è breaking ma è visibile.

### 6.5 Backup automatico consigliato

Prima di ogni step, l'utente deve triggerare **Backup ora** in Profile (`syncToRemote()` [app.js:1235](../app.js#L1235)) — questo garantisce che il remoto GitHub abbia snapshot recente per L3.

---

## 7. DECISIONI APERTE (bloccanti per la Fase 10)

Da chiudere **prima** di iniziare Step 1 — o al più tardi prima dello step che tocca l'area.

### 7.1 Workout Summary (Step 7) — assente in Blueprint v2

- **[10_NEW_DESIGN.md](10_NEW_DESIGN.md)** non definisce una Summary screen. La fine sessione avviene in Workout mappa ([10_NEW_DESIGN.md:365-370](10_NEW_DESIGN.md#L365-L370)) via promozione della CTA "Fine sessione" a dominante XL viola.
- **[02_INFORMATION_ARCHITECTURE.md:224-256](02_INFORMATION_ARCHITECTURE.md#L224-L256)** (legacy) prevede schermata dedicata con Tempo/Volume/PR/Condividi.
- **[REDESIGN_ANALYSIS.md:406-412](../REDESIGN_ANALYSIS.md#L406-L412)** conferma Step 10 (Summary + share + BottomSheet serie mancanti).
- **Opzioni:**
  - **A** — seguire Blueprint v2 letterale: **rimuovere Step 7 dall'ordine di FASE 10**. La chiusura sessione avviene in Workout mappa. Summary non esiste.
  - **B** — implementare Summary come schermata di transizione: componendo `StateSuccess + StatisticCard + RecordCard + Button (Fine)` — 3-4 secondi visualizzati poi go('home').
  - **C** — modale bottom-sheet post-finish: componendo `showBottomSheet` con contenuto riassuntivo.

### 7.2 History (Step 9) — assente in Blueprint v2

- **[10_NEW_DESIGN.md](10_NEW_DESIGN.md)** non definisce History. Progressi v2 ha esplicitamente rimosso "Ultime sessioni" ([10_NEW_DESIGN.md:415-422](10_NEW_DESIGN.md#L415-L422)).
- **[REDESIGN_ANALYSIS.md:431-434](../REDESIGN_ANALYSIS.md#L431-L434)** prevede History come lista raggruppata + DettaglioWorkout.
- Componente disponibile: [HistoryCard](../components/Cards/HistoryCard.js).
- **Opzioni:**
  - **A** — rimuovere Step 9. Nessuna History nel target v2. "Ultimo allenamento" in Home basta.
  - **B** — implementare come sotto-vista di Progressi (5° tab in Segmented) — rischio violare R.11 (dashboard).
  - **C** — implementare come 5° tab autonomo in BottomNavigation → richiede ridisegno bottom-nav a 5 tab (attualmente 4).

### 7.3 Settings — sotto-vista vs tab autonomo

- Blueprint v2 dichiara Settings come **sotto-vista** di Profile ([10_NEW_DESIGN.md:575-614](10_NEW_DESIGN.md#L575-L614)) — sezioni ASPETTO + DANGER ZONE (tema chip + Reset).
- L'ordine FASE 10 elenca Settings come step separato — coerente se interpretato come "sotto-vista".
- **Raccomandazione:** confermare interpretazione "sotto-vista". Nessun rework rispetto a v2.

### 7.4 Nodi aperti Component Tree ([12_COMPONENT_TREE.md:1311-1317](12_COMPONENT_TREE.md#L1311-L1317))

1. **A** Chevron `‹` di SubViewHeader non è nel glossario simboli §11 → sostituire con label "Indietro" o formalizzare `‹` nel Blueprint.
2. **B** Glyph BottomNavigation non formalizzati — decidere set icone (proposta `⌂ ⚡ ▤ ◔` in Component Tree).
3. **C** Row-tap in Workout mappa: decidere se toccare esercizio completed/pending fa qualcosa.

### 7.5 Palette AMOLED — drift risk ([14_UI_SANDBOX_REVIEW.md:117-122](14_UI_SANDBOX_REVIEW.md#L117-L122))

Bug noto: `[data-theme="amoled"]` duplica valori di dark nel CSS. Rimedio previsto = script build JSON→CSS. Se non risolto, ogni cambio a `dark` va replicato manualmente in `amoled`.

**Raccomandazione:** o creare script prima di Step 2 Theme, o accettare duplicazione e documentarla in [tokens.css](../components/Foundation/tokens.css).

---

## 8. CHECKLIST DI VALIDAZIONE PER OGNI SCHERMATA

Ogni step non è concluso finché tutte le voci sono ✅.

### 8.1 Design & UI

- [ ] UI pixel-identica al mockup Hi-Fi ([11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md)) — screenshot comparativo 390×844
- [ ] Solo componenti ufficiali da [components/](../components/) usati (grep nel diff: 0 HTML custom per elementi coperti dal DS)
- [ ] Solo design tokens (nessun `#hex`, `Npx`, `rgba()` letterale nel CSS diff — eccezione documentata `black` in [Buttons/buttons.css:73](../components/Buttons/buttons.css#L73))
- [ ] Rispetta regole Blueprint v2 (R.1-R.16)
- [ ] Rispetta regole [08_AI_RULES.md](08_AI_RULES.md) (P.7-P.10, P.14, P.15, P.17, P.21-P.27, P.33-P.36)

### 8.2 Business logic

- [ ] Nessuna modifica a funzioni della sezione "SACRA" (§1.6)
- [ ] `logFor` firma invariata
- [ ] `beginWorkout/finishWorkout/resumeSession/discardSession` invariate
- [ ] `fillMissingFromPrevious` invariata
- [ ] IndexedDB schema invariato — `DB` costante e version 2 [app.js:1](../app.js#L1)
- [ ] `S` state shape invariato (chiavi non aggiunte/rimosse tranne quelle in §3.3)

### 8.3 Responsive & device

- [ ] Verificato a 360, 390, 430, 768, 1024, 1440 px
- [ ] Verificato in landscape se lo step lo prevede
- [ ] Safe area rispettata (iOS notch/home indicator)
- [ ] Touch target ≥48px (preferibile 56) — P.27

### 8.4 Accessibilità

- [ ] `role` / `aria-*` presenti su tutti gli elementi interattivi
- [ ] Focus visibile (`focus-visible`)
- [ ] Keyboard navigation (Tab / Shift+Tab / Enter / Escape / Arrow)
- [ ] Screen reader test (NVDA/VoiceOver) — annunci corretti
- [ ] Contrasto AA (rapporti verificati con checker)
- [ ] `prefers-reduced-motion` rispettato (nessuna animazione essenziale)

### 8.5 Performance

- [ ] FPS ≥60 durante interazioni (Chrome DevTools Performance)
- [ ] Bundle size non aumentato (misurare `styles.css + components/index.css + app.js`)
- [ ] Nessun re-render inutile (verificare con Performance profiler)
- [ ] Prima paint <150ms sulla schermata migrata
- [ ] Lighthouse Performance ≥95 (post-Step 12)

### 8.6 Regression testing (obbligatorio ad ogni step)

Eseguire manualmente:

- [ ] **Nuovo workout**: Home → INIZIA → primo esercizio → bump kg → toggleRound/toggleExerciseSet → rest timer parte → next round
- [ ] **Riprendi workout**: chiudi tab a metà → riapri → Resume Modal appare con sessione corretta
- [ ] **Completa serie**: `logFor` crea entry corretta in `S.active.exerciseLogs`
- [ ] **Chiudi sessione**: finishWorkout → serie mancanti flaggano rosso → conferma → sessione salvata in `S.sessions`
- [ ] **Cronologia/Progressi**: sessione appena chiusa appare in Progressi
- [ ] **Statistiche**: volume totale, streak, top PR calcolati correttamente
- [ ] **Tema**: switch light/dark/amoled/system funziona senza flicker
- [ ] **PWA**: `serviceWorker.register` OK, `manifest.json` valido, installabile
- [ ] **Refresh**: F5 ripristina stato corretto (tab, sessione attiva)
- [ ] **Offline**: `airplane mode` — app carica da cache, `renderSyncStatus` mostra offline
- [ ] **Persistenza**: IndexedDB contiene cards+exercises+sessions dopo restart browser
- [ ] **Import/Export**: export JSON → import in seconda finestra → cards identiche

### 8.7 Codice / commit

- [ ] Commit unico responsabile: `feat(<screen>): <descrizione>` — mai `feat(ui): redesign app`
- [ ] Vecchio codice della schermata eliminato (solo dopo validazione completa)
- [ ] Nessun `TODO / FIXME / console.log` residuo
- [ ] Nessun import morto
- [ ] Build senza warning
- [ ] Console browser pulita (no error, no warning)

### 8.8 Documentazione

- [ ] `MIGRATION_REPORT_<SCREEN>.md` generato in `DOCS/` contenente:
  - Componenti utilizzati (con path)
  - Componenti eliminati (con range di righe rimosse da app.js/styles.css)
  - Problemi incontrati
  - Regressioni scoperte (fixate + note aperte)
  - Numeri performance (FPS, bundle delta)
  - Test eseguiti (checkbox §8.6)
  - Stato: Draft / Ready-for-review / Merged / Reverted

### 8.9 PR

- [ ] 1 PR = 1 schermata (mai mergere due schermate insieme)
- [ ] Titolo PR: `feat(<screen>): migrate <screen> to new UI`
- [ ] Description linka al `MIGRATION_REPORT_<SCREEN>.md`
- [ ] Screenshot before/after allegati
- [ ] Tag `pre-step<N>-YYYYMMDD` creato prima del merge

---

## 9. RIFERIMENTI RAPIDI

| Serve capire | Vai a |
|--------------|-------|
| Perché migrare (vision) | [DOCS/00_VISION.md](00_VISION.md) |
| Design System v1.1.0 (tokens) | [DOCS/13_DESIGN_TOKENS.md](13_DESIGN_TOKENS.md), [13_DESIGN_TOKENS.json](13_DESIGN_TOKENS.json) |
| Blueprint definitivo v2 | [DOCS/10_NEW_DESIGN.md](10_NEW_DESIGN.md) |
| Mockup pixel-accurati | [DOCS/11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md) |
| Component Tree + props | [DOCS/12_COMPONENT_TREE.md](12_COMPONENT_TREE.md) |
| Regole obbligatorie | [DOCS/08_AI_RULES.md](08_AI_RULES.md) |
| Roadmap ufficiale | [DOCS/06_MASTER_PROMPT.md](06_MASTER_PROMPT.md), [07_IMPLEMENTATION_ROADMAP.md](07_IMPLEMENTATION_ROADMAP.md) |
| Piano dettagliato 23 step | [REDESIGN_ANALYSIS.md](../REDESIGN_ANALYSIS.md) |
| Stato libreria componenti | [DOCS/COMPONENT_BUILD_REPORT.md](COMPONENT_BUILD_REPORT.md) |
| Problemi noti sandbox | [DOCS/14_UI_SANDBOX_REVIEW.md](14_UI_SANDBOX_REVIEW.md) |
| Strategia migrazione (questo doc parent) | `FASE 10 — MIGRATION STRATEGY` (chat) |

---

## 10. STATO PRE-MIGRAZIONE — VERDETTO

✅ **App analizzata**: 4 tab, monolita 1349+1538 righe, IndexedDB v2, service worker attivo, GitHub sync operativo.

✅ **Libreria pronta**: 57 componenti + Foundation + Shared documentati, testati in sandbox, mai integrati nell'app.

✅ **Target chiaro**: Blueprint v2 + Hi-Fi Mockups + Component Tree + Design Tokens v1.1.0.

⚠️ **Decisioni da chiudere prima di Step 1**:
1. Workout Summary — mantenere o rimuovere dallo scope?
2. History — mantenere o rimuovere dallo scope?
3. Palette AMOLED — script build o accettare duplicazione?
4. Set icone BottomNavigation da confermare.
5. Chevron SubViewHeader da formalizzare o sostituire.

✅ **Business logic mappata e classificata**: 25+ funzioni sacre identificate con riga precisa.

✅ **Piano rollback definito**: 4 livelli L1-L4, tag obbligatori pre-step.

✅ **Checklist di validazione**: 60+ item per step in 9 categorie.

**Prossimo passo:** l'utente chiude le decisioni aperte §7, poi si apre PR/branch per **Step 1 Foundation**.
