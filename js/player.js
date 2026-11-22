/* Плеєр однієї картки.
   Режими: «Фрагмент» (21 с з потрібної секунди, остання секунда — fade-out) і «Вся пісня».
   На обкладинці замість курсора — нотка (на тачскрині — звичайна кнопка).
   Використання: createPlayer(cardElement, {audio, start}) -> {stop(), isActive(), ...} */
(function () {
  var FRAGMENT = 21;   // с
  var FADE = 1;        // с наприкінці фрагмента
  var muted = false;
  var userVol = 1;       // гучність, яку виставив користувач (0..1), спільна для всіх слайдів
  var AWAY_FADE = 700;   // мс плавного затихання, коли слайд іде
  var current = null;  // той, що грає зараз (одночасно грає лише один)
  var all = [];

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function fmt(s) {
    if (!isFinite(s)) return '–:––';
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  var ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.5" height="16" rx="1"/><rect x="14" y="4" width="4.5" height="16" rx="1"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14"/><path d="M20 5.5v13l-11-6.5z"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M19 6.5a8 8 0 0 1 0 11"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M17 9.5l4 5M21 9.5l-4 5"/></svg>'
  };

  /* ---------- Нотка замість курсора (одна на всю сторінку) ---------- */
  var cursor = document.createElement('div');
  cursor.className = 'note-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<svg class="nc-note" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path pathLength="1" d="M9 18V5l11-2v13"/><circle pathLength="1" cx="6" cy="18" r="3"/><circle pathLength="1" cx="17" cy="16" r="3"/></svg>' +
    '<svg class="nc-pause" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>';
  document.body.appendChild(cursor);

  var cx = 0, cy = 0, tx = 0, ty = 0, craf = 0, hovered = null;
  function cursorFrame() {
    craf = 0;
    cx += (tx - cx) * 0.28; cy += (ty - cy) * 0.28;
    cursor.style.translate = cx + 'px ' + cy + 'px';
    if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) craf = requestAnimationFrame(cursorFrame);
  }
  function cursorMove(e) {
    tx = e.clientX; ty = e.clientY;
    if (!craf) craf = requestAnimationFrame(cursorFrame);
  }

  /* ---------- Розмітка ---------- */
  function markup(cover, panel) {
    cover.insertAdjacentHTML('beforeend',
      '<button class="card__play" type="button" aria-label="Відтворити фрагмент">' +
      '<svg class="i-note" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path pathLength="1" d="M9 18V5l11-2v13"/><circle pathLength="1" cx="6" cy="18" r="3"/><circle pathLength="1" cx="17" cy="16" r="3"/></svg>' +
      '<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>' +
      '</button>');

    var bars = '';
    for (var i = 0; i < 28; i++) {
      var h = (0.25 + Math.random() * 0.75).toFixed(2);
      var d = (0.5 + Math.random() * 0.7).toFixed(2);
      var del = (-Math.random() * 1.2).toFixed(2);
      bars += '<span class="player__bar" style="--i:' + i + '"><i style="--h:' + h + ';--d:' + d + 's;--del:' + del + 's"></i></span>';
    }
    panel.innerHTML =
      '<div class="player__eq">' + bars + '</div>' +
      '<div class="player__track" role="slider" aria-label="Позиція" tabindex="0"><div class="player__line"><div class="player__fill"></div><div class="player__dot"></div></div></div>' +
      '<div class="player__times"><span class="player__cur">0:00</span><span class="player__end">' + fmt(FRAGMENT) + '</span></div>' +
      '<div class="player__controls">' +
      '<button type="button" class="pc pc--restart" aria-label="Спочатку">' + ICONS.restart + '</button>' +
      '<button type="button" class="pc pc--play" aria-label="Відтворити">' + ICONS.play + '</button>' +
      '<div class="pv"><button type="button" class="pc pc--mute" aria-label="Гучність" aria-expanded="false">' + ICONS.sound + '</button>' +
      '<div class="pv__pop"><input class="pv__range" type="range" min="0" max="1" step="0.01" value="1" aria-label="Гучність"></div></div>' +
      '</div>' +
      '<div class="player__mode" role="group" aria-label="Режим">' +
      '<button type="button" class="pm pm--frag">Фрагмент</button><button type="button" class="pm pm--full">Вся пісня</button></div>' ;
  }

  window.createPlayer = function (card, track) {
    var cover = card.querySelector('.card__cover');
    var panel = card.querySelector('.player');
    markup(cover, panel);

    var coverBtn = cover.querySelector('.card__play');
    var trackEl = panel.querySelector('.player__track');
    var fill = panel.querySelector('.player__fill');
    var dot = panel.querySelector('.player__dot');
    var cur = panel.querySelector('.player__cur');
    var endEl = panel.querySelector('.player__end');
    var bPlay = panel.querySelector('.pc--play');
    var bRestart = panel.querySelector('.pc--restart');
    var bMute = panel.querySelector('.pc--mute');
    var range = panel.querySelector('.pv__range');
    var bFrag = panel.querySelector('.pm--frag');
    var bFull = panel.querySelector('.pm--full');

    var fullSong = false;   // режим цього слайда: false — фрагмент, true — вся пісня (у кожного слайда свій)
    var audio = null, raf = 0, playing = false, needSeek = true, active = false;
    var away = false, awayStart = 0;   // away — слайд іде геть: плеєр ховається, звук плавно затихає

    /* межі поточного режиму: фрагмент або вся пісня */
    function from() { return fullSong ? 0 : track.start; }
    function len() { return fullSong ? (audio && isFinite(audio.duration) ? audio.duration : 0) : FRAGMENT; }

    function ensure() {
      if (audio) return;
      audio = new Audio();
      audio.preload = 'auto';
      audio.src = window.Assets ? Assets.url(track.audio) : track.audio;
      audio.addEventListener('loadedmetadata', function () {
        if (needSeek) seekStart();
        setEnd();
      });
      audio.addEventListener('ended', function () { reset(); });
    }
    function seekStart() {
      if (audio && audio.readyState >= 1) { audio.currentTime = from(); needSeek = false; }
    }
    function setEnd() { endEl.textContent = fullSong ? fmt(len() || NaN) : fmt(FRAGMENT); }
    function draw(t) {
      var L = len();
      var p = L ? clamp(t / L) : 0;
      fill.style.transform = 'scaleX(' + p + ')';
      dot.style.left = (p * 100) + '%';
      cur.textContent = fmt(t);
      trackEl.setAttribute('aria-valuenow', Math.round(p * 100));
    }
    function setPlaying(v) {
      playing = v;
      card.classList.toggle('is-playing', v);
      bPlay.innerHTML = v ? ICONS.pause : ICONS.play;
      bPlay.setAttribute('aria-label', v ? 'Пауза' : 'Відтворити');
      coverBtn.setAttribute('aria-label', v ? 'Пауза' : 'Відтворити');
      if (hovered === coverBtn) cursor.classList.toggle('is-pause', v);
    }
    function loop() {
      raf = 0;
      if (!playing) return;
      var t = audio.currentTime - from();
      if (!fullSong && t >= FRAGMENT) { reset(); return; }
      var fade = !fullSong && t > FRAGMENT - FADE ? clamp((FRAGMENT - t) / FADE) : 1;
      var af = 1;
      if (awayStart) {
        af = 1 - clamp((performance.now() - awayStart) / AWAY_FADE);
        if (af <= 0) { pause(); return; }   // затихло — пауза, позиція лишається
      }
      audio.volume = userVol * fade * af;
      draw(Math.max(0, t));
      raf = requestAnimationFrame(loop);
    }
    function pause() {
      awayStart = 0;
      if (audio) audio.pause();
      cancelAnimationFrame(raf); raf = 0;
      setPlaying(false);
    }
    function reset() {
      pause();
      needSeek = true;
      if (audio) { seekStart(); audio.volume = userVol; }
      draw(0);
    }
    function play() {
      if (away) return;     // слайд іде геть — нічого не запускаємо (інакше трек грав би на чужому слайді)
      ensure();
      if (current && current !== api) current.pause();
      current = api;
      active = true;
      panel.classList.add('is-open');
      audio.muted = muted;
      audio.volume = userVol;
      awayStart = 0;
      if (needSeek) seekStart();
      var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {});
      setPlaying(true);
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function toggle() { if (playing) pause(); else play(); }

    /* ----- кнопки ----- */
    coverBtn.addEventListener('click', function () { toggle(); coverBtn.blur(); });
    bPlay.addEventListener('click', function () { toggle(); bPlay.blur(); });

    bRestart.addEventListener('click', function () {
      ensure();
      needSeek = true; seekStart(); draw(0);
      if (!playing) play();
      bRestart.blur();
    });

    var pvBox = panel.querySelector('.pv');
    function setVolOpen(v) {
      pvBox.classList.toggle('is-open', v);
      bMute.setAttribute('aria-expanded', String(v));
    }
    bMute.addEventListener('click', function () { setVolOpen(!pvBox.classList.contains('is-open')); bMute.blur(); });
    /* закриваємо при кліку поза регулятором і по Esc */
    document.addEventListener('pointerdown', function (e) { if (!pvBox.contains(e.target)) setVolOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setVolOpen(false); });
    /* колесо миші над гучністю міняє її (сторінку при цьому не скролимо) */
    var pv = panel.querySelector('.pv');
    pv.setAttribute('data-lenis-prevent', '');
    pv.addEventListener('wheel', function (e) {
      e.preventDefault();
      userVol = clamp(userVol + (e.deltaY < 0 ? 0.05 : -0.05));
      if (userVol > 0) muted = false;
      all.forEach(function (p) { p.applyMute(); });
    }, { passive: false });
    range.addEventListener('input', function () {
      userVol = parseFloat(range.value);
      if (userVol > 0) muted = false;
      all.forEach(function (p) { p.applyMute(); });
    });

    bFrag.addEventListener('click', function () { setMode(false); bFrag.blur(); });
    bFull.addEventListener('click', function () { setMode(true); bFull.blur(); });

    /* клік/перетягування по лінії прогресу — перемотування */
    function seekFromEvent(e) {
      var L = len();
      if (!audio || !L || audio.readyState < 1) return;
      var r = trackEl.getBoundingClientRect();
      var p = clamp((e.clientX - r.left) / r.width);
      audio.currentTime = from() + p * L;
      needSeek = false;
      draw(p * L);
    }
    var dragging = false;
    trackEl.addEventListener('pointerdown', function (e) {
      ensure();
      if (audio.readyState < 1) { needSeek = true; return; }
      dragging = true;
      trackEl.setPointerCapture(e.pointerId);
      seekFromEvent(e);
    });
    trackEl.addEventListener('pointermove', function (e) { if (dragging) seekFromEvent(e); });
    trackEl.addEventListener('pointerup', function () { dragging = false; });
    trackEl.addEventListener('pointercancel', function () { dragging = false; });
    trackEl.addEventListener('keydown', function (e) {
      if (!audio || !len()) return;
      var step = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
      if (!step) return;
      e.preventDefault();
      var t = clamp((audio.currentTime - from() + step) / len()) * len();
      audio.currentTime = from() + t; needSeek = false; draw(t);
    });

    /* нотка замість курсора над обкладинкою */
    coverBtn.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      hovered = coverBtn;
      tx = cx = e.clientX; ty = cy = e.clientY;
      cursor.style.translate = cx + 'px ' + cy + 'px';
      cursor.classList.toggle('is-pause', playing);
      cursor.classList.add('is-on');
    });
    coverBtn.addEventListener('pointermove', cursorMove);
    coverBtn.addEventListener('pointerleave', function () {
      if (hovered === coverBtn) { hovered = null; cursor.classList.remove('is-on'); }
    });

    /* ----- режими й звук ----- */
    /* стан звуку (вимкнено + гучність) -> іконка, повзунок і сам аудіо-елемент; викликається для всіх слайдів */
    function applyMute() {
      var off = muted || userVol === 0;
      if (audio) { audio.muted = muted; if (!playing) audio.volume = userVol; }
      bMute.innerHTML = off ? ICONS.muted : ICONS.sound;
      bMute.setAttribute('aria-label', off ? 'Гучність (вимкнено)' : 'Гучність');
      range.value = muted ? 0 : userVol;
      range.style.setProperty('--p', (parseFloat(range.value) * 100) + '%');
    }
    function applyMode() {
      bFrag.classList.toggle('is-on', !fullSong);
      bFull.classList.toggle('is-on', fullSong);
      bFrag.setAttribute('aria-pressed', String(!fullSong));
      bFull.setAttribute('aria-pressed', String(fullSong));
      if (fullSong) ensure();       // щоб дізнатись тривалість
      setEnd();
      if (playing) {
        /* у повній версії продовжуємо з поточного місця, повертаючись у фрагмент — на його початок */
        if (!fullSong) { audio.currentTime = track.start; }
      } else {
        needSeek = true; seekStart(); draw(0);
      }
    }
    function setMode(v) {
      if (fullSong === v) return;
      fullSong = v;
      applyMode();
    }

    var api = {
      pause: pause,
      applyMute: applyMute,
      isActive: function () { return active; },
      /* слайд іде геть (true) або повертається (false): плеєр ховається/з'являється з анімацією,
         звук плавно затихає і ставиться на паузу; стан (позиція, режим, еквалайзер) зберігається */
      setAway: function (v) {
        if (away !== v) {
          away = v;
          panel.classList.toggle('is-away', v);
          card.classList.toggle('is-away', v);
          if (v) {
            setVolOpen(false);
            if (hovered === coverBtn) { hovered = null; cursor.classList.remove('is-on'); }
          } else {
            awayStart = 0;
          }
        }
        /* якщо слайд «геть», а трек усе ще грає (без початого затихання) — починаємо затихати */
        if (v && playing && !awayStart) awayStart = performance.now();
      }
    };
    all.push(api);
    applyMode();
    applyMute();
    return api;
  };
})();
