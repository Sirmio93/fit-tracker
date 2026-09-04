/* ==========================================================================
   Execution/AmrapTimer.js — T2.6 (PROGETTO_MOCKUP)
   Content-slot per blocchi AMRAP (family "timed"). Timer digitale grande
   (mm:ss) che SALE dall'inizio del blocco fino al `timeCapSec`. NON usa
   CountdownRing: la richiesta esplicita di T2.6 è "display digitale grande,
   non ring". Il round counter (giri completati) è la metrica primaria.

     ┌────────────────────────────────────────────────┐
     │ [pill AMRAP]  Finisher · MetCon                │  ← block-crumb
     │                                                 │
     │              ● AMRAP · 6:00                     │  ← phase pill
     │              ┌────────┐                          │
     │              │   3    │ giri completati           │  ← round counter big
     │              │        │                          │
     │              └────────┘                          │
     │             ▬▬▬▬▬▬▬━━━━━                        │  ← progress bar (elapsed/cap)
     │              02:14 / 06:00                       │  ← digital timer (mm:ss)
     │                                                 │
     │  [A]  Thruster              10 reps    [ ✓ ]    │  ← ex list (tap-to-log)
     │  [B]  Kettlebell swing      15 reps    [ · ]    │
     │  [C]  Box jump              10 reps    [ · ]    │
     └────────────────────────────────────────────────┘

   CTA slot: [Salta] [Chiudi giro N] (accent)

   Puro rendering (HTML string). Stato in S.amrap (app.js). rAF aggiorna in
   place `.ex-amrap-time` (mm:ss) + `.ex-amrap-progress__fill` (%) senza
   re-render. Al raggiungimento di `timeCapSec` il blocco auto-chiude.
   ========================================================================== */

import { esc, attr, clamp } from '../Shared/helpers.js';

function initials(name) {
  const s = String(name || '?').trim();
  if (!s) return '?';
  return s.split(/\s+/).slice(0, 2).map(function (w) { return (w[0] || '').toUpperCase(); }).join('') || '?';
}

function catBadge(exercise) {
  if (!exercise) return '';
  const cat = String(exercise.category || exercise.primary || '').trim();
  const abbr = cat ? cat.split(/\s+|\//)[0].slice(0, 4).toUpperCase() : '';
  return abbr ? '<span class="ex-cx__cat" aria-hidden="true">' + esc(abbr) + '</span>' : '';
}

function buildBlockCrumb(block, timeCapSec) {
  const sub = block && block.label ? String(block.label) : '';
  const cap = formatMMSS(timeCapSec);
  return '<div class="ex-tabata-crumb">'
    + '<span class="ex-tabata-crumb__pill">AMRAP</span>'
    + (sub ? '<span class="ex-tabata-crumb__sub">' + esc(sub) + '</span>' : '')
    + '<span class="ex-amrap-cap" aria-hidden="true">Cap ' + esc(cap) + '</span>'
    + '</div>';
}

function buildPhasePill(timeCapSec, capReached) {
  const cap = formatMMSS(timeCapSec);
  const label = capReached ? 'AMRAP · fine tempo' : 'AMRAP · ' + cap;
  const cls = 'ex-tabata-phase ex-tabata-phase--' + (capReached ? 'rest' : 'work');
  return '<div class="' + cls + '" data-phase="' + (capReached ? 'done' : 'work') + '">'
    + '<span class="ex-tabata-phase__dot" aria-hidden="true"></span>'
    + '<span class="ex-tabata-phase__lbl">' + esc(label) + '</span>'
    + '</div>';
}

function formatMMSS(totalSec) {
  const s = Math.max(0, Math.round(+totalSec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}

function buildRoundCounter(round) {
  const r = Math.max(0, +round || 0);
  return '<div class="ex-amrap-count-box" role="status" aria-live="polite">'
    +   '<span class="ex-amrap-count" data-role="round" data-value="' + r + '">' + esc(String(r)) + '</span>'
    +   '<small class="ex-amrap-count-lbl">giri completati</small>'
    + '</div>';
}

function buildProgressBar(elapsedSec, timeCapSec) {
  const total = Math.max(1, +timeCapSec || 60);
  const elapsed = clamp(+elapsedSec || 0, 0, total);
  const pct = Math.round((elapsed / total) * 1000) / 10;
  const remaining = Math.max(0, total - elapsed);
  return '<div class="ex-amrap-timeline">'
    +   '<div class="ex-amrap-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + Math.round(elapsed) + '">'
    +     '<div class="ex-amrap-progress__fill" data-role="progress" style="width:' + pct + '%"></div>'
    +   '</div>'
    +   '<div class="ex-amrap-time-row">'
    +     '<span class="ex-amrap-time" data-role="elapsed">' + esc(formatMMSS(elapsed)) + '</span>'
    +     '<span class="ex-amrap-time-sep">/</span>'
    +     '<span class="ex-amrap-time ex-amrap-time--cap">' + esc(formatMMSS(total)) + '</span>'
    +     '<span class="ex-amrap-time-rem" data-role="remaining" aria-hidden="true">' + esc(formatMMSS(remaining)) + ' left</span>'
    +   '</div>'
    + '</div>';
}

function buildExerciseRow(exercise, idx, target, done) {
  const idxLetter = String.fromCharCode(65 + (idx % 26));
  const name = exercise && exercise.name ? String(exercise.name) : 'Esercizio';
  const targetLabel = target && target.reps ? String(target.reps) + ' reps' : 'reps';
  const cls = 'ex-cx' + (done ? ' ex-cx--done' : '');
  const mark = done ? '✓' : String(idx + 1);
  const action = 'amrap-toggle-ex';
  return '<li class="' + cls + '" data-role="amrap-ex" data-ex-idx="' + idx + '" data-ex-id="' + esc(exercise ? String(exercise.id || '') : '') + '">'
    +   '<span class="ex-cx__idx" aria-hidden="true">' + esc(idxLetter) + '</span>'
    +   '<div class="ex-cx__thumb" aria-hidden="true">'
    +     catBadge(exercise)
    +     '<span class="ex-cx__initials">' + esc(initials(name)) + '</span>'
    +   '</div>'
    +   '<div class="ex-cx__info">'
    +     '<p class="ex-cx__name">' + esc(name) + '</p>'
    +     '<div class="ex-cx__target"><span><b>' + esc(targetLabel) + '</b></span></div>'
    +   '</div>'
    +   '<button type="button" class="ex-cx__mark" data-action="' + action + '" data-ex-idx="' + idx + '" data-ex-id="' + esc(exercise ? String(exercise.id || '') : '') + '" aria-label="' + (done ? 'Annulla' : 'Segna fatto') + '">' + mark + '</button>'
    + '</li>';
}

/**
 * @param {Object} p
 * @param {Object} p.block                   blocco AMRAP
 * @param {Array<Object>} p.exercises        esercizi (id, name, primary)
 * @param {Object} [p.targets]               {exId: {reps}}
 * @param {number} p.timeCapSec              tempo totale AMRAP (default 300)
 * @param {number} p.elapsedSec              secondi trascorsi
 * @param {number} p.round                   round correnti (giri completi)
 * @param {Object} [p.exerciseDone]          {exId: bool} — done nel round in corso
 * @param {boolean} [p.paused]
 * @param {boolean} [p.capReached]
 * @returns {string} HTML
 */
export function renderAmrapTimer(p) {
  const opts = p || {};
  const block = opts.block || {};
  const exercises = Array.isArray(opts.exercises) ? opts.exercises : [];
  const targets = opts.targets || {};
  const timeCapSec = Math.max(1, +opts.timeCapSec || 300);
  const elapsedSec = Math.max(0, +opts.elapsedSec || 0);
  const round = Math.max(0, +opts.round || 0);
  const exerciseDone = opts.exerciseDone || {};
  const paused = !!opts.paused;
  const capReached = !!opts.capReached || elapsedSec >= timeCapSec;

  const rootAttrs = attr({
    class: 'ex-amrap ex-tabata' + (paused ? ' ex-amrap--paused' : '') + (capReached ? ' ex-amrap--done' : ''),
    'data-block-id': block.id || null,
    'data-round': round,
    'data-time-cap-sec': timeCapSec,
    'data-elapsed-sec': Math.round(elapsedSec),
    'data-paused': paused ? 'true' : 'false',
    'data-cap-reached': capReached ? 'true' : 'false',
    role: 'region',
    'aria-label': 'Timer AMRAP',
  });

  let exList = '<ul class="ex-cx-list ex-amrap-ex-list" role="list" aria-label="Esercizi del giro">';
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const t = ex && targets[ex.id] ? targets[ex.id] : {};
    const done = !!exerciseDone[ex && ex.id];
    exList += buildExerciseRow(ex, i, t, done);
  }
  exList += '</ul>';

  return '<section ' + rootAttrs + '>'
    + buildBlockCrumb(block, timeCapSec)
    + '<div class="ex-tabata-hero ex-amrap-hero">'
    +   buildPhasePill(timeCapSec, capReached)
    +   buildRoundCounter(round)
    +   buildProgressBar(elapsedSec, timeCapSec)
    + '</div>'
    + exList
    + '</section>';
}

/**
 * CTA slot: [Salta] [Chiudi giro N] (accent) + Pausa (ghost inline?).
 * Manteniamo il pattern Tabata: 2 pulsanti primary+secondary.
 * @param {Object} p
 * @param {number} [p.round]
 * @param {boolean} [p.paused]
 * @param {boolean} [p.capReached]
 * @returns {string}
 */
export function renderAmrapCtrls(p) {
  const opts = p || {};
  const round = Math.max(0, +opts.round || 0);
  const paused = !!opts.paused;
  const capReached = !!opts.capReached;

  const pauseAction = paused ? 'amrap-resume' : 'amrap-pause';
  const pauseLabel = paused ? 'Riprendi' : 'Pausa';
  const pauseAria = paused ? 'Riprendi timer AMRAP' : 'Metti in pausa il timer AMRAP';

  const skipBtn = '<button type="button"'
    + ' class="ex-tab-btn ex-tab-btn--skip"'
    + ' data-action="amrap-skip"'
    + ' aria-label="Termina AMRAP e passa al prossimo blocco">'
    + '<span class="ex-tab-btn__lbl">Skip</span>'
    + '</button>';

  const pauseBtn = '<button type="button"'
    + ' class="ex-tab-btn ex-tab-btn--pause"'
    + ' data-action="' + esc(pauseAction) + '"'
    + ' aria-label="' + esc(pauseAria) + '"'
    + (capReached ? ' disabled' : '') + '>'
    + '<span class="ex-tab-btn__lbl">' + esc(pauseLabel) + '</span>'
    + '</button>';

  const closeRoundBtn = '<button type="button"'
    + ' class="ex-tab-btn ex-tab-btn--pause ex-amrap-close-round"'
    + ' data-action="amrap-close-round"'
    + ' aria-label="Chiudi giro ' + (round + 1) + '"'
    + (capReached ? ' disabled' : '') + '>'
    + '<span class="ex-tab-btn__lbl">Chiudi giro ' + esc(String(round + 1)) + '</span>'
    + '</button>';

  // Layout: ghost Skip · Pausa · CTA accent Chiudi giro
  return '<div class="ex-tab-ctrls ex-amrap-ctrls" role="group" aria-label="Controlli AMRAP">'
    + skipBtn + pauseBtn + closeRoundBtn
    + '</div>';
}
