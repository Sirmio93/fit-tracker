/* ==========================================================================
   Cards/EmptyCard.js
   Card di stato vuoto con icona centrale e messaggio.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';
import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.icon='circle']
 * @param {string} [opts.title]
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string (Button per CTA).
 */
export function EmptyCard(opts = {}) {
  const extra =
    `<div class="c-card__icon" aria-hidden="true">${renderIcon(opts.icon || 'circle', 'xl')}</div>` +
    `<div class="c-card__emptyTitle">${esc(opts.title || 'Nessun dato ancora')}</div>` +
    `<p class="c-card__body">${esc(opts.body || 'Le tue statistiche compariranno qui dopo la prima sessione.')}</p>` +
    (opts.action ? `<div class="c-card__row">${opts.action}</div>` : '');

  return Card({ variant: 'empty', extra });
}
