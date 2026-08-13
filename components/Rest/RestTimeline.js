/* ==========================================================================
   Rest/RestTimeline.js — Sprint 9.2 (Premium Rest Experience)
   Mini timeline verticale: dove sei, cosa hai appena chiuso, cosa arriva.

   Mockup:
     ✓ Chest Press           ← done (just completed)
     ● Shoulder Press        ← active (starts right after rest)
       Romanian Deadlift     ← upcoming (after next)

   L'utente deve capire in un colpo d'occhio:
     - da dove viene
     - cosa sta per iniziare
     - cosa arriva dopo

   Layout puro, nessuna logica: prende una lista di items pre-elaborati dal
   chiamante (nextRestExerciseInfo / restTimelineInfo in app.js).
   ========================================================================== */

import { esc, cx } from '../Shared/helpers.js';

/**
 * @param {Object} opts
 * @param {Array<{label:string,state?:'done'|'active'|'upcoming'}>} opts.items
 * @param {string} [opts.title='Ordine giro']  aria-label del gruppo
 */
export function RestTimeline(opts = {}) {
  const items = Array.isArray(opts.items) ? opts.items.filter(Boolean) : [];
  const title = opts.title || 'Ordine giro';

  if (!items.length) return '';

  const rowsHtml = items.map((it, i) => {
    const state = it.state || 'upcoming';
    const marker = state === 'done'   ? '<span class="c-restTimeline__mark c-restTimeline__mark--done" aria-hidden="true">✓</span>'
                 : state === 'active' ? '<span class="c-restTimeline__mark c-restTimeline__mark--active" aria-hidden="true"></span>'
                 :                      '<span class="c-restTimeline__mark c-restTimeline__mark--upcoming" aria-hidden="true"></span>';
    const isLast = i === items.length - 1;
    const cls = cx([
      'c-restTimeline__row',
      `is-${state}`,
      isLast ? 'is-last' : '',
    ]);
    const aria = state === 'active'   ? ' aria-current="step"'
              :  state === 'done'     ? ' aria-label="Completato"'
              :                          '';
    return `<li class="${cls}"${aria}>
      ${marker}
      <span class="c-restTimeline__label">${esc(it.label || '')}</span>
    </li>`;
  }).join('');

  return `<nav class="c-restTimeline" aria-label="${esc(title)}">
    <ol class="c-restTimeline__list">${rowsHtml}</ol>
  </nav>`;
}
