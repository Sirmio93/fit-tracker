/* ==========================================================================
   Workout/ExerciseHero.js — Phase 2.3 (Exercise Identity System)
   Hero premium dell'esercizio in corso. Punto focale della Workout Screen:
   identità visiva + nome + muscoli principali + serie/round attivo + progress
   bar sessione. Layout verticale (media sopra, info sotto).

   Phase 2.3 — la parte visiva è delegata a ExerciseIdentity (size='lg'):
   mannequin + eventuale artwork + badge categoria/attrezzatura + ring
   'current'. Questo componente non istanzia più `<img>` né AnatomyModel
   direttamente: la regola vale in tutta l'app.
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
 * Hero esercizio della Workout Screen (single-exercise focus).
 * @param {Object}  opts
 * @param {string}  opts.name              nome canonico esercizio (per asset lookup).
 * @param {string}  [opts.title]           titolo mostrato (default: name).
 * @param {string}  [opts.eyebrow]         breadcrumb sopra il titolo (es. "Blocco 2/5").
 * @param {string}  [opts.targetLabel]     chip target (es. "Target 8-10 reps").
 * @param {string}  [opts.equipmentLabel]  override attrezzatura.
 * @param {string[]}[opts.muscleSlugs]     override muscoli primari (max 3 mostrati).
 * @param {Object|null} [opts.lastPerformance] { kg:number, reps:number|string }
 * @param {Object|null} [opts.setInfo]     { setNo, totalSets, roundNo?, totalRounds?, setLabel? }
 *                                         Chip "Serie X/Y" (+ "Giro X/Y" opzionale).
 * @param {Object|null} [opts.sessionProgress] { pct:number, done:number, total:number }
 *                                         Progress bar sessione dentro l'hero.
 * @param {string}  [opts.animKey]         chiave stabile per rigenerare animazione fade+slide
 *                                         quando cambia esercizio (es. blockIdx+exId).
 * @param {boolean} [opts.showAnatomy=true]
 */
export function ExerciseHero(opts = {}) {
  const name = (opts.name || '').trim();
  const asset = getExerciseAsset(name);
  const isFallback = !asset.slug;
  const title = opts.title || name || 'Esercizio';
  const eyebrow = opts.eyebrow || '';

  const equipmentLabel = opts.equipmentLabel != null
    ? opts.equipmentLabel
    : (isFallback ? '' : labelEquipment(asset.equipment));

  const muscleSlugs = Array.isArray(opts.muscleSlugs)
    ? opts.muscleSlugs
    : (asset.primaryMuscles || []);
  const muscleLabels = muscleSlugs.slice(0, 3).map(labelMuscle).filter(Boolean);

  const eyebrowHtml = eyebrow
    ? `<div class="c-exerciseHeroFocus__eyebrow">${esc(eyebrow)}</div>`
    : '';

  const equipmentHtml = equipmentLabel
    ? `<span class="c-exerciseHeroFocus__equipment">${esc(equipmentLabel)}</span>`
    : '';

  const targetHtml = opts.targetLabel
    ? `<span class="c-exerciseHeroFocus__target">${esc(opts.targetLabel)}</span>`
    : '';

  const musclesHtml = muscleLabels.length
    ? `<div class="c-exerciseHeroFocus__musclesRow">
         <span class="c-exerciseHeroFocus__musclesLabel">Muscoli principali</span>
         <span class="c-exerciseHeroFocus__musclesList">${
           muscleLabels.map(m => esc(m)).join(' • ')
         }</span>
       </div>`
    : '';

  /* Phase 2.3 — l'identità visiva è delegata a ExerciseIdentity: mannequin
     + eventuale artwork + badge (categoria + attrezzatura) + ring 'current'.
     Nessun AnatomyModel diretto qui. */
  const identityHtml = ExerciseIdentity({
    name,
    size: 'lg',
    status: 'current',
    primaryMuscles:   asset.primaryMuscles,
    secondaryMuscles: asset.secondaryMuscles,
    category:         asset.category,
    equipment:        asset.equipment,
    showArtwork:      opts.showAnatomy !== false,
    animKey:          opts.animKey,
    ariaLabel:        `Illustrazione ${name || 'esercizio'}`,
  });

  const perf = opts.lastPerformance;
  const hasPerf = perf && Number(perf.kg) > 0;
  const perfHtml = hasPerf
    ? `<div class="c-exerciseHeroFocus__perf">
         <span class="c-exerciseHeroFocus__perfLabel">Ultima volta</span>
         <span class="c-exerciseHeroFocus__perfValue">
           <b>${esc(perf.kg)}</b> kg × <b>${esc(perf.reps != null ? perf.reps : '—')}</b>
         </span>
       </div>`
    : `<div class="c-exerciseHeroFocus__perf c-exerciseHeroFocus__perf--empty">
         <span class="c-exerciseHeroFocus__perfLabel">Ultima volta</span>
         <span class="c-exerciseHeroFocus__perfValue">Nessun dato precedente</span>
       </div>`;

  const setInfo = opts.setInfo || null;
  const setChipsHtml = setInfo
    ? `<div class="c-exerciseHeroFocus__setInfo" role="group" aria-label="Serie in corso">
         <span class="c-exerciseHeroFocus__setChip c-exerciseHeroFocus__setChip--primary">
           <span class="c-exerciseHeroFocus__setChipLabel">${esc(setInfo.setLabel || 'Serie')}</span>
           <span class="c-exerciseHeroFocus__setChipValue">${esc(setInfo.setNo)}<i>/</i>${esc(setInfo.totalSets)}</span>
         </span>
         ${setInfo.roundNo != null && setInfo.totalRounds != null
           ? `<span class="c-exerciseHeroFocus__setChip">
                <span class="c-exerciseHeroFocus__setChipLabel">Giro</span>
                <span class="c-exerciseHeroFocus__setChipValue">${esc(setInfo.roundNo)}<i>/</i>${esc(setInfo.totalRounds)}</span>
              </span>`
           : ''}
       </div>`
    : '';

  const sp = opts.sessionProgress || null;
  const spHtml = sp && sp.total > 0
    ? (function () {
        var pct = Math.max(0, Math.min(100, Math.round(Number(sp.pct) || 0)));
        return `<div class="c-exerciseHeroFocus__progress" role="progressbar"
                     aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
                     aria-label="Progresso sessione">
                  <div class="c-exerciseHeroFocus__progressHead">
                    <span class="c-exerciseHeroFocus__progressLabel">Sessione</span>
                    <span class="c-exerciseHeroFocus__progressValue">${esc(sp.done)} / ${esc(sp.total)} serie</span>
                  </div>
                  <div class="c-exerciseHeroFocus__progressTrack" aria-hidden="true">
                    <div class="c-exerciseHeroFocus__progressFill" style="width:${pct}%"></div>
                  </div>
                </div>`;
      })()
    : '';

  const cls = cx(['c-exerciseHeroFocus', isFallback ? 'c-exerciseHeroFocus--fallback' : '']);

  const rootAttrs = { class: cls, 'aria-label': 'Esercizio in corso' };
  if (opts.animKey != null) rootAttrs['data-anim-key'] = String(opts.animKey);

  return `<section ${attr(rootAttrs)}>
    <div class="c-exerciseHeroFocus__media${isFallback ? ' c-exerciseHeroFocus__media--placeholder' : ''}">
      ${identityHtml}
    </div>
    <div class="c-exerciseHeroFocus__body">
      ${eyebrowHtml}
      <h2 class="c-exerciseHeroFocus__title">${esc(title)}</h2>
      ${musclesHtml}
      ${equipmentHtml || targetHtml
        ? `<div class="c-exerciseHeroFocus__meta">${equipmentHtml}${targetHtml}</div>`
        : ''
      }
      ${setChipsHtml}
      ${spHtml}
      ${perfHtml}
    </div>
  </section>`;
}
