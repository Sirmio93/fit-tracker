/* ==========================================================================
   Workout/ExerciseStage.js — Phase 2.3 (Exercise Identity System)
   Hero fuso della Workout Screen. Un unico blocco visivo composto — in
   ordine di lettura — da:

     1. ExerciseIdentity (size='lg', dominante — mannequin + dual badge + glow)
     2. Titolo esercizio (all-caps hero)
     3. Muscoli target (eyebrow chip)
     4. Ultima esecuzione (riga discreta)

   Nessuna card, nessun bordo, nessun contenitore visibile: la scena è una
   dashboard, non un form. Il titolo appartiene all'artwork, non alla topbar.

   Phase 2.3 — la scena passa per ExerciseIdentity, mai per ExerciseVisual
   diretto: badge di categoria/attrezzatura sono sempre coerenti in tutta
   l'app senza doverli hardcodare qui.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { ExerciseIdentity } from '../Exercise/ExerciseIdentity.js';
import { getExerciseAsset } from '../../services/exerciseAssetService.js';

/* Etichette italiane per i muscoli slug interni (subset più usato). */
const MUSCLE_LABELS = Object.freeze({
  'chest':        'Pettorale',
  'front-delts':  'Deltoide ant.',
  'side-delts':   'Deltoide lat.',
  'rear-delts':   'Deltoide post.',
  'biceps':       'Bicipite',
  'triceps':      'Tricipite',
  'forearms':     'Avambraccio',
  'core':         'Core',
  'upper-back':   'Dorsali alti',
  'lats':         'Gran dorsale',
  'lower-back':   'Lombari',
  'quads':        'Quadricipite',
  'adductors':    'Adduttori',
  'hamstrings':   'Femorali',
  'glutes':       'Glutei',
  'calves':       'Polpacci',
});
function labelMuscle(slug) { return MUSCLE_LABELS[slug] || slug; }

function fmtLastPerf(perf) {
  if (!perf || !(Number(perf.kg) > 0)) return '';
  const kg = Number(perf.kg);
  const reps = perf.reps != null && perf.reps !== '—' ? perf.reps : '—';
  const kgStr = Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(/\.0$/, '');
  return `<span class="c-exStage__lastLabel">Ultima volta</span>` +
         `<span class="c-exStage__lastValue"><b>${esc(kgStr)} kg</b> × <b>${esc(reps)} rip</b></span>`;
}

/**
 * @param {Object} opts
 * @param {string}   opts.name              nome canonico (asset lookup).
 * @param {string}   [opts.title]           override titolo mostrato.
 * @param {string}   [opts.subtitle]        sottotitolo sentence-case (es. "Panca orizzontale"). Se assente/vuoto → il nodo NON viene renderizzato. Nessun fallback derivato.
 * @param {string[]} [opts.primaryMuscles]  slug muscoli primari.
 * @param {string[]} [opts.secondaryMuscles] slug muscoli secondari.
 * @param {string}   [opts.musclesLabel]    override testuale della riga muscoli.
 * @param {Object|null} [opts.lastPerformance] { kg:number, reps:number|string }
 * @param {string}   [opts.animKey]         forwarded a ExerciseVisual.
 */
export function ExerciseStage(opts = {}) {
  const name  = (opts.name || '').trim();
  const title = (opts.title || name || 'Esercizio').toUpperCase();
  const subtitle = (opts.subtitle != null ? String(opts.subtitle) : '').trim();
  const asset = getExerciseAsset(name);

  const primary   = Array.isArray(opts.primaryMuscles)   ? opts.primaryMuscles   : (asset.primaryMuscles   || []);
  const secondary = Array.isArray(opts.secondaryMuscles) ? opts.secondaryMuscles : (asset.secondaryMuscles || []);

  const musclesLabel = opts.musclesLabel != null
    ? opts.musclesLabel
    : (primary.length
        ? primary.slice(0, 3).map(labelMuscle).join(' <em>·</em> ')
        : '');

  const visualHtml = ExerciseIdentity({
    name,
    size: 'lg',
    status: 'current', /* la scena Workout mostra sempre l'esercizio attivo */
    primaryMuscles:   primary,
    secondaryMuscles: secondary,
    category:         asset.category,
    equipment:        asset.equipment,
    animKey:          opts.animKey,
    ariaLabel:        `Illustrazione ${name || 'esercizio'}`,
  });

  const lastHtml = fmtLastPerf(opts.lastPerformance);

  return `<section ${attr({ class: 'c-exStage', 'aria-label': 'Esercizio in corso' })}>
    <h1 class="c-exStage__title">${esc(title)}</h1>
    ${subtitle ? `<p class="c-exStage__subtitle">${esc(subtitle)}</p>` : ''}
    <div class="c-exStage__artwork">${visualHtml}</div>
    ${musclesLabel ? `<p class="c-exStage__muscles">${musclesLabel}</p>` : ''}
    ${lastHtml
      ? `<p class="c-exStage__last">${lastHtml}</p>`
      : `<p class="c-exStage__last c-exStage__last--empty">Nessun dato precedente</p>`}
  </section>`;
}
