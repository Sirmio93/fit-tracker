/* ==========================================================================
   Rest/RestCountdownHero.js — Sprint 9.2 (Premium Rest Experience)
   Il punto focale della nuova Rest Scene. Composizione:

     · aureola (halo) pulsante che alimenta il countdown
     · anello circolare + display numerico  → primitiva CircularRestTimer
     · label del blocco/serie di provenienza (subtle)
     · messaggio contestuale dinamico:
         > 30s  → "Respira"
         10-30  → "Preparati"
         ≤ 10s  → "Ultimi secondi"

   L'aggiornamento fluido del ring + del countdown resta invariato: il tick
   (updateRestTimerOnly) continua a chiamare `setCircularRestProgress` sulla
   primitiva sottostante. Il messaggio contestuale è aggiornato in parallelo
   via `setRestHeroMessage(root, leftSec)` — pura UI, nessuna business logic.

   NON tocca il Timer/Session Engine/Storage — solo composizione visiva.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { CircularRestTimer } from './CircularRestTimer.js';

/**
 * Sceglie il messaggio contestuale in base ai secondi residui.
 * @param {number} leftSec
 * @returns {string}
 */
function messageFor(leftSec) {
  const l = Math.max(0, leftSec | 0);
  if (l <= 10) return 'Ultimi secondi';
  if (l <= 30) return 'Preparati';
  return 'Respira';
}

/**
 * @param {Object} opts
 * @param {number} opts.leftSec       secondi residui
 * @param {number} opts.totalSec      durata totale
 * @param {boolean} [opts.paused]     stato del timer
 * @param {string} [opts.label]       label subtle sopra al countdown (blocco/serie)
 * @param {number} [opts.size]        override dimensione ring (px)
 */
export function RestCountdownHero(opts = {}) {
  const leftSec  = Math.max(0, +opts.leftSec  || 0);
  const totalSec = Math.max(1, +opts.totalSec || 60);
  const paused   = !!opts.paused;
  const size     = opts.size || 280;
  const label    = (opts.label || '').trim();
  const message  = messageFor(leftSec);

  const timerHtml = CircularRestTimer({
    leftSec,
    totalSec,
    paused,
    size,
  });

  const labelHtml = label
    ? `<span class="c-restCountdownHero__label">${esc(label)}</span>`
    : '';

  return `<section class="c-restCountdownHero" data-paused="${paused ? '1' : '0'}">
    <span class="c-restCountdownHero__halo" aria-hidden="true"></span>
    <span class="c-restCountdownHero__halo c-restCountdownHero__halo--outer" aria-hidden="true"></span>
    ${labelHtml}
    <div class="c-restCountdownHero__ring">${timerHtml}</div>
    <p class="c-restCountdownHero__message" data-rest-message aria-live="polite">${esc(message)}</p>
  </section>`;
}

/**
 * Aggiorna il messaggio contestuale in-place (chiamato dal tick del rest
 * timer accanto a `setCircularRestProgress`). Usa data-msg per evitare
 * scritture DOM inutili quando il messaggio non cambia.
 * @param {HTMLElement|Document} root
 * @param {number} leftSec
 */
export function setRestHeroMessage(root, leftSec) {
  const scope = root || document;
  const el = scope.querySelector ? scope.querySelector('[data-rest-message]') : null;
  if (!el) return;
  const next = messageFor(leftSec);
  if (el.dataset.msg === next) return;
  el.dataset.msg = next;
  el.textContent = next;
}

/**
 * Aggiorna lo stato paused → riflette su data-paused del wrapper (utile per
 * l'animazione dell'halo). La primitiva CircularRestTimer resta la fonte
 * di verità della pausa (via setCircularRestPaused sul suo root).
 * @param {HTMLElement} root
 * @param {boolean} paused
 */
export function setRestHeroPaused(root, paused) {
  if (!root) return;
  root.setAttribute('data-paused', paused ? '1' : '0');
}
