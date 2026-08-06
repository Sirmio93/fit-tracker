/* ==========================================================================
   Cards/HistoryCard.js
   Card riga compatta storico. Avatar (iniziali), titolo, meta, badge.
   ========================================================================== */

import { esc, cx } from '../Shared/helpers.js';
import { Card } from './Card.js';

const BADGE_VARIANTS = new Set(['success', 'warning', 'error', 'info']);

/**
 * @param {Object} [opts]
 * @param {string} [opts.initials='PA']
 * @param {string} [opts.title]
 * @param {string} [opts.meta]
 * @param {string} [opts.badge='Completata']
 * @param {'success'|'warning'|'error'|'info'} [opts.badgeVariant='success']
 * @param {boolean} [opts.interactive]
 * @param {string}  [opts.ariaLabel]
 * @param {Object}  [opts.dataset]
 */
export function HistoryCard(opts = {}) {
  const variant = BADGE_VARIANTS.has(opts.badgeVariant) ? opts.badgeVariant : 'success';
  const extra =
    `<div class="c-avatar c-avatar--sm" aria-hidden="true">${esc(opts.initials || 'PA')}</div>` +
    `<div class="c-grow">` +
      `<div class="c-card__historyTitle">${esc(opts.title || 'Push A · Giorno 3')}</div>` +
      `<div class="c-card__meta">${esc(opts.meta || 'Ieri · 42 min · 5 200 kg')}</div>` +
    `</div>` +
    `<div class="${cx(['c-badge', `c-badge--${variant}`])}">${esc(opts.badge || 'Completata')}</div>`;

  return Card({
    variant: 'history',
    extra,
    interactive: opts.interactive,
    ariaLabel: opts.ariaLabel,
    dataset: opts.dataset,
  });
}
