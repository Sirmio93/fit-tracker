/* ==========================================================================
   Feedback/Banner.js
   Banner in-page persistente. Varianti: info | warning | error | success.
   ========================================================================== */

import { esc, cx } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

const ICON_FOR = { info: 'bell', warning: 'bell', error: 'close', success: 'check' };

/**
 * @param {Object} [opts]
 * @param {'info'|'warning'|'error'|'success'} [opts.variant='info']
 * @param {string} [opts.title='Attenzione']
 * @param {string} [opts.body]
 * @param {string} [opts.action] — HTML string (Button ghost consigliato).
 */
export function Banner(opts = {}) {
  const variant = ICON_FOR[opts.variant] ? opts.variant : 'info';
  const cls = cx(['c-banner', `c-banner--${variant}`]);
  const ic  = renderIcon(ICON_FOR[variant]);

  return `<div class="${cls}" role="region" aria-label="${esc(opts.title || '')}">
    <span class="c-banner__icon" aria-hidden="true">${ic}</span>
    <div class="c-grow">
      <h4 class="c-banner__title">${esc(opts.title || 'Attenzione')}</h4>
      ${opts.body ? `<p class="c-banner__body">${esc(opts.body)}</p>` : ''}
    </div>
    ${opts.action ? `<div class="c-banner__actions">${opts.action}</div>` : ''}
  </div>`;
}
