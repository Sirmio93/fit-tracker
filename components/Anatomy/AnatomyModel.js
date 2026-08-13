/* ==========================================================================
   Anatomy/AnatomyModel.js
   Manichino anatomico frontale + posteriore. Riceve esclusivamente due
   liste di gruppi muscolari (primari e secondari). Non conosce esercizi,
   ExerciseAsset, business logic o stato applicativo. Riutilizzabile in
   qualsiasi vista come primitiva "dual pane".

   Sprint 8.3 — solo evidenziazione statica, nessuna animazione, gesture,
   tooltip, zoom o rotazione. Phase 2.2 — la geometria (silhouette,
   primitive muscolari, etichette) è stata estratta in ./geometry.js e
   condivisa con ExerciseVisual (single pane con auto front/back).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import {
  MUSCLE_LABELS,
  SILHOUETTE,
  FRONT_MUSCLES,
  BACK_MUSCLES,
  shapeToSvg,
} from './geometry.js';

/* Cache LRU minimale delle stringhe HTML per input (primary,secondary).
   La chiave normalizza gli input (dedupe + sort): due liste equivalenti
   colpiscono la stessa entry. Cap 64 per evitare crescita illimitata. */
const CACHE_MAX = 64;
const cache = new Map();

function normalize(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    if (typeof item === 'string' && item && !out.includes(item)) out.push(item);
  }
  return out.sort();
}

function cacheKey(primary, secondary) {
  return `${primary.join(',')}|${secondary.join(',')}`;
}

function paintGroup(name, shapes, state) {
  const cls = state ? `c-anatomy__muscle is-${state}` : 'c-anatomy__muscle';
  const label = state
    ? ` aria-label="${state === 'primary' ? 'Muscolo primario' : 'Muscolo secondario'}: ${esc(MUSCLE_LABELS[name] || name)}"`
    : ' aria-hidden="true"';
  const prims = shapes.map(shapeToSvg).join('');
  return `<g class="${cls}" data-muscle="${esc(name)}"${label}>${prims}</g>`;
}

function renderView(kind, muscleMap, primary, secondary) {
  const groups = Object.keys(muscleMap).map(m => paintGroup(
    m,
    muscleMap[m],
    primary.includes(m) ? 'primary' : (secondary.includes(m) ? 'secondary' : null),
  )).join('');
  return `<svg class="c-anatomy__svg c-anatomy__svg--${kind}" viewBox="0 0 100 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g class="c-anatomy__silhouette">${SILHOUETTE}</g>
    <g class="c-anatomy__muscles">${groups}</g>
  </svg>`;
}

/**
 * Manichino anatomico frontale + posteriore.
 * @param {Object}   opts
 * @param {string[]} [opts.primaryMuscles]   — slug gruppi muscolari primari.
 * @param {string[]} [opts.secondaryMuscles] — slug gruppi muscolari secondari.
 * @returns {string} HTML string.
 */
export function AnatomyModel(opts = {}) {
  const primary   = normalize(opts.primaryMuscles);
  const secondary = normalize(opts.secondaryMuscles);
  const key = cacheKey(primary, secondary);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const front = renderView('front', FRONT_MUSCLES, primary, secondary);
  const back  = renderView('back',  BACK_MUSCLES,  primary, secondary);
  const html = `<div class="c-anatomy" role="img" aria-label="Muscoli coinvolti">
    <div class="c-anatomy__pane"><div class="c-anatomy__caption">Fronte</div>${front}</div>
    <div class="c-anatomy__pane"><div class="c-anatomy__caption">Retro</div>${back}</div>
  </div>`;

  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, html);
  return html;
}
