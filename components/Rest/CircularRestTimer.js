/* ==========================================================================
   Rest/CircularRestTimer.js — Sprint 9.2B (adapter → Foundation/Ring)
   Timer circolare della Rest Screen. Composizione:
     · Ring (primitiva unificata) come anello + slot centrale con countdown
     · pulsante pausa/riprendi assoluto (delegato via [data-action])

   Il rendering SVG è delegato a Foundation/Ring.js. Colore, glow, animazione
   e stati (paused / ending) sono gestiti dalle classi c-ring--* + dalle
   regole del wrapper .c-circularRestTimer (rest.css).

   UI-only: nessuna gestione del timer. Le API pubbliche
   (`setCircularRestProgress`, `setCircularRestPaused`, `setCircularRestTotal`)
   restano invariate per non toccare app.js.
   ========================================================================== */

import { esc, clamp } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';
import { Ring, setRingProgress, setRingColor } from '../Foundation/Ring.js';

const DEFAULT_SIZE   = 260;
const DEFAULT_STROKE = 14;
const ENDING_THRESHOLD = 5;

/**
 * @param {Object} [opts]
 * @param {number} [opts.leftSec=60]     secondi mancanti
 * @param {number} [opts.totalSec=60]    durata totale (per il ring)
 * @param {boolean} [opts.paused=false]  stato del timer
 * @param {number} [opts.size=260]
 * @param {number} [opts.stroke=14]
 * @param {number} [opts.endingThreshold=5]  soglia per lo stato "is-ending"
 */
export function CircularRestTimer(opts = {}) {
  const size    = opts.size   || DEFAULT_SIZE;
  const stroke  = opts.stroke || DEFAULT_STROKE;
  const totalSec = Math.max(1, +opts.totalSec || 60);
  const leftSec  = Math.max(0, +opts.leftSec  || 0);
  const paused   = !!opts.paused;
  const threshold = opts.endingThreshold != null ? opts.endingThreshold : ENDING_THRESHOLD;
  const ending = leftSec <= threshold;

  const timeStr = String(leftSec).padStart(2, '0');
  const centerIcon = paused ? renderIcon('play', 'large') : renderIcon('pause', 'large');
  const centerLabel = paused ? 'Riprendi recupero' : 'Metti in pausa il recupero';
  const centerAction = paused ? 'resume-rest' : 'pause-rest';

  // Il progresso "consumato" è total-left, così il ring si svuota mentre
  // il tempo scorre — coerente con l'implementazione originale.
  const consumed = clamp(totalSec - leftSec, 0, totalSec);

  const centerHtml = `
    <div class="c-circularRestTimer__display" aria-live="polite" aria-atomic="true">
      <div class="c-circularRestTimer__time" data-rest-time>${esc(timeStr)}</div>
      <div class="c-circularRestTimer__unit">secondi</div>
    </div>`;

  const ringHtml = Ring({
    value: consumed,
    max: totalSec,
    size,
    stroke,
    color: ending ? 'success' : 'primary',
    background: 'subtle',
    animated: true,
    showGlow: true,
    ariaLabel: `${leftSec} secondi rimanenti`,
    centerHtml,
    className: 'c-circularRestTimer__ring',
  });

  const stateAttr  = ending ? ' data-ending="true"' : '';
  const pausedAttr = paused ? ' data-paused="true"' : '';

  return `<div class="c-circularRestTimer"${stateAttr}${pausedAttr}
    data-size="${size}" data-stroke="${stroke}" data-total="${totalSec}"
    style="--rt-size:${size}px;">
    ${ringHtml}
    <button type="button" class="c-circularRestTimer__center"
      data-action="${centerAction}" aria-label="${esc(centerLabel)}">
      ${centerIcon}
    </button>
  </div>`;
}

function ringEl(root) {
  return root ? root.querySelector('.c-ring') : null;
}

/**
 * Aggiorna il ring e il countdown senza rimontare il timer.
 * @param {HTMLElement} root  elemento .c-circularRestTimer
 * @param {number} leftSec
 */
export function setCircularRestProgress(root, leftSec) {
  if (!root) return;
  const total   = Math.max(1, parseFloat(root.dataset.total) || 60);
  const left    = Math.max(0, leftSec | 0);
  const consumed = clamp(total - left, 0, total);

  const ring = ringEl(root);
  if (ring) setRingProgress(ring, consumed, total);

  const timeEl = root.querySelector('[data-rest-time]');
  if (timeEl) timeEl.textContent = String(left).padStart(2, '0');

  if (left <= ENDING_THRESHOLD) {
    if (!root.hasAttribute('data-ending')) {
      root.setAttribute('data-ending', 'true');
      if (ring) setRingColor(ring, 'success');
    }
  } else if (root.hasAttribute('data-ending')) {
    root.removeAttribute('data-ending');
    if (ring) setRingColor(ring, 'primary');
  }
}

/**
 * Aggiorna lo stato paused → riflesso su icona / aria del pulsante centrale.
 * @param {HTMLElement} root
 * @param {boolean} paused
 */
export function setCircularRestPaused(root, paused) {
  if (!root) return;
  const btn = root.querySelector('.c-circularRestTimer__center');
  if (!btn) return;
  const action = paused ? 'resume-rest' : 'pause-rest';
  const label  = paused ? 'Riprendi recupero' : 'Metti in pausa il recupero';
  btn.dataset.action = action;
  btn.setAttribute('aria-label', label);
  btn.innerHTML = paused ? renderIcon('play', 'large') : renderIcon('pause', 'large');
  if (paused) root.setAttribute('data-paused', 'true');
  else root.removeAttribute('data-paused');
}

/**
 * Aggiorna la durata totale (usato dopo "+15 sec"): mantiene la percentuale
 * coerente al nuovo totale evitando salti visivi. Il ring viene aggiornato
 * via `setRingProgress` al prossimo tick.
 * @param {HTMLElement} root
 * @param {number} totalSec
 */
export function setCircularRestTotal(root, totalSec) {
  if (!root) return;
  const next = Math.max(1, totalSec | 0);
  root.dataset.total = String(next);
  const ring = ringEl(root);
  if (ring) ring.dataset.max = String(next);
}
