(()=>{"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),W=1280,H=720,WORLD=11250,G=1500;
const ui={
 obj:document.querySelector("#objective strong"),
 health:document.getElementById("healthValue"),
 banner:document.getElementById("sectionBanner"),
 msg:document.getElementById("message"),
 intro:document.getElementById("intro"),
 prototype:document.getElementById("phase4Prototype")
};
const dialogue=new window.DialogueSystem(document.getElementById("dialogue"));
const story=window.PHASE4_STORY;if(!story)throw new Error("PHASE4_STORY não carregou.");
const journey=window.JackJourney||null,url=new URLSearchParams(location.search),journeyMode=url.get("journey")==="1",replayMode=url.get("replay")==="1",forceNew=url.get("new")==="1";
const SAVE_KEY="jack-phase4-save",CHECKPOINT_KEY="jack-phase4-checkpoint",MARA_KEY="jack-item-mara-wood-key";
// Migração: jogadores que concluíram Halloween III antes da chave persistente
// continuam podendo abrir a primeira passagem de Halloween IV.
if(localStorage.getItem("jack-phase3-complete")==="yes"&&localStorage.getItem(MARA_KEY)!=="yes"){
 localStorage.setItem(MARA_KEY,"yes");
}
if(replayMode)journey?.beginReplay(4,[SAVE_KEY,CHECKPOINT_KEY]);
if(forceNew){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CHECKPOINT_KEY)}
let saveData=null;if(journeyMode&&!replayMode){try{saveData=JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch(_){saveData=null}}

const input={left:false,right:false,down:false,run:false,jump:false};
let running=false,last=performance.now(),cam=0,section=-1,jack=null,keyImg=null,jackFrameOverrides={};
let idleTime=0,waitSitFrame=0,waitSitClock=0,waitSitActive=false,waitSitImages=[];
let lastPlayerAction=performance.now();
let playerLife=Math.max(1,Math.min(3,Number(saveData?.playerLife)||3)),memoryLight=0,memoryPulse=0,gateMsg=0;
let activeCheckpoint=saveData?.activeCheckpoint||localStorage.getItem(CHECKPOINT_KEY)||"";
let introPlayed=!!saveData?.introPlayed,doorOpened=!!saveData?.doorOpened,pilgrimMet=!!saveData?.pilgrimMet,tracesSolved=!!saveData?.tracesSolved,prototypeEndPlayed=!!saveData?.prototypeEndPlayed,arenaReached=!!saveData?.arenaReached;
let bridgeFearPlayed=!!saveData?.bridgeFearPlayed,bridgeCrossedPlayed=!!saveData?.bridgeCrossedPlayed,stolenPlazaPlayed=!!saveData?.stolenPlazaPlayed,collectorApproachPlayed=!!saveData?.collectorApproachPlayed,arenaEdgePlayed=!!saveData?.arenaEdgePlayed;
let traces=Array.isArray(saveData?.traces)?saveData.traces.slice(0,3).map(Boolean):[false,false,false];

const p={x:Number.isFinite(saveData?.x)?saveData.x:110,y:Number.isFinite(saveData?.y)?saveData.y:470,w:46,h:86,vx:0,vy:0,dir:saveData?.dir===-1?-1:1,on:false,coyote:0,buffer:0,anim:0,attack:0,inv:0};

// Peregrina — companheira narrativa. Antes dos sprites definitivos, o protótipo
// já possui posição, distância de seguimento, espera, corrida e travessia própria.
let pilgrimBridgeDone=!!saveData?.pilgrimBridgeDone||Number(saveData?.x||0)>=7900;
let pilgrimX=Number.isFinite(saveData?.pilgrimX)?saveData.pilgrimX:
 (arenaReached?10530:collectorApproachPlayed?9950:stolenPlazaPlayed?8300:pilgrimBridgeDone?8040:prototypeEndPlayed?4850:tracesSolved?4680:2580);
if(!pilgrimBridgeDone&&pilgrimX>6350)pilgrimX=6250;
let pilgrimFeetY=590,pilgrimDir=1,pilgrimMode="wait",pilgrimMoveSpeed=0;
const pilgrimBridge={active:false,segment:0,t:0};
const pilgrimBridgeWaypoints=[
 {x:6250,y:590},{x:6580,y:520},{x:6850,y:455},{x:7135,y:515},
 {x:7425,y:440},{x:7705,y:505},{x:8010,y:590}
];

const platforms=[
 // 1 — Porta / começo da estrada.
 {x:0,y:590,w:980,h:130,kind:"road"},
 {x:1080,y:590,w:940,h:130,kind:"road"},
 {x:520,y:500,w:220,h:26,kind:"ledge"},
 {x:1300,y:485,w:210,h:26,kind:"ledge"},
 {x:1730,y:430,w:190,h:26,kind:"ledge"},

 // 2 — Povoado sem Nomes.
 {x:2140,y:590,w:980,h:130,kind:"village"},
 {x:2560,y:500,w:230,h:26,kind:"village"},
 {x:2850,y:445,w:190,h:26,kind:"village"},

 // 3 — Campo das Pegadas.
 {x:3240,y:590,w:1420,h:130,kind:"traces"},
 {x:3380,y:510,w:180,h:26,kind:"traces"},
 {x:3720,y:465,w:220,h:26,kind:"traces"},
 {x:4120,y:420,w:180,h:26,kind:"traces"},
 {x:4470,y:500,w:160,h:26,kind:"traces"},

 // 4 — Arquivo Rasurado: corredor amplo para lutas e exploração vertical.
 {x:4760,y:590,w:1180,h:130,kind:"archive"},
 {x:4930,y:480,w:200,h:26,kind:"archive"},
 {x:5290,y:420,w:190,h:26,kind:"archive"},
 {x:5650,y:485,w:220,h:26,kind:"archive"},

 // 5 — Ponte dos Ninguém: primeiro trecho realmente exigente de plataforma.
 {x:6070,y:590,w:360,h:130,kind:"bridge"},
 {x:6500,y:520,w:170,h:24,kind:"bridge"},
 {x:6760,y:455,w:180,h:24,kind:"bridge"},
 {x:7040,y:515,w:190,h:24,kind:"bridge"},
 {x:7340,y:440,w:170,h:24,kind:"bridge"},
 {x:7600,y:505,w:210,h:24,kind:"bridge"},

 // 6 — Praça dos Nomes Roubados: área larga para encontros em grupo.
 {x:7900,y:590,w:930,h:130,kind:"plaza"},
 {x:8120,y:480,w:180,h:26,kind:"plaza"},
 {x:8460,y:430,w:180,h:26,kind:"plaza"},

 // 7 — Aproximação / Casa do Coletor.
 {x:8940,y:590,w:560,h:130,kind:"collector"},
 {x:9030,y:490,w:200,h:26,kind:"collector"},
 {x:9340,y:435,w:180,h:26,kind:"collector"},
 {x:9620,y:590,w:410,h:130,kind:"collector"},
 {x:9760,y:485,w:170,h:26,kind:"collector"},
 {x:10150,y:590,w:420,h:130,kind:"collector"},
 {x:10220,y:470,w:170,h:26,kind:"collector"},

 // 8 — Arena provisória do Coletor.
 {x:10670,y:590,w:580,h:130,kind:"arena"}
]

const checkpoints=[
 {id:"road",x:1870,groundY:590,respawnX:1800,respawnY:504,name:"Marco sem inscrição"},
 {id:"village",x:2910,groundY:590,respawnX:2840,respawnY:504,name:"Marco do Povoado"},
 {id:"traces",x:4580,groundY:590,respawnX:4510,respawnY:504,name:"Marco das Pegadas"},
 {id:"archive",x:5750,groundY:590,respawnX:5680,respawnY:504,name:"Marco do Arquivo"},
 {id:"plaza",x:8150,groundY:590,respawnX:8080,respawnY:504,name:"Marco da Praça"},
 {id:"collector",x:9950,groundY:590,respawnX:9880,respawnY:504,name:"Marco sem Nome"}
]

const ENEMY_ARCHETYPES=Object.freeze({
 eraser:Object.freeze({
   label:"RASURADOR",defeatMessage:"A tinta virou cinza. O rastro permaneceu.",
   hitMessage:"A Luz abriu fissuras na rasura.",
   width:58,height:58,patrolSpeed:38,chaseSpeed:112,attackSpeed:175,
   detectRange:410,loseRange:590,attackRange:66,lightRange:205,
   alertTime:.22,idleTime:.7,patrolTime:2.2,
   attackWindup:.34,attackActive:.15,attackRecover:.62,
   attackCooldown:.82,hitTime:.28,dissolveTime:.78,
   knockbackX:260,knockbackY:-310
 }),
 ashHound:Object.freeze({
   label:"CÃO DE CINZA",defeatMessage:"O corpo se rompeu em cinza morna e desapareceu no vento.",
   hitMessage:"A Luz incendiou as rachaduras de cinza.",
   width:76,height:46,patrolSpeed:62,chaseSpeed:188,attackSpeed:315,
   detectRange:525,loseRange:760,attackRange:82,lightRange:220,
   alertTime:.16,idleTime:.42,patrolTime:1.55,
   attackWindup:.22,attackActive:.19,attackRecover:.48,
   attackCooldown:.68,hitTime:.22,dissolveTime:.66,
   knockbackX:340,knockbackY:-285
 }),
 hollow:Object.freeze({
   label:"PEREGRINO OCO",defeatMessage:"As roupas caíram vazias. O pó dentro delas não tinha nome.",
   hitMessage:"A Luz atravessou o vazio sob as roupas.",
   revealMessage:"A lanterna revelou um vazio sob as vestes. Agora a Luz pode alcançá-lo.",
   width:68,height:96,patrolSpeed:24,chaseSpeed:58,attackSpeed:112,
   detectRange:345,loseRange:480,attackRange:78,lightRange:210,
   alertTime:.42,idleTime:1.0,patrolTime:2.8,
   attackWindup:.68,attackActive:.24,attackRecover:.9,
   attackCooldown:1.2,hitTime:.38,dissolveTime:.95,
   knockbackX:215,knockbackY:-385,
   needsReveal:true,revealTime:2.8
 }),
 crow:Object.freeze({
   label:"CORVO DO ESQUECIMENTO",defeatMessage:"O corvo se rasgou em penas de papel e letras sem dono.",
   hitMessage:"A Luz atravessou as penas de papel.",
   width:62,height:44,patrolSpeed:78,chaseSpeed:138,diveSpeed:355,
   detectRange:520,loseRange:760,attackRange:175,lightRange:245,
   alertTime:.2,idleTime:.5,patrolTime:1.8,
   attackWindup:.3,attackActive:.42,attackRecover:.65,
   attackCooldown:.92,hitTime:.24,dissolveTime:.72,
   knockbackX:230,knockbackY:-250,
   flying:true
 })
});
const savedDeadEnemies=new Set(Array.isArray(saveData?.deadEnemies)?saveData.deadEnemies:[]);

function createEnemy(id,kind,x,y,options={}){
 const cfg=ENEMY_ARCHETYPES[kind];
 if(!cfg)throw new Error("Arquétipo de inimigo desconhecido: "+kind);
 const defeated=savedDeadEnemies.has(id);
 const dir=options.dir===-1?-1:1;
 const hp=Math.max(1,Number(options.hp)||2);
 return {
   id,kind,label:cfg.label,
   x,y,w:cfg.width,h:cfg.height,
   spawnX:x,spawnY:y,homeY:y,
   minX:Number.isFinite(options.minX)?options.minX:x-150,
   maxX:Number.isFinite(options.maxX)?options.maxX:x+150,
   minY:Number.isFinite(options.minY)?options.minY:y-70,
   maxY:Number.isFinite(options.maxY)?options.maxY:y+70,
   hp,maxHp:hp,
   dir,vx:0,vy:0,
   state:defeated?"dead":"idle",
   stateTimer:defeated?0:.35+(x%5)*.07,
   attackCooldown:0,attackHit:false,
   attackTargetX:x,attackTargetY:y,
   alive:!defeated,defeated,
   alpha:defeated?0:1,
   hitFlash:0,
   exposedTimer:cfg.needsReveal&&options.exposed?cfg.revealTime:0,
   cfg
 };
}
function setEnemyState(e,state,duration=0){
 e.state=state;e.stateTimer=Math.max(0,duration);
 if(state!=="attack")e.attackHit=false;
}
function enemyCanBeHit(e){
 return e&&e.state!=="dead"&&e.state!=="dissolve"&&!e.defeated;
}
function defeatEnemy(e,sourceX){
 if(e.defeated)return;
 e.defeated=true;e.alive=false;e.alpha=1;
 e.vx=(e.x<sourceX?-1:1)*(e.kind==="crow"?95:150);
 e.vy=e.kind==="crow"?-70:0;
 setEnemyState(e,"dissolve",e.cfg.dissolveTime);
 banner(e.label+" DISSIPADO");
 say(e.cfg.defeatMessage);
 save();
}
function hitEnemy(e,damage,sourceX){
 if(!enemyCanBeHit(e))return false;

 // O Peregrino Oco exige duas decisões: primeiro revelar o vazio, depois feri-lo.
 if(e.cfg.needsReveal&&e.exposedTimer<=0){
   e.exposedTimer=e.cfg.revealTime;
   e.hitFlash=.18;memoryPulse=1.05;
   e.vx=(e.x<sourceX?-1:1)*55;
   say(e.cfg.revealMessage);
   return true;
 }

 e.hp=Math.max(0,e.hp-Math.max(1,damage||1));
 e.hitFlash=.22;
 e.vx=(e.x<sourceX?-1:1)*(e.kind==="crow"?120:190);
 memoryPulse=.9;
 if(e.hp<=0)defeatEnemy(e,sourceX);
 else{
   setEnemyState(e,"hit",e.cfg.hitTime);
   say(e.cfg.hitMessage+" "+e.hp+"/"+e.maxHp);
 }
 return true;
}

const enemies=[
 // Estrada — apresentação simples do Rasurador.
 createEnemy("eraser-1","eraser",1510,532,{hp:2,dir:-1,minX:1180,maxX:1930}),

 // Arquivo Rasurado — combinação de grupo, velocidade e defesa.
 createEnemy("eraser-2","eraser",4990,532,{hp:2,dir:1,minX:4810,maxX:5220}),
 createEnemy("hollow-1","hollow",5450,494,{hp:4,dir:-1,minX:5280,maxX:5600}),
 createEnemy("hound-1","ashHound",5750,544,{hp:3,dir:1,minX:5630,maxX:5890}),

 // Ponte dos Ninguém — ameaça aérea enquanto o jogador plataforma.
 createEnemy("crow-1","crow",6690,315,{hp:2,dir:1,minX:6380,maxX:7190,minY:250,maxY:400}),
 createEnemy("crow-2","crow",7440,285,{hp:2,dir:-1,minX:7040,maxX:7790,minY:230,maxY:390}),

 // Praça — arena mista para testar leitura entre famílias.
 createEnemy("eraser-3","eraser",8070,532,{hp:3,dir:1,minX:7960,maxX:8270}),
 createEnemy("hound-2","ashHound",8420,544,{hp:3,dir:-1,minX:8270,maxX:8580}),
 createEnemy("hollow-2","hollow",8700,494,{hp:5,dir:-1,minX:8580,maxX:8780}),

 // Aproximação do Coletor — pressão física antes da arena.
 createEnemy("hound-3","ashHound",9210,544,{hp:4,dir:1,minX:8980,maxX:9440}),
 createEnemy("hollow-3","hollow",9780,494,{hp:5,dir:-1,minX:9640,maxX:9980}),
 createEnemy("crow-3","crow",10280,305,{hp:3,dir:-1,minX:10160,maxX:10540,minY:245,maxY:390})
]
function say(t){ui.msg.textContent=t;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),2600)}
function banner(t){ui.banner.textContent=t;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),1900)}
function syncHud(){ui.health.textContent="♥ ".repeat(playerLife).trim()||"♡"}
function deadEnemies(){return enemies.filter(e=>e.defeated||e.state==="dead").map(e=>e.id)}
function markPlayerAction(){
 lastPlayerAction=performance.now();
 idleTime=0;waitSitClock=0;waitSitFrame=0;waitSitActive=false;
}
function save(){
 if(!journeyMode||replayMode||!journey?.isActive()||journey.currentPhase()!==4)return;
 localStorage.setItem(SAVE_KEY,JSON.stringify({
   x:p.x,y:p.y,dir:p.dir,playerLife,activeCheckpoint,introPlayed,doorOpened,pilgrimMet,traces:[...traces],tracesSolved,prototypeEndPlayed,arenaReached,
   bridgeFearPlayed,bridgeCrossedPlayed,stolenPlazaPlayed,collectorApproachPlayed,arenaEdgePlayed,
   pilgrimX,pilgrimBridgeDone,deadEnemies:deadEnemies(),savedAt:Date.now()
 }));
}
function resetPilgrimAfterRespawn(){
 if(!pilgrimMet)return;
 pilgrimBridge.active=false;pilgrimFeetY=590;pilgrimMode="wait";
 if(activeCheckpoint==="collector"){pilgrimBridgeDone=true;pilgrimX=9820;return}
 if(activeCheckpoint==="plaza"){pilgrimBridgeDone=true;pilgrimX=8030;return}
 if(activeCheckpoint==="archive"){pilgrimBridgeDone=false;pilgrimX=5850;return}
 if(activeCheckpoint==="traces"){pilgrimX=tracesSolved?4660:3230;return}
 if(activeCheckpoint==="village"){pilgrimX=2860;return}
 pilgrimX=2580;
}
function respawn(msg){
 const cp=checkpoints.find(q=>q.id===activeCheckpoint);
 p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;p.on=false;p.inv=1.2;playerLife=3;syncHud();
 resetPilgrimAfterRespawn();
 if(msg)say(msg);save();
}
function hurtPlayer(sourceX,forceX=260,forceY=-310,sourceKind=""){
 if(p.inv>0)return;
 markPlayerAction();
 playerLife--;syncHud();p.inv=1.15;p.vy=forceY;p.vx=(p.x<sourceX?-1:1)*forceX;
 if(sourceKind==="crow")memoryLight=0;
 if(playerLife<=0)respawn("A estrada apagou seus passos — mas a lanterna lembrou o caminho.");
 else{
   const msg=sourceKind==="crow"?"O Corvo roubou o brilho da lanterna. ":
     sourceKind==="ashHound"?"O Cão de Cinza atravessou a guarda de Jack. ":
     sourceKind==="hollow"?"O golpe do Peregrino Oco parecia vir de dentro das roupas. ":"A rasura mordeu a luz. ";
   say(msg+playerLife+"/3.");
 }
}
function updateCheckpoint(){
 const pc=p.x+p.w/2,feet=p.y+p.h;
 for(const cp of checkpoints){
   if(activeCheckpoint===cp.id)continue;
   if(Math.abs(pc-cp.x)<110&&Math.abs(feet-cp.groundY)<105){
     activeCheckpoint=cp.id;localStorage.setItem(CHECKPOINT_KEY,cp.id);playerLife=3;syncHud();memoryPulse=.8;
     banner("VOCÊ PASSOU POR AQUI");say(cp.name+" guardou seus passos.");save();
   }
 }
}

function img(src){return new Promise((r,j)=>{const im=new Image();im.onload=()=>r(im);im.onerror=j;im.src=src+"?v=phase4-1"})}
function buildCleanJackFrame(image,frame,eraseRects=[]){
 const cfg=window.JACK_ANIMATIONS,cell=cfg?.cell||320,cols=cfg?.cols||8;
 const cv=document.createElement("canvas");cv.width=cell;cv.height=cell;
 const cx=cv.getContext("2d"),col=frame%cols,row=Math.floor(frame/cols);
 cx.drawImage(image,col*cell,row*cell,cell,cell,0,0,cell,cell);
 eraseRects.forEach(r=>cx.clearRect(...r));
 return cv;
}
function buildJackFrameOverrides(image){
 // Correção oficial já usada nas outras fases:
 // 25 remove resíduo lateral; 26 remove o pé/boot fantasma sobre a cabeça.
 return {
   25:buildCleanJackFrame(image,25,[
     [260,0,60,320]
   ]),
   26:buildCleanJackFrame(image,26,[
     [126,0,76,82],
     [126,82,54,30],
     [202,0,28,32]
   ])
 };
}
const jackReady=img("../assets/game/phase1/sprites-hd/jack-atlas-hd.png")
 .then(im=>{jack=im;jackFrameOverrides=buildJackFrameOverrides(im);return im})
 .catch(()=>{});
// Mesma animação oficial de descanso usada nas fases anteriores.
// É opcional e não bloqueia o carregamento inicial da Fase 4.
const waitSitFiles=Array.from({length:11},(_,i)=>"../assets/sprites/jack/wait-sit/jack-wait-"+String(i+1).padStart(2,"0")+".png");
waitSitFiles.forEach((src,i)=>img(src).then(im=>waitSitImages[i]=im).catch(()=>{}));
const keyReady=img("../assets/game/phase3/items/mara-wood-key-glow.png").then(im=>keyImg=im).catch(()=>{});
const jackPortraitFiles=["jack-00-neutral.png","jack-01-serious.png","jack-02-smirk.png","jack-03-surprised.png","jack-04-determined.png","jack-05-resolved.png"];
const jackPortraitReady=Promise.allSettled(jackPortraitFiles.map(f=>img("../assets/game/phase1/portraits-hd/"+f))).then(rs=>rs.map(r=>r.status==="fulfilled"?r.value:null));
const dialogueReady=jackPortraitReady.then(frames=>dialogue.setAssets({jack:{frames}}));
window.__PHASE_ASSETS_READY=Promise.allSettled([jackReady,keyReady,dialogueReady]);

function jackFrame(){
 const a=window.JACK_ANIMATIONS?.animations;if(!a)return 0;
 if(p.attack>0){const dur=window.JACK_ANIMATIONS.timing?.attackDuration||.48,q=Math.max(0,Math.min(.999,(dur-p.attack)/dur));return a.attack[Math.min(a.attack.length-1,Math.floor(q*a.attack.length))]}
 if(!p.on){if(p.vy<-350)return a.jumpStart[0];if(p.vy<-80)return a.jumpRise[0];if(p.vy<130)return a.jumpApex[0];return a.jumpFall[0]}
 if(input.down)return a.crouch[0];
 const sp=Math.abs(p.vx);if(sp>18){const seq=input.run&&sp>170?a.run:a.walk,fps=input.run?12:9;return seq[Math.floor(p.anim*fps)%seq.length]}
 return a.idle[Math.floor(p.anim*2.4)%a.idle.length];
}
function drawJack(){
 if(waitSitActive&&!dialogue.active){
   const im=waitSitImages[waitSitFrame];
   if(im){
     const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
     // Frames 01–05 já correspondem bem ao tamanho do Jack.
     // Nos 06–11 ele ocupa menos área do PNG, então compensamos escala e baseline.
     const seated=waitSitFrame>=5;
     const targetH=seated?222:164,targetW=iw*(targetH/ih);
     const groundY=p.y+p.h+(seated?22:2);
     const dx=p.x-cam+p.w/2-targetW/2,dy=groundY-targetH;
     ctx.save();
     ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*12)%2?.42:1;
     ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
     if(p.dir<0){ctx.translate(dx+targetW,0);ctx.scale(-1,1);ctx.drawImage(im,0,dy,targetW,targetH)}
     else ctx.drawImage(im,dx,dy,targetW,targetH);
     ctx.restore();
     return;
   }
 }
 if(p.on){ctx.save();ctx.globalAlpha=.2;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(p.x-cam+p.w/2,p.y+p.h+1,18,3,0,0,Math.PI*2);ctx.fill();ctx.restore()}
 if(!jack){ctx.fillStyle="#eee";ctx.fillRect(p.x-cam,p.y,p.w,p.h);return}
 const cfg=window.JACK_ANIMATIONS||{},idx=jackFrame(),cell=cfg.cell||320,cols=cfg.cols||8,sx=(idx%cols)*cell,sy=Math.floor(idx/cols)*cell,rw=190,rh=190,dx=p.x-cam+p.w/2-rw/2,dy=p.y+p.h/2-132,clean=jackFrameOverrides[idx];
 ctx.save();ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*12)%2?.42:1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(p.dir<0){
   ctx.translate(dx+rw,0);ctx.scale(-1,1);
   if(clean)ctx.drawImage(clean,0,0,clean.width,clean.height,0,dy,rw,rh);
   else ctx.drawImage(jack,sx,sy,cell,cell,0,dy,rw,rh);
 }else{
   if(clean)ctx.drawImage(clean,0,0,clean.width,clean.height,dx,dy,rw,rh);
   else ctx.drawImage(jack,sx,sy,cell,cell,dx,dy,rw,rh);
 }
 ctx.restore();
}

function drawBackdrop(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#111513");g.addColorStop(.48,"#1c211c");g.addColorStop(1,"#31291e");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const par=(cam*.09)%430;
 ctx.save();ctx.globalAlpha=.75;ctx.fillStyle="#0b0e0c";
 for(let i=-2;i<7;i++){
   const bx=i*430-par,base=485-(i%3)*18;
   ctx.beginPath();ctx.moveTo(bx,base);ctx.lineTo(bx+80,230+(i%2)*55);ctx.lineTo(bx+145,base);ctx.fill();
   ctx.fillRect(bx+185,base-150,125,150);ctx.beginPath();ctx.moveTo(bx+170,base-150);ctx.lineTo(bx+247,base-220);ctx.lineTo(bx+325,base-150);ctx.fill();
 }
 ctx.restore();
 const fog=ctx.createLinearGradient(0,370,0,H);fog.addColorStop(0,"rgba(172,172,151,0)");fog.addColorStop(1,"rgba(166,154,126,.18)");ctx.fillStyle=fog;ctx.fillRect(0,350,W,370);
 ctx.save();ctx.globalAlpha=.12;ctx.fillStyle="#ddd4bc";
 for(let i=0;i<11;i++){const y=420+i*20+Math.sin(p.anim*.3+i)*6;ctx.fillRect(0,y,W,2)}
 ctx.restore();
}
function drawRoad(){
 ctx.save();ctx.translate(-cam,0);
 for(const q of platforms){
   const palette={
     road:["#30291f","#847052"],ledge:["#40382d","#9b865d"],
     village:["#332f27","#847457"],traces:["#342d23","#8d7750"],
     archive:["#272925","#6f6a55"],bridge:["#352c21","#9a7d4f"],
     plaza:["#34322d","#7d735e"],collector:["#242522","#655b49"],
     arena:["#201f1d","#8b714b"]
   }[q.kind]||["#30291f","#847052"];
   ctx.fillStyle=palette[0];ctx.fillRect(q.x,q.y,q.w,q.h);
   ctx.fillStyle=palette[1];ctx.fillRect(q.x,q.y,q.w,5);
   if(q.h>100){
     ctx.strokeStyle="rgba(25,22,18,.7)";ctx.lineWidth=3;
     for(let xx=q.x+45;xx<q.x+q.w;xx+=95){ctx.beginPath();ctx.moveTo(xx,q.y+8);ctx.lineTo(xx-18,q.y+42);ctx.stroke()}
   }else if(q.kind==="bridge"){
     ctx.strokeStyle="rgba(181,146,84,.3)";ctx.lineWidth=2;
     for(let xx=q.x+24;xx<q.x+q.w;xx+=42){ctx.beginPath();ctx.moveTo(xx,q.y);ctx.lineTo(xx,q.y+q.h);ctx.stroke()}
   }
 }
 ctx.restore();
}
function drawSigns(){
 ctx.save();ctx.translate(-cam,0);
 for(let z=1180;z<WORLD;z+=840){
   ctx.strokeStyle="#5b4d37";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(z,590);ctx.lineTo(z-4,485);ctx.stroke();
   ctx.fillStyle="#312c24";ctx.fillRect(z-66,470,132,42);ctx.strokeStyle="#706044";ctx.lineWidth=2;ctx.strokeRect(z-66,470,132,42);
   ctx.fillStyle="rgba(190,173,136,.18)";ctx.fillRect(z-50,487,74,3);
 }
 ctx.restore();
}
function drawDoor(){
 const xw=860;
 if(doorOpened){
   ctx.save();ctx.translate(xw-cam,0);ctx.strokeStyle="rgba(233,201,121,.78)";ctx.lineWidth=5;ctx.shadowColor="#e8c36c";ctx.shadowBlur=24;ctx.strokeRect(-56,318,112,272);
   ctx.globalAlpha=.14;ctx.fillStyle="#e8c98b";ctx.fillRect(-53,322,106,268);ctx.restore();
   return;
 }
 ctx.save();ctx.translate(xw-cam,0);
 ctx.fillStyle="#252721";ctx.fillRect(-90,280,180,310);ctx.strokeStyle="#62563d";ctx.strokeRect(-90,280,180,310);
 ctx.globalAlpha=.12+.08*Math.sin(p.anim*2);ctx.strokeStyle="#e5ca86";ctx.setLineDash([9,8]);ctx.lineWidth=3;ctx.strokeRect(-54,318,108,272);ctx.setLineDash([]);
 if(keyImg&&localStorage.getItem(MARA_KEY)==="yes"){const iw=keyImg.naturalWidth||keyImg.width,ih=keyImg.naturalHeight||keyImg.height,dh=72,dw=iw*(dh/ih);ctx.globalAlpha=.72+.18*Math.sin(p.anim*2.8);ctx.drawImage(keyImg,-dw/2,402,dw,dh)}
 ctx.restore();
}
function drawCheckpoint(cp){
 const lit=activeCheckpoint===cp.id;
 ctx.save();ctx.translate(cp.x-cam,cp.groundY);
 ctx.strokeStyle="#625540";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-2,-78);ctx.stroke();
 ctx.fillStyle=lit?"#d7bd79":"#554d3b";ctx.strokeStyle=lit?"#d8bd74":"#746342";ctx.lineWidth=2;ctx.fillRect(-55,-112,110,42);ctx.strokeRect(-55,-112,110,42);
 if(lit){ctx.shadowColor="#e8bd59";ctx.shadowBlur=16;ctx.fillStyle="#f1d384";ctx.font="700 9px Georgia";ctx.textAlign="center";ctx.fillText("VOCÊ PASSOU",0,-95)}
 ctx.restore();
}
function drawPilgrim(){
 if(!doorOpened)return;
 const px=pilgrimMet?pilgrimX:2580;
 const feet=pilgrimMet?pilgrimFeetY:590;
 const sx=px-cam;
 const moving=pilgrimMode==="walk"||pilgrimMode==="run";
 const phase=p.anim*(pilgrimMode==="run"?10:6);
 const stride=moving?Math.sin(phase)*14:0;
 const bob=moving?Math.abs(Math.sin(phase))*3:Math.sin(p.anim*1.8)*1.3;
 const jump=pilgrimMode==="jump";
 const guard=pilgrimMode==="guard";
 const lean=jump?pilgrimDir*7:(pilgrimMode==="run"?pilgrimDir*4:(guard?-pilgrimDir*3:0));

 ctx.save();ctx.translate(sx+lean,0);ctx.globalAlpha=.94;
 if(!jump){
   ctx.fillStyle="rgba(0,0,0,.24)";ctx.beginPath();ctx.ellipse(0,feet+1,22,4,0,0,Math.PI*2);ctx.fill();
 }

 ctx.strokeStyle="#766a54";ctx.lineWidth=6;ctx.lineCap="round";
 if(jump){
   ctx.beginPath();ctx.moveTo(-10,feet-56);ctx.lineTo(-25,feet-28);ctx.lineTo(-8,feet-18);ctx.stroke();
   ctx.beginPath();ctx.moveTo(10,feet-56);ctx.lineTo(24,feet-35);ctx.lineTo(12,feet-20);ctx.stroke();
 }else{
   ctx.beginPath();ctx.moveTo(-10,feet-70+bob);ctx.lineTo(-12+stride,feet-28);ctx.lineTo(-18+stride*.55,feet-2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(10,feet-70+bob);ctx.lineTo(12-stride,feet-28);ctx.lineTo(18-stride*.55,feet-2);ctx.stroke();
 }

 const bodyY=feet-106+bob;
 ctx.fillStyle=guard?"#343936":"#414743";
 ctx.beginPath();ctx.moveTo(0,bodyY-28);ctx.quadraticCurveTo(-34,bodyY+4,-31,bodyY+64);ctx.lineTo(-18,feet-62);ctx.lineTo(18,feet-62);ctx.lineTo(31,bodyY+64);ctx.quadraticCurveTo(34,bodyY+4,0,bodyY-28);ctx.fill();
 ctx.strokeStyle="#625c4d";ctx.lineWidth=2;ctx.stroke();

 ctx.strokeStyle="#82745a";ctx.lineWidth=5;
 if(guard){
   ctx.beginPath();ctx.moveTo(-20,bodyY+5);ctx.lineTo(-34,bodyY+30);ctx.stroke();
   ctx.beginPath();ctx.moveTo(20,bodyY+5);ctx.lineTo(10,bodyY+35);ctx.stroke();
 }else if(jump){
   ctx.beginPath();ctx.moveTo(-20,bodyY+4);ctx.lineTo(-34,bodyY-8);ctx.stroke();
   ctx.beginPath();ctx.moveTo(20,bodyY+4);ctx.lineTo(35,bodyY-7);ctx.stroke();
 }else{
   ctx.beginPath();ctx.moveTo(-20,bodyY+5);ctx.lineTo(-28-stride*.45,bodyY+34);ctx.stroke();
   ctx.beginPath();ctx.moveTo(20,bodyY+5);ctx.lineTo(28+stride*.45,bodyY+34);ctx.stroke();
 }

 ctx.fillStyle="#171a19";ctx.beginPath();ctx.arc(0,bodyY-43,25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="rgba(206,194,164,.5)";ctx.beginPath();ctx.ellipse(0,bodyY-38,11,14,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#aa9976";ctx.font="italic 12px Georgia";ctx.textAlign="center";
 ctx.fillText(pilgrimMet?"PEREGRINA":"???",0,bodyY-82);
 ctx.restore();
}

function pilgrimDangerNearby(){
 if(!pilgrimMet||pilgrimBridge.active)return false;
 return enemies.some(e=>!e.defeated&&e.state!=="dead"&&e.state!=="dissolve"&&Math.abs((e.x+e.w/2)-pilgrimX)<260&&Math.abs(p.x-pilgrimX)<650);
}
function pilgrimFollowTarget(){
 if(!pilgrimMet)return 2580;
 if(!tracesSolved)return 3230;
 if(!pilgrimBridgeDone&&p.x<6100)return Math.max(3320,Math.min(5920,p.x-155));
 if(!pilgrimBridgeDone)return 6250;
 if(p.x<9300)return Math.max(8010,Math.min(8840,p.x-165));
 if(p.x<10600)return Math.max(8950,Math.min(10480,p.x-175));
 return 10535;
}
function startPilgrimBridge(){
 if(pilgrimBridge.active||pilgrimBridgeDone)return;
 pilgrimBridge.active=true;pilgrimBridge.segment=0;pilgrimBridge.t=0;
 pilgrimX=pilgrimBridgeWaypoints[0].x;pilgrimFeetY=pilgrimBridgeWaypoints[0].y;
 pilgrimMode="jump";pilgrimDir=1;
}
function updatePilgrimBridge(dt){
 if(!pilgrimBridge.active)return;
 const a=pilgrimBridgeWaypoints[pilgrimBridge.segment];
 const b=pilgrimBridgeWaypoints[pilgrimBridge.segment+1];
 if(!a||!b){
   pilgrimBridge.active=false;pilgrimBridgeDone=true;pilgrimX=8010;pilgrimFeetY=590;pilgrimMode="wait";save();return;
 }
 const dist=Math.hypot(b.x-a.x,(b.y-a.y)*.6);
 const duration=Math.max(.48,dist/315);
 pilgrimBridge.t=Math.min(1,pilgrimBridge.t+dt/duration);
 const t=pilgrimBridge.t,e=t*t*(3-2*t);
 pilgrimX=a.x+(b.x-a.x)*e;
 const baseY=a.y+(b.y-a.y)*e;
 const arc=60+Math.min(34,Math.abs(b.y-a.y)*.24);
 pilgrimFeetY=baseY-Math.sin(Math.PI*t)*arc;
 pilgrimDir=Math.sign(b.x-a.x)||1;pilgrimMode="jump";
 if(t>=1){
   pilgrimX=b.x;pilgrimFeetY=b.y;pilgrimBridge.segment++;pilgrimBridge.t=0;
   if(pilgrimBridge.segment>=pilgrimBridgeWaypoints.length-1){
     pilgrimBridge.active=false;pilgrimBridgeDone=true;pilgrimX=8010;pilgrimFeetY=590;pilgrimMode="wait";
     banner("A PEREGRINA ATRAVESSOU");save();
   }
 }
}
function updatePilgrim(dt){
 if(!pilgrimMet)return;
 if(pilgrimBridge.active){updatePilgrimBridge(dt);return}
 if(!pilgrimBridgeDone&&bridgeFearPlayed&&p.x>6420&&Math.abs(pilgrimX-6250)<42){
   startPilgrimBridge();return;
 }

 const target=pilgrimFollowTarget();
 if(pilgrimDangerNearby()){
   pilgrimMode="guard";pilgrimMoveSpeed=0;pilgrimFeetY=590;return;
 }

 const delta=target-pilgrimX,ad=Math.abs(delta);
 if(ad<12){
   pilgrimX=target;pilgrimFeetY=590;pilgrimMode="wait";pilgrimMoveSpeed=0;return;
 }

 pilgrimDir=Math.sign(delta)||pilgrimDir;
 pilgrimMoveSpeed=ad>290?255:165;
 pilgrimMode=pilgrimMoveSpeed>210?"run":"walk";
 pilgrimX+=pilgrimDir*Math.min(ad,pilgrimMoveSpeed*dt);
 pilgrimFeetY=590;
}
function drawTraces(){
 ctx.save();ctx.translate(-cam,0);
 story.traces.forEach((t,i)=>{
   const on=traces[i],pulse=.5+.5*Math.sin(p.anim*2+i);
   ctx.save();ctx.translate(t.x,0);ctx.globalAlpha=on?.95:.2;ctx.fillStyle=on?"#e4c878":"#5f5746";
   for(let k=0;k<5;k++){ctx.save();ctx.translate((k-2)*28,552-(k%2)*6);ctx.rotate((k%2?-.22:.18));ctx.beginPath();ctx.ellipse(0,0,8,15,0,0,Math.PI*2);ctx.fill();ctx.restore()}
   if(on){ctx.strokeStyle="rgba(232,201,117,"+(.25+pulse*.25)+")";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,548,54+pulse*5,0,Math.PI*2);ctx.stroke()}
   ctx.restore();
 });
 ctx.restore();
}
function drawEraserEnemy(e){
 const wob=Math.sin(p.anim*(e.state==="chase"?11:7)+e.spawnX)*4;
 ctx.shadowColor=e.hitFlash>0?"rgba(247,222,159,.95)":"rgba(0,0,0,.8)";
 ctx.shadowBlur=e.hitFlash>0?22:12;
 ctx.fillStyle=e.hitFlash>0?"#847a62":"#111311";
 ctx.beginPath();
 for(let i=0;i<18;i++){
   const a=i*Math.PI*2/18,r=28+(i%2?8:0)+Math.sin(p.anim*5+i)*3;
   const px=Math.cos(a)*r,py=Math.sin(a)*r*.8;
   if(i===0)ctx.moveTo(px,py+wob);else ctx.lineTo(px,py+wob);
 }
 ctx.closePath();ctx.fill();
 ctx.strokeStyle="#776f5a";ctx.lineWidth=3;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-18+i*12,18);ctx.lineTo(-34+i*20,38+wob*.15);ctx.stroke()}
 ctx.fillStyle=e.state==="alert"||e.state==="chase"||e.state==="attack"?"#f0cc6f":"#d6b968";
 ctx.beginPath();ctx.arc(-8,-5,3,0,Math.PI*2);ctx.arc(8,-5,3,0,Math.PI*2);ctx.fill();
}
function drawAshHoundEnemy(e){
 const run=e.state==="chase"||e.state==="attack";
 const stride=Math.sin(p.anim*(run?15:7))*10;
 const crouch=e.state==="attack"?7:0;
 ctx.shadowColor=e.hitFlash>0?"rgba(244,211,139,.9)":"rgba(0,0,0,.75)";
 ctx.shadowBlur=e.hitFlash>0?20:10;
 ctx.fillStyle=e.hitFlash>0?"#8a806d":"#35332f";
 ctx.beginPath();ctx.ellipse(2,crouch,34,18,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(27,-8+crouch);ctx.lineTo(48,-20+crouch);ctx.lineTo(45,4+crouch);ctx.closePath();ctx.fill();
 ctx.fillStyle="#1b1c1a";
 ctx.beginPath();ctx.moveTo(30,-17+crouch);ctx.lineTo(39,-35+crouch);ctx.lineTo(43,-15+crouch);ctx.fill();
 ctx.beginPath();ctx.moveTo(16,-19+crouch);ctx.lineTo(22,-34+crouch);ctx.lineTo(29,-16+crouch);ctx.fill();
 ctx.strokeStyle="#80735d";ctx.lineWidth=6;ctx.lineCap="round";
 for(const [x0,phase] of [[-22,1],[-7,-1],[15,-1],[28,1]]){
   ctx.beginPath();ctx.moveTo(x0,11+crouch);ctx.lineTo(x0+stride*.35*phase,31);ctx.stroke();
 }
 ctx.strokeStyle="#615a4c";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-30,0);ctx.quadraticCurveTo(-48,-14-stride*.2,-52,-3);ctx.stroke();
 ctx.fillStyle="#e0bd68";ctx.beginPath();ctx.arc(35,-10+crouch,3,0,Math.PI*2);ctx.fill();
 // Cinza escapando do dorso.
 ctx.fillStyle="rgba(171,164,145,.35)";
 for(let i=0;i<4;i++){const yy=-24-i*7-Math.sin(p.anim*3+i)*4;ctx.beginPath();ctx.arc(-18+i*11,yy,3+i*.4,0,Math.PI*2);ctx.fill()}
}
function drawHollowEnemy(e){
 const exposed=e.exposedTimer>0;
 const sway=Math.sin(p.anim*2.5+e.spawnX)*3;
 ctx.shadowColor=e.hitFlash>0?"rgba(247,224,162,.95)":(exposed?"rgba(229,194,104,.55)":"rgba(0,0,0,.75)");
 ctx.shadowBlur=e.hitFlash>0?22:(exposed?18:10);
 ctx.fillStyle=e.hitFlash>0?"#756f61":"#292b29";
 ctx.beginPath();ctx.moveTo(-18,-38+sway);ctx.quadraticCurveTo(-38,0,-30,45);ctx.lineTo(-18,54);ctx.lineTo(18,54);ctx.lineTo(30,45);ctx.quadraticCurveTo(38,0,18,-38+sway);ctx.closePath();ctx.fill();
 ctx.fillStyle="#111412";ctx.beginPath();ctx.ellipse(0,-45+sway,23,28,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#665f51";ctx.lineWidth=5;
 ctx.beginPath();ctx.moveTo(-22,-8);ctx.lineTo(-38,31);ctx.stroke();
 ctx.beginPath();ctx.moveTo(22,-8);ctx.lineTo(38,31);ctx.stroke();
 if(exposed){
   const pulse=.5+.5*Math.sin(p.anim*5);
   ctx.strokeStyle="rgba(238,204,111,"+(.55+pulse*.3)+")";ctx.lineWidth=3;
   ctx.beginPath();ctx.ellipse(0,2,17,30,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle="rgba(236,205,117,.15)";ctx.beginPath();ctx.ellipse(0,2,13,25,0,0,Math.PI*2);ctx.fill();
 }else{
   ctx.fillStyle="rgba(4,5,5,.92)";ctx.beginPath();ctx.ellipse(0,1,14,28,0,0,Math.PI*2);ctx.fill();
 }
}
function drawCrowEnemy(e){
 const flap=Math.sin(p.anim*(e.state==="attack"?19:11)+e.spawnX)*13;
 ctx.shadowColor=e.hitFlash>0?"rgba(247,221,149,.9)":"rgba(0,0,0,.75)";
 ctx.shadowBlur=e.hitFlash>0?18:9;
 ctx.fillStyle=e.hitFlash>0?"#77705e":"#171918";
 ctx.beginPath();ctx.ellipse(0,0,18,11,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(-38,-10-flap);ctx.lineTo(-19,10);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(8,-2);ctx.lineTo(38,-10-flap);ctx.lineTo(19,10);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(12,-4);ctx.lineTo(32,0);ctx.lineTo(14,6);ctx.closePath();ctx.fill();
 ctx.fillStyle="#a89056";ctx.beginPath();ctx.moveTo(18,-2);ctx.lineTo(30,2);ctx.lineTo(18,5);ctx.closePath();ctx.fill();
 ctx.fillStyle="#e5c66e";ctx.beginPath();ctx.arc(10,-5,2.5,0,Math.PI*2);ctx.fill();
 // Penas parecem pedaços de papel.
 ctx.strokeStyle="rgba(164,151,119,.45)";ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(-30,-8-flap);ctx.lineTo(-18,-1);ctx.moveTo(30,-8-flap);ctx.lineTo(18,-1);ctx.stroke();
}
function drawEnemyDissolve(e){
 ctx.save();
 ctx.globalAlpha=Math.max(.1,e.alpha);
 const dust=e.kind==="crow"?"#9f957e":(e.kind==="ashHound"?"#8f897b":(e.kind==="hollow"?"#aaa18d":"#b8a77f"));
 ctx.fillStyle=dust;
 for(let i=0;i<10;i++){
   const a=i*.71+p.anim*(e.kind==="crow"?3.4:2.1),rr=22+(1-e.alpha)*58;
   const yy=Math.sin(a)*rr-(1-e.alpha)*28;
   ctx.save();ctx.translate(Math.cos(a)*rr,yy);ctx.rotate(a*.4);ctx.fillRect(-2,-3,4,e.kind==="crow"?8:5);ctx.restore();
 }
 ctx.restore();
}
function drawEnemy(e){
 if(e.state==="dead")return;
 const ex=e.x-cam,cy=e.y+e.h/2,state=e.state;
 const attack=state==="attack",alert=state==="alert";

 ctx.save();ctx.translate(ex+e.w/2,cy);ctx.globalAlpha=Math.max(0,Math.min(1,e.alpha));
 if(e.dir<0)ctx.scale(-1,1);

 if(alert){
   ctx.strokeStyle="rgba(225,193,111,.72)";ctx.lineWidth=3;
   ctx.beginPath();ctx.arc(0,-4,Math.max(e.w,e.h)*.58,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle="#e5c06d";ctx.font="700 21px Georgia";ctx.textAlign="center";
   ctx.save();if(e.dir<0)ctx.scale(-1,1);ctx.fillText("!",0,-Math.max(38,e.h*.64));ctx.restore();
 }
 if(attack&&e.kind!=="crow"){
   ctx.fillStyle="rgba(215,183,102,.12)";
   ctx.beginPath();ctx.moveTo(e.w*.25,-22);ctx.lineTo(e.w*.82,0);ctx.lineTo(e.w*.25,22);ctx.closePath();ctx.fill();
 }

 if(e.kind==="ashHound")drawAshHoundEnemy(e);
 else if(e.kind==="hollow")drawHollowEnemy(e);
 else if(e.kind==="crow")drawCrowEnemy(e);
 else drawEraserEnemy(e);

 if(state==="dissolve")drawEnemyDissolve(e);
 ctx.restore();

 if(state!=="dissolve"){
   ctx.save();ctx.textAlign="center";
   ctx.fillStyle="#b9aa89";ctx.font="700 9px Georgia";ctx.fillText(e.label,ex+e.w/2,e.y-14);
   const stateLabel={
     idle:"à espreita",patrol:"patrulha",alert:"percebeu Jack",
     chase:e.kind==="crow"?"circulando":"perseguindo",attack:e.kind==="crow"?"mergulho":"atacando",hit:"atingido"
   }[state]||state;
   ctx.fillStyle="rgba(196,184,150,.65)";ctx.font="italic 8px Georgia";ctx.fillText(stateLabel,ex+e.w/2,e.y-3);

   if(e.cfg.needsReveal&&e.exposedTimer>0){
     ctx.fillStyle="#ddc576";ctx.font="700 8px Georgia";ctx.fillText("EXPOSTO",ex+e.w/2,e.y+e.h+14);
   }
   if(e.hp<e.maxHp){
     const bw=46,bx=ex+e.w/2-bw/2,by=e.y-29;
     ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(bx,by,bw,4);
     ctx.fillStyle="#d6b968";ctx.fillRect(bx,by,bw*(e.hp/e.maxHp),4);
   }
   ctx.restore();
 }
}
function drawPhase4SkeletonLandmarks(){
 ctx.save();ctx.translate(-cam,0);

 // Arquivo Rasurado — estantes e placas arrancadas.
 for(const bx of [5050,5380,5700]){
   ctx.fillStyle="rgba(28,31,28,.88)";ctx.fillRect(bx-70,315,140,275);
   ctx.strokeStyle="rgba(117,105,77,.55)";ctx.lineWidth=3;
   for(let y=350;y<555;y+=48){ctx.beginPath();ctx.moveTo(bx-60,y);ctx.lineTo(bx+60,y);ctx.stroke()}
   ctx.fillStyle="rgba(188,169,125,.15)";
   for(let y=365;y<545;y+=48)ctx.fillRect(bx-48,y,62+(y%3)*7,4);
 }
 ctx.fillStyle="rgba(208,184,125,.48)";ctx.font="italic 11px Georgia";ctx.textAlign="center";
 ctx.fillText("registros arrancados",5380,292);

 // Ponte dos Ninguém — postes e cabos indicam o grande trecho de travessia.
 ctx.strokeStyle="rgba(92,76,53,.8)";ctx.lineWidth=6;
 for(const bx of [6140,6650,7130,7640]){
   ctx.beginPath();ctx.moveTo(bx,590);ctx.lineTo(bx,350);ctx.stroke();
 }
 ctx.strokeStyle="rgba(111,91,61,.42)";ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(6140,370);ctx.bezierCurveTo(6500,450,7240,300,7640,370);ctx.stroke();

 // Praça — círculo de placas vazias.
 ctx.strokeStyle="rgba(132,117,87,.55)";ctx.lineWidth=4;
 ctx.beginPath();ctx.ellipse(8350,574,330,44,0,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<7;i++){
   const a=Math.PI+(i/6)*Math.PI,px=8350+Math.cos(a)*280,py=570+Math.sin(a)*75;
   ctx.strokeStyle="#5b4e3a";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-92);ctx.stroke();
   ctx.fillStyle="#2c2b27";ctx.fillRect(px-42,py-112,84,30);
 }

 // Casa do Coletor — apenas massa arquitetônica provisória por enquanto.
 ctx.fillStyle="rgba(15,17,16,.92)";
 ctx.fillRect(9460,245,420,345);
 ctx.beginPath();ctx.moveTo(9405,245);ctx.lineTo(9670,118);ctx.lineTo(9935,245);ctx.closePath();ctx.fill();
 ctx.strokeStyle="rgba(128,105,65,.55)";ctx.lineWidth=4;ctx.strokeRect(9620,378,105,212);
 for(let i=0;i<8;i++){
   const px=9495+(i%4)*105,py=285+Math.floor(i/4)*58;
   ctx.fillStyle="rgba(177,151,98,.18)";ctx.fillRect(px,py,72,20);
 }

 // Arena final provisória — o espaço já tem escala para receber o boss.
 ctx.strokeStyle="rgba(191,156,83,.48)";ctx.lineWidth=5;
 ctx.beginPath();ctx.ellipse(10920,580,245,50,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle="rgba(105,86,57,.7)";ctx.lineWidth=7;
 for(const bx of [10710,11130]){ctx.beginPath();ctx.moveTo(bx,590);ctx.lineTo(bx,300);ctx.stroke()}
 ctx.beginPath();ctx.arc(10920,315,210,Math.PI,Math.PI*2);ctx.stroke();

 ctx.restore();
}

function drawWorld(){
 drawRoad();drawPhase4SkeletonLandmarks();drawSigns();drawDoor();
 checkpoints.forEach(drawCheckpoint);
 drawPilgrim();drawTraces();enemies.forEach(drawEnemy);
 if(tracesSolved){
   ctx.save();ctx.translate(4660-cam,0);ctx.strokeStyle="#d6bd7a";ctx.lineWidth=2;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,590);ctx.lineTo(0,370);ctx.stroke();ctx.fillStyle="#e6cd8a";ctx.font="italic 11px Georgia";ctx.textAlign="center";ctx.fillText("alguém arrancou os nomes daqui",0,345);ctx.restore();
 }
}
function drawMemoryLight(){
 if(memoryLight<=0&&memoryPulse<=0)return;
 const a=Math.min(.34,.08+memoryLight*.05+memoryPulse*.23),cx=p.x-cam+p.w/2,cy=p.y+p.h*.5;
 const g=ctx.createRadialGradient(cx,cy,24,cx,cy,230);g.addColorStop(0,"rgba(244,215,132,"+a+")");g.addColorStop(.55,"rgba(191,160,86,"+(a*.5)+")");g.addColorStop(1,"rgba(80,71,49,0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,230,0,Math.PI*2);ctx.fill();
}

function openDoor(){
 if(doorOpened)return;
 const pc=p.x+p.w/2;if(Math.abs(pc-860)>125){say("A chave está reagindo a alguma coisa na parede.");return}
 if(localStorage.getItem(MARA_KEY)!=="yes"){say("Há o contorno de uma porta, mas Jack não tem nada que se encaixe nela.");return}
 p.vx=0;dialogue.open(story.door,()=>{doorOpened=true;memoryPulse=1.6;banner("A CHAVE LEMBROU A PORTA");say("A passagem existe enquanto a memória da chave permanecer acesa.");save()});
}
function interact(){
 if(!running||dialogue.active)return;
 markPlayerAction();
 const pc=p.x+p.w/2;
 if(!doorOpened&&pc<1050){openDoor();return}
 if(doorOpened&&!pilgrimMet&&Math.abs(pc-2580)<130){
   pilgrimMet=true;pilgrimX=2580;pilgrimFeetY=590;p.vx=0;
   dialogue.open(story.pilgrimMeeting,()=>{banner("POVOADO SEM NOMES");say("A Peregrina seguirá Jack, mas não atravessará o mundo como uma sombra colada nele.");save()});return;
 }
 if(tracesSolved&&!prototypeEndPlayed&&pc>4660){
   prototypeEndPlayed=true;p.vx=0;dialogue.open(story.prototypeEnd,()=>{banner("ARQUIVO RASURADO");save()});return;
 }
 say("Nada responde aqui. Ainda.");
}
function useLight(){
 if(!running||dialogue.active)return;
 markPlayerAction();
 p.attack=.48;memoryLight=2.4;memoryPulse=.55;
 const pc=p.x+p.w/2;

 if(pilgrimMet&&!tracesSolved){
   let hit=-1,best=999;
   story.traces.forEach((t,i)=>{const d=Math.abs(t.x-pc);if(!traces[i]&&d<best){best=d;hit=i}});
   if(hit>=0&&best<170){
     traces[hit]=true;memoryPulse=1.2;banner(story.traces[hit].title.toUpperCase());say(story.traces[hit].text);
     if(traces.every(Boolean)){tracesSolved=true;p.vx=0;setTimeout(()=>dialogue.open(story.tracesSolved,()=>{banner("IDENTIDADE TAMBÉM É O QUE FAZEMOS");save()}),450)}
     save();return;
   }
 }

 let target=null,best=999;
 const pcy=p.y+p.h*.48;
 for(const e of enemies){
   if(!enemyCanBeHit(e))continue;
   const dx=(e.x+e.w/2)-pc,dy=(e.y+e.h/2)-pcy;
   const d=Math.hypot(dx,dy*.72);
   if(d<best&&d<=e.cfg.lightRange){best=d;target=e}
 }
 if(target){
   if(hitEnemy(target,1,pc)){save();return}
 }
 say("A luz encontra marcas... mas nenhuma responde daqui.");
}

function updateEnemyPatrol(e,dt,pc){
 const cfg=e.cfg,ec=e.x+e.w/2,d=pc-ec,ad=Math.abs(d);
 if(ad<=cfg.detectRange){
   e.dir=Math.sign(d)||e.dir;e.vx*=.45;setEnemyState(e,"alert",cfg.alertTime);return;
 }
 e.stateTimer=Math.max(0,e.stateTimer-dt);
 e.vx+=(e.dir*cfg.patrolSpeed-e.vx)*Math.min(1,dt*5);
 e.x+=e.vx*dt;
 if(e.x<=e.minX){e.x=e.minX;e.dir=1;e.vx=Math.abs(e.vx)}
 if(e.x>=e.maxX){e.x=e.maxX;e.dir=-1;e.vx=-Math.abs(e.vx)}
 if(e.stateTimer<=0){e.vx*=.35;setEnemyState(e,"idle",cfg.idleTime)}
}
function enemyHitsPlayer(e,extraX=10,extraY=105){
 const pc=p.x+p.w/2,ec=e.x+e.w/2;
 return Math.abs(pc-ec)<e.cfg.attackRange+extraX&&Math.abs((p.y+p.h)-(e.y+e.h))<extraY;
}
function updateGroundEnemyState(e,dt,pc){
 const cfg=e.cfg,ec=e.x+e.w/2,d=pc-ec,ad=Math.abs(d);

 if(e.state==="hit"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   e.x+=e.vx*dt;e.vx*=Math.max(0,1-dt*7);
   e.x=Math.max(e.minX,Math.min(e.maxX,e.x));
   if(e.stateTimer<=0){
     if(ad<=cfg.loseRange){e.dir=Math.sign(d)||e.dir;setEnemyState(e,"chase")}
     else setEnemyState(e,"patrol",cfg.patrolTime);
   }
   return;
 }

 if(e.state==="attack"){
   const total=cfg.attackWindup+cfg.attackActive+cfg.attackRecover;
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   const elapsed=total-e.stateTimer;
   e.vx*=Math.max(0,1-dt*8);
   if(elapsed>=cfg.attackWindup&&elapsed<cfg.attackWindup+cfg.attackActive){
     e.vx=e.dir*(cfg.attackSpeed||175);e.x+=e.vx*dt;
     if(!e.attackHit&&enemyHitsPlayer(e)){
       e.attackHit=true;
       hurtPlayer(e.x+e.w/2,cfg.knockbackX,cfg.knockbackY,e.kind);
     }
   }
   e.x=Math.max(e.minX,Math.min(e.maxX,e.x));
   if(e.stateTimer<=0){
     e.attackCooldown=cfg.attackCooldown;
     if(ad<=cfg.loseRange)setEnemyState(e,"chase");
     else setEnemyState(e,"patrol",cfg.patrolTime);
   }
   return;
 }

 if(e.state==="alert"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);e.vx*=Math.max(0,1-dt*8);
   if(ad>cfg.loseRange){setEnemyState(e,"idle",cfg.idleTime);return}
   e.dir=Math.sign(d)||e.dir;
   if(e.stateTimer<=0)setEnemyState(e,"chase");
   return;
 }

 if(e.state==="chase"){
   if(ad>cfg.loseRange){setEnemyState(e,"patrol",cfg.patrolTime);return}
   e.dir=Math.sign(d)||e.dir;
   if(ad<=cfg.attackRange&&e.attackCooldown<=0){
     e.vx=0;e.attackHit=false;
     setEnemyState(e,"attack",cfg.attackWindup+cfg.attackActive+cfg.attackRecover);return;
   }
   e.vx+=(e.dir*cfg.chaseSpeed-e.vx)*Math.min(1,dt*(e.kind==="ashHound"?9:6));
   e.x+=e.vx*dt;
   if(e.x<=e.minX){e.x=e.minX;e.vx=0}
   if(e.x>=e.maxX){e.x=e.maxX;e.vx=0}
   return;
 }

 if(e.state==="idle"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);e.vx*=Math.max(0,1-dt*6);
   if(ad<=cfg.detectRange){e.dir=Math.sign(d)||e.dir;setEnemyState(e,"alert",cfg.alertTime);return}
   if(e.stateTimer<=0){
     if(((Math.floor(p.anim)+Math.floor(e.spawnX/100))&1)===0)e.dir*=-1;
     setEnemyState(e,"patrol",cfg.patrolTime);
   }
   return;
 }

 if(e.state==="patrol"){updateEnemyPatrol(e,dt,pc);return}
 setEnemyState(e,"idle",cfg.idleTime);
}
function updateCrowEnemyState(e,dt,pc){
 const cfg=e.cfg,ec=e.x+e.w/2,d=pc-ec,ad=Math.abs(d);
 const playerCy=p.y+p.h*.45;
 const hoverY=Math.max(e.minY,Math.min(e.maxY,e.homeY+Math.sin(p.anim*2.4+e.spawnX*.01)*24));

 if(e.state==="hit"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   e.x+=e.vx*dt;e.y+=e.vy*dt;
   e.vx*=Math.max(0,1-dt*7);e.vy*=Math.max(0,1-dt*6);
   if(e.stateTimer<=0)setEnemyState(e,ad<=cfg.loseRange?"chase":"patrol",cfg.patrolTime);
   return;
 }

 if(e.state==="attack"){
   const total=cfg.attackWindup+cfg.attackActive+cfg.attackRecover;
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   const elapsed=total-e.stateTimer;

   if(elapsed<cfg.attackWindup){
     e.y+=(Math.max(e.minY,e.homeY-45)-e.y)*Math.min(1,dt*7);
     e.x-=e.dir*45*dt;
   }else if(elapsed<cfg.attackWindup+cfg.attackActive){
     const tx=e.attackTargetX,ty=e.attackTargetY;
     const dx=tx-(e.x+e.w/2),dy=ty-(e.y+e.h/2),len=Math.max(1,Math.hypot(dx,dy));
     e.vx=dx/len*cfg.diveSpeed;e.vy=dy/len*cfg.diveSpeed;
     e.x+=e.vx*dt;e.y+=e.vy*dt;
     const near=Math.abs((p.x+p.w/2)-(e.x+e.w/2))<58&&Math.abs(playerCy-(e.y+e.h/2))<65;
     if(!e.attackHit&&near){
       e.attackHit=true;
       hurtPlayer(e.x+e.w/2,cfg.knockbackX,cfg.knockbackY,"crow");
     }
   }else{
     e.x+=e.vx*dt*.35;
     e.y+=(hoverY-e.y)*Math.min(1,dt*7);
     e.vx*=Math.max(0,1-dt*4);
   }

   e.x=Math.max(e.minX,Math.min(e.maxX,e.x));
   if(e.stateTimer<=0){
     e.attackCooldown=cfg.attackCooldown;e.vy=0;
     setEnemyState(e,ad<=cfg.loseRange?"chase":"patrol",cfg.patrolTime);
   }
   return;
 }

 if(e.state==="alert"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   e.dir=Math.sign(d)||e.dir;
   e.y+=(Math.max(e.minY,e.homeY-28)-e.y)*Math.min(1,dt*6);
   if(ad>cfg.loseRange){setEnemyState(e,"patrol",cfg.patrolTime);return}
   if(e.stateTimer<=0)setEnemyState(e,"chase");
   return;
 }

 if(e.state==="chase"){
   if(ad>cfg.loseRange){setEnemyState(e,"patrol",cfg.patrolTime);return}
   e.dir=Math.sign(d)||e.dir;
   const desiredX=Math.max(e.minX,Math.min(e.maxX,p.x-e.dir*115));
   const desiredY=Math.max(e.minY,Math.min(e.maxY,p.y-135));
   e.x+=(desiredX-e.x)*Math.min(1,dt*2.7);
   e.y+=(desiredY-e.y)*Math.min(1,dt*3.2);
   if(ad<=cfg.attackRange&&e.attackCooldown<=0){
     e.attackTargetX=p.x+p.w/2+e.dir*22;
     e.attackTargetY=playerCy+26;
     e.attackHit=false;
     setEnemyState(e,"attack",cfg.attackWindup+cfg.attackActive+cfg.attackRecover);
   }
   return;
 }

 if(e.state==="idle"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   e.y+=(hoverY-e.y)*Math.min(1,dt*3);
   if(ad<=cfg.detectRange){e.dir=Math.sign(d)||e.dir;setEnemyState(e,"alert",cfg.alertTime);return}
   if(e.stateTimer<=0)setEnemyState(e,"patrol",cfg.patrolTime);
   return;
 }

 // Patrulha aérea.
 e.stateTimer=Math.max(0,e.stateTimer-dt);
 e.x+=e.dir*cfg.patrolSpeed*dt;
 e.y+=(hoverY-e.y)*Math.min(1,dt*4);
 if(e.x<=e.minX){e.x=e.minX;e.dir=1}
 if(e.x>=e.maxX){e.x=e.maxX;e.dir=-1}
 if(ad<=cfg.detectRange){e.dir=Math.sign(d)||e.dir;setEnemyState(e,"alert",cfg.alertTime);return}
 if(e.stateTimer<=0)setEnemyState(e,"idle",cfg.idleTime);
}
function updateEnemyState(e,dt,pc){
 const cfg=e.cfg;
 e.attackCooldown=Math.max(0,e.attackCooldown-dt);
 e.hitFlash=Math.max(0,e.hitFlash-dt);
 e.exposedTimer=Math.max(0,e.exposedTimer-dt);

 if(e.state==="dead")return;
 if(e.state==="dissolve"){
   e.stateTimer=Math.max(0,e.stateTimer-dt);
   e.vx*=Math.max(0,1-dt*5);e.vy*=Math.max(0,1-dt*5);
   e.x+=e.vx*dt;e.y+=e.vy*dt;
   e.alpha=cfg.dissolveTime>0?e.stateTimer/cfg.dissolveTime:0;
   if(e.stateTimer<=0){e.state="dead";e.alpha=0;e.vx=e.vy=0}
   return;
 }
 if(cfg.flying){updateCrowEnemyState(e,dt,pc);return}
 updateGroundEnemyState(e,dt,pc);
}
function updateEnemies(dt){
 const pc=p.x+p.w/2;
 for(const e of enemies)updateEnemyState(e,dt,pc);
}
function update(dt){
 if(dialogue.active){
   lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;waitSitClock=0;waitSitFrame=0;
   p.vx*=.75;p.anim+=dt;cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.34))-cam)*Math.min(1,dt*4);return
 }
 const idleNow=!input.left&&!input.right&&!input.down&&!input.jump&&!input.run&&p.attack<=0;
 if(idleNow){
   idleTime=(performance.now()-lastPlayerAction)/1000;
   if(idleTime>=8&&p.on&&Math.abs(p.vx)<8){
     if(!waitSitActive){waitSitActive=true;waitSitFrame=0;waitSitClock=0;p.vx=0}
     waitSitClock+=dt;
     if(waitSitClock>=.38){
       waitSitClock=0;
       if(waitSitFrame<10)waitSitFrame++;
       else waitSitFrame=7;
     }
   }
 }else{
   lastPlayerAction=performance.now();idleTime=0;waitSitClock=0;waitSitFrame=0;waitSitActive=false;
 }
 memoryLight=Math.max(0,memoryLight-dt);memoryPulse=Math.max(0,memoryPulse-dt);p.attack=Math.max(0,p.attack-dt);p.inv=Math.max(0,p.inv-dt);gateMsg=Math.max(0,gateMsg-dt);
 updateEnemies(dt);
 updatePilgrim(dt);
 p.coyote=p.on?.12:Math.max(0,p.coyote-dt);
 if(input.jump){p.buffer=.13;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
 const speed=input.down?86:(input.run?330:225),dir=(input.right?1:0)-(input.left?1:0);p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
 if(p.buffer>0&&p.coyote>0&&!input.down){p.vy=-575;p.on=false;p.buffer=0;p.coyote=0}
 p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));

 if(!doorOpened&&p.x+p.w>930){p.x=930-p.w;p.vx=Math.min(0,p.vx);if(gateMsg<=0){say("A parede não tem porta. A chave de Mara está reagindo.");gateMsg=2}}
 if(!pilgrimMet&&p.x+p.w>3130){p.x=3130-p.w;p.vx=Math.min(0,p.vx);if(gateMsg<=0){say("A estrada se perde na névoa. Há alguém esperando no povoado.");gateMsg=2}}
 if(pilgrimMet&&!tracesSolved&&p.x+p.w>4660){p.x=4660-p.w;p.vx=Math.min(0,p.vx);if(gateMsg<=0){say("As pegadas terminam aqui. Três rastros ainda precisam ser iluminados.");gateMsg=2}}
 if(bridgeFearPlayed&&!pilgrimBridgeDone&&p.x+p.w>7945){
   p.x=7945-p.w;p.vx=Math.min(0,p.vx);
   if(gateMsg<=0){say("A Peregrina ainda está atravessando. Jack espera que ela encontre o próprio passo.");gateMsg=1.8}
 }

 p.y+=p.vy*dt;p.on=false;
 for(const q of platforms){if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}}
 if(p.y>780){playerLife--;syncHud();if(playerLife<=0)respawn("A estrada tentou apagar Jack.");else{const cp=checkpoints.find(q=>q.id===activeCheckpoint);p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;say("Um passo desapareceu na névoa. "+playerLife+"/3.")}}
 updateCheckpoint();
 if(!pilgrimMet&&doorOpened&&p.x>2400){
   pilgrimMet=true;pilgrimX=2580;pilgrimFeetY=590;p.vx=0;
   dialogue.open(story.pilgrimMeeting,()=>{banner("POVOADO SEM NOMES");say("A Peregrina seguirá Jack, mas vai esperar quando o caminho pedir outra coisa.");save()})
 }else if(tracesSolved&&!prototypeEndPlayed&&p.x>4700){
   prototypeEndPlayed=true;p.vx=0;
   dialogue.open(story.prototypeEnd,()=>{banner("ARQUIVO RASURADO");say("A Peregrina volta a acompanhar Jack pelos registros arrancados.");save()})
 }else if(prototypeEndPlayed&&!bridgeFearPlayed&&p.x>6070){
   bridgeFearPlayed=true;p.vx=0;
   dialogue.open(story.bridgeFear,()=>{pilgrimX=Math.min(pilgrimX,6250);banner("PONTE DOS NINGUÉM");say("Ela não perdeu o medo. Mesmo assim, vai atravessar.");save()})
 }else if(pilgrimBridgeDone&&!bridgeCrossedPlayed&&p.x>7950){
   bridgeCrossedPlayed=true;p.vx=0;
   dialogue.open(story.bridgeCrossed,()=>{banner("UM MEDO TAMBÉM É UM RASTRO");save()})
 }else if(bridgeCrossedPlayed&&!stolenPlazaPlayed&&p.x>8170){
   stolenPlazaPlayed=true;p.vx=0;
   dialogue.open(story.stolenPlaza,()=>{banner("PRAÇA DOS NOMES ROUBADOS");save()})
 }else if(stolenPlazaPlayed&&!collectorApproachPlayed&&p.x>9340){
   collectorApproachPlayed=true;p.vx=0;
   dialogue.open(story.collectorApproach,()=>{banner("CASA DO COLETOR");save()})
 }else if(collectorApproachPlayed&&!arenaEdgePlayed&&p.x>10420){
   arenaEdgePlayed=true;p.vx=0;
   dialogue.open(story.arenaEdge,()=>{pilgrimX=Math.min(pilgrimX,10535);banner("DIANTE DA CASA DO COLETOR");save()})
 }else if(arenaEdgePlayed&&!arenaReached&&p.x>10720){
   arenaReached=true;p.vx=0;banner("ARENA DO COLETOR");
   say("A Peregrina ficou à entrada. O próximo passo será construir o confronto e sua participação nele.");
   setTimeout(()=>{if(ui.prototype)ui.prototype.hidden=false},650);
   save();
 }

 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.34))-cam)*Math.min(1,dt*5);
 let si=0;for(let i=0;i<story.sections.length;i++)if(p.x>=story.sections[i].x)si=i;if(si!==section){section=si;banner(story.sections[si].name)}
 if(!doorOpened)ui.obj.textContent="A chave de Mara reage à parede. Aproxime-se e pressione E.";
 else if(!pilgrimMet)ui.obj.textContent="Atravesse a Estrada sem Placas e encontre quem ainda espera.";
 else if(!tracesSolved)ui.obj.textContent="CAMPO DAS PEGADAS: use F para revelar três rastros da Peregrina.";
 else if(p.x<6100)ui.obj.textContent="ARQUIVO RASURADO: avance entre os registros arrancados. A Peregrina seguirá atrás quando o caminho estiver seguro.";
 else if(p.x<7900)ui.obj.textContent="PONTE DOS NINGUÉM: atravesse o abismo. A Peregrina fará a própria travessia quando Jack abrir distância.";
 else if(p.x<9300)ui.obj.textContent="PRAÇA DOS NOMES ROUBADOS: avance entre as placas enquanto a Peregrina tenta reconhecer o que foi tirado.";
 else if(p.x<10600)ui.obj.textContent="CASA DO COLETOR: siga com a Peregrina até a entrada da arena.";
 else ui.obj.textContent="ARENA DO COLETOR: a Peregrina espera do lado de fora. O confronto ainda será construído.";
 p.anim+=dt;saveClock+=dt;if(saveClock>2.4){saveClock=0;save()}
}
let saveClock=0;

function draw(){
 drawBackdrop();drawWorld();drawJack();drawMemoryLight();
}

function bindHold(id,key){
 const b=document.getElementById(id);
 ["pointerdown","pointerup","pointercancel","pointerleave"].forEach(ev=>b?.addEventListener(ev,()=>{
   input[key]=ev==="pointerdown";
   if(ev==="pointerdown")markPlayerAction();
 }));
}
bindHold("leftBtn","left");bindHold("rightBtn","right");bindHold("downBtn","down");
document.getElementById("jumpBtn")?.addEventListener("pointerdown",()=>{markPlayerAction();input.jump=true});
document.getElementById("lightBtn")?.addEventListener("pointerdown",useLight);
document.getElementById("interactBtn")?.addEventListener("pointerdown",interact);
addEventListener("keydown",e=>{
 if(dialogue.active)return;
 markPlayerAction();
 if(["ArrowLeft","a","A"].includes(e.key))input.left=true;
 if(["ArrowRight","d","D"].includes(e.key))input.right=true;
 if(["ArrowDown","s","S"].includes(e.key))input.down=true;
 if(e.key==="Shift")input.run=true;
 if(e.code==="Space"){input.jump=true;e.preventDefault()}
 if(["f","F"].includes(e.key))useLight();
 if(["e","E"].includes(e.key))interact();
});
addEventListener("keyup",e=>{
 if(["ArrowLeft","a","A"].includes(e.key))input.left=false;
 if(["ArrowRight","d","D"].includes(e.key))input.right=false;
 if(["ArrowDown","s","S"].includes(e.key))input.down=false;
 if(e.key==="Shift")input.run=false;
});

document.getElementById("startGame").onclick=()=>{
 if(journeyMode&&!replayMode)journey?.advanceTo(4);
 ui.intro.hidden=true;running=true;last=performance.now();markPlayerAction();requestAnimationFrame(loop);
 if(!introPlayed){introPlayed=true;setTimeout(()=>dialogue.open(story.opening,()=>{say("A Chave de Madeira de Mara começou a aquecer.");save()}),300)}
};
document.getElementById("phase4Continue")?.addEventListener("click",()=>ui.prototype.hidden=true);
document.getElementById("phase4Menu")?.addEventListener("click",()=>location.href="../index.html#fases");
document.getElementById("phase4Replay")?.addEventListener("click",()=>{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CHECKPOINT_KEY);location.href="phase4.html?replay=1&new=1"});

function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
addEventListener("pagehide",save);document.addEventListener("visibilitychange",()=>{if(document.hidden)save()});
syncHud();draw();
})();