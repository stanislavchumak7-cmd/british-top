/* Прелоадер, що керується скролом (плавний скрол — Lenis):
   1) reveal — літери по 2–3 штуки «прилітають» знизу, 5 імен по рядках;
   2) hold   — коротка пауза на готовому тексті;
   3) exit   — чорна сцена швидко їде вгору, відкриваючи сторінку. */
(function () {
  /* імена команди (ті самі, що у фіналі) */
  var NAMES = ['Чумак Стас', 'Юмашев Нікіта', 'Бавицький Єгор', 'Савченко Кирило', 'Мазуркін Марк'];

  /* довжини фаз у висотах екрану (vh скролу) */
  var REVEAL = 250;
  var HOLD = 40;
  var EXIT = 70;         // менше = швидше їде вгору

  var HIDDEN = 150;      // початкове зміщення літер, % (має збігатися з CSS)

  /* одиниці «часу» всередині таймлайну появи */
  var LINE_STEP = 1;     // зсув старту між рядками
  var CHUNK_STEP = 0.12; // зсув між шматками в рядку
  var RISE = 1.2;        // тривалість підйому одного шматка

  var intro = document.getElementById('intro');
  var root = document.getElementById('preloader');
  if (!root) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intro.remove();
    root.remove();
    document.getElementById('app').style.margin = '0';
    return;
  }

  var st = document.documentElement.style;
  st.setProperty('--reveal', REVEAL + 'vh');
  st.setProperty('--hold', HOLD + 'vh');
  st.setProperty('--exit', EXIT + 'vh');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- Розмітка ---------- */
  /* слово -> шматки по 2–3 літери (без самотньої останньої літери) */
  function chunks(word) {
    var out = [], i = 0;
    while (i < word.length) {
      var n = 2 + Math.floor(Math.random() * 2);
      if (word.length - i - n === 1) n = word.length - i;
      out.push(word.slice(i, i + n));
      i += n;
    }
    return out;
  }

  var names = NAMES;
  var items = []; // {el, start}
  var maxChunks = 0;

  var lines = document.createElement('div');
  lines.className = 'lines';
  names.forEach(function (name, l) {
    var line = document.createElement('span');
    line.className = 'line';
    var n = 0;
    name.split(' ').forEach(function (w) {
      var word = document.createElement('span');
      word.className = 'word';
      chunks(w).forEach(function (c) {
        var ch = document.createElement('span');
        ch.className = 'chunk';
        ch.textContent = c;
        word.appendChild(ch);
        items.push({ el: ch, start: l * LINE_STEP + n * CHUNK_STEP });
        n++;
      });
      line.appendChild(word);
    });
    maxChunks = Math.max(maxChunks, n);
    lines.appendChild(line);
  });
  root.appendChild(lines);

  /* підказка «гортайте»: мишка з колесиком (на телефоні — палець); взято з портфоліо */
  var hint = document.createElement('div');
  hint.className = 'scroll-cue';
  hint.innerHTML =
    '<svg class="cue__touch" viewBox="0 0 36 72" fill="none"><g class="cue__hand"><g transform="translate(3 30) scale(1.4)">' +
    '<path class="cue__finger" d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5M11 11.5v-2a1.5 1.5 0 1 1 3 0v2.5M14 10.5a1.5 1.5 0 0 1 3 0v1.5M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" vector-effect="non-scaling-stroke"></path>' +
    '</g></g></svg>' +
    '<svg class="cue__mouse" viewBox="0 0 36 72" fill="none">' +
    '<rect class="cue__body" x="3" y="2" width="30" height="48" rx="15" pathLength="1"></rect>' +
    '<line class="cue__wheel" x1="18" y1="12" x2="18" y2="20"></line>' +
    '<path class="cue__chevron cue__chevron--1" d="M12.5 57l5.5 4.5 5.5-4.5"></path>' +
    '<path class="cue__chevron cue__chevron--2" d="M12.5 63l5.5 4.5 5.5-4.5"></path>' +
    '</svg>';
  root.appendChild(hint);

  var TOTAL = (names.length - 1) * LINE_STEP + (maxChunks - 1) * CHUNK_STEP + RISE;

  /* ---------- Скрол -> анімація ---------- */
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function update() {
    var vh = window.innerHeight / 100;
    var y = Scroll.y();

    var reveal = clamp(y / (REVEAL * vh));
    var time = reveal * TOTAL;
    for (var i = 0; i < items.length; i++) {
      var t = clamp((time - items[i].start) / RISE);
      items[i].el.style.transform = 'translateY(' + ((1 - ease(t)) * HIDDEN) + '%)';
    }
    hint.style.opacity = y > 8 ? 0 : 1;

    var exit = clamp((y - (REVEAL + HOLD) * vh) / (EXIT * vh));
    root.style.transform = exit ? 'translateY(' + (-exit * 100) + '%)' : '';
    root.classList.toggle('is-gone', exit >= 1);
  }

  Scroll.on(update);
})();
