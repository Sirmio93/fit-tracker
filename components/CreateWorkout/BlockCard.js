/* ==========================================================================
   CreateWorkout/BlockCard.js — T1.4 · BlockCard rendering (read-only).

   Rende la lista dei blocchi del giorno selezionato dentro il data-slot
   "blocks" della shell "Crea scheda". Legge da:
     draft.weeks[ui.selectedWeek].days[ui.selectedDay].blocks[]

   In T1.4 il rendering è READ-ONLY: click sulla card / bottone + / menu ⋯
   sono solo punti d'aggancio (data-action) — no handler wired qui, il
   dispatcher di app.js li ignora e non genera errori console.

   Data-action stubs (wired in fasi successive):
     · create-block-open-config   → T1.5 config sheet
     · create-block-add-exercise  → T1.6 picker sheet
     · create-block-menu          → T1.8 menu contestuale

   Regole di conversione mockup:
     · Chip TYPE outline neutro; giallo pieno SOLO per Tabata.
     · Target row: "<b>X</b> reps · <b>Y</b> giri" con `.sep` grigi.
     · Tabata: "<b>20″</b> work · <b>10″</b> rest · <b>8×</b>"
     · Pyramid + repsScale: "<b>12→10→8→6→4</b>" + opzionale "<b>60→100</b> kg"
     · Single non mostra "+ Aggiungi esercizio" (1 solo esercizio).

   Thumbnail: ExerciseIdentity size="mini" — DS discipline (mai <img>
   diretti). La variante `mono` che replicherebbe pixel-perfect la
   silhouette del mockup è documentata come open question in
   verifications/T1.4/DIFF.md (richiede touch a Foundation).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { ExerciseIdentity } from '../Exercise/ExerciseIdentity.js';
import { BLOCK_TYPES_BY_ID } from '../../data/blockTypes.js';
import { renderBlockMenu } from './BlockActions.js';

const FALLBACK_ROUNDS = 3;

/* ---- Helpers puri ------------------------------------------------------- */

function selectedDay(draft, ui) {
  const weeks = (draft && Array.isArray(draft.weeks)) ? draft.weeks : [];
  if (!weeks.length) return null;
  const wIdx = clampIndex(ui && ui.selectedWeek, weeks.length);
  const week = weeks[wIdx];
  const days = (week && Array.isArray(week.days)) ? week.days : [];
  if (!days.length) return null;
  const dIdx = clampIndex(ui && ui.selectedDay, days.length);
  return days[dIdx] || null;
}

function clampIndex(raw, len) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= len) return 0;
  return Math.floor(n);
}

function typeMeta(type) {
  const meta = BLOCK_TYPES_BY_ID[type];
  if (meta) return meta;
  return { id: type || 'Circuit', label: type || 'Circuit' };
}

function fmtSec(sec, suffix) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${n}${suffix || '″'}`;
}

function fmtRest(block) {
  const s = Number(block.restSec);
  if (Number.isFinite(s) && s > 0) {
    // Mockup rule: rispetta la scala del mockup (device A) — secondi <120s,
    // minuti da 120s in su (2′, 2.5′, 3′). Evita di riformattare 60″/90″
    // in decimali (1′/1.5′) che appesantiscono la scan-lettura.
    if (s >= 120 && s % 30 === 0) {
      const min = s / 60;
      const str = Number.isInteger(min) ? String(min) : String(min);
      return `${str}′ rest`;
    }
    return `${s}″ rest`;
  }
  return null;
}

function resolveExercise(exercises, id) {
  const list = Array.isArray(exercises) ? exercises : [];
  const found = list.find(function (e) { return e && e.id === id; });
  if (found) return found;
  return { id: id, name: 'Esercizio rimosso', primary: '' };
}

/* ---- BlockTypeChip (interno) --------------------------------------------
   Chip UPPERCASE con label del tipo. Tabata prende il modifier `--tabata`
   che il CSS colora accent giallo pieno; tutti gli altri restano outline
   neutri. */
function renderBlockTypeChip(type) {
  const meta = typeMeta(type);
  const slug = String(type || '').toLowerCase();
  const cls = 'cw-block-chip cw-block-chip--type cw-block-chip--type-' + esc(slug || 'circuit');
  return `<span class="${cls}" data-block-type="${esc(type || '')}">${esc(meta.label)}</span>`;
}

/* ---- Meta chips (giri / rest / cycles / work-rest) ---------------------- */
function renderMetaChips(block) {
  const type = block.type;
  const chips = [];

  if (type === 'Tabata') {
    const cycles = Number(block.cycles) || typeMeta('Tabata').defaultRounds || 8;
    chips.push(`<span class="cw-block-chip">${esc(String(cycles))} cicli</span>`);
    const work = fmtSec(block.workSec, '″');
    const rest = fmtSec(block.restSec, '″');
    if (work && rest) chips.push(`<span class="cw-block-chip">${esc(work)} / ${esc(rest)}</span>`);
  } else if (type === 'AMRAP') {
    const cap = Number(block.timeCapSec);
    if (Number.isFinite(cap) && cap > 0) {
      const mins = Math.round(cap / 60);
      chips.push(`<span class="cw-block-chip">${esc(String(mins))}′ cap</span>`);
    }
  } else if (type === 'EMOM') {
    const cycles = Number(block.cycles) || typeMeta('EMOM').defaultRounds || 10;
    chips.push(`<span class="cw-block-chip">${esc(String(cycles))} min</span>`);
    const work = fmtSec(block.workSec, '″');
    if (work) chips.push(`<span class="cw-block-chip">${esc(work)} work</span>`);
  } else {
    const rounds = Number(block.rounds) || FALLBACK_ROUNDS;
    const unit = (type === 'Single' || type === 'Pyramid' || type === 'Core') ? 'set' : 'giri';
    chips.push(`<span class="cw-block-chip">${esc(String(rounds))} ${esc(unit)}</span>`);
    const rest = fmtRest(block);
    if (rest) chips.push(`<span class="cw-block-chip">${esc(rest)}</span>`);
  }

  return chips.join('');
}

/* ---- ExerciseRow (interno) ----------------------------------------------
   Riga esercizio: thumb ExerciseIdentity (mini) · nome · target · drag.
   La drag-handle è visiva only qui: T1.8 wired. */
function renderExerciseRow(block, exercise, target) {
  const name = String(exercise.name || 'Esercizio');
  const thumb = ExerciseIdentity({ name: name, size: 'mini', className: 'cw-ex-row__id' });
  const targetHtml = renderTargetLine(block, target);

  return '' +
    '<div class="cw-ex-row" draggable="true" data-block-id="' + esc(block.id) + '" data-exercise-id="' + esc(exercise.id) + '">' +
      '<div class="cw-ex-row__thumb" aria-hidden="true">' + thumb + '</div>' +
      '<div class="cw-ex-row__info">' +
        '<p class="cw-ex-row__name" title="' + esc(name) + '">' + esc(name) + '</p>' +
        targetHtml +
      '</div>' +
      '<span class="cw-ex-row__drag" aria-hidden="true">⋮⋮</span>' +
    '</div>';
}

function renderTargetLine(block, target) {
  const parts = targetParts(block, target || {});
  if (!parts.length) return '';
  const html = parts.map(function (p, i) {
    const cell = '<span><b>' + esc(String(p.value)) + '</b>' + (p.unit ? ' ' + esc(p.unit) : '') + '</span>';
    const sep = i < parts.length - 1 ? '<span class="sep" aria-hidden="true">·</span>' : '';
    return cell + sep;
  }).join('');
  return '<p class="cw-ex-row__target">' + html + '</p>';
}

function targetParts(block, target) {
  const type = block.type;
  const parts = [];

  if (type === 'Tabata') {
    parts.push({ value: (Number(block.workSec) || 20) + '″', unit: 'work' });
    parts.push({ value: (Number(block.restSec) || 10) + '″', unit: 'rest' });
    parts.push({ value: (Number(block.cycles) || 8) + '×', unit: '' });
    return parts;
  }

  if (type === 'Pyramid' && Array.isArray(block.repsScale) && block.repsScale.length) {
    const reps = block.repsScale.map(function (s) { return s && s.reps != null ? String(s.reps) : null; }).filter(Boolean);
    const kgs  = block.repsScale.map(function (s) { return s && s.kg   != null ? String(s.kg)   : null; }).filter(Boolean);
    if (reps.length) parts.push({ value: reps.join('→'), unit: 'reps' });
    if (kgs.length)  parts.push({ value: kgs[0] + '→' + kgs[kgs.length - 1], unit: 'kg' });
    return parts;
  }

  const reps = target && target.reps ? String(target.reps).trim() : '';
  if (reps) parts.push({ value: reps, unit: 'reps' });

  const rounds = Number(block.rounds);
  if (Number.isFinite(rounds) && rounds > 0) {
    const unit = (type === 'Single' || type === 'Core') ? 'set' : 'giri';
    parts.push({ value: String(rounds), unit: unit });
  }

  return parts;
}

/* ---- BlockCard (API interna) -------------------------------------------- */
function renderBlockCard(block, exercises, ui, blockIndex, totalBlocks) {
  const type = block.type || 'Circuit';
  const label = String(block.label || typeMeta(type).label);
  const exerciseIds = Array.isArray(block.exerciseIds) ? block.exerciseIds : [];
  const targets = (block && typeof block.exerciseTargets === 'object' && block.exerciseTargets) || {};

  const rowsHtml = exerciseIds.map(function (id) {
    const ex = resolveExercise(exercises, id);
    const target = targets[id] || {};
    return renderExerciseRow(block, ex, target);
  }).join('');

  const showAddEx = type !== 'Single';
  const addExHtml = showAddEx
    ? '<button type="button" class="cw-add-ex" data-action="create-block-add-exercise" data-block-id="' + esc(block.id) + '">+ Aggiungi esercizio</button>'
    : '';

  const titleBtn = '' +
    '<button type="button" class="cw-block__title-btn" data-action="create-block-open-config" data-block-id="' + esc(block.id) + '" aria-label="Configura blocco ' + esc(label) + '">' +
      '<h3 class="cw-block__title">' + esc(label) + '</h3>' +
      '<div class="cw-block__meta">' +
        renderBlockTypeChip(type) +
        renderMetaChips(block) +
      '</div>' +
    '</button>';

  const menuBtn = '' +
    '<button type="button" class="cw-block__menu" data-action="create-block-menu" data-block-id="' + esc(block.id) + '" aria-label="Menu blocco ' + esc(label) + '" aria-haspopup="menu">' +
      '<span aria-hidden="true">⋯</span>' +
    '</button>';

  var menuPanelHtml = renderBlockMenu(block, ui || {}, blockIndex, totalBlocks);

  return '' +
    '<article class="cw-block" data-block-id="' + esc(block.id) + '" data-block-type="' + esc(type) + '">' +
      '<header class="cw-block__hd">' +
        titleBtn +
        menuBtn +
      '</header>' +
      menuPanelHtml +
      '<div class="cw-ex-list">' +
        rowsHtml +
        addExHtml +
      '</div>' +
    '</article>';
}

/* ---- API pubblica ------------------------------------------------------- */
/**
 * @param {Object} draft         S.editor.draft
 * @param {Array}  exercises     S.exercises (per lookup nome)
 * @param {Object} [ui]          { selectedWeek, selectedDay } — default 0/0
 * @returns {string} HTML string per il data-slot="blocks"
 */
export function renderBlocks(draft, exercises, ui) {
  if (!draft) return '';

  const day = selectedDay(draft, ui);
  const blocks = (day && Array.isArray(day.blocks)) ? day.blocks : [];

  if (blocks.length === 0) {
    return '' +
      '<div class="cw-blocks cw-blocks--empty" data-empty="true">' +
        '<button type="button" class="cw-add-block cw-add-block--empty" data-action="create-block-open-config" aria-label="Aggiungi il primo blocco">' +
          '<b aria-hidden="true">+</b> Nuovo blocco' +
        '</button>' +
      '</div>';
  }

  const cardsHtml = blocks.map(function (b, i) { return renderBlockCard(b, exercises, ui, i, blocks.length); }).join('');
  const addBlock = '' +
    '<button type="button" class="cw-add-block" data-action="create-block-open-config" aria-label="Aggiungi blocco">' +
      '<b aria-hidden="true">+</b> Aggiungi blocco' +
    '</button>';

  return '<div class="cw-blocks">' + cardsHtml + addBlock + '</div>';
}

/* Named exports secondari — utili ai test / consumer avanzati. */
export { renderBlockCard };
