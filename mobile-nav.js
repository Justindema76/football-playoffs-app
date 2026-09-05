(() => {
  'use strict';

  const APP_VIEWS = [
    ['intel','INTEL'],
    ['players','PLAYERS'],
    ['runningbacks','RUNNING BACKS'],
    ['widereceivers','WIDE RECEIVERS'],
    ['injuries','INJURIES'],
    ['weather','WEATHER'],
    ['draft','DRAFT BOARD']
  ];

  const path = location.pathname.toLowerCase();
  const onIndex = path.endsWith('/') || path.endsWith('/index.html');
  const onStudy = path.endsWith('/strategy.html');
  const onExpert = path.endsWith('/expert-picks.html');

  function appHref(view){
    return onIndex ? `#${view}` : `index.html#${view}`;
  }

  function closeMenu(){
    document.getElementById('mobileMenuToggle')?.classList.remove('open');
    document.getElementById('mobileMenuPanel')?.classList.remove('open');
    document.getElementById('mobileMenuShade')?.classList.remove('open');
    document.getElementById('mobileMenuToggle')?.setAttribute('aria-expanded','false');
  }

  function openMenu(){
    document.getElementById('mobileMenuToggle')?.classList.add('open');
    document.getElementById('mobileMenuPanel')?.classList.add('open');
    document.getElementById('mobileMenuShade')?.classList.add('open');
    document.getElementById('mobileMenuToggle')?.setAttribute('aria-expanded','true');
  }

  function activateView(view){
    if(!onIndex)return false;
    const target=document.querySelector(`.bottom-nav button[data-view="${view}"]`);
    if(!target)return false;
    target.click();
    history.replaceState(null,'',`#${view}`);
    return true;
  }

  function build(){
    const toggle=document.createElement('button');
    toggle.id='mobileMenuToggle';
    toggle.className='mobile-menu-toggle';
    toggle.type='button';
    toggle.setAttribute('aria-label','Open navigation menu');
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<span></span>';

    const shade=document.createElement('div');
    shade.id='mobileMenuShade';
    shade.className='mobile-menu-shade';

    const panel=document.createElement('nav');
    panel.id='mobileMenuPanel';
    panel.className='mobile-menu-panel';
    panel.setAttribute('aria-label','Mobile navigation');

    const activeHash=(location.hash||'#intel').slice(1).toLowerCase();
    panel.innerHTML=`
      <div class="mobile-menu-title"><b>2026 FANTASY</b><span>Draft command center</span></div>
      ${APP_VIEWS.map(([view,label])=>`<a href="${appHref(view)}" data-mobile-view="${view}" class="${onIndex&&activeHash===view?'active':''}">${label}</a>`).join('')}
      <div class="mobile-menu-separator"></div>
      <a href="strategy.html" class="study ${onStudy?'active':''}">STUDY GUIDE</a>
      <a href="expert-picks.html" class="study ${onExpert?'active':''}">EXPERT PICKS</a>`;

    document.body.append(shade,panel,toggle);

    toggle.addEventListener('click',()=>toggle.classList.contains('open')?closeMenu():openMenu());
    shade.addEventListener('click',closeMenu);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

    panel.querySelectorAll('[data-mobile-view]').forEach(link=>{
      link.addEventListener('click',e=>{
        const view=link.dataset.mobileView;
        if(activateView(view)){
          e.preventDefault();
          panel.querySelectorAll('a').forEach(a=>a.classList.remove('active'));
          link.classList.add('active');
          closeMenu();
        }
      });
    });

    if(onIndex && location.hash){
      const requested=location.hash.slice(1).toLowerCase();
      setTimeout(()=>activateView(requested),40);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
})();
