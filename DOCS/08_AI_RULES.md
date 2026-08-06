# 08_AI_RULES.md

Versione 2.0

Documento obbligatorio.

Da leggere prima di qualsiasi modifica.

---

# PRINCIPIO 1

Mai modificare codice che non hai ancora compreso.

Prima leggere.

Poi capire.

Infine modificare.

---

# PRINCIPIO 2

La logica di business è SACRA.

Non modificarla.

Mai.

---

# PRINCIPIO 3

UI e Business Logic sono indipendenti.

Se per modificare una schermata devi cambiare gli algoritmi significa che stai sbagliando approccio.

---

# PRINCIPIO 4

Mai introdurre regressioni.

Ogni commit deve essere eseguibile.

Compilare.

Funzionare.

---

# PRINCIPIO 5

Mai fare grandi refactoring.

Preferire:

piccoli miglioramenti.

---

# PRINCIPIO 6

Mai modificare più di una responsabilità nello stesso commit.

Esempio

❌

Workout

+

Statistiche

+

Tema

+

Profilo

nello stesso commit.

---

# PRINCIPIO 7

Mai rompere il Design System.

Ogni componente deve derivare da esso.

---

# PRINCIPIO 8

Mai usare valori "magici".

NO

padding:13px

margin:11px

radius:19px

Utilizzare Design Token.

---

# PRINCIPIO 9

Mai duplicare componenti.

Se un componente esiste

riutilizzarlo.

---

# PRINCIPIO 10

Mai creare componenti simili.

ButtonPrimary

ButtonMain

PrimaryBtn

sono errori.

Esiste un solo componente.

---

# PRINCIPIO 11

Mai creare CSS locali se il Design Token esiste.

---

# PRINCIPIO 12

Mai aggiungere dipendenze senza reale necessità.

Ogni libreria aumenta:

bundle

manutenzione

bug.

---

# PRINCIPIO 13

Preferire CSS nativo.

Usare librerie solo quando realmente indispensabili.

---

# PRINCIPIO 14

Mai creare DOM profondi.

Massimo

6 livelli.

---

# PRINCIPIO 15

Mai utilizzare

!important

---

# PRINCIPIO 16

Mai usare dimensioni assolute inutili.

Preferire

rem

clamp

flex

grid

---

# PRINCIPIO 17

Mai usare animazioni su

top

left

width

height

Animare solamente

transform

opacity

---

# PRINCIPIO 18

Ogni schermata deve avere

una CTA primaria.

---

# PRINCIPIO 19

Mai più di

7 elementi

visibili contemporaneamente.

---

# PRINCIPIO 20

Mai chiedere all'utente dati che conosci già.

---

# PRINCIPIO 21

Mai obbligare l'utente a digitare numeri.

Utilizzare picker.

---

# PRINCIPIO 22

Ogni interazione deve produrre feedback.

Visivo.

Eventualmente Haptic.

---

# PRINCIPIO 23

Mai utilizzare popup per informazioni.

Preferire

Toast

Banner

Bottom Sheet

---

# PRINCIPIO 24

Mai interrompere il Workout.

Il flusso deve essere continuo.

---

# PRINCIPIO 25

Mai usare Skeleton e Spinner insieme.

Solo Skeleton.

---

# PRINCIPIO 26

Mai usare più di un Floating Action Button.

---

# PRINCIPIO 27

Mai creare pulsanti inferiori a 48 px.

Preferibile

56 px.

---

# PRINCIPIO 28

Ogni lista deve essere virtualizzabile.

---

# PRINCIPIO 29

Mai fare query duplicate.

Riutilizzare i dati.

---

# PRINCIPIO 30

Mai ricaricare l'intera pagina.

Aggiornare solo il necessario.

---

# PRINCIPIO 31

Ogni componente deve essere isolabile.

---

# PRINCIPIO 32

Ogni componente deve essere testabile.

---

# PRINCIPIO 33

Mai usare colori fuori palette.

---

# PRINCIPIO 34

Mai usare font differenti.

Solo Inter.

---

# PRINCIPIO 35

Mai utilizzare icone provenienti da librerie differenti.

---

# PRINCIPIO 36

Mai utilizzare gradienti casuali.

Solo quelli del Design System.

---

# PRINCIPIO 37

Mai mostrare dati duplicati.

---

# PRINCIPIO 38

Mai aggiungere testo inutile.

---

# PRINCIPIO 39

Ogni schermata deve essere leggibile in meno di 2 secondi.

---

# PRINCIPIO 40

Ogni componente deve avere:

Loading

Error

Empty

Disabled

quando necessario.

---

# PRINCIPIO 41

Prima di eliminare codice:

capire perché esiste.

---

# PRINCIPIO 42

Mai eliminare una funzione senza verificarne tutti gli utilizzi.

---

# PRINCIPIO 43

Ogni commit deve avere un messaggio descrittivo.

---

# PRINCIPIO 44

Mai modificare il database.

---

# PRINCIPIO 45

Mai modificare IndexedDB.

---

# PRINCIPIO 46

Mai modificare API se non richiesto.

---

# PRINCIPIO 47

Mai cambiare nomi pubblici delle funzioni senza motivo.

---

# PRINCIPIO 48

Mai modificare il formato dei dati.

---

# PRINCIPIO 49

Preferire composizione.

Mai ereditarietà inutile.

---

# PRINCIPIO 50

Ogni modifica deve poter essere annullata facilmente.

---

# CHECK FINALE OBBLIGATORIO

Prima di terminare ogni fase verificare:

☐ Build OK

☐ Nessun warning

☐ Nessun errore console

☐ Responsive

☐ Mobile First

☐ 60 FPS

☐ Lighthouse >95

☐ Accessibilità AA

☐ Nessuna regressione

☐ Design System rispettato

☐ Component Library rispettata

☐ Nessuna duplicazione

☐ Nessun CSS morto

☐ Nessun componente inutilizzato

☐ Nessuna dipendenza inutile

☐ Nessun TODO lasciato nel codice

---

# DEFINIZIONE DI SUCCESSO

Se un utente apre l'app e pensa:

"Questa sembra un'app nativa."

allora il progetto è riuscito.

Qualsiasi risultato inferiore è da considerarsi incompleto.