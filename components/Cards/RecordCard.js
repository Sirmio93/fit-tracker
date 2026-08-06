/* ==========================================================================
   Cards/RecordCard.js
   Card di celebrazione Personal Record (gradient dorato/rosa).
   ========================================================================== */

import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.eyebrow='Personal Record']
 * @param {string} [opts.title]
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string per footer.
 */
export function RecordCard(opts = {}) {
  return Card({
    variant: 'record',
    eyebrow: opts.eyebrow || 'Personal Record',
    title:   opts.title   || 'Panca piana · 82 kg',
    body:    opts.body    || 'Nuovo massimo raggiunto oggi. + 5 kg dall\'ultimo PR.',
    footer:  opts.action  || '',
    interactive: opts.interactive,
    ariaLabel: opts.ariaLabel,
  });
}
