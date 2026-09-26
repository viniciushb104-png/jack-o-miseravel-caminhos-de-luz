(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const W = 1280, H = 720, WORLD = 11000;
  const GRAVITY = 1500;
  const story = window.PHASE1_STORY;
  const dialogues = window.PHASE1_DIALOGUES;
  const dialogue = new window.DialogueSystem(document.getElementById("dialogue"));

  const ui = {
    objective: document.querySelector("#objective strong"),
    memories: document.getElementById("memoryValue"),
    health: document.getElementById("healthValue"),
    light: document.getElementById("lightValue"),
    section: document.getElementById("sectionBanner"),
    interact: document.getElementById("interactPrompt"),
    bossHud: document.getElementById("bossHud"),
    bossHealth: document.getElementById("bossHealth"),
    finish: document.getElementById("finish"),
    message: document.getElementById("message")
  };

  /* A primeira abertura da versão completa começa limpa, sem herdar o checkpoint
     do protótipo antigo. Depois disso o progresso da própria fase é preservado. */
  if (localStorage.getItem("jack-phase1-version") !== "3") {
    Object.values(story.states).forEach(key => localStorage.removeItem(key));
    localStorage.setItem("jack-phase1-version", "3");
    localStorage.setItem("jack-light-level", "1");
  }

  const input = { left:false, right:false, run:false, jump:false };
  let running = false, finished = false, cameraX = 0, last = performance.now();
  let jack = null, jackPortraits = null, eleanorPortraits = null;
  const art = {
    background:null,
    terrain:null,
    props:null,
    eleanor:null,
    enemies:null,
    memories:null,
    boss:null,
    dialogueFrame:null
  };
  let lightPulse = 0, lightCooldown = 0, shake = 0, sectionIndex = -1;
  let checkpointReached = localStorage.getItem(story.states.checkpoint) === "bridge";
  let metEleanor = localStorage.getItem(story.states.metEleanor) === "1";
  let ruinsScenePlayed = false, finalSequence = false, gateMessageCooldown = 0;

  const player = {
    x: checkpointReached ? 6120 : 130,
    y: checkpointReached ? 370 : 470,
    w: 46, h: 86, vx:0, vy:0, dir:1, onGround:false,
    coyote:0, jumpBuffer:0, anim:0, hp:3, inv:0
  };

  const platforms = [
    {x:0,y:590,w:1500,h:130,type:"stone"},
    {x:1500,y:590,w:1700,h:130,type:"earth"},
    {x:1700,y:510,w:310,h:34,type:"wood"},
    {x:2140,y:455,w:330,h:34,type:"wood"},
    {x:2580,y:505,w:360,h:34,type:"wood"},
    {x:3200,y:590,w:1800,h:130,type:"stone"},
    {x:3370,y:500,w:250,h:35,type:"stone"},
    {x:3820,y:445,w:280,h:35,type:"stone"},
    {x:4300,y:500,w:280,h:35,type:"stone"},
    {x:4680,y:425,w:250,h:35,type:"stone"},
    {x:5000,y:590,w:350,h:130,type:"stone"},
    {x:5400,y:535,w:500,h:30,type:"bridge"},
    {x:5980,y:470,w:420,h:30,type:"bridge"},
    {x:6480,y:520,w:470,h:30,type:"bridge"},
    {x:7000,y:590,w:1800,h:130,type:"ruin"},
    {x:7220,y:500,w:300,h:38,type:"stone"},
    {x:7700,y:445,w:330,h:38,type:"stone"},
    {x:8170,y:490,w:310,h:38,type:"stone"},
    {x:8800,y:590,w:2200,h:130,type:"arena"}
  ];

  const memoryIcons = {
    key:0, storm:1, family:2, candle:3, letter:4
  };

  const memories = story.memories.map(m => ({
    ...m,
    collected: localStorage.getItem(story.states[m.state]) === "1",
    bob: Math.random() * Math.PI * 2
  }));

  let enemies = [
    enemy("crow", 1020, 430, 850, 1250),
    enemy("pumpkin", 1880, 548, 1650, 2100),
    enemy("crow", 2450, 360, 2150, 2780),
    enemy("pumpkin", 2860, 548, 2580, 3130),
    enemy("wisp", 3470, 405, 3290, 3750),
    enemy("crow", 4020, 360, 3700, 4300),
    enemy("wisp", 4550, 365, 4300, 4900),
    enemy("crow", 5550, 410, 5350, 5900),
    enemy("wisp", 6200, 330, 5950, 6460),
    enemy("crow", 6750, 390, 6480, 6960),
    enemy("pumpkin", 7240, 548, 7060, 7550),
    enemy("wisp", 7700, 360, 7420, 8050),
    enemy("pumpkin", 8350, 548, 8110, 8650)
  ];

  const projectiles = [];
  const boss = {
    started:false, defeated: localStorage.getItem(story.states.bossDefeated) === "1",
    x:10120, y:325, hp:10, maxHp:10, t:0, shot:0, summon:0, hit:0
  };

  function enemy(type,x,y,min,max){
    return {type,x,y,min,max,dir:1,alive:true,hp:1,t:Math.random()*3,attack:0,hit:0,baseY:y};
  }

  async function imageFromChunks(paths) {
    const chunks = await Promise.all(paths.map(async path => {
      const r = await fetch(path, { cache:"no-cache" });
      if (!r.ok) throw new Error("Falha ao carregar " + path);
      return (await r.text()).trim();
    }));
    return new Promise((resolve,reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = "data:image/webp;base64," + chunks.join("");
    });
  }

  async function loadAssets(){
    jack = await imageFromChunks([
      "../assets/sprites/jack/data/jack-mini.1.b64",
      "../assets/sprites/jack/data/jack-mini.2.b64",
      "../assets/sprites/jack/data/jack-mini.3.b64"
    ]);

    const optional = await Promise.allSettled([
      imageFromChunks(["../assets/portraits/jack/data/portraits.1.b64","../assets/portraits/jack/data/portraits.2.b64"]),
      imageFromChunks(["../assets/portraits/eleanor/data/portraits.1.b64","../assets/portraits/eleanor/data/portraits.2.b64"]),
      imageFromChunks(["../assets/game/phase1/data/background.b64"]),
      imageFromChunks(["../assets/game/phase1/data/terrain.b64"]),
      imageFromChunks(["../assets/game/phase1/data/props.b64"]),
      imageFromChunks(["../assets/game/phase1/data/eleanor-sprites.1.b64"]),
      imageFromChunks(["../assets/game/phase1/data/enemies.b64"]),
      imageFromChunks(["../assets/game/phase1/data/memories.b64"]),
      imageFromChunks(["../assets/game/phase1/data/boss.b64"]),
      imageFromChunks([
        "../assets/game/phase1/data/dialogue-frame-fixed.1.b64",
        "../assets/game/phase1/data/dialogue-frame-fixed.2.b64",
        "../assets/game/phase1/data/dialogue-frame-fixed.3.b64",
        "../assets/game/phase1/data/dialogue-frame-fixed.4.b64"
      ])
    ]);

    if (optional[0].status === "fulfilled") jackPortraits = optional[0].value;
    if (optional[1].status === "fulfilled") eleanorPortraits = optional[1].value;
    if (optional[2].status === "fulfilled") art.background = optional[2].value;
    if (optional[3].status === "fulfilled") art.terrain = optional[3].value;
    if (optional[4].status === "fulfilled") art.props = optional[4].value;
    if (optional[5].status === "fulfilled") art.eleanor = optional[5].value;
    if (optional[6].status === "fulfilled") art.enemies = optional[6].value;
    if (optional[7].status === "fulfilled") art.memories = optional[7].value;
    if (optional[8].status === "fulfilled") art.boss = optional[8].value;
    if (optional[9].status === "fulfilled") art.dialogueFrame = optional[9].value;

    dialogue.setAssets({ jack:jackPortraits, eleanor:eleanorPortraits });

    if (art.dialogueFrame) {
      const shell = document.querySelector(".dialogue-shell");
      if (shell) {
        shell.classList.add("has-art");
        shell.style.backgroundImage = 'url("' + art.dialogueFrame.src + '")';
      }
    }

    const loaded = Object.entries(art).filter(([,img]) => !!img).map(([name]) => name);
    console.info("[Fase 1] assets ilustrados carregados:", loaded.join(", "));
  }

  function drawAtlasCell(img, cols, rows, col, row, dx, dy, dw, dh, flip=false, alpha=1){
    if(!img) return false;
    const sw=img.naturalWidth/cols, sh=img.naturalHeight/rows;
    ctx.save();
    ctx.globalAlpha*=alpha;
    if(flip){
      ctx.translate(dx+dw,dy);
      ctx.scale(-1,1);
      ctx.drawImage(img,col*sw,row*sh,sw,sh,0,0,dw,dh);
    }else{
      ctx.drawImage(img,col*sw,row*sh,sw,sh,dx,dy,dw,dh);
    }
    ctx.restore();
    return true;
  }

  function drawCrop(img, sx, sy, sw, sh, dx, dy, dw, dh, alpha=1){
    if(!img) return false;
    ctx.save();
    ctx.globalAlpha*=alpha;
    ctx.drawImage(
      img,
      sx*img.naturalWidth, sy*img.naturalHeight,
      sw*img.naturalWidth, sh*img.naturalHeight,
      dx,dy,dw,dh
    );
    ctx.restore();
    return true;
  }

  function memoryCount(){ return memories.filter(m => m.collected).length; }
  function hearts(){ return "♥ ".repeat(Math.max(0,player.hp)).trim() || "—"; }

  function syncHud(){
    ui.memories.textContent = memoryCount() + "/5";
    ui.health.textContent = hearts();
    ui.light.textContent = String(Number(localStorage.getItem("jack-light-level") || 1)).padStart(2,"0");
    if (boss.started && !boss.defeated) {
      ui.bossHud.hidden = false;
      ui.bossHealth.style.width = Math.max(0,boss.hp/boss.maxHp*100) + "%";
    } else ui.bossHud.hidden = true;
    syncObjective();
  }

  function syncObjective(){
    const count = memoryCount();
    let text = story.objectives.beforeMeeting;
    if (metEleanor && count < 5) text = story.objectives.findMemories + " — " + count + "/5";
    if (count >= 5 && !boss.started && !boss.defeated) text = story.objectives.goArena;
    if (boss.started && !boss.defeated) text = story.objectives.defeatBoss;
    if (boss.defeated) text = story.objectives.completed;
    ui.objective.textContent = text;
  }

  function showMessage(text, ms=2200){
    ui.message.textContent = text;
    ui.message.classList.add("show");
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => ui.message.classList.remove("show"), ms);
  }

  function showSection(index){
    if (index === sectionIndex || !story.sections[index]) return;
    sectionIndex = index;
    ui.section.textContent = story.sections[index].name;
    ui.section.classList.add("show");
    clearTimeout(showSection.timer);
    showSection.timer = setTimeout(() => ui.section.classList.remove("show"), 2100);
  }

  function sectionForX(x){
    return story.sections.findIndex(s => x >= s.start && x < s.end);
  }

  function resetPlayer(full=false){
    player.x = checkpointReached && !full ? 6120 : 130;
    player.y = checkpointReached && !full ? 360 : 470;
    player.vx=0; player.vy=0; player.hp=3; player.inv=0;
    cameraX = Math.max(0, player.x - 420);
    projectiles.length=0;
    syncHud();
  }

  function openDialogue(lines, done){
    player.vx = 0;
    ui.interact.hidden = true;
    dialogue.open(lines, done);
  }

  function meetEleanor(){
    if (dialogue.active || metEleanor) return;
    openDialogue(dialogues.firstMeeting, () => {
      metEleanor = true;
      localStorage.setItem(story.states.metEleanor,"1");
      showMessage("✦ A lanterna revelou cinco ecos de memória.");
      syncHud();
    });
  }

  function collectMemory(m){
    if (!metEleanor || m.collected || dialogue.active) return;
    m.collected = true;
    localStorage.setItem(story.states[m.state],"1");
    syncHud();
    shake = .14;
    showMessage("✦ Fragmento recuperado — " + m.title);
    openDialogue(dialogues[m.dialogue], () => {
      if (memoryCount() === 5 && !ruinsScenePlayed) {
        ruinsScenePlayed = true;
        openDialogue(dialogues.ruinsRevelation, () => {
          showMessage("A Arena da Guardiã foi aberta.");
          syncHud();
        });
      }
    });
  }

  function tryInteract(){
    if (!running || finished || dialogue.active) return;
    const nearFirst = Math.abs(player.x - 1240) < 125 && player.x < 1600;
    if (nearFirst && !metEleanor) meetEleanor();
    else if (nearFirst && metEleanor) {
      openDialogue([
        {speaker:"Eleanor",portrait:"eleanor",expression:1,text: memoryCount() < 5 ? "A luz está mais forte. Você encontrou alguma coisa?" : "Eu consigo sentir o caminho... mas alguma coisa ainda o bloqueia."},
        {speaker:"Jack",portrait:"jack",expression:0,text: memoryCount() < 5 ? "Ainda estou juntando as peças." : "Eu vou cuidar do bloqueio."}
      ]);
    }
  }

  function useLight(){
    if (!running || dialogue.active || finished || lightCooldown > 0) return;
    lightCooldown = .55;
    lightPulse = .32;
    shake = .08;
    const radius = 190;
    enemies.forEach(e => {
      if (!e.alive) return;
      const dx=e.x-player.x, dy=e.y-player.y;
      if (dx*dx+dy*dy < radius*radius) {
        e.hp--; e.hit=.2;
        if (e.hp<=0) { e.alive=false; showMessage("Eco dissipado pela Luz.",900); }
      }
    });
    if (boss.started && !boss.defeated) {
      const dx=boss.x-player.x, dy=boss.y-player.y;
      if (dx*dx+dy*dy < 245*245 && boss.hit<=0) {
        boss.hp--; boss.hit=.3; shake=.18;
        ui.bossHealth.style.width = Math.max(0,boss.hp/boss.maxHp*100)+"%";
        if (boss.hp<=0) defeatBoss();
      }
    }
  }

  function damagePlayer(sourceX){
    if (player.inv>0 || dialogue.active || finished) return;
    player.hp--;
    player.inv=1.15;
    player.vy=-360;
    player.vx = player.x < sourceX ? -300 : 300;
    shake=.24;
    syncHud();
    if (player.hp<=0) {
      setTimeout(() => { resetPlayer(); showMessage("A última lanterna trouxe Jack de volta."); }, 250);
    }
  }

  function defeatBoss(){
    if (boss.defeated) return;
    boss.defeated=true; boss.started=false;
    localStorage.setItem(story.states.bossDefeated,"1");
    projectiles.length=0;
    ui.bossHud.hidden=true;
    localStorage.setItem("jack-light-level","03");
    syncHud();
    openDialogue(dialogues.bossDefeated, () => {
      setTimeout(() => startFinalSequence(), 350);
    });
  }

  function startFinalSequence(){
    if (finalSequence) return;
    finalSequence=true;
    openDialogue(dialogues.farewell, () => {
      localStorage.setItem(story.states.eleanorSaved,"1");
      setTimeout(() => openDialogue(dialogues.tower, () => {
        finished=true;
        ui.finish.hidden=false;
        localStorage.setItem("jack-phase1-complete","yes");
        localStorage.setItem("jack-light-level","03");
      }), 700);
    });
  }

  function updatePlayer(dt){
    const axis=(input.right?1:0)-(input.left?1:0);
    const max=input.run?335:235, accel=axis?1550:1950;
    player.anim+=dt;
    if(axis){
      player.vx+=axis*accel*dt;
      player.vx=Math.max(-max,Math.min(max,player.vx));
      player.dir=axis>0?1:-1;
    }else{
      const drag=accel*dt;
      player.vx=Math.abs(player.vx)<=drag?0:player.vx-Math.sign(player.vx)*drag;
    }

    if(player.onGround) player.coyote=.12; else player.coyote=Math.max(0,player.coyote-dt);
    player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
    if(input.jump){player.jumpBuffer=.14; input.jump=false;}
    if(player.jumpBuffer>0&&player.coyote>0){
      player.vy=-575; player.coyote=0; player.jumpBuffer=0; player.onGround=false;
    }

    player.vy=Math.min(1000,player.vy+GRAVITY*dt);
    const oldY=player.y;
    player.x+=player.vx*dt;
    player.y+=player.vy*dt;
    player.x=Math.max(22,Math.min(WORLD-22,player.x));
    player.onGround=false;

    if(player.vy>=0){
      const prev=oldY+player.h/2, now=player.y+player.h/2;
      for(const p of platforms){
        if(player.x+player.w/2>p.x+4&&player.x-player.w/2<p.x+p.w-4&&prev<=p.y+8&&now>=p.y){
          player.y=p.y-player.h/2; player.vy=0; player.onGround=true; break;
        }
      }
    }

    if(memoryCount()<5 && player.x>8750){
      player.x=8748; player.vx=-80;
      if(gateMessageCooldown<=0){showMessage("Cinco memórias precisam iluminar este selo.");gateMessageCooldown=2;}
    }

    if(player.y>850) resetPlayer();
    player.inv=Math.max(0,player.inv-dt);
    lightCooldown=Math.max(0,lightCooldown-dt);
    lightPulse=Math.max(0,lightPulse-dt);
    gateMessageCooldown=Math.max(0,gateMessageCooldown-dt);

    if(!checkpointReached && player.x>6050 && player.x<6350){
      checkpointReached=true;
      localStorage.setItem(story.states.checkpoint,"bridge");
      localStorage.setItem("jack-light-level","02");
      showMessage("✦ Checkpoint — Lanterna das Pontes acesa.");
      syncHud();
    }

    const nearEleanor = Math.abs(player.x-1240)<125 && player.x<1550;
    ui.interact.hidden = !nearEleanor || dialogue.active;

    memories.forEach(m => {
      if(!m.collected && metEleanor && Math.abs(player.x-m.x)<55 && Math.abs(player.y-m.y)<115) collectMemory(m);
    });

    const si=sectionForX(player.x);
    if(si>=0) showSection(si);

    if(memoryCount()>=5 && player.x>9000 && !boss.started && !boss.defeated && !dialogue.active){
      boss.started=true;
      player.vx=0;
      openDialogue(dialogues.preBoss, () => { boss.started=true; syncHud(); });
    }

    const target=Math.max(0,Math.min(WORLD-W,player.x-W*.39));
    cameraX+=(target-cameraX)*Math.min(1,dt*5.5);
  }

  function updateEnemies(dt){
    for(const e of enemies){
      if(!e.alive) continue;
      e.t+=dt; e.hit=Math.max(0,e.hit-dt); e.attack-=dt;
      if(e.type==="crow"){
        const speed=92;
        e.x+=e.dir*speed*dt;
        if(e.x<e.min||e.x>e.max) e.dir*=-1;
        e.y=e.baseY+Math.sin(e.t*3)*18;
        if(Math.abs(player.x-e.x)<250 && player.y>e.y && e.attack<=0){
          e.attack=2.2;
          e.y+=Math.min(120,dt*900);
        }
      } else if(e.type==="wisp"){
        e.x+=e.dir*42*dt;
        if(e.x<e.min||e.x>e.max)e.dir*=-1;
        e.y=e.baseY+Math.sin(e.t*2.1)*32;
        if(Math.abs(player.x-e.x)<520&&e.attack<=0){
          e.attack=2.4;
          shoot(e.x,e.y,player.x,player.y,205,"blue");
        }
      } else {
        const close=Math.abs(player.x-e.x)<230;
        e.x+=e.dir*(close?145:62)*dt;
        if(e.x<e.min||e.x>e.max)e.dir*=-1;
        e.y=548;
      }
      if(Math.abs(player.x-e.x)<48 && Math.abs(player.y-e.y)<68) damagePlayer(e.x);
    }
  }

  function shoot(x,y,tx,ty,speed,color="blue"){
    const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1;
    projectiles.push({x,y,vx:dx/d*speed,vy:dy/d*speed,r:10,color,life:5});
  }

  function updateProjectiles(dt){
    for(let i=projectiles.length-1;i>=0;i--){
      const p=projectiles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
      if(Math.abs(player.x-p.x)<30&&Math.abs(player.y-p.y)<48){damagePlayer(p.x);projectiles.splice(i,1);continue;}
      if(p.life<=0||p.y>760||p.x<0||p.x>WORLD)projectiles.splice(i,1);
    }
  }

  function updateBoss(dt){
    if(!boss.started||boss.defeated||dialogue.active)return;
    boss.t+=dt; boss.hit=Math.max(0,boss.hit-dt);
    boss.x=10000+Math.sin(boss.t*.7)*260;
    boss.y=330+Math.sin(boss.t*1.25)*70;
    boss.shot-=dt; boss.summon-=dt;
    if(boss.shot<=0){
      boss.shot=boss.hp<=5?.9:1.35;
      for(const spread of [-.18,0,.18]){
        const dx=player.x-boss.x,dy=player.y-boss.y,ang=Math.atan2(dy,dx)+spread;
        projectiles.push({x:boss.x,y:boss.y,vx:Math.cos(ang)*245,vy:Math.sin(ang)*245,r:12,color:"violet",life:5});
      }
    }
    if(boss.summon<=0){
      boss.summon=boss.hp<=5?4.2:6.2;
      const c=enemy("crow",boss.x-180,boss.y-30,boss.x-400,boss.x+300);
      c.baseY=boss.y-25;c.hp=1;enemies.push(c);
    }
    if(Math.abs(player.x-boss.x)<75&&Math.abs(player.y-boss.y)<100)damagePlayer(boss.x);
  }

  function update(dt){
    if(!running||finished)return;
    dt=Math.min(dt,.034);
    if(dialogue.active){player.vx=0;return;}
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateBoss(dt);
    shake=Math.max(0,shake-dt);
  }

  /* ---------- PIXEL ART / CENÁRIOS ---------- */
  const stars=Array.from({length:105},(_,i)=>({x:(i*131+37)%W,y:30+(i*73)%300,r:i%13===0?2:1,a:.35+(i%7)*.07}));

  function sky(){
    const sec=sectionForX(player.x);

    if(art.background){
      const drift=(cameraX*.025)%W;
      ctx.drawImage(art.background,-drift,0,W,H);
      ctx.drawImage(art.background,W-drift,0,W,H);
      const tint=ctx.createLinearGradient(0,0,0,H);
      tint.addColorStop(0,sec>=4?"#12092733":"#04102818");
      tint.addColorStop(1,"#02040a66");
      ctx.fillStyle=tint;
      ctx.fillRect(0,0,W,H);
      return;
    }

    const colors=sec===5?["#030716","#151331"]:sec>=4?["#07091c","#261630"]:["#02091d","#10254b"];
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,colors[0]);g.addColorStop(.7,colors[1]);g.addColorStop(1,"#111323");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    stars.forEach(s=>{ctx.globalAlpha=s.a;ctx.fillStyle="#ffe9b0";ctx.fillRect(s.x,s.y,s.r,s.r)});ctx.globalAlpha=1;
    const mx=210-cameraX*.012,my=135;
    const glow=ctx.createRadialGradient(mx,my,20,mx,my,110);glow.addColorStop(0,"#fff2b966");glow.addColorStop(1,"#ffd05a00");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(mx,my,110,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f0c96e";ctx.beginPath();ctx.arc(mx,my,60,0,Math.PI*2);ctx.fill();
    mountain(.02,360,105,"#142756");mountain(.04,405,80,"#0d1d3d");
    farVillage();
    pines();
  }

  function mountain(par,base,amp,color){
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,base);
    for(let x=-120;x<W+150;x+=150){const wx=x+cameraX*par;const y=base-amp*(.45+.55*Math.abs(Math.sin(wx*.0047)));ctx.lineTo(x+75,y);ctx.lineTo(x+150,base+8*Math.sin(wx*.011));}
    ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  }

  function farVillage(){
    const off=-(cameraX*.11%240);
    for(let x=off-240;x<W+240;x+=240){
      const h=70+((Math.floor((x+cameraX*.11)/240)*37)%45);
      ctx.fillStyle="#0a1226";ctx.fillRect(x,410-h,110,h);
      ctx.beginPath();ctx.moveTo(x-8,410-h);ctx.lineTo(x+55,365-h);ctx.lineTo(x+118,410-h);ctx.fill();
      ctx.fillStyle="#c96d20";ctx.fillRect(x+22,390-h,7,11);ctx.fillRect(x+75,380-h,7,11);
    }
  }

  function pines(){
    const off=-(cameraX*.18%62);ctx.fillStyle="#050d1b";
    for(let x=off-62;x<W+62;x+=62){const h=105+((x*17)%45);ctx.fillRect(x-3,520-h*.25,6,h*.25);for(let j=0;j<4;j++){const y=520-h+j*h*.18,half=15+j*7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-half,y+h*.32);ctx.lineTo(x+half,y+h*.32);ctx.fill();}}
  }

  function ground(p){
    const x=p.x-cameraX;if(x+p.w<-80||x>W+80)return;

    if(art.terrain){
      const base=p.type==="earth"?"#28150c":p.type==="arena"?"#10152a":"#111a2d";
      ctx.fillStyle=base;
      ctx.fillRect(x,p.y,p.w,p.h);

      let crop={sx:0,sy:0,sw:.28,sh:.24};
      let tileW=190, tileH=Math.min(95,p.h+20);

      if(p.type==="wood"){crop={sx:0,sy:.27,sw:.48,sh:.22};tileW=220;tileH=72;}
      else if(p.type==="bridge"){crop={sx:.10,sy:.48,sw:.48,sh:.22};tileW=230;tileH=66;}
      else if(p.type==="earth"){crop={sx:0,sy:.83,sw:.38,sh:.17};tileW=230;tileH=78;}
      else if(p.type==="ruin"){crop={sx:.58,sy:.52,sw:.30,sh:.25};tileW=180;tileH=82;}
      else if(p.type==="arena"){crop={sx:.57,sy:.79,sw:.39,sh:.20};tileW=230;tileH=84;}

      ctx.save();
      ctx.beginPath();ctx.rect(x,p.y,p.w,p.h);ctx.clip();
      for(let xx=x;xx<x+p.w+tileW;xx+=tileW-8){
        drawCrop(art.terrain,crop.sx,crop.sy,crop.sw,crop.sh,xx,p.y-8,tileW,tileH);
      }
      ctx.restore();
      return;
    }

    if(p.type==="wood"||p.type==="bridge"){drawWood(p);return;}
    const base=p.type==="earth"?"#372112":p.type==="arena"?"#17203a":"#17243e";
    ctx.fillStyle=base;ctx.fillRect(x,p.y,p.w,p.h);
    for(let yy=p.y+6;yy<p.y+p.h;yy+=22){
      const stagger=((yy/22)|0)%2*20;
      for(let xx=x-stagger;xx<x+p.w;xx+=42){
        ctx.fillStyle=p.type==="earth"?"#613718":"#2b3e61";ctx.fillRect(xx,yy,37,15);
        ctx.fillStyle=p.type==="earth"?"#2e180c":"#10192c";ctx.fillRect(xx,yy+15,37,3);
        ctx.fillStyle=p.type==="earth"?"#a25b20":"#40557c";ctx.fillRect(xx+3,yy+2,21,2);
      }
    }
    ctx.fillStyle=p.type==="arena"?"#70c9df":p.type==="ruin"?"#9d6526":"#d57a1a";ctx.fillRect(x,p.y,p.w,5);
    for(let lx=x+20;lx<x+p.w;lx+=90){ctx.fillStyle=((lx/90)|0)%2?"#b84218":"#e17b1d";ctx.fillRect(lx,p.y-5,10,5)}
  }

  function drawWood(p){
    const x=p.x-cameraX;if(x+p.w<-80||x>W+80)return;
    if(p.type==="bridge"){
      ctx.strokeStyle="#8b4d20";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,p.y+4);ctx.quadraticCurveTo(x+p.w/2,p.y+28,x+p.w,p.y+4);ctx.stroke();
    }
    for(let xx=x;xx<x+p.w;xx+=48){ctx.fillStyle="#6a3617";ctx.fillRect(xx,p.y,43,p.h);ctx.fillStyle="#b46625";ctx.fillRect(xx+3,p.y+3,32,4);ctx.fillStyle="#2d170c";ctx.fillRect(xx+41,p.y,4,p.h)}
    ctx.fillStyle="#d68b2a";ctx.fillRect(x,p.y,p.w,4);
  }

  function lantern(wx,groundY,scale=1){
    const x=wx-cameraX;if(x<-80||x>W+80)return;
    ctx.save();ctx.translate(x,groundY);ctx.scale(scale,scale);
    const g=ctx.createRadialGradient(0,-86,2,0,-86,48);g.addColorStop(0,"#fff0aacc");g.addColorStop(.4,"#ff9e3044");g.addColorStop(1,"#ff7a0000");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-86,48,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#3e2818";ctx.fillRect(-4,-88,8,88);ctx.fillRect(-17,-111,34,5);ctx.fillStyle="#24160f";ctx.fillRect(-13,-134,26,26);ctx.fillStyle="#e89325";ctx.fillRect(-10,-131,20,21);ctx.fillStyle="#fff1a4";ctx.fillRect(-4,-126,8,12);ctx.restore();
  }

  function tree(wx,groundY,scale=1){
    const x=wx-cameraX;if(x<-180||x>W+180)return;
    ctx.save();ctx.translate(x,groundY);ctx.scale(scale,scale);
    ctx.fillStyle="#351b13";ctx.fillRect(-13,-145,25,145);ctx.fillRect(-7,-185,13,70);
    ctx.fillStyle="#8e2f18";for(const [dx,dy,r] of [[-42,-170,43],[5,-198,48],[48,-165,40],[-5,-145,45]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill()}
    ctx.fillStyle="#d45419";for(const [dx,dy,r] of [[-28,-180,25],[19,-184,28],[40,-150,22],[-7,-138,27]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill()}ctx.restore();
  }

  function pumpkin(wx,groundY,s=1){
    const x=wx-cameraX;if(x<-60||x>W+60)return;ctx.save();ctx.translate(x,groundY-20);ctx.scale(s,s);
    ctx.fillStyle="#d85c0e";ctx.beginPath();ctx.ellipse(0,0,23,20,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f4861c";ctx.beginPath();ctx.ellipse(-7,0,9,18,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(7,0,9,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffd55e";ctx.fillRect(-11,-5,6,5);ctx.fillRect(5,-5,6,5);ctx.fillRect(-8,7,16,4);ctx.fillStyle="#56300e";ctx.fillRect(-3,-28,6,10);ctx.restore();
  }

  function grave(wx,groundY,t=0){
    const x=wx-cameraX;if(x<-80||x>W+80)return;ctx.save();ctx.translate(x,groundY);
    ctx.fillStyle=t%2?"#2b3043":"#373b4c";ctx.fillRect(-22,-64,44,64);ctx.beginPath();ctx.arc(0,-64,22,Math.PI,0);ctx.fill();ctx.fillStyle="#62677b";ctx.fillRect(-3,-53,6,27);ctx.fillRect(-11,-44,22,6);ctx.restore();
  }

  function cottage(wx,groundY,scale=1){
    const x=wx-cameraX;if(x<-230||x>W+230)return;ctx.save();ctx.translate(x,groundY);ctx.scale(scale,scale);
    ctx.fillStyle="#11162b";ctx.fillRect(-90,-180,180,180);ctx.fillStyle="#080d1b";ctx.beginPath();ctx.moveTo(-108,-180);ctx.lineTo(0,-270);ctx.lineTo(108,-180);ctx.closePath();ctx.fill();
    ctx.fillStyle="#d0781f";for(const dx of [-55,42]){ctx.fillRect(dx,-145,26,38);ctx.fillStyle="#ffd369";ctx.fillRect(dx+6,-137,14,25);ctx.fillStyle="#d0781f"}
    ctx.fillStyle="#3a2319";ctx.fillRect(-18,-74,36,74);ctx.restore();
  }

  function shrine(wx,groundY){
    const x=wx-cameraX;if(x<-120||x>W+120)return;ctx.save();ctx.translate(x,groundY);
    ctx.fillStyle="#202b43";ctx.fillRect(-58,-92,116,92);ctx.fillStyle="#9b6323";ctx.fillRect(-64,-98,128,8);ctx.fillStyle="#42250f";ctx.beginPath();ctx.moveTo(-65,-98);ctx.lineTo(0,-148);ctx.lineTo(65,-98);ctx.closePath();ctx.fill();
    ctx.fillStyle="#e98c25";ctx.fillRect(-20,-85,40,56);ctx.fillStyle="#ffe69a";ctx.fillRect(-11,-76,22,35);ctx.restore();lantern(wx,groundY-5,.72);
  }

  function gate(wx){
    const x=wx-cameraX;if(x<-140||x>W+140)return;ctx.save();ctx.translate(x,590);
    ctx.fillStyle="#1a2033";ctx.fillRect(-70,-230,28,230);ctx.fillRect(42,-230,28,230);ctx.beginPath();ctx.arc(0,-210,85,Math.PI,0);ctx.lineWidth=22;ctx.strokeStyle="#1a2033";ctx.stroke();
    ctx.strokeStyle="#59d7ff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-210,70,Math.PI,0);ctx.stroke();
    if(memoryCount()<5){ctx.globalAlpha=.6;ctx.fillStyle="#58dfff";for(let y=-190;y<-20;y+=24)ctx.fillRect(-45,y,90,6)}
    ctx.restore();
  }

  function artProp(wx,groundY,kind,scale=1){
    if(!art.props) return false;
    const x=wx-cameraX;
    if(x<-320||x>W+320) return true;

    const map={
      tree:     [.00,.00,.32,.42,250,280],
      lantern:  [.30,.00,.22,.36,120,180],
      fence:    [.58,.00,.42,.24,270,120],
      cart:     [.00,.34,.43,.25,235,135],
      grave:    [.42,.31,.21,.25,120,135],
      cottage:  [.66,.27,.34,.34,245,225],
      crates:   [.00,.58,.35,.24,220,145],
      shrine:   [.39,.58,.31,.28,165,160],
      gate:     [.72,.58,.28,.29,190,170]
    };
    const a=map[kind]; if(!a) return false;
    const [sx,sy,sw,sh,bw,bh]=a;
    const dw=bw*scale, dh=bh*scale;
    drawCrop(art.props,sx,sy,sw,sh,x-dw/2,groundY-dh,dw,dh);
    return true;
  }

  function scenery(){
    for(const p of platforms)ground(p);

    if(art.props){
      // Vila
      artProp(520,590,"cottage",.92);artProp(1040,590,"cottage",.82);
      artProp(280,590,"tree",.9);artProp(1380,590,"tree",.78);
      artProp(160,590,"lantern",.88);artProp(760,590,"lantern",.82);artProp(1320,590,"lantern",.86);
      artProp(385,590,"cart",.72);artProp(910,590,"crates",.58);
      // Pomar
      for(let x=1580;x<3180;x+=390){artProp(x,590,"tree",.8);artProp(x+150,590,"cart",.58);}
      // Cemitério
      for(let x=3290;x<4970;x+=235)artProp(x,590,"grave",.78);
      artProp(3910,590,"shrine",.88);artProp(3440,590,"lantern",.72);artProp(4680,590,"lantern",.74);
      // Pontes
      artProp(5210,590,"fence",.75);artProp(6160,470,"shrine",.72);artProp(6800,520,"lantern",.67);
      // Ruínas
      for(let x=7080;x<8700;x+=465){artProp(x,590,"grave",.72);artProp(x+190,590,"tree",.55);}
      artProp(7860,590,"cottage",.76);artProp(8450,590,"shrine",.82);
      // Arena
      artProp(9200,590,"lantern",.82);artProp(10700,590,"lantern",.82);
      artProp(9650,590,"gate",1.15);
      gate(8820);
      return;
    }
    // Vila
    cottage(520,590,.75);cottage(1040,590,.68);tree(280,590,.8);tree(1380,590,.72);
    lantern(160,590,.9);lantern(760,590,.85);lantern(1320,590,.9);pumpkin(380,590,.8);pumpkin(890,590,.75);
    // Pomar
    for(let x=1580;x<3180;x+=360){tree(x,590,.78);pumpkin(x+115,590,.95);pumpkin(x+160,590,.72)}
    // Cemitério
    for(let x=3270,i=0;x<4970;x+=190,i++)grave(x,590,i);
    shrine(3900,590);lantern(3440,590,.72);lantern(4680,590,.75);
    // Pontes
    lantern(5200,590,.8);shrine(6160,470);lantern(6800,520,.7);
    // Ruínas
    for(let x=7070;x<8700;x+=440){grave(x,590,1);tree(x+180,590,.62)}
    cottage(7860,590,.78);shrine(8450,590);
    // Arena
    gate(8820);lantern(9200,590,.85);lantern(10700,590,.85);
    ctx.fillStyle="#172038";
    const ax=9700-cameraX; if(ax>-350&&ax<W+350){ctx.fillRect(ax-250,240,35,350);ctx.fillRect(ax+215,240,35,350);ctx.strokeStyle="#25304d";ctx.lineWidth=25;ctx.beginPath();ctx.arc(ax,300,235,Math.PI,0);ctx.stroke();}
  }

  function drawEleanor(wx,groundY,pose=0,scale=1){
    const x=wx-cameraX;if(x<-100||x>W+100)return;
    const bob=Math.sin(performance.now()/430+pose)*5;

    if(art.eleanor){
      const frame=Math.max(0,Math.min(7,pose|0));
      const col=frame%4,row=Math.floor(frame/4);
      const dw=112*scale,dh=168*scale;
      const g=ctx.createRadialGradient(x,groundY-86,8,x,groundY-86,72*scale);
      g.addColorStop(0,"#a7eeff55");g.addColorStop(1,"#53cfff00");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,groundY-86,72*scale,0,Math.PI*2);ctx.fill();
      drawAtlasCell(art.eleanor,4,2,col,row,x-dw/2,groundY-dh+20+bob,dw,dh);
      return;
    }
    ctx.save();ctx.translate(x,groundY-72+bob);ctx.scale(scale,scale);
    const glow=ctx.createRadialGradient(0,-20,4,0,-20,56);glow.addColorStop(0,"#a9efff66");glow.addColorStop(1,"#4ccfff00");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,-20,56,0,Math.PI*2);ctx.fill();
    // ghost tail
    ctx.fillStyle="#43bce1";ctx.beginPath();ctx.moveTo(-20,8);ctx.quadraticCurveTo(-24,38,0,50);ctx.quadraticCurveTo(14,62,24,42);ctx.quadraticCurveTo(8,45,13,24);ctx.lineTo(18,8);ctx.closePath();ctx.fill();
    // dress
    ctx.fillStyle="#d8c5a9";ctx.beginPath();ctx.moveTo(-21,-34);ctx.lineTo(-27,13);ctx.lineTo(27,13);ctx.lineTo(20,-34);ctx.closePath();ctx.fill();ctx.fillStyle="#6b4c3e";ctx.fillRect(-20,-24,40,8);
    // hair + face
    ctx.fillStyle="#4b2b28";ctx.beginPath();ctx.arc(0,-56,28,0,Math.PI*2);ctx.fill();ctx.fillRect(-27,-57,9,38);ctx.fillRect(18,-57,9,38);
    ctx.fillStyle="#f0d9c2";ctx.beginPath();ctx.arc(0,-53,19,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#2b2732";ctx.fillRect(-9,-57,4,6);ctx.fillRect(5,-57,4,6);
    // bow + flower
    ctx.fillStyle="#251a27";ctx.fillRect(-25,-80,16,10);ctx.fillRect(-12,-78,12,8);ctx.fillStyle="#d79a39";ctx.fillRect(14,-78,5,5);ctx.fillRect(20,-74,4,4);
    // arms/key
    ctx.fillStyle="#f0d9c2";ctx.fillRect(-28,-24,10,7);ctx.fillRect(18,-24,10,7);ctx.strokeStyle="#f4bd3f";ctx.lineWidth=3;ctx.beginPath();ctx.arc(27,-15,7,0,Math.PI*2);ctx.moveTo(27,-8);ctx.lineTo(27,6);ctx.lineTo(34,6);ctx.stroke();
    ctx.restore();
  }

  function drawMemory(m){
    if(m.collected)return;const x=m.x-cameraX;if(x<-80||x>W+80)return;const y=m.y+Math.sin(performance.now()/380+m.bob)*9;

    if(art.memories){
      const frames={key:0,storm:1,candle:2,letter:3,family:4};
      const frame=frames[m.id] ?? 5;
      const col=frame%3,row=Math.floor(frame/3);
      const pulse=1+Math.sin(performance.now()/260+m.bob)*.05;
      const dw=90*pulse,dh=90*pulse;
      const g=ctx.createRadialGradient(x,y,2,x,y,57);
      g.addColorStop(0,"#dfffffaa");g.addColorStop(.42,"#62dcff55");g.addColorStop(1,"#3b89ff00");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,57,0,Math.PI*2);ctx.fill();
      drawAtlasCell(art.memories,3,3,col,row,x-dw/2,y-dh/2,dw,dh);
      return;
    }

    ctx.save();ctx.translate(x,y);
    const g=ctx.createRadialGradient(0,0,2,0,0,44);g.addColorStop(0,"#eaffffdd");g.addColorStop(.35,"#62ddff77");g.addColorStop(1,"#298be000");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,44,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#7eeaff";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(18,-7);ctx.lineTo(7,23);ctx.lineTo(-16,14);ctx.lineTo(-20,-9);ctx.closePath();ctx.stroke();
    ctx.fillStyle="#ffd36a";
    const k=memoryIcons[m.id];
    if(k===0){ctx.beginPath();ctx.arc(-2,-3,7,0,Math.PI*2);ctx.strokeStyle="#ffd36a";ctx.stroke();ctx.fillRect(5,-1,19,4);ctx.fillRect(18,3,4,7)}
    else if(k===1){ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#76eaff";ctx.fillRect(-17,6,34,4);ctx.fillRect(-10,-12,20,3)}
    else if(k===2){ctx.fillRect(-15,-12,30,24);ctx.fillStyle="#5b3a24";ctx.fillRect(-11,-8,22,16);ctx.fillStyle="#ffdba0";ctx.fillRect(-7,-4,14,9)}
    else if(k===3){ctx.fillRect(-9,4,18,14);ctx.fillStyle="#fff2a6";ctx.beginPath();ctx.moveTo(0,-18);ctx.quadraticCurveTo(12,-5,0,5);ctx.quadraticCurveTo(-12,-5,0,-18);ctx.fill()}
    else {ctx.fillRect(-16,-11,32,22);ctx.fillStyle="#8f5a2d";ctx.fillRect(-12,-7,24,2);ctx.fillRect(-12,-1,18,2);ctx.fillRect(-12,5,21,2)}
    ctx.restore();
  }

  function drawEnemy(e){
    if(!e.alive)return;const x=e.x-cameraX;if(x<-110||x>W+110)return;

    if(art.enemies){
      const row=e.type==="crow"?0:e.type==="wisp"?1:2;
      let frame=e.hit>0?3:Math.floor(e.t*5)%2;
      if(e.attack>1.75)frame=2;
      const sizes=e.type==="crow"?[108,92]:e.type==="wisp"?[118,104]:[118,92];
      const [dw,dh]=sizes;
      const flip=e.type!=="wisp" && e.dir<0;
      drawAtlasCell(art.enemies,4,3,frame,row,x-dw/2,e.y-dh/2,dw,dh,flip,e.hit>0?.62:1);
      return;
    }

    ctx.save();ctx.translate(x,e.y);
    if(e.hit>0)ctx.globalAlpha=.55;
    if(e.type==="crow"){
      ctx.scale(e.dir,1);ctx.fillStyle="#11101a";ctx.beginPath();ctx.ellipse(0,0,23,15,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(-40,-25-Math.sin(e.t*10)*10);ctx.lineTo(-17,7);ctx.fill();ctx.beginPath();ctx.moveTo(4,-7);ctx.lineTo(36,-28+Math.sin(e.t*10)*10);ctx.lineTo(17,7);ctx.fill();ctx.fillStyle="#ff7c22";ctx.fillRect(10,-5,4,4);ctx.fillStyle="#3a2630";ctx.beginPath();ctx.moveTo(20,-2);ctx.lineTo(34,2);ctx.lineTo(20,5);ctx.fill();
    }else if(e.type==="wisp"){
      const g=ctx.createRadialGradient(0,0,2,0,0,43);g.addColorStop(0,"#fff0a6");g.addColorStop(.3,"#ff8a25");g.addColorStop(1,"#59d9ff00");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,43,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ff7d1b";ctx.beginPath();ctx.moveTo(-24,12);ctx.quadraticCurveTo(-30,-20,0,-35);ctx.quadraticCurveTo(32,-16,23,14);ctx.quadraticCurveTo(10,30,0,17);ctx.quadraticCurveTo(-12,31,-24,12);ctx.fill();ctx.fillStyle="#190f18";ctx.fillRect(-30,-30,60,8);ctx.beginPath();ctx.moveTo(-22,-30);ctx.lineTo(2,-62);ctx.lineTo(22,-30);ctx.fill();ctx.fillStyle="#ffe15c";ctx.fillRect(-10,-5,5,5);ctx.fillRect(5,-5,5,5);
    }else{
      ctx.scale(e.dir,1);ctx.fillStyle="#472515";ctx.fillRect(-30,8,60,11);ctx.fillRect(-25,18,12,12);ctx.fillRect(13,18,12,12);ctx.fillStyle="#cf5410";ctx.beginPath();ctx.ellipse(0,0,28,22,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f27618";ctx.beginPath();ctx.ellipse(-8,0,10,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(8,0,10,20,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffe060";ctx.fillRect(-13,-7,7,6);ctx.fillRect(6,-7,7,6);ctx.fillRect(-11,7,22,5);ctx.strokeStyle="#6d3817";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-25,8);ctx.lineTo(-47,20);ctx.moveTo(25,8);ctx.lineTo(47,20);ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoss(){
    if((!boss.started&& !boss.defeated)||boss.defeated)return;const x=boss.x-cameraX;if(x<-220||x>W+220)return;

    if(art.boss){
      let frame=0;
      if(boss.hit>0)frame=6;
      else if(boss.hp<=3)frame=5;
      else if(boss.shot>.95)frame=2;
      else frame=Math.floor(boss.t*2)%2;
      const col=frame%4,row=Math.floor(frame/4);
      const dw=265,dh=330;
      const g=ctx.createRadialGradient(x,boss.y,10,x,boss.y,170);
      g.addColorStop(0,"#6ee8ff55");g.addColorStop(.55,"#6e5eff22");g.addColorStop(1,"#552cff00");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,boss.y,170,0,Math.PI*2);ctx.fill();
      drawAtlasCell(art.boss,4,2,col,row,x-dw/2,boss.y-dh/2,dw,dh,false,boss.hit>0?.65:1);
      return;
    }

    ctx.save();ctx.translate(x,boss.y);if(boss.hit>0)ctx.globalAlpha=.55;
    const g=ctx.createRadialGradient(0,10,10,0,10,150);g.addColorStop(0,"#6ee8ff55");g.addColorStop(1,"#7f45ff00");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,10,150,0,Math.PI*2);ctx.fill();
    // spectral tail
    ctx.fillStyle="#306fd0";ctx.beginPath();ctx.moveTo(-48,35);ctx.quadraticCurveTo(-78,105,-10,132);ctx.quadraticCurveTo(18,150,55,112);ctx.quadraticCurveTo(27,115,43,58);ctx.closePath();ctx.fill();
    // cloak/hair
    ctx.fillStyle="#5b2b25";ctx.beginPath();ctx.moveTo(-75,-10);ctx.quadraticCurveTo(-85,75,-50,100);ctx.lineTo(58,100);ctx.quadraticCurveTo(90,50,72,-12);ctx.closePath();ctx.fill();
    ctx.fillStyle="#a3451e";for(const [dx,dy] of [[-55,15],[52,6],[-35,72],[35,66]]){ctx.fillRect(dx,dy,20,8);ctx.fillRect(dx+6,dy-6,8,20)}
    // face/hair
    ctx.fillStyle="#3d2429";ctx.beginPath();ctx.arc(0,-55,48,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e8c7ad";ctx.beginPath();ctx.arc(0,-48,30,0,Math.PI*2);ctx.fill();ctx.fillStyle="#17203b";ctx.fillRect(-14,-54,6,8);ctx.fillRect(8,-54,6,8);
    // crown-hat
    ctx.fillStyle="#40231b";ctx.fillRect(-58,-92,116,12);ctx.beginPath();ctx.moveTo(-38,-92);ctx.lineTo(0,-145);ctx.lineTo(40,-92);ctx.fill();
    ctx.fillStyle="#d5621c";ctx.fillRect(-34,-104,18,7);ctx.fillRect(19,-116,19,7);
    // arms + lantern
    ctx.strokeStyle="#e7c1a4";ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-48,10);ctx.lineTo(-82,42);ctx.moveTo(48,10);ctx.lineTo(82,37);ctx.stroke();ctx.fillStyle="#d78622";ctx.fillRect(70,30,30,38);ctx.fillStyle="#fff0a0";ctx.fillRect(77,37,16,23);
    // blue flames
    ctx.fillStyle="#4bdcff";for(let i=0;i<4;i++){const a=boss.t*1.8+i*Math.PI/2,fx=Math.cos(a)*105,fy=Math.sin(a)*55;ctx.beginPath();ctx.arc(fx,fy,12,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(fx-8,fy);ctx.lineTo(fx,fy-25);ctx.lineTo(fx+8,fy);ctx.fill();}
    ctx.restore();
  }

  function drawProjectiles(){
    projectiles.forEach(p=>{const x=p.x-cameraX;if(x<-30||x>W+30)return;ctx.save();ctx.translate(x,p.y);const col=p.color==="violet"?"#9c72ff":"#69e8ff";const g=ctx.createRadialGradient(0,0,1,0,0,24);g.addColorStop(0,"#fff");g.addColorStop(.25,col);g.addColorStop(1,"#4a42ff00");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.restore();});
  }

  function playerFrame(){
    if(!player.onGround)return 3;
    if(Math.abs(player.vx)<18)return 0;
    const s=input.run ? .09 : .15;return player.anim%(s*2)<s?1:2;
  }

  function drawPlayer(){
    if(!jack)return;const x=player.x-cameraX;ctx.save();ctx.globalAlpha=player.inv>0&&Math.floor(player.inv*12)%2?0.35:1;ctx.translate(x,player.y);ctx.scale(player.dir,1);ctx.drawImage(jack,playerFrame()*128,0,128,128,-66,-82,132,132);ctx.restore();
    if(lightPulse>0){
      const progress=1-lightPulse/.32,r=40+progress*170;ctx.save();ctx.globalAlpha=lightPulse/.32*.75;ctx.strokeStyle="#ffe989";ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,player.y-18,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#71e8ff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,player.y-18,r+10,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }

  function draw(){
    ctx.save();
    if(shake>0)ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*7);
    sky();scenery();
    memories.forEach(drawMemory);
    if(!metEleanor||player.x<1650)drawEleanor(1240,590,0,1);
    if(memoryCount()>=3&&player.x>6900&&player.x<8750)drawEleanor(8060,590,4,1.05);
    enemies.forEach(drawEnemy);
    drawBoss();
    drawProjectiles();
    drawPlayer();
    // arena mist / final path
    if(boss.defeated||finalSequence){
      for(let i=0;i<9;i++){const x=9300+i*150-cameraX,y=545-Math.sin(performance.now()/350+i)*16;ctx.globalAlpha=.38;ctx.fillStyle="#71e8ff";ctx.beginPath();ctx.arc(x,y,8+(i%3)*3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
      if(finalSequence)drawEleanor(10450,590,7,1.1);
    }
    const vig=ctx.createRadialGradient(W/2,H/2,260,W/2,H/2,760);vig.addColorStop(0,"#0000");vig.addColorStop(1,"#0008");ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  function loop(now){
    const dt=(now-last)/1000;last=now;update(dt);draw();requestAnimationFrame(loop);
  }

  function setKey(ev,down){
    const k=ev.key.toLowerCase();
    if(ev.defaultPrevented) return;
    if(["arrowleft","arrowright","arrowup"," ","a","d","shift","e","enter","f","k"].includes(k))ev.preventDefault();

    // O próprio sistema de diálogo cuida de E, Enter e Espaço.
    // Aqui só bloqueamos o controle do personagem para não avançar duas falas de uma vez.
    if(dialogue.active){
      input.left=false; input.right=false; input.run=false;
      return;
    }

    if(k==="arrowleft"||k==="a")input.left=down;
    if(k==="arrowright"||k==="d")input.right=down;
    if(k==="shift")input.run=down;
    if(down&&(k==="arrowup"||k===" "))input.jump=true;
    if(!down&&(k==="arrowup"||k===" ")&&player.vy<-180)player.vy*=.55;
    if(down&&(k==="e"||k==="enter"))tryInteract();
    if(down&&(k==="f"||k==="k"))useLight();
  }
  addEventListener("keydown",e=>setKey(e,true),{passive:false});
  addEventListener("keyup",e=>setKey(e,false),{passive:false});

  function bindHold(id,key){
    const b=document.getElementById(id);if(!b)return;
    const on=e=>{e.preventDefault();input[key]=true},off=e=>{e.preventDefault();input[key]=false};
    b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off);
  }
  bindHold("leftBtn","left");bindHold("rightBtn","right");
  document.getElementById("jumpBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();input.jump=true});
  document.getElementById("lightBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();useLight()});
  document.getElementById("interactBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();tryInteract()});
  ui.interact?.addEventListener("click",tryInteract);

  document.getElementById("startGame").onclick=()=>{
    document.getElementById("intro").hidden=true;running=true;last=performance.now();syncHud();showSection(sectionForX(player.x));
    const t=document.getElementById("tutorial");t.classList.add("show");setTimeout(()=>t.classList.remove("show"),5500);
  };

  document.getElementById("restartBtn").onclick=()=>{
    Object.values(story.states).forEach(key=>localStorage.removeItem(key));
    localStorage.removeItem("jack-phase1-complete");localStorage.setItem("jack-light-level","1");localStorage.setItem("jack-phase1-version","3");
    location.reload();
  };

  syncHud();
  loadAssets().then(()=>requestAnimationFrame(loop)).catch(err=>{
    console.error(err);showMessage("Falha ao carregar o sprite do Jack.");requestAnimationFrame(loop);
  });
})();