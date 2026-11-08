/* Challenge / Instant switch (accessible tabs) */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.offer .tab'));
  var show = function (tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (window.WMT) WMT.track('package_tab', { tab: tab.id.replace('tab-', '') });
  };
  tabs.forEach(function (t, i) {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var dir = (e.key === 'ArrowRight') !== (document.dir === 'rtl') ? 1 : -1;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus(); show(next);
    });
  });
})();
