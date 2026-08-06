# 06_PROGRESS_SCREEN.md

Versione 5.0 (Sprint 5 · 2026-08-05)

---

# Filosofia

Overview → Insight → Drill-down.

L'utente vede prima solo:

- L'insight del periodo (una frase, la risposta immediata)
- I KPI principali
- I due grafici che rispondono alle due domande fondamentali: "Mi alleno con costanza?" e "Sto aumentando il volume?"
- Le ultime sessioni

Ogni ulteriore dettaglio richiede un tap.

Nessuna schermata mostra tutte le informazioni contemporaneamente.

Obiettivo: capire i propri progressi in meno di 5 secondi, poi drill-down solo quando serve.

---

# Decisioni Sprint 5 (2026-08-05)

Approvate dall'utente e vincolanti per ogni futura modifica ai Progressi.

1. **Nav "Segmented + drill-down"** — La schermata Progressi diventa il punto centrale per tutta l'analisi. Segmented interno `Overview | Storico | Record`. Session Detail NON è nel segmented: si apre in drill-down da qualsiasi card sessione. Bottom Navigation resta invariata (no nuove voci). Il ritorno riporta esattamente allo scroll precedente.
2. **Grafici bilanciati Overview + timeline in Record** — Overview mostra Weekly Volume (BarChart) + Frequency Heatmap. PR Timeline appartiene solo alla sezione Record. Nessuna duplicazione tra sezioni. Ogni grafico è interattivo: tap → dettaglio inline nel `[data-chart-caption]`, nessun cambio di schermata.
3. **Filtro periodo in-memory** — Segmented `Settimana | Mese | Anno` (default Settimana). Applicato in tempo reale a KPI, Weekly Volume, Frequency Heatmap, Insight Card, Ultimi allenamenti. NON applicato alla PR Timeline (che mostra sempre l'intera cronologia). Nessuna scrittura in IndexedDB — stato tenuto in `S.progress.period` finché l'utente non lascia il tab Progressi.
4. **Session Detail: Hero + KPI + esercizi + PR** — Sola lettura. Card esercizio con head sempre visibile (nome, muscolo, volume, N serie). Tap sulla card → espansione animata che mostra ogni serie (Set N · kg × reps · ✓/○). Badge PR sull'esercizio se ricavabile. Nessun input, picker o azione di modifica. Le card mantengono aperto/chiuso durante la navigazione tramite `S.progress.openExercises`.

---

# Vincoli

NON modificare:

- Business Logic (`beginWorkout`, `finishWorkout`, `toggleExerciseSet`, `toggleRound`, `logFor`, `persistActive`, `saveSetLog`)
- IndexedDB `fit-circuit-tracker-v18-optional-day` v2
- Modello dati (S shape, exerciseLogs, sessions)
- Algoritmi (progressione, calcolo volume, streak, PR)
- Persistenza (Store.put, refresh)
- Timer

Sostituire esclusivamente:

- Rendering (rewrite `stats()` come router)
- Layout (progressV5 con header sticky, KPI grid, chart cards, liste)
- Componenti aggiuntivi (grafici SVG inline per interattività, riuso di StatisticCard/Button/EmptyCard)
- Animazioni (fadeUp entrata sezioni, expand/collapse ex card, slideIn detail)
- Microinterazioni (tap barra chart → caption live, tap card sessione → drill-down)

---

# Struttura tab Progressi

```
Progressi (S.tab = 'progressi')
│
├── Header sticky (progressHeader)
│   ├── Segmented view: [Overview | Storico | Record]
│   └── Segmented period: [Settimana | Mese | Anno]   (nascosto in Record)
│
├── VIEW = 'overview' (default)
│   ├── Insight Card (progressInsight, se ci sono dati)
│   ├── KPI grid × 3 (Volume, Serie, Workout del periodo)
│   ├── Weekly Volume chart (progressChartCard + BarChart interattivo)
│   ├── Frequency Heatmap (progressChartCard + Heatmap interattivo + legenda)
│   └── Ultimi allenamenti (progressList, max 5 sessioni del periodo)
│
├── VIEW = 'storico'
│   └── Sessioni raggruppate per giorno (progressHistoryGroup) — tap → drill-down
│
├── VIEW = 'record'
│   ├── PR Timeline (progressChartCard + LineChart interattivo)
│   │   Serie: max kg dell'esercizio con più volume totale, ogni volta che è stato superato
│   └── Lista Top PR (progressPrRow × N, top 20)
│
└── DRILL-DOWN Session Detail (S.progress.selectedSessionId !== null)
    ├── Back button (progressBack)
    ├── Hero (data + giorno + durata + badge N PR)
    ├── KPI × 3 (Volume, Serie, Durata)
    └── Timeline esercizi (progressExCard × N, expand/collapse)
        └── progressSetRow × M (Set N · kg × reps · ✓/○)
```

---

# State (S.progress)

Aggiunto in `S`, in-memory, mai persistito.

```js
S.progress = {
    view: 'overview' | 'storico' | 'record',   // default 'overview'
    period: 'week' | 'month' | 'year',         // default 'week'
    selectedSessionId: string | null,          // drill-down attivo se non null
    openExercises: { [sessionId::exId]: true },// ex card espansi in Session Detail
    scrollY: { [viewName]: number }            // ripristino scroll on close-session
};
```

---

# Helpers puri (`app.js`)

Tutti in-memory, zero side-effect, zero IndexedDB.

- `progressPeriodBounds(period)` → `{start, end}` timestamps del periodo corrente
- `progressPreviousPeriodBounds(period)` → periodo precedente (per confronto Insight)
- `sessionsInRange(start, end)` → filter di `completedSessions()` per data
- `progressPeriodLabel(period)` → 'settimana' | 'mese' | 'anno'
- `progressKpi(period)` → `{workouts, volume, sets, duration}` aggregati
- `weeklyVolumeBars(period)` → `{data, labels, title, buckets}` per BarChart
- `frequencyHeatmapData()` → 56 celle (ultime 8 settimane) con `{level, count, iso, key}`
- `progressInsight(period)` → `{tone, eyebrow, title, body}` o `null` (confronto vs periodo precedente)
- `bestExerciseByVolume()` → id esercizio con volume totale storico più alto (per PR Timeline)
- `prTimelineForExercise(exId)` → `{exName, primary, data, labels, history}`
- `sessionExercisesGrouped(session)` → array `[{id, name, primary, sets, doneCount, totalSets, volume, pr}]`
- `sessionWeekdayLabel(iso)` → 'Domenica' | 'Lunedì' | …
- `progressBarChartHtml(cfg)` / `progressHeatmapHtml(cfg)` / `progressLineChartHtml(cfg)` — grafici SVG inline con `data-chart-id`/`data-chart-idx` per interattività

---

# Grafici interattivi

Ogni chart è composto da:

1. `.progressChart` (container con `data-chart-container="<id>"`)
2. SVG con `<g>` (barre/dot) o `<button>` (celle heatmap) marcati `data-chart-id` + `data-chart-idx`
3. `.progressChartCaption` (elemento `[data-chart-caption="<id>"]` con `aria-live="polite"`)

Tap su elemento chart:
- `chartHit = e.target.closest('[data-chart-id]')` intercetta il click
- `onProgressChartTap(chartId, idx, elem)` aggiorna `.is-active` sull'elemento e riscrive il testo del caption in place
- Nessun `render()`, nessun cambio di schermata

Chart supportati:
- `weeklyVolume` — BarChart, caption "**GG/MM** · N kg · N allenamenti"
- `freq` — Heatmap, caption "**GG/MM** · N allenamenti"
- `prTimeline` — LineChart, caption "**GG/MM** · N kg PR"

---

# Insight Card

Confronta `progressKpi(period)` con `sessionsInRange(previousPeriod)`.

Regole:
- Nessun workout nel periodo → nessuna Insight Card
- Nessun workout nel periodo precedente → tono 'info' "Primo periodo tracciato"
- volume corrente > precedente → tono 'success' con +N% (border verde)
- volume corrente < precedente → tono 'warn' con -N% (border arancione)
- Uguale → tono 'info' "Volume stabile" (border viola primario)

L'insight NON è mai un giudizio negativo. Punta sempre a incoraggiare.

---

# Filtro periodo

Segmented `Settimana | Mese | Anno`.

Applicazione:
- Default: `week`
- `progressGoPeriod(p)` cambia `S.progress.period` e chiama `render()`
- Persistenza: **solo nella sessione corrente del tab**. Cambiando tab (BottomNav) il periodo NON viene resettato ma resta in memoria finché la pagina è viva
- Sezione Record NON riceve il filtro (nessun segmented periodo mostrato)

Il filtro è applicato a:
- KPI grid (progressKpi)
- Weekly Volume chart (weeklyVolumeBars)
- Insight Card (progressInsight)
- Ultimi allenamenti (5 sessioni del periodo)
- Storico completo (raggruppato per giorno)

NON applicato a:
- Frequency Heatmap (sempre ultime 8 settimane per pattern visivo consistente)
- PR Timeline (sempre intera cronologia)
- Lista Top PR (sempre lifetime)

---

# Session Detail

Aperto da qualsiasi card sessione via `data-action="open-session-detail" data-session-id="…"`.

Rendering: `progressSessionDetailView(session)`.

Struttura:
1. Back button (`.progressBack` con `data-action="close-session-detail"`)
2. Hero: eyebrow "Giorno · GG/MM", h1 = sessionLabel, meta "Durata Xm" + badge "N PR" se presenti
3. KPI × 3 (Volume, Serie, Durata) via StatisticCard
4. Timeline: per ogni esercizio in `sessionExercisesGrouped`:
   - Head sempre visibile: nome, muscolo, N/M serie, volume, badge PR se applicabile
   - Body espandibile: per ogni serie → `.progressSetRow` (mark ✓/○ · "Serie N" · "kg × reps")

Nessuna azione di modifica, nessun input, nessun picker.

Le card ricordano il loro stato aperto/chiuso via `S.progress.openExercises[sessionId::exId] = true`.

Scroll: dopo `close-session-detail`, viene ripristinato `S.progress.scrollY[view]` (salvato al momento del tap sulla sessione).

---

# Empty state

Quando `completedSessions().length === 0`:

```
UI.EmptyCard({
    icon: 'chart',
    title: 'Nessun allenamento ancora',
    body: 'Completa il tuo primo workout per vedere i tuoi progressi qui.',
    action: 'Inizia il tuo primo allenamento' → go('home')
})
```

Nessun grafico vuoto, nessuna colonna KPI a zero, nessun segmented.

Empty state secondario per Storico/Record quando ci sono dati generali ma non nel periodo/senza record:

```
.progressEmpty
├── h3 "Nessun allenamento nel <periodo>" o "Nessun record ancora"
└── p muted (spiegazione)
```

---

# Responsive

Breakpoint attivi:

- 390: base mobile-first
- 480 e sotto: `.progressKpi` collassa a 1 colonna
- 768: `.progressV5` max-width 720px centrato, `.progressChartCard` con padding maggiore
- 1024: `.progressV5` max-width 820px
- Layout resta verticale su tutte le larghezze

---

# Accessibilità

- Touch target ≥ 48px per tutti gli elementi cliccabili (segmented, sessione, back, ex card head, celle heatmap, chart bars/dots)
- Contrasto AA (token semantici light/dark/amoled)
- ARIA:
  - `.progressV5` — `aria-label="Progressi"`
  - `.c-segmented` — `role="tablist"` + `aria-label` + segmenti con `role="tab"` + `aria-selected`
  - `.progressInsight` — `aria-label="Insight periodo"`
  - `.progressChartCard` — `aria-label` descrittivo
  - `.progressChart__svg` — `role="img"` + `aria-label`
  - `.progressChart__bar`, `.progressChart__dot` — `role="button"` + `tabindex="0"` + `aria-label`
  - `.progressHeatmap__cell` — `<button>` reale con `aria-label` "GG/MM: N allenamenti"
  - `.progressChartCaption` — `aria-live="polite"` per annunciare updates
  - `.progressSessionRow` — `<button>` con `aria-label`
  - `.progressExCard__head` — `<button>` con `aria-expanded`
  - `.progressDetailHero__badge` — `aria-label` "N nuovi personal record"
  - `.progressBack` — `aria-label="Torna ai progressi"`
- Focus visible: outline 2px primary + offset 2px su tutti gli interattivi
- Keyboard: tutti gli interattivi sono `<button>` reali o `<g role="button" tabindex="0">`; Enter/Space attivano
- Reduced motion: animazioni e transizioni azzerate via media query

---

# Performance

- 60 FPS attesi: solo `opacity`, `transform`, `max-height`, `background-color` (GPU-friendly)
- CLS ≈ 0: dimensioni fisse via padding/gap tokens, chart svg `viewBox` responsive
- Nessuna nuova richiesta di rete
- Nessun asset extra
- Chart tap: nessun re-render globale, solo classList toggle + `innerHTML` locale del caption
- Header sticky: `backdrop-filter` con `blur(var(--blur-navigation))` — GPU
- Interval/animation frame: nessuno oltre al timer esistente

---

# Stati supportati

| Stato | Trigger | Rendering |
|-------|---------|-----------|
| No UI | !UI.StatisticCard | Fallback "Caricamento…" |
| Nessun dato | !completedSessions().length | EmptyCard "Inizia il tuo primo allenamento" |
| Overview default | S.progress.view='overview' | Insight + KPI + Weekly + Heatmap + Ultimi |
| Storico | S.progress.view='storico' | Sessioni raggruppate per giorno |
| Record | S.progress.view='record' | PR Timeline + Top 20 PR |
| Session detail | S.progress.selectedSessionId !== null | Hero + KPI + Timeline esercizi |
| Nessun workout nel periodo | !sessionsInRange(...).length | `.progressEmpty` con suggerimento di cambiare filtro |
| Nessun PR | !topPRs().length | `.progressEmpty` "Nessun record ancora" |
| Timeline PR insufficiente | prTimelineForExercise(...).data.length < 2 | Chart empty state "Dati insufficienti" |

---

# Cosa NON fare

- Aggiungere voci alla BottomNavigation
- Modificare Business Logic per aggiungere ordinamento personalizzato/filtri complessi
- Salvare stato UI in IndexedDB
- Introdurre nuovi modelli dati per Insight/Trend
- Simulare dati (mock, seed random) — solo `S.sessions` reali
- Duplicare grafici tra sezioni (PR Timeline solo in Record, Weekly Volume solo in Overview)
- Aggiungere edit/delete/picker nel Session Detail
- Usare `alert()` / `confirm()` / `prompt()`

---

# Checklist Sprint 5

☐ Segmented Overview/Storico/Record funzionante

☐ Segmented periodo Settimana/Mese/Anno funzionante nell'Overview e Storico

☐ Insight Card mostra confronto vs periodo precedente

☐ Weekly Volume BarChart interattivo (tap barra → caption)

☐ Frequency Heatmap interattiva (tap cella → caption)

☐ PR Timeline LineChart interattivo (tap punto → caption)

☐ Session Detail drill-down con back button

☐ Ex card espansione set-by-set persistente

☐ Bottom Navigation sempre visibile

☐ Empty state per zero dati + per zero dati nel periodo

☐ Reduced motion supportato

☐ Business logic invariata

☐ IndexedDB invariato

☐ Zero nuovi componenti creati

☐ Solo dati reali (nessuna simulazione)

---

# Obiettivo finale

Aprendo Progressi, l'utente deve vedere in 2 secondi:

- **Come sta andando** (Insight Card, una frase)
- **I numeri chiave** (3 KPI)
- **La costanza visiva** (Heatmap)
- **La progressione** (BarChart)

Se vuole di più, tap. Session Detail per rivedere una sessione. Sezione Record per la timeline dei suoi PR.

Nessun sovraccarico. Nessuna colonna vuota. Nessun grafico simulato.

Solo la sua vera storia di allenamento.
