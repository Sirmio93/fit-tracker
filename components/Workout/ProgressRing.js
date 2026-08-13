/* ==========================================================================
   Workout/ProgressRing.js — Sprint 9.2B (adapter → Foundation/Ring)
   Wrapper compat. Il rendering SVG è delegato alla primitiva unica Ring
   (Foundation/Ring.js). API pubblica invariata per non toccare i chiamanti
   (app.js, NextExercise). `setProgressRing(el, pct)` delega a
   `setRingProgress`.
   ========================================================================== */

import { Ring, setRingProgress } from '../Foundation/Ring.js';

/**
 * @param {Object} [opts]
 * @param {number} [opts.progress=62]  — 0-100.
 * @param {number} [opts.size=96]      — px.
 * @param {number} [opts.stroke=8]     — px.
 * @param {boolean} [opts.showLabel=true]
 * @param {string} [opts.ariaLabel]
 */
export function ProgressRing(opts = {}) {
  const progress = opts.progress != null ? opts.progress : 62;
  const size     = opts.size != null ? opts.size : 96;
  const stroke   = opts.stroke != null ? opts.stroke : 8;
  const showLabel = opts.showLabel !== false;
  return Ring({
    value: progress,
    max: 100,
    size,
    stroke,
    color: 'primary',
    background: 'surface',
    animated: true,
    showLabel,
    ariaLabel: opts.ariaLabel || `${Math.round(progress)}%`,
    className: 'c-progressRing',
  });
}

/**
 * Aggiorna un ProgressRing esistente senza rimontarlo.
 * @param {HTMLElement} el
 * @param {number} progress
 */
export function setProgressRing(el, progress) {
  setRingProgress(el, progress, 100);
}
