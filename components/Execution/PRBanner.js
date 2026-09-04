/* ==========================================================================
   Execution/PRBanner.js — T2.2 (PROGETTO_MOCKUP)
   Banner "Nuovo record" live: appare quando i valori del set attivo
   supererebbero il PR precedente per quell'esercizio (kg max storico).

   Ritorna stringa vuota se non c'è PR — così il consumer può fare
   `${renderPRBanner(...)}` senza guard.

   Palette: giallo accent (accent-soft bg, accent-2 title).
   ARIA: role="status" + aria-live="polite" così screen reader annunciano
   il PR quando appare senza interrompere il flow.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

function fmtKg(n) {
  const v = +n;
  if (!Number.isFinite(v)) return '';
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '');
}

/**
 * @param {Object} p
 * @param {boolean} p.isPR                 — se false, ritorna "".
 * @param {number}  [p.currentKg]          — kg del set attivo (per il testo).
 * @param {number}  [p.prevMax=0]          — miglior kg storico su questo esercizio.
 * @param {number|string} [p.prevReps]     — reps del PR precedente (per il testo).
 * @param {string}  [p.prevWhenLabel]      — data testuale del PR prec (es. "14 ago 2025"), opz.
 * @returns {string} HTML string.
 */
export function renderPRBanner(p) {
  const opts = p || {};
  if (!opts.isPR) return '';

  const currentKg = +opts.currentKg || 0;
  const prevMax   = +opts.prevMax   || 0;
  const delta     = currentKg - prevMax;
  const deltaTxt  = delta > 0 ? `+${fmtKg(delta)}kg dal migliore` : 'Nuovo record';

  // Testo secondario: "superi 60 kg × 8" (dettaglio del PR precedente).
  let subTxt = '';
  if (prevMax > 0) {
    const parts = [fmtKg(prevMax) + ' kg'];
    if (opts.prevReps) parts.push('× ' + String(opts.prevReps));
    subTxt = 'superi ' + parts.join(' ');
    if (opts.prevWhenLabel) subTxt += ' (' + opts.prevWhenLabel + ')';
  } else {
    subTxt = 'primo record su questo esercizio';
  }

  return `<div class="ex-pr-banner"
      role="status"
      aria-live="polite"
      data-pr="1"
      data-delta-kg="${esc(fmtKg(Math.max(0, delta)))}">
    <span class="ex-pr-banner__dot" aria-hidden="true"></span>
    <div class="ex-pr-banner__body">
      <div class="ex-pr-banner__t"><b>Nuovo record</b> · ${esc(deltaTxt)}</div>
      <div class="ex-pr-banner__s">${esc(subTxt)}</div>
    </div>
  </div>`;
}
