/* ==========================================================================
   Feedback/StateError.js
   Stato d'errore full-panel: icona rossa + titolo + descrizione + retry.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.icon='close']
 * @param {string} [opts.title='Errore di caricamento']
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string (Button ghost "Riprova").
 */
export function StateError(opts = {}) {
  return `<div class="c-state c-state--error" role="alert">
    <div class="c-state__icon" aria-hidden="true">${renderIcon(opts.icon || 'close', 'large')}</div>
    <h3 class="c-state__title">${esc(opts.title || 'Errore di caricamento')}</h3>
    <p class="c-state__body">${esc(opts.body || 'Non riusciamo a leggere i dati locali. Controlla lo storage del browser.')}</p>
    ${opts.action ? `<div class="c-state__actions">${opts.action}</div>` : ''}
  </div>`;
}
