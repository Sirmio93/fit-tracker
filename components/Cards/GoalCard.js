/* ==========================================================================
   Cards/GoalCard.js
   Card obiettivo con progress bar animata.
   ========================================================================== */

import { esc, clamp } from '../Shared/helpers.js';
import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.eyebrow='Obiettivo settimanale']
 * @param {string} [opts.title]
 * @param {number} [opts.progress=68]  — 0-100.
 * @param {string} [opts.unit='%']
 * @param {string} [opts.hint]         — testo aggiuntivo sotto la barra.
 */
export function GoalCard(opts = {}) {
  const pct = clamp(opts.progress != null ? opts.progress : 68, 0, 100);
  const hint = opts.hint != null
    ? esc(opts.hint)
    : `${pct} % · rimangono ${100 - pct} minuti`;

  const extra =
    `<div class="c-progressBar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">` +
      `<div class="c-progressBar__fill" style="width:${pct}%"></div>` +
    `</div>` +
    `<p class="c-card__body">${hint}</p>`;

  return Card({
    variant: 'goal',
    eyebrow: opts.eyebrow || 'Obiettivo settimanale',
    title:   opts.title   || '4 sessioni completate',
    extra,
  });
}
