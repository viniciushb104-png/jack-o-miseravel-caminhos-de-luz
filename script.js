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
  let menuMusicEnabled = localStorage.getItem('jack-menu-music-muted') !== '1';
  let mainThemeFadeToken = 0;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

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
    if (!menuMusicEnabled || hero.style.display === 'none') return;
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

  const savedMemories = Math.min(8, Math.max(0, Number(localStorage.getItem('jack-memories') || 0)));
  const memoryCounter = document.querySelector('#memoryCount');
  if (memoryCounter) memoryCounter.textContent = savedMemories + '/8';
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
    } else if (hero.style.display !== 'none' && menuMusicEnabled) {
      playMainTheme();
    }
  });

  window.addEventListener('storage', refreshSoundtrackUnlocks);
  refreshSoundtrackUnlocks();

  const initial = location.hash.replace('#', '');
  if (initial && initial !== 'inicio' && document.getElementById(initial)) {
    openScreen(initial);
  } else if (initial === 'inicio' && menuMusicEnabled) {
    playMainTheme();
  }
})();