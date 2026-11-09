/* Payout video — nothing loads until the visitor clicks play (fast page).
   data-src     → self-hosted MP4 (market.json → video.file), works where YouTube is blocked (Iran)
   data-youtube → YouTube embed (youtube-nocookie) */
(function () {
  document.querySelectorAll('.video[data-src], .video[data-youtube]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = document.createElement('div');
      box.className = 'video';
      var src = btn.getAttribute('data-src');
      var id = btn.getAttribute('data-youtube');
      if (src) {
        var v = document.createElement('video');
        v.src = src;
        v.controls = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.poster = btn.querySelector('img').src;
        v.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Video');
        box.appendChild(v);
        btn.replaceWith(box);
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* browser blocked autoplay: controls are visible */ });
        v.addEventListener('ended', function () { if (window.WMT) WMT.track('video_complete', { video: src }); });
      } else {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
        f.title = btn.getAttribute('aria-label') || 'Video';
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        box.appendChild(f);
        btn.replaceWith(box);
      }
      if (window.WMT) WMT.track('video_play', { video: src || id });
    }, { once: true });
  });
})();
