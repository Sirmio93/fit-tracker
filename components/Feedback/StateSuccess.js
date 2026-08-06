/* ==========================================================================
   Feedback/StateSuccess.js
   Stato di successo full-panel: icona verde + titolo + descrizione + CTA.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.icon='check']
 * @param {string} [opts.title='Sessione salvata']
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string.
 */
export function StateSuccess(opts = {}) {
  return `<div class="c-state c-state--success">
    <div class="c-state__icon" aria-hidden="true">${renderIcon(opts.icon || 'check', 'large')}</div>
    <h3 class="c-state__title">${esc(opts.title || 'Sessione salvata')}</h3>
    <p class="c-state__body">${esc(opts.body || 'Tutti i tuoi set sono stati sincronizzati correttamente.')}</p>
    ${opts.action ? `<div class="c-state__actions">${opts.action}</div>` : ''}
  </div>`;
}
