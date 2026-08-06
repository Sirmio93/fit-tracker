/* ==========================================================================
   Shared/helpers.js
   Utility pure per la composizione HTML string. Nessun accesso al DOM,
   nessuno stato interno. Riusate da tutte le factory di componente.
   ========================================================================== */

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escape HTML special characters. Usa questa funzione per QUALSIASI testo
 * proveniente da props utente prima di concatenarlo in una stringa HTML.
 * @param {*} value
 * @returns {string}
 */
export function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, m => ENTITIES[m]);
}

/**
 * Combina classi truthy in una singola stringa separata da spazio.
 * @param {Array<string|false|null|undefined>} classes
 * @returns {string}
 */
export function cx(classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Serializza un oggetto in stringa di attributi HTML. Chiavi con valore
 * `false` o `null`/`undefined` vengono omesse; `true` produce l'attributo
 * booleano senza valore.
 * @param {Object<string, string|number|boolean|null|undefined>} obj
 * @returns {string}
 */
export function attr(obj) {
  if (!obj) return '';
  const parts = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === false || v == null) continue;
    if (v === true) { parts.push(k); continue; }
    parts.push(`${k}="${esc(v)}"`);
  }
  return parts.join(' ');
}

/**
 * Clampa un numero in [min, max].
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * ID unico incrementale, prefix opzionale (per collegare `aria-labelledby` /
 * `aria-describedby` a titoli generati dinamicamente).
 */
let __uidCounter = 0;
export function uid(prefix = 'c') {
  __uidCounter += 1;
  return `${prefix}-${__uidCounter}`;
}
