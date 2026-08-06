/* ==========================================================================
   Workout/WeightPicker.js
   Stepper − / valore / +. Passi configurabili. Emette onChange in mount.
   ========================================================================== */

import { esc, cx, attr, clamp } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {number} [opts.value=40]
 * @param {string} [opts.unit='kg']
 * @param {number} [opts.step=2.5]
 * @param {number} [opts.min=0]
 * @param {number} [opts.max=500]
 * @param {boolean} [opts.disabled]
 * @param {string} [opts.ariaLabel='Peso']
 */
export function WeightPicker(opts = {}) {
  const value = opts.value != null ? opts.value : 40;
  const unit  = opts.unit  || 'kg';
  const cls   = cx(['c-picker', 'c-picker--weight', opts.disabled ? 'is-disabled' : '']);

  return `<div ${attr({
    class: cls,
    role: 'group',
    'aria-label': opts.ariaLabel || 'Peso',
    'data-picker': 'weight',
    'data-value': value,
    'data-step':  opts.step != null ? opts.step : 2.5,
    'data-min':   opts.min  != null ? opts.min  : 0,
    'data-max':   opts.max  != null ? opts.max  : 500,
  })}>
    <button type="button" class="c-picker__btn" data-picker-dir="dec" aria-label="Riduci ${esc(unit)}" ${opts.disabled ? 'disabled' : ''}>${renderIcon('minus')}</button>
    <div class="c-picker__display">
      <span class="c-picker__value">${esc(formatWeight(value))}</span>
      <span class="c-picker__unit">${esc(unit)}</span>
    </div>
    <button type="button" class="c-picker__btn" data-picker-dir="inc" aria-label="Aumenta ${esc(unit)}" ${opts.disabled ? 'disabled' : ''}>${renderIcon('plus')}</button>
  </div>`;
}

function formatWeight(n) {
  const num = Number(n);
  if (!isFinite(num)) return String(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, '');
}

/**
 * Aggancia la logica dello stepper. Ritorna un dispose.
 * @param {HTMLElement} rootEl
 * @param {(value:number) => void} onChange
 */
export function mountWeightPicker(rootEl, onChange) {
  if (!rootEl) return () => {};
  const step = parseFloat(rootEl.dataset.step) || 2.5;
  const min  = parseFloat(rootEl.dataset.min)  || 0;
  const max  = parseFloat(rootEl.dataset.max)  || 500;
  let value  = parseFloat(rootEl.dataset.value) || 0;
  const valueEl = rootEl.querySelector('.c-picker__value');

  function set(v) {
    value = clamp(Math.round(v / step) * step, min, max);
    rootEl.dataset.value = String(value);
    if (valueEl) valueEl.textContent = formatWeight(value);
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
