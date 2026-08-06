/* ==========================================================================
   Navigation/BottomNavigation.js
   Barra di navigazione principale ancorata al fondo. Riceve gli item come
   proprietà; segnala il cambio pagina tramite callback in mount().
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';
import { icon } from '../Shared/Icon.js';

const DEFAULT_ITEMS = [
  { id: 'home',      label: 'Home',      icon: 'home' },
  { id: 'workout',   label: 'Workout',   icon: 'dumbbell' },
  { id: 'progressi', label: 'Progressi', icon: 'chart' },
  { id: 'profilo',   label: 'Profilo',   icon: 'user' },
];

/**
 * @param {Object} [opts]
 * @param {Array<{id:string,label:string,icon:string,badge?:string|number}>} [opts.items]
 * @param {string} [opts.active] — id dell'item attivo.
 * @param {string} [opts.ariaLabel='Navigazione principale']
 * @returns {string} HTML string
 */
export function BottomNavigation(opts = {}) {
  const items = opts.items || DEFAULT_ITEMS;
  const active = opts.active || items[0]?.id;
  const ariaLabel = opts.ariaLabel || 'Navigazione principale';

  const itemsHtml = items.map(it => {
    const isActive = it.id === active;
    const cls = cx(['c-bottomNav__item', isActive ? 'is-active' : '']);
    const badge = it.badge != null
      ? `<span class="c-bottomNav__badge" aria-label="${esc(it.badge)} nuovi">${esc(it.badge)}</span>`
      : '';
    return `<button ${attr({
      type: 'button',
      class: cls,
      'data-nav-id': it.id,
      'aria-label': it.label,
      'aria-current': isActive ? 'page' : null,
    })}>${icon(it.icon)}${badge}<span class="c-bottomNav__label">${esc(it.label)}</span></button>`;
  }).join('');

  return `<nav class="c-bottomNav" role="navigation" aria-label="${esc(ariaLabel)}">${itemsHtml}</nav>`;
}

/**
 * Aggancia il click-handler alla barra montata nel DOM.
 * @param {HTMLElement} rootEl — l'elemento <nav.c-bottomNav>.
 * @param {(id:string, ev:MouseEvent) => void} onSelect
 * @returns {() => void} dispose
 */
export function mountBottomNavigation(rootEl, onSelect) {
  if (!rootEl || typeof onSelect !== 'function') return () => {};
  function handle(ev) {
    const btn = ev.target.closest('.c-bottomNav__item');
    if (!btn || !rootEl.contains(btn)) return;
    const id = btn.getAttribute('data-nav-id');
    if (id) onSelect(id, ev);
  }
  rootEl.addEventListener('click', handle);
  return () => rootEl.removeEventListener('click', handle);
}

/**
 * Aggiorna l'item attivo senza rimontare il markup.
 * @param {HTMLElement} rootEl
 * @param {string} activeId
 */
export function setActiveNavItem(rootEl, activeId) {
  if (!rootEl) return;
  rootEl.querySelectorAll('.c-bottomNav__item').forEach(el => {
    const isActive = el.getAttribute('data-nav-id') === activeId;
    el.classList.toggle('is-active', isActive);
    if (isActive) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}
