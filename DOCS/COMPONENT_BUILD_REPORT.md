# COMPONENT_BUILD_REPORT — Fase 9

**Data build:** 2026-08-04
**Sorgente approvato:** `sandbox/` (Fase 8) — verificata contro `DOCS/10_NEW_DESIGN.md`, `DOCS/11_HI_FI_MOCKUPS.md`, `DOCS/12_COMPONENT_TREE.md`, `DOCS/13_DESIGN_TOKENS.json` v1.1.0.
**Output:** `components/` — 74 file (JS + CSS + README) organizzati in 9 cartelle.
**Punto di ingresso unico:** `components/index.css` e `components/index.js`.

---

## 1. Sintesi

| Categoria     | Componenti | Righe JS | Righe CSS | README |
|---------------|-----------:|---------:|----------:|:------:|
| Foundation    | 3 file CSS |        — |    ~350   |   sì   |
| Shared        | 5 utility  |    ~430  |    ~100   |   sì   |
| Navigation    | 5          |    ~250  |    ~180   |   sì   |
| Buttons       | 3          |    ~180  |    ~160   |   sì   |
| Cards         | 10         |    ~350  |    ~200   |   sì   |
| Workout       | 8          |    ~380  |    ~220   |   sì   |
| Charts        | 7          |    ~230  |     ~60   |   sì   |
| Feedback      | 9          |    ~330  |    ~220   |   sì   |
| Profile       | 5          |    ~230  |    ~160   |   sì   |
| Indexes       | 2          |    ~100  |     ~20   |    —   |

Totale: **57 componenti pubblici** + 5 utility Shared + 3 file Foundation + 2 index.

---

## 2. Componenti completati

### Foundation (`components/Foundation/`)
- `tokens.css` — copia integrale v1.1.0 (font/type/spacing/radius/shadow/motion/opacity/blur/breakpoints/safe-area/icons/touch/z/timing/gesture) + temi `[data-theme]` + `@media (prefers-reduced-motion: reduce)`.
- `typography.css` — classi `t-display / t-h1 / t-h2 / t-h3 / t-title / t-body / t-caption / t-small / t-mono / t-numeric / t-primary / t-secondary / t-disabled / t-onPrimary / t-eyebrow`.
- `utilities.css` — `.c-stack (sm/lg)` `.c-row (nowrap/between)` `.c-grow` `.c-sr-only` `.c-surface` + reset `box-sizing`.

### Shared (`components/Shared/`)
- `helpers.js` — `esc`, `cx`, `attr`, `clamp`, `uid`.
- `Icon.js` — 13 SVG (dumbbell, play, pause, star, trophy, chart, settings, arrow, arrowUp, arrowDown, home, user, bell) + 9 glifi Blueprint §11 (up, down, check, dot, circle, close, disc, minus, plus). Funzione `icon(name, size)` + `iconNames` freezed.
- `Presenter.js` — `present(opts)` con scrim/focus-trap/ESC/scroll-lock/restore-focus/auto-dismiss; kind: `dialog | bottomSheet | toast | snackbar`. Contatore refcount per modali sovrapposti.
- `Gestures.js` — `onSwipe`, `onLongPress`, `onDragY` con pointer events e soglie da `--gesture-*` (fallback 40/500/8 se token mancanti). Ogni handler ritorna `dispose()`.
- `Animate.js` — `animateOnce(el, cls, tok, fb, cb)` e `afterTransition(el, cb, tOut)`. Rispetta reduced-motion (durata 0 → callback sincrono).
- `shared.css` — sistema icone, badge, presenter host + `@keyframes` scrim-in/out + `@supports not (backdrop-filter)` fallback.

### Navigation (`components/Navigation/`)
- `BottomNavigation.js` — `BottomNavigation` + `mountBottomNavigation` + `setActiveNavItem`. Support badge per item.
- `TabBar.js` — con keyboard nav (← → Home End) e aria-selected.
- `Segmented.js` — 2-5 opzioni, keyboard nav (← →).
- `Header.js` — titolo + sottotitolo + slot azioni HTML (non importa da Buttons/).
- `Toolbar.js` — pillola con actions array/string.

### Buttons (`components/Buttons/`)
- `Button.js` — 4 varianti (primary/secondary/ghost/danger), 3 taglie (sm/md/lg), floating/fullWidth/loading/pressed/disabled, iconPosition start/end.
- `IconButton.js` — quadrato, richiede `label` per a11y (fallback `sr-only`).
- `Fab.js` — circolare + variante `extended` con testo.

### Cards (`components/Cards/`)
- `Card.js` — base con eyebrow/title/body/footer/extra + `interactive`.
- `HeroCard.js`, `WorkoutCard.js`, `RecordCard.js` — gradient variants con footer opzionale.
- `StatisticCard.js` — KPI grande, unit, delta ± con `negative`.
- `HistoryCard.js` — row compatta con avatar sm, badge variant success/warning/error/info.
- `GoalCard.js` — progress bar con `--gradient-success`, hint parametrico.
- `EmptyCard.js` — icona + titolo + body + azione.
- `LoadingCard.js` — skeleton shimmer con `lines` (1-6).
- `ExerciseCard.js` — grid set (num | separator | reps×weight | check).

### Workout (`components/Workout/`)
- `WeightPicker.js` — stepper con step 2.5kg (config), min/max, format decimale.
- `RepsPicker.js` — stepper step 1, min 1, max 100 (config).
- `ProgressRing.js` — SVG donut + `setProgressRing(el, pct)` per aggiornamenti live.
- `FloatingTimer.js` — chip con `updateFloatingTimer(el, patch)` + helper `formatSeconds(n)`.
- `NextExercise.js` — preview con ProgressRing piccolo + eyebrow + titolo.
- `WorkoutHeader.js` — gradient viola→magenta, slot azioni.
- `CompleteButton.js` — CTA full-width dedicata (gradient success), loading spinner.
- `RestScreen.js` — overlay recupero + `updateRestScreen(el, time)`.

### Charts (`components/Charts/`)
- `LineChart.js`, `AreaChart.js`, `BarChart.js`, `Heatmap.js` — SVG puri, `viewBox` scalabile.
- `WeeklyChart.js`, `MonthlyChart.js` — preset di BarChart/LineChart.
- `ProgressChart.js` — router `kind: line|area|bar`.

### Feedback (`components/Feedback/`)
- `Dialog.js` — `Dialog(opts)` + `showDialog(opts)` (via Presenter).
- `BottomSheet.js` — `BottomSheet(opts)` + `showBottomSheet(opts)` con drag-to-dismiss (via Presenter + Gestures.onDragY, threshold 120px).
- `Toast.js` — 4 varianti + `showToast` (auto-dismiss 3s).
- `Snackbar.js` — con azione + `showSnackbar` (auto-dismiss 5s + `onAction`).
- `Banner.js` — 4 varianti persistente in-page.
- `Skeleton.js` — placeholder shimmer generico (non-card).
- `StateEmpty.js`, `StateError.js` (role="alert"), `StateSuccess.js` — full-panel.

### Profile (`components/Profile/`)
- `Avatar.js` — iniziali o `<img>`, taglie sm/md/lg/xl; `aria-hidden` se decorativo.
- `ProfileHeader.js` — usa Avatar XL, slot azioni.
- `AchievementBadge.js` — icona gradient dorato, stato `locked`.
- `SettingsRow.js` — label + meta + control (custom | switch | chevron); modalità `interactive`.
- `PreferenceSwitch.js` — role="switch" + Space/Enter keyboard + `mountPreferenceSwitch(el, cb)`.

### Indexes (`components/`)
- `index.css` — solo `@import` in ordine di dipendenza (Foundation → Shared → categorie).
- `index.js` — solo re-export, 57+ nomi pubblici.

---

## 3. Componenti mancanti

Nessuno rispetto al Component Tree v1 (`DOCS/12_COMPONENT_TREE.md`). Tutti i componenti della Sandbox Fase 8 sono stati portati.

Non implementati (non richiesti dal tree, presenti solo nella sandbox come showcase):
- `Swipe`, `LongPress`, `Pressed`, `Drag` (preview gesture inerti) — sostituiti dai reali handler in `Shared/Gestures.js`.
- `Anim(kind)` (preview animazioni fade/slide/scale) — sostituito da `Shared/Animate.js`.

---

## 4. Problemi noti / eccezioni

### 4.1 `black` in `Buttons/buttons.css:73`
```css
.c-btn--danger { --_bg-h: color-mix(in srgb, var(--color-error) 85%, black); }
```
**Motivazione:** operando matematico per scurire l'hover del danger button; non un token di design. Alternative valutate:
- Aggiungere `--color-errorHover` in `tokens.css`: richiede bump del JSON dei token a v1.1.1 e review del design system.
- Usare `var(--color-textPrimary)`: cambia con il tema (in dark tema è chiaro → schiarirebbe invece di scurire).

**Stato:** documentato come eccezione consapevole. Se il design system riceve una revisione, aggiungere `--color-errorHover` e sostituire questa riga.

### 4.2 `LoadingCard` non passa per `Card()`
`LoadingCard.js` costruisce direttamente `<article class="c-card c-card--loading">` invece di invocare la factory `Card()`. Motivazione: `Card()` accetta title/body semantici, mentre lo skeleton ha solo righe fake. Passare per `Card()` avrebbe generato HTML semanticamente errato. Documentato in-file.

### 4.3 Cross-import intra-categoria consentiti
- `Charts/ProgressChart.js` importa `Line/Area/BarChart.js` (stessa cartella).
- `Cards/HeroCard.js`, `WorkoutCard.js`, `RecordCard.js`, ... importano `Card.js` (base).
- `Workout/NextExercise.js` importa `ProgressRing.js`.
- `Profile/SettingsRow.js` importa `PreferenceSwitch.js`.
- `Profile/ProfileHeader.js` importa `Avatar.js`.
- `Feedback/BottomSheet.js` importa `Shared/Gestures.js`.
- `Feedback/*.js` importano `Shared/Presenter.js`.

**Vietato:** import cross-categoria diversi da `Shared/` (verificato: nessuno).

### 4.4 `Header` e `Toolbar` non conoscono `Button`
Scelta esplicita: gli slot `actions` sono HTML string, non `Button` instance. Il chiamante compone `Header({ actions: IconButton({...}) })`. Questo mantiene Navigation/ isolato.

### 4.5 CSS `!important` presente solo in un punto
`Shared/shared.css` — `.c-glass-fallback { background: var(--color-surface) !important; }` dentro `@supports not (backdrop-filter)`. Necessario per sovrascrivere `background: var(--color-glass)` dichiarato altrove; unico caso legittimo.

---

## 5. Miglioramenti già inclusi rispetto alla Sandbox

1. **Icone SVG canoniche.** Sandbox usava `Icons.dumb = '<span>≡</span>'`. Ora `Icon.js` ha SVG dedicati con `currentColor` — più leggibili e tintabili per ogni tema.
2. **Presenter unico.** Sandbox non aveva scrim, focus-trap, scroll-lock. Ora `Shared/Presenter.js` gestisce tutti i modali.
3. **Gesture reali.** Le preview inerti della sandbox (`Swipe`, `LongPress`, `Pressed`, `Drag`) sono sostituite da handler reali in `Shared/Gestures.js` con dispose.
4. **Keyboard navigation.** TabBar (← → Home End), Segmented (← →), PreferenceSwitch (Space/Enter) — non presenti in sandbox.
5. **Mount separati.** Ogni componente stateful esporta `mount<Component>(el, cb) → dispose` per gestire i listener senza leak.
6. **ARIA completo.** `aria-current` (nav), `aria-selected` (tab), `role="switch"` con `aria-checked`, `role="alert"` (error state), `aria-live` (toast/snackbar/restScreen).
7. **`updateXxx` helper.** ProgressRing, FloatingTimer, RestScreen possono essere aggiornati senza rimontare (transizione CSS su `stroke-dashoffset` / testo).
8. **`backdrop-filter` fallback.** `Shared/shared.css` include `@supports not (backdrop-filter)` fallback opaco.
9. **`prefers-reduced-motion`** in `tokens.css` azzera tutte le `--duration-*`; Animate.js usa il valore effettivo → riduzione automatica.
10. **Sicurezza HTML.** `helpers.esc()` escapes `& < > " '` in ogni interpolazione.

---

## 6. Compliance checklist

| Requisito Fase 9                                              | Stato |
|---------------------------------------------------------------|:-----:|
| NON modificare le schermate dell'applicazione                 | ✅ (nessun file `js/`, `css/`, `index.html` toccato) |
| NON copiare codice; ogni componente esiste una sola volta     | ✅ (`Card` base + wrapper; nessun duplicato) |
| HTML/Template + CSS + JS + Documentazione per ogni componente | ✅ |
| Componenti indipendenti, dati via proprietà                   | ✅ |
| Nessun accesso a stato globale/DB                             | ✅ (nessun import di `js/store.js`, `js/db.js`, ecc.) |
| CSS solo Design Tokens, no hardcoded                          | ⚠️  1 eccezione documentata (`black` in color-mix) |
| JS separato: Rendering / Eventi / Stato / Business Logic      | ✅ (template puri + mount separati + no business logic) |
| Responsive verificato                                         | ⚠️  Media query non necessarie: viewBox scalabili, container query implicite; da verificare in browser 390/430/768/1024/1440 in fase di integrazione |
| A11y (keyboard, focus, ARIA, screen reader, touch ≥ 48px)     | ✅ |
| Animazioni: solo opacity + transform                          | ✅ (verificato: nessun animate di top/left/width/height) |
| 8 stati testabili (Default/Hover/Pressed/Disabled/Loading/Error/Success/Empty) | ✅ per componenti interattivi |
| `COMPONENT_BUILD_REPORT.md` finale                            | ✅ (questo file) |
| Non integrare ancora nell'app                                 | ✅ |

---

## 7. Componenti pronti per la migrazione

Tutti. Ordine di adozione suggerito quando l'utente autorizzerà l'integrazione:

1. **Foundation + Shared** — import globale di `components/index.css` in `index.html` accanto (non al posto) di quelli attuali; verificare che le classi `.c-*` non collidano con quelle esistenti.
2. **Buttons + Cards + Navigation** — sostituzioni "safe" nelle schermate Home / Progressi, dove il layout è stabile.
3. **Feedback** — dialog/toast/bottomsheet: sostituire le implementazioni attuali con `showDialog / showToast / showBottomSheet`.
4. **Workout** — componenti critici della sessione attiva: migrare per ultimi dopo copertura test manuale su device reale.
5. **Profile** — SettingsRow + PreferenceSwitch nella schermata Profilo.
6. **Charts** — ProgressChart / Weekly / Monthly / Heatmap nella schermata Progressi.

Migrazione **incrementale**: la libreria è opt-in file-per-file. `components/index.js` è pure re-export, non ha side-effect all'import.

---

## 8. File list (74 file totali)

```
components/
├─ index.css                         (aggregatore CSS)
├─ index.js                          (aggregatore JS)
│
├─ Foundation/
│  ├─ tokens.css
│  ├─ typography.css
│  ├─ utilities.css
│  └─ README.md
│
├─ Shared/
│  ├─ helpers.js  Icon.js  Presenter.js  Gestures.js  Animate.js
│  ├─ shared.css
│  └─ README.md
│
├─ Buttons/       (3 JS + buttons.css + README)
├─ Cards/         (10 JS + cards.css + README)
├─ Navigation/    (5 JS + navigation.css + README)
├─ Workout/       (8 JS + workout.css + README)
├─ Charts/        (7 JS + charts.css + README)
├─ Feedback/      (9 JS + feedback.css + README)
└─ Profile/       (5 JS + profile.css + README)
```

---

## 9. Note per l'approvatore

- Il codice **non introduce dipendenze runtime** (nessun npm, nessun bundler). Richiede un **HTTP server** in dev (perché ES modules non funzionano da `file://`).
- La struttura interna delle categorie **può evolvere senza modifiche all'app**: l'app importa solo da `components/index.js` / `components/index.css`.
- Nessuna modifica a `manifest.json`, `service-worker.js`, `index.html` app-side.
- Verificato scope locale: tutte le modifiche sono in `fit-tracker-pwa/components/` e `fit-tracker-pwa/DOCS/`.

**In attesa di approvazione per procedere alla Fase 10 — Integrazione nell'app.**
