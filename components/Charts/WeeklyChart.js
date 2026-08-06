/* ==========================================================================
   Charts/WeeklyChart.js
   Bar chart preset per l'aggregazione settimanale (7 barre L-D).
   ========================================================================== */

import { BarChart } from './BarChart.js';

/**
 * @param {Object} [opts]
 * @param {number[]} [opts.data] — 7 valori (Lun→Dom).
 * @param {string} [opts.title='Sessioni per giorno']
 */
export function WeeklyChart(opts = {}) {
  return BarChart({
    data: opts.data || [3, 5, 2, 6, 4, 7, 1],
    labels: ['L', 'M', 'M', 'G', 'V', 'S', 'D'],
    title: opts.title || 'Sessioni per giorno',
    ariaLabel: opts.ariaLabel,
  });
}
