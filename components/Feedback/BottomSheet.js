/* ==========================================================================
   Feedback/BottomSheet.js
   Bottom sheet con handle, titolo e slot contenuto. Presentata via
   Presenter e opzionalmente drag-dismiss via Shared/Gestures.js.
   ========================================================================== */

import { esc, uid } from '../Shared/helpers.js';
import { present } from '../Shared/Presenter.js';
import { onDragY } from '../Shared/Gestures.js';

/**
 * Template puro.
 * @param {Object} [opts]
 * @param {string} [opts.title='Scegli opzione']
 * @param {string} [opts.content] — HTML string.
 */
export function BottomSheet(opts = {}) {
  const titleId = uid('bs-t');
  return `<div class="c-bottomSheet" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
    <div class="c-bottomSheet__handle" aria-hidden="true"></div>
    <h2 class="c-bottomSheet__title" id="${titleId}">${esc(opts.title || 'Scegli opzione')}</h2>
    <div class="c-bottomSheet__body">${opts.content || ''}</div>
  </div>`;
}

/**
 * Presenta un bottom sheet con drag-to-dismiss opzionale.
 * @param {Object} opts — vedi BottomSheet(opts) + { onClose, draggable=true }.
 * @returns {{close: () => void, root: HTMLElement}}
 */
export function showBottomSheet(opts = {}) {
  const handle = present({
    html: BottomSheet(opts),
    kind: 'bottomSheet',
    scrim: true,
    dismissOnScrim: opts.dismissOnScrim !== false,
    escToClose: opts.escToClose !== false,
    trapFocus: true,
    onClose: opts.onClose,
  });

  if (opts.draggable !== false) {
    const sheet = handle.root.querySelector('.c-bottomSheet');
    const grip  = handle.root.querySelector('.c-bottomSheet__handle');
    if (sheet && grip) {
      onDragY(grip, {
        onMove: dy => { sheet.style.transform = `translateY(${dy}px)`; },
        onEnd: (dy, shouldDismiss) => {
          if (shouldDismiss) handle.close();
          else sheet.style.transform = '';
        },
        dismissAt: 120,
      });
    }
  }
  return handle;
}
