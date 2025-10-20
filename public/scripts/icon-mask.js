// Toggle data-ready when icons enter the viewport.
// We DO NOT set any style attribute here (CSP-safe).
(() => {
  let started = false;

  const markReady = (el) => el.setAttribute('data-ready', '1');

  const scan = () => Array.from(document.querySelectorAll('.icon:not([data-ready])'));

  function start(rootMargin = '200px') {
    if (started) return; started = true;

    // Mark above-the-fold asap
    const onReady = () => {
      // next frame so layout is known
      requestAnimationFrame(() => {
        const els = scan();
        if (!('IntersectionObserver' in window)) {
          els.forEach(markReady);
          return;
        }
        const io = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            markReady(e.target);
            io.unobserve(e.target);
          }
        }, { rootMargin });
        els.forEach((el) => io.observe(el));
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
      onReady();
    }
  }

  if (typeof window !== 'undefined') {
    if (!window.__iconMaskStarted) {
      window.__iconMaskStarted = true;
      start();
    }
  }
})();
