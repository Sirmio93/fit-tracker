# 04_HOME_SCREEN.md

Versione 3.0 (Sprint 3 · 2026-08-05)

---

# Obiettivo

La Home NON è una dashboard.

La Home è il punto di ingresso dell'allenamento.

L'utente deve capire in meno di 2 secondi:

- a che punto è
- cosa deve fare
- come riprendere il workout

La priorità assoluta è consentire all'utente di riprendere un allenamento nel minor tempo possibile.

Le statistiche sono secondarie e non devono competere con la CTA principale.

---

# Decisione architetturale: fold + scroll

Approvata dall'utente in Sprint 3 (2026-08-05), sostituisce la Home minima di Fase B.

**Above the fold** (nessuno scroll richiesto, viewport 390×844):

- Header (saluto + data)
- HeroCard con CTA principale ("Continua allenamento" oppure "Scegli allenamento")
- Stato sintetico della sessione (contenuto nella Hero)
- FAB context-aware in modalità compact

**Below the fold** (leggero scroll verticale):

- Quick Stats (2 StatCard)
- Workout Progress Ring (solo se sessione attiva)
- History Preview (fino a 5 HistoryCard)
- GoalCard settimanale (derivato, 3 sessioni/settimana)

**Sempre visibili:**

- Bottom Navigation
- FAB (extended quando la Hero esce dal viewport)

---

# Struttura sequenziale

Header

↓

Hero + CTA primaria

↓

═══ fold line ═══

↓

Quick Stats (grid 2 colonne)

↓

Workout Progress Ring (condizionale)

↓

History Preview (max 5)

↓

Goal Card (derivato)

---

# Layout Mobile First (390×844)

┌─────────────────────────────┐

Safe Area Top

─────────────────────────────

Header (Ciao + Data)

─────────────────────────────

HeroCard (In corso / Pronto)

CTA primaria dentro Hero

═════ FOLD ═════

Quick Stats · 2 col

─────────────────────────────

Workout Progress Ring (if active)

─────────────────────────────

History Preview

HistoryCard × N (max 5)

─────────────────────────────

GoalCard settimanale

─────────────────────────────

Padding bottom nav + FAB

─────────────────────────────

Bottom Navigation (fixed)

└─────────────────────────────┘

FAB fixed bottom-right (context-aware)

---

# Safe Area

Top: `var(--safe-top)` (via Header component)

Bottom: `var(--safe-bottom)` (Bottom Nav + padding home)

Lati: `var(--space-16)` (mobile) → `var(--space-24)` (tablet+)

---

# Header

Contenuto:

- Titolo: saluto contestuale (Buongiorno / Buon pomeriggio / Buonasera)
- Sottotitolo: data lunga in italiano (`Sabato 5 agosto`)

Nessun avatar in Home v3 (rimandato al Profilo).

Componente: `Header({title, subtitle})`.

---

# Hero Workout

Componente: `HeroCard({eyebrow, title, body, action})`.

Tre stati mutuamente esclusivi:

**A. Sessione attiva** (`ctx()` restituisce una sessione)

- eyebrow: `In corso`
- title: nome giornata (es. `Petto + Dorso`)
- body: `<settimana> · <nome_giorno> · <done>/<total> serie · <pct>%`
- action: PrimaryButton "Continua allenamento" → `go('workout')`

**B. Ha schede, nessuna sessione**

- eyebrow: `Pronto`
- title: `Pronto per allenarti?`
- body: `Tocca il pulsante per scegliere settimana e giorno.`
- action: PrimaryButton "Scegli allenamento" → apre BottomSheet

**C. Nessuna scheda importata**

- Fallback su `EmptyCard` con icona `dumbbell`
- CTA "Importa scheda" → `go('profilo')`

---

# Quick Stats

Grid 2 colonne, gap 12/16px (breakpoint).

Componenti: `StatisticCard × 2` derivati da dati esistenti (letture pure):

**Card 1 — Streak**

- eyebrow: `Streak`
- value: `streakDays()` calcolato su `S.sessions`
- unit: `giorno` / `giorni`
- delta: `consecutivi` / `primo giorno` / `inizia oggi`

**Card 2 — Questa settimana**

- eyebrow: `Questa settimana`
- value: `weekSessionCount()` (ISO week, lunedì → oggi)
- unit: `sessione` / `sessioni`
- delta: `X alla meta` oppure `obiettivo raggiunto`

Nessun dato hardcoded, nessuna nuova store IndexedDB.

---

# Workout Progress Ring

Visibile SOLO se `ctx()` restituisce una sessione attiva.

Componente: `ProgressRing({progress, size: 120, stroke: 12, showLabel: true})` + info testuale a destra.

Percentuale = `doneSetCount() / totalSetCount(blocks) * 100`.

Se non c'è sessione attiva, la sezione è omessa (nessuno spazio vuoto).

---

# History Preview

Massimo 5 card. Mai mostrare più di cinque.

Componente: `HistoryCard × N` da `recentSessions(5)`.

Per ogni sessione:

- initials: iniziali del `day.label` (via `initialsOf`)
- title: nome giornata
- meta: `<data corta> · <durata> · <volume> kg`
- badge: `Completata` (variant `success`)

Empty state: `StateEmpty` con titolo "Nessun allenamento" e messaggio esplicativo.

---

# Goal Card

Componente: `GoalCard({eyebrow, title, progress, hint})`.

Attualmente **derivato**: obiettivo statico "3 sessioni / settimana", progresso calcolato da `weekSessionCount()`.

Non introduce nuova store IndexedDB, nessuna nuova preferenza utente.

Predisposto per future estensioni (goal personalizzabile) senza dover riscrivere il componente: basterà iniettare `weekTarget` da una fonte esterna.

Progress: `min(100, round(count / target * 100))`.

Hint dinamico:

- `X di 3 sessioni · rimangono Y` (in progresso)
- `Obiettivo raggiunto — ottimo lavoro!` (100%)

---

# Floating Action Button

Sempre visibile in Home (`fixed bottom-right`).

**Regola context-aware:**

- Sessione attiva → icona `play`, label "Continua", action `go('workout')`.
- Nessuna sessione → icona `plus`, label "Nuovo", action `openSelectSheet()`.

**Regola dimensione (via IntersectionObserver sulla Hero):**

- Hero visibile (≥25%) → FAB `is-shrunk` (solo icona, meno prominente per non competere con la CTA Hero)
- Hero fuori viewport → FAB `is-expanded` (icona + label)

Componente: `Fab({icon, label, extended: true, text})` con wrapper `.home-fab` che gestisce positioning e transizione.

Non duplica la CTA Hero: quando la Hero è visibile è ridotto; quando scrolli, diventa il punto di accesso rapido all'azione.

---

# Bottom Navigation

Sempre visibile. Blur `var(--blur-navigation)`.

Elementi (glyph decisione Fase 10 Step 3):

🏠 Home · 💪 Workout · 📈 Progressi · 👤 Profilo

Elemento attivo: color-swap `--color-primary` (variante icona filled → gap M3 tracciato).

---

# Scroll

Solo verticale.

Mai orizzontale.

---

# Animazioni

Hero: fade + slide (var --duration-normal)

Sezioni scroll: fade-up con stagger 40/80/120/160ms

FAB: transizione width/padding tra shrunk ↔ expanded (var --duration-normal)

`prefers-reduced-motion: reduce` → tutte le animazioni azzerate.

---

# Loading

Skeleton. Mai spinner.

Guard `if (!UI || !UI.HeroCard) return caricamento…`.

---

# Empty State

Illustrazione (icona) → Titolo → Descrizione → CTA.

Componenti: `EmptyCard` (Hero fallback) oppure `StateEmpty` (History).

---

# Error State

Toast tramite `showToast({tone: 'error'})`.

Mai popup bloccante per stati transitori.

---

# Responsive

Mobile-first 390×844.

Breakpoint attivi:

- 390: base
- 430: gap grid statistics aumentato
- 768: max-width 720px, gap ampliati, padding lati 24px
- 1024: max-width 820px

Il layout resta a colonna verticale su tutte le larghezze (single-column pattern).

---

# Performance

- Layout stabile (nessun CLS): dimensioni definite via padding/gap tokens
- Animazioni GPU: opacity + transform + stroke-dashoffset
- FAB IntersectionObserver: threshold singolo, listener via passive subscribe
- Nessun re-render extra: `home()` è pura funzione HTML, `mountHomeFab()` DOM diffing minimale (innerHTML)

Target caricamento < 150 ms.

---

# Accessibilità

- Touch target: `--touch-recommended` (48px) minimo, FAB `--touch-fab` (56px)
- Contrasto: token semantici → AA garantito per light/dark/amoled
- ARIA:
  - Header: `role="banner"`
  - Section: `aria-label` esplicito su ogni `.home-section`
  - ProgressRing: `aria-label="X di Y serie"`
  - GoalCard: `role="progressbar"` con `aria-valuenow/min/max`
  - FAB: `aria-label` context-aware
- Focus visible: eredita da `.c-btn` / `.c-fab` (box-shadow inset viola)
- Keyboard: tutti i tap sono `<button>` reali, ordine tab lineare

---

# Cosa NON fare

- Nuovi componenti UI
- Modificare Business Logic
- Modificare IndexedDB
- Aggiungere preferenze utente per il goal
- Header complesso con avatar (v3 solo saluto + data)
- Card annidate
- Scroll orizzontale
- Statistiche primarie che competono con la CTA Hero

---

# Checklist Sprint 3

☐ Header con saluto + data — sempre above fold

☐ HeroCard 3 stati (Active/Ready/Empty) — sempre above fold

☐ FAB context-aware (Continua / Nuovo)

☐ Quick Stats 2 card derivate

☐ Progress Ring condizionale su sessione attiva

☐ History Preview max 5 card

☐ Goal Card derivato (3 sess/settimana)

☐ Bottom Navigation sempre visibile

☐ Safe Area rispettata (top + bottom + lati)

☐ Responsive 390 → 1440

☐ Dark + AMOLED coerenti

☐ Reduced motion supportato

☐ Business logic invariata

☐ IndexedDB invariato

---

# Obiettivo finale

Quando l'utente apre l'app deve immediatamente pensare:

"Posso riprendere / iniziare ad allenarmi."

La Home non deve richiedere alcun ragionamento above-the-fold.

Il resto (progressi, storico, obiettivi) è disponibile con un leggero scroll ma mai in competizione con la CTA principale.
