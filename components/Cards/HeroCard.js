/* ==========================================================================
   Cards/HeroCard.js
   Card gradient full-bleed per la sessione in corso.
   ========================================================================== */

import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.eyebrow='In corso']
 * @param {string} [opts.title]
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string (es. Button ghost) mostrato in footer.
 * @param {boolean} [opts.interactive]
 * @param {string}  [opts.ariaLabel]
 * @param {Object}  [opts.dataset]
 */
export function HeroCard(opts = {}) {
  return Card({
    variant: 'hero',
    eyebrow: opts.eyebrow || 'In corso',
    title:   opts.title   || 'Push A · Settimana 2',
    body:    opts.body    || 'Ultima sessione: ieri • 8 esercizi',
    footer:  opts.action  || '',
    interactive: opts.interactive,
    ariaLabel: opts.ariaLabel,
    dataset: opts.dataset,
  });
}
