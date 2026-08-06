/* ==========================================================================
   Profile/SettingsRow.js
   Riga impostazione: label + meta + control (switch / chevron / HTML custom).
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';
import { PreferenceSwitch } from './PreferenceSwitch.js';

/**
 * @param {Object} opts
 * @param {string} opts.label
 * @param {string} [opts.meta]
 * @param {string} [opts.control] — HTML custom per il control (es. Button).
 * @param {boolean} [opts.switch]  — se presente, mostra PreferenceSwitch on/off.
 * @param {boolean} [opts.chevron=true] — mostra chevron se manca sia control che switch.
 * @param {boolean} [opts.interactive] — aggiunge role button per riga cliccabile.
 * @param {Object}  [opts.dataset]
 */
export function SettingsRow(opts = {}) {
  const meta = opts.meta ? `<div class="c-settingsRow__meta">${esc(opts.meta)}</div>` : '';
  let controlHtml = '';
  if (opts.control) controlHtml = opts.control;
  else if (opts.switch != null) controlHtml = PreferenceSwitch({ on: !!opts.switch, label: opts.label });
  else if (opts.chevron !== false) controlHtml = `<span class="c-settingsRow__chevron" aria-hidden="true">${renderIcon('arrow', 'small')}</span>`;

  const attrs = { class: 'c-settingsRow' };
  if (opts.interactive) {
    attrs.tabindex = '0';
    attrs.role = 'button';
    attrs['aria-label'] = opts.label;
  }
  if (opts.dataset) {
    for (const k of Object.keys(opts.dataset)) attrs[`data-${k}`] = opts.dataset[k];
  }

  return `<div ${attr(attrs)}>
    <div class="c-settingsRow__body">
      <div class="c-settingsRow__label">${esc(opts.label)}</div>
      ${meta}
    </div>
    <div class="c-settingsRow__control">${controlHtml}</div>
  </div>`;
}
