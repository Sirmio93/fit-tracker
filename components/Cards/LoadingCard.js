/* ==========================================================================
   Cards/LoadingCard.js
   Card skeleton — righe animate in shimmer.
   ========================================================================== */

import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {number} [opts.lines=3]  — numero di righe.
 */
export function LoadingCard(opts = {}) {
  const n = Math.max(1, Math.min(6, opts.lines != null ? opts.lines : 3));
  const widths = [60, 100, 80, 90, 70, 100];
  let extra = '';
  for (let i = 0; i < n; i++) {
    extra += `<div class="c-skeleton" style="width:${widths[i % widths.length]}%"></div>`;
  }
  return `<article class="c-card c-card--loading" aria-busy="true" aria-label="Caricamento in corso">${extra}</article>`;
}

// Note: la variante `loading` è auto-sufficiente: non usa Card() perché
// avrebbe generato semantica errata (title/body). Manteniamo la stessa
// firma `<article class="c-card ...">` per coerenza con le altre card.
