/* ==========================================================================
   Execution/CircuitRound.js — T2.3 (PROGETTO_MOCKUP)
   Body del content-slot per blocchi Circuit / Superset (family="round").

   Regola invariante (project_focus_mode_design):
     · Circuit ≡ Superset (rendering identico, cambia solo l'etichetta pill).
     · Rest timer parte SOLO su `toggleRound` (chiusura giro), MAI su
       `toggleExerciseSet` del singolo esercizio del giro. Questa business
       logic vive in app.js e NON è ridichiarata qui: il componente si
       limita a emettere data-action="toggle-set" (sui done/on) e la CTA di
       shell chiama "toggle-round".

   Layout mockup (Device B intero):
     ┌────────────────────────────────────────────────┐
     │ [pill Circuit] Circuito 1 · Petto e Tricipiti  │  ← block-crumb
     ├────────────────────────────────────────────────┤
     │ Giro 2 /3           ·  2/3 completati         │  ← .ex-round-hd
     │ ▬▬▬▬▬  ▓▓▓▓▓▓▓  ░░░░░                          │  ← .ex-round-dots
     ├────────────────────────────────────────────────┤
     │ (A)  [ident-mini]  Panca piana bilanciere  ✓   │  ← .ex-cx (done)
     │ (B)  [ident-mini]  Croci con manubri       →   │  ← .ex-cx (on)
     │ (C)  [ident-mini]  Push-down ai cavi       3   │  ← .ex-cx (upcoming)
     ├────────────────────────────────────────────────┤
     │ "Chiudi il giro per far partire il rest 90″"    │
     │ [Blocco successivo → PIRAMIDE · Squat …]        │  ← NeighborPeek (opt)
     └────────────────────────────────────────────────┘
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { ExerciseIdentity } from '../Exercise/ExerciseIdentity.js';
import { renderNeighborPeek } from './NeighborPeek.js';

function idxLetter(i) {
  return String.fromCharCode(65 + Math.min(25, Math.max(0, i | 0))); // A..Z
}

function isSupersetType(type, label) {
  const t = String(type || '').toLowerCase();
  const l = String(label || '').toLowerCase();
  return /superset|superserie/.test(t) || /superset|superserie/.test(l);
}

function statusFromState(state) {
  if (state === 'done') return 'completed';
  if (state === 'on')   return 'current';
  return 'upcoming';
}

function buildBlockCrumb(block) {
  const pillTxt = isSupersetType(block && block.type, block && block.label) ? 'Superset' : 'Circuit';
  const sub = block && block.label ? String(block.label) : '';
  return '<div class="ex-single-crumb">'
    + '<span class="ex-single-crumb__pill">' + esc(pillTxt) + '</span>'
    + (sub ? '<span class="ex-single-crumb__sub">' + esc(sub) + '</span>' : '')
    + '</div>';
}

function buildRoundHeader(round, totalRounds, doneInRound, totalInRound) {
  return '<header class="ex-round-hd" role="group" aria-label="Progresso giro">'
    +   '<div class="ex-round-hd__t">Giro <b>' + esc(round) + '</b>'
    +     '<small>/ ' + esc(totalRounds) + '</small></div>'
    +   '<div class="ex-round-hd__c">' + esc(doneInRound) + '/' + esc(totalInRound) + ' completati</div>'
    + '</header>';
}

function buildRoundDots(round, totalRounds) {
  const parts = [];
  for (let i = 1; i <= totalRounds; i++) {
    let state = 'up';
    if (i < round) state = 'done';
    else if (i === round) state = 'on';
    parts.push('<span class="ex-round-dot ex-round-dot--' + state + '"'
      + ' data-round="' + esc(i) + '"'
      + ' data-state="' + esc(state) + '"'
      + ' aria-hidden="true"></span>');
  }
  return '<div class="ex-round-dots"'
    + ' role="progressbar"'
    + ' aria-valuemin="1"'
    + ' aria-valuemax="' + esc(totalRounds) + '"'
    + ' aria-valuenow="' + esc(round) + '"'
    + ' aria-label="Giro ' + esc(round) + ' di ' + esc(totalRounds) + '">'
    + parts.join('')
    + '</div>';
}

function targetMeta(target) {
  const t = target || {};
  const bits = [];
  if (t.reps)   bits.push('<span><b>' + esc(t.reps) + '</b> reps</span>');
  if (t.target) bits.push('<span class="ex-cx__badge">' + esc(t.target) + '</span>');
  if (!bits.length) return '';
  return '<div class="ex-cx__target">'
    + bits.join('<span class="ex-cx__sep" aria-hidden="true">·</span>')
    + '</div>';
}

function markGlyph(state) {
  if (state === 'done') return '✓';
  if (state === 'on')   return '→';
  return '';
}

function buildExRow(entry, i, block, round) {
  const e     = entry.exercise || { id: '', name: 'Esercizio', primary: '' };
  const state = entry.state === 'done' || entry.state === 'on' ? entry.state : 'upcoming';
  const idx   = idxLetter(i);

  const status = statusFromState(state);
  const identityHtml = ExerciseIdentity({
    name:      e.name || '',
    size:      'mini',
    status:    status,
    ariaLabel: e.name || 'Esercizio',
    showBadges: false,
    className: 'ex-cx__ident',
  });

  const nameHtml   = '<p class="ex-cx__name">' + esc(e.name || '') + '</p>';
  const metaHtml   = targetMeta(entry.target);
  const bodyHtml   = '<div class="ex-cx__info">' + nameHtml + metaHtml + '</div>';
  const idxHtml    = '<span class="ex-cx__idx" aria-hidden="true">' + esc(idx) + '</span>';
  const thumbHtml  = '<span class="ex-cx__thumb" aria-hidden="true">' + identityHtml + '</span>';

  // Mark visivo. Upcoming → indice numerico (posizione nel giro, 1-based),
  // done → check, on → freccia. Coerente col mockup Device B.
  const markTxt    = state === 'upcoming' ? String(i + 1) : markGlyph(state);
  const markHtml   = '<span class="ex-cx__mark" data-state="' + esc(state) + '" aria-hidden="true">'
                   + esc(markTxt) + '</span>';

  const clsList = ['ex-cx', 'ex-cx--' + state];
  const interactive = state === 'done' || state === 'on';
  const nextChecked = state === 'done' ? 'false' : 'true';   // done → untoggle, on → mark
  const aLbl = state === 'done'
    ? (idx + ' · ' + (e.name || 'Esercizio') + ' · completato · tocca per annullare')
    : state === 'on'
      ? (idx + ' · ' + (e.name || 'Esercizio') + ' · in corso · tocca per completare')
      : (idx + ' · ' + (e.name || 'Esercizio') + ' · in attesa');

  const btnAttrs = attr({
    type: 'button',
    class: clsList.join(' '),
    'data-action': interactive ? 'toggle-set' : null,
    'data-block-id': interactive ? block.id : null,
    'data-exercise-id': interactive ? e.id : null,
    'data-set-no': interactive ? round : null,
    'data-checked': interactive ? nextChecked : null,
    'data-state': state,
    'data-idx': idx,
    'aria-label': aLbl,
    'aria-disabled': interactive ? null : 'true',
    disabled: interactive ? null : true,
  });

  return '<li class="ex-cx-wrap">'
    + '<button ' + btnAttrs + '>'
    +   idxHtml
    +   thumbHtml
    +   bodyHtml
    +   markHtml
    + '</button>'
    + '</li>';
}

function buildRoundHint(round, totalRounds, restSec, blockDone) {
  if (blockDone) {
    return '<p class="ex-round-tick ex-round-tick--done" aria-live="polite">'
      + 'Tutti i giri completati · chiudi il giro per passare al prossimo blocco'
      + '</p>';
  }
  const isLast = round >= totalRounds;
  const tail = isLast
    ? 'per finire il blocco'
    : 'per far partire il rest <b>' + esc(restSec) + '″</b>';
  return '<p class="ex-round-tick" aria-live="polite">Chiudi il giro ' + tail + '</p>';
}

/**
 * @param {Object} p
 * @param {Object} p.block                Blocco Circuit/Superset ({id, type, label, restSec, exerciseIds…}).
 * @param {number} p.blockIdx             Indice blocco 0-based (per crumb neighbor).
 * @param {number} p.blockTotal           Numero totale blocchi.
 * @param {number} p.round                Giro corrente 1-based.
 * @param {number} p.totalRounds          Giri totali del blocco.
 * @param {number} [p.restSec=60]         Rest a fine giro (per hint).
 * @param {boolean}[p.blockDone=false]    True se tutti i giri completati.
 * @param {Array<{
 *   exercise:{id:string,name:string,primary?:string},
 *   target?:{reps?:string,target?:string},
 *   state:'done'|'on'|'upcoming'
 * }>} p.entries — esercizi del giro corrente in ordine (A/B/C…).
 * @param {Object} [p.neighbor]           Prossimo blocco (mai fake data): {name,crumb,lastKg,lastReps}?
 * @returns {string} HTML string (body slot per renderExecutionShell).
 */
export function renderCircuitRound(p) {
  const opts    = p || {};
  const block   = opts.block || {};
  const round   = Math.max(1, +opts.round || 1);
  const totalR  = Math.max(round, +opts.totalRounds || 1);
  const restSec = Math.max(0, +opts.restSec || 60);
  const blockDone = !!opts.blockDone;
  const entries = Array.isArray(opts.entries) ? opts.entries : [];

  const doneInRound  = entries.filter(function (e) { return e && e.state === 'done'; }).length;
  const totalInRound = entries.length;

  const rowsHtml = entries.map(function (e, i) { return buildExRow(e, i, block, round); }).join('');
  const listHtml = '<ul class="ex-cx-list" aria-label="Esercizi del giro">' + rowsHtml + '</ul>';

  const neighborHtml = opts.neighbor && opts.neighbor.name
    ? '<div class="ex-peek-row ex-peek-row--single">'
        + renderNeighborPeek({
            side: 'next',
            exerciseName: opts.neighbor.name,
            lastKg: opts.neighbor.lastKg,
            lastReps: opts.neighbor.lastReps,
            crumb: opts.neighbor.crumb,
          })
      + '</div>'
    : '';

  const rootAttrs = attr({
    class: 'ex-circuit-round',
    'data-block-id': block.id || null,
    'data-block-idx': opts.blockIdx != null ? opts.blockIdx : null,
    'data-round': round,
    'data-total-rounds': totalR,
    'data-total-blocks': opts.blockTotal != null ? opts.blockTotal : null,
    role: 'region',
    'aria-label': 'Giro ' + round + ' di ' + totalR,
  });

  return '<section ' + rootAttrs + '>'
    + buildBlockCrumb(block)
    + buildRoundHeader(round, totalR, doneInRound, totalInRound)
    + buildRoundDots(round, totalR)
    + listHtml
    + buildRoundHint(round, totalR, restSec, blockDone)
    + neighborHtml
    + '</section>';
}
