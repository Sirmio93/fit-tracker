/* ==========================================================================
   Feedback/Dialog.js
   Dialog di conferma. Il template produce la stringa HTML: usa
   `showDialog(opts)` per montarlo via Presenter (Shared/Presenter.js).
   ========================================================================== */

import { esc, uid, cx } from '../Shared/helpers.js';
import { present } from '../Shared/Presenter.js';

/**
 * Template puro. Il chiamante può inserirlo dove preferisce.
 * @param {Object} [opts]
 * @param {string} [opts.title='Eliminare sessione?']
 * @param {string} [opts.body]
 * @param {string} [opts.actions] — HTML string (es. Button ghost + Button danger).
 * @param {'default'|'danger'|'success'} [opts.tone='default']
 */
export function Dialog(opts = {}) {
  const titleId = uid('dlg-t');
  const bodyId  = uid('dlg-b');
  const cls = cx(['c-dialog', opts.tone && opts.tone !== 'default' ? `c-dialog--${opts.tone}` : '']);

  return `<div class="${cls}" role="dialog" aria-modal="true" aria-labelledby="${titleId}" aria-describedby="${bodyId}">
    <h2 class="c-dialog__title" id="${titleId}">${esc(opts.title || 'Eliminare sessione?')}</h2>
    <p class="c-dialog__body"  id="${bodyId}">${esc(opts.body || 'Questa azione non può essere annullata.')}</p>
    <div class="c-dialog__actions">${opts.actions || ''}</div>
  </div>`;
}

/**
 * Presenta un dialog. Ritorna `{close, root}`.
 * @param {Object} opts — vedi Dialog(opts) + { onClose }.
 */
export function showDialog(opts = {}) {
  return present({
    html: Dialog(opts),
    kind: 'dialog',
    scrim: true,
    dismissOnScrim: opts.dismissOnScrim !== false,
    escToClose: opts.escToClose !== false,
    trapFocus: true,
    onClose: opts.onClose,
  });
}
