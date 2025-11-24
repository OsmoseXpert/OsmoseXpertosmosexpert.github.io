
(function(){
  function ready(fn){ document.readyState!=='loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    var form = document.querySelector('form#offerteForm') || document.querySelector('form[action*="formspree.io"]');
    if(!form) return;
    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if(!submitBtn) return;

    // Prevent double-binding
    if (submitBtn.__ox_hotfix_bound) return;
    submitBtn.__ox_hotfix_bound = true;

    submitBtn.addEventListener('click', function(ev){
      // Let native validation run first
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
        return; // browser will show messages
      }
      // Build FormData
      var fd = new FormData(form);
      // Figure out redirect target
      var redirect = (form.querySelector('input[name="_redirect"]') || {}).value || '/bedankt.html';
      var action = form.getAttribute('action') || 'https://formspree.io/f/xvgbjdav';
      var method = (form.getAttribute('method') || 'POST').toUpperCase();

      // Visual feedback
      var oldText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verzenden…';

      fetch(action, {
        method: method,
        headers: { 'Accept': 'application/json' },
        body: fd,
      }).then(function(res){
        // Formspree returns 200/OK for success
        if (!res.ok) throw new Error('Netwerkfout: ' + res.status);
        window.location.href = redirect;
      }).catch(function(err){
        console.error('[offerte hotfix] Submit-fout', err);
        alert('Je aanvraag kon niet worden verstuurd. Probeer later opnieuw of mail naar info@osmose-xpert.be.');
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
      });
      // IMPORTANT: do not stop the event; if other code still wants to run, fine.
      // Our fetch already went out, so even if onsubmit blocks default, we have sent it.
    }, true);
  });
})();
