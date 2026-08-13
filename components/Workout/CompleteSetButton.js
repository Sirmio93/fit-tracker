/* ==========================================================================
   Workout/CompleteSetButton.js — Sprint 8.5
   CTA primaria "Completa Serie" della Workout Screen. Piena larghezza,
   sempre nella stessa posizione, colore primario. Distinto da
   CompleteButton (che è "Termina sessione", gradient success).

   Non gestisce logica: emette data-action="toggle-set" con i dataset
   attesi dal delegator globale (block-id, exercise-id, set-no, checked).
   Se opts.done === true mostra lo stato "Serie completata" e inverte
   data-checked per consentire lo untoggle.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} opts
 * @param {string} [opts.label='Completa Serie']
 * @param {string} [opts.doneLabel='Serie completata']
 * @param {boolean}[opts.done]
 * @param {boolean}[opts.loading]
 * @param {boolean}[opts.disabled]
 * @param {number} [opts.setNo]
 * @param {string} [opts.blockId]
 * @param {string} [opts.exerciseId]
 * @param {string} [opts.action='toggle-set']  action name emesso al click.
 */
export function CompleteSetButton(opts = {}) {
  const done   = !!opts.done;
  const label  = done ? (opts.doneLabel || 'Serie completata') : (opts.label || 'Completa Serie');
  const cls    = ['c-completeSetBtn'];
  if (done)          cls.push('is-done');
  if (opts.loading)  cls.push('is-loading');
  if (opts.disabled) cls.push('is-disabled');

  const dataset = [
    `data-action="${esc(opts.action || 'toggle-set')}"`,
    opts.blockId    != null ? `data-block-id="${esc(opts.blockId)}"`      : '',
    opts.exerciseId != null ? `data-exercise-id="${esc(opts.exerciseId)}"`: '',
    opts.setNo      != null ? `data-set-no="${esc(opts.setNo)}"`          : '',
    `data-checked="${done ? 'false' : 'true'}"`,
  ].filter(Boolean).join(' ');

  const iconName = 'check';
  const iconHtml = `<span class="c-completeSetBtn__icon" aria-hidden="true">${renderIcon(iconName, 'medium')}</span>`;

  return `<button type="button"
    class="${cls.join(' ')}"
    ${opts.disabled || opts.loading ? 'disabled' : ''}
    ${opts.loading ? 'aria-busy="true"' : ''}
    ${dataset}>
    ${iconHtml}
    <span class="c-completeSetBtn__label">${esc(label)}</span>
  </button>`;
}
