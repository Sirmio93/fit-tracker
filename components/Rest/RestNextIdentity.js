/* ==========================================================================
   Rest/RestNextIdentity.js — Sprint 9.2 (Premium Rest Experience)
   Presenta il prossimo esercizio con lo stesso linguaggio visivo del Workout:

     · ExerciseIdentity (size='lg', status='upcoming')     — manichino + badge
     · Nome esercizio (heading)
     · Muscoli principali (line — max 3, · separator)
     · Ultima esecuzione: "12 rep × 34 kg"  (o "Nessun dato precedente")
     · Target: es. "10-12 rep"              (se disponibile)

   MAI immagini dirette, MAI AnatomyModel diretto. Sempre ExerciseIdentity.
   Se `name` è vuoto (fine sessione) mostra un placeholder minimale.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { getExerciseAsset } from '../../services/exerciseAssetService.js';
import { ExerciseIdentity } from '../Exercise/ExerciseIdentity.js';

const MUSCLE_LABELS = Object.freeze({
  'chest':        'Petto',
  'upper-back':   'Dorso alto',
  'lats':         'Dorsali',
  'lower-back':   'Lombari',
  'front-delts':  'Deltoide anteriore',
  'side-delts':   'Deltoide laterale',
  'rear-delts':   'Deltoide posteriore',
  'biceps':       'Bicipiti',
  'triceps':      'Tricipiti',
  'forearms':     'Avambracci',
  'core':         'Core',
  'quads':        'Quadricipiti',
  'hamstrings':   'Femorali',
  'glutes':       'Glutei',
  'calves':       'Polpacci',
  'adductors':    'Adduttori',
  'abductors':    'Abduttori',
});
function labelMuscle(slug) { return MUSCLE_LABELS[slug] || ''; }

/**
 * @param {Object} opts
 * @param {string} [opts.eyebrow='Prossimo esercizio']
 * @param {string} [opts.name]                nome canonico (asset lookup + Identity)
 * @param {string} [opts.title]               titolo mostrato (default: name)
 * @param {string[]} [opts.muscleSlugs]       override muscoli (default: primaryMuscles del catalogo)
 * @param {Object|null} [opts.lastPerformance] { kg:number, reps:number|string }
 * @param {string} [opts.targetReps]          es. "10-12" — target dello schema (opzionale)
 * @param {string} [opts.fallbackMessage]     testo mostrato se `name` è vuoto
 * @param {string} [opts.animKey]             passthrough Identity per crossfade
 */
export function RestNextIdentity(opts = {}) {
  const eyebrow = opts.eyebrow || 'Prossimo esercizio';
  const name    = (opts.name || '').trim();

  if (!name) {
    return `<section class="c-restNextIdentity c-restNextIdentity--empty">
      <span class="c-restNextIdentity__eyebrow">${esc(eyebrow)}</span>
      <p class="c-restNextIdentity__emptyText">${esc(opts.fallbackMessage || 'Ultimo blocco della sessione')}</p>
    </section>`;
  }

  const asset = getExerciseAsset(name);
  const title = opts.title || name;

  const muscleSlugs = Array.isArray(opts.muscleSlugs)
    ? opts.muscleSlugs
    : (asset.primaryMuscles || []);
  const muscleLabels = muscleSlugs.slice(0, 3).map(labelMuscle).filter(Boolean);

  const identityHtml = ExerciseIdentity({
    name,
    size: 'lg',
    status: 'upcoming',
    primaryMuscles:   asset.primaryMuscles,
    secondaryMuscles: asset.secondaryMuscles,
    category:         asset.category,
    equipment:        asset.equipment,
    animKey:          opts.animKey || name,
  });

  const musclesHtml = muscleLabels.length
    ? `<p class="c-restNextIdentity__muscles">${muscleLabels.map(esc).join(' <em>·</em> ')}</p>`
    : '';

  const perf = opts.lastPerformance;
  const hasPerf = perf && Number(perf.kg) > 0;
  const perfInner = hasPerf
    ? `<span><b>${esc(perf.reps != null ? perf.reps : '—')}</b> rep <em>×</em> <b>${esc(perf.kg)}</b> kg</span>`
    : `<span class="c-restNextIdentity__perfEmpty">Nessun dato precedente</span>`;

  const targetHtml = opts.targetReps
    ? `<div class="c-restNextIdentity__meta c-restNextIdentity__meta--target">
         <span class="c-restNextIdentity__metaLabel">Target</span>
         <span class="c-restNextIdentity__metaValue">${esc(opts.targetReps)} rep</span>
       </div>`
    : '';

  return `<section class="c-restNextIdentity" data-anim-key="${esc(opts.animKey || name)}">
    <span class="c-restNextIdentity__eyebrow">${esc(eyebrow)}</span>
    <div class="c-restNextIdentity__identity">${identityHtml}</div>
    <h2 class="c-restNextIdentity__title">${esc(title)}</h2>
    ${musclesHtml}
    <div class="c-restNextIdentity__stats">
      <div class="c-restNextIdentity__meta c-restNextIdentity__meta--last">
        <span class="c-restNextIdentity__metaLabel">Ultima volta</span>
        <span class="c-restNextIdentity__metaValue">${perfInner}</span>
      </div>
      ${targetHtml}
    </div>
  </section>`;
}
