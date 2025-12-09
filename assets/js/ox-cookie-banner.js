/**
 * OsmoseXpert Cookie Banner + GA4 consent
 * - Shows a compact banner until user accepts or declines.
 * - Default: analytics storage denied.
 * - On accept: grants analytics storage and loads GA4 with ID G-FE95SCP0KD.
 */
(function(){

  var CONSENT_KEY = "ox_cookie_consent_v1";

  // Inject banner HTML
  function createBanner() {
    var div = document.createElement('div');
    div.id = 'ox-cookie-banner';
    div.innerHTML = `
      <h3>Cookievoorkeuren</h3>
      <p>We gebruiken cookies om je ervaring te verbeteren. Door te accepteren help je ons onze diensten te verbeteren.
      Je kan later je keuze wijzigen via het cookiebeleid.</p>
      <div class="ox-actions">
        <button class="ox-btn ox-decline" id="ox-decline">Weigeren</button>
        <button class="ox-btn ox-accept" id="ox-accept">Accepteren</button>
      </div>`;
    document.body.appendChild(div);
    return div;
  }

  function setConsent(granted) {
    try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch(e){}
  }

  function getConsent(){ 
    try { return localStorage.getItem(CONSENT_KEY); } catch(e){ return null; }
  }

  // GA4 basic tag
  function loadGA() {
    if (!window.dataLayer) window.dataLayer = [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-FE95SCP0KD');
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-FE95SCP0KD';
    document.head.appendChild(s);
  }

  // Initialize default consent (denied)
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', { 'analytics_storage': 'denied' });

  // Decide flow
  var prior = getConsent();

  if (prior === 'granted') {
    // user already accepted
    gtag('consent', 'update', { 'analytics_storage': 'granted' });
    loadGA();
  } else if (prior === 'denied') {
    // user already declined -> do nothing
  } else {
    // show banner
    var banner = createBanner();
    banner.classList.add('ox-show');
    document.getElementById('ox-accept').addEventListener('click', function() {
      setConsent(true);
      gtag('consent', 'update', { 'analytics_storage': 'granted' });
      loadGA();
      banner.remove();
    });
    document.getElementById('ox-decline').addEventListener('click', function() {
      setConsent(false);
      banner.remove();
    });
  }

})();