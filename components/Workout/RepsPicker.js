/* ==========================================================================
   Workout/RepsPicker.js
   Stepper ripetizioni. Step 1, min 1, max 100 di default.
   ========================================================================== */

import { esc, cx, attr, clamp } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {number} [opts.value=12]
 * @param {number} [opts.step=1]
 * @param {number} [opts.min=1]
 * @param {number} [opts.max=100]
 * @param {boolean} [opts.disabled]
 * @param {string} [opts.ariaLabel='Ripetizioni']
 */
export function RepsPicker(opts = {}) {
  const value = opts.value != null ? opts.value : 12;
  const cls   = cx(['c-picker', 'c-picker--reps', opts.disabled ? 'is-disabled' : '']);

  return `<div ${attr({
    class: cls,
    role: 'group',
    'aria-label': opts.ariaLabel || 'Ripetizioni',
    'data-picker': 'reps',
    'data-value': value,
    'data-step':  opts.step != null ? opts.step : 1,
    'data-min':   opts.min  != null ? opts.min  : 1,
    'data-max':   opts.max  != null ? opts.max  : 100,
  })}>
    <button type="button" class="c-picker__btn" data-picker-dir="dec" aria-label="Riduci ripetizioni" ${opts.disabled ? 'disabled' : ''}>${renderIcon('minus')}</button>
    <div class="c-picker__display">
      <span class="c-picker__value">${esc(value)}</span>
      <span class="c-picker__unit">reps</span>
    </div>
    <button type="button" class="c-picker__btn" data-picker-dir="inc" aria-label="Aumenta ripetizioni" ${opts.disabled ? 'disabled' : ''}>${renderIcon('plus')}</button>
  </div>`;
}

/**
 * @param {HTMLElement} rootEl
 * @param {(value:number) => void} onChange
 */
export function mountRepsPicker(rootEl, onChange) {
  if (!rootEl) return () => {};
  const step = parseFloat(rootEl.dataset.step) || 1;
  const min  = parseFloat(rootEl.dataset.min)  || 1;
  const max  = parseFloat(rootEl.dataset.max)  || 100;
  let value  = parseFloat(rootEl.dataset.value) || 0;
  const valueEl = rootEl.querySelector('.c-picker__value');

  function set(v) {
    value = clamp(Math.round(v / step) * step, min, max);
    rootEl.dataset.value = String(value);
    if (valueEl) valueEl.textContent = String(value);
    onChange?.(value);
  }
  function onClick(ev) {
    const btn = ev.target.closest('.c-picker__btn');
    if (!btn || !rootEl.contains(btn)) return;
    if (btn.disabled) return;
    const dir = btn.dataset.pickerDir;
    if (dir === 'inc') set(value + step);
    else if (dir === 'dec') set(value - step);
  }
  rootEl.addEventListener('click', onClick);
  return () => rootEl.removeEventListener('click', onClick);
}
