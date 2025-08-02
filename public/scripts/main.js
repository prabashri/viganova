// =======================
// 🔹 Feature: Menu Toggle
// =======================
function initMenu() {
  const toggleBtn = document.getElementById('menu-toggle');
  if (!toggleBtn) return;

  const hamburgerIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  const selector = toggleBtn.getAttribute('data-targets');

  const targets = selector
    ? selector.split(',').map((s) => document.querySelector(s.trim())).filter(Boolean)
    : [];

  const navItems = document.querySelectorAll('.nav-item.dropdown');
  if (!navItems.length) return;

  const activeClass = 'dropdown-active';
  let isDesktop = window.matchMedia('(min-width: 768px)').matches;

  navItems.forEach(item => {
    item._button = item.querySelector('button[data-action]');
    item._menu = item.querySelector('.dropdown-menu');
  });

  toggleBtn.addEventListener('click', () => {
    const isOpen = targets[0]?.classList.contains('is-open');
    const willOpen = !isOpen;

    targets.forEach(el => el.classList.toggle('is-open', willOpen));
    toggleBtn.setAttribute('aria-expanded', String(willOpen));
    hamburgerIcon?.classList.toggle('display-none', willOpen);
    closeIcon?.classList.toggle('display-none', !willOpen);
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
    navItems.forEach(item => {
      if (item !== exceptItem) closeMenu(item);
    });
  };

  const setupNavBehavior = () => {
    navItems.forEach(item => {
      const button = item._button;
      const menu = item._menu;
      if (!button || !menu) return;

      item.removeEventListener('mouseenter', item._hoverIn);
      item.removeEventListener('mouseleave', item._hoverOut);
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
          setTimeout(() => {
            if (!item.contains(document.activeElement)) closeMenu(item);
          }, 100);
        });

      } else {
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

  document.addEventListener('click', (e) => {
    navItems.forEach(item => {
      if (!item.contains(e.target)) closeMenu(item);
    });
  });
}

// =======================
// 🔹 Feature: Delay Image Loader
// =======================
function initDelayImages() {
  if (!document.querySelector('[delay-image]')) return;

  const delayedImgs = document.querySelectorAll("img[delay-image], source[delay-image]");
  delayedImgs.forEach(img => {
    const targetImg = img.tagName === "IMG" ? img : img.parentElement?.querySelector("img");
    if (!targetImg) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (targetImg.dataset.src) {
            targetImg.src = targetImg.dataset.src;
            targetImg.removeAttribute("data-src");
          }
          if (targetImg.dataset.srcset) {
            targetImg.srcset = targetImg.dataset.srcset;
            targetImg.removeAttribute("data-srcset");
          }

          const sources = targetImg.parentElement.querySelectorAll("source[delay-image]");
          sources.forEach(source => {
            if (source.dataset.srcset) {
              source.srcset = source.dataset.srcset;
              source.removeAttribute("data-srcset");
            }
          });

          targetImg.classList.remove("opacity-0");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "50px" });

    observer.observe(targetImg);
  });
}

// =======================
// 🔄 Feature Registry
// =======================
const features = [
  { selector: '#menu-toggle', init: initMenu },
  { selector: '[delay-image]', init: initDelayImages }
];

function bootstrap() {
  features.forEach(f => {
    if (document.querySelector(f.selector)) {
      f.init();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
