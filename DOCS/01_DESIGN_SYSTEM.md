# 01_DESIGN_SYSTEM.md

Versione: 2.0

---

# Filosofia

L'interfaccia deve trasmettere la sensazione di un'app premium.

Minimalista.

Elegante.

Molto fluida.

Mai appariscente.

Mai "gaming".

L'obiettivo è Apple Fitness, non una dashboard amministrativa.

---

# Design Language

Keywords

- Clean
- Premium
- Athletic
- Confident
- Fast
- Soft
- Focused

---

# Palette Colori

## Background principale

#0B0D10

---

## Surface

#12151A

---

## Surface Elevata

#1A1F26

---

## Card Attiva

#202733

---

## Primary

#6D5DF6

---

## Primary Hover

#7B6CFF

---

## Success

#31D158

---

## Warning

#FFB547

---

## Error

#FF5A5F

---

## Testo Primario

#FFFFFF

---

## Testo Secondario

#A7AFBC

---

## Testo Disabilitato

#5E6672

---

# Gradienti

Primary

Linear

135°

#6D5DF6

↓

#8A7BFF

---

Success

#28C76F

↓

#5EE89D

---

Workout

#6D5DF6

↓

#4BC0FF

---

Record

#FFB547

↓

#FFD76A

---

# Tipografia

Font

Inter

Fallback

system-ui

---

# Dimensioni

Display

40px

Weight

700

---

H1

32

700

---

H2

28

700

---

H3

24

600

---

Title

20

600

---

Body

16

500

---

Caption

14

500

---

Small

12

500

---

Mai usare font inferiori a 12 px.

---

# Border Radius

Card

24

---

Button

18

---

Input

16

---

Chip

999

---

Bottom Sheet

32

---

Dialog

28

---

Floating Button

22

---

# Spaziature

Sistema a multipli di 8.

4

8

16

24

32

40

48

64

80

Mai utilizzare valori casuali.

---

# Elevation

Livello 0

nessuna ombra

---

Livello 1

0 4 12 rgba(0,0,0,.18)

---

Livello 2

0 8 24 rgba(0,0,0,.22)

---

Livello 3

0 20 40 rgba(0,0,0,.35)

---

Mai ombre molto scure.

Devono essere morbide.

---

# Glass Effect

Background

rgba(255,255,255,.05)

Blur

18px

Border

1px rgba(255,255,255,.08)

---

# Icone

Libreria

Lucide

Dimensione

24

Peso

2

Mai mischiare librerie differenti.

---

# Bottoni

Altezza minima

56 px

Radius

18

Peso testo

600

Padding

24

---

Primary

Background

Gradient Primary

Testo

Bianco

---

Secondary

Surface Elevata

Border

1 px

---

Ghost

Trasparente

---

Danger

Rosso

---

# Touch Target

Ogni elemento cliccabile

>=48 px

Preferibile

56 px

---

# Animazioni

Durata

120

180

240

300

Mai oltre 400.

---

Curve

ease-out

oppure

cubic-bezier(.22,.61,.36,1)

---

Animazioni consentite

Fade

Scale

Slide

Opacity

Transform

Mai

Bounce

Rotate

Flip

---

# Feedback

Ogni pressione

↓

Scale

0.97

↓

Glow

↓

Ritorno

1

---

# Scroll

Verticale

Molto morbido.

Mai scroll orizzontale.

---

# Safe Area

Supportare

iPhone

Android

Dynamic Island

Gesture Bar

Notch

---

# Bottom Navigation

Altezza

80 px

Icona

24

Label

12

Blur

20 px

Sempre visibile.

---

# Card

Padding

24

Radius

24

Gap

16

Titolo

20

Descrizione

14

---

# Input Numerici

NON usare

<input type="number">

Usare

[-]

34

[+]

oppure

Wheel Picker

---

# Progress Ring

Spessore

12 px

Animato

Sì

Gradiente

Sì

Centro

Percentuale

---

# Charts

Line Chart

Area Chart

Bar Chart

Ring Chart

Mai grafici 3D.

---

# Loading

Skeleton

Shimmer

Mai spinner a schermo intero.

---

# Empty State

Illustrazione

↓

Titolo

↓

Descrizione

↓

CTA

---

# Feedback Positivo

Check animato

Glow verde

Haptic

Toast

Durata

2 sec

---

# Feedback Negativo

Shake

Rosso

Messaggio breve

Mai popup.

---

# Blur

Solo per

Bottom Sheet

Dialog

FAB

Bottom Navigation

Mai abusarne.

---

# Gestures

Swipe Destra

Completa serie

---

Swipe Sinistra

Annulla

---

Swipe Giù

Chiudi Bottom Sheet

---

Long Press

Dettagli

---

# Responsive

Breakpoint

390

430

768

1024

1440

Sempre progettare partendo da 390 px.

---

# Accessibilità

Contrasto WCAG AA

Focus visibile

Touch >=48 px

Screen Reader

Dark Mode nativa

Riduzione animazioni

Supportata

---

# Performance

60 FPS

CLS ≈ 0

Lazy Loading

Virtualizzazione liste

GPU Animation

Transform invece di top/left

---

# Componenti previsti

Button

FAB

Workout Card

Exercise Card

Progress Ring

Bottom Navigation

Timer

Dialog

Bottom Sheet

Toast

Segmented Control

Chart

Hero Card

Muscle Map

Calendar

Heatmap

Statistic Card

Record Card

History Card

Empty State

Loading Skeleton

Profile Header

Achievement Badge

Workout Summary

Personal Record

Floating Timer

Quick Action

Tutti i componenti dovranno rispettare rigorosamente questo Design System.