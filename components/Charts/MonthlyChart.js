/* ==========================================================================
   Charts/MonthlyChart.js
   Line chart preset per l'aggregazione mensile (12 punti).
   ========================================================================== */

import { LineChart } from './LineChart.js';

/**
 * @param {Object} [opts]
 * @param {number[]} [opts.data] — 12 valori (Gen→Dic).
 * @param {string} [opts.title='Volume mensile']
 */
export function MonthlyChart(opts = {}) {
  return LineChart({
    data: opts.data || [12, 15, 14, 18, 20, 22, 21, 24, 27, 26, 28, 30],
    title: opts.title || 'Volume mensile',
    ariaLabel: opts.ariaLabel,
  });
}
