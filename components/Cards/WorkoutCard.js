/* ==========================================================================
   Cards/WorkoutCard.js
   Card sessione attiva (gradient viola→magenta).
   ========================================================================== */

import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.eyebrow='Sessione attiva']
 * @param {string} [opts.title]
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string per il footer.
 * @param {boolean} [opts.interactive]
 * @param {string}  [opts.ariaLabel]
 * @param {Object}  [opts.dataset]
 */
export function WorkoutCard(opts = {}) {
  return Card({
    variant: 'workout',
    eyebrow: opts.eyebrow || 'Sessione attiva',
    title:   opts.title   || 'Push A · Giorno 3',
    body:    opts.body    || '32 min · 6/10 esercizi',
    footer:  opts.action  || '',
    interactive: opts.interactive,
    ariaLabel: opts.ariaLabel,
    dataset: opts.dataset,
  });
}
