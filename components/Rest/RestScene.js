/* ==========================================================================
   Rest/RestScene.js — Sprint 9.2 (Premium Rest Experience)
   Top-level della schermata di recupero. Compone in un'unica scena:

     Header (WorkoutStickyHeader mode='rest')  — coerente con Sprint 9.1
       ↓
     RestCountdownHero          — ring + countdown + messaggio contestuale
       ↓
     RestNextIdentity           — ExerciseIdentity LG + nome + muscoli + last
       ↓
     RestTimeline               — mini timeline verticale (prev/active/next)
       ↓
     RestActionsV2              — +15s + Salta

   La scena è una vera "Workout Scene", non un semplice overlay: layout in
   flex-column, gradient di sfondo identico al Workout, hairline di progresso
   in header. Rispetta il principio "One Screen".

   TUTTI i dati arrivano già computati dal chiamante (app.js). Nessuna query
   IndexedDB, nessuna dipendenza dal Timer/Session Engine.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { WorkoutStickyHeader } from '../Workout/WorkoutStickyHeader.js';
import { RestCountdownHero } from './RestCountdownHero.js';
import { RestNextIdentity } from './RestNextIdentity.js';
import { RestTimeline } from './RestTimeline.js';
import { RestActionsV2 } from './RestActionsV2.js';

/**
 * @param {Object} opts
 * @param {number} opts.leftSec
 * @param {number} opts.totalSec
 * @param {boolean} [opts.paused]
 * @param {string} [opts.restLabel]              es. "Push A · Serie 2/3"
 * @param {string} [opts.sessionTime='00:00']    tempo di sessione MM:SS (header)
 * @param {number} [opts.sessionProgress=0]      0..100 (hairline header)
 * @param {Object} [opts.next]                   dati per RestNextIdentity
 *   @param {string} [opts.next.eyebrow]
 *   @param {string} [opts.next.name]
 *   @param {string} [opts.next.title]
 *   @param {Object|null} [opts.next.lastPerformance]
 *   @param {string} [opts.next.targetReps]
 * @param {Array}  [opts.timeline]               items per RestTimeline
 */
export function RestScene(opts = {}) {
  const leftSec  = Math.max(0, +opts.leftSec  || 0);
  const totalSec = Math.max(1, +opts.totalSec || 60);
  const paused   = !!opts.paused;
  const restLabel = opts.restLabel || '';
  const sessionTime = opts.sessionTime || '00:00';
  const sessionProgress = Math.max(0, Math.min(100, Number(opts.sessionProgress) || 0));

  const headerHtml = WorkoutStickyHeader({
    mode: 'rest',
    restLabel: 'RECUPERO',
    sessionTime,
    progress: sessionProgress,
    backAction: 'stop-rest',
    menuAction: 'session-open',
  });

  const heroHtml = RestCountdownHero({
    leftSec, totalSec, paused,
    label: restLabel,
  });

  const nextInfo = opts.next || {};
  const nextHtml = RestNextIdentity({
    eyebrow: nextInfo.eyebrow || 'Prossimo esercizio',
    name:    nextInfo.name    || '',
    title:   nextInfo.title,
    lastPerformance: nextInfo.lastPerformance || null,
    targetReps:      nextInfo.targetReps || '',
    fallbackMessage: nextInfo.fallbackMessage || 'Ultimo blocco della sessione',
    animKey: nextInfo.name || nextInfo.title || '',
  });

  const timelineHtml = Array.isArray(opts.timeline) && opts.timeline.length
    ? RestTimeline({ items: opts.timeline })
    : '';

  const actionsHtml = RestActionsV2({});

  const rootAttrs = attr({
    class: 'c-restSceneV2',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Recupero in corso',
    'data-paused': paused ? '1' : '0',
  });

  return `<div ${rootAttrs}>
    ${headerHtml}
    <div class="c-restSceneV2__body">
      <div class="c-restSceneV2__hero">${heroHtml}</div>
      <div class="c-restSceneV2__next">${nextHtml}</div>
      ${timelineHtml ? `<div class="c-restSceneV2__timeline">${timelineHtml}</div>` : ''}
    </div>
    <div class="c-restSceneV2__actions">${actionsHtml}</div>
  </div>`;
}
