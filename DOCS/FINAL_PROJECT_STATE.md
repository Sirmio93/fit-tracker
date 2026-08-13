# FINAL_PROJECT_STATE — SSoT del current state

**Data:** 2026-08-13
**Fase:** 10 FINALE (Final Legacy Cleanup + Project Freeze)
**Stato:** FROZEN / NO KNOWN DEAD RUNTIME PATHS

Questo documento è la **Single Source of Truth** dello stato attuale del repository dopo la chiusura di:
- Sprint 9.13 (Conservative Dead Code Removal)
- Sprint 9.14 (Charts / SwipeHint / Card variants)
- Sprint 9.15–9.19 (Theme / Performance / Tokens / Accessibility / SW audit)
- Sprint 9.20 (Accessibility + PWA + CSS loading fixes)
- Sprint 9.20.1 (Runtime Verification — FROZEN)
- Fase 10 FINALE (audit + reconciliation — questo documento)

Tutti gli altri report in `DOCS/` sono documentazione storica dei sprint specifici e non rappresentano necessariamente lo stato corrente.

---

## 1 · Architecture

```
fit-tracker-pwa/
├── index.html           ⟵ shell (44 righe, entry point unico)
├── app.js               ⟵ monolite runtime (4541 righe, non-module, defer)
├── styles.css           ⟵ CSS legacy globale (3507 righe)
├── sw.js                ⟵ Service Worker (130 righe, cache: fit-tracker-v14-sprint920)
├── manifest.json        ⟵ PWA manifest
├── icon.svg             ⟵ icona app (referenziata da manifest)
│
├── components/          ⟵ Libreria UI (ES modules, 52 JS · 18 CSS)
│   ├── bootstrap.js     ⟵ bridge: import * as UI → window.UI (frozen)
│   ├── index.js         ⟵ punto di ingresso unico (48 export)
│   ├── index.css        ⟵ @import di tutti i CSS categorie
│   ├── Foundation/      ⟵ tokens · typography · utilities · ring
│   ├── Shared/          ⟵ helpers · icon · presenter · gestures · theme
│   ├── Buttons/         ⟵ Button · Fab
│   ├── Cards/           ⟵ Card · StatisticCard · HistoryCard · EmptyCard · ExerciseHeroCard
│   ├── Anatomy/         ⟵ AnatomyModel · geometry
│   ├── Exercise/        ⟵ ExerciseVisual · ExerciseIdentity
│   ├── Home/            ⟵ TodaySessionCard
│   ├── Navigation/      ⟵ BottomNavigation · Segmented
│   ├── Workout/         ⟵ 14 componenti scene Workout
│   ├── Rest/            ⟵ RestScene + 4 primitives (Hero · NextIdentity · Timeline · ActionsV2) + CircularRestTimer
│   ├── Feedback/        ⟵ Dialog · BottomSheet · Toast · Banner · Skeleton · State* (Empty/Error/Success)
│   ├── Profile/         ⟵ Avatar · ProfileHeader · SettingsRow · PreferenceSwitch
│   └── Charts/          ⟵ SOLO README storico (i moduli sono stati rimossi in Sprint 9.13)
│
├── data/                ⟵ exerciseAssets.js (catalogo asset esercizi)
├── services/            ⟵ exerciseAssetService.js (resolver asset + fallback)
├── utils/               ⟵ exerciseSlug.js (normalizzazione ID esercizi)
├── assets/exercises/    ⟵ webp placeholder 34-byte (asset artificiali)
└── DOCS/                ⟵ documentazione (storica + questa SSoT)
```

**Storage:** IndexedDB `fit-circuit-tracker-v18-optional-day` (schema invariato dal setup iniziale).

**Runtime bridge:** [`components/bootstrap.js`](../components/bootstrap.js) importa `* as UI` da [`components/index.js`](../components/index.js) e lo espone come `window.UI` (frozen). `app.js` è caricato con `defer` non-module e consuma `UI.*`.

---

## 2 · Runtime screens

| Screen | Ingresso | Componenti principali |
|---|---|---|
| **Home** | `homeScreen()` app.js:~470 | `UI.ProfileHeader`, `UI.TodaySessionCard`, `UI.StatisticCard`, `UI.ExerciseIdentity`, `UI.Fab` |
| **Workout** | `workoutScreen()` app.js:~800 | `UI.WorkoutStickyHeader` (`mode:'immersive'`), `UI.ExerciseStage`, `UI.WorkoutProgress`, `UI.ExerciseHero`, `UI.CompleteButton`, `UI.CompleteSetButton`, `UI.NextExercise`, `UI.ProgressRing`, `UI.WeightPicker`, `UI.RepsPicker`, `UI.StepperField`, `UI.ExerciseHeroCard`, `UI.Card` |
| **Rest** | `mountRestOverlay()` app.js:1640 → `restOverlayHtml()` app.js:1604 | `UI.RestScene` → `WorkoutStickyHeader` (`mode:'rest'`) + `RestCountdownHero` (→ `CircularRestTimer` → `Ring`) + `RestNextIdentity` + `RestTimeline` + `RestActionsV2` |
| **Progress** | `progressScreen()` app.js:~2170 | `UI.Segmented`, `UI.StatisticCard`, `UI.HistoryCard`, `UI.ExerciseIdentity` + helper SVG inline (`progressBarChartHtml`, `progressHeatmapHtml`, `progressLineChartHtml`, `frequencyHeatmapData`, `onProgressChartTap`) |
| **History** | `historyOpen()` overlay app.js:~2600 | `UI.Segmented`, `UI.HistoryCard`, `UI.StatisticCard`, `UI.ExerciseIdentity` — full-screen slide-up over `#historyOverlayRoot` |
| **Profile / Settings** | `profileScreen()` app.js:~3550 | `UI.ProfileHeader`, `UI.SettingsRow`, `UI.PreferenceSwitch`, `UI.Card`, `UI.StatisticCard`, `UI.Button`, `UI.Banner`, `UI.showDialog`, `UI.showBottomSheet` |

**Overlay roots** nel DOM:
- `#view` — screen host
- `#fabRoot` — FAB context-aware
- `#historyOverlayRoot` — History full-screen
- `#restOverlayRoot` — RestScene full-screen
- `#bottomNavRoot` — BottomNavigation
- `#toastRoot` — Toast queue (aria-live polite)

**Timer semantics** (frozen):
- `S.timer.end` = timestamp fine recupero
- `S.timer.paused` = boolean; pause freeza `end`, resume shifta `end` avanti della durata di pausa
- Live update chirurgico via `UI.setCircularRestPaused` / `UI.setCircularRestTotal` / `UI.setCircularRestProgress` / `UI.setRestHeroPaused` / `UI.setRestHeroMessage` / `UI.setProgressRing` (app.js:1471)

---

## 3 · Frozen systems

Le seguenti aree sono **FROZEN**. Nessun refactor, redesign, decomposizione o estensione API senza sprint dedicato.

| System | Note |
|---|---|
| **Foundation** | tokens.css (177 token unici) · typography.css · utilities.css · ring.css |
| **Ring** | Primitiva SVG unica, usata da ProgressRing / CircularRestTimer / RestCountdownHero |
| **Presenter** | Sistema ufficiale per Dialog / BottomSheet / History overlay (focus trap, backdrop, keyboard) |
| **RestScene** | Composizione fissa (Header + Hero + NextIdentity + Timeline + ActionsV2) |
| **CircularRestTimer** | Setter API `setCircularRest{Progress,Paused,Total}` |
| **PreferenceSwitch** | Segmented control per prefs Profile |
| **Segmented** | Toggle 2-3 opzioni (Progress · History) |
| **BottomNavigation** | Nav 4-tab (Home · Allena · Progressi · Profilo) |
| **ExerciseIdentity** | API pubblica identità esercizio (mai `<img>`/`AnatomyModel`/`ExerciseVisual` diretti) |
| **ExerciseVisual** | Primitiva sottostante (mannequin + artwork fallback) |
| **WorkoutStickyHeader** | Header unificato (mode: default · immersive · rest) |
| **Business logic (session engine)** | `startDay`, `beginWorkout`, `finishWorkout`, `toggleRound`, `toggleExerciseSet`, `logFor`, focus mode logic |
| **IndexedDB schema** | Store `cards`, `active`, `exercises`, `lifts`, `logs` — versione stabile |
| **Services** | `exerciseAssetService.js` (resolver + fallback gradient) |
| **Router/state** | `S.tab`, `render()`, `go()`, `mountViewDelegation()` |
| **Charts inline (Progress)** | `progressLineChartHtml` / `progressBarChartHtml` / `progressHeatmapHtml` — NO reintroduzione di Foundation Charts |
| **Service Worker** | Cache `fit-tracker-v14-sprint920`, 78 asset precached, network-first-fallback-cache, dominio `api.github.com` escluso |
| **Accessibility fixes Sprint 9.20** | focus-visible, reduced-motion, tab fade in `go()`, ARIA su nav/sheet/status/overlay |

---

## 4 · Removed systems (Sprint 9.8–9.14)

Componenti che **NON esistono più** nel repository e i cui riferimenti in DOCS storici sono da considerarsi obsoleti:

**Cards legacy** (rimosse in Sprint 9.13-9.14):
- HeroCard, WorkoutCard, ExerciseCard, GoalCard, LoadingCard, RecordCard

**Charts Foundation** (rimossa in Sprint 9.13):
- LineChart, AreaChart, BarChart, Heatmap, WeeklyChart, MonthlyChart, ProgressChart
- File `components/Charts/*.js` eliminati
- CSS `components/Charts/charts.css` eliminato
- `components/Charts/README.md` conservato con banner HISTORICAL

**Rest legacy suite** (rimossa quando RestScene v2 è diventata canonica):
- RestScreen, RestHeader, NextExerciseCard, RestActions (v1)
- FloatingTimer, RestScreen legacy (Sprint 8.4 → 9.2)

**Navigation legacy**:
- Header, TabBar, Toolbar

**Buttons legacy**:
- IconButton

**Profile legacy**:
- AchievementBadge

**Feedback legacy**:
- Snackbar

**Shared legacy**:
- Animate

**Modal legacy**:
- `#modalHost` + `.modalBackdrop` + `.modal` (sostituito dal sistema `UI.showBottomSheet` / `UI.showDialog` via Presenter)
- `timerDock()` (sostituito da RestScene overlay)
- `restTimerTime` id + `restDock` fallback
- `SwipeHint` (superato da hint statico `.c-workoutSceneV2__hint`)

Molti di questi risultano ancora nel `git status` come file `D` (deleted, non ancora committati) da Sprint 9.13.

---

## 5 · Component library — contract audit

Totale export in [`components/index.js`](../components/index.js): **48**.

### USED_RUNTIME (chiamati direttamente da app.js via `UI.*`)

`BottomNavigation` · `mountBottomNavigation` · `setActiveNavItem` · `Segmented` · `mountSegmented` · `Button` · `Fab` · `Card` · `StatisticCard` · `HistoryCard` · `EmptyCard` · `ExerciseHeroCard` · `ExerciseIdentity` · `TodaySessionCard` · `WeightPicker` · `RepsPicker` · `ProgressRing` · `setProgressRing` · `NextExercise` · `WorkoutStickyHeader` · `mountWorkoutStickyHeader` · `CompleteButton` · `WorkoutProgress` · `ExerciseHero` · `CompleteSetButton` · `ExerciseStage` · `StepperField` · `CircularRestTimer` · `setCircularRestProgress` · `setCircularRestPaused` · `setCircularRestTotal` · `RestCountdownHero` · `setRestHeroMessage` · `setRestHeroPaused` · `RestScene` · `showDialog` · `showBottomSheet` · `pushToast` · `Banner` · `icon` · `ProfileHeader` · `SettingsRow` · `PreferenceSwitch` · `mountPreferenceSwitch`

### USED_INTERNAL (consumati da altri componenti nella libreria)

- `Ring`, `setRingProgress`, `setRingColor` → CircularRestTimer, ProgressRing, RestCountdownHero
- `esc`, `cx`, `attr`, `clamp`, `uid` → tutti i componenti (helpers trasversali)
- `present` → showDialog / showBottomSheet (via Presenter)
- `onDragY` → BottomSheet (drag-to-dismiss)
- `AnatomyModel` → ExerciseVisual
- `ExerciseVisual` → ExerciseIdentity / ExerciseHero / ExerciseHeroCard
- `RestNextIdentity`, `RestTimeline`, `RestActionsV2` → RestScene
- `Avatar` → ProfileHeader

### KEEP_FOR_CONTRACT (public export, event-bridged o Foundation primitives)

- `THEMES`, `EFFECTIVE_THEMES`, `setTheme`, `getTheme`, `getEffectiveTheme` — Theme system esposto pubblicamente; bridge via evento `ui:theme-set` che `app.js:4508` ascolta per aggiornare `S.theme` + `localStorage` + `applyTheme()`
- `Skeleton`, `StateEmpty`, `StateError`, `StateSuccess` — Feedback primitives Foundation, precached dal SW; nessun consumer runtime attivo ma disponibili per pattern futuri senza reintroduzione

### DEAD_EXPORT

**Nessuno.**

---

## 6 · Known accepted residuals

Debito tecnico documentato, **non-blocker**, non oggetto di questa fase.

| Residuo | Categoria | Note |
|---|---|---|
| `/favicon.ico` 404 | Ambient / PWA | Richiesta automatica del browser; nessun `<link rel="icon">` esplicito in `index.html` (solo `icon.svg` referenziato via manifest). Fix futuro suggerito: aggiungere `<link rel="icon" href="./icon.svg">` in `index.html:26`. Non introdotto da Sprint 9.20. |
| `styles.css` `.modalRow` (righe 423-440) | CSS orfano | 4 rulesets senza markup emitter (0 hit in JS). Legacy da vecchio `#modalHost`. Sostituito da BottomSheet/Dialog Presenter. Rimozione candidata per micro-sprint housekeeping (rischio: verificare fixture Presenter/BottomSheet non lo inietti internamente). |
| `styles.css` `.progressHeatmap*` (~50 righe) | CSS **NON** orfano | Emesso da `progressHeatmapHtml` — LIVE. Conservare. |
| CSS header comments legacy | Documentazione stale | `rest.css:4` menziona "RestScreen, RestHeader, NextExerciseCard, RestActions" (rimossi); `workout.css:3` menziona "FloatingTimer"; `feedback.css:3` menziona "Snackbar"; `buttons.css:3` menziona "IconButton"; `profile.css:3` menziona "AchievementBadge". Nessun impatto runtime. Aggiornamento cosmetico. |
| `components/Charts/README.md` | Documentazione storica | Ora marcato con banner HISTORICAL (Fase 10 FINALE). |
| Asset esercizi `assets/exercises/*.webp` | Placeholder 34-byte | Non matchano slug esercizi; `ExerciseHero`/`ExerciseHeroCard` omettono `<img>` su fallback e mostrano gradient+icona CSS. Documentato in `project_exercise_assets_placeholder`. |
| Manifest `manifest.json` PNG mancanti | PWA | Se `manifest.json` referenzia PNG non esistenti — verificare eventualmente. Non affrontato in questa fase. |
| Manifest `background_color` single-value | PWA | Non parametrico per tema. Accettato. |
| Focus trap History overlay | Presenter delega | History overlay usa Presenter (sistema ufficiale) — nessun focus trap duplicato in codice History. |
| Token orfani nel JSON SSoT | Tokens | JSON SSoT (`DOCS/13_DESIGN_TOKENS.json`) e `Foundation/tokens.css` non hanno formato comparabile 1:1 (JSON è nested per categoria, CSS è flat `--key`). Nessuna divergenza confermata; nessuna cancellazione da JSON né da CSS in questa fase. |

---

## 7 · Current metrics

Rilevate direttamente dal repository al 2026-08-13:

| Metrica | Valore |
|---|---|
| `app.js` righe | **4541** |
| `styles.css` righe | **3507** |
| `sw.js` righe | **130** |
| `index.html` righe | **44** |
| `components/index.js` righe | **121** |
| `components/index.js` export | **48** |
| `components/index.css` righe (`@import` only) | **28** |
| `components/Foundation/tokens.css` righe | **287** |
| `components/Foundation/tokens.css` token CSS unici | **177** |
| Component JS files (sotto `components/`, escluso index/bootstrap) | **52** |
| Component CSS files (sotto `components/`, escluso index.css) | **18** |
| `sw.js` precache items | **78** |
| Cache name | `fit-tracker-v14-sprint920` |

Confronto con snapshot Sprint 9.20.1:
- Cache name: identico (`fit-tracker-v14-sprint920`)
- SW precache: 78 asset (invariato; runtime cache aggiunge `./` → 79 entries a caldo)
- `app.js`/`styles.css`/`components/`: **nessuna riga aggiunta o rimossa** in Fase 10 FINALE (audit-only + doc reconciliation)

---

## 8 · Final freeze matrix

| Area | Status |
|---|---|
| Home | FROZEN |
| Workout | FROZEN |
| Rest | FROZEN |
| Progress | FROZEN |
| History | FROZEN |
| Profile/Settings | FROZEN |
| Foundation | FROZEN |
| Presenter | FROZEN |
| Business logic | FROZEN |
| Storage (IndexedDB) | FROZEN |
| Services | FROZEN |
| PWA / SW | FROZEN |
| CSS | FROZEN / residuals documentati (§6) |
| Tokens | FROZEN |
| Documentation | FROZEN (STEP10/STEP11 marcati HISTORICAL; Charts/README marcato HISTORICAL; questa SSoT creata) |

---

## 9 · Verification summary

**Static verification** (Fase 10 FINALE):

| Check | Esito |
|---|---|
| `node --check app.js` | PASS |
| `node --check components/index.js` | PASS |
| `node --check components/bootstrap.js` | PASS |
| `node --check sw.js` | PASS |
| `node --check components/Feedback/Toast.js` | PASS |
| grep legacy symbols (`modalHost`, `timerDock`, `restTimerTime`, `legacyRestOverlayHtml`, `RestScreen\b`, `RestHeader`, `NextExerciseCard`, `RestActions\b`, `FloatingTimer`, `SwipeHint`, `Snackbar`) in file runtime | 0 hit in `app.js` / `styles.css` / `components/**/*.{js,css}` / `index.html` / `sw.js` (esclusi header comments CSS storici, DOCS, sandbox) |
| grep Charts Foundation (`LineChart`, `AreaChart`, `BarChart`, `Heatmap`, `WeeklyChart`, `MonthlyChart`, `ProgressChart`) come componenti | 0 hit in codice runtime — solo helper SVG inline in `app.js` (LIVE) e classi `.progressHeatmap` in `styles.css` (LIVE) |

**Runtime verification** — non ri-eseguita in questa fase (Sprint 9.20.1 già congelato con evidenza runtime completa: RestScene mount, tick, pause, resume, +15, skip; SW active + cache 79 entries + offline reload OK; 0 pageerror / 0 warning / 0 unhandled rejection; unico signal `/favicon.ico` 404 accettato come ambient noise).

---

## 10 · Definition of done

- [x] Audit completo eseguito (BATCH 1-8 Fase 10 FINALE)
- [x] Nessun DEAD runtime noto non documentato
- [x] Nessun componente rimosso ancora referenziato runtime
- [x] Nessun CSS rimosso appartiene a componente vivo (nessuna rimozione effettuata)
- [x] RestScene/CircularRestTimer invariati
- [x] Business logic invariata
- [x] IndexedDB invariato
- [x] 5 × `node --check` PASS
- [x] Documentazione current-state creata (questo file)
- [x] Documenti storici identificati come tali (STEP10, STEP11, Charts/README)
- [x] Metriche rilevate dal repository reale
- [x] Residual debt documentato (§6)
- [x] Nessun blocker aperto
- [x] Nessun comando git eseguito

---

# FASE 10 FINALE — FROZEN
# PROJECT CURRENT STATE — VERIFIED
# NO KNOWN DEAD RUNTIME PATHS
# NO OPEN TECHNICAL BLOCKER
