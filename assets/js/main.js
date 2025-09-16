
// Navbar burger toggle
(function(){
  const header = document.querySelector('.navbar');
  const burger = document.querySelector('.burger');
  if(burger && header){
    burger.addEventListener('click', ()=>{
      const open = header.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

// Calendly modal open/close
(function(){
  const modal = document.getElementById('calModal');
  const openBtn = document.getElementById('bookNow');
  if(!modal || !openBtn) return;
  const closeBtn = modal.querySelector('.modal-close');
  function closeModal(){ modal.classList.add('hidden'); openBtn.focus(); }
  openBtn.addEventListener('click', (e)=>{ e.preventDefault(); modal.classList.remove('hidden'); });
  closeBtn && closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !modal.classList.contains('hidden')) closeModal(); });
})();

// Body scroll lock voor modal (voorkomt rare layout shifts)
(function(){
  const modal = document.getElementById('calModal');
  const openBtn = document.getElementById('bookNow');
  if(!modal || !openBtn) return;

  const closeBtn = modal.querySelector('.modal-close');
  const open = (e) => {
    if(e) e.preventDefault();
    modal.classList.remove('hidden');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.classList.add('hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    openBtn.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) close(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !modal.classList.contains('hidden')) close(); });
})();

