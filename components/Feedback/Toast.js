/* ==========================================================================
   Feedback/Toast.js
   Sistema Toast: template puro + presenter classico (legacy) + queue API
   (Sprint 4.5) con dedup, action button, swipe-dismiss e host dedicato.
   ========================================================================== */

import { esc, cx } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';
import { present } from '../Shared/Presenter.js';

const ICON_FOR = { success: 'check', error: 'close', warning: 'bell', info: 'bell', default: 'bell' };

/**
 * Template puro (per test/screenshot).
 * @param {Object} [opts]
 * @param {string} [opts.message='Sessione salvata']
 * @param {'default'|'success'|'error'|'warning'|'info'} [opts.variant='default']
 * @param {{label:string, actionId?:string}} [opts.action]
 */
export function Toast(opts = {}) {
  const variant = opts.variant && ICON_FOR[opts.variant] ? opts.variant : 'default';
  const cls = cx(['c-toast', variant !== 'default' ? `c-toast--${variant}` : '']);
  const ic  = renderIcon(ICON_FOR[variant]);
  const actionHtml = opts.action && opts.action.label
    ? `<button type="button" class="c-toast__action" data-toast-action="${esc(opts.action.actionId || 'primary')}">${esc(opts.action.label)}</button>`
    : '';
  const isError = variant === 'error';
  const role = isError ? 'alert' : 'status';
  const live = isError ? 'assertive' : 'polite';
  return `<div class="${cls}" role="${role}" aria-live="${live}">
    <span class="c-toast__icon" aria-hidden="true">${ic}</span>
    <span class="c-toast__message">${esc(opts.message || 'Sessione salvata')}</span>
    ${actionHtml}
  </div>`;
}

/**
 * Presenta un toast tramite Presenter (legacy — usa scrim-less presenter host).
 * @deprecated Preferire `pushToast(message, opts)` che usa un host dedicato senza focus trap né body scroll lock.
 */
export function showToast(opts = {}) {
  return present({
    html: Toast(opts),
    kind: 'toast',
    scrim: false,
    escToClose: false,
    trapFocus: false,
    autoDismissMs: opts.durationMs != null ? opts.durationMs : 3000,
    onClose: opts.onClose,
  });
}

/* ==========================================================================
   Sprint 4.5 — Queue API
   - Host dedicato #toastRoot (non condiviso col Presenter)
   - Un toast alla volta, coda ordinata FIFO
   - Deduplica messaggi identici consecutivi (rialza il duration)
   - Auto-dismiss configurabile, swipe verticale per chiudere
   - Action button opzionale con callback
   ========================================================================== */

const __queue = [];
let __current = null; // { el, timer, onClose, actionHandler, message, variant }

function getToastHost() {
  let host = document.getElementById('toastRoot');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastRoot';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'true');
    document.body.appendChild(host);
  }
  return host;
}

function scheduleAutoDismiss(handle, ms) {
  if (!handle || !ms) return;
  handle.timer = setTimeout(() => { dismissCurrent('timeout'); }, ms);
}

function dismissCurrent(reason) {
  if (!__current) return;
  const { el, timer, onClose } = __current;
  if (timer) clearTimeout(timer);
  __current = null;
  if (el && el.parentNode) {
    el.classList.add('is-closing');
    // Attende una tick per l'animazione di uscita (~180ms in CSS)
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (typeof onClose === 'function') { try { onClose(reason); } catch (_e) {} }
      // Rimuove marker no-toast se coda vuota
      pumpQueue();
    }, 200);
  } else {
    if (typeof onClose === 'function') { try { onClose(reason); } catch (_e) {} }
    pumpQueue();
  }
}

function pumpQueue() {
  if (__current) return;
  const next = __queue.shift();
  if (!next) return;
  showToastNow(next);
}

function bindSwipeDismiss(el) {
  let startY = 0, dy = 0, tracking = false;
  const onStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    startY = t.clientY; dy = 0; tracking = true;
    el.style.transition = 'none';
  };
  const onMove = (e) => {
    if (!tracking) return;
    const t = e.touches ? e.touches[0] : e;
    dy = t.clientY - startY;
    // Consenti solo swipe verso il basso (positivo)
    if (dy < 0) dy = dy * 0.25; // resistenza verso alto
    el.style.transform = `translate(-50%, ${dy}px)`;
    el.style.opacity = String(Math.max(0.3, 1 - Math.abs(dy) / 160));
  };
  const onEnd = () => {
    if (!tracking) return;
    tracking = false;
    el.style.transition = '';
    if (Math.abs(dy) > 60) {
      dismissCurrent('swipe');
    } else {
      el.style.transform = '';
      el.style.opacity = '';
    }
    dy = 0;
  };
  el.addEventListener('touchstart', onStart, { passive: true });
  el.addEventListener('touchmove',  onMove,  { passive: true });
  el.addEventListener('touchend',   onEnd,   { passive: true });
  el.addEventListener('touchcancel', onEnd,  { passive: true });
}

function showToastNow(entry) {
  const host = getToastHost();
  const wrap = document.createElement('div');
  wrap.className = 'c-toastQueueItem';
  wrap.setAttribute('data-toast-variant', entry.variant || 'default');
  wrap.innerHTML = Toast({
    message: entry.message,
    variant: entry.variant,
    action: entry.action ? { label: entry.action.label, actionId: 'primary' } : null,
  });
  host.appendChild(wrap);
  // Reflow per animazione entrata
  // eslint-disable-next-line no-unused-expressions
  wrap.offsetHeight;
  wrap.classList.add('is-open');

  const handle = { el: wrap, timer: null, onClose: entry.onClose, message: entry.message, variant: entry.variant };
  __current = handle;

  // Action button
  const actionBtn = wrap.querySelector('[data-toast-action]');
  if (actionBtn && entry.action && typeof entry.action.onClick === 'function') {
    actionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try { entry.action.onClick(); } catch (_err) {}
      dismissCurrent('action');
    });
  }

  bindSwipeDismiss(wrap);
  scheduleAutoDismiss(handle, entry.durationMs || 2500);
}

/**
 * Mostra un toast tramite il sistema di coda (nuova API Sprint 4.5).
 * Non ruba il focus, non blocca lo scroll, non aggiunge scrim.
 *
 * @param {string} message
 * @param {Object} [opts]
 * @param {'success'|'info'|'warning'|'error'|'default'} [opts.variant='info']
 * @param {number}  [opts.durationMs=2500]
 * @param {{label:string, onClick:Function}} [opts.action]
 * @param {Function} [opts.onClose] — riceve la reason ('timeout'|'swipe'|'action'|'dedup').
 * @returns {{dismiss:Function}}
 */
export function pushToast(message, opts = {}) {
  const variant = opts.variant || 'info';
  const entry = {
    message: String(message || ''),
    variant,
    durationMs: opts.durationMs != null ? opts.durationMs : 2500,
    action: opts.action || null,
    onClose: opts.onClose || null,
  };

  // Dedup: se il messaggio corrente ha stesso message+variant, rialza il timer
  if (__current && __current.message === entry.message && __current.variant === entry.variant) {
    if (__current.timer) clearTimeout(__current.timer);
    scheduleAutoDismiss(__current, entry.durationMs);
    if (typeof entry.onClose === 'function') { try { entry.onClose('dedup'); } catch (_e) {} }
    return { dismiss: () => dismissCurrent('api') };
  }

  __queue.push(entry);
  if (!__current) pumpQueue();
  return { dismiss: () => dismissCurrent('api') };
}
