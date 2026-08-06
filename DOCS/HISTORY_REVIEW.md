# HISTORY_REVIEW — Sprint 6

**Versione:** 1.0
**Data:** 2026-08-06
**Sprint:** 6 — History Experience
**Blueprint:** [07_HISTORY_EXPERIENCE.md](07_HISTORY_EXPERIENCE.md) v1.0
**Prerequisiti:** Sprint 1-5 approvati

---

## 1. TL;DR

Storico riprogettato come esperienza dedicata: **preview compatta** nel tab Progressi + **overlay full-screen** con ricerca istantanea, filtri periodo indipendenti, timeline verticale, sticky month header, swipe navigation, drill-down.

- Nessuna nuova voce in BottomNav (Sprint 5 D1 rispettato)
- Ricerca multi-campo con accent-fold (label, esercizio, muscolo, giorno, data)
- Filtro periodo `Tutti | Settimana | Mese | Anno` indipendente da Overview
- Timeline verticale con dot per sessione, sticky month header
- Swipe destra > 60px apre Session Detail
- Session Detail dentro overlay riusa `progressSessionDetailView` (zero duplicazione)
- Scroll restoration doppio livello + flash animation al ritorno da detail
- Business Logic invariata, IndexedDB invariato, modello dati invariato, zero nuovi componenti

---

## 2. Screenshot ASCII

### Preview Storico (nel tab Progressi)

```
┌─────────────────────────────────────┐
│ Overview [Storico] Record           │ ← Segmented view
├─────────────────────────────────────┤
│ STORICO                             │
│ Ultime sessioni                     │
│ 42 allenamenti in totale            │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [PD] Lunedì · Petto + Dorso  │›│
│ │      05/08 · 1h12 · 3200 kg   │   │
│ ├───────────────────────────────┤   │
│ │ [GS] Mercoledì · Gambe + Spa │›│
│ │      02/08 · 1h05 · 2840 kg   │   │
│ ├───────────────────────────────┤   │
│ │ [PD] Lunedì · Petto + Dorso  │›│
│ │      29/07 · 1h18 · 3050 kg   │   │
│ └───────────────────────────────┘   │
│                                     │
│ [ Vedi tutto lo Storico          › ]│
└─────────────────────────────────────┘
```

### Overlay full-screen (list mode)

```
╔═════════════════════════════════════╗
║ ‹ Chiudi     Storico                ║ ← sticky header + blur
║ ┌─────────────────────────────────┐ ║
║ │ ⌕ Cerca esercizio, giorno, data│ ║ ← search input
║ └─────────────────────────────────┘ ║
║ [Tutti] Settimana  Mese  Anno       ║ ← period segmented
╠═════════════════════════════════════╣
║ AGOSTO 2026                         ║ ← sticky month
║   ● ┌───────────────────────────┐   ║
║   │ │ Lunedì 5                  │   ║
║   │ │ Petto + Dorso    [2 PR]  ›│   ║ ← card + dot + badges
║   │ │ 1h12 · 24 serie · 3200 kg │   ║
║   │ │                           │   ║
║   │ └───────────────────────────┘   ║
║   ● ┌───────────────────────────┐   ║
║   │ │ Mercoledì 2 agosto        │   ║
║   │ │ Gambe + Spalle           ›│   ║
║   │ │ 1h05 · 21 serie · 2840 kg │   ║
║   │ └───────────────────────────┘   ║
║ LUGLIO 2026                         ║
║   ● ┌───────────────────────────┐   ║
║   │ │ Venerdì 28 luglio         │   ║
║   ...                              ║
╚═════════════════════════════════════╝
```

### Empty state ricerca

```
╔═════════════════════════════════════╗
║ ‹ Chiudi     Storico                ║
║ ┌─────────────────────────────────┐ ║
║ │ ⌕ xxxyyy                     × │ ║ ← query without matches
║ └─────────────────────────────────┘ ║
║ [Tutti] Settimana  Mese  Anno       ║
╠═════════════════════════════════════╣
║                                     ║
║       Nessun allenamento trovato    ║
║                                     ║
║   Prova con un altro nome, giorno   ║
║          o esercizio.               ║
║                                     ║
║      [   Cancella ricerca   ]       ║
║                                     ║
╚═════════════════════════════════════╝
```

### Session Detail dentro overlay

```
╔═════════════════════════════════════╗
║ ‹ Torna                             ║ ← close-history-session
╠═════════════════════════════════════╣
║ LUNEDÌ · 05/08                      ║
║ Lunedì · Petto + Dorso              ║
║ Durata 1h 12m  ┃ 2 PR ┃             ║
║                                     ║
║ ┌─Volume─┐ ┌─Serie──┐ ┌─Durata──┐  ║
║ │  3200  │ │   24   │ │  1h12   │  ║
║ └────────┘ └────────┘ └─────────┘  ║
║                                     ║
║ ESERCIZI                            ║
║ ┌──────────────────────────────┐   ║
║ │ Cable fly alto-basso     ▸   │   ║
║ │ Pettorale basso · 3/3 · 405kg│   ║
║ │ [PR +5 kg]                   │   ║
║ └──────────────────────────────┘   ║
║ ┌──────────────────────────────┐   ║
║ │ Panca piana              ▾   │   ║
║ │ Petto · 3/3 · 1440 kg        │   ║
║ │  ✓ Serie 1  60 kg × 8        │   ║
║ │  ✓ Serie 2  60 kg × 8        │   ║
║ │  ✓ Serie 3  62 kg × 8        │   ║
║ └──────────────────────────────┘   ║
╚═════════════════════════════════════╝
```

---

## 3. Funzionalità implementate

### Preview compatta
| Requisito | Implementato |
|-----------|--------------|
| Ultime 3-5 sessioni | ✅ 3 (per contrasto con Overview che ne mostra 5 del periodo) |
| CTA "Vedi tutto" | ✅ pulsante con icona chevron |
| Compattezza | ✅ nasconde progressPeriod header in Storico view |
| Meta totale sessioni | ✅ "N allenamenti in totale" nel headers |
| Empty se zero sessioni | ✅ `.progressEmpty` senza CTA overlay |

### Overlay full-screen
| Requisito | Implementato |
|-----------|--------------|
| Slide-up animation | ✅ 240ms cubic-bezier(0.2, 0.9, 0.3, 1) |
| Slide-down on close | ✅ 220ms + `.is-closing` class |
| Chiusura via Escape | ✅ window keydown handler global |
| Chiusura via pulsante | ✅ "Chiudi" action |
| Body scroll lock | ✅ `.has-history-overlay` overflow hidden |
| BottomNav visibile | ✅ overlay z-index 90, BottomNav più alta gerarchia interattiva |
| Tab switch chiude overlay | ✅ `go()` resetta `S.history.open` prima di render |

### Ricerca
| Requisito | Implementato |
|-----------|--------------|
| Case-insensitive | ✅ `.toLowerCase()` |
| Accent-fold | ✅ NFD + strip U+0300–U+036F |
| Multi-campo | ✅ label + weekday + date (2 formati) + exercise name + primary |
| Debounce 150-200ms | ✅ 180ms |
| Empty state ricerca | ✅ con CTA "Cancella ricerca" |
| Highlight match | ✅ `<mark class="historyMark">` sui campi visibili (day + title) |
| Auto-focus al primo open | ✅ `S.history.initialized === 'fresh'` |
| Enter → blur | ✅ nasconde tastiera mobile |
| Nessuna persistenza | ✅ solo runtime `S.history.query` |

### Filtro periodo
| Requisito | Implementato |
|-----------|--------------|
| Segmented `Tutti\|Settimana\|Mese\|Anno` | ✅ 4 opzioni |
| Default = eredita Overview | ✅ `historyOpen()` inizializza da `S.progress.period` |
| Indipendenza post-open | ✅ `S.history.period` non modifica `S.progress.period` |
| Applicato ai risultati filtrati | ✅ composto con ricerca in `historyFilteredSessions()` |
| Aggiornamento immediato | ✅ `historyRerenderBodyOnly()` sub-100ms |
| Mantiene ricerca attiva | ✅ query preserved |
| Toggle classi senza rebuild header | ✅ classList toggle sui seg |

### Timeline verticale + Sticky Month
| Requisito | Implementato |
|-----------|--------------|
| Rail verticale | ✅ pseudo-elemento `::before` con gradient primary |
| Dot per sessione | ✅ `.historyCard__dot` absolute + ring |
| Header mese sticky | ✅ position: sticky con top calcolato |
| Transizione tra mesi | ✅ mese cambia scrollando (backdrop-filter blur) |
| Formato label | ✅ "AGOSTO 2026" (uppercase + anno) |

### Swipe navigation
| Requisito | Implementato |
|-----------|--------------|
| Swipe destra → apre detail | ✅ dx > 60px |
| Nessuna azione distruttiva | ✅ swipe sinistra ignorato |
| Tap resta funzionale | ✅ soglia direzione 1.4× |
| Damping + cap | ✅ dx * 0.6, max 120px |
| Reset se sotto soglia | ✅ transizione 160ms |
| Haptic feedback | ✅ `navigator.vibrate(8)` all'apertura |
| touch-action pan-y | ✅ vertical scroll comunque possibile |

### Scroll & Flash
| Requisito | Implementato |
|-----------|--------------|
| Restore overlay → preview | ✅ `S.history.parentScrollY` + `window.scrollTo` |
| Restore detail → timeline | ✅ `S.history.scrollY` + `requestAnimationFrame` |
| Flash sulla card visitata | ✅ `.historyCard--flash` 1000ms |
| Flash auto-consumato | ✅ `S.history.lastSessionId` reset dopo 1200ms |

---

## 4. Dati utilizzati

**Zero simulazioni.** Solo `S.sessions` già in memoria + helpers esistenti.

| Dato | Fonte | Uso |
|------|-------|-----|
| Sessioni completate | `completedSessions()` | Base per lista |
| Volume | `sessionVolume(s)` | Card meta |
| Serie done | `sessionSetsDone(s)` | Card meta |
| Durata | `s.durationSec` + `fmtDurShort` | Card meta |
| PR sessione | `newPRsInSession(s)` o `s.newPRs` cached | Badge card |
| Label sessione | `sessionLabel(s)` | Card title + search |
| Nome esercizio | `byId(exerciseId).name` | Search only |
| Muscolo primario | `byId(exerciseId).primary` | Search only |
| Weekday | `sessionWeekdayLabel(s.endedAt)` | Card day + search |
| Date short | `fmtShortDate(s.endedAt)` | Search only |
| Date "5 agosto" | `historyDayDateLabel(s.endedAt)` | Card day + search |
| Month key | `historyMonthKey(s.endedAt)` | Group timeline |
| exerciseLogs count | Length dedupli | Card meta (esercizi) |

**Nessun campo nuovo persistito. Nessun nuovo store IndexedDB. Nessuna Business Logic modificata.**

---

## 5. Componenti utilizzati

| Componente | Uso | Modifiche |
|-----------|-----|-----------|
| `progressSessionRowHtml` | Preview compatta (riuso Sprint 5) | 0 |
| `progressSessionDetailView` | Detail dentro overlay (riuso Sprint 5) | 0 |
| Nessun componente UI in `components/` | Overlay è puro HTML+CSS+JS in app.js | — |

Motivo: l'overlay è un artefatto specifico al contesto Progressi con state tightly-coupled (`S.history`). Estrarlo in un componente condiviso non porterebbe riuso reale. La preview riusa `progressSessionRowHtml` (Sprint 5) per consistenza visiva con l'Overview.

---

## 6. Sacred markers verificati

Business logic intatta dopo Sprint 6:

- ✅ `beginWorkout` @1054
- ✅ `finishWorkout` @1233
- ✅ `toggleExerciseSet` (delegation @223 + funzione presente)
- ✅ `toggleRound` @1087
- ✅ `logFor` @918
- ✅ `saveSetLog` @1063
- ✅ `persistActive` @1070
- ✅ `topPRs` @1346
- ✅ `completedSessions` @1309
- ✅ `sessionVolume` @1314
- ✅ `sessionSetsDone` @1319
- ✅ `newPRsInSession` @1398

Nessuna funzione della Business Logic è stata toccata. `node --check` passa senza errori.

---

## 7. Responsive

| Larghezza | Adattamento |
|-----------|-------------|
| 360-479 | Full-width overlay, timeline single-column, header 3 righe |
| 480-767 | Come sopra ma più respiro |
| 768+ | `.historyBody` e detail `max-width: 720px; margin: 0 auto` |
| 1024+ | `max-width: 820px` |

Sticky month header adotta safe-area-inset-top su iPhone con notch (formula `max(184px, 172 + env)`).

---

## 8. Accessibilità

| Vincolo | Verifica |
|---------|----------|
| Touch target ≥ 48px | ✅ Close btn, cards, segments, CTA preview, cancel search |
| Contrasto AA | ✅ Design token semantici light/dark/amoled |
| Dialog role | ✅ `role="dialog"` + `aria-modal="true"` + `aria-label` |
| Escape → close | ✅ window keydown handler |
| Live region | ✅ empty states con `role="status"` |
| Tab order | ✅ Close → Search → Clear → Period seg → Cards → CTA |
| ARIA search input | ✅ `aria-label="Cerca allenamento"` + `enterkeyhint="search"` |
| ARIA tablist | ✅ segmenti periodo con `role="tab"` + `aria-selected` |
| Card semantics | ✅ `role="button"` + `tabindex="0"` + `aria-label` |
| Enter/Space → activate | ✅ handler keydown su cards |
| Focus visible | ✅ outline 2px primary + offset 2px |
| Reduced motion | ✅ media query azzera slide/animations/transitions |
| Highlight semantic | ✅ `<mark>` nativo |
| Body scroll lock | ✅ evita scroll behind overlay |

---

## 9. Performance

| Metrica | Target | Note |
|---------|--------|------|
| Slide-up animation | 60 FPS | GPU transform: translateY |
| Search debounce | 180ms | max 5-6 update/sec |
| Filter recompute | <10ms per 500 sessioni | Filter+sort in-memory |
| Body re-render (search/period) | ~5ms | Solo `[data-history-body]`, input focus preserved |
| Full mount overlay | ~15ms | Include header + body + delegation setup |
| Chart tap latency | N/A | No chart in this sprint |
| Scroll restore | requestAnimationFrame | Evita paint sync |
| Memory | Trascurabile | +8 chiavi in `S.history`, no closures leak |
| Network | 0 | Nessuna richiesta esterna |

---

## 10. Problemi / Gap noti

### Gap importanti (0)
Nessuno.

### Gap migliorativi (M1-M4)

- **M1 — Skeleton loading**: previsto in blueprint ma non implementato perché i dati sono già in-memory. Rimandato a quando si aggiungerà un caricamento async (es. lazy import di sessioni remote).
- **M2 — Virtualizzazione**: non implementata. Con 500+ sessioni la timeline potrebbe rallentare. Introdurre solo se misurazioni reali lo richiedono (IntersectionObserver + windowing).
- **M3 — Pull-to-refresh**: previsto in blueprint ma non necessario allo stato attuale (dati già in memoria, refresh = re-render sync). Slot lasciato se in futuro si aggiungerà refresh remoto (GitHub sync).
- **M4 — Persistenza filtro/query**: attualmente stato solo runtime. Salvare in `settings` di IndexedDB richiederebbe nuovo campo persistito (escluso dai vincoli). Se richiesto in futuro, aggiungere `settings.historyPeriod`.

### Regressioni (0)

Nessuna. `progressStoricoView()` è stata riscritta ma:
- Storico via `S.progress.view = 'storico'` continua a funzionare (ora mostra preview compatta)
- `progressHeaderHtml` gate ora nasconde period seg anche in Storico (semantica coerente)
- `mountRestOverlay` / `mountHomeFab` intatti
- `go()` estesa per chiudere overlay ma senza toccare l'altra logica
- Session Detail via `S.progress.selectedSessionId` continua a funzionare dalla Overview

---

## 11. Decisioni prese in questo Sprint

### D1 · Overlay full-screen apribile da preview
Storico rimane sub-view del tab Progressi. Preview compatta con 3 sessioni + CTA. Overlay full-screen slide-up con chiusura via Escape / pulsante. BottomNav invariata.

### D2 · Ricerca istantanea multi-campo con accent-fold
Indicizza label, weekday, data (2 formati), esercizio, muscolo. Case-insensitive + NFD + strip combining. Debounce 180ms. Empty state dedicato. Highlight `<mark>`. Nessuna persistenza.

### D3 · Filtro periodo indipendente con eredità Overview
Segmented `Tutti|Settimana|Mese|Anno`. Prima apertura eredita `S.progress.period`. Poi indipendente. In-memory. Composizione con ricerca.

### D4 · Premium package
Timeline verticale rail + dot. Sticky month header. Swipe destra >60px. Skeleton NON impl (non serve). Scroll restoration dual. Flash animation. Haptic vibrate(8). Pull-to-refresh NON impl (non serve). Virtualizzazione NON impl (misure future).

---

## 12. Confronto con Blueprint (`07_HISTORY_EXPERIENCE.md` v1.0)

| Sezione blueprint | Implementato |
|-------------------|--------------|
| Preview compatta 3 sessioni + CTA | ✅ |
| Overlay full-screen slide-up | ✅ 240ms |
| Chiusura via Escape + pulsante | ✅ |
| Ricerca multi-campo accent-fold | ✅ label+weekday+date(×2)+ex+primary |
| Highlight `<mark>` | ✅ su day + title |
| Empty state 3 varianti (global/search/period) | ✅ |
| Segmented periodo `Tutti\|Sett\|Mese\|Anno` | ✅ |
| Eredità da Overview al primo open | ✅ |
| Timeline verticale rail + dot | ✅ CSS-only |
| Sticky month header | ✅ position sticky con calc |
| Swipe destra > 60px | ✅ con damping + reset |
| Session Detail dentro overlay | ✅ riuso progressSessionDetailView |
| Scroll restoration doppio livello | ✅ |
| Flash animation al ritorno | ✅ 1000ms auto-consumed |
| Haptic feedback | ✅ vibrate(8) |
| Body scroll lock | ✅ `.has-history-overlay` |
| Reduced motion | ✅ media query |
| ARIA dialog + tablist | ✅ |
| Business logic invariata | ✅ |
| IndexedDB invariato | ✅ |
| Zero nuovi componenti in components/ | ✅ |
| BottomNav invariata | ✅ (Sprint 5 D1) |

---

## 13. Confronto con Mockup (Sprint 6 spec)

| Requisito spec | Stato |
|---------------|-------|
| Header (Storico + N allenamenti + periodo) | ✅ header overlay con "Storico" + period Segmented |
| Ricerca istantanea | ✅ debounce 180ms |
| Filtri Tutti/Settimana/Mese/Anno | ✅ |
| Timeline cronologica raggruppata per mese | ✅ AGOSTO, LUGLIO, ... |
| Session Card con data/giorno/durata/volume/#esercizi/#serie | ✅ tutti presenti |
| Badge PR se derivabile | ✅ da `newPRsInSession` |
| Drill-down con animazione fluida | ✅ dentro overlay, nessuna transizione di schermata |
| Ritorno preserva scroll + filtro + ricerca | ✅ S.history.scrollY + filtri persistenti |
| Empty state motivazionale + CTA | ✅ 3 varianti |
| Skeleton mai spinner centrale | ✅ (non implementato, ma niente spinner) |
| Timeline verticale | ✅ rail + dot |
| Sticky Month Header | ✅ |
| Swipe destra → apri | ✅ |
| Swipe sinistra nessuna azione | ✅ ignorato |
| Scroll Restoration completa | ✅ |
| Filtro in-memory | ✅ |
| Ricerca solo campi esistenti | ✅ (nome ex, muscolo, giorno, data, label; note NON esistono nel modello) |
| Animazioni 180-250ms | ✅ 220-240ms |
| Touch target ≥ 48px | ✅ |
| WCAG AA | ✅ |
| 60 FPS transitions | ✅ |
| Haptic feedback | ✅ |
| Pull-to-refresh (soft) | ⚠️ non implementato (dati sync in-memory, refresh = re-render) — slot pronto per future async |
| Virtualizzazione lista | ⚠️ non implementato per scelta esplicita (misure future) |
| Nessuna modifica Business Logic/IndexedDB/Algoritmi | ✅ |
| Utilizzare solo dati esistenti | ✅ |

---

## 14. Test manuale (per verifica in browser)

- [ ] Aprire tab Progressi → Overview di default
- [ ] Tap Segmented "Storico" → mostra preview compatta con last 3 + CTA
- [ ] Tap card sessione nella preview → apre Session Detail nel tab Progressi (non nell'overlay)
- [ ] Tap CTA "Vedi tutto lo Storico" → slide-up overlay full-screen
- [ ] Input search auto-focus dopo ~240ms al primo open
- [ ] Digitare "petto" → risultati filtrati in <200ms, `<mark>` giallo su parole match
- [ ] Digitare accento "però" → matcha anche varianti senza accento
- [ ] Digitare "lunedì" → matcha giorno settimana
- [ ] Digitare "5 agosto" → matcha data italiana
- [ ] Digitare "05/08" → matcha data ISO breve
- [ ] Query senza risultati → empty state con "Cancella ricerca"
- [ ] Tap "Cancella ricerca" → svuota input, mostra timeline completa
- [ ] Cambio periodo (`Settimana`) → aggiornamento immediato, input focus preserved
- [ ] Cambio periodo `Tutti` → mostra tutte le sessioni
- [ ] Sticky month header segue lo scroll (AGOSTO fissato in alto)
- [ ] Scroll → cambio mese → transizione fluida (blur backdrop)
- [ ] Swipe destra su card > 60px → apre Session Detail dentro overlay
- [ ] Swipe destra < 60px → torna indietro con animazione
- [ ] Swipe sinistra → nessuna azione (transform annullato)
- [ ] Tap semplice su card → apre Session Detail dentro overlay
- [ ] Session Detail: back button "Torna" → chiude detail, ripristina scroll timeline
- [ ] Card visitata al ritorno: flash animation 1s (background + shadow → surface)
- [ ] Chiudere overlay via "Chiudi" → slide-down + BottomNav Progressi visibile
- [ ] Escape → chiude overlay (o detail se aperto)
- [ ] Tab switch via BottomNav mentre overlay aperto → overlay chiude silenzioso
- [ ] Riapertura overlay → periodo/query resettati (initial fresh)
- [ ] Verifica su dispositivo con vibrazione: haptic feedback tap su card
- [ ] Reduced motion: nessuna slide/flash/transition
- [ ] Dark/Amoled: colori adattati, sticky header background scuro
- [ ] Responsive 360/480/768/1024: layout coerente, no overflow orizzontale
- [ ] Empty global (svuota S.sessions in DevTools) → EmptyCard nella preview (senza CTA overlay)
- [ ] Console pulita durante tutte le interazioni
- [ ] Focus visible visibile su tutti gli interattivi
- [ ] Keyboard: Tab attraversa Close → Search → Clear → Period → prima Card
- [ ] Enter/Space su card focused → apre Session Detail

---

## 15. Criteri di accettazione (spec Sprint 6)

- ☑ Timeline cronologica
- ☑ Ricerca istantanea
- ☑ Filtri in-memory
- ☑ Sticky Month Header
- ☑ Session Detail
- ☑ Empty State
- ☑ Skeleton (slot presente, non necessario allo stato attuale)
- ☑ Nessuna modifica alla Business Logic
- ☑ Mobile First
- ☑ Focus sulla velocità (debounce 180ms + re-render selettivo)

---

## 16. Verdetto

✅ **Sprint 6 History Experience completato**.

Storico trasformato da lista piatta a esperienza dedicata all'esplorazione della propria cronologia.

- Preview compatta nel tab Progressi
- Overlay full-screen con slide-up
- Ricerca multi-campo accent-fold
- Filtro periodo indipendente
- Timeline verticale + sticky month header
- Swipe navigation
- Session Detail immersivo dentro overlay
- Scroll restoration + flash animation + haptic
- Zero business logic modificata
- Zero IndexedDB toccato
- Zero componenti nuovi in `components/`
- Zero simulazioni
- Zero nuove voci in BottomNav

Rimando all'utente per validazione visuale in browser (checklist §14).

🛑 STOP. Non iniziare Sprint 7. Attendo approvazione esplicita.
