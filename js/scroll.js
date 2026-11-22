/* Плавний скрол (Lenis) — один на весь сайт.
   Інші скрипти підписуються через Scroll.on(fn) і беруть позицію з Scroll.y(). */
(function () {
  var lenis = null;
  var listeners = [];

  if (window.Lenis && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    lenis.on('scroll', emit);

    /* поки йде екран завантаження — скрол повністю заблоковано (Lenis сам викликає scrollTo, тож overflow:hidden його не зупиняє) */
    if (document.documentElement.classList.contains('is-locked')) {
      lenis.stop();
      window.addEventListener('assets-ready', function () { lenis.start(); }, { once: true });
    }
  } else {
    window.addEventListener('scroll', emit, { passive: true });
  }
  window.addEventListener('resize', emit);

  function emit() { for (var i = 0; i < listeners.length; i++) listeners[i](); }

  window.Scroll = {
    y: function () { return lenis ? lenis.scroll : window.scrollY; },
    on: function (fn) { listeners.push(fn); fn(); }
  };
})();
