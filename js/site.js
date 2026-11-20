/* Version A page script: phone menu + the typewriter headline (types once, then the caret blinks).
   Animation uses only opacity (each letter) and transform (the caret); letter positions are measured once. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---------- phone menu ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    var setOpen = function (open) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () { setOpen(!header.classList.contains('nav-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) { if (!header.contains(e.target)) setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760) setOpen(false); });
  }

  /* ---------- typed headline ---------- */
  var REDUCED = root.classList.contains('reduced') ||
    (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function splitLetters(container) {
    var chars = [];
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        for (var i = 0; i < part.length; i++) {
          var c = document.createElement('span'); c.className = 'ch'; c.textContent = part[i];
          w.appendChild(c); chars.push(c);
        }
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return chars;
  }

  function setupTyped(h) {
    var vis = h.querySelector('.typed-vis');
    if (!vis) return;
    // Screen readers get the whole headline at once instead of letter-by-letter spans.
    h.setAttribute('aria-label', vis.textContent.replace(/\s+/g, ' ').trim());
    var chars = splitLetters(vis);
    vis.classList.add('is-armed');
    if (REDUCED || !chars.length) { chars.forEach(function (c) { c.classList.add('on'); }); return; }

    var caret = document.createElement('span');
    caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    h.appendChild(caret);

    // Gradient accents: a gradient painted on the accent span shows through even while its letters are hidden, so the
    // gradient is painted on each letter instead, sized and offset so the letters together still form one gradient.
    var accents = Array.prototype.slice.call(vis.querySelectorAll('.accent'));
    if (accents.length) h.classList.add('per-letter');
    function paintAccents() {
      accents.forEach(function (a) {
        var ar = a.getBoundingClientRect();
        Array.prototype.forEach.call(a.querySelectorAll('.ch'), function (c) {
          var r = c.getBoundingClientRect();
          c.style.backgroundSize = ar.width.toFixed(1) + 'px 100%';
          c.style.backgroundPosition = (ar.left - r.left).toFixed(1) + 'px 0';
        });
      });
    }

    var pos = [], start = null, idx = 0, done = false;
    function measure() {
      var hr = h.getBoundingClientRect();
      pos = chars.map(function (c) {
        var r = c.getBoundingClientRect();
        return { l: r.left - hr.left, r: r.right - hr.left, t: r.top - hr.top, h: r.height };
      });
      start = pos[0];
      paintAccents();
    }
    function place(i) {
      // caret sits after letter i-1 (or before the first letter when i is 0)
      var p = i === 0 ? { x: start.l, t: start.t, h: start.h } : { x: pos[i - 1].r + 2, t: pos[i - 1].t, h: pos[i - 1].h };
      var ch = p.h * 0.78;
      caret.style.height = ch + 'px';
      caret.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + (p.t + (p.h - ch) / 2).toFixed(1) + 'px,0)';
    }
    // Typing pace per heading: data-typed="brisk" (home hero: the whole line in well under 2 s); every other heading keeps
    // the original, more leisurely pace. Either way the caret then blinks twice and fades away.
    var SP = h.getAttribute('data-typed') === 'brisk'
      ? { base: 22, jitter: 18, punct: 140, word: 20, lead: 180 }
      : { base: 32.5, jitter: 42.5, punct: 250, word: 37.5, lead: 400 };   // first version x1.5, then /1.2 (Scott, 2026-11-20)
    function step() {
      if (idx >= chars.length) {
        done = true; caret.classList.add('blink');
        setTimeout(function () { caret.classList.remove('blink'); caret.classList.add('gone'); }, 2100);
        return;
      }
      chars[idx].classList.add('on'); idx++; place(idx);
      var ch = chars[idx - 1].textContent;
      var delay = SP.base + Math.random() * SP.jitter;          // uneven, like a real typist
      if (idx < chars.length && /[.,;:!?]/.test(ch)) delay += SP.punct;
      if (idx < chars.length && chars[idx].parentNode !== chars[idx - 1].parentNode) delay += SP.word; // between words
      setTimeout(step, delay);
    }
    function begin() {
      measure(); place(0); caret.classList.add('show');
      setTimeout(step, SP.lead);
    }
    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { measure(); place(done ? chars.length : idx); }, 120);
    });
    var go = function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(begin); };
    if (root.classList.contains('intro-on')) document.addEventListener('wr:intro-done', go, { once: true });
    else go();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-typed]'), setupTyped);
})();
