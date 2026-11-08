/* WeMasterTrade landing — shared runtime: tracking + link enrichment.
   Section behaviour (video, tabs, popup, promo) lives in sections/<name>/section.js. */
(function () {
  var W = window.__WMT__ || {};
  window.WMT = window.WMT || {};

  /* ---- Tracking: GTM dataLayer + Meta Pixel (only if installed via site.config.json) ---- */
  WMT.track = function (event, params) {
    try {
      var data = Object.assign({ event: event, lp_lang: W.lang, lp_market: W.market }, params || {});
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(data);
      if (typeof window.fbq === 'function') {
        if (event === 'telegram_click') window.fbq('track', 'Lead', data);
        if (event === 'register_click') window.fbq('track', 'InitiateCheckout', data);
      }
    } catch (e) { /* tracking must never break the page */ }
  };

  /* ---- Carry ad source (utm_*, fbclid) into Telegram + register links ---- */
  var qs = new URLSearchParams(location.search);
  var keep = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var incoming = {};
  keep.forEach(function (k) { if (qs.get(k)) incoming[k] = qs.get(k).slice(0, 60); });
  var clean = function (s) { return (s || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 16); };

  document.querySelectorAll('a[data-cta]').forEach(function (a) {
    var url;
    try { url = new URL(a.href); } catch (e) { return; }
    if (url.hostname === 'r.bothelp.io') {
      // BotHelp: UTM parameters are stored in the subscriber's fields
      ['utm_source', 'utm_campaign', 'utm_term'].forEach(function (k) { if (incoming[k]) url.searchParams.set(k, incoming[k]); });
      if (!url.searchParams.get('utm_source')) url.searchParams.set('utm_source', document.referrer ? 'referral' : 'direct');
    } else if (url.hostname === 't.me') {
      // Plain Telegram link: append the source to the start tag (max 64 chars, A-Z a-z 0-9 _ -)
      if (incoming.utm_source) {
        var start = (url.searchParams.get('start') || '') + '__' + clean(incoming.utm_source) + (incoming.utm_campaign ? '-' + clean(incoming.utm_campaign) : '');
        url.searchParams.set('start', start.slice(0, 64));
      }
    } else if (a.getAttribute('data-cta') === 'register') {
      ['utm_source', 'utm_campaign', 'utm_term'].forEach(function (k) { if (incoming[k]) url.searchParams.set(k, incoming[k]); });
    }
    a.href = url.toString();
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cta]');
    if (a) WMT.track(a.getAttribute('data-cta') + '_click', { placement: a.getAttribute('data-place') || '' });
  });
})();
