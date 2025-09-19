
// nav toggle




;(function(){
  var nav = document.querySelector('.site-nav');
  if(!nav) return;
  var btn = nav.querySelector('.nav-toggle');
  var list = nav.querySelector('#primary-nav') || nav.querySelector('.nav-list');
  if(!btn || !list) return;
  btn.addEventListener('click', function(){
    var open = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!open));
    btn.setAttribute('aria-expanded', String(!open));
  });
  list.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      nav.setAttribute('data-open','false');
      btn.setAttribute('aria-expanded','false');
    });
  });
})();

/* Cookie Banner Injection */

// === Cookie Consent Banner ===
(function(){
  var KEY = 'ox_cookie_consent_v1';
  function getConsent(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; } }
  function setConsent(data){ localStorage.setItem(KEY, JSON.stringify(data)); }
  function consentGiven(){ var c=getConsent(); return c && (c.necessary===true); }

  function applyConsent(){
    var c = getConsent();
    // Google Analytics (replace with your GA ID in data-ga-id on script tag if needed)
    if(c.analytics){
      var gaTag = document.querySelector('script[data-ga-id][type="text/plain"][data-category="analytics"]');
      if(gaTag){ var s=document.createElement('script'); s.src=gaTag.getAttribute('data-src')||gaTag.src; s.async=true; document.head.appendChild(s); }
    }
    // Meta Pixel
    if(c.marketing){
      var metaTag = document.querySelector('script[type="text/plain"][data-category="marketing"][data-pixel]');
      if(metaTag){
        var m=document.createElement('script');
        m.textContent = metaTag.textContent; 
        document.head.appendChild(m);
      }
    }
  }

  function buildBanner(){
    if(document.getElementById('ox-cookie-banner')) return;
    var wrap = document.createElement('div');
    wrap.id = 'ox-cookie-banner';
    wrap.innerHTML = [
      '<div class="oxcb-backdrop"></div>',
      '<div class="oxcb-panel" role="dialog" aria-live="polite" aria-label="Cookiekeuze">',
        '<div class="oxcb-text">',
          '<h3>Cookies bij OsmoseXpert</h3>',
          '<p>We gebruiken noodzakelijke cookies voor de site. Voor <strong>statistiek</strong> en <strong>marketing</strong> vragen we je toestemming. Lees ons <a href="/cookiebeleid.html">cookiebeleid</a>.</p>',
          '<label class="oxcb-row"><input type="checkbox" checked disabled> Noodzakelijk (altijd actief)</label>',
          '<label class="oxcb-row"><input id="oxcb-analytics" type="checkbox"> Statistiek</label>',
          '<label class="oxcb-row"><input id="oxcb-marketing" type="checkbox"> Marketing</label>',
        '</div>',
        '<div class="oxcb-actions">',
          '<button id="oxcb-decline" class="oxcb-btn oxcb-muted">Weiger</button>',
          '<button id="oxcb-accept-sel" class="oxcb-btn">Bewaar keuze</button>',
          '<button id="oxcb-accept-all" class="oxcb-btn oxcb-primary">Alles accepteren</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(wrap);

    function save(consent){
      setConsent(Object.assign({necessary:true}, consent));
      document.body.removeChild(wrap);
      applyConsent();
    }
    document.getElementById('oxcb-decline').onclick = function(){ save({analytics:false, marketing:false}); };
    document.getElementById('oxcb-accept-sel').onclick = function(){
      var a = document.getElementById('oxcb-analytics').checked;
      var m = document.getElementById('oxcb-marketing').checked;
      save({analytics:a, marketing:m});
    };
    document.getElementById('oxcb-accept-all').onclick = function(){ save({analytics:true, marketing:true}); };
  }

  // footer link to reopen settings
  function ensureManageLink(){
    var linkId = 'ox-manage-cookies';
    if(document.getElementById(linkId)) return;
    var footer = document.querySelector('footer');
    var a = document.createElement('a');
    a.id = linkId;
    a.href = '#';
    a.textContent = 'Cookie-instellingen';
    a.className = 'cookie-manage-link';
    a.addEventListener('click', function(e){ e.preventDefault(); buildBanner(); });
    if(footer){ footer.appendChild(a); }
    else { 
      var small = document.createElement('div'); 
      small.style.textAlign='center'; small.style.margin='16px'; 
      small.appendChild(a); 
      document.body.appendChild(small);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    ensureManageLink();
    if(!consentGiven()) buildBanner();
    else applyConsent();
  });
})();



/* Cookie Consent Injection (BE/GDPR) */

// === Cookie Consent (BE/GDPR) ===
(function(){
  var KEY='ox_cookie_consent_v1';
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
  function set(v){localStorage.setItem(KEY,JSON.stringify(v))}
  function apply(){
    var c=get();
    // STATISTICS (Google Analytics) – only after consent
    if(c.analytics){
      // external GA loader
      document.querySelectorAll('script[type="text/plain"][data-category="analytics"][data-src]').forEach(function(tag){
        var s=document.createElement('script'); s.async=true; s.src=tag.getAttribute('data-src'); document.head.appendChild(s);
      });
      // GA config blocks (non-src)
      document.querySelectorAll('script[type="text/plain"][data-category="analytics"]:not([data-src])').forEach(function(tag){
        var s=document.createElement('script'); s.textContent=tag.textContent; document.head.appendChild(s);
      });
    }
    // MARKETING (e.g. Meta Pixel) – only after consent
    if(c.marketing){
      document.querySelectorAll('script[type="text/plain"][data-category="marketing"]').forEach(function(tag){
        var s=document.createElement('script'); s.textContent=tag.textContent; document.head.appendChild(s);
      });
    }
  }
  function banner(){
    if(document.getElementById('ox-cookie-banner')) return;
    var w=document.createElement('div');
    w.id='ox-cookie-banner';
    w.innerHTML='\
      <div class="oxcb-panel" role="dialog" aria-live="polite" aria-label="Cookiekeuze">\
        <div class="oxcb-text">\
          <h3>Cookies bij OsmoseXpert</h3>\
          <p>We gebruiken noodzakelijke cookies om de site te laten werken. Voor <strong>statistiek</strong> en <strong>marketing</strong> vragen we je toestemming. Lees ons <a href="cookiebeleid.html">cookiebeleid</a>.</p>\
          <label class="oxcb-row"><input type="checkbox" checked disabled> Noodzakelijk (altijd actief)</label>\
          <label class="oxcb-row"><input id="oxcb-analytics" type="checkbox"> Statistiek</label>\
          <label class="oxcb-row"><input id="oxcb-marketing" type="checkbox"> Marketing</label>\
        </div>\
        <div class="oxcb-actions">\
          <button id="oxcb-decline" class="oxcb-btn">Alles weigeren</button>\
          <button id="oxcb-accept-sel" class="oxcb-btn">Bewaar keuze</button>\
          <button id="oxcb-accept-all" class="oxcb-btn oxcb-primary">Alles accepteren</button>\
        </div>\
      </div>';
    document.body.appendChild(w);
    function save(cons){ set(Object.assign({necessary:true},cons)); w.remove(); apply(); }
    document.getElementById('oxcb-decline').onclick=function(){ save({analytics:false, marketing:false}); };
    document.getElementById('oxcb-accept-sel').onclick=function(){
      save({analytics:document.getElementById('oxcb-analytics').checked,
            marketing:document.getElementById('oxcb-marketing').checked});
    };
    document.getElementById('oxcb-accept-all').onclick=function(){ save({analytics:true, marketing:true}); };
  }
  function ensureLink(){
    if(document.getElementById('ox-manage-cookies')) return;
    var footer=document.querySelector('footer');
    var a=document.createElement('a'); a.id='ox-manage-cookies'; a.href='#'; a.textContent='Cookie-instellingen'; a.className='cookie-manage-link';
    a.onclick=function(e){ e.preventDefault(); banner(); };
    if(footer) footer.appendChild(a); else document.body.appendChild(a);
  }
  document.addEventListener('DOMContentLoaded', function(){
    // inject CSS if not present
    var hasCss=[].slice.call(document.styleSheets||[]).some(function(s){return (s.href||'').indexOf('cookie-banner.css')>-1});
    if(!hasCss){ var ln=document.createElement('link'); ln.rel='stylesheet'; ln.href='assets/css/cookie-banner.css'; document.head.appendChild(ln); }
    ensureLink();
    var c=get();
    if(!c.necessary) banner(); else apply();
  });
})();

