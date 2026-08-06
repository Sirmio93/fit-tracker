# Fit Workout v2 — Product Vision

Versione: 2.0
Autore: ChatGPT
Scopo: Ridefinizione completa dell'interfaccia utente mantenendo invariata la logica applicativa.

---

# Obiettivo

Trasformare l'app da una normale pagina web responsive ad una vera esperienza mobile-first che sembri un'applicazione nativa iOS/Android.

L'utente non deve percepire di usare un sito web.

L'interfaccia deve risultare moderna, premium, estremamente veloce e progettata per l'utilizzo con una sola mano.

La UX deve ridurre al minimo il numero di tocchi necessari per registrare un allenamento.

---

# Filosofia

NON progettare pagine.

Progettare esperienze.

Ogni schermata deve avere un unico obiettivo.

Mai mostrare troppe informazioni contemporaneamente.

L'utente deve sempre sapere:

- dove si trova
- cosa deve fare
- quale sarà il passo successivo

---

# Principi fondamentali

## Focus

Una schermata = una sola azione principale.

Esempio:

❌ Pagina con 12 card.

✅ Schermata dedicata al singolo esercizio.

---

## Velocità

L'interfaccia deve sembrare istantanea.

Ogni operazione deve richiedere meno di 300 ms.

Mai attendere refresh completi.

Utilizzare:

- aggiornamenti locali
- animazioni
- transizioni

---

## Utilizzo con una mano

Ogni elemento importante deve essere raggiungibile con il pollice.

Zona preferenziale:

parte inferiore dello schermo.

Mai posizionare pulsanti essenziali nella parte alta.

---

## Riduzione del carico cognitivo

Mostrare solo ciò che serve.

Nascondere tutto il resto.

Ogni informazione secondaria va dietro:

- Bottom Sheet
- Modal
- Expand
- Swipe

Mai nella schermata principale.

---

# Target

Utente:

18-45 anni

Allenamento in palestra

Utilizza l'app durante la serie.

Ha poco tempo.

Ha spesso una sola mano libera.

---

# Personalità

L'app deve trasmettere:

energia

precisione

semplicità

solidità

tecnologia

premium

Mai:

infantile

colorata

giocosa

confusa

---

# Ispirazioni

Apple Fitness

Hevy

Strong

Gentler Streak

Linear

Arc Browser

Notion Calendar

Whoop

Athlytic

---

# Cosa NON deve sembrare

Bootstrap

Material Dashboard

Admin Panel

Gestionale

Foglio Excel

Pagina HTML

Sito responsive

---

# Tone of Voice

Breve.

Diretto.

Motivante.

Mai prolisso.

Esempi:

"Serie completata"

"Riposo"

"Nuovo record"

"Allenamento terminato"

Mai:

"Hai completato con successo la registrazione della tua serie."

---

# Navigazione

Massimo quattro sezioni.

Home

Workout

Progressi

Profilo

Tutto il resto deve essere secondario.

---

# Architettura

L'app deve essere organizzata come una Single Page Application.

Le schermate cambiano tramite transizioni.

Mai refresh.

Mai caricamenti completi.

---

# Priorità assolute

1.
Registrare una serie.

2.
Cambiare peso.

3.
Visualizzare il prossimo esercizio.

4.
Avviare il timer.

5.
Terminare il workout.

Ogni altra funzione è secondaria.

---

# Esperienza durante l'allenamento

L'utente apre l'app.

↓

Un tap.

↓

Riprende il workout.

↓

Visualizza un solo esercizio.

↓

Registra peso.

↓

Registra ripetizioni.

↓

Completa.

↓

Timer automatico.

↓

Esercizio successivo.

↓

Fine allenamento.

Tutto il flusso deve richiedere pochissimi tocchi.

---

# Responsive

L'app nasce per smartphone.

Desktop è secondario.

Tablet è opzionale.

La progettazione parte da:

390×844 px

iPhone 16 Pro.

Successivamente adattare:

Android

Tablet

Desktop

---

# KPI UX

Registrazione serie

< 3 secondi

Cambio esercizio

< 500 ms

Caricamento schermata

< 200 ms

Touch target

>= 48 px

FPS

60

CLS

≈ 0

---

# Regole inviolabili

Mai Bootstrap.

Mai sidebar.

Mai menu hamburger.

Mai card annidate.

Mai più di un'azione primaria per schermata.

Mai popup invasivi.

Mai form lunghi.

Mai campi numerici da digitare se possono essere sostituiti da pulsanti + e -.

Mai costringere l'utente a fare scroll durante un esercizio.

---

# Definizione di successo

L'utente deve avere la sensazione di utilizzare una vera app premium scaricata dall'App Store.

Se un utente apre l'app per la prima volta deve pensare:

"Questa non sembra nemmeno una web app."

Questo è il livello qualitativo minimo richiesto.