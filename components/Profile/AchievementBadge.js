/* ==========================================================================
   Profile/AchievementBadge.js
   Badge trofeo con icona gradient, titolo e meta.
   ========================================================================== */

import { esc, cx } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.icon='trophy']
 * @param {string} [opts.title='Prima settimana']
 * @param {string} [opts.meta='Sblocca dopo 5 sessioni']
 * @param {boolean} [opts.locked] — mostra badge in stile "bloccato".
 */
export function AchievementBadge(opts = {}) {
  const cls = cx(['c-achievement', opts.locked ? 'is-locked' : '']);
  return `<div class="${cls}">
    <div class="c-achievement__icon" aria-hidden="true">${renderIcon(opts.icon || 'trophy', 'large')}</div>
    <div class="c-achievement__title">${esc(opts.title || 'Prima settimana')}</div>
    <div class="c-achievement__meta">${esc(opts.meta || 'Sblocca dopo 5 sessioni')}</div>
  </div>`;
}
