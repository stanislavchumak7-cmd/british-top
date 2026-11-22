/* Екран завантаження: назва презентації + ноти, що з'являються на нотному стані (по колу).
   Тримається щонайменше MIN_TIME, поки не завантажаться ВСІ відео, а також треки, обкладинки і шрифт.
   Відео й аудіо вантажимо повністю (fetch -> blob), тож у презентації вони стартують миттєво.
   Window.Assets.url(path) повертає blob-адресу, якщо файл уже в пам'яті, або сам шлях. */
(function () {
  var MIN_TIME = 4000;     // мс — мінімум, скільки показуємо екран
  var TIMEOUT = 90000;     // мс — страховка: якщо щось не вантажиться, не висимо вічно

  var loader = document.getElementById('loader');
  var started = performance.now();
  var blobs = {};

  window.Assets = { url: function (p) { return blobs[p] || p; } };
  if (!loader) return;

  document.documentElement.classList.add('is-locked');

  /* ---------- Нотний стан: все «малюється олівцем» ---------- */
  var CYCLE = 4.8;          // с — один цикл: малюємо -> тримаємо -> стираємо
  var FADE_AT = 4.25;       // с — коли починаємо стирати
  var LEFT = 14, RIGHT = 426, TOP = 30, GAP = 10, STEM = 28;
  var CLEF_D = 'M11.3 30.8Q10.7 28.5 10.3 26.3Q9.9 24.1 9.9 21.8Q9.9 19.7 10.2 18Q10.5 16.2 11 14.7Q11.5 13 12.4 11.5Q13.3 10 14.3 9Q15.3 8 16.1 8Q17.1 8 18.9 11.6Q19.8 13.5 20.3 15.6Q20.7 17.7 20.7 20.2Q20.7 23.2 19.9 26.2Q19.1 29.2 17.5 31.9Q15.9 34.5 13.8 36.5L15.3 43.7Q15.9 43.6 16.3 43.6Q16.7 43.5 17 43.5Q19.6 43.5 21.6 45Q23.7 46.5 24.9 48.9Q26.1 51.3 26.1 54.1Q26.1 57.4 24.4 60.1Q22.7 62.7 19.4 63.9Q19.6 64.7 20.6 70Q20.8 71.3 21 72Q21.1 72.8 21.1 73.3Q21.2 73.9 21.2 74.6Q21.2 76.7 20.1 78.4Q19.1 80.1 17.3 81.1Q15.6 82 13.4 82Q11.2 82 9.4 81.2Q7.7 80.3 6.8 78.9Q5.8 77.4 5.8 75.5Q5.8 73.4 6.9 72Q8 70.7 10.1 70.7Q11.9 70.7 13.1 72Q14.2 73.3 14.2 75.1Q14.2 76.6 13.1 77.8Q12 78.9 10.3 78.9H9.9Q11 80.6 13.4 80.6Q16.4 80.6 18 78.7Q19.7 76.7 19.7 73.8Q19.7 73 19.5 71.8Q19.4 70.6 18.9 68.9Q18.5 67.2 18.3 66.1Q18 65 17.9 64.5Q16.5 64.9 14.5 64.9Q10.9 64.9 7.3 62.8Q3.9 60.6 2 57.1Q0 53.6 0 49.6Q0 45.7 1.8 42.4Q3.5 39 6.1 36.2Q8.7 33.3 11.3 30.8ZM12.4 29.7Q13.4 29.2 14.5 27.8Q15.6 26.4 16.7 24.6Q17.7 22.8 18.3 21Q19 19.2 19 17.7Q19 16.2 18.5 15.3Q18 14.4 16.9 14.4Q15.9 14.4 14.9 15.3Q13.9 16.3 13.2 17.8Q12.4 19.4 12 21.3Q11.6 23.3 11.6 25.3Q11.6 26.6 11.9 27.7Q12.1 28.8 12.4 29.7ZM19 62.6Q23.2 60.9 23.2 55.3Q23.2 53.5 22.3 51.9Q21.3 50.4 19.7 49.5Q18.2 48.6 16.2 48.6ZM14.9 48.8Q13.7 49.1 12.7 49.9Q11.7 50.7 11 51.9Q10.4 53.1 10.4 54.4Q10.4 55.5 11 56.6Q11.5 57.7 12.3 58.4Q12.9 58.9 13.5 59.2Q14.1 59.5 14.1 59.7Q14.1 59.9 13.7 60Q12 59.6 10.7 58.5Q9.4 57.5 8.7 56Q7.9 54.4 7.9 52.7Q7.9 50.9 8.7 49.2Q9.4 47.5 10.8 46.1Q12.1 44.7 13.8 44.1L12.6 37.6Q7.6 41.6 5.3 45.5Q3 49.4 3 53.2Q3 55.9 4.4 58.3Q5.9 60.7 8.4 62.2Q10.9 63.7 14.1 63.7Q15 63.7 15.8 63.5Q16.7 63.3 17.7 63.1Z';
  var CLEF_X = 20, CLEF_Y = 0;   // зсув контуру ключа (його ширина ~26, висота 74)

  var NOTES = [
    { x: 118, y: 60 }, { x: 156, y: 50 }, { x: 206, y: 40 }, { x: 246, y: 55 },
    { x: 298, y: 45 }, { x: 336, y: 35 }, { x: 388, y: 50 }
  ];

  function rnd(a) { return (Math.random() * 2 - 1) * a; }
  function f(n) { return Math.round(n * 10) / 10; }

  var items = [];   // {t0, dur, fill?}

  /* перо: path/line/ellipse з pathLength=1 малюється через stroke-dashoffset */
  function pen(tag, attrs, t0, dur) {
    var a = ' data-pen="' + items.length + '" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke-linecap="round" style="visibility:hidden"';
    for (var k in attrs) a += ' ' + k + '="' + attrs[k] + '"';
    items.push({ t0: t0, dur: dur });
    return '<' + tag + a + '/>';
  }
  function fillAt(id, t0, dur) { items[id].fill = { t0: t0, dur: dur }; }

  function staffSvg() {
    items = [];
    var s = '<svg class="staff" viewBox="0 0 440 100" fill="none" stroke="rgba(255,255,255,.9)" aria-hidden="true">' +
      '<defs><filter id="pencil" x="-4%" y="-20%" width="108%" height="140%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="t"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="t" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.75" result="grain"/>' +
      '<feComposite in="d" in2="grain" operator="in"/></filter></defs>' +
      '<g class="staff__g" filter="url(#pencil)">';

    /* п'ять ліній — двічі (графітовий «слід»), легка неточність руки */
    for (var i = 0; i < 5; i++) {
      var y = TOP + i * GAP, t = 0.15 + i * 0.12;
      s += pen('path', { d: 'M' + LEFT + ' ' + f(y + rnd(.4)) + ' Q' + f((LEFT + RIGHT) / 2) + ' ' + f(y + rnd(.9)) + ' ' + RIGHT + ' ' + f(y + rnd(.4)), 'stroke-width': 1.1 }, t, 1.2);
      s += pen('path', { d: 'M' + (LEFT + 2) + ' ' + f(y + .7 + rnd(.4)) + ' Q' + f((LEFT + RIGHT) / 2) + ' ' + f(y + .5 + rnd(.9)) + ' ' + (RIGHT - 3) + ' ' + f(y + .6 + rnd(.4)), 'stroke-width': .6, 'stroke-opacity': .45 }, t + .1, 1.2);
    }
    /* бічні лінії — теж малюються: ліва, права подвійна */
    function vbar(x, w, t, dur, op) {
      return pen('path', { d: 'M' + f(x + rnd(.3)) + ' ' + TOP + ' Q' + f(x + rnd(.8)) + ' ' + (TOP + 2 * GAP) + ' ' + f(x + rnd(.3)) + ' ' + (TOP + 4 * GAP), 'stroke-width': w, 'stroke-opacity': op || 1 }, t, dur);
    }
    s += vbar(LEFT, 1.2, 0.35, 0.7);
    s += vbar(RIGHT - 6, .9, 1.25, 0.6, .85);
    s += vbar(RIGHT, 2.4, 1.4, 0.6);

    /* скрипковий ключ: контур з Noto Music; спочатку штрих, потім «заливка» */
    var cid = items.length;
    s += pen('path', { d: CLEF_D, 'stroke-width': .9, 'stroke-linejoin': 'round', transform: 'translate(' + CLEF_X + ' ' + CLEF_Y + ')', fill: 'rgba(255,255,255,0)' }, .5, 1.9);
    fillAt(cid, 1.9, .7);

    /* ноти: головка (контур, потім заливка), штиль, перекладини */
    NOTES.forEach(function (n, i) {
      var up = n.y >= 50, sx = up ? 5.4 : -5.4, y2 = up ? -STEM : STEM;
      var t = 1.55 + i * 0.3;
      var hid = items.length;
      s += '<g transform="translate(' + n.x + ' ' + n.y + ')">' +
        '<g transform="rotate(-24)">' + pen('ellipse', { cx: 0, cy: 0, rx: 5.9, ry: 4, 'stroke-width': 1.1, fill: 'rgba(255,255,255,0)' }, t, .4) + '</g>' +
        pen('line', { x1: sx, y1: up ? -1 : 1, x2: sx, y2: y2, 'stroke-width': 1.15 }, t + .22, .35) +
        '</g>';
      fillAt(hid, t + .3, .3);
    });
    function beam(a, b, up) {
      var A = NOTES[a], B = NOTES[b], d = up ? -STEM : STEM, off = up ? 5.4 : -5.4;
      return pen('line', { x1: A.x + off, y1: A.y + d, x2: B.x + off, y2: B.y + d, 'stroke-width': 3.2, 'stroke-linecap': 'butt' }, 1.55 + b * 0.3 + .45, .3);
    }
    s += beam(0, 1, true) + beam(4, 5, false);
    return s + '</g></svg>';
  }

  var stage = loader.querySelector('.loader__staff');
  var animStart = performance.now();
  if (stage) {
    stage.innerHTML = staffSvg();
    var svgEl = stage.querySelector('.staff__g');
    var els = stage.querySelectorAll('[data-pen]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var ease = function (p) { return p * p * (3 - 2 * p); };
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

    var draw = function (t) {
      for (var i = 0; i < items.length; i++) {
        var it = items[i], el = els[i];
        var p = clamp01((t - it.t0) / it.dur);
        el.style.strokeDashoffset = 1 - ease(p);
        el.style.visibility = p > 0 ? 'visible' : 'hidden';   // без цього круглі кінці штриха дають «крапки» до початку малювання
        if (it.fill) el.style.fill = 'rgba(255,255,255,' + (0.95 * ease(clamp01((t - it.fill.t0) / it.fill.dur))) + ')';
      }
      /* наприкінці циклу все плавно «стирається» */
      svgEl.style.opacity = t > FADE_AT ? 1 - ease(clamp01((t - FADE_AT) / (CYCLE - FADE_AT))) : 1;
    };

    var frame = function () {
      if (!document.body.contains(loader)) return;
      draw(((performance.now() - animStart) / 1000) % CYCLE);
      requestAnimationFrame(frame);
    };
    if (reduce) draw(FADE_AT - .05); else frame();
  }

  /* ---------- Завантаження ресурсів ---------- */
  function fetchBlob(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.blob();
    }).then(function (b) {
      blobs[path] = URL.createObjectURL(b);
    }).catch(function () {
      return warmMedia(path);   // fetch недоступний (напр. file://) — вантажимо через медіа-елемент
    });
  }

  function warmMedia(path) {
    return new Promise(function (resolve) {
      var tag = /\.mp3$/i.test(path) ? 'audio' : 'video';
      var el = document.createElement(tag);
      el.preload = 'auto'; el.muted = true;
      var t = setTimeout(done, 30000);
      function done() { clearTimeout(t); resolve(); }
      el.addEventListener('canplaythrough', done, { once: true });
      el.addEventListener('error', done, { once: true });
      el.src = path;
      el.load();
    });
  }

  function loadImage(path) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () { resolve(); };
      img.src = path;
    });
  }

  var fontReady = (document.fonts && document.fonts.load)
    ? Promise.race([
        Promise.all([document.fonts.load('800 1em Onest'), document.fonts.load('500 1em Onest'), document.fonts.load('40px "Noto Music"', '𝄞')]),
        new Promise(function (r) { setTimeout(r, 4000); })
      ]).catch(function () {})
    : Promise.resolve();

  fontReady.then(function () { loader.classList.add('is-font'); });

  /* спочатку відео (найважче й найважливіше), потім решта */
  var list = window.RANKING || [];
  var jobs = [];
  list.forEach(function (r) { if (r.video) jobs.push(fetchBlob(r.video)); });
  list.forEach(function (r) {
    if (r.poster) jobs.push(loadImage(r.poster));
    if (r.cover) jobs.push(loadImage(r.cover));
  });
  list.forEach(function (r) { if (r.audio) jobs.push(fetchBlob(r.audio)); });
  jobs.push(fontReady);

  var all = Promise.race([
    Promise.all(jobs),
    new Promise(function (r) { setTimeout(r, TIMEOUT); })
  ]);

  /* для налаштування вигляду: відкрийте сторінку як /?hold — екран завантаження не зникне */
  if (/[?&]hold/.test(location.search)) return;

  all.then(function () {
    var cycle = CYCLE * 1000;
    var sinceAnim = performance.now() - animStart;
    var target = Math.max(MIN_TIME, Math.ceil(sinceAnim / cycle) * cycle);   // чекаємо кінця поточного циклу
    var wait = Math.max(0, target - sinceAnim);
    return new Promise(function (r) { setTimeout(r, wait); });
  }).then(function () {
    loader.classList.add('is-done');
    setTimeout(function () {
      document.documentElement.classList.remove('is-locked');
      loader.remove();
      window.dispatchEvent(new Event('assets-ready'));
    }, 1000);
  });
})();
