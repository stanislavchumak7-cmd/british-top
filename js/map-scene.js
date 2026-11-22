/* Сцена: схематична карта Європи -> скролом наїжджаємо на Британію ->
   позначка їде містами, а справа по черзі з'являються всі місця рейтингу (js/ranking.js).
   Дані карти — js/europe-data.js (генерується: npm run build:map). */
(function () {
  var data = window.EUROPE_MAP;
  var ranking = window.RANKING;
  var section = document.getElementById('map');
  var svg = document.getElementById('mapSvg');
  var cardsBox = document.getElementById('cards');
  var bgsBox = document.getElementById('bgs');
  if (!data || !ranking || !section || !svg || !cardsBox || !bgsBox) return;
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NS = 'http://www.w3.org/2000/svg';
  var LAND = [230, 232, 236];   // колір суші
  var UK_FILL = [17, 24, 39];   // колір Британії після наїзду
  var ZOOM_FILL = 0.56;         // яку частку висоти екрану займає Британія в кінці наїзду
  var BG_MAX = 0.3;             // макс. прозорість фонового відео
  var FOLLOW = 0.35;            // наскільки камера підтягується за позначкою

  /* таймлайн у висотах екрану (vh скролу) */
  var ZOOM = 200;               // наїзд на Британію
  var SLIDE = 170;              // довжина одного місця
  var PIN_FROM = 150;           // позначка з'являється ще до першого місця
  var THANKS_EXTRA = 260;       // скільки vh скролу після останнього місця займає фінал
  var ZOUT = 90;                // за скільки vh карта віддаляється до всієї Європи

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* висота секції = 100vh (прикріплений екран) + наїзд + всі місця */
  section.style.height = (100 + ZOOM + SLIDE * ranking.length + THANKS_EXTRA) + 'vh';

  /* фінал починається, коли останній слайд майже відіграв; js/thanks.js бере звідси час старту */
  var thanksFrom = ZOOM + SLIDE * (ranking.length - 1) + 0.78 * SLIDE;
  window.MAP = { thanksFrom: thanksFrom, extra: THANKS_EXTRA };

  /* ---------- Побудова SVG ---------- */
  svg.setAttribute('viewBox', '0 0 ' + data.w + ' ' + data.h);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

  var world = el('g', {}, svg);
  var others = el('g', {}, world);
  var ukPath = null;
  data.countries.forEach(function (c) {
    if (c.n === 'United Kingdom') ukPath = el('path', { d: c.d }, world);
    else el('path', { d: c.d, fill: 'rgb(' + LAND.join(',') + ')' }, others);
  });

  var ring = el('circle', { r: 0, 'class': 'map__pin-ring' }, world);
  var dot = el('circle', { r: 0, 'class': 'map__pin-dot' }, world);

  var uk = data.uk;
  var ukCx = (uk.x0 + uk.x1) / 2, ukCy = (uk.y0 + uk.y1) / 2, ukH = uk.y1 - uk.y0;

  /* ---------- Картки ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var cards = ranking.map(function (r) {
    var c = document.createElement('div');
    c.className = 'card';
    c.hidden = true;
    c.innerHTML =
      '<p class="card__label"><span class="rv">' + esc(r.place) + '</span></p>' +
      '<h2 class="card__band"><span class="rv">' + esc(r.band) + '</span></h2>' +
      '<div class="card__row">' +
        '<div class="card__cover"><img src="' + esc(r.cover) + '" alt="Обкладинка: ' + esc(r.band) + ' — ' + esc(r.album) + '"></div>' +
        '<div class="player"></div>' +
      '</div>' +
      '<p class="card__meta"><span class="rv">' + esc(r.album) + ' · ' + r.year + '<br>' + esc(r.track) + '</span></p>';
    cardsBox.appendChild(c);

    /* фонове відео (приглушене, зациклене): src підставляємо лише коли слайд поруч */
    var bg = document.createElement('video');
    bg.className = 'bg';
    bg.muted = true; bg.loop = true; bg.playsInline = true; bg.preload = 'none';
    bg.setAttribute('aria-hidden', 'true');
    if (r.poster) bg.poster = r.poster;
    /* обгортка: поки відео не почало грати, її не видно; коли почало — плавно проявляється (без різкого «вспалаху») */
    var bgw = document.createElement('div');
    bgw.className = 'bgw';
    bgw.appendChild(bg);
    bgsBox.appendChild(bgw);
    bg.addEventListener('playing', function () { bgw.classList.add('is-ready'); });
    var rv = c.querySelectorAll('.rv');
    return { el: c, bg: bg, src: r.video, label: rv[0], band: rv[1], meta: rv[2], cover: c.querySelector('.card__cover'), img: c.querySelector('img'), player: window.createPlayer(c, r) };
  });

  /* назва групи завжди вміщується в ширину картки: зменшуємо шрифт, якщо треба */
  function fitBands() {
    cards.forEach(function (c) {
      var was = c.el.hidden;
      c.el.hidden = false;
      c.el.style.visibility = 'hidden';
      c.band.parentNode.style.fontSize = '';
      var box = c.band.parentNode;
      var full = box.clientWidth, need = c.band.scrollWidth;
      if (need > full) box.style.fontSize = (parseFloat(getComputedStyle(box).fontSize) * full / need * 0.96) + 'px';
      c.el.style.visibility = '';
      c.el.hidden = was;
    });
  }
  window.addEventListener('resize', fitBands);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBands);
  fitBands();

  /* ---------- Хелпери ---------- */
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(a, b, t) {
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
  }
  function city(i) { return data.cities[ranking[Math.max(0, Math.min(ranking.length - 1, i))].city]; }

  /* ---------- Кадр ---------- */
  function update() {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!vw || !vh) return;                  // вкладка/панель без розміру — малювати нічого
    var rect = section.getBoundingClientRect();
    var y = -rect.top / (vh / 100);          // скрол усередині сцени, у vh

    /* slice: viewBox заповнює екран, зайве обрізається — рахуємо видиму частину */
    var k = Math.max(vw / data.w, vh / data.h);
    var visW = vw / k, visH = vh / k;
    var ox = (data.w - visW) / 2, oy = (data.h - visH) / 2;

    var narrow = vw <= 700 || vw / vh <= 1;
    var fx = narrow ? 0.5 : 0.22;      // де на екрані в кінці стоїть Британія
    var fy = narrow ? 0.3 : 0.5;
    var targetX = ox + fx * visW, targetY = oy + fy * visH;
    var S = Math.max(1, ZOOM_FILL * (narrow ? 0.62 : 1) * visH / ukH);

    /* який зараз слайд і скільки в ньому пройдено (0..1) */
    var raw = (y - ZOOM) / SLIDE;
    var idx = Math.max(0, Math.min(ranking.length - 1, Math.floor(raw)));
    var q = clamp(raw - idx);
    if (raw < 0) q = 0;

    /* позначка їде від міста попереднього місця до міста поточного */
    var a = city(idx - 1), b = city(idx);
    var t = idx === 0 ? 1 : easeInOut(seg(q, 0, 0.3));
    var pinX = lerp(a[0], b[0], t), pinY = lerp(a[1], b[1], t);

    var zo = easeInOut(seg(y, thanksFrom, thanksFrom + ZOUT));   // віддалення в кінці
    var z = easeInOut(seg(y, 0, ZOOM)) * (1 - zo);
    svg.style.opacity = 1 - 0.62 * zo;                           // карта «відходить на другий план» за текстом
    var s = lerp(1, S, z);

    /* на старті в центрі екрану точка f0 (на вузькому екрані зсуваємось до Британії); потім Британія, трохи за позначкою */
    var f0x = narrow ? 640 : data.w / 2, f0y = data.h / 2;
    var focusX = lerp(ukCx, pinX, FOLLOW), focusY = lerp(ukCy, pinY, FOLLOW);
    var ax = lerp(ox + visW / 2, targetX, z), ay = lerp(oy + visH / 2, targetY, z);
    var tx = lerp(f0x, focusX, z), ty = lerp(f0y, focusY, z);
    world.setAttribute('transform',
      'translate(' + ax + ' ' + ay + ') scale(' + s + ') translate(' + (-tx) + ' ' + (-ty) + ')');

    /* Британія темнішає, решта світлішає */
    ukPath.setAttribute('fill', mix(LAND, UK_FILL, z));
    others.setAttribute('opacity', lerp(1, 0.45, z));

    /* позначка: розмір сталий на екрані */
    var pinT = easeOut(seg(y, PIN_FROM, ZOOM)) * (1 - zo);
    var unit = 1 / (s * k);
    dot.setAttribute('cx', pinX); dot.setAttribute('cy', pinY);
    ring.setAttribute('cx', pinX); ring.setAttribute('cy', pinY);
    dot.setAttribute('r', 4.5 * unit * pinT);
    ring.setAttribute('r', 9 * unit * pinT);
    ring.style.opacity = pinT ? '' : 0;

    /* картки */
    var last = ranking.length - 1;
    cards.forEach(function (c, i) {
      var q2 = i === idx ? q : (i < idx ? 1 : 0);
      var show = y >= ZOOM && i === idx;
      c.el.hidden = !show;
      /* підвантажуємо відео лише для поточного і сусідніх слайдів */
      if (c.src && !c.bg.getAttribute('src') && Math.abs(i - idx) <= 1 && y > ZOOM - 60) { c.bg.preload = 'auto'; c.bg.src = window.Assets ? Assets.url(c.src) : c.src; }
      if (!show) {
        c.player.setAway(true);
        c.bg.style.opacity = 0;
        if (!c.bg.paused) c.bg.pause();
        return;
      }

      var inL = easeOut(seg(q2, 0.12, 0.26)), inB = easeOut(seg(q2, 0.16, 0.36)),
          inC = easeOut(seg(q2, 0.22, 0.45)), inM = easeOut(seg(q2, 0.34, 0.5));
      var out = easeInOut(seg(q2, 0.8, 0.97));
      c.player.setAway(q2 > 0.72);

      /* фонове відео з'являється разом з обкладинкою і зникає зі слайдом */
      var bgO = easeOut(seg(q2, 0.1, 0.4)) * (1 - out);
      c.bg.style.opacity = bgO * BG_MAX;
      if (bgO > 0.01 && !REDUCE) { if (c.bg.paused) { var pr = c.bg.play(); if (pr && pr.catch) pr.catch(function () {}); } }
      else if (!c.bg.paused) c.bg.pause();   // плеєр йде вправо трохи раніше, ніж решта картки

      c.label.style.transform = 'translateY(' + ((1 - inL) * 120 - out * 120) + '%)';
      c.band.style.transform = 'translateY(' + ((1 - inB) * 120 - out * 120) + '%)';
      c.meta.style.transform = 'translateY(' + ((1 - inM) * 120 - out * 120) + '%)';
      c.cover.style.clipPath = 'inset(' + ((1 - inC) * 100) + '% 0 ' + (out * 100) + '% 0)';
      c.img.style.transform = 'scale(' + lerp(1.25, 1, inC) + ')';
    });
  }

  Scroll.on(update);
})();
