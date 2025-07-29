 document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('menu-toggle');

    const hamburgerIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');

    const selector = toggleBtn.getAttribute('data-targets');
	
    const targets = selector
    ? selector.split(',').map((s) => document.querySelector(s.trim())).filter(Boolean)
    : [];

    const navItems = document.querySelectorAll('.nav-item.dropdown');
    const activeClass = 'dropdown-active';
    let isDesktop = window.matchMedia('(min-width: 768px)').matches;

    // Cache dropdown buttons and menus
    navItems.forEach(item => {
      item._button = item.querySelector('button[data-action]');
      item._menu = item.querySelector('.dropdown-menu');
    });

    // Toggle mobile menu (hamburger)
     toggleBtn.addEventListener('click', () => {
        console.log('Menu toggle clicked');
      const isOpen = targets[0]?.classList.contains('is-open');
      const willOpen = !isOpen;

      targets.forEach((el) => el.classList.toggle('is-open', willOpen));
      toggleBtn.setAttribute('aria-expanded', String(willOpen));
      hamburgerIcon?.classList.toggle('display-none', willOpen);
      closeIcon?.classList.toggle('display-none', !willOpen);
    });


    // Dropdown open/close logic
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

        // Cleanup previous listeners
        item.removeEventListener('mouseenter', item._hoverIn);
        item.removeEventListener('mouseleave', item._hoverOut);
        button.onclick = null;

        if (isDesktop) {
          // Hover behavior
          item._hoverIn = () => openMenu(item);
          item._hoverOut = () => closeMenu(item);
          item.addEventListener('mouseenter', item._hoverIn);
          item.addEventListener('mouseleave', item._hoverOut);

          // Click toggles
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

          // Focus management
          button.addEventListener('focusout', (e) => {
            setTimeout(() => {
              if (!item.contains(document.activeElement)) closeMenu(item);
            }, 100);
          });

        } else {
          // Mobile click-only toggle
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

    // Initial setup
    setupNavBehavior();

    // Throttled resize listener
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

    // Close all dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      navItems.forEach(item => {
        if (!item.contains(e.target)) closeMenu(item);
      });
    });
  });