(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const hero = document.querySelector('#inicio');
  const toast = document.querySelector('#toast');
  const video = document.querySelector('#menuVideo');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function openScreen(id) {
    if (id === 'inicio') {
      screens.forEach(screen => screen.classList.remove('active-screen'));
      hero.style.display = '';
      history.replaceState(null, '', '#inicio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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

  const initial = location.hash.replace('#', '');
  if (initial && initial !== 'inicio' && document.getElementById(initial)) {
    openScreen(initial);
  }
})();