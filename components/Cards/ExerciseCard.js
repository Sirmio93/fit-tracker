/* ==========================================================================
   Cards/ExerciseCard.js
   Card esercizio con lista di set (grid num · barra · valore · check).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';
import { Card } from './Card.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.target='Petto · isolato']
 * @param {string} [opts.title='Panca piana bilanciere']
 * @param {Array<{n:number, reps:number, weight:number, done?:boolean}>} [opts.sets]
 */
export function ExerciseCard(opts = {}) {
  const sets = opts.sets || [
    { n: 1, reps: 12, weight: 40 },
    { n: 2, reps: 12, weight: 40 },
    { n: 3, reps: 10, weight: 45 },
    { n: 4, reps: 8,  weight: 50 },
  ];

  const rows = sets.map(s => {
    const check = s.done ? renderIcon('check', 'small') : renderIcon('circle', 'small');
    return `<div class="c-card__set">` +
      `<span class="c-card__set__num">Set ${esc(s.n)}</span>` +
      `<span aria-hidden="true"></span>` +
      `<span class="c-card__set__val">${esc(s.reps)} × ${esc(s.weight)} kg</span>` +
      `<span aria-hidden="true">${check}</span>` +
    `</div>`;
  }).join('');

  return Card({
    variant: 'exercise',
    eyebrow: opts.target || 'Petto · isolato',
    title:   opts.title  || 'Panca piana bilanciere',
    extra:   rows,
  });
}
