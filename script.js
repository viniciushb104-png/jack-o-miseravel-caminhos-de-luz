(() => {
  const titleScreen = document.querySelector('#title-screen');
  const titleArt = document.querySelector('#titleArt');
  const gameShell = document.querySelector('#game-shell');
  const startButton = document.querySelector('#startButton');
  const soundButton = document.querySelector('#soundButton');
  const toast = document.querySelector('#toast');
  const screens = [...document.querySelectorAll('.screen')];
  let soundOn = localStorage.getItem('jack-sound') !== 'off';
  let audioCtx;

  async function loadHeroArt() {
    try {
      const response = await fetch('assets/hero-data.txt', { cache: 'force-cache' });
      if (!response.ok) throw new Error('hero art unavailable');
      const base64 = (await response.text()).trim();
      const dataUrl = 'data:image/webp;base64,' + base64;
      titleArt.src = dataUrl;
      document.documentElement.style.setProperty('--hero-art', 'url("' + dataUrl + '")');
    } catch (_) {
      titleArt.hidden = true;
    }
  }

  function beep(freq = 420, duration = 0.055, type = 'square') {
    if (!soundOn) return;
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.028, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function openScreen(id, pushHash = true) {
    const target = document.getElementById(id);
    if (!target || !target.classList.contains('screen')) return;
    screens.forEach(screen => screen.classList.toggle('active-screen', screen === target));
    if (pushHash) history.replaceState(null, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    beep(id === 'inicio' ? 520 : 460, .05);
  }

  function enterGame() {
    beep(660, .08);
    setTimeout(() => beep(880, .1), 80);
    titleScreen.hidden = true;
    gameShell.hidden = false;
    localStorage.setItem('jack-visited', 'yes');
    const requested = location.hash.replace('#', '');
    openScreen(requested && document.getElementById(requested) ? requested : 'inicio', false);
  }

  document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', () => openScreen(button.dataset.target));
    button.addEventListener('mouseenter', () => beep(290, .025));
  });

  startButton.addEventListener('click', enterGame);

  document.addEventListener('keydown', event => {
    if (!titleScreen.hidden && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      enterGame();
    }
    if (!gameShell.hidden && event.key === 'Escape') {
      openScreen('inicio');
    }
  });

  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('jack-sound', soundOn ? 'on' : 'off');
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.textContent = soundOn ? '♪' : '×';
    if (soundOn) beep(720, .07);
    showToast(soundOn ? 'Som dos menus ativado.' : 'Som dos menus desativado.');
  });

  const chapterOne = document.querySelector('[data-chapter="1"]');
  const chapterMessage = document.querySelector('#chapterMessage');
  chapterOne?.addEventListener('click', () => {
    chapterMessage.hidden = false;
    localStorage.setItem('jack-chapter', '1');
    beep(740, .07);
    setTimeout(() => beep(980, .08), 80);
    showToast('Halloween I selecionado: As Casas dos Perdidos.');
  });

  document.querySelectorAll('.memory-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      beep(210, .04);
      showToast('Esta memória ainda está escondida na noite.');
    });
  });

  loadHeroArt();

  const savedMemories = Number(localStorage.getItem('jack-memories') || 0);
  document.querySelector('#memoryCount').textContent = Math.min(8, Math.max(0, savedMemories));
  soundButton.textContent = soundOn ? '♪' : '×';
  soundButton.setAttribute('aria-pressed', String(soundOn));

  if (location.hash && localStorage.getItem('jack-visited') === 'yes') {
    titleScreen.querySelector('.start-help').textContent = 'progresso encontrado · pressione Enter';
  }
})();