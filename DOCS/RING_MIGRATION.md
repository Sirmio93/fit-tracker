# Sprint 9.2B — Unified Ring System

## Obiettivo

Eliminare la duplicazione tra tutte le implementazioni di anelli SVG
dell'app riconducendole a una primitiva unica in Foundation.

Il design NON è cambiato: comportamento visivo, aria, timing e stati
identici. Solo l'origine dell'SVG è stata centralizzata.

---

## Primitiva unica

**File**: [components/Foundation/Ring.js](../components/Foundation/Ring.js)
**Stile**: [components/Foundation/ring.css](../components/Foundation/ring.css)
**Export**: `Ring`, `setRingProgress`, `setRingColor` da
[components/index.js](../components/index.js) → disponibili su `window.UI`.

### API

```js
Ring({
  value: 42,               // 0..max
  max: 100,
  size: 'sm' | 'md' | 'lg' | 'xl' | <number px>,
  stroke: <number px>,     // opzionale — default dal size preset
  color: 'primary' | 'success' | 'warning' | 'error' | 'neutral',
  background: 'surface' | 'subtle' | 'transparent',
  animated: true,          // transizione su stroke-dashoffset
  showLabel: false,        // label % centrale
  label: 'string',         // override testo label
  centerHtml: '<html>',    // slot centrale custom (countdown, KPI, ecc.)
  showGlow: false,         // drop-shadow via --glow-primary / --glow-success
  ariaLabel, role, className, id,
})
```

### Update in-place

```js
setRingProgress(el, value, max?)
setRingColor(el, 'success')   // cambia colore runtime
```

### Casi d'uso coperti

- **Progress ring** — Workout focus view, NextExercise, Home Today Card.
- **Countdown ring** — Rest Scene (CircularRestTimer, RestCountdownHero).
- **Statistic ring** — futuro (KPI, obiettivi).
- **Analytics ring** — futuro (retention, adherence).

---

## Implementazioni eliminate

| Origine | Cosa | Ora |
|---|---|---|
| [components/Workout/ProgressRing.js](../components/Workout/ProgressRing.js) | markup SVG duplicato (`<svg><circle track><circle fill>`) + geometry math | delegato a `Ring()` |
| [components/Workout/workout.css](../components/Workout/workout.css) | regole `.c-progressRing__track / __fill / __label` | rimosse (promosse su `.c-ring__*`) |
| [components/Rest/CircularRestTimer.js](../components/Rest/CircularRestTimer.js) | markup SVG duplicato + geometry math + drop-shadow inline | delegato a `Ring()` con `showGlow` + `centerHtml` |
| [components/Rest/rest.css](../components/Rest/rest.css) | regole `.c-circularRestTimer__ring / __track / __fill` + `250ms linear` hardcoded | rimosse; ring animato via `--ring-transition` (override con `--duration-tick` token) |
| [components/Home/TodaySessionCard.js](../components/Home/TodaySessionCard.js) | SVG inline (`<svg class="c-todayCard__ringSvg">`) + geometry math | delegato a `Ring()` con `centerHtml` per la percentuale grossa + label |
| [components/Home/home.css](../components/Home/home.css) | regole `.c-todayCard__ringSvg / __ringTrack / __ringFill` + `width/height` hardcoded | rimosse; il size viene guidato via `--ring-size` sul figlio `.c-ring` |

Totale: **3 renderer SVG paralleli + 3 blocchi di CSS duplicati** → **1 sola primitiva**.

---

## Componenti migrati

| Componente | Consumer | Note |
|---|---|---|
| `ProgressRing` | Workout (focus view), `NextExercise` (preview) | wrapper thin: chiama `Ring()` con `className: 'c-progressRing'` per gli hook di layout esistenti (`.focusRingWrap .c-progressRing`). Nessuna modifica ai chiamanti. |
| `setProgressRing` | app.js `updateRestOverlayRing` fallback | delegato a `setRingProgress(el, pct, 100)`. |
| `CircularRestTimer` | Rest overlay legacy + `RestCountdownHero` (Rest V2) | il ring SVG proviene da `Ring()` come figlio. Il display centrale (countdown + unit) e il pulsante pausa/riprendi restano nel wrapper. |
| `setCircularRestProgress` | app.js `updateRestTimerOnly` (250ms tick) | delegato a `setRingProgress` sul `.c-ring` interno. Countdown fluido grazie a `--ring-transition: var(--duration-tick) linear`. |
| `setCircularRestPaused` | app.js pause/resume | wrapper button invariato, ring stato via `data-paused` (opacity 0.55 su `.c-ring__fill`). |
| `setCircularRestTotal` | app.js "+15s" | aggiorna `data-total` sia sul wrapper che su `data-max` del ring interno. |
| `TodaySessionCard` (Home hero card) | Home v9 | il ring del pannello OGGI ora è `Ring({size:96, centerHtml: '<ringInfo>'})`. La percentuale grossa (24px) + label ("Completato") sono passate come `centerHtml`. |

---

## Componenti rimasti (non-ring; fuori scope)

| Componente | Perché non è un ring |
|---|---|
| `WorkoutProgress` ([components/Workout/WorkoutProgress.js](../components/Workout/WorkoutProgress.js)) | è una progress **bar orizzontale** (`<div class="fill" style="width:X%">`), non un anello SVG. Nessuna condivisione di codice con Ring. |
| `AreaChart` / `LineChart` / `BarChart` / `Heatmap` / `MonthlyChart` / `WeeklyChart` / `ProgressChart` ([components/Charts/](../components/Charts/)) | SVG di grafici multi-serie/heatmap — dominio diverso, nessun anello. |
| Progress screen | usa solo Charts (LineChart, AreaChart, BarChart) — nessun ring in schermata Progressi. Migrazione **no-op**. |
| `AnatomyModel` ([components/Anatomy/AnatomyModel.js](../components/Anatomy/AnatomyModel.js)) | anatomia (manichino), non un anello. |

### Sandbox

Il file [sandbox/components.js](../sandbox/components.js) contiene una copia
in-line della vecchia `ProgressRing` (build stand-alone del design explorer).
Non è caricato dall'app runtime — è uno strumento di consultazione isolato.
Lasciato invariato per non alterare la baseline dell'explorer; una migrazione
del sandbox è possibile in un follow-up dedicato.

---

## Motion & Glow

**Motion**: nessuna `duration` letterale. Ring usa:

- `--ring-transition: var(--duration-slow) var(--curve-easeOut)` — default.
- Override per il countdown per-secondo:
  `--ring-transition: var(--duration-tick) linear` (nuovo token `--duration-tick: 250ms`
  aggiunto a [tokens.css](../components/Foundation/tokens.css) accanto agli altri
  token semantici dello Sprint 9.2A).

**Glow**: nessun `box-shadow`/`drop-shadow` locale. Ring espone `showGlow`
che monta `filter: drop-shadow(var(--ring-glow))` con:

- `--glow-primary` per `color: 'primary'`,
- `--glow-success` per `color: 'success'`.

Il precedente `drop-shadow(0 6px 22px color-mix(...))` inline del
CircularRestTimer è stato rimosso e sostituito da `--glow-primary`
(comportamento glow più coerente con Buttons/CTA che già usano gli stessi
token).

---

## Accessibilità

Ogni `Ring` emette (default):

- `role="progressbar"`
- `aria-valuemin="0"` · `aria-valuemax="{max}"` · `aria-valuenow="{Math.round(value)}"`
- `aria-label` (dal `ariaLabel` prop, fallback al label testuale).

Attributi valori aggiornati anche da `setRingProgress` senza rimontare.

---

## Differenze residue vs implementazione precedente

Elencate esplicitamente per audit visivo:

1. **CircularRestTimer — glow**: da `drop-shadow(0 6px 22px …color-mix 22%…)`
   locale a `filter: drop-shadow(var(--glow-primary))` (`0 0 12px …45%…`) e
   `var(--glow-success)` in stato ending. Il glow è ora **più corto e più
   saturo**, coerente con i CTA. Se il feedback visivo lo richiede si può
   introdurre un `--glow-primary-lg` token e usarlo qui.
2. **CircularRestTimer — track color**: da `color-mix(textPrimary 8%)` a
   `color-mix(textPrimary 8%)` via preset `background: 'subtle'`. Stessa
   resa; ora centralizzata.
3. **Ring transition default**: da `var(--duration-slow) var(--curve-default)`
   (ProgressRing, TodaySessionCard) a `var(--duration-slow) var(--curve-easeOut)`.
   Curva più "vicina alla fine" del cubic-bezier default. Percettibile solo
   su transizioni lunghe (>200ms). Se serve preservare l'esatta easing
   precedente, il consumer può fare `.c-ring { --ring-transition: var(--duration-slow) var(--curve-default); }`.
4. **TodaySessionCard tablet size**: la media-query 768px+ ora agisce via
   `.c-todayCard__ring .c-ring { --ring-size: 112px }` invece di
   `width/height` sul wrapper. Stessa dimensione finale (112px).
5. **CircularRestTimer paused fill**: l'attenuazione (`opacity: 0.55`) ora è
   applicata a `.c-ring__fill` (invece che `.c-circularRestTimer__fill`).
   Stesso valore, stesso effetto.

Nessuna differenza di **business logic**, di **dati**, o di **API pubblica**.
Tutti i chiamanti (app.js, RestCountdownHero, NextExercise) restano invariati.

---

## Ordine di migrazione eseguito

1. **Workout** — `ProgressRing` → adapter su `Ring`.
2. **Rest** — `CircularRestTimer` → adapter su `Ring` (+ update helpers ripuntati).
3. **Home** — `TodaySessionCard` inline SVG → `Ring` con `centerHtml`.
4. **Progress** — **no-op**: nessun anello presente nella schermata Progressi.

I wrapper legacy (`ProgressRing`, `CircularRestTimer`) continuano a funzionare
e sono l'unica superficie che i consumer conoscono: il rendering interno è
ora unico.

---

## Stato

- Deliverable pronti. **In attesa di approvazione prima di Sprint 9.3.**
