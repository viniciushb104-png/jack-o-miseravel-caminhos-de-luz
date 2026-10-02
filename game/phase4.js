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
const SAVE_KEY="jack-phase4-save",CHECKPOINT_KEY="jack-phase4-checkpoint",MARA_KEY="jack-item-mara-wood-key",
      BELL_KEY="jack-item-uninscribed-bell",COMPLETE_KEY="jack-phase4-complete",PHASE5_KEY="jack-phase5-unlocked";
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
let bridgeNameGlitchPlayed=!!saveData?.bridgeNameGlitchPlayed,bridgeFogClock=Number(saveData?.bridgeFogClock)||0;
const hadPlazaState=Array.isArray(saveData?.plazaEchoes);
let plazaEchoes=hadPlazaState?saveData.plazaEchoes.slice(0,3).map(Boolean):[false,false,false];
let plazaSolved=!!saveData?.plazaSolved,collectorGlimpsePlayed=!!saveData?.collectorGlimpsePlayed,collectorGlimpseTimer=0,collectorGlimpseQueued=false;
if(!hadPlazaState&&Number(saveData?.x||0)>=9300){
 plazaEchoes=[true,true,true];plazaSolved=true;collectorGlimpsePlayed=true;
}
if(plazaEchoes.every(Boolean))plazaSolved=true;
const plazaEchoFx=[0,0,0];
const plazaEchoGuards=["eraser-3","hound-2","hollow-2"];

// Coletor — boss em três atos. Progresso principal persiste; projéteis e partículas são transitórios.
const hadBossState=Object.prototype.hasOwnProperty.call(saveData||{},"bossStarted");
let bossStarted=!!saveData?.bossStarted,bossResolved=!!saveData?.bossResolved;
let bossAct=Math.max(1,Math.min(3,Number(saveData?.bossAct)||1));
let bossArmor=Math.max(0,Math.min(5,Number.isFinite(saveData?.bossArmor)?saveData.bossArmor:5));
let bossHp=Math.max(0,Math.min(5,Number.isFinite(saveData?.bossHp)?saveData.bossHp:5));
let bossX=Number.isFinite(saveData?.bossX)?saveData.bossX:10935,bossDir=-1;
let bossState=bossResolved?"resolved":(bossAct===3?"exhausted":"idle");
let bossStateTimer=0,bossAttackClock=.9,bossInv=0,bossAttackHit=false;
let bossProjectiles=[],bossReleasedPlates=[];
if(!hadBossState&&arenaReached){arenaReached=false;bossStarted=false}
if(bossResolved){bossStarted=true;bossAct=3;bossArmor=0;bossHp=0}

// Epílogo da Fase 4.
// 0 soltar nomes · 1 decisão · 2 sino · 3 promessa · 4 despedida · 5 concluído.
let epilogueStep=Math.max(0,Math.min(5,Number(saveData?.epilogueStep)||0));
let phase4Complete=!!saveData?.phase4Complete;
let bellObtained=!!saveData?.bellObtained;
let epilogueRunning=false,epilogueFxClock=0;
if(phase4Complete){
 bossResolved=true;bossStarted=true;bossAct=3;bossArmor=0;bossHp=0;bossState="resolved";
 epilogueStep=5;bellObtained=true;
}

let traces=Array.isArray(saveData?.traces)?saveData.traces.slice(0,3).map(Boolean):[false,false,false];
const traceRevealFx=[0,0,0];
const hadArchiveState=Array.isArray(saveData?.archiveEvidence);
let archiveEvidence=hadArchiveState?saveData.archiveEvidence.slice(0,3).map(Boolean):[false,false,false];
let archiveSolved=!!saveData?.archiveSolved;
if(!hadArchiveState&&prototypeEndPlayed&&Number(saveData?.x||0)>=6100){
 archiveEvidence=[true,true,true];archiveSolved=true;
}
// Se a terceira prova foi salva durante um diálogo, a dedução continua válida no reload.
if(archiveEvidence.every(Boolean))archiveSolved=true;
const archiveRevealFx=[0,0,0];
const archiveEvidenceGuards=["eraser-2","hollow-1","hound-1"];

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

 // 5 — Ponte dos Ninguém: plataformas estáveis + trechos que a névoa tenta apagar.
 {x:6070,y:590,w:360,h:130,kind:"bridge"},
 {x:6500,y:520,w:170,h:24,kind:"bridge",bridgeStable:true},
 {x:6760,y:455,w:180,h:24,kind:"bridge",unstable:true,bridgeId:"bridge-a",phaseOffset:0,lightTimer:0},
 {x:7040,y:515,w:190,h:24,kind:"bridge",unstable:true,bridgeId:"bridge-b",phaseOffset:1.7,lightTimer:0},
 {x:7340,y:440,w:170,h:24,kind:"bridge",bridgeStable:true},
 {x:7600,y:505,w:210,h:24,kind:"bridge",unstable:true,bridgeId:"bridge-c",phaseOffset:3.15,lightTimer:0},

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

 // 8 — Arena do Coletor. O chão principal permanece; plataformas altas quebram no Ato II.
 {x:10670,y:590,w:580,h:130,kind:"arena"},
 {x:10755,y:475,w:135,h:22,kind:"arena",bossBreakable:true,broken:false},
 {x:11010,y:430,w:150,h:22,kind:"arena",bossBreakable:true,broken:false}
]

const PLATFORM_ART_LAYOUT=Object.freeze([
 {min:0,max:2140,group:"2a",indices:[0,1,2,3,4]},
 {min:2140,max:3240,group:"2b",indices:[0,1,2]},
 {min:3240,max:4760,group:"2c",indices:[0,1,2,3,4]},
 {min:4760,max:6070,group:"2d",indices:[0,1,2,3]},
 {min:6070,max:7900,group:"2e",indices:[0,1,2,3,4,5]},
 {min:7900,max:8940,group:"2f",indices:[0,1,2]},
 {min:8940,max:10670,group:"2g",indices:[0,1,2,3,4,5,0]},
 {min:10670,max:Infinity,group:"2h",indices:[1,3,4]}
]);
for(const rule of PLATFORM_ART_LAYOUT){
 const qs=platforms.filter(q=>q.x>=rule.min&&q.x<rule.max);
 qs.forEach((q,i)=>{
   q.artGroup=rule.group;
   q.artIndex=rule.indices[Math.min(i,rule.indices.length-1)]??0;
 });
}
// Arena: peças 01 e 03 são as versões quebradas das duas plataformas altas.
const arenaArtPlatforms=platforms.filter(q=>q.artGroup==="2h");
if(arenaArtPlatforms[1])arenaArtPlatforms[1].brokenArtIndex=0;
if(arenaArtPlatforms[2])arenaArtPlatforms[2].brokenArtIndex=2;

const checkpoints=[
 {id:"road",x:1870,groundY:590,respawnX:1800,respawnY:504,name:"Marco sem inscrição"},
 {id:"village",x:2910,groundY:590,respawnX:2840,respawnY:504,name:"Marco do Povoado"},
 {id:"traces",x:4580,groundY:590,respawnX:4510,respawnY:504,name:"Marco das Pegadas"},
 {id:"archive",x:5750,groundY:590,respawnX:5680,respawnY:504,name:"Marco do Arquivo"},
 {id:"bridge",x:6260,groundY:590,respawnX:6170,respawnY:504,name:"Marco da Ponte dos Ninguém"},
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
   bridgeFearPlayed,bridgeCrossedPlayed,bridgeNameGlitchPlayed,stolenPlazaPlayed,collectorApproachPlayed,arenaEdgePlayed,bridgeFogClock,
   plazaEchoes:[...plazaEchoes],plazaSolved,collectorGlimpsePlayed,
   bossStarted,bossResolved,bossAct,bossArmor,bossHp,bossX,
   epilogueStep,phase4Complete,bellObtained,
   pilgrimX,pilgrimBridgeDone,archiveEvidence:[...archiveEvidence],archiveSolved,deadEnemies:deadEnemies(),savedAt:Date.now()
 }));
}
function resetPilgrimAfterRespawn(){
 if(!pilgrimMet)return;
 pilgrimBridge.active=false;pilgrimFeetY=590;pilgrimMode="wait";
 if(activeCheckpoint==="collector"){pilgrimBridgeDone=true;pilgrimX=9820;return}
 if(activeCheckpoint==="plaza"){pilgrimBridgeDone=true;pilgrimX=8030;return}
 if(activeCheckpoint==="bridge"){
   pilgrimBridgeDone=false;pilgrimX=6250;pilgrimFeetY=590;bridgeFogClock=0;
   for(const q of platforms)if(q.unstable)q.lightTimer=0;
   return;
 }
 if(activeCheckpoint==="archive"){pilgrimBridgeDone=false;pilgrimX=5850;return}
 if(activeCheckpoint==="traces"){pilgrimX=tracesSolved?4660:3230;return}
 if(activeCheckpoint==="village"){pilgrimX=2860;return}
 pilgrimX=2580;
}
function resetCollectorAct(){
 if(!bossStarted||bossResolved)return;
 bossProjectiles=[];bossReleasedPlates=[];bossInv=0;bossAttackHit=false;bossStateTimer=0;bossX=10935;bossDir=-1;
 for(const q of platforms)if(q.bossBreakable)q.broken=false;
 if(bossAct===1){bossArmor=5;bossHp=5;bossState="idle";bossAttackClock=.8}
 else if(bossAct===2){bossArmor=0;bossHp=5;bossState="idle";bossAttackClock=.7}
 else{bossArmor=0;bossHp=0;bossState="exhausted"}
}
function respawn(msg){
 const cp=checkpoints.find(q=>q.id===activeCheckpoint);
 p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;p.on=false;p.inv=1.2;playerLife=3;syncHud();
 resetPilgrimAfterRespawn();
 if(bossStarted&&!bossResolved)resetCollectorAct();
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
     sourceKind==="hollow"?"O golpe do Peregrino Oco parecia vir de dentro das roupas. ":
     sourceKind==="collector"?"O Coletor empurrou Jack com o peso dos nomes roubados. ":"A rasura mordeu a luz. ";
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

const PHASE4_BACKGROUND_FILES=Object.freeze([
 "../assets/game/phase4/backgrounds/phase4-bg-01-nonexistent-door.png",
 "../assets/game/phase4/backgrounds/phase4-bg-02-signless-road.png",
 "../assets/game/phase4/backgrounds/phase4-bg-03-nameless-village.png",
 "../assets/game/phase4/backgrounds/phase4-bg-04-footprint-field.png",
 "../assets/game/phase4/backgrounds/phase4-bg-05-erased-archive.png",
 "../assets/game/phase4/backgrounds/phase4-bg-06-nobody-bridge.png",
 "../assets/game/phase4/backgrounds/phase4-bg-07-stolen-names-plaza.png",
 "../assets/game/phase4/backgrounds/phase4-bg-08-collector-house.png",
 "../assets/game/phase4/backgrounds/phase4-bg-09-collector-arena.png"
]);
const PHASE4_PLATFORM_ART_FILES=Object.freeze({
 "2a":Object.freeze([
  "../assets/game/phase4/platforms/2A-estrada-porta/phase4-2a-platform-01.png",
  "../assets/game/phase4/platforms/2A-estrada-porta/phase4-2a-platform-02.png",
  "../assets/game/phase4/platforms/2A-estrada-porta/phase4-2a-platform-03.png",
  "../assets/game/phase4/platforms/2A-estrada-porta/phase4-2a-platform-04.png",
  "../assets/game/phase4/platforms/2A-estrada-porta/phase4-2a-platform-05.png",
  "../assets/game/phase4/platforms/2A-estrada-porta/phase4-2a-platform-06.png"
 ]),
 "2b":Object.freeze([
  "../assets/game/phase4/platforms/2B-povoado-sem-nomes/phase4-2b-platform-01.png",
  "../assets/game/phase4/platforms/2B-povoado-sem-nomes/phase4-2b-platform-02.png",
  "../assets/game/phase4/platforms/2B-povoado-sem-nomes/phase4-2b-platform-03.png",
  "../assets/game/phase4/platforms/2B-povoado-sem-nomes/phase4-2b-platform-04.png",
  "../assets/game/phase4/platforms/2B-povoado-sem-nomes/phase4-2b-platform-05.png"
 ]),
 "2c":Object.freeze([
  "../assets/game/phase4/platforms/2C-campo-das-pegadas/phase4-2c-platform-01.png",
  "../assets/game/phase4/platforms/2C-campo-das-pegadas/phase4-2c-platform-02.png",
  "../assets/game/phase4/platforms/2C-campo-das-pegadas/phase4-2c-platform-03.png",
  "../assets/game/phase4/platforms/2C-campo-das-pegadas/phase4-2c-platform-04.png",
  "../assets/game/phase4/platforms/2C-campo-das-pegadas/phase4-2c-platform-05.png",
  "../assets/game/phase4/platforms/2C-campo-das-pegadas/phase4-2c-platform-06.png"
 ]),
 "2d":Object.freeze([
  "../assets/game/phase4/platforms/2D-arquivo-rasurado/phase4-2d-platform-01.png",
  "../assets/game/phase4/platforms/2D-arquivo-rasurado/phase4-2d-platform-02.png",
  "../assets/game/phase4/platforms/2D-arquivo-rasurado/phase4-2d-platform-03.png",
  "../assets/game/phase4/platforms/2D-arquivo-rasurado/phase4-2d-platform-04.png",
  "../assets/game/phase4/platforms/2D-arquivo-rasurado/phase4-2d-platform-05.png",
  "../assets/game/phase4/platforms/2D-arquivo-rasurado/phase4-2d-platform-06.png"
 ]),
 "2e":Object.freeze([
  "../assets/game/phase4/platforms/2E-ponte-dos-ninguem/phase4-2e-platform-01.png",
  "../assets/game/phase4/platforms/2E-ponte-dos-ninguem/phase4-2e-platform-02.png",
  "../assets/game/phase4/platforms/2E-ponte-dos-ninguem/phase4-2e-platform-03.png",
  "../assets/game/phase4/platforms/2E-ponte-dos-ninguem/phase4-2e-platform-04.png",
  "../assets/game/phase4/platforms/2E-ponte-dos-ninguem/phase4-2e-platform-05.png",
  "../assets/game/phase4/platforms/2E-ponte-dos-ninguem/phase4-2e-platform-06.png"
 ]),
 "2f":Object.freeze([
  "../assets/game/phase4/platforms/2F-praca-dos-nomes-roubados/phase4-2f-platform-01.png",
  "../assets/game/phase4/platforms/2F-praca-dos-nomes-roubados/phase4-2f-platform-02.png",
  "../assets/game/phase4/platforms/2F-praca-dos-nomes-roubados/phase4-2f-platform-03.png",
  "../assets/game/phase4/platforms/2F-praca-dos-nomes-roubados/phase4-2f-platform-04.png",
  "../assets/game/phase4/platforms/2F-praca-dos-nomes-roubados/phase4-2f-platform-05.png",
  "../assets/game/phase4/platforms/2F-praca-dos-nomes-roubados/phase4-2f-platform-06.png"
 ]),
 "2g":Object.freeze([
  "../assets/game/phase4/platforms/2G-casa-do-coletor/phase4-2g-platform-01.png",
  "../assets/game/phase4/platforms/2G-casa-do-coletor/phase4-2g-platform-02.png",
  "../assets/game/phase4/platforms/2G-casa-do-coletor/phase4-2g-platform-03.png",
  "../assets/game/phase4/platforms/2G-casa-do-coletor/phase4-2g-platform-04.png",
  "../assets/game/phase4/platforms/2G-casa-do-coletor/phase4-2g-platform-05.png",
  "../assets/game/phase4/platforms/2G-casa-do-coletor/phase4-2g-platform-06.png"
 ]),
 "2h":Object.freeze([
  "../assets/game/phase4/platforms/2H-arena-do-coletor/phase4-2h-platform-01.png",
  "../assets/game/phase4/platforms/2H-arena-do-coletor/phase4-2h-platform-02.png",
  "../assets/game/phase4/platforms/2H-arena-do-coletor/phase4-2h-platform-03.png",
  "../assets/game/phase4/platforms/2H-arena-do-coletor/phase4-2h-platform-04.png",
  "../assets/game/phase4/platforms/2H-arena-do-coletor/phase4-2h-platform-05.png",
  "../assets/game/phase4/platforms/2H-arena-do-coletor/phase4-2h-platform-06.png"
 ])
});
const phase4PlatformImages=Object.create(null);
const phase4PlatformPromises=Object.create(null);
const phase4PlatformMeta=Object.create(null);

function platformArtKey(group,index){return group+":"+index}
function analyzePlatformSurface(im){
 try{
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(!iw||!ih)return .34;
   const sw=160,sh=Math.max(32,Math.round(ih*(sw/iw)));
   const cv=document.createElement("canvas");cv.width=sw;cv.height=sh;
   const cx=cv.getContext("2d",{willReadFrequently:true});
   cx.clearRect(0,0,sw,sh);cx.drawImage(im,0,0,sw,sh);
   const data=cx.getImageData(0,0,sw,sh).data;
   const x0=Math.floor(sw*.08),x1=Math.floor(sw*.92),need=(x1-x0)*.46;
   for(let y=1;y<sh-1;y++){
     let filled=0;
     for(let x=x0;x<x1;x++)if(data[(y*sw+x)*4+3]>70)filled++;
     if(filled>=need)return Math.max(.08,Math.min(.72,y/sh));
   }
 }catch(e){}
 return .34;
}
function ensurePlatformArt(group,index){
 const files=PHASE4_PLATFORM_ART_FILES[group];
 if(!files||index<0||index>=files.length)return Promise.resolve(null);
 const key=platformArtKey(group,index);
 if(phase4PlatformImages[key])return Promise.resolve(phase4PlatformImages[key]);
 if(phase4PlatformPromises[key])return phase4PlatformPromises[key];
 phase4PlatformPromises[key]=img(files[index])
   .then(im=>{
     phase4PlatformImages[key]=im;
     phase4PlatformMeta[key]={surfaceRatio:analyzePlatformSurface(im)};
     return im;
   })
   .catch(()=>null);
 return phase4PlatformPromises[key];
}
function platformArtRuleAt(x){
 return PLATFORM_ART_LAYOUT.find(r=>x>=r.min&&x<r.max)||PLATFORM_ART_LAYOUT[0];
}
function warmPlatformArt(x){
 const rule=platformArtRuleAt(x);
 const files=PHASE4_PLATFORM_ART_FILES[rule.group]||[];
 files.forEach((_,i)=>ensurePlatformArt(rule.group,i));
}
function selectedPlatformArt(q){
 let index=q.artIndex??0;
 if(q.broken&&Number.isFinite(q.brokenArtIndex))index=q.brokenArtIndex;
 // Praça resolvida usa o segundo trio de artes como variação pós-investigação.
 if(q.artGroup==="2f"&&plazaSolved)index=Math.min(5,index+3);
 // Epílogo usa a última arena intacta como acabamento final.
 if(q.artGroup==="2h"&&phase4Complete&&!q.bossBreakable)index=4;
 return {group:q.artGroup,index};
}
function drawPlatformArt(q,alpha){
 const sel=selectedPlatformArt(q);
 if(!sel.group)return false;
 const key=platformArtKey(sel.group,sel.index);
 const im=phase4PlatformImages[key];
 if(!im){ensurePlatformArt(sel.group,sel.index);return false}
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const meta=phase4PlatformMeta[key]||{surfaceRatio:.34};
 const widthScale=q.h>100?1.035:1.12;
 const dw=Math.max(40,q.w*widthScale),dh=ih*(dw/iw);
 const dx=q.x+q.w/2-dw/2,dy=q.y-meta.surfaceRatio*dh;

 ctx.save();
 ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(q.unstable&&(q.lightTimer||0)>0){
   ctx.shadowColor="rgba(236,204,112,.88)";ctx.shadowBlur=22;
 }else if(bridgePlatformWarning(q)){
   ctx.shadowColor="rgba(204,199,180,.55)";ctx.shadowBlur=12;
 }
 ctx.drawImage(im,dx,dy,dw,dh);
 ctx.restore();
 return true;
}

const phase4BackgroundImages=Array(PHASE4_BACKGROUND_FILES.length).fill(null);
const phase4BackgroundPromises=Array(PHASE4_BACKGROUND_FILES.length).fill(null);
const phase4BackgroundFailed=Array(PHASE4_BACKGROUND_FILES.length).fill(false);

function phase4BackgroundIndex(x){
 let idx=0;
 for(let i=0;i<story.sections.length;i++)if(x>=story.sections[i].x)idx=i;
 return Math.max(0,Math.min(PHASE4_BACKGROUND_FILES.length-1,idx));
}
function ensurePhase4Background(index){
 if(index<0||index>=PHASE4_BACKGROUND_FILES.length)return Promise.resolve(null);
 if(phase4BackgroundImages[index])return Promise.resolve(phase4BackgroundImages[index]);
 if(phase4BackgroundFailed[index])return Promise.resolve(null);
 if(phase4BackgroundPromises[index])return phase4BackgroundPromises[index];
 phase4BackgroundPromises[index]=img(PHASE4_BACKGROUND_FILES[index])
   .then(im=>{phase4BackgroundImages[index]=im;return im})
   .catch(()=>{phase4BackgroundFailed[index]=true;return null});
 return phase4BackgroundPromises[index];
}
function warmPhase4Backgrounds(x){
 const idx=phase4BackgroundIndex(x);
 ensurePhase4Background(idx);
 ensurePhase4Background(idx+1);
 if(idx>0&&x-story.sections[idx].x<360)ensurePhase4Background(idx-1);
}
function hasPhase4BackgroundAt(x){
 return !!phase4BackgroundImages[phase4BackgroundIndex(x)];
}
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

const pilgrimPortraitFiles=[
 "pilgrim-dialogue-01-calm.png",
 "pilgrim-dialogue-02-serious.png",
 "pilgrim-dialogue-03-soft-smile.png",
 "pilgrim-dialogue-04-thinking.png",
 "pilgrim-dialogue-05-sad.png",
 "pilgrim-dialogue-06-surprised.png",
 "pilgrim-dialogue-07-stern.png"
];
const pilgrimPortraitReady=Promise.allSettled(
 pilgrimPortraitFiles.map(f=>img("../assets/game/phase4/npc/pilgrim/dialogue/"+f))
).then(rs=>rs.map(r=>r.status==="fulfilled"?r.value:null));

const dialogueReady=Promise.all([jackPortraitReady,pilgrimPortraitReady]).then(([jackFrames,pilgrimFrames])=>{
 dialogue.setAssets({
   jack:{frames:jackFrames},
   pilgrim:{frames:pilgrimFrames}
 });
});
const initialBackgroundIndex=phase4BackgroundIndex(p.x);
const backgroundReady=Promise.allSettled([
 ensurePhase4Background(initialBackgroundIndex),
 ensurePhase4Background(initialBackgroundIndex+1)
]);
const initialPlatformRule=platformArtRuleAt(p.x);
const platformReady=Promise.allSettled((PHASE4_PLATFORM_ART_FILES[initialPlatformRule.group]||[]).map((_,i)=>ensurePlatformArt(initialPlatformRule.group,i)));
window.__PHASE_ASSETS_READY=Promise.allSettled([jackReady,keyReady,dialogueReady,backgroundReady,platformReady]);

function jackFrame(){
 const a=window.JACK_ANIMATIONS?.animations;if(!a)return 0;
 if(p.attack>0){const dur=window.JACK_ANIMATIONS.timing?.attackDuration||.48,q=Math.max(0,Math.min(.999,(dur-p.attack)/dur));return a.attack[Math.min(a.attack.length-1,Math.floor(q*a.attack.length))]}
 if(!p.on){if(p.vy<-350)return a.jumpStart[0];if(p.vy<-80)return a.jumpRise[0];if(p.vy<130)return a.jumpApex[0];return a.jumpFall[0]}
 if(input.down)return a.crouch[0];
 const sp=Math.abs(p.vx);if(sp>18){const seq=input.run&&sp>170?a.run:a.walk,fps=input.run?12:9;return seq[Math.floor(p.anim*fps)%seq.length]}
 return a.idle[Math.floor(p.anim*2.4)%a.idle.length];
}
const PLATFORM_VISUAL_FOOT_OFFSETS=Object.freeze({
 "2a":6,
 "2b":7,
 "2c":8,
 "2d":9,
 "2e":7,
 "2f":14,
 "2g":11,
 "2h":12
});
const ENEMY_VISUAL_FOOT_EXTRA=Object.freeze({
 eraser:1,
 ashHound:2,
 hollow:3
});
function supportPlatformAt(cx,bottomY,tolerance=34){
 let best=null,bestDist=Infinity;
 for(const q of platforms){
   if(q.broken||!bridgePlatformSolid(q))continue;
   if(cx<q.x-8||cx>q.x+q.w+8)continue;
   const d=Math.abs(bottomY-q.y);
   if(d<=tolerance&&d<bestDist){best=q;bestDist=d}
 }
 return best;
}
function platformVisualFootOffset(q){
 if(!q)return 0;
 return PLATFORM_VISUAL_FOOT_OFFSETS[q.artGroup]||0;
}
function visualFootOffsetAt(cx,bottomY,tolerance=34){
 return platformVisualFootOffset(supportPlatformAt(cx,bottomY,tolerance));
}
function drawGroundShadow(x,y,rx=18,ry=4,alpha=.22){
 ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle="#000";
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();
}

function drawJack(){
 const footFix=p.on?visualFootOffsetAt(p.x+p.w/2,p.y+p.h,38):0;
 if(waitSitActive&&!dialogue.active){
   const im=waitSitImages[waitSitFrame];
   if(im){
     const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
     // Frames 01–05 já correspondem bem ao tamanho do Jack.
     // Nos 06–11 ele ocupa menos área do PNG, então compensamos escala e baseline.
     const seated=waitSitFrame>=5;
     const targetH=seated?222:164,targetW=iw*(targetH/ih);
     const groundY=p.y+p.h+footFix+(seated?22:2);
     const dx=p.x-cam+p.w/2-targetW/2,dy=groundY-targetH;
     drawGroundShadow(p.x-cam+p.w/2,p.y+p.h+footFix+1,seated?23:18,seated?4:3,.2);
     ctx.save();
     ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*12)%2?.42:1;
     ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
     if(p.dir<0){ctx.translate(dx+targetW,0);ctx.scale(-1,1);ctx.drawImage(im,0,dy,targetW,targetH)}
     else ctx.drawImage(im,dx,dy,targetW,targetH);
     ctx.restore();
     return;
   }
 }
 if(p.on)drawGroundShadow(p.x-cam+p.w/2,p.y+p.h+footFix+1,18,3,.22);
 if(!jack){ctx.fillStyle="#eee";ctx.fillRect(p.x-cam,p.y+footFix,p.w,p.h);return}
 const cfg=window.JACK_ANIMATIONS||{},idx=jackFrame(),cell=cfg.cell||320,cols=cfg.cols||8,sx=(idx%cols)*cell,sy=Math.floor(idx/cols)*cell,rw=190,rh=190,dx=p.x-cam+p.w/2-rw/2,dy=p.y+p.h/2-132+footFix,clean=jackFrameOverrides[idx];
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

function drawProceduralBackdrop(){
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
function drawPhase4BackgroundCover(im,alpha,index){
 if(!im||alpha<=0)return;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return;
 const scale=Math.max(W/iw,H/ih)*1.045;
 const dw=iw*scale,dh=ih*scale;
 const start=story.sections[index]?.x||0;
 const end=story.sections[index+1]?.x||WORLD;
 const progress=Math.max(0,Math.min(1,(p.x-start)/Math.max(1,end-start)));
 const pan=(progress-.5)*Math.max(0,dw-W)*.72;
 const dx=(W-dw)/2-pan,dy=(H-dh)/2-16;
 ctx.save();
 ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,dx,dy,dw,dh);
 ctx.restore();
}
function drawBackdrop(){
 const idx=phase4BackgroundIndex(p.x);
 warmPhase4Backgrounds(p.x);
 const current=phase4BackgroundImages[idx];

 if(!current){
   drawProceduralBackdrop();
   return;
 }

 ctx.fillStyle="#0c100e";ctx.fillRect(0,0,W,H);
 drawPhase4BackgroundCover(current,1,idx);

 // Crossfade nos últimos metros de cada área para a troca não parecer um corte seco.
 const nextBoundary=story.sections[idx+1]?.x;
 const next=phase4BackgroundImages[idx+1];
 if(nextBoundary&&next){
   const fadeStart=nextBoundary-190;
   const t=Math.max(0,Math.min(1,(p.x-fadeStart)/190));
   if(t>0)drawPhase4BackgroundCover(next,t,idx+1);
 }

 // Tratamento comum mantém Jack, a névoa e a UI legíveis sobre fundos mais claros.
 ctx.fillStyle="rgba(7,10,9,.16)";ctx.fillRect(0,0,W,H);
 const vignette=ctx.createRadialGradient(W*.5,H*.46,H*.22,W*.5,H*.5,W*.72);
 vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(0,0,0,.27)");
 ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 const fog=ctx.createLinearGradient(0,365,0,H);
 fog.addColorStop(0,"rgba(185,185,165,0)");fog.addColorStop(1,"rgba(176,166,140,.13)");
 ctx.fillStyle=fog;ctx.fillRect(0,350,W,370);
}
function bridgePlatformPhase(q){
 if(!q?.unstable)return 0;
 const cycle=5.6;
 return (bridgeFogClock+(q.phaseOffset||0))%cycle;
}
function bridgePlatformSolid(q){
 if(!q?.unstable)return true;
 if((q.lightTimer||0)>0)return true;
 return bridgePlatformPhase(q)<4.18;
}
function bridgePlatformAlpha(q){
 if(!q?.unstable)return 1;
 if((q.lightTimer||0)>0)return 1;
 const ph=bridgePlatformPhase(q);
 if(ph<3.15)return 1;
 if(ph<4.18)return Math.max(.25,1-(ph-3.15)/1.03*.72);
 return .08;
}
function bridgePlatformWarning(q){
 return !!q?.unstable&&(q.lightTimer||0)<=0&&bridgePlatformPhase(q)>=3.15&&bridgePlatformPhase(q)<4.18;
}
function stabilizeBridgePlatforms(pc,pcy){
 if(!bridgeFearPlayed||p.x<6200||p.x>7900)return 0;
 let count=0;
 for(const q of platforms){
   if(!q.unstable)continue;
   const qx=q.x+q.w/2,qy=q.y;
   if(Math.hypot(qx-pc,(qy-pcy)*.75)<=245){
     q.lightTimer=Math.max(q.lightTimer||0,4.35);
     count++;
   }
 }
 if(count){memoryPulse=Math.max(memoryPulse,.9)}
 return count;
}
function drawRoad(){
 warmPlatformArt(p.x);
 ctx.save();ctx.translate(-cam,0);
 for(const q of platforms){
   const alpha=q.broken?1:bridgePlatformAlpha(q);
   if(alpha<=.03)continue;

   const artDrawn=drawPlatformArt(q,alpha);
   if(!artDrawn){
     ctx.save();
     const artBehind=hasPhase4BackgroundAt(q.x);
     ctx.globalAlpha=alpha*(artBehind?(q.h>100?.72:.9):1);
     const palette={
       road:["#30291f","#847052"],ledge:["#40382d","#9b865d"],
       village:["#332f27","#847457"],traces:["#342d23","#8d7750"],
       archive:["#272925","#6f6a55"],bridge:["#352c21","#9a7d4f"],
       plaza:["#34322d","#7d735e"],collector:["#242522","#655b49"],
       arena:["#201f1d","#8b714b"]
     }[q.kind]||["#30291f","#847052"];

     if(q.broken){
       ctx.fillStyle="rgba(61,52,40,.9)";
       ctx.fillRect(q.x,q.y+8,q.w*.32,18);
       ctx.fillRect(q.x+q.w*.68,q.y+3,q.w*.32,18);
       ctx.fillStyle="rgba(139,105,67,.72)";
       for(let i=0;i<4;i++)ctx.fillRect(q.x+q.w*.38+i*12,q.y+10+i*7,9,7);
     }else{
       if(q.unstable&&(q.lightTimer||0)>0){
         ctx.shadowColor="rgba(236,204,112,.8)";ctx.shadowBlur=18;
       }else if(bridgePlatformWarning(q)){
         ctx.shadowColor="rgba(190,184,166,.5)";ctx.shadowBlur=10;
       }
       ctx.fillStyle=palette[0];ctx.fillRect(q.x,q.y,q.w,q.h);
       ctx.fillStyle=q.unstable&&(q.lightTimer||0)>0?"#d7b96d":palette[1];ctx.fillRect(q.x,q.y,q.w,5);
       if(q.h>100){
         ctx.strokeStyle="rgba(25,22,18,.7)";ctx.lineWidth=3;
         for(let xx=q.x+45;xx<q.x+q.w;xx+=95){ctx.beginPath();ctx.moveTo(xx,q.y+8);ctx.lineTo(xx-18,q.y+42);ctx.stroke()}
       }
     }
     ctx.restore();
   }

   // Gameplay readability stays above the sprite art.
   if(!q.broken&&q.kind==="bridge"&&q.unstable){
     ctx.save();
     ctx.globalAlpha=Math.min(1,alpha+.15);
     ctx.setLineDash([7,7]);
     ctx.strokeStyle=(q.lightTimer||0)>0?"rgba(239,205,119,.88)":"rgba(222,214,191,.48)";
     ctx.lineWidth=2;ctx.strokeRect(q.x+3,q.y+3,q.w-6,q.h-6);
     ctx.setLineDash([]);ctx.restore();
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
 if(!hasPhase4BackgroundAt(xw)){
   ctx.fillStyle="#252721";ctx.fillRect(-90,280,180,310);ctx.strokeStyle="#62563d";ctx.strokeRect(-90,280,180,310);
 }
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
 const footFix=jump?0:visualFootOffsetAt(px,feet,42)+2;
 const visualFeet=feet+footFix;

 ctx.save();ctx.translate(sx+lean,footFix);ctx.globalAlpha=.94;
 if(!jump){
   drawGroundShadow(0,feet+1,22,4,.24);
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
 if(!tracesSolved){
   const revealed=story.traces.filter((_,i)=>traces[i]);
   if(!revealed.length)return 3230;
   const furthest=Math.max(...revealed.map(t=>t.x));
   return Math.max(3230,Math.min(4180,furthest-155));
 }
 if(!pilgrimBridgeDone&&p.x<6100){
   if(prototypeEndPlayed&&!archiveSolved){
     const found=archiveEvidence.filter(Boolean).length;
     const holds=[4800,5140,5530,5860];
     return holds[Math.min(found,holds.length-1)];
   }
   return Math.max(3320,Math.min(5920,p.x-155));
 }
 if(!pilgrimBridgeDone)return 6250;
 if(p.x<9300){
   if(stolenPlazaPlayed&&!plazaSolved){
     const found=plazaEchoes.filter(Boolean).length;
     const holds=[8040,8240,8510,8760];
     return holds[Math.min(found,holds.length-1)];
   }
   return Math.max(8010,Math.min(8840,p.x-165));
 }
 if(p.x<10600)return Math.max(8950,Math.min(10480,p.x-175));
 if(bossResolved){
   if(epilogueStep<4)return 10765;
   if(epilogueStep===4)return 10805;
   return 11155;
 }
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
function drawTraceFoot(x,y,angle,alpha=1,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
 ctx.fillStyle="#e6cc83";
 ctx.beginPath();ctx.ellipse(0,0,7,13,.08,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(7,-8,3.2,4.5,.35,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawTraceFigure(x,y,opts={}){
 const alpha=opts.alpha??.72,dir=opts.dir===-1?-1:1,lean=opts.lean||0,limp=!!opts.limp,phase=opts.phase||0;
 const step=Math.sin(p.anim*3.2+phase)*4;
 ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.rotate(lean);ctx.globalAlpha=alpha;
 ctx.strokeStyle="#ecd48d";ctx.fillStyle="rgba(235,211,142,.14)";
 ctx.shadowColor="rgba(236,204,118,.55)";ctx.shadowBlur=14;
 ctx.lineWidth=4;ctx.lineCap="round";
 ctx.beginPath();ctx.arc(0,-66,11,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(0,-54);ctx.lineTo(0,-20);ctx.stroke();
 ctx.beginPath();ctx.moveTo(0,-43);ctx.lineTo(-16,-24+step*.2);ctx.moveTo(0,-43);ctx.lineTo(16,-28-step*.2);ctx.stroke();
 ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(-12,-1+(limp?7:step));ctx.moveTo(0,-20);ctx.lineTo(12,-1-(limp?2:step));ctx.stroke();
 ctx.restore();
}
function drawTraceMemoryScene(i,t){
 const on=traces[i];if(!on)return;
 const burst=Math.min(1,traceRevealFx[i]/1.15);
 const breathe=.76+.16*Math.sin(p.anim*1.7+i);
 const alpha=Math.min(.92,.46+breathe*.25+burst*.25);
 const baseX=t.x,baseY=500;

 ctx.save();
 // Halo that turns each clue into a readable "memory island".
 const g=ctx.createRadialGradient(baseX,baseY-80,10,baseX,baseY-80,135);
 g.addColorStop(0,"rgba(234,204,119,"+(alpha*.17)+")");
 g.addColorStop(1,"rgba(234,204,119,0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(baseX,baseY-80,135,0,Math.PI*2);ctx.fill();

 ctx.strokeStyle="rgba(224,198,127,"+(alpha*.34)+")";ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(baseX,baseY-82,88+Math.sin(p.anim*1.4+i)*3,0,Math.PI*2);ctx.stroke();

 if(i===0){
   // I — ela chega à vala e decide voltar.
   ctx.strokeStyle="rgba(126,111,78,.72)";ctx.lineWidth=4;
   ctx.beginPath();ctx.moveTo(baseX+42,548);ctx.lineTo(baseX+70,524);ctx.lineTo(baseX+92,552);ctx.stroke();
   drawTraceFigure(baseX+18,baseY-8,{alpha,dir:-1,lean:-.08,phase:.3});
   ctx.strokeStyle="rgba(235,207,125,"+(alpha*.5)+")";ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(baseX+2,baseY-45);ctx.quadraticCurveTo(baseX-28,baseY-65,baseX-48,baseY-38);ctx.stroke();
   ctx.beginPath();ctx.moveTo(baseX-48,baseY-38);ctx.lineTo(baseX-37,baseY-43);ctx.moveTo(baseX-48,baseY-38);ctx.lineTo(baseX-43,baseY-27);ctx.stroke();
 }else if(i===1){
   // II — duas pessoas; uma manca, a outra reduz o passo e sustenta.
   drawTraceFigure(baseX-23,baseY-7,{alpha,dir:1,lean:.02,phase:.2});
   drawTraceFigure(baseX+27,baseY-4,{alpha:alpha*.82,dir:1,lean:.15,limp:true,phase:1.1});
   ctx.strokeStyle="rgba(236,209,131,"+(alpha*.72)+")";ctx.lineWidth=5;ctx.lineCap="round";
   ctx.beginPath();ctx.moveTo(baseX-8,baseY-50);ctx.lineTo(baseX+19,baseY-45);ctx.stroke();
 }else{
   // III — a pessoa ferida segue para longe; ela volta sozinha ao perigo.
   drawTraceFigure(baseX+42,baseY-10,{alpha:alpha*.4,dir:1,limp:true,phase:.8});
   drawTraceFigure(baseX-26,baseY-7,{alpha,dir:-1,lean:-.05,phase:.1});
   ctx.strokeStyle="rgba(235,207,125,"+(alpha*.52)+")";ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(baseX-3,baseY-42);ctx.lineTo(baseX-58,baseY-42);ctx.stroke();
   ctx.beginPath();ctx.moveTo(baseX-58,baseY-42);ctx.lineTo(baseX-47,baseY-49);ctx.moveTo(baseX-58,baseY-42);ctx.lineTo(baseX-47,baseY-35);ctx.stroke();
 }
 ctx.restore();

 ctx.save();ctx.textAlign="center";
 ctx.fillStyle="rgba(243,220,154,"+(.68+burst*.2)+")";
 ctx.font="700 10px Georgia";
 ctx.fillText(t.memoryLabel||t.title,baseX,390);
 ctx.restore();
}
function drawTraces(){
 ctx.save();ctx.translate(-cam,0);

 // Ligação entre as descobertas: quando dois rastros existem, a história começa a "fechar".
 for(let i=0;i<story.traces.length-1;i++){
   if(!traces[i]||!traces[i+1])continue;
   const a=story.traces[i],b=story.traces[i+1];
   ctx.strokeStyle="rgba(229,199,119,.28)";ctx.lineWidth=2;ctx.setLineDash([6,8]);
   ctx.beginPath();ctx.moveTo(a.x+55,546);ctx.quadraticCurveTo((a.x+b.x)/2,525,b.x-55,546);ctx.stroke();
   ctx.setLineDash([]);
 }

 story.traces.forEach((t,i)=>{
   const on=traces[i],pulse=.5+.5*Math.sin(p.anim*2+i);
   const baseAlpha=on?.92:.18;

   // Antes da revelação há só marcas quase apagadas.
   for(let k=0;k<6;k++){
     const side=k%2?-1:1;
     drawTraceFoot(t.x+(k-2.5)*23,553-(k%2)*5,side*.2,baseAlpha,on?1:0.92);
   }

   if(on){
     ctx.strokeStyle="rgba(232,201,117,"+(.22+pulse*.22)+")";ctx.lineWidth=2;
     ctx.beginPath();ctx.arc(t.x,548,54+pulse*5,0,Math.PI*2);ctx.stroke();
     drawTraceMemoryScene(i,t);
   }else{
     const pc=p.x+p.w/2;
     if(Math.abs(pc-t.x)<190){
       ctx.fillStyle="rgba(232,214,167,.82)";ctx.font="700 10px Georgia";ctx.textAlign="center";
       ctx.fillText("F · ILUMINAR RASTRO",t.x,505);
     }
   }
 });

 // Depois dos três, o Campo inteiro vira uma frase visual, não um checklist.
 if(tracesSolved){
   ctx.save();ctx.textAlign="center";
   ctx.fillStyle="rgba(238,216,153,.78)";ctx.font="italic 12px Georgia";
   ctx.fillText("Ela voltou. Amparou. E voltou outra vez.",3910,358);
   ctx.restore();
 }
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
 const grounded=!e.cfg.flying;
 const baseFootFix=grounded?visualFootOffsetAt(e.x+e.w/2,e.y+e.h,44):0;
 const footFix=grounded?baseFootFix+(ENEMY_VISUAL_FOOT_EXTRA[e.kind]||0):0;
 const ex=e.x-cam,visualY=e.y+footFix,cy=visualY+e.h/2,state=e.state;
 const attack=state==="attack",alert=state==="alert";

 if(grounded&&state!=="dissolve")drawGroundShadow(ex+e.w/2,e.y+e.h+footFix+1,e.kind==="ashHound"?25:20,e.kind==="ashHound"?4:3,.2);
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
   ctx.fillStyle="#b9aa89";ctx.font="700 9px Georgia";ctx.fillText(e.label,ex+e.w/2,visualY-14);
   const stateLabel={
     idle:"à espreita",patrol:"patrulha",alert:"percebeu Jack",
     chase:e.kind==="crow"?"circulando":"perseguindo",attack:e.kind==="crow"?"mergulho":"atacando",hit:"atingido"
   }[state]||state;
   ctx.fillStyle="rgba(196,184,150,.65)";ctx.font="italic 8px Georgia";ctx.fillText(stateLabel,ex+e.w/2,visualY-3);

   if(e.cfg.needsReveal&&e.exposedTimer>0){
     ctx.fillStyle="#ddc576";ctx.font="700 8px Georgia";ctx.fillText("EXPOSTO",ex+e.w/2,visualY+e.h+14);
   }
   if(e.hp<e.maxHp){
     const bw=46,bx=ex+e.w/2-bw/2,by=visualY-29;
     ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(bx,by,bw,4);
     ctx.fillStyle="#d6b968";ctx.fillRect(bx,by,bw*(e.hp/e.maxHp),4);
   }
   ctx.restore();
 }
}
function archiveGuardDefeated(i){
 const id=archiveEvidenceGuards[i];
 const e=enemies.find(v=>v.id===id);
 return !e||e.defeated||e.state==="dead"||e.state==="dissolve";
}
function drawArchiveEvidence(){
 if(!prototypeEndPlayed)return;
 const pc=p.x+p.w/2;
 ctx.save();ctx.translate(-cam,0);

 story.archiveEvidence.forEach((ev,i)=>{
   const solved=archiveEvidence[i],guardClear=archiveGuardDefeated(i);
   const x=ev.x,pulse=.5+.5*Math.sin(p.anim*2.1+i*.8),fx=Math.min(1,archiveRevealFx[i]/1.2);

   ctx.save();ctx.translate(x,0);

   // Pedestal / base common to the three proof objects.
   ctx.fillStyle="#242622";ctx.fillRect(-48,520,96,70);
   ctx.strokeStyle=solved?"rgba(224,193,112,.85)":"rgba(105,94,70,.72)";
   ctx.lineWidth=2;ctx.strokeRect(-48,520,96,70);
   ctx.fillStyle=solved?"rgba(225,197,116,.12)":"rgba(190,174,136,.05)";
   ctx.fillRect(-42,526,84,58);

   if(i===0){
     // Page with an unnaturally precise missing name strip.
     ctx.fillStyle="#b8aa88";ctx.fillRect(-31,474,62,48);
     ctx.fillStyle="#242622";ctx.fillRect(-25,483,49,8);
     ctx.strokeStyle="rgba(73,65,49,.65)";ctx.lineWidth=2;
     for(let yy=499;yy<516;yy+=7){ctx.beginPath();ctx.moveTo(-23,yy);ctx.lineTo(23,yy);ctx.stroke()}
   }else if(i===1){
     // Three empty nameplate mounts, screws bent outward.
     ctx.strokeStyle="#8d7d5d";ctx.lineWidth=3;
     for(let yy=470;yy<=512;yy+=21){
       ctx.strokeRect(-34,yy,68,14);
       ctx.beginPath();ctx.moveTo(-38,yy+7);ctx.lineTo(-44,yy+2);ctx.moveTo(38,yy+7);ctx.lineTo(45,yy+12);ctx.stroke();
     }
   }else{
     // Inventory ledger; entries remain while name column is absent.
     ctx.fillStyle="#9f9275";ctx.fillRect(-35,468,70,55);
     ctx.strokeStyle="#544b3b";ctx.lineWidth=2;
     ctx.beginPath();ctx.moveTo(-10,472);ctx.lineTo(-10,519);ctx.stroke();
     for(let yy=480;yy<516;yy+=10){ctx.beginPath();ctx.moveTo(-30,yy);ctx.lineTo(29,yy);ctx.stroke()}
     ctx.fillStyle="#262622";ctx.fillRect(-30,474,17,43);
     ctx.fillStyle=solved?"#d9bd73":"#695f4b";ctx.font="700 7px Georgia";ctx.textAlign="center";
     ctx.fillText("RECEBIDO",12,491);ctx.fillText("RECEBIDO",12,511);
   }

   if(solved){
     ctx.strokeStyle="rgba(238,205,119,"+(.45+pulse*.35)+")";ctx.lineWidth=2;
     ctx.beginPath();ctx.arc(0,493,52+4*pulse,0,Math.PI*2);ctx.stroke();
     ctx.fillStyle="rgba(240,215,150,.9)";ctx.font="700 9px Georgia";ctx.textAlign="center";
     ctx.fillText("PROVA REGISTRADA",0,451);
   }else if(Math.abs(pc-x)<150){
     ctx.fillStyle=guardClear?"rgba(238,220,166,.92)":"rgba(187,169,128,.7)";
     ctx.font="700 9px Georgia";ctx.textAlign="center";
     ctx.fillText(guardClear?ev.prompt:"A PROVA ESTÁ SOB ATAQUE",0,451);
   }

   if(fx>0){
     ctx.globalAlpha=fx*.55;ctx.strokeStyle="#f1d38b";ctx.lineWidth=4;
     ctx.beginPath();ctx.arc(0,493,66+(1-fx)*26,0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
 });

 if(archiveSolved){
   // Visual deduction: the three clues converge toward the road ahead.
   ctx.strokeStyle="rgba(231,199,113,.42)";ctx.lineWidth=2;ctx.setLineDash([7,8]);
   ctx.beginPath();ctx.moveTo(5005,438);ctx.quadraticCurveTo(5380,400,5760,438);ctx.stroke();
   ctx.beginPath();ctx.moveTo(5760,438);ctx.lineTo(6005,438);ctx.stroke();
   ctx.setLineDash([]);
   ctx.fillStyle="rgba(238,211,143,.82)";ctx.font="italic 11px Georgia";ctx.textAlign="center";
   ctx.fillText("os nomes seguiram adiante",5680,410);
   ctx.beginPath();ctx.moveTo(6005,438);ctx.lineTo(5988,430);ctx.moveTo(6005,438);ctx.lineTo(5988,446);ctx.stroke();
 }
 ctx.restore();
}

function drawNobodyBridgeFog(){
 if(!bridgeFearPlayed)return;
 ctx.save();ctx.translate(-cam,0);

 // Fog moves horizontally and thickens around the unstable bridge segments.
 for(let i=0;i<7;i++){
   const y=405+i*24+Math.sin(p.anim*.8+i)*8;
   const drift=((bridgeFogClock*42+i*91)%420)-210;
   const g=ctx.createLinearGradient(6200+drift,y,7870+drift,y);
   g.addColorStop(0,"rgba(184,187,177,0)");
   g.addColorStop(.22,"rgba(184,187,177,.08)");
   g.addColorStop(.6,"rgba(184,187,177,.16)");
   g.addColorStop(1,"rgba(184,187,177,0)");
   ctx.fillStyle=g;ctx.fillRect(6100,y,1800,30);
 }

 for(const q of platforms){
   if(!q.unstable)continue;
   const a=1-bridgePlatformAlpha(q);
   if(a<=.08)continue;
   ctx.fillStyle="rgba(203,205,195,"+Math.min(.34,a*.38)+")";
   ctx.fillRect(q.x-24,q.y-20,q.w+48,55);
 }
 ctx.restore();
}
function drawBridgeIdentityPlate(){
 if(!bridgeCrossedPlayed&&!bridgeNameGlitchPlayed)return;
 const x=7830,y=512;
 ctx.save();ctx.translate(x-cam,y);
 ctx.strokeStyle="#5f533f";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,78);ctx.lineTo(0,0);ctx.stroke();
 ctx.fillStyle="#302f2b";ctx.fillRect(-68,-33,136,42);
 ctx.strokeStyle="rgba(143,119,77,.8)";ctx.lineWidth=2;ctx.strokeRect(-68,-33,136,42);
 ctx.textAlign="center";
 if(bridgeNameGlitchPlayed){
   ctx.fillStyle="rgba(224,196,115,.85)";ctx.font="700 10px Georgia";
   const blink=Math.floor(p.anim*1.8)%3;
   ctx.fillText(blink===0?"J...":(blink===1?"J":""),0,-8);
 }else{
   ctx.fillStyle="rgba(169,155,124,.45)";ctx.font="italic 9px Georgia";ctx.fillText("QUEM PASSOU?",0,-8);
 }
 ctx.restore();
}

function plazaEchoGuardDefeated(i){
 const id=plazaEchoGuards[i];
 const e=enemies.find(v=>v.id===id);
 return !e||e.defeated||e.state==="dead"||e.state==="dissolve";
}
function drawStolenNamePlate(x,y,w=74,h=24,alpha=.72,tilt=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.globalAlpha=alpha;
 ctx.fillStyle="#302d27";ctx.strokeStyle="#8d7650";ctx.lineWidth=2;
 ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);
 ctx.fillStyle="rgba(210,188,134,.28)";
 ctx.fillRect(-w*.32,-1,w*.64,2);
 ctx.fillRect(-w*.24,5,w*.38,2);
 ctx.restore();
}
function drawStolenNamesPlaza(){
 if(!bridgeCrossedPlayed)return;
 const pc=p.x+p.w/2;
 ctx.save();ctx.translate(-cam,0);

 // Suspended names: present as possessions, deliberately separated from voices.
 const plateSeed=[
   [8030,345,-.08],[8140,310,.06],[8260,365,-.04],[8385,300,.09],
   [8510,350,-.07],[8625,315,.05],[8750,370,-.1],[8820,325,.08]
 ];
 plateSeed.forEach((a,i)=>{
   const drift=plazaSolved&&collectorGlimpseTimer>0?Math.min(85,(6.5-collectorGlimpseTimer)*14):0;
   const bob=Math.sin(p.anim*1.4+i)*5;
   ctx.strokeStyle="rgba(103,88,61,.5)";ctx.lineWidth=1.5;
   ctx.beginPath();ctx.moveTo(a[0]+drift,a[1]-72);ctx.lineTo(a[0]+drift,a[1]+bob-13);ctx.stroke();
   drawStolenNamePlate(a[0]+drift,a[1]+bob,76,24,.72,a[2]);
 });

 // Three voice wells. The plaques above them never identify which voice belongs to whom.
 story.plazaEchoes?.forEach((ev,i)=>{
   const on=plazaEchoes[i],clear=plazaEchoGuardDefeated(i);
   const x=ev.x,pulse=.5+.5*Math.sin(p.anim*2+i*.9),fx=Math.min(1,plazaEchoFx[i]/1.25);
   ctx.save();ctx.translate(x,0);

   ctx.strokeStyle=on?"rgba(232,201,116,.8)":"rgba(108,96,73,.55)";
   ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(0,557,68,18,0,0,Math.PI*2);ctx.stroke();

   const g=ctx.createRadialGradient(0,520,5,0,520,75);
   g.addColorStop(0,on?"rgba(236,207,126,.28)":"rgba(185,179,159,.08)");
   g.addColorStop(1,"rgba(200,190,160,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,520,75,0,Math.PI*2);ctx.fill();

   // Voice wisps rise while the matching nameplate stays elsewhere.
   const wispAlpha=on?.55:.13;
   ctx.strokeStyle="rgba(231,220,185,"+wispAlpha+")";ctx.lineWidth=2;
   for(let k=0;k<3;k++){
     const yy=545-k*25-Math.sin(p.anim*1.8+k+i)*5;
     ctx.beginPath();ctx.moveTo(-18+k*16,yy);
     ctx.bezierCurveTo(-28+k*18,yy-16,14-k*9,yy-25,4+k*6,yy-42);ctx.stroke();
   }

   if(on){
     ctx.fillStyle="rgba(240,216,151,.88)";ctx.font="700 9px Georgia";ctx.textAlign="center";
     ctx.fillText(ev.short,0,456);
     if(i===0)ctx.fillText("“...pão...”",0,482);
     if(i===1)ctx.fillText("“...ria...”",0,482);
     if(i===2)ctx.fillText("“...tempestade...”",0,482);
   }else if(Math.abs(pc-x)<165){
     ctx.fillStyle=clear?"rgba(240,221,166,.92)":"rgba(178,163,127,.72)";
     ctx.font="700 9px Georgia";ctx.textAlign="center";
     ctx.fillText(clear?"F · OUVIR O ECO":"O ECO ESTÁ SOB VIGILÂNCIA",0,456);
   }

   if(fx>0){
     ctx.globalAlpha=fx*.6;ctx.strokeStyle="#efd18a";ctx.lineWidth=4;
     ctx.beginPath();ctx.arc(0,520,72+(1-fx)*28,0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
 });

 // Barrier of confiscated nameplates blocks the road until all voices are heard.
 if(stolenPlazaPlayed&&!plazaSolved){
   const gx=8880;
   ctx.strokeStyle="rgba(115,96,62,.75)";ctx.lineWidth=3;
   for(let i=0;i<4;i++){
     const yy=365+i*55;
     ctx.beginPath();ctx.moveTo(gx-52,yy-38);ctx.lineTo(gx+52,yy+18);ctx.stroke();
     drawStolenNamePlate(gx+(i%2?20:-20),yy,92,27,.88,(i%2?1:-1)*.08);
   }
   ctx.fillStyle="rgba(225,201,139,.75)";ctx.font="italic 10px Georgia";ctx.textAlign="center";
   ctx.fillText("nomes sem vozes",gx,338);
 }

 ctx.restore();
}
function drawCollectorGlimpse(){
 if(collectorGlimpseTimer<=0)return;
 const x=9080,y=590;
 const fade=Math.min(1,collectorGlimpseTimer/1.2);
 ctx.save();ctx.translate(x-cam,y);ctx.globalAlpha=.78*fade;

 // Only a partial silhouette: shoulders, one long hand, no readable face.
 ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=22;
 ctx.fillStyle="#111310";
 ctx.beginPath();ctx.moveTo(-86,0);ctx.lineTo(-62,-176);ctx.quadraticCurveTo(-38,-246,0,-254);
 ctx.quadraticCurveTo(38,-246,62,-176);ctx.lineTo(86,0);ctx.closePath();ctx.fill();
 ctx.fillStyle="#070908";ctx.beginPath();ctx.ellipse(0,-225,31,40,0,0,Math.PI*2);ctx.fill();

 // Long arm reaches toward a stolen plate.
 ctx.strokeStyle="#151814";ctx.lineWidth=20;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-48,-155);ctx.quadraticCurveTo(-105,-110,-125,-62);ctx.stroke();
 ctx.lineWidth=7;for(let i=0;i<4;i++){
   ctx.beginPath();ctx.moveTo(-124+i*3,-64);ctx.lineTo(-151+i*8,-44+i*3);ctx.stroke();
 }

 // Plates attached to the body without revealing any name.
 const plates=[[-36,-170,.08],[31,-151,-.07],[-20,-111,-.04],[37,-82,.06]];
 plates.forEach(v=>drawStolenNamePlate(v[0],v[1],58,19,.95,v[2]));

 ctx.fillStyle="rgba(227,197,116,.72)";ctx.font="700 10px Georgia";ctx.textAlign="center";
 ctx.fillText("???",0,-286);

 // Fog cuts the silhouette so the full body is never readable.
 const fog=ctx.createLinearGradient(0,-210,0,10);
 fog.addColorStop(0,"rgba(184,184,166,0)");
 fog.addColorStop(.72,"rgba(184,184,166,.10)");
 fog.addColorStop(1,"rgba(184,184,166,.32)");
 ctx.fillStyle=fog;ctx.fillRect(-165,-210,330,220);
 ctx.restore();
}

function releaseCollectorPlate(index){
 const angles=[-2.35,-1.9,-1.35,-.85,-.35];
 const a=angles[Math.max(0,Math.min(angles.length-1,index))];
 bossReleasedPlates.push({
   x:bossX+(index%2?28:-28),y:430+index*13,
   vx:Math.cos(a)*145,vy:Math.sin(a)*145-55,
   rot:(index%2?1:-1)*.8,life:2.6,maxLife:2.6
 });
}
function spawnCollectorNameProjectile(){
 const sx=bossX+(bossDir<0?-48:48),sy=bossAct===1?405:455;
 const tx=p.x+p.w/2,ty=p.y+p.h*.48;
 const dx=tx-sx,dy=ty-sy,len=Math.max(1,Math.hypot(dx,dy));
 const speed=255;
 bossProjectiles.push({x:sx,y:sy,vx:dx/len*speed,vy:dy/len*speed,w:42,h:16,life:4.2,rot:0,dead:false});
}
function updateCollectorParticles(dt){
 for(const r of bossReleasedPlates){
   r.life-=dt;r.vy+=160*dt;r.x+=r.vx*dt;r.y+=r.vy*dt;r.rot+=dt*(r.vx<0?-1.5:1.5);
 }
 bossReleasedPlates=bossReleasedPlates.filter(r=>r.life>0);
 for(const pr of bossProjectiles){
   if(pr.dead)continue;
   pr.life-=dt;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.rot+=dt*2.8;
   const hitX=Math.abs((p.x+p.w/2)-pr.x)<p.w*.55+pr.w*.5;
   const hitY=Math.abs((p.y+p.h*.5)-pr.y)<p.h*.48+pr.h*.5;
   if(hitX&&hitY&&p.inv<=0){
     pr.dead=true;hurtPlayer(pr.x,285,-325,"collector");
   }
   if(pr.x<10570||pr.x>11320||pr.y<170||pr.y>690)pr.dead=true;
 }
 bossProjectiles=bossProjectiles.filter(pr=>!pr.dead&&pr.life>0);
}
function breakCollectorPlatforms(){
 for(const q of platforms){
   if(!q.bossBreakable||q.broken)continue;
   const bx=bossX,half=62;
   if(bx+half>q.x&&bx-half<q.x+q.w&&q.y>390){
     q.broken=true;
     memoryPulse=Math.max(memoryPulse,.45);
   }
 }
}
function startCollectorBoss(){
 if(bossStarted||bossResolved)return;
 bossStarted=true;arenaReached=true;bossAct=1;bossArmor=5;bossHp=5;bossX=10935;bossDir=-1;
 bossState="intro";bossStateTimer=0;bossAttackClock=1.05;bossProjectiles=[];bossReleasedPlates=[];
 for(const q of platforms)if(q.bossBreakable)q.broken=false;
 p.vx=0;save();
 dialogue.open(story.collectorBossIntro,()=>{
   bossState="idle";bossAttackClock=.75;
   banner("ATO I · OS NOMES ROUBADOS");
   say("Use F perto do Coletor para libertar as placas da armadura.");save();
 });
}
function beginCollectorActTwo(){
 bossAct=2;bossArmor=0;bossHp=5;bossX=10935;bossDir=-1;bossState="idle";bossStateTimer=0;bossAttackClock=.7;bossInv=.3;
 bossProjectiles=[];
 for(const q of platforms)if(q.bossBreakable)q.broken=false;
 banner("ATO II · O HOMEM SOB OS NOMES");
 say("Sem a armadura, o Coletor ficou menor — e muito mais rápido.");save();
}
function finishCollectorArmor(){
 if(bossState==="transition"||bossAct!==1)return;
 bossState="transition";bossProjectiles=[];p.vx=0;save();
 dialogue.open(story.collectorArmorBreak,()=>{
   setTimeout(()=>dialogue.open(story.collectorActTwo,()=>beginCollectorActTwo()),220);
 });
}
function finishCollectorPhysical(){
 if(bossAct!==2)return;
 bossAct=3;bossHp=0;bossState="exhausted";bossStateTimer=0;bossProjectiles=[];bossInv=0;p.vx=0;
 bossX=Math.max(10880,Math.min(11030,bossX));
 save();
 dialogue.open(story.collectorExhausted,()=>{
   banner("ATO III · RECONHECER");
   say("A Luz não precisa feri-lo. Aproxime-se e pressione E.");save();
 });
}
function recognizeCollector(){
 if(!bossStarted||bossResolved||bossAct!==3)return false;
 const pc=p.x+p.w/2;
 if(Math.abs(pc-bossX)>175){say("Jack precisa se aproximar do Coletor.");return true}
 p.vx=0;bossState="recognized";
 dialogue.open(story.collectorRecognized,()=>{
   bossResolved=true;bossState="resolved";bossProjectiles=[];memoryPulse=1.8;epilogueFxClock=7.5;
   banner("O COLETOR FOI RECONHECIDO");
   say("O confronto terminou sem apagar quem estava por baixo dos nomes.");
   save();
   setTimeout(()=>runPhase4Epilogue(),520);
 });
 return true;
}
function grantUninscribedBell(){
 bellObtained=true;memoryPulse=Math.max(memoryPulse,1.45);
 if(!replayMode)localStorage.setItem(BELL_KEY,"yes");
 banner("ITEM · SINO SEM INSCRIÇÃO");
 say("Um sino sem nome agora acompanha a lanterna de Jack.");
 save();
}
function finishPhase4Progress(){
 if(phase4Complete)return;
 phase4Complete=true;epilogueStep=5;epilogueRunning=false;memoryPulse=2;
 if(!replayMode){
   localStorage.setItem(COMPLETE_KEY,"yes");
   localStorage.setItem(PHASE5_KEY,"yes");
   localStorage.setItem(BELL_KEY,"yes");
   localStorage.setItem("jack-phase4-completed-at",String(Date.now()));
   journey?.unlockPhase(5);
 }
 banner("HALLOWEEN IV CONCLUÍDO");
 say("Ser esquecido não significa nunca ter existido.");
 save();
 setTimeout(()=>{if(ui.prototype)ui.prototype.hidden=false},700);
}
function playPhase4Epilogue(lines,step,bannerText,onDone){
 epilogueRunning=true;epilogueStep=step;p.vx=0;
 input.left=input.right=input.down=input.run=false;input.jump=false;
 save();
 dialogue.open(lines,()=>{
   if(bannerText)banner(bannerText);
   if(onDone)onDone();
   epilogueStep=step+1;epilogueRunning=false;save();
   setTimeout(()=>runPhase4Epilogue(),260);
 });
}
function runPhase4Epilogue(){
 if(!bossResolved||phase4Complete||epilogueRunning||dialogue.active)return;
 if(epilogueStep===0){
   epilogueFxClock=Math.max(epilogueFxClock,7.5);
   playPhase4Epilogue(story.collectorRelease,0,"OS NOMES FORAM SOLTOS",()=>{
     bossState="released";memoryPulse=1.25;
   });return;
 }
 if(epilogueStep===1){
   playPhase4Epilogue(story.pilgrimChoice,1,"ELA NÃO PRECISA ESPERAR PELO NOME",()=>{
     pilgrimX=Math.max(pilgrimX,10740);memoryPulse=.9;
   });return;
 }
 if(epilogueStep===2){
   playPhase4Epilogue(story.bellGift,2,"SINO SEM INSCRIÇÃO",()=>grantUninscribedBell());return;
 }
 if(epilogueStep===3){
   memoryPulse=1.35;
   playPhase4Epilogue(story.jackPromiseMemory,3,"MEMÓRIA · EU VOLTO",()=>{
     epilogueFxClock=Math.max(epilogueFxClock,5.5);
   });return;
 }
 if(epilogueStep===4){
   playPhase4Epilogue(story.phase4Farewell,4,"A ESTRADA CONTINUA",()=>finishPhase4Progress());return;
 }
 if(epilogueStep>=5)finishPhase4Progress();
}

function tryLightCollector(pc,pcy){
 if(!bossStarted||bossResolved)return false;
 const dx=bossX-pc,dy=(bossAct===3?500:440)-pcy;
 const d=Math.hypot(dx,dy*.7);

 if(bossAct===3){
   if(d<245){say("Não há mais armadura para arrancar. Talvez outro gesto.");return true}
   return false;
 }
 if(bossState==="intro"||bossState==="transition")return d<330;
 if(bossInv>0)return d<330;

 if(bossAct===1&&d<315){
   bossInv=.52;memoryPulse=1.25;
   const released=5-bossArmor;
   releaseCollectorPlate(released);
   bossArmor=Math.max(0,bossArmor-1);
   banner("NOME LIBERADO · "+(5-bossArmor)+"/5");
   if(bossArmor<=0)finishCollectorArmor();
   else say("Uma placa se soltou. O Coletor ficou um pouco menor.");
   save();return true;
 }
 if(bossAct===2&&d<245){
   bossInv=.3;bossHp=Math.max(0,bossHp-1);memoryPulse=1.0;
   bossX=Math.max(10770,Math.min(11125,bossX+(bossX<pc?-34:34)));
   banner("LUZ · "+bossHp+"/5");
   if(bossHp<=0)finishCollectorPhysical();
   else say("A Luz atravessou o que restou da coleção.");
   save();return true;
 }
 return false;
}
function updateCollectorBoss(dt){
 updateCollectorParticles(dt);
 bossInv=Math.max(0,bossInv-dt);
 if(!bossStarted||bossResolved||dialogue.active)return;

 if(bossAct===1){
   bossDir=(p.x+p.w/2)<bossX?-1:1;
   if(bossState==="idle"){
     bossAttackClock-=dt;
     if(bossAttackClock<=0){
       spawnCollectorNameProjectile();
       bossAttackClock=1.05+(bossArmor*.06);
     }
   }
   return;
 }

 if(bossAct===2){
   const pc=p.x+p.w/2;
   if(bossState==="idle"){
     bossDir=pc<bossX?-1:1;
     bossX+=bossDir*42*dt;
     bossX=Math.max(10755,Math.min(11145,bossX));
     bossAttackClock-=dt;
     if(bossAttackClock<=0){
       bossState="windup";bossStateTimer=.38;bossDir=pc<bossX?-1:1;bossAttackHit=false;
     }
   }else if(bossState==="windup"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){bossState="dash";bossStateTimer=.58}
   }else if(bossState==="dash"){
     bossStateTimer-=dt;bossX+=bossDir*430*dt;
     breakCollectorPlatforms();
     const close=Math.abs(pc-bossX)<74&&Math.abs((p.y+p.h)-590)<150;
     if(close&&!bossAttackHit){
       bossAttackHit=true;hurtPlayer(bossX,355,-355,"collector");
     }
     if(bossX<=10725||bossX>=11175||bossStateTimer<=0){
       bossX=Math.max(10725,Math.min(11175,bossX));
       bossState="recover";bossStateTimer=.5;
     }
   }else if(bossState==="recover"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){bossState="idle";bossAttackClock=.72}
   }
 }
}
function drawCollectorBoss(){
 if(!bossStarted)return;
 const sx=bossX-cam;
 const act=bossAct;
 const resolved=bossResolved;
 const exhausted=act===3||resolved;
 const bodyH=act===1?205:(act===2?154:112);
 const bodyW=act===1?132:(act===2?96:82);
 const feet=590;
 const top=feet-bodyH;
 const flash=bossInv>0&&Math.floor(bossInv*18)%2===0;

 ctx.save();ctx.translate(sx,0);
 ctx.globalAlpha=resolved?.68:1;
 ctx.shadowColor=flash?"rgba(242,213,139,.9)":"rgba(0,0,0,.88)";
 ctx.shadowBlur=flash?25:16;

 // Shadow.
 ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(0,feet+2,bodyW*.5,8,0,0,Math.PI*2);ctx.fill();

 // Body gets visibly smaller as the names are released.
 ctx.fillStyle=flash?"#6c6657":"#121411";
 if(exhausted){
   ctx.beginPath();ctx.ellipse(0,feet-55,bodyW*.45,55,0,0,Math.PI*2);ctx.fill();
   ctx.fillRect(-bodyW*.28,feet-80,bodyW*.56,70);
 }else{
   ctx.beginPath();ctx.moveTo(-bodyW*.5,feet);ctx.lineTo(-bodyW*.38,top+55);
   ctx.quadraticCurveTo(-bodyW*.25,top,0,top-18);
   ctx.quadraticCurveTo(bodyW*.25,top,bodyW*.38,top+55);ctx.lineTo(bodyW*.5,feet);ctx.closePath();ctx.fill();
 }

 // Face remains unreadable.
 ctx.fillStyle="#060807";ctx.beginPath();ctx.ellipse(0,exhausted?feet-94:top+28,act===1?31:25,act===1?40:32,0,0,Math.PI*2);ctx.fill();

 if(act===1){
   const platePos=[[-40,top+76,.08],[32,top+88,-.06],[-28,top+120,-.04],[38,top+133,.07],[0,top+164,.02]];
   const visible=Math.max(0,bossArmor);
   for(let i=0;i<visible;i++)drawStolenNamePlate(platePos[i][0],platePos[i][1],64,21,.98,platePos[i][2]);
   ctx.strokeStyle="rgba(139,118,76,.62)";ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(-48,top+62);ctx.lineTo(-75,feet-20);ctx.moveTo(48,top+62);ctx.lineTo(75,feet-20);ctx.stroke();
 }else if(act===2){
   // Thin arms and forward lean make the second act look faster.
   const lean=bossState==="windup"?-bossDir*10:(bossState==="dash"?bossDir*18:0);
   ctx.strokeStyle="#171a16";ctx.lineWidth=14;ctx.lineCap="round";
   ctx.beginPath();ctx.moveTo(-28+lean,top+62);ctx.lineTo(-58+lean,feet-36);ctx.stroke();
   ctx.beginPath();ctx.moveTo(28+lean,top+62);ctx.lineTo(58+lean,feet-36);ctx.stroke();
   if(bossState==="windup"){
     ctx.strokeStyle="rgba(239,205,119,.72)";ctx.lineWidth=3;
     ctx.beginPath();ctx.arc(0,feet-80,70,0,Math.PI*2);ctx.stroke();
   }
 }else{
   ctx.strokeStyle="rgba(156,143,111,.55)";ctx.lineWidth=4;
   ctx.beginPath();ctx.moveTo(-22,feet-57);ctx.lineTo(-38,feet-16);ctx.moveTo(22,feet-57);ctx.lineTo(38,feet-16);ctx.stroke();
 }

 // E prompt only when violence is over.
 if(act===3&&!resolved){
   ctx.fillStyle="rgba(242,218,154,.95)";ctx.font="700 11px Georgia";ctx.textAlign="center";
   ctx.fillText("E · RECONHECER",0,top-42);
 }
 if(resolved){
   ctx.fillStyle="rgba(229,207,149,.78)";ctx.font="italic 10px Georgia";ctx.textAlign="center";
   ctx.fillText("RECONHECIDO",0,top-34);
 }

 ctx.restore();

 // Released labels fly away instead of vanishing into the boss.
 for(const r of bossReleasedPlates){
   const a=Math.max(0,r.life/r.maxLife);
   drawStolenNamePlate(r.x-cam,r.y,62,20,a,r.rot);
 }

 // Nameplate projectiles.
 for(const pr of bossProjectiles){
   drawStolenNamePlate(pr.x-cam,pr.y,pr.w,pr.h,.9,pr.rot);
 }

 // Boss HUD.
 if(!resolved){
   ctx.save();
   ctx.textAlign="center";ctx.fillStyle="rgba(12,13,12,.78)";ctx.fillRect(W/2-205,102,410,52);
   ctx.strokeStyle="rgba(181,151,91,.65)";ctx.lineWidth=2;ctx.strokeRect(W/2-205,102,410,52);
   ctx.fillStyle="#dfc27a";ctx.font="700 12px Georgia";
   ctx.fillText("O COLETOR DE NOMES · ATO "+act,W/2,122);
   const val=act===1?bossArmor:(act===2?bossHp:1),max=act===1?5:(act===2?5:1);
   ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(W/2-160,134,320,8);
   ctx.fillStyle="#c6aa68";ctx.fillRect(W/2-160,134,320*(val/max),8);
   ctx.restore();
 }
}

function drawUninscribedBell(x,y,scale=1,alpha=1){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
 ctx.shadowColor="rgba(235,202,117,.75)";ctx.shadowBlur=14;
 ctx.strokeStyle="#d7bb74";ctx.fillStyle="#554b38";ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-15,8);ctx.quadraticCurveTo(-13,-17,0,-24);ctx.quadraticCurveTo(13,-17,15,8);ctx.lineTo(-15,8);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(-18,8);ctx.lineTo(18,8);ctx.stroke();
 ctx.fillStyle="#d6b96e";ctx.beginPath();ctx.arc(0,13,5,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#9f895b";ctx.beginPath();ctx.arc(0,-27,6,Math.PI,Math.PI*2);ctx.stroke();
 ctx.restore();
}
function drawPhase4Epilogue(){
 if(!bossResolved)return;
 ctx.save();ctx.translate(-cam,0);

 // Names finally leave the Collector instead of remaining attached to him.
 if(epilogueStep<=1||epilogueFxClock>0){
   const strength=Math.min(1,.32+epilogueFxClock*.12);
   for(let i=0;i<12;i++){
     const travel=(p.anim*26+i*39)%310;
     const x=10920+Math.sin(i*1.71+p.anim*.35)*105;
     const y=545-travel;
     const a=Math.max(0,Math.min(.78,strength*(1-travel/350)));
     drawStolenNamePlate(x,y,54+(i%3)*7,18,a,(i%2?1:-1)*(.05+i*.012));
   }
 }

 // The bell has no inscription, but it still has a function.
 if(epilogueStep>=2&&epilogueStep<5){
   const bx=10835,by=455+Math.sin(p.anim*2.2)*4;
   const g=ctx.createRadialGradient(bx,by,8,bx,by,70);
   g.addColorStop(0,"rgba(235,202,117,.22)");g.addColorStop(1,"rgba(235,202,117,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,70,0,Math.PI*2);ctx.fill();
   drawUninscribedBell(bx,by,1.05,.95);
 }

 // The recurring door returns only as memory: no handle, no destination revealed.
 if(epilogueStep===3||epilogueStep===4){
   const x=11105,y=312;
   const pulse=.65+.2*Math.sin(p.anim*2);
   ctx.strokeStyle="rgba(232,202,124,"+pulse+")";ctx.lineWidth=4;
   ctx.shadowColor="#e1bd66";ctx.shadowBlur=22;
   ctx.strokeRect(x-54,y,108,278);
   ctx.setLineDash([7,7]);ctx.globalAlpha=.5;
   ctx.strokeRect(x-42,y+15,84,248);ctx.setLineDash([]);
   ctx.globalAlpha=.18;ctx.fillStyle="#e4c477";ctx.fillRect(x-50,y+4,100,270);
   ctx.globalAlpha=.82;ctx.fillStyle="#e7cf91";ctx.font="italic 10px Georgia";ctx.textAlign="center";
   ctx.fillText("uma porta que ainda não abre",x,y-18);
 }

 if(phase4Complete){
   const g=ctx.createLinearGradient(10910,0,11250,0);
   g.addColorStop(0,"rgba(228,197,117,0)");g.addColorStop(1,"rgba(228,197,117,.18)");
   ctx.fillStyle=g;ctx.fillRect(10910,485,340,105);
   ctx.fillStyle="rgba(235,211,151,.76)";ctx.font="italic 12px Georgia";ctx.textAlign="right";
   ctx.fillText("a estrada continua",11210,548);
 }
 ctx.restore();

 // Permanent-item reminder during the final beats.
 if(bellObtained&&!phase4Complete){
   ctx.save();ctx.fillStyle="rgba(12,13,12,.68)";ctx.fillRect(W-205,92,170,48);
   drawUninscribedBell(W-181,116,.55,.9);
   ctx.fillStyle="#dbc27f";ctx.font="700 9px Georgia";ctx.textAlign="left";
   ctx.fillText("SINO SEM INSCRIÇÃO",W-155,113);
   ctx.fillStyle="rgba(222,211,177,.72)";ctx.font="italic 8px Georgia";ctx.fillText("sem nome · ainda toca",W-155,128);
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
 drawRoad();
 if(!hasPhase4BackgroundAt(p.x))drawPhase4SkeletonLandmarks();
 drawSigns();drawDoor();drawArchiveEvidence();drawNobodyBridgeFog();drawBridgeIdentityPlate();drawStolenNamesPlaza();drawCollectorGlimpse();
 checkpoints.forEach(drawCheckpoint);
 drawPilgrim();drawTraces();enemies.forEach(drawEnemy);drawCollectorBoss();drawPhase4Epilogue();
 if(prototypeEndPlayed){
   ctx.save();ctx.translate(4660-cam,0);ctx.strokeStyle="#d6bd7a";ctx.lineWidth=2;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,590);ctx.lineTo(0,370);ctx.stroke();ctx.fillStyle="#e6cd8a";ctx.font="italic 11px Georgia";ctx.textAlign="center";
   ctx.fillText(archiveSolved?"os nomes não sumiram — foram levados":"há marcas de remoção no arquivo",0,345);ctx.restore();
 }
}
function drawMemoryLight(){
 if(memoryLight<=0&&memoryPulse<=0)return;
 const a=Math.min(.34,.08+memoryLight*.05+memoryPulse*.23),cx=p.x-cam+p.w/2,cy=p.y+p.h*.5;
 const g=ctx.createRadialGradient(cx,cy,24,cx,cy,230);g.addColorStop(0,"rgba(244,215,132,"+a+")");g.addColorStop(.55,"rgba(191,160,86,"+(a*.5)+")");g.addColorStop(1,"rgba(80,71,49,0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,230,0,Math.PI*2);ctx.fill();
}

function playCollectorGlimpse(delay=0){
 if(collectorGlimpsePlayed||collectorGlimpseQueued)return;
 collectorGlimpseQueued=true;collectorGlimpseTimer=6.5;p.vx=0;save();
 setTimeout(()=>{
   if(collectorGlimpsePlayed){collectorGlimpseQueued=false;return}
   dialogue.open(story.collectorGlimpse,()=>{
     collectorGlimpsePlayed=true;collectorGlimpseQueued=false;
     banner("O COLETOR OBSERVA DA ESTRADA");
     collectorGlimpseTimer=Math.max(collectorGlimpseTimer,3.8);save();
   });
 },delay);
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
 if(bossStarted&&!bossResolved&&bossAct===3){
   if(recognizeCollector())return;
 }
 if(!doorOpened&&pc<1050){openDoor();return}
 if(doorOpened&&!pilgrimMet&&Math.abs(pc-2580)<130){
   pilgrimMet=true;pilgrimX=2580;pilgrimFeetY=590;p.vx=0;
   dialogue.open(story.pilgrimMeeting,()=>{banner("POVOADO SEM NOMES");say("A Peregrina seguirá Jack, mas não atravessará o mundo como uma sombra colada nele.");save()});return;
 }
 if(tracesSolved&&!prototypeEndPlayed&&pc>4660){
   prototypeEndPlayed=true;p.vx=0;
   dialogue.open(story.prototypeEnd,()=>{banner("ARQUIVO RASURADO");say("Derrote as criaturas e examine as marcas deixadas nos registros.");save()});return;
 }
 if(prototypeEndPlayed&&!archiveSolved&&story.archiveEvidence){
   let idx=-1,best=999;
   story.archiveEvidence.forEach((ev,i)=>{
     const d=Math.abs(ev.x-pc);
     if(!archiveEvidence[i]&&d<best){best=d;idx=i}
   });
   if(idx>=0&&best<150){
     if(!archiveGuardDefeated(idx)){
       const guard=enemies.find(e=>e.id===archiveEvidenceGuards[idx]);
       say((guard?.label||"A criatura")+" ainda protege esta parte do arquivo.");return;
     }
     archiveEvidence[idx]=true;archiveRevealFx[idx]=2.2;memoryPulse=1.1;p.vx=0;
     const all=archiveEvidence.every(Boolean);
     banner(story.archiveEvidence[idx].title);
     dialogue.open(story.archiveEvidence[idx].dialogue,()=>{
       say(story.archiveEvidence[idx].text);save();
       if(all){
         archiveSolved=true;memoryPulse=1.5;save();
         setTimeout(()=>dialogue.open(story.archiveSolved,()=>{
           banner("OS NOMES ESTÃO SENDO COLETADOS");
           say("A passagem para a Ponte dos Ninguém foi liberada.");save();
         }),240);
       }
     });
     save();return;
   }
 }
 say("Nada responde aqui. Ainda.");
}
function useLight(){
 if(!running||dialogue.active)return;
 markPlayerAction();
 p.attack=.48;memoryLight=2.4;memoryPulse=.55;
 const pc=p.x+p.w/2;
 const pcy=p.y+p.h*.48;
 const bridgeLit=stabilizeBridgePlatforms(pc,pcy);
 if(tryLightCollector(pc,pcy))return;

 if(pilgrimMet&&!tracesSolved){
   let hit=-1,best=999;
   story.traces.forEach((t,i)=>{
     const d=Math.abs(t.x-pc);
     if(!traces[i]&&d<best){best=d;hit=i}
   });
   if(hit>=0&&best<175){
     traces[hit]=true;traceRevealFx[hit]=2.25;memoryPulse=1.25;p.vx=0;
     const justSolved=traces.every(Boolean);
     if(justSolved)tracesSolved=true;
     banner(story.traces[hit].title.toUpperCase());
     const revealDialogue=story.traceReveals?.[hit]||[];
     dialogue.open(revealDialogue,()=>{
       say(story.traces[hit].text);
       save();
       if(justSolved){
         setTimeout(()=>dialogue.open(story.tracesSolved,()=>{
           banner("IDENTIDADE TAMBÉM É O QUE FAZEMOS");
           memoryPulse=1.4;save();
         }),220);
       }
     });
     save();return;
   }
 }

 let target=null,best=999;
 for(const e of enemies){
   if(!enemyCanBeHit(e))continue;
   const dx=(e.x+e.w/2)-pc,dy=(e.y+e.h/2)-pcy;
   const d=Math.hypot(dx,dy*.72);
   if(d<best&&d<=e.cfg.lightRange){best=d;target=e}
 }
 if(target){
   if(hitEnemy(target,1,pc)){save();return}
 }

 if(stolenPlazaPlayed&&!plazaSolved&&story.plazaEchoes){
   let idx=-1,bestEcho=999;
   story.plazaEchoes.forEach((ev,i)=>{
     const d=Math.abs(ev.x-pc);
     if(!plazaEchoes[i]&&d<bestEcho){bestEcho=d;idx=i}
   });
   if(idx>=0&&bestEcho<175){
     if(!plazaEchoGuardDefeated(idx)){
       const guard=enemies.find(e=>e.id===plazaEchoGuards[idx]);
       say((guard?.label||"A criatura")+" mantém esta voz presa sob a vigilância.");return;
     }
     plazaEchoes[idx]=true;plazaEchoFx[idx]=2.4;memoryPulse=1.3;p.vx=0;
     const all=plazaEchoes.every(Boolean);
     banner(story.plazaEchoes[idx].title);
     dialogue.open(story.plazaEchoes[idx].dialogue,()=>{
       say(story.plazaEchoes[idx].text);save();
       if(all){
         plazaSolved=true;memoryPulse=1.55;save();
         setTimeout(()=>dialogue.open(story.plazaSolved,()=>{
           banner("NOMES NÃO SÃO PESSOAS");
           playCollectorGlimpse(260);
         }),230);
       }
     });
     save();return;
   }
 }

 if(bridgeLit){
   say(bridgeLit>1?"A Luz firmou várias partes da ponte por alguns segundos.":"A Luz firmou a plataforma contra a névoa.");
   return;
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
   p.vx*=.75;
   if(bossResolved)updatePilgrim(dt);
   p.anim+=dt;cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.34))-cam)*Math.min(1,dt*4);return
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
 for(let i=0;i<traceRevealFx.length;i++)traceRevealFx[i]=Math.max(0,traceRevealFx[i]-dt);
 for(let i=0;i<archiveRevealFx.length;i++)archiveRevealFx[i]=Math.max(0,archiveRevealFx[i]-dt);
 if(bridgeFearPlayed&&!bridgeCrossedPlayed)bridgeFogClock+=dt;
 for(const q of platforms)if(q.unstable&&q.lightTimer>0)q.lightTimer=Math.max(0,q.lightTimer-dt);
 for(let i=0;i<plazaEchoFx.length;i++)plazaEchoFx[i]=Math.max(0,plazaEchoFx[i]-dt);
 collectorGlimpseTimer=Math.max(0,collectorGlimpseTimer-dt);
 epilogueFxClock=Math.max(0,epilogueFxClock-dt);
 updateCollectorBoss(dt);
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
 if(prototypeEndPlayed&&!archiveSolved&&p.x+p.w>5910){
   p.x=5910-p.w;p.vx=Math.min(0,p.vx);
   if(gateMsg<=0){
     const found=archiveEvidence.filter(Boolean).length;
     say("O Arquivo ainda guarda provas. Examine os registros com E. "+found+"/3.");gateMsg=2;
   }
 }
 if(bridgeFearPlayed&&!pilgrimBridgeDone&&p.x+p.w>7945){
   p.x=7945-p.w;p.vx=Math.min(0,p.vx);
   if(gateMsg<=0){say("A Peregrina ainda está atravessando. Jack espera que ela encontre o próprio passo.");gateMsg=1.8}
 }
 if(stolenPlazaPlayed&&!plazaSolved&&p.x+p.w>8875){
   p.x=8875-p.w;p.vx=Math.min(0,p.vx);
   if(gateMsg<=0){
     const heard=plazaEchoes.filter(Boolean).length;
     say("As placas fecham a saída. Ainda há vozes separadas de seus nomes. "+heard+"/3.");gateMsg=2;
   }
 }
 if(bossStarted&&!bossResolved&&p.x>10480&&p.x<10685){
   p.x=10685;p.vx=Math.max(0,p.vx);
   if(gateMsg<=0){say("A arena fechou atrás de Jack.");gateMsg=1.6}
 }

 p.y+=p.vy*dt;p.on=false;
 for(const q of platforms){
   if(q.broken||!bridgePlatformSolid(q))continue;
   if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){
     p.y=q.y-p.h;p.vy=0;p.on=true;
   }
 }
 if(p.y>780){
   playerLife--;syncHud();
   const wasBridge=p.x>6200&&p.x<7900;
   if(playerLife<=0)respawn(wasBridge?"A Ponte dos Ninguém apagou o chão — mas o checkpoint guardou a travessia.":"A estrada tentou apagar Jack.");
   else{
     const cp=checkpoints.find(q=>q.id===activeCheckpoint);
     p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;
     if(wasBridge){bridgeFogClock=0;for(const q of platforms)if(q.unstable)q.lightTimer=0}
     say((wasBridge?"A névoa apagou a plataforma sob Jack. ":"Um passo desapareceu na névoa. ")+playerLife+"/3.");
   }
 }
 updateCheckpoint();
 if(bossResolved&&!phase4Complete&&!epilogueRunning&&!dialogue.active)runPhase4Epilogue();
 if(!pilgrimMet&&doorOpened&&p.x>2400){
   pilgrimMet=true;pilgrimX=2580;pilgrimFeetY=590;p.vx=0;
   dialogue.open(story.pilgrimMeeting,()=>{banner("POVOADO SEM NOMES");say("A Peregrina seguirá Jack, mas vai esperar quando o caminho pedir outra coisa.");save()})
 }else if(tracesSolved&&!prototypeEndPlayed&&p.x>4700){
   prototypeEndPlayed=true;p.vx=0;
   dialogue.open(story.prototypeEnd,()=>{banner("ARQUIVO RASURADO");say("A Peregrina volta a acompanhar Jack pelos registros arrancados.");save()})
 }else if(archiveSolved&&!bridgeFearPlayed&&p.x>6070){
   bridgeFearPlayed=true;p.vx=0;
   dialogue.open(story.bridgeFear,()=>{pilgrimX=Math.min(pilgrimX,6250);banner("PONTE DOS NINGUÉM");say("Ela não perdeu o medo. Mesmo assim, vai atravessar.");save()})
 }else if(pilgrimBridgeDone&&!bridgeNameGlitchPlayed&&p.x>7950){
   bridgeNameGlitchPlayed=true;p.vx=0;
   dialogue.open(story.bridgeNameGlitch,()=>{
     banner("A ESTRADA NÃO ESCREVEU O NOME DE JACK");
     memoryPulse=1.15;save();
   })
 }else if(bridgeNameGlitchPlayed&&!bridgeCrossedPlayed&&p.x>8010){
   bridgeCrossedPlayed=true;p.vx=0;
   dialogue.open(story.bridgeCrossed,()=>{banner("UM MEDO TAMBÉM É UM RASTRO");save()})
 }else if(bridgeCrossedPlayed&&!stolenPlazaPlayed&&p.x>8040){
   stolenPlazaPlayed=true;p.vx=0;
   dialogue.open(story.stolenPlaza,()=>{
     banner("PRAÇA DOS NOMES ROUBADOS");
     say("A Luz consegue alcançar as vozes depois que seus guardiões forem dissipados.");save();
   })
 }else if(plazaSolved&&stolenPlazaPlayed&&!collectorGlimpsePlayed&&!collectorGlimpseQueued&&p.x>8500){
   playCollectorGlimpse();
 }else if(plazaSolved&&!collectorApproachPlayed&&p.x>9340){
   collectorApproachPlayed=true;p.vx=0;
   dialogue.open(story.collectorApproach,()=>{banner("CASA DO COLETOR");save()})
 }else if(collectorApproachPlayed&&!arenaEdgePlayed&&p.x>10420){
   arenaEdgePlayed=true;p.vx=0;
   dialogue.open(story.arenaEdge,()=>{pilgrimX=Math.min(pilgrimX,10535);banner("DIANTE DA CASA DO COLETOR");save()})
 }else if(arenaEdgePlayed&&!bossStarted&&!bossResolved&&p.x>10720){
   startCollectorBoss();
 }

 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.34))-cam)*Math.min(1,dt*5);
 let si=0;for(let i=0;i<story.sections.length;i++)if(p.x>=story.sections[i].x)si=i;if(si!==section){section=si;warmPhase4Backgrounds(p.x);warmPlatformArt(p.x);banner(story.sections[si].name)}
 if(!doorOpened)ui.obj.textContent="A chave de Mara reage à parede. Aproxime-se e pressione E.";
 else if(!pilgrimMet)ui.obj.textContent="Atravesse a Estrada sem Placas e encontre quem ainda espera.";
 else if(!tracesSolved){
   const found=traces.filter(Boolean).length;
   ui.obj.textContent="CAMPO DAS PEGADAS: use F para reconstruir as ações da Peregrina. Rastros "+found+"/3.";
 }
 else if(p.x<6100){
   const found=archiveEvidence.filter(Boolean).length;
   ui.obj.textContent=archiveSolved
     ?"ARQUIVO RASURADO: as três provas apontam para a estrada adiante."
     :"ARQUIVO RASURADO: derrote os guardiões e use E nas provas. Evidências "+found+"/3.";
 }
 else if(p.x<7900){
   ui.obj.textContent="PONTE DOS NINGUÉM: a névoa apaga plataformas. Use F para firmá-las enquanto desvia dos Corvos.";
 }
 else if(p.x<9300){
   const heard=plazaEchoes.filter(Boolean).length;
   ui.obj.textContent=!stolenPlazaPlayed
     ?"PRAÇA DOS NOMES ROUBADOS: entre no círculo de placas."
     :(plazaSolved
       ?"PRAÇA DOS NOMES ROUBADOS: as vozes provaram que nome e pessoa foram separados. Siga a silhueta."
       :"PRAÇA DOS NOMES ROUBADOS: derrote os guardiões e use F para ouvir os ecos. Vozes "+heard+"/3.");
 }
 else if(p.x<10600)ui.obj.textContent="CASA DO COLETOR: siga com a Peregrina até a entrada da arena.";
 else if(!bossStarted)ui.obj.textContent="ARENA DO COLETOR: entre e descubra o que existe sob a coleção de nomes.";
 else if(phase4Complete)ui.obj.textContent="HALLOWEEN IV CONCLUÍDO: o Sino sem Inscrição acompanha Jack. A estrada continua.";
 else if(bossResolved){
   const epilogueObjective=[
     "EPÍLOGO: o Coletor está soltando os nomes.",
     "EPÍLOGO: a Peregrina decide se continuará esperando pelo próprio nome.",
     "EPÍLOGO: receba o Sino sem Inscrição.",
     "EPÍLOGO: a porta de Jack voltou a aparecer.",
     "EPÍLOGO: escolha continuar pela estrada."
   ][Math.min(4,epilogueStep)];
   ui.obj.textContent=epilogueObjective;
 }
 else if(bossAct===1)ui.obj.textContent="ATO I: use F perto do Coletor para libertar 5 placas da armadura. "+(5-bossArmor)+"/5.";
 else if(bossAct===2)ui.obj.textContent="ATO II: desvie das investidas, cuidado com as plataformas quebradas e alcance o Coletor com F. "+bossHp+"/5.";
 else ui.obj.textContent="ATO III: não há mais nada para destruir. Aproxime-se e pressione E · RECONHECER.";
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
 if(phase4Complete){setTimeout(()=>{if(ui.prototype)ui.prototype.hidden=false},420);return}
 if(!introPlayed){introPlayed=true;setTimeout(()=>dialogue.open(story.opening,()=>{say("A Chave de Madeira de Mara começou a aquecer.");save()}),300)}
};
document.getElementById("phase4Continue")?.addEventListener("click",()=>ui.prototype.hidden=true);
document.getElementById("phase4Menu")?.addEventListener("click",()=>location.href="../index.html#fases");
document.getElementById("phase4Replay")?.addEventListener("click",()=>{location.href="phase4.html?replay=1&new=1"});

function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
addEventListener("pagehide",save);document.addEventListener("visibilitychange",()=>{if(document.hidden)save()});
syncHud();draw();
})();