/* ==========================================================================
   Shared/Gestures.js
   Handler gesture reali (swipe, long press, drag) con soglie prese dai
   Design Tokens via `getComputedStyle(:root)`. Ogni handler ritorna una
   funzione di dispose che rimuove i listener.
   ========================================================================== */

function tokenPx(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}
function tokenMs(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

/**
 * Registra uno swipe orizzontale su `el`.
 * Soglia: `--gesture-swipeThreshold` (default 40px).
 * @param {HTMLElement} el
 * @param {(dir: 'left'|'right', dx: number) => void} cb
 * @returns {() => void} dispose
 */
export function onSwipe(el, cb) {
  const threshold = tokenPx('--gesture-swipeThreshold', 40);
  let startX = 0, startY = 0, active = false;

  function down(e) {
    const p = e.touches ? e.touches[0] : e;
    startX = p.clientX; startY = p.clientY; active = true;
  }
  function up(e) {
    if (!active) return;
    active = false;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dx = p.clientX - startX;
    const dy = p.clientY - startY;
    if (Math.abs(dx) < threshold) return;
    if (Math.abs(dy) > Math.abs(dx)) return; // scroll verticale prevalente
    cb(dx > 0 ? 'right' : 'left', dx);
  }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup',   up);
  el.addEventListener('pointercancel', () => { active = false; });

  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointerup',   up);
  };
}

/**
 * Registra un long-press. Durata: `--gesture-longPress` (default 500ms).
 * Cancella su movimento superiore alla soglia drag.
 * @param {HTMLElement} el
 * @param {(e: PointerEvent) => void} cb
 * @returns {() => void}
 */
export function onLongPress(el, cb) {
  const duration = tokenMs('--gesture-longPress', 500);
  const dragThreshold = tokenPx('--gesture-dragThreshold', 8);
  let timer = null, startX = 0, startY = 0;

  function down(e) {
    startX = e.clientX; startY = e.clientY;
    timer = setTimeout(() => { timer = null; cb(e); }, duration);
  }
  function move(e) {
    if (!timer) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > dragThreshold) cancel();
  }
  function cancel() { if (timer) { clearTimeout(timer); timer = null; } }

  el.addEventListener('pointerdown',  down);
  el.addEventListener('pointermove',  move);
  el.addEventListener('pointerup',    cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel',cancel);

  return () => {
    cancel();
    el.removeEventListener('pointerdown',  down);
    el.removeEventListener('pointermove',  move);
    el.removeEventListener('pointerup',    cancel);
    el.removeEventListener('pointerleave', cancel);
    el.removeEventListener('pointercancel',cancel);
  };
}

/**
 * Drag verticale (per bottom-sheet dismiss). Emette delta durante il drag
 * e la decisione finale al release.
 * @param {HTMLElement} el
 * @param {{onMove: (dy:number)=>void, onEnd: (dy:number, shouldDismiss:boolean)=>void, dismissAt?: number}} opts
 * @returns {() => void}
 */
export function onDragY(el, { onMove, onEnd, dismissAt = 120 } = {}) {
  let startY = 0, active = false, lastDy = 0;

  function down(e) {
    startY = e.clientY; active = true; lastDy = 0;
    el.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!active) return;
    lastDy = Math.max(0, e.clientY - startY);
    onMove?.(lastDy);
  }
  function end() {
    if (!active) return;
    active = false;
    onEnd?.(lastDy, lastDy >= dismissAt);
  }
  el.addEventListener('pointerdown',   down);
  el.addEventListener('pointermove',   move);
  el.addEventListener('pointerup',     end);
  el.addEventListener('pointercancel', end);

  return () => {
    el.removeEventListener('pointerdown',   down);
    el.removeEventListener('pointermove',   move);
    el.removeEventListener('pointerup',     end);
    el.removeEventListener('pointercancel', end);
  };
}
