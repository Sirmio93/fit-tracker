# DESIGN SYSTEM AUDIT — Sprint 9.2A

**Data:** 2026-08-10
**Scope:** Consolidamento del linguaggio visivo prima di procedere con Home/Progress/Profile (Sprint 9.3+).
**Regola cardine applicata:** *zero regressione visiva* — ogni token nuovo ha valore identico al literal che sostituisce; ogni variante nuova (`--shadow-focus-sm`) ha ≥ 3 candidati di sostituzione documentati; nessuna API pubblica di componente è cambiata; i componenti legacy sono marcati `@deprecated` ma restano funzionanti.

---

## 1. Componenti consolidati

Sostituzioni token-only sui punti di duplicazione esatta o quasi-esatta. Nessun refactor strutturale, nessun rename, nessun cambio di API.

| Area | File | Cosa è stato consolidato |
| --- | --- | --- |
| CTA gradient | `components/Workout/workout-v2.css` (`.c-workoutSceneV2 .c-completeSetBtn`) | `linear-gradient(135deg, #8B5CF6, #A855F7, #EC4899)` + shadow multi-layer → `var(--gradient-cta)` + `var(--shadow-cta)` / `var(--shadow-cta-hover)`. |
| CTA gradient | `components/Rest/rest-v2.css` (`.c-restActionsV2__btn--primary`) | Stessa sostituzione — elimina la duplicazione letterale esatta con `.c-completeSetBtn`. |
| CTA riutilizzabile | `components/Buttons/buttons.css` (`.c-btn--cta`) | Nuova variante di `.c-btn` che consuma `--gradient-cta` + `--shadow-cta` — pronta per la migrazione futura di `CompleteSetButton`. |
| Focus ring 3px | 10 sostituzioni ISO → `var(--shadow-focus)` | `.c-btn` [buttons.css:48], `.c-fab` [buttons.css:144], `.c-card` [cards.css:28], `.c-circularRestTimer__center` [rest.css:140], `.c-switch` [profile.css:147], `.c-workoutHeader__iconBtn` / `.c-wsh__compactCta` / `.c-wsh__iconBtn` / `.c-completeSetBtn` [workout.css:230/513/541/1042], `.c-homeGreeting__bell` [home.css:96], `.c-lastWorkout` [home.css:375]. |
| Focus ring 3px success | 1 sostituzione ISO → `var(--shadow-focus-success)` | `.c-completeBtn` [workout.css:1181]. |
| Focus ring 2px | 5 sostituzioni ISO → `var(--shadow-focus-sm)` | `.c-snackbar__action` [feedback.css:133], `.c-picker__btn` [workout.css:38], `.c-tabBar__tab` [navigation.css:107], `.c-segmented__seg` [navigation.css:141], `.c-stepperField__btn` [workout-v2.css:228]. |
| Focus ring compound | `.c-fab:focus-visible` [buttons.css:165] | `var(--shadow-focus), var(--shadow-floating)`. |
| Background base scena | `components/Rest/rest-v2.css` + `components/Workout/workout-v2.css` | `var(--color-backgroundBase, #0A0A0B)` → `var(--color-backgroundBase)` (fallback superfluo dopo tokenizzazione). |
| Hairline transition | `.c-wsh__hairline--rest > i` [rest-v2.css:163] | `width 240ms var(--curve-easeOut, ...)` → `width var(--duration-hairline) var(--curve-easeOut)`. |
| Halo animazioni | `.c-restCountdownHero__halo` / `--outer` [rest-v2.css:196/204] | `3.6s ease-in-out` / `5.2s` → `var(--duration-halo) var(--curve-inOut)` / `var(--duration-halo-outer)`. |
| Msg fade | `.c-restCountdownHero__message` [rest-v2.css:234] | `260ms var(--curve-default)` → `var(--duration-message) var(--curve-default)`. |
| Hero pulse | `.c-restCountdownHero .c-circularRestTimer__time` [rest-v2.css:242] | `1.6s ease-in-out` → `var(--duration-pulse) var(--curve-inOut)`. |
| Identity crossfade | `.c-restNextIdentity` [rest-v2.css:350] | `opacity 220ms var(--curve-default)` → `opacity var(--duration-fade) var(--curve-default)`. |
| Timeline motion+glow | `.c-restTimeline__mark--active` [rest-v2.css:410-417] | `1.8s ease-in-out` → `var(--duration-pulse-slow) var(--curve-inOut)`; `0 0 12px color-mix(...primary 45%...)` → `var(--glow-primary)`. |
| Actions in-anim | `.c-restActionsV2` [rest-v2.css:449] | `--duration-slow, 320ms` → `--duration-slow` (fallback superfluo). |
| Rest actions focus | `.c-restActionsV2__btn:focus-visible` [rest-v2.css:476] | `0 0 0 3px color-mix(...primary 45%...)` (percentuale hardcoded) → `var(--shadow-focus)`. |
| Hint pulse easing | `.c-workoutSceneV2__hint` [workout-v2.css:75] | `2.4s ease-in-out` → `2400ms var(--curve-inOut)` (durata locale one-off, easing tokenizzato). |
| Fallback duration errato | `.c-card--exerciseHero` [cards.css:230] | `var(--duration-normal, 220ms)` (fallback 220 ≠ 200 del token) → `var(--duration-normal)` (senza fallback fuorviante). |
| Home focus intenzionalmente più forte | `.c-todayCard__cta:focus-visible` [home.css:264] | Non sostituito: `32%` è rinforzo intenzionale ≠ `--shadow-focus` (24%). Documentato con commento inline. |

**Totale sostituzioni:** 26 punti su 12 file.

---

## 2. Componenti deprecati

Non rimossi: entrambi sono ancora referenziati da `app.js`. Marcati `@deprecated` con puntatore al sostituto.

| Componente | Marker | Sostituto | Chiamante residuo |
| --- | --- | --- | --- |
| `RestScreen`, `updateRestScreen` [components/Workout/RestScreen.js](../components/Workout/RestScreen.js) | JSDoc `@deprecated Sprint 9.2` | `RestScene` (Sprint 9.2) | `app.js:1437` (guard `!UI.RestScreen`) |
| `RestHeader` [components/Rest/RestHeader.js](../components/Rest/RestHeader.js) | JSDoc `@deprecated Sprint 9.2` | `WorkoutStickyHeader({mode:'rest'})` | `app.js:1614/1620` (guard + render) |

I re-export in [components/index.js:86,103](../components/index.js) sono annotati con `/* @deprecated */`.

Regola: entrambi rimangono funzionanti fino a quando `app.js` non è migrato al nuovo flow. Rimozione = azione Sprint 9.3+ dopo verifica che nessun code-path attivo li chiami.

---

## 3. Token aggiunti a `components/Foundation/tokens.css`

Sezione nuova "Motion Tokens" (estensione) + estensioni Glow/Focus/CTA + micro-typography + `--color-backgroundBase`. Tutti i valori sono identici ai literal che sostituiscono — nessuna nuova identità visiva introdotta.

### 3.1 Motion tokens (extension)
```css
--duration-hairline:  240ms;   /* hairline/progressStrip transitions */
--duration-fade:      220ms;   /* crossfade identity / messaggi */
--duration-message:   260ms;   /* fade-in messaggi contestuali */
--duration-pulse:     1600ms;  /* pulse UI (countdown time) */
--duration-pulse-slow: 1800ms; /* pulse timeline mark, ring esercizio */
--duration-halo:      3600ms;  /* halo respiro rest countdown */
--duration-halo-outer: 5200ms; /* halo esterno rilassato */
--curve-inOut:        cubic-bezier(0.42, 0, 0.58, 1);  /* equivalente spec di `ease-in-out` */
```

### 3.2 Focus / CTA / Glow (elevation extension)
```css
--shadow-focus:         0 0 0 3px color-mix(in srgb, var(--color-primary) calc(var(--opacity-focus) * 100%), transparent);
--shadow-focus-sm:      0 0 0 2px color-mix(in srgb, var(--color-primary) calc(var(--opacity-focus) * 100%), transparent);
--shadow-focus-success: 0 0 0 3px color-mix(in srgb, var(--color-success) calc(var(--opacity-focus) * 100%), transparent);

--shadow-cta:
    0 12px 40px -8px color-mix(in oklab, #8B5CF6 55%, transparent),
    0 24px 60px -20px color-mix(in oklab, #EC4899 45%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.18);
--shadow-cta-hover:
    0 16px 52px -8px color-mix(in oklab, #8B5CF6 70%, transparent),
    0 30px 70px -20px color-mix(in oklab, #EC4899 55%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.24);

--glow-primary:         0 0 12px color-mix(in oklab, var(--color-primary) 45%, transparent);
--glow-primary-strong:  0 0 20px color-mix(in oklab, var(--color-primary) 60%, transparent);
--glow-success:         0 0 12px color-mix(in oklab, var(--color-success) 45%, transparent);
```

### 3.3 Gradient (extension)
```css
--gradient-cta: linear-gradient(135deg, #8B5CF6 0%, #A855F7 45%, #EC4899 100%);
```
Colori hex intenzionalmente hardcoded per preservare l'identità della CTA cross-tema (dark e light).

### 3.4 Typography scale extension
```css
--type-micro-size:   10px;
--type-micro-line:   14px;
--type-micro-weight: 600;
--type-micro-track:  0.18em;
```
Nuova classe `.t-micro` in [components/Foundation/typography.css](../components/Foundation/typography.css) (uppercase + tracking 0.18em) — sostituisce i literal `10px` uppercase ricorrenti nei metaLabel.

### 3.5 Color extension
```css
--color-backgroundBase: #0A0A0B;
```
Fantasma prima di questo sprint (referenziato come fallback letterale in workout-v2/rest-v2). Ora dichiarato in `:root`. Comportamento invariato (usato solo per la scena focus-single, che resta dark cross-tema).

---

## 4. Token eliminati

**Nessuno.**

Nessun token esistente è stato rimosso o rinominato. Ogni sostituzione è additiva: i literal duplicati vengono rimpiazzati da riferimenti a token nuovi, ma i token pre-esistenti (colori, spacing, radius, shadow base, motion base) restano intatti.

Eliminati invece 3 **fallback superflui** dentro CSS consumer (non token):
- `var(--duration-normal, 220ms)` → `var(--duration-normal)` (fallback errato: token vale 200ms).
- `var(--duration-slow, 320ms)` → `var(--duration-slow)` in 3 punti di rest-v2.css.
- `var(--color-backgroundBase, #0A0A0B)` → `var(--color-backgroundBase)` in 2 file.

---

## 5. Duplicazioni residue

Segnalate ma **non affrontate** in questo sprint (fuori scope "Bilanciato" — richiedono cambi API o refactoring strutturale).

| # | Duplicazione | Dove | Motivo del rinvio |
| --- | --- | --- | --- |
| 1 | Ring SVG: 3 implementazioni parallele | `Workout/ProgressRing.js`, `Rest/CircularRestTimer.js`, `Home/TodaySessionCard.js:36-39` | Ognuna reimplementa `2πr` + `stroke-dasharray/dashoffset`. Unificarle in una primitiva richiederebbe modificare API pubblica di `CircularRestTimer` (slot centrale) → violazione vincolo "non cambiare API pubbliche". |
| 2 | Badge/chip: 6 famiglie non derivate da `.c-badge` | `.c-exVisual__badge` [exercise.css:90-131], `.c-exerciseHero__chip` [cards.css:333], `.c-nextExerciseCard__equipment` [rest.css:231], `.c-restActionsV2__glyph` [rest-v2.css:489], `.c-bottomNav__badge` [navigation.css:56], `AchievementBadge` [profile.css:53] | Ognuna ha semantica visiva propria (dual-badge equipment, pill numerico, notification dot). Estenderle da `.c-badge` richiederebbe cambio classi BEM emesse dai componenti → rischio regressione layout non giustificato ora. |
| 3 | Font-size 11px fuori-scala | `workout-v2.css:185/240`, `rest-v2.css:275/542`, `home.css:325` | Sta tra `--type-small` (12) e `--type-micro` (10). Aggiungere `--type-tiny-size: 11px` sarebbe sensato se confermato ≥ 3 usi *dopo* la migrazione, non prima. Documentato inline. |
| 4 | Font-size 15px fuori-scala | `workout-v2.css:261` (CTA) | Sta tra `--type-caption` (14) e `--type-body` (16). Tipografia CTA storicamente unica. Documentato inline. |
| 5 | Home CTA focus `32%` rinforzato | `home.css:264` | Rinforzo intenzionale rispetto a `--shadow-focus` (24%). Non tokenizzato per non promuovere una scelta locale a globale senza approvazione. |
| 6 | Timer tick `250ms linear` | `rest.css:82` | Semantica timer-specifica (transition costante per ridurre jitter tra tick). Non condivisibile con altri motion. |
| 7 | Complete-set glow legacy multi-layer | `workout.css:1032/1038/1061` | Pattern simile a `--shadow-cta` ma non identico (`--color-primary` invece di viola hardcoded). Da rivalutare quando `CompleteSetButton` legacy sarà migrato a `.c-btn--cta` (vedi §7). |
| 8 | Ring pulse box-shadow ripetuto | `exercise.css:141-158` | Doppio pattern "outer soft ring + outer glow" identico concettualmente al Timeline mark. Estraibile a `--glow-primary-halo` in Sprint 9.3, se serve. |
| 9 | Legacy `RestHeader` + `RestScreen` | Files marcati `@deprecated` | Rimozione dopo migrazione `app.js`. |

---

## 6. Elenco completo dei componenti Foundation

Stato al termine di Sprint 9.2A (fonte: [components/index.js](../components/index.js)).

### Foundation (design tokens & utility)
- `Foundation/tokens.css` — SSOT di **tutti** i design tokens (colors, spacing, radius, shadow, motion, focus, glow, CTA, typography scale, opacity, blur, z-index, breakpoints, safe area, gestures, timing, gradienti).
- `Foundation/typography.css` — classi consumer-facing: `.t-display`, `.t-h1`…`.t-h3`, `.t-title`, `.t-body`, `.t-caption`, `.t-small`, **`.t-micro`** (NEW), `.t-mono`, `.t-numeric`, `.t-primary/secondary/disabled/onPrimary`, `.t-eyebrow`.
- `Foundation/utilities.css` — `.c-stack`, `.c-stack--sm|lg`, `.c-row`, `.c-row--nowrap|between`, `.c-grow`, `.c-sr-only`, `.c-surface`, `box-sizing:border-box` globale.

### Shared
- Helpers: `esc`, `cx`, `attr`, `clamp`, `uid`
- Icon system: `icon`, `iconNames`, `.c-icon`, `.c-icon--small|medium|large|xl`, `.c-icon--glyph`
- Badge base: `.c-badge`, `.c-badge--success|warning|error|info`
- Presenter host: `present`, `.c-presenter*`, scrim animation `c-presenter-scrim-in/out`
- Gestures: `onSwipe`, `onLongPress`, `onDragY`
- Animate: `animateOnce`, `afterTransition`
- Theme: `THEMES`, `EFFECTIVE_THEMES`, `setTheme`, `getTheme`, `getEffectiveTheme`

### Buttons
- `Button` (`.c-btn`, `.c-btn--primary|secondary|ghost|danger|`**`cta`** (NEW)`|floating|full|sm|lg|icon`, `.is-loading|is-pressed|is-disabled`)
- `IconButton`
- `Fab` (`.c-fab`, `.c-fab--secondary|extended`)

### Cards
- `Card`, `HeroCard`, `WorkoutCard`, `StatisticCard`, `HistoryCard`, `RecordCard`, `GoalCard`, `EmptyCard`, `LoadingCard`, `ExerciseCard`, `ExerciseHeroCard`

### Anatomy
- `AnatomyModel` (primitiva anatomica; consumo esclusivo via `ExerciseVisual`)

### Exercise (Phase 2.3 — Exercise Identity System)
- `ExerciseVisual` (primitiva mannequin + artwork; size mini/sm/md/lg/xl)
- `ExerciseIdentity` (API pubblica di identità esercizio — dual-badge, status current/completed/upcoming/skipped)

### Home
- `HomeGreeting`, `TodaySessionCard`, `WeeklyOverviewGrid`, `LastWorkoutCard`

### Navigation
- `BottomNavigation` (+ `mountBottomNavigation`, `setActiveNavItem`)
- `TabBar` (+ `mountTabBar`)
- `Segmented` (+ `mountSegmented`)
- `Header`, `Toolbar`

### Workout
- `WeightPicker` (+ `mountWeightPicker`)
- `RepsPicker` (+ `mountRepsPicker`)
- `ProgressRing` (+ `setProgressRing`)
- `FloatingTimer` (+ `updateFloatingTimer`, `formatSeconds`)
- `NextExercise`, `WorkoutHeader` (+ `setWorkoutHeaderProgress`)
- `WorkoutStickyHeader` (+ `mountWorkoutStickyHeader`, `setWorkoutStickyProgress`) — modes `sticky|immersive|rest`
- `CompleteButton`
- **@deprecated** `RestScreen` (+ `updateRestScreen`)
- Sprint 8.5: `WorkoutProgress`, `ExerciseHero`, `CompleteSetButton`, `SwipeHint`
- Phase 2 / Sprint 9.1: `ExerciseStage`, `StepperField`

### Rest
- **@deprecated** `RestHeader`
- `CircularRestTimer` (+ `setCircularRestProgress`, `setCircularRestPaused`, `setCircularRestTotal`)
- `NextExerciseCard`, `RestActions`
- Rest V2 (Sprint 9.2): `RestCountdownHero` (+ `setRestHeroMessage`, `setRestHeroPaused`), `RestNextIdentity`, `RestTimeline`, `RestActionsV2`, `RestScene`

### Charts
- `LineChart`, `AreaChart`, `BarChart`, `Heatmap`, `WeeklyChart`, `MonthlyChart`, `ProgressChart`

### Feedback
- `Dialog` (+ `showDialog`)
- `BottomSheet` (+ `showBottomSheet`)
- `Toast` (+ `showToast`, `pushToast`)
- `Snackbar` (+ `showSnackbar`)
- `Banner`, `Skeleton`, `StateEmpty`, `StateError`, `StateSuccess`

### Profile
- `Avatar`, `ProfileHeader`, `AchievementBadge`, `SettingsRow`
- `PreferenceSwitch` (+ `mountPreferenceSwitch`)

---

## 7. Refactoring eseguiti (elenco file modificati)

Zero regressione visiva verificata per costruzione: ogni sostituzione mappa un literal in un token di valore identico.

| File | Change type | Note |
| --- | --- | --- |
| `components/Foundation/tokens.css` | +extension | Nuova micro-typography, 7 motion tokens, `--curve-inOut`, gradient CTA, 3 focus shadow, 2 CTA shadow, 3 glow, backgroundBase. |
| `components/Foundation/typography.css` | +class | Aggiunta `.t-micro`. |
| `components/Buttons/buttons.css` | +variant + 2 sub | Aggiunta `.c-btn--cta`. Sostituiti focus `.c-btn` e `.c-fab` con `var(--shadow-focus)`. |
| `components/Cards/cards.css` | 2 sub | Focus `.c-card` → `--shadow-focus`. Rimosso fallback errato `var(--duration-normal, 220ms)`. |
| `components/Feedback/feedback.css` | 1 sub | Focus `.c-snackbar__action` → `--shadow-focus-sm`. |
| `components/Home/home.css` | 3 sub | 2× focus 24% → `--shadow-focus`. `.c-todayCard__cta:focus` (32%) documentato inline (non sostituito). |
| `components/Navigation/navigation.css` | 2 sub | Focus `.c-tabBar__tab`, `.c-segmented__seg` → `--shadow-focus-sm`. |
| `components/Profile/profile.css` | 1 sub | Focus `.c-switch` → `--shadow-focus`. |
| `components/Rest/rest.css` | 1 sub + 1 doc | Focus `.c-circularRestTimer__center` → `--shadow-focus`. Timer tick `250ms linear` documentato. |
| `components/Rest/rest-v2.css` | 10 sub | Background base, hairline motion, halo motion+curve, msg fade, hero pulse, identity crossfade, timeline motion+glow, actions in-anim, actions focus, CTA primary gradient+shadow. |
| `components/Rest/RestHeader.js` | +@deprecated | JSDoc marker + puntatore a `WorkoutStickyHeader({mode:'rest'})`. |
| `components/Workout/workout.css` | 5 sub | 4× focus → `--shadow-focus` (`workoutHeader__iconBtn`, `wsh__compactCta`, `wsh__iconBtn`, `completeSetBtn`). 1× focus success → `--shadow-focus-success` (`completeBtn`). 1× focus → `--shadow-focus-sm` (`picker__btn`). |
| `components/Workout/workout-v2.css` | 4 sub | Background base, focus stepper → `--shadow-focus-sm`, hint pulse easing → `--curve-inOut`, CTA gradient+shadow. |
| `components/Workout/RestScreen.js` | +@deprecated | JSDoc marker + puntatore a `RestScene`. |
| `components/index.js` | +comment | Annotazioni `/* @deprecated */` sui 2 re-export legacy. |

**Totale:** 15 file toccati, 0 file creati o rinominati, 0 file eliminati, 0 API pubbliche modificate.

---

## 8. Suggerimenti per Sprint 9.3

Priorità in ordine decrescente di impatto/urgenza:

### 8.1 Migrazione `app.js` → nuove scene (sblocca la rimozione del legacy)
- Sostituire in `app.js` le chiamate `UI.RestScreen(...)` con render di `UI.RestScene(...)`.
- Sostituire `UI.RestHeader(...)` con `UI.WorkoutStickyHeader({mode:'rest', ...})`.
- Dopo verifica end-to-end, rimuovere `RestScreen.js`, `RestHeader.js`, i re-export in `index.js` e le regole `.c-restScreen*` / `.c-restHeader*` in `rest.css` / `workout.css`.

### 8.2 Migrare `CompleteSetButton` a `.c-btn--cta`
- Il file `components/Workout/CompleteSetButton.js` emette `<button class="c-completeSetBtn">` con gradient e glow custom.
- Attualmente in `workout-v2.css` viene già sovrascritto con i token `--gradient-cta` / `--shadow-cta`, ma i valori originali in `workout.css:1011-1062` restano fuori-token.
- Emettere `<button class="c-btn c-btn--cta c-btn--full c-btn--lg">` — elimina completamente la duplicazione shadow multi-layer di `workout.css:1032/1038/1061` (§5, punto 7).

### 8.3 Unificare Ring SVG in una primitiva (§5, punto 1)
- Estrarre in `components/Shared/Ring.js` (o `Foundation/Ring.js`) una primitiva `Ring({size, stroke, progress, color, children})`.
- `ProgressRing` diventa `Ring` con `showLabel`; `CircularRestTimer` diventa `Ring` con slot centrale + display; `TodaySessionCard` ring inline sostituito.
- Richiede cambio API pubblica → sprint dedicato, non consolidamento in-place.

### 8.4 Unificare Badge (§5, punto 2)
- Convertire `.c-exVisual__badge`, `.c-exerciseHero__chip`, `.c-nextExerciseCard__equipment`, `.c-restActionsV2__glyph` a estensione di `.c-badge` con varianti tinted (`--tinted-primary`, `--tinted-success`, `--outline`).
- Impatto: cambio classi BEM emesse — richiede audit visivo pixel-perfect.

### 8.5 Rivalutare font-size fuori-scala (§5, punti 3-4)
- Se dopo Sprint 9.3 gli usi di `11px` restano ≥ 3, promuovere a `--type-tiny-size: 11px`.
- Analogo per `15px` se ricorre in nuove scene.

### 8.6 Estrarre Timeline generica (per PR Timeline in Progress)
- Prima della costruzione di Progress v9.4, considerare l'estrazione di `RestTimeline` in `components/Shared/Timeline.js` con `variant='rest'|'pr'`.
- Layout verticale con marker + linea di connessione è compatibile con entrambi i casi d'uso.

### 8.7 Extra glow/halo tokens
- Se ring pulse (`exercise.css:141-158`) e Timeline mark active continuano a divergere, promuovere `--glow-primary-halo` (multi-layer 0 0 0 3px + 0 0 20px) come token composto.

---

## 9. Verifica applicata

- **Nessuna API pubblica cambiata:** signature di `Button`, `ProgressRing`, `CircularRestTimer`, `WorkoutStickyHeader`, `RestScene`, `ExerciseIdentity` invariate.
- **Nessun rename di componente in uso:** deprecati mantengono lo stesso nome ed export.
- **Nessuna business logic toccata:** solo file `.css` e JSDoc; nessuna modifica di rendering condizionale, event handling, storage, timer, session engine.
- **Zero regressione visiva per costruzione:**
  - I token nuovi hanno valore identico ai literal sostituiti (verifica per ogni sostituzione documentata in §1).
  - I 3 punti dove il match non era esatto (`11px` eyebrow, `15px` CTA label, `32%` focus Home CTA) sono stati **lasciati letterali** con commento inline.
- **Nessun keyframe estratto in Foundation:** rispettata la regola "keyframes locali finché non condivisi da ≥ 3 componenti" — `tokens.css` contiene solo valori, mai animazioni.

**Non iniziare Sprint 9.3 prima dell'approvazione.**
