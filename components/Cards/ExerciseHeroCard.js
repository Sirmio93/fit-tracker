/* ==========================================================================
   Cards/ExerciseHeroCard.js — Sprint 8.6
   Card visuale esercizio riprogettata: thumbnail + nome + muscoli +
   target reps + badge circuito + indicatori completamento (pips per set).

   Layout: mobile riga [thumb][info], desktop stessa impostazione con
   thumbnail più grande e più respiro. La variante attiva è evidenziata
   via bordo accent + glow + sfondo differente.

   Tutti i dati provengono da ExerciseAssetService (immagine, muscoli,
   equipment). Nessuna logica di allenamento: la card è UI-only e riceve
   dal chiamante gli indicatori dello stato (sets[], active, ecc.).
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';
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

const EQUIPMENT_LABELS = Object.freeze({
  'barbell':    'Bilanciere',
  'dumbbell':   'Manubri',
  'cable':      'Cavo',
  'machine':    'Macchina',
  'bodyweight': 'Corpo libero',
  'band':       'Elastico',
  'kettlebell': 'Kettlebell',
  'other':      'Attrezzatura varia',
});

function labelMuscle(slug)    { return MUSCLE_LABELS[slug]    || ''; }
function labelEquipment(slug) { return EQUIPMENT_LABELS[slug] || ''; }

/**
 * Hero card per un esercizio.
 * @param {Object}   opts
 * @param {string}   opts.name         — nome esercizio (es. "Bench Press").
 * @param {string}   [opts.extra]      — HTML string mostrato sotto la hero (es. set rows).
 * @param {string}   [opts.ariaLabel]
 * @param {Object}   [opts.dataset]
 * @param {string}   [opts.targetReps] — es. "8-10" (mostrato come chip).
 * @param {string}   [opts.circuitBadge] — es. "Circuit", "Superset", "Core".
 * @param {boolean}  [opts.active]     — true → variante evidenziata (bordo/glow).
 * @param {Array<{done?:boolean, partial?:boolean}>} [opts.sets] — pip per ogni set.
 */
export function ExerciseHeroCard(opts = {}) {
  const name  = opts.name || '';
  const asset = getExerciseAsset(name);
  const isFallback = !asset.slug;

  const equipmentLabel = !isFallback ? labelEquipment(asset.equipment) : '';
  const musclesLabels  = !isFallback
    ? (asset.primaryMuscles || []).slice(0, 3).map(labelMuscle).filter(Boolean)
    : [];

  const title = `<h3 class="c-exerciseHero__title">${esc(name)}</h3>`;

  const musclesHtml = musclesLabels.length
    ? `<div class="c-exerciseHero__muscles">
         <span class="c-exerciseHero__musclesLabel">Muscoli principali</span>
         <span class="c-exerciseHero__musclesList">${esc(musclesLabels.join(' • '))}</span>
       </div>`
    : (equipmentLabel
        ? `<div class="c-exerciseHero__muscles"><span class="c-exerciseHero__musclesLabel">Attrezzatura</span>
             <span class="c-exerciseHero__musclesList">${esc(equipmentLabel)}</span></div>`
        : '');

  const chipsParts = [];
  if (opts.targetReps) {
    chipsParts.push(`<span class="c-exerciseHero__chip c-exerciseHero__chip--target">
        <span class="c-exerciseHero__chipLabel">Target</span>
        <span class="c-exerciseHero__chipValue">${esc(opts.targetReps)} reps</span>
      </span>`);
  }
  if (opts.circuitBadge) {
    chipsParts.push(`<span class="c-exerciseHero__chip c-exerciseHero__chip--circuit">${esc(opts.circuitBadge)}</span>`);
  }
  const chipsHtml = chipsParts.length
    ? `<div class="c-exerciseHero__chips">${chipsParts.join('')}</div>`
    : '';

  const sets = Array.isArray(opts.sets) ? opts.sets : [];
  const doneCount = sets.filter(s => s && s.done).length;
  const pipsHtml = sets.length
    ? `<div class="c-exerciseHero__pips" role="group" aria-label="Progresso serie: ${doneCount} di ${sets.length} completate">
         ${sets.map((s, i) => {
           const state = s && s.done ? 'is-done' : (s && s.partial ? 'is-partial' : 'is-pending');
           return `<span class="c-exerciseHero__pip ${state}" aria-hidden="true" title="Serie ${i + 1}"></span>`;
         }).join('')}
         <span class="c-exerciseHero__pipsCount">${doneCount}/${sets.length}</span>
       </div>`
    : '';

  /* Phase 2.3 — la card circuito parla via ExerciseIdentity: mannequin
     sempre visibile (mini/sm), badge auto (categoria + attrezzatura), stato
     derivato da active/completo. Niente `<img>`/AnatomyModel/badge diretti. */
  const setsCount = sets.length;
  const isComplete = setsCount > 0 && doneCount === setsCount;
  const identityStatus = isComplete ? 'completed' : (opts.active ? 'current' : 'upcoming');
  const media = `<div class="c-exerciseHero__media">${ExerciseIdentity({
    name,
    size: 'sm',
    status: identityStatus,
    primaryMuscles:   asset.primaryMuscles,
    secondaryMuscles: asset.secondaryMuscles,
    category:         asset.category,
    equipment:        asset.equipment,
  })}</div>`;

  const info = `<div class="c-exerciseHero__info">
    ${title}
    ${musclesHtml}
    ${chipsHtml}
  </div>`;

  const cls = cx([
    'c-card',
    'c-card--exerciseHero',
    opts.active ? 'c-card--exerciseHero--active' : '',
    doneCount > 0 && doneCount === sets.length ? 'c-card--exerciseHero--complete' : '',
  ]);
  const attrs = {
    class: cls,
    'aria-label': opts.ariaLabel || null,
  };
  if (opts.active) attrs['data-active'] = '1';
  if (opts.dataset) {
    for (const k of Object.keys(opts.dataset)) attrs[`data-${k}`] = opts.dataset[k];
  }

  const extra = opts.extra || '';

  return `<article ${attr(attrs)}>
    <div class="c-exerciseHero__row">
      ${media}
      ${info}
    </div>
    ${pipsHtml}
    ${extra}
  </article>`;
}
