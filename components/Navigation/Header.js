/* ==========================================================================
   Navigation/Header.js
   Top bar dell'app: titolo, sottotitolo, slot azione (HTML). Le azioni non
   vengono importate da Buttons/: il chiamante passa la stringa HTML in
   `actions` per mantenere Navigation/ indipendente.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.title='Home']
 * @param {string} [opts.subtitle]
 * @param {string} [opts.actions] — HTML string (es. Button(...) o IconButton(...)).
 * @param {string} [opts.role='banner']
 */
export function Header(opts = {}) {
  const title = opts.title || 'Home';
  const subtitle = opts.subtitle;
  const actions = opts.actions || '';
  const role = opts.role || 'banner';

  const sub = subtitle ? `<p class="c-header__subtitle">${esc(subtitle)}</p>` : '';
  const actionsBlock = actions ? `<div class="c-header__actions">${actions}</div>` : '';

  return `<header ${attr({
    class: 'c-header',
    role,
  })}>
    <div class="c-header__group">
      <h1 class="c-header__title">${esc(title)}</h1>
      ${sub}
    </div>
    ${actionsBlock}
  </header>`;
}
