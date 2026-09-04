/* ==========================================================================
   components/index.js — punto di ingresso unico della libreria UI.
   Solo re-export. Nessuna logica, nessuno stato, nessun side-effect.
   L'app deve importare esclusivamente da qui:

     import * as UI from './components/index.js';
     import { Button, Card, pushToast } from './components/index.js';
   ========================================================================== */

/* ---- Foundation primitives (Sprint 9.2B) --------------------------------- */
/* Ring è la primitiva unica per tutti gli anelli SVG del design system:
   progress ring, countdown ring, statistic ring, analytics ring. I wrapper
   legacy (ProgressRing, CircularRestTimer) delegano qui. */
export { Ring, setRingProgress, setRingColor } from './Foundation/Ring.js';

/* ---- Shared (utility trasversali) ----------------------------------------- */
export { esc, cx, attr, clamp, uid } from './Shared/helpers.js';
export { icon }                       from './Shared/Icon.js';
export { present }                    from './Shared/Presenter.js';
export { onDragY }                    from './Shared/Gestures.js';
export {
  THEMES,
  EFFECTIVE_THEMES,
  setTheme,
  getTheme,
  getEffectiveTheme,
} from './Shared/Theme.js';

/* ---- Buttons -------------------------------------------------------------- */
export { Button }     from './Buttons/Button.js';
export { Fab }        from './Buttons/Fab.js';

/* ---- Cards ---------------------------------------------------------------- */
export { Card }          from './Cards/Card.js';
export { StatisticCard } from './Cards/StatisticCard.js';
export { HistoryCard }   from './Cards/HistoryCard.js';
export { EmptyCard }     from './Cards/EmptyCard.js';
export { ExerciseHeroCard } from './Cards/ExerciseHeroCard.js';

/* ---- Anatomy -------------------------------------------------------------- */
export { AnatomyModel } from './Anatomy/AnatomyModel.js';

/* ---- Exercise (Phase 2.3 — Exercise Identity System) ---------------------- */
/* ExerciseIdentity è l'API pubblica per rappresentare un esercizio: nessun
   consumer dovrebbe importare direttamente immagini, AnatomyModel o badge.
   ExerciseVisual resta la primitiva sottostante (mannequin + artwork). */
export { ExerciseVisual }   from './Exercise/ExerciseVisual.js';
export { ExerciseIdentity } from './Exercise/ExerciseIdentity.js';

/* ---- Home (Sprint 9.3 — Premium Dashboard) --------------------------------
   TodaySessionCard è l'unico componente Home rimasto: le altre schermate
   (Hero, Quick Stats, Recent Activity) sono ricostruite con componenti
   Foundation riusati direttamente (ProfileHeader, StatisticCard,
   ExerciseIdentity). Nessuna nuova card. */
export { TodaySessionCard }    from './Home/TodaySessionCard.js';

/* ---- CreateWorkout (T1 · Crea scheda) ------------------------------------
   T1.1 = shell scaffold. T1.2 = HeroMeta (hero card della draft in editing).
   T1.3 = WeekDayNav (segmented settimane + day-tabs con badge count blocchi).
   T1.4 = BlockCard (rendering blocchi del giorno selezionato, read-only).
   T1.5 = BlockConfigSheet (bottom sheet · griglia 9 tipi + campi condizionali).
   T1.6 = ExercisePickerSheet (overlay full-height per multi-add esercizi
          dal catalogo — search accent-fold + filtri categoria/equipment). */
export { renderCreateWorkoutShell }        from './CreateWorkout/CreateWorkoutShell.js';
export { renderHeroMeta, heroMetaStats }   from './CreateWorkout/HeroMeta.js';
export { renderWeekDayNav, resolveNavSelection } from './CreateWorkout/WeekDayNav.js';
export { renderBlocks, renderBlockCard }   from './CreateWorkout/BlockCard.js';
export {
  openBlockConfigSheet,
  renderBlockConfigContent,
  renderTypeGrid,
  renderConditionalFields,
  applyTypeDefaults,
} from './CreateWorkout/BlockConfigSheet.js';
export { getBlockTypeIcon, SUPPORTED_TYPE_ICONS } from './CreateWorkout/BlockTypeIcons.js';
export {
  renderExercisePickerSheet,
  renderExercisePickerFilters,
  renderExercisePickerListInner,
  pickerFilteredEntries,
  PICKER_CATEGORIES,
  PICKER_EQUIPMENT,
} from './CreateWorkout/ExercisePickerSheet.js';

/* ---- Execution (T2 · Esecuzione) -----------------------------------------
   T2.1 = shell scaffold (top bar + progress con tick + sticky CTA).
   T2.2 = SingleExercise + BigStepper + PRBanner + SetPicker + NeighborPeek
          (pattern-setter: T2.3/T2.5/T2.6/T2.7 riuseranno BigStepper e
           SetPicker, sostituiranno SingleExercise con l'analogo per tipo). */
export { renderExecutionShell } from './Execution/ExecutionShell.js';
export { renderSingleExercise } from './Execution/SingleExercise.js';
export { renderBigStepper }     from './Execution/BigStepper.js';
export { renderPRBanner }       from './Execution/PRBanner.js';
export { renderSetPicker }      from './Execution/SetPicker.js';
export { renderNeighborPeek }   from './Execution/NeighborPeek.js';
/* T2.5 · Tabata timer (CountdownRing riusabile in T2.6 EMOM/AMRAP).
   Nota: setRingProgress esiste gia' come re-export da Foundation/Ring.js.
   Il nostro helper viene esposto come setCountdownRingProgress per evitare
   collisione di nomi (ESM vieta duplicate export). */
export { renderTabataTimer, renderTabataCtrls } from './Execution/TabataTimer.js';
export {
  renderCountdownRing,
  setRingProgress as setCountdownRingProgress,
} from './Execution/CountdownRing.js';
/* T2.6 · EMOM/AMRAP timers (family="timed"). EmomTimer riusa CountdownRing
   (direction=down, centerContent = "N/target reps"). AmrapTimer usa timer
   digitale grande (mm:ss che sale, NO ring) + round counter + lista esercizi. */
export { renderEmomTimer, renderEmomCtrls } from './Execution/EmomTimer.js';
export { renderAmrapTimer, renderAmrapCtrls } from './Execution/AmrapTimer.js';
/* T2.3 = CircuitRound (family="round" → Circuit ≡ Superset, rest solo su toggleRound). */
export { renderCircuitRound }   from './Execution/CircuitRound.js';
/* T2.4 = RestOverlay v2 (countdown full-screen, ±15/±30, rest-stats, rest-nx
   con ExerciseIdentity size='sm'). Sostituisce RestScene (rest-v2) come
   renderer del rest overlay quando l'API è disponibile. `startRestTimer`
   API stabile: cambia solo il rendering, non lo state contract. */
export { renderRestOverlay }    from './Execution/RestOverlay.js';

/* ---- Navigation ----------------------------------------------------------- */
export {
  BottomNavigation,
  mountBottomNavigation,
  setActiveNavItem,
} from './Navigation/BottomNavigation.js';
export { Segmented, mountSegmented } from './Navigation/Segmented.js';

/* ---- Workout -------------------------------------------------------------- */
export { WeightPicker } from './Workout/WeightPicker.js';
export { RepsPicker }   from './Workout/RepsPicker.js';
export { ProgressRing, setProgressRing }   from './Workout/ProgressRing.js';
export { NextExercise }    from './Workout/NextExercise.js';
export {
  WorkoutStickyHeader,
  mountWorkoutStickyHeader,
} from './Workout/WorkoutStickyHeader.js';
export { CompleteButton }  from './Workout/CompleteButton.js';
/* Sprint 8.5 — Premium Workout Screen */
export { WorkoutProgress } from './Workout/WorkoutProgress.js';
export { ExerciseHero }       from './Workout/ExerciseHero.js';
export { CompleteSetButton }  from './Workout/CompleteSetButton.js';
/* Phase 2 — Complete UI Reconstruction (Workout scene)
   Sprint 9.1A #1: WorkoutTopBar è stato unificato in WorkoutStickyHeader
   ({mode:'immersive'}). Non esiste più come export separato. */
export { ExerciseStage }      from './Workout/ExerciseStage.js';
export { StepperField }       from './Workout/StepperField.js';

/* ---- Rest (Sprint 8.4 — Premium Rest Screen) ------------------------------ */
export {
  CircularRestTimer,
  setCircularRestProgress,
  setCircularRestPaused,
  setCircularRestTotal,
} from './Rest/CircularRestTimer.js';

/* ---- Rest V2 (Sprint 9.2 — Premium Rest Experience) ----------------------- */
export {
  RestCountdownHero,
  setRestHeroMessage,
  setRestHeroPaused,
} from './Rest/RestCountdownHero.js';
export { RestNextIdentity }  from './Rest/RestNextIdentity.js';
export { RestTimeline }      from './Rest/RestTimeline.js';
export { RestActionsV2 }     from './Rest/RestActionsV2.js';
export { RestScene }         from './Rest/RestScene.js';

/* ---- Feedback ------------------------------------------------------------- */
export { showDialog }      from './Feedback/Dialog.js';
export { showBottomSheet } from './Feedback/BottomSheet.js';
export { pushToast }       from './Feedback/Toast.js';
export { Banner }          from './Feedback/Banner.js';
export { Skeleton }    from './Feedback/Skeleton.js';
export { StateEmpty }  from './Feedback/StateEmpty.js';
export { StateError }  from './Feedback/StateError.js';
export { StateSuccess} from './Feedback/StateSuccess.js';

/* ---- Profile -------------------------------------------------------------- */
export { Avatar }             from './Profile/Avatar.js';
export { ProfileHeader }      from './Profile/ProfileHeader.js';
export { SettingsRow }        from './Profile/SettingsRow.js';
export {
  PreferenceSwitch,
  mountPreferenceSwitch,
} from './Profile/PreferenceSwitch.js';
