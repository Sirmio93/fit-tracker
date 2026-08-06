# 02_INFORMATION_ARCHITECTURE.md

Versione: 2.0

---

# Obiettivo

L'app deve essere organizzata intorno all'allenamento.

NON intorno ai dati.

L'utente apre l'app perché vuole allenarsi.

Non perché vuole navigare tra pagine.

---

# Regola principale

Ogni schermata deve avere UNA sola funzione.

Mai mischiare:

- statistiche
- cronologia
- allenamento
- impostazioni

nella stessa pagina.

---

# Architettura principale

L'app è composta da quattro sezioni.

```

🏠 Home

↓

💪 Workout

↓

📈 Progressi

↓

👤 Profilo

```

Nient'altro.

---

# Bottom Navigation

Sempre visibile.

```

🏠

Home

💪

Workout

📈

Progressi

👤

Profilo

```

Mai utilizzare:

Hamburger Menu

Sidebar

Drawer

Menu nascosti

---

# HOME

Scopo

Far riprendere immediatamente il workout.

Mostrare solamente:

• allenamento di oggi

• avanzamento

• streak

• statistiche rapide

• pulsante continua

---

Schema

```

Hero Workout

↓

Progress Ring

↓

Quick Stats

↓

Workout Recenti

↓

Obiettivi

```

---

# WORKOUT

Questa NON è una lista.

È una modalità Focus.

L'utente vede un solo esercizio.

Schema

```

Exercise

↓

Peso

↓

Ripetizioni

↓

Completa

↓

Timer

↓

Next Exercise

```

Mai mostrare:

15 esercizi

10 card

liste lunghissime

scroll continuo

---

# TIMER

Schermata dedicata.

Full screen.

Mostra solamente

```

Countdown

↓

Prossimo esercizio

↓

+15 sec

↓

Salta

```

Quando termina

↓

Passaggio automatico.

---

# FINE WORKOUT

Nuova schermata.

Mai tornare subito alla Home.

Mostrare

```

Workout terminato

↓

Tempo

↓

Volume

↓

PR

↓

Condividi

↓

Fine

```

---

# PROGRESSI

Organizzazione

```

Overview

↓

Grafici

↓

Record

↓

Cronologia

↓

Calendario

```

Mai mischiare tutto.

Ogni sezione è separata.

---

# PROFILO

Contiene

utente

obiettivi

preferenze

backup

esportazione

tema

account

---

# CRONOLOGIA

Timeline.

```

Oggi

↓

Martedì

↓

Sabato

↓

Giovedì

```

Ogni allenamento è una card.

Mai tabelle.

---

# DETTAGLIO WORKOUT

Quando apro una seduta.

Mostrare

```

Durata

↓

Volume

↓

Circuiti

↓

Serie

↓

Record

```

---

# DETTAGLIO ESERCIZIO

Contiene

grafico progressione

ultimo peso

ultimo volume

cronologia

note

---

# Flow Completo

```

Apro App

↓

Home

↓

Continua

↓

Workout

↓

Serie

↓

Timer

↓

Serie

↓

Timer

↓

Fine Workout

↓

Home

```

Mai uscire dal flusso.

---

# Modal

Consentite solamente per

Conferma eliminazione

Esporta

Impostazioni rapide

Mai usare modali per il workout.

---

# Bottom Sheet

Utilizzare per

Filtro

Selezione esercizio

Storico

Modifica

Menu rapido

---

# Floating Action Button

Visibile solo in

Home

Progressi

Cronologia

Funzione

Nuovo Workout

---

# Navigazione

Ogni schermata deve poter essere raggiunta con massimo:

2 tocchi.

---

# Gerarchia

Livello 1

Home

Workout

Progressi

Profilo

---

Livello 2

Dettagli

---

Livello 3

Bottom Sheet

Mai oltre.

---

# Deep Link

Supportare

Workout Corrente

Ultimo Workout

Progressi

Profilo

---

# Stati Applicazione

Idle

↓

Workout in corso

↓

Pausa

↓

Riposo

↓

Completamento

↓

Salvataggio

↓

Fine

Ogni stato deve avere una UI dedicata.

---

# Empty State

Se non esistono workout

Mostrare

Illustrazione

↓

Titolo

↓

CTA

"Crea primo allenamento"

---

# Error State

Mai popup.

Mostrare banner discreto.

Possibilità di riprovare.

---

# Loading

Usare Skeleton.

Mai spinner centrali.

---

# Regole UX

Mai più di:

1 CTA primaria

per schermata.

Mai più di:

3 CTA secondarie.

Mai più di:

7 elementi visibili contemporaneamente.

---

# One Thumb Rule

Ogni azione importante deve essere raggiungibile dal pollice.

Zona preferita

parte inferiore.

---

# Priorità Visiva

1

CTA

↓

2

Titolo

↓

3

Progressione

↓

4

Dati

↓

5

Informazioni secondarie

---

# Eliminare dall'attuale applicazione

Tab complesse

Card annidate

Menu multipli

Liste infinite

Scroll durante il workout

Duplicazione delle informazioni

Pulsanti piccoli

Input numerici manuali

Sidebar

Layout desktop adattato al mobile

---

# Obiettivo Finale

L'utente deve poter completare un allenamento senza mai sentirsi "dentro un sito web".

Ogni schermata deve sembrare parte di un'app nativa.

La navigazione deve essere immediata, coerente e invisibile.