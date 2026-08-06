/* ==========================================================================
   Buttons/Button.js
   Button standard con varianti (primary|secondary|ghost|danger) e taglie
   (sm|md|lg). Stati: :hover :active :focus-visible :disabled .is-loading.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger']);
const SIZES    = new Set(['sm', 'md', 'lg']);

/**
 * @param {Object} [opts]
 * @param {string} [opts.label='Button']
 * @param {'primary'|'secondary'|'ghost'|'danger'} [opts.variant='primary']
 * @param {'sm'|'md'|'lg'} [opts.size='md']
 * @param {string} [opts.icon] — nome da Shared/Icon.js
 * @param {'start'|'end'} [opts.iconPosition='start']
 * @param {boolean} [opts.floating] — aggiunge shadow-floating.
 * @param {boolean} [opts.fullWidth]
 * @param {boolean} [opts.loading]
 * @param {boolean} [opts.disabled]
 * @param {boolean} [opts.pressed] — visualizza stato pressed (per test/screenshot).
 * @param {'button'|'submit'|'reset'} [opts.type='button']
 * @param {string} [opts.ariaLabel]
 * @param {Object} [opts.dataset] — attributi data-*.
 */
export function Button(opts = {}) {
  const variant = VARIANTS.has(opts.variant) ? opts.variant : 'primary';
  const size    = SIZES.has(opts.size)       ? opts.size    : 'md';
  const label   = opts.label || 'Button';
  const iconPos = opts.iconPosition === 'end' ? 'end' : 'start';

  const cls = cx([
    'c-btn',
    `c-btn--${variant}`,
    size !== 'md' ? `c-btn--${size}` : '',
    opts.floating ? 'c-btn--floating' : '',
    opts.fullWidth ? 'c-btn--full' : '',
    opts.loading  ? 'is-loading' : '',
    opts.pressed  ? 'is-pressed' : '',
  ]);

  const iconHtml = opts.icon ? renderIcon(opts.icon, size === 'lg' ? 'large' : 'medium') : '';
  const labelHtml = `<span class="c-btn__label">${esc(label)}</span>`;
  const inner = iconPos === 'end'
    ? `${labelHtml}${iconHtml}`
    : `${iconHtml}${labelHtml}`;

  const attrs = {
    type: opts.type || 'button',
    class: cls,
    disabled: opts.disabled || opts.loading || null,
    'aria-busy': opts.loading ? 'true' : null,
    'aria-label': opts.ariaLabel || null,
  };
  if (opts.dataset) {
    for (const k of Object.keys(opts.dataset)) attrs[`data-${k}`] = opts.dataset[k];
  }

  return `<button ${attr(attrs)}>${inner}</button>`;
}
