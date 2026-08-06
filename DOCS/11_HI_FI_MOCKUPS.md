# 11 — HI-FI MOCKUPS
**Fit Tracker PWA · specifica grafica ad alta fedeltà**
*Coerente con `10_NEW_DESIGN.md` v2. Ogni scelta qui rispetta le regole del Blueprint — nessuna eccezione.*
Data: 2026-08-04
Viewport target: **390 × 844** (iPhone 14) · densità di riferimento **@2x** · dark mode nativa

---

## 0. Come si legge questo documento

Ogni schermata è specificata su **7 assi obbligatori**:

1. **Layout** — wireframe pixel-accurato con coordinate reali
2. **Gerarchia** — dominante / primario / secondario / marginale (dalla §2.1 del Blueprint)
3. **Componenti** — istanze del set finito §2.3 con parametri esatti
4. **Palette** — ruoli colore usati, hex light + dark
5. **Spaziature** — solo dalla scala 4 · 8 · 16 · 24 · 32 · 48
6. **Tipografia** — solo dalla scala XL·L·M·S·XS
7. **Annotazioni** — stati, transizioni, aria, focus, edge case

Se un elemento non trova posto in uno dei 7 assi, **non entra nel mockup**.

---

## 1. Sistema visivo operativo (recap)

### 1.1 Palette (dalla §2.6 Blueprint)

| Ruolo | Token | Light | Dark | Uso |
|---|---|---|---|---|
| Sfondo app | `--bg-app` | `#FFFFFF` | `#0B0B0F` | body |
| Sfondo elevato | `--bg-elev` | `#F6F6F8` | `#141419` | card, row corrente, sheet |
| Testo primario | `--text` | `#0B0B0F` | `#F2F2F5` | corpo, titoli, numeri |
| Testo attenuato | `--text-dim` | `#6B6B75` | `#9A9AA5` | meta, hint, sotto-label |
| Separatore | `--sep` | `#E4E4E9` | `#26262E` | hairline, bordo ghost |
| Primario (viola) | `--primary` | `#7C3AED` | `#8B5CF6` | CTA missione, focus outline, chip attivo bg 10% |
| Positivo | `--success` | `#059669` | `#10B981` | trend ↑, dot sync attivo |
| Warning | `--warning` | `#D97706` | `#F59E0B` | dot sync desincronizzato, backup fallito |
| Pericolo | `--danger` | `#DC2626` | `#EF4444` | reset, dot sync errore, DANGER ZONE label |

**Regola d'uso** (§2.6): un solo elemento viola per schermata. Verde/arancio/rosso sono giudizi, mai decorazione.

### 1.2 Tipografia

**Font family**: `Inter` (400/500/600/700) con fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
**Feature settings**: `"cv11", "ss01"` (tabular alt per numeri stepper e countdown → `font-variant-numeric: tabular-nums`).

| Peso | Size / Line-height | Weight | Letter-spacing | Uso canonico |
|---|---|---|---|---|
| **XL — 56/64** | 56 / 64 | 700 | -0.02em | countdown timer |
| **XL — 44/52** | 44 / 52 | 700 | -0.02em | numero volume (Progressi) |
| **XL — 40/48** | 40 / 48 | 700 | -0.02em | numero stepper KG |
| **L — 24/32** | 24 / 32 | 600 | -0.01em | nome esercizio, numero stepper REPS |
| **L — 20/28** | 20 / 28 | 600 | -0.01em | testo CTA dominante, riga corrente lista |
| **M — 18/26** | 18 / 26 | 600 | 0 | trend Progressi |
| **M — 16/24** | 16 / 24 | 500 | 0 | testo CTA M ghost, righe lista, label tile giorno |
| **S — 14/20** | 14 / 20 | 400 | 0 | meta, hint, sotto-label, chip |
| **XS — 12/16** | 12 / 16 | 400 | 0.06em | label sezione (uppercase) |

**Regole tipografiche:**
- Numeri stepper e countdown → `tabular-nums` (evita salto orizzontale al cambio cifra)
- Label sezione (`ASPETTO`, `DATI`, `RECORD`, ecc.) → uppercase XS con letter-spacing 0.06em
- Mai `italic`, mai `text-decoration: underline` (i link testuali usano colore rosso o viola come segnale)

### 1.3 Radius, borders, shadow

| Elemento | Radius | Border | Shadow |
|---|---|---|---|
| CTA (dominante e M ghost) | 16 | 1px `--sep` (solo ghost) | nessuna |
| Card, sheet, sotto-vista | 16 (top-only sheet) | nessuno | nessuna |
| Tile giorno | 12 | 1px `--sep` (default) o 2px `--primary` (attivo) | nessuna |
| Chip | 8 (pill di fatto) | 1px `--sep` (inattivo) o nessuno (attivo, bg viola 10%) | nessuna |
| Stepper (contenitore numero) | 12 | 1px `--sep` | nessuna |
| Timer overlay | 16 top-only | nessuno | `0 -8px 32px rgba(0,0,0,0.24)` (unica ombra ammessa) |

Un'unica ombra "soft" in tutta l'app (§11.5), esclusivamente sul timer overlay per separarlo visivamente dallo sfondo.

### 1.4 Spaziature

Scala unica **4 · 8 · 16 · 24 · 32 · 48**. Nessun altro valore. Usati come padding, gap, margin.

**Ancoraggi ricorrenti:**
- Top safe area + 24 = inizio contenuto (y = 47+24 = 71 su iPhone 14; su web/desktop y = 24)
- Padding orizzontale schermata: 24
- Bottom-nav altezza 72 + safe bottom 34 = 106 di terreno protetto in basso

### 1.5 Icon set (simboli-giudizio ammessi §2.6 Blueprint)

Solo glyph Unicode nativi del font, mai icon library:

| Simbolo | Uso | Colore |
|---|---|---|
| `↑` `↓` | trend | success / danger |
| `✓` | stato completato | success |
| `•` | stato in corso | primary |
| `○` | stato da fare | text-dim |
| `●` | attivo / dot sync | success / warning / danger / primary |
| `✕` | chiudi overlay/sotto-vista | text-primary (44×44 tap-target) |
| `−` `+` | stepper | text-primary |

Vietati: `→ ← ◀ ▶ » « ➜` e qualsiasi altra freccia decorativa.

### 1.6 Motion

Un solo timing curve: `cubic-bezier(0.2, 0.8, 0.2, 1)` (spring soft).

| Transizione | Durata | Delta |
|---|---|---|
| Tab switch (fade) | 260ms | opacity 0→1 |
| Sheet slide-up | 240ms | translateY 100% → 0 |
| Sotto-vista push | 240ms | translateX 100% → 0 (o fade se `prefers-reduced-motion`) |
| CTA press | 100ms → 200ms | scale 1 → 0.98 → 1 |
| Countdown cambio cifra | nessuna | swap immediato |

`prefers-reduced-motion: reduce` → tutte le durate a 0, no crossfade.

### 1.7 Grid & bounding

- **Base grid**: 8pt
- **Padding orizzontale contenuto**: 24 (contenuto utile = 390 − 48 = 342px)
- **Safe area top** (iPhone notch): 47 (usare `env(safe-area-inset-top)`)
- **Safe area bottom** (home indicator): 34 (usare `env(safe-area-inset-bottom)`)
- **Bottom-nav altezza**: 72 (posizionata sopra safe-bottom)
- **Viewport utile schermata standard**: 390 × (844 − 47 − 72 − 34) = 390 × 691

---

## 2. Bottom-nav (elemento trasversale)

**Presente in tutte le schermate tranne Workout esecuzione.**

### Layout

```
posizione: fixed bottom
altezza: 72
larghezza: 390
z-index: 90 (sotto timer overlay, sopra tutto il resto)
padding-bottom: env(safe-area-inset-bottom)  [+34]
bg: var(--bg-app)
border-top: 1px var(--sep)
```

### Struttura interna

4 tab equidistanziati, ognuno 390/4 = 97.5px di larghezza, contenuto centrato.

```
┌───────┬───────┬───────┬───────┐  altezza 72
│ 🏠    │ 💪    │ 📈    │ 👤    │  icona 24 (linea, non filled)
│ Home  │Work.  │Prog.  │Profilo│  label S 12/500 (XS eccezione)
└───────┴───────┴───────┴───────┘
```

### Stati

| Stato | Icona | Label | Notifica |
|---|---|---|---|
| Inattivo | `--text-dim` | `--text-dim` 12/500 | — |
| Attivo | `--primary` | `--primary` 12/600 | — |
| Con badge (Profilo, se sessioni non chiuse > 0) | `--text-dim` | `--text-dim` | dot 8×8 `--warning` in alto a destra dell'icona, offset (-2, -2) |

### Annotazioni
- Tap target intera area cella (97.5 × 72), non solo icona
- Nessuna transizione al cambio tab della nav stessa; il fade 260ms avviene sul contenuto sopra
- Aria: `role="tablist"` sul contenitore, `role="tab"` + `aria-selected="true|false"` su ciascuno
- Nessun hover state (mobile-first)
- Focus-visible: outline `--primary` 2px offset -2px (interno) per non superare la nav

---

## 3. Schermata: Home

**Frase:** *Riprendo l'allenamento di oggi.*
**Viewport:** 390 × 844 · bottom-nav visibile · tab attivo: **Home**

### 3.1 Stato B — Pronto (scheda attiva, nessuna sessione) — variante canonica

#### Layout pixel-accurato

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
       │                          │  padding 24
y=71   │  Push · Pull             │  M 16/500 --text
y=95   │  Settimana 3 · Giovedì   │  S 14/400 --text-dim
y=115  │                          │
       │                          │  spacer 48
y=163  │                          │
       │   ┌────────────────────┐ │  x=24, w=342
y=163  │   │                    │ │
       │   │      INIZIA        │ │  CTA 56, radius 16, bg --primary
y=219  │   │                    │ │  testo L 20/600 #FFF
       │   └────────────────────┘ │
y=219  │                          │
       │                          │  spacer 16
y=235  │   ┌────────────────────┐ │
       │   │   Cambia giorno    │ │  CTA M ghost 48, bordo 1px --sep
y=283  │   │                    │ │  testo M 16/500 --text
       │   └────────────────────┘ │
y=283  │                          │
       │                          │  flex spacer (spinge nav in basso)
       │                          │
y=738  ├──────────────────────────┤
       │  bottom-nav 72           │
y=810  ├──────────────────────────┤
       │ ▓▓ safe area bottom (34)▓│
y=844  └──────────────────────────┘
```

#### Tabella elementi

| # | Nome | Componente | Posizione (x, y, w, h) | Tipografia | Colore testo | Colore bg | Peso visivo |
|---|---|---|---|---|---|---|---|
| 1 | Nome scheda | Testo | (24, 71, 342, 24) | M 16/500 | `--text` | — | secondario |
| 2 | Meta settimana·giorno | Testo | (24, 95, 342, 20) | S 14/400 | `--text-dim` | — | marginale |
| 3 | CTA INIZIA | CTA dominante | (24, 163, 342, 56) | L 20/600 | `#FFFFFF` | `--primary` | **dominante** |
| 4 | CTA Cambia giorno | CTA M ghost | (24, 235, 342, 48) | M 16/500 | `--text` | trasparente + bordo `--sep` | secondario |
| 5 | Bottom-nav | (trasversale) | (0, 738, 390, 72) | — | — | `--bg-app` | trasversale |

#### Palette usata

| Elemento | Light | Dark |
|---|---|---|
| bg schermata | `#FFFFFF` | `#0B0B0F` |
| CTA INIZIA bg | `#7C3AED` | `#8B5CF6` |
| CTA INIZIA testo | `#FFFFFF` | `#FFFFFF` |
| CTA Cambia giorno bordo | `#E4E4E9` | `#26262E` |
| testo primario | `#0B0B0F` | `#F2F2F5` |
| testo dim | `#6B6B75` | `#9A9AA5` |

#### Spaziature
- Top safe + 24 → prima riga
- 24 verticali tra meta (2) e blocco meta (1)
- **48 (spacer respirante) tra meta e CTA dominante** — impone gerarchia
- 16 tra CTA dominante e CTA M ghost
- Flex spacer inferiore (spinge la nav)
- Padding H schermata: 24

#### Annotazioni
- **Focus iniziale**: tab-order = CTA INIZIA → CTA Cambia giorno (skip meta, non focusable)
- **INIZIA** su tap → naviga in Workout esecuzione (§4); vibrate(10)
- **Cambia giorno** su tap → apre sheet §7.1 dal basso; nessun cambio route
- Nessuna animazione di ingresso sui singoli elementi; solo fade tab del contenitore
- Aria: `<main aria-labelledby>` senza h1 visibile (nessun titolo schermata §11.3); il tab attivo nella nav è l'orientamento accessibile

### 3.2 Stato A — Sessione in corso (variante)

**Differenze rispetto a 3.1:**

| # | Cambia | Da | A |
|---|---|---|---|
| 2 | Meta (aggiunge terza riga) | 2 righe | 3 righe: nome scheda / settimana·giorno / **`in corso · 12:34`** (S 14/400 `--success`) |
| 3 | Label CTA dominante | `INIZIA` | `RIPRENDI` |

L'altezza dinamica si assorbe nel flex spacer superiore (le CTA restano ancorate al centro visivo).

### 3.3 Stato C — Nessuna scheda

```
y=71   Nessuna scheda attiva     M 16/500 --text
y=95   Importa un file .json     S 14/400 --text-dim
       per iniziare.
y=163  ┌──────────────────────┐
       │   IMPORTA SCHEDA     │  CTA dominante 56 --primary
       └──────────────────────┘
       (nessuna CTA secondaria)
```

Tap su IMPORTA SCHEDA apre file picker nativo (`<input type=file accept=".json">`).

---

## 4. Schermata: Workout — esecuzione

**Frase:** *Registro la serie che sto facendo.*
**Viewport:** 390 × 844 · **bottom-nav nascosta** · nessun titolo · unica via di uscita: riga contesto o auto-navigazione

### 4.1 Layout pixel-accurato

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
y=63   │  Blocco 2/4 · Giro 1/3   │  riga contesto 32, S 14/400 --text-dim
y=79   ├──────────────────────────┤  hairline --sep 1px
       │                          │  spacer 24
y=103  │      Panca piana         │  L 24/600 --text, centrato
       │                          │  spacer 24
y=151  │   ┌───┐┌────────┐┌───┐   │
       │   │ − ││   60   ││ + │   │  stepper KG, altezza 88
y=239  │   └───┘└────────┘└───┘   │  numero XL 40/700, tabular
y=255  │           kg             │  XS 12/400 uppercase --text-dim, centrata
       │                          │  spacer 16
y=271  │   ┌───┐┌────────┐┌───┐   │
       │   │ − ││    8   ││ + │   │  stepper REPS, altezza 72
y=343  │   └───┘└────────┘└───┘   │  numero L 24/700, tabular
y=359  │          reps            │  XS 12/400 uppercase --text-dim
       │                          │  spacer 8
y=375  │       max 65 kg          │  XS 12/400 --text-dim, centrata
       │                          │
       │       flex spacer        │
       │                          │
y=740  │   ┌────────────────────┐ │
       │   │    REGISTRA ✓      │ │  CTA dominante 64, --primary
y=804  │   └────────────────────┘ │  testo L 20/600 #FFF
       │                          │  spacer 16
y=820  ├──────────────────────────┤
       │ ▓▓ safe area bottom (24)▓│  ridotta a 24 quando nav nascosta
y=844  └──────────────────────────┘
```

### 4.2 Componente Stepper (spec dettagliata)

```
┌───────┐  ┌──────────────┐  ┌───────┐
│   −   │  │      60      │  │   +   │
└───────┘  └──────────────┘  └───────┘
  64×88       h calc            64×88
             208×88 KG
             208×72 REPS
```

| Sotto-elemento | KG (dominante) | REPS (primario) |
|---|---|---|
| Contenitore | 342×88 flex row gap 8 | 342×72 flex row gap 8 |
| Tasto − / + | 64×88, bordo 1px `--sep`, radius 12, glyph 24/600 `--text` | 64×72, idem |
| Cella numero | flex-grow, bordo 1px `--sep`, radius 12, bg `--bg-elev` | idem |
| Testo numero | XL 40/700 `--text`, tabular-nums, centrato | L 24/700 `--text`, tabular-nums |
| Step | ±2.5 | ±1 |
| Long-press | delay 400ms, poi 100ms/step | delay 400ms, poi 100ms/step |

### 4.3 Tabella elementi

| # | Nome | Componente | Posizione (x, y, w, h) | Tipografia | Colore | Peso visivo |
|---|---|---|---|---|---|---|
| 1 | Riga contesto | Row header tap-abile | (0, 47, 390, 32) | S 14/400 | `--text-dim` | marginale |
| 1a | Hairline sotto | Border-bottom | (0, 79, 390, 1) | — | `--sep` | — |
| 2 | Nome esercizio | Testo centrato | (24, 103, 342, 32) | L 24/600 | `--text` | primario |
| 3 | Stepper KG | Stepper 88 | (24, 151, 342, 88) | XL 40/700 num | `--text` | **dominante** |
| 3a | Label "kg" | Testo centrato | (24, 255, 342, 16) | XS 12/400 UP | `--text-dim` | marginale |
| 4 | Stepper REPS | Stepper 72 | (24, 271, 342, 72) | L 24/700 num | `--text` | primario |
| 4a | Label "reps" | Testo centrato | (24, 359, 342, 16) | XS 12/400 UP | `--text-dim` | marginale |
| 5 | Hint max | Testo centrato | (24, 375, 342, 16) | XS 12/400 | `--text-dim` | marginale |
| 6 | CTA REGISTRA ✓ | CTA dominante | (24, 740, 342, 64) | L 20/600 | `#FFF` on `--primary` | **dominante** (co-dominante con stepper KG, giustificata da regola §2.1: dominante + primario; stepper KG viene ridotto a primario in questa vista dal peso visivo del CTA fullwidth in fondo) |

**Chiarimento gerarchia:** in Workout esec. lo "stepper KG" nel Blueprint è dominante; il CTA REGISTRA è il vero elemento che chiude la missione ("registro la serie") ed è geograficamente il più pesante (viola + fullwidth + 64px). Applicazione della regola §2.1 revisione v2: **il CTA REGISTRA è dominante; lo stepper KG è primario alto**. Il rapporto area è ~3:2 in favore del CTA se si conta il viola. Nessuna gara: viola + posizione fondo = unico attrattore terminale.

### 4.4 Palette usata

| Elemento | Light | Dark |
|---|---|---|
| bg schermata | `#FFFFFF` | `#0B0B0F` |
| bg cella numero stepper | `#F6F6F8` | `#141419` |
| bordo cella stepper e tasti | `#E4E4E9` | `#26262E` |
| CTA REGISTRA bg | `#7C3AED` | `#8B5CF6` |
| CTA REGISTRA testo | `#FFFFFF` | `#FFFFFF` |
| testo primario | `#0B0B0F` | `#F2F2F5` |
| testo dim (contesto, label, hint) | `#6B6B75` | `#9A9AA5` |

### 4.5 Spaziature

Padding H = 24 · contesto top-safe + 16 · nome esercizio spacer 24 · stepper KG spacer 24 · label kg spacer 8 · stepper REPS spacer 16 · label reps spacer 8 · hint spacer 8 · CTA in fondo con spacer 16 dal safe-bottom.

### 4.6 Annotazioni

- **Bottom-nav nascosta** (§4 Blueprint). Safe-bottom ridotta a 24 (invece di 34+72 = 106).
- **Riga contesto**: `role="button"`, `aria-label="Vai alla mappa dei blocchi"`, tap-target intera larghezza x altezza 32 (min 44 sarebbe ideale ma qui è compensato da posizione top-safe extra).
- **Stepper − / +**: tap-target 64×88 (KG) o 64×72 (REPS), entrambi ≥ 44×44.
- **REGISTRA ✓**: azione + vibrate(10). Loading state non necessario (scrittura IndexedDB immediata).
- **Preset dinamici**: valore stepper cambia allo swap set senza animazione (evita motion sickness durante allenamento).
- **Focus order**: contesto → − KG → + KG → − REPS → + REPS → REGISTRA. (I numeri non sono focusable direttamente: si modificano via tasti stepper.)
- **Aria live**: alla registrazione, annunciare `polite`: "Set registrato. Prossimo: [esercizio] [kg]×[reps]."
- **Auto-advance**: dopo Registra, se blocco singolo → stesso esercizio next set; se circuit → esercizio successivo del giro. Vedi §4 Blueprint per matrice completa.

### 4.7 Stato con timer attivo (con overlay §6)

Layout invariato, sovrapposto dal Timer overlay §6. Il CTA REGISTRA resta interattivo sotto (l'utente può registrare il set successivo prima che il countdown scada). Vedi §6 per l'overlay.

---

## 5. Schermata: Workout — mappa

**Frase:** *Vado al prossimo blocco.*
**Viewport:** 390 × 844 · bottom-nav visibile · tab attivo: **Workout**

### 5.1 Layout pixel-accurato (stato normale)

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
y=63   │  Push · Sessione 34:12   │  meta 32, S 14/400 --text-dim
y=79   ├──────────────────────────┤  hairline
       │                          │  spacer 24
y=103  │  ✓  Riscaldamento        │  M 16/500 --text-dim, row 48
y=151  │  ✓  Panca piana          │  M 16/500 --text-dim, row 48
y=199  │ ┌──────────────────────┐ │
       │ │ •  Rematore          │ │  row 56, bg --bg-elev, radius 12
y=255  │ └──────────────────────┘ │  L 20/600 --text (posizione corrente)
y=255  │  ○  Dip                  │  M 16/500 --text, row 48
y=303  │  ○  Pull-up              │  M 16/500 --text, row 48
       │                          │
       │       flex spacer        │
       │                          │
y=666  │   ┌────────────────────┐ │
       │   │    Fine sessione   │ │  M ghost 48
y=714  │   └────────────────────┘ │
y=714  ├──────────────────────────┤  spacer 24
y=738  ├──────────────────────────┤
       │  bottom-nav 72           │
y=810  ├──────────────────────────┤
       │ ▓▓ safe area bottom (34)▓│
y=844  └──────────────────────────┘
```

### 5.2 Row lista — spec dettagliata

Ogni row lista = 342px di larghezza (24 padding H) x 48/56 altezza. Struttura interna:

```
┌────┬──────────────────────────────┐
│ 24 │  Nome esercizio              │
└────┴──────────────────────────────┘
 col1        col2
```

- **col1** (icona stato): 24×24 centrata verticalmente, con margine dx 16 → totale 40 di spazio riservato
- **col2** (nome): flex-grow, testo M 16/500 (dim se ✓, primario se ○, L 20/600 primario se `•`)
- Row corrente `•`: **bg `--bg-elev` + radius 12 + padding H 16** interno alla row, altezza 56

### 5.3 Tabella elementi

| # | Nome | Componente | Posizione (x, y, w, h) | Tipografia | Colore | Peso visivo |
|---|---|---|---|---|---|---|
| 1 | Meta sessione | Testo | (24, 63, 342, 16) | S 14/400 | `--text-dim` | marginale |
| 1a | Hairline | Border | (0, 79, 390, 1) | — | `--sep` | — |
| 2a | Row ✓ Riscaldamento | Row lista 48 | (24, 103, 342, 48) | M 16/500 | `--text-dim` + icona `--success` | secondario |
| 2b | Row ✓ Panca piana | Row lista 48 | (24, 151, 342, 48) | M 16/500 | `--text-dim` + icona `--success` | secondario |
| 2c | **Row • Rematore (corrente)** | Row lista 56 evidenziata | (24, 199, 342, 56) | L 20/600 | `--text` + icona `--primary` + bg `--bg-elev` | **primario** |
| 2d | Row ○ Dip | Row lista 48 | (24, 255, 342, 48) | M 16/500 | `--text` + icona `--text-dim` | secondario |
| 2e | Row ○ Pull-up | Row lista 48 | (24, 303, 342, 48) | M 16/500 | `--text` + icona `--text-dim` | secondario |
| 3 | CTA Fine sessione | CTA M ghost | (24, 666, 342, 48) | M 16/500 | `--text` on trasparente + bordo `--sep` | secondario |

**Nessun elemento dominante nella variante normale** — la mappa è per orientamento, non per azione. La row corrente `•` è primaria (chi guarda cerca prima di tutto "dove sono").

### 5.4 Variante 5.1-BIS — Ultimo blocco completato (promozione)

Layout identico, con queste modifiche:

| # | Cambia | Da | A |
|---|---|---|---|
| Tutte le row | Icona | mix ✓/•/○ | tutte ✓ |
| Tutte le row | Colore | mix | `--text-dim` (tutte "fatte") |
| 3 | CTA Fine sessione | M ghost 48 | **CTA dominante 56 `--primary`**, testo L 20/600 `#FFF` |
| 3 | Posizione y | 666 | 658 (per compensare l'altezza extra) |

**Regola** (§5 Blueprint v2): la promozione avviene **solo** quando tutti i blocchi sono ✓ — la CTA diventa l'unica missione residua della schermata, quindi lecito assumere il viola.

### 5.5 Palette usata

| Elemento | Light | Dark |
|---|---|---|
| bg schermata | `#FFFFFF` | `#0B0B0F` |
| bg row corrente | `#F6F6F8` | `#141419` |
| icona ✓ | `#059669` | `#10B981` |
| icona • | `#7C3AED` | `#8B5CF6` |
| icona ○ | `#6B6B75` | `#9A9AA5` |
| Fine sessione (promossa) | `#7C3AED` bg | `#8B5CF6` bg |

### 5.6 Annotazioni

- Tap su row → naviga a §4 esecuzione posizionato su quel blocco (anche completati, per correzione)
- Tap su Fine sessione → chiude sessione, salva, naviga a Home §3 stato B
- Fine sessione **non compare** se 0 set registrati (§5 Blueprint)
- Aria: `role="list"` sul contenitore, `role="listitem"` su ogni row; row corrente `aria-current="location"`
- Focus order: prima row (top) → ... → ultima row → Fine sessione
- Nessuna animazione tra stato normale e promosso; la promozione è persistente (non transient)

---

## 6. Overlay: Timer dock

**Frase:** *Aspetto la fine del recupero.*
**Posizione:** overlay bottom sopra Workout esecuzione · **non è una schermata standalone**

### 6.1 Layout pixel-accurato

```
Schermata sottostante (Workout esec.) offuscata con overlay rgba(0,0,0,0.4)

y=628  ┌──────────────────────────┐  overlay start
       │                          │
       │                          │  spacer 24
y=652  │         00:42            │  countdown XL 56/700, tabular
y=716  │                          │  spacer 8
y=724  │   prossimo: Panca 60×8   │  S 14/400 --text-dim, centrato
y=744  │                          │  spacer 16
y=760  │   ┌────────────────────┐ │
       │   │       Salta        │ │  CTA M ghost 48, bordo --sep
y=808  │   └────────────────────┘ │
y=808  │                          │  spacer 16
y=824  ├──────────────────────────┤
       │ ▓▓ safe area bottom     ▓│
y=844  └──────────────────────────┘

Altezza overlay: 196 (da y=628 a y=824)
```

### 6.2 Tabella elementi

| # | Nome | Componente | Posizione (x, y, w, h) | Tipografia | Colore | Peso visivo |
|---|---|---|---|---|---|---|
| 0 | Backdrop | Overlay | (0, 0, 390, 628) | — | `rgba(0,0,0,0.4)` (light) o `rgba(0,0,0,0.6)` (dark) | — |
| 1 | Card overlay | Container | (0, 628, 390, 196) | — | `--bg-app` + radius top 16 + shadow soft | container |
| 2 | Countdown | Testo | (0, 652, 390, 64) | XL 56/700 tabular | `--text` | **dominante** |
| 3 | Next-up | Testo | (24, 724, 342, 20) | S 14/400 | `--text-dim` | marginale |
| 4 | CTA Salta | CTA M ghost | (24, 760, 342, 48) | M 16/500 | `--text` on trasparente + bordo `--sep` | secondario |

### 6.3 Palette usata

| Elemento | Light | Dark |
|---|---|---|
| Backdrop | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.6)` |
| bg card overlay | `#FFFFFF` | `#0B0B0F` |
| shadow card | `0 -8px 32px rgba(0,0,0,0.24)` | `0 -8px 32px rgba(0,0,0,0.48)` |
| Countdown | `#0B0B0F` | `#F2F2F5` |
| Next-up | `#6B6B75` | `#9A9AA5` |

### 6.4 Etichetta "prossimo" — varianti

| Contesto timer | Testo Next-up |
|---|---|
| Tra set stesso esercizio | `prossimo: Panca 60×8` |
| Fine giro (circuit/superset) | `prossimo giro: Panca` (solo primo esercizio del giro) |
| Ultimo set (nessun prossimo) | `ultimo set del blocco` |

### 6.5 Annotazioni

- **Backdrop cliccabile? No.** Non chiude il timer (evita chiusure accidentali sudando).
- **Salta**: skippa il timer, avanza allo stato successivo (set/giro). Vibrate(10).
- **Countdown decremento**: swap immediato ogni secondo, `tabular-nums` evita salto.
- **z-index**: 100 (sopra bottom-nav — ma la bottom-nav in Workout esec. è già nascosta).
- **Chiusura automatica**: quando raggiunge 00:00, transition-out translateY 240ms, poi rimozione. L'utente può registrare mentre scorre — a quel punto il timer si dissolve immediatamente (fade 100ms).
- **Aria**: `role="timer"` sul countdown, `aria-live="off"` (non annunciare ogni secondo). `aria-live="polite"` una sola volta a 00:00 con "Recupero terminato".
- **Focus**: quando il timer appare, il focus resta sul CTA REGISTRA sottostante (l'utente può continuare). Nessun focus trap.

---

## 7. Schermata: Progressi

**Frase:** *Vedo se sto migliorando.*
**Viewport:** 390 × 844 · bottom-nav visibile · tab attivo: **Progressi**

### 7.1 Layout pixel-accurato

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
       │                          │  spacer 48 (respiro Progressi = calmo)
y=95   │                          │
y=95   │       12 500 kg          │  XL 44/700 tabular, centrato --text
y=147  │       ultimo mese        │  S 14/400 --text-dim, centrato
y=167  │                          │  spacer 16
y=183  │    ↑ 8% vs mese prec     │  M 18/600 --success, centrato
y=209  │                          │  spacer 48
y=257  ├──────────────────────────┤  hairline --sep
       │                          │  spacer 24
y=281  │  RECORD                  │  XS 12/400 up, tracking 0.06em --text-dim
y=297  │                          │  spacer 16
y=313  │  Panca         92,5 kg   │  M 16/500 --text (nome) / L 20/600 --text (num)
y=361  │  Squat         120 kg    │  M / L (row 48)
y=409  │  Stacco        140 kg    │  M / L (row 48)
y=457  │                          │
       │       flex spacer        │
       │                          │
y=738  ├──────────────────────────┤
       │  bottom-nav 72           │
y=810  ├──────────────────────────┤
       │ ▓▓ safe area bottom (34)▓│
y=844  └──────────────────────────┘
```

### 7.2 Tabella elementi

| # | Nome | Componente | Posizione (x, y, w, h) | Tipografia | Colore | Peso visivo |
|---|---|---|---|---|---|---|
| 1 | Numero Volume | Testo centrato | (24, 95, 342, 52) | XL 44/700 tabular | `--text` | **dominante** |
| 2 | Sotto-label | Testo centrato | (24, 147, 342, 20) | S 14/400 | `--text-dim` | marginale |
| 3 | Trend | Testo centrato | (24, 183, 342, 26) | M 18/600 | `--success` (o `--danger`/`--text-dim`) | primario |
| — | Hairline separazione | Border | (0, 257, 390, 1) | — | `--sep` | — |
| 4 | Label RECORD | Testo | (24, 281, 342, 16) | XS 12/400 UP tracking .06 | `--text-dim` | marginale |
| 5a | Row Panca | Row lista 48 con num a dx | (24, 313, 342, 48) | M 16/500 nome, L 20/600 num tabular | `--text` / `--text` | secondario |
| 5b | Row Squat | Row lista 48 | (24, 361, 342, 48) | idem | idem | secondario |
| 5c | Row Stacco | Row lista 48 | (24, 409, 342, 48) | idem | idem | secondario |

### 7.3 Row RECORD — struttura interna

```
┌──────────────────────────────┬──────────┐
│  Nome esercizio              │   Valore │
└──────────────────────────────┴──────────┘
  M 16/500 --text                L 20/600 tabular
  flex-grow, align sx            align dx
```

### 7.4 Regole colore per Trend

| Segno numerico | Icona | Colore |
|---|---|---|
| `> +2%` | `↑` | `--success` |
| `-2% ~ +2%` (stabile) | `→` — vietato, usare `·` | `--text-dim` |
| `< -2%` | `↓` | `--danger` |

**Correzione:** per il caso "stabile" non usare freccia orizzontale (vietata §11.14). Usare **bullet `·`** o testo puro `stabile vs mese prec` senza glyph.

### 7.5 Palette usata

| Elemento | Light | Dark |
|---|---|---|
| bg schermata | `#FFFFFF` | `#0B0B0F` |
| numero dominante | `#0B0B0F` | `#F2F2F5` |
| trend positivo | `#059669` | `#10B981` |
| trend negativo | `#DC2626` | `#EF4444` |
| trend stabile | `#6B6B75` | `#9A9AA5` |
| hairline | `#E4E4E9` | `#26262E` |

### 7.6 Stato vuoto (nessuna sessione)

```
y=95   Nessuna sessione registrata
       (M 16/500 --text, centrato)
y=127  Torna qui dopo il primo allenamento
       per vedere i tuoi progressi.
       (S 14/400 --text-dim, centrato, 2 righe)
```

Nessuna CTA — Progressi non ha CTA, quindi lo stato vuoto è puramente informativo. L'azione di iniziare vive in Home.

### 7.7 Annotazioni

- **Nessuna dashboard** (§11.11): una sola domanda risposta.
- **Trend calcolo**: `(volume_mese_corrente - volume_mese_precedente) / volume_mese_precedente * 100`. Se mese precedente = 0, mostrare "prima misurazione".
- **Aria**: numero volume `aria-label="Volume totale ultimo mese: 12 500 chilogrammi"`; trend `aria-label="In aumento dell'8 percento rispetto al mese precedente"`.
- **Tap sulle row RECORD**: **nessuna azione** in v2 (non c'è drill-down). Non ha `role="button"`, non ha focus.
- **Nessuna sparkline** (tagliata in Blueprint v2 §13).

---

## 8. Schermata: Profilo

**Frase:** *Metto al sicuro i miei dati.*
**Viewport:** 390 × 844 · bottom-nav visibile · tab attivo: **Profilo**

### 8.1 Layout pixel-accurato — Stato "Sync attivo"

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
       │                          │  spacer 24
y=71   │  ● Sync attivo           │  L 20/600 --text, dot 12 --success
y=99   │  ultimo backup 2h fa     │  S 14/400 --text-dim
y=119  │                          │  spacer 24
y=143  │   ┌────────────────────┐ │
       │   │    Backup ora      │ │  CTA dominante 56 --primary
y=199  │   └────────────────────┘ │
y=199  │                          │  spacer 32
y=231  ├──────────────────────────┤  hairline
       │                          │  spacer 16
y=247  │  DATI                    │  XS 12/400 up
y=263  │                          │  spacer 16
y=279  │  ┌──────────┬──────────┐ │  affiancati, gap 8
       │  │ Esporta  │ Importa  │ │  M ghost 48
y=327  │  └──────────┴──────────┘ │  ognuno 167×48
y=327  │                          │  spacer 32
y=359  ├──────────────────────────┤  hairline (condizionale)
       │                          │  spacer 16
y=375  │  SESSIONI NON CHIUSE     │  XS 12/400 up (condizionale)
y=391  │                          │  spacer 16
y=407  │  Push · 2 giorni fa      │  M 16/500 --text (nome+meta insieme)
y=431  │  [Riprendi]  [Scarta]    │  2 chip 44
y=475  │                          │
       │       flex spacer        │
       │                          │
y=666  │   ┌────────────────────┐ │
       │   │   Impostazioni     │ │  M ghost 48
y=714  │   └────────────────────┘ │
y=714  │                          │  spacer 24
y=738  ├──────────────────────────┤
       │  bottom-nav 72 (con badge  se sessioni > 0)
y=810  ├──────────────────────────┤
       │ ▓▓ safe area bottom (34)▓│
y=844  └──────────────────────────┘
```

### 8.2 Tabella elementi

| # | Nome | Componente | Posizione (x, y, w, h) | Tipografia | Colore | Peso visivo |
|---|---|---|---|---|---|---|
| 1a | Dot sync | Cerchio 12 | (24, 79, 12, 12) | — | `--success` (attivo) / `--warning` (desync) / `--danger` (errore) | marginale |
| 1b | Testo sync | Testo | (44, 71, 322, 28) | L 20/600 | `--text` | secondario |
| 1c | Ultimo backup | Testo | (44, 99, 322, 20) | S 14/400 | `--text-dim` | marginale |
| 2 | CTA Backup ora | CTA dominante 56 | (24, 143, 342, 56) | L 20/600 | `#FFF` on `--primary` | **dominante** |
| — | Hairline #1 | Border | (0, 231, 390, 1) | — | `--sep` | — |
| 3a | Label DATI | Testo | (24, 247, 342, 16) | XS 12/400 UP | `--text-dim` | marginale |
| 3b | Coppia Esporta/Importa | 2× CTA M ghost | (24, 279, 342, 48) gap 8 | M 16/500 | `--text` | secondario |
| — | Hairline #2 (cond) | Border | (0, 359, 390, 1) | — | `--sep` | — |
| 4a | Label SESSIONI (cond) | Testo | (24, 375, 342, 16) | XS 12/400 UP | `--text-dim` | marginale |
| 4b | Row sessione | Row lista 48 | (24, 407, 342, 48) | M 16/500 | `--text` | secondario |
| 4c | Chip azioni | 2× Chip 44 gap 8 | (24, 431, 342, 44) | S 14/500 | `--text` (Riprendi) / `--danger` (Scarta) | secondario |
| 5 | CTA Impostazioni | CTA M ghost | (24, 666, 342, 48) | M 16/500 | `--text` | secondario |

### 8.3 Stato "Sync non configurato"

Differenze:

| # | Cambia | Da | A |
|---|---|---|---|
| 1a | Dot | `● --success` | `● --text-dim` |
| 1b | Testo | `Sync attivo` | `Sync non configurato` |
| 1c | Ultimo backup | `2h fa` | `— nessun backup effettuato` |
| 2 | CTA label | `Backup ora` | `Configura sync` |
| 2 | CTA azione | Backup diretto | Apre sotto-vista §9.2 |

### 8.4 Stato "Sync in errore"

| 1a | `● --danger` |
| 1b | `Sync in errore` |
| 1c | S 14/400 `--danger`: `verifica token o connessione` |
| 2 | CTA label: `Riprova backup` |

### 8.5 Palette usata

| Elemento | Light | Dark |
|---|---|---|
| dot sync attivo | `#059669` | `#10B981` |
| dot sync non config | `#6B6B75` | `#9A9AA5` |
| dot sync errore | `#DC2626` | `#EF4444` |
| CTA Backup dominante | `#7C3AED` bg | `#8B5CF6` bg |
| Chip Riprendi | trasparente + bordo `--sep`, testo `--text` | idem |
| Chip Scarta | trasparente + bordo `--danger`, testo `--danger` | idem |
| Testo errore | `#DC2626` | `#EF4444` |

### 8.6 Annotazioni

- **Un solo viola** (§11.4): CTA Backup ora / Configura sync / Riprova backup (mutex).
- **Chip Scarta**: colore rosso ma **senza modale** (l'operazione è recuperabile finché la sessione resta orfana). Vibrate(20) extra come segnale.
- **Chip Riprendi**: apre §4 esecuzione sulla sessione salvata.
- **Impostazioni** → apre sotto-vista fullscreen §9.3.
- **Aria**: dot sync `aria-hidden="true"` (info duplicata dal testo); il testo di stato è `role="status"` con `aria-live="polite"`.
- **Focus order**: Backup ora → Esporta → Importa → (Riprendi → Scarta se presenti) → Impostazioni.

---

## 9. Overlays e sotto-viste

### 9.1 Sheet "Cambia giorno"

**Aperto da:** CTA "Cambia giorno" in Home (§3).
**Comportamento:** slide-up dal basso, occupa 65% viewport (549px).

#### Layout

```
y=0    ┌──────────────────────────┐
       │  ▓  backdrop rgba .3    ▓│
       │  ▓                      ▓│
y=295  ├──────────────────────────┤
       │        ── (dragger)      │  8×48 pill --sep, centrata
y=311  │                          │  spacer 24
y=335  │  SCHEDA                  │  XS 12/400 UP (condizionale >1 scheda)
y=351  │  ┌────────┐ ┌──────────┐ │
       │  │Push·Pull│ │Full-body│ │  chip 44, gap 8
y=395  │  └────────┘ └──────────┘ │
y=395  │                          │  spacer 24
y=419  │  SETTIMANA               │  XS UP
y=435  │  ┌──┐┌──┐┌──┐┌──┐┌──┐    │
       │  │ 1││ 2││ 3││ 4││ 5│    │  chip 44 x N, gap 8
y=479  │  └──┘└──┘└──┘└──┘└──┘    │
y=479  │                          │  spacer 24
y=503  │  GIORNO                  │  XS UP
y=519  │  ┌──────┐  ┌──────┐      │  tile 88×88, gap 16
       │  │ Lun  │  │ Mar  │      │  M 16/500 centrato
y=607  │  └──────┘  └──────┘      │
y=607  │  ┌──────┐  ┌──────┐      │  spacer 16
       │  │ Mer  │  │ Gio●│      │  ● = attivo (bordo 2px viola + dot br)
y=711  │  └──────┘  └──────┘      │
y=711  ├──────────────────────────┤
       │ ▓▓ safe area bottom (34)▓│
y=844  └──────────────────────────┘
```

*(La griglia giorni è 2×4 se 8 giorni non tutti presenti; auto-flow su altezza dinamica.)*

#### Tile giorno — spec

| Stato | Bordo | Bg | Testo | Marker |
|---|---|---|---|---|
| Inattivo | 1px `--sep` | `--bg-app` | M 16/500 `--text` | — |
| Attivo (giorno oggi) | 2px `--primary` | `--bg-elev` | M 16/600 `--text` | `●` `--primary` bottom-right, offset (-8, -8), size 8 |
| Vuoto (nessuna sessione prevista) | 1px `--sep` | `--bg-app` | M 16/400 `--text-dim` | — |

Tap-target: 88×88 (largamente > 44).

#### Palette

| Elemento | Light | Dark |
|---|---|---|
| Backdrop | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.5)` |
| bg sheet | `#FFFFFF` | `#141419` (`--bg-elev`, elevazione) |
| dragger | `#E4E4E9` | `#26262E` |
| chip attivo bg | `rgba(124,58,237,0.1)` | `rgba(139,92,246,0.15)` |
| tile attivo bordo | `#7C3AED` | `#8B5CF6` |

#### Chiusura
- Tap su backdrop → close 240ms
- Swipe-down sul dragger > 100px → close
- Nessuna ✕ (il dragger e il tap-out sono sufficienti — §2.3 Blueprint)

#### Annotazioni
- Sezione SCHEDA visibile solo se `schede.length > 1`
- Sezione SETTIMANA: chip per ogni settimana disponibile nella scheda selezionata
- Tap su tile giorno = chiude sheet + naviga in §4 esecuzione (nuova sessione) o applica selezione se già in una vista contestuale
- Aria: `role="dialog"` + `aria-modal="true"` + `aria-label="Cambia giorno"`; trap focus dentro il sheet

### 9.2 Sotto-vista **Configura sync GitHub**

**Aperto da:** CTA "Configura sync" in Profilo o tap su stato sync (per modificare).
**Comportamento:** push fullscreen da destra, 240ms.

#### Layout

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
y=55   │                     [ ✕ ]│  44×44 top-right, glyph 20/500 --text
y=99   │  Configura sync          │  L 24/600 --text (H1 sotto-vista OK,
       │                          │  non è "titolo schermata" §11.3)
y=127  │  GitHub · backup crittato│  S 14/400 --text-dim
y=147  │                          │  spacer 32
y=179  │  OWNER                   │  XS UP
       │  ┌──────────────────────┐│
       │  │ mio-user             ││  input 48, radius 12, bordo --sep
       │  └──────────────────────┘│
       │                          │  spacer 16
       │  REPO                    │  XS UP
       │  ┌──────────────────────┐│
       │  │ fit-tracker-data     ││  input 48
       │  └──────────────────────┘│
       │                          │  spacer 16
       │  PATH                    │  XS UP
       │  ┌──────────────────────┐│
       │  │ data/backup.json     ││  input 48
       │  └──────────────────────┘│
       │                          │  spacer 16
       │  BRANCH                  │  XS UP
       │  ┌──────────────────────┐│
       │  │ main                 ││  input 48
       │  └──────────────────────┘│
       │                          │  spacer 16
       │  TOKEN (PAT)             │  XS UP
       │  ┌──────────────────────┐│
       │  │ ●●●●●●●●●●●●●●●● 👁 ││  input 48 password + toggle glyph
       │  └──────────────────────┘│
       │                          │  spacer 48
       │  ┌────────────────────┐  │
       │  │  Salva e testa     │  │  CTA dominante 56 --primary
       │  └────────────────────┘  │
       │                          │
y=810  ├──────────────────────────┤
       │ ▓▓ safe area bottom     ▓│
y=844  └──────────────────────────┘
```

#### Componenti nuovi introdotti

| Componente | Spec | Riuso |
|---|---|---|
| **Input campo** | 342×48, radius 12, bordo 1px `--sep`, bg `--bg-app`, padding H 16, testo M 16/500 `--text`. Focus: bordo 2px `--primary`. | Nel set componenti Blueprint questo era implicito → **aggiungerlo esplicitamente al set** in una revisione futura del Blueprint |
| **Label form** | XS 12/400 UP tracking 0.06em, margin-bottom 4 | — |
| **Toggle mostra password** | Glyph `👁` 20/500 dentro input a destra, tap-target 44×44 | — |

#### Palette

Identica al resto. Il testo di errore validazione input usa `--danger` M 14/500 sotto l'input.

#### Annotazioni
- **✕** top-right → back (equivalente back OS/PWA)
- **Test connessione**: al tap su "Salva e testa" → mostra loader 200ms nel CTA, poi success (verde 2s toast) o error (rosso inline sotto CTA)
- **Aria**: `role="dialog"` con `aria-labelledby` che punta al titolo "Configura sync"
- **Nessun "Torna a Profilo" testuale** (§11.16 v2)

### 9.3 Sotto-vista **Impostazioni**

**Aperto da:** link "Impostazioni" in fondo a Profilo.
**Comportamento:** push fullscreen da destra, 240ms.

#### Layout

```
y=0    ┌──────────────────────────┐
       │ ▓▓ safe area top (47)   ▓│
y=47   ├──────────────────────────┤
y=55   │                     [ ✕ ]│  44×44 top-right
y=99   │  Impostazioni            │  L 24/600 --text
y=127  │                          │  spacer 32
y=159  │  ASPETTO                 │  XS 12/400 UP
y=175  │                          │  spacer 16
y=191  │  Tema                    │  M 16/500 --text (label sx)
y=191  │  ┌──────────────────────┐│  chip toggle a dx, 44 h
       │  │ ○ chiaro  ● scuro   ││  segmented chip, S 14/500
y=235  │  └──────────────────────┘│
y=235  │                          │  spacer 48
y=283  ├──────────────────────────┤  hairline --danger (visibile ma sottile)
       │                          │  spacer 16
y=299  │  DANGER ZONE             │  XS 12/400 UP --danger
y=315  │                          │  spacer 16
y=331  │  Reset dati              │  M 16/500 --danger (link) → modale
y=355  │  Cancella scheda, sessioni│ S 14/400 --text-dim (spiegazione)
       │  e log da questo device. │
y=375  │                          │
       │       flex spacer        │
y=810  ├──────────────────────────┤
       │ ▓▓ safe area bottom     ▓│
y=844  └──────────────────────────┘
```

#### Chip Tema (segmented)

```
┌────────────────┬────────────────┐
│  ○ chiaro      │  ● scuro       │
└────────────────┴────────────────┘
   inattivo         attivo (bg --primary 10%)
```

Struttura: contenitore radius 8, bordo 1px `--sep`, altezza 44, due segmenti equidistribuiti. Tap sul segmento inattivo → toggle + vibrate(10). Il segmento attivo ha bg `rgba(124,58,237,0.1)` e testo `--primary`.

#### Palette

| Elemento | Light | Dark |
|---|---|---|
| Label DANGER ZONE | `#DC2626` | `#EF4444` |
| Reset dati link | `#DC2626` | `#EF4444` |
| hairline danger | `#E4E4E9` (uguale a `--sep`) | `#26262E` |
| Chip tema attivo bg | `rgba(124,58,237,0.1)` | `rgba(139,92,246,0.15)` |

#### Annotazioni
- **Tap su Reset dati** → apre §9.4 modale conferma
- **Aspetto sezione**: spazio per crescita futura (lingua, unità mis., ecc. — sempre in questa sezione, mai sopra la danger zone)
- **Aria**: `role="dialog"` con `aria-labelledby` "Impostazioni"; il gruppo Tema è `role="radiogroup"` con 2 `role="radio"`

### 9.4 Modale conferma Reset

**Aperto da:** tap su "Reset dati" in Impostazioni §9.3.
**Comportamento:** overlay centrato, backdrop scuro.

#### Layout

```
Backdrop rgba(0,0,0,0.5) fullscreen

y=286  ┌──────────────────────────┐  card 342×272, centrata H
       │                          │  radius 16, bg --bg-app, no shadow (backdrop già isola)
       │       ⚠                  │  glyph 32 --danger centrato
       │                          │  spacer 8
       │  Sicuro di voler         │  L 20/600 --text centrato, 2 righe
       │  resettare?              │
       │                          │  spacer 16
       │  Verranno cancellati:    │  S 14/400 --text-dim centrato
       │  • Scheda attiva         │  S 14/400 --text
       │  • Tutte le sessioni     │
       │  • Log e record          │
       │                          │  spacer 24
       │  ┌──────────┬──────────┐ │  2 CTA affiancate 48, gap 8
       │  │ Annulla  │  Reset   │ │  Annulla: M ghost, Reset: M solid --danger #FFF
       │  └──────────┴──────────┘ │
y=558  └──────────────────────────┘
```

#### Componenti

| # | Nome | Componente | Tipografia | Colore |
|---|---|---|---|---|
| 1 | Icona alert | Glyph ⚠ 32 | — | `--danger` |
| 2 | Titolo | Testo centrato | L 20/600 | `--text` |
| 3 | Sotto-titolo | Testo centrato | S 14/400 | `--text-dim` |
| 4 | Lista puntata | Righe centrate | S 14/400 | `--text` |
| 5 | Annulla | CTA M ghost 48 | M 16/500 | `--text` |
| 6 | Reset | CTA M solid 48 | M 16/600 | `#FFF` on `--danger` |

#### Palette

| Elemento | Light | Dark |
|---|---|---|
| Backdrop | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` |
| Card bg | `#FFFFFF` | `#141419` |
| Reset CTA bg | `#DC2626` | `#EF4444` |
| Icona ⚠ | `#DC2626` | `#EF4444` |

#### Annotazioni
- **Focus iniziale**: Annulla (default, safe)
- **Enter** = Annulla; nessun binding per Reset (obbligatorio tap deliberato)
- **Tap backdrop** = chiude senza confermare
- **Aria**: `role="alertdialog"`, `aria-labelledby` sul titolo, `aria-describedby` sulla lista
- **Nessuna animazione di ingresso** oltre fade backdrop 100ms — è una modale seria, no bounce

---

## 10. Note trasversali

### 10.1 Dark mode

- Auto-attivata da `@media (prefers-color-scheme: dark)`
- Override manuale via Impostazioni §9.3 (persiste in localStorage)
- **Nessuna schermata cambia layout** in dark — solo palette
- Ombra timer overlay più opaca in dark (`0.48` vs `0.24`) per compensare contrasto minore

### 10.2 Reduced motion

`@media (prefers-reduced-motion: reduce)`:
- Tab switch: fade 0ms (swap immediato)
- Sheet slide: swap immediato
- Sotto-vista push: fade 0ms (nessun translate)
- CTA press: nessuno scale
- Timer overlay: nessuna transition-out

### 10.3 Focus-visible

Outline uniforme in tutta l'app:
- Colore: `--primary`
- Spessore: 2px
- Offset: 2px (esterno) — su bottom-nav offset -2px (interno) per contenimento
- Border-radius eredita dall'elemento (visibile su CTA con radius 16)

### 10.4 Tap feedback aptico

Solo su azioni con conseguenza:
- REGISTRA ✓: vibrate(10)
- Salta timer: vibrate(10)
- INIZIA / RIPRENDI (Home): vibrate(10)
- Scarta sessione (chip): vibrate(20) — feedback più marcato per azione distruttiva reversibile
- Reset dati confermato: vibrate([30, 50, 30]) — pattern per azione irreversibile

### 10.5 Loading states

Nessuna schermata ha loader dedicato (tutto è locale IndexedDB, tempi < 16ms). Eccezione:
- **Configura sync "Salva e testa"** → il CTA mostra spinner interno (20px) al posto del testo, per max 3s. Timeout → error inline.
- **Backup ora** → il testo CTA cambia in "Backup..." + spinner 20px sx, per la durata reale.

### 10.6 Empty states — recap

| Schermata | Stato vuoto |
|---|---|
| Home | §3.3 "Importa scheda" |
| Workout esec. | Non raggiungibile senza scheda + giorno |
| Workout mappa | Non raggiungibile senza blocchi |
| Progressi | §7.6 "Nessuna sessione registrata" |
| Profilo | Sempre popolato (almeno stato sync + esporta/importa) |

### 10.7 Overflow e safe scroll

- Ogni schermata è progettata per stare **senza scroll** in 390×844.
- Se contenuto eccede (es. Profilo con molte sessioni non chiuse), scroll verticale nel `<main>`, mai nel body. Bottom-nav resta fixed.
- Sheet Cambia giorno con molti giorni: scroll interno con dragger che resta sticky in cima.
- Sotto-vista Configura sync: scroll interno se tastiera on-screen riduce viewport.

### 10.8 Coerenza cross-screen

Le seguenti proprietà sono **identiche** ovunque:
- Font family, size scale, weight
- Radius (16 / 12 / 8)
- Palette (identici hex)
- Spacing scale
- Timing curve motion
- Focus outline
- Bottom-nav (aspetto e comportamento)
- Simboli-giudizio (glyph e colori)

Deviazioni ammesse solo con motivazione scritta nel changelog (§13 Blueprint).

---

## 11. Checklist di consegna per Design Review

Prima di considerare un mockup implementabile:

- [ ] Layout: viewport 390×844 rispettato, con safe-area top e bottom esplicitate
- [ ] Gerarchia: 1 solo dominante identificato; primari ≤ 2
- [ ] Componenti: tutti presenti nel set §2.3 Blueprint (o aggiunti al set con nota esplicita)
- [ ] Palette: solo token dalla tabella §1.1, hex identici light + dark
- [ ] Spaziature: solo valori 4/8/16/24/32/48
- [ ] Tipografia: solo scala XL/L/M/S/XS con size dichiarate in §1.2
- [ ] Annotazioni: stati alternativi, aria, focus order, tap targets ≥ 44 verificati
- [ ] Simboli: nessuna freccia decorativa; solo glyph ammessi in §1.5
- [ ] Motion: nessun timing custom oltre a §1.6
- [ ] Ombra: unica ammessa sul timer overlay §6
- [ ] Consistenza con altre schermate: bottom-nav, palette, font, radius identici

---

*Fine specifica grafica. Pronta per traduzione in Figma o direttamente in CSS/HTML — l'implementazione tecnica sarà oggetto di `12_IMPLEMENTATION_PLAN.md`.*
