/* ==========================================================================
   Shared/Theme.js
   API pubblica di gestione tema per la libreria UI.
   Non contiene business logic né stato locale: agisce come thin adapter
   verso app.js tramite CustomEvent 'ui:theme-set'.

   `S.theme` in app.js resta l'unica fonte di verità in memoria.
   `localStorage.theme` resta l'unica fonte di verità persistente.
   `<html data-theme>` resta l'unico driver visuale (via applyTheme).

   Fase 10 Step 2 — Theme.
   ========================================================================== */

/** Modi selezionabili dall'utente (persistiti in localStorage). */
export const THEMES = Object.freeze(['system', 'light', 'dark', 'amoled']);

/** Temi effettivi applicati a `<html data-theme>` (non contengono 'system'). */
export const EFFECTIVE_THEMES = Object.freeze(['light', 'dark', 'amoled']);

/**
 * Imposta il tema. Dispatch di CustomEvent 'ui:theme-set' su document —
 * app.js aggiorna S.theme, localStorage e chiama applyTheme().
 * @param {'system'|'light'|'dark'|'amoled'} name
 * @returns {boolean} true se il nome è valido e l'evento è stato dispatchato.
 */
export function setTheme(name) {
  if (!THEMES.includes(name)) return false;
  document.dispatchEvent(new CustomEvent('ui:theme-set', { detail: { name } }));
  return true;
}

/**
 * Ritorna il tema selezionato dall'utente (default 'system').
 * Legge direttamente localStorage — nessuna chiamata a S.
 */
export function getTheme() {
  const t = (typeof localStorage !== 'undefined' && localStorage.theme) || 'system';
  return THEMES.includes(t) ? t : 'system';
}

/**
 * Ritorna il tema EFFETTIVO attualmente applicato al documento
 * (uno tra 'light' | 'dark' | 'amoled'). Utile per componenti che
 * devono adattarsi al tema attivo (es. icone maskable, canvas).
 */
export function getEffectiveTheme() {
  const attr = document.documentElement.dataset.theme;
  return EFFECTIVE_THEMES.includes(attr) ? attr : 'light';
}
