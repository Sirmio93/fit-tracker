/* ==========================================================================
   components.js — Fit Tracker PWA Component Factories (Fase 8)
   Funzioni pure che restituiscono stringhe HTML consumando esclusivamente
   le classi .c-* di components.css. NESSUN valore grafico letterale
   (colori, dimensioni, radius) qui: se un componente richiede un dato
   grafico specifico, lo esprime tramite classe o custom property definita
   in tokens.css.
   ========================================================================== */

(function (global) {
  'use strict';

  // ---------- Helpers ---------------------------------------------------------
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };
  var cx = function (arr) { return arr.filter(Boolean).join(' '); };
  var attr = function (obj) {
    return Object.keys(obj || {}).map(function (k) {
      var v = obj[k];
      if (v === false || v == null) return '';
      if (v === true) return k;
      return k + '="' + esc(v) + '"';
    }).filter(Boolean).join(' ');
  };

  // ---------- Icon glyph library (glifi testuali per Blueprint v2) ------------
  var Icons = {
    home:    '<span aria-hidden="true">●</span>',
    dumb:    '<span aria-hidden="true">≡</span>',
    chart:   '<span aria-hidden="true">↑</span>',
    user:    '<span aria-hidden="true">○</span>',
    plus:    '<span aria-hidden="true">+</span>',
    minus:   '<span aria-hidden="true">−</span>',
    check:   '<span aria-hidden="true">✓</span>',
    close:   '<span aria-hidden="true">✕</span>',
    bell:    '<span aria-hidden="true">•</span>',
    play:    '<span aria-hidden="true">▶</span>',
    pause:   '<span aria-hidden="true">‖</span>',
    star:    '<span aria-hidden="true">★</span>',
    trophy:  '<span aria-hidden="true">▲</span>'
  };

  // ---------- Buttons ---------------------------------------------------------
  var Button = function (opts) {
    opts = opts || {};
    var cls = cx([
      'c-btn',
      opts.variant ? 'c-btn--' + opts.variant : '',
      opts.size    ? 'c-btn--' + opts.size    : '',
      opts.iconOnly ? 'c-btn--icon' : '',
      opts.floating ? 'c-btn--floating' : '',
      opts.loading  ? 'is-loading' : '',
      opts.pressed  ? 'is-pressed' : ''
    ]);
    var icon = opts.icon ? (Icons[opts.icon] || '') : '';
    var label = opts.iconOnly ? '' : esc(opts.label || 'Button');
    return '<button class="' + cls + '" ' + attr({
      type: 'button',
      disabled: opts.disabled || opts.loading || false,
      'aria-label': opts.iconOnly ? (opts.label || opts.icon || 'button') : null,
      'aria-busy': opts.loading || null
    }) + '>' + icon + (icon && label ? ' ' : '') + label + '</button>';
  };

  var Fab = function (opts) {
    opts = opts || {};
    return '<button class="c-fab" type="button" aria-label="' + esc(opts.label || 'action') + '">'
      + (Icons[opts.icon] || Icons.plus) + '</button>';
  };

  // ---------- Cards -----------------------------------------------------------
  var Card = function (opts) {
    opts = opts || {};
    var cls = cx(['c-card', opts.variant ? 'c-card--' + opts.variant : '', opts.interactive ? 'is-interactive' : '']);
    var eyebrow = opts.eyebrow ? '<div class="c-card__eyebrow">' + esc(opts.eyebrow) + '</div>' : '';
    var title   = opts.title   ? '<h3 class="c-card__title">'    + esc(opts.title)   + '</h3>' : '';
    var body    = opts.body    ? '<p class="c-card__body">'      + esc(opts.body)    + '</p>'  : '';
    var footer  = opts.footer  ? '<div class="c-card__row">'     + opts.footer       + '</div>' : '';
    var extra   = opts.extra   || '';
    return '<article class="' + cls + '" ' + attr({
      tabindex: opts.interactive ? '0' : null,
      role: opts.interactive ? 'button' : null,
      'aria-label': opts.ariaLabel || null
    }) + '>' + eyebrow + title + body + extra + footer + '</article>';
  };

  var HeroCard = function (opts) {
    opts = opts || {};
    return Card({
      variant: 'hero',
      eyebrow: opts.eyebrow || 'In corso',
      title:   opts.title   || 'Push A · Settimana 2',
      body:    opts.body    || 'Ultima sessione: ieri • 8 esercizi',
      footer:  Button({ variant: 'ghost', label: 'Continua', size: 'sm' })
    });
  };

  var WorkoutCard = function (opts) {
    opts = opts || {};
    return Card({
      variant: 'workout',
      eyebrow: 'Sessione attiva',
      title:   opts.title || 'Push A · Giorno 3',
      body:    opts.body  || '32 min · 6/10 esercizi',
      footer:  Button({ variant: 'ghost', label: 'Riprendi', icon: 'play', size: 'sm' })
    });
  };

  var StatisticCard = function (opts) {
    opts = opts || {};
    return Card({
      variant: 'statistic',
      eyebrow: opts.eyebrow || 'Volume totale',
      extra:
        '<div class="c-card__value">' + esc(opts.value || '12 480') + ' <span style="font-size:var(--type-body-size);color:var(--color-textSecondary);font-weight:var(--weight-medium)">' + esc(opts.unit || 'kg') + '</span></div>' +
        '<div class="c-card__delta ' + (opts.negative ? 'is-negative' : '') + '">' + esc(opts.delta || '+ 8,4 % rispetto al mese scorso') + '</div>'
    });
  };

  var HistoryCard = function (opts) {
    opts = opts || {};
    return Card({
      variant: 'history',
      extra:
        '<div class="c-avatar c-avatar--sm">' + esc((opts.initials || 'PA')) + '</div>' +
        '<div class="c-grow"><div class="c-card__title" style="font-size:var(--type-body-size);font-weight:var(--weight-semibold)">' + esc(opts.title || 'Push A · Giorno 3') + '</div>' +
        '<div class="c-card__meta">' + esc(opts.meta || 'Ieri · 42 min · 5 200 kg') + '</div></div>' +
        '<div class="c-badge c-badge--success">' + esc(opts.badge || 'Completata') + '</div>'
    });
  };

  var RecordCard = function (opts) {
    opts = opts || {};
    return Card({
      variant: 'record',
      eyebrow: 'Personal Record',
      title:   opts.title || 'Panca piana · 82 kg',
      body:    opts.body  || 'Nuovo massimo raggiunto oggi. + 5 kg dall\'ultimo PR.'
    });
  };

  var GoalCard = function (opts) {
    opts = opts || {};
    var pct = Math.min(100, Math.max(0, opts.progress != null ? opts.progress : 68));
    return Card({
      variant: 'goal',
      eyebrow: 'Obiettivo settimanale',
      title:   opts.title || '4 sessioni completate',
      extra:
        '<div class="c-progressBar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
        '<div class="c-progressBar__fill" style="width:' + pct + '%"></div></div>' +
        '<p class="c-card__body">' + pct + ' % · rimangono ' + (100 - pct) + ' minuti</p>'
    });
  };

  var EmptyCard = function (opts) {
    opts = opts || {};
    return Card({
      variant: 'empty',
      extra:
        '<div class="c-card__icon" aria-hidden="true">○</div>' +
        '<div class="c-card__title" style="font-size:var(--type-title-size)">' + esc(opts.title || 'Nessun dato ancora') + '</div>' +
        '<p class="c-card__body">' + esc(opts.body || 'Le tue statistiche compariranno qui dopo la prima sessione.') + '</p>'
    });
  };

  var LoadingCard = function () {
    return Card({
      variant: 'loading',
      extra:
        '<div class="c-skeleton" style="width:60%"></div>' +
        '<div class="c-skeleton"></div>' +
        '<div class="c-skeleton" style="width:80%"></div>'
    });
  };

  var ExerciseCard = function (opts) {
    opts = opts || {};
    var sets = opts.sets || [
      { n: 1, reps: 12, weight: 40 },
      { n: 2, reps: 12, weight: 40 },
      { n: 3, reps: 10, weight: 45 },
      { n: 4, reps: 8,  weight: 50 }
    ];
    var setsHtml = sets.map(function (s) {
      var done = s.done ? Icons.check : '<span aria-hidden="true">○</span>';
      return '<div class="c-card__set">' +
        '<span class="c-card__set__num">Set ' + s.n + '</span>' +
        '<span></span>' +
        '<span class="c-card__set__val">' + s.reps + ' × ' + s.weight + ' kg</span>' +
        '<span aria-hidden="true">' + done + '</span>' +
        '</div>';
    }).join('');
    return Card({
      variant: 'exercise',
      eyebrow: opts.target || 'Petto · isolato',
      title:   opts.title  || 'Panca piana bilanciere',
      extra:   setsHtml
    });
  };

  // ---------- Navigation ------------------------------------------------------
  var BottomNav = function (opts) {
    opts = opts || {};
    var items = opts.items || [
      { id: 'home',      label: 'Home',      icon: 'home' },
      { id: 'workout',   label: 'Workout',   icon: 'dumb' },
      { id: 'progressi', label: 'Progressi', icon: 'chart' },
      { id: 'profilo',   label: 'Profilo',   icon: 'user' }
    ];
    var active = opts.active || items[0].id;
    return '<nav class="c-bottomNav" role="navigation" aria-label="Navigazione principale">' +
      items.map(function (it) {
        return '<button type="button" class="c-bottomNav__item ' + (it.id === active ? 'is-active' : '') +
          '" aria-label="' + esc(it.label) + '" ' + (it.id === active ? 'aria-current="page"' : '') + '>' +
          '<span class="c-icon" aria-hidden="true">' + (Icons[it.icon] || '') + '</span>' +
          '<span>' + esc(it.label) + '</span></button>';
      }).join('') +
      '</nav>';
  };

  var TabBar = function (opts) {
    opts = opts || {};
    var items = opts.items || ['Tutti', 'Push', 'Pull', 'Legs', 'Full body'];
    var active = opts.active != null ? opts.active : 0;
    return '<div class="c-tabBar" role="tablist">' +
      items.map(function (t, i) {
        return '<button role="tab" type="button" class="c-tabBar__tab ' + (i === active ? 'is-active' : '') +
          '" aria-selected="' + (i === active) + '">' + esc(t) + '</button>';
      }).join('') +
      '</div>';
  };

  var Segmented = function (opts) {
    opts = opts || {};
    var items = opts.items || ['Settimana', 'Mese', 'Anno'];
    var active = opts.active != null ? opts.active : 1;
    return '<div class="c-segmented" role="tablist">' +
      items.map(function (t, i) {
        return '<button role="tab" type="button" class="c-segmented__seg ' + (i === active ? 'is-active' : '') +
          '" aria-selected="' + (i === active) + '">' + esc(t) + '</button>';
      }).join('') +
      '</div>';
  };

  var Header = function (opts) {
    opts = opts || {};
    return '<header class="c-header" role="banner">' +
      '<div><h1 class="c-header__title">' + esc(opts.title || 'Home') + '</h1>' +
      '<p class="c-header__subtitle">' + esc(opts.subtitle || 'Push A · Settimana 2') + '</p></div>' +
      Button({ variant: 'ghost', size: 'sm', label: 'Menu', icon: 'bell' }) +
      '</header>';
  };

  var Toolbar = function (opts) {
    opts = opts || {};
    var actions = opts.actions || [
      Button({ variant: 'ghost', size: 'sm', label: 'Filtra' }),
      Button({ variant: 'ghost', size: 'sm', label: 'Ordina' }),
      Button({ variant: 'ghost', size: 'sm', label: 'Esporta' })
    ];
    return '<div class="c-toolbar" role="toolbar" aria-label="Azioni">' + actions.join('') + '</div>';
  };

  // ---------- Workout ---------------------------------------------------------
  var WeightPicker = function (opts) {
    opts = opts || {};
    var v = opts.value != null ? opts.value : 40;
    return '<div class="c-picker" role="group" aria-label="Peso in kg">' +
      '<button type="button" class="c-picker__btn" aria-label="Riduci">' + Icons.minus + '</button>' +
      '<div><span class="c-picker__value">' + v + '</span><span class="c-picker__unit">kg</span></div>' +
      '<button type="button" class="c-picker__btn" aria-label="Aumenta">' + Icons.plus + '</button>' +
      '</div>';
  };

  var RepsPicker = function (opts) {
    opts = opts || {};
    var v = opts.value != null ? opts.value : 12;
    return '<div class="c-picker" role="group" aria-label="Ripetizioni">' +
      '<button type="button" class="c-picker__btn" aria-label="Riduci">' + Icons.minus + '</button>' +
      '<div><span class="c-picker__value">' + v + '</span><span class="c-picker__unit">reps</span></div>' +
      '<button type="button" class="c-picker__btn" aria-label="Aumenta">' + Icons.plus + '</button>' +
      '</div>';
  };

  var FloatingTimer = function (opts) {
    opts = opts || {};
    return '<div class="c-floatingTimer" role="status" aria-label="Timer di recupero">' +
      '<span aria-hidden="true">' + Icons.play + '</span>' +
      '<div><span class="c-floatingTimer__time">' + esc(opts.time || '01:12') + '</span> ' +
      '<span class="c-floatingTimer__label">Recupero</span></div>' +
      '</div>';
  };

  var ProgressRing = function (opts) {
    opts = opts || {};
    var pct = Math.min(100, Math.max(0, opts.progress != null ? opts.progress : 62));
    var size = opts.size || 96;
    var stroke = 8;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var off = c * (1 - pct / 100);
    return '<svg class="c-progressRing" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + pct + '%">' +
      '<circle class="c-progressRing__track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '" fill="none"/>' +
      '<circle class="c-progressRing__fill"  cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke +
        '" fill="none" stroke-linecap="round" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" ' +
        'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/>' +
      '<text class="c-progressRing__label" x="' + size / 2 + '" y="' + (size / 2 + 8) + '">' + pct + '%</text>' +
      '</svg>';
  };

  var NextExercise = function (opts) {
    opts = opts || {};
    return '<div class="c-nextExercise">' +
      ProgressRing({ progress: 40, size: 48 }) +
      '<div><div class="c-nextExercise__eyebrow">Prossimo</div>' +
      '<div class="c-nextExercise__title">' + esc(opts.title || 'Dip parallele · 3×10') + '</div></div>' +
      '</div>';
  };

  var WorkoutHeader = function (opts) {
    opts = opts || {};
    return '<header class="c-workoutHeader">' +
      '<div class="c-card__eyebrow">' + esc(opts.eyebrow || 'Sessione attiva · 32 min') + '</div>' +
      '<h1 class="c-workoutHeader__title">' + esc(opts.title || 'Push A · Giorno 3') + '</h1>' +
      '<div class="c-card__row">' +
        '<span>' + esc(opts.progress || '6/10 esercizi') + '</span>' +
        Button({ variant: 'ghost', size: 'sm', label: 'Pausa', icon: 'pause' }) +
      '</div></header>';
  };

  var CompleteButton = function (opts) {
    opts = opts || {};
    return '<button type="button" class="c-completeBtn">' + Icons.check + '  ' + esc(opts.label || 'Termina sessione') + '</button>';
  };

  var RestScreen = function (opts) {
    opts = opts || {};
    return '<section class="c-restScreen" role="status" aria-live="polite">' +
      '<div class="c-restScreen__label">Recupero in corso</div>' +
      '<div class="c-restScreen__time">' + esc(opts.time || '00:45') + '</div>' +
      '<div style="display:flex;gap:var(--space-8)">' +
        Button({ variant: 'ghost', label: '-15s', size: 'sm' }) +
        Button({ variant: 'ghost', label: '+15s', size: 'sm' }) +
      '</div></section>';
  };

  // ---------- Feedback --------------------------------------------------------
  var Toast = function (opts) {
    opts = opts || {};
    var cls = cx(['c-toast', opts.variant ? 'c-toast--' + opts.variant : '']);
    var icon = { success: Icons.check, error: Icons.close, info: Icons.bell }[opts.variant] || Icons.bell;
    return '<div class="' + cls + '" role="status">' +
      '<span class="c-toast__icon">' + icon + '</span>' +
      '<span>' + esc(opts.message || 'Sessione salvata') + '</span></div>';
  };

  var Dialog = function (opts) {
    opts = opts || {};
    return '<div class="c-dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b">' +
      '<h2 class="c-dialog__title" id="dlg-t">' + esc(opts.title || 'Eliminare sessione?') + '</h2>' +
      '<p class="c-dialog__body"  id="dlg-b">' + esc(opts.body  || 'Questa azione non può essere annullata. I dati della sessione verranno rimossi definitivamente.') + '</p>' +
      '<div class="c-dialog__actions">' +
        Button({ variant: 'ghost',  label: 'Annulla' }) +
        Button({ variant: 'danger', label: 'Elimina' }) +
      '</div></div>';
  };

  var BottomSheet = function (opts) {
    opts = opts || {};
    return '<div class="c-bottomSheet" role="dialog" aria-modal="true" aria-labelledby="bs-t">' +
      '<div class="c-bottomSheet__handle" aria-hidden="true"></div>' +
      '<h2 class="c-bottomSheet__title" id="bs-t">' + esc(opts.title || 'Scegli allenamento') + '</h2>' +
      '<div class="c-stack">' +
        (opts.items || ['Push A · Settimana 2', 'Pull A · Settimana 2', 'Legs A · Settimana 2']).map(function (it) {
          return '<div class="c-settingsRow"><span class="c-settingsRow__label">' + esc(it) + '</span>' +
            '<span aria-hidden="true">›</span></div>';
        }).join('') +
      '</div></div>';
  };

  var Snackbar = function (opts) {
    opts = opts || {};
    return '<div class="c-snackbar" role="status">' +
      '<span>' + esc(opts.message || 'Set completato') + '</span>' +
      '<button type="button" class="c-snackbar__action">' + esc(opts.action || 'ANNULLA') + '</button></div>';
  };

  var Banner = function (opts) {
    opts = opts || {};
    var cls = cx(['c-banner', opts.variant ? 'c-banner--' + opts.variant : '']);
    var icon = { success: Icons.check, error: Icons.close, warning: Icons.bell, info: Icons.bell }[opts.variant] || Icons.bell;
    return '<div class="' + cls + '" role="region" aria-label="' + esc(opts.title || '') + '">' +
      '<span class="c-banner__icon">' + icon + '</span>' +
      '<div class="c-grow"><h4 class="c-banner__title">' + esc(opts.title || 'Sincronizzazione fallita') + '</h4>' +
      '<p class="c-banner__body">' + esc(opts.body || 'Impossibile raggiungere GitHub. Riprovare tra qualche istante.') + '</p></div>' +
      Button({ variant: 'ghost', size: 'sm', label: opts.action || 'Riprova' }) +
      '</div>';
  };

  var Skeleton = function (opts) {
    opts = opts || {};
    var lines = opts.lines || 3;
    var out = '';
    for (var i = 0; i < lines; i++) {
      var w = [100, 80, 60][i % 3];
      out += '<div class="c-skeleton" style="width:' + w + '%"></div>';
    }
    return '<div class="c-card c-card--loading" aria-busy="true" aria-label="Caricamento">' + out + '</div>';
  };

  var StateEmpty   = function () { return '<div class="c-state c-state--empty"><div class="c-state__icon" aria-hidden="true">○</div><h3 class="c-state__title">Nessuna scheda ancora</h3><p class="c-state__body">Importa un file JSON o crea una scheda per iniziare a monitorare i tuoi allenamenti.</p>' + Button({ variant: 'primary', label: 'Importa scheda' }) + '</div>'; };
  var StateError   = function () { return '<div class="c-state c-state--error"><div class="c-state__icon" aria-hidden="true">✕</div><h3 class="c-state__title">Errore di caricamento</h3><p class="c-state__body">Non riusciamo a leggere i dati locali. Controlla lo storage del browser.</p>' + Button({ variant: 'ghost', label: 'Riprova' }) + '</div>'; };
  var StateSuccess = function () { return '<div class="c-state c-state--success"><div class="c-state__icon" aria-hidden="true">✓</div><h3 class="c-state__title">Sessione salvata</h3><p class="c-state__body">Tutti i tuoi set sono stati sincronizzati correttamente.</p>' + Button({ variant: 'primary', label: 'Vai a Progressi' }) + '</div>'; };

  // ---------- Charts (SVG minimali basati su tokens) --------------------------
  var LineChart = function (opts) {
    opts = opts || {};
    var data = opts.data || [3, 5, 4, 7, 6, 8, 9];
    var w = 320, h = 120, pad = 12;
    var max = Math.max.apply(null, data);
    var min = Math.min.apply(null, data);
    var xs = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
    var pts = data.map(function (v, i) {
      var x = pad + i * xs;
      var y = h - pad - ((v - min) / Math.max(1, (max - min))) * (h - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    return '<div class="c-chart">' +
      '<h4 class="c-chart__title">Volume settimanale (kg)</h4>' +
      '<svg class="c-chart__svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Linea andamento volume">' +
        '<polyline class="c-chart__line" points="' + pts.join(' ') + '"/>' +
        pts.map(function (p) { var xy = p.split(','); return '<circle class="c-chart__dot" cx="' + xy[0] + '" cy="' + xy[1] + '" r="3"/>'; }).join('') +
      '</svg></div>';
  };

  var AreaChart = function (opts) {
    opts = opts || {};
    var data = opts.data || [3, 5, 4, 7, 6, 8, 9];
    var w = 320, h = 120, pad = 12;
    var max = Math.max.apply(null, data);
    var min = 0;
    var xs = (w - pad * 2) / Math.max(1, (data.length - 1));
    var pts = data.map(function (v, i) {
      var x = pad + i * xs;
      var y = h - pad - ((v - min) / Math.max(1, (max - min))) * (h - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var poly = pts.join(' ') + ' ' + (w - pad).toFixed(1) + ',' + (h - pad).toFixed(1) + ' ' + pad + ',' + (h - pad).toFixed(1);
    return '<div class="c-chart c-chart--area">' +
      '<h4 class="c-chart__title">Volume cumulato</h4>' +
      '<svg class="c-chart__svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Area cumulata">' +
        '<polygon class="c-chart__area" points="' + poly + '"/>' +
        '<polyline class="c-chart__line" points="' + pts.join(' ') + '"/>' +
      '</svg></div>';
  };

  var BarChart = function (opts) {
    opts = opts || {};
    var data = opts.data || [4, 6, 3, 7, 5, 8, 2];
    var labels = opts.labels || ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    var w = 320, h = 120, pad = 12;
    var max = Math.max.apply(null, data);
    var bw = (w - pad * 2) / data.length - 4;
    var bars = data.map(function (v, i) {
      var bh = ((v) / Math.max(1, max)) * (h - pad * 2 - 12);
      var x = pad + i * (bw + 4);
      var y = h - pad - 12 - bh;
      return '<rect class="c-chart__bar" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3"/>' +
             '<text class="c-chart__label" x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 2) + '" text-anchor="middle">' + esc(labels[i] || '') + '</text>';
    }).join('');
    return '<div class="c-chart">' +
      '<h4 class="c-chart__title">Sessioni per giorno</h4>' +
      '<svg class="c-chart__svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Bar chart sessioni">' + bars + '</svg></div>';
  };

  var Heatmap = function (opts) {
    opts = opts || {};
    var days = opts.days || 5 * 7; // 5 settimane
    var seed = 0;
    var out = '';
    for (var i = 0; i < days; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      var v = Math.floor((seed / 233280) * 5);
      out += '<div class="c-heatmap__cell" data-level="' + v + '" title="Livello ' + v + '"></div>';
    }
    return '<div class="c-chart">' +
      '<h4 class="c-chart__title">Attività ultimo mese</h4>' +
      '<div class="c-heatmap" role="img" aria-label="Mappa termica ultime 5 settimane">' + out + '</div>' +
      '</div>';
  };

  var WeeklyChart = function () { return BarChart({ data: [3, 5, 2, 6, 4, 7, 1], labels: ['L', 'M', 'M', 'G', 'V', 'S', 'D'] }); };
  var MonthlyChart = function () { return LineChart({ data: [12, 15, 14, 18, 20, 22, 21, 24, 27, 26, 28, 30] }); };

  // ---------- Profile ---------------------------------------------------------
  var Avatar = function (opts) {
    opts = opts || {};
    var cls = cx(['c-avatar', opts.size ? 'c-avatar--' + opts.size : '']);
    return '<div class="' + cls + '" aria-hidden="true">' + esc(opts.initials || 'MR') + '</div>';
  };

  var ProfileHeader = function (opts) {
    opts = opts || {};
    return '<section class="c-profileHeader">' +
      Avatar({ size: 'xl', initials: opts.initials || 'MR' }) +
      '<div>' +
        '<h2 class="c-profileHeader__name">' + esc(opts.name || 'Matteo Rossi') + '</h2>' +
        '<p class="c-profileHeader__meta">' + esc(opts.meta || 'Push · Pull · Legs · Livello intermedio') + '</p>' +
      '</div></section>';
  };

  var AchievementBadge = function (opts) {
    opts = opts || {};
    return '<div class="c-achievement">' +
      '<div class="c-achievement__icon">' + (Icons[opts.icon] || Icons.trophy) + '</div>' +
      '<div class="c-achievement__title">' + esc(opts.title || 'Prima settimana') + '</div>' +
      '<div class="c-achievement__meta">'  + esc(opts.meta  || 'Sblocca dopo 5 sessioni')  + '</div>' +
      '</div>';
  };

  var SettingsRow = function (opts) {
    opts = opts || {};
    return '<div class="c-settingsRow">' +
      '<div><div class="c-settingsRow__label">' + esc(opts.label || 'Notifiche') + '</div>' +
      (opts.meta ? '<div class="c-settingsRow__meta">' + esc(opts.meta) + '</div>' : '') +
      '</div>' +
      (opts.control || (opts.switch != null ? PreferenceSwitch({ on: opts.switch }) : '<span aria-hidden="true">›</span>')) +
      '</div>';
  };

  var PreferenceSwitch = function (opts) {
    opts = opts || {};
    return '<button role="switch" aria-checked="' + !!opts.on + '" type="button" class="c-switch ' + (opts.on ? 'is-on' : '') + '">' +
      '<span class="c-switch__thumb"></span></button>';
  };

  // ---------- Gestures --------------------------------------------------------
  var Swipe     = function () { return '<div class="c-gesturePreview c-gesturePreview--swipe">'     + '<span class="c-gesturePreview__hint">SWIPE</span>'     + '<div class="c-gestureDot"></div></div>'; };
  var LongPress = function () { return '<div class="c-gesturePreview c-gesturePreview--longPress">' + '<span class="c-gesturePreview__hint">LONG PRESS</span>' + '<div class="c-gestureDot"></div></div>'; };
  var Pressed   = function () { return '<div class="c-gesturePreview c-gesturePreview--pressed">'   + '<span class="c-gesturePreview__hint">PRESSED</span>'   + '<div class="c-gestureDot"></div></div>'; };
  var Drag      = function () { return '<div class="c-gesturePreview c-gesturePreview--drag">'      + '<span class="c-gesturePreview__hint">DRAG</span>'      + '<div class="c-gestureDot"></div></div>'; };

  // ---------- Animations ------------------------------------------------------
  var Anim = function (kind) {
    var titles = { fade: 'Fade', slide: 'Slide', scale: 'Scale' };
    return '<div class="c-animPreview c-animPreview--' + kind + '" role="img" aria-label="Animazione ' + titles[kind] + '">' +
      '<div class="c-animPreview__box"></div></div>';
  };

  // ---------- Export ----------------------------------------------------------
  global.Components = {
    Icons: Icons,
    Button: Button, Fab: Fab,
    Card: Card, HeroCard: HeroCard, WorkoutCard: WorkoutCard, StatisticCard: StatisticCard,
    HistoryCard: HistoryCard, RecordCard: RecordCard, GoalCard: GoalCard,
    EmptyCard: EmptyCard, LoadingCard: LoadingCard, ExerciseCard: ExerciseCard,
    BottomNav: BottomNav, TabBar: TabBar, Segmented: Segmented, Header: Header, Toolbar: Toolbar,
    WeightPicker: WeightPicker, RepsPicker: RepsPicker, FloatingTimer: FloatingTimer,
    ProgressRing: ProgressRing, NextExercise: NextExercise, WorkoutHeader: WorkoutHeader,
    CompleteButton: CompleteButton, RestScreen: RestScreen,
    Toast: Toast, Dialog: Dialog, BottomSheet: BottomSheet, Snackbar: Snackbar,
    Banner: Banner, Skeleton: Skeleton,
    StateEmpty: StateEmpty, StateError: StateError, StateSuccess: StateSuccess,
    LineChart: LineChart, AreaChart: AreaChart, BarChart: BarChart, Heatmap: Heatmap,
    WeeklyChart: WeeklyChart, MonthlyChart: MonthlyChart,
    Avatar: Avatar, ProfileHeader: ProfileHeader, AchievementBadge: AchievementBadge,
    SettingsRow: SettingsRow, PreferenceSwitch: PreferenceSwitch,
    Swipe: Swipe, LongPress: LongPress, Pressed: Pressed, Drag: Drag,
    Anim: Anim,
    _helpers: { esc: esc, cx: cx, attr: attr }
  };

})(window);
