/* Gentle reveal-on-scroll (shared). Add data-reveal to any element; it gets class "is-in" when it scrolls into view.
 * Optional data-reveal-delay="120" (ms) for staggering. Versions write their own CSS for
 * `.js [data-reveal]:not(.is-in)` (the head snippet in wr-intro.js adds class "js" before first paint, so nothing flickers),
 * using transform + opacity only, and must show everything immediately under prefers-reduced-motion
 * (this script also marks everything visible at once in that case, or if IntersectionObserver is missing). */
(function () {
  'use strict';
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-reveal');
  function show(el) {
    var d = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
    if (d && !reduced) el.style.transitionDelay = d + 'ms';
    el.classList.add('is-in');
  }
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(show); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();
