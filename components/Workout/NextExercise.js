/* ==========================================================================
   Workout/NextExercise.js
   Preview del prossimo esercizio. Composizione: ProgressRing (piccolo) +
   eyebrow "Prossimo" + titolo.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { ProgressRing } from './ProgressRing.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.title='Dip parallele · 3×10']
 * @param {number} [opts.progress=40] — 0-100, avanzamento all'esercizio corrente.
 * @param {string} [opts.eyebrow='Prossimo']
 */
export function NextExercise(opts = {}) {
  return `<div class="c-nextExercise">
    ${ProgressRing({ progress: opts.progress != null ? opts.progress : 40, size: 48, stroke: 4, showLabel: false })}
    <div class="c-nextExercise__body">
      <div class="c-nextExercise__eyebrow">${esc(opts.eyebrow || 'Prossimo')}</div>
      <div class="c-nextExercise__title">${esc(opts.title || 'Dip parallele · 3×10')}</div>
    </div>
  </div>`;
}
