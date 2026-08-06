/* ==========================================================================
   Feedback/Snackbar.js
   Come Toast ma con un'azione (es. ANNULLA). Auto-dismiss più lungo (5s).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { present } from '../Shared/Presenter.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.message='Set completato']
 * @param {string} [opts.action='ANNULLA']
 */
export function Snackbar(opts = {}) {
  return `<div class="c-snackbar" role="status" aria-live="polite">
    <span class="c-snackbar__message">${esc(opts.message || 'Set completato')}</span>
    <button type="button" class="c-snackbar__action" data-snackbar-action>${esc(opts.action || 'ANNULLA')}</button>
  </div>`;
}

/**
 * Mostra una snackbar. Chiama `onAction` se l'utente preme il bottone azione.
 * @param {Object} opts — vedi Snackbar(opts) + { durationMs=5000, onAction, onClose }.
 * @returns {{close: () => void, root: HTMLElement}}
 */
export function showSnackbar(opts = {}) {
  const handle = present({
    html: Snackbar(opts),
    kind: 'snackbar',
    scrim: false,
    escToClose: false,
    trapFocus: false,
    autoDismissMs: opts.durationMs != null ? opts.durationMs : 5000,
    onClose: opts.onClose,
  });

  const btn = handle.root.querySelector('[data-snackbar-action]');
  if (btn && typeof opts.onAction === 'function') {
    btn.addEventListener('click', () => {
      opts.onAction();
      handle.close();
    }, { once: true });
  }
  return handle;
}
