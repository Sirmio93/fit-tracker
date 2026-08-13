/* ==========================================================================
   utils/exerciseSlug.js
   Converte un nome esercizio in uno slug canonico, deterministico e
   privo di caratteri ambigui. Usato dal layer asset per indicizzare la
   mappa esercizi partendo esclusivamente da Exercise.name.

   Regole:
     - lowercase
     - rimozione accenti (NFD + strip combining marks)
     - parentesi tonde/quadre/graffe rimosse
     - slash e caratteri speciali sostituiti con "-"
     - spazi collassati e sostituiti con "-"
     - trattini multipli collassati in uno
     - trim di eventuali "-" iniziali/finali

   Sprint 8.1 — nessun side-effect, nessuna dipendenza.
   ========================================================================== */

/**
 * @param {string} name — nome esercizio umano (es. "Bench Press (Barbell)").
 * @returns {string} slug canonico (es. "bench-press-barbell"). "" se input vuoto.
 */
export function exerciseSlug(name) {
  if (name == null) return '';
  let s = String(name);
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.toLowerCase();
  s = s.replace(/[()\[\]{}]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^-|-$/g, '');
  return s;
}
