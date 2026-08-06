/* ==========================================================================
   Profile/ProfileHeader.js
   Header profilo con avatar XL, nome e meta.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { Avatar } from './Avatar.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.name='Matteo Rossi']
 * @param {string} [opts.initials='MR']
 * @param {string} [opts.image]
 * @param {string} [opts.meta]
 * @param {string} [opts.actions] — HTML string.
 */
export function ProfileHeader(opts = {}) {
  return `<section class="c-profileHeader">
    ${Avatar({ size: 'xl', initials: opts.initials || 'MR', image: opts.image, ariaLabel: opts.name })}
    <div class="c-profileHeader__body">
      <h2 class="c-profileHeader__name">${esc(opts.name || 'Matteo Rossi')}</h2>
      <p class="c-profileHeader__meta">${esc(opts.meta || 'Push · Pull · Legs · Livello intermedio')}</p>
    </div>
    ${opts.actions ? `<div class="c-profileHeader__actions">${opts.actions}</div>` : ''}
  </section>`;
}
