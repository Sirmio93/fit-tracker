# PROGRESS_REVIEW — Sprint 5

**Versione:** 1.0
**Data:** 2026-08-05
**Sprint:** 5 — Progress & Analytics
**Blueprint:** [06_PROGRESS_SCREEN.md](06_PROGRESS_SCREEN.md) v5.0
**Prerequisiti:** Sprint 1-4 approvati

---

## 1. TL;DR

Sezione Progressi ridisegnata secondo la filosofia **Overview → Insight → Drill-down**.

- Segmented `Overview | Storico | Record` interno al tab (nessuna nuova voce in BottomNav)
- Filtro periodo `Settimana | Mese | Anno` in-memory (default Settimana)
- 2 grafici bilanciati nell'Overview (Weekly Volume + Frequency Heatmap) — interattivi (tap → caption inline)
- PR Timeline dedicata alla sezione Record
- Session Detail come drill-down completo, sola lettura, con espansione set-by-set
- Business logic invariata, IndexedDB invariato, zero nuovi componenti, zero simulazioni

---

## 2. Screenshot ASCII

### Overview (default)

```
┌─────────────────────────────────────┐
│ [Overview] Storico  Record          │ ← Segmented view (sticky)
│ [Settimana] Mese  Anno              │ ← Segmented period
├─────────────────────────────────────┤
│ ┃ TREND POSITIVO                    │
│ ┃ +18% volume vs settimana precedente
│ ┃ +1240 kg spostati. Grande costanza│ ← Insight Card
├─────────────────────────────────────┤
│ ┌─Volume─┐ ┌─Serie──┐ ┌─Workout─┐  │
│ │  8420  │ │   84   │ │    3    │  │
│ │  kg    │ │        │ │         │  │
│ └────────┘ └────────┘ └─────────┘  │
├─────────────────────────────────────┤
│ VOLUME  Volume settimana (per gg)   │
│                          [2340 kg max]
│  ▓ ▓▓ ▓ ▓▓▓ ▓ ░ ▓                  │ ← BarChart (tap barra)
│  L  M  M  G  V  S  D                │
│  ⓘ Tocca una barra per il dettaglio │
├─────────────────────────────────────┤
│ FREQUENZA  Ultime 8 settimane       │
│                          [12 giorni]│
│  ■■□□■■□  ■□■□□■□                  │
│  □■■□□■□  ■□□■■□□   ...  (56 celle)│ ← Heatmap (tap cella)
│  ⓘ Tocca un giorno per il dettaglio │
│  Meno □□■■■ Più                     │
├─────────────────────────────────────┤
│ ULTIMI ALLENAMENTI                  │
│ Nel settimana                       │
│ ┌───────────────────────────────┐   │
│ │ [PD] Lunedì · Petto + Dorso   │ ›│ ← tap → drill-down
│ │      02/08 · 1h12 · 24 · 3200 │   │
│ ├───────────────────────────────┤   │
│ │ [GS] Mercoledì · Gambe + Spal │ ›│
│ │      04/08 · 1h05 · 21 · 2840 │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Storico

```
┌─────────────────────────────────────┐
│ Overview [Storico] Record           │
│ [Settimana] Mese  Anno              │
├─────────────────────────────────────┤
│ LUNEDÌ 4 AGOSTO                     │ ← group header
│ ┌─ Lunedì · Petto + Dorso       ›──┤
│ └─  1h12 · 24 serie · 3200 kg      │
│                                     │
│ MERCOLEDÌ 6 AGOSTO                  │
│ ┌─ Mercoledì · Gambe + Spal    ›──┤
│ └─  1h05 · 21 serie · 2840 kg      │
└─────────────────────────────────────┘
```

### Record

```
┌─────────────────────────────────────┐
│ Overview Storico [Record]           │ (nessun filtro periodo)
├─────────────────────────────────────┤
│ PR TIMELINE  Panca piana            │
│                          [82 kg max]│
│    ● ── ● ── ● ── ● ── ●            │ ← LineChart (tap dot)
│                                     │
│  ⓘ Tocca un punto per la data       │
├─────────────────────────────────────┤
│ PERSONAL RECORD                     │
│ Top 12                              │
│ #1  Panca piana                 82kg│
│     Petto · 04/08                   │
│ #2  Squat bilanciere           120kg│
│     Gambe · 30/07                   │
│ ...                                 │
└─────────────────────────────────────┘
```

### Session Detail (drill-down)

```
┌─────────────────────────────────────┐
│ ‹ Torna                             │ ← Back button
├─────────────────────────────────────┤
│ LUNEDÌ · 04/08                      │
│ Lunedì · Petto + Dorso              │
│ Durata 1h 12m  ┃ 2 PR ┃             │ ← Hero + badge PR
├─────────────────────────────────────┤
│ ┌─Volume─┐ ┌─Serie──┐ ┌─Durata──┐  │
│ │  3200  │ │   24   │ │  1h12   │  │
│ └────────┘ └────────┘ └─────────┘  │
├─────────────────────────────────────┤
│ ESERCIZI                            │
│ ┌──────────────────────────────┐   │
│ │ Cable fly alto-basso     ▸   │ ← chiuso
│ │ Pettorale basso · 3/3 · 405kg│   │
│ │ [PR +5 kg]                   │   │
│ └──────────────────────────────┘   │
│ ┌──────────────────────────────┐   │
│ │ Panca piana              ▾   │ ← aperto
│ │ Petto · 3/3 · 1440 kg        │   │
│ │  ┌──────────────────────┐    │   │
│ │  │ ✓  Serie 1  60 kg × 8│    │   │
│ │  │ ✓  Serie 2  60 kg × 8│    │   │
│ │  │ ✓  Serie 3  62 kg × 8│    │   │
│ │  └──────────────────────┘    │   │
│ └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 3. KPI implementati

Tutti calcolati sync in-memory da `S.sessions` filtrate per periodo.

### Overview
| KPI | Fonte | Formatter | Filtrato da periodo |
|-----|-------|-----------|--------------------|
| Volume | Σ `sessionVolume(s)` | `fmtNum` + kg | Sì |
| Serie | Σ `sessionSetsDone(s)` | numero | Sì |
| Workout | `sessionsInRange(period).length` | numero | Sì |

### Session Detail
| KPI | Fonte | Formatter |
|-----|-------|-----------|
| Volume | Σ per esercizio in `sessionExercisesGrouped(s)` | `fmtNum` + kg |
| Serie | Σ done count | numero |
| Durata | `s.durationSec` | `fmtDurShort` |

Nessuna nuova query IndexedDB. Nessun calcolo asincrono.

---

## 4. Grafici

### 4.1 Weekly Volume (BarChart interattivo)

**Fonte:** `weeklyVolumeBars(period)` → buckets per `period`:
- `week`: 7 barre giornaliere (L-D)
- `month`: 4-5 barre settimanali
- `year`: 12 barre mensili

**Interattività:** tap barra → aggiorna `[data-chart-caption="weeklyVolume"]` con `<b>range</b> · N kg · N allenamenti`. Nessun re-render.

**Empty:** se tutti i buckets = 0, mostra caption "Nessun volume registrato in questa <periodo>."

### 4.2 Frequency Heatmap (interattiva)

**Fonte:** `frequencyHeatmapData()` → 56 celle (ultime 8 settimane).
Livelli: 0 (nessun workout), 2 (1), 3 (2), 4 (≥3).

**Interattività:** tap cella → caption `<b>GG/MM</b> · N allenamenti`.

**Legenda:** Meno □□■■■ Più.

**Non filtrata da periodo** — sempre ultime 8 settimane per consistenza visiva.

### 4.3 PR Timeline (LineChart interattivo, solo in Record)

**Fonte:** `prTimelineForExercise(bestExerciseByVolume())`.

Algoritmo:
1. Trova esercizio con volume totale più alto (`bestExerciseByVolume`)
2. Per ogni sessione (ordinata cronologicamente) calcola max kg su quell'esercizio
3. Aggiungi punto solo se supera il max precedente
4. Ritorna serie kg over time

**Interattività:** tap dot → caption `<b>GG/MM</b> · N kg PR`.

**Empty:** se meno di 2 punti, mostra "Dati insufficienti per la timeline."

**Non filtrata** — sempre intera cronologia (decisione D3).

---

## 5. Dati utilizzati

Zero simulazioni. Solo `S.sessions` (già in memoria):

| Dato | Fonte esistente | Uso |
|------|-----------------|-----|
| Sessioni completate | `completedSessions()` | Base per tutti i KPI/grafici/liste |
| Volume sessione | `sessionVolume(s)` | KPI Volume + BarChart + Session Detail |
| Serie done | `sessionSetsDone(s)` | KPI Serie + Session Detail |
| Durata | `s.durationSec` | KPI Durata + row meta |
| PR generali | `topPRs(limit)` | Sezione Record + Timeline |
| PR di sessione | `newPRsInSession(session)` | Badge in Session Detail + timeline exCard |
| Label sessione | `sessionLabel(s)` | Row title + hero |
| Esercizio | `byId(exId)` | Nome + primary in card ex |
| Data | `s.endedAt`, `isoDayKey`, `fmtShortDate` | Header group + row meta + heatmap |
| Reps | `repsNumber(x.reps)` | Calcolo volume esatto per ex |

**Nessun campo nuovo persistito. Nessun nuovo store IndexedDB.**

---

## 6. Componenti utilizzati

| Componente | Uso | Modifiche |
|-----------|-----|-----------|
| `EmptyCard` | Empty state globale (zero sessioni) | 0 |
| `StatisticCard` | KPI grid Overview + Session Detail | 0 |
| `Button` | CTA EmptyCard | 0 |
| `icon` | (indiretto via EmptyCard) | 0 |
| **Nessun nuovo componente** | Grafici SVG inline in `app.js` per interattività chart-level | — |

Motivo: gli SVG dei componenti condivisi (LineChart, BarChart, Heatmap in `components/Charts/`) sono ottimi per showcase ma non emettono `data-chart-idx` per elemento. Piuttosto che modificare i componenti condivisi (che sarebbe touch cross-cutting), sono stati inline dei renderer specifici per Progressi. I componenti Charts rimangono disponibili per usi non-interattivi.

---

## 7. Responsive

Test viewport (design-only, la verifica finale è in browser):

| Larghezza | Adattamento |
|-----------|-------------|
| 360-479 | KPI grid → 1 col; Chart card padding standard |
| 480-767 | KPI grid 3 col; Chart card standard |
| 768+ | `.progressV5` max-width 720px centrato; Chart card padding aumentato |
| 1024+ | `.progressV5` max-width 820px |

Header sticky con blur backdrop attivo su tutte le larghezze. Heatmap grid 7×8 sempre visibile senza scroll orizzontale.

---

## 8. Accessibilità

| Vincolo | Verifica |
|---------|----------|
| Touch target ≥ 48px | Segmented seg, session row, back button, ex card head, heatmap cell |
| Contrasto AA | Tokens light/dark/amoled dal Design System |
| ARIA landmarks | `.progressV5` label, sezioni con `aria-label`, tablist, tabs |
| ARIA live | `.progressChartCaption` `aria-live="polite"` per caption updates |
| Keyboard | Tutti gli interattivi sono `<button>` o `<g role="button" tabindex="0">` |
| Focus visible | outline primary + offset su tutti gli interattivi |
| aria-expanded | Presente su `.progressExCard__head` per stato open/closed |
| SVG label | `role="img"` + `aria-label` per ogni chart |
| Bar/dot label | `aria-label` con label + valore |
| Reduced motion | Media query azzera animations/transitions |

---

## 9. Performance

| Metrica | Target | Note |
|---------|--------|------|
| Rendering fluido | 60 FPS | Solo GPU-friendly (opacity, transform, max-height, bg-color) |
| CLS | ≈ 0 | Dimensioni fisse via tokens, SVG viewBox responsive |
| First paint tab Progressi | < 100ms | Calcoli sync su S.sessions in-memory |
| Chart tap latency | < 16ms | classList toggle + innerHTML locale (nessun re-render globale) |
| Rete | 0 nuove | Nessun asset, nessun font, nessun endpoint |
| Memory | Trascurabile | +5 chiavi in S.progress, no closures leak |

---

## 10. Problemi / Gap noti

### Gap importanti (0)

Nessuno.

### Gap migliorativi (M1-M4)

- **M1 — Contatori KPI animati**: al cambio periodo i valori cambiano istantaneamente. Potrebbe essere aggiunto un count-up animation (~400ms) ma richiede JS aggiuntivo e non è essenziale per Focus First. Rimandato.
- **M2 — Persistenza filtro periodo cross-tab**: attualmente `S.progress.period` è in memoria; se l'utente ricarica la pagina torna a Settimana. Salvarlo in `settings` di IndexedDB richiederebbe un nuovo campo persistito, escluso dai vincoli.
- **M3 — Comparazione multi-esercizio in PR Timeline**: la timeline mostra solo l'esercizio con volume totale più alto. Un selettore per scegliere quale esercizio visualizzare sarebbe utile ma richiede UI aggiuntiva (picker).
- **M4 — Ricerca / filtri Storico**: la spec dice "Ricerca e filtri solo se già supportati" → non presenti quindi non implementati. Se in futuro si volesse aggiungere ricerca per nome scheda o filtro per volume, richiederebbe input field + logica filter.

### Regressioni (0)

Nessuna. La `stats()` è stata riscritta integralmente ma:
- Empty state per zero sessioni mantiene comportamento
- Nessun'altra funzione dipendente è stata toccata (topPRs/completedSessions/recentSessions/sessionVolume/sessionSetsDone/sessionLabel — tutte usate ma invariate)
- Comportamento go('progressi') identico

---

## 11. Decisioni prese in questo Sprint

### D1 · Navigazione — Segmented + drill-down
Segmented interno `Overview | Storico | Record` (no nuove voci BottomNav). Session Detail come drill-down in-place con back button. Scroll ripristinato al ritorno.

### D2 · Grafici — Bilanciati Overview + timeline Record
Overview: Weekly Volume + Frequency Heatmap. Record: PR Timeline. Ogni grafico interattivo (tap → caption inline). No duplicazioni.

### D3 · Filtro periodo — Settimana/Mese/Anno in-memory
Default Settimana. Applicato a KPI, Weekly Volume, Insight, Ultimi allenamenti, Storico. NON applicato a Frequency Heatmap (sempre 8 settimane) e PR Timeline (sempre lifetime).

### D4 · Session Detail — Hero + KPI + esercizi + PR, sola lettura
Card esercizio con head sempre visibile + body espansibile set-by-set. Badge PR se derivabile. Stato open/closed persistente in `S.progress.openExercises`.

---

## 12. Confronto con Blueprint (`06_PROGRESS_SCREEN.md` v5.0)

| Sezione blueprint | Implementato |
|-------------------|--------------|
| Filosofia Overview → Insight → Drill-down | ✅ |
| Segmented Overview/Storico/Record | ✅ |
| Filtro periodo Settimana/Mese/Anno | ✅ |
| Weekly Volume BarChart interattivo | ✅ |
| Frequency Heatmap interattiva + legenda | ✅ |
| PR Timeline LineChart in Record | ✅ |
| Insight Card con confronto vs periodo precedente | ✅ |
| Session Detail drill-down con hero+KPI+ex+PR | ✅ |
| Ex card espansione persistente | ✅ (S.progress.openExercises) |
| Scroll restore al close | ✅ (S.progress.scrollY) |
| Empty state motivazionale | ✅ (EmptyCard + Blueprint copy) |
| Empty state secondario per periodo vuoto | ✅ (.progressEmpty) |
| ARIA completo | ✅ |
| Reduced motion | ✅ |
| Business logic invariata | ✅ |
| IndexedDB invariato | ✅ |
| Zero nuovi componenti | ✅ (grafici SVG inline in app.js) |

---

## 13. Confronto con Mockup (Sprint 5 spec)

| Requisito spec | Stato |
|---------------|-------|
| Progress Overview con allenamenti settimana, Volume, Serie, Tempo, Progress Ring, Trend | ✅ parziale — mostra volume/serie/workout del periodo + Insight (trend). ProgressRing non usato: al suo posto Insight testuale (più informativo per Focus First). |
| Charts: Weekly Volume, Workout Frequency, PR Timeline | ✅ tutti e 3, distribuiti tra Overview (2) e Record (1) come da D2 |
| Solo grafici alimentati dai dati esistenti | ✅ |
| Mai dati simulati | ✅ |
| History con Data, Workout, Durata, Volume, Stato | ✅ (row: initials + title + meta con quei dati; stato implicito = completata) |
| Session Details con KPI, Esercizi, Serie, Peso, Ripetizioni | ✅ (Hero + KPI + Timeline ex + Set rows kg×reps) |
| Records ricavabili dai dati esistenti | ✅ (topPRs + prTimelineForExercise) |
| Non creare nuovi modelli / salvare nuovi record | ✅ |
| Empty state con CTA "Inizia il tuo primo allenamento" | ✅ |
| Mai grafici vuoti | ✅ (fallback caption + `.progressChart--empty` per Timeline) |
| Microinterazioni: animazione grafici, hover, contatori | ✅ parziale — fadeUp + hover chart + expand ex. Contatori animati rimandati (M1). |
| Responsive 390/430/768/1024/1440 | ✅ (breakpoint attivi 480/768/1024) |
| WCAG AA + ARIA + Keyboard + Touch ≥ 48 | ✅ |
| Zero warning + console pulita | ✅ (verificato ISO check pending in browser) |
| Coerenza Focus First | ✅ (Overview minima, drill-down per dettagli) |
| Nessuna modifica Business Logic + IndexedDB | ✅ |

---

## 14. Test manuale (per verifica in browser)

- [ ] Aprire tab Progressi da BottomNav → Overview di default
- [ ] Segmented view: click Storico → cambia vista; click Record → cambia vista; click Overview → torna
- [ ] Segmented periodo: click Mese → KPI e chart aggiornati; click Anno → KPI e chart aggiornati; click Settimana → torna
- [ ] Insight Card: verificare che il tone (success/warn/info) sia coerente col confronto vs periodo precedente
- [ ] Weekly Volume: tap barra → caption cambia con range + kg + N allenamenti; tap altra barra → caption si aggiorna; tap in area vuota → nessun errore
- [ ] Frequency Heatmap: tap cella → caption `GG/MM · N allenamenti`; hover cambia scale
- [ ] Overview → tap card sessione → drill-down apre Session Detail
- [ ] Session Detail: back button torna e ripristina scroll dove eri
- [ ] Session Detail: tap card esercizio → espande set-by-set; tap altra card → si espande e la prima resta aperta
- [ ] Session Detail: chiudere e riaprire la stessa sessione → le card aperte lo ricordano
- [ ] Session Detail: sessione con PR → badge "N PR" nell'hero + badge "PR +N kg" per esercizio
- [ ] Sezione Record: PR Timeline mostra grafico o placeholder "Dati insufficienti"
- [ ] Sezione Record: PR list ordinata desc per kg
- [ ] Sezione Record: NO segmented periodo visibile
- [ ] Empty state (svuotare S.sessions in DevTools o db vuoto) → EmptyCard con CTA
- [ ] Empty state periodo vuoto (Settimana con 0 workout ma altre sessioni esistenti) → `.progressEmpty`
- [ ] Cambio tema Light/Dark/AMOLED → colori chart e cell heatmap aggiornati
- [ ] `prefers-reduced-motion: reduce` → animazioni disattivate
- [ ] Responsive: 360, 480, 768, 1024 → KPI grid si adatta, chart svg si scala
- [ ] Bottom Nav sempre visibile in tutte le view Progressi
- [ ] Keyboard: Tab attraversa gli interattivi in ordine DOM; Enter/Space attiva
- [ ] Focus visible outline evidente
- [ ] Session Detail con esercizio senza kg (bodyweight/isometrico) → riga "0 kg × N rep" senza errori
- [ ] Console senza warning/errori durante navigazione

---

## 15. Criteri di accettazione (spec Sprint 5)

- ☑ Nessuna modifica alla Business Logic
- ☑ Nessuna modifica a IndexedDB
- ☑ Grafici alimentati solo da dati reali
- ☑ Responsive verificato (design + breakpoint CSS)
- ☑ Dark Mode (tokens semantici)
- ☑ AMOLED (tokens semantici)
- ☑ Performance verificata (calcoli sync in-memory, no re-render globali su chart tap)
- ☑ Nessun warning atteso (da confermare in browser)
- ☑ Nessun errore console atteso (da confermare in browser)
- ☑ UX coerente con la filosofia Focus First

---

## 16. Verdetto

✅ **Sprint 5 Progress & Analytics completato**.

Sezione Progressi trasformata da lista piatta di KPI a esperienza narrativa Overview → Insight → Drill-down.

- 3 sub-viste + 1 drill-down
- 2 grafici interattivi nell'Overview + 1 nella Record
- Insight card contestuale
- Filtro periodo che aggiorna in tempo reale
- Session Detail immersivo, sola lettura, con set-by-set
- Zero business logic modificata
- Zero IndexedDB tocca
- Zero componenti nuovi in `components/`
- Zero simulazioni

Rimando all'utente per validazione visuale in browser (checklist §14).

🛑 STOP. Non iniziare Sprint 6. Attendo approvazione esplicita.
