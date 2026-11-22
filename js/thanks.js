/* Фінал: «Дякуємо за увагу» + імена команди. Чорний екран, текст «прилітає» знизу літерами по 2–3 штуки
   (як у прелоадері), прив'язаний до скролу: назад гортаєш — стирається. */
(function () {
  var TITLE = ['Дякуємо', 'за увагу'];
  var NAMES = ['Чумак Стас', 'Юмашев Нікіта', 'Бавицький Єгор', 'Савченко Кирило', 'Мазуркін Марк'];

  var section = document.getElementById('map');
  var stage = document.getElementById('thanksStage');
  if (!section || !stage || !window.MAP) return;

  var HIDDEN = 150;     // початкове зміщення літер, % (як у CSS .chunk)
  var LINE_STEP = 1, CHUNK_STEP = 0.12, RISE = 1.2;
  var TITLE_END = 0.42; // до якої частки скролу з'являється заголовок
  var NAME_FROM = 0.4, NAME_STEP = 0.07, NAME_DUR = 0.14;

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

  var title = document.createElement('h2');
  title.className = 'thanks__title';
  var items = [], maxChunks = 0;
  TITLE.forEach(function (text, l) {
    var line = document.createElement('span');
    line.className = 'line';
    var n = 0;
    text.split(' ').forEach(function (w) {
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
    title.appendChild(line);
  });
  stage.appendChild(title);
  var TOTAL = (TITLE.length - 1) * LINE_STEP + (maxChunks - 1) * CHUNK_STEP + RISE;

  var list = document.createElement('ul');
  list.className = 'thanks__names';
  var nameEls = NAMES.map(function (name) {
    var li = document.createElement('li');
    li.className = 'line';
    var span = document.createElement('span');
    span.className = 'tn';
    span.textContent = name;
    li.appendChild(span);
    list.appendChild(li);
    return span;
  });
  stage.appendChild(list);

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function update() {
    var vh = window.innerHeight;
    if (!vh) return;
    var rect = section.getBoundingClientRect();
    var y = -rect.top / (vh / 100);                       // скрол усередині сцени, vh
    var from = window.MAP.thanksFrom + 50;                // текст починає з'являтись, коли карта вже віддалилась
    var p = clamp((y - from) / 220);

    var time = clamp(p / TITLE_END) * TOTAL;
    for (var i = 0; i < items.length; i++) {
      var t = clamp((time - items[i].start) / RISE);
      items[i].el.style.transform = 'translateY(' + ((1 - ease(t)) * HIDDEN) + '%)';
    }
    nameEls.forEach(function (el, k) {
      var t = clamp((p - NAME_FROM - k * NAME_STEP) / NAME_DUR);
      el.style.transform = 'translateY(' + ((1 - ease(t)) * 130) + '%)';
    });
  }

  Scroll.on(update);
})();
