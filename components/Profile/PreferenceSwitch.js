/* ==========================================================================
   Profile/PreferenceSwitch.js
   Interruttore ARIA (role="switch"). Emissione onChange in mount().
   ========================================================================== */

import { esc, cx, attr, uid } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {boolean} [opts.on=false]
 * @param {string} [opts.label] — visibile allo screen reader; nascosta se `hideLabel`.
 * @param {boolean} [opts.disabled]
 */
export function PreferenceSwitch(opts = {}) {
  const on = !!opts.on;
  const id = uid('sw');
  const cls = cx(['c-switch', on ? 'is-on' : '', opts.disabled ? 'is-disabled' : '']);
  const label = opts.label ? `<span class="c-sr-only" id="${id}-lbl">${esc(opts.label)}</span>` : '';
  return `${label}<button ${attr({
    id,
    type: 'button',
    role: 'switch',
    class: cls,
    'aria-checked': on ? 'true' : 'false',
    'aria-labelledby': opts.label ? `${id}-lbl` : null,
    disabled: opts.disabled || null,
  })}><span class="c-switch__thumb"></span></button>`;
}

/**
 * Aggancia il toggle. Ritorna dispose.
 * @param {HTMLElement} rootEl — l'elemento .c-switch.
 * @param {(on:boolean) => void} onChange
 */
export function mountPreferenceSwitch(rootEl, onChange) {
  if (!rootEl) return () => {};
  function onClick() {
    if (rootEl.disabled || rootEl.classList.contains('is-disabled')) return;
    const on = !rootEl.classList.contains('is-on');
    rootEl.classList.toggle('is-on', on);
    rootEl.setAttribute('aria-checked', on ? 'true' : 'false');
    onChange?.(on);
  }
  function onKey(ev) {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); onClick(); }
  }
  rootEl.addEventListener('click', onClick);
  rootEl.addEventListener('keydown', onKey);
  return () => {
    rootEl.removeEventListener('click', onClick);
    rootEl.removeEventListener('keydown', onKey);
  };
}
