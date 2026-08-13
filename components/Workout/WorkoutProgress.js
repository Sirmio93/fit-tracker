/* ==========================================================================
   Workout/WorkoutProgress.js — Sprint 8.5
   Progress bar orizzontale della sessione: set completati / set totali.
   UI-only, nessuno stato, nessun side-effect. Il fill anima via CSS
   transition su width. Rieseguire il factory con nuovi valori è OK; per
   update in-place senza rimontare usare setWorkoutProgress(root, done, total).
   ========================================================================== */

import { esc, attr, clamp } from '../Shared/helpers.js';

/**
 * @param {Object} opts
 * @param {number} [opts.done=0]     serie completate
 * @param {number} [opts.total=0]    serie totali
 * @param {string} [opts.label]      testo mostrato (default: "X/Y serie")
 * @param {string} [opts.ariaLabel]  label accessibile (default: "Progresso sessione")
 */
export function WorkoutProgress(opts = {}) {
  const done  = Math.max(0, Number(opts.done)  || 0);
  const total = Math.max(0, Number(opts.total) || 0);
  const pct   = total > 0 ? clamp((done / total) * 100, 0, 100) : 0;
  const label = opts.label != null ? opts.label : `${done}/${total} serie`;

  return `<div ${attr({
    class: 'c-workoutProgress',
    role: 'progressbar',
    'aria-label': opts.ariaLabel || 'Progresso sessione',
    'aria-valuemin': 0,
    'aria-valuemax': total || 100,
    'aria-valuenow': done,
    'data-done':  done,
    'data-total': total,
  })}>
    <div class="c-workoutProgress__head">
      <span class="c-workoutProgress__label">${esc(label)}</span>
      <span class="c-workoutProgress__pct">${Math.round(pct)}%</span>
    </div>
    <div class="c-workoutProgress__track" aria-hidden="true">
      <div class="c-workoutProgress__fill" style="width:${pct.toFixed(2)}%"></div>
    </div>
  </div>`;
}

/**
 * Aggiorna in-place la progress bar senza rimontare.
 * @param {HTMLElement} rootEl
 * @param {number} done
 * @param {number} total
 * @param {string} [label]
 */
export function setWorkoutProgress(rootEl, done, total, label) {
  if (!rootEl) return;
  const d = Math.max(0, Number(done)  || 0);
  const t = Math.max(0, Number(total) || 0);
  const pct = t > 0 ? clamp((d / t) * 100, 0, 100) : 0;
  rootEl.dataset.done  = String(d);
  rootEl.dataset.total = String(t);
  rootEl.setAttribute('aria-valuenow', String(d));
  rootEl.setAttribute('aria-valuemax', String(t || 100));
  const fill = rootEl.querySelector('.c-workoutProgress__fill');
  if (fill) fill.style.width = pct.toFixed(2) + '%';
  const lab  = rootEl.querySelector('.c-workoutProgress__label');
  if (lab) lab.textContent = label != null ? label : `${d}/${t} serie`;
  const pctEl = rootEl.querySelector('.c-workoutProgress__pct');
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
}
