/* WriteRiff website forms: beta sign-up and contact (shared by all site versions).
 *
 * Markup contract
 *   <form data-wr-form="beta" novalidate>            (or data-wr-form="contact")
 *     beta fields:    name (optional), email (required), writes (optional: what they write), updates (checkbox, required)
 *     optional on both forms: marketing_opt_in (unticked checkbox: news/promotions emails; sent only if present)
 *     contact fields: name (required), email (required), topic (optional select), message (required)
 *     honeypot:       <div class="wr-hp" aria-hidden="true"><label>Company<input name="company" tabindex="-1" autocomplete="off"></label></div>
 *     status line:    <p data-wr-status role="status" aria-live="polite"></p>
 *     submit button:  <button type="submit">...</button>
 *   </form>
 *   The form gets class "is-sending", then "is-done" (success) or "is-error". Fields failing checks get aria-invalid="true".
 *
 * Saves to Supabase (tables beta_signups / contact_messages, insert-only for visitors; SQL in /supabase).
 * While those tables don't exist yet, or the network fails, visitors see a friendly message instead of an error.
 */
(function () {
  'use strict';
  var cfg = window.WR_CONFIG || {};
  var LOADED = Date.now();
  var EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
  var MSG = {
    beta: { ok: "You're on the list! We'll email you when the WriteRiff beta opens.",
            // Same words as "ok" on purpose, so the form never reveals whether an address is already on the list.
            dup: "You're on the list! We'll email you when the WriteRiff beta opens." },
    contact: { ok: "Thanks! Your message reached the WriteRiff team. We'll reply by email." },
    soon: "Thanks for your interest! Our sign-up desk opens in just a few days, so please try again soon, or email us at ",
    offline: "We couldn't send that just now. Please try again in a little while, or email us at "
  };

  function hideHoneypots() {
    var s = document.createElement('style');
    s.textContent = '.wr-hp{position:absolute!important;left:-10000px!important;width:1px;height:1px;overflow:hidden}';
    document.head.appendChild(s);
  }

  function setStatus(form, text, withEmail) {
    var el = form.querySelector('[data-wr-status]');
    if (!el) return;
    el.textContent = text;
    if (withEmail && cfg.contactEmail) {
      var a = document.createElement('a');
      a.href = 'mailto:' + cfg.contactEmail; a.textContent = cfg.contactEmail;
      el.appendChild(a); el.appendChild(document.createTextNode('.'));
    }
  }
  function val(form, name) { var f = form.elements[name]; return f ? String(f.value || '').trim() : ''; }
  function invalid(form, name, bad) {
    var f = form.elements[name]; if (!f) return;
    if (bad) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
  }

  function check(form, kind) {
    var errors = [];
    var email = val(form, 'email');
    var badEmail = !EMAIL_RE.test(email) || email.length > 254;
    invalid(form, 'email', badEmail); if (badEmail) errors.push('a valid email address');
    var name = val(form, 'name');
    var badName = name.length > 100 || (kind === 'contact' && !name);
    invalid(form, 'name', badName); if (badName) errors.push(kind === 'contact' ? 'your name' : 'a shorter name');
    if (kind === 'beta') {
      var up = form.elements.updates;
      var badUp = up && !up.checked;
      invalid(form, 'updates', badUp); if (badUp) errors.push('a tick in the email-updates box');
    } else {
      var m = val(form, 'message');
      var badMsg = m.length < 2 || m.length > 5000;
      invalid(form, 'message', badMsg); if (badMsg) errors.push(m.length > 5000 ? 'a shorter message (5,000 characters at most)' : 'a message');
    }
    return errors;
  }

  function optIn(form) { var b = form.elements.marketing_opt_in; return b ? { marketing_opt_in: !!b.checked } : {}; }
  function row(form, kind) {
    var page = (location.pathname.split('/').filter(Boolean).pop() || 'home').slice(0, 40);
    if (kind === 'beta') {
      return { name: val(form, 'name') || null, email: val(form, 'email').toLowerCase(),
               writes: val(form, 'writes').slice(0, 200) || null, source: page, ...optIn(form) };
    }
    return { name: val(form, 'name'), email: val(form, 'email'), topic: val(form, 'topic').slice(0, 40) || null,
             message: val(form, 'message'), ...optIn(form) };
  }

  function send(kind, data) {
    var table = kind === 'beta' ? 'beta_signups' : 'contact_messages';
    if (!cfg.supabaseUrl || !cfg.supabaseKey || !window.fetch) return Promise.resolve('soon');
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
    return fetch(cfg.supabaseUrl + '/rest/v1/' + table, {
      method: 'POST',
      headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(data), credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (r.ok) return 'ok';
      if (r.status === 409) return 'dup';                      // already signed up (unique email)
      if (r.status === 404) return 'soon';                   // tables not created yet
      return 'offline';                                      // rate limit, checks failed, or server trouble
    }, function () { clearTimeout(timer); return 'offline'; });
  }

  function wire(form) {
    var kind = form.getAttribute('data-wr-form') === 'contact' ? 'contact' : 'beta';
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.classList.contains('is-sending')) return;
      form.classList.remove('is-error', 'is-done');
      var errors = check(form, kind);
      if (errors.length) {
        form.classList.add('is-error');
        var list = errors.length > 1 ? errors.slice(0, -1).join(', ') + ' and ' + errors[errors.length - 1] : errors[0];
        setStatus(form, 'Please add ' + list + '.');
        var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus();
        return;
      }
      // Spam guards: a hidden field only bots fill in, and a minimum time on the page. Bots get a fake "thanks".
      var bot = val(form, 'company') !== '' || Date.now() - LOADED < 2500;
      var btn = form.querySelector('[type="submit"]');
      form.classList.add('is-sending'); if (btn) btn.disabled = true;
      setStatus(form, 'Sending…');
      var p = bot ? new Promise(function (r) { setTimeout(function () { r('ok'); }, 600); }) : send(kind, row(form, kind));
      p.then(function (result) {
        form.classList.remove('is-sending'); if (btn) btn.disabled = false;
        if (result === 'ok' || result === 'dup') {
          form.classList.add('is-done');
          setStatus(form, result === 'dup' ? MSG.beta.dup : MSG[kind].ok);
          form.reset();
        } else {
          form.classList.add('is-error');
          setStatus(form, result === 'offline' ? MSG.offline : MSG.soon, true);
        }
      });
    });
  }

  hideHoneypots();
  function init() { Array.prototype.forEach.call(document.querySelectorAll('form[data-wr-form]'), wire); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
