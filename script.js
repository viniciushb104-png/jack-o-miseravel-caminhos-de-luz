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

  document.querySelectorAll('[data-play-phase="1"]').forEach(button => {
    button.addEventListener('click', () => {
      localStorage.setItem('jack-chapter', '1');
      window.location.href = 'game/phase1.html';
    });
  });

  const savedMemories = Math.min(8, Math.max(0, Number(localStorage.getItem('jack-memories') || 0)));
  const memoryCounter = document.querySelector('#memoryCount');
  if (memoryCounter) memoryCounter.textContent = savedMemories + '/8';

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

  const initial = location.hash.replace('#', '');
  if (initial && initial !== 'inicio' && document.getElementById(initial)) {
    openScreen(initial);
  }
})();