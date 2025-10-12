/* eslint-disable no-underscore-dangle */
'use strict';

/* ============================================
   1) Header Menu (desktop hover + mobile click)
   ============================================ */
function initMenu() {
  const toggleBtn = document.getElementById('menu-toggle');
  if (!toggleBtn) return;

  const hamburgerIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  const selector = toggleBtn.getAttribute('data-targets');

  const targets = selector
    ? selector.split(',').map((s) => document.querySelector(s.trim())).filter(Boolean)
    : [];

  const navItems = Array.from(document.querySelectorAll('.nav-item.dropdown'));
  if (!navItems.length) return;

  const activeClass = 'dropdown-active';
  let isDesktop = window.matchMedia('(min-width: 768px)').matches;

  // prepare refs once
  navItems.forEach((item) => {
    item._button = item.querySelector('button[data-action]');
    item._menu = item.querySelector('.dropdown-menu');
  });

  // Toggle header (hamburger) targets
  toggleBtn.addEventListener('click', () => {
    const isOpen = targets[0]?.classList.contains('is-open');
    const willOpen = !isOpen;

    targets.forEach((el) => el.classList.toggle('is-open', willOpen));
    toggleBtn.setAttribute('aria-expanded', String(willOpen));
    if (hamburgerIcon) hamburgerIcon.classList.toggle('display-none', willOpen);
    if (closeIcon) closeIcon.classList.toggle('display-none', !willOpen);
  });

  const openMenu = (item) => {
    item.classList.add(activeClass);
    item._menu?.setAttribute('aria-hidden', 'false');
    item._button?.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = (item) => {
    item.classList.remove(activeClass);
    item._menu?.setAttribute('aria-hidden', 'true');
    item._button?.setAttribute('aria-expanded', 'false');
  };

  const closeAllMenusExcept = (exceptItem) => {
    navItems.forEach((item) => {
      if (item !== exceptItem) closeMenu(item);
    });
  };

  const setupNavBehavior = () => {
    navItems.forEach((item) => {
      const button = item._button;
      const menu = item._menu;
      if (!button || !menu) return;

      // cleanup previous bindings if any (important for SPA/page transitions)
      if (item._hoverIn) item.removeEventListener('mouseenter', item._hoverIn);
      if (item._hoverOut) item.removeEventListener('mouseleave', item._hoverOut);
      button.onclick = null;

      if (isDesktop) {
        item._hoverIn = () => openMenu(item);
        item._hoverOut = () => closeMenu(item);
        item.addEventListener('mouseenter', item._hoverIn);
        item.addEventListener('mouseleave', item._hoverOut);

        button.onclick = (e) => {
          e.preventDefault();
          const isOpen = item.classList.contains(activeClass);
          if (isOpen) {
            closeMenu(item);
          } else {
            closeAllMenusExcept(item);
            openMenu(item);
          }
        };

        button.addEventListener('focusout', () => {
          // give time for focus to move into submenu if intended
          setTimeout(() => {
            if (!item.contains(document.activeElement)) closeMenu(item);
          }, 100);
        });
      } else {
        // Mobile: click to open/close, one at a time
        button.onclick = (e) => {
          e.preventDefault();
          const isOpen = item.classList.contains(activeClass);
          if (isOpen) {
            closeMenu(item);
          } else {
            closeAllMenusExcept(item);
            openMenu(item);
          }
        };
      }
    });
  };

  setupNavBehavior();

  // Debounced resize (switch behavior when breakpoint flips)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newIsDesktop = window.matchMedia('(min-width: 768px)').matches;
      if (newIsDesktop !== isDesktop) {
        isDesktop = newIsDesktop;
        setupNavBehavior();
      }
    }, 150);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    navItems.forEach((item) => {
      if (!item.contains(e.target)) closeMenu(item);
    });
  });
}

// expose for bootstrap compatibility
window.initMenu = window.initMenu || initMenu;

/* ============================================
   2) Theme Switcher (button + roving tabindex)
   ============================================ */
window.initThemeSwitcher = window.initThemeSwitcher || (() => {
  let initialized = false;
  let mqListener = null;

  return function initThemeSwitcher() {
    if (initialized) return;

    const button = document.querySelector('#theme-button');
    const menu   = document.querySelector('#theme-menu');
    const items  = menu ? Array.from(menu.querySelectorAll('.theme-option')) : [];

    // If controls aren't present on this page, don't mark initialized.
    if (!button || !menu || !items.length) return;

    initialized = true;

    const iconSystem = document.querySelector('svg[data-icon="bw"]');
    const iconLight  = document.querySelector('svg[data-icon="light"]');
    const iconDark   = document.querySelector('svg[data-icon="moon"]');

    const showIcon = (theme) => {
      [iconSystem, iconLight, iconDark].forEach((el) => el?.classList.add('display-none'));
      if (theme === 'light') iconLight?.classList.remove('display-none');
      else if (theme === 'dark') iconDark?.classList.remove('display-none');
      else iconSystem?.classList.remove('display-none');
    };

    const applyTheme = (theme) => {
      if (theme === 'light' || theme === 'dark') {
        document.documentElement.setAttribute('data-theme', theme);
        showIcon(theme);
      } else {
        const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        showIcon('system');
      }
      items.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.theme === theme)));
    };

    const setTheme = (theme) => {
      try { localStorage.setItem('theme', theme); } catch (_) {}
      applyTheme(theme);
    };

    const getStoredTheme = () => {
      try {
        const t = localStorage.getItem('theme');
        return (t === 'light' || t === 'dark' || t === 'system') ? t : 'light';
      } catch (_) { return 'light'; }
    };

    const isOpen = () => button.getAttribute('aria-expanded') === 'true';

    const openMenu = () => {
      button.setAttribute('aria-expanded', 'true');
      menu.classList.remove('display-none');
      const current = items.find((b) => b.getAttribute('aria-checked') === 'true') || items[0];
      current?.setAttribute('tabindex', '0');
      current?.focus();
    };

    const closeMenu = (opts = { restoreFocus: true }) => {
      menu.classList.add('display-none');
      button.setAttribute('aria-expanded', 'false');
      items.forEach((b) => b.setAttribute('tabindex', '-1'));
      if (opts.restoreFocus) button.focus();
    };

    const toggleMenu = () => (isOpen() ? closeMenu() : openMenu());

    // Events
    button.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !button.contains(e.target)) {
        closeMenu({ restoreFocus: false });
      }
    });

    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); openMenu();
      }
    });

    menu.addEventListener('keydown', (e) => {
      const idx = items.indexOf(document.activeElement);
      const focusAt = (i) => {
        items[i]?.setAttribute('tabindex', '0'); items[i]?.focus();
        items.forEach((b, j) => j !== i && b.setAttribute('tabindex', '-1'));
      };

      if (e.key === 'Escape') { e.preventDefault(); closeMenu({ restoreFocus: true }); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); focusAt((idx + 1) % items.length); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); focusAt((idx - 1 + items.length) % items.length); }
      else if (e.key === 'Home')      { e.preventDefault(); focusAt(0); }
      else if (e.key === 'End')       { e.preventDefault(); focusAt(items.length - 1); }
      else if (e.key === 'Tab')       { closeMenu({ restoreFocus: false }); }
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const sel = document.activeElement;
        const theme = sel?.getAttribute('data-theme');
        if (theme) setTheme(theme);
        closeMenu({ restoreFocus: true });
      }
    });

    items.forEach((el) => {
      el.addEventListener('click', () => {
        const t = el.getAttribute('data-theme');
        if (t) setTheme(t);
        closeMenu({ restoreFocus: true });
      });
    });

    // Init + OS changes (when 'system')
    applyTheme(getStoredTheme());
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mqListener = () => { if (getStoredTheme() === 'system') applyTheme('system'); };
    mq.addEventListener('change', mqListener);
  };
})();

/* ============================================
   3) Feature Bootstrap (header-only)
   ============================================ */
(function bootstrapHeader() {
  const features = [
    { name: 'menu',  selector: '#menu-toggle',  init: () => window.initMenu?.() },
    { name: 'theme', selector: '#theme-button', init: () => window.initThemeSwitcher?.() },
  ];

  const done = new Set();

  function tryInit(f) {
    if (done.has(f.name)) return;
    if (document.querySelector(f.selector)) {
      try { f.init(); done.add(f.name); }
      catch (e) { console.error('[init]', f.name, e); }
    }
  }

  const run = () => features.forEach(tryInit);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  window.addEventListener('load', run);
  document.addEventListener('astro:page-load', run);

  const debounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(run, 50); }; })();
  new MutationObserver(debounced).observe(document.documentElement, { childList: true, subtree: true });
})();
