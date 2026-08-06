/* ==========================================================================
   Shared/Animate.js
   Orchestratore one-shot per animazioni al mount/unmount. Legge durate dai
   token e rispetta prefers-reduced-motion (le durate diventano 0ms → callback
   sincrono).
   ========================================================================== */

function tokenMs(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

/**
 * Applica una classe di stato per la durata di un'animazione, poi la rimuove
 * e chiama il callback.
 * @param {HTMLElement} el
 * @param {string} stateClass — es. 'is-entering', 'is-closing'
 * @param {string} durationToken — es. '--duration-slow'
 * @param {number} fallbackMs
 * @param {Function} [cb]
 */
export function animateOnce(el, stateClass, durationToken, fallbackMs, cb) {
  if (!el) { cb?.(); return; }
  const ms = tokenMs(durationToken, fallbackMs);
  el.classList.add(stateClass);
  if (ms <= 0) {
    el.classList.remove(stateClass);
    cb?.();
    return;
  }
  setTimeout(() => {
    el.classList.remove(stateClass);
    cb?.();
  }, ms);
}

/**
 * Chiama `cb` alla fine della prima transizione o animazione CSS di `el`.
 * Se nessuna transizione parte entro `timeoutMs`, chiama comunque `cb`
 * (fallback per reduced-motion o mancata proprietà animabile).
 * @param {HTMLElement} el
 * @param {Function} cb
 * @param {number} [timeoutMs=400]
 */
export function afterTransition(el, cb, timeoutMs = 400) {
  let called = false;
  function done() {
    if (called) return;
    called = true;
    el.removeEventListener('transitionend', done);
    el.removeEventListener('animationend',  done);
    cb();
  }
  el.addEventListener('transitionend', done, { once: true });
  el.addEventListener('animationend',  done, { once: true });
  setTimeout(done, timeoutMs);
}
