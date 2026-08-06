# 10 — NEW DESIGN
**Fit Tracker PWA · redesign definitivo**
*Prodotto seguendo il protocollo `09_DESIGN_EXECUTION_PROTOCOL.md`.*
Data: 2026-08-04
**Versione:** v2 (revisione critica applicata — vedi §13 changelog)

---

## 0. Perché questo documento

Il design attuale funziona ma è **una collezione di features**, non un prodotto guidato da una missione. Ogni schermata prova a fare più cose contemporaneamente: la Home è entry point + selezione + storia; Workout è lista + editor + timer + navigatore; Progressi è una dashboard di 6 KPI; Profilo è dati + backup + reset + KPI ridondanti.

Questo documento **non aggiunge** feature. **Toglie**. Riorganizza. Assegna a ciascuna schermata **una sola missione** e progetta per quella.

Ordine di lettura per chi implementa:
1. §1 *le 6 frasi* (la costituzione — non violarle)
2. §2 *sistema base* (regole trasversali)
3. §3-8 *schermate* (una alla volta)
4. §9 *overlay*
5. §10 *cosa cambia* (checklist tagli/spostamenti)
6. §11 *regole non-negoziabili*

---

## 1. Le 6 frasi (la costituzione)

Ogni schermata deve poter essere descritta con **una** frase soggetto-verbo-oggetto. Se serve un "e", la schermata sta ospitando due missioni.

| # | Schermata | Frase |
|---|---|---|
| 1 | **Home** | *Riprendo l'allenamento di oggi.* |
| 2 | **Workout — esecuzione** | *Registro la serie che sto facendo.* |
| 3 | **Workout — mappa** | *Vado al prossimo blocco.* |
| 4 | **Progressi** | *Vedo se sto migliorando.* |
| 5 | **Profilo** | *Metto al sicuro i miei dati.* |
| 6 | **Timer dock** | *Aspetto la fine del recupero.* |

Ogni PR che introduce elementi in una di queste schermate deve dimostrare che l'elemento **serve alla frase**. Se non serve, non entra.

---

## 2. Sistema base

Ordine del protocollo: **Gerarchia → Layout → Componenti → Spacing → Animazioni → Colori → Interazioni**.
Nessun elemento di livello superiore può essere definito prima di quello sotto.

### 2.1 Gerarchia (livello 1)

**Due scale distinte, non confonderle.**

**Scala tipografica** (peso del testo):

| Peso | Uso | Font |
|---|---|---|
| **XL** | numero dominante — countdown, volume, stepper KG | 40-56/700 |
| **L** | primario — titolo esercizio, stepper REPS, riga corrente lista, testo CTA XL | 20-24/600 |
| **M** | secondario — righe uniformi, testo CTA M | 16-18/500 |
| **S** | contestuale — meta, stato, sotto-label | 14/400 |
| **XS** | micro-label — label sezione uppercase | 12/400 |

**Scala visiva** (dominanza sullo schermo — area occupata + posizione + colore):

| Livello | Uso | Segnale |
|---|---|---|
| **Dominante** | risponde alla missione della schermata | area ≥ 30% del viewport utile, o viola, o entrambi |
| **Primario** | supporta la missione | area 15-25%, contrasto pieno |
| **Secondario** | contesto azionabile | area 5-15%, contrasto pieno |
| **Marginale** | contesto non azionabile | area < 5%, dim |

Un **CTA fullwidth 64px con testo 20/600** è visivamente *dominante* (area + viola) ma tipograficamente *L* (font). Le due scale non coincidono: non citare "XL" ambiguamente.

**Regole di composizione:**
- **Massimo 1 elemento dominante per schermata.** Uno e uno solo.
- Massimo 2 elementi in gara per l'attenzione (dominante + primario, o due primari — mai due dominanti).
- Rapporto area dominante : primario ≥ 2:1.
- Sotto S tipograficamente vive solo ciò che non è né missione né decisione.

### 2.2 Layout (livello 2)

- **Viewport target:** 390×844 (iPhone 14). Tutto viene disegnato qui, **poi** adattato al desktop.
- **Colonna singola** sempre. Nessuna vista a due colonne su mobile.
- **Bottom-nav** fissa 72px, **eccetto** in Workout esecuzione dove si nasconde (focus totale).
- **Top-bar globale attuale (logo + titolo + sottotitolo + bottone tema) → abolita.** La bottom-nav orienta; il tema si sposta in Profilo. Guadagno: ~120px di area utile per ogni schermata.
- **Nessun titolo di schermata.** Il tab attivo nella nav è l'orientamento.

### 2.3 Componenti (livello 3)

Set finito. Nessuno può inventare varianti nuove.

**CTA dominante** — fullwidth, altezza 64px (Workout esecuzione) o 56px (Home, Profilo, Configura sync), radius 16, bg viola, testo L (20/600).

**CTA M ghost** — fullwidth o affiancata, altezza 48px, radius 16, bg trasparente, bordo 1px separatore, testo M (16/500).

**Stepper** — coppia `[−] valore [+]`. Altezza **88px per KG** (numero XL 40/700) o **72px per REPS** (numero L 24/700). Numero centrato, tasti ± ai lati con tap-target ≥ 44×44.

**Card contesto** — nessun bordo, solo padding 24, gerarchia interna a testo puro.

**Chip** — pill radius 8, altezza 44, testo 14/500. Usato per selezione a stati (scheda, settimana, tema). Tap = passa allo stato successivo (ciclico se >2, toggle se 2). Stato attivo: bg viola 10% + testo primary.

**Tile giorno** — usato **solo** nel sheet "Cambia giorno". Card 88×88, radius 12, label 16/500 centrata. Stato attivo: bordo viola 2px + `●` in basso a destra.

**Row lista** — altezza 48 (M) o 56 (L evidenziata), separatore hairline, tap-target intera larghezza.

**Sheet slide-up** — pannello 60-75% viewport, dragger in cima, tap-out chiude. Nessuna ✕: il dragger e il tap-out bastano.

**Sotto-vista modale (fullscreen)** — usata per Configura sync e Impostazioni. Chiusura: **✕** in alto a destra, tap-target 44×44. Back OS/PWA equivalente.

**Modale conferma** — solo per azioni distruttive. Testo + Annulla (default M) + Conferma (destructive, rosso).

**Timer overlay** — bottom, sopra CTA in Workout esecuzione, altezza ~180px, bg semi-opaco (rgba nera ~40%) che oscura il resto. La CTA "Salta" al suo interno è **M ghost 48px standard** (non 44).

### 2.4 Spacing (livello 4)

**Scala unica** (base 8, con 4 come mezzo-passo):
```
4 · 8 · 16 · 24 · 32 · 48
```
Nessun altro valore. Nessun 10, 14, 20, 28.

- Padding card: **24**
- Padding tra elementi in una card: **16**
- Padding tra sezioni: **32**
- Padding tra macro-sezioni (label + contenuto vs successivo): **48**
- Padding safe area top: **24**
- Padding bottom prima della nav: **flex** (respiro elastico)

### 2.5 Animazioni (livello 5)

- **Tab switch:** fade 260ms (già in `go()`).
- **Sheet slide:** transform translateY 240ms cubic-bezier(0.2, 0.8, 0.2, 1).
- **CTA press:** scale 0.98 in 100ms, ritorno 200ms.
- **Timer countdown:** nessuna animazione oltre il cambio di cifra ogni secondo.
- **Rispetto di `prefers-reduced-motion`**: tutti i durata → 0ms, nessun cross-fade.

### 2.6 Colori (livello 6)

Palette minima. Definita in `styles.css` come custom properties.

| Ruolo | Light | Dark |
|---|---|---|
| bg-app | `#FFFFFF` | `#0B0B0F` |
| bg-elev | `#F6F6F8` | `#141419` |
| text-primary | `#0B0B0F` | `#F2F2F5` |
| text-dim | `#6B6B75` | `#9A9AA5` |
| separator | `#E4E4E9` | `#26262E` |
| primary (viola) | `#7C3AED` | `#8B5CF6` |
| success (trend ↑) | `#059669` | `#10B981` |
| warning (backup fail) | `#D97706` | `#F59E0B` |
| danger (reset) | `#DC2626` | `#EF4444` |

**Regola d'uso del colore:**
- Il **viola** identifica **solo** la CTA della missione. Un solo elemento viola per schermata.
- Verde, arancio, rosso sono **giudizi** (trend positivo, warning, pericolo). Mai decorazione.
- Testo dim solo per contesto (S/XS), mai per informazione azionabile.

**Simboli-giudizio ammessi** (non contano come "frecce decorative", che restano vietate):
- `↑` `↓` nel trend: indicano direzione del valore, sono parte del giudizio.
- `✓` `•` `○` nello stato lista: fatto / in corso / da fare.
- `✕` per chiudere overlay/sotto-viste.
- `●` per stato attivo in chip/tile.

### 2.7 Interazioni (livello 7)

- **Tap targets:** minimo 44×44. CTA missionarie 56-64.
- **Stepper:** tap breve = incremento singolo; long-press = incremento continuo (400ms delay, poi 100ms/step).
- **Sheet:** apre con tap su ancora, chiude con tap-out, tap su ✕, o swipe-down.
- **Bottom-nav:** tap = switch immediato con fade 260ms. Nessuna conferma.
- **Focus:** `focus-visible` outline viola 2px offset 2px su tutti gli elementi tabulabili.
- **Feedback aptico:** `navigator.vibrate(10)` su Registra serie e Salta timer (se disponibile).

---

## 3. Schermata: Home

**Frase:** *Riprendo l'allenamento di oggi.*

**Utente:** apre l'app **per allenarsi ora**. Non consulta storia, non cambia tema, non naviga.

### Tre stati (mutex, mai simultanei)

| Stato | CTA dominante | CTA M | Contesto |
|---|---|---|---|
| **Sessione in corso** | **Riprendi** | Cambia giorno | scheda + settimana + giorno in corso + tempo trascorso (S) |
| **Pronto** (scheda attiva, nessuna sessione) | **Inizia** | Cambia giorno | scheda + settimana + giorno suggerito |
| **Nessuna scheda** | **Importa scheda** | — | frase esplicativa (una riga) |

**Sessioni multiple in corso.** La Home mostra sempre **la più recente**. Le eventuali orfane vivono nella sezione "Sessioni non chiuse" in Profilo (§7). Regola: **non bloccante** — l'utente può iniziare un nuovo allenamento anche con orfane in coda; la sezione in Profilo è il posto dove le riprende o le scarta esplicitamente.

### Layout (390×844)

```
┌──────────────────────────┐  y=0
│                          │  respiro 24
├──────────────────────────┤
│  Push · Pull             │  M — nome scheda (18/500)
│  Settimana 3 · Giovedì   │  S — meta (14/400 dim)
├──────────────────────────┤  y≈88
│                          │
│                          │  respiro 48
│                          │
│  ┌────────────────────┐  │
│  │      INIZIA        │  │  XL — CTA 56px viola
│  └────────────────────┘  │
│                          │  respiro 16
│  ┌────────────────────┐  │
│  │   Cambia giorno    │  │  M — ghost 48px
│  └────────────────────┘  │
│                          │
│                          │  respiro flex
├──────────────────────────┤
│    [bottom-nav 72px]     │
└──────────────────────────┘
```

### Cosa cade rispetto ad oggi
- Top bar globale (già trasversale)
- Card "Ultimo allenamento" con `Ripeti →`
- Sotto-hero "Cambiare programma? Prima chiudi…"
- Testi esplicativi che descrivono i bottoni
- Freccia `→` nelle CTA
- Popup automatico "Sessioni non chiuse" → **si sposta in Profilo** come lista

### Sheet "Cambia giorno" (aperta da CTA M)

```
┌──────────────────────────┐
│  ──                      │  dragger
│                          │
│  [Push·Pull] [Full-body] │  chip scheda (solo se >1)
│                          │
│  Sett. [1][2][3][4]      │  chip settimana
│                          │
│  ┌──────┐ ┌──────┐       │
│  │ Lun  │ │ Mar  │       │  tile giorno (label sola)
│  └──────┘ └──────┘       │
│  ┌──────┐ ┌──────┐       │
│  │ Mer  │ │ Gio ●│       │  ● = giorno oggi selezionato
│  └──────┘ └──────┘       │
│                          │
└──────────────────────────┘
```

**Cade dai tile:** "X blocchi · Y esercizi". L'utente sceglie per nome giorno, non per conteggi.

---

## 4. Schermata: Workout — esecuzione

**Frase:** *Registro la serie che sto facendo.*

**Utente:** mani sudate, 30-90s tra un set e l'altro, telefono appoggiato. Minimo tocchi.

Questa è la vista **di default** entrando in Workout. La "vista completa a lista" attuale **non esiste più** — la sua funzione di navigazione va nella §5 (mappa).

### Elementi (in ordine di lettura)

| # | Elemento | Peso | Note |
|---|---|:---:|---|
| 1 | Riga contesto `Blocco 2/4 · Giro 1/3` | S | tap → apre §5 mappa; **nessuna freccia**, il contesto stesso è l'affordance |
| 2 | Nome esercizio | L (24/600) | centrato |
| 3 | Stepper KG (±2.5) | dominante | 88px, numero XL (40/700) |
| 4 | Stepper REPS (±1) | primario | 72px, numero L (24/700) |
| 5 | Hint `max 65 kg` | marginale (XS dim) | sotto lo stepper reps |
| 6 | CTA fullwidth **REGISTRA ✓** | dominante | 64px viola in fondo, testo L (20/600) |

### Layout (390×844)

```
┌──────────────────────────┐  y=0
│  Blocco 2/4 · Giro 1/3   │  S — 32px, contesto (tap → mappa)
├──────────────────────────┤  y=32
│                          │  respiro 24
│                          │
│      Panca piana         │  L — 24/600
│                          │  respiro 24
│  ┌───┐  ┌────┐  ┌───┐    │
│  │ − │  │ 60 │  │ + │    │  dominante — stepper KG 88px
│  └───┘  └────┘  └───┘    │  numero XL 40/700 centrato
│            kg            │  XS — label centrata
│                          │  respiro 16
│  ┌───┐  ┌────┐  ┌───┐    │
│  │ − │  │  8 │  │ + │    │  primario — stepper REPS 72px
│  └───┘  └────┘  └───┘    │  numero L 24/700 centrato
│           reps           │  XS — label centrata
│                          │  respiro 8
│      max 65 kg           │  XS — hint dim
│                          │
│                          │  respiro flex
│  ┌────────────────────┐  │
│  │      REGISTRA ✓    │  │  dominante — CTA 64px viola
│  └────────────────────┘  │
│                          │  respiro 16
└──────────────────────────┘
  (bottom-nav nascosta)
```

### Regole di comportamento
- **Bottom-nav nascosta** in questa vista. Vie di uscita: tap sulla riga contesto (→ mappa), completare il blocco/allenamento (auto-navigazione), gesto back OS/PWA.
- **Preset degli stepper**: ultimo valore registrato per lo stesso esercizio + numero-set, altrimenti target da scheda.
- **Registra ✓** = registra il set corrente + vibrazione 10ms + avanza. Logica di avanzamento:
  - **Blocco singolo esercizio** (es. Panca × 4 serie): set 1 → *timer recupero* → set 2 → …
  - **Blocco multi-esercizio** (circuit ≡ superset): eserc A giro N → eserc B giro N → eserc C giro N → *timer recupero solo a fine giro* → eserc A giro N+1 → …
  - In entrambi i casi lo stepper si preimposta automaticamente al valore del set successivo.
- **Timer overlay** (§8): appare **solo** quando parte un recupero. Durante il timer la CTA è live sotto l'overlay semi-opaco — l'utente può registrare il set successivo prima che scada.
- **A blocco completo**: apre automaticamente il primo esercizio del blocco successivo (nessun bottone "Blocco successivo" transient — l'auto-advance è sufficiente).
- **A ultimo blocco completato**: apre §5 mappa con Fine sessione **promossa a dominante XL viola** (56px). È l'uscita naturale.
- **Salti manuali**: sempre via mappa (§5), mai via frecce nella vista di esecuzione.

### Cosa cade rispetto ad oggi
- Head card con 6 elementi (titolo + timer + done/total + Focus toggle + INIZIO/Fine + progress bar)
- Vista completa a `<details>` per tutti i blocchi
- Toggle "Focus mode" (Focus è la modalità di default)
- Progress % globale (già rappresentato dal contesto `Blocco X/N`)
- Timer sessione (visibile in mappa)
- Roundchip G1/G2/G3 (duplicato dello stato set-done)
- Riga meta blocco (`type • restText • done/total`)
- Testo "prec X · max Y kg" → resta solo "max"
- Frecce ◀ ▶ prev/next
- Testo "Blocco succ." / "Giro succ."
- Bottone "Chiudi giro" separato
- Freccia `←` prima di "Blocco 2/4" (l'affordance del tap si comunica col contesto, non con la freccia)
- Bottone transient "Blocco successivo →" (auto-advance sostitutivo)

---

## 5. Schermata: Workout — mappa

**Frase:** *Vado al prossimo blocco.*

**Utente:** ha appena finito un blocco, si orienta o vuole saltare.

Accesso: tap sulla riga contesto in §4, oppure automatico al completamento dell'ultimo blocco.

### Elementi

| # | Elemento | Peso | Note |
|---|---|:---:|---|
| 1 | Meta `Push · Sessione 34:12` | S | timer sessione qui, non in §4 |
| 2 | Lista blocchi con stato ✓/•/○ | L (row corrente) + M (altre) | tap → §4 sul blocco; nessun testo "← corrente", il bullet e il peso bastano |
| 3 | CTA **Fine sessione** | M ghost (default) → dominante XL viola (se tutti ✓) | in fondo |

### Layout

```
┌──────────────────────────┐  y=0
│  Push · Sessione 34:12   │  S — meta 32px
├──────────────────────────┤  y=32
│                          │  respiro 24
│                          │
│  ✓  Riscaldamento        │  M — 48px, testo dim
│  ✓  Panca piana          │  M
│  •  Rematore             │  L — 56px, bg soft, 600 (posizione corrente)
│  ○  Dip                  │  M
│  ○  Pull-up              │  M
│                          │
│                          │  respiro flex
│  ┌────────────────────┐  │
│  │    Fine sessione   │  │  M — ghost 48px
│  └────────────────────┘  │
├──────────────────────────┤
│    [bottom-nav 72px]     │
└──────────────────────────┘
```

### Regole
- **Fine sessione** appare **solo** se almeno 1 set registrato.
- **Promozione**: quando **tutti** i blocchi sono ✓, Fine sessione diventa **dominante XL viola** (fullwidth 56px). È l'uscita naturale della schermata; il viola diventa lecito perché è ora l'unica missione residua.
- Tap su riga blocco: torna a §4 posizionato su quel blocco (anche completati, per correzione — utile se ci si è sbagliati a inserire un valore).
- **Progress % rimosso**: la lista ✓/•/○ comunica progresso a colpo d'occhio.
- **Nessun "← corrente"** testuale: bullet `•` + peso L + bg soft segnalano la posizione. Le didascalie ridondanti sono eliminate.

---

## 6. Schermata: Progressi

**Frase:** *Vedo se sto migliorando.*

**Utente:** ci arriva dopo un allenamento o di tanto in tanto. Vuole **una risposta**, non una dashboard.

### Elementi

| # | Elemento | Peso | Note |
|---|---|:---:|---|
| 1 | **Volume ultimo mese** (numero grande) | dominante — XL 44/700 | risponde alla missione |
| 2 | Sotto-label "ultimo mese" | marginale — S 14/400 dim | posizionata sotto il numero |
| 3 | Trend `↑ 8% vs mese prec` | primario — M 18/600 | colore giudizio (verde/rosso/grigio) |
| 4 | Sezione **RECORD** — top 3 PR | XS label + M righe (48px) | Panca, Squat, Stacco |

### Layout

```
┌──────────────────────────┐  y=0
│                          │  respiro 48
├──────────────────────────┤
│                          │
│      12 500 kg           │  dominante — XL 44/700
│      ultimo mese         │  marginale — S 14/400 dim
│                          │  respiro 16
│      ↑ 8% vs mese prec   │  primario — M 18/600 verde
│                          │
│                          │  respiro 48
├──────────────────────────┤
│  RECORD                  │  XS — label sezione
│                          │  respiro 16
│  Panca         92,5 kg   │  M — 48px row
│  Squat        120   kg   │  M
│  Stacco       140   kg   │  M
│                          │
│                          │  respiro flex
├──────────────────────────┤
│    [bottom-nav 72px]     │
└──────────────────────────┘
```

### Cosa cade rispetto ad oggi
- Hero KPI con 3 metriche (Workout / Volume / Streak)
- statQuickGrid (Durata media / Volume medio / Serie totali)
- Bar chart 10 sessioni senza asse
- PR top 8 → top 3
- Lista ultime sessioni
- Metriche duplicate con Profilo (streak, workout totali)
- **Sparkline monoserie** (era in v1, ora tagliata: duplicava la risposta del trend `↑ 8%`). Se in futuro serve la forma temporale, va in una sotto-vista dedicata, non nella schermata missione.

### Metrica principale — nota di scelta
Si è scelto **Volume ultimo mese** perché:
- è un aggregato che risponde a "sto crescendo?" senza richiedere di guardare un esercizio specifico
- è confrontabile con il mese precedente (trend chiaro)
- non premia frequenza da sola (che sarebbe streak) né picco isolato (che sarebbe max lift)

La metrica è **configurabile** in una futura iterazione (es. tempo sotto tensione, carico principale, ecc.), ma **una sola alla volta**. Mai due.

---

## 7. Schermata: Profilo

**Frase:** *Metto al sicuro i miei dati.*

**Utente:** ci arriva raramente, con compito preciso (backup, import/export, reset, o config sync una volta).

### Elementi

| # | Elemento | Peso | Note |
|---|---|:---:|---|
| 1 | Stato sync `● Sync attivo · ultimo backup 2h fa` | L (20/600) + S dim | dot verde/grigio/rosso; timestamp **relativo** (mai orario nudo, ambiguo se >24h) |
| 2 | CTA **Backup ora** (o **Configura sync** se non impostato) | dominante — 56px viola | mutex tra i due |
| 3 | Coppia bottoni **Esporta / Importa** | M ghost 48px | affiancati |
| 4 | Sezione **Sessioni non chiuse** *(condizionale, solo se >0)* | XS label + M righe con azioni inline | Riprendi (chip) · Scarta (chip) |
| 5 | Link **Impostazioni** | M ghost 48px fullwidth | apre sotto-vista §9.5 (contiene tema + reset) |

Tema e Reset **non stanno più in Profilo** direttamente: sono in Impostazioni (§9.5). Motivo: densità sotto controllo, danger zone doppiamente segregata, e Profilo può crescere in futuro senza inflazione.

### Layout

```
┌──────────────────────────┐  y=0
│                          │  respiro 24
├──────────────────────────┤
│  ● Sync attivo           │  L — 20/600
│  ultimo backup 2h fa     │  S — 14/400 dim
│                          │  respiro 24
│  ┌────────────────────┐  │
│  │    Backup ora      │  │  dominante — CTA 56px viola
│  └────────────────────┘  │
│                          │  respiro 32
├──────────────────────────┤
│  DATI                    │  XS label
│                          │  respiro 16
│  ┌──────────┬──────────┐ │  M — 2 ghost 48px
│  │ Esporta  │ Importa  │ │
│  └──────────┴──────────┘ │
│                          │  respiro 32
├──────────────────────────┤
│  SESSIONI NON CHIUSE     │  XS label (condizionale)
│                          │
│  Push · 2 giorni fa      │  M — row 56px
│  [Riprendi] [Scarta]     │  M — 2 chip inline
│                          │
│                          │  respiro flex
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │   Impostazioni     │  │  M — ghost 48px → §9.5
│  └────────────────────┘  │
│                          │  respiro 16
├──────────────────────────┤
│    [bottom-nav 72px]     │
└──────────────────────────┘
```

### Cosa cade rispetto ad oggi
- Hero KPI (Workout / Streak / Volume) — appartengono a Progressi
- Card "Scheda attiva" con `Apri →` (la scheda si sceglie dalla Home)
- Form GitHub inline nel `<details>` → **spostato** in sotto-vista dedicata "Configura sync" (§9.2)
- Reset scheda mescolato con export/import → **spostato** in sotto-vista Impostazioni § 9.5 (danger zone doppiamente segregata)
- Bottone Tema in top bar globale → chip in sotto-vista Impostazioni §9.5
- Orario nudo `ultimo backup 12:34` (ambiguo oltre le 24h) → **timestamp relativo** `2h fa`, `ieri`, `3 giorni fa`

### Regola sul futuro
Ogni futura impostazione che aumenta Profilo va **in sotto-vista dedicata** (Impostazioni o nuova). Mai una nuova card inline: la frase *"metto al sicuro i miei dati"* si romperebbe se si trasformasse in "gestisco tutte le preferenze".

---

## 8. Overlay: Timer dock

**Frase:** *Aspetto la fine del recupero.*

Overlay bottom, sopra la CTA di Workout esecuzione, oscura leggermente il resto.

### Elementi

| # | Elemento | Peso |
|---|---|:---:|
| 1 | Countdown `MM:SS` | dominante — XL 56/700 |
| 2 | Next-up `prossimo: Panca 60×8` (o `prossimo giro: Panca`) | marginale — S dim |
| 3 | CTA **Salta** | M ghost fullwidth **48px** (standard, non 44) |

**Etichetta "prossimo"** — dipende dal contesto del timer:
- Timer tra set stesso esercizio → `prossimo: Panca 60×8` (esercizio + preset)
- Timer fine giro (circuit) → `prossimo giro: Panca → Rematore → Dip` (elenco compresso o solo primo esercizio)

### Layout

```
┌──────────────────────────┐
│    (schermata Workout    │  bg semi-oscurato
│     dietro all'overlay)  │
│                          │
├──────────────────────────┤  overlay
│                          │  respiro 16
│         00:42            │  dominante — XL centrato
│                          │
│   prossimo: Panca 60×8   │  S
│                          │  respiro 16
│  ┌────────────────────┐  │
│  │       Salta        │  │  M — 48px ghost
│  └────────────────────┘  │
│                          │  respiro 16
└──────────────────────────┘
```

### Cosa cade rispetto ad oggi
- Label "Recupero" (basta il countdown grande)
- Label esercizio corrente (l'utente lo sta guardando dietro)
- Bottone "Stop" (rinominato "Salta" — è ciò che fa davvero)
- Posizione bottom-right piccola → fullwidth in fondo, coerente col resto

---

## 9. Sotto-viste e modali

### 9.1 Sheet "Cambia giorno"
Descritta in §3. Chip scheda (solo se >1), chip settimana, tile giorno (label sola).

### 9.2 Sotto-vista **Configura sync GitHub**
**Frase:** *Collego il mio backup a GitHub.*

Accesso: CTA "Configura sync" in Profilo (quando non configurato) o tap sullo stato sync (quando configurato, per modificarlo).

Elementi:
- Input owner, repo, path, branch, token (5 righe form standard)
- CTA **Salva e testa** (dominante — 56px viola)
- Chiusura: **✕** in alto a destra (44×44 tap-target). Back OS/PWA equivalente.

Form legittimo — nessun taglio ulteriore. Nessuna freccia di ritorno testuale.

### 9.3 Modale conferma Reset
Solo per l'azione distruttiva.
- Titolo: "Sicuro di voler resettare?"
- Testo: elenco puntato di cosa viene cancellato (scheda, sessioni, log)
- Bottone **Annulla** (default M, focus iniziale qui)
- Bottone **Reset** (danger, rosso)

### 9.4 Modale "Sessioni non chiuse" all'apertura app
**Rimossa.** Le sessioni pending non interrompono più la missione "inizia allenamento": vivono come sezione in Profilo (§7).

### 9.5 Sotto-vista **Impostazioni**
**Frase:** *Regolo l'app e, se necessario, la azzero.*

Accesso: link "Impostazioni" in fondo a Profilo (§7).

Elementi:

| # | Elemento | Peso | Note |
|---|---|:---:|---|
| 1 | Label sezione **ASPETTO** | XS uppercase | — |
| 2 | Chip **Tema** `○ chiaro ● scuro` | M (chip 44, 14/500) | tap = toggle |
| 3 | Divider 48px | — | separazione visiva della danger zone |
| 4 | Label sezione **DANGER ZONE** | XS uppercase rosso | — |
| 5 | Link **Reset dati** | S rosso testuale | apre §9.3 modale conferma |

Chiusura: **✕** in alto a destra.

```
┌──────────────────────────┐
│  ✕                       │  chiusura (top-right 44×44)
│                          │  respiro 24
├──────────────────────────┤
│  ASPETTO                 │  XS
│                          │  respiro 16
│  Tema  [○ chiaro ● scuro]│  M chip
│                          │
│                          │  respiro 48
├──────────────────────────┤
│  DANGER ZONE             │  XS rosso
│                          │  respiro 16
│  Reset dati              │  S link rosso → modale
│                          │  respiro flex
└──────────────────────────┘
```

**Motivo dell'esistenza di questa sotto-vista** (non è una nuova feature — è riorganizzazione di Profilo v1):
- Alleggerisce Profilo da 6-7 elementi a 5 (rispetta la regola di densità §11.9)
- Consente a Profilo di ospitare in futuro nuove sezioni-dati senza inflazione
- La **danger zone doppiamente segregata** (dentro sotto-vista + in fondo + rosso + modale conferma) applica la regola §11.12

---

## 10. Cosa cambia dal design attuale — checklist

### Tagli
- [ ] Top bar globale (logo + titolo + sottotitolo + tema)
- [ ] Card "Ultimo allenamento" in Home
- [ ] Sotto-hero warning "Cambiare programma?"
- [ ] Testi didascalici che descrivono i bottoni (in tutte le schermate)
- [ ] Frecce `→ ← ◀ ▶` decorative (tutte). Ammessi solo simboli-giudizio: `↑` `↓` (trend), `✓` `•` `○` (stato), `✕` (chiusura), `●` (attivo).
- [ ] Vista completa Workout con `<details>` di ogni blocco
- [ ] Toggle "Focus mode" (Focus diventa default)
- [ ] Head card Workout con 6 elementi
- [ ] Roundchip G1/G2/G3
- [ ] "prec X kg" (resta solo "max")
- [ ] Meta blocco (`type • restText • done/total`)
- [ ] Frecce prev/next blocco con testo
- [ ] Bottone "Chiudi giro" separato
- [ ] Bottone transient "Blocco successivo →" (auto-advance sostitutivo)
- [ ] Testo "← corrente" nella mappa (bullet + peso L bastano)
- [ ] Head Focus con doppio progress
- [ ] Progress % globale in Workout
- [ ] Progress % in mappa
- [ ] Hero KPI Progressi (3 metriche)
- [ ] statQuickGrid Progressi (3 metriche)
- [ ] Bar chart 10 sessioni
- [ ] Sparkline monoserie (duplicava il trend `↑ 8%`)
- [ ] PR list (da 8 a 3)
- [ ] "Ultime sessioni" list in Progressi
- [ ] Hero KPI Profilo
- [ ] Card "Scheda attiva" in Profilo
- [ ] Form GitHub inline in Profilo (→ sotto-vista §9.2)
- [ ] Popup automatico "Sessioni non chiuse" (→ lista in Profilo)
- [ ] "X blocchi · Y esercizi" nei tile giorno del sheet
- [ ] Label "Recupero" nel timer
- [ ] Label esercizio corrente nel timer
- [ ] Orario nudo `ultimo backup 12:34` → timestamp relativo (`2h fa`, `ieri`)

### Spostamenti
- Sessioni non chiuse: **popup all'apertura → sezione in Profilo**
- Fine sessione: **Workout esecuzione → Workout mappa** (con promozione a dominante XL viola se tutti i blocchi ✓)
- Timer sessione: **Workout esecuzione → Workout mappa**
- Progress giorno: **Workout esecuzione → riga contesto `Blocco X/N · Giro Y/M`**
- Bottone Tema: **top bar globale → sotto-vista Impostazioni §9.5** (era chip in Profilo nella v1, spostato per densità)
- Reset dati: **card export/import → sotto-vista Impostazioni §9.5, danger zone segregata** (era link in fondo a Profilo nella v1)
- Backup GitHub form: **card inline in Profilo → sotto-vista dedicata §9.2**

### Novità (nate dalla riduzione, non aggiunte)
- **Workout mappa** come sotto-vista distinta (assorbe le funzioni di navigazione + Fine)
- **Riga contesto tap-abile** in Workout esecuzione (`Blocco 2/4 · Giro 1/3` → apre mappa)
- **Sotto-vista Configura sync GitHub** dedicata (§9.2)
- **Sotto-vista Impostazioni** dedicata (§9.5) che raccoglie aspetto + danger zone
- **Promozione visiva** di Fine sessione in mappa (M ghost → XL viola quando tutti i blocchi sono ✓)
- **Timestamp relativi** per stato sync (mai orario nudo)

---

## 11. Regole non-negoziabili

Nessuna PR che violi una di queste può essere accettata.

1. **Una frase per schermata.** Se una feature futura non entra nella frase, va in una schermata diversa (o non entra).
2. **Un solo elemento dominante per schermata.** Uno e uno solo.
3. **Nessun titolo di schermata.** La bottom-nav orienta.
4. **Un solo viola per schermata.** Il viola è la CTA della missione.
5. **Coerenza rigida:** radius solo `16 / 12 / 8`; ombre solo `nessuna` o una `soft` sola; scala tipografica solo `XL 40-56/700 · L 20-24/600 · M 16-18/500 · S 14/400 · XS 12/400`; scala spacing solo `4 · 8 · 16 · 24 · 32 · 48`. Mai eccezioni "just this once".
6. **Mobile-first.** Ogni layout va disegnato a 390×844. Il desktop **adatta**, non guida.
7. **Ogni elemento eliminabile va eliminato.** Se togliendolo l'utente riesce ancora a completare la missione, quell'elemento non serviva.
8. **Ordine di progettazione:** gerarchia → layout → componenti → spacing → animazioni → colori → interazioni → schermata. Mai il contrario. Non si sceglie il colore del bottone prima di sapere se il bottone deve esistere.
9. **Densità:** 5-7 elementi principali max. Sotto S non conta, ma se conteggi le presenze visive superi comunque 10, hai sbagliato.
10. **Gerarchia:** 1 dominante + max 2 secondari in gara per l'attenzione. Tutto il resto subordinato.
11. **Nessuna dashboard.** Progressi risponde a **una** domanda. Se qualcuno vuole più metriche, si aggiunge un tap per commutare la metrica principale — mai una griglia.
12. **Il pericoloso è geograficamente lontano dal frequente.** Reset è in sotto-vista Impostazioni (§9.5), Scarta ha conferma inline, Fine sessione appare solo dove ha senso (mappa) e solo se ha registrato ≥1 set.
13. **Due scale, non confonderle.** "XL tipografico" ≠ "dominante visivo". Un CTA fullwidth 64px con testo 20/600 è **dominante per area** ma **L per font**. Il documento e il codice devono distinguere sempre le due scale (§2.1).
14. **Frecce vietate, simboli-giudizio ammessi.** Nessuna freccia decorativa (`→ ← ◀ ▶`). Ammessi solo: `↑↓` (trend), `✓ • ○` (stato), `✕` (chiudi), `●` (attivo).
15. **Timestamp relativi.** Mai "12:34" nudo per informazioni che sopravvivono al giorno. Sempre "2h fa", "ieri", "3 giorni fa" — se non si può, aggiungere la data completa.
16. **Chiusura di sotto-viste standardizzata.** ✕ in alto a destra (44×44), back OS/PWA equivalente. Mai link testuali "Torna a X" (violerebbero la scala e il divieto frecce se avessero `←`).

---

## 12. Fuori scope di questo documento

Non è definito qui:
- **Data model** — rimane invariato (documentato in `REDESIGN_ANALYSIS.md`).
- **Persistenza / IndexedDB** — invariata.
- **Service Worker / caching** — invariati.
- **Sync GitHub** — logica invariata, solo la UI si sposta.
- **Piano di implementazione tecnica** — sarà oggetto di un `12_IMPLEMENTATION_PLAN.md` separato, non parte del design.
- **Mockup ad alta fedeltà (spec grafica)** — vivono in `11_HI_FI_MOCKUPS.md`, coerenti con questo Blueprint.

---

## 13. Changelog v1 → v2 (revisione critica)

Fix applicati nella revisione critica pre-produzione:

**Bloccanti risolti (violavano regole dichiarate nel documento stesso):**
- §2.1 separata **scala tipografica** (peso font) da **scala visiva** (dominanza area). "XL" era ambiguo perché usato per entrambe.
- §2.3 Stepper: normalizzato REPS a **L 24/700** (era 32/700, fuori scala).
- §2.3 Timer overlay "Salta": normalizzato a **48px M ghost standard** (era 44px, violava spec).
- §2.3 Chip: chiarita interazione (tap = stato successivo ciclico o toggle).
- §2.3 aggiunto **Tile giorno** al set componenti (era usato in §3 sheet senza spec).
- §2.3 aggiunto **Sotto-vista modale (fullscreen)** al set componenti (standardizza chiusura ✕).
- §6 Progressi: sostituito `respiro 40` con `respiro 48` (40 non è nella scala 4/8/16/24/32/48).
- §5 mappa e §4 esecuzione: rimosse **frecce residue** `←` `→` (`← corrente`, `← Blocco`, `Blocco successivo →`) che erano incoerenti con la §10 taglio "frecce decorative".

**Duplicazione tagliata:**
- §6 Progressi: rimossa **sparkline** che duplicava la risposta del trend `↑ 8%`. Progressi ora ha 3 elementi principali + sezione RECORD, ben sotto la densità massima.

**Densità/organizzazione:**
- §7 Profilo: tema + reset **spostati** in nuova sotto-vista **§9.5 Impostazioni**. Profilo passa da 6-7 a 4-5 elementi. Danger zone doppiamente segregata (sotto-vista + posizione in fondo + colore + modale conferma).
- §7 stato sync: timestamp **relativo** (`2h fa`) al posto di orario nudo (`12:34`), che era ambiguo dopo 24h.

**Buchi di flusso chiusi:**
- §4 esplicitato flusso auto-advance completo (blocco singolo vs circuit multi-esercizio), interazione timer × auto-advance, apertura mappa a ultimo blocco.
- §5 introdotta **promozione visiva** di Fine sessione (M ghost → dominante XL viola quando tutti i blocchi sono ✓).
- §3 Home: chiarita gestione **sessioni multiple** (mostra la più recente, altre in Profilo, non bloccante).
- §8 Timer: chiarita etichetta "prossimo" (single vs circuit).
- §9.2 Configura sync: chiusura standardizzata **✕**, rimosso link testuale "Torna a Profilo".

**Regole aggiunte (§11):**
- **13** — "Due scale, non confonderle" (tipografica vs visiva).
- **14** — "Frecce vietate, simboli-giudizio ammessi" (esplicitato l'elenco).
- **15** — "Timestamp relativi" (mai orario nudo per informazioni che sopravvivono al giorno).
- **16** — "Chiusura di sotto-viste standardizzata" (✕ + back OS, mai link "Torna a X").

---

*Fine documento — v2 pronta per implementazione.*
