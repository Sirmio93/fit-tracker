# Workout

Componenti della schermata di allenamento attivo: picker per peso/reps, ring di progresso, timer, header, CTA "termina".

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `WeightPicker.js`   | `WeightPicker(opts)`, `mountWeightPicker(el, cb)` | Stepper peso con step configurabile (default 2.5 kg). |
| `RepsPicker.js`     | `RepsPicker(opts)`, `mountRepsPicker(el, cb)` | Stepper ripetizioni (step 1, min 1, max 100). |
| `ProgressRing.js`   | `ProgressRing(opts)`, `setProgressRing(el, pct)` | Donut SVG con label opzionale. |
| `FloatingTimer.js`  | `FloatingTimer(opts)`, `updateFloatingTimer(el, patch)`, `formatSeconds(n)` | Chip timer di recupero. |
| `NextExercise.js`   | `NextExercise(opts)` | Preview con ring piccolo + eyebrow + titolo. |
| `WorkoutHeader.js`  | `WorkoutHeader(opts)` | Header sessione (gradient viola→magenta). |
| `CompleteButton.js` | `CompleteButton(opts)` | CTA finale full-width (gradient success). |

## Contratti chiave

### Picker
Entrambi accettano `value`, `step`, `min`, `max`, `disabled`. Il markup include `data-value`, `data-step`, `data-min`, `data-max` che `mount*()` legge per gestire l'aritmetica. `WeightPicker` accetta anche `unit` (default `kg`).

```js
import { WeightPicker, mountWeightPicker } from './Workout/WeightPicker.js';
root.innerHTML = WeightPicker({ value: 50, step: 2.5, min: 0, max: 200 });
const dispose = mountWeightPicker(root.querySelector('.c-picker--weight'), v => {
  console.log('nuovo peso', v);
});
```

### ProgressRing
Il valore inizia via prop. Per aggiornamenti fluidi (es. avanzamento esercizi), usa `setProgressRing(el, pct)` invece di rimontare — sfrutta la transizione CSS su `stroke-dashoffset`.

### FloatingTimer
Il conteggio è **responsabilità del chiamante** (setInterval, requestAnimationFrame o Web Worker). Il componente espone `updateFloatingTimer(el, {time, state, label})` per aggiornare il display senza ri-render. Passando `time` come numero, viene formattato come `mm:ss` via `formatSeconds()` (esportata anche a sé stante).

### WorkoutHeader
`actions` è HTML string. Il chiamante può passare un `IconButton({icon:'pause'})` da Buttons/ senza che Workout/ lo importi.

### CompleteButton
Non è un `Button` standard: ha peso visivo dedicato (gradient success, full-width, altezza `--touch-fab`). Stato `loading` con spinner; `disabled` con `aria-disabled`.

## Regole

- Nessun listener globale. `mountPicker` ritorna un `dispose()`.
- I picker leggono la configurazione dai `data-*` sul root: il mount è idempotente.
- Solo Design Tokens nel CSS.
- Le icone provengono da `Shared/Icon.js`.
- L'unica dipendenza cross-categoria è `Shared/`. `NextExercise` importa da un componente della stessa categoria (`ProgressRing`), consentito.
