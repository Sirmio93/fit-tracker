/* ==========================================================================
   components/index.js — punto di ingresso unico della libreria UI.
   Solo re-export. Nessuna logica, nessuno stato, nessun side-effect.
   L'app deve importare esclusivamente da qui:

     import * as UI from './components/index.js';
     import { Button, HeroCard, showToast } from './components/index.js';
   ========================================================================== */

/* ---- Shared (utility trasversali) ----------------------------------------- */
export { esc, cx, attr, clamp, uid } from './Shared/helpers.js';
export { icon, iconNames }            from './Shared/Icon.js';
export { present }                    from './Shared/Presenter.js';
export { onSwipe, onLongPress, onDragY } from './Shared/Gestures.js';
export { animateOnce, afterTransition } from './Shared/Animate.js';
export {
  THEMES,
  EFFECTIVE_THEMES,
  setTheme,
  getTheme,
  getEffectiveTheme,
} from './Shared/Theme.js';

/* ---- Buttons -------------------------------------------------------------- */
export { Button }     from './Buttons/Button.js';
export { IconButton } from './Buttons/IconButton.js';
export { Fab }        from './Buttons/Fab.js';

/* ---- Cards ---------------------------------------------------------------- */
export { Card }          from './Cards/Card.js';
export { HeroCard }      from './Cards/HeroCard.js';
export { WorkoutCard }   from './Cards/WorkoutCard.js';
export { StatisticCard } from './Cards/StatisticCard.js';
export { HistoryCard }   from './Cards/HistoryCard.js';
export { RecordCard }    from './Cards/RecordCard.js';
export { GoalCard }      from './Cards/GoalCard.js';
export { EmptyCard }     from './Cards/EmptyCard.js';
export { LoadingCard }   from './Cards/LoadingCard.js';
export { ExerciseCard }  from './Cards/ExerciseCard.js';

/* ---- Navigation ----------------------------------------------------------- */
export {
  BottomNavigation,
  mountBottomNavigation,
  setActiveNavItem,
} from './Navigation/BottomNavigation.js';
export { TabBar,    mountTabBar }    from './Navigation/TabBar.js';
export { Segmented, mountSegmented } from './Navigation/Segmented.js';
export { Header }  from './Navigation/Header.js';
export { Toolbar } from './Navigation/Toolbar.js';

/* ---- Workout -------------------------------------------------------------- */
export { WeightPicker, mountWeightPicker } from './Workout/WeightPicker.js';
export { RepsPicker,   mountRepsPicker }   from './Workout/RepsPicker.js';
export { ProgressRing, setProgressRing }   from './Workout/ProgressRing.js';
export {
  FloatingTimer,
  updateFloatingTimer,
  formatSeconds,
} from './Workout/FloatingTimer.js';
export { NextExercise }    from './Workout/NextExercise.js';
export { WorkoutHeader }   from './Workout/WorkoutHeader.js';
export { CompleteButton }  from './Workout/CompleteButton.js';
export { RestScreen, updateRestScreen } from './Workout/RestScreen.js';

/* ---- Charts --------------------------------------------------------------- */
export { LineChart }     from './Charts/LineChart.js';
export { AreaChart }     from './Charts/AreaChart.js';
export { BarChart }      from './Charts/BarChart.js';
export { Heatmap }       from './Charts/Heatmap.js';
export { WeeklyChart }   from './Charts/WeeklyChart.js';
export { MonthlyChart }  from './Charts/MonthlyChart.js';
export { ProgressChart } from './Charts/ProgressChart.js';

/* ---- Feedback ------------------------------------------------------------- */
export { Dialog,      showDialog }      from './Feedback/Dialog.js';
export { BottomSheet, showBottomSheet } from './Feedback/BottomSheet.js';
export { Toast,       showToast, pushToast } from './Feedback/Toast.js';
export { Snackbar,    showSnackbar }    from './Feedback/Snackbar.js';
export { Banner }      from './Feedback/Banner.js';
export { Skeleton }    from './Feedback/Skeleton.js';
export { StateEmpty }  from './Feedback/StateEmpty.js';
export { StateError }  from './Feedback/StateError.js';
export { StateSuccess} from './Feedback/StateSuccess.js';

/* ---- Profile -------------------------------------------------------------- */
export { Avatar }             from './Profile/Avatar.js';
export { ProfileHeader }      from './Profile/ProfileHeader.js';
export { AchievementBadge }   from './Profile/AchievementBadge.js';
export { SettingsRow }        from './Profile/SettingsRow.js';
export {
  PreferenceSwitch,
  mountPreferenceSwitch,
} from './Profile/PreferenceSwitch.js';
