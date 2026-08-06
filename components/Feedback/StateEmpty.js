/* ==========================================================================
   Feedback/StateEmpty.js
   Stato vuoto full-panel (non card): icona grande + titolo + descrizione + CTA.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.icon='circle']
 * @param {string} [opts.title='Nessun dato']
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string.
 */
export function StateEmpty(opts = {}) {
  return `<div class="c-state c-state--empty">
    <div class="c-state__icon" aria-hidden="true">${renderIcon(opts.icon || 'circle', 'large')}</div>
    <h3 class="c-state__title">${esc(opts.title || 'Nessuna scheda ancora')}</h3>
    <p class="c-state__body">${esc(opts.body || 'Importa un file JSON o crea una scheda per iniziare.')}</p>
    ${opts.action ? `<div class="c-state__actions">${opts.action}</div>` : ''}
  </div>`;
}
