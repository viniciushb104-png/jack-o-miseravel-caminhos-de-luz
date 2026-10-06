(() => {
  const STORAGE_KEY = 'jack-language';
  const DEFAULT_LANG = 'pt-BR';

  const translations = {
    'Carregando a jornada':'Loading the journey',
    'Abrindo caminho':'Opening the path',
    'CAMINHOS DE LUZ':'PATHS OF LIGHT',
    'PREPARANDO A JORNADA...':'PREPARING THE JOURNEY...',
    'Para a melhor experiência, gire o celular.':'For the best experience, rotate your phone.',
    'TEMA DE JACK':'JACK\'S THEME',
    'ATIVAR MÚSICA':'ENABLE MUSIC',
    'UM NOVO HALLOWEEN':'A NEW HALLOWEEN',
    'O MISERÁVEL':'THE MISERABLE',
    'Ajude almas perdidas a reencontrar seu caminho.':'Help lost souls find their way again.',
    'Iniciar Jornada':'Start Journey',
    'Continuar Jornada':'Continue Journey',
    'A História':'The Story',
    'Personagens':'Characters',
    'Músicas & Musical':'Music & Musical',
    'Fases':'Chapters',
    'Memórias':'Memories',
    'Créditos':'Credits',
    'Arquivo JACK':'JACK File',
    'Luz':'Light',
    'Voltar':'Back',
    'A chama mudou.':'The flame has changed.',
    'Depois dos acontecimentos de':'After the events of',
    'As regras da lanterna':'The rules of the lantern',
    'A luz revela o que foi esquecido.':'The light reveals what was forgotten.',
    'Boas ações fortalecem a chama.':'Good deeds strengthen the flame.',
    'Memórias abrem novos caminhos.':'Memories open new paths.',
    'Nenhuma alma é apenas um prêmio.':'No soul is merely a prize.',
    'Quem caminha na noite':'Those Who Walk the Night',
    'O VIAJANTE DA LANTERNA':'THE LANTERN WANDERER',
    'ANDARILHO':'WANDERER',
    'LANTERNA DE ABÓBORA':'PUMPKIN LANTERN',
    'GUIA DOS PERDIDOS':'GUIDE OF THE LOST',
    'EM REDENÇÃO':'SEEKING REDEMPTION',
    'PRÓXIMO ARQUIVO':'NEXT FILE',
    'ALMAS PERDIDAS':'LOST SOULS',
    'Histórias que ainda procuram um caminho':'Stories Still Searching for a Path',
    'EM PREPARAÇÃO':'IN PREPARATION',
    'ARQUIVO SELADO':'SEALED FILE',
    'Uma presença observa a jornada':'A Presence Watches the Journey',
    'BLOQUEADO':'LOCKED',
    'TRILHA & UNIVERSO':'SOUNDTRACK & UNIVERSE',
    'ORIGEM':'ORIGIN',
    'REPRODUZIR':'PLAY',
    'assistir aqui':'watch here',
    'TRILHA DESBLOQUEÁVEL':'UNLOCKABLE SOUNDTRACK',
    'Fonógrafo da Lanterna':'Lantern Phonograph',
    'FAIXAS ENCONTRADAS':'TRACKS FOUND',
    'ARQUIVO MUSICAL':'MUSIC ARCHIVE',
    'Nenhuma faixa selecionada':'No track selected',
    'Conclua um Halloween para acender o fonógrafo.':'Complete a Halloween chapter to light the phonograph.',
    'OUVIR':'LISTEN',
    'DESCUBRA':'DISCOVER',
    'BLOQUEADA':'LOCKED',
    'TROFÉUS':'TROPHIES',
    'Memória ainda adormecida':'Memory still dormant',
    'Não conquistada':'Not earned',
    'A Vila sem Amanhecer':'The Village Without Dawn',
    'O Bosque das Memórias':'The Forest of Memories',
    'A Estrada dos Esquecidos':'The Road of the Forgotten',
    'A Última Lanterna':'The Last Lantern',
    'A estrada ainda guarda esta memória':'The road still keeps this memory',
    'A última lanterna ainda não foi acesa':'The last lantern has not yet been lit',
    'CRÉDITOS':'CREDITS',
    'Feito à luz de uma lanterna':'Made by Lantern Light',
    'Universo, conceito, história e direção criativa':'Universe, concept, story and creative direction',
    'Projeto':'Project',
    'Formato':'Format',
    'Aventura narrativa de plataforma · Halloween · estética 16-bit':'Narrative platform adventure · Halloween · 16-bit aesthetic'
  };

  const phraseTranslations = [
    ['Jack não coleta almas. Jack ajuda pessoas.','Jack does not collect souls. Jack helps people.'],
    ['Depois dos acontecimentos de Redentor dos Perdidos, Jack descobre que carregar sua lanterna não é apenas uma condenação. A chama que um dia iluminou somente o próprio caminho agora revela trilhas para aqueles que se perderam.','After the events of Redeemer of the Lost, Jack discovers that carrying his lantern is more than a sentence. The flame that once lit only his own path now reveals trails for those who have lost their way.'],
    ['A cada Halloween, novas almas aparecem pelas estradas: algumas guardam assuntos inacabados, outras perderam as próprias memórias e algumas nem sabem que estão perdidas.','Every Halloween, new souls appear along the roads: some carry unfinished business, others have lost their memories, and some do not even know they are lost.'],
    ['Ao ajudar cada viajante, a luz de sua lanterna cresce. Halloween após Halloween, Jack começa a perceber que talvez esteja salvando mais do que os outros — talvez esteja aprendendo a encontrar o próprio caminho.','With every traveler he helps, the light of his lantern grows. Halloween after Halloween, Jack begins to realize that he may be saving more than others — he may be learning to find his own way.'],
    ['Nem santo, nem herói perfeito. Jack é um homem condenado a caminhar entre vivos e mortos até o Juízo Final — e transformou sua penitência em uma missão.','Neither saint nor flawless hero. Jack is a man condemned to walk between the living and the dead until Judgment Day — and he has turned his penance into a mission.'],
    ['Enquanto houver alguém perdido no escuro, ainda existe um caminho para iluminar.','As long as someone is lost in the dark, there is still a path to light.'],
    ['Cada alma encontrada por Jack terá sua própria ficha, memória e motivo para permanecer entre os caminhos.','Every soul Jack encounters will have its own file, memory, and reason for lingering between the paths.'],
    ['Seu nome e sua ligação com os Caminhos de Luz serão revelados em um Halloween futuro.','Its name and connection to the Paths of Light will be revealed in a future Halloween.'],
    ['O jogo continua a história do musical e transforma seus temas em exploração, pequenas escolhas, memórias e encontros. Aqui você pode assistir aos três vídeos sem sair dos Caminhos de Luz.','The game continues the musical\'s story and turns its themes into exploration, small choices, memories, and encounters. Here you can watch the videos without leaving Paths of Light.'],
    ['As músicas de cada Halloween entram para sua coleção quando Jack conclui a fase correspondente.','The songs from each Halloween enter your collection when Jack completes the corresponding chapter.'],
    ['Na vila dos esquecidos, uma luz voltou a brilhar.','In the village of the forgotten, a light shone again.'],
    ['Uma lanterna não apaga o que aconteceu. Ela ilumina o caminho depois.','A lantern does not erase what happened. It lights the path that comes after.'],
    ['Algumas lembranças criam raízes profundas.','Some memories grow deep roots.'],
    ['Toda estrada guarda os passos de alguém.','Every road keeps the footsteps of someone.'],
    ['Ainda não. Mas finalmente sei como continuar procurando.','Not yet. But I finally know how to keep searching.']
  ];

  const originalText = new WeakMap();

  function translateText(text, lang) {
    if (lang === 'pt-BR') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const exact = translations[trimmed];
    if (exact) return text.replace(trimmed, exact);
    let out = text;
    phraseTranslations.forEach(([pt,en]) => { out = out.replace(pt,en); });
    out = out.replace(/‹\s*Voltar/g, '‹ Back');
    return out;
  }

  function walkTextNodes(root, lang) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      node.nodeValue = lang === 'pt-BR' ? source : translateText(source, lang);
    });
  }

  function translateAttributes(lang) {
    document.querySelectorAll('[aria-label],[alt],[title]').forEach(el => {
      ['aria-label','alt','title'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const key = 'i18nOriginal' + attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase());
        if (!el.dataset[key]) el.dataset[key] = el.getAttribute(attr);
        const source = el.dataset[key];
        el.setAttribute(attr, lang === 'pt-BR' ? source : translateText(source, lang));
      });
    });
  }

  function updateLanguageControls(lang) {
    document.querySelectorAll('[data-jack-lang]').forEach(btn => {
      const active = btn.dataset.jackLang === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyLanguage(lang) {
    const normalized = lang === 'en' ? 'en' : 'pt-BR';
    localStorage.setItem(STORAGE_KEY, normalized);
    document.documentElement.lang = normalized;
    document.documentElement.dataset.language = normalized;
    walkTextNodes(document.body, normalized);
    translateAttributes(normalized);
    updateLanguageControls(normalized);
    document.dispatchEvent(new CustomEvent('jack:languagechange', {detail:{language:normalized}}));
  }

  function injectSwitcher() {
    if (document.getElementById('jackLanguageSwitcher')) return;
    const host = document.querySelector('.hero-layout') || document.body;
    const wrap = document.createElement('div');
    wrap.id = 'jackLanguageSwitcher';
    wrap.className = 'language-switcher';
    wrap.setAttribute('aria-label','Idioma / Language');
    wrap.innerHTML = '<span class="language-switcher__label">LANGUAGE</span><button type="button" data-jack-lang="pt-BR" aria-pressed="false">PT</button><i aria-hidden="true">/</i><button type="button" data-jack-lang="en" aria-pressed="false">EN</button>';
    host.appendChild(wrap);
    wrap.querySelectorAll('[data-jack-lang]').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.jackLang)));
  }

  function init() {
    injectSwitcher();
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved === 'en' ? 'en' : 'pt-BR';
    applyLanguage(initial);
  }

  window.JackI18n = { applyLanguage, getLanguage: () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();