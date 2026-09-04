/* ==========================================================================
   Exercise/ExerciseVisual.js — Phase 2.3 (Exercise Identity)
   Il componente standard per rappresentare visivamente un esercizio in
   tutta l'app. Non è solo un'immagine: è l'identità completa dell'esercizio
   (mannequin + badge categoria/equipment + stato + difficoltà).

   Regola d'oro: nessuna schermata deve applicare logica visiva a un
   esercizio. Passa i dati (name, category, equipment, difficulty, status)
   e questo componente decide il layout in base alla size.

   Fallback deterministico, senza box vuoti né placeholder grigi:
     1. Mannequin (silhouette + muscoli evidenziati) SEMPRE come base.
     2. Se lo slug è mappato e `showArtwork !== false`, immagine reale
        sovrapposta. Se `onerror` / dimensioni ridicole → autohide.
     3. Nessun muscolo → silhouette neutra, mai un contenitore vuoto.

   Dimensioni (size) e chrome:
     · 'mini' (48px)   — solo mannequin (+ check/opacity per stato).
     · 'sm'   (~88px)  — mannequin + 1 badge.
     · 'md'   (~200px) — mannequin + badge + titolo interno + diff dots.
     · 'lg'   (~320px) — hero premium (orbita + ring) + badge.
     · 'xl'             — dual pane front+back + badges strip.

   Vista (view):
     · 'auto' — sceglie fronte/retro dai muscoli primari.
     · 'front' | 'back' — forza la vista.
     · 'both' — dual pane (== size='xl').

   Stato (status):
     · 'current'   — anello viola pulsante (identifica l'esercizio attivo).
     · 'completed' — check verde in overlay, tint leggero.
     · 'skipped'   — muted (l'utente ha saltato: distinto da locked).
     · 'locked'    — opacità ridotta, non interattivo.
     · 'upcoming'  — nessun trattamento (default).
   Alias booleani supportati: isCurrent → 'current', isCompleted → 'completed'.
   ========================================================================== */

import { esc, cx, attr, clamp } from '../Shared/helpers.js';
import { getExerciseAsset } from '../../services/exerciseAssetService.js';

const SIZES = new Set(['mini', 'sm', 'md', 'lg', 'xl']);
const STATUSES = new Set(['current', 'completed', 'skipped', 'locked', 'upcoming']);

/* Categorie di movimento → label sintetica riconoscibile a distanza.
   Squat/hinge/lunge collassano in 'LEGS' per parlare all'utente in
   termini di gruppo muscolare, non di pattern tecnico. 'isolation'
   non è identità visiva: si delega all'equipment badge. */
const CATEGORY_BADGE = Object.freeze({
  'push':      'PUSH',
  'pull':      'PULL',
  'squat':     'LEGS',
  'hinge':     'LEGS',
  'lunge':     'LEGS',
  'core':      'CORE',
  'carry':     'CARRY',
});

/* Equipment → label sintetica. Cable/machine → MACHINE (stessa "modalità"
   di esecuzione per l'utente). Barbell/dumbbell/kettlebell → FREE WEIGHT. */
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

/* Preferisci sempre la categoria (identità di movimento); ripiega
   sull'equipment quando la categoria non è espressiva (es. isolation). */
function pickBadge(category, equipment) {
  return categoryBadge(category) || equipmentBadge(equipment);
}

function resolveStatus(opts) {
  if (opts.status && STATUSES.has(opts.status)) return opts.status;
  if (opts.isCompleted) return 'completed';
  if (opts.isCurrent)   return 'current';
  return 'upcoming';
}

function renderInitials(name) {
  const initials = (name || '').trim().split(/\s+/).slice(0, 2)
    .map(w => (w[0] || '').toUpperCase()).join('') || '?';
  return `<div class="c-exVisual__initialsWrap" aria-hidden="true"><span class="c-exVisual__initialsText">${esc(initials)}</span></div>`;
}

/* SVG inline checkmark (24x24). Compatto, senza dipendenze da icon set. */
const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderDifficultyDots(difficulty) {
  const n = clamp(Math.round(Number(difficulty)), 1, 5);
  const dots = Array.from({ length: 5 }, (_, i) =>
    `<span class="c-exVisual__diffDot${i < n ? ' is-on' : ''}"></span>`
  ).join('');
  return `<span class="c-exVisual__diffDots" aria-label="Difficoltà ${n} su 5">${dots}</span>`;
}

/**
 * @param {Object}   opts
 * @param {string}   opts.name              nome canonico esercizio (asset lookup).
 * @param {'mini'|'sm'|'md'|'lg'|'xl'} [opts.size='md']
 * @param {'auto'|'front'|'back'|'both'} [opts.view='auto']
 * @param {string[]} [opts.primaryMuscles]   override muscoli primari.
 * @param {string[]} [opts.secondaryMuscles] override muscoli secondari.
 * @param {string}   [opts.category]         override asset.category.
 * @param {string}   [opts.equipment]        override asset.equipment.
 * @param {number}   [opts.difficulty]       1..5 (dots — mostrati su md/xl).
 * @param {'current'|'completed'|'locked'|'upcoming'} [opts.status]
 * @param {boolean}  [opts.isCurrent]        alias → status='current'.
 * @param {boolean}  [opts.isCompleted]      alias → status='completed'.
 * @param {string}   [opts.title]            titolo interno (usato su md).
 * @param {boolean}  [opts.showArtwork=true] false → skip immagine reale
 *                                           (mini/xl la forzano off).
 * @param {boolean}  [opts.showBadge=true]   false → suppress badge.
 * @param {boolean}  [opts.showTitle]        override display del titolo (md).
 * @param {string}   [opts.animKey]          re-trigger animazione.
 * @param {string}   [opts.ariaLabel]
 * @param {string}   [opts.className]
 * @returns {string} HTML string.
 */
export function ExerciseVisual(opts = {}) {
  const name = (opts.name || '').trim();
  const size = SIZES.has(opts.size) ? opts.size : 'md';
  const asset = getExerciseAsset(name);

  const category  = opts.category  != null ? opts.category  : asset.category;
  const equipment = opts.equipment != null ? opts.equipment : asset.equipment;

  const status = resolveStatus(opts);
  const badgeAllowed = opts.showBadge !== false && size !== 'mini';
  const badge = badgeAllowed ? pickBadge(category, equipment) : null;

  const ariaLabelBase = name ? `Illustrazione ${name}` : 'Illustrazione esercizio';
  const ariaLabel = opts.ariaLabel || ariaLabelBase;

  /* Overlay comuni (indipendenti da view/size specifico). */
  const ringHtml  = status === 'current' ? `<span class="c-exVisual__ring" aria-hidden="true"></span>` : '';
  const checkHtml = status === 'completed'
    ? `<span class="c-exVisual__check" aria-label="Completato">${CHECK_SVG}</span>`
    : '';

  const rootAttrs = (extra = {}) => {
    const cls = cx([
      'c-exVisual',
      `c-exVisual--${size}`,
      `c-exVisual--${status}`,
      extra.mannequinOnly ? 'c-exVisual--mannequinOnly' : '',
      opts.className,
    ]);
    const a = {
      class: cls,
      role: 'img',
      'aria-label': ariaLabel,
      'data-status': status,
    };
    if (opts.animKey != null) a['data-anim-key'] = String(opts.animKey);
    if (badge) a['data-badge'] = badge;
    return attr(a);
  };

  /* xl / view='both' → badges strip + iniziali. */
  if (size === 'xl' || opts.view === 'both') {
    const badges = [];
    const catB = categoryBadge(category);
    const eqB  = equipmentBadge(equipment);
    if (catB) badges.push(`<span class="c-exVisual__badge c-exVisual__badge--category">${esc(catB)}</span>`);
    if (eqB)  badges.push(`<span class="c-exVisual__badge c-exVisual__badge--equipment">${esc(eqB)}</span>`);
    const badgesHtml = (opts.showBadge !== false && badges.length)
      ? `<div class="c-exVisual__badges">${badges.join('')}</div>`
      : '';
    const diffHtml = (Number(opts.difficulty) > 0) ? renderDifficultyDots(opts.difficulty) : '';
    return `<div ${rootAttrs({ mannequinOnly: true })}>
      <div class="c-exVisual__anatomy c-exVisual__initialsWrap c-exVisual__initialsWrap--xl"><span class="c-exVisual__initialsText" aria-hidden="true">${esc((name || '').trim().split(/\s+/).slice(0, 2).map(w => (w[0] || '').toUpperCase()).join('') || '?')}</span></div>
      ${badgesHtml}
      ${diffHtml}
      ${ringHtml}
      ${checkHtml}
    </div>`;
  }

  const mannequinHtml = renderInitials(name);

  const badgeHtml = badge
    ? `<span class="c-exVisual__badge c-exVisual__badge--${categoryBadge(category) ? 'category' : 'equipment'}">${esc(badge)}</span>`
    : '';

  /* Titolo interno: mostrato di default su md (chrome pieno). Su altre
     size solo se richiesto esplicitamente. */
  const showTitleDefault = size === 'md';
  const wantsTitle = opts.showTitle != null ? !!opts.showTitle : showTitleDefault;
  const titleText = opts.title != null ? opts.title : name;
  const titleHtml = (wantsTitle && titleText)
    ? `<h4 class="c-exVisual__title">${esc(titleText)}</h4>`
    : '';

  /* Difficulty dots — utili su md/xl. Su altre size solo se richieste
     e finché non introducono rumore visivo. */
  const diffAllowed = size === 'md';
  const diffHtml = (diffAllowed && Number(opts.difficulty) > 0)
    ? renderDifficultyDots(opts.difficulty)
    : '';

  return `<div ${rootAttrs({ mannequinOnly: true })}>
    <div class="c-exVisual__frame">
      <div class="c-exVisual__mannequin">${mannequinHtml}</div>
      ${badgeHtml}
      ${ringHtml}
    </div>
    ${checkHtml}
    ${titleHtml}
    ${diffHtml}
  </div>`;
}
