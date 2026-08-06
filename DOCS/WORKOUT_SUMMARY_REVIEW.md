# WORKOUT_SUMMARY_REVIEW — Sprint 4

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Sub-review dedicata alla schermata Summary v4 (Sprint 4)
**Parent report:** [WORKOUT_REVIEW.md](WORKOUT_REVIEW.md)
**Blueprint:** [05_WORKOUT_SCREEN.md](05_WORKOUT_SCREEN.md) v4.0 — §Summary v4

Questa sub-review è stata generata su richiesta esplicita dell'utente (decisione D3 dello Sprint 4).

---

## 1. Obiettivo del Summary

Celebrare il completamento dell'allenamento in modo discreto e coerente col Design System, mostrando:

- Riepilogo dati chiave (Volume, Serie, Durata)
- Eventuali nuovi Personal Record (solo se ricavabili da dati esistenti)
- CTA primaria "Fine allenamento"
- CTA secondaria "Condividi" — placeholder disabilitato, layout già pronto per Web Share API futura

---

## 2. Screenshot (layout descritto)

```
┌──────────────────────────────────────┐
│         (safe-top)                   │
├──────────────────────────────────────┤
│                                      │
│              ┌─────┐                 │
│              │  ✓  │  ← badge pop    │
│              └─────┘                 │
│                                      │
│      SESSIONE COMPLETATA             │
│       Petto + Dorso …                │  ← h1 800
│    Bel lavoro! I tuoi dati…          │  ← body muted
│                                      │
├──────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Volume │ │  Serie │ │ Durata │   │
│  │  2340  │ │   27   │ │  0:52  │   │
│  │   kg   │ │        │ │        │   │
│  └────────┘ └────────┘ └────────┘   │
├──────────────────────────────────────┤
│  PR CONQUISTATI                       │
│  2 nuovi Personal Record              │
│  ┌────────────────────────────────┐  │
│  │ Cable fly alto-basso           │  │
│  │ Pettorale basso · prec 40 kg   │  │
│  │                     45 kg +5 kg│  │
│  ├────────────────────────────────┤  │
│  │ Lat machine presa larga        │  │
│  │ Gran dorsale · prec 68 kg      │  │
│  │                     70 kg +2 kg│  │
│  └────────────────────────────────┘  │
├──────────────────────────────────────┤
│  [ Condividi · in arrivo ] (disabled)│
│  [    Fine allenamento    ] (primary)│
│         (safe-bottom)                │
└──────────────────────────────────────┘
   (Bottom Nav nascosta in tab summary)
```

---

## 3. KPI visualizzati

Tutti derivati da dati già presenti in `S.lastSummary` (calcolati durante `finishWorkout()`):

| KPI | Fonte | Formatter | Fallback |
|-----|-------|-----------|----------|
| Volume | `s.totalVolume` (kg) | `fmtNum` | 0 se nessun kg salvato |
| Serie | `s.completedSets` | numero | 0 |
| Durata | `s.durationSec` | `fmtDurShort` | `—` se 0 (sessione chiusa senza start) |

Nessuna nuova query IndexedDB. Nessun nuovo calcolo asincrono. Tutto sincrono in-memory.

---

## 4. Eventuali PR rilevati

**Helper puro:** `newPRsInSession(session)` in `app.js`.

Algoritmo (zero side-effect):

1. Costruisci `bestInSession[exId]` = max kg per esercizio nella sessione appena finita
2. Per ogni `exId`: calcola `prevMax` = max kg in tutte le sessioni completed diverse dalla corrente
3. Se `cur.kg > prevMax`: PR nuovo. Salva `{id, name, primary, kg, reps, setNo, prevMax}`
4. Ordina desc per kg, ritorna array

**Regola di visualizzazione:**

- Se `newPRs.length === 0` → sezione PR **completamente omessa** dal DOM (no spazio vuoto, no card fantasma)
- Se `newPRs.length === 1` → titolo "Nuovo Personal Record" + eyebrow "PR CONQUISTATO"
- Se `newPRs.length > 1` → titolo "N nuovi Personal Record" + eyebrow "PR CONQUISTATI"
- Max 5 righe mostrate (slice) — se ne emergessero di più, priorità ai top-5 per kg

**Formato riga:**

- Nome esercizio (b)
- Muscolo/target + `· prec X kg` (se prevMax > 0) o `· primo record` (se prevMax = 0)
- Colonna destra: `kg` grande + `+N kg` delta verde (o `nuovo` se prevMax = 0)

**Vincoli rispettati:**

- ✅ Nessun nuovo modello dati
- ✅ Nessun nuovo salvataggio in IndexedDB
- ✅ Nessuna modifica a `S.sessions` shape
- ✅ Nessuna nuova preferenza utente
- ✅ Calcolo puramente in-memory da dati esistenti

---

## 5. Stati supportati

| Stato | Trigger | Rendering |
|-------|---------|-----------|
| Loading UI | !UI.StatisticCard \|\| !UI.Button | Fallback "Caricamento…" |
| Nessuna sessione (fallback) | !S.lastSummary | `setTimeout` redirect a Home |
| Sessione normale senza PR | s presente, newPRs.length === 0 | Hero + KPI + CTA (no sezione PR) |
| Sessione con 1 PR | newPRs.length === 1 | Hero + KPI + PR (singolo) + CTA |
| Sessione con N PR | newPRs.length > 1 | Hero + KPI + PR (fino a 5) + CTA |
| Durata mancante | durationSec = 0 | KPI "Durata" mostra "—" |
| Bottom Nav | S.tab === 'summary' | Nascosta (`bnRoot.style.display = 'none'` in render) |

---

## 6. Animazioni

Tutte GPU-friendly (opacity + transform):

- `.summaryV4` — `workoutV4-fadeUp` 200ms curve-default
- `.summaryHero__badge` — `summaryBadge-pop` 320ms curve-default (scale bounce 0.6 → 1.08 → 1)
- `.summaryKpi` — `workoutV4-fadeUp` con delay 120ms
- `.summaryPr` — `workoutV4-fadeUp` con delay 200ms
- `.summaryCta` — `workoutV4-fadeUp` con delay 240ms

Reduced motion: azzerate tutte via `@media (prefers-reduced-motion: reduce)`.

**Contatori animati (KPI):** non implementati come count-up (il valore statico è già sufficiente per l'ergonomia). Il bounce del badge fa da elemento celebrativo dominante. **Tracciato come possibile enhancement futuro** (non gap Sprint 4).

---

## 7. Componenti utilizzati

| Componente | Uso |
|-----------|-----|
| `StatisticCard` × 3 | Volume, Serie, Durata |
| `Button` (primary) | "Fine allenamento" |
| `Button` (ghost, disabled) | "Condividi · in arrivo" |
| `icon('check', 'large')` | Icona nel badge success |

Nessun componente creato per il summary.

---

## 8. Verifica business logic invariata

Grep marker sacri:

- `finishWorkout` → funzione modificata SOLO per aggiungere `newPRs: newPRsInSession(savedSession)` a `S.lastSummary`. Nessun altro comportamento cambiato.
- `S.lastSummary` shape esteso con `newPRs` (array in-memory, non persistito)
- `newPRsInSession` — helper puro, ZERO side-effect, ZERO IndexedDB access
- `topPRs` — funzione esistente per Progressi, NON toccata
- `completedSessions`, `sessionVolume`, `sessionSetsDone` — invariate
- `Store.put`, `Store.get`, `refresh` — invariate

**IndexedDB:** invariato. Nessuna nuova store, nessun nuovo campo persistito.

**Modello dati:** invariato. `S.sessions[i].exerciseLogs[j]` shape identica.

**Preferenze utente:** invariate.

---

## 9. Come Condividi diventerà funzionante (nota per il futuro)

Il placeholder `Button ghost disabled` è già:

- Nel layout corretto (colonna verticale, sopra al primary)
- Con label "Condividi · in arrivo"
- Con `dataset.action="noop-share"` (non gestito → nessun errore in console)

Per abilitare in un futuro Sprint:

1. Rimuovere `disabled: true` dal Button
2. Cambiare label da "Condividi · in arrivo" a "Condividi"
3. Cambiare `dataset.action` da "noop-share" a "share-summary"
4. Aggiungere nel `switch` main:
   ```js
   case 'share-summary': shareLastSummary(); break;
   ```
5. Implementare `shareLastSummary()`:
   ```js
   async function shareLastSummary() {
       if (!S.lastSummary || !navigator.share) return;
       const s = S.lastSummary;
       const prLines = (s.newPRs || []).slice(0, 3)
           .map(p => `${p.name}: ${p.kg}kg`).join('\n');
       await navigator.share({
           title: 'Fit Circuit Tracker',
           text: `${s.label}\n${s.completedSets} serie · ${fmtNum(s.totalVolume)}kg\n${prLines}`
       });
   }
   ```

Zero refactor grafico richiesto. Zero cambio blueprint.

---

## 10. Regressioni

**Nessuna.** Il summary precedente (Fase B pre-Sprint 4) usava `UI.StateSuccess({icon, title, body})` + 3 `StatisticCard` + 2 Button ("Vedi progressi" + "Fine"). Cambiamenti attesi:

- Rimosso il bottone "Vedi progressi" (per aderire alla decisione D3 "CTA primaria Fine + CTA secondaria Condividi placeholder")
- Aggiunta card PR se presente
- Layout celebrativo più ricco (badge, hero, animazioni)

Se l'utente vuole ancora "Vedi progressi" può accedervi dalla Bottom Nav (tab "Progressi") dopo aver toccato "Fine allenamento" (torna a Home, la Nav diventa visibile).

---

## 11. Verdetto

✅ **Summary v4 completato**.

- Celebrazione discreta ✓
- KPI derivati da dati esistenti ✓
- PR calcolati puramente ✓
- Sezione PR omessa se non ce ne sono ✓
- Condividi placeholder disabled con label "In arrivo" ✓
- Business logic invariata ✓
- IndexedDB invariato ✓
- Bottom Nav nascosta in summary ✓

Rimando all'utente per validazione visuale in browser (vedi checklist §14 in [WORKOUT_REVIEW.md](WORKOUT_REVIEW.md)).
