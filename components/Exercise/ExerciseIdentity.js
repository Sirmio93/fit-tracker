/* ==========================================================================
   Exercise/ExerciseIdentity.js — Phase 2.3 (Exercise Identity System)
   Il LINGUAGGIO VISIVO UNIFICATO di un esercizio. Ogni schermata dell'app
   che deve rappresentare un esercizio passa attraverso questo componente:
   nessun altro componente istanzia direttamente `<img>`, AnatomyModel,
   né disegna badge di categoria/attrezzatura.

   Ogni esercizio deve essere riconoscibile in meno di un secondo.

   Composizione automatica (deriva tutto dal catalogo tramite il nome):
     · ExerciseVisual  (mannequin anatomico + immagine reale eventuale)
     · Category Badge  (PUSH · PULL · LEGS · CORE · CARRY …)
     · Equipment Badge (BODYWEIGHT · FREE WEIGHT · MACHINE · BAND …)
     · State Indicator (glow per "current", muted per "skipped", …)
     · Completion Indicator (check verde per "completed")

   Stati (status):
     · 'current'   — ring viola pulsante ("questo è l'attivo").
     · 'completed' — check verde in overlay ("fatto").
     · 'upcoming'  — neutro, default.
     · 'skipped'   — muted (l'utente l'ha saltato).
   Alias booleani: isCurrent, isCompleted (parità con ExerciseVisual).

   Sizes:
     · 'mini'  — solo mannequin, nessun badge (Circuit list dense).
     · 'sm'    — mannequin + badge stack (Rest, History, list cards).
     · 'md'    — mannequin + badge stack + titolo interno.
     · 'lg'    — hero premium con orbita (Workout Scene).
     · 'xl'    — dual pane front+back + badges strip (Detail).

   Regola: MAI hardcoded i badge nella UI. Sempre derivati dal catalogo.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';
import { getExerciseAsset } from '../../services/exerciseAssetService.js';
import { ExerciseVisual } from './ExerciseVisual.js';

const SIZES     = new Set(['mini', 'sm', 'md', 'lg', 'xl']);
const STATUSES  = new Set(['current', 'completed', 'upcoming', 'skipped']);

/* Le stesse mappature identità di ExerciseVisual — replicate qui perché
   ExerciseIdentity è l'API pubblica; ExerciseVisual resta primitiva. */
const CATEGORY_BADGE = Object.freeze({
  'push':  'PUSH',
  'pull':  'PULL',
  'squat': 'LEGS',
  'hinge': 'LEGS',
  'lunge': 'LEGS',
  'core':  'CORE',
  'carry': 'CARRY',
});
const EQUIPMENT_BADGE = Object.freeze({
  'bodyweight': 'BODYWEIGHT',
  'barbell':    'FREE WEIGHT',
  'dumbbell':   'FREE WEIGHT',
  'kettlebell': 'FREE WEIGHT',
  'machine':    'MACHINE',
  'cable':      'MACHINE',
  'band':       'BAND',
});

function categoryBadge(cat) { return cat ? (CATEGORY_BADGE[cat] || null) : null; }
function equipmentBadge(eq) { return eq  ? (EQUIPMENT_BADGE[eq] || null) : null; }

function resolveStatus(opts) {
  if (opts.status && STATUSES.has(opts.status)) return opts.status;
  if (opts.isCompleted) return 'completed';
  if (opts.isCurrent)   return 'current';
  return 'upcoming';
}

/**
 * @param {Object} opts
 * @param {string} opts.name                 nome canonico esercizio (asset lookup).
 * @param {'mini'|'sm'|'md'|'lg'|'xl'} [opts.size='md']
 * @param {'current'|'completed'|'upcoming'|'skipped'} [opts.status]
 * @param {boolean}  [opts.isCurrent]        alias → status='current'.
 * @param {boolean}  [opts.isCompleted]      alias → status='completed'.
 * @param {string}   [opts.title]            titolo mostrato (default: name).
 * @param {string[]} [opts.primaryMuscles]   override muscoli primari.
 * @param {string[]} [opts.secondaryMuscles] override muscoli secondari.
 * @param {string}   [opts.category]         override categoria (mai hardcoded UI-side).
 * @param {string}   [opts.equipment]        override attrezzatura.
 * @param {number}   [opts.difficulty]       1..5 (dots — inoltrato a ExerciseVisual).
 * @param {'auto'|'front'|'back'|'both'} [opts.view]  passthrough (xl usa 'both').
 * @param {boolean}  [opts.showBadges=true]  false → suppress dual-badge overlay.
 * @param {boolean}  [opts.showArtwork]      passthrough ExerciseVisual.
 * @param {boolean}  [opts.showTitle]        passthrough ExerciseVisual.
 * @param {string}   [opts.animKey]
 * @param {string}   [opts.ariaLabel]
 * @param {string}   [opts.className]
 * @returns {string} HTML string.
 */
export function ExerciseIdentity(opts = {}) {
  const name = (opts.name || '').trim();
  const size = SIZES.has(opts.size) ? opts.size : 'md';
  const status = resolveStatus(opts);
  const asset = getExerciseAsset(name);

  /* Merge override utente + catalogo. */
  const primary   = Array.isArray(opts.primaryMuscles)   ? opts.primaryMuscles   : (asset.primaryMuscles   || []);
  const secondary = Array.isArray(opts.secondaryMuscles) ? opts.secondaryMuscles : (asset.secondaryMuscles || []);
  const category  = opts.category  != null ? opts.category  : asset.category;
  const equipment = opts.equipment != null ? opts.equipment : asset.equipment;

  const catB = categoryBadge(category);
  const eqB  = equipmentBadge(equipment);

  /* La primitiva visiva. Sopprimiamo il badge singolo di ExerciseVisual:
     l'Identity gestisce lo stack di entrambi (category + equipment) qui.
     Su 'xl' ExerciseVisual disegna già la sua strip: lasciamo che se ne
     occupi lui per non duplicare il layout dual-pane. */
  const suppressVisualBadge = size !== 'xl';
  const visualHtml = ExerciseVisual({
    name,
    size,
    view: opts.view,
    primaryMuscles:   primary,
    secondaryMuscles: secondary,
    category, equipment,
    difficulty: opts.difficulty,
    status,
    title:       opts.title,
    showArtwork: opts.showArtwork,
    showTitle:   opts.showTitle,
    showBadge:   suppressVisualBadge ? false : (opts.showBadges !== false),
    animKey:     opts.animKey,
    ariaLabel:   opts.ariaLabel,
  });

  /* Badge stack (SOLO Identity — mai duplicato). Regole:
     - 'mini' → nessun badge (il thumbnail deve restare leggibile).
     - 'xl'   → ExerciseVisual disegna la sua strip; skip qui.
     - altrimenti → stack verticale in overlay top-left. */
  const badgesAllowed = opts.showBadges !== false && size !== 'mini' && size !== 'xl';
  const badgeChips = [];
  if (badgesAllowed) {
    if (catB) badgeChips.push(`<span class="c-exVisual__badge c-exVisual__badge--category" data-kind="category">${esc(catB)}</span>`);
    if (eqB)  badgeChips.push(`<span class="c-exVisual__badge c-exVisual__badge--equipment" data-kind="equipment">${esc(eqB)}</span>`);
  }
  const badgesHtml = badgeChips.length
    ? `<div class="c-exId__badges" aria-hidden="true">${badgeChips.join('')}</div>`
    : '';

  const rootAttrs = attr({
    class: cx([
      'c-exId',
      `c-exId--${size}`,
      `c-exId--${status}`,
      opts.className,
    ]),
    'data-status': status,
    'data-exercise-slug': asset.slug || '',
  });

  return `<div ${rootAttrs}>${visualHtml}${badgesHtml}</div>`;
}
