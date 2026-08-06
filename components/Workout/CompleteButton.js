/* ==========================================================================
   Workout/CompleteButton.js
   CTA finale a piena larghezza per terminare la sessione. Bottone dedicato
   con gradient success, distinto dai Button standard (design + peso visivo
   differenti).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.label='Termina sessione']
 * @param {boolean} [opts.loading]
 * @param {boolean} [opts.disabled]
 * @param {string} [opts.icon='check']
 */
export function CompleteButton(opts = {}) {
  const label = opts.label || 'Termina sessione';
  const cls = ['c-completeBtn'];
  if (opts.loading)  cls.push('is-loading');
  if (opts.disabled) cls.push('is-disabled');

  return `<button type="button" class="${cls.join(' ')}" ${opts.disabled || opts.loading ? 'disabled' : ''} ${opts.loading ? 'aria-busy="true"' : ''}>
    <span class="c-completeBtn__icon" aria-hidden="true">${renderIcon(opts.icon || 'check', 'medium')}</span>
    <span class="c-completeBtn__label">${esc(label)}</span>
  </button>`;
}
