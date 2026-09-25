(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const hero = document.querySelector('#inicio');
  const toast = document.querySelector('#toast');
  const video = document.querySelector('#menuVideo');
  const chapterOne = document.querySelector('#chapterOne');
  const chapterMessage = document.querySelector('#chapterMessage');

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

  chapterOne?.addEventListener('click', () => {
    if (chapterMessage) chapterMessage.hidden = false;
    localStorage.setItem('jack-chapter', '1');
    showToast('Halloween I — As Casas dos Perdidos selecionado.');
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
    video.addEventListener('error', fail);
    video.querySelectorAll('source').forEach(source => source.addEventListener('error', fail));
    video.play().catch(() => {
      // Autoplay pode ser bloqueado em alguns navegadores; o poster assume o fundo.
    });
  }

  const initial = location.hash.replace('#', '');
  if (initial && initial !== 'inicio' && document.getElementById(initial)) {
    openScreen(initial);
  }
})();