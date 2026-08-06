/* ==========================================================================
   Workout/WorkoutHeader.js
   Header sessione attiva (gradient viola→magenta). Le azioni sono un slot
   HTML per non dipendere da Buttons/.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.eyebrow='Sessione attiva · 32 min']
 * @param {string} [opts.title='Push A · Giorno 3']
 * @param {string} [opts.progress='6/10 esercizi']
 * @param {string} [opts.actions] — HTML string (es. IconButton pausa).
 */
export function WorkoutHeader(opts = {}) {
  return `<header class="c-workoutHeader">
    <div class="c-workoutHeader__eyebrow">${esc(opts.eyebrow || 'Sessione attiva · 32 min')}</div>
    <h1 class="c-workoutHeader__title">${esc(opts.title || 'Push A · Giorno 3')}</h1>
    <div class="c-workoutHeader__row">
      <span class="c-workoutHeader__progress">${esc(opts.progress || '6/10 esercizi')}</span>
      ${opts.actions ? `<div class="c-workoutHeader__actions">${opts.actions}</div>` : ''}
    </div>
  </header>`;
}
