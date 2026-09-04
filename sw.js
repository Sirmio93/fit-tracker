const CACHE = 'fit-tracker-v23';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon.svg',

    './components/index.css',
    './components/bootstrap.js',
    './components/index.js',

    './components/Foundation/tokens.css',
    './components/Foundation/typography.css',
    './components/Foundation/utilities.css',
    './components/Foundation/ring.css',
    './components/Foundation/Ring.js',

    './components/Shared/shared.css',
    './components/Shared/helpers.js',
    './components/Shared/Icon.js',
    './components/Shared/Presenter.js',
    './components/Shared/Gestures.js',
    './components/Shared/Theme.js',

    './components/Buttons/buttons.css',
    './components/Buttons/Button.js',
    './components/Buttons/Fab.js',

    './components/Cards/cards.css',
    './components/Cards/Card.js',
    './components/Cards/StatisticCard.js',
    './components/Cards/HistoryCard.js',
    './components/Cards/EmptyCard.js',
    './components/Cards/ExerciseHeroCard.js',

    './components/Anatomy/anatomy.css',
    './components/Anatomy/AnatomyModel.js',
    './components/Anatomy/geometry.js',

    './components/Exercise/exercise.css',
    './components/Exercise/ExerciseVisual.js',
    './components/Exercise/ExerciseIdentity.js',

    './components/Home/home.css',
    './components/Home/TodaySessionCard.js',

    './components/Navigation/navigation.css',
    './components/Navigation/BottomNavigation.js',
    './components/Navigation/Segmented.js',

    './components/Workout/workout.css',
    './components/Workout/workout-v2.css',
    './components/Workout/WeightPicker.js',
    './components/Workout/RepsPicker.js',
    './components/Workout/ProgressRing.js',
    './components/Workout/NextExercise.js',
    './components/Workout/WorkoutStickyHeader.js',
    './components/Workout/CompleteButton.js',
    './components/Workout/WorkoutProgress.js',
    './components/Workout/ExerciseHero.js',
    './components/Workout/CompleteSetButton.js',
    './components/Workout/ExerciseStage.js',
    './components/Workout/StepperField.js',

    './components/Rest/rest.css',
    './components/Rest/rest-v2.css',
    './components/Rest/CircularRestTimer.js',
    './components/Rest/RestCountdownHero.js',
    './components/Rest/RestNextIdentity.js',
    './components/Rest/RestTimeline.js',
    './components/Rest/RestActionsV2.js',
    './components/Rest/RestScene.js',

    './components/Feedback/feedback.css',
    './components/Feedback/Dialog.js',
    './components/Feedback/BottomSheet.js',
    './components/Feedback/Toast.js',
    './components/Feedback/Banner.js',
    './components/Feedback/Skeleton.js',
    './components/Feedback/StateEmpty.js',
    './components/Feedback/StateError.js',
    './components/Feedback/StateSuccess.js',

    './components/Profile/profile.css',
    './components/Profile/Avatar.js',
    './components/Profile/ProfileHeader.js',
    './components/Profile/SettingsRow.js',
    './components/Profile/PreferenceSwitch.js',

    './components/Execution/execution-shell.css',
    './components/Execution/ExecutionShell.js',
    './components/Execution/SingleExercise.js',
    './components/Execution/CircuitRound.js',
    './components/Execution/SetPicker.js',
    './components/Execution/BigStepper.js',
    './components/Execution/CountdownRing.js',
    './components/Execution/AmrapTimer.js',
    './components/Execution/EmomTimer.js',
    './components/Execution/TabataTimer.js',
    './components/Execution/RestOverlay.js',
    './components/Execution/NeighborPeek.js',
    './components/Execution/PRBanner.js',

    './components/CreateWorkout/create-workout.css',
    './components/CreateWorkout/CreateWorkoutShell.js',
    './components/CreateWorkout/BlockCard.js',
    './components/CreateWorkout/BlockActions.js',
    './components/CreateWorkout/BlockConfigSheet.js',
    './components/CreateWorkout/BlockTypeIcons.js',
    './components/CreateWorkout/ExercisePickerSheet.js',
    './components/CreateWorkout/HeroMeta.js',
    './components/CreateWorkout/WeekDayNav.js',

    './data/blockTypes.js',
    './data/exercisesCatalog.json',
    './services/catalogService.js',
    './services/exerciseAssetService.js',
    './utils/exerciseSlug.js',
    './data/exerciseAssets.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => { }));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const u = new URL(req.url);
    if (u.hostname === 'api.github.com') return;
    if (u.origin !== location.origin) return;

    e.respondWith(
        caches.match(req).then(cached =>
            cached ||
            fetch(req).then(res => {
                if (res && res.ok && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                }
                return res;
            }).catch(() => cached ?? new Response('', { status: 503, statusText: 'Offline' }))
        )
    );
});
