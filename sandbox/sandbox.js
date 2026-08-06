/* ==========================================================================
   sandbox.js — Controller UI Sandbox (Fase 8)
   Compone i componenti (Components.*) in un documento organizzato per sezioni.
   Espone toolbar: viewport simulator, theme switch (light/dark/amoled), debug
   overlays (padding/margin/grid/safe-area/touch/baseline), a11y overlays
   (contrast/aria/focus/keyboard), performance HUD (render/count/FPS/DOM).
   ========================================================================== */

(function () {
  'use strict';

  var C = window.Components;
  var doc = document;
  var body = doc.body;
  var qs   = function (s, r) { return (r || doc).querySelector(s); };
  var qsa  = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  // ---------- State ----------------------------------------------------------
  var state = {
    theme:    localStorage.sbTheme    || 'light',
    viewport: localStorage.sbViewport || '390',
    debug:    { padding: false, margin: false, grid: false, safe: false, touch: false, baseline: false },
    a11y:     { contrast: false, aria: false, focus: false, keyboard: false },
    perf:     localStorage.sbPerf === '1'
  };

  // ---------- Sections definition -------------------------------------------
  // Ogni sezione ha id, title, eyebrow, body e un array di sub-showcase.
  // Ogni sub ha title, meta e un callback render() → HTML string.
  var Sections = [
    // === FOUNDATION =========================================================
    {
      id: 'foundation',
      eyebrow: '§0',
      title: 'Foundation',
      body: 'Materia prima del design system: colori, tipografia, spacing, radius, ombre, animazioni, breakpoint. Ogni valore proviene da 13_DESIGN_TOKENS.json ed è consumato via variabile CSS.',
      subs: [
        { title: 'Palette colori', meta: 'colors.* — 18 token semantici', render: renderPalette },
        { title: 'Gradienti',      meta: 'colors.gradient*', render: renderGradients },
        { title: 'Typography',     meta: 'typography.display → typography.small', render: renderTypography },
        { title: 'Spacing scale',  meta: 'spacing.4 → spacing.96', render: renderSpacing },
        { title: 'Radius',         meta: 'radius.small → radius.xl / pill', render: renderRadius },
        { title: 'Elevation',      meta: 'elevation.0 → elevation.5', render: renderElevation },
        { title: 'Shadow',         meta: 'shadow.sm → shadow.xl / glass / floating', render: renderShadow },
        { title: 'Blur',           meta: 'blur.glass → blur.dialog', render: renderBlur },
        { title: 'Breakpoints',    meta: 'breakpoints.mobileSmall → wide', render: renderBreakpoints },
        { title: 'Safe area',      meta: 'safeArea.top / bottom / horizontal', render: renderSafeArea }
      ]
    },

    // === BUTTONS ============================================================
    {
      id: 'buttons',
      eyebrow: '§1',
      title: 'Buttons',
      body: 'Bottoni primari, secondari, ghost e danger nelle 3 taglie e in tutti gli stati testabili. Ogni bottone rispetta il touch target minimo (44 px).',
      subs: [
        { title: 'Varianti', meta: 'primary · secondary · ghost · danger', render: function () {
          return specimen([
            C.Button({ variant: 'primary',   label: 'Primary' }),
            C.Button({ variant: 'secondary', label: 'Secondary' }),
            C.Button({ variant: 'ghost',     label: 'Ghost' }),
            C.Button({ variant: 'danger',    label: 'Danger' }),
            C.Button({ variant: 'primary',   label: 'Floating', floating: true })
          ]);
        }},
        { title: 'Taglie', meta: 'sm (44) · md (48) · lg (56)', render: function () {
          return specimen([
            C.Button({ variant: 'primary', size: 'sm', label: 'Small' }),
            C.Button({ variant: 'primary',            label: 'Medium' }),
            C.Button({ variant: 'primary', size: 'lg', label: 'Large' })
          ]);
        }},
        { title: 'Con icona', meta: 'icon + label · icon only', render: function () {
          return specimen([
            C.Button({ variant: 'primary', label: 'Aggiungi',  icon: 'plus' }),
            C.Button({ variant: 'ghost',   label: 'Riproduci', icon: 'play' }),
            C.Button({ variant: 'primary', iconOnly: true, icon: 'plus', label: 'Aggiungi' }),
            C.Button({ variant: 'ghost',   iconOnly: true, icon: 'close', label: 'Chiudi' }),
            C.Fab({ icon: 'plus', label: 'Nuova sessione' })
          ]);
        }},
        { title: 'Stati', meta: 'default · pressed · loading · disabled', render: function () {
          return specimen([
            C.Button({ variant: 'primary', label: 'Default' }),
            C.Button({ variant: 'primary', label: 'Pressed', pressed: true }),
            C.Button({ variant: 'primary', label: 'Loading', loading: true }),
            C.Button({ variant: 'primary', label: 'Disabled', disabled: true }),
            C.Button({ variant: 'primary', label: 'Focus', class: 'sb-force-focus' })
          ]);
        }},
        { title: 'Ghost — hover/pressed/focus', meta: 'stati inline', render: function () {
          return specimen([
            C.Button({ variant: 'ghost', label: 'Hover me' }),
            C.Button({ variant: 'ghost', label: 'Pressed', pressed: true }),
            C.Button({ variant: 'ghost', label: 'Disabled', disabled: true })
          ]);
        }}
      ]
    },

    // === CARDS ==============================================================
    {
      id: 'cards',
      eyebrow: '§2',
      title: 'Cards',
      body: 'Card statiche, interattive e specializzate. Ogni card è un contenitore semantico (article/section) con eyebrow, titolo, corpo e riga di footer.',
      subs: [
        { title: 'Hero Card',       render: function () { return specimen([C.HeroCard()], 'column'); } },
        { title: 'Workout Card',    render: function () { return specimen([C.WorkoutCard()], 'column'); } },
        { title: 'Exercise Card',   render: function () { return specimen([C.ExerciseCard()], 'column'); } },
        { title: 'Statistic Card',  render: function () { return specimen([
          C.StatisticCard(),
          C.StatisticCard({ eyebrow: 'Frequenza settimanale', value: '3.8', unit: 'sess/sett', delta: '- 0,4 rispetto al mese scorso', negative: true })
        ]); } },
        { title: 'History Card',    render: function () { return specimen([
          C.HistoryCard(),
          C.HistoryCard({ initials: 'PU', title: 'Pull A · Giorno 2', meta: '3 giorni fa · 38 min · 4 100 kg', badge: 'Completata' })
        ], 'column'); } },
        { title: 'Record Card',     render: function () { return specimen([C.RecordCard()], 'column'); } },
        { title: 'Goal Card',       render: function () { return specimen([
          C.GoalCard({ progress: 68 }),
          C.GoalCard({ progress: 100, title: 'Obiettivo raggiunto' })
        ], 'column'); } },
        { title: 'Empty Card',      render: function () { return specimen([C.EmptyCard()], 'column'); } },
        { title: 'Loading Card',    render: function () { return specimen([C.LoadingCard()], 'column'); } }
      ]
    },

    // === NAVIGATION =========================================================
    {
      id: 'navigation',
      eyebrow: '§3',
      title: 'Navigation',
      body: 'Bottom nav (4 tab), tab bar orizzontale, segmented control, FAB, header top e toolbar inline.',
      subs: [
        { title: 'Bottom Navigation', meta: '4 tab · touch 48px', render: function () {
          return specimenFill([C.BottomNav({ active: 'home' }), C.BottomNav({ active: 'workout' })]);
        } },
        { title: 'Tab Bar',           render: function () { return specimenFill([C.TabBar()]); } },
        { title: 'Segmented Control', render: function () { return specimen([C.Segmented(), C.Segmented({ items: ['3M', '6M', '1A', 'Tutto'], active: 2 })]); } },
        { title: 'FAB',               render: function () { return specimen([C.Fab({ icon: 'plus' }), C.Fab({ icon: 'play' })]); } },
        { title: 'Header',            render: function () { return specimenFill([C.Header()]); } },
        { title: 'Toolbar',           render: function () { return specimen([C.Toolbar()]); } }
      ]
    },

    // === WORKOUT ============================================================
    {
      id: 'workout',
      eyebrow: '§4',
      title: 'Workout',
      body: 'Componenti dedicati alla schermata di esecuzione: picker peso/reps, timer flottante, progress ring, prossimo esercizio, header sessione, CTA di completamento e schermata di recupero.',
      subs: [
        { title: 'Exercise Card (esteso)', render: function () { return specimen([C.ExerciseCard({
          title: 'Squat bilanciere', target: 'Gambe · fondamentale',
          sets: [
            { n: 1, reps: 10, weight: 60, done: true },
            { n: 2, reps: 10, weight: 60, done: true },
            { n: 3, reps: 8,  weight: 70, done: false },
            { n: 4, reps: 6,  weight: 80, done: false }
          ]
        })], 'column'); } },
        { title: 'Weight Picker',   render: function () { return specimen([C.WeightPicker({ value: 40 }), C.WeightPicker({ value: 82.5 })]); } },
        { title: 'Reps Picker',     render: function () { return specimen([C.RepsPicker({ value: 12 }), C.RepsPicker({ value: 6 })]); } },
        { title: 'Floating Timer',  render: function () { return specimen([C.FloatingTimer({ time: '01:12' }), C.FloatingTimer({ time: '00:03' })]); } },
        { title: 'Progress Ring',   render: function () { return specimen([C.ProgressRing({ progress: 12, size: 72 }), C.ProgressRing({ progress: 45, size: 96 }), C.ProgressRing({ progress: 82, size: 120 })]); } },
        { title: 'Next Exercise',   render: function () { return specimen([C.NextExercise()], 'column'); } },
        { title: 'Workout Header',  render: function () { return specimen([C.WorkoutHeader()], 'column'); } },
        { title: 'Complete Button', render: function () { return specimenFill([C.CompleteButton()]); } },
        { title: 'Rest Screen',     render: function () { return specimenFill([C.RestScreen({ time: '00:45' })]); } }
      ]
    },

    // === FEEDBACK ===========================================================
    {
      id: 'feedback',
      eyebrow: '§5',
      title: 'Feedback',
      body: 'Comunicazione asincrona: toast, dialog, bottom sheet, snackbar, banner in-page, skeleton di caricamento, empty/error/success states.',
      subs: [
        { title: 'Toast', meta: '4 varianti', render: function () { return specimen([
          C.Toast({ message: 'Sessione salvata',    variant: 'success' }),
          C.Toast({ message: 'Errore sincronia',    variant: 'error' }),
          C.Toast({ message: 'Suggerimento del giorno', variant: 'info' }),
          C.Toast({ message: 'Timer avviato' })
        ]); } },
        { title: 'Dialog',       render: function () { return specimen([C.Dialog()], 'column'); } },
        { title: 'Bottom Sheet', render: function () { return specimen([C.BottomSheet()], 'column'); } },
        { title: 'Snackbar',     render: function () { return specimen([C.Snackbar(), C.Snackbar({ message: 'Serie annullata', action: 'RIPRISTINA' })]); } },
        { title: 'Banner',       render: function () { return specimen([
          C.Banner({ variant: 'info',    title: 'Aggiornamento disponibile', body: 'La versione 2.1 è pronta all\'installazione.', action: 'Aggiorna' }),
          C.Banner({ variant: 'warning', title: 'Sync in ritardo',            body: 'Nessun backup da 3 giorni.',                    action: 'Sincronizza' }),
          C.Banner({ variant: 'error',   title: 'Errore critico',             body: 'Impossibile scrivere sul database locale.',      action: 'Diagnostica' }),
          C.Banner({ variant: 'success', title: 'Backup completato',          body: 'Tutti i dati sono su GitHub.',                    action: 'Vedi commit' })
        ], 'column'); } },
        { title: 'Loading Skeleton', render: function () { return specimen([C.Skeleton({ lines: 4 })], 'column'); } },
        { title: 'Empty State',   render: function () { return specimen([C.StateEmpty()], 'column'); } },
        { title: 'Error State',   render: function () { return specimen([C.StateError()], 'column'); } },
        { title: 'Success State', render: function () { return specimen([C.StateSuccess()], 'column'); } }
      ]
    },

    // === CHARTS =============================================================
    {
      id: 'charts',
      eyebrow: '§6',
      title: 'Charts',
      body: 'Charting minimale in SVG, senza librerie esterne. Ogni elemento (linea, punto, barra) usa il colore primary dai token.',
      subs: [
        { title: 'Progress Ring', render: function () { return specimen([C.ProgressRing({ progress: 25 }), C.ProgressRing({ progress: 65 }), C.ProgressRing({ progress: 100 })]); } },
        { title: 'Line Chart',    render: function () { return specimen([C.LineChart()], 'column'); } },
        { title: 'Area Chart',    render: function () { return specimen([C.AreaChart()], 'column'); } },
        { title: 'Bar Chart',     render: function () { return specimen([C.BarChart()], 'column'); } },
        { title: 'Heatmap',       render: function () { return specimen([C.Heatmap()], 'column'); } },
        { title: 'Weekly Chart',  render: function () { return specimen([C.WeeklyChart()], 'column'); } },
        { title: 'Monthly Chart', render: function () { return specimen([C.MonthlyChart()], 'column'); } }
      ]
    },

    // === PROFILE ============================================================
    {
      id: 'profile',
      eyebrow: '§7',
      title: 'Profile',
      body: 'Componenti del profilo utente: avatar, header, badge achievement, goal card, riga impostazioni con switch di preferenza.',
      subs: [
        { title: 'Avatar', meta: 'sm · md · lg · xl', render: function () { return specimen([
          C.Avatar({ size: 'sm' }), C.Avatar(), C.Avatar({ size: 'lg' }), C.Avatar({ size: 'xl' })
        ]); } },
        { title: 'Profile Header',    render: function () { return specimen([C.ProfileHeader()], 'column'); } },
        { title: 'Achievement Badge', render: function () { return specimen([
          C.AchievementBadge({ icon: 'trophy', title: 'Prima settimana',   meta: '5 sessioni' }),
          C.AchievementBadge({ icon: 'star',   title: 'Costanza mensile',  meta: '20 sessioni' }),
          C.AchievementBadge({ icon: 'trophy', title: 'PR × 10',           meta: 'Force + volume' })
        ]); } },
        { title: 'Goal Card', render: function () { return specimen([C.GoalCard()], 'column'); } },
        { title: 'Settings Row',      render: function () { return specimen([
          C.SettingsRow({ label: 'Notifiche',     meta: 'Push · vibrazione', switch: true }),
          C.SettingsRow({ label: 'Tema',          meta: 'Sistema · scuro · AMOLED' }),
          C.SettingsRow({ label: 'Backup GitHub', meta: 'Ogni fine sessione', switch: false })
        ], 'column'); } },
        { title: 'Preference Switch', render: function () { return specimen([C.PreferenceSwitch({ on: true }), C.PreferenceSwitch({ on: false })]); } }
      ]
    },

    // === GESTURES ===========================================================
    {
      id: 'gestures',
      eyebrow: '§8',
      title: 'Gestures',
      body: 'Preview visuali di swipe, long press, pressed state e drag. Le animazioni sono continue ai fini della sandbox e rispettano prefers-reduced-motion.',
      subs: [
        { title: 'Swipe Preview',     render: function () { return specimenFill([C.Swipe()]); } },
        { title: 'Long Press',        render: function () { return specimenFill([C.LongPress()]); } },
        { title: 'Pressed State',    render: function () { return specimenFill([C.Pressed()]); } },
        { title: 'Drag Preview',      render: function () { return specimenFill([C.Drag()]); } }
      ]
    },

    // === ANIMATIONS =========================================================
    {
      id: 'animations',
      eyebrow: '§9',
      title: 'Animations',
      body: 'Micro-animazioni: fade, slide, scale e transizioni composte per progress ring, toast, bottom sheet, skeleton e card. Timing e curve dai token; azzerate sotto prefers-reduced-motion.',
      subs: [
        { title: 'Fade',                render: function () { return specimen([C.Anim('fade')]); } },
        { title: 'Slide',               render: function () { return specimen([C.Anim('slide')]); } },
        { title: 'Scale',               render: function () { return specimen([C.Anim('scale')]); } },
        { title: 'Progress Ring (fill)', render: function () { return specimen([C.ProgressRing({ progress: 33 }), C.ProgressRing({ progress: 66 }), C.ProgressRing({ progress: 99 })]); } },
        { title: 'Toast entry',         render: function () { return specimen([C.Toast({ variant: 'success', message: 'Ri-entrata al mount' })]); } },
        { title: 'Bottom Sheet entry',  render: function () { return specimen([C.BottomSheet()], 'column'); } },
        { title: 'Skeleton shimmer',    render: function () { return specimen([C.Skeleton({ lines: 3 })], 'column'); } },
        { title: 'Card transition',     render: function () { return specimen([C.Card({ variant: 'statistic', title: 'Card interattiva', body: 'Hover per vedere elevation salire', interactive: true })], 'column'); } },
        { title: 'Hero transition',     render: function () { return specimen([C.HeroCard()], 'column'); } }
      ]
    }
  ];

  // ---------- Section helpers -----------------------------------------------
  function specimen(nodes, layout) {
    return '<div class="sb-specimen' + (layout === 'column' ? ' sb-specimen--column' : '') + '">' +
      nodes.join('') + '</div>';
  }
  function specimenFill(nodes) {
    return '<div class="sb-specimen sb-specimen--fill">' + nodes.join('') + '</div>';
  }

  // ---------- Foundation renderers ------------------------------------------
  function readVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function contrastRatio(hex1, hex2) {
    function lum(c) {
      c = c.replace('#', '');
      if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
      var r = parseInt(c.substr(0, 2), 16) / 255;
      var g = parseInt(c.substr(2, 2), 16) / 255;
      var b = parseInt(c.substr(4, 2), 16) / 255;
      [r, g, b] = [r, g, b].map(function (x) { return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    try {
      var L1 = lum(hex1), L2 = lum(hex2);
      var hi = Math.max(L1, L2), lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    } catch (e) { return null; }
  }

  function passLabel(ratio) {
    if (ratio == null) return null;
    if (ratio >= 7)   return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'FAIL';
  }

  function renderPalette() {
    var tokens = [
      'background', 'surface', 'surfaceElevated', 'surfaceActive',
      'primary', 'primaryHover', 'secondary',
      'success', 'warning', 'error', 'info',
      'textPrimary', 'textSecondary', 'textDisabled',
      'border', 'divider', 'overlay', 'glass'
    ];
    var fg = readVar('--color-textPrimary');
    return '<div class="sb-swatches">' + tokens.map(function (t) {
      var v = readVar('--color-' + t);
      var ratio = /^#/.test(v) ? contrastRatio(v, fg) : null;
      var pass = passLabel(ratio);
      return '<div class="sb-swatch">' +
        '<div class="sb-swatch__chip" style="background:var(--color-' + t + ')"></div>' +
        '<div class="sb-swatch__name">' + t + '</div>' +
        '<div class="sb-swatch__value">' + (v || '—') + '</div>' +
        (ratio != null ? '<div class="sb-swatch__contrast" data-pass="' + pass + '">' + ratio.toFixed(2) + ':1 · ' + pass + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  function renderGradients() {
    var gs = ['primary', 'workout', 'success', 'record'];
    return '<div class="sb-swatches">' + gs.map(function (g) {
      return '<div class="sb-swatch">' +
        '<div class="sb-swatch__chip" style="background:var(--gradient-' + g + ')"></div>' +
        '<div class="sb-swatch__name">gradient.' + g + '</div>' +
        '<div class="sb-swatch__value">linear-gradient 135°</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderTypography() {
    var levels = ['display', 'h1', 'h2', 'h3', 'title', 'body', 'caption', 'small'];
    return '<div class="c-stack">' + levels.map(function (l) {
      return '<div class="sb-typeSpec">' +
        '<div style="font-size:var(--type-' + l + '-size);line-height:var(--type-' + l + '-line);' +
              'font-weight:var(--type-' + l + '-weight);letter-spacing:var(--type-' + l + '-track);color:var(--color-textPrimary)">' +
          'Aa · ' + l +
        '</div>' +
        '<div class="sb-typeSpec__meta">' +
          'size ' + readVar('--type-' + l + '-size') + ' · line ' + readVar('--type-' + l + '-line') +
          ' · weight ' + readVar('--type-' + l + '-weight') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderSpacing() {
    var steps = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];
    return '<div class="sb-spacingScale">' + steps.map(function (s) {
      return '<div class="sb-spacingScale__row">' +
        '<div class="sb-spacingScale__meta">' + s + 'px</div>' +
        '<div class="sb-spacingScale__bar" style="width:var(--space-' + s + ')"></div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderRadius() {
    var rs = ['small', 'medium', 'large', 'xl', 'pill', 'card', 'dialog', 'bottomSheet'];
    return '<div class="sb-radiusRow">' + rs.map(function (r) {
      return '<div class="sb-radiusRow__item">' +
        '<div class="sb-radiusRow__box" style="border-radius:var(--radius-' + r + ')"></div>' +
        '<div class="sb-swatch__value">' + r + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderElevation() {
    var levels = [
      { name: 'elev-0', shadow: 'var(--shadow-none)' },
      { name: 'elev-1', shadow: 'var(--shadow-sm)' },
      { name: 'elev-2', shadow: 'var(--shadow-md)' },
      { name: 'elev-3', shadow: 'var(--shadow-lg)' },
      { name: 'elev-4', shadow: 'var(--shadow-xl)' },
      { name: 'elev-5', shadow: 'var(--shadow-elev-5)' }
    ];
    return '<div class="sb-elevRow">' + levels.map(function (l) {
      return '<div class="sb-elevRow__box" style="box-shadow:' + l.shadow + '">' + l.name + '</div>';
    }).join('') + '</div>';
  }

  function renderShadow() {
    var shadows = ['sm', 'md', 'lg', 'xl', 'glass', 'floating'];
    return '<div class="sb-elevRow">' + shadows.map(function (s) {
      return '<div class="sb-elevRow__box" style="box-shadow:var(--shadow-' + s + ')">' + s + '</div>';
    }).join('') + '</div>';
  }

  function renderBlur() {
    var blurs = ['glass', 'navigation', 'sheet', 'overlay', 'dialog'];
    return '<div class="sb-blurRow">' + blurs.map(function (b) {
      return '<div class="sb-blurRow__cell">' +
        '<div class="sb-blurRow__glass" style="--_blur:var(--blur-' + b + ')">' + b + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderBreakpoints() {
    var bps = [
      { n: 'mobileSmall', v: '360' },
      { n: 'mobile',      v: '390' },
      { n: 'mobileLarge', v: '430' },
      { n: 'tablet',      v: '768' },
      { n: 'desktop',     v: '1024' },
      { n: 'wide',        v: '1440' }
    ];
    return '<div class="c-stack c-stack--sm">' + bps.map(function (b) {
      return '<div class="c-settingsRow">' +
        '<div><div class="c-settingsRow__label">' + b.n + '</div>' +
        '<div class="c-settingsRow__meta">min-width: ' + b.v + 'px</div></div>' +
        '<button type="button" class="sb-btn" data-viewport-set="' + b.v + '">Prova</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderSafeArea() {
    return '<div class="c-banner c-banner--info"><span class="c-banner__icon">' + C.Icons.bell + '</span>' +
      '<div class="c-grow"><h4 class="c-banner__title">safeArea.top / bottom / horizontal</h4>' +
      '<p class="c-banner__body">Attiva l\'overlay Safe Area dalla toolbar per visualizzare gli inset simulati sopra il viewport.</p></div></div>';
  }

  // ---------- Section renderer ----------------------------------------------
  function renderSection(sec) {
    var subs = sec.subs.map(function (s) {
      return '<div class="sb-sub">' +
        '<h3 class="sb-sub__title">' + s.title + '</h3>' +
        (s.meta ? '<p class="sb-sub__meta">' + s.meta + '</p>' : '') +
        s.render() +
      '</div>';
    }).join('');
    return '<section id="sec-' + sec.id + '" class="sb-section" aria-labelledby="h-' + sec.id + '">' +
      '<p class="sb-section__eyebrow">' + sec.eyebrow + '</p>' +
      '<h2 class="sb-section__title" id="h-' + sec.id + '">' + sec.title + '</h2>' +
      '<p class="sb-section__body">' + sec.body + '</p>' +
      subs +
    '</section>';
  }

  function renderAll() {
    var t0 = performance.now();

    // Sidebar
    var aside = qs('#sb-aside-nav');
    if (aside) {
      aside.innerHTML = Sections.map(function (s) {
        return '<a href="#sec-' + s.id + '" class="sb-aside__link" data-sec="' + s.id + '">' +
          '<span>' + s.title + '</span>' +
          '<span class="sb-aside__count">' + s.subs.length + '</span>' +
        '</a>';
      }).join('');
    }

    // Viewport content
    var vp = qs('#sb-viewport-body');
    if (vp) {
      vp.innerHTML = Sections.map(renderSection).join('');
    }

    var t1 = performance.now();
    perf.lastRender = (t1 - t0);
    perf.componentCount = qsa('.c-btn, .c-card, .c-picker, .c-bottomNav, .c-tabBar, .c-segmented, .c-fab, .c-header, .c-toolbar, .c-floatingTimer, .c-progressRing, .c-nextExercise, .c-workoutHeader, .c-completeBtn, .c-restScreen, .c-toast, .c-dialog, .c-bottomSheet, .c-snackbar, .c-banner, .c-state, .c-chart, .c-avatar, .c-profileHeader, .c-achievement, .c-settingsRow, .c-switch, .c-gesturePreview, .c-animPreview', vp).length;
    perf.domNodes = qsa('*', vp).length;
    updatePerfHUD();
  }

  // ---------- Toolbar wiring ------------------------------------------------
  function applyState() {
    doc.documentElement.dataset.theme = state.theme;
    var frame = qs('#sb-viewport');
    if (frame) frame.dataset.viewport = state.viewport;
    var vpLabel = qs('#sb-viewport-label');
    if (vpLabel) vpLabel.textContent = state.viewport === 'fluid' ? 'Fluid' : (state.viewport + 'px');
    Object.keys(state.debug).forEach(function (k) { body.dataset['debug' + cap(k)] = state.debug[k] ? 'on' : 'off'; });
    Object.keys(state.a11y).forEach(function (k)  { body.dataset['a11y'  + cap(k)] = state.a11y[k]  ? 'on' : 'off'; });
    body.dataset.perf = state.perf ? 'on' : 'off';
    // Highlight active toolbar buttons
    qsa('[data-theme-set]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.themeSet === state.theme); });
    qsa('[data-viewport-set]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.viewportSet === state.viewport); });
    qsa('[data-debug-toggle]').forEach(function (b) { b.classList.toggle('is-active', !!state.debug[b.dataset.debugToggle]); });
    qsa('[data-a11y-toggle]').forEach(function (b)  { b.classList.toggle('is-active', !!state.a11y[b.dataset.a11yToggle]); });
    var perfBtn = qs('[data-perf-toggle]'); if (perfBtn) perfBtn.classList.toggle('is-active', state.perf);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function bindToolbar() {
    doc.addEventListener('click', function (e) {
      var t = e.target.closest('[data-theme-set],[data-viewport-set],[data-debug-toggle],[data-a11y-toggle],[data-perf-toggle]');
      if (!t) return;
      if (t.dataset.themeSet) {
        state.theme = t.dataset.themeSet; localStorage.sbTheme = state.theme;
      } else if (t.dataset.viewportSet) {
        state.viewport = t.dataset.viewportSet; localStorage.sbViewport = state.viewport;
      } else if (t.dataset.debugToggle) {
        var k = t.dataset.debugToggle; state.debug[k] = !state.debug[k];
      } else if (t.dataset.a11yToggle) {
        var k2 = t.dataset.a11yToggle;  state.a11y[k2] = !state.a11y[k2];
      } else if (t.dataset.perfToggle != null) {
        state.perf = !state.perf; localStorage.sbPerf = state.perf ? '1' : '0';
      }
      applyState();
    });
  }

  // ---------- Sidebar scroll-spy --------------------------------------------
  function bindScrollSpy() {
    var links = qsa('.sb-aside__link');
    if (!links.length) return;
    var byId = {};
    links.forEach(function (l) { byId[l.dataset.sec] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id.replace(/^sec-/, '');
          links.forEach(function (l) { l.classList.toggle('is-active', l.dataset.sec === id); });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    Sections.forEach(function (s) {
      var el = qs('#sec-' + s.id);
      if (el) io.observe(el);
    });
  }

  // ---------- Performance HUD -----------------------------------------------
  var perf = { lastRender: 0, componentCount: 0, domNodes: 0, fps: 0 };

  function fpsMeter() {
    var last = performance.now(), frames = 0;
    function tick(now) {
      frames++;
      if (now - last >= 500) {
        perf.fps = Math.round(frames * 1000 / (now - last));
        frames = 0; last = now;
        updatePerfHUD();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function updatePerfHUD() {
    var hud = qs('#sb-perf');
    if (!hud) return;
    hud.querySelector('[data-perf="render"]').textContent = perf.lastRender.toFixed(1) + ' ms';
    hud.querySelector('[data-perf="count"]').textContent  = perf.componentCount;
    hud.querySelector('[data-perf="fps"]').textContent    = perf.fps;
    hud.querySelector('[data-perf="dom"]').textContent    = perf.domNodes;
    // Warn levels
    var fpsEl = hud.querySelector('[data-perf="fps"]');
    fpsEl.dataset.warn = perf.fps >= 55 ? '0' : (perf.fps >= 40 ? '1' : '2');
    var renderEl = hud.querySelector('[data-perf="render"]');
    renderEl.dataset.warn = perf.lastRender < 50 ? '0' : (perf.lastRender < 120 ? '1' : '2');
  }

  // ---------- Bootstrap ------------------------------------------------------
  function init() {
    renderAll();
    applyState();
    bindToolbar();
    bindScrollSpy();
    fpsMeter();
    // Deep-link ancore
    if (location.hash) {
      var target = qs(location.hash);
      if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

})();
