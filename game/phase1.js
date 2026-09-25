(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const W = 1280;
  const H = 720;
  const WORLD = 5300;

  const platforms = [
    { x: 0,    y: 590, w: 720, h: 130, type: 'stone' },
    { x: 830,  y: 555, w: 610, h: 74,  type: 'bridge' },
    { x: 1510, y: 505, w: 430, h: 54,  type: 'wood' },
    { x: 1990, y: 590, w: 720, h: 130, type: 'stone' },
    { x: 2800, y: 520, w: 370, h: 54,  type: 'wood' },
    { x: 3260, y: 450, w: 350, h: 70,  type: 'stone' },
    { x: 3710, y: 590, w: 720, h: 130, type: 'stone' },
    { x: 4490, y: 535, w: 650, h: 88,  type: 'wood' }
  ];

  const lamps = [
    { x: 525, y: 590 }, { x: 1015, y: 555 }, { x: 1665, y: 505 },
    { x: 2100, y: 590 }, { x: 2925, y: 520 }, { x: 3425, y: 450 },
    { x: 3915, y: 590 }, { x: 4860, y: 535 }
  ];

  const pumpkins = [
    { x: 310, y: 590 }, { x: 610, y: 590 }, { x: 1240, y: 555 },
    { x: 1840, y: 505 }, { x: 2390, y: 590 }, { x: 3070, y: 520 },
    { x: 3550, y: 450 }, { x: 4150, y: 590 }, { x: 4750, y: 535 }
  ];

  const player = {
    x: 120, y: 450, w: 46, h: 86, vx: 0, vy: 0, dir: 1,
    onGround: false, coyote: 0, jumpBuffer: 0,
    checkpointX: 120, checkpointY: 450, anim: 0
  };

  const input = { left: false, right: false, jump: false, run: false };

  const story = window.PHASE1_STORY;
  const dialogues = window.PHASE1_DIALOGUES;
  const dialogueRoot = document.getElementById('dialogue');
  const dialogue = new window.DialogueSystem(dialogueRoot);
  const objectiveText = document.querySelector('#objective strong');
  const interactPrompt = document.getElementById('interactPrompt');
  const interactBtn = document.getElementById('interactBtn');

  const soul = { x: 620, y: 590, bob: 0 };
  let metEleanor = localStorage.getItem(story.states.metEleanor) === '1';
  let nearEleanor = false;

  let jack = null;
  let jackPortraits = null;
  let eleanorPortraits = null;
  let dialogueFrame = null;
  let cameraX = 0;
  let last = performance.now();
  let running = false;
  let finished = false;
  let checkpoint = false;

  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: (i * 137 + 53) % W,
    y: 32 + ((i * 83 + 19) % 285),
    r: i % 11 === 0 ? 2 : 1,
    a: 0.48 + ((i * 17) % 45) / 100
  }));

  const farHouses = Array.from({ length: 30 }, (_, i) => ({
    x: i * 205 + ((i * 71) % 90),
    w: 70 + (i % 4) * 15,
    h: 60 + (i % 5) * 17,
    roof: 25 + (i % 3) * 10,
    light: i % 2 === 0
  }));

  async function imageFromChunks(paths) {
    const chunks = await Promise.all(paths.map(async path => {
      const response = await fetch(path, { cache: 'force-cache' });
      if (!response.ok) throw new Error('Falha ao carregar ' + path);
      return (await response.text()).trim();
    }));
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = 'data:image/webp;base64,' + chunks.join('');
    });
  }

  async function loadAssets() {
    // O sprite jogável é obrigatório. Os portraits e a moldura são enriquecimentos
    // visuais: se algum deles falhar, a fase continua funcionando com o fallback CSS.
    jack = await imageFromChunks([
      '../assets/sprites/jack/data/jack-mini.1.b64',
      '../assets/sprites/jack/data/jack-mini.2.b64',
      '../assets/sprites/jack/data/jack-mini.3.b64'
    ]);

    const optional = await Promise.allSettled([
      imageFromChunks([
        '../assets/portraits/jack/data/portraits.1.b64',
        '../assets/portraits/jack/data/portraits.2.b64'
      ]),
      imageFromChunks([
        '../assets/portraits/eleanor/data/portraits.1.b64',
        '../assets/portraits/eleanor/data/portraits.2.b64'
      ]),
      imageFromChunks([
        '../assets/ui/dialogue/data/dialogue-frame.1.b64',
        '../assets/ui/dialogue/data/dialogue-frame.2.b64'
      ])
    ]);

    if (optional[0].status === 'fulfilled') jackPortraits = optional[0].value;
    if (optional[1].status === 'fulfilled') eleanorPortraits = optional[1].value;
    if (optional[2].status === 'fulfilled') dialogueFrame = optional[2].value;

    dialogue.setAssets({
      jack: jackPortraits,
      eleanor: eleanorPortraits,
      frame: dialogueFrame
    });
  }

  function setObjective(text) {
    if (objectiveText) objectiveText.textContent = text;
  }

  function syncObjective() {
    setObjective(metEleanor ? story.objectives.findMemories : story.objectives.beforeMeeting);
  }

  function tryInteract() {
    if (!running || finished || dialogue.active) return;
    if (!nearEleanor) return;

    player.vx = 0;
    interactPrompt.hidden = true;

    const scene = metEleanor
      ? [
          { speaker: 'Eleanor', portrait: 'eleanor', expression: 1, text: 'A sua lanterna ainda está mostrando aquelas luzes pela vila?' },
          { speaker: 'Jack', portrait: 'jack', expression: 0, text: 'Está. Continue mantendo essa janela acesa por mais um pouco.' }
        ]
      : dialogues.firstMeeting;

    dialogue.open(scene, () => {
      if (!metEleanor) {
        metEleanor = true;
        localStorage.setItem(story.states.metEleanor, '1');
        setObjective(story.objectives.findMemories);
        showMessage('✦ Nova missão — recupere as memórias de Eleanor');
      }
    });
  }

  function showMessage(text) {
    const box = document.getElementById('message');
    box.textContent = text;
    box.classList.add('show');
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => box.classList.remove('show'), 2300);
  }

  function resetPlayer() {
    player.x = player.checkpointX;
    player.y = player.checkpointY;
    player.vx = 0;
    player.vy = 0;
  }

  function update(dt) {
    if (!running || finished) return;
    if (dialogue.active) {
      player.vx = 0;
      if (interactPrompt) interactPrompt.hidden = true;
      return;
    }

    dt = Math.min(dt, 0.034);
    player.anim += dt;

    const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const maxSpeed = input.run ? 325 : 225;
    const acceleration = axis ? 1550 : 1900;

    if (axis) {
      player.vx += axis * acceleration * dt;
      player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
      player.dir = axis > 0 ? 1 : -1;
    } else {
      const drag = acceleration * dt;
      player.vx = Math.abs(player.vx) <= drag ? 0 : player.vx - Math.sign(player.vx) * drag;
    }

    if (player.onGround) player.coyote = 0.12;
    else player.coyote = Math.max(0, player.coyote - dt);

    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    if (input.jump) {
      player.jumpBuffer = 0.14;
      input.jump = false;
    }

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -565;
      player.jumpBuffer = 0;
      player.coyote = 0;
      player.onGround = false;
    }

    player.vy = Math.min(980, player.vy + 1450 * dt);

    const previousY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = Math.max(24, Math.min(WORLD - 24, player.x));
    player.onGround = false;

    if (player.vy >= 0) {
      const previousFeet = previousY + player.h / 2;
      const currentFeet = player.y + player.h / 2;
      for (const platform of platforms) {
        const overlapsX = player.x + player.w / 2 > platform.x + 6 &&
                          player.x - player.w / 2 < platform.x + platform.w - 6;
        const crossesTop = previousFeet <= platform.y + 7 && currentFeet >= platform.y;
        if (overlapsX && crossesTop) {
          player.y = platform.y - player.h / 2;
          player.vy = 0;
          player.onGround = true;
          break;
        }
      }
    }

    if (player.y > 830) {
      resetPlayer();
      showMessage('A estrada trouxe Jack de volta à última luz.');
    }

    nearEleanor = Math.abs(player.x - soul.x) < 115 &&
                  Math.abs((player.y + player.h / 2) - soul.y) < 135;
    if (interactPrompt) interactPrompt.hidden = !nearEleanor;

    if (!checkpoint && player.x > 2860) {
      checkpoint = true;
      player.checkpointX = 2890;
      player.checkpointY = 420;
      localStorage.setItem('jack-phase1-checkpoint', '1');
      localStorage.setItem('jack-light-level', '2');
      document.getElementById('lightValue').textContent = '02';
      showMessage('✦ Lanterna acesa — checkpoint salvo');
    }

    if (player.x > 5050) {
      finished = true;
      localStorage.setItem('jack-phase1-complete', 'yes');
      document.getElementById('finish').hidden = false;
    }

    const target = Math.max(0, Math.min(WORLD - W, player.x - W * 0.38));
    cameraX += (target - cameraX) * Math.min(1, dt * 5.8);
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#02091d');
    gradient.addColorStop(0.52, '#0a1b3b');
    gradient.addColorStop(1, '#10172b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    for (const star of stars) {
      ctx.globalAlpha = star.a;
      ctx.fillStyle = star.r === 2 ? '#ffe7a2' : '#d6e8ff';
      ctx.fillRect(star.x, star.y, star.r, star.r);
      if (star.r === 2) {
        ctx.fillRect(star.x - 2, star.y + 1, 6, 1);
        ctx.fillRect(star.x + 1, star.y - 2, 1, 6);
      }
    }
    ctx.globalAlpha = 1;

    const moonX = 235 - cameraX * 0.008;
    const moonY = 145;
    const glow = ctx.createRadialGradient(moonX, moonY, 40, moonX, moonY, 115);
    glow.addColorStop(0, 'rgba(255,225,142,.34)');
    glow.addColorStop(1, 'rgba(255,192,73,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(moonX, moonY, 115, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4c85f';
    ctx.beginPath(); ctx.arc(moonX, moonY, 72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(176,111,37,.22)';
    for (const item of [[-24,-22,13],[21,-9,17],[-5,25,20],[31,30,9],[-38,15,8]]) {
      ctx.beginPath(); ctx.arc(moonX + item[0], moonY + item[1], item[2], 0, Math.PI * 2); ctx.fill();
    }

    drawCloud(75 - cameraX * .014, 175, 1.05);
    drawCloud(520 - cameraX * .012, 110, .9);
    drawCloud(980 - cameraX * .009, 190, 1.2);
  }

  function drawCloud(x, y, scale) {
    ctx.fillStyle = 'rgba(66,86,137,.55)';
    const blobs = [[0,18,54],[47,0,70],[110,19,58],[165,9,48],[205,26,38]];
    for (const item of blobs) {
      ctx.beginPath(); ctx.arc(x + item[0] * scale, y + item[1] * scale, item[2] * scale, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawMountainLayer(offset, baseY, amplitude, color, step) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, baseY);
    for (let x = -step; x <= W + step; x += step) {
      const worldX = x + offset;
      const y = baseY - amplitude * (0.45 + 0.55 * Math.abs(Math.sin(worldX * 0.0047)));
      ctx.lineTo(x + step / 2, y);
      ctx.lineTo(x + step, baseY + 8 * Math.sin(worldX * .011));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawPines(parallax, baseY, color, spacing, size) {
    const offset = -((cameraX * parallax) % spacing);
    ctx.fillStyle = color;
    for (let x = offset - spacing; x < W + spacing; x += spacing) {
      const wobble = ((Math.floor((x + cameraX * parallax) / spacing) * 19) % 33) - 16;
      const h = size + wobble;
      ctx.fillRect(x - 3, baseY - h * .35, 6, h * .35);
      for (let layer = 0; layer < 4; layer++) {
        const yy = baseY - h + layer * h * .19;
        const half = 14 + layer * 8;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x - half, yy + h * .34);
        ctx.lineTo(x + half, yy + h * .34);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  function drawCastle() {
    const x = 915 - cameraX * 0.045;
    const ground = 330;
    ctx.fillStyle = '#11162d';
    ctx.fillRect(x, 220, 250, 110);
    const towers = [
      [x + 12, 165, 42, 165], [x + 80, 130, 52, 200],
      [x + 150, 180, 40, 150], [x + 205, 145, 38, 185]
    ];
    for (const tower of towers) {
      const tx=tower[0], ty=tower[1], tw=tower[2], th=tower[3];
      ctx.fillStyle = '#11162d'; ctx.fillRect(tx, ty, tw, th);
      ctx.beginPath(); ctx.moveTo(tx - 8, ty); ctx.lineTo(tx + tw / 2, ty - 36); ctx.lineTo(tx + tw + 8, ty); ctx.closePath(); ctx.fill();
      for (let wy = ty + 25; wy < ty + th - 14; wy += 34) {
        ctx.fillStyle = '#e17c22'; ctx.fillRect(tx + tw / 2 - 3, wy, 6, 12);
      }
    }
    ctx.fillStyle = '#0b1125'; ctx.fillRect(x - 70, ground, 380, 18);
  }

  function drawFarVillage() {
    const baseY = 430;
    for (let repeat = -1; repeat <= 1; repeat++) {
      const shift = repeat * 6200 - cameraX * 0.12;
      for (const house of farHouses) {
        const x = house.x + shift;
        if (x < -140 || x > W + 140) continue;
        const y = baseY - house.h + ((house.x / 205) % 3) * 10;
        ctx.fillStyle = '#11192f'; ctx.fillRect(x, y, house.w, house.h);
        ctx.fillStyle = '#0b1025';
        ctx.beginPath();
        ctx.moveTo(x - 8, y); ctx.lineTo(x + house.w / 2, y - house.roof); ctx.lineTo(x + house.w + 8, y);
        ctx.closePath(); ctx.fill();
        if (house.light) {
          ctx.fillStyle = '#e78a28';
          ctx.fillRect(x + 13, y + 22, 7, 10);
          ctx.fillRect(x + house.w - 20, y + 26, 7, 10);
        }
      }
    }
  }

  function drawFog() {
    ctx.save();
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#8fa9c7';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 270 - cameraX * .16) % (W + 320)) - 180;
      ctx.beginPath(); ctx.ellipse(x, 460 + (i % 2) * 35, 210, 34, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawBackground() {
    drawSky();
    drawMountainLayer(cameraX * .018, 325, 105, '#11244d', 180);
    drawMountainLayer(cameraX * .035, 370, 85, '#0d1d3d', 150);
    drawCastle();
    drawPines(.07, 455, '#071226', 45, 115);
    drawFarVillage();
    drawFog();
    drawPines(.18, 535, '#050d1b', 58, 135);
  }

  function drawLeaves(x, y, width) {
    const count = Math.max(4, Math.floor(width / 65));
    for (let i = 0; i < count; i++) {
      const px = x + 14 + (i * 67) % Math.max(26, width - 28);
      ctx.fillStyle = i % 3 === 0 ? '#d64b16' : i % 3 === 1 ? '#f08a18' : '#a83817';
      ctx.fillRect(px, y - 5 - (i % 2) * 3, 9, 6);
      ctx.fillRect(px + 6, y - 1, 6, 6);
    }
  }

  function drawStone(platform) {
    const x = platform.x - cameraX;
    if (x + platform.w < -60 || x > W + 60) return;
    ctx.fillStyle = '#15233d'; ctx.fillRect(x, platform.y, platform.w, platform.h);
    for (let yy = platform.y + 8; yy < platform.y + platform.h; yy += 24) {
      const stagger = ((yy / 24) % 2) * 20;
      for (let xx = x - stagger; xx < x + platform.w; xx += 42) {
        ctx.fillStyle = '#2a3c5e'; ctx.fillRect(xx, yy, 36, 17);
        ctx.fillStyle = '#111a2e'; ctx.fillRect(xx, yy + 17, 36, 3);
        ctx.fillStyle = '#405175'; ctx.fillRect(xx + 3, yy + 2, 20, 2);
      }
    }
    ctx.fillStyle = '#d87c19'; ctx.fillRect(x, platform.y, platform.w, 5);
    drawLeaves(x, platform.y, platform.w);
  }

  function drawWood(platform) {
    const x = platform.x - cameraX;
    if (x + platform.w < -60 || x > W + 60) return;
    ctx.fillStyle = '#562b12'; ctx.fillRect(x, platform.y, platform.w, platform.h);
    for (let xx = x; xx < x + platform.w; xx += 54) {
      ctx.fillStyle = '#9d5921'; ctx.fillRect(xx, platform.y + 3, 48, 18);
      ctx.fillStyle = '#c17427'; ctx.fillRect(xx + 4, platform.y + 5, 30, 3);
      ctx.fillStyle = '#32180b'; ctx.fillRect(xx + 47, platform.y, 5, platform.h);
    }
    ctx.fillStyle = '#d98b27'; ctx.fillRect(x, platform.y, platform.w, 4);
    for (let xx = x + 34; xx < x + platform.w; xx += 145) {
      ctx.fillStyle = '#653516'; ctx.fillRect(xx, platform.y + platform.h, 18, 72);
      ctx.strokeStyle = '#96501d'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(xx + 8, platform.y + platform.h + 8); ctx.lineTo(xx + 58, platform.y + platform.h + 66); ctx.stroke();
      ctx.strokeStyle = '#c3873f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xx - 1, platform.y + platform.h + 13); ctx.lineTo(xx + 20, platform.y + platform.h + 18); ctx.stroke();
    }
    drawLeaves(x, platform.y, platform.w);
  }

  function drawBridge(platform) {
    const x = platform.x - cameraX;
    if (x + platform.w < -70 || x > W + 70) return;
    ctx.strokeStyle = '#6f3917'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x, platform.y + 8); ctx.quadraticCurveTo(x + platform.w / 2, platform.y + 38, x + platform.w, platform.y + 8); ctx.stroke();
    for (let xx = x; xx < x + platform.w; xx += 34) {
      ctx.fillStyle = '#77401b'; ctx.fillRect(xx, platform.y + 20, 28, 22);
      ctx.fillStyle = '#b76a27'; ctx.fillRect(xx, platform.y + 20, 28, 5);
      ctx.fillStyle = '#2e190d'; ctx.fillRect(xx + 27, platform.y + 20, 3, 22);
    }
    ctx.strokeStyle = '#b1702e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, platform.y - 18); ctx.quadraticCurveTo(x + platform.w / 2, platform.y + 9, x + platform.w, platform.y - 18); ctx.stroke();
    for (const postX of [x, x + platform.w]) {
      ctx.fillStyle = '#553017'; ctx.fillRect(postX - 7, platform.y - 27, 14, 70);
    }
  }

  function drawLantern(wx, groundY) {
    const x = wx - cameraX;
    if (x < -90 || x > W + 90) return;
    const flameY = groundY - 109;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(x, flameY, 2, x, flameY, 62);
    glow.addColorStop(0, 'rgba(255,236,150,.95)');
    glow.addColorStop(.3, 'rgba(255,163,39,.38)');
    glow.addColorStop(1, 'rgba(255,114,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, flameY, 62, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#3f2818'; ctx.fillRect(x - 5, groundY - 108, 10, 108);
    ctx.fillStyle = '#6f421f'; ctx.fillRect(x - 25, groundY - 118, 50, 8);
    ctx.fillStyle = '#2b1a10'; ctx.fillRect(x - 15, groundY - 140, 30, 34);
    ctx.fillStyle = '#f5a62c'; ctx.fillRect(x - 11, groundY - 136, 22, 27);
    ctx.fillStyle = '#ffe8a0'; ctx.fillRect(x - 5, groundY - 130, 10, 16);
    ctx.fillStyle = '#2b1a10'; ctx.fillRect(x - 15, groundY - 140, 30, 3);
  }

  function drawPumpkin(wx, groundY) {
    const x = wx - cameraX;
    if (x < -45 || x > W + 45) return;
    const y = groundY - 23;
    ctx.fillStyle = '#7b300c'; ctx.fillRect(x - 4, y - 18, 8, 8);
    ctx.fillStyle = '#d85b0e'; ctx.beginPath(); ctx.ellipse(x, y, 24, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef7f18'; ctx.beginPath(); ctx.ellipse(x - 7, y, 10, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 7, y, 10, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd45f';
    ctx.fillRect(x - 12, y - 5, 6, 5); ctx.fillRect(x + 6, y - 5, 6, 5); ctx.fillRect(x - 9, y + 8, 18, 4);
  }

  function drawRouteDecor() {
    for (const wx of [170, 2300, 3980, 4680]) {
      const x = wx - cameraX;
      if (x < -140 || x > W + 140) continue;
      ctx.fillStyle = '#372116';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + i * 34, 525, 8, 66);
      ctx.fillRect(x - 4, 545, 118, 6); ctx.fillRect(x - 4, 569, 118, 6);
    }
    for (const wx of [2140, 4000, 4710]) {
      const x = wx - cameraX;
      if (x < -220 || x > W + 220) continue;
      const base = 590;
      ctx.fillStyle = '#10162a'; ctx.fillRect(x, base - 178, 160, 178);
      ctx.fillStyle = '#070d1c';
      ctx.beginPath(); ctx.moveTo(x - 18, base - 178); ctx.lineTo(x + 80, base - 262); ctx.lineTo(x + 178, base - 178); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d7791d'; ctx.fillRect(x + 28, base - 132, 20, 28); ctx.fillRect(x + 108, base - 132, 20, 28);
      ctx.fillStyle = '#f6bd48'; ctx.fillRect(x + 34, base - 126, 8, 16); ctx.fillRect(x + 114, base - 126, 8, 16);
    }
  }

  function drawEleanor() {
    const x = soul.x - cameraX;
    if (x < -120 || x > W + 120) return;

    const y = soul.y - 64 + Math.sin(performance.now() / 420) * 4;
    ctx.save();

    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(x, y - 32, 10, x, y - 32, 82);
    glow.addColorStop(0, 'rgba(180,239,255,.55)');
    glow.addColorStop(.45, 'rgba(91,196,255,.22)');
    glow.addColorStop(1, 'rgba(72,141,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 28, 82, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .92;

    // Ghostly hair silhouette
    ctx.fillStyle = '#54475f';
    ctx.beginPath();
    ctx.arc(x, y - 63, 24, Math.PI, Math.PI * 2);
    ctx.lineTo(x + 27, y - 24);
    ctx.quadraticCurveTo(x + 20, y - 5, x + 8, y + 4);
    ctx.lineTo(x - 10, y + 4);
    ctx.quadraticCurveTo(x - 24, y - 7, x - 27, y - 27);
    ctx.closePath();
    ctx.fill();

    // Face
    ctx.fillStyle = '#e9d9c5';
    ctx.beginPath();
    ctx.arc(x, y - 52, 17, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2b2733';
    ctx.fillRect(x - 8, y - 55, 3, 5);
    ctx.fillRect(x + 5, y - 55, 3, 5);

    // Dress / cloak
    ctx.fillStyle = '#7180a1';
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 31);
    ctx.lineTo(x - 28, y + 34);
    ctx.quadraticCurveTo(x, y + 48, x + 28, y + 34);
    ctx.lineTo(x + 15, y - 31);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c9d0d7';
    ctx.fillRect(x - 9, y - 30, 18, 7);

    // Key
    ctx.strokeStyle = '#f2b23c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 18, y - 16, 7, 0, Math.PI * 2);
    ctx.moveTo(x + 18, y - 9);
    ctx.lineTo(x + 18, y + 8);
    ctx.lineTo(x + 25, y + 8);
    ctx.stroke();

    // Wisps
    ctx.globalAlpha = .72;
    ctx.fillStyle = '#86dcff';
    for (const [dx, dy, r] of [[-37,-50,7],[34,-34,6],[-30,9,5]]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#bfeeff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Eleanor', x, y - 98);
    ctx.textAlign = 'left';
  }

  function currentPlayerFrame() {
    if (!player.onGround) return 3;
    if (Math.abs(player.vx) < 20) return 0;
    const speed = input.run ? 0.10 : 0.16;
    return player.anim % (speed * 2) < speed ? 1 : 2;
  }

  function drawPlayer() {
    if (!jack) return;
    const frame = currentPlayerFrame();
    const x = player.x - cameraX;
    ctx.save();
    ctx.translate(x, player.y);
    ctx.scale(player.dir, 1);
    ctx.drawImage(jack, frame * 128, 0, 128, 128, -66, -82, 132, 132);
    ctx.restore();
  }

  function drawTutorialSign() {
    if (player.x > 650) return;
    const x = 275 - cameraX;
    ctx.fillStyle = 'rgba(5,14,31,.88)'; ctx.fillRect(x, 426, 310, 54);
    ctx.strokeStyle = '#c78120'; ctx.lineWidth = 2; ctx.strokeRect(x, 426, 310, 54);
    ctx.fillStyle = '#f4d99a'; ctx.font = '16px Georgia';
    ctx.fillText('Siga as lanternas e avance →', x + 18, 459);
  }

  function draw() {
    drawBackground();
    drawRouteDecor();
    for (const platform of platforms) {
      if (platform.type === 'stone') drawStone(platform);
      else if (platform.type === 'wood') drawWood(platform);
      else drawBridge(platform);
    }
    for (const lamp of lamps) drawLantern(lamp.x, lamp.y);
    for (const pumpkin of pumpkins) drawPumpkin(pumpkin.x, pumpkin.y);
    drawTutorialSign();
    drawEleanor();
    drawPlayer();
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 250, W / 2, H / 2, 760);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.32)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  }

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function setKey(event, pressed) {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'shift', 'e', 'enter'].includes(key)) event.preventDefault();
    if (pressed && (key === 'e' || key === 'enter') && !dialogue.active) tryInteract();
    if (key === 'arrowleft' || key === 'a') input.left = pressed;
    if (key === 'arrowright' || key === 'd') input.right = pressed;
    if (key === 'shift') input.run = pressed;
    if (pressed && (key === 'arrowup' || key === ' ')) input.jump = true;
    if (!pressed && (key === 'arrowup' || key === ' ') && player.vy < -180) player.vy *= 0.55;
  }

  addEventListener('keydown', event => setKey(event, true), { passive: false });
  addEventListener('keyup', event => setKey(event, false), { passive: false });

  function bindHold(id, property) {
    const button = document.getElementById(id);
    const on = event => { event.preventDefault(); input[property] = true; };
    const off = event => { event.preventDefault(); input[property] = false; };
    button.addEventListener('pointerdown', on);
    button.addEventListener('pointerup', off);
    button.addEventListener('pointercancel', off);
    button.addEventListener('pointerleave', off);
  }

  bindHold('leftBtn', 'left');
  bindHold('rightBtn', 'right');
  document.getElementById('jumpBtn').addEventListener('pointerdown', event => {
    event.preventDefault();
    input.jump = true;
  });

  interactPrompt?.addEventListener('click', tryInteract);
  interactBtn?.addEventListener('pointerdown', event => {
    event.preventDefault();
    tryInteract();
  });

  document.getElementById('startGame').onclick = () => {
    document.getElementById('intro').hidden = true;
    running = true;
    last = performance.now();
    syncObjective();
    const tutorial = document.getElementById('tutorial');
    tutorial.classList.add('show');
    setTimeout(() => tutorial.classList.remove('show'), 5000);
  };

  document.getElementById('restartBtn').onclick = () => {
    finished = false;
    checkpoint = false;
    player.checkpointX = 120;
    player.checkpointY = 450;
    document.getElementById('lightValue').textContent = '01';
    document.getElementById('finish').hidden = true;
    resetPlayer();
    cameraX = 0;
    running = true;
  };

  syncObjective();

  if (localStorage.getItem('jack-phase1-checkpoint') === '1' && metEleanor) {
    checkpoint = true;
    player.checkpointX = 2890;
    player.checkpointY = 420;
    player.x = 2890;
    player.y = 420;
    cameraX = Math.max(0, player.x - W * 0.38);
    document.getElementById('lightValue').textContent = '02';
  }

  loadAssets()
    .then(() => requestAnimationFrame(loop))
    .catch(error => {
      console.error(error);
      showMessage('Falha ao carregar os sprites do Jack.');
      requestAnimationFrame(loop);
    });
})();