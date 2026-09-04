/* ==========================================================================
   Execution/SingleExercise.js — T2.2 (PROGETTO_MOCKUP) · PATTERN-SETTER
   Orchestratore del content-slot per blocchi Single (e Piramide via mode).
   Compone i cinque sotto-componenti + un hero dell'esercizio ispirato al
   mockup Device A:

     ┌────────────────────────────────────────────────┐
     │ [pill Single]  Finisher · Dip alle parallele   │  ← block-crumb
     ├────────────────────────────────────────────────┤
     │ [thumb]  Panca piana                           │  ← hero
     │          8-10 reps · 4 set · Bilanciere        │
     ├────────────────────────────────────────────────┤
     │ [ SET·1 ✓ ][ SET·2 ✓ ][ SET·3 on ][ SET·4 ]    │  ← SetPicker
     │ • Nuovo record · +2.5kg dal migliore           │  ← PRBanner (cond.)
     │ ┌────── kg ──────┐ ┌────── reps ──────┐        │  ← BigStepper ×2
     │ ├────── note ────┤                              │
     │ [← Precedente C2 ]     [ Prossimo → C4 ]       │  ← NeighborPeek
     └────────────────────────────────────────────────┘

   PATTERN che T2.3 (Circuit), T2.5 (Tabata), T2.6 (EMOM/AMRAP), T2.7
   (Pyramid) seguiranno:
     · Il caller (app.js focusView) monta lo `.ex-shell` via
       UI.renderExecutionShell({ ..., bodyHtml, ctaHtml }).
     · bodyHtml = UI.renderSingleExercise({...}) — o l'analogo per tipo.
     · ctaHtml  = UI.CompleteSetButton({...})   — o l'analogo per tipo.
   Nessun componente qui accede al DOM: sono tutte HTML string factory.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { renderBigStepper } from './BigStepper.js';
import { renderPRBanner }   from './PRBanner.js';
import { renderSetPicker }  from './SetPicker.js';
import { renderNeighborPeek } from './NeighborPeek.js';

function fmtNum(n, isFloat) {
  const v = +n;
  if (!Number.isFinite(v)) return '';
  if (!isFloat) return String(Math.round(v));
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '');
}

function buildBlockCrumb(block, mode) {
  const pillTxt = mode === 'pyramid' ? 'Piramide' : 'Single';
  const sub = block && block.label ? String(block.label) : '';
  return '<div class="ex-single-crumb">'
    + '<span class="ex-single-crumb__pill">' + esc(pillTxt) + '</span>'
    + (sub ? '<span class="ex-single-crumb__sub">' + esc(sub) + '</span>' : '')
    + '</div>';
}

function buildHero(exercise, target) {
  const name = exercise && exercise.name ? String(exercise.name) : 'Esercizio';
  const eyebrow = exercise && exercise.primary ? String(exercise.primary) : 'Esercizio corrente';
  const t = target || {};
  const metaBits = [];
  if (t.reps) metaBits.push('<span><b>' + esc(t.reps) + '</b> reps</span>');
  if (t.target) metaBits.push('<span class="ex-single-hero__badge">' + esc(t.target) + '</span>');

  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return (w[0] || '').toUpperCase(); }).join('') || '?';

  const meta = metaBits.length
    ? '<div class="ex-single-hero__meta">' + metaBits.join('<span class="ex-single-hero__sep">·</span>') + '</div>'
    : '';

  return '<div class="ex-single-hero" role="group" aria-label="Esercizio corrente">'
    + '<div class="ex-single-hero__thumb" aria-hidden="true">'
    +   '<span class="ex-single-hero__initials">' + esc(initials) + '</span>'
    + '</div>'
    + '<div class="ex-single-hero__info">'
    +   '<p class="ex-single-hero__eyebrow">' + esc(eyebrow) + '</p>'
    +   '<h2 class="ex-single-hero__name">' + esc(name) + '</h2>'
    +   meta
    + '</div>'
    + '</div>';
}

function buildNoteField(p) {
  const noteId = 'ex-note-' + (p.blockId || 'b') + '-' + (p.setNo || 1);
  const value = p.value != null ? String(p.value) : '';
  const inputAttrs = attr({
    type: 'text',
    class: 'ex-single-note__input',
    id: noteId,
    maxlength: 200,
    placeholder: 'Nota per il set (facoltativa)',
    'data-input': 'set-note',
    'data-block-id': p.blockId,
    'data-exercise-id': p.exerciseId,
    'data-set-no': p.setNo,
    'aria-label': 'Nota per il set ' + (p.setNo || 1),
    value: value || null,
  });
  return '<label class="ex-single-note" for="' + esc(noteId) + '">'
    + '<span class="ex-single-note__icon" aria-hidden="true">✎</span>'
    + '<input ' + inputAttrs + '>'
    + '</label>';
}

/**
 * @param {Object} p
 * @param {Object} p.block                    — blocco corrente (id, label, rounds, exerciseIds…).
 * @param {number} p.blockIdx                 — 0-based, per bi.
 * @param {Object} p.exercise                 — { id, name, primary }
 * @param {Object} [p.target]                 — { reps, target } dal exerciseTargets del blocco.
 * @param {number} p.setIdx                   — 1-based, set attivo (S.focus.round).
 * @param {number} p.totalSets                — rounds del blocco.
 * @param {Array<{state:'done'|'on'|'upcoming', label:string}>} p.setStates
 *                                            — array di N stati (N = totalSets).
 * @param {number} [p.currentKg]              — kg del set attivo (da logFor).
 * @param {string|number} [p.currentReps]     — reps del set attivo.
 * @param {number} [p.lastKg]                 — ultimo kg loggato (per hint stepper).
 * @param {string|number} [p.lastReps]        — ultime reps loggate.
 * @param {string} [p.targetReps]             — target testuale "8-10", "12-15".
 * @param {boolean} [p.kgIsHint]              — kg mostrato è fallback (non commit utente).
 * @param {boolean} [p.repsIsHint]            — reps mostrate sono fallback.
 * @param {Object} [p.pr]                     — { isPR, prevMax, prevReps, prevWhenLabel }.
 * @param {string} [p.note]                   — nota corrente del set.
 * @param {Object} [p.neighbors]              — { prev: {name, lastKg, lastReps, crumb}?, next: {…}? }
 * @param {'single'|'pyramid'} [p.mode='single']  — per T2.7 (Piramide riuserà lo stesso orchestrator).
 * @returns {string} HTML string.
 */
export function renderSingleExercise(p) {
  const opts = p || {};
  const block = opts.block || {};
  const bIdx  = +opts.blockIdx || 0;
  const exercise = opts.exercise || { id: '', name: '', primary: '' };
  const target   = opts.target || {};
  const setIdx   = Math.max(1, +opts.setIdx || 1);
  const totalSets = Math.max(1, +opts.totalSets || (setIdx));
  const setStates = Array.isArray(opts.setStates) ? opts.setStates : [];
  const mode = opts.mode === 'pyramid' ? 'pyramid' : 'single';

  const kgVal   = opts.currentKg != null ? +opts.currentKg : 0;
  const repsVal = opts.currentReps != null ? +opts.currentReps : 0;

  // Hints stepper: preferisci target esplicito (per reps), altrimenti last.
  const kgHint = {
    lastValue: opts.lastKg != null && +opts.lastKg > 0 ? +opts.lastKg : undefined,
  };
  const repsHint = {
    target: opts.targetReps ? String(opts.targetReps) : undefined,
    lastValue: (opts.lastReps != null && +opts.lastReps > 0) ? +opts.lastReps : undefined,
  };

  const kgValueId   = 'kgVal_'   + bIdx + '_' + exercise.id + '_' + setIdx;
  const repsValueId = 'repsVal_' + bIdx + '_' + exercise.id + '_' + setIdx;

  const kgStepper = renderBigStepper({
    target: 'kg',
    label: 'Peso',
    unit: 'kg',
    value: kgVal > 0 ? kgVal : (opts.kgIsHint && opts.lastKg > 0 ? +opts.lastKg : 0),
    isHint: !!opts.kgIsHint && !(kgVal > 0),
    step: 2.5, min: 0, max: 999,
    hint: kgHint,
    blockId: block.id,
    exerciseId: exercise.id,
    setNo: setIdx,
    bi: bIdx,
    valueId: kgValueId,
  });

  const repsStepper = renderBigStepper({
    target: 'reps',
    label: 'Ripetizioni',
    unit: '',
    value: repsVal > 0 ? repsVal : (opts.repsIsHint && opts.lastReps > 0 ? +opts.lastReps : 0),
    isHint: !!opts.repsIsHint && !(repsVal > 0),
    step: 1, min: 1, max: 99,
    hint: repsHint,
    blockId: block.id,
    exerciseId: exercise.id,
    setNo: setIdx,
    bi: bIdx,
    valueId: repsValueId,
  });

  const pr = opts.pr || {};
  const prBannerHtml = renderPRBanner({
    isPR: !!pr.isPR,
    currentKg: kgVal,
    prevMax: pr.prevMax || 0,
    prevReps: pr.prevReps,
    prevWhenLabel: pr.prevWhenLabel,
  });

  const setPickerHtml = renderSetPicker({
    sets: setStates,
    activeIdx: setIdx - 1,
    blockId: block.id,
    exerciseId: exercise.id,
    ariaLabel: 'Set dell\'esercizio',
  });

  const neighbors = opts.neighbors || {};
  const peekPrev = neighbors.prev
    ? renderNeighborPeek({
        side: 'prev',
        exerciseName: neighbors.prev.name,
        lastKg: neighbors.prev.lastKg,
        lastReps: neighbors.prev.lastReps,
        crumb: neighbors.prev.crumb,
      })
    : '';
  const peekNext = neighbors.next
    ? renderNeighborPeek({
        side: 'next',
        exerciseName: neighbors.next.name,
        lastKg: neighbors.next.lastKg,
        lastReps: neighbors.next.lastReps,
        crumb: neighbors.next.crumb,
      })
    : '';
  const peekHtml = (peekPrev || peekNext)
    ? '<div class="ex-peek-row">'
      + (peekPrev || '<span class="ex-peek ex-peek--empty" aria-hidden="true"></span>')
      + (peekNext || '<span class="ex-peek ex-peek--empty" aria-hidden="true"></span>')
      + '</div>'
    : '';

  const noteFieldHtml = buildNoteField({
    value: opts.note || '',
    blockId: block.id,
    exerciseId: exercise.id,
    setNo: setIdx,
  });

  const rootAttrs = attr({
    class: 'ex-single-exercise' + (mode === 'pyramid' ? ' ex-single-exercise--pyramid' : ''),
    'data-block-id': block.id || null,
    'data-exercise-id': exercise.id || null,
    'data-set-idx': setIdx,
    'data-mode': mode,
  });

  return '<section ' + rootAttrs + '>'
    + buildBlockCrumb(block, mode)
    + buildHero(exercise, target)
    + setPickerHtml
    + prBannerHtml
    + '<div class="ex-single-inputs">' + kgStepper + repsStepper + '</div>'
    + noteFieldHtml
    + peekHtml
    + '</section>';
}
