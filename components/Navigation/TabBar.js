/* ==========================================================================
   Navigation/TabBar.js
   Barra di tab orizzontali scrollabili per contenuti secondari.
   Usa role="tablist"/"tab" e ARIA aria-selected.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {Array<string|{id?:string,label:string}>} [opts.items]
 * @param {number} [opts.active=0] — indice attivo.
 * @param {string} [opts.ariaLabel='Categorie']
 */
export function TabBar(opts = {}) {
  const raw = opts.items || ['Tutti', 'Push', 'Pull', 'Legs', 'Full body'];
  const items = raw.map((t, i) => typeof t === 'string' ? { id: String(i), label: t } : { id: t.id ?? String(i), label: t.label });
  const active = opts.active != null ? opts.active : 0;
  const ariaLabel = opts.ariaLabel || 'Categorie';

  const tabs = items.map((t, i) => {
    const isActive = i === active;
    return `<button ${attr({
      type: 'button',
      role: 'tab',
      class: cx(['c-tabBar__tab', isActive ? 'is-active' : '']),
      'data-tab-id': t.id,
      'data-tab-index': i,
      'aria-selected': isActive ? 'true' : 'false',
      tabindex: isActive ? '0' : '-1',
    })}>${esc(t.label)}</button>`;
  }).join('');

  return `<div class="c-tabBar" role="tablist" aria-label="${esc(ariaLabel)}">${tabs}</div>`;
}

/**
 * Aggancia gli event listener alla TabBar: click e frecce ← → per switch.
 * @param {HTMLElement} rootEl
 * @param {(id:string, index:number) => void} onChange
 * @returns {() => void} dispose
 */
export function mountTabBar(rootEl, onChange) {
  if (!rootEl || typeof onChange !== 'function') return () => {};

  function activate(newIdx) {
    const tabs = Array.from(rootEl.querySelectorAll('.c-tabBar__tab'));
    if (!tabs.length) return;
    const idx = Math.max(0, Math.min(tabs.length - 1, newIdx));
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
    });
    tabs[idx].focus();
    onChange(tabs[idx].getAttribute('data-tab-id'), idx);
  }

  function onClick(ev) {
    const tab = ev.target.closest('.c-tabBar__tab');
    if (!tab || !rootEl.contains(tab)) return;
    activate(parseInt(tab.getAttribute('data-tab-index'), 10));
  }
  function onKey(ev) {
    if (!ev.target.classList?.contains('c-tabBar__tab')) return;
    const idx = parseInt(ev.target.getAttribute('data-tab-index'), 10);
    if (ev.key === 'ArrowRight') { ev.preventDefault(); activate(idx + 1); }
    else if (ev.key === 'ArrowLeft')  { ev.preventDefault(); activate(idx - 1); }
    else if (ev.key === 'Home')  { ev.preventDefault(); activate(0); }
    else if (ev.key === 'End')   { ev.preventDefault(); activate(rootEl.querySelectorAll('.c-tabBar__tab').length - 1); }
  }
  rootEl.addEventListener('click',   onClick);
  rootEl.addEventListener('keydown', onKey);
  return () => {
    rootEl.removeEventListener('click',   onClick);
    rootEl.removeEventListener('keydown', onKey);
  };
}
