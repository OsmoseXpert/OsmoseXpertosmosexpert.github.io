/*
 * ox-cookie-bridge.js — ensures window.oxCookieBanner.open() works everywhere.
 *
 * How it works:
 * - Exposes window.oxCookieBanner with an open() that tries several strategies:
 *   1) If a global function window.__oxcOpen exists (from your banner), call it.
 *   2) Dispatch a custom 'ox:open' event for banners that listen to it.
 *   3) Click a known toggle element (data-ox-open, #oxc-open, #oxc-mini button).
 *   4) If nothing is present, lazy-load 'assets/js/ox-cookie-banner.js' once, then retry.
 *
 * Customize BANNER_SRC below if your actual banner file lives elsewhere.
 */
(function(){
  var BANNER_SRC = 'assets/js/ox-cookie-banner.js'; // adjust if needed
  var LOADED = false;
  var RETRIES = 0;
  var MAX_RETRIES = 20; // ~2s with 100ms steps

  function tryOpen(){
    // 1) Explicit API from your banner
    if (typeof window.__oxcOpen === 'function') {
      window.__oxcOpen();
      return true;
    }

    // 2) Fire a custom event many consent managers listen for
    try {
      var ev = new CustomEvent('ox:open', {bubbles:true});
      window.dispatchEvent(ev);
      document.dispatchEvent(ev);
    } catch(e){}

    // 3) Click common toggles
    var candidates = [
      '[data-ox-open]',
      '#oxc-open',
      '#oxc-mini button',
      '.cookie-settings-btn',
      'button[aria-controls="cookie-banner"]'
    ];
    for (var i=0;i<candidates.length;i++){
      var el = document.querySelector(candidates[i]);
      if (el){ el.click(); return true; }
    }

    // None found
    return false;
  }

  function ensureLoaded(cb){
    if (LOADED || document.querySelector('script[data-ox-bridge-loaded]')) {
      cb(); return;
    }
    // If the banner script is already present, just callback
    var present = Array.from(document.scripts).some(function(s){
      return (s.src||'').indexOf('ox-cookie-banner.js') !== -1;
    });
    if (present){ cb(); return; }

    // Lazy load the banner script
    var s = document.createElement('script');
    s.src = BANNER_SRC;
    s.async = true;
    s.dataset.oxBridgeLoaded = '1';
    s.onload = function(){ LOADED = true; cb(); };
    s.onerror = function(){ cb(); };
    document.head.appendChild(s);
  }

  function openWithRetry(){
    if (tryOpen()) return;
    ensureLoaded(function(){
      // retry loop (wait for banner to attach)
      (function loop(){
        if (tryOpen()) return;
        if (++RETRIES > MAX_RETRIES) return;
        setTimeout(loop, 100);
      })();
    });
  }

  // Expose a consistent API
  window.oxCookieBanner = window.oxCookieBanner || {};
  window.oxCookieBanner.open = openWithRetry;
})();
