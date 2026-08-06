/* ==========================================================================
   Cards/StatisticCard.js
   Card KPI con valore grande, unità e delta positivo/negativo.
   ========================================================================== */

import { esc, cx } from '../Shared/helpers.js';
import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.eyebrow='Volume totale']
 * @param {string|number} [opts.value]
 * @param {string} [opts.unit='kg']
 * @param {string} [opts.delta]
 * @param {boolean} [opts.negative]
 */
export function StatisticCard(opts = {}) {
  const value = esc(opts.value != null ? opts.value : '12 480');
  const unit  = esc(opts.unit  != null ? opts.unit  : 'kg');
  const delta = esc(opts.delta != null ? opts.delta : '+ 8,4 % rispetto al mese scorso');

  const extra =
    `<div class="c-card__value">${value}<span class="c-card__unit">${unit}</span></div>` +
    `<div class="${cx(['c-card__delta', opts.negative ? 'is-negative' : ''])}">${delta}</div>`;

  return Card({
    variant: 'statistic',
    eyebrow: opts.eyebrow || 'Volume totale',
    extra,
    interactive: opts.interactive,
    ariaLabel: opts.ariaLabel,
  });
}
