/* ==========================================================================
   Navigation/Toolbar.js
   Barra a pillola con azioni allineate in linea. Le azioni sono passate
   come array di stringhe HTML (o come un unico blocco HTML) dal chiamante.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {string[]|string} [opts.actions] — array di HTML string oppure un unico blocco.
 * @param {string} [opts.ariaLabel='Azioni']
 */
export function Toolbar(opts = {}) {
  const raw = opts.actions;
  const content = Array.isArray(raw) ? raw.join('') : (raw || '');
  const ariaLabel = opts.ariaLabel || 'Azioni';
  return `<div class="c-toolbar" role="toolbar" aria-label="${esc(ariaLabel)}">${content}</div>`;
}
