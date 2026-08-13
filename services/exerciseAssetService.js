/* ==========================================================================
   services/exerciseAssetService.js
   Unica API pubblica per accedere agli asset esercizio. L'app deve
   consumare esclusivamente questo modulo: mai importare direttamente
   data/exerciseAssets.js. Se lo slug non esiste, viene restituito un
   asset di fallback deterministico (immagine placeholder, liste vuote,
   categoria/attrezzatura null). Nessuna eccezione viene mai propagata.

   Sprint 8.1 — layer dati read-only, nessuno stato interno.
   ========================================================================== */

import { exerciseSlug }                        from '../utils/exerciseSlug.js';
import { EXERCISE_ASSETS, DEFAULT_EXERCISE_IMAGE } from '../data/exerciseAssets.js';

const FALLBACK_ASSET = Object.freeze({
  slug: '',
  image: DEFAULT_EXERCISE_IMAGE,
  primaryMuscles: Object.freeze([]),
  secondaryMuscles: Object.freeze([]),
  category: null,
  equipment: null,
});

/**
 * Recupera l'asset completo di un esercizio a partire dal suo nome.
 * Fallback deterministico se lo slug non è mappato.
 * @param {string} name — nome esercizio (es. "Bench Press").
 * @returns {{slug:string, image:string, primaryMuscles:string[], secondaryMuscles:string[], category:string|null, equipment:string|null}}
 */
export function getExerciseAsset(name) {
  const slug = exerciseSlug(name);
  if (!slug) return FALLBACK_ASSET;
  const asset = EXERCISE_ASSETS[slug];
  return asset || FALLBACK_ASSET;
}

/**
 * @param {string} name
 * @returns {string} URL/path dell'immagine (placeholder se sconosciuto).
 */
export function getExerciseImage(name) {
  return getExerciseAsset(name).image;
}

/**
 * @param {string} name
 * @returns {string[]} muscoli primari (array vuoto se sconosciuto).
 */
export function getPrimaryMuscles(name) {
  return getExerciseAsset(name).primaryMuscles;
}

/**
 * @param {string} name
 * @returns {string[]} muscoli secondari (array vuoto se sconosciuto).
 */
export function getSecondaryMuscles(name) {
  return getExerciseAsset(name).secondaryMuscles;
}

/**
 * @param {string} name
 * @returns {string|null} movement pattern (null se sconosciuto).
 */
export function getExerciseCategory(name) {
  return getExerciseAsset(name).category;
}

/**
 * @param {string} name
 * @returns {string|null} attrezzatura richiesta (null se sconosciuto).
 */
export function getExerciseEquipment(name) {
  return getExerciseAsset(name).equipment;
}
