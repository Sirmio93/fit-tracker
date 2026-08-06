/* ==========================================================================
   Charts/ProgressChart.js
   Chart di progresso a scelta (line | area | bar). Wrapper conveniente
   per la sezione "Progressi".
   ========================================================================== */

import { LineChart } from './LineChart.js';
import { AreaChart } from './AreaChart.js';
import { BarChart }  from './BarChart.js';

/**
 * @param {Object} [opts]
 * @param {'line'|'area'|'bar'} [opts.kind='line']
 * @param {number[]} [opts.data]
 * @param {string[]} [opts.labels] — solo per bar.
 * @param {string} [opts.title]
 * @param {string} [opts.ariaLabel]
 */
export function ProgressChart(opts = {}) {
  const kind = opts.kind || 'line';
  const base = {
    data: opts.data,
    title: opts.title,
    ariaLabel: opts.ariaLabel,
  };
  if (kind === 'area') return AreaChart(base);
  if (kind === 'bar')  return BarChart({ ...base, labels: opts.labels });
  return LineChart(base);
}
