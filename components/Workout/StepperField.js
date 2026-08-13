/* ==========================================================================
   Workout/StepperField.js — Phase 2 (Complete UI Reconstruction)
   Campo stepper verticale della Workout Screen (Peso, Ripetizioni):
     ┌────────────────────────────┐
     │ Peso (kg)                  │
     │  (−)     34     (+)        │
     │ Obiettivo: 12-15 rip       │
     └────────────────────────────┘

   Emette il .pickerWrap con i data-* richiesti dal delegator globale
   (data-picker-kind/blockId/exerciseId/setNo/bi) + il bottoni con
   data-picker-dir="inc/dec". Il valore è un <span> con id noto per gli
   update in-place di bumpKg/bumpReps in app.js. Nessuna business logic.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';

/**
 * @param {Object}  opts
 * @param {'weight'|'reps'} opts.kind
 * @param {string}  opts.label            label sopra ("Peso (kg)" / "Ripetizioni").
 * @param {string}  opts.valueId          id del <span> valore (per update in-place).
 * @param {string|number} opts.displayText testo mostrato (es. 34, o "—" se assente).
 * @param {boolean} [opts.hint]           true = valore in stile suggerimento (classe .hint).
 * @param {string}  [opts.target]         riga sotto (es. "Obiettivo: 12 - 15 ripetizioni").
 * @param {string}  opts.blockId
 * @param {string}  opts.exerciseId
 * @param {number}  opts.setNo
 * @param {number}  opts.bi
 * @param {string}  [opts.ariaLabel]
 */
export function StepperField(opts = {}) {
  const kind    = opts.kind === 'reps' ? 'reps' : 'weight';
  const label   = opts.label || (kind === 'weight' ? 'Peso (kg)' : 'Ripetizioni');
  const value   = String(opts.displayText != null ? opts.displayText : '—');
  const hintCls = opts.hint ? ' hint' : '';
  const decLabel = kind === 'weight' ? 'Riduci peso' : 'Riduci ripetizioni';
  const incLabel = kind === 'weight' ? 'Aumenta peso' : 'Aumenta ripetizioni';

  return `<div ${attr({
    class: 'pickerWrap c-stepperField',
    'data-picker-kind': kind,
    'data-block-id':    opts.blockId,
    'data-exercise-id': opts.exerciseId,
    'data-set-no':      opts.setNo,
    'data-bi':          opts.bi,
    'aria-label':       opts.ariaLabel || label,
    role: 'group',
  })}>
    <span class="c-stepperField__label">${esc(label)}</span>
    <div class="c-stepperField__row">
      <button type="button" class="c-stepperField__btn" data-picker-dir="dec" aria-label="${esc(decLabel)}">
        <span aria-hidden="true">−</span>
      </button>
      <span class="c-stepperField__value${hintCls}" id="${esc(opts.valueId)}">${esc(value)}</span>
      <button type="button" class="c-stepperField__btn" data-picker-dir="inc" aria-label="${esc(incLabel)}">
        <span aria-hidden="true">+</span>
      </button>
    </div>
    ${opts.target ? `<span class="c-stepperField__target">${esc(opts.target)}</span>` : ''}
  </div>`;
}
