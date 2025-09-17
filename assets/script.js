
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