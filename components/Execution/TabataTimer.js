/* ==========================================================================
   Execution/TabataTimer.js — T2.5 (PROGETTO_MOCKUP)
   Content-slot per blocchi Tabata (`familyExec === 'timed'`). Layout basato
   sul Device C del mockup Esecuzione:

     ┌────────────────────────────────────────────────┐
     │ [pill Tabata]  Finisher · Core                 │  ← block-crumb
     │                                                 │
     │              ● Lavoro                           │  ← phase label + pulse
     │              ┌──────────┐                       │
     │              │   ring   │  ← CountdownRing      │
     │              │   12sec  │                       │
     │              └──────────┘                       │
     │       ▬▬ ▬▬ ▬▬ ▬▬ ● □ □ □                       │  ← 8-cycles bar
     │                                                 │
     │  [thumb] Ciclo 5/8 · in corso                   │  ← current ex card
     │          Mountain climber                       │
     │  [thumb] Poi → riposo 10″                       │  ← next ex card (opaco)
     │          Plank jack                             │
     └────────────────────────────────────────────────┘

   CTA slot separato (renderTabataCtrls): [Skip] [Pausa]

   PATTERN che T2.6 (EMOM/AMRAP) riuserà: CountdownRing è isolato, i
   consumer differiscono solo per centerContent e direction.

   Puro rendering (HTML string). Lo stato timer vive in S.tabata (app.js) e
   viene aggiornato in-place dal loop rAF su ex-ring/countdown/phase/cycles
   senza render completo (per non far scattare re-mount della SVG).
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { renderCountdownRing } from './CountdownRing.js';

function catBadge(exercise) {
  if (!exercise) return '';
  const cat = String(exercise.category || exercise.primary || '').trim();
  const abbr = cat ? cat.split(/\s+|\//)[0].slice(0, 4).toUpperCase() : '';
  return abbr ? '<span class="ex-tab-ex__cat" aria-hidden="true">' + esc(abbr) + '</span>' : '';
}

function initials(name) {
  const s = String(name || '?').trim();
  if (!s) return '?';
  return s.split(/\s+/).slice(0, 2).map(function (w) { return (w[0] || '').toUpperCase(); }).join('') || '?';
}

function buildBlockCrumb(block) {
  const sub = block && block.label ? String(block.label) : '';
  return '<div class="ex-tabata-crumb">'
    + '<span class="ex-tabata-crumb__pill">Tabata</span>'
    + (sub ? '<span class="ex-tabata-crumb__sub">' + esc(sub) + '</span>' : '')
    + '</div>';
}

function buildPhase(phase) {
  const isWork = phase !== 'rest';
  const label = isWork ? 'Lavoro' : 'Riposo';
  const cls = 'ex-tabata-phase' + (isWork ? ' ex-tabata-phase--work' : ' ex-tabata-phase--rest');
  return '<div class="' + cls + '" data-phase="' + esc(phase || 'work') + '">'
    + '<span class="ex-tabata-phase__dot" aria-hidden="true"></span>'
    + '<span class="ex-tabata-phase__lbl">' + esc(label) + '</span>'
    + '</div>';
}

function buildCyclesBar(cyclesTotal, cycleIdx, phase) {
  const total = Math.max(1, +cyclesTotal || 8);
  const cur = Math.max(1, Math.min(+cycleIdx || 1, total));
  // done = cycles fully completed (index < cur). L'indice `cur` è "on" durante
  // work E rest dello stesso ciclo. Cicli oltre `cur` sono upcoming.
  let out = '<div class="ex-tabata-cycles" role="list" aria-label="Cicli Tabata">';
  for (let i = 1; i <= total; i++) {
    let cls = 'ex-tabata-cyc';
    let state = 'upcoming';
    if (i < cur) { cls += ' ex-tabata-cyc--done'; state = 'done'; }
    else if (i === cur) { cls += ' ex-tabata-cyc--on'; state = 'on'; }
    out += '<span class="' + cls + '" data-cycle-idx="' + i + '" data-state="' + state + '" role="listitem" aria-label="Ciclo ' + i + ' di ' + total + '"></span>';
  }
  out += '</div>';
  return out;
}

function buildExerciseCard(kind, exercise, eyebrow) {
  const cls = kind === 'next' ? 'ex-tab-ex ex-tab-ex--next' : 'ex-tab-ex ex-tab-ex--current';
  const name = exercise && exercise.name ? String(exercise.name) : (kind === 'next' ? 'Fine blocco' : 'Esercizio');
  return '<div class="' + cls + '" data-role="' + kind + '">'
    + '<div class="ex-tab-ex__thumb" aria-hidden="true">'
    +   catBadge(exercise)
    +   '<span class="ex-tab-ex__initials">' + esc(initials(name)) + '</span>'
    + '</div>'
    + '<div class="ex-tab-ex__info">'
    +   '<div class="ex-tab-ex__lbl">' + esc(eyebrow || '') + '</div>'
    +   '<p class="ex-tab-ex__name">' + esc(name) + '</p>'
    + '</div>'
    + '</div>';
}

/**
 * @param {Object} p
 * @param {Object} p.block                        blocco Tabata corrente
 * @param {Array<Object>} p.exercises             sequenza esercizi (id, name, primary)
 * @param {number} p.currentExerciseIdx           0-based
 * @param {number} p.cycleIdx                     1-based (1..cyclesTotal)
 * @param {number} p.cyclesTotal
 * @param {number} p.workSec
 * @param {number} p.restSec
 * @param {'work'|'rest'} p.phase
 * @param {number} p.remainingSec
 * @param {boolean} [p.paused]
 * @returns {string} HTML string
 */
export function renderTabataTimer(p) {
  const opts = p || {};
  const block = opts.block || {};
  const exercises = Array.isArray(opts.exercises) ? opts.exercises : [];
  const exIdx = Math.max(0, Math.min(+opts.currentExerciseIdx || 0, Math.max(0, exercises.length - 1)));
  const cyclesTotal = Math.max(1, +opts.cyclesTotal || 8);
  const cycleIdx = Math.max(1, Math.min(+opts.cycleIdx || 1, cyclesTotal));
  const workSec = Math.max(1, +opts.workSec || 20);
  const restSec = Math.max(1, +opts.restSec || 10);
  const phase = opts.phase === 'rest' ? 'rest' : 'work';
  const phaseTotal = phase === 'rest' ? restSec : workSec;
  const remaining = Math.max(0, Math.min(+opts.remainingSec != null ? +opts.remainingSec : phaseTotal, phaseTotal));
  const paused = !!opts.paused;

  const currentEx = exercises[exIdx] || null;

  // Prossimo:
  // - Se siamo in WORK: il "poi" è il riposo del ciclo corrente. Testo:
  //     "Poi → riposo Nsec" + prossimo esercizio (se cycleIdx = cyclesTotal
  //     mostra il prossimo esercizio; altrimenti resta l'attuale in rest).
  // - Se siamo in REST: il "poi" è il prossimo work.
  let nextEx = null;
  let nextEyebrow = '';
  if (phase === 'work') {
    nextEyebrow = 'Poi → riposo ' + restSec + '″';
    if (cycleIdx >= cyclesTotal && exercises.length > exIdx + 1) {
      nextEx = exercises[exIdx + 1];
    } else {
      nextEx = currentEx;
    }
  } else {
    if (cycleIdx >= cyclesTotal) {
      nextEx = exercises[exIdx + 1] || null;
      nextEyebrow = nextEx ? 'Poi → prossimo esercizio' : 'Poi → fine blocco';
    } else {
      nextEx = currentEx;
      nextEyebrow = 'Poi → ciclo ' + (cycleIdx + 1);
    }
  }

  const currentEyebrow = 'Ciclo ' + cycleIdx + ' / ' + cyclesTotal + (phase === 'rest' ? ' · riposo' : ' · in corso');

  const ringColor = phase === 'rest' ? 'muted' : 'accent';
  const ringHtml = renderCountdownRing({
    total: phaseTotal,
    remaining: remaining,
    size: 246,
    stroke: 12,
    color: ringColor,
    phase: phase,
    id: 'exTabataRing',
    centerContent: '<span class="ex-ring__num" data-value="' + Math.round(remaining) + '">'
      + esc(String(Math.round(remaining)))
      + '</span><small class="ex-ring__unit">sec</small>',
  });

  const rootAttrs = attr({
    class: 'ex-tabata' + (paused ? ' ex-tabata--paused' : ''),
    'data-block-id': block.id || null,
    'data-phase': phase,
    'data-cycle-idx': cycleIdx,
    'data-cycles-total': cyclesTotal,
    'data-work-sec': workSec,
    'data-rest-sec': restSec,
    'data-exercise-idx': exIdx,
    'data-paused': paused ? 'true' : 'false',
    role: 'region',
    'aria-label': 'Timer Tabata',
  });

  return '<section ' + rootAttrs + '>'
    + buildBlockCrumb(block)
    + '<div class="ex-tabata-hero">'
    +   buildPhase(phase)
    +   ringHtml
    +   buildCyclesBar(cyclesTotal, cycleIdx, phase)
    +   buildExerciseCard('current', currentEx, currentEyebrow)
    +   buildExerciseCard('next', nextEx, nextEyebrow)
    + '</div>'
    + '</section>';
}

/**
 * CTA slot: [Skip] [Pausa/Riprendi]
 * @param {Object} p
 * @param {boolean} [p.paused]
 * @returns {string}
 */
export function renderTabataCtrls(p) {
  const opts = p || {};
  const paused = !!opts.paused;
  const pauseAction = paused ? 'tabata-resume' : 'tabata-pause';
  const pauseLabel  = paused ? 'Riprendi' : 'Pausa';
  const pauseAria   = paused ? 'Riprendi timer' : 'Metti in pausa';

  const skipBtn = '<button type="button"'
    + ' class="ex-tab-btn ex-tab-btn--skip"'
    + ' data-action="tabata-skip"'
    + ' aria-label="Salta esercizio Tabata">'
    + '<span class="ex-tab-btn__ico" aria-hidden="true">' + skipSvg() + '</span>'
    + '<span class="ex-tab-btn__lbl">Skip</span>'
    + '</button>';

  const pauseBtn = '<button type="button"'
    + ' class="ex-tab-btn ex-tab-btn--pause"'
    + ' data-action="' + esc(pauseAction) + '"'
    + ' aria-label="' + esc(pauseAria) + '">'
    + '<span class="ex-tab-btn__ico" aria-hidden="true">' + (paused ? playSvg() : pauseSvg()) + '</span>'
    + '<span class="ex-tab-btn__lbl">' + esc(pauseLabel) + '</span>'
    + '</button>';

  return '<div class="ex-tab-ctrls" role="group" aria-label="Controlli Tabata">'
    + skipBtn + pauseBtn
    + '</div>';
}

function pauseSvg() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">'
    + '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
}
function playSvg() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">'
    + '<path d="M6 4l14 8-14 8V4z"/></svg>';
}
function skipSvg() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">'
    + '<path d="M7 6h3v12H7zM12 12l9-6v12z"/></svg>';
}
