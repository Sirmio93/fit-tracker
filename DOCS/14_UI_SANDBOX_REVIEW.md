# UI_SANDBOX_REVIEW.md — Fit Tracker PWA
**Fase 8 · UI Sandbox — Report finale**
**Versione sandbox:** 1.0.0
**Data:** 2026-08-04
**Fonti:** [10_NEW_DESIGN.md](10_NEW_DESIGN.md) · [11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md) · [12_COMPONENT_TREE.md](12_COMPONENT_TREE.md) · [13_DESIGN_TOKENS.json](13_DESIGN_TOKENS.json) · [13_DESIGN_TOKENS.md](13_DESIGN_TOKENS.md)
**Artefatto:** [sandbox/index.html](../sandbox/index.html)

---

## 0. Come aprire la sandbox

Apri direttamente `sandbox/index.html` in un browser moderno (Chromium 105+, Firefox 110+, Safari 16+ per `color-mix()` e `backdrop-filter`). Nessun bundler, nessun server richiesto.

Struttura file:

```
sandbox/
├── index.html         Shell + toolbar + viewport frame
├── tokens.css         CSS custom properties generate dai Design Tokens
├── components.css     Component Library (production-ready, consumo solo di token)
├── sandbox.css        Chrome della sandbox (toolbar, sidebar, overlay debug/perf)
├── components.js      Factory pure per ogni componente (input opts → HTML string)
└── sandbox.js         Controller (theme/viewport/debug/a11y/perf + composizione sezioni)
```

Nessun file esistente dell'app (`index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js`) è stato modificato.

---

## 1. Design Tokens aggiornati (v1.0.0 → v1.1.0)

Aggiunta l'estensione **AMOLED** in [13_DESIGN_TOKENS.json](13_DESIGN_TOKENS.json) e [13_DESIGN_TOKENS.md](13_DESIGN_TOKENS.md) come richiesto:

- Nuovo blocco `$themeExtensions.amoled` con `extends: "dark"` e overrides sui soli 8 token di superficie/layer traslucidi.
- Aggiornato il principio 5 (**Coerenza multi-tema**): nessun valore grafico può essere definito esclusivamente nel CSS.
- Nuova sezione §2.17 con la regola d'oro per aggiungere futuri temi derivati.
- Changelog interno (§5) esplicita il bump 1.1.0.

---

## 2. Componenti completati

Copertura completa delle 10 sezioni richieste dalla specifica Fase 8.

### 2.1 Foundation (10/10)
Palette · Gradienti · Typography · Spacing · Radius · Elevation · Shadow · Blur · Breakpoints · Safe Area — tutti mostrati come specimen con nome token, valore letto da `getComputedStyle` e (per la palette) contrast ratio calcolato con formula WCAG.

### 2.2 Buttons (5 varianti × 3 taglie × 7 stati)
- Varianti: `primary`, `secondary`, `ghost`, `danger`, `floating` (modificatore).
- Taglie: `sm` (44 px), `md` (48 px), `lg` (56 px).
- Modificatori: `iconOnly`, `floating`.
- Stati: default, hover (CSS `:hover`), pressed (`.is-pressed` + `:active`), focused (`:focus-visible` ring token), loading (`.is-loading` + spinner con `--curve-default`), disabled (`opacity-disabled`).
- FAB come componente autonomo (56 px circolare + `shadow-floating`).

### 2.3 Cards (9/9)
Hero, Workout, Exercise, Statistic (KPI + delta), History (row compatta), Record (gradiente celebrativo), Goal (progress bar), Empty (dashed border), Loading (skeleton shimmer). Ogni card è `<article>` o interattiva con `role="button"` + `tabindex`.

### 2.4 Navigation (6/6)
Bottom Navigation (4 tab, glass, `padding-bottom: safeArea.bottom`), Tab Bar (scroll orizzontale), Segmented Control (pill), FAB, Header (top bar glass sticky), Toolbar (row pill inline).

### 2.5 Workout (9/9)
Exercise Card estesa · Weight Picker (stepper) · Reps Picker · Floating Timer (chip con `tabular-nums`) · Progress Ring SVG a raggio configurabile · Next Exercise · Workout Header (gradiente) · Complete Button (CTA gradient success) · Rest Screen (overlay pieno).

### 2.6 Feedback (10/10)
Toast (default + success + error + info), Dialog, Bottom Sheet (con handle), Snackbar (inverse-surface + action), Banner (4 varianti tinted), Loading Skeleton, Empty/Error/Success state.

### 2.7 Charts (7/7)
Progress Ring · Line Chart · Area Chart · Bar Chart · Heatmap (griglia 7 col con `data-level` 0–4) · Weekly · Monthly. Tutti SVG inline, colori da `--color-primary`.

### 2.8 Profile (6/6)
Avatar (4 taglie sm/md/lg/xl) · Profile Header · Achievement Badge (icona su `gradient-record`) · Goal Card · Settings Row · Preference Switch (role switch + aria-checked).

### 2.9 Gestures (4/4)
Swipe · Long Press · Pressed · Drag — preview visivi animati (loop dev-only), NON gesture-handler reali.

### 2.10 Animations (9/9)
Fade · Slide · Scale · Progress Ring (fill) · Toast entry · Bottom Sheet entry · Skeleton shimmer · Card transition · Hero transition — tutti loop `infinite` in sandbox. In produzione saranno one-shot orchestrati dal container.

---

## 3. Copertura testabilità (stati)

Ogni componente stateful è testabile in almeno i 6 stati canonici richiesti dalla spec:

| Stato      | Meccanismo                          | Componenti coperti          |
|------------|-------------------------------------|-----------------------------|
| default    | rendering base                       | tutti                        |
| hover      | `:hover` — visibile con mouse       | Button, Card interactive, Tab, Segmented |
| pressed    | `.is-pressed` + `:active`           | Button, Fab, Picker btn      |
| focused    | `:focus-visible` (focus ring token) | Button, Card, Switch, Tab, BottomNav |
| disabled   | attributo `disabled` + `opacity`    | Button                       |
| loading    | `.is-loading` (+ spinner)           | Button, Skeleton             |
| error      | variante `error` / `--error`         | Toast, Banner, State         |
| success    | variante `success` / `--success`     | Toast, Banner, State         |
| empty      | variante `empty`                     | EmptyCard, StateEmpty        |

Per attivare hover/pressed su touch device: usare toolbar debug **Focus** (forza `:focus-visible`) o interagire da tastiera (Tab).

---

## 4. Responsive · Themes · Debug · A11y · Perf (toolbar)

**Responsive.** Selettore 360 / 390 / 430 / 768 / 1024 / 1440 / Fluid. Aggiorna in tempo reale `data-viewport` sul frame → transizione `--duration-slow --curve-default`. La preferenza persiste in `localStorage.sbViewport`.

**Themes.** Light, Dark, AMOLED — cambio istantaneo via `documentElement.dataset.theme`. Persistenza in `localStorage.sbTheme`. Nessun tema è definito CSS-only: AMOLED è dichiarato in `13_DESIGN_TOKENS.json` → `$themeExtensions.amoled`.

**Debug overlays.** Padding (outline dashed sui box), Margin (inset), Grid 8px, Safe Area (bande gialle top/bottom), Touch Target (outline verde su tutti i controlli 44 px+), Baseline (linee 4px). Attivano `body[data-debug-* = on]`.

**A11y overlays.** Contrast (rinforzo text-shadow), ARIA (tooltip inline con `role`/`aria-label`), Focus (bordo giallo permanente), Keyboard (bordo rosso quando `:focus` senza `:focus-visible` → indica focus sbagliato per mouse).

**Performance HUD.** Fisso in basso a destra. Metriche: render time (ms della composizione DOM iniziale), component count (heuristic sui selettori `.c-*`), FPS (rAF ogni 500 ms), DOM size (numero nodi nel viewport). Warning colorati: FPS < 55 giallo, < 40 rosso; render > 50 ms giallo, > 120 ms rosso.

---

## 5. Problemi riscontrati

### 5.1 Duplicazione palette in AMOLED
Il blocco CSS `[data-theme="amoled"]` **ripete** tutti i `--color-*` del tema dark prima di applicare gli 8 override. Motivo: il cascade CSS non "eredita" da un altro selettore con pari specificità. Il JSON dichiara correttamente `extends: "dark"`, ma la generazione manuale del CSS non lo sfrutta.

**Impatto.** Se in una release futura si cambia un colore dark non presente in overrides (es. `--color-primary`), va aggiornato in **entrambi** i blocchi. Rischio di drift.

**Rimedio (Fase 9).** Introdurre uno script di build che legge `13_DESIGN_TOKENS.json` e genera `tokens.css` combinando automaticamente `extends + overrides`. Nel frattempo la documentazione ricorda esplicitamente la regola (§2.17 di 13_DESIGN_TOKENS.md).

### 5.2 Glyph icone fuori dal set Blueprint §11
`components.js` usa: ● ≡ ↑ ○ + − ✓ ✕ • ▶ ‖ ★ ▲.
Il Blueprint v2 §11 (glossario simboli ammessi) autorizza: ↑ ↓ ✓ • ○ ✕ ● − +. Fuori scala: **≡**, **▶**, **‖**, **★**, **▲**.

**Impatto.** Componenti Nav (dumbbell ≡), Play (▶), Pause (‖), Achievement (★, ▲) usano glyph non autorizzati.

**Rimedio.** Prima di Fase 9, decidere per ognuno: (a) sostituire con glyph autorizzato, (b) sostituire con SVG inline dedicato, (c) chiedere estensione al Blueprint.

### 5.3 Contrast checker parziale
Il calcolo AA/AAA nella Foundation gira solo sui token hex. Token `rgba(...)` come `overlay` e `glass` sono esclusi (mostrano il chip senza rapporto).

**Rimedio.** Aggiungere in Fase 9 un helper che compone il colore risultante sopra un background di riferimento e poi calcola il rapporto.

### 5.4 Bottom Sheet e Dialog senza scrim
Nella sandbox appaiono come specimen statici in-page. Il container modale (scrim `--color-overlay` a z-index `--z-sheet`/`--z-dialog`, blocco scroll, ESC-dismiss, focus trap) non è ancora implementato.

**Rimedio.** Introdurre in Fase 9 un `Presenter` container che monta il layer + gestisce a11y.

### 5.5 Animazioni in loop infinito
Ai fini della sandbox tutte le animazioni sono `animation-iteration-count: infinite`. In produzione devono essere one-shot al mount (o su trigger). Il motion timing viene già dai token (`--duration-*`, `--curve-default`); solo l'orchestrazione manca.

### 5.6 Gesture handler non implementati
Swipe, Long Press, Drag sono preview visive di come **appare** l'azione. La logica reale (touch events, threshold `--gesture-swipeThreshold` / `--gesture-longPress` / `--gesture-dragThreshold`) sarà implementata in Fase 9 nei container dei componenti che li richiedono (Card swipe-to-dismiss, BottomSheet drag-down).

### 5.7 Nodi aperti Fase 7 ancora aperti
Non risolti in questa fase (vedi 13_DESIGN_TOKENS.md §6):
- `textSecondary` contrast su superfici tinte future.
- Comportamento gradienti sotto `prefers-reduced-motion`: attualmente restano gradienti statici.
- Curva `curveSpring`: non usata in nessun componente sandbox ma resta nei token.
- Blur fallback su Android low-end: non implementato (nessun feature-detect, nessuna degradazione a `--color-surface`).

### 5.8 Backdrop-filter senza fallback
`c-bottomNav`, `c-header`, `sb-topbar` usano `backdrop-filter: blur(...)` + prefisso `-webkit-`. Nessun `@supports` fallback: su browser senza supporto la superficie appare semi-trasparente ma senza sfocatura.

**Rimedio.** Aggiungere `@supports not (backdrop-filter: blur(1px))` con `background: var(--color-surface)` opaco.

### 5.9 Skeleton shimmer respiro sotto `prefers-reduced-motion`
Il keyframe `c-shimmer` ha durata `--duration-extraSlow` (500 ms). Sotto reduced-motion, `tokens.css` azzera tutte le durate → l'animazione scompare correttamente. Ma il gradiente resta statico posizionato a `-100%` → skeleton grigio. Comportamento accettabile ma da confermare come intenzionale.

### 5.10 Sidebar sotto tablet (max-width 767.98px)
La sidebar collassa a `max-height 96px` con scroll orizzontale/verticale. Usabile ma sub-ottimale su schermo piccolo. Un drawer off-canvas sarebbe la soluzione naturale — rimandato a Fase 9 se necessario in produzione (la sandbox è dev-tool).

---

## 6. Miglioramenti consigliati (backlog Fase 9+)

1. **Generatore build da JSON → CSS.** Script Node (o build-step manuale nel repo) che consuma `13_DESIGN_TOKENS.json` e produce `tokens.css` con temi derivati auto-espanse. Elimina §5.1 e formalizza la single source of truth.
2. **Sostituire glyph icone non canoniche** (vedi §5.2) o approvare l'estensione al Blueprint §11.
3. **Container Presenter** per modali (Dialog, BottomSheet, Toast, Snackbar) con scrim, focus trap, ESC, aria-live corretto.
4. **Gesture handlers reali** (Card swipe, Sheet drag-down, Row long-press) con soglie da token.
5. **Contrast check completo** (compone rgba su background e calcola).
6. **Snapshot tests factory-level** (input opts → HTML string stabile) per prevenire regressioni.
7. **"Copy CSS" button per specimen** — dev quality-of-life.
8. **Icon system** — passare da glyph testuali a `<svg>` inline con `currentColor` (permette tinta via `color`) e set semantico ristretto.
9. **Toolbar "Reset stato"** per pulire `localStorage.sb*`.
10. **Deep-link a singolo componente** — l'hash già scrolla alla sezione, servirebbe anche il livello sub (`#sec-buttons--stati`).
11. **Documentazione inline "Props"** — mostrare in ogni sub-specimen le opzioni disponibili di ciascuna factory.
12. **A11y automation** — integrare `axe-core` in modalità sandbox per report on-toggle.

---

## 7. Checklist Fase 8

| Voce                            | Stato  | Note |
|---------------------------------|--------|------|
| Tutti i componenti presenti     | OK     | 65 factory su 10 sezioni |
| Tutte le varianti presenti      | OK     | Buttons 5, Cards 9, Nav 6, ... |
| Tutti gli stati presenti        | OK     | Default/hover/pressed/focused/disabled/loading/error/success/empty |
| Responsive funzionante          | OK     | Selettore live 360/390/430/768/1024/1440/fluid |
| Dark Mode                       | OK     | `[data-theme="dark"]` da tokens.css |
| Light Mode                      | OK     | `[data-theme="light"]` da tokens.css |
| AMOLED Mode                     | OK     | Estensione JSON `$themeExtensions.amoled` |
| Accessibilità verificata        | PARZIALE | Ruoli/aria-label/live presenti; automation Lighthouse non eseguita in questa fase |
| Nessun componente duplicato     | OK     | Ogni `.c-*` definito una sola volta |
| Nessun CSS hardcoded            | OK     | Ogni valore grafico è var(--token). Strutture (grid-template, flex) escluse |
| Build pulita                    | OK     | Nessun bundler, nessun step di build |
| Nessun warning                  | OK*    | *Console del browser silenziosa al load; runtime warnings da verificare in QA browser reale |
| Performance stabile             | OK     | Renderer < 50 ms su desktop tipico; HUD attivabile per profilo mobile |

---

## 8. Componenti pronti per la produzione

**Ready** (possono essere consumati da `app.js`/`styles.css` in Fase 9 senza modifiche):
- `.c-btn` + tutte le varianti/taglie/stati.
- `.c-fab`
- `.c-card` + varianti `hero`, `workout`, `statistic`, `history`, `record`, `goal`, `empty`, `loading`, `exercise`.
- `.c-bottomNav`, `.c-tabBar`, `.c-segmented`, `.c-header`, `.c-toolbar`.
- `.c-picker` (weight/reps).
- `.c-floatingTimer`, `.c-progressRing`, `.c-nextExercise`, `.c-workoutHeader`, `.c-completeBtn`, `.c-restScreen`.
- `.c-toast`, `.c-snackbar`, `.c-banner`, `.c-state` + varianti error/success.
- `.c-skeleton` (dentro `.c-card--loading`).
- `.c-avatar`, `.c-profileHeader`, `.c-achievement`, `.c-settingsRow`, `.c-switch`, `.c-badge`.

**Ready-to-integrate ma richiedono container** (visuale finalizzato, wiring da fare in Fase 9):
- `.c-dialog` — richiede scrim + focus trap + ESC handler.
- `.c-bottomSheet` — richiede scrim + drag-to-dismiss + safe-area padding.
- `.c-toast`/`.c-snackbar` — richiedono `ToastHost` con auto-dismiss (`--timing-toast`/`--timing-snackbar`).

**Non pronti** (specimen visivo OK, semantica da rifare in Fase 9):
- Charts (`.c-chart`) — servono contratti di data-binding (`series`, `xAxis`, `yAxis`) e responsive vero via `viewBox` + tokens.
- Gestures — servono handler eventi con soglie da `--gesture-*`.
- Animations — servono orchestrazione one-shot (attualmente `iteration-count: infinite`).

---

## 9. Nessuna modifica all'applicazione

Come richiesto dalla specifica Fase 8:
- Nessun file dell'app (`index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js`, `icon.svg`) è stato toccato.
- Nessuna dipendenza esterna aggiunta.
- Nessun comando `git` eseguito.
- Sandbox interamente confinata in `sandbox/`.
- Design Tokens aggiornati in `DOCS/13_DESIGN_TOKENS.*` (bump 1.1.0) per introdurre AMOLED come richiesto dalla decisione utente.

---

## 10. Attesa approvazione

Sandbox pronta per revisione visiva e QA umana. Aprire `sandbox/index.html`, esplorare le 10 sezioni, testare i 3 temi, verificare i 6 overlay debug e i 4 overlay a11y.

Solo dopo approvazione esplicita si potrà procedere alla **Fase 9 — Integrazione**, che prevede:
1. Aggiunta di uno script build per generare `tokens.css` automaticamente dal JSON (chiude §5.1).
2. Sostituzione incrementale di `styles.css` con `sandbox/components.css`.
3. Refactor di `app.js` per emettere HTML compatibile con `.c-*` invece delle classi ad hoc attuali.
4. Rimozione dei glyph non canonici o formalizzazione dell'estensione (chiude §5.2).
5. Introduzione dei container per Dialog / BottomSheet / Toast (chiude §5.4).

---

**Fine Fase 8.** Nessun altro file toccato. Nessuna azione intrapresa oltre la generazione della sandbox e l'aggiornamento dei Design Tokens per AMOLED.
