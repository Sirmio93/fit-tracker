/* ==========================================================================
   CreateWorkout/HeroMeta.js — T1.2 · Hero meta card.

   Pattern-setter del MODELLO "draft" della scheda in editing (S.editor.draft),
   consumato in seguito da T1.3 (weeks), T1.4 (weeks[*].days[*].blocks[]),
   T1.7 (Store.put('cards', draft)) e T1.8.

   Shape draft (documentato in verifications/T1.2/DIFF.md):
     {
       id: null | string,
       name: string,
       note: string,
       weeks: [{ key, label, days: [{ key, label, name, blocks: [] }] }],
       defaultActive: boolean,
     }

   API pubblica:
     - renderHeroMeta(draft) → HTML string
     - heroMetaStats(draft)  → { days, blocks, avg, weeks }

   L'HTML esposto è controllato dai delegator di app.js:
     - input#createHeroName  oninput → draft.name  + isDirty
     - textarea#createHeroNote oninput → draft.note + isDirty
     - button[data-action="create-hero-toggle-active"] click → draft.defaultActive
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

const NAME_MAX = 60;
const NOTE_MAX = 500;

export function heroMetaStats(draft) {
  var weeks = (draft && Array.isArray(draft.weeks)) ? draft.weeks : [];
  var weeksCount = weeks.length;
  var daysCount = 0;
  var blocksCount = 0;
  for (var i = 0; i < weeks.length; i++) {
    var days = Array.isArray(weeks[i] && weeks[i].days) ? weeks[i].days : [];
    daysCount += days.length;
    for (var j = 0; j < days.length; j++) {
      var blocks = Array.isArray(days[j] && days[j].blocks) ? days[j].blocks : [];
      blocksCount += blocks.length;
    }
  }
  var avg = daysCount > 0 ? Math.round(blocksCount / daysCount) : null;
  return { days: daysCount, blocks: blocksCount, avg: avg, weeks: weeksCount };
}

function formatStat(kind, stats) {
  if (kind === 'days')   return stats.days === 1   ? '1 giorno'    : stats.days   + ' giorni';
  if (kind === 'blocks') return stats.blocks === 1 ? '1 blocco'    : stats.blocks + ' blocchi';
  if (kind === 'avg')    return stats.avg == null  ? '—'           : (stats.avg + ' media/gg');
  if (kind === 'weeks')  return stats.weeks === 1  ? '1 settimana' : stats.weeks  + ' settimane';
  return '';
}

export function renderHeroMeta(draft) {
  if (!draft) return '';

  var stats = heroMetaStats(draft);
  var name = draft.name != null ? String(draft.name) : '';
  var note = draft.note != null ? String(draft.note) : '';
  var on = !!draft.defaultActive;
  var eyebrow = draft.id ? 'Modifica scheda' : 'Nuova scheda';

  var cells = [
    { key: 'days',   value: String(stats.days),                                 label: 'Giorni' },
    { key: 'blocks', value: String(stats.blocks),                               label: 'Blocchi' },
    { key: 'avg',    value: stats.avg == null ? '—' : String(stats.avg),        label: 'Media/gg' },
    { key: 'weeks',  value: String(stats.weeks),                                label: stats.weeks === 1 ? 'Settimana' : 'Settimane' },
  ];

  var statsHtml = cells.map(function (c) {
    return '' +
      '<div class="cw-hero__stat" data-stat="' + esc(c.key) + '" aria-label="' + esc(formatStat(c.key, stats)) + '">' +
        '<div class="cw-hero__stat-value">' + esc(c.value) + '</div>' +
        '<div class="cw-hero__stat-label">' + esc(c.label) + '</div>' +
      '</div>';
  }).join('');

  return '' +
    '<section class="cw-hero" aria-label="Meta scheda">' +
      '<p class="cw-hero__label">' + esc(eyebrow) + '</p>' +

      '<label class="c-sr-only" for="createHeroName">Nome scheda</label>' +
      '<input' +
        ' id="createHeroName"' +
        ' class="cw-hero__name"' +
        ' type="text"' +
        ' maxlength="' + NAME_MAX + '"' +
        ' placeholder="Nome scheda"' +
        ' value="' + esc(name) + '"' +
        ' autocomplete="off"' +
        ' spellcheck="false"' +
        ' data-hero-field="name"' +
      ' />' +

      '<label class="c-sr-only" for="createHeroNote">Note generali</label>' +
      '<textarea' +
        ' id="createHeroNote"' +
        ' class="cw-hero__note"' +
        ' rows="2"' +
        ' maxlength="' + NOTE_MAX + '"' +
        ' placeholder="Note (opzionali)"' +
        ' aria-multiline="true"' +
        ' data-hero-field="note"' +
      '>' + esc(note) + '</textarea>' +

      '<div class="cw-hero__stats" role="group" aria-label="Riepilogo scheda">' +
        statsHtml +
      '</div>' +

      '<div class="cw-hero__toggle-row">' +
        '<div class="cw-hero__toggle-copy">' +
          '<div class="cw-hero__toggle-title" id="createHeroToggleLabel">Imposta come attiva</div>' +
          '<div class="cw-hero__toggle-sub">Sarà quella proposta nella Home</div>' +
        '</div>' +
        '<button' +
          ' type="button"' +
          ' class="cw-hero__toggle' + (on ? ' is-on' : '') + '"' +
          ' role="switch"' +
          ' aria-checked="' + (on ? 'true' : 'false') + '"' +
          ' aria-labelledby="createHeroToggleLabel"' +
          ' data-action="create-hero-toggle-active"' +
        '>' +
          '<span class="cw-hero__toggle-thumb" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
    '</section>';
}
