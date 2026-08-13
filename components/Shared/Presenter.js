/* ==========================================================================
   Shared/Presenter.js
   Container generico per layer modali (Dialog, BottomSheet, Toast).
   Fornisce:
     - Scrim (backdrop) con dismiss opzionale
     - Focus trap durante la vita del layer
     - ESC per chiudere
     - Restore del focus al trigger dopo la chiusura
     - Body scroll lock durante il modale
   Nessuna dipendenza dai token grafici: le classi/varianti visuali sono
   applicate dai singoli componenti (c-dialog, c-bottomSheet, ...).
   ========================================================================== */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let __hostEl = null;
let __scrollLockCount = 0;
let __prevBodyOverflow = null;

function getHost() {
  if (__hostEl && document.body.contains(__hostEl)) return __hostEl;
  __hostEl = document.createElement('div');
  __hostEl.className = 'c-presenter-host';
  __hostEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(__hostEl);
  return __hostEl;
}

function lockBodyScroll() {
  __scrollLockCount += 1;
  if (__scrollLockCount === 1) {
    __prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}
function unlockBodyScroll() {
  __scrollLockCount = Math.max(0, __scrollLockCount - 1);
  if (__scrollLockCount === 0) {
    document.body.style.overflow = __prevBodyOverflow || '';
    __prevBodyOverflow = null;
  }
}

function trapFocus(container, event) {
  const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
  if (!focusables.length) { event.preventDefault(); return; }
  const first = focusables[0];
  const last  = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
}

/**
 * Presenta un layer modale.
 * @param {Object} opts
 * @param {string} opts.html — HTML string del contenuto (es. Dialog({...})).
 * @param {'dialog'|'bottomSheet'|'toast'|'snackbar'} [opts.kind='dialog']
 * @param {boolean} [opts.scrim=true] — mostra backdrop scuro.
 * @param {boolean} [opts.dismissOnScrim=true] — click sullo scrim chiude.
 * @param {boolean} [opts.escToClose=true] — ESC chiude.
 * @param {boolean} [opts.trapFocus=true] — cattura focus con Tab/Shift+Tab.
 * @param {number}  [opts.autoDismissMs] — chiusura automatica dopo N ms.
 * @param {Function} [opts.onClose] — callback dopo la chiusura.
 * @returns {{close: () => void, root: HTMLElement}}
 */
export function present(opts) {
  const {
    html,
    kind = 'dialog',
    scrim = true,
    dismissOnScrim = true,
    escToClose = true,
    trapFocus: doTrap = true,
    autoDismissMs,
    onClose,
  } = opts || {};

  const host = getHost();
  const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const root = document.createElement('div');
  root.className = `c-presenter c-presenter--${kind}`;
  root.setAttribute('data-kind', kind);

  const scrimEl = scrim ? document.createElement('div') : null;
  if (scrimEl) {
    scrimEl.className = 'c-presenter__scrim';
    root.appendChild(scrimEl);
  }

  const layer = document.createElement('div');
  layer.className = 'c-presenter__layer';
  layer.innerHTML = html;
  root.appendChild(layer);

  host.appendChild(root);
  lockBodyScroll();

  let closed = false;
  let autoTimer = null;

  function close() {
    if (closed) return;
    closed = true;
    if (autoTimer) clearTimeout(autoTimer);
    document.removeEventListener('keydown', onKeydown, true);
    root.classList.add('is-closing');
    // Attende una tick per permettere una eventuale animazione di uscita
    // (i componenti figli possono definire .is-closing → transform/opacity).
    requestAnimationFrame(() => {
      root.remove();
      unlockBodyScroll();
      if (trigger && document.contains(trigger)) trigger.focus();
      if (typeof onClose === 'function') onClose();
    });
  }

  function onKeydown(e) {
    if (escToClose && e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (doTrap && e.key === 'Tab') trapFocus(layer, e);
  }
  document.addEventListener('keydown', onKeydown, true);

  if (scrimEl && dismissOnScrim) {
    scrimEl.addEventListener('click', close);
  }

  // Focus iniziale sul primo focusable, o sul layer stesso (tabindex -1)
  requestAnimationFrame(() => {
    const first = layer.querySelector(FOCUSABLE_SELECTOR);
    if (first) first.focus();
    else { layer.setAttribute('tabindex', '-1'); layer.focus(); }
  });

  if (autoDismissMs && autoDismissMs > 0) {
    autoTimer = setTimeout(close, autoDismissMs);
  }

  return { close, root };
}
