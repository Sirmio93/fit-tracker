/* ==========================================================================
   data/exerciseAssets.js
   Mappa statica degli asset esercizio. Indicizzata per slug canonico
   (vedi utils/exerciseSlug.js). Ogni voce descrive: immagine, muscoli
   primari/secondari, categoria (movement pattern), attrezzatura.

   Sprint 8.1 — solo dati, nessuna logica. L'app NON deve importare
   direttamente questo file: passa sempre da services/exerciseAssetService.js.

   Tassonomia (interna, stabile):
     primary/secondary muscles: chest, upper-back, lats, lower-back,
       front-delts, side-delts, rear-delts, biceps, triceps, forearms,
       core, quads, hamstrings, glutes, calves, adductors, abductors
     category (movement pattern): push, pull, squat, hinge, lunge,
       carry, core, isolation
     equipment: barbell, dumbbell, cable, machine, bodyweight, band,
       kettlebell, other
   ========================================================================== */

const IMG = './assets/exercises';

export const EXERCISE_ASSETS = Object.freeze({
  'bench-press': {
    slug: 'bench-press',
    image: `${IMG}/bench-press.webp`,
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front-delts'],
    category: 'push',
    equipment: 'barbell',
  },
  'squat': {
    slug: 'squat',
    image: `${IMG}/squat.webp`,
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    category: 'squat',
    equipment: 'barbell',
  },
  'deadlift': {
    slug: 'deadlift',
    image: `${IMG}/deadlift.webp`,
    primaryMuscles: ['hamstrings', 'glutes', 'lower-back'],
    secondaryMuscles: ['lats', 'upper-back', 'forearms', 'core'],
    category: 'hinge',
    equipment: 'barbell',
  },
  'barbell-row': {
    slug: 'barbell-row',
    image: `${IMG}/barbell-row.webp`,
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['biceps', 'rear-delts', 'forearms'],
    category: 'pull',
    equipment: 'barbell',
  },
  'shoulder-press': {
    slug: 'shoulder-press',
    image: `${IMG}/shoulder-press.webp`,
    primaryMuscles: ['front-delts'],
    secondaryMuscles: ['side-delts', 'triceps'],
    category: 'push',
    equipment: 'barbell',
  },
  'lat-machine': {
    slug: 'lat-machine',
    image: `${IMG}/lat-machine.webp`,
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'rear-delts', 'upper-back'],
    category: 'pull',
    equipment: 'cable',
  },
  'seated-row': {
    slug: 'seated-row',
    image: `${IMG}/seated-row.webp`,
    primaryMuscles: ['upper-back'],
    secondaryMuscles: ['lats', 'biceps', 'rear-delts'],
    category: 'pull',
    equipment: 'cable',
  },
  'pull-up': {
    slug: 'pull-up',
    image: `${IMG}/pull-up.webp`,
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper-back', 'core'],
    category: 'pull',
    equipment: 'bodyweight',
  },
  'dip': {
    slug: 'dip',
    image: `${IMG}/dip.webp`,
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['front-delts'],
    category: 'push',
    equipment: 'bodyweight',
  },
  'chest-fly': {
    slug: 'chest-fly',
    image: `${IMG}/chest-fly.webp`,
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts'],
    category: 'isolation',
    equipment: 'machine',
  },
  'cable-fly': {
    slug: 'cable-fly',
    image: `${IMG}/cable-fly.webp`,
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts'],
    category: 'isolation',
    equipment: 'cable',
  },
  'biceps-curl': {
    slug: 'biceps-curl',
    image: `${IMG}/biceps-curl.webp`,
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    category: 'isolation',
    equipment: 'dumbbell',
  },
  'hammer-curl': {
    slug: 'hammer-curl',
    image: `${IMG}/hammer-curl.webp`,
    primaryMuscles: ['biceps', 'forearms'],
    secondaryMuscles: [],
    category: 'isolation',
    equipment: 'dumbbell',
  },
  'triceps-pushdown': {
    slug: 'triceps-pushdown',
    image: `${IMG}/triceps-pushdown.webp`,
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    category: 'isolation',
    equipment: 'cable',
  },
  'french-press': {
    slug: 'french-press',
    image: `${IMG}/french-press.webp`,
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    category: 'isolation',
    equipment: 'barbell',
  },
  'leg-press': {
    slug: 'leg-press',
    image: `${IMG}/leg-press.webp`,
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    category: 'squat',
    equipment: 'machine',
  },
  'leg-extension': {
    slug: 'leg-extension',
    image: `${IMG}/leg-extension.webp`,
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    category: 'isolation',
    equipment: 'machine',
  },
  'leg-curl': {
    slug: 'leg-curl',
    image: `${IMG}/leg-curl.webp`,
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes'],
    category: 'isolation',
    equipment: 'machine',
  },
  'calf-raise': {
    slug: 'calf-raise',
    image: `${IMG}/calf-raise.webp`,
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    category: 'isolation',
    equipment: 'machine',
  },
  'hip-thrust': {
    slug: 'hip-thrust',
    image: `${IMG}/hip-thrust.webp`,
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    category: 'hinge',
    equipment: 'barbell',
  },
});

export const DEFAULT_EXERCISE_IMAGE = `${IMG}/default-exercise.webp`;
