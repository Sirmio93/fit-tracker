/* ==========================================================================
   Execution/NeighborPeek.js — T2.2 (PROGETTO_MOCKUP)
   Mini-card "precedente" / "prossimo" mostrata sotto lo stepper. Aiuta
   l'utente a capire dove si trova nel flow senza uscire dalla Focus Mode.
   Tap = naviga a quel blocco.

   Se non c'è neighbor (primo/ultimo esercizio) ritorna stringa vuota — MAI
   dati artificiali (feedback_pixel_polish_rules.md).

   Puro rendering. La navigazione avviene via `data-action` esistente:
     · prev  →  data-action="focus-prev-block"
     · next  →  data-action="focus-next-block"
   Se `focus-prev-block` non è wired, cade su `focus-prev` (comportamento
   invariato — la nav di S.focus.blockIdx è già gestita in app.js).
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';

function fmtLast(kg, reps) {
  const k = +kg;
  const bits = [];
  if (Number.isFinite(k) && k > 0) {
    bits.push((Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, '')) + ' kg');
  }
  if (reps != null && String(reps).trim() && String(reps) !== '0') {
    bits.push(String(reps) + ' rip');
  }
  return bits.join(' · ');
}

/**
 * @param {Object} p
 * @param {'prev'|'next'} p.side
 * @param {string} p.exerciseName          — nome esercizio del neighbor (se null → "").
 * @param {number} [p.lastKg]              — ultimo kg loggato su quel neighbor.
 * @param {string|number} [p.lastReps]     — ultime reps.
 * @param {string} [p.crumb]               — micro-crumb "C2", "B4", ecc. (opzionale).
 * @param {string} [p.action]              — override data-action (default: 'focus-prev-block'
 *                                            per prev, 'focus-next-block' per next).
 * @returns {string} HTML string ("" se exerciseName vuoto).
 */
export function renderNeighborPeek(p) {
  const opts = p || {};
  const name = opts.exerciseName ? String(opts.exerciseName).trim() : '';
  if (!name) return '';

  const side = opts.side === 'next' ? 'next' : 'prev';
  const action = opts.action || (side === 'next' ? 'focus-next-block' : 'focus-prev-block');
  const labelTxt = side === 'next' ? 'Prossimo →' : '← Precedente';
  const lastTxt = fmtLast(opts.lastKg, opts.lastReps);

  const btnAttrs = attr({
    type: 'button',
    class: 'ex-peek ex-peek--' + side,
    'data-action': action,
    'data-side': side,
    'aria-label': (side === 'next' ? 'Vai al blocco successivo' : 'Vai al blocco precedente') + ': ' + name,
  });

  const crumbHtml = opts.crumb
    ? '<span class="ex-peek__crumb">' + esc(opts.crumb) + '</span>'
    : '';

  const lastHtml = lastTxt
    ? '<span class="ex-peek__last">' + esc(lastTxt) + '</span>'
    : '';

  return '<button ' + btnAttrs + '>'
    + '<span class="ex-peek__lbl">'
    +   '<span class="ex-peek__dir">' + esc(labelTxt) + '</span>'
    +   crumbHtml
    + '</span>'
    + '<span class="ex-peek__t">' + esc(name) + '</span>'
    + lastHtml
    + '</button>';
}
