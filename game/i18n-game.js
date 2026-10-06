(() => {
  const STORAGE_KEY = 'jack-language';
  const exact = {
    'VIDA':'LIFE',
    'MÚSICA':'MUSIC',
    'PAUSAR':'PAUSE',
    'PAUSA':'PAUSE',
    'CONTINUAR':'CONTINUE',
    'RECOMEÇAR':'RESTART',
    'VOLTAR AO MENU':'BACK TO MENU',
    'MENU':'MENU',
    'PULAR':'JUMP',
    'CORRER':'RUN',
    'LUZ':'LIGHT',
    'ATACAR':'ATTACK',
    'INTERAGIR':'INTERACT',
    'OBJETIVO':'OBJECTIVE',
    'NOVO OBJETIVO':'NEW OBJECTIVE',
    'CHECKPOINT':'CHECKPOINT',
    'CHECKPOINT ACESO':'CHECKPOINT LIT',
    'MEMÓRIA':'MEMORY',
    'MEMÓRIAS':'MEMORIES',
    'FRAGMENTO':'FRAGMENT',
    'FRAGMENTOS':'FRAGMENTS',
    'BLOQUEADO':'LOCKED',
    'DESBLOQUEADO':'UNLOCKED',
    'CONCLUÍDO':'COMPLETED',
    'FASE CONCLUÍDA':'CHAPTER COMPLETE',
    'JOGAR NOVAMENTE':'PLAY AGAIN',
    'PRÓXIMA FASE':'NEXT CHAPTER',
    'VOLTAR':'BACK',
    'SIM':'YES',
    'NÃO':'NO',
    'TOQUE PARA CONTINUAR':'TAP TO CONTINUE',
    'PRESSIONE PARA CONTINUAR':'PRESS TO CONTINUE',
    'Carregando...':'Loading...',
    'Carregando':'Loading',
    'Preparando a jornada...':'Preparing the journey...',
    'Você caiu.':'You fell.',
    'Tente novamente.':'Try again.',
    'A lanterna se apagou.':'The lantern went out.',
    'Retornando ao último checkpoint...':'Returning to the last checkpoint...'
  };

  const phrases = [
    ['Iniciar Jornada','Start Journey'],
    ['Continuar Jornada','Continue Journey'],
    ['Voltar ao menu','Back to Menu'],
    ['Jogar novamente','Play Again'],
    ['Próxima fase','Next Chapter'],
    ['Fase concluída','Chapter Complete'],
    ['Memória encontrada','Memory Found'],
    ['Fragmento encontrado','Fragment Found'],
    ['Checkpoint alcançado','Checkpoint Reached'],
    ['Use a luz da lanterna','Use the lantern light'],
    ['lanterna de Jack','Jack\'s lantern'],
    ['a lanterna de Jack','Jack\'s lantern']
  ];

  const original = new WeakMap();

  function lang(){ return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'pt-BR'; }

  function tr(s){
    if (lang() !== 'en') return s;
    const t=s.trim();
    if (exact[t]) return s.replace(t,exact[t]);
    let out=s;
    phrases.forEach(([a,b])=>{ out=out.replace(a,b); });
    return out;
  }

  function translateNode(root=document.body){
    if (!root) return;
    const nodes=[];
    if (root.nodeType===Node.TEXT_NODE) nodes.push(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(n){
        if(!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p=n.parentElement;
        if(!p || ['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      if(!original.has(n)) original.set(n,n.nodeValue);
      const src=original.get(n);
      n.nodeValue=lang()==='en'?tr(src):src;
    });
    if(root.querySelectorAll){
      root.querySelectorAll('[aria-label],[title]').forEach(el=>{
        ['aria-label','title'].forEach(attr=>{
          if(!el.hasAttribute(attr)) return;
          const dataKey='jackI18n'+attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase());
          if(!el.dataset[dataKey]) el.dataset[dataKey]=el.getAttribute(attr);
          const src=el.dataset[dataKey];
          el.setAttribute(attr,lang()==='en'?tr(src):src);
        });
      });
    }
  }

  function injectSwitcher(){
    if(document.getElementById('jackPhaseLanguage')) return;
    const box=document.createElement('div');
    box.id='jackPhaseLanguage';
    box.className='jack-phase-language';
    box.innerHTML='<button type="button" data-lang="pt-BR">PT</button><span>/</span><button type="button" data-lang="en">EN</button>';
    document.body.appendChild(box);
    box.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      localStorage.setItem(STORAGE_KEY,btn.dataset.lang);
      location.reload();
    }));
    box.querySelectorAll('button').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.lang===lang()));
  }

  function addStyle(){
    if(document.getElementById('jackPhaseLanguageStyle')) return;
    const s=document.createElement('style');
    s.id='jackPhaseLanguageStyle';
    s.textContent='.jack-phase-language{position:fixed;z-index:999999;top:10px;right:10px;display:flex;align-items:center;gap:3px;padding:4px 6px;background:#080b12dc;border:1px solid #b97a2e88;box-shadow:0 4px 16px #0008;font-family:Georgia,serif}.jack-phase-language button{border:0;background:transparent;color:#8f826d;padding:4px 6px;font-weight:700;font-size:11px;cursor:pointer}.jack-phase-language button.is-active{color:#ffe0a0;text-shadow:0 0 8px #e88b24}.jack-phase-language span{color:#59452e;font-size:10px}';
    document.head.appendChild(s);
  }

  function init(){
    document.documentElement.lang=lang();
    addStyle();
    injectSwitcher();
    translateNode(document.body);
    const observer=new MutationObserver(records=>{
      if(lang()!=='en') return;
      records.forEach(r=>r.addedNodes.forEach(n=>{
        if(n.nodeType===Node.ELEMENT_NODE || n.nodeType===Node.TEXT_NODE) translateNode(n);
      }));
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  window.JackGameI18n={translateNode,getLanguage:lang};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();