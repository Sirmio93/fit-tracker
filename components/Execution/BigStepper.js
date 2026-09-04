/* ==========================================================================
   Execution/BigStepper.js — T2.2 (PROGETTO_MOCKUP)
   Input touch-first per kg / reps: valore grande centrale (44px, tabular-
   nums) con label sopra, hint in top-right ("Ultimo Xkg" o "Target 8-10"),
   e bottoni [−step] [+step] in basso. Riusabile per KG (step 2.5) e REPS
   (step 1).

   Puro rendering (HTML string). L'aggiornamento del valore avviene via
   delegator globale in app.js su `data-action="stepper-inc" | "stepper-dec"`
   con `data-target="kg" | "reps"` + i data-* di identificazione set
   (block-id, exercise-id, set-no, bi).

   Palette: bianco primary, giallo accent per il target "b" della hint.
   ARIA: valore = role="spinbutton" con aria-valuenow/min/max; bottoni con
   aria-label esplicito.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';

function fmtNum(v, isFloat) {
  if (v == null || v === '' || Number.isNaN(+v)) return '—';
  const n = +v;
  if (!isFloat) return String(Math.round(n));
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

/**
 * @param {Object} p
 * @param {'kg'|'reps'} p.target                — chi viene aggiornato.
 * @param {string} [p.label]                     — label sopra (default "Peso"/"Ripetizioni").
 * @param {string} [p.unit]                      — unit inline (default "kg" per target=kg, "" per reps).
 * @param {number|string} p.value                — valore corrente (o "—" se hint fallback).
 * @param {number} [p.step]                      — step +/- (default 2.5 kg, 1 reps).
 * @param {number} [p.min]                       — clamp min (default 0 kg, 1 reps).
 * @param {number} [p.max]                       — clamp max (default 999 kg, 99 reps).
 * @param {boolean} [p.isHint]                   — true = valore mostrato è un "suggerimento" (ultimo/target),
 *                                                 non ancora committato dall'utente.
 * @param {{ lastValue?: number|string, target?: string }} [p.hint]
 *                                               — hint top-right: {lastValue} → "Ultimo Xkg";
 *                                                 {target} → "Target 8-10". Se entrambi presenti,
 *                                                 prevale target.
 * @param {string} p.blockId
 * @param {string} p.exerciseId
 * @param {number} p.setNo
 * @param {number} [p.bi]                        — indice blocco (per legacy bumpKg/bumpReps
 *                                                 element lookup — passalo sempre se disponibile).
 * @param {string} [p.valueId]                   — id dello span valore (per update in-place da bumpKg/bumpReps).
 * @returns {string} HTML string.
 */
export function renderBigStepper(p) {
  const opts       = p || {};
  const target     = opts.target === 'reps' ? 'reps' : 'kg';
  const label      = opts.label || (target === 'kg' ? 'Peso' : 'Ripetizioni');
  const unit       = opts.unit != null ? String(opts.unit) : (target === 'kg' ? 'kg' : '');
  const step       = opts.step != null ? +opts.step : (target === 'kg' ? 2.5 : 1);
  const min        = opts.min  != null ? +opts.min  : (target === 'kg' ? 0 : 1);
  const max        = opts.max  != null ? +opts.max  : (target === 'kg' ? 999 : 99);
  const isFloat    = target === 'kg';
  const valueRaw   = opts.value;
  const valueTxt   = fmtNum(valueRaw, isFloat);
  const numericVal = (typeof valueRaw === 'number' && Number.isFinite(valueRaw)) ? valueRaw : 0;

  const stepSign   = isFloat ? step : Math.round(step);
  const stepLabel  = isFloat ? fmtNum(step, true) : String(Math.round(step));
  const decTxt     = `−${stepLabel}`;
  const incTxt     = `+${stepLabel}`;

  const decAria = target === 'kg' ? `Riduci peso di ${stepLabel} kg` : `Riduci ripetizioni di ${stepLabel}`;
  const incAria = target === 'kg' ? `Aumenta peso di ${stepLabel} kg` : `Aumenta ripetizioni di ${stepLabel}`;

  // Hint in top-right: target > lastValue (target è la guida esplicita).
  const hint = opts.hint || {};
  let hintHtml = '';
  if (hint.target) {
    hintHtml = `<div class="ex-stepper__hint">Target <b>${esc(hint.target)}</b></div>`;
  } else if (hint.lastValue != null && hint.lastValue !== '' && +hint.lastValue > 0) {
    const lv = fmtNum(hint.lastValue, isFloat);
    const lvUnit = target === 'kg' ? ' kg' : '';
    hintHtml = `<div class="ex-stepper__hint">Ultimo <b>${esc(lv + lvUnit)}</b></div>`;
  }

  const wrapAttrs = attr({
    class: 'ex-stepper' + (opts.isHint ? ' ex-stepper--hint' : ''),
    role: 'group',
    'aria-label': label + ' serie ' + opts.setNo,
    'data-target': target,
  });

  const decBtnAttrs = attr({
    type: 'button',
    class: 'ex-stepper__btn ex-stepper__btn--dec',
    'data-action': 'stepper-dec',
    'data-target': target,
    'data-block-id': opts.blockId,
    'data-exercise-id': opts.exerciseId,
    'data-set-no': opts.setNo,
    'data-bi': opts.bi != null ? opts.bi : 0,
    'data-step': stepSign,
    'aria-label': decAria,
  });
  const incBtnAttrs = attr({
    type: 'button',
    class: 'ex-stepper__btn ex-stepper__btn--inc',
    'data-action': 'stepper-inc',
    'data-target': target,
    'data-block-id': opts.blockId,
    'data-exercise-id': opts.exerciseId,
    'data-set-no': opts.setNo,
    'data-bi': opts.bi != null ? opts.bi : 0,
    'data-step': stepSign,
    'aria-label': incAria,
  });

  const spinAttrs = attr({
    class: 'ex-stepper__val',
    id: opts.valueId || null,
    role: 'spinbutton',
    tabindex: '0',
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': numericVal,
    'data-value': numericVal,
  });

  const unitHtml = unit ? `<span class="ex-stepper__u">${esc(unit)}</span>` : '';

  return `<div ${wrapAttrs}>
    ${hintHtml}
    <div class="ex-stepper__lbl">${esc(label)}</div>
    <div ${spinAttrs}>${esc(valueTxt)}${unitHtml}</div>
    <div class="ex-stepper__row">
      <button ${decBtnAttrs}>${esc(decTxt)}</button>
      <button ${incBtnAttrs}>${esc(incTxt)}</button>
    </div>
  </div>`;
}
