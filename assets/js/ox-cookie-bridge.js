/*
 * ox-cookie-bridge.js — robust consent opener + fallback modal
 * - window.oxCookieBanner.open(): probeert je bestaande banner te openen.
 * - Laadt automatisch je banner vanaf gangbare paden als die nog niet aanwezig is.
 * - Werkt het dan nog niet, dan toont het een mini-consent-modal en bewaart keuzes in localStorage ('oxConsent').
 * Debug: zet window.OX_DEBUG = true in de console.
 */
(function(){
  var DEBUG = !!window.OX_DEBUG;
  function log(){ if(DEBUG) console.log.apply(console, ['[OX]', ...arguments]); }

  // Paden waar we je bannerscript verwachten. Pas gerust aan.
  var BANNER_SRCS = [
    'assets/js/ox-cookie-banner.js',
    '/assets/js/ox-cookie-banner.js',
    'cookie-banner.js',
    '/cookie-banner.js'
  ];

  function tryOpenExisting(){
    if (typeof window.__oxcOpen === 'function'){ log('Using __oxcOpen'); window.__oxcOpen(); return true; }
    if (window.oxConsentManager && typeof window.oxConsentManager.open === 'function'){ log('Using oxConsentManager.open'); window.oxConsentManager.open(); return true; }
    try {
      var ev = new CustomEvent('ox:open', {bubbles:true});
      window.dispatchEvent(ev); document.dispatchEvent(ev); log('Dispatched ox:open');
    } catch(e){}
    var selectors = ['[data-ox-open]','#oxc-open','#oxc-mini button','.cookie-settings-btn','button[aria-controls="cookie-banner"]','#cookie-banner-toggle'];
    for (var i=0;i<selectors.length;i++){ var el=document.querySelector(selectors[i]); if(el){ log('Clicking',selectors[i]); el.click(); return true; } }
    return false;
  }

  function loadOnce(src, cb){
    if (document.querySelector('script[data-ox-bridge-loaded="'+src+'"]')) { cb&&cb(); return; }
    var s = document.createElement('script'); s.src=src; s.async=true; s.dataset.oxBridgeLoaded=src;
    s.onload=function(){ log('Loaded',src); cb&&cb(); }; s.onerror=function(){ log('Failed to load',src); cb&&cb(); };
    document.head.appendChild(s);
  }

  function ensureLoadedThen(cb){
    var present = Array.from(document.scripts).some(function(s){ return (s.src||'').match(/ox-cookie-banner\.js/); });
    if (present){ log('Banner already present'); cb(); return; }
    var i=0; (function next(){ if(i>=BANNER_SRCS.length){ cb(); return; } loadOnce(BANNER_SRCS[i++], next); })();
  }

  function buildFallbackModal(){
    if (document.getElementById('oxc-fallback')) return;
    var css=document.createElement('style'); css.textContent=`
      #oxc-fallback-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999}
      #oxc-fallback{background:#fff;max-width:560px;width:92%;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-family:system-ui,Segoe UI,Inter,Arial,sans-serif}
      #oxc-fallback header{padding:16px 20px;border-bottom:1px solid #e5e7eb;font-weight:600}
      #oxc-fallback main{padding:16px 20px;line-height:1.6}
      #oxc-fallback .row{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
      #oxc-fallback .row label{font-weight:500}
      #oxc-fallback footer{display:flex;gap:8px;justify-content:flex-end;padding:16px 20px;border-top:1px solid #e5e7eb}
      #oxc-fallback button{border:none;border-radius:8px;padding:10px 14px;cursor:pointer}
      #oxc-fallback .btn-primary{background:#0f6ab8;color:#fff}
      #oxc-fallback .btn-ghost{background:transparent}
      #oxc-fallback .muted{color:#6b7280;font-size:14px}
      #oxc-fallback .switch{position:relative;display:inline-block;width:46px;height:26px}
      #oxc-fallback .switch input{opacity:0;width:0;height:0}
      #oxc-fallback .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#d1d5db;transition:.2s;border-radius:999px}
      #oxc-fallback .slider:before{position:absolute;content:"";height:22px;width:22px;left:2px;bottom:2px;background:white;transition:.2s;border-radius:999px;box-shadow:0 1px 3px rgba(0,0,0,.2)}
      #oxc-fallback input:checked + .slider{background:#0f6ab8}
      #oxc-fallback input:checked + .slider:before{transform:translateX(20px)}
    `; document.head.appendChild(css);
    var wrap=document.createElement('div'); wrap.id='oxc-fallback-backdrop'; wrap.innerHTML=`
      <div id="oxc-fallback" role="dialog" aria-modal="true" aria-labelledby="oxc-title">
        <header><div id="oxc-title">Cookie-instellingen</div></header>
        <main>
          <p class="muted">Kies welke cookies we mogen gebruiken. Noodzakelijke cookies zijn altijd actief.</p>
          <div class="row"><label>Noodzakelijk</label><span class="muted">Altijd aan</span></div>
          <div class="row">
            <label for="oxc-statistiek">Statistiek</label>
            <label class="switch"><input id="oxc-statistiek" type="checkbox"><span class="slider"></span></label>
          </div>
          <div class="row">
            <label for="oxc-marketing">Marketing</label>
            <label class="switch"><input id="oxc-marketing" type="checkbox"><span class="slider"></span></label>
          </div>
        </main>
        <footer>
          <button class="btn-ghost" id="oxc-decline">Alles weigeren</button>
          <button class="btn-primary" id="oxc-save">Opslaan</button>
        </footer>
      </div>`;
    document.body.appendChild(wrap);
    try{
      var prev=JSON.parse(localStorage.getItem('oxConsent')||'{}');
      document.getElementById('oxc-statistiek').checked=!!prev.stats;
      document.getElementById('oxc-marketing').checked=!!prev.marketing;
    }catch(e){}
    function saveConsent(stats,marketing){
      var data={necessary:true,stats:!!stats,marketing:!!marketing,ts:Date.now()};
      localStorage.setItem('oxConsent', JSON.stringify(data));
      try{ window.dispatchEvent(new CustomEvent('ox:consent',{detail:data})); }catch(e){}
    }
    document.getElementById('oxc-decline').addEventListener('click',function(){ saveConsent(false,false); document.getElementById('oxc-fallback-backdrop').remove(); location.reload(); });
    document.getElementById('oxc-save').addEventListener('click',function(){ var s=document.getElementById('oxc-statistiek').checked; var m=document.getElementById('oxc-marketing').checked; saveConsent(s,m); document.getElementById('oxc-fallback-backdrop').remove(); location.reload(); });
  }

  function openWithFallback(){
    if (tryOpenExisting()) return;
    ensureLoadedThen(function(){
      var tries=0; (function loop(){ if (tryOpenExisting()) return; if (++tries>20){ buildFallbackModal(); return; } setTimeout(loop,100); })();
    });
  }

  window.oxCookieBanner = window.oxCookieBanner || {};
  window.oxCookieBanner.open = openWithFallback;
  log('Bridge ready');
})();
