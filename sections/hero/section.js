/* Payout video: loads YouTube only after a click (fast page, no YouTube cookies before play) */
(function () {
  document.querySelectorAll('.video[data-youtube]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-youtube');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
      frame.title = btn.getAttribute('aria-label') || 'Video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      var box = document.createElement('div');
      box.className = 'video';
      box.appendChild(frame);
      btn.replaceWith(box);
      if (window.WMT) WMT.track('video_play', { video: id });
    }, { once: true });
  });
})();
