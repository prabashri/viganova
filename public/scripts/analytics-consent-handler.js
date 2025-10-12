/* eslint-disable no-underscore-dangle */
'use strict';

(function () {
  // ============================================================
  // Utilities (no globals leaked)
  // ============================================================
  const on      = (t, n, h, o) => t?.addEventListener?.(n, h, o);
  const off     = (t, n, h, o) => t?.removeEventListener?.(n, h, o);
  const $       = (s, r = document) => r.querySelector(s);
  const cookie  = {
    get(name) {
      const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      if (!m) return null;
      try { return JSON.parse(decodeURIComponent(m[1])); }
      catch { return null; }
    },
    set(name, obj, days = 365) {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      const maxAge = `; max-age=${days * 86400}`;
      document.cookie = `${name}=${encodeURIComponent(JSON.stringify(obj))}; path=/${maxAge}; SameSite=Lax${secure}`;
    },
    del(name) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    },
  };

  // ============================================================
  // 1) Consent UI (modal open/close + scroll lock)
  // Exposes: window.initConsentUI()
  // ============================================================
  window.initConsentUI = window.initConsentUI || function initConsentUI() {
    const modal   = $('#consent-modal');
    const toggler = $('#consent-toggler');
    const overlay = $('#consent-overlay');
    const btnX    = $('#consent-close');
    if (!modal || !toggler) return;

    // --- Scroll lock helpers (page position preserved)
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

    // --- Block global scroll, but allow scrolling INSIDE the modal's scroller
    let _unblock = null;
    function blockGlobalScroll(modalEl) {
    const isInside = (evtTarget) => modalEl && modalEl.contains(evtTarget);

    const preventIfOutside = (e) => {
        // Don't block if the event originates inside the modal (sheet/body)
        if (isInside(e.target)) return;
        e.preventDefault();
    };

    // Only prevent background scroll; allow modal content to scroll
    const opts = { passive: false, capture: true };
    window.addEventListener('wheel',      preventIfOutside, opts);
    window.addEventListener('touchmove',  preventIfOutside, opts);

    const keyHandler = (e) => {
        const keys = ['PageUp','PageDown','Home','End','ArrowUp','ArrowDown','Space',' '];
        if (!keys.includes(e.key)) return;
        // If focus is outside the modal, block; if inside, allow
        const ae = document.activeElement;
        if (ae && isInside(ae)) return;
        e.preventDefault();
    };
    window.addEventListener('keydown', keyHandler, { capture: true });

    // Also stop propagation from the modal's inner scroller to avoid bubbling up
    const scroller = modalEl.querySelector('.consent-body');
    if (scroller) {
        scroller.addEventListener('wheel',     (e) => e.stopPropagation(), { passive: false });
        scroller.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
    }

    _unblock = () => {
        window.removeEventListener('wheel',     preventIfOutside, opts);
        window.removeEventListener('touchmove', preventIfOutside, opts);
        window.removeEventListener('keydown',   keyHandler, { capture: true });
        if (scroller) {
        scroller.removeEventListener('wheel',     (e) => e.stopPropagation(), { passive: false });
        scroller.removeEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
        }
    };
    }
    function unblockGlobalScroll() {
    if (_unblock) { _unblock(); _unblock = null; }
    }


    const open  = () => {
        modal.classList.remove('is-hidden');
        modal.classList.add('is-open');
        lockScroll();
        blockGlobalScroll(modal);
    };
        const close = () => {
        modal.classList.remove('is-open');
        modal.classList.add('is-hidden');
        unblockGlobalScroll();
        unlockScroll();
    };

    // Useful globals for other modules if needed
    window.__consentOpen  = open;
    window.__consentClose = close;

    on(toggler, 'click', () => { document.dispatchEvent(new CustomEvent('consent:open-ui')); open(); });
    on(overlay, 'click', () => { document.dispatchEvent(new CustomEvent('consent:close-ui')); close(); });
    on(btnX, 'click', (e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('consent:close-ui')); close(); });
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) { document.dispatchEvent(new CustomEvent('consent:close-ui')); close(); } });

    // Programmatic hooks
    on(document, 'consent:open-ui', open);
    on(document, 'consent:close-ui', close);
  };

  // ============================================================
  // 2) Consent Manager (cookie storage + GA/GTM flags)
  // Exposes: window.initConsentManager()
  // Writes: window.__consent = { analytics, ads, personalized }
  // Emits: 'consent:analytics-granted' / 'consent:analytics-denied'
  // ============================================================
  window.initConsentManager = window.initConsentManager || function initConsentManager() {
    // Read compact config off the modal element
    function readConfig() {
      const modal = $('#consent-modal');
      if (!modal) return { e: false };
      try { return JSON.parse(modal.dataset.config || '{}') || { e: false }; }
      catch { return { e: false }; }
    }

    const C = readConfig();
    // If consent UI is disabled, default to granted (back-compat)
    if (!C.e) {
      window.__consent = { analytics: true, ads: true, personalized: true };
      document.dispatchEvent(new CustomEvent('consent:analytics-granted'));
      return;
    }

    // Elements
    const modal        = $('#consent-modal');
    const form         = $('#consent-form');
    const btnSave      = $('#consent-save');
    const btnAll       = $('#consent-accept-all');
    const btnNone      = $('#consent-deny-all');
    const cbAnalytics  = $('#cb-analytics');
    const cbAds        = $('#cb-ads');
    const cbPersonal   = $('#cb-personalized');

    // Cookie/version/TTL
    const cookieName = C.cn || 'consent.v1';
    const ttlDays    = Number(C.ttl || 365);
    const version    = C.v || '1';

    // Helpers
    const expired = (obj, days) => !obj?.ts || ((Date.now() - Number(obj.ts)) > days * 86400 * 1000);

    // Apply privacy flags early (works with GA or GTM)
    function applyPrivacyFlags() {
      if (typeof window.gtag === 'function') {
        if (C.up)  window.gtag('set', 'url_passthrough', true);
        if (C.ar)  window.gtag('set', 'ads_data_redaction', true);
        if (C.did) window.gtag('set', 'developer_id', C.did);
      } else {
        window.dataLayer = window.dataLayer || [];
        if (C.up)  window.dataLayer.push({ event: 'privacy_set', url_passthrough: true });
        if (C.ar)  window.dataLayer.push({ event: 'privacy_set', ads_data_redaction: true });
        if (C.did) window.dataLayer.push({ event: 'privacy_set', developer_id: C.did });
      }
    }

    // Ads personalization toggle (AdSense, if present)
    function applyAdMode(flags) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        // 0 = personalized ON, 1 = OFF (NPA)
        if (flags.ads) window.adsbygoogle.requestNonPersonalizedAds = flags.personalized ? 0 : 1;
      } catch {}
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'ads_mode',
        ads_status: flags.ads ? 'granted' : 'denied',
        ads_personalized: flags.personalized ? 'on' : 'off'
      });
    }

    // Push consent to GA/GTM + emit events
    function updateConsent(flags) {
      const out = {
        analytics_storage:       flags.analytics ? 'granted' : 'denied',
        ad_storage:              flags.ads       ? 'granted' : 'denied',
        ad_user_data:            flags.personalized ? 'granted' : 'denied',
        ad_personalization:      flags.personalized ? 'granted' : 'denied',
        functionality_storage:   'granted',
        personalization_storage: flags.personalized ? 'granted' : 'denied',
        security_storage:        'granted'
      };

      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', out);
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'consent_update', ...out });
      }

      const prev = window.__consent || {};
      window.__consent = {
        analytics: !!flags.analytics,
        ads: !!flags.ads,
        personalized: !!flags.personalized
      };

      if (!prev.analytics && flags.analytics) {
        document.dispatchEvent(new CustomEvent('consent:analytics-granted'));
      } else if (prev.analytics && !flags.analytics) {
        document.dispatchEvent(new CustomEvent('consent:analytics-denied'));
      }

      applyAdMode(flags);
      applyPrivacyFlags();
    }

    // UI <-> state
    const readUI  = () => ({
      analytics: !!cbAnalytics?.checked,
      ads: !!cbAds?.checked,
      personalized: !!cbPersonal?.checked,
      ts: Date.now(),
      v: version
    });

    const writeUI = (o) => {
      if (cbAnalytics) cbAnalytics.checked = !!o.analytics;
      if (cbAds)       cbAds.checked       = !!o.ads;
      if (cbPersonal)  cbPersonal.checked  = !!o.personalized;
    };

    // Open with saved/defaults hydrated
    const openModalHydrated = () => {
      const saved = cookie.get(cookieName);
      if (saved) writeUI(saved);
      else writeUI({
        analytics: C.an !== false,
        ads:       C.ads !== false,
        personalized: !!C.per
      });
      document.dispatchEvent(new CustomEvent('consent:open-ui'));
    };

    // Freshness & defaults
    const saved = cookie.get(cookieName);
    if (saved && (expired(saved, ttlDays) || saved.v !== version)) cookie.del(cookieName);

    const current = cookie.get(cookieName);
    if (current) {
      writeUI(current);
      updateConsent(current);
    } else {
      const defaults = {
        analytics: C.pcv ? (C.an !== false) : false,
        ads:       C.pcv ? (C.ads !== false) : false,
        personalized: false,
        ts: Date.now(),
        v: version
      };
      updateConsent(defaults);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'consent_default_applied', ...defaults });
      openModalHydrated();
    }

    // UI wiring
    on(form, 'submit', (e) => e.preventDefault());

    let delayedTimer = null;
    function delayedSaveAndClose(flags, ms = 20000) {
      if (delayedTimer) clearTimeout(delayedTimer);
      writeUI(flags);
      updateConsent(flags);
      delayedTimer = setTimeout(() => {
        cookie.set(cookieName, flags, ttlDays);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'consent_saved', ...flags });
        document.dispatchEvent(new CustomEvent('consent:close-ui'));
        delayedTimer = null;
      }, ms);
    }

    on(btnAll,  'click', () => delayedSaveAndClose({ analytics: true, ads: true,  personalized: true,  ts: Date.now(), v: version }, 20000));
    on(btnNone, 'click', () => delayedSaveAndClose({ analytics: false, ads: false, personalized: false, ts: Date.now(), v: version }, 20000));
    on(btnSave, 'click', () => {
      const f = readUI();
      if (C.forceAds === true) f.ads = true; // optional override knob
      updateConsent(f);
      cookie.set(cookieName, f, ttlDays);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'consent_saved', ...f });
      if (delayedTimer) { clearTimeout(delayedTimer); delayedTimer = null; }
      document.dispatchEvent(new CustomEvent('consent:close-ui'));
    });

    on($('#consent-toggler'), 'click', openModalHydrated);
    on(document, 'consent:close-ui', () => updateConsent(readUI()));
  };

  // ============================================================
  // 3) Analytics Events (pageview + click + submit)
  // Buffers until analytics consent is granted
  // Exposes: window.trackEvent(name, params)
  // ============================================================
  (function analyticsEvents() {
    window.dataLayer = window.dataLayer || [];
    const cfg   = window.__analyticsConfig || {};
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
      const id     = el?.dataset?.id || attr(el, 'data-id') || defaults.id || '';
      const action = el?.dataset?.action || attr(el, 'data-action') || defaults.action || '';
      const label  = el?.dataset?.label || attr(el, 'data-label') || attr(el, 'aria-label') || txt(el) || href(el) || defaults.label || '';
      const role   = attr(el, 'role') || (isA(el) ? 'link' : isB(el) ? 'button' : '');
      return {
        action,
        params: {
          event_category: 'interaction',
          event_label: label,
          cta_id: id || undefined,
          cta_action: action || undefined,
          cta_label: label || undefined,
          link_url: href(el) || undefined,
          role: role || undefined,
          value: 1
        }
      };
    }

    let lastKey = '', lastAt = 0;
    const dedup = (name, params) => {
      const k = name + JSON.stringify(params);
      const now = Date.now();
      if (k === lastKey && (now - lastAt) < 400) return false;
      lastKey = k; lastAt = now; return true;
    };

    // Buffer events pre-consent; flush when granted
    const buf = [];
    function reallySend(name, params) {
      if (USE_GTM) window.dataLayer.push({ event: name, ...params });
      else if (USE_GA) window.gtag?.('event', name, params);
    }
    function send(name, params) {
      if (!hasAnalyticsConsent()) { buf.push([name, params]); return; }
      if (!dedup(name, params)) return;
      reallySend(name, params);
    }
    on(document, 'consent:analytics-granted', () => {
      while (buf.length) {
        const [n, p] = buf.shift();
        if (!dedup(n, p)) continue;
        reallySend(n, p);
      }
    });

    // Public API
    window.trackEvent = function (name, params = {}) { send(name, params); };

    // Pageview (initial + Astro SPA navigations)
    function sendPageView() {
      const payload = {
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname + location.search + location.hash,
        transport_type: 'beacon'
      };
      send('page_view', payload);
    }
    if (document.readyState === 'complete') sendPageView();
    else on(window, 'load', sendPageView, { once: true });
    on(document, 'astro:page-load', sendPageView);

    // Clicks (with outbound detection)
    on(document, 'click', (e) => {
      const el = e.target?.closest?.('[data-id],[data-action],[data-label],a,button');
      if (!el || el.hasAttribute?.('data-analytics-skip')) return;

      const anchor   = isA(el);
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
    on(document, 'submit', (e) => {
      const el = e.target;
      if (!isF(el) || el.hasAttribute?.('data-analytics-skip')) return;
      const { action, params } = build(el, { action: 'form_submit', label: attr(el, 'name') || attr(el, 'id') || 'form' });
      params.transport_type = 'beacon';
      if (action) send(action, params);
    });
  })();

  // ============================================================
  // Bootstrap: make it run (idempotent across SPA navigations)
  // ============================================================
  (function bootstrapConsentAndAnalytics() {
    const run = () => {
      try { window.initConsentUI?.(); } catch (e) { console.error('[consent-ui]', e); }
      try { window.initConsentManager?.(); } catch (e) { console.error('[consent-manager]', e); }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }

    // Astro client-side navigations
    document.addEventListener('astro:page-load', run);
  })();
})();
