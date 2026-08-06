# 07_HISTORY_EXPERIENCE.md

Versione 1.0 (Sprint 6 · 2026-08-06)

---

# Filosofia

Lo Storico non è una lista, è il diario personale degli allenamenti.

Nel tab Progressi rimane visibile solo una **preview** compatta delle ultime sessioni. L'esperienza completa (ricerca, filtri, sticky month, swipe, drill-down) vive in un **overlay full-screen** dedicato che si apre da un CTA esplicito.

Applicare la filosofia:

Overview → Preview Storico → Overlay Storico → Session Detail

mai il contrario. Non aggiungere nuove voci in BottomNav (Sprint 5 D1 rispettato).

---

# Decisioni Sprint 6 (2026-08-06)

Approvate dall'utente e vincolanti per ogni futura modifica allo Storico.

1. **Overlay full-screen apribile da preview** — Il tab Progressi ospita una preview compatta con le ultime 3 sessioni + CTA "Vedi tutto lo Storico". Il tap sul CTA apre un overlay full-screen con slide-up (240ms), che contiene ricerca, filtri, timeline verticale, sticky month header, swipe navigation e Session Detail in drill-down. Chiusura via pulsante "Chiudi" o `Escape`. BottomNav resta sempre coerente con il tab Progressi (l'overlay è visivamente sopra ma logicamente parte del tab Progressi).
2. **Ricerca istantanea multi-campo con accent-fold** — Indicizza in-memory: label sessione (`sessionLabel`), giorno settimana, data (`dd/mm/yyyy` e "5 agosto"), nome esercizio (`byId(exerciseId).name`), muscolo primario (`.primary`). Match case-insensitive con normalizzazione NFD + strip combining marks (accenti). Debounce 180ms. Empty state ricerca dedicato con CTA "Cancella ricerca". Nessuna persistenza. Highlight `<mark>` sul testo corrispondente.
3. **Filtro periodo indipendente con eredità** — Segmented `Tutti | Settimana | Mese | Anno`. `S.history.period` è indipendente da `S.progress.period`. Alla **prima apertura** dell'overlay eredita il valore corrente di `S.progress.period` (default: `week`). Da quel momento diventano indipendenti. Il filtro periodo si applica sopra i risultati già filtrati dalla ricerca (composizione: search AND period).
4. **Premium package** — Timeline verticale (rail decorativo + dot per sessione) + Sticky Month Header (secondo livello di stickiness sotto l'header) + Swipe destra su card (>60px → apre Session Detail; nessuna azione distruttiva) + Skeleton NON implementato (dati sync in-memory, no flash) + Scroll restoration su chiusura sia overlay→preview sia detail→timeline + Flash animation ~1s sulla card ultima visualizzata al ritorno da detail + Haptic feedback leggero (8ms) all'apertura di una sessione + Pull-to-refresh NON necessario (dati sono già in memoria, refresh = re-render). Virtualizzazione NON implementata (Sprint 5 note: introdurre solo se il DB tipico supera 200 sessioni).

---

# Vincoli

NON modificare:

- Business Logic (`beginWorkout`, `finishWorkout`, `toggleExerciseSet`, `toggleRound`, `logFor`, `persistActive`, `saveSetLog`)
- IndexedDB `fit-circuit-tracker-v18-optional-day` v2
- Modello dati (S shape, exerciseLogs, sessions)
- Algoritmi (progressione, calcolo volume, streak, PR)
- Persistenza (Store.put, refresh)
- Timer
- BottomNavigation (Sprint 5 D1)
- Home v3 / Workout v4 / Progress v5 / Rest overlay / Profilo redesign

Sostituire esclusivamente:

- `progressStoricoView()` → ora ritorna solo `historyPreviewHtml()` (preview compatta)
- Aggiungere overlay full-screen come renderer isolato (`historyOverlayInnerHtml`, `mountHistoryOverlay`)
- Nuova sezione CSS `HISTORY v6 (Sprint 6)` in `styles.css`
- Nuovo root DOM `#historyOverlayRoot` in `index.html` (accanto a `restOverlayRoot` e `fabRoot`)

---

# Struttura DOM

```
#view                           (tab attivo: 'progressi')
└── .progressV5
    ├── .progressHeader         (view Segmented; period Segmented nascosto in Storico/Record)
    └── (storico) .historyPreview
        ├── header              (eyebrow "Storico" + title + meta "N allenamenti totali")
        ├── .progressList__stack  (ultimi 3 progressSessionRow)
        └── button.historyPreview__cta  (data-action="history-open")

#historyOverlayRoot             (fuori da #view, sibling di bottomNavRoot)
└── .historyOverlay[.is-open]   (fixed inset 0, z-index 90, slide-up)
    ├── (list mode)
    │   ├── header.historyHeader (sticky top:0)
    │   │   ├── .historyHeader__top   (Chiudi + Storico + spacer)
    │   │   ├── .historySearch        (icon + input + clear button)
    │   │   └── .c-segmented.historyPeriod  (Tutti|Sett|Mese|Anno)
    │   └── .historyBody[data-history-body]
    │       ├── (empty global) .historyEmpty  (se completedSessions vuoto)
    │       ├── (empty search) .historyEmpty  (se query attiva senza risultati)
    │       ├── (empty period) .historyEmpty  (se periodo senza risultati)
    │       └── .historyTimeline
    │           └── .historyMonthWrap × N
    │               ├── header.historyMonth  (sticky sotto l'header, es. "AGOSTO 2026")
    │               └── .historyMonth__list  (rail + card × N)
    │                   └── article.historyCard[data-history-card]
    │                       ├── span.historyCard__dot     (nodo timeline)
    │                       ├── div.historyCard__body     (day, title, meta, badges)
    │                       └── span.historyCard__chev
    └── (detail mode)
        └── .progressDetail    (riuso `progressSessionDetailView` con back → 'close-history-session')
```

---

# State (S.history)

Aggiunto in `S`, in-memory, mai persistito.

```js
S.history = {
    open: false,                  // overlay visibile o no
    query: '',                    // ricerca corrente (case-insensitive, accent-fold)
    period: null,                 // 'all' | 'week' | 'month' | 'year' (null = ancora non aperto)
    selectedSessionId: null,      // detail attivo dentro overlay
    scrollY: 0,                   // scroll dell'overlay (per restore su close-detail)
    parentScrollY: 0,             // scroll del tab Progressi prima dell'apertura (restore su close-overlay)
    lastSessionId: null,          // ultima sessione visualizzata (flash animation al ritorno)
    initialized: false,           // 'fresh' al primo mount → auto-focus input
    closing: false                // (deprecato, non usato)
};
```

`S.history.period === null` significa "mai aperto prima". Al primo `historyOpen()` viene inizializzato con `S.progress.period` (default: `week`). Poi diventa indipendente.

---

# Helpers puri (`app.js`)

Tutti in-memory, zero side-effect, zero IndexedDB.

- `historyNormalize(s)` → lowercase + NFD + strip combining marks (accent-fold)
- `historyHighlight(text, query)` → esc + wrap in `<mark class="historyMark">` (accent-aware, 1:1 char mapping)
- `historyPeriodBounds(period)` → `{start, end}` — riuso di `progressPeriodBounds` per week/month/year + case `'all'` (0 → MAX_SAFE_INTEGER)
- `historyMonthKey(iso)` → "YYYY-MM"
- `historyMonthLabel(monthKey)` → "AGOSTO 2026"
- `historyDayDateLabel(iso)` → "5 agosto"
- `historyMatchSession(s, qn)` → true/false — match multi-campo pre-normalizzato
- `historyFilteredSessions()` → array ordinato desc, filtrato per period + query
- `historyGroupByMonth(list)` → `[{key, label, items: []}]` ordinato desc

# Renderer (`app.js`)

- `historyPreviewHtml()` → preview compatta per il tab Progressi
- `historyCardHtml(session, query)` → card timeline con dot, badges, highlight
- `historyEmptySearchHtml()` / `historyEmptyPeriodHtml()` / `historyEmptyGlobalHtml()` → tre empty distinti
- `historyBodyInnerHtml()` → contenuto dinamico dentro `[data-history-body]` (usato sia da mount che da re-render body-only)
- `historyDetailHtml(session)` → riuso di `progressSessionDetailView` con rimappa dell'action back
- `historyOverlayInnerHtml()` → shell overlay (header + body oppure detail)

# Mount + Actions (`app.js`)

- `mountHistoryOverlay()` → mount + delegation (click/input/keydown/touch), scroll restore, focus input al primo open, slide-up class
- `historyRerenderBodyOnly()` → aggiorna solo `[data-history-body]` per query/period changes (nessun teardown dell'input focus)
- `historyOpen()` / `historyClose()` → apre / chiude con animazione slide (220ms)
- `historySetQuery(q)` / `historyClearSearch()` → aggiornano `S.history.query` e re-render body
- `historySetPeriod(p)` → aggiorna `S.history.period` + toggle classi segmento (nessun re-render header)
- `historyOpenSession(id)` / `historyCloseSession()` → drill-down dentro l'overlay con scroll restore + flash + haptic

---

# Ricerca

Comportamento:

- Case-insensitive
- Accent-fold (NFD + strip U+0300–U+036F)
- Partial match (substring)
- Debounce 180ms su `input` event
- Empty query → mostra timeline completa (filtrata solo per periodo)
- Empty results con query → `historyEmptySearchHtml()` + CTA "Cancella ricerca"
- Enter su input → blur (nasconde tastiera)
- Auto-focus input al primo `historyOpen` (fresh)
- Highlight `<mark>` su `.historyCard__day` e `.historyCard__title` (i due campi sempre visibili)

Campi indicizzati (concatenati con `|` separator):

| Campo | Fonte |
|-------|-------|
| Label sessione | `sessionLabel(s)` |
| Giorno settimana | `sessionWeekdayLabel(s.endedAt)` — es. "Lunedì" |
| Data ISO breve | `fmtShortDate(s.endedAt)` — es. "05/08/2026" |
| Data italiana | `historyDayDateLabel(s.endedAt)` — es. "5 agosto" |
| Nome esercizi | `byId(exerciseId).name` (deduplicato) |
| Muscolo primario | `byId(exerciseId).primary` (deduplicato) |

Nessuna persistenza (`S.history.query` è solo runtime).

---

# Filtro periodo

Segmented `Tutti | Settimana | Mese | Anno`.

Applicazione:
- Default all'apertura: `S.history.period ?? S.progress.period` (di solito `'week'`)
- Dopo l'apertura: indipendente da Overview
- `historySetPeriod(p)` aggiorna solo `S.history.period` + toggle classi segmento; nessun mount full (via `historyRerenderBodyOnly`)
- Applicato in `historyFilteredSessions()` PRIMA della verifica match, come pre-filter temporale
- Composizione con ricerca: `hasQ AND hasPeriod` (entrambi devono passare)

`period === 'all'`: passa qualsiasi timestamp (start = 0, end = MAX_SAFE_INTEGER).

---

# Timeline verticale

Rail decorativo CSS-only (pseudo-elemento `::before` su `.historyMonth__list`):

```css
.historyMonth__list::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 12px; bottom: 12px;
    width: 2px;
    background: linear-gradient(180deg,
        color-mix(in oklab, var(--color-primary) 40%, transparent),
        color-mix(in oklab, var(--color-primary) 15%, transparent));
}
```

Ogni card ha un dot `.historyCard__dot` posizionato absolute sulla linea, con anello di respirazione.

---

# Sticky Month Header

Secondo livello di stickiness sotto l'header. Position: sticky con top calcolato per posizionarsi sotto l'header:

```css
.historyMonth {
    position: sticky;
    top: max(184px, calc(172px + env(safe-area-inset-top, 0)));
}
```

Formula: 12 (padding-top) + 44 (top row) + 12 (gap) + 48 (search) + 12 (gap) + 44 (period) + 12 (padding-bottom) + 1 (border) = 185px approx. Con safe-area la formula usa env-top al posto di 12.

Blur background per stacco visivo dal contenuto sotto (backdrop-filter).

---

# Swipe navigation

Solo swipe destra (`dx > 60px` con soglia direzionale `Math.abs(dx) > Math.abs(dy) * 1.4`). Nessuna azione distruttiva.

Handler in `mountHistoryOverlay`:
- `touchstart`: cattura card + posizione iniziale
- `touchmove`: applica `transform: translateX(damped)` con damping 0.6 e cap 120px, `preventDefault` solo se cancelable
- `touchend`: se `dx > 60` → animate to 60px + `historyOpenSession(id)` dopo 140ms; altrimenti reset con transizione 160ms
- `touchcancel`: reset immediato

Il tap resta sempre disponibile (event click su card). Il handler swipe non blocca il tap perché richiede movimento >8px per attivarsi.

Haptic feedback: `navigator.vibrate(8)` all'apertura sessione (se supportato).

---

# Scroll restoration

Due livelli:

1. **Overlay → Preview**: `S.history.parentScrollY = window.scrollY` all'apertura; ripristino via `window.scrollTo(0, y)` post-close.
2. **Detail → Timeline (dentro overlay)**: `S.history.scrollY = wrap.scrollTop` all'apertura session; ripristino post-close via `requestAnimationFrame(wrap.scrollTop = y)`.

Il tab Progressi rimane sempre nel DOM sotto l'overlay (Progressi = `#view` innerHTML), quindi il ripristino usa `window.scrollTo`.

---

# Flash animation

Al ritorno da Session Detail dentro l'overlay, la card della sessione appena visualizzata riceve `.historyCard--flash` per 1000ms:

```css
@keyframes historyFlash {
    0%   { background: color-mix(...primary 22%, surface); box-shadow: 0 0 0 3px color-mix(...primary 32%, transparent); }
    60%  { background: color-mix(...primary 8%, surface); }
    100% { background: surface; box-shadow: none; }
}
```

`S.history.lastSessionId` viene consumato: dopo il mount viene resettato via `setTimeout(1200)`.

---

# Empty state

Tre varianti:

| Trigger | Renderer | Contenuto |
|---------|----------|-----------|
| `completedSessions().length === 0` | `historyEmptyGlobalHtml` | "Il tuo diario è vuoto" (no CTA — l'utente è già dentro Progressi) |
| Query attiva senza risultati | `historyEmptySearchHtml` | "Nessun allenamento trovato" + CTA "Cancella ricerca" |
| Filtro periodo senza risultati (query vuota) | `historyEmptyPeriodHtml` | "Nessun allenamento nel periodo" (hint a cambiare filtro) |

Nella preview Storico (dentro Progressi), se globalmente vuoto mostra `.progressEmpty` (nessuna CTA che apra overlay — non serve).

---

# Skeleton

**Non implementato.** I dati sono già in memoria (`completedSessions()` è sync). L'apertura dell'overlay + render è sotto la soglia percepibile (~5ms). Lo skeleton è previsto in blueprint per casi di caricamento asincrono ma allo stato attuale non ce ne sono.

Slot pronto: se in futuro si aggiungesse un caricamento lazy, aggiungere `.historySkeleton` + `.historySkeleton__card` con shimmer animation.

---

# Responsive

- 360-479: single column, padding standard
- 480-767: come sopra ma con più respiro
- 768+: `.historyBody` e `.historyOverlay .progressDetail` con `max-width: 720px; margin: 0 auto`
- 1024+: `max-width: 820px`

Header sempre full-width per copertura visiva. Timeline scala fluidamente.

---

# Accessibilità

- **Overlay dialog**: `role="dialog"` + `aria-modal="true"` + `aria-label="Storico allenamenti"`
- **Close button**: `aria-label="Chiudi lo Storico"` + `Escape` key
- **Search input**: `aria-label="Cerca allenamento"` + `enterkeyhint="search"`
- **Clear button**: `aria-label="Cancella ricerca"`
- **Segmented periodo**: `role="tablist"` + `role="tab"` + `aria-selected`
- **Timeline**: cards `role="button"` + `tabindex="0"` + `aria-label="Apri dettagli sessione …"` + Enter/Space attivano
- **Empty states**: `role="status"` per annunci screen reader
- **Month header**: `aria-label` esplicito
- **Highlight `<mark>`**: mantiene la semantica sr-friendly nativa
- **Touch target** ≥ 48px su tutti gli interattivi (Chiudi, cards, segmenti, CTA)
- **Focus visible**: outline 2px primary + offset 2px
- **Body scroll lock**: `.has-history-overlay` blocca overflow del `<body>` quando overlay è aperto

---

# Performance

- 60 FPS attesi: solo `opacity`, `transform`, `backdrop-filter` (GPU-friendly)
- Overlay z-index 90 (sotto rest overlay che è al di sopra dei modali)
- Debounce input 180ms: max 5-6 update/sec durante typing
- Ricerca in-memory: `completedSessions()` è già cached, filtrato in <10ms anche con 500+ sessioni
- Re-render selettivo: query/period change ricostruiscono solo `[data-history-body]`, mantenendo focus sull'input
- Scroll restoration via requestAnimationFrame per evitare paint sync
- Zero re-render globale (`render()`) durante l'uso dell'overlay tranne su tab switch
- Nessuna richiesta di rete, nessun asset extra
- Body scroll lock evita jitter sotto l'overlay

---

# Stati supportati

| Stato | Trigger | Rendering |
|-------|---------|-----------|
| Preview vuota | `completedSessions().length === 0` | `.progressEmpty` (no CTA overlay) |
| Preview normale | ≥1 sessione | Preview con last 3 + CTA "Vedi tutto" |
| Overlay chiuso | `S.history.open === false` | Root vuoto |
| Overlay lista | `S.history.open && !selectedSessionId` | Header + Timeline (o empty stato) |
| Overlay detail | `S.history.open && selectedSessionId` | `progressDetail` con back mappato |
| Ricerca 0 risultati | `query.trim() && filtered.length === 0` | `historyEmpty` search + CTA |
| Periodo 0 risultati | `!query.trim() && filtered.length === 0` | `historyEmpty` period |
| Ritorno da detail | `lastSessionId set` | Card con `.historyCard--flash` animazione |

---

# Cosa NON fare

- Aggiungere una nuova voce Storico in BottomNavigation (violerebbe Sprint 5 D1)
- Persistere `S.history` in IndexedDB (nessun nuovo campo)
- Modificare `S.progress.period` da azioni dello Storico (indipendenza D3)
- Aprire Session Detail di Progressi dall'overlay (crea confusione con back state) — usare `historyOpenSession` che mantiene detail dentro overlay
- Modificare i componenti Charts condivisi (Sprint 5 principle)
- Aggiungere ricerca full-text con IndexedDB indexes (out of scope)
- Aggiungere azioni distruttive con swipe (eliminazione sessione, ecc.) — solo navigazione
- Duplicare `progressSessionDetailView` (riuso via `historyDetailHtml` che rimappa solo il close action)
- Introdurre virtualizzazione ora (rimandata a misure future)
- Salvare l'ultima query o l'ultimo periodo (D2/D3 stabiliscono stato solo runtime)

---

# Checklist Sprint 6

☐ Preview compatta con 3 sessioni + CTA visibile

☐ Overlay slide-up 220-240ms al tap CTA

☐ Chiusura overlay via pulsante "Chiudi" + `Escape`

☐ Ricerca istantanea multi-campo con debounce e accent-fold

☐ Highlight `<mark>` sui match visibili

☐ Empty state ricerca con CTA "Cancella ricerca"

☐ Empty state periodo distinto da search

☐ Filtro periodo `Tutti|Settimana|Mese|Anno` funzionante

☐ Period eredita da Overview al primo open, poi indipendente

☐ Timeline verticale con rail + dot su ogni card

☐ Sticky Month Header sotto l'header principale

☐ Swipe destra > 60px apre Session Detail

☐ Tap resta funzionale insieme a swipe

☐ Session Detail dentro overlay con back mappato

☐ Scroll restoration sia overlay→preview sia detail→timeline

☐ Flash animation sulla card di ritorno da detail

☐ Haptic vibrate(8) all'apertura sessione se supportato

☐ Body scroll lock quando overlay aperto

☐ BottomNav sempre visibile e reattiva (tab switch chiude overlay)

☐ Reduced motion azzera tutte le animazioni

☐ Business Logic invariata

☐ IndexedDB invariato

☐ Modello dati invariato

☐ Zero nuovi componenti in `components/`

---

# Obiettivo finale

L'utente apre Progressi e vede subito le ultime 3 sessioni. Se vuole approfondire tap sul CTA "Vedi tutto lo Storico" e si trova in un ambiente dedicato all'esplorazione del proprio diario: ricerca fulminea, filtri chiari, timeline che racconta la propria storia mese per mese, dettagli a un tap o a uno swipe.

Nessun sovraccarico. Nessuna lista piatta. Nessuna modifica invasiva.

Solo la sua vera cronologia, presentata come si merita.
