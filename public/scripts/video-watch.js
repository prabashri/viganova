// /public/scripts/video-watch.js
// Powers any player container with [data-vp-root] markup.
// Works for YouTube, Vimeo, generic iframe, and self-hosted <video>.
// Also handles chapter-seek buttons rendered elsewhere via [data-seek] and optional [data-href].

(function () {
  const ROOT_SELECTOR = '[data-vp-root]';

  const q = (root, id) => root.querySelector('#' + id);
  const ensureString = (v) => (typeof v === 'string' ? v : '');

  const withAutoplay = (url) => url + (url.includes('?') ? '&' : '?') + 'autoplay=1';

  function bootOne(root) {
    if (!(root instanceof HTMLElement)) return;

    const uid = ensureString(root.getAttribute('data-uid'));
    const provider = ensureString(root.getAttribute('data-provider'));
    const canonicalUrl = ensureString(root.getAttribute('data-canonical-url'));
    const embedSrcBase = ensureString(root.getAttribute('data-embed-src'));
    const startSeconds = Number(root.getAttribute('data-start-seconds') || '');
    const vimeoAnchor = ensureString(root.getAttribute('data-vimeo-anchor'));

    const playBtn = q(root, `${uid}-play`);
    const posterWrap = q(root, `${uid}-poster-wrap`);
    const slot = q(root, `${uid}-iframe-slot`);
    const vid  = q(root, `${uid}-video`);

    const startIframe = () => {
      if (!slot || !embedSrcBase) return;
      let url = embedSrcBase;
      if (provider === 'youtube' && Number.isFinite(startSeconds)) {
        url += (url.includes('?') ? '&' : '?') + 'start=' + Math.max(0, startSeconds|0);
      }
      if (provider === 'vimeo' && vimeoAnchor) {
        url += vimeoAnchor; // keep #t=… anchor
      }
      url = withAutoplay(url);

      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.allow =
        provider === 'youtube'
          ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          : 'autoplay; fullscreen; picture-in-picture; clipboard-write';
      iframe.loading = 'eager';
      iframe.className = 'w-full h-full';
      iframe.setAttribute('allowfullscreen', 'true');
      slot.replaceChildren(iframe);
      slot.classList.remove('hide');
    };

    const startSelfHosted = () => {
      if (!(vid instanceof HTMLVideoElement)) return;
      if (Number.isFinite(startSeconds)) {
        try { vid.currentTime = Math.max(0, startSeconds|0); } catch {}
      }
      vid.classList.remove('hide');
      try { vid.play().catch(()=>{}); } catch {}
    };

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        playBtn.remove();
        posterWrap && posterWrap.remove();
        if (provider === 'self') startSelfHosted();
        else startIframe();
      }, { once: true });
    }
  }

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onDomReady(() => {
    // Initialize all players on the page
    document.querySelectorAll(ROOT_SELECTOR).forEach(bootOne);

    // Global chapter buttons: seek the nearest/self player
    document.querySelectorAll('[data-seek]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const t = Number(el.getAttribute('data-seek'));
        if (!Number.isFinite(t)) return;

        // Try to use closest player relative to the button; fallback to first on the page
        const container = el.closest(ROOT_SELECTOR) || document.querySelector(ROOT_SELECTOR);
        if (!container) return;

        const uid = container.getAttribute('data-uid');
        const provider = container.getAttribute('data-provider');

        // If the self-hosted video isn't shown yet, trigger the play overlay
        const playBtn = container.querySelector(`#${uid}-play`);
        const vid = container.querySelector(`#${uid}-video`);

        const ensureVideoVisible = () => {
          if (provider === 'self') {
            if (vid instanceof HTMLVideoElement && !vid.classList.contains('hide')) return vid;
            if (playBtn) playBtn.dispatchEvent(new Event('click', { bubbles: true }));
            return container.querySelector(`#${uid}-video`);
          }
          return null;
        };

        const videoEl = ensureVideoVisible();
        if (videoEl instanceof HTMLVideoElement) {
          e.preventDefault();
          try { videoEl.currentTime = Math.max(0, t|0); } catch {}
          videoEl.play().catch(()=>{});
          const href = el.getAttribute('data-href');
          const canonical = container.getAttribute('data-canonical-url') || location.href;
          const newUrl = href || (canonical + (canonical.includes('?') ? '&' : '?') + 't=' + (t|0));
          history.replaceState(null, '', newUrl);
        }
      });
    });
  });
})();
