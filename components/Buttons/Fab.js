/* ==========================================================================
   Buttons/Fab.js
   Floating Action Button — bottone circolare sospeso con ombra tint viola.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} opts
 * @param {string} [opts.icon='plus'] — nome icona.
 * @param {string} [opts.label='Azione principale'] — a11y.
 * @param {'primary'|'secondary'} [opts.variant='primary']
 * @param {boolean} [opts.extended] — mostra anche una label a fianco.
 * @param {string}  [opts.text] — testo se `extended`.
 * @param {boolean} [opts.disabled]
 */
export function Fab(opts = {}) {
  const iconName = opts.icon || 'plus';
  const label    = opts.label || (opts.extended ? opts.text : 'Azione principale') || 'action';
  const variant  = opts.variant === 'secondary' ? 'secondary' : 'primary';

  const cls = cx([
    'c-fab',
    `c-fab--${variant}`,
    opts.extended ? 'c-fab--extended' : '',
  ]);

  const inner = opts.extended
    ? `${renderIcon(iconName, 'medium')}<span class="c-fab__text">${esc(opts.text || label)}</span>`
    : renderIcon(iconName, 'medium');

  return `<button ${attr({
    type: 'button',
    class: cls,
    'aria-label': label,
    disabled: opts.disabled || null,
  })}>${inner}</button>`;
}
