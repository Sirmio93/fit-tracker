# 03_COMPONENT_LIBRARY.md

Versione 2.0

---

# Obiettivo

Tutti i componenti dell'applicazione devono derivare da questa libreria.

Mai creare componenti "al volo".

Ogni elemento UI deve appartenere a questa libreria.

---

# Naming

I componenti devono essere nominati usando PascalCase.

Esempio

WorkoutCard

ExerciseCard

PrimaryButton

BottomNavigation

ProgressRing

HeroCard

---

# Stati

Ogni componente deve prevedere sempre:

Default

Hover

Pressed

Focused

Disabled

Loading

Error (quando applicabile)

Success (quando applicabile)

---

# COMPONENT 01

HeroCard

## Scopo

È la card principale della Home.

Contiene il workout del giorno.

## Dimensioni

Width

100%

Height

220 px

Radius

32 px

Padding

28 px

## Contenuto

Titolo

Workout Name

Progress Ring

Tempo stimato

CTA

## CTA

Continua Workout

oppure

Inizia Workout

## Animazione

Entrata

Fade + Slide Up

240 ms

---

# COMPONENT 02

WorkoutCard

Utilizzata nella cronologia.

Height

140 px

Radius

24

Padding

20

Contiene

Data

Durata

Volume

Muscoli

PR

Tap

↓

Apre dettaglio workout.

Mai mostrare pulsanti.

L'intera card è cliccabile.

---

# COMPONENT 03

ExerciseCard

NON è una card tradizionale.

Occupa quasi tutto lo schermo.

Contiene solamente:

Nome

Muscolo

Peso

Ripetizioni

Target

Pulsante Completa

Massimo 1 esercizio visibile.

---

# COMPONENT 04

PrimaryButton

Height

60 px

Radius

18

Gradient

Primary

Shadow

Level 2

Font

18

Weight

600

Padding

28

Sempre largo almeno 160 px.

---

# COMPONENT 05

SecondaryButton

Surface Elevata

Border

1 px

Height

56

Radius

18

---

# COMPONENT 06

GhostButton

Background

Transparent

Border

No

Text

Primary

Usato solo per azioni secondarie.

---

# COMPONENT 07

Floating Action Button

Dimensione

64 px

Cerchio

Icona

28 px

Shadow

Livello 3

Posizione

Bottom Right

Safe Area rispettata.

---

# COMPONENT 08

Bottom Navigation

Height

84 px

Blur

20 px

Border Top

1 px

Contiene quattro elementi.

Home

Workout

Progressi

Profilo

Elemento attivo

Gradient

Testo Bianco

Icona 26 px

---

# COMPONENT 09

Progress Ring

Dimensione

140 px

Stroke

12 px

Animato

Sì

Centro

Percentuale

Sotto

Etichetta

Mai utilizzare barre nella Home.

---

# COMPONENT 10

StatisticCard

Dimensioni

160x120

Contiene

Icona

Valore

Descrizione

Mai grafici.

---

# COMPONENT 11

HistoryCard

Mostra

Workout

Data

Durata

Volume

Freccia

Tap

↓

Dettaglio

---

# COMPONENT 12

PersonalRecordCard

Gradient Oro

Badge

NEW PR

Valore

Data

Animazione Glow.

---

# COMPONENT 13

RestTimer

Schermata dedicata.

Cerchio centrale.

Numero enorme.

Prossimo esercizio.

Pulsanti

+15

Salta

---

# COMPONENT 14

WeightPicker

Mai usare input.

Layout

[-]

34

[+]

Pressione continua

↓

Incremento automatico.

Supportare

0.5 kg

1 kg

2.5 kg

---

# COMPONENT 15

RepsPicker

Identico al Weight Picker.

Mai digitazione manuale.

---

# COMPONENT 16

Toast

Bottom Floating.

Radius

18

Blur

Sì

Durata

2 secondi.

Mai modale.

---

# COMPONENT 17

Bottom Sheet

Radius

32

Blur

20

Drag Indicator

Sempre presente.

Snap

40%

70%

100%

---

# COMPONENT 18

Dialog

Massimo due pulsanti.

Mai più.

Titolo

Descrizione

CTA

---

# COMPONENT 19

Segmented Control

Utilizzato per

Settimana A

Settimana B

Statistiche

Periodo

Animazione

Sliding Indicator

---

# COMPONENT 20

Exercise Header

Nome esercizio

Muscolo

Ultimo Peso

Target

PR

Sempre in alto.

---

# COMPONENT 21

Workout Header

Progress Ring

Tempo

Serie completate

Pulsante Esci

Sticky

Sì

---

# COMPONENT 22

Floating Timer

Piccolo.

Sempre visibile.

Mostra

Tempo recupero.

Tap

↓

Apre timer.

---

# COMPONENT 23

Chart Card

Line Chart

Area Chart

Bar Chart

Mai Pie Chart.

Radius

24

Padding

20

---

# COMPONENT 24

Calendar Heatmap

Simile a GitHub.

Colori

4 livelli.

Mostra frequenza allenamenti.

---

# COMPONENT 25

Profile Header

Avatar

Nome

Livello

Streak

Peso corporeo

---

# COMPONENT 26

Achievement Badge

Cerchio

64 px

Icona

Titolo

Descrizione

Animazione

Scale In

---

# COMPONENT 27

Empty State

Illustrazione

Titolo

Descrizione

CTA

Sempre centrato.

---

# COMPONENT 28

Loading Skeleton

Mai spinner.

Shimmer

1.2 sec

Loop

---

# COMPONENT 29

Search Bar

Radius

18

Icona

Placeholder

Blur

---

# COMPONENT 30

Quick Action

Piccole card

Home

4 max

Nuovo Workout

Cronologia

Record

Progressi

---

# Regole

Mai creare nuovi componenti senza aggiornarne la libreria.

Ogni componente deve essere riutilizzabile.

Mai duplicare codice.

Mai modificare un componente solo per una schermata.

Le varianti devono essere ottenute tramite proprietà.

---

# Naming CSS

.button

.button-primary

.button-secondary

.card

.card-workout

.card-history

.card-stat

.input-picker

.bottom-nav

.progress-ring

.toast

.sheet

.dialog

Mai usare nomi generici come:

.red

.big

.card2

.button-new

---

# Fine documento

Ogni schermata dell'app dovrà essere costruita esclusivamente utilizzando questa Component Library.