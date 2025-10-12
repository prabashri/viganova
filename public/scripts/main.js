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
/* ===== Bootstrap registry ===== */
(function bootstrapFeatures(){
  const features = [
    { name:'menu',        selector:'#menu-toggle',          init: () => window.initMenu?.() },
    { name:'delayImages', selector:'[delay-image]',         init: () => window.initDelayImages?.() },
    { name:'consentUI',   selector:'#consent-modal',        init: () => window.initConsentUI?.() },
    { name:'consentMgr',  selector:'#consent-modal',        init: () => window.initConsentManager?.() },
  ];

  const done = new Set();

  function tryInit(f){
    if (done.has(f.name)) return;
    if (document.querySelector(f.selector)) {
      try { f.init(); done.add(f.name); }
      catch(e){ console.error('[init]', f.name, e); }
    }
  }
  const run = () => features.forEach(tryInit);

  // First pass (now or when DOM is ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once:true });
  } else {
    run();
  }

  // Re-run on Astro client nav + window load
  window.addEventListener('load', run, { once:false });
  document.addEventListener('astro:page-load', run);

  // Re-run when matching nodes appear (debounced)
  const debounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(run, 50); }; })();
  const mo = new MutationObserver(debounced);
  mo.observe(document.documentElement, { childList:true, subtree:true });
})();

/* ============================================
   🔧 Feature Registry (single observer)
   ============================================ */
(function () {
  // --- Consent UI (modal open/close + scroll lock)
  window.initConsentUI = window.initConsentUI || function initConsentUI(){
    const modal   = document.getElementById('consent-modal');
    const toggler = document.getElementById('consent-toggler');
    const overlay = document.getElementById('consent-overlay');
    const btnX    = document.getElementById('consent-close');
    if (!modal || !toggler) return;

    function lockScroll() {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const root = document.documentElement;
      root.dataset.scrollY = String(y);
      root.classList.add('consent-lock');
      root.style.top = `-${y}px`;
    }
    function unlockScroll() {
      const root = document.documentElement;
      const y = parseInt(root.dataset.scrollY || '0', 10) || 0;
      root.classList.remove('consent-lock');
      root.style.top = '';
      delete root.dataset.scrollY;
      window.scrollTo(0, y);
    }
    
    let _unblock = null;
    function blockGlobalScroll() {
      const prevent = (e) => { e.preventDefault(); };
      const opts = { passive: false };
      window.addEventListener('wheel', prevent, opts);
      window.addEventListener('touchmove', prevent, opts);
      window.addEventListener('keydown', (e) => {
        const keys = ['PageUp','PageDown','Home','End','ArrowUp','ArrowDown','Space',' '];
        if (keys.includes(e.key)) e.preventDefault();
      }, { capture:true });
      _unblock = () => {
        window.removeEventListener('wheel', prevent, opts);
        window.removeEventListener('touchmove', prevent, opts);
      };
    }
    function unblockGlobalScroll() { if (_unblock) { _unblock(); _unblock = null; } }

    const open  = () => { modal.classList.remove('is-hidden'); modal.classList.add('is-open'); lockScroll(); blockGlobalScroll(); };
    const close = () => { modal.classList.remove('is-open');  modal.classList.add('is-hidden'); unblockGlobalScroll(); unlockScroll(); };

    window.__consentOpen  = open;
    window.__consentClose = close;

    toggler.addEventListener('click', () => { document.dispatchEvent(new CustomEvent('consent:open-ui')); open(); });
    overlay?.addEventListener('click', () => { document.dispatchEvent(new CustomEvent('consent:close-ui')); close(); });
    btnX?.addEventListener('click', (e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('consent:close-ui')); close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) { document.dispatchEvent(new CustomEvent('consent:close-ui')); close(); }});
    document.addEventListener('consent:open-ui', open);
    document.addEventListener('consent:close-ui', close);
  };

  // --- Consent Manager (reads compact data-config)
  window.initConsentManager = window.initConsentManager || function initConsentManager(){

    function readConfig() {
      const modal = document.getElementById('consent-modal');
      if (!modal) return { e:false };
      try { return JSON.parse(modal.dataset.config || '{}') || { e:false }; }
      catch { return { e:false }; }
    }

    const C = readConfig();
    if (!C.e) { window.__consent = { analytics:true, ads:true, personalized:true }; return; }

    const modal        = document.getElementById('consent-modal');
    const form         = document.getElementById('consent-form');
    const btnSave      = document.getElementById('consent-save');
    const btnAll       = document.getElementById('consent-accept-all');
    const btnNone      = document.getElementById('consent-deny-all');
    const cbAnalytics  = document.getElementById('cb-analytics');
    const cbAds        = document.getElementById('cb-ads');
    const cbPersonal   = document.getElementById('cb-personalized');

    const cookieName = C.cn || "consent.v1";
    const ttlDays    = Number(C.ttl || 365);
    let delayedTimer = null;

    function getCookie(){
      const m = document.cookie.match(new RegExp('(?:^|; )'+cookieName+'=([^;]*)'));
      if(!m) return null;
      try { return JSON.parse(decodeURIComponent(m[1])); } catch { return null; }
    }
    function setCookie(obj){
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(obj))}; path=/; max-age=${ttlDays*86400}; SameSite=Lax${secure}`;
    }
    function delCookie(){ document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`; }
    function expired(obj, days){ return !obj?.ts || ((Date.now() - Number(obj.ts)) > days*86400*1000); }

    function applyPrivacyFlags(){
      if (typeof window.gtag === 'function') {
        if (C.up)  window.gtag('set','url_passthrough', true);
        if (C.ar)  window.gtag('set','ads_data_redaction', true);
        if (C.did) window.gtag('set','developer_id', C.did);
      } else {
        window.dataLayer = window.dataLayer || [];
        if (C.up)  window.dataLayer.push({ event:'privacy_set', url_passthrough:true });
        if (C.ar)  window.dataLayer.push({ event:'privacy_set', ads_data_redaction:true });
        if (C.did) window.dataLayer.push({ event:'privacy_set', developer_id: C.did });
      }
    }
    function applyAdMode(flags) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        if (flags.ads) window.adsbygoogle.requestNonPersonalizedAds = flags.personalized ? 0 : 1;
      } catch {}
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'ads_mode', ads_status: flags.ads ? 'granted' : 'denied', ads_personalized: flags.personalized ? 'on' : 'off' });
    }
    function updateConsent(flags){
      const out = {
        analytics_storage:       flags.analytics ? 'granted' : 'denied',
        ad_storage:              flags.ads       ? 'granted' : 'denied',
        ad_user_data:            flags.personalized ? 'granted' : 'denied',
        ad_personalization:      flags.personalized ? 'granted' : 'denied',
        functionality_storage:   'granted',
        personalization_storage: flags.personalized ? 'granted' : 'denied',
        security_storage:        'granted'
      };
      if (typeof window.gtag === 'function') window.gtag('consent','update', out);
      else { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event:'consent_update', ...out }); }

      const prev = window.__consent || {};
      window.__consent = { analytics:!!flags.analytics, ads:!!flags.ads, personalized:!!flags.personalized };
      if (!prev.analytics && flags.analytics) document.dispatchEvent(new CustomEvent('consent:analytics-granted'));
      if (prev.analytics && !flags.analytics) document.dispatchEvent(new CustomEvent('consent:analytics-denied'));

      applyAdMode(flags);
      applyPrivacyFlags();
    }

    const readUI  = () => ({ analytics: !!cbAnalytics?.checked, ads: !!cbAds?.checked, personalized: !!cbPersonal?.checked, ts: Date.now(), v: C.v || '1' });
    const writeUI = (o) => { if (cbAnalytics) cbAnalytics.checked = !!o.analytics; if (cbAds) cbAds.checked = !!o.ads; if (cbPersonal) cbPersonal.checked = !!o.personalized; };

    const openModalHydrated = () => {
      const saved = getCookie();
      if (saved) writeUI(saved);
      else writeUI({ analytics: C.an !== false, ads: C.ads !== false, personalized: !!C.per });
      document.dispatchEvent(new CustomEvent('consent:open-ui'));
    };
    const closeModal = () => { modal?.classList.remove('is-open'); modal?.classList.add('is-hidden'); };

    const saved = getCookie();
    if (saved && (expired(saved, ttlDays) || saved.v !== (C.v || '1'))) delCookie();

    const current = getCookie();
    if (current) { writeUI(current); updateConsent(current); }
    else {
      const defaults = { analytics: C.pcv ? (C.an !== false) : false, ads: C.pcv ? (C.ads !== false) : false, personalized: false };
      updateConsent(defaults);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event:'consent_default_applied', ...defaults });
      openModalHydrated();
    }

    form?.addEventListener('submit', (e)=> e.preventDefault());

    function delayedSaveAndClose(flags, ms = 20000) {
      if (delayedTimer) clearTimeout(delayedTimer);
      writeUI(flags); updateConsent(flags);
      delayedTimer = setTimeout(() => {
        setCookie(flags);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event:'consent_saved', ...flags });
        document.dispatchEvent(new CustomEvent('consent:close-ui'));
        delayedTimer = null;
      }, ms);
    }
    btnAll?.addEventListener('click', () => delayedSaveAndClose({ analytics:true, ads:true, personalized:true, ts:Date.now(), v:C.v || '1' }, 20000));
    btnNone?.addEventListener('click', () => delayedSaveAndClose({ analytics:false, ads:false, personalized:false, ts:Date.now(), v:C.v || '1' }, 20000));
    btnSave?.addEventListener('click', () => {
      const f = readUI();
      if (C.forceAds === true) f.ads = true; // optional override if you ever pass it
      updateConsent(f);
      setCookie(f);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event:'consent_saved', ...f });
      if (delayedTimer) { clearTimeout(delayedTimer); delayedTimer = null; }
      document.dispatchEvent(new CustomEvent('consent:close-ui'));
    });

    document.getElementById('consent-toggler')?.addEventListener('click', openModalHydrated);
    document.addEventListener('consent:close-ui', () => updateConsent(readUI()));
  };
})();


  /* ============================================
     📈 Analytics Events (pageview + click + submit)
     ============================================ */
  (function analyticsEvents() {
    window.dataLayer = window.dataLayer || [];
    const cfg = window.__analyticsConfig || {};
    const USE_GTM = typeof cfg.useGTM === 'boolean' ? cfg.useGTM : !!window.dataLayer;
    const USE_GA  = typeof cfg.useGA  === 'boolean' ? cfg.useGA  : typeof window.gtag === 'function';

    const txt  = (el) => (el?.innerText || el?.textContent || '').trim();
    const attr = (el, n) => el?.getAttribute?.(n) || '';
    const isA  = (el) => el?.tagName === 'A';
    const isB  = (el) => el?.tagName === 'BUTTON';
    const isF  = (el) => el?.tagName === 'FORM';
    const href = (el) => (isA(el) && attr(el, 'href')) || '';

    const hasAnalyticsConsent = () => !!(window.__consent && window.__consent.analytics === true);

    function build(el, defaults = {}) {
      const id     = el?.dataset?.id || attr(el,'data-id') || defaults.id || '';
      const action = el?.dataset?.action || attr(el,'data-action') || defaults.action || '';
      const label  = el?.dataset?.label || attr(el,'data-label') || attr(el,'aria-label') || txt(el) || href(el) || defaults.label || '';
      const role   = attr(el,'role') || (isA(el) ? 'link' : isB(el) ? 'button' : '');
      return { action, params: { event_category:'interaction', event_label:label, cta_id:id||undefined, cta_action:action||undefined, cta_label:label||undefined, link_url:href(el)||undefined, role:role||undefined, value:1 } };
    }

    let lastKey = '', lastAt = 0;
    const dedup = (name, params) => { const k = name + JSON.stringify(params); const now = Date.now(); if (k === lastKey && (now - lastAt) < 400) return false; lastKey = k; lastAt = now; return true; };

    // Buffer events before consent; flush once granted
    const buf = [];
    function reallySend(name, params){
      if (USE_GTM) window.dataLayer.push({ event: name, ...params });
      else if (USE_GA) window.gtag?.('event', name, params);
    }
    function send(name, params) {
      if (!hasAnalyticsConsent()) { buf.push([name, params]); return; }
      if (!dedup(name, params)) return;
      reallySend(name, params);
    }
    document.addEventListener('consent:analytics-granted', () => { while (buf.length) { const [n,p] = buf.shift(); if (!dedup(n,p)) continue; reallySend(n,p); }});

    // Public API + element skip hook
    window.trackEvent = function(name, params={}) { send(name, params); };

    // Pageview (initial + Astro client nav)
    function sendPageView() {
      if (!hasAnalyticsConsent()) {
        buf.push(['page_view', {
          page_title: document.title,
          page_location: location.href,
          page_path: location.pathname + location.search + location.hash,
          transport_type:'beacon'
        }]);
        return;
      }
      send('page_view', {
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname + location.search + location.hash,
        transport_type:'beacon'
      });
    }
    if (document.readyState === 'complete') sendPageView();
    else window.addEventListener('load', sendPageView, { once: true });
    document.addEventListener('astro:page-load', sendPageView);

    // Clicks (with outbound detection)
    document.addEventListener('click', (e) => {
      const el = e.target?.closest?.('[data-id],[data-action],[data-label],a,button');
      if (!el || el.hasAttribute?.('data-analytics-skip')) return;

      const anchor = isA(el);
      const external = anchor && el.hostname && el.hostname !== location.hostname;

      const def = anchor
        ? { action: external ? 'outbound_click' : 'link_click' }
        : isB(el) ? { action: 'button_click' } : { action: 'ui_click' };

      const { action, params } = build(el, def);
      if (!action) return;
      if (external) params.outbound = true;
      params.transport_type = 'beacon';
      send(action, params);
    }, { passive: true });

    // Forms
    document.addEventListener('submit', (e) => {
      const el = e.target;
      if (!isF(el) || el.hasAttribute?.('data-analytics-skip')) return;
      const { action, params } = build(el, { action: 'form_submit', label: attr(el,'name') || attr(el,'id') || 'form' });
      params.transport_type = 'beacon';
      if (action) send(action, params);
    });
  })();