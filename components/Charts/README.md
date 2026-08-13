> **HISTORICAL — la Foundation `Charts/` è stata rimossa nello Sprint 9.13.**
> I moduli descritti sotto (`LineChart`, `AreaChart`, `BarChart`, `Heatmap`, `WeeklyChart`, `MonthlyChart`, `ProgressChart`) NON esistono più nel repository.
> I grafici della schermata **Progressi** sono ora renderizzati da helper SVG inline in [`app.js`](../../app.js) (`progressLineChartHtml`, `progressBarChartHtml`, `progressHeatmapHtml`, `frequencyHeatmapData`, `onProgressChartTap`). Questo README è conservato come referenza storica del contratto originale.
> Per lo stato attuale, vedere [DOCS/FINAL_PROJECT_STATE.md](../../DOCS/FINAL_PROJECT_STATE.md).

---

# Charts

Grafici SVG puri, senza dipendenze da librerie esterne. Ogni chart è una funzione pura `data → HTML`. Nessun listener, nessun render loop.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `LineChart.js`    | `LineChart(opts)`    | Andamento nel tempo con dot su ogni punto. |
| `AreaChart.js`    | `AreaChart(opts)`    | Area riempita fino all'asse X (base a 0). |
| `BarChart.js`     | `BarChart(opts)`     | Barre verticali con label sull'asse X. |
| `Heatmap.js`      | `Heatmap(opts)`      | Griglia 7-colonne × N-settimane, livelli 0-4. |
| `WeeklyChart.js`  | `WeeklyChart(opts)`  | Preset BarChart (7 barre L-D). |
| `MonthlyChart.js` | `MonthlyChart(opts)` | Preset LineChart (12 punti Gen-Dic). |
| `ProgressChart.js`| `ProgressChart(opts)`| Router `kind: 'line'|'area'|'bar'` → chart concreto. |

## Contratto comune

Tutti i chart accettano:

- `data: number[]` — serie di valori (`Heatmap` accetta livelli 0-4).
- `title: string`  — mostrato sopra al SVG.
- `ariaLabel: string` — descrizione screen reader (fallback al title).
- `width`, `height`, `padding` — dimensioni SVG (default 320×120, pad 12).

## Esempi

```js
import { LineChart } from './Charts/LineChart.js';
import { WeeklyChart } from './Charts/WeeklyChart.js';
import { Heatmap } from './Charts/Heatmap.js';
import { ProgressChart } from './Charts/ProgressChart.js';

root.innerHTML =
  LineChart({ data: [3,5,4,7,6,8,9], title: 'Volume ultimi 7 giorni' }) +
  WeeklyChart({ data: [2,4,3,5,6,4,1] }) +
  Heatmap({ weeks: 8, title: 'Attività ultime 8 settimane' }) +
  ProgressChart({ kind: 'area', data: [10, 20, 25, 40] });
```

## Regole

- Nessuna dipendenza cross-categoria. `ProgressChart` importa `LineChart`/`AreaChart`/`BarChart` dalla stessa cartella (consentito).
- Solo Design Tokens nel CSS: le tinte derivano da `--color-primary` (con `color-mix` per Heatmap).
- `viewBox` scala automaticamente: il chart è responsive senza media query.
- Nessun listener: i chart sono presentazionali. Per tooltip interattivi, il chiamante può aggiungere listener sui `<rect>`/`<circle>` (hanno classi `.c-chart__bar` / `.c-chart__dot`).
