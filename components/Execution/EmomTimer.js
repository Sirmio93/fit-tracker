/* ==========================================================================
   Execution/EmomTimer.js — T2.6 (PROGETTO_MOCKUP)
   Content-slot per blocchi EMOM (family "timed"). Layout derivato da Tabata
   (Device C del mockup Esecuzione) ma con semantica "reps per minute":

     ┌────────────────────────────────────────────────┐
     │ [pill EMOM]  Finisher · Skill                  │  ← block-crumb
     │                                                 │
     │              ● Minuto 3 / 10                    │  ← cycle label + pulse
     │              ┌──────────┐                       │
     │              │   ring   │  ← CountdownRing 60→0 │
     │              │  9 reps  │                       │
     │              │  / 12    │                       │
     │              └──────────┘                       │
     │           [ − ] [ + ]  tap to count             │  ← reps stepper
     │       ▬▬ ▬▬ ● □ □ □ □ □ □ □                     │  ← cycles bar
     │                                                 │
     │  [thumb] Esercizio corrente                     │
     │          Thruster                                │
     └────────────────────────────────────────────────┘

   CTA slot separato (renderEmomCtrls): [Skip] [Pausa]

   Riusa CountdownRing di T2.5 (direction='down', workSec→0). Il centerContent
   invece del countdown mostra il counter reps: "N" big + "/ target" small.

   Puro rendering (HTML string). Lo stato timer vive in S.emom (app.js) ed è
   aggiornato in-place dal loop rAF su .ex-ring (numero + stroke-dashoffset).
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { renderCountdownRing } from './CountdownRing.js';

function initials(name) {
  const s = String(name || '?').trim();
  if (!s) return '?';
  return s.split(/\s+/).slice(0, 2).map(function (w) { return (w[0] || '').toUpperCase(); }).join('') || '?';
}

function catBadge(exercise) {
  if (!exercise) return '';
  const cat = String(exercise.category || exercise.primary || '').trim();
  const abbr = cat ? cat.split(/\s+|\//)[0].slice(0, 4).toUpperCase() : '';
  return abbr ? '<span class="ex-tab-ex__cat" aria-hidden="true">' + esc(abbr) + '</span>' : '';
}

function buildBlockCrumb(block) {
  const sub = block && block.label ? String(block.label) : '';
  return '<div class="ex-tabata-crumb">'
    + '<span class="ex-tabata-crumb__pill">EMOM</span>'
    + (sub ? '<span class="ex-tabata-crumb__sub">' + esc(sub) + '</span>' : '')
    + '</div>';
}

function buildCycleLabel(cycleIdx, cyclesTotal, phase) {
  const isFail = phase === 'fail';
  const cls = 'ex-tabata-phase ex-tabata-phase--' + (isFail ? 'rest' : 'work');
  const label = 'Minuto ' + cycleIdx + ' / ' + cyclesTotal;
  return '<div class="' + cls + '" data-phase="' + esc(phase || 'work') + '">'
    + '<span class="ex-tabata-phase__dot" aria-hidden="true"></span>'
    + '<span class="ex-tabata-phase__lbl">' + esc(label) + '</span>'
    + '</div>';
}

/**
 * Cycles bar: bianco = success (met target), grigio muted = fail (didn't meet),
 * accent giallo con glow = current, grigio scuro = upcoming.
 */
function buildCyclesBar(cyclesTotal, cycleIdx, repsHistory, repsTarget) {
  const total = Math.max(1, +cyclesTotal || 10);
  const cur = Math.max(1, Math.min(+cycleIdx || 1, total));
  const hist = Array.isArray(repsHistory) ? repsHistory : [];
  let out = '<div class="ex-emom-cycles" role="list" aria-label="Cicli EMOM">';
  for (let i = 1; i <= total; i++) {
    let cls = 'ex-emom-cyc';
    let state = 'upcoming';
    if (i < cur) {
      const reps = +hist[i - 1] || 0;
      if (repsTarget > 0 && reps >= repsTarget) { cls += ' ex-emom-cyc--done'; state = 'done'; }
      else { cls += ' ex-emom-cyc--fail'; state = 'fail'; }
    } else if (i === cur) {
      cls += ' ex-emom-cyc--on'; state = 'on';
    }
    out += '<span class="' + cls + '" data-cycle-idx="' + i + '" data-state="' + state + '" role="listitem" aria-label="Minuto ' + i + ' di ' + total + '"></span>';
  }
  out += '</div>';
  return out;
}

function buildExerciseCard(exercise, eyebrow) {
  const name = exercise && exercise.name ? String(exercise.name) : 'Esercizio';
  return '<div class="ex-tab-ex ex-tab-ex--current" data-role="current">'
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

function buildRepsStepper(repsDone, repsTarget) {
  const targetHint = repsTarget > 0
    ? '<span class="ex-emom-target">Target <b>' + esc(String(repsTarget)) + '</b> reps</span>'
    : '<span class="ex-emom-target">Tap per contare le reps</span>';
  return '<div class="ex-emom-stepper" role="group" aria-label="Contatore ripetizioni EMOM">'
    +   '<button type="button" class="ex-emom-btn ex-emom-btn--dec" data-action="emom-dec-reps" aria-label="Diminuisci reps">−</button>'
    +   '<div class="ex-emom-count-box" aria-live="polite">'
    +     '<span class="ex-emom-count" data-role="reps-inline">' + esc(String(repsDone)) + '</span>'
    +     '<span class="ex-emom-count-lbl">reps</span>'
    +   '</div>'
    +   '<button type="button" class="ex-emom-btn ex-emom-btn--inc" data-action="emom-inc-reps" aria-label="Aggiungi reps">+</button>'
    + '</div>'
    + '<div class="ex-emom-hint">' + targetHint + '</div>';
}

function buildRingCenter(repsDone, repsTarget) {
  const done = Math.max(0, +repsDone || 0);
  const target = Math.max(0, +repsTarget || 0);
  const targetLine = target > 0
    ? '<small class="ex-ring__unit">/ ' + esc(String(target)) + ' reps</small>'
    : '<small class="ex-ring__unit">reps</small>';
  return '<span class="ex-ring__num" data-value="' + done + '" data-role="reps">' + esc(String(done)) + '</span>'
    + targetLine;
}

/**
 * @param {Object} p
 * @param {Object} p.block                    blocco EMOM
 * @param {Array<Object>} p.exercises         sequenza esercizi (id, name, primary)
 * @param {number} p.currentExerciseIdx       0-based (per cycle rotation)
 * @param {number} p.cycleIdx                 1-based (1..cyclesTotal)
 * @param {number} p.cyclesTotal
 * @param {number} p.workSec                  secondi per minuto (default 60)
 * @param {number} p.remainingSec             quanto manca alla fine del minuto
 * @param {number} p.repsDone                 reps fatte nel minuto corrente
 * @param {number} p.repsTarget               reps richieste (dal target esercizio)
 * @param {Array<number>} [p.repsHistory]     reps per ogni ciclo passato
 * @param {boolean} [p.paused]
 * @returns {string} HTML string
 */
export function renderEmomTimer(p) {
  const opts = p || {};
  const block = opts.block || {};
  const exercises = Array.isArray(opts.exercises) ? opts.exercises : [];
  const exIdx = Math.max(0, Math.min(+opts.currentExerciseIdx || 0, Math.max(0, exercises.length - 1)));
  const cyclesTotal = Math.max(1, +opts.cyclesTotal || 10);
  const cycleIdx = Math.max(1, Math.min(+opts.cycleIdx || 1, cyclesTotal));
  const workSec = Math.max(1, +opts.workSec || 60);
  const remaining = Math.max(0, Math.min(+opts.remainingSec != null ? +opts.remainingSec : workSec, workSec));
  const repsDone = Math.max(0, +opts.repsDone || 0);
  const repsTarget = Math.max(0, +opts.repsTarget || 0);
  const repsHistory = Array.isArray(opts.repsHistory) ? opts.repsHistory : [];
  const paused = !!opts.paused;

  const currentEx = exercises[exIdx] || null;
  const targetMet = repsTarget > 0 && repsDone >= repsTarget;

  // Ring color: yellow (accent) during active minute; if paused ⇒ still yellow.
  // The "fail-state grey" from the brief manifests via the cycles bar
  // (cyc--fail) once the minute has expired without meeting target — not on
  // the running ring itself (which resets immediately at boundary).
  const ringColor = targetMet ? 'accent' : 'accent';
  const ringHtml = renderCountdownRing({
    total: workSec,
    remaining: remaining,
    size: 246,
    stroke: 12,
    color: ringColor,
    phase: 'work',
    direction: 'down',
    id: 'exEmomRing',
    centerContent: buildRingCenter(repsDone, repsTarget),
  });

  const exEyebrow = exercises.length > 1
    ? 'Esercizio ' + (exIdx + 1) + ' / ' + exercises.length
    : 'Esercizio corrente';

  const rootAttrs = attr({
    class: 'ex-emom ex-tabata' + (paused ? ' ex-emom--paused' : '') + (targetMet ? ' ex-emom--met' : ''),
    'data-block-id': block.id || null,
    'data-cycle-idx': cycleIdx,
    'data-cycles-total': cyclesTotal,
    'data-work-sec': workSec,
    'data-exercise-idx': exIdx,
    'data-reps-done': repsDone,
    'data-reps-target': repsTarget,
    'data-target-met': targetMet ? 'true' : 'false',
    'data-paused': paused ? 'true' : 'false',
    role: 'region',
    'aria-label': 'Timer EMOM',
  });

  return '<section ' + rootAttrs + '>'
    + buildBlockCrumb(block)
    + '<div class="ex-tabata-hero ex-emom-hero">'
    +   buildCycleLabel(cycleIdx, cyclesTotal, 'work')
    +   ringHtml
    +   buildRepsStepper(repsDone, repsTarget)
    +   buildCyclesBar(cyclesTotal, cycleIdx, repsHistory, repsTarget)
    +   buildExerciseCard(currentEx, exEyebrow)
    + '</div>'
    + '</section>';
}

/**
 * CTA slot: [Skip] [Pausa/Riprendi] (identico a Tabata, azioni diverse).
 * @param {Object} p
 * @param {boolean} [p.paused]
 * @returns {string}
 */
export function renderEmomCtrls(p) {
  const opts = p || {};
  const paused = !!opts.paused;
  const pauseAction = paused ? 'emom-resume' : 'emom-pause';
  const pauseLabel = paused ? 'Riprendi' : 'Pausa';
  const pauseAria = paused ? 'Riprendi timer EMOM' : 'Metti in pausa il timer EMOM';

  const skipBtn = '<button type="button"'
    + ' class="ex-tab-btn ex-tab-btn--skip"'
    + ' data-action="emom-skip"'
    + ' aria-label="Salta minuto EMOM">'
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

  return '<div class="ex-tab-ctrls" role="group" aria-label="Controlli EMOM">'
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
