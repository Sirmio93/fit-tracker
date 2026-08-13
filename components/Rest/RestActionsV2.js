/* ==========================================================================
   Rest/RestActionsV2.js — Sprint 9.2 (Premium Rest Experience)
   Due sole CTA, gerarchia chiara:

     - Secondaria: "+15 sec"        → data-action="add-rest-15"
     - Primaria:   "Salta recupero" → data-action="stop-rest"

   La primaria domina visivamente (gradient Workout, glow) — è il pulsante
   che l'utente cerca per proseguire. La secondaria è un tap di supporto.
   Motion: slide-up all'apertura della scena (via CSS animation delay).

   Nessuna dipendenza dalla business logic: le azioni sono già cablate al
   delegate globale in app.js (invariato dallo Sprint 8.4).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.primaryLabel='Salta recupero']
 * @param {string} [opts.secondaryLabel='+15 sec']
 * @param {boolean} [opts.disabled]
 */
export function RestActionsV2(opts = {}) {
  const primaryLabel   = opts.primaryLabel   || 'Salta recupero';
  const secondaryLabel = opts.secondaryLabel || '+15 sec';
  const dis = opts.disabled ? ' disabled' : '';

  return `<div class="c-restActionsV2">
    <button type="button"
            class="c-restActionsV2__btn c-restActionsV2__btn--secondary"
            data-action="add-rest-15"${dis}>
      <span class="c-restActionsV2__glyph" aria-hidden="true">+15</span>
      <span class="c-restActionsV2__label">${esc(secondaryLabel)}</span>
    </button>
    <button type="button"
            class="c-restActionsV2__btn c-restActionsV2__btn--primary"
            data-action="stop-rest"${dis}>
      <span class="c-restActionsV2__label">${esc(primaryLabel)}</span>
      <span class="c-restActionsV2__arrow" aria-hidden="true">→</span>
    </button>
  </div>`;
}
