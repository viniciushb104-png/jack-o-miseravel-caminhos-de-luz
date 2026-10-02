(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const hero = document.querySelector('#inicio');
  const toast = document.querySelector('#toast');
  const video = document.querySelector('#menuVideo');
  const menuMusicButton = document.querySelector('#menuMusicToggle');
  const mainThemeAudio = new Audio('assets/audio/main-theme.mp3');
  mainThemeAudio.loop = true;
  mainThemeAudio.preload = 'auto';
  mainThemeAudio.volume = 0;
  const MAIN_THEME_VOLUME = .46;
  const journey = window.JackJourney || null;
  journey?.restoreReplay();

  // Abertura de estúdio: usa os primeiros segundos para aquecer o menu
  // e carregar recursos essenciais sem segurar o jogador indefinidamente.
  const studioSplash = document.getElementById('studioSplash');
  const studioIntroAudio = new Audio('assets/audio/branding/asas-do-medo-games-intro.mp3');
  studioIntroAudio.preload = 'auto';
  studioIntroAudio.volume = .72;
  let studioSplashActive = !!studioSplash;
  const studioSplashSeenKey = 'jack-asas-do-medo-splash-seen';

  function studioWait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function studioWarmImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = src;
    });
  }

  function studioWarmAudio(audio, timeout = 1600) {
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        audio.removeEventListener('canplaythrough', finish);
        audio.removeEventListener('loadeddata', finish);
        audio.removeEventListener('error', finish);
        resolve();
      };
      audio.addEventListener('canplaythrough', finish, { once:true });
      audio.addEventListener('loadeddata', finish, { once:true });
      audio.addEventListener('error', finish, { once:true });
      try { audio.load(); } catch (_) { finish(); }
      setTimeout(finish, timeout);
    });
  }

  async function runStudioSplash() {
    if (!studioSplash) {
      studioSplashActive = false;
      return;
    }

    const alreadySeen = sessionStorage.getItem(studioSplashSeenKey) === '1';
    const minimumTime = alreadySeen ? 1450 : 3400;

    // Tenta a vinheta; se o navegador bloquear autoplay, a abertura segue normalmente.
    studioIntroAudio.currentTime = 0;
    studioIntroAudio.play().catch(() => {});

    const warmups = [
      studioWait(minimumTime),
      studioWarmImage('assets/images/menu/menu-poster.webp'),
      studioWarmAudio(mainThemeAudio, 1500)
    ];

    if (video) {
      try { video.load(); } catch (_) {}
    }

    await Promise.race([
      Promise.allSettled(warmups),
      studioWait(6000)
    ]);

    studioIntroAudio.pause();
    sessionStorage.setItem(studioSplashSeenKey, '1');
    studioSplash.classList.add('is-leaving');

    setTimeout(() => {
      studioSplash.remove();
      studioSplashActive = false;
      if (hero.style.display !== 'none' && menuMusicEnabled) playMainTheme();
    }, 780);
  }
  let menuMusicEnabled = localStorage.getItem('jack-menu-music-muted') !== '1';
  let mainThemeFadeToken = 0;

  // Tema próprio da galeria de Memórias.
  const memoriesThemeAudio = new Audio('assets/audio/memories/memories-theme.mp3');
  memoriesThemeAudio.loop = true;
  memoriesThemeAudio.preload = 'auto';
  memoriesThemeAudio.volume = 0;
  const MEMORIES_THEME_VOLUME = .42;
  let memoriesThemeFadeToken = 0;
  let memoriesMusicEnabled = localStorage.getItem('jack-memories-music-muted') !== '1';
  const memoriesMusicButton = document.getElementById('memoriesMusicToggle');

  function updateMemoriesMusicButton(state = '') {
    if (!memoriesMusicButton) return;
    const strong = memoriesMusicButton.querySelector('strong');
    const small = memoriesMusicButton.querySelector('small');
    const playing = !memoriesThemeAudio.paused && memoriesThemeAudio.volume > .02;
    memoriesMusicButton.classList.toggle('is-playing', playing);
    memoriesMusicButton.classList.toggle('is-blocked', state === 'blocked');
    memoriesMusicButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
    if (strong) strong.textContent = 'TEMA DAS MEMÓRIAS';
    if (small) {
      small.textContent = playing
        ? 'Memórias que Ainda Brilham · tocando'
        : (state === 'blocked'
          ? 'clique para ativar a música'
          : (memoriesMusicEnabled ? 'tocar música' : 'música desligada'));
    }
  }

  function animateMemoriesThemeVolume(target, duration = 700, pauseAtEnd = false) {
    const token = ++memoriesThemeFadeToken;
    const from = memoriesThemeAudio.volume;
    const started = performance.now();

    function tick(now) {
      if (token !== memoriesThemeFadeToken) return;
      const progress = Math.min(1, (now - started) / Math.max(1, duration));
      const eased = progress * (2 - progress);
      memoriesThemeAudio.volume = from + (target - from) * eased;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        memoriesThemeAudio.volume = target;
        if (pauseAtEnd && target <= .001) memoriesThemeAudio.pause();
      }
    }
    requestAnimationFrame(tick);
  }

  function playMemoriesTheme() {
    const screen = document.getElementById('memorias');
    if (!memoriesMusicEnabled || !screen?.classList.contains('active-screen')) {
      updateMemoriesMusicButton();
      return;
    }
    ++memoriesThemeFadeToken;
    memoriesThemeAudio.volume = Math.min(memoriesThemeAudio.volume || 0, .03);
    memoriesThemeAudio.play().then(() => {
      animateMemoriesThemeVolume(MEMORIES_THEME_VOLUME, 1000, false);
      updateMemoriesMusicButton();
    }).catch(() => {
      memoriesThemeAudio.pause();
      memoriesThemeAudio.volume = 0;
      updateMemoriesMusicButton('blocked');
    });
  }

  function fadeOutMemoriesTheme(duration = 420) {
    if (memoriesThemeAudio.paused) {
      memoriesThemeAudio.volume = 0;
      updateMemoriesMusicButton();
      return;
    }
    animateMemoriesThemeVolume(0, duration, true);
    setTimeout(updateMemoriesMusicButton, duration + 40);
  }

  memoriesMusicButton?.addEventListener('click', () => {
    if (!memoriesThemeAudio.paused && memoriesThemeAudio.volume > .02) {
      memoriesMusicEnabled = false;
      localStorage.setItem('jack-memories-music-muted', '1');
      fadeOutMemoriesTheme(280);
    } else {
      memoriesMusicEnabled = true;
      localStorage.setItem('jack-memories-music-muted', '0');
      playMemoriesTheme();
    }
    updateMemoriesMusicButton();
  });

  // Se o navegador bloquear autoplay ao abrir #memorias diretamente,
  // a primeira interação dentro da galeria tenta iniciar o tema novamente.
  document.getElementById('memorias')?.addEventListener('pointerdown', event => {
    if (event.target.closest('#memoriesMusicToggle')) return;
    if (memoriesMusicEnabled && memoriesThemeAudio.paused) playMemoriesTheme();
  }, { passive:true });

  updateMemoriesMusicButton();

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  const startJourneyButton = document.getElementById('startJourneyBtn');
  const continueJourneyButton = document.getElementById('continueJourneyBtn');
  const chapterTwo = document.getElementById('chapterTwo');
  const chapterThree = document.getElementById('chapterThree');
  const chapterFour = document.getElementById('chapterFour');

  function syncJourneyUI() {
    if (!journey) return;

    const active = journey.isActive();
    if (continueJourneyButton) {
      continueJourneyButton.hidden = !active;
      if (active) {
        continueJourneyButton.href = './game/' + journey.continueFile() + '?journey=1';
        const label = continueJourneyButton.querySelector('span:nth-child(2)');
        if (label) label.textContent = 'Continuar Jornada';
      }
    }

    if (chapterTwo) {
      const unlocked = journey.isPhaseUnlocked(2);
      chapterTwo.classList.toggle('chapter-card--open', unlocked);
      chapterTwo.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
      const status = chapterTwo.querySelector('[data-phase-status]');
      const arrow = chapterTwo.querySelector('[data-phase-arrow]');
      if (unlocked) {
        chapterTwo.href = './game/phase2-prototype.html?replay=1&new=1';
        if (status) status.textContent = 'Desbloqueada · rejogar esta fase';
        if (arrow) arrow.textContent = '›';
      } else {
        chapterTwo.removeAttribute('href');
        if (status) status.textContent = 'Conclua o Halloween I para desbloquear';
        if (arrow) arrow.textContent = '🔒';
      }
    }

    if (chapterThree) {
      const unlocked = journey.isPhaseUnlocked(3);
      chapterThree.classList.toggle('chapter-card--open', unlocked);
      chapterThree.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
      const status = chapterThree.querySelector('[data-phase-status]');
      const arrow = chapterThree.querySelector('[data-phase-arrow]');
      if (unlocked) {
        chapterThree.href = './game/phase3.html?replay=1&new=1';
        if (status) status.textContent = 'Desbloqueada · protótipo jogável';
        if (arrow) arrow.textContent = '›';
      } else {
        chapterThree.removeAttribute('href');
        if (status) status.textContent = 'Conclua o Halloween II para desbloquear';
        if (arrow) arrow.textContent = '🔒';
      }
    }

    if (chapterFour) {
      const unlocked = journey.isPhaseUnlocked(4);
      chapterFour.classList.toggle('chapter-card--open', unlocked);
      chapterFour.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
      const status = chapterFour.querySelector('[data-phase-status]');
      const arrow = chapterFour.querySelector('[data-phase-arrow]');
      if (unlocked) {
        chapterFour.href = './game/phase4.html?replay=1&new=1';
        if (status) status.textContent = 'Desbloqueada · protótipo jogável';
        if (arrow) arrow.textContent = '›';
      } else {
        chapterFour.removeAttribute('href');
        if (status) status.textContent = 'Conclua o Halloween III para desbloquear';
        if (arrow) arrow.textContent = '🔒';
      }
    }
  }

  function openJourneyWithLight(href, message = 'PREPARANDO A JORNADA...') {
    const loader = document.getElementById('journeyTransitionLoader');
    if (!loader) { location.href = href; return; }
    const copy = loader.querySelector('[data-loader-message]');
    const jack = loader.querySelector('.loader-jack');
    const fill = loader.querySelector('.loader-fill');
    const flash = loader.querySelector('.loader-flash');
    if (copy) copy.textContent = message;
    if (fill) fill.style.width = '78%';
    loader.classList.add('is-active');
    fadeOutMainTheme(420);
    fadeOutMemoriesTheme(320);
    requestAnimationFrame(() => { if (fill) fill.style.width = '100%'; });
    setTimeout(() => {
      jack?.classList.remove('run');
      jack?.classList.add('lift');
      if (copy) copy.textContent = 'CAMINHO ILUMINADO';
    }, 430);
    setTimeout(() => flash?.classList.add('go'), 820);
    setTimeout(() => { location.href = href; }, 1080);
  }

  startJourneyButton?.addEventListener('click', () => {
    if (journey?.isActive()) {
      const restart = window.confirm('Iniciar uma nova jornada? O ponto atual da Jornada será reiniciado. Fases, troféus, memórias e músicas já conquistados continuarão salvos.');
      if (!restart) return;
    }
    journey?.startNew();
    openJourneyWithLight('./game/phase1.html?journey=1&new=1', 'INICIANDO UMA NOVA JORNADA...');
  });

  continueJourneyButton?.addEventListener('click', event => {
    event.preventDefault();
    const href = continueJourneyButton.href;
    if (!href) return;
    openJourneyWithLight(href, 'RETOMANDO SEU CAMINHO...');
  });

  chapterTwo?.addEventListener('click', event => {
    if (chapterTwo.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      showToast('Conclua o Halloween I para abrir A Vila sem Amanhecer.');
    }
  });

  chapterThree?.addEventListener('click', event => {
    if (chapterThree.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      showToast('Conclua o Halloween II para abrir O Bosque das Memórias.');
    }
  });

  chapterFour?.addEventListener('click', event => {
    if (chapterFour.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      showToast('Conclua o Halloween III para abrir A Estrada dos Esquecidos.');
    }
  });

  syncJourneyUI();
  window.addEventListener('pageshow', syncJourneyUI);
  window.addEventListener('storage', syncJourneyUI);
  document.querySelector('[data-target="fases"]')?.addEventListener('click', syncJourneyUI);

  function updateMenuMusicButton(state = '') {
    if (!menuMusicButton) return;
    const copy = menuMusicButton.querySelector('.menu-music-copy strong');
    const playing = !mainThemeAudio.paused && mainThemeAudio.volume > .02;
    menuMusicButton.classList.toggle('is-playing', playing);
    menuMusicButton.classList.toggle('is-blocked', state === 'blocked');
    menuMusicButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
    menuMusicButton.setAttribute('aria-label', playing ? 'Silenciar música da tela inicial' : 'Ativar música da tela inicial');
    if (copy) copy.textContent = playing ? 'MÚSICA LIGADA' : (state === 'blocked' ? 'ATIVAR MÚSICA' : (menuMusicEnabled ? 'TOCAR TEMA' : 'MÚSICA DESLIGADA'));
  }

  function animateMainThemeVolume(target, duration = 650, pauseAtEnd = false) {
    const token = ++mainThemeFadeToken;
    const from = mainThemeAudio.volume;
    const started = performance.now();

    function tick(now) {
      if (token !== mainThemeFadeToken) return;
      const progress = Math.min(1, (now - started) / Math.max(1, duration));
      const eased = progress * (2 - progress);
      mainThemeAudio.volume = from + (target - from) * eased;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        mainThemeAudio.volume = target;
        if (pauseAtEnd && target <= .001) mainThemeAudio.pause();
        updateMenuMusicButton();
      }
    }
    requestAnimationFrame(tick);
  }

  function playMainTheme() {
    if (studioSplashActive || !menuMusicEnabled || hero.style.display === 'none') return;
    ++mainThemeFadeToken;
    mainThemeAudio.volume = Math.min(mainThemeAudio.volume, .04);
    mainThemeAudio.play().then(() => {
      animateMainThemeVolume(MAIN_THEME_VOLUME, 900, false);
      updateMenuMusicButton();
    }).catch(() => {
      updateMenuMusicButton('blocked');
    });
  }

  function fadeOutMainTheme(duration = 500) {
    if (mainThemeAudio.paused) {
      mainThemeAudio.volume = 0;
      updateMenuMusicButton();
      return;
    }
    animateMainThemeVolume(0, duration, true);
  }

  function openScreen(id) {
    if (id === 'inicio') {
      fadeOutMemoriesTheme(320);
      screens.forEach(screen => screen.classList.remove('active-screen'));
      hero.style.display = '';
      history.replaceState(null, '', '#inicio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      stopMusicalVideos();
      if (typeof pauseSoundtrack === 'function') pauseSoundtrack();
      if (menuMusicEnabled) playMainTheme();
      return;
    }

    fadeOutMainTheme(420);

    const target = document.getElementById(id);
    if (!target) return;

    hero.style.display = 'none';
    screens.forEach(screen => screen.classList.toggle('active-screen', screen === target));
    history.replaceState(null, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (id === 'memorias') {
      if (typeof pauseSoundtrack === 'function') pauseSoundtrack();
      playMemoriesTheme();
    } else {
      fadeOutMemoriesTheme(300);
    }
  }

  document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', () => openScreen(button.dataset.target));
  });

  let jackProfileLoading = null;
  function loadJackProfileArt() {
    const img = document.querySelector('#jackProfileArt');
    if (!img || img.src || jackProfileLoading) return jackProfileLoading;

    const parts = Array.from({ length: 7 }, (_, i) =>
      'assets/images/characters/jack-profile.' + (i + 1) + '.b64'
    );

    jackProfileLoading = Promise.all(parts.map(path =>
      fetch(path).then(response => {
        if (!response.ok) throw new Error('Falha ao carregar arte do Jack');
        return response.text();
      })
    )).then(chunks => {
      img.src = 'data:image/webp;base64,' + chunks.join('');
      img.addEventListener('load', () => {
        img.closest('.jack-character-art')?.classList.add('is-ready');
      }, { once: true });
    }).catch(() => {
      const loading = img.closest('.jack-character-art')?.querySelector('.character-art-loading strong');
      if (loading) loading.textContent = 'A ARTE SE PERDEU NA NÉVOA';
    });

    return jackProfileLoading;
  }

  document.querySelector('[data-target="personagens"]')?.addEventListener('click', loadJackProfileArt);
  if (location.hash === '#personagens') loadJackProfileArt();

  const phaseMemoryKeys = [
    ['jack-phase1-complete','yes'],
    ['jack-phase2-complete','yes'],
    ['jack-phase3-complete','yes'],
    ['jack-phase4-complete','yes'],
    ['jack-phase5-complete','yes']
  ];

  function completedPhaseMemories(){
    return phaseMemoryKeys.filter(([key,value]) => localStorage.getItem(key) === value).length;
  }

  function syncMemoryTrophies(){
    const total=phaseMemoryKeys.length;
    const completed=completedPhaseMemories();

    const memoryCounter=document.querySelector('#memoryCount');
    if(memoryCounter) memoryCounter.textContent=completed+'/'+total;

    const trophyProgress=document.querySelector('#trophyProgress');
    if(trophyProgress) trophyProgress.textContent=completed+'/'+total;

    document.querySelectorAll('[data-memory-trophy]').forEach(card=>{
      const key=card.dataset.completeKey;
      const expected=card.dataset.completeValue || 'yes';
      const unlocked=localStorage.getItem(key)===expected;
      card.classList.toggle('is-unlocked',unlocked);
      card.classList.toggle('is-locked',!unlocked);

      const art=card.querySelector('[data-trophy-art]');
      const status=card.querySelector('.memory-trophy-status');
      const lock=card.querySelector('.memory-trophy-lock');

      if(unlocked){
        if(art && !art.src && art.dataset.src) art.src=art.dataset.src;
        if(status) status.textContent='✦ Memória resgatada';
        if(lock) lock.setAttribute('aria-hidden','true');
      }else{
        if(art) art.removeAttribute('src');
        if(status) status.textContent=Number(card.dataset.phase)===1?'Conclua a fase para desbloquear':'Bloqueada';
      }
    });
  }

  syncMemoryTrophies();

  // Se o jogador voltar para a página após concluir uma fase em outra aba/tela,
  // a galeria se atualiza sem precisar apagar o progresso.
  window.addEventListener('pageshow',syncMemoryTrophies);
  window.addEventListener('storage',syncMemoryTrophies);
  document.querySelector('[data-target="memorias"]')?.addEventListener('click',syncMemoryTrophies);

  const lightLevel = Math.max(1, Number(localStorage.getItem('jack-light-level') || 1));
  const lightCounter = document.querySelector('#lightLevel');
  if (lightCounter) lightCounter.textContent = String(lightLevel).padStart(2, '0');

  // O poster permanece atrás do vídeo. Se o arquivo ainda não existir,
  // o site continua bonito e funcional apenas com a imagem estática.
  if (video) {
    const fail = () => {
      video.style.display = 'none';
      document.documentElement.classList.add('video-unavailable');
    };
    // Só escondemos o vídeo se o elemento inteiro falhar.
    // Um source opcional (como WebM) pode dar 404 e o navegador ainda
    // deve continuar normalmente para o MP4.
    video.addEventListener('error', fail);
    video.addEventListener('loadeddata', () => {
      document.documentElement.classList.add('video-ready');
    }, { once: true });
    video.play().catch(() => {
      // Autoplay pode ser bloqueado em alguns navegadores; o poster assume o fundo.
    });
  }

  if (menuMusicButton) {
    menuMusicButton.addEventListener('click', () => {
      if (!mainThemeAudio.paused && mainThemeAudio.volume > .02) {
        menuMusicEnabled = false;
        localStorage.setItem('jack-menu-music-muted', '1');
        fadeOutMainTheme(350);
      } else {
        menuMusicEnabled = true;
        localStorage.setItem('jack-menu-music-muted', '0');
        playMainTheme();
      }
      updateMenuMusicButton();
    });
  }
  updateMenuMusicButton();

  // Tentamos iniciar o tema. Navegadores que exigem gesto do usuário
  // mantêm o botão "ATIVAR MÚSICA" visível, sem quebrar a experiência.
  if (menuMusicEnabled && !location.hash.replace('#', '')) {
    playMainTheme();
  }

  // Videoteca do musical: o iframe do YouTube só é criado depois do clique.
  // Mantemos apenas um player ativo por vez para evitar áudio concorrente.
  const musicalFrames = [...document.querySelectorAll('.video-frame[data-youtube-id]')];

  function stopMusicalVideos(except = null) {
    musicalFrames.forEach(frame => {
      if (frame === except) return;
      const iframe = frame.querySelector('iframe');
      if (iframe) iframe.remove();
      frame.classList.remove('is-playing');
    });
  }

  musicalFrames.forEach(frame => {
    const playButton = frame.querySelector('.video-play');
    if (!playButton) return;

    playButton.addEventListener('click', () => {
      const id = frame.dataset.youtubeId;
      const title = frame.dataset.videoTitle || 'Vídeo do musical';
      if (!id) return;

      stopMusicalVideos(frame);
      fadeOutMainTheme(250);

      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;

      frame.appendChild(iframe);
      frame.classList.add('is-playing');
    });
  });

  document.querySelectorAll('[data-target]').forEach(control => {
    control.addEventListener('click', () => {
      if (control.dataset.target !== 'musical') stopMusicalVideos();
    });
  });

  // Fonógrafo da Lanterna: faixas são liberadas pelo progresso salvo do jogo.
  const soundtrackTracks = [
    {
      phase: 1,
      secret: true,
      chapter: 'TEMA PRINCIPAL · CAMINHOS DE LUZ',
      title: 'Caminhos de Luz — Tema de Jack',
      lockedChapter: 'ARQUIVO OCULTO · CAMINHOS DE LUZ',
      lockedTitle: '??? — Tema Principal',
      src: 'assets/audio/main-theme.mp3'
    },
    {
      phase: 1,
      chapter: 'HALLOWEEN I · AS CASAS DOS PERDIDOS',
      title: 'As Casas dos Perdidos',
      src: 'assets/audio/phase1/phase1-theme.mp3'
    },
    {
      phase: 1,
      chapter: 'HALLOWEEN I · BATALHA FINAL',
      title: 'A Guardiã da Última Lanterna',
      src: 'assets/audio/phase1/phase1-boss.mp3'
    },
    {
      phase: 1,
      chapter: 'ARQUIVO DE MEMÓRIAS · HALLOWEEN I',
      title: 'Memórias que Ainda Brilham',
      src: 'assets/audio/memories/memories-theme.mp3'
    },
    {
      phase: 2,
      chapter: 'HALLOWEEN II · A VILA SEM AMANHECER',
      title: '4:13 — A Vila sem Amanhecer',
      src: 'assets/audio/phase2/phase2-village-413.mp3'
    },
    {
      phase: 2,
      chapter: 'HALLOWEEN II · TORRE DAS 4:13',
      title: 'Engrenagens das 4:13 — A Torre sem Tempo',
      src: 'assets/audio/phase2/phase2-clock-tower.mp3'
    },
    {
      phase: 2,
      chapter: 'HALLOWEEN II · O ÚLTIMO MINUTO',
      title: 'O Último Minuto — A Sombra de Amélia',
      src: 'assets/audio/phase2/phase2-boss-last-minute.mp3'
    },
    {
      phase: 3,
      chapter: 'HALLOWEEN III · O BOSQUE DAS MEMÓRIAS',
      title: 'O Bosque das Memórias',
      src: 'assets/phase3/audio/music/phase3-memory-forest-theme.mp3'
    },
    {
      phase: 3,
      chapter: 'HALLOWEEN III · A ÁRVORE-MÃE',
      title: 'A Árvore-Mãe',
      src: 'assets/phase3/audio/music/phase3-mother-tree-theme.mp3'
    },
    {
      phase: 3,
      chapter: 'HALLOWEEN III · O ARQUIVISTA ETERNO',
      title: 'O Arquivista Eterno',
      src: 'assets/phase3/audio/music/phase3-archivist-theme.mp3'
    },
    {
      phase: 3,
      chapter: 'HALLOWEEN III · LAGO DAS VOZES',
      title: 'Aquilo que a Água Guarda',
      src: 'assets/phase3/audio/music/phase3-aquilo-que-a-agua-guarda.mp3'
    }
  ];

  const soundtrackAudio = new Audio();
  soundtrackAudio.preload = 'metadata';
  soundtrackAudio.volume = .68;
  let soundtrackIndex = -1;

  const soundtrackUI = {
    player: document.querySelector('#soundtrackPlayer'),
    unlocked: document.querySelector('#soundtrackUnlocked'),
    chapter: document.querySelector('#soundtrackChapter'),
    name: document.querySelector('#soundtrackName'),
    status: document.querySelector('#soundtrackStatus'),
    disc: document.querySelector('#soundtrackDisc'),
    play: document.querySelector('#soundtrackPlay'),
    prev: document.querySelector('#soundtrackPrev'),
    next: document.querySelector('#soundtrackNext'),
    seek: document.querySelector('#soundtrackSeek'),
    current: document.querySelector('#soundtrackCurrent'),
    duration: document.querySelector('#soundtrackDuration'),
    volume: document.querySelector('#soundtrackVolume'),
    tracks: [...document.querySelectorAll('.soundtrack-track[data-track-index]')]
  };

  function phaseIsCleared(phase) {
    if (phase === 1) return localStorage.getItem('jack-phase1-complete') === 'yes';
    return localStorage.getItem('jack-phase' + phase + '-complete') === 'yes';
  }

  function formatAudioTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + String(secs).padStart(2, '0');
  }

  function unlockedTrackIndexes() {
    return soundtrackTracks.map((track, index) => phaseIsCleared(track.phase) ? index : -1).filter(index => index >= 0);
  }

  function refreshSoundtrackUnlocks() {
    const unlocked = unlockedTrackIndexes();
    if (soundtrackUI.unlocked) soundtrackUI.unlocked.textContent = unlocked.length + '/' + soundtrackTracks.length;

    soundtrackUI.tracks.forEach(button => {
      const index = Number(button.dataset.trackIndex);
      const track = soundtrackTracks[index];
      const open = !!track && phaseIsCleared(track.phase);
      button.disabled = !open;
      button.classList.toggle('is-unlocked', open);
      const state = button.querySelector('.track-state');
      const action = button.querySelector('.track-action');
      const small = button.querySelector('.track-copy small');
      const strong = button.querySelector('.track-copy strong');
      if (state) state.textContent = open ? '✦' : '🔒';
      if (action) action.textContent = open ? 'OUVIR' : (track.secret ? 'DESCUBRA' : 'BLOQUEADA');
      if (small) small.textContent = open ? track.chapter : (track.lockedChapter || track.chapter);
      if (strong) strong.textContent = open ? track.title : (track.lockedTitle || track.title);
      button.setAttribute('aria-label', open ? 'Ouvir ' + track.title : (track.secret ? 'Faixa secreta — conclua o Halloween ' + track.phase + ' para revelar' : track.title + ' — bloqueada até concluir o Halloween ' + track.phase));
    });

    if (soundtrackUI.play) soundtrackUI.play.disabled = unlocked.length === 0;
    if (soundtrackUI.prev) soundtrackUI.prev.disabled = unlocked.length < 2;
    if (soundtrackUI.next) soundtrackUI.next.disabled = unlocked.length < 2;
    if (soundtrackUI.seek) soundtrackUI.seek.disabled = unlocked.length === 0;

    if (unlocked.length && soundtrackIndex < 0) {
      soundtrackIndex = unlocked[0];
      const first = soundtrackTracks[soundtrackIndex];
      soundtrackAudio.src = first.src;
      if (soundtrackUI.chapter) soundtrackUI.chapter.textContent = first.chapter;
      if (soundtrackUI.name) soundtrackUI.name.textContent = first.title;
      if (soundtrackUI.status) soundtrackUI.status.textContent = 'Faixa conquistada · pronta para ouvir';
      soundtrackUI.tracks[soundtrackIndex]?.classList.add('is-selected');
    }
  }

  function selectSoundtrack(index, autoplay = false) {
    const track = soundtrackTracks[index];
    if (!track || !phaseIsCleared(track.phase)) return;
    const changed = soundtrackIndex !== index;
    soundtrackIndex = index;
    if (changed || !soundtrackAudio.src) {
      soundtrackAudio.src = track.src;
      soundtrackAudio.load();
    }
    soundtrackUI.tracks.forEach((button, i) => button.classList.toggle('is-selected', i === index));
    if (soundtrackUI.chapter) soundtrackUI.chapter.textContent = track.chapter;
    if (soundtrackUI.name) soundtrackUI.name.textContent = track.title;
    if (soundtrackUI.status) soundtrackUI.status.textContent = autoplay ? 'Tocando agora' : 'Faixa conquistada · pronta para ouvir';
    if (soundtrackUI.seek) soundtrackUI.seek.value = '0';
    if (soundtrackUI.current) soundtrackUI.current.textContent = '0:00';
    if (autoplay) playSoundtrack();
  }

  function playSoundtrack() {
    const unlocked = unlockedTrackIndexes();
    if (!unlocked.length) return;
    if (soundtrackIndex < 0 || !unlocked.includes(soundtrackIndex)) selectSoundtrack(unlocked[0], false);
    stopMusicalVideos();
    fadeOutMainTheme(250);
    fadeOutMemoriesTheme(250);
    soundtrackAudio.play().then(() => {
      if (soundtrackUI.play) {
        soundtrackUI.play.textContent = '❚❚';
        soundtrackUI.play.setAttribute('aria-label', 'Pausar faixa');
      }
      soundtrackUI.disc?.classList.add('is-spinning');
      if (soundtrackUI.status) soundtrackUI.status.textContent = 'Tocando agora';
    }).catch(() => {
      if (soundtrackUI.status) soundtrackUI.status.textContent = 'Toque novamente para iniciar a música.';
    });
  }

  function pauseSoundtrack() {
    soundtrackAudio.pause();
    if (soundtrackUI.play) {
      soundtrackUI.play.textContent = '▶';
      soundtrackUI.play.setAttribute('aria-label', 'Reproduzir faixa');
    }
    soundtrackUI.disc?.classList.remove('is-spinning');
    if (soundtrackIndex >= 0 && soundtrackUI.status) soundtrackUI.status.textContent = 'Pausada';
  }

  function stepSoundtrack(direction) {
    const unlocked = unlockedTrackIndexes();
    if (!unlocked.length) return;
    const position = Math.max(0, unlocked.indexOf(soundtrackIndex));
    const next = unlocked[(position + direction + unlocked.length) % unlocked.length];
    selectSoundtrack(next, true);
  }

  soundtrackUI.tracks.forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.trackIndex);
      if (!Number.isInteger(index) || !phaseIsCleared(soundtrackTracks[index]?.phase)) return;
      selectSoundtrack(index, true);
    });
  });

  soundtrackUI.play?.addEventListener('click', () => soundtrackAudio.paused ? playSoundtrack() : pauseSoundtrack());
  soundtrackUI.prev?.addEventListener('click', () => stepSoundtrack(-1));
  soundtrackUI.next?.addEventListener('click', () => stepSoundtrack(1));
  soundtrackUI.volume?.addEventListener('input', () => {
    soundtrackAudio.volume = Math.max(0, Math.min(1, Number(soundtrackUI.volume.value) / 100));
  });
  soundtrackUI.seek?.addEventListener('input', () => {
    if (!Number.isFinite(soundtrackAudio.duration) || soundtrackAudio.duration <= 0) return;
    soundtrackAudio.currentTime = (Number(soundtrackUI.seek.value) / 1000) * soundtrackAudio.duration;
  });

  soundtrackAudio.addEventListener('loadedmetadata', () => {
    if (soundtrackUI.duration) soundtrackUI.duration.textContent = formatAudioTime(soundtrackAudio.duration);
  });
  soundtrackAudio.addEventListener('timeupdate', () => {
    if (soundtrackUI.current) soundtrackUI.current.textContent = formatAudioTime(soundtrackAudio.currentTime);
    if (soundtrackUI.seek && Number.isFinite(soundtrackAudio.duration) && soundtrackAudio.duration > 0) {
      soundtrackUI.seek.value = String(Math.round((soundtrackAudio.currentTime / soundtrackAudio.duration) * 1000));
    }
  });
  soundtrackAudio.addEventListener('ended', () => stepSoundtrack(1));
  soundtrackAudio.addEventListener('error', () => {
    if (soundtrackUI.status) soundtrackUI.status.textContent = 'Não foi possível carregar esta faixa.';
    pauseSoundtrack();
  });

  // Vídeo e fonógrafo nunca disputam o áudio.
  musicalFrames.forEach(frame => {
    frame.querySelector('.video-play')?.addEventListener('click', pauseSoundtrack);
  });

  document.querySelectorAll('[data-target]').forEach(control => {
    control.addEventListener('click', () => {
      if (control.dataset.target !== 'musical') pauseSoundtrack();
      if (control.dataset.target === 'musical') refreshSoundtrackUnlocks();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      fadeOutMainTheme(180);
      fadeOutMemoriesTheme(180);
    } else if (hero.style.display !== 'none' && menuMusicEnabled) {
      playMainTheme();
    } else if (document.getElementById('memorias')?.classList.contains('active-screen') && memoriesMusicEnabled) {
      playMemoriesTheme();
    }
  });

  window.addEventListener('storage', refreshSoundtrackUnlocks);
  refreshSoundtrackUnlocks();

  runStudioSplash();

  const initial = location.hash.replace('#', '');
  if (initial && initial !== 'inicio' && document.getElementById(initial)) {
    openScreen(initial);
  } else if (initial === 'inicio' && menuMusicEnabled) {
    playMainTheme();
  }
})();