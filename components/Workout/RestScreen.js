/* ==========================================================================
   Workout/RestScreen.js
   Schermata di recupero (fullscreen o dentro un layer). Numero grande +
   label + slot azioni (±15s in genere).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { formatSeconds } from './FloatingTimer.js';

/**
 * @param {Object} [opts]
 * @param {string|number} [opts.time='00:45'] — se number, secondi.
 * @param {string} [opts.label='Recupero in corso']
 * @param {string} [opts.actions] — HTML string.
 */
export function RestScreen(opts = {}) {
  const time = typeof opts.time === 'number' ? formatSeconds(opts.time) : (opts.time || '00:45');
  return `<section class="c-restScreen" role="status" aria-live="polite">
    <div class="c-restScreen__label">${esc(opts.label || 'Recupero in corso')}</div>
    <div class="c-restScreen__time" aria-atomic="true">${esc(time)}</div>
    ${opts.actions ? `<div class="c-restScreen__actions">${opts.actions}</div>` : ''}
  </section>`;
}

/**
 * Aggiorna il display del tempo senza rimontare.
 * @param {HTMLElement} el
 * @param {number|string} time
 */
export function updateRestScreen(el, time) {
  if (!el) return;
  const t = typeof time === 'number' ? formatSeconds(time) : time;
  const tEl = el.querySelector('.c-restScreen__time');
  if (tEl) tEl.textContent = t;
}
