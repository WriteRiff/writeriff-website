/* WriteRiff opening intro + header logo (shared by all site versions).
 *
 * What it does
 *   - Header: draws the WriteRiff scribe mark (final frame of the app's real logo animation) into
 *     #brandMarkAnim, sized to fit #brandMark.
 *   - Intro (once per visitor): a full-screen overlay where the scribe logo draws itself (about 4 s), then
 *     glides and shrinks into the header mark (1 s) while the page fades in. A "Skip intro" button and Escape
 *     end it early. With prefers-reduced-motion the logo appears still, then the overlay fades (no movement).
 *
 * Page contract (each version provides):
 *   1. In <head>, before any CSS paints, the one-line decider (copy exactly):
 *      <script>(function(){document.documentElement.classList.add('js');var q=new URLSearchParams(location.search),s=false;try{s=localStorage.getItem('wr-intro-seen')==='1'}catch(e){}var p=q.get('intro')!=='0'&&(q.get('intro')==='1'||!s);document.documentElement.classList.add(p?'intro-on':'intro-off');if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('reduced')})()</script>
 *   2. Header markup:
 *      <a class="brand" href="..."><span class="brand-mark" id="brandMark" aria-hidden="true"><span class="brand-mark-anim" id="brandMarkAnim"></span></span><span class="brand-word" id="brandWord">Write<span class="r">R</span>iff</span></a>
 *      CSS must give .brand-mark a height (e.g. 40px) and position:relative; .brand-mark-anim position:absolute.
 *      The header behind the mark must be light (the mark is black + purple).
 *   3. At the end of <body>: lottie_light.min.js, scribe-logo.js, then this file.
 *   Optional: --intro-bg on :root sets the overlay colour (default #ffffff; keep it light).
 *
 * URL switches: ?intro=1 replay, ?intro=0 skip.  window.__introDone is set when finished (for tests).
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var REDUCED = root.classList.contains('reduced');
  var INTRO = root.classList.contains('intro-on');

  var LOGO_HOLD = 4.0, GLIDE = 1.0, LOTTIE_FPS = 60, LAST_FRAME = 299, COMP_RATIO = 1160 / 1000;
  var TEXT_LAYERS = ['Imagine', 'Develop', 'Grow', 'dot 1', 'dot 2', 'tagline', 'wordmark'];
  var MARK_LAYERS = ['arc', 'W', 'R'];

  var brandMark = document.getElementById('brandMark');
  var brandMarkAnim = document.getElementById('brandMarkAnim');
  var brandWord = document.getElementById('brandWord');
  if (!brandMark || !brandMarkAnim || !window.lottie || !window.WR_SCRIBE_LOGO) {
    root.classList.remove('intro-on'); root.classList.add('intro-off'); return;
  }

  // Styles for the overlay live here so every version gets the same behaviour.
  var css = document.createElement('style');
  css.textContent =
    'html.intro-on body{overflow:hidden}' +
    'html.intro-on #brandMarkAnim,html.intro-on #brandWord{opacity:0}' +
    '.brand-mark-anim{mix-blend-mode:multiply}' +
    '.wr-intro{position:fixed;inset:0;z-index:1000;display:none}' +
    'html.intro-on .wr-intro{display:block}' +
    '.wr-intro-bg{position:absolute;inset:0;background:var(--intro-bg,#fff);will-change:opacity}' +
    '.wr-intro-logo{position:absolute;left:0;top:0;transform-origin:0 0;opacity:0;mix-blend-mode:multiply;pointer-events:none;will-change:transform,opacity}' +
    '.wr-skip{position:fixed;z-index:1001;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));display:none;' +
    'font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d1a24;background:rgba(255,255,255,.85);' +
    'border:1px solid #d9d5e0;border-radius:999px;padding:11px 18px;cursor:pointer;transition:opacity .3s}' +
    'html.intro-on .wr-skip{display:block}' +
    '.wr-skip:focus-visible{outline:3px solid #6d22e8;outline-offset:2px}' +
    '.wr-skip.gone{opacity:0;pointer-events:none}';
  document.head.appendChild(css);

  var intro, introBg, logoBox, skipBtn;
  var introAnim = null, introText = [], markFrac = null, startBox = null, flip = null;
  var lastFrame = -1, finished = !INTRO;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function easeInOutCubic(x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function cls(name) { return 'L-' + name.replace(/\s+/g, '-'); }
  function storeSeen() { try { localStorage.setItem('wr-intro-seen', '1'); } catch (e) {} }
  function logoData() {
    var d = JSON.parse(JSON.stringify(window.WR_SCRIBE_LOGO));
    d.layers.forEach(function (l) { l.cl = cls(l.nm); });
    return d;
  }
  function layerEls(anim, names) {
    return names.map(function (n) { return anim.wrapper.querySelector('.' + cls(n)); }).filter(Boolean);
  }
  function loadAnim(container) {
    return new Promise(function (resolve) {
      var a = lottie.loadAnimation({ container: container, renderer: 'svg', loop: false, autoplay: false, animationData: logoData() });
      if (a.isLoaded) resolve(a); else a.addEventListener('DOMLoaded', function () { resolve(a); });
    });
  }

  /* ---------- header mark ---------- */
  function layoutHeader() {
    if (!markFrac) return;
    var slotH = brandMark.getBoundingClientRect().height || 40;
    var compH = slotH / markFrac.h, compW = compH / COMP_RATIO;
    brandMarkAnim.style.width = compW + 'px';
    brandMarkAnim.style.height = compH + 'px';
    brandMarkAnim.style.left = (-markFrac.x * compW) + 'px';
    brandMarkAnim.style.top = (-markFrac.y * compH) + 'px';
    brandMark.style.width = (markFrac.w * compW) + 'px';
  }
  function setupHeader() {
    brandMarkAnim.style.width = '200px'; brandMarkAnim.style.height = (200 * COMP_RATIO) + 'px';
    return loadAnim(brandMarkAnim).then(function (a) {
      a.goToAndStop(LAST_FRAME, true);
      layerEls(a, TEXT_LAYERS).forEach(function (el) { el.style.display = 'none'; });
      var svg = a.wrapper.querySelector('svg').getBoundingClientRect(), u = null;
      layerEls(a, MARK_LAYERS).forEach(function (el) {
        var r = el.getBoundingClientRect();
        u = u ? { l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) }
              : { l: r.left, t: r.top, r: r.right, b: r.bottom };
      });
      markFrac = { x: (u.l - svg.left) / svg.width, y: (u.t - svg.top) / svg.height, w: (u.r - u.l) / svg.width, h: (u.b - u.t) / svg.height };
      layoutHeader();
    });
  }

  /* ---------- intro ---------- */
  function buildOverlay() {
    intro = document.createElement('div'); intro.className = 'wr-intro'; intro.setAttribute('aria-hidden', 'true');
    introBg = document.createElement('div'); introBg.className = 'wr-intro-bg';
    logoBox = document.createElement('div'); logoBox.className = 'wr-intro-logo';
    intro.appendChild(introBg); intro.appendChild(logoBox);
    skipBtn = document.createElement('button'); skipBtn.type = 'button'; skipBtn.className = 'wr-skip'; skipBtn.textContent = 'Skip intro';
    document.body.appendChild(intro); document.body.appendChild(skipBtn);
  }
  function layoutIntro() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var w = Math.min(vw - 48, 440), h = w * COMP_RATIO;
    if (h > vh - 48) { h = vh - 48; w = h / COMP_RATIO; }
    startBox = { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h };
    logoBox.style.left = startBox.left + 'px'; logoBox.style.top = startBox.top + 'px';
    logoBox.style.width = w + 'px'; logoBox.style.height = h + 'px';
    flip = null;
  }
  function computeFlip() {
    var t = brandMarkAnim.getBoundingClientRect();
    flip = { dx: t.left - startBox.left, dy: t.top - startBox.top, s: t.width / startBox.width };
  }

  function render(t) {
    logoBox.style.opacity = String(smooth(t / 0.35));
    var frame = Math.max(0, Math.min(LAST_FRAME, t * LOTTIE_FPS));
    if (introAnim && frame !== lastFrame) { introAnim.goToAndStop(frame, true); lastFrame = frame; }
    var p = clamp01((t - LOGO_HOLD) / GLIDE);
    if (p > 0) {
      if (!flip) computeFlip();
      var e = easeInOutCubic(p), s = Math.pow(flip.s, e);
      logoBox.style.transform = 'translate3d(' + (flip.dx * e) + 'px,' + (flip.dy * e) + 'px,0) scale(' + s + ')';
      var textOp = String(1 - smooth(p / 0.45));
      introText.forEach(function (el) { el.style.opacity = textOp; });
      introBg.style.opacity = String(1 - smooth((p - 0.35) / 0.65));
      brandWord.style.opacity = String(smooth((p - 0.45) / 0.55));
      skipBtn.classList.toggle('gone', p > 0.1);
    }
    if (t >= LOGO_HOLD + GLIDE) finish();
  }

  function finish() {
    if (finished && !intro) return;
    finished = true;
    storeSeen();
    root.classList.remove('intro-on'); root.classList.add('intro-off');
    brandWord.style.opacity = ''; brandMarkAnim.style.opacity = '';
    if (intro) { intro.remove(); skipBtn.remove(); intro = null; }
    window.__introDone = true;
    document.dispatchEvent(new CustomEvent('wr:intro-done'));
  }
  function fadeOut(ms) {
    if (!intro) return;
    storeSeen();
    brandMarkAnim.style.opacity = '1'; brandWord.style.opacity = '1';
    intro.style.transition = 'opacity ' + ms + 'ms ease-out'; intro.style.opacity = '0';
    skipBtn.classList.add('gone');
    setTimeout(finish, ms + 20);
  }
  function skip() { if (!finished) { finished = true; fadeOut(250); } }

  function playLive() {
    var t0 = performance.now();
    function loop(now) {
      if (finished) return;
      render((now - t0) / 1000);
      if (!finished) requestAnimationFrame(loop);
    }
    requestAnimationFrame(function (n) { t0 = n; loop(n); });
  }
  function playStill() {
    introAnim.goToAndStop(LAST_FRAME, true);
    logoBox.style.transition = 'opacity 500ms ease';
    requestAnimationFrame(function () { logoBox.style.opacity = '1'; });
    setTimeout(function () { if (!finished) { finished = true; fadeOut(600); } }, 2000);
  }

  var headerReady = setupHeader();
  window.addEventListener('resize', function () { layoutHeader(); if (intro) layoutIntro(); });
  if (!INTRO) { window.__introDone = true; return; }

  storeSeen();
  buildOverlay();
  skipBtn.addEventListener('click', skip);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') skip(); });
  layoutIntro();
  var introReady = loadAnim(logoBox).then(function (a) { introAnim = a; introText = layerEls(a, TEXT_LAYERS); a.goToAndStop(0, true); });
  // Safety net: never leave a visitor stuck behind the overlay.
  setTimeout(function () { if (!finished) skip(); }, 9000);
  Promise.all([headerReady, introReady]).then(function () {
    if (finished) return;
    if (REDUCED) playStill(); else playLive();
  }, skip);
})();
