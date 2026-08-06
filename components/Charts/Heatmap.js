/* ==========================================================================
   Charts/Heatmap.js
   Griglia 7×N (settimane × giorni) con livelli 0-4. Se `data` non è
   fornito, genera valori pseudo-random deterministici (per showcase).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {number[]} [opts.data]  — array di livelli 0-4; length arbitrario.
 * @param {number} [opts.weeks=5] — usato se `data` non fornito.
 * @param {string} [opts.title='Attività ultimo mese']
 * @param {string} [opts.ariaLabel]
 */
export function Heatmap(opts = {}) {
  let data = opts.data;
  if (!Array.isArray(data)) {
    const weeks = opts.weeks || 5;
    const days = weeks * 7;
    let seed = 0;
    data = [];
    for (let i = 0; i < days; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      data.push(Math.floor((seed / 233280) * 5));
    }
  }

  const cells = data.map(v => {
    const lvl = Math.max(0, Math.min(4, Math.floor(v)));
    return `<div class="c-heatmap__cell" data-level="${lvl}" title="Livello ${lvl}" aria-label="Livello ${lvl}"></div>`;
  }).join('');

  return `<div class="c-chart">
    <h4 class="c-chart__title">${esc(opts.title || 'Attività ultimo mese')}</h4>
    <div class="c-heatmap" role="img" aria-label="${esc(opts.ariaLabel || opts.title || 'Heatmap attività')}">${cells}</div>
  </div>`;
}
