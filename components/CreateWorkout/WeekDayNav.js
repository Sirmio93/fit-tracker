/* ==========================================================================
   CreateWorkout/WeekDayNav.js — T1.3 · Weekly / day navigation.

   Renderizza dentro `data-slot="nav"` della shell "Crea scheda":
     1. Segmented A / B / opz per la selezione della settimana. La colonna
        "opz." è in modalità "add" (dashed, opacità ridotta, label "+ Opz.")
        finché la week `giorno_3_opzionale` non viene creata; click su B o
        opz mancanti crea la week e la seleziona.
     2. Row di day-tab per la settimana corrente. Ogni tab mostra
        short-label (Lun/Mar/…), nome giorno e un badge con il conteggio
        blocchi (mostrato solo se ≥ 1). Coda: day-tab dashed "+ Giorno"
        che crea un nuovo giorno vuoto (se ci sono ancora slot liberi).

   La selezione settimana/giorno vive in S._ui (session-only), NON è
   persistita nel draft — vedi verifications/T1.2/DIFF.md.

   API pubblica:
     - renderWeekDayNav(draft, ui) → HTML string ('' se draft null)
     - resolveNavSelection(draft, ui) → { weekKey, dayKey }

   Delegator wired in app.js:
     - [data-action="create-nav-select-week"] data-week-key → createNavSelectWeek
     - [data-action="create-nav-select-day"]  data-day-key  → createNavSelectDay
     - [data-action="create-nav-add-day"]                    → createNavAddDay
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

const WEEK_SLOTS = [
  { key: 'settimana_a',        label: 'Settimana A' },
  { key: 'settimana_b',        label: 'Settimana B' },
  { key: 'giorno_3_opzionale', label: '+ Opz.', addLabel: '+ Opz.', filledLabel: 'Giorno 3' },
];

const DAY_ORDER = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
const DAY_SHORT = {
  lunedi: 'Lun', martedi: 'Mar', mercoledi: 'Mer', giovedi: 'Gio',
  venerdi: 'Ven', sabato: 'Sab', domenica: 'Dom',
  giorno_3_opzionale: 'Opz',
};

function findWeek(draft, key) {
  var weeks = (draft && Array.isArray(draft.weeks)) ? draft.weeks : [];
  for (var i = 0; i < weeks.length; i++) {
    if (weeks[i] && weeks[i].key === key) return weeks[i];
  }
  return null;
}

export function resolveNavSelection(draft, ui) {
  var weeks = (draft && Array.isArray(draft.weeks)) ? draft.weeks : [];
  var uiWeek = ui && ui.selectedWeek;
  var weekKey = null;
  if (uiWeek && findWeek(draft, uiWeek)) weekKey = uiWeek;
  else if (weeks.length > 0) weekKey = weeks[0].key;
  var week = weekKey ? findWeek(draft, weekKey) : null;
  var days = (week && Array.isArray(week.days)) ? week.days : [];
  var uiDay = ui && ui.selectedDay;
  var dayKey = null;
  if (uiDay) {
    for (var i = 0; i < days.length; i++) {
      if (days[i] && days[i].key === uiDay) { dayKey = uiDay; break; }
    }
  }
  if (!dayKey && days.length > 0) dayKey = days[0].key;
  return { weekKey: weekKey, dayKey: dayKey };
}

function renderWeekSegment(slot, draft, selectedWeekKey) {
  var exists = !!findWeek(draft, slot.key);
  var isActive = exists && selectedWeekKey === slot.key;
  var isAddMode = !exists && !!slot.addLabel;
  var isMissing = !exists && !slot.addLabel;
  var classes = ['cw-nav-week'];
  if (isActive)   classes.push('cw-nav-week--active');
  if (isAddMode)  classes.push('cw-nav-week--add');
  if (isMissing)  classes.push('cw-nav-week--missing');
  var label = isAddMode ? slot.addLabel : (exists && slot.filledLabel ? slot.filledLabel : slot.label);
  var ariaLabel = exists
    ? slot.label
    : (slot.key === 'giorno_3_opzionale' ? 'Aggiungi settimana opzionale' : 'Aggiungi ' + slot.label);
  return '<button type="button"' +
    ' class="' + classes.join(' ') + '"' +
    ' role="tab"' +
    ' aria-selected="' + (isActive ? 'true' : 'false') + '"' +
    ' aria-label="' + esc(ariaLabel) + '"' +
    ' data-action="create-nav-select-week"' +
    ' data-week-key="' + esc(slot.key) + '"' +
    '>' + esc(label) + '</button>';
}

function renderDayTab(day, isActive) {
  var blocks = Array.isArray(day && day.blocks) ? day.blocks : [];
  var count = blocks.length;
  var shortLabel = DAY_SHORT[day.key] || (day.label ? String(day.label).slice(0, 3) : '');
  var dayName = (day.name && String(day.name).trim()) ? String(day.name) : '';
  var displayName = dayName || 'Vuoto';
  var classes = ['cw-nav-day'];
  if (isActive) classes.push('cw-nav-day--active');
  var badge = count > 0
    ? '<span class="cw-nav-day__count" aria-label="' + esc(count === 1 ? '1 blocco' : count + ' blocchi') + '">' + esc(String(count)) + '</span>'
    : '';
  var ariaLabel = (day.label || day.key) + (dayName ? ' — ' + dayName : ' — vuoto') + (count ? ' (' + count + (count === 1 ? ' blocco' : ' blocchi') + ')' : '');
  return '<button type="button"' +
    ' class="' + classes.join(' ') + '"' +
    ' role="tab"' +
    ' aria-selected="' + (isActive ? 'true' : 'false') + '"' +
    ' aria-label="' + esc(ariaLabel) + '"' +
    ' data-action="create-nav-select-day"' +
    ' data-day-key="' + esc(day.key) + '"' +
    '>' +
      '<span class="cw-nav-day__short">' + esc(shortLabel) + '</span>' +
      '<span class="cw-nav-day__name">' + esc(displayName) + '</span>' +
      badge +
    '</button>';
}

function renderAddDayTab() {
  return '<button type="button"' +
    ' class="cw-nav-day cw-nav-day--add"' +
    ' aria-label="Aggiungi giorno"' +
    ' data-action="create-nav-add-day"' +
    '>' +
      '<span class="cw-nav-day__short">Nuovo</span>' +
      '<span class="cw-nav-day__name">+ Giorno</span>' +
    '</button>';
}

export function renderWeekDayNav(draft, ui) {
  if (!draft) return '';

  // Defensive auto-init (dev-friendly, come createEmptyDraft di T1.2):
  // se il draft esiste ma weeks[] è vuoto/undefined, seed con settimana_a.
  if (!Array.isArray(draft.weeks) || draft.weeks.length === 0) {
    draft.weeks = [{ key: 'settimana_a', label: 'Settimana A', days: [] }];
  }

  var sel = resolveNavSelection(draft, ui);

  var weekBtns = WEEK_SLOTS.map(function (slot) {
    return renderWeekSegment(slot, draft, sel.weekKey);
  }).join('');
  var weeksHtml =
    '<div class="cw-nav-weeks" role="tablist" aria-label="Settimane">' +
      weekBtns +
    '</div>';

  var currentWeek = sel.weekKey ? findWeek(draft, sel.weekKey) : null;
  var days = (currentWeek && Array.isArray(currentWeek.days)) ? currentWeek.days : [];

  var dayHtml = days.map(function (day) {
    return renderDayTab(day, sel.dayKey === day.key);
  }).join('');

  // "+ Giorno" tab in coda: mostrato solo se restano slot di giorno liberi.
  var used = {};
  for (var i = 0; i < days.length; i++) if (days[i]) used[days[i].key] = true;
  var canAddDay = false;
  for (var j = 0; j < DAY_ORDER.length; j++) {
    if (!used[DAY_ORDER[j]]) { canAddDay = true; break; }
  }
  var addHtml = canAddDay ? renderAddDayTab() : '';
  var daysHtml =
    '<div class="cw-nav-days" role="tablist" aria-label="Giorni della settimana">' +
      dayHtml + addHtml +
    '</div>';

  return '<nav class="cw-nav" aria-label="Struttura scheda">' + weeksHtml + daysHtml + '</nav>';
}
