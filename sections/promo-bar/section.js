/* Promo bar: shown only when site.config.json → promo.enabled is true and the end date hasn't passed */
(function () {
  var cfg = (window.__WMT__ || {}).promo;
  var bar = document.getElementById('promo-bar');
  var text = bar && bar.querySelector('span');
  if (!cfg || !bar || !text || !text.textContent.trim()) return;
  var ends = cfg.endsAt ? new Date(cfg.endsAt) : null;
  if (ends && ends <= new Date()) return;
  bar.hidden = false;
  if (!ends) return;
  var timer = bar.querySelector('.promo-timer');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var tick = function () {
    var s = Math.max(0, Math.floor((ends - new Date()) / 1000));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    timer.textContent = timer.getAttribute('data-label') + ' ' + (d ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s % 60);
    if (s === 0) { bar.hidden = true; clearInterval(iv); }
  };
  var iv = setInterval(tick, 1000); tick();
})();
