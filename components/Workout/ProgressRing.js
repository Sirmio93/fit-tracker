/* ==========================================================================
   Workout/ProgressRing.js
   Donut SVG con percentuale. Rendering puro; per aggiornamenti fluidi
   usare `setProgressRing(el, pct)`.
   ========================================================================== */

import { esc, clamp } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {number} [opts.progress=62]  — 0-100.
 * @param {number} [opts.size=96]      — px.
 * @param {number} [opts.stroke=8]     — px.
 * @param {boolean} [opts.showLabel=true]
 * @param {string} [opts.ariaLabel]
 */
export function ProgressRing(opts = {}) {
  const pct = clamp(opts.progress != null ? opts.progress : 62, 0, 100);
  const size = opts.size || 96;
  const stroke = opts.stroke || 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const showLabel = opts.showLabel !== false;
  const label = opts.ariaLabel || `${pct}%`;

  const labelEl = showLabel
    ? `<text class="c-progressRing__label" x="${size / 2}" y="${size / 2 + 8}">${pct}%</text>`
    : '';

  return `<svg class="c-progressRing" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}" data-progress="${pct}" data-size="${size}" data-stroke="${stroke}">
    <circle class="c-progressRing__track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none"/>
    <circle class="c-progressRing__fill"  cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      transform="rotate(-90 ${size/2} ${size/2})"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>
    ${labelEl}
  </svg>`;
}

/**
 * Aggiorna un ProgressRing esistente senza rimontarlo.
 * Rispetta la transizione CSS su stroke-dashoffset.
 * @param {SVGSVGElement} el
 * @param {number} progress
 */
export function setProgressRing(el, progress) {
  if (!el) return;
  const pct = clamp(progress, 0, 100);
  const size = parseFloat(el.dataset.size) || 96;
  const stroke = parseFloat(el.dataset.stroke) || 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const fill = el.querySelector('.c-progressRing__fill');
  const label = el.querySelector('.c-progressRing__label');
  if (fill) fill.setAttribute('stroke-dashoffset', off.toFixed(2));
  if (label) label.textContent = `${pct}%`;
  el.dataset.progress = String(pct);
  el.setAttribute('aria-label', `${pct}%`);
}
