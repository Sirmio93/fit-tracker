/* ==========================================================================
   Execution/SetPicker.js — T2.2 (PROGETTO_MOCKUP)
   Strip orizzontale di pill una per set: tap = seleziona quel set come
   attivo. Stati visivi:
     · 'done'     — completato (check verde discreto, testo/bordo muted).
     · 'on'       — set corrente (bg bianco, testo nero, bordo accent).
     · 'upcoming' — set futuro (opacità 0.55, bg surface).

   Puro rendering. Sul tap, il delegator globale intercetta
   `data-action="pick-set" data-set-idx="N"` e aggiorna S.focus.round.

   ARIA: role="tablist" per la strip, role="tab" per ciascuna pill con
   aria-selected + aria-label leggibile ("Serie N di M · completata/attiva/
   da fare").
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';

const STATE_CLS = Object.freeze({
  done:     'ex-picker__i--done',
  on:       'ex-picker__i--on',
  upcoming: 'ex-picker__i--up',
});

function stateAriaLabel(state, i, total, label) {
  const base = 'Serie ' + i + ' di ' + total;
  const setLbl = label ? ' (' + label + ')' : '';
  if (state === 'done') return base + setLbl + ' · completata';
  if (state === 'on')   return base + setLbl + ' · in corso';
  return base + setLbl + ' · da fare';
}

/**
 * @param {Object} p
 * @param {Array<{state:'done'|'on'|'upcoming', label:string, ariaLabel?:string}>} p.sets
 *                                          — pill in ordine (0..N-1). label = testo pill
 *                                            ("Set 1", "1", "12", "10", ...).
 * @param {number} p.activeIdx              — indice pill "on" (0-based). Il render
 *                                            lo usa anche per aria-selected.
 * @param {string} [p.ariaLabel]            — label del tablist (default "Set della sessione").
 * @param {string} [p.blockId]              — data-attr sul wrap (per debug/scoping).
 * @param {string} [p.exerciseId]           — data-attr sul wrap.
 * @returns {string} HTML string.
 */
export function renderSetPicker(p) {
  const opts = p || {};
  const sets = Array.isArray(opts.sets) ? opts.sets : [];
  const activeIdx = Math.max(0, Math.min(sets.length - 1, +opts.activeIdx || 0));
  const total = sets.length;

  const listAttrs = attr({
    class: 'ex-picker',
    role: 'tablist',
    'aria-label': opts.ariaLabel || 'Set della sessione',
    'data-block-id': opts.blockId || null,
    'data-exercise-id': opts.exerciseId || null,
  });

  const items = sets.map(function (s, i) {
    const rawState = (s && s.state) || 'upcoming';
    const state = STATE_CLS[rawState] ? rawState : 'upcoming';
    const cls = 'ex-picker__i ' + STATE_CLS[state];
    const isSelected = (i === activeIdx) || state === 'on';
    const labelTxt = s && s.label != null ? String(s.label) : String(i + 1);
    const setNo1 = i + 1;
    const aLbl = (s && s.ariaLabel) ? s.ariaLabel : stateAriaLabel(state, setNo1, total, labelTxt);
    const btnAttrs = attr({
      type: 'button',
      class: cls,
      role: 'tab',
      'aria-selected': isSelected ? 'true' : 'false',
      'aria-label': aLbl,
      'data-action': 'pick-set',
      'data-set-idx': setNo1,   // 1-based (corrisponde a setNo esistente)
      'data-set-state': state,
      tabindex: isSelected ? '0' : '-1',
    });
    return '<button ' + btnAttrs + '>'
      + '<span class="ex-picker__i-eyebrow" aria-hidden="true">Set</span>'
      + '<b class="ex-picker__i-num" aria-hidden="true">' + esc(labelTxt) + '</b>'
      + '</button>';
  }).join('');

  return '<div ' + listAttrs + '>' + items + '</div>';
}
