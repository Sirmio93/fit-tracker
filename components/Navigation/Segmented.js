/* ==========================================================================
   Navigation/Segmented.js
   Segmented control (pillola con segmenti). Selezione singola tra 2-5 opzioni.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {Array<string|{id?:string,label:string}>} [opts.items]
 * @param {number} [opts.active=1]
 * @param {string} [opts.ariaLabel='Filtro periodo']
 */
export function Segmented(opts = {}) {
  const raw = opts.items || ['Settimana', 'Mese', 'Anno'];
  const items = raw.map((t, i) => typeof t === 'string' ? { id: String(i), label: t } : { id: t.id ?? String(i), label: t.label });
  const active = opts.active != null ? opts.active : 1;
  const ariaLabel = opts.ariaLabel || 'Filtro periodo';

  const segs = items.map((t, i) => {
    const isActive = i === active;
    return `<button ${attr({
      type: 'button',
      role: 'tab',
      class: cx(['c-segmented__seg', isActive ? 'is-active' : '']),
      'data-seg-id': t.id,
      'data-seg-index': i,
      'aria-selected': isActive ? 'true' : 'false',
      tabindex: isActive ? '0' : '-1',
    })}>${esc(t.label)}</button>`;
  }).join('');

  return `<div class="c-segmented" role="tablist" aria-label="${esc(ariaLabel)}">${segs}</div>`;
}

/**
 * @param {HTMLElement} rootEl
 * @param {(id:string, index:number) => void} onChange
 * @returns {() => void}
 */
export function mountSegmented(rootEl, onChange) {
  if (!rootEl || typeof onChange !== 'function') return () => {};

  function activate(newIdx) {
    const segs = Array.from(rootEl.querySelectorAll('.c-segmented__seg'));
    if (!segs.length) return;
    const idx = Math.max(0, Math.min(segs.length - 1, newIdx));
    segs.forEach((s, i) => {
      const on = i === idx;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-selected', on ? 'true' : 'false');
      s.setAttribute('tabindex', on ? '0' : '-1');
    });
    segs[idx].focus();
    onChange(segs[idx].getAttribute('data-seg-id'), idx);
  }
  function onClick(ev) {
    const seg = ev.target.closest('.c-segmented__seg');
    if (!seg || !rootEl.contains(seg)) return;
    activate(parseInt(seg.getAttribute('data-seg-index'), 10));
  }
  function onKey(ev) {
    if (!ev.target.classList?.contains('c-segmented__seg')) return;
    const idx = parseInt(ev.target.getAttribute('data-seg-index'), 10);
    if (ev.key === 'ArrowRight') { ev.preventDefault(); activate(idx + 1); }
    else if (ev.key === 'ArrowLeft')  { ev.preventDefault(); activate(idx - 1); }
  }
  rootEl.addEventListener('click',   onClick);
  rootEl.addEventListener('keydown', onKey);
  return () => {
    rootEl.removeEventListener('click',   onClick);
    rootEl.removeEventListener('keydown', onKey);
  };
}
