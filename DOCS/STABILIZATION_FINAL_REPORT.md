# STABILIZATION FINAL REPORT
Data: 2026-09-04

---

## 1. Root Causes Trovate

### RC-1 · Due sistemi di token coesistenti
`styles.css` definisce token legacy (`--pri`, `--bg`, `--surface`, `--text`, `--muted`, `--line`, `--soft`)  
con alias verso `--color-*` nel `:root`. `Foundation/tokens.css` definisce il sistema moderno (`--color-primary`, `--color-accent`, `--color-textPrimary`, ecc.) nei selettori `[data-theme]`.  
I componenti legacy leggevano i token legacy; i componenti Foundation leggevano i token moderni → nessun bug sintattico ma semantica incoerente tra i due sistemi.

### RC-2 · `--color-primary` = bianco (#FFFFFF) in tutti i temi, incluso light
Design intent corretto (white CTA su dark bg), ma ~30 consumer in componenti non-always-dark usavano `color: var(--color-primary)` come testo o `background: var(--color-primary)` come fill = bianco su bianco in light theme → invisibile.

### RC-3 · Hotfix cerotto invece di correzione semantica
La fine di `styles.css` conteneva un blocco `HOTFIX — Light theme` con override mirati per `.pill`, `.targetRep`, `.sheetDayArrow`, `.stepBtn`, `.setDoneBtn`, `.sessionSheet__action--primary`. Sintomo che i consumer usavano il token sbagliato.

### RC-4 · Entrypoint CSS dichiarato ma non usato
`components/index.css` è l'entrypoint canonico dichiarato, ma `index.html` caricava 18 `<link>` separati e `components/index.css` mancava di `Execution/execution-shell.css` e `CreateWorkout/create-workout.css`.

### RC-5 · PWA stale (manifest + sw.js)
`manifest.json` aveva `theme_color: "#7C3AED"` e `background_color: "#0F1115"` (violet + dark stale).  
`sw.js` aveva cache key `fit-tracker-v14-sprint920` e non includeva nel precache tutta la superficie UI moderna (Execution e CreateWorkout mancanti, dati mancanti).

### RC-6 · Violetti hardcoded residui nei componenti
`home.css` aveva `rgba(124,58,237,...)` in due hover glow. `styles.css` aveva `rgba(124, 58, 237, ...)` in `.setDoneBtn` (background + dark override) = vecchia palette viola che non corrisponde ad alcun token Foundation.

---

## 2. File Modificati

| File | Motivazione |
|------|-------------|
| `manifest.json` | `theme_color` / `background_color`: violet → `#0A0A0B` |
| `index.html` | `meta theme-color` violet → `#0A0A0B`; aggiunto `<link rel="icon" href="./icon.svg">` |
| `components/index.css` | Aggiunti `@import` mancanti: `Execution/execution-shell.css`, `CreateWorkout/create-workout.css` |
| `sw.js` | Cache key bumped a `fit-tracker-v15-stable`; aggiunti 27 asset Execution + CreateWorkout + data al precache |
| `components/Navigation/navigation.css` | Hotfix light active nav: `--color-accent` (giallo, WCAG fail 1.9:1) → `--color-textPrimary` |
| `components/Home/home.css` | Avatar ring: `--color-primary` → `--color-accent` (55%); eyebrow: `--color-primary` → `--color-accent`; hover glow: viola hardcoded → `--color-accent`; CTA focus ring: `--color-primary` → `--color-accent` |
| `components/Buttons/buttons.css` | FAB light override: bianco → accent; hover darkens accent |
| `components/Profile/profile.css` | Toggle switch `is-on` light override: bianco → accent |
| `components/Exercise/exercise.css` | Initials text: `--color-primary` → `--color-icon` (già theme-aware: white dark, black light) |
| `components/Rest/rest.css` | Paused timer center: `--color-primary` → `--color-icon` |
| `components/Workout/workout.css` | Appeso blocco light theme fixes: round badge, wsh segments, compactPct, exerciseHeroFocus equipment/setChip, workoutProgress pct — tutti → `--color-accent`; scope `:not(.c-wsh--immersive)` dove la scena è always-dark |
| `components/CreateWorkout/create-workout.css` | Active day nav + filter chip: light override con `--color-accent` |
| `styles.css` | 9 fix semantici (`.pill`, `.targetRep`, `.stepBtn`, `.setDoneBtn`, `.sheetDayArrow`, `.active/.primary`, `.card.primary`, `.focusStep`, focus outline globale, `sessionSheet` focus+primary light override, `sheetChip.active` light override, `prefRow` focus outline, `profileNameInput` focus); rimosso blocco HOTFIX cerotto |

---

## 3. Token Migration Table (legacy → semantici)

| Contesto | Token precedente | Token corretto | Motivazione |
|----------|-----------------|----------------|-------------|
| `.pill` testo | `var(--pri)` | `var(--color-textPrimary)` | testo su sfondo tematico |
| `.targetRep` testo | `var(--pri)` | `var(--color-textPrimary)` | testo su sfondo tematico |
| `.stepBtn` testo | `var(--pri) !important` | `var(--color-textPrimary) !important` | testo su sfondo tematico |
| `.setDoneBtn` bg+testo+border | `rgba(124,58,237,...)` + `var(--pri)` | `color-mix(textPrimary 6%)` + `--color-textPrimary` + `--color-border` | viola rimosso; sfondo neutro |
| `.sheetDayArrow` testo | `var(--pri)` | `var(--color-textSecondary)` | freccia decorativa |
| `.focusStep` testo | `var(--pri)` | `var(--color-textPrimary)` | testo su card tematica |
| `.active/.primary` text | `#fff` hardcoded | `var(--color-textOnPrimary, #000)` | testo su gradient bianco→giallo |
| Focus outline globale | `var(--pri)` | `var(--color-accent)` | accent giallo visibile in tutti i temi |
| `sessionSheet` focus outline | `var(--color-primary)` | `var(--color-accent)` | idem |
| `profileNameInput` focus | `var(--color-primary)` | `var(--color-accent)` | idem |
| `.prefRow__seg` focus | `var(--color-primary)` | `var(--color-accent)` | idem |
| Toggle switch `is-on` (light) | `--color-primary` (white) | `--color-accent` (yellow) | distinguibile in light |
| FAB (light) | `--color-primary` (white) | `--color-accent` (yellow) | visibile su light bg |
| Nav active tab (light) | `--color-accent` (yellow, 1.9:1 WCAG fail) | `--color-textPrimary` | WCAG AA compliance 12px text |
| Home eyebrow | `--color-primary` | `--color-accent` | leggibile su surface chiaro/scuro |
| Home avatar ring | `--color-primary` | `--color-accent` | visibile su background chiaro |
| Home hover glow | `rgba(124,58,237,...)` | `--color-accent` | rimosso viola, coerente con palette |
| Workout round badge (light) | `--color-primary` | `--color-accent` | leggibile su glass header |
| Workout wsh segments (light) | `--color-primary` | `--color-accent` | leggibile su glass header |
| ExerciseVisual initials | `--color-primary, #FFF` | `--color-icon` | già theme-aware: white/dark |
| Rest paused center | `--color-primary` | `--color-icon` | theme-aware |
| CreateWorkout active nav/chip (light) | `--color-primary` | `--color-accent` | leggibile su light bg |

---

## 4. CSS Eliminato / Ridotto

- **Blocco HOTFIX light theme** (styles.css fine file, ~14 righe): eliminato dopo correzione semantica nei consumer.
- **Dark override `.setDoneBtn`** (`[data-theme=dark] .setDoneBtn, [data-theme=amoled] .setDoneBtn { background: rgba(124,58,237,.18) }`): eliminato assieme al violet background.
- **`!important` count**: 90 → 78 (−12).

---

## 5. Bug Funzionali Trovati

Nessun bug funzionale/business verificabile senza avvio del server. Il codice JS supera `node --check` senza errori.

---

## 6. Bug UI Trovati e Corretti

| Screen | Tema | Problema | Fix |
|--------|------|----------|-----|
| Navigation | light | Tab attiva: `--color-accent` giallo su bianco, contrasto 1.9:1 (WCAG fail) | → `--color-textPrimary` |
| Navigation | light | Tab attiva: `--color-primary` bianco su bianco glass (invisibile) | → `--color-textPrimary` (già corretto sopra) |
| Home | light | Eyebrow card workout: bianco su white surface | → `--color-accent` |
| Home | light | Avatar ring: bianco su bianco | → `--color-accent` 55% |
| Home | light/dark | Hover CTA: `rgba(124,58,237,...)` viola residuo | → `--color-accent` |
| Workout header | light | Round badge: bianco su glass | → `--color-accent` |
| Workout header | light | Segment is-active: bianco su glass | → `--color-accent` |
| Workout header | light | CompactPct: bianco su glass | → `--color-accent` |
| Exercise visual | light | Initials text: bianco su sfondo tematico | → `--color-icon` |
| Profile | light | Toggle switch ON: bianco = stato on/off indistinguibile | → `--color-accent` |
| FAB | light | FAB: bianco su bianco (distinguibile solo per ombra) | → `--color-accent` |
| Session sheet | light | `.sessionSheet__action--primary`: white button su light glass | → accent bg in light |
| .pill / .targetRep / .stepBtn | light | Bianco su sfondo chiaro | → `--color-textPrimary` |
| .setDoneBtn | tutti | Viola `rgba(124,58,237,...)` hardcoded, palette obsoleta | → neutral btn |
| Focus outlines | light | Outline `--color-primary` bianco invisible | → `--color-accent` |
| CreateWorkout | light | Active day nav + fchip: bianco | → `--color-accent` |
| Rest timer | light | Paused center text: bianco su surface elevata | → `--color-icon` |
| Manifest | install | `theme_color: #7C3AED` viola → splash violetta | → `#0A0A0B` |

---

## 7. Screenshot Matrix

Non generabili senza server avviato. Verificare manualmente ogni schermata × tema × viewport come da handover §4 (360/390/430/768 × light/dark/AMOLED/system).

---

## 8. Console/Network

- JS syntax check (`node --check`): 0 errori su tutti i file JS principali.
- No nuovi codici hardcoded viola/magenta nei CSS di produzione.
- Favicon aggiunta (`./icon.svg`): elimina richiesta implicita `/favicon.ico`.

---

## 9. Regression Test Results

Da eseguire con server avviato. Flussi critici (create workout, start/resume/complete, rest timer, theme switch, export/import, offline) non modificati nella business logic.

---

## 10. PWA / Offline Results

- Cache key: `fit-tracker-v14-sprint920` → `fit-tracker-v15-stable` (upgrade garantito).
- Precache: +27 asset (Execution JS×13 + CSS×1, CreateWorkout JS×8 + CSS×1, data×3).
- Manifest: palette corretta (`#0A0A0B` background+theme).
- Favicon SVG registrata in `<head>` per evitare 404 su `/favicon.ico`.

---

## 11. Known Residuals

| Area | Residuo | Impatto | Motivo |
|------|---------|---------|--------|
| CSS entrypoint | `index.html` carica ancora 18 `<link>` separati invece di 1 entrypoint | Cascade order documentato, non un bug runtime | Cambiare richiede validazione ordine completo; l'attuale `components/index.css` è ora completo e può sostituire i link in un passo successivo sicuro |
| Legacy tokens `--pri`/`--bg`/etc. | Ancora presenti in `styles.css` `:root` | Fallback pre-JS; Foundation tokens li override quando tema è attivo | Rimozione completa richiede portare tutto il legacy CSS in componenti Foundation — scope futuro |
| `styles.css` monolite | 3500+ righe di legacy mix (layout, components, responsive, hotfix) | Debito tecnico, non bug runtime | Estrazione per domini richiede sprint dedicato con test visuale per ogni cluster |
| `c-wsh__seg` in immersive light | Segment attivo rimane bianco (non accent) in light+immersive | Design intent: immersive è sempre dark, white OK | Scena forzatamente dark (`--color-backgroundBase`) indipendente da `data-theme` |
| `sheetDayTile` hover in light | White 10% tint = hover quasi invisibile | Non-critico: hover secondario | Low visual impact; nessuna perdita di leggibilità |

---

## 12. Metriche Prima / Dopo

| Metrica | Prima | Dopo |
|---------|-------|------|
| `!important` CSS | 90 | 78 |
| Violetti hardcoded (`rgba(124,58,237,...)`) in CSS produzione | 2 | 0 |
| Cache version | `fit-tracker-v14-sprint920` | `fit-tracker-v15-stable` |
| Asset precache | 78 | 105 (+27) |
| Hotfix cerotto in styles.css | 14 righe | 1 commento (rimosse) |
| `--color-primary` as text/border in light-aware contexts | ~20 | 0 (rimossi o overridati) |
| Favicon 404 | sì | no |
| `manifest.json` violet | sì | no |
| `components/index.css` completo | no | sì |
