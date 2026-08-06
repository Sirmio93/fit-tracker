/* ==========================================================================
   Workout/FloatingTimer.js
   Chip fissa che mostra un timer di recupero. Il conteggio è gestito dal
   chiamante: qui offriamo helper puri per formattare e aggiornare il display.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {string|number} [opts.time='01:12'] — se number, viene interpretato come secondi.
 * @param {string} [opts.label='Recupero']
 * @param {'running'|'paused'} [opts.state='running']
 */
export function FloatingTimer(opts = {}) {
  const time  = typeof opts.time === 'number' ? formatSeconds(opts.time) : (opts.time || '01:12');
  const label = opts.label || 'Recupero';
  const state = opts.state === 'paused' ? 'paused' : 'running';
  const iconName = state === 'paused' ? 'pause' : 'play';

  return `<div class="c-floatingTimer" role="status" aria-live="polite" aria-atomic="true" data-timer-state="${state}">
    <span class="c-floatingTimer__icon" aria-hidden="true">${renderIcon(iconName, 'medium')}</span>
    <div class="c-floatingTimer__body">
      <span class="c-floatingTimer__time">${esc(time)}</span>
      <span class="c-floatingTimer__label">${esc(label)}</span>
    </div>
  </div>`;
}

/**
 * Formatta secondi → "mm:ss".
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * Aggiorna un FloatingTimer già montato.
 * @param {HTMLElement} el
 * @param {{ time?: number|string, label?: string, state?: 'running'|'paused' }} patch
 */
export function updateFloatingTimer(el, patch = {}) {
  if (!el) return;
  if (patch.time != null) {
    const t = typeof patch.time === 'number' ? formatSeconds(patch.time) : patch.time;
    const tEl = el.querySelector('.c-floatingTimer__time');
    if (tEl) tEl.textContent = t;
  }
  if (patch.label != null) {
    const lEl = el.querySelector('.c-floatingTimer__label');
    if (lEl) lEl.textContent = patch.label;
  }
  if (patch.state) el.dataset.timerState = patch.state;
}
