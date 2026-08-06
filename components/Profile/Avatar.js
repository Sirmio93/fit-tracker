/* ==========================================================================
   Profile/Avatar.js
   Avatar circolare con iniziali o immagine. Taglie sm | md | lg | xl.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';

const SIZES = new Set(['sm', 'md', 'lg', 'xl']);

/**
 * @param {Object} [opts]
 * @param {string} [opts.initials='MR']
 * @param {string} [opts.image] — URL immagine (se presente, sostituisce le iniziali).
 * @param {'sm'|'md'|'lg'|'xl'} [opts.size='md']
 * @param {string} [opts.ariaLabel]
 */
export function Avatar(opts = {}) {
  const size = SIZES.has(opts.size) ? opts.size : 'md';
  const cls  = cx(['c-avatar', size !== 'md' ? `c-avatar--${size}` : '']);

  const content = opts.image
    ? `<img class="c-avatar__img" src="${esc(opts.image)}" alt="${esc(opts.ariaLabel || opts.initials || '')}"/>`
    : esc(opts.initials || 'MR');

  return `<div ${attr({
    class: cls,
    'aria-label': opts.ariaLabel || null,
    'aria-hidden': opts.ariaLabel ? null : 'true',
  })}>${content}</div>`;
}
