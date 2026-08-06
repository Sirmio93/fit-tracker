/* ==========================================================================
   Buttons/IconButton.js
   Button quadrato solo-icona. Richiede `ariaLabel` (o `label`) per la
   descrizione accessibile. Varianti: ghost (default) | primary | danger.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger']);
const SIZES    = new Set(['sm', 'md', 'lg']);

/**
 * @param {Object} opts
 * @param {string} opts.icon — nome icona.
 * @param {string} opts.label — label per a11y (obbligatoria).
 * @param {'primary'|'secondary'|'ghost'|'danger'} [opts.variant='ghost']
 * @param {'sm'|'md'|'lg'} [opts.size='md']
 * @param {boolean} [opts.disabled]
 * @param {boolean} [opts.loading]
 * @param {boolean} [opts.pressed]
 * @param {Object}  [opts.dataset]
 */
export function IconButton(opts = {}) {
  const variant = VARIANTS.has(opts.variant) ? opts.variant : 'ghost';
  const size    = SIZES.has(opts.size)       ? opts.size    : 'md';
  const label   = opts.label || opts.icon || 'action';

  const cls = cx([
    'c-btn',
    `c-btn--${variant}`,
    'c-btn--icon',
    size !== 'md' ? `c-btn--${size}` : '',
    opts.loading  ? 'is-loading' : '',
    opts.pressed  ? 'is-pressed' : '',
  ]);

  const iconHtml = renderIcon(opts.icon || 'dot', size === 'lg' ? 'large' : 'medium');
  const attrs = {
    type: 'button',
    class: cls,
    'aria-label': label,
    disabled: opts.disabled || opts.loading || null,
    'aria-busy': opts.loading ? 'true' : null,
  };
  if (opts.dataset) {
    for (const k of Object.keys(opts.dataset)) attrs[`data-${k}`] = opts.dataset[k];
  }
  return `<button ${attr(attrs)}>${iconHtml}<span class="c-sr-only">${esc(label)}</span></button>`;
}
