
// Improved Motion Text (slower + correct spacing)
(function(){
  function prepare(el){
    if(el.dataset.motionReady==="1") return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w)=>{
      const span = document.createElement("span");
      span.textContent = w;
      span.style.opacity = "0";
      span.style.transform = "translateY(12px)";
      span.style.transition = "opacity .6s ease, transform .6s ease";
      el.appendChild(span);
    });
    el.dataset.motionReady="1";
  }
  function animate(el){
    const spans = Array.from(el.querySelectorAll("span"));
    spans.forEach((s,i)=>{
      setTimeout(()=>{ s.style.opacity="1"; s.style.transform="none"; }, 200 + i*140);
    });
  }
  const items = Array.from(document.querySelectorAll('.motion-text'));
  items.forEach(prepare);
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el=>el.querySelectorAll('span').forEach(s=>{ s.style.opacity="1"; s.style.transform="none"; s.style.transition="none"; }));
    return;
  }
  if(!('IntersectionObserver' in window)){ items.forEach(animate); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ animate(e.target); io.unobserve(e.target); } });
  }, {rootMargin:'0px 0px -10% 0px', threshold:0.1});
  items.forEach(el=>io.observe(el));
})();



// "Boek nu" -> open in new tab (no inline/popup)
;(function(){
  document.addEventListener('click', function(e){
    var el = e.target.closest('.js-book-now');
    if(!el) return;
    e.preventDefault();
    var url = 'https://calendly.com/osmose-xpert-info/ramenreiniging';
    window.open(url, '_blank', 'noopener');
  }, true);
})();
