/* Closing pop-up: after N seconds, on exit intent (desktop) or scroll depth (mobile).
   Once per browser session. Add #popup to the URL to preview it. Settings: site.config.json → popup */
(function () {
  var cfg = (window.__WMT__ || {}).popup || {};
  var pop = document.getElementById('popup');
  if (!pop || !cfg.enabled) return;
  var KEY = 'wmtPopupSeen', seen = false, lastFocus = null;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  var preview = location.hash === '#popup';
  var open = function (reason) {
    if (!pop.hidden || (seen && !preview)) return;
    seen = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    lastFocus = document.activeElement;
    pop.hidden = false;
    pop.querySelector('.btn').focus();
    if (window.WMT) WMT.track('popup_open', { reason: reason });
  };
  var close = function () { pop.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); };
  pop.querySelector('.popup-close').addEventListener('click', close);
  pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
  pop.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      var f = pop.querySelectorAll('a, button'); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });
  // Someone who already clicked a Telegram button doesn't need the pop-up
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-cta="telegram"]'); if (a && pop.hidden) seen = true; });
  if (preview) { open('preview'); return; }
  if (seen) return;
  setTimeout(function () { open('timer'); }, (cfg.delaySeconds || 20) * 1000);
  if (cfg.exitIntent) document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0) open('exit'); });
  if (cfg.scrollPercent) window.addEventListener('scroll', function () {
    var h = document.documentElement;
    if ((h.scrollTop + innerHeight) / h.scrollHeight * 100 >= cfg.scrollPercent && innerWidth <= 768) open('scroll');
  }, { passive: true });
})();
