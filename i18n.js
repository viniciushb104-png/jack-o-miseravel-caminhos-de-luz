(() => {
  const STORAGE_KEY = 'jack-language';
  const DEFAULT_LANG = 'pt-BR';
  const SUPPORTED = ['pt-BR','en','es','fr','zh-CN','ko','ja'];

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
    'Aventura narrativa de plataforma · Halloween · estética 16-bit':'Narrative platform adventure · Halloween · 16-bit aesthetic',
'Jack o Miserável — Caminhos de Luz':'Jack the Miserable — Paths of Light',
    'Redentor dos Perdidos':'Redeemer of the Lost',
    'PERSONAGENS':'CHARACTERS',
    'Cada alma encontrada por Jack terá sua própria ficha, memória e motivo para permanecer entre os caminhos.':'Every soul Jack encounters will have its own file, memory, and reason for lingering between the paths.',
    'Seu nome e sua ligação com os Caminhos de Luz serão revelados em um Halloween futuro.':'Its name and connection to the Paths of Light will be revealed in a future Halloween.',
    'Jack o Miserável — Redentor dos Perdidos':'Jack the Miserable — Redeemer of the Lost',
    'Musical · Vídeo I':'Musical · Video I',
    'Musical · Vídeo II':'Musical · Video II',
    'Musical · Vídeo III':'Musical · Video III',
    'Musical · Vídeo IV':'Musical · Video IV',
    '✦ Ao reproduzir um vídeo, os outros permanecem em silêncio. Voltar ao menu encerra a reprodução.':'✦ When one video plays, the others remain silent. Returning to the menu stops playback.',
    'ARQUIVO OCULTO · CAMINHOS DE LUZ':'HIDDEN ARCHIVE · PATHS OF LIGHT',
    '??? — Tema Principal':'??? — Main Theme',
    'HALLOWEEN I · AS CASAS DOS PERDIDOS':'HALLOWEEN I · THE HOUSES OF THE LOST',
    'As Casas dos Perdidos':'The Houses of the Lost',
    'HALLOWEEN I · BATALHA FINAL':'HALLOWEEN I · FINAL BATTLE',
    'A Guardiã da Última Lanterna':'The Guardian of the Last Lantern',
    'ARQUIVO DE MEMÓRIAS · HALLOWEEN I':'MEMORY ARCHIVE · HALLOWEEN I',
    'Memórias que Ainda Brilham':'Memories That Still Shine',
    'HALLOWEEN II · A VILA SEM AMANHECER':'HALLOWEEN II · THE VILLAGE WITHOUT DAWN',
    '4:13 — A Vila sem Amanhecer':'4:13 — The Village Without Dawn',
    'HALLOWEEN II · TORRE DAS 4:13':'HALLOWEEN II · TOWER OF 4:13',
    'Engrenagens das 4:13 — A Torre sem Tempo':'Gears of 4:13 — The Timeless Tower',
    'HALLOWEEN II · O ÚLTIMO MINUTO':'HALLOWEEN II · THE LAST MINUTE',
    'O Último Minuto — A Sombra de Amélia':'The Last Minute — Amélia’s Shadow',
    'HALLOWEEN III · O BOSQUE DAS MEMÓRIAS':'HALLOWEEN III · THE FOREST OF MEMORIES',
    'HALLOWEEN III · A ÁRVORE-MÃE':'HALLOWEEN III · THE MOTHER TREE',
    'A Árvore-Mãe':'The Mother Tree',
    'HALLOWEEN III · O ARQUIVISTA ETERNO':'HALLOWEEN III · THE ETERNAL ARCHIVIST',
    'O Arquivista Eterno':'The Eternal Archivist',
    'HALLOWEEN III · LAGO DAS VOZES':'HALLOWEEN III · LAKE OF VOICES',
    'Aquilo que a Água Guarda':'What the Water Keeps',
    'HALLOWEEN IV · A PORTA QUE NÃO EXISTE':'HALLOWEEN IV · THE DOOR THAT DOESN’T EXIST',
    'A Chave Lembrou a Porta':'The Key Remembered the Door',
    'HALLOWEEN IV · ESTRADA SEM PLACAS':'HALLOWEEN IV · THE ROAD WITHOUT SIGNS',
    'HALLOWEEN IV · POVOADO SEM NOMES':'HALLOWEEN IV · THE NAMELESS SETTLEMENT',
    'Casas que Esqueceram Quem Morou Aqui':'Houses That Forgot Who Lived Here',
    'HALLOWEEN IV · CAMPO DAS PEGADAS':'HALLOWEEN IV · THE FIELD OF TRACKS',
    'Passos que Ainda se Lembram':'Footsteps That Still Remember',
    'HALLOWEEN IV · ARQUIVO RASURADO':'HALLOWEEN IV · THE REDACTED ARCHIVE',
    'Onde os Nomes Foram Cortados':'Where the Names Were Cut Away',
    'HALLOWEEN IV · PONTE DOS NINGUÉM':'HALLOWEEN IV · THE BRIDGE OF NOBODIES',
    'Quem Passou Por Aqui?':'Who Passed Through Here?',
    'HALLOWEEN IV · PRAÇA DOS NOMES ROUBADOS':'HALLOWEEN IV · THE SQUARE OF STOLEN NAMES',
    'Vozes sem Placas':'Voices Without Plaques',
    'HALLOWEEN IV · CASA DO COLETOR':'HALLOWEEN IV · THE COLLECTOR’S HOUSE',
    'Aquele que Guardava Nomes':'The One Who Kept Names',
    'HALLOWEEN IV · COLETOR · ATO I':'HALLOWEEN IV · COLLECTOR · ACT I',
    'O Coletor de Nomes':'The Collector of Names',
    'HALLOWEEN IV · COLETOR · ATO II':'HALLOWEEN IV · COLLECTOR · ACT II',
    'Sem os Nomes, Só Resta o Medo':'Without the Names, Only Fear Remains',
    'HALLOWEEN IV · COLETOR · ATO III':'HALLOWEEN IV · COLLECTOR · ACT III',
    'Você':'You',
    'HALLOWEEN IV · EPÍLOGO':'HALLOWEEN IV · EPILOGUE',
    'Mesmo sem Nome, Ainda Toca':'Even Without a Name, It Still Rings',
    'HALLOWEEN IV · A ESTRADA CONTINUA':'HALLOWEEN IV · THE ROAD CONTINUES',
    'A Estrada Continua':'The Road Continues',
    'HALLOWEEN V · A ESTRADA QUE VOLTA':'HALLOWEEN V · THE ROAD THAT RETURNS',
    'O Sino Chama Para Trás':'The Bell Calls Backward',
    'HALLOWEEN V · AS CASAS SEM ESPERA':'HALLOWEEN V · THE HOUSES WITHOUT WAITING',
    'Casas Que Ainda Esperam':'Houses That Still Wait',
    'HALLOWEEN V · O RELÓGIO SEM ONTEM':'HALLOWEEN V · THE CLOCK WITHOUT YESTERDAY',
    'O Relógio sem Ontem':'The Clock Without Yesterday',
    'HALLOWEEN V · O JARDIM DAS COISAS GUARDADAS':'HALLOWEEN V · THE GARDEN OF KEPT THINGS',
    'Aquilo que Não Precisa Ser Carregado':'What Does Not Need to Be Carried',
    'HALLOWEEN V · A CIDADE SEM JACK':'HALLOWEEN V · THE CITY WITHOUT JACK',
    'A Cidade sem Jack':'The City Without Jack',
    'HALLOWEEN V · A ENCRUZILHADA DA PROMESSA':'HALLOWEEN V · THE CROSSROADS OF THE PROMISE',
    'Para Todos Eles':'For All of Them',
    'HALLOWEEN V · O MISERÁVEL · ATO I':'HALLOWEEN V · THE MISERABLE · ACT I',
    'O Que Você Fez':'What You Did',
    'HALLOWEEN V · O MISERÁVEL · ATOS II–III':'HALLOWEEN V · THE MISERABLE · ACTS II–III',
    'O Que Você Faz Depois':'What You Do After',
    'HALLOWEEN V · EPÍLOGO':'HALLOWEEN V · EPILOGUE',
    '✦ O Fonógrafo reúne agora a trilha dos cinco Halloweens. As 33 faixas são salvas neste navegador junto com o progresso de Jack.':'✦ The Phonograph now holds the soundtrack of all five Halloweens. All 33 tracks are saved in this browser with Jack’s progress.',
    'MAPA DA JORNADA':'JOURNEY MAP',
    'Halloweens':'Halloweens',
    'Disponível · rejogar esta fase':'Available · replay this chapter',
    'Conclua o Halloween I para desbloquear':'Complete Halloween I to unlock',
    'Conclua o Halloween II para desbloquear':'Complete Halloween II to unlock',
    'Conclua o Halloween III para desbloquear':'Complete Halloween III to unlock',
    'Conclua o Halloween IV para desbloquear':'Complete Halloween IV to unlock',
    'Halloween I selecionado.':'Halloween I selected.',
    'Movimento, pulo, corrida, câmera e checkpoint já estão funcionando.':'Movement, jumping, running, camera and checkpoint are already working.',
    'GALERIA DE TROFÉUS':'TROPHY GALLERY',
    'Memórias da Jornada':'Journey Memories',
    'Cada Halloween concluído deixa uma lembrança acesa no arquivo de Jack.':'Each completed Halloween leaves a glowing memory in Jack’s archive.',
    'TEMA DAS MEMÓRIAS':'MEMORIES THEME',
    'tocar música':'play music',
    'As 4:13 ainda não passaram':'4:13 has not passed yet',
    'Bloqueada':'Locked',
    'Progresso':'Progress',
    'Menu principal':'Main menu',
    'Ativar música da tela inicial':'Enable main menu music',
    'Vídeos de Jack o Miserável':'Jack the Miserable videos',
    'Reproduzir o primeiro vídeo do musical':'Play the first musical video',
    'Reproduzir o segundo vídeo do musical':'Play the second musical video',
    'Reproduzir o terceiro vídeo do musical':'Play the third musical video',
    'Reproduzir o quarto vídeo do musical':'Play the fourth musical video',
    'Faixa anterior':'Previous track',
    'Reproduzir faixa':'Play track',
    'Próxima faixa':'Next track',
    'Posição da música':'Track position',
    'Volume da trilha':'Soundtrack volume',
    'Coleção de músicas':'Music collection',
    'Progresso de fases concluídas':'Completed chapters progress',
    'Troféus das fases':'Chapter trophies',
    ', Jack descobre que carregar sua lanterna não é apenas uma condenação. A chama que um dia iluminou somente o próprio caminho agora revela trilhas para aqueles que se perderam.':', Jack discovers that carrying his lantern is more than a sentence. The flame that once lit only his own path now reveals trails for those who have lost their way.',
    'REDENTOR DOS PERDIDOS':'REDEEMER OF THE LOST',
    'Ficha ilustrada de Jack, o viajante da lanterna, caminhando entre almas perdidas em uma noite de Halloween':'Illustrated character sheet of Jack, the lantern wanderer, walking among lost souls on a Halloween night',
    'Características de Jack':'Jack’s traits',
    'Jack o Miserável — Musical · Vídeo I':'Jack the Miserable — Musical · Video I',
    'Jack o Miserável — Musical · Vídeo II':'Jack the Miserable — Musical · Video II',
    'Jack o Miserável — Musical · Vídeo III':'Jack the Miserable — Musical · Video III',
    'Jack o Miserável — Musical · Vídeo IV':'Jack the Miserable — Musical · Video IV',
    'Troféu de Halloween I — As Casas dos Perdidos':'Halloween I Trophy — The Houses of the Lost',
    'Memória de Halloween II — Amélia Vesper e a Vila sem Amanhecer':'Halloween II Memory — Amélia Vesper and the Village Without Dawn',
    'Troféu de Halloween III — Mara Rowan e o Bosque das Memórias':'Halloween III Trophy — Mara Rowan and the Forest of Memories',
    'Troféu de Halloween IV — Jack, a Peregrina e o Sino sem Inscrição na Estrada dos Esquecidos':'Halloween IV Trophy — Jack, the Pilgrim and the Uninscribed Bell on the Road of the Forgotten',
    'Troféu de Halloween V — Jack diante da última estrada iluminada':'Halloween V Trophy — Jack before the last illuminated road',
    'Toque para entrar':'Tap to enter',
    'Desbloqueada · rejogar esta fase':'Unlocked · replay this chapter',
    'Conclua a fase para desbloquear':'Complete the chapter to unlock',
    'Faixa conquistada · pronta para ouvir':'Track unlocked · ready to play',
    'Tocando agora':'Now playing',
    'Pausar faixa':'Pause track',
    'Toque novamente para iniciar a música.':'Tap again to start the music.',
    'Não foi possível carregar esta faixa.':'This track could not be loaded.'

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
    let out = exact ? text.replace(trimmed, exact) : text;
    if (!exact) {
      phraseTranslations.forEach(([pt,en]) => { out = out.replace(pt,en); });
      out = out.replace(/‹\s*Voltar/g, '‹ Back');
    }
    if (lang !== 'en') out = window.JackLocale?.translateEnglish(out, lang) || out;
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
    const select = document.getElementById('jackLanguageSelect');
    if (select) select.value = lang;
  }

  function applyLanguage(lang) {
    const normalized = SUPPORTED.includes(lang) ? lang : 'pt-BR';
    localStorage.setItem(STORAGE_KEY, normalized);
    document.documentElement.lang = normalized;
    document.documentElement.dataset.language = normalized;
    walkTextNodes(document.body, normalized);
    translateAttributes(normalized);
    updateLanguageControls(normalized);
    const localizedTitle = {
      'pt-BR':'Jack o Miserável — Caminhos de Luz','en':'Jack the Miserable — Paths of Light',
      'es':'Jack el Miserable — Caminos de Luz','fr':'Jack le Misérable — Chemins de Lumière',
      'zh-CN':'悲惨的杰克 — 光之路','ko':'비참한 잭 — 빛의 길','ja':'哀れなジャック — 光の道'
    };
    document.title = localizedTitle[normalized] || localizedTitle['pt-BR'];
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descriptions={
        'pt-BR':'Jack o Miserável — Caminhos de Luz. Uma aventura narrativa de Halloween em estética 16-bit.',
        'en':'Jack the Miserable — Paths of Light. A Halloween narrative adventure in a 16-bit aesthetic.',
        'es':'Jack el Miserable — Caminos de Luz. Una aventura narrativa de Halloween con estética de 16 bits.',
        'fr':'Jack le Misérable — Chemins de Lumière. Une aventure narrative d’Halloween à l’esthétique 16 bits.',
        'zh-CN':'《悲惨的杰克：光之路》——16位美术风格的万圣节叙事冒险。',
        'ko':'《비참한 잭: 빛의 길》 — 16비트 감성의 할로윈 내러티브 어드벤처.',
        'ja':'『哀れなジャック：光の道』— 16ビット風のハロウィーン物語アドベンチャー。'
      };
      metaDescription.setAttribute('content', descriptions[normalized]||descriptions['pt-BR']);
    }
    document.dispatchEvent(new CustomEvent('jack:languagechange', {detail:{language:normalized}}));
  }

  function injectSwitcher() {
    if (document.getElementById('jackLanguageSwitcher')) return;
    const host = document.querySelector('.hero-layout') || document.body;
    const wrap = document.createElement('div');
    wrap.id = 'jackLanguageSwitcher';
    wrap.className = 'language-switcher';
    wrap.setAttribute('aria-label','Idioma / Language');
    wrap.innerHTML = '<span class="language-switcher__label">LANGUAGE</span><select id="jackLanguageSelect" aria-label="Idioma / Language"><option value="pt-BR">PT · Português</option><option value="en">EN · English</option><option value="es">ES · Español</option><option value="fr">FR · Français</option><option value="zh-CN">中文 · 简体</option><option value="ko">한국어</option><option value="ja">日本語</option></select>';
    host.appendChild(wrap);
    const select = wrap.querySelector('#jackLanguageSelect');
    if (select) {
      select.value = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
      select.addEventListener('change', () => applyLanguage(select.value));
    }
  }

  function init() {
    injectSwitcher();
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = SUPPORTED.includes(saved) ? saved : 'pt-BR';
    applyLanguage(initial);
    let observerQueued = false;
    const observer = new MutationObserver(records => {
      const savedLang = localStorage.getItem(STORAGE_KEY);
      const current = SUPPORTED.includes(savedLang) ? savedLang : DEFAULT_LANG;
      if (current === 'pt-BR' || observerQueued) return;
      observerQueued = true;
      requestAnimationFrame(() => {
        observerQueued = false;
        const roots = new Set();
        records.forEach(record => {
          if (record.type === 'characterData' && record.target?.parentElement) roots.add(record.target.parentElement);
          record.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) roots.add(node);
            else if (node.nodeType === Node.TEXT_NODE && node.parentElement) roots.add(node.parentElement);
          });
        });
        roots.forEach(root => walkTextNodes(root, current));
        if (roots.size) translateAttributes(current);
      });
    });
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }

  window.JackI18n = { applyLanguage, getLanguage: () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG, t: (text, lang) => translateText(text, lang || localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG), supported:SUPPORTED };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();