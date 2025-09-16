
(function(){
  // Lazy-load Calendly script only when needed
  function ensureCalendly(cb){
    if (window.Calendly) return cb();
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.async = true;
    s.onload = cb;
    document.head.appendChild(s);
  }
  function openBooking(url){
    var overlay = document.getElementById('booking-overlay');
    var container = document.getElementById('booking-container');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'booking-overlay';
      overlay.innerHTML = '<div id="booking-modal"><button id="booking-close" aria-label="Sluit">&times;</button><div id="booking-container"><div class="calendly-inline-widget" data-url="" style="min-width:320px;height:100%;"></div></div></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e){
        if (e.target.id === 'booking-overlay') closeBooking();
      });
      document.getElementById('booking-close').addEventListener('click', closeBooking);
    }
    var widget = overlay.querySelector('.calendly-inline-widget');
    widget.setAttribute('data-url', url + (url.includes('?') ? '&' : '?') + 'hide_event_type_details=1&hide_gdpr_banner=1&primary_color=0b6cfb');
    ensureCalendly(function(){
      overlay.style.display = 'flex';
      // Render/refresh Calendly inline widget
      if (window.Calendly && window.Calendly.initInlineWidget) {
        // Clear and re-add container to force re-render
        var newContainer = document.createElement('div');
        newContainer.className = 'calendly-inline-widget';
        newContainer.style.minWidth = '320px';
        newContainer.style.height = '100%';
        newContainer.setAttribute('data-url', widget.getAttribute('data-url'));
        var parent = widget.parentNode;
        parent.replaceChild(newContainer, widget);
        window.Calendly.initInlineWidget({ url: newContainer.getAttribute('data-url'), parentElement: newContainer });
      }
    });
  }
  function closeBooking(){
    var overlay = document.getElementById('booking-overlay');
    if (overlay) overlay.style.display = 'none';
  }
  document.addEventListener('click', function(e){
    var el = e.target.closest('.btn-book, [data-booking], a[href*="#boek-nu"], a[href*="#book-now"]');
    if (el){
      e.preventDefault();
      var url = el.getAttribute('data-booking') || el.getAttribute('data-url') || el.getAttribute('href') || '';
      // If href is an anchor like #boek-nu, replace with default Calendly URL if data-booking missing
      if (url.startsWith('#')) url = '';
      if (!url) url = document.body.getAttribute('data-calendly') || window.CALENDLY_DEFAULT || 'https://calendly.com/your-org/afspraak';
      openBooking(url);
    }
  });
  window.OSMOSE_BOOKING = { open: openBooking, close: closeBooking };
})();