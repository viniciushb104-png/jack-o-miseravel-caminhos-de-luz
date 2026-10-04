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

const PHASE4_MUSIC=Object.freeze({
 door:Object.freeze({src:"../assets/audio/phase4/phase4-door-theme.mp3?v=1",volume:.48}),
 road:Object.freeze({src:"../assets/audio/phase4/phase4-forgotten-road-theme.mp3?v=1",volume:.55}),
 village:Object.freeze({src:"../assets/audio/phase4/phase4-nameless-village-theme.mp3?v=1",volume:.52}),
 footprints:Object.freeze({src:"../assets/audio/phase4/phase4-footprints-theme.mp3?v=1",volume:.53}),
 archive:Object.freeze({src:"../assets/audio/phase4/phase4-erased-archive-theme.mp3?v=1",volume:.54}),
 bridge:Object.freeze({src:"../assets/audio/phase4/phase4-nobody-bridge-theme.mp3?v=1",volume:.48}),
 plaza:Object.freeze({src:"../assets/audio/phase4/phase4-stolen-names-plaza-theme.mp3?v=1",volume:.52}),
 collectorHouse:Object.freeze({src:"../assets/audio/phase4/phase4-collector-house-theme.mp3?v=1",volume:.56}),
 boss1:Object.freeze({src:"../assets/audio/phase4/phase4-collector-boss-act1.mp3?v=1",volume:.64}),
 boss2:Object.freeze({src:"../assets/audio/phase4/phase4-collector-boss-act2.mp3?v=1",volume:.66}),
 boss3:Object.freeze({src:"../assets/audio/phase4/phase4-collector-boss-act3.mp3?v=1",volume:.54}),
 epilogue:Object.freeze({src:"../assets/audio/phase4/phase4-uninscribed-bell-epilogue.mp3?v=1",volume:.55}),
 finale:Object.freeze({src:"../assets/audio/phase4/phase4-road-continues-finale.mp3?v=1",volume:.58})
});
const phase4MusicChannels=[new Audio(),new Audio()];
phase4MusicChannels.forEach(a=>{a.loop=true;a.preload="metadata";a.volume=0});
let phase4MusicEnabled=localStorage.getItem("jack-phase4-music-muted")!=="1";
let phase4MusicActiveChannel=0,phase4MusicKey="",phase4MusicPendingKey="",phase4MusicFade=0;
const phase4MusicFailed=new Set();
const phase4MusicToggle=document.getElementById("phase4MusicToggle");

function syncPhase4MusicToggle(){
 phase4MusicChannels.forEach(a=>a.muted=!phase4MusicEnabled);
 if(!phase4MusicToggle)return;
 phase4MusicToggle.setAttribute("aria-pressed",String(!phase4MusicEnabled));
 phase4MusicToggle.setAttribute("aria-label",phase4MusicEnabled?"Silenciar música":"Ativar música");
 const icon=phase4MusicToggle.querySelector("b");
 if(icon)icon.textContent=phase4MusicEnabled?"♫":"×";
}
function desiredPhase4Music(){
 if(phase4Complete)return "finale";
 if(bossStarted){
   if(bossResolved)return epilogueStep>=5?"finale":"epilogue";
   if(bossAct===1)return "boss1";
   if(bossAct===2)return "boss2";
   return "boss3";
 }
 const x=p.x+p.w/2;
 if(x<980)return "door";
 if(x<2140)return "road";
 if(x<3240)return "village";
 if(x<4760)return "footprints";
 if(x<6070)return "archive";
 if(x<7900)return "bridge";
 if(x<8940)return "plaza";
 return "collectorHouse";
}
function stopPhase4Music(){
 cancelAnimationFrame(phase4MusicFade);
 phase4MusicChannels.forEach(a=>{a.pause();a.volume=0});
 phase4MusicKey="";phase4MusicPendingKey="";
}
function fadePhase4MusicTo(key,force=false){
 if(!phase4MusicEnabled)return;
 if(!force&&(key===phase4MusicKey||key===phase4MusicPendingKey))return;
 const track=PHASE4_MUSIC[key];
 if(!track||phase4MusicFailed.has(key))return;

 phase4MusicPendingKey=key;
 const prevIndex=phase4MusicActiveChannel;
 const nextIndex=prevIndex===0?1:0;
 const prev=phase4MusicChannels[prevIndex],next=phase4MusicChannels[nextIndex];

 cancelAnimationFrame(phase4MusicFade);
 next.pause();next.src=track.src;next.currentTime=0;next.volume=0;next.muted=!phase4MusicEnabled;
 try{next.load()}catch(_){}

 Promise.resolve(next.play()).then(()=>{
   if(phase4MusicPendingKey!==key){next.pause();next.volume=0;return}
   const started=performance.now(),duration=(key.startsWith("boss")?720:1150);
   const fromPrev=prev.volume||0,target=track.volume;
   const tick=now=>{
     if(phase4MusicPendingKey!==key)return;
     const t=Math.min(1,(now-started)/duration),ease=t*t*(3-2*t);
     next.volume=target*ease;
     prev.volume=fromPrev*(1-ease);
     if(t<1)phase4MusicFade=requestAnimationFrame(tick);
     else{
       prev.pause();prev.volume=0;
       phase4MusicActiveChannel=nextIndex;
       phase4MusicKey=key;phase4MusicPendingKey="";
     }
   };
   phase4MusicFade=requestAnimationFrame(tick);
 }).catch(()=>{
   phase4MusicFailed.add(key);
   phase4MusicPendingKey="";
   next.pause();next.volume=0;
 });
}
function syncPhase4Music(force=false){
 if(!running||!phase4MusicEnabled)return;
 fadePhase4MusicTo(desiredPhase4Music(),force);
}
phase4MusicToggle?.addEventListener("click",()=>{
 phase4MusicEnabled=!phase4MusicEnabled;
 localStorage.setItem("jack-phase4-music-muted",phase4MusicEnabled?"0":"1");
 syncPhase4MusicToggle();
 if(!phase4MusicEnabled){
   cancelAnimationFrame(phase4MusicFade);
   phase4MusicChannels.forEach(a=>{a.pause();a.volume=0});
   phase4MusicKey="";phase4MusicPendingKey="";
 }else{
   phase4MusicFailed.clear();
   syncPhase4Music(true);
 }
});
syncPhase4MusicToggle();
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
let phase4SignImgs=Array(4).fill(null),signlessRoadPostImgs=Array(3).fill(null),eraserGameplaySprites=Array(10).fill(null),hollowGameplaySprites=Array(10).fill(null),ashHoundGameplaySprites=Array(10).fill(null),crowGameplaySprites=Array(10).fill(null),traceFootprintImgs=Array.from({length:3},()=>[null,null]),traceMemoryImgs=Array(3).fill(null),traceMemoryLoading=Array(3).fill(false),traceMemoryRetryAt=Array(3).fill(0),archiveEvidenceImgs=Array.from({length:3},()=>[null,null]),archivePropImgs=Array(6).fill(null),archiveFxImgs=Array(4).fill(null),bridgePlatformFxImgs=Array(5).fill(null),bridgeRegisterImgs=Array(4).fill(null),bridgeAtmosImgs=Array(6).fill(null),plazaNameplateImgs=Array(8).fill(null),plazaEchoImgs=Array.from({length:3},()=>[null,null]),plazaEchoFxImgs=Array(4).fill(null),plazaNameGateImgs=Array(4).fill(null),plazaAtmosImgs=Array(6).fill(null),checkpointOffImg=null,checkpointOnImg=null;
let bellNormalImg=null,bellGlowImg=null,memoryDoorImg=null;
let nonexistentDoorImg=null,nonexistentDoorRevealFxImg=null,doorRevealFx=0;
let idleTime=0,waitSitFrame=0,waitSitClock=0,waitSitActive=false,waitSitImages=[];
let lastPlayerAction=performance.now();
let playerLife=Math.max(1,Math.min(3,Number(saveData?.playerLife)||3)),memoryLight=0,memoryPulse=0,gateMsg=0;
let activeCheckpoint=saveData?.activeCheckpoint||localStorage.getItem(CHECKPOINT_KEY)||"";
// Halloween IV não usa mais checkpoint na Ponte dos Ninguém.
// Saves antigos que ainda apontam para "bridge" retornam com segurança ao Arquivo Rasurado.
if(activeCheckpoint==="bridge"){
 activeCheckpoint="archive";
 localStorage.setItem(CHECKPOINT_KEY,"archive");
 if(saveData)saveData.activeCheckpoint="archive";
}
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
let bossAnimClock=0,bossPendingArmorFinish=false,bossPendingPhysicalFinish=false;
const COLLECTOR_TRANSITION_DURATION=2.85;
let bossTransitionTimer=0;
let bossProjectiles=[],bossReleasedPlates=[];
if(!hadBossState&&arenaReached){arenaReached=false;bossStarted=false}
if(bossResolved){bossStarted=true;bossAct=3;bossArmor=0;bossHp=0}
else if(bossStarted&&bossAct===1&&bossArmor<=0){
 bossState="transition";bossTransitionTimer=COLLECTOR_TRANSITION_DURATION;
}

// Epílogo da Fase 4.
// 0 soltar nomes · 1 decisão · 2 sino · 3 promessa · 4 despedida · 5 concluído.
let epilogueStep=Math.max(0,Math.min(5,Number(saveData?.epilogueStep)||0));
let phase4Complete=!!saveData?.phase4Complete;
let bellObtained=!!saveData?.bellObtained;
let bellGiftPresented=!!saveData?.bellGiftPresented||bellObtained||epilogueStep>2;
let bellAcquireFx=0;
let epilogueRunning=false,epilogueFxClock=0;
const BELL_WORLD_X=10835,BELL_WORLD_Y=546;
if(phase4Complete){
 bossResolved=true;bossStarted=true;bossAct=3;bossArmor=0;bossHp=0;bossState="resolved";
 epilogueStep=5;bellObtained=true;bellGiftPresented=true;
}

let traces=Array.isArray(saveData?.traces)?saveData.traces.slice(0,3).map(Boolean):[false,false,false];
if(traces.every(Boolean))tracesSolved=true;
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

// Peregrina — companheira narrativa independente de Jack E do combate.
// Sua posição e animação avançam apenas por estados da história/enigmas.
// Movimento, dano, perseguição, hit e morte dos inimigos nunca alteram seu estado.
// Dano, queda, morte e respawn de Jack também não reiniciam nem reposicionam a Peregrina.
let pilgrimBridgeDone=!!saveData?.pilgrimBridgeDone||
 bridgeNameGlitchPlayed||bridgeCrossedPlayed||stolenPlazaPlayed||plazaSolved||
 collectorApproachPlayed||arenaEdgePlayed||bossStarted||bossResolved||phase4Complete;

function pilgrimNarrativeTarget(){
 if(!pilgrimMet)return 2580;

 // 1 · Campo das Pegadas — ela avança somente quando cada memória é reconstruída.
 if(!tracesSolved){
   const found=traces.filter(Boolean).length;
   return [3310,3690,4080][Math.min(found,2)];
 }

 // 2 · Entrada do Arquivo — o Campo já foi resolvido; ela não volta ao Povoado.
 if(!prototypeEndPlayed)return 4660;

 // 3 · Arquivo Rasurado — cada prova resolvida libera o próximo ponto de espera.
 if(!archiveSolved){
   const found=archiveEvidence.filter(Boolean).length;
   return [4845,5185,5470,5905][Math.min(found,3)];
 }

 // 4 · Ponte dos Ninguém — o Arquivo resolvido libera a aproximação.
 // A travessia propriamente dita só começa após o diálogo bridgeFearPlayed.
 if(!pilgrimBridgeDone)return 6250;

 // 5 · Praça dos Nomes Roubados — cada eco resolvido move a Peregrina adiante.
 if(!plazaSolved){
   if(!stolenPlazaPlayed)return 8010;
   const found=plazaEchoes.filter(Boolean).length;
   return [8040,8240,8510,8760][Math.min(found,3)];
 }

 // 6 · A Praça resolvida permite que ela siga até a Casa, sem depender de Jack voltar ou avançar.
 if(!collectorApproachPlayed)return 9140;

 // 7 · Após a conversa sobre o nome, ela atravessa a Casa até o ponto do último diálogo.
 if(!arenaEdgePlayed)return 10325;

 // 8 · "Eu volto": daqui em diante ela permanece fora da arena.
 if(!bossResolved)return 10535;

 // 9 · Epílogo — movimentos exclusivamente narrativos.
 if(epilogueStep<4)return 10765;
 if(epilogueStep===4)return 10805;
 return 11155;
}

let pilgrimX=Number.isFinite(saveData?.pilgrimX)?saveData.pilgrimX:pilgrimNarrativeTarget();
if(!pilgrimBridgeDone&&pilgrimX>6350)pilgrimX=6250;
let pilgrimFeetY=590,pilgrimDir=saveData?.pilgrimDir===-1?-1:1,pilgrimMode="wait",pilgrimMoveSpeed=0;
let pilgrimAnimClock=0,pilgrimAnimLastMode="wait";
let pilgrimTerrainJump={active:false,fromX:0,toX:0,fromY:590,toY:590,t:0,arc:72,dir:1};
const pilgrimBridge={active:false,segment:0,t:0,landingPause:0};
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
 {id:"archive",x:5570,groundY:590,respawnX:5500,respawnY:504,name:"Marco do Arquivo"},
 {id:"plaza",x:8150,groundY:590,respawnX:8080,respawnY:504,name:"Marco da Praça"},
 {id:"collector",x:9950,groundY:590,respawnX:9880,respawnY:504,name:"Marco sem Nome"}
]

function normalizePilgrimGroundOnly(){
 if(!pilgrimMet)return;
 if(supportPlatformAt(pilgrimX,590,28)){pilgrimFeetY=590;return}
 const runs=platforms
   .filter(q=>q.y===590&&q.h>=100&&!q.broken&&q.kind!=="bridge")
   .slice().sort((a,b)=>a.x-b.x);
 let bestX=pilgrimX,best=Infinity;
 for(const q of runs){
   const left=q.x+34,right=q.x+q.w-34;
   for(const x of [left,right]){
     const d=Math.abs(x-pilgrimX);
     if(d<best){best=d;bestX=x}
   }
 }
 if(best<220)pilgrimX=bestX;
 pilgrimFeetY=590;
}
function normalizePilgrimAfterLoad(){
 if(!pilgrimMet)return;
 if(bossStarted&&!bossResolved){
   pilgrimBridgeDone=true;pilgrimX=10535;pilgrimFeetY=590;pilgrimDir=1;return;
 }
 if(!pilgrimBridgeDone&&pilgrimX>6350&&pilgrimX<7900){
   pilgrimX=6250;pilgrimFeetY=590;pilgrimDir=1;return;
 }

 // Migração dos saves antigos do sistema "segue Jack":
 // se ela foi levada muito além do enigma realmente resolvido, volta apenas uma vez
 // para o marco narrativo correto. Depois disso não há regressão por movimento de Jack.
 const narrativeTarget=pilgrimNarrativeTarget();
 if(pilgrimX>narrativeTarget+220)pilgrimX=narrativeTarget;
 normalizePilgrimGroundOnly();
}
normalizePilgrimAfterLoad();

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
   width:76,height:46,patrolSpeed:68,chaseSpeed:205,attackSpeed:340,
   detectRange:525,loseRange:760,attackRange:86,lightRange:220,
   alertTime:.13,idleTime:.36,patrolTime:1.42,
   attackWindup:.18,attackActive:.24,attackRecover:.30,
   attackCooldown:.60,hitTime:.20,dissolveTime:.66,
   knockbackX:340,knockbackY:-285
 }),
 hollow:Object.freeze({
   label:"PEREGRINO OCO",defeatMessage:"As roupas caíram vazias. O pó dentro delas não tinha nome.",
   hitMessage:"A Luz atravessou o vazio sob as roupas.",
   revealMessage:"A lanterna revelou um vazio sob as vestes. Agora a Luz pode alcançá-lo.",
   width:68,height:96,patrolSpeed:30,chaseSpeed:72,attackSpeed:170,
   detectRange:345,loseRange:480,attackRange:82,lightRange:210,
   alertTime:.34,idleTime:.82,patrolTime:2.35,
   attackWindup:.42,attackActive:.32,attackRecover:.48,
   attackCooldown:.96,hitTime:.32,dissolveTime:.95,
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
   animClock:(x%317)/317,
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
 createEnemy("hound-1","ashHound",5715,439,{hp:3,dir:1,minX:5665,maxX:5790}),

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
   epilogueStep,phase4Complete,bellObtained,bellGiftPresented,
   pilgrimX,pilgrimDir,pilgrimBridgeDone,archiveEvidence:[...archiveEvidence],archiveSolved,deadEnemies:deadEnemies(),savedAt:Date.now()
 }));
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

const phase4SignFiles=[
 "../assets/game/phase4/props/signs/placa_gótica_de_madeira_e_outono.png",
 "../assets/game/phase4/props/signs/placa_sombria_de_outono_em_ruínas.png",
 "../assets/game/phase4/props/signs/placa_gótica_encantada_em_outono.png",
 "../assets/game/phase4/props/signs/marco_gótico_abandonado_com_folhagens_mortas.png"
];
const phase4SignReady=Promise.allSettled(phase4SignFiles.map(src=>img(src))).then(rs=>{
 phase4SignImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return phase4SignImgs;
});
const signlessRoadPostFiles=[
 "../assets/game/phase4/props/signless-road-posts/phase4-signless-road-post-01.png",
 "../assets/game/phase4/props/signless-road-posts/phase4-signless-road-post-02.png",
 "../assets/game/phase4/props/signless-road-posts/phase4-signless-road-post-03.png"
];
const signlessRoadPostReady=Promise.allSettled(signlessRoadPostFiles.map(src=>img(src))).then(rs=>{
 signlessRoadPostImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return signlessRoadPostImgs;
});
const eraserGameplayFiles=Array.from({length:10},(_,i)=>
 "../assets/game/phase4/enemies/eraser/gameplay/phase4-eraser-sprite-"+String(i+1).padStart(2,"0")+".png"
);
const eraserGameplayReady=Promise.allSettled(eraserGameplayFiles.map(src=>img(src))).then(rs=>{
 eraserGameplaySprites=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return eraserGameplaySprites;
});

const hollowGameplayFiles=[
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-01-idle-a.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-02-idle-b.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-03-patrol-a.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-04-patrol-b.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-05-alert.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-06-attack-windup.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-07-attack-strike.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-08-attack-recover.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-09-light-hit.png",
 "../assets/game/phase4/enemies/hollow-pilgrim/gameplay/phase4-hollow-pilgrim-10-dissolve.png"
];
const hollowGameplayReady=Promise.allSettled(hollowGameplayFiles.map(src=>img(src))).then(rs=>{
 hollowGameplaySprites=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return hollowGameplaySprites;
});

const ashHoundGameplayFiles=[
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-01-idle-a.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-02-idle-b.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-03-run-a.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-04-run-b.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-05-run-c.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-06-attack-windup.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-07-attack-lunge.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-08-attack-recover.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-09-light-hit.png",
 "../assets/game/phase4/enemies/ash-hound/gameplay/phase4-ash-hound-10-dissolve.png"
];
const ashHoundGameplayReady=Promise.allSettled(ashHoundGameplayFiles.map(src=>img(src))).then(rs=>{
 ashHoundGameplaySprites=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return ashHoundGameplaySprites;
});

const crowGameplayFiles=[
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-01-hover-a.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-02-hover-b.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-03-flight-a.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-04-flight-b.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-05-alert.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-06-dive-windup.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-07-dive.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-08-recover.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-09-light-hit.png",
 "../assets/game/phase4/enemies/forgetting-crow/gameplay/phase4-forgetting-crow-10-dissolve.png"
];
const crowGameplayReady=Promise.allSettled(crowGameplayFiles.map(src=>img(src))).then(rs=>{
 crowGameplaySprites=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return crowGameplaySprites;
});

const bridgePlatformFxFiles=[
 "../assets/game/phase4/puzzles/nobody-bridge/fx/platform-memory/bridge-forget-fx-01.png",
 "../assets/game/phase4/puzzles/nobody-bridge/fx/platform-memory/bridge-forget-fx-02.png",
 "../assets/game/phase4/puzzles/nobody-bridge/fx/platform-memory/bridge-forget-fx-03.png",
 "../assets/game/phase4/puzzles/nobody-bridge/fx/platform-memory/bridge-restore-light-fx.png",
 "../assets/game/phase4/puzzles/nobody-bridge/fx/platform-memory/bridge-stable-glow-fx.png"
];
const bridgePlatformFxReady=Promise.allSettled(bridgePlatformFxFiles.map(src=>img(src))).then(rs=>{
 bridgePlatformFxImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return bridgePlatformFxImgs;
});

const bridgeRegisterFiles=[
 "../assets/game/phase4/puzzles/nobody-bridge/register/bridge-register-dormant.png",
 "../assets/game/phase4/puzzles/nobody-bridge/register/bridge-register-awake.png",
 "../assets/game/phase4/puzzles/nobody-bridge/register/bridge-register-j-glitch.png",
 "../assets/game/phase4/puzzles/nobody-bridge/register/bridge-register-erased.png"
];
const bridgeRegisterReady=Promise.allSettled(bridgeRegisterFiles.map(src=>img(src))).then(rs=>{
 bridgeRegisterImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return bridgeRegisterImgs;
});

const bridgeAtmosFiles=[
 "../assets/game/phase4/puzzles/nobody-bridge/atmosphere/bridge-atmo-fog-bank.png",
 "../assets/game/phase4/puzzles/nobody-bridge/atmosphere/bridge-atmo-fog-column.png",
 "../assets/game/phase4/puzzles/nobody-bridge/atmosphere/bridge-atmo-broken-railing.png",
 "../assets/game/phase4/puzzles/nobody-bridge/atmosphere/bridge-atmo-hanging-chains.png",
 "../assets/game/phase4/puzzles/nobody-bridge/atmosphere/bridge-atmo-ruined-pillar.png",
 "../assets/game/phase4/puzzles/nobody-bridge/atmosphere/bridge-atmo-collapse-fragments.png"
];
const bridgeAtmosReady=Promise.allSettled(bridgeAtmosFiles.map(src=>img(src))).then(rs=>{
 bridgeAtmosImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return bridgeAtmosImgs;
});

const plazaNameplateFiles=[
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-01.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-02.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-03.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-04.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-05.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-06.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-07.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/nameplates/plaza-stolen-nameplate-08.png"
];
const plazaNameplateReady=Promise.allSettled(plazaNameplateFiles.map(src=>img(src))).then(rs=>{
 plazaNameplateImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return plazaNameplateImgs;
});

const plazaEchoFiles=[
 "../assets/game/phase4/puzzles/stolen-names-plaza/echoes/plaza-echo-01-dormant.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/echoes/plaza-echo-01-awake.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/echoes/plaza-echo-02-dormant.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/echoes/plaza-echo-02-awake.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/echoes/plaza-echo-03-dormant.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/echoes/plaza-echo-03-awake.png"
];
const plazaEchoReady=Promise.allSettled(plazaEchoFiles.map(src=>img(src))).then(rs=>{
 const a=rs.map(r=>r.status==="fulfilled"?r.value:null);
 plazaEchoImgs=[[a[0],a[1]],[a[2],a[3]],[a[4],a[5]]];
 return plazaEchoImgs;
});

const plazaEchoFxFiles=[
 "../assets/game/phase4/puzzles/stolen-names-plaza/fx/plaza-echo-fx-reveal.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/fx/plaza-echo-fx-memory-wisp.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/fx/plaza-echo-fx-broken-letters.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/fx/plaza-echo-fx-complete.png"
];
const plazaEchoFxReady=Promise.allSettled(plazaEchoFxFiles.map(src=>img(src))).then(rs=>{
 plazaEchoFxImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return plazaEchoFxImgs;
});

const plazaNameGateFiles=[
 "../assets/game/phase4/puzzles/stolen-names-plaza/name-gate/plaza-name-gate-closed.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/name-gate/plaza-name-gate-weakened-01.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/name-gate/plaza-name-gate-weakened-02.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/name-gate/plaza-name-gate-open.png"
];
const plazaNameGateReady=Promise.allSettled(plazaNameGateFiles.map(src=>img(src))).then(rs=>{
 plazaNameGateImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return plazaNameGateImgs;
});

const plazaAtmosFiles=[
 "../assets/game/phase4/puzzles/stolen-names-plaza/atmosphere/collector-glimpse-shadow.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/atmosphere/plaza-prop-confiscated-pile.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/atmosphere/plaza-prop-empty-name-frame.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/atmosphere/plaza-prop-hanging-tags.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/atmosphere/plaza-prop-name-hooks.png",
 "../assets/game/phase4/puzzles/stolen-names-plaza/atmosphere/plaza-prop-broken-register.png"
];
const plazaAtmosReady=Promise.allSettled(plazaAtmosFiles.map(src=>img(src))).then(rs=>{
 plazaAtmosImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return plazaAtmosImgs;
});

const traceFootprintFiles=[
 "../assets/game/phase4/puzzles/footprint-field/traces/trace-01-dormant.png",
 "../assets/game/phase4/puzzles/footprint-field/traces/trace-01-revealed.png",
 "../assets/game/phase4/puzzles/footprint-field/traces/trace-02-dormant.png",
 "../assets/game/phase4/puzzles/footprint-field/traces/trace-02-revealed.png",
 "../assets/game/phase4/puzzles/footprint-field/traces/trace-03-dormant.png",
 "../assets/game/phase4/puzzles/footprint-field/traces/trace-03-revealed.png"
];
const traceFootprintReady=Promise.allSettled(traceFootprintFiles.map(src=>img(src))).then(rs=>{
 const loaded=rs.map(r=>r.status==="fulfilled"?r.value:null);
 traceFootprintImgs=[
   [loaded[0],loaded[1]],
   [loaded[2],loaded[3]],
   [loaded[4],loaded[5]]
 ];
 return traceFootprintImgs;
});

const traceMemoryFiles=[
 "../assets/game/phase4/puzzles/footprint-field/memories/trace-memory-01.png",
 "../assets/game/phase4/puzzles/footprint-field/memories/trace-memory-02.png",
 "../assets/game/phase4/puzzles/footprint-field/memories/trace-memory-03.png"
];
const traceMemoryReady=Promise.allSettled(traceMemoryFiles.map(src=>img(src))).then(rs=>{
 traceMemoryImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return traceMemoryImgs;
});

function ensureTraceMemoryImage(i){
 if(traceMemoryImgs[i])return traceMemoryImgs[i];
 if(traceMemoryLoading[i])return null;
 const now=performance.now();
 if(now<traceMemoryRetryAt[i])return null;

 traceMemoryLoading[i]=true;
 const im=new Image();
 im.onload=()=>{
   traceMemoryImgs[i]=im;
   traceMemoryLoading[i]=false;
   traceMemoryRetryAt[i]=0;
 };
 im.onerror=()=>{
   traceMemoryLoading[i]=false;
   traceMemoryRetryAt[i]=performance.now()+3500;
 };
 im.src=traceMemoryFiles[i]+"?v=phase4-memory-3";
 return null;
}

const archiveEvidenceFiles=[
 "../assets/game/phase4/puzzles/erased-archive/evidence/archive-evidence-01-dormant.png",
 "../assets/game/phase4/puzzles/erased-archive/evidence/archive-evidence-01-revealed.png",
 "../assets/game/phase4/puzzles/erased-archive/evidence/archive-evidence-02-dormant.png",
 "../assets/game/phase4/puzzles/erased-archive/evidence/archive-evidence-02-revealed.png",
 "../assets/game/phase4/puzzles/erased-archive/evidence/archive-evidence-03-dormant.png",
 "../assets/game/phase4/puzzles/erased-archive/evidence/archive-evidence-03-revealed.png"
];
const archiveEvidenceReady=Promise.allSettled(archiveEvidenceFiles.map(src=>img(src))).then(rs=>{
 const loaded=rs.map(r=>r.status==="fulfilled"?r.value:null);
 archiveEvidenceImgs=[
   [loaded[0],loaded[1]],
   [loaded[2],loaded[3]],
   [loaded[4],loaded[5]]
 ];
 return archiveEvidenceImgs;
});

const archivePropFiles=[
 "../assets/game/phase4/puzzles/erased-archive/props/archive-prop-01-ruined-shelf.png",
 "../assets/game/phase4/puzzles/erased-archive/props/archive-prop-02-card-cabinet.png",
 "../assets/game/phase4/puzzles/erased-archive/props/archive-prop-03-document-lectern.png",
 "../assets/game/phase4/puzzles/erased-archive/props/archive-prop-04-stacked-files.png",
 "../assets/game/phase4/puzzles/erased-archive/props/archive-prop-05-empty-label-board.png",
 "../assets/game/phase4/puzzles/erased-archive/props/archive-prop-06-archive-mound.png"
];
const archivePropReady=Promise.allSettled(archivePropFiles.map(src=>img(src))).then(rs=>{
 archivePropImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return archivePropImgs;
});

const archiveFxFiles=[
 "../assets/game/phase4/puzzles/erased-archive/fx/archive-fx-evidence-reveal.png",
 "../assets/game/phase4/puzzles/erased-archive/fx/archive-fx-nameplates-reveal.png",
 "../assets/game/phase4/puzzles/erased-archive/fx/archive-fx-inventory-seal.png",
 "../assets/game/phase4/puzzles/erased-archive/fx/archive-fx-deduction-path.png"
];
const archiveFxReady=Promise.allSettled(archiveFxFiles.map(src=>img(src))).then(rs=>{
 archiveFxImgs=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return archiveFxImgs;
});

const checkpointArtReady=Promise.allSettled([
 img("../assets/game/phase4/checkpoints/marco_gótico_com_abóbora_e_bandeira_rasgada.png"),
 img("../assets/game/phase4/checkpoints/marco_gótico_com_lanterna_abóbora.png")
]).then(rs=>{
 checkpointOffImg=rs[0]?.status==="fulfilled"?rs[0].value:null;
 checkpointOnImg=rs[1]?.status==="fulfilled"?rs[1].value:null;
 return [checkpointOffImg,checkpointOnImg];
});
const bellArtReady=Promise.allSettled([
 img("../assets/game/phase4/items/sino_ornamental_de_bronze_antigo.png"),
 img("../assets/game/phase4/items/sino_encantado_de_outono_gótico.png")
]).then(rs=>{
 bellNormalImg=rs[0]?.status==="fulfilled"?rs[0].value:null;
 bellGlowImg=rs[1]?.status==="fulfilled"?rs[1].value:null;
 return [bellNormalImg,bellGlowImg];
});
const phase4BellSfx=new Audio("../assets/game/phase2/audio/sfx/soundreality-bell-fx-410608.mp3");
phase4BellSfx.preload="auto";
phase4BellSfx.volume=.95;
function playPhase4BellSfx(){
 try{
   phase4BellSfx.pause();
   phase4BellSfx.currentTime=0;
   const q=phase4BellSfx.play();
   if(q&&q.catch)q.catch(()=>{});
 }catch(_){}
}
const memoryDoorReady=img("../assets/game/phase4/fx/memory-door/portal_gótico_dourado_flutuante.png")
 .then(im=>memoryDoorImg=im).catch(()=>null);

const nonexistentDoorReady=Promise.allSettled([
 img("../assets/game/phase4/fx/nonexistent-door/phase4-nonexistent-door.png"),
 img("../assets/game/phase4/fx/nonexistent-door/phase4-nonexistent-door-reveal-fx.png")
]).then(rs=>{
 nonexistentDoorImg=rs[0]?.status==="fulfilled"?rs[0].value:null;
 nonexistentDoorRevealFxImg=rs[1]?.status==="fulfilled"?rs[1].value:null;
 return [nonexistentDoorImg,nonexistentDoorRevealFxImg];
});

const phase4PropReady=Promise.allSettled([
 phase4SignReady,signlessRoadPostReady,eraserGameplayReady,hollowGameplayReady,ashHoundGameplayReady,crowGameplayReady,bridgePlatformFxReady,bridgeRegisterReady,bridgeAtmosReady,plazaNameplateReady,plazaEchoReady,plazaEchoFxReady,plazaNameGateReady,plazaAtmosReady,traceFootprintReady,traceMemoryReady,archiveEvidenceReady,archivePropReady,archiveFxReady,checkpointArtReady,bellArtReady,memoryDoorReady,nonexistentDoorReady
]);

const jackPortraitFiles=["jack-00-neutral.png","jack-01-serious.png","jack-02-smirk.png","jack-03-surprised.png","jack-04-determined.png","jack-05-resolved.png"];
const jackPortraitReady=Promise.allSettled(jackPortraitFiles.map(f=>img("../assets/game/phase1/portraits-hd/"+f))).then(rs=>rs.map(r=>r.status==="fulfilled"?r.value:null));

const pilgrimGameplayFiles=Array.from({length:13},(_,i)=>"peregrina-sprite-"+String(i+1).padStart(2,"0")+".png");
let pilgrimGameplaySprites=Array(13).fill(null);
const pilgrimGameplayReady=Promise.allSettled(
 pilgrimGameplayFiles.map(f=>img("../assets/game/phase4/npc/peregrina/gameplay/"+f))
).then(rs=>{
 pilgrimGameplaySprites=rs.map(r=>r.status==="fulfilled"?r.value:null);
 return pilgrimGameplaySprites;
});

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

const collectorPortraitFiles=[
 "collector-dialogue-01-shadow.png",
 "collector-dialogue-02-keeper.png",
 "collector-dialogue-03-defensive.png",
 "collector-dialogue-04-panic.png",
 "collector-dialogue-05-desperate.png",
 "collector-dialogue-06-exhausted.png",
 "collector-dialogue-07-recognized.png",
 "collector-dialogue-08-release.png"
];
const collectorPortraitReady=Promise.allSettled(
 collectorPortraitFiles.map(f=>img("../assets/game/phase4/boss/collector/dialogue/"+f))
).then(rs=>rs.map(r=>r.status==="fulfilled"?r.value:null));

const collectorAct1Files=[
 "collector-act1-idle-01.png","collector-act1-idle-02.png",
 "collector-act1-windup-01.png","collector-act1-windup-02.png",
 "collector-act1-throw-01.png","collector-act1-throw-02.png","collector-act1-throw-03.png",
 "collector-act1-recover.png"
];
let collectorAct1Imgs=Array(8).fill(null);
const collectorAct1Ready=Promise.allSettled(
 collectorAct1Files.map(f=>img("../assets/game/phase4/boss/collector/act1/"+f))
).then(rs=>(collectorAct1Imgs=rs.map(r=>r.status==="fulfilled"?r.value:null)));

const collectorReactionFiles=[
 "collector-act1-light-hit-01.png","collector-act1-light-hit-02.png","collector-act1-light-hit-03.png",
 "collector-act1-protect-01.png","collector-act1-protect-02.png"
];
let collectorReactionImgs=Array(5).fill(null);
const collectorReactionReady=Promise.allSettled(
 collectorReactionFiles.map(f=>img("../assets/game/phase4/boss/collector/act1/reactions/"+f))
).then(rs=>(collectorReactionImgs=rs.map(r=>r.status==="fulfilled"?r.value:null)));

const collectorTransitionFiles=[
 "collector-transform-01-final-hit.png",
 "collector-transform-02-grasping.png",
 "collector-transform-03-collapse.png",
 "collector-transform-04-kneeling.png",
 "collector-transform-05-unveiled.png",
 "collector-transform-06-rising.png",
 "collector-transform-07-man-beneath.png"
];
let collectorTransitionImgs=Array(7).fill(null);
const collectorTransitionReady=Promise.allSettled(
 collectorTransitionFiles.map(f=>img("./phase4/boss/collector/transition-act1-act2/"+f))
).then(rs=>(collectorTransitionImgs=rs.map(r=>r.status==="fulfilled"?r.value:null)));

const collectorAct2Files=[
 "collector-act2-idle-01.png","collector-act2-idle-02.png",
 "collector-act2-run-01.png","collector-act2-run-02.png","collector-act2-run-03.png",
 "collector-act2-windup.png",
 "collector-act2-dash-01.png","collector-act2-dash-02.png",
 "collector-act2-recover.png",
 "collector-act2-light-hit-01.png","collector-act2-light-hit-02.png","collector-act2-light-hit-03.png"
];
let collectorAct2Imgs=Array(12).fill(null);
const collectorAct2Ready=Promise.allSettled(
 collectorAct2Files.map(f=>img("./phase4/boss/collector/act2/"+f))
).then(rs=>(collectorAct2Imgs=rs.map(r=>r.status==="fulfilled"?r.value:null)));

const collectorArmorFiles=Array.from({length:5},(_,i)=>"collector-armor-nameplate-"+String(i+1).padStart(2,"0")+".png");
let collectorArmorImgs=Array(5).fill(null);
const collectorArmorReady=Promise.allSettled(
 collectorArmorFiles.map(f=>img("../assets/game/phase4/boss/collector/armor/"+f))
).then(rs=>(collectorArmorImgs=rs.map(r=>r.status==="fulfilled"?r.value:null)));

const collectorMasterFiles=[
 "collector-master-act1-monument.png",
 "collector-master-act2-man-beneath-names.png",
 "collector-master-act3-recognized.png"
];
let collectorMasterImgs=Array(3).fill(null);
const collectorMasterReady=Promise.allSettled(
 collectorMasterFiles.map(f=>img("../assets/game/phase4/boss/collector/master/"+f))
).then(rs=>(collectorMasterImgs=rs.map(r=>r.status==="fulfilled"?r.value:null)));

const collectorArtReady=Promise.allSettled([
 collectorAct1Ready,collectorReactionReady,collectorTransitionReady,collectorAct2Ready,collectorArmorReady,collectorMasterReady
]);

const dialogueReady=Promise.all([jackPortraitReady,pilgrimPortraitReady,collectorPortraitReady]).then(([jackFrames,pilgrimFrames,collectorFrames])=>{
 dialogue.setAssets({
   jack:{frames:jackFrames},
   pilgrim:{frames:pilgrimFrames},
   collector:{frames:collectorFrames}
 });
});
const initialBackgroundIndex=phase4BackgroundIndex(p.x);
const backgroundReady=Promise.allSettled([
 ensurePhase4Background(initialBackgroundIndex),
 ensurePhase4Background(initialBackgroundIndex+1)
]);
const initialPlatformRule=platformArtRuleAt(p.x);
const platformReady=Promise.allSettled((PHASE4_PLATFORM_ART_FILES[initialPlatformRule.group]||[]).map((_,i)=>ensurePlatformArt(initialPlatformRule.group,i)));
window.__PHASE_ASSETS_READY=Promise.allSettled([jackReady,keyReady,dialogueReady,pilgrimGameplayReady,backgroundReady,platformReady,phase4PropReady,collectorArtReady]);

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
 // Povoado sem Nomes: a superfície pintada da arte 2B fica mais baixa
 // que a linha geométrica de colisão. Este offset alinha pés e sombras à pedra.
 "2b":17,
 "2c":12,
 "2d":9,
 "2e":7,
 // Praça dos Nomes Roubados: a arte 2F possui borda/perspectiva bem profunda.
 // 34 px coloca os pés sobre a pedra pintada; PNGs com margem transparente
 // recebem ainda uma correção automática pela base visível.
 "2f":34,
 "2g":11,
 "2h":12
});
const ENEMY_VISUAL_FOOT_EXTRA=Object.freeze({
 eraser:1,
 ashHound:0,
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

const PLAZA_CRACK_HOLE=Object.freeze({
 left:8310,
 right:8460,
 fromX:8272,
 toX:8498
});
function plazaCrackOpen(){
 return !!plazaSolved;
}
function plazaCrackContainsX(x){
 return plazaCrackOpen()&&x>PLAZA_CRACK_HOLE.left&&x<PLAZA_CRACK_HOLE.right;
}
function platformSupportsFoot(q,footX){
 if(!q)return false;
 // A arte 2F-04 abre um vão central depois dos três ecos.
 // Antes disso, a mesma plataforma continua inteira.
 if(plazaCrackOpen()&&q.kind==="plaza"&&q.h>=100&&q.x===7900){
   return !plazaCrackContainsX(footX);
 }
 return true;
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
function drawBridgePlatformImage(im,q,targetW,alpha=1,screen=false,yOffset=0){
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const w=targetW,h=ih*(w/iw);
 const cx=q.x+q.w/2,baseY=q.y+q.h/2+yOffset;
 ctx.save();
 ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
 if(screen)ctx.globalCompositeOperation="screen";
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,cx-w/2,baseY-h/2,w,h);
 ctx.restore();
 return true;
}
function drawBridgePlatformFx(q,platformAlpha){
 if(!q?.unstable)return false;

 // Luz de Jack: primeiro reconstrução intensa, depois memória dourada estável.
 if((q.lightTimer||0)>0){
   const restore=Math.max(0,Math.min(1,((q.lightTimer||0)-3.45)/.90));
   const stable=bridgePlatformFxImgs[4];
   if(stable)drawBridgePlatformImage(stable,q,q.w*1.43,.26+.16*Math.sin(p.anim*4.1+q.x*.01),true,-4);
   const restoreIm=bridgePlatformFxImgs[3];
   if(restoreIm&&restore>0){
     ctx.save();
     ctx.shadowColor="rgba(255,220,130,.92)";ctx.shadowBlur=22;
     drawBridgePlatformImage(restoreIm,q,q.w*1.62,restore*.72,true,-8);
     ctx.restore();
   }
   return true;
 }

 const ph=bridgePlatformPhase(q);
 if(ph<3.02)return false;
 let index=0,amount=0;
 if(ph<3.48){index=0;amount=(ph-3.02)/.46}
 else if(ph<3.86){index=1;amount=(ph-3.48)/.38}
 else{index=2;amount=Math.min(1,(ph-3.86)/.38+.46)}
 const im=bridgePlatformFxImgs[index];
 if(!im)return false;
 const alpha=Math.min(.78,.28+amount*.48+(1-platformAlpha)*.18);
 drawBridgePlatformImage(im,q,q.w*(1.50+index*.08),alpha,false,-7-index*3);
 return true;
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

   // Arte final da Ponte: o apagamento e a reconstrução substituem o antigo retângulo tracejado.
   if(!q.broken&&q.kind==="bridge"&&q.unstable)drawBridgePlatformFx(q,alpha);
 }
 ctx.restore();
}
function drawNobodyBridgeForegrounds(){
 // Mesmo princípio da ponte da Fase 1:
 // personagens são desenhados primeiro; depois a faixa frontal da arte 2E
 // volta por cima dos pés. A hitbox continua invisível e inalterada.
 if(cam+W<6070||cam>7900)return;

 ctx.save();
 ctx.translate(-cam,0);

 for(const q of platforms){
   if(q.kind!=="bridge"||q.artGroup!=="2e"||q.broken)continue;

   const alpha=bridgePlatformAlpha(q);
   if(alpha<=.03)continue;

   const sel=selectedPlatformArt(q);
   const key=platformArtKey(sel.group,sel.index);
   const im=phase4PlatformImages[key];
   if(!im){ensurePlatformArt(sel.group,sel.index);continue}

   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(!iw||!ih)continue;

   const meta=phase4PlatformMeta[key]||{surfaceRatio:.34};
   const widthScale=q.h>100?1.035:1.12;
   const dw=Math.max(40,q.w*widthScale);
   const dh=ih*(dw/iw);
   const dx=q.x+q.w/2-dw/2;
   const dy=q.y-meta.surfaceRatio*dh;

   // A borda começa alguns pixels acima do ponto onde os pés encostam.
   // Plataformas finas recebem uma faixa menor; a cabeceira recebe uma faixa mais profunda.
   const foot=platformVisualFootOffset(q);
   const clipTop=q.y+Math.max(-2,foot-8);
   const clipH=q.h>80?58:38;

   ctx.save();
   ctx.beginPath();
   ctx.rect(dx-5,clipTop,dw+10,clipH);
   ctx.clip();
   ctx.globalAlpha=alpha;
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality="high";

   if(q.unstable&&(q.lightTimer||0)>0){
     ctx.shadowColor="rgba(236,204,112,.72)";
     ctx.shadowBlur=16;
   }else if(bridgePlatformWarning(q)){
     ctx.shadowColor="rgba(204,199,180,.42)";
     ctx.shadowBlur=9;
   }

   ctx.drawImage(im,dx,dy,dw,dh);
   ctx.restore();

   // Linha de contato mínima ajuda o pé a "assentar" sem virar HUD.
   // Ela acompanha o desaparecimento da plataforma.
   const edgeAlpha=Math.min(.18,alpha*.16);
   if(edgeAlpha>.015){
     ctx.save();
     ctx.globalAlpha=edgeAlpha;
     ctx.strokeStyle=(q.lightTimer||0)>0?"rgba(245,213,132,.9)":"rgba(15,16,14,.9)";
     ctx.lineWidth=2;
     ctx.beginPath();
     ctx.moveTo(q.x+10,q.y+foot+1);
     ctx.lineTo(q.x+q.w-10,q.y+foot+1);
     ctx.stroke();
     ctx.restore();
   }
 }

 ctx.restore();
}

function drawPropByHeight(im,cx,bottomY,targetH,alpha=1,flip=false){
 if(!im)return null;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return null;
 const targetW=iw*(targetH/ih),dx=cx-targetW/2,dy=bottomY-targetH;
 ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(flip){ctx.translate(dx+targetW,0);ctx.scale(-1,1);ctx.drawImage(im,0,dy,targetW,targetH)}
 else ctx.drawImage(im,dx,dy,targetW,targetH);
 ctx.restore();
 return {x:dx,y:dy,w:targetW,h:targetH};
}
function drawSigns(){
 ctx.save();ctx.translate(-cam,0);

 // ESTRADA SEM PLACAS — suportes vazios substituem qualquer placa legível.
 // Cada peça reforça a ideia de que algo foi fisicamente removido da estrada.
 const signlessRoadLayout=[
   {x:1160,bottomY:590,h:214},
   {x:1400,bottomY:485,h:160},
   {x:1790,bottomY:430,h:150}
 ];
 for(let i=0;i<signlessRoadLayout.length;i++){
   const q=signlessRoadLayout[i],im=signlessRoadPostImgs[i];
   if(im){
     drawPropByHeight(im,q.x,q.bottomY,q.h,.94,false);
   }else{
     // Fallback visual: poste e suporte vazio, sem recriar uma placa completa.
     ctx.save();
     ctx.globalAlpha=.68;
     ctx.strokeStyle="#574937";
     ctx.lineWidth=7;
     ctx.beginPath();
     ctx.moveTo(q.x,q.bottomY);
     ctx.lineTo(q.x-2,q.bottomY-q.h*.72);
     ctx.stroke();
     ctx.strokeStyle="rgba(120,101,70,.65)";
     ctx.lineWidth=2;
     ctx.beginPath();
     ctx.moveTo(q.x-3,q.bottomY-q.h*.68);
     ctx.lineTo(q.x+46,q.bottomY-q.h*.68);
     ctx.stroke();
     ctx.fillStyle="rgba(206,188,145,.34)";
     ctx.beginPath();ctx.arc(q.x+18,q.bottomY-q.h*.68,3,0,Math.PI*2);ctx.fill();
     ctx.beginPath();ctx.arc(q.x+39,q.bottomY-q.h*.68,3,0,Math.PI*2);ctx.fill();
     ctx.restore();
   }
 }

 let idx=0;
 for(let z=1180;z<WORLD;z+=840){
   // A Estrada sem Placas (1050–2140) nunca recebe as placas decorativas globais.
   if(z>=1050&&z<2140){idx++;continue}

   // Não empilhar placa decorativa em cima de checkpoint ou da placa narrativa da ponte.
   if(checkpoints.some(cp=>Math.abs(cp.x-z)<145)||Math.abs(z-7830)<175){idx++;continue}
   const im=phase4SignImgs[idx%phase4SignImgs.length];
   const height=(idx%4===3)?174:(145+(idx%3)*7);
   if(im){
     drawPropByHeight(im,z,590,height,.92,idx%5===4);
   }else{
     ctx.strokeStyle="#5b4d37";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(z,590);ctx.lineTo(z-4,485);ctx.stroke();
     ctx.fillStyle="#312c24";ctx.fillRect(z-66,470,132,42);ctx.strokeStyle="#706044";ctx.lineWidth=2;ctx.strokeRect(z-66,470,132,42);
     ctx.fillStyle="rgba(190,173,136,.18)";ctx.fillRect(z-50,487,74,3);
   }
   idx++;
 }
 ctx.restore();
}
function drawDoor(){
 const xw=860,groundY=590;
 const hasMaraKey=localStorage.getItem(MARA_KEY)==="yes";
 const closedHint=hasMaraKey?(0.055+0.025*Math.sin(p.anim*2.15)):0;
 const openedAlpha=0.76+0.06*Math.sin(p.anim*1.65);
 const fxBurst=Math.max(0,Math.min(1,doorRevealFx/1.2));
 const fxIdle=doorOpened?(0.20+0.045*Math.sin(p.anim*2.4)):0;
 const fxAlpha=Math.max(fxIdle,fxBurst*.92);

 ctx.save();
 ctx.translate(-cam,0);

 // Antes da ativação, a porta existe apenas como uma lembrança quase imperceptível.
 // Depois, o próprio PNG continua translúcido — sem bloco amarelo ou preenchimento retangular.
 if(nonexistentDoorImg&&(doorOpened||hasMaraKey)){
   const alpha=doorOpened?openedAlpha:closedHint;
   if(alpha>0)drawPropByHeight(nonexistentDoorImg,xw,groundY,326,alpha);
 }else if(doorOpened){
   // Fallback discreto: preserva leitura caso o asset falhe, sem recriar o retângulo antigo.
   ctx.save();
   ctx.globalAlpha=.44;
   ctx.strokeStyle="rgba(231,204,137,.72)";
   ctx.lineWidth=2.5;
   ctx.shadowColor="rgba(230,192,100,.55)";
   ctx.shadowBlur=15;
   ctx.beginPath();
   ctx.moveTo(xw-49,568);
   ctx.lineTo(xw-49,414);
   ctx.quadraticCurveTo(xw,354,xw+49,414);
   ctx.lineTo(xw+49,568);
   ctx.stroke();
   ctx.restore();
 }

 // O segundo PNG é só magia: surge forte na revelação e permanece respirando suavemente.
 if(nonexistentDoorRevealFxImg&&fxAlpha>0){
   ctx.save();
   if(doorRevealFx>0){
     ctx.shadowColor="rgba(245,207,119,.60)";
     ctx.shadowBlur=22+fxBurst*18;
   }
   drawPropByHeight(nonexistentDoorRevealFxImg,xw,groundY+4,404,fxAlpha);
   ctx.restore();
 }

 // Enquanto ainda não abriu, a chave de Mara continua denunciando que há algo na parede.
 if(!doorOpened&&hasMaraKey&&keyImg){
   const iw=keyImg.naturalWidth||keyImg.width,ih=keyImg.naturalHeight||keyImg.height;
   const dh=72,dw=iw*(dh/ih);
   ctx.save();
   ctx.globalAlpha=.70+.20*Math.sin(p.anim*2.8);
   ctx.shadowColor="rgba(237,201,112,.48)";
   ctx.shadowBlur=12;
   ctx.drawImage(keyImg,xw-dw/2,402,dw,dh);
   ctx.restore();
 }
 ctx.restore();
}
function drawCheckpoint(cp){
 const lit=activeCheckpoint===cp.id;
 const im=lit?checkpointOnImg:checkpointOffImg;
 const sx=cp.x-cam,sy=cp.groundY;

 // O PNG deve tocar o chão VISUAL das plataformas novas, não apenas a hitbox antiga.
 // Isso não altera colisão, respawn nem lógica do checkpoint.
 const support=supportPlatformAt(cp.x,cp.groundY,90);
 const groundFix=(support?platformVisualFootOffset(support):0)+14;
 const targetH=242;
 const plazaPad=cp.id==="plaza"?visibleBottomPadPx(im,targetH,32):0;
 const bottomY=sy+groundFix+plazaPad;

 if(im){
   ctx.save();
   if(lit){
     const glowY=bottomY-targetH*.48;
     const glow=ctx.createRadialGradient(sx,glowY,10,sx,glowY,128);
     glow.addColorStop(0,"rgba(246,177,63,.34)");
     glow.addColorStop(.48,"rgba(231,140,38,.15)");
     glow.addColorStop(1,"rgba(231,140,38,0)");
     ctx.fillStyle=glow;ctx.beginPath();ctx.arc(sx,glowY,128,0,Math.PI*2);ctx.fill();
     ctx.shadowColor="rgba(247,173,54,.66)";ctx.shadowBlur=27;
   }

   drawPropByHeight(im,sx,bottomY,targetH,lit?1:.94);

   if(lit){
     ctx.fillStyle="rgba(245,212,137,.9)";ctx.font="700 9px Georgia";ctx.textAlign="center";
     ctx.shadowColor="rgba(0,0,0,.92)";ctx.shadowBlur=5;
     ctx.fillText("VOCÊ PASSOU POR AQUI",sx,bottomY-targetH-9);
   }
   ctx.restore();
   return;
 }

 // Fallback procedural: mantém a mesma escala/apoio do checkpoint final.
 ctx.save();ctx.translate(sx,bottomY);
 ctx.strokeStyle="#625540";ctx.lineWidth=8;
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-2,-100);ctx.stroke();

 ctx.fillStyle=lit?"#d7bd79":"#554d3b";
 ctx.strokeStyle=lit?"#d8bd74":"#746342";
 ctx.lineWidth=2;
 ctx.fillRect(-67,-145,134,49);ctx.strokeRect(-67,-145,134,49);

 // Regra oficial: abóbora apagada no checkpoint inativo e acesa no ativo.
 ctx.beginPath();ctx.arc(0,-166,19,0,Math.PI*2);
 ctx.fillStyle=lit?"#f0a432":"#6b4b2c";
 if(lit){ctx.shadowColor="#f2a332";ctx.shadowBlur=18}
 ctx.fill();
 ctx.fillStyle=lit?"#ffd77a":"#171713";
 ctx.fillRect(-9,-170,5,4);ctx.fillRect(5,-170,5,4);

 if(lit){
   ctx.fillStyle="#f1d384";ctx.font="700 9px Georgia";ctx.textAlign="center";
   ctx.fillText("VOCÊ PASSOU POR AQUI",0,-201);
 }
 ctx.restore();
}
function pilgrimSpriteSelection(){
 const moving=pilgrimMode==="walk"||pilgrimMode==="run";
 if(pilgrimMode==="jump"){
   const seq=[5,6,7,8];
   const t=pilgrimJumpProgress();
   const phase=t<.2?0:(t<.48?1:(t<.76?2:3));
   return {index:seq[phase],baseLeft:true,scale:1.04};
 }
 if(moving){
   const seq=[5,6,7,8];
   const fps=pilgrimMode==="run"?11:7;
   const idx=seq[Math.floor(pilgrimAnimClock*fps)%seq.length];
   return {index:idx,baseLeft:true,scale:pilgrimMode==="run"?1.04:1.0};
 }
 if(bossResolved&&epilogueStep===2)return {index:10,baseLeft:false,scale:1.0};
 if(bossResolved&&epilogueStep===3)return {index:10,baseLeft:false,scale:1.02};
 if(bossResolved&&epilogueStep===4)return {index:12,baseLeft:false,scale:1.0};
 if(stolenPlazaPlayed&&!plazaSolved)return {index:0,baseLeft:false,scale:1.0};
 return {index:0,baseLeft:false,scale:1.0};
}
function drawPilgrimSprite(im,px,feet,footFix,selection){
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const targetH=158*(selection.scale||1);
 const targetW=iw*(targetH/ih);
 const sx=px-cam;
 const groundY=feet+footFix;
 const plazaPad=(px>=7900&&px<8940)?visibleBottomPadPx(im,targetH,20):0;
 const dx=sx-targetW/2,dy=groundY-targetH+plazaPad;
 const facesLeft=!!selection.baseLeft;
 const shouldFlip=facesLeft?(pilgrimDir>0):(pilgrimDir<0);

 if(pilgrimMode!=="jump")drawGroundShadow(sx,groundY+1,21,4,.24);
 ctx.save();
 ctx.globalAlpha=.98;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(shouldFlip){
   ctx.translate(dx+targetW,0);ctx.scale(-1,1);ctx.drawImage(im,0,dy,targetW,targetH);
 }else{
   ctx.drawImage(im,dx,dy,targetW,targetH);
 }
 ctx.restore();

 ctx.save();
 ctx.fillStyle="#d2bd84";ctx.font="700 9px Georgia";ctx.textAlign="center";
 ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=4;
 ctx.fillText(pilgrimMet?"PEREGRINA":"???",sx,dy-7);
 ctx.restore();
 return true;
}

function drawPilgrim(){
 if(!doorOpened)return;
 const px=pilgrimMet?pilgrimX:2580;
 const feet=pilgrimMet?pilgrimFeetY:590;
 const jump=pilgrimMode==="jump";
 // A Peregrina usa a geometria da plataforma mesmo quando a névoa a torna
 // temporariamente não-sólida para Jack. Isso mantém os pés no mesmo baseline.
 const footFix=jump?pilgrimJumpFootFix():pilgrimPlatformFootFixAt(px,feet);

 const selection=pilgrimSpriteSelection();
 const im=pilgrimGameplaySprites[selection.index];
 if(im&&drawPilgrimSprite(im,px,feet,footFix,selection))return;

 // Fallback procedural para a fase nunca quebrar caso algum PNG falhe.
 const sx=px-cam;
 const moving=pilgrimMode==="walk"||pilgrimMode==="run";
 const phase=pilgrimAnimClock*(pilgrimMode==="run"?10:6);
 const stride=moving?Math.sin(phase)*14:0;
 const bob=moving?Math.abs(Math.sin(phase))*3:Math.sin(pilgrimAnimClock*1.8)*1.3;
 const lean=jump?pilgrimDir*7:(pilgrimMode==="run"?pilgrimDir*4:0);

 ctx.save();ctx.translate(sx+lean,footFix);ctx.globalAlpha=.94;
 if(!jump)drawGroundShadow(0,feet+1,22,4,.24);

 ctx.strokeStyle="#766a54";ctx.lineWidth=6;ctx.lineCap="round";
 if(jump){
   ctx.beginPath();ctx.moveTo(-10,feet-56);ctx.lineTo(-25,feet-28);ctx.lineTo(-8,feet-18);ctx.stroke();
   ctx.beginPath();ctx.moveTo(10,feet-56);ctx.lineTo(24,feet-35);ctx.lineTo(12,feet-20);ctx.stroke();
 }else{
   ctx.beginPath();ctx.moveTo(-10,feet-70+bob);ctx.lineTo(-12+stride,feet-28);ctx.lineTo(-18+stride*.55,feet-2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(10,feet-70+bob);ctx.lineTo(12-stride,feet-28);ctx.lineTo(18-stride*.55,feet-2);ctx.stroke();
 }

 const bodyY=feet-106+bob;
 ctx.fillStyle="#414743";
 ctx.beginPath();ctx.moveTo(0,bodyY-28);ctx.quadraticCurveTo(-34,bodyY+4,-31,bodyY+64);ctx.lineTo(-18,feet-62);ctx.lineTo(18,feet-62);ctx.lineTo(31,bodyY+64);ctx.quadraticCurveTo(34,bodyY+4,0,bodyY-28);ctx.fill();
 ctx.strokeStyle="#625c4d";ctx.lineWidth=2;ctx.stroke();

 ctx.fillStyle="#171a19";ctx.beginPath();ctx.arc(0,bodyY-43,25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="rgba(206,194,164,.5)";ctx.beginPath();ctx.ellipse(0,bodyY-38,11,14,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#aa9976";ctx.font="italic 12px Georgia";ctx.textAlign="center";
 ctx.fillText(pilgrimMet?"PEREGRINA":"???",0,bodyY-82);
 ctx.restore();
}

const PILGRIM_ARCHIVE_BRIDGE_JUMP=Object.freeze({
 fromX:5906,toX:6104,fromY:590,toY:590,dir:1,gap:130,arc:58
});
function pilgrimArchiveBridgeJumpFor(x,target){
 if(!archiveSolved||pilgrimBridgeDone)return null;
 const j=PILGRIM_ARCHIVE_BRIDGE_JUMP;
 if(x>=j.fromX-22&&x<=5948&&target>=j.toX+40)return {...j};
 return null;
}


const PILGRIM_PLAZA_CRACK_JUMP=Object.freeze({
 fromX:PLAZA_CRACK_HOLE.fromX,
 toX:PLAZA_CRACK_HOLE.toX,
 fromY:590,toY:590,dir:1,gap:PLAZA_CRACK_HOLE.right-PLAZA_CRACK_HOLE.left,arc:76
});
function pilgrimPlazaCrackJumpFor(x,target){
 if(!plazaCrackOpen())return null;
 const j=PILGRIM_PLAZA_CRACK_JUMP;
 if(x>=j.fromX-26&&x<=PLAZA_CRACK_HOLE.left+12&&target>j.toX-8)return {...j};
 return null;
}
const PILGRIM_COLLECTOR_JUMPS=Object.freeze([
 Object.freeze({fromX:9464,toX:9656,fromY:590,toY:590,dir:1,gap:120,arc:82}),
 Object.freeze({fromX:9994,toX:10186,fromY:590,toY:590,dir:1,gap:120,arc:82})
]);
function pilgrimInCollectorSequence(){
 return !bossResolved&&(plazaSolved||collectorApproachPlayed||arenaEdgePlayed||bossStarted||pilgrimX>=8940);
}
function pilgrimCollectorGapJumpFor(x,target){
 if(!pilgrimInCollectorSequence())return null;
 const dir=Math.sign(target-x);
 if(!dir)return null;
 for(const j of PILGRIM_COLLECTOR_JUMPS){
   if(dir>0&&x>=j.fromX-24&&x<=j.fromX+18&&target>j.toX-10)return {...j};
   if(dir<0&&x<=j.toX+24&&x>=j.toX-18&&target<j.fromX+10){
     return {
       fromX:j.toX,toX:j.fromX,fromY:j.toY,toY:j.fromY,
       dir:-1,gap:j.gap,arc:j.arc
     };
   }
 }
 return null;
}
function pilgrimGroundRuns(){
 return platforms
   .filter(q=>q.y===590&&q.h>=100&&!q.broken&&q.kind!=="bridge")
   .slice().sort((a,b)=>a.x-b.x);
}
function pilgrimGapJumpFor(x,target){
 const dir=Math.sign(target-x);
 if(!dir)return null;
 const runs=pilgrimGroundRuns();
 for(let i=0;i<runs.length-1;i++){
   const a=runs[i],b=runs[i+1];
   const gapStart=a.x+a.w,gapEnd=b.x,gap=gapEnd-gapStart;
   if(gap<55||gap>175)continue;

   // Ponte dos Ninguém tem coreografia própria e nunca usa este salto genérico.
   if(gapStart>=5940&&gapEnd<=7900)continue;

   const pad=34;
   if(dir>0){
     const fromX=gapStart-pad,toX=gapEnd+pad;
     if(x>=fromX-22&&x<=gapStart+8&&target>toX-8)
       return {fromX,toX,fromY:590,toY:590,dir:1,gap};
   }else{
     const fromX=gapEnd+pad,toX=gapStart-pad;
     if(x<=fromX+22&&x>=gapEnd-8&&target<toX+8)
       return {fromX,toX,fromY:590,toY:590,dir:-1,gap};
   }
 }
 return null;
}
function pilgrimPlatformFootFixAt(x,y){
 let q=null,best=Infinity;
 for(const candidate of platforms){
   if(candidate.broken)continue;
   if(x<candidate.x-8||x>candidate.x+candidate.w+8)continue;
   const d=Math.abs(y-candidate.y);
   if(d<=52&&d<best){q=candidate;best=d}
 }
 return platformVisualFootOffset(q)+2+(q?.artGroup==="2c"?2:0);
}
function pilgrimJumpProgress(){
 if(pilgrimTerrainJump.active)return pilgrimTerrainJump.t;
 if(pilgrimBridge.active)return pilgrimBridge.t;
 return 0;
}
function pilgrimJumpFootFix(){
 if(pilgrimTerrainJump.active){
   const j=pilgrimTerrainJump,t=Math.max(0,Math.min(1,j.t));
   const a=pilgrimPlatformFootFixAt(j.fromX,j.fromY);
   const b=pilgrimPlatformFootFixAt(j.toX,j.toY);
   return a+(b-a)*t;
 }
 if(pilgrimBridge.active){
   const a=pilgrimBridgeWaypoints[pilgrimBridge.segment];
   const b=pilgrimBridgeWaypoints[pilgrimBridge.segment+1];
   if(a&&b){
     const t=Math.max(0,Math.min(1,pilgrimBridge.t));
     const fa=pilgrimPlatformFootFixAt(a.x,a.y);
     const fb=pilgrimPlatformFootFixAt(b.x,b.y);
     return fa+(fb-fa)*t;
   }
 }
 return 0;
}
function startPilgrimTerrainJump(j){
 if(!j||pilgrimTerrainJump.active)return false;
 const actualFromX=pilgrimX,actualFromY=pilgrimFeetY;
 pilgrimTerrainJump={
   active:true,fromX:actualFromX,toX:j.toX,fromY:actualFromY,toY:j.toY,
   t:0,arc:Number.isFinite(j.arc)?j.arc:68+Math.min(22,j.gap*.12),dir:j.dir
 };
 pilgrimX=actualFromX;pilgrimFeetY=actualFromY;pilgrimDir=j.dir;
 pilgrimMode="jump";pilgrimMoveSpeed=0;
 pilgrimAnimClock=0;pilgrimAnimLastMode="jump";
 return true;
}
function updatePilgrimTerrainJump(dt){
 const j=pilgrimTerrainJump;
 if(!j.active)return false;
 const dist=Math.abs(j.toX-j.fromX);
 const duration=Math.max(.42,Math.min(.68,dist/390));
 j.t=Math.min(1,j.t+dt/duration);
 const t=j.t,e=t*t*(3-2*t);
 pilgrimX=j.fromX+(j.toX-j.fromX)*e;
 const baseY=j.fromY+(j.toY-j.fromY)*e;
 pilgrimFeetY=baseY-Math.sin(Math.PI*t)*j.arc;
 pilgrimDir=j.dir;pilgrimMode="jump";
 if(t>=1){
   pilgrimX=j.toX;pilgrimFeetY=j.toY;
   pilgrimTerrainJump.active=false;
   pilgrimMode="walk";pilgrimMoveSpeed=0;
   pilgrimAnimClock=0;pilgrimAnimLastMode="walk";
 }
 return true;
}

function startPilgrimBridge(){
 if(pilgrimBridge.active||pilgrimBridgeDone)return;
 pilgrimBridge.active=true;pilgrimBridge.segment=0;pilgrimBridge.t=0;pilgrimBridge.landingPause=0;
 pilgrimX=pilgrimBridgeWaypoints[0].x;pilgrimFeetY=pilgrimBridgeWaypoints[0].y;
 pilgrimMode="jump";pilgrimDir=1;pilgrimMoveSpeed=0;
 pilgrimAnimClock=0;pilgrimAnimLastMode="jump";
}
function updatePilgrimBridge(dt){
 if(!pilgrimBridge.active)return;
 if(pilgrimBridge.landingPause>0){
   pilgrimBridge.landingPause=Math.max(0,pilgrimBridge.landingPause-dt);
   const landed=pilgrimBridgeWaypoints[pilgrimBridge.segment];
   if(landed){
     pilgrimX=landed.x;pilgrimFeetY=landed.y;pilgrimMode="wait";pilgrimMoveSpeed=0;
   }
   return;
 }
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
     pilgrimBridge.active=false;pilgrimBridgeDone=true;pilgrimBridge.landingPause=0;
     pilgrimX=8010;pilgrimFeetY=590;pilgrimMode="wait";pilgrimMoveSpeed=0;
     banner("A PEREGRINA ATRAVESSOU");save();
   }else{
     // Um pouso curto torna cada salto legível e impede a sensação de "sobrevoar" a ponte.
     pilgrimBridge.landingPause=.13;
     pilgrimMode="wait";pilgrimMoveSpeed=0;
   }
 }
}
function updatePilgrim(dt){
 if(!pilgrimMet)return;
 if(pilgrimMode!==pilgrimAnimLastMode){
   pilgrimAnimLastMode=pilgrimMode;
   pilgrimAnimClock=0;
 }else{
   pilgrimAnimClock+=dt;
 }
 if(pilgrimBridge.active){updatePilgrimBridge(dt);return}
 if(pilgrimTerrainJump.active){updatePilgrimTerrainJump(dt);return}
 if(!pilgrimBridgeDone&&bridgeFearPlayed&&Math.abs(pilgrimX-6250)<12){
   startPilgrimBridge();return;
 }

 const target=pilgrimNarrativeTarget();
 const collectorSequence=pilgrimInCollectorSequence();

 const delta=target-pilgrimX;
 // A progressão da Peregrina é monotônica: Jack pode voltar quantas vezes quiser.
 // Um alvo narrativo nunca ordena que ela caminhe para trás.
 if(delta<=12){
   if(delta>0)pilgrimX=target;
   pilgrimFeetY=590;pilgrimMode="wait";pilgrimMoveSpeed=0;
   return;
 }
 const ad=delta;

 // Arquivo -> Ponte: há um vão físico entre x=5940 e x=6070.
 // A Peregrina dá um salto curto próprio e pousa antes da coreografia da Ponte dos Ninguém.
 const archiveBridgeJump=pilgrimArchiveBridgeJumpFor(pilgrimX,target);
 if(archiveBridgeJump&&startPilgrimTerrainJump(archiveBridgeJump))return;

 // Depois dos três ecos, o chão central da Praça realmente se abre.
 // Se a Peregrina ainda estiver à esquerda por save/tempo de diálogo, ela salta o mesmo buraco de Jack.
 const plazaCrackJump=pilgrimPlazaCrackJumpFor(pilgrimX,target);
 if(plazaCrackJump&&startPilgrimTerrainJump(plazaCrackJump))return;

 // A Casa do Coletor possui somente dois saltos narrativos.
 // O terceiro vão é a entrada da arena: a Peregrina NÃO o atravessa.
 const collectorJump=collectorSequence?pilgrimCollectorGapJumpFor(pilgrimX,target):null;
 if(collectorJump&&startPilgrimTerrainJump(collectorJump))return;

 // Fora da Casa do Coletor, preservamos exatamente o sistema já aprovado.
 if(!collectorSequence){
   const terrainJump=pilgrimGapJumpFor(pilgrimX,target);
   if(terrainJump&&startPilgrimTerrainJump(terrainJump))return;
 }

 pilgrimDir=1;
 if(collectorSequence){
   // Passo mais deliberado nesta área; a velocidade depende apenas da distância até o marco narrativo.
   pilgrimMoveSpeed=ad>430?220:145;
   pilgrimMode=pilgrimMoveSpeed>210?"run":"walk";
 }else{
   pilgrimMoveSpeed=ad>290?255:165;
   pilgrimMode=pilgrimMoveSpeed>210?"run":"walk";
 }
 pilgrimX+=pilgrimDir*Math.min(ad,pilgrimMoveSpeed*dt);
 pilgrimFeetY=590;
}
function traceHostPlatform(t){
 const elevated=platforms.filter(q=>q.kind==="traces"&&q.h<100&&!q.broken);
 let host=elevated.find(q=>t.x>=q.x-4&&t.x<=q.x+q.w+4);
 if(!host){
   let best=null,bestDist=Infinity;
   for(const q of elevated){
     const edge=Math.max(q.x,Math.min(q.x+q.w,t.x));
     const d=Math.abs(t.x-edge);
     if(d<bestDist){best=q;bestDist=d}
   }
   if(bestDist<=120)host=best;
 }
 if(host)return host;
 return platforms.find(q=>q.kind==="traces"&&q.h>=100&&t.x>=q.x&&t.x<=q.x+q.w)||null;
}
function traceSurfaceY(t){
 const q=traceHostPlatform(t);
 return q?(q.y+platformVisualFootOffset(q)):590;
}
function traceSceneX(t){
 const q=traceHostPlatform(t);
 if(!q)return t.x;
 // As memórias ocupam largura. Como os três enigmas ficam perto da borda direita,
 // puxamos a cena alguns pixels para dentro da plataforma sem mudar o ponto de interação.
 const margin=Math.min(74,Math.max(48,q.w*.32));
 return Math.max(q.x+margin,Math.min(q.x+q.w-margin,t.x-28));
}
function traceFootPositions(t){
 const q=traceHostPlatform(t);
 const count=6;
 if(!q)return Array.from({length:count},(_,k)=>({x:t.x-125+k*23,y:586-(k%2)*2}));
 const right=Math.min(t.x-8,q.x+q.w-12);
 const left=Math.max(q.x+12,right-(count-1)*23);
 const step=(right-left)/(count-1);
 const y=q.y+platformVisualFootOffset(q)-5;
 return Array.from({length:count},(_,k)=>({x:left+k*step,y:y-(k%2)*2}));
}
function drawTraceFoot(x,y,angle,alpha=1,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
 ctx.fillStyle="#e6cc83";
 ctx.shadowColor="rgba(231,200,119,.28)";ctx.shadowBlur=5;
 // Pegada achatada: parece impressa no piso, não um ícone flutuando.
 ctx.beginPath();ctx.ellipse(0,0,6.5,10,.08,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(6,-6,2.8,3.7,.35,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawTraceAsset(i,t,on,pulse){
 const q=traceHostPlatform(t);
 const im=traceFootprintImgs[i]?.[on?1:0];
 if(!q||!im)return false;

 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;

 // O PNG é horizontal, mas em um platformer lateral ele precisa parecer "impresso"
 // no topo da plataforma. Mantemos a largura e comprimimos a altura em perspectiva.
 const pad=10;
 const targetW=Math.max(90,q.w-pad*2);
 const targetH=Math.max(27,Math.min(42,targetW*.19));
 const centerX=q.x+q.w/2;
 const surfaceY=q.y+platformVisualFootOffset(q);
 const dx=centerX-targetW/2;
 const dy=surfaceY-targetH*.78;
 const near=Math.abs((p.x+p.w/2)-t.x)<205;
 const revealBurst=Math.min(1,traceRevealFx[i]/1.15);
 const alpha=on
   ? Math.min(.96,.78+pulse*.10+revealBurst*.08)
   : (near ? .31+pulse*.05 : .18+pulse*.025);

 ctx.save();

 // Nunca deixa a arte escapar da plataforma que contém o enigma.
 ctx.beginPath();
 ctx.rect(q.x+5,surfaceY-52,q.w-10,58);
 ctx.clip();

 ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality="high";

 if(on){
   ctx.shadowColor="rgba(239,205,111,.72)";
   ctx.shadowBlur=10+revealBurst*13;
 }else{
   ctx.shadowColor="rgba(188,157,91,.18)";
   ctx.shadowBlur=4;
 }

 ctx.drawImage(im,dx,dy,targetW,targetH);

 // Pulso de revelação: a mesma arte reaparece em screen por um instante,
 // como se a Luz estivesse reconstruindo a memória no chão.
 if(on&&revealBurst>0){
   ctx.globalCompositeOperation="screen";
   ctx.globalAlpha=revealBurst*.32;
   ctx.shadowColor="rgba(255,226,150,.95)";
   ctx.shadowBlur=20;
   ctx.drawImage(im,dx,dy,targetW,targetH);
 }
 ctx.restore();
 return true;
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
function drawTraceMemoryAsset(i,t,alpha,burst){
 const im=traceMemoryImgs[i]||ensureTraceMemoryImage(i);
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;

 const q=traceHostPlatform(t);
 const baseX=traceSceneX(t),surfaceY=traceSurfaceY(t);
 // Memória é visão, não decal: pode ser um pouco mais larga que a plataforma,
 // mas continua centrada no rastro para não revelar uma "cena completa".
 const targetW=Math.max(360,Math.min(430,(q?.w||190)+205));
 const targetH=targetW*(ih/iw);
 const floatY=surfaceY-targetH-8;
 const breatheY=Math.sin(p.anim*1.35+i*.9)*2.2;
 // Os PNGs já são etéreos por natureza; no tamanho antigo a soma das transparências
 // deixava a memória quase invisível. Mantemos o mistério, mas com leitura clara.
 const memoryAlpha=Math.min(.98,.82+burst*.10+Math.sin(p.anim*1.6+i)*.035);

 ctx.save();
 ctx.globalAlpha=memoryAlpha;
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality="high";
 // Uma névoa dourada muito suave atrás da visão garante contraste contra fundos escuros
 // sem criar uma moldura ou denunciar identidade.
 const glow=ctx.createRadialGradient(baseX,floatY+targetH*.58,18,baseX,floatY+targetH*.58,targetW*.34);
 glow.addColorStop(0,"rgba(233,198,112,.16)");
 glow.addColorStop(1,"rgba(233,198,112,0)");
 ctx.fillStyle=glow;
 ctx.beginPath();ctx.ellipse(baseX,floatY+targetH*.60,targetW*.34,targetH*.62,0,0,Math.PI*2);ctx.fill();

 ctx.shadowColor="rgba(236,202,116,.64)";
 ctx.shadowBlur=18+burst*16;
 ctx.drawImage(im,baseX-targetW/2,floatY+breatheY,targetW,targetH);

 // No instante da revelação, a lembrança "fecha" por um breve clarão,
 // mas depois volta ao aspecto frágil e incompleto.
 if(burst>0){
   ctx.globalCompositeOperation="screen";
   ctx.globalAlpha=burst*.28;
   ctx.shadowColor="rgba(255,229,162,.92)";
   ctx.shadowBlur=22;
   ctx.drawImage(im,baseX-targetW/2,floatY+breatheY,targetW,targetH);
 }
 ctx.restore();
 return {topY:floatY+breatheY,height:targetH};
}
function drawTraceMemoryScene(i,t){
 const on=traces[i];if(!on)return;
 const burst=Math.min(1,traceRevealFx[i]/1.15);
 const breathe=.76+.16*Math.sin(p.anim*1.7+i);
 const alpha=Math.min(.92,.46+breathe*.25+burst*.25);
 const baseX=traceSceneX(t),surfaceY=traceSurfaceY(t),baseY=surfaceY-4;

 ctx.save();
 // Halo discreto: a memória nasce do chão, mas a identidade permanece oculta.
 const g=ctx.createRadialGradient(baseX,baseY-72,8,baseX,baseY-72,130);
 g.addColorStop(0,"rgba(234,204,119,"+(alpha*.15)+")");
 g.addColorStop(1,"rgba(234,204,119,0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(baseX,baseY-72,130,0,Math.PI*2);ctx.fill();

 ctx.strokeStyle="rgba(224,198,127,"+(alpha*.28)+")";ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(baseX,baseY-7,82+Math.sin(p.anim*1.4+i)*3,15,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();

 // Somente o asset final aparece. O rascunho procedural foi removido definitivamente.
 const memoryAsset=drawTraceMemoryAsset(i,t,alpha,burst);

 // Enquanto um PNG estiver recarregando, mostramos apenas o halo/rótulo — nunca bonequinhos.
 const labelY=memoryAsset?Math.max(250,memoryAsset.topY-8):Math.max(300,baseY-108);
 ctx.save();ctx.textAlign="center";
 ctx.fillStyle="rgba(243,220,154,"+(.72+burst*.18)+")";
 ctx.shadowColor="rgba(235,204,125,.38)";ctx.shadowBlur=7;
 ctx.font="700 10px Georgia";
 ctx.fillText(t.memoryLabel||t.title,baseX,labelY);
 ctx.restore();
}
function drawTraces(){
 ctx.save();ctx.translate(-cam,0);

 // Ligações acompanham a altura real de cada plataforma.
 for(let i=0;i<story.traces.length-1;i++){
   if(!traces[i]||!traces[i+1])continue;
   const a=story.traces[i],b=story.traces[i+1];
   const ay=traceSurfaceY(a)-12,by=traceSurfaceY(b)-12;
   ctx.strokeStyle="rgba(229,199,119,.25)";ctx.lineWidth=2;ctx.setLineDash([6,8]);
   ctx.beginPath();
   ctx.moveTo(a.x-10,ay);
   ctx.bezierCurveTo(a.x+75,ay-55,b.x-75,by-55,b.x-10,by);
   ctx.stroke();ctx.setLineDash([]);
 }

 story.traces.forEach((t,i)=>{
   const on=traces[i],pulse=.5+.5*Math.sin(p.anim*2+i);
   const baseAlpha=on?.92:.18;
   const surfaceY=traceSurfaceY(t);
   const footprints=traceFootPositions(t);

   // Lote 1 — usa a arte narrativa própria de cada rastro.
   // Se algum PNG falhar, o desenho procedural antigo continua funcionando.
   const assetDrawn=drawTraceAsset(i,t,on,pulse);
   if(!assetDrawn){
     footprints.forEach((fp,k)=>{
       const side=k%2?-1:1;
       drawTraceFoot(fp.x,fp.y,side*.16,baseAlpha,on?1:0.92);
     });
   }

   if(on){
     // Halo em perspectiva, apoiado no chão em vez de um círculo vertical.
     ctx.strokeStyle="rgba(232,201,117,"+(.22+pulse*.22)+")";ctx.lineWidth=2;
     ctx.beginPath();ctx.ellipse(t.x-26,surfaceY-6,58+pulse*5,14+pulse*2,0,0,Math.PI*2);ctx.stroke();
     drawTraceMemoryScene(i,t);
   }else{
     const pc=p.x+p.w/2;
     if(Math.abs(pc-t.x)<190){
       ctx.fillStyle="rgba(232,214,167,.86)";ctx.font="700 10px Georgia";ctx.textAlign="center";
       ctx.fillText("F · ILUMINAR RASTRO",traceSceneX(t),surfaceY-48);
     }
   }
 });

 // Depois dos três, o Campo inteiro vira uma frase visual, não um checklist.
 if(tracesSolved){
   ctx.save();ctx.textAlign="center";
   ctx.fillStyle="rgba(238,216,153,.78)";ctx.font="italic 12px Georgia";
   ctx.fillText("Ela voltou. Amparou. E voltou outra vez.",3910,340);
   ctx.restore();
 }
 ctx.restore();
}
const ERASER_SPRITE_INDEX=Object.freeze({
 idle:[0,1],
 patrol:[0,1],
 alert:[4],
 chase:[2,3],
 hit:[7],
 dissolve:[8,9]
});
function eraserSpriteIndex(e){
 if(e.state==="attack"){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);
   if(elapsed<e.cfg.attackWindup)return 4;
   if(elapsed<e.cfg.attackWindup+e.cfg.attackActive)return 5;
   return 6;
 }
 if(e.state==="dissolve")return e.alpha>.48?8:9;
 const seq=ERASER_SPRITE_INDEX[e.state]||ERASER_SPRITE_INDEX.idle;
 if(seq.length===1)return seq[0];
 const fps=e.state==="chase"?7.5:2.8;
 return seq[Math.floor((p.anim+e.spawnX*.001)*fps)%seq.length];
}
function drawEraserSprite(e){
 const index=eraserSpriteIndex(e);
 const im=eraserGameplaySprites[index];
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;

 const attacking=e.state==="attack";
 const chasing=e.state==="chase";
 const targetH=attacking?170:(chasing?164:158);
 const targetW=iw*(targetH/ih);
 const bob=(e.state==="idle"||e.state==="patrol")?Math.sin(p.anim*3.2+e.spawnX*.01)*1.8:0;
 const forward=attacking?8:(chasing?4:0);
 const bottom=e.h/2+8;
 const dx=-targetW/2+forward;
 const dy=bottom-targetH+bob;

 ctx.save();
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality="high";
 ctx.shadowColor=e.hitFlash>0?"rgba(249,224,157,.95)":"rgba(0,0,0,.72)";
 ctx.shadowBlur=e.hitFlash>0?24:10;
 ctx.drawImage(im,dx,dy,targetW,targetH);

 // A Luz deixa um clarão curto no corpo sem destruir as cores do PNG.
 if(e.hitFlash>0){
   ctx.globalAlpha=Math.min(.28,e.hitFlash*1.15);
   ctx.globalCompositeOperation="screen";
   ctx.shadowColor="rgba(247,215,126,.95)";
   ctx.shadowBlur=28;
   ctx.drawImage(im,dx,dy,targetW,targetH);
 }
 ctx.restore();
 return true;
}
function drawEraserEnemyFallback(e){
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
const ASH_HOUND_SPRITE_INDEX=Object.freeze({
 idle:[0,1],
 patrol:[2,3,4],
 alert:[1],
 chase:[2,3,4],
 hit:[8],
 dissolve:[9]
});

// Os PNGs foram gerados individualmente e cada pose ocupa uma região diferente
// do canvas. cx centraliza a massa do animal; foot alinha as patas à plataforma.
// Isso remove o "salto" vertical/horizontal entre frames sem recortar a arte.
const ASH_HOUND_FRAME_META=Object.freeze([
 Object.freeze({cx:.523,foot:.806}),
 Object.freeze({cx:.544,foot:.852}),
 Object.freeze({cx:.533,foot:.813}),
 Object.freeze({cx:.525,foot:.819}),
 Object.freeze({cx:.545,foot:.804}),
 Object.freeze({cx:.501,foot:.911}),
 Object.freeze({cx:.526,foot:.848}),
 Object.freeze({cx:.540,foot:.884}),
 Object.freeze({cx:.531,foot:.928}),
 Object.freeze({cx:.507,foot:.925})
]);
function ashHoundSpriteIndex(e){
 if(e.state==="dissolve")return 9;
 if(e.state==="hit"||e.hitFlash>0)return 8;
 if(e.state==="attack"){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);
   if(elapsed<e.cfg.attackWindup)return 5;
   if(elapsed<e.cfg.attackWindup+e.cfg.attackActive)return 6;
   return 7;
 }
 const seq=ASH_HOUND_SPRITE_INDEX[e.state]||ASH_HOUND_SPRITE_INDEX.idle;
 if(seq.length===1)return seq[0];
 const clock=e.animClock||0;
 return seq[Math.floor(clock)%seq.length];
}
function drawAshHoundSprite(e){
 const moving=e.state==="patrol"||e.state==="chase";
 const attacking=e.state==="attack";
 const chasing=e.state==="chase";
 const baseIndex=ashHoundSpriteIndex(e);
 const baseIm=ashHoundGameplaySprites[baseIndex];
 if(!baseIm)return false;

 // O ponto de contato é exatamente o pé da hitbox. O offset visual da plataforma
 // é aplicado fora desta função por drawEnemy().
 const ground=e.h/2;
 const baseWidth=e.state==="dissolve"?154:(attacking?162:(chasing?158:150));
 let bodyX=0,bodyY=0,rotation=0,scaleX=1,scaleY=1;
 let frames=[];

 const addFrame=(index,alpha=1)=>{
   const im=ashHoundGameplaySprites[index];
   if(im&&alpha>.001)frames.push({im,index,alpha});
 };

 if(moving){
   // O ciclo agora segue um relógio próprio do Cão e a velocidade física.
   // A fusão ocupa só o fim do passo para não criar duas silhuetas sobrepostas.
   const clock=e.animClock||0;
   const step=Math.floor(clock);
   const frac=clock-step;
   const current=2+(step%3);
   const next=2+((step+1)%3);
   const transitionStart=.90;
   if(frac<transitionStart){
     addFrame(current,1);
   }else{
     const t=(frac-transitionStart)/(1-transitionStart);
     const ease=t*t*(3-2*t);
     addFrame(current,1-ease);
     addFrame(next,ease);
   }
   const gait=Math.sin(clock*Math.PI);
   bodyY=-Math.abs(gait)*(chasing?1.0:.65);
   rotation=Math.sin(clock*Math.PI*2)*(chasing?.008:.005);
 }else if(attacking){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);

   if(elapsed<e.cfg.attackWindup){
     const t=Math.min(1,elapsed/e.cfg.attackWindup);
     const ease=t*t*(3-2*t);
     addFrame(1,1-ease);
     addFrame(5,ease);
     bodyX=-3*ease;
     bodyY=1.2*ease;
     rotation=-.018*ease;
   }else if(elapsed<e.cfg.attackWindup+e.cfg.attackActive){
     // O deslocamento principal já acontece em updateGroundEnemyState().
     // Aqui só existe antecipação visual curta, evitando o antigo "teleporte duplo".
     const t=Math.min(1,(elapsed-e.cfg.attackWindup)/e.cfg.attackActive);
     const blend=Math.min(1,t/.18);
     addFrame(5,1-blend);
     addFrame(6,blend);
     bodyX=5*t;
     bodyY=-1.2*Math.sin(t*Math.PI);
     rotation=.018*t;
   }else{
     const t=Math.min(1,(elapsed-e.cfg.attackWindup-e.cfg.attackActive)/e.cfg.attackRecover);
     if(t<.58){
       const q=t/.58,ease=q*q*(3-2*q);
       addFrame(6,1-ease);
       addFrame(7,ease);
     }else{
       const q=(t-.58)/.42,ease=q*q*(3-2*q);
       addFrame(7,1-ease);
       addFrame(0,ease);
     }
     bodyX=4*(1-t);
     bodyY=Math.sin(t*Math.PI)*.8;
     rotation=.018*(1-t);
   }
 }else{
   addFrame(baseIndex,1);
   if(e.state==="idle"){
     bodyY=Math.sin((e.animClock||0)*Math.PI)*.45;
     rotation=Math.sin((e.animClock||0)*1.5)*.004;
   }else if(e.state==="alert"){
     bodyY=.5;
     rotation=-.006;
   }else if(e.state==="hit"){
     bodyX=-2;
     bodyY=-1;
     rotation=-.012;
   }
 }

 if(e.hitFlash>0&&e.state!=="dissolve"){
   frames=[];
   addFrame(8,1);
   bodyX=-2;bodyY=-1.5;rotation=-.012;
 }

 const drawFrame=(fr,alphaMul=1,composite=null)=>{
   const im=fr.im;
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(!iw||!ih)return;
   const meta=ASH_HOUND_FRAME_META[fr.index]||ASH_HOUND_FRAME_META[0];
   const w=baseWidth*scaleX;
   const h=ih*(w/iw)*scaleY;
   const dx=-w*meta.cx;
   const dy=ground-h*meta.foot;

   ctx.save();
   ctx.globalAlpha=Math.max(0,Math.min(1,fr.alpha*alphaMul));
   if(composite)ctx.globalCompositeOperation=composite;
   ctx.drawImage(im,dx,dy,w,h);
   ctx.restore();
 };

 ctx.save();
 ctx.translate(bodyX,bodyY);
 ctx.rotate(rotation);
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality="high";
 ctx.shadowColor=e.hitFlash>0?"rgba(251,224,150,.98)":"rgba(0,0,0,.74)";
 ctx.shadowBlur=e.hitFlash>0?25:10;

 for(const fr of frames)drawFrame(fr,1);

 if(e.hitFlash>0){
   ctx.save();
   ctx.shadowColor="rgba(250,215,126,.98)";
   ctx.shadowBlur=28;
   for(const fr of frames)drawFrame(fr,Math.min(.28,e.hitFlash*1.25),"screen");
   ctx.restore();
 }
 ctx.restore();
 return true;
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
const HOLLOW_SPRITE_INDEX=Object.freeze({
 idle:[0,1],
 patrol:[2,3],
 alert:[4],
 chase:[2,3],
 hit:[8],
 dissolve:[9]
});
function hollowSpriteIndex(e){
 if(e.state==="dissolve")return 9;
 if(e.state==="hit"||e.hitFlash>0)return 8;
 if(e.state==="attack"){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);
   if(elapsed<e.cfg.attackWindup)return 5;
   if(elapsed<e.cfg.attackWindup+e.cfg.attackActive)return 6;
   return 7;
 }
 const seq=HOLLOW_SPRITE_INDEX[e.state]||HOLLOW_SPRITE_INDEX.idle;
 if(seq.length===1)return seq[0];
 const fps=e.state==="chase"?5.4:(e.state==="patrol"?3.2:1.8);
 return seq[Math.floor((p.anim+e.spawnX*.001)*fps)%seq.length];
}
function drawHollowSprite(e){
 const moving=e.state==="patrol"||e.state==="chase";
 const attacking=e.state==="attack";
 const chasing=e.state==="chase";
 const exposed=e.exposedTimer>0;
 const baseIndex=hollowSpriteIndex(e);
 const baseIm=hollowGameplaySprites[baseIndex];
 if(!baseIm)return false;

 const targetH=e.state==="dissolve"?208:(attacking?208:(chasing?200:194));
 const bottom=e.h/2+8;
 let bodyX=0,bodyY=0,rotation=0,scaleX=1,scaleY=1;
 let frames=[];

 const addFrame=(index,alpha=1)=>{
   const im=hollowGameplaySprites[index];
   if(im&&alpha>.001)frames.push({im,alpha});
 };

 if(moving){
   // Dois desenhos de caminhada, mas sem manter duas silhuetas fantasmas sobrepostas
   // o tempo todo. Cada passo fica sólido e a fusão só acontece perto da troca.
   const speed=chasing?7.2:5.15;
   const clock=(p.anim+e.spawnX*.001)*speed;
   const step=Math.floor(clock);
   const frac=clock-step;
   const current=(step&1)?3:2;
   const next=current===2?3:2;
   const transitionStart=.76;
   if(frac<transitionStart){
     addFrame(current,1);
   }else{
     const t=(frac-transitionStart)/(1-transitionStart);
     const ease=t*t*(3-2*t);
     addFrame(current,1-ease);
     addFrame(next,ease);
   }
   const gait=Math.sin(clock*Math.PI);
   bodyY=Math.abs(gait)*-2.3;
   bodyX=Math.sin(clock*Math.PI*2)*(chasing?2.1:1.3);
   rotation=Math.sin(clock*Math.PI*2)*(chasing?.010:.007);
 }else if(attacking){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);

   if(elapsed<e.cfg.attackWindup){
     // 05 alert -> 06 windup, com recuo e compressão do corpo.
     const t=Math.min(1,elapsed/e.cfg.attackWindup);
     const ease=t*t*(3-2*t);
     addFrame(4,1-ease);
     addFrame(5,ease);
     bodyX=-8*ease;
     bodyY=3*ease;
     rotation=-.025*ease;
     scaleX=1-.025*ease;
     scaleY=1+.018*ease;
   }else if(elapsed<e.cfg.attackWindup+e.cfg.attackActive){
     // Golpe: 06 -> 07 e avanço visual sincronizado com o deslocamento físico.
     const t=Math.min(1,(elapsed-e.cfg.attackWindup)/e.cfg.attackActive);
     const ease=1-Math.pow(1-t,3);
     const blend=Math.min(1,t/.28);
     addFrame(5,1-blend);
     addFrame(6,blend);
     bodyX=-8+27*ease;
     bodyY=-2*Math.sin(t*Math.PI);
     rotation=.032*ease;
     scaleX=1+.045*Math.sin(t*Math.PI);
     scaleY=1-.025*Math.sin(t*Math.PI);
   }else{
     // Recuperação rápida: 07 -> 08 -> idle. Não segura 08 congelado.
     const t=Math.min(1,(elapsed-e.cfg.attackWindup-e.cfg.attackActive)/e.cfg.attackRecover);
     if(t<.58){
       const q=t/.58, ease=q*q*(3-2*q);
       addFrame(6,1-ease);
       addFrame(7,ease);
     }else{
       const q=(t-.58)/.42, ease=q*q*(3-2*q);
       addFrame(7,1-ease);
       addFrame(0,ease);
     }
     bodyX=19*(1-t);
     bodyY=Math.sin(t*Math.PI)*2.4;
     rotation=.032*(1-t)-.012*Math.sin(t*Math.PI);
   }
 }else{
   addFrame(baseIndex,1);
   if(e.state==="idle"){
     bodyY=Math.sin(p.anim*2.05+e.spawnX*.01)*1.4;
     rotation=Math.sin(p.anim*1.35+e.spawnX*.006)*.006;
   }else if(e.state==="alert"){
     bodyY=-1.5;
     scaleY=1.012;
   }else if(e.state==="hit"){
     bodyX=-5;
     rotation=-.018;
   }
 }

 // Se o clarão da Luz ocorreu, a pose de impacto precisa vencer qualquer pose anterior.
 if(e.hitFlash>0&&e.state!=="dissolve"){
   frames=[];
   addFrame(8,1);
   bodyX=-5;
   bodyY=-2;
   rotation=-.018;
   scaleX=.985;
   scaleY=1.02;
 }

 const drawFrame=(fr,alphaMul=1,composite=null)=>{
   const im=fr.im;
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(!iw||!ih)return;
   const h=targetH*scaleY;
   const w=iw*(h/ih)*scaleX;
   const dx=-w/2;
   const dy=bottom-h;

   ctx.save();
   ctx.globalAlpha=Math.max(0,Math.min(1,fr.alpha*alphaMul));
   if(composite)ctx.globalCompositeOperation=composite;
   ctx.drawImage(im,dx,dy,w,h);
   ctx.restore();
 };

 ctx.save();
 ctx.translate(bodyX,bodyY);
 ctx.rotate(rotation);
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality="high";
 ctx.shadowColor=e.hitFlash>0?"rgba(249,224,157,.98)":(exposed?"rgba(232,199,109,.65)":"rgba(0,0,0,.74)");
 ctx.shadowBlur=e.hitFlash>0?27:(exposed?18:11);

 if(exposed&&e.state!=="dissolve"){
   const pulse=.28+.10*Math.sin(p.anim*5.2);
   ctx.save();
   ctx.shadowColor="rgba(241,208,119,.9)";
   ctx.shadowBlur=22;
   for(const fr of frames)drawFrame(fr,pulse,"screen");
   ctx.restore();
 }

 for(const fr of frames)drawFrame(fr,1);

 if(e.hitFlash>0){
   ctx.save();
   ctx.shadowColor="rgba(252,224,146,.98)";
   ctx.shadowBlur=30;
   for(const fr of frames)drawFrame(fr,Math.min(.30,e.hitFlash*1.22),"screen");
   ctx.restore();
 }
 ctx.restore();
 return true;
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
const CROW_SPRITE_INDEX=Object.freeze({
 idle:[0,1],
 patrol:[2,3],
 alert:[4],
 chase:[2,3],
 hit:[8],
 dissolve:[9]
});
function crowSpriteIndex(e){
 if(e.state==="dissolve")return 9;
 if(e.state==="hit"||e.hitFlash>0)return 8;
 if(e.state==="attack"){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);
   if(elapsed<e.cfg.attackWindup)return 5;
   if(elapsed<e.cfg.attackWindup+e.cfg.attackActive)return 6;
   return 7;
 }
 const seq=CROW_SPRITE_INDEX[e.state]||CROW_SPRITE_INDEX.idle;
 if(seq.length===1)return seq[0];
 const fps=e.state==="chase"?7.8:(e.state==="patrol"?5.8:2.4);
 return seq[Math.floor((p.anim+e.spawnX*.001)*fps)%seq.length];
}
function drawCrowSprite(e){
 const moving=e.state==="patrol"||e.state==="chase";
 const attacking=e.state==="attack";
 const baseIndex=crowSpriteIndex(e);
 const baseIm=crowGameplaySprites[baseIndex];
 if(!baseIm)return false;

 let frames=[],bodyX=0,bodyY=0,rot=0,scaleX=1,scaleY=1;
 const add=(idx,a=1)=>{const im=crowGameplaySprites[idx];if(im&&a>.001)frames.push({im,alpha:a})};

 if(moving){
   const speed=e.state==="chase"?8.4:6.2;
   const clock=(p.anim+e.spawnX*.001)*speed;
   const step=Math.floor(clock),frac=clock-step,current=(step&1)?3:2,next=current===2?3:2;
   if(frac<.72)add(current,1);
   else{
     const t=(frac-.72)/.28,ease=t*t*(3-2*t);
     add(current,1-ease);add(next,ease);
   }
   bodyY=Math.sin(clock*Math.PI)*3.2;
   rot=Math.sin(clock*Math.PI*2)*.018;
 }else if(attacking){
   const total=e.cfg.attackWindup+e.cfg.attackActive+e.cfg.attackRecover;
   const elapsed=Math.max(0,total-e.stateTimer);
   if(elapsed<e.cfg.attackWindup){
     const t=Math.min(1,elapsed/e.cfg.attackWindup),ease=t*t*(3-2*t);
     add(4,1-ease);add(5,ease);
     bodyY=-8*ease;bodyX=-7*ease;rot=-.06*ease;
     scaleX=1-.035*ease;scaleY=1+.035*ease;
   }else if(elapsed<e.cfg.attackWindup+e.cfg.attackActive){
     const t=Math.min(1,(elapsed-e.cfg.attackWindup)/e.cfg.attackActive);
     const blend=Math.min(1,t/.22);
     add(5,1-blend);add(6,blend);
     bodyX=15*t;bodyY=8*t;rot=.12*t;
     scaleX=1+.05*Math.sin(t*Math.PI);scaleY=1-.035*Math.sin(t*Math.PI);
   }else{
     const t=Math.min(1,(elapsed-e.cfg.attackWindup-e.cfg.attackActive)/e.cfg.attackRecover);
     if(t<.58){
       const q=t/.58,ease=q*q*(3-2*q);
       add(6,1-ease);add(7,ease);
     }else{
       const q=(t-.58)/.42,ease=q*q*(3-2*q);
       add(7,1-ease);add(0,ease);
     }
     bodyX=15*(1-t);bodyY=6*(1-t);rot=.12*(1-t);
   }
 }else{
   add(baseIndex,1);
   if(e.state==="idle")bodyY=Math.sin(p.anim*2.6+e.spawnX*.01)*2.2;
   if(e.state==="alert"){bodyY=-4;scaleX=1.02;scaleY=1.02}
 }

 if(e.hitFlash>0&&e.state!=="dissolve"){
   frames=[];add(8,1);bodyX=-5;bodyY=-4;rot=-.05;scaleX=.98;scaleY=1.02;
 }

 const width=e.state==="dissolve"?166:(attacking?178:(e.state==="chase"?170:158));
 const drawFrame=(fr,alphaMul=1,screen=false)=>{
   const im=fr.im,iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(!iw||!ih)return;
   const w=width*scaleX,h=ih*(w/iw)*scaleY;
   ctx.save();
   ctx.globalAlpha=Math.max(0,Math.min(1,fr.alpha*alphaMul));
   if(screen)ctx.globalCompositeOperation="screen";
   ctx.drawImage(im,-w/2,-h/2,w,h);
   ctx.restore();
 };

 ctx.save();
 ctx.translate(bodyX,bodyY);ctx.rotate(rot);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.shadowColor=e.hitFlash>0?"rgba(249,221,145,.96)":"rgba(0,0,0,.72)";
 ctx.shadowBlur=e.hitFlash>0?24:10;
 for(const fr of frames)drawFrame(fr,1,false);
 if(e.hitFlash>0){
   ctx.shadowColor="rgba(255,220,128,.98)";ctx.shadowBlur=27;
   for(const fr of frames)drawFrame(fr,Math.min(.28,e.hitFlash*1.2),true);
 }
 ctx.restore();
 return true;
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

 let hollowSpriteDrawn=false,ashHoundSpriteDrawn=false,crowSpriteDrawn=false;
 if(e.kind==="ashHound"){
   ashHoundSpriteDrawn=drawAshHoundSprite(e);
   if(!ashHoundSpriteDrawn)drawAshHoundEnemy(e);
 }
 else if(e.kind==="hollow"){
   hollowSpriteDrawn=drawHollowSprite(e);
   if(!hollowSpriteDrawn)drawHollowEnemy(e);
 }
 else if(e.kind==="crow"){
   crowSpriteDrawn=drawCrowSprite(e);
   if(!crowSpriteDrawn)drawCrowEnemy(e);
 }
 else if(!drawEraserSprite(e))drawEraserEnemyFallback(e);

 if(state==="dissolve"&&!((e.kind==="hollow"&&hollowSpriteDrawn)||(e.kind==="ashHound"&&ashHoundSpriteDrawn)||(e.kind==="crow"&&crowSpriteDrawn)))drawEnemyDissolve(e);
 ctx.restore();

 if(state!=="dissolve"){
   ctx.save();ctx.textAlign="center";
   const enemyLabelY=e.kind==="eraser"?visualY-108:(e.kind==="hollow"?visualY-136:(e.kind==="ashHound"?visualY-104:(e.kind==="crow"?visualY-102:visualY-14)));
   ctx.fillStyle="#b9aa89";ctx.font="700 9px Georgia";ctx.fillText(e.label,ex+e.w/2,enemyLabelY);
   const stateLabel={
     idle:"à espreita",patrol:"patrulha",alert:"percebeu Jack",
     chase:e.kind==="crow"?"circulando":"perseguindo",attack:e.kind==="crow"?"mergulho":"atacando",hit:"atingido"
   }[state]||state;
   ctx.fillStyle="rgba(196,184,150,.65)";ctx.font="italic 8px Georgia";ctx.fillText(stateLabel,ex+e.w/2,enemyLabelY+11);

   if(e.cfg.needsReveal&&e.exposedTimer>0){
     ctx.fillStyle="#ddc576";ctx.font="700 8px Georgia";ctx.fillText("EXPOSTO",ex+e.w/2,visualY+e.h+14);
   }
   if(e.hp<e.maxHp){
     const bw=46,bx=ex+e.w/2-bw/2,by=(e.kind==="eraser"||e.kind==="hollow"||e.kind==="ashHound"||e.kind==="crow")?enemyLabelY-11:visualY-29;
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
function archiveEvidenceHost(ev){
 const candidates=platforms.filter(q=>q.kind==="archive"&&q.h<100&&!q.broken);
 let best=null,bestDist=Infinity;
 for(const q of candidates){
   const edge=Math.max(q.x,Math.min(q.x+q.w,ev.x));
   const d=Math.abs(ev.x-edge);
   if(d<bestDist){best=q;bestDist=d}
 }
 return bestDist<=150?best:null;
}
function drawArchiveImageByHeight(im,cx,bottomY,targetH,alpha=1,glow=false){
 if(!im)return null;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return null;
 const targetW=iw*(targetH/ih),dx=cx-targetW/2,dy=bottomY-targetH;
 ctx.save();
 ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(glow){
   ctx.shadowColor="rgba(235,200,111,.58)";
   ctx.shadowBlur=15;
 }
 ctx.drawImage(im,dx,dy,targetW,targetH);
 ctx.restore();
 return {x:dx,y:dy,w:targetW,h:targetH};
}
function drawArchiveEnvironment(){
 // Camada de cenário: transforma as ruínas em um arquivo violado,
 // sem cobrir as evidências nem os inimigos.
 const layout=[
   {i:0,x:4825,b:590,h:205,a:.74,flip:false},
   {i:3,x:5170,b:590,h:150,a:.72,flip:false},
   {i:1,x:5480,b:590,h:190,a:.70,flip:false},
   {i:5,x:5895,b:590,h:150,a:.74,flip:false},
   {i:4,x:5250,b:420,h:122,a:.62,flip:false},
   {i:2,x:5985,b:590,h:172,a:.72,flip:true}
 ];
 for(const q of layout){
   const im=archivePropImgs[q.i];
   if(!im)continue;
   drawArchiveImageByHeight(im,q.x,q.b,q.h,q.a,false);
 }
}
function drawArchiveEvidenceFallback(i,x,solved){
 ctx.save();ctx.translate(x,0);
 ctx.globalAlpha=.72;
 if(i===0){
   ctx.fillStyle="#b8aa88";ctx.fillRect(-31,474,62,48);
   ctx.fillStyle="#242622";ctx.fillRect(-25,483,49,8);
 }else if(i===1){
   ctx.strokeStyle="#8d7d5d";ctx.lineWidth=3;
   for(let yy=470;yy<=512;yy+=21)ctx.strokeRect(-34,yy,68,14);
 }else{
   ctx.fillStyle="#9f9275";ctx.fillRect(-35,468,70,55);
   ctx.fillStyle=solved?"#d9bd73":"#695f4b";ctx.font="700 7px Georgia";ctx.textAlign="center";
   ctx.fillText("RECEBIDO",10,492);
 }
 ctx.restore();
}
function drawArchiveEvidenceAsset(i,ev,solved){
 const im=archiveEvidenceImgs[i]?.[solved?1:0];
 if(!im)return null;
 const host=archiveEvidenceHost(ev);
 const visualTop=host?(host.y+platformVisualFootOffset(host)):590;
 const heights=[132,168,145];
 // Recorte e Inventário parecem objetos apoiados; Marcas é um painel vertical.
 const bottomAdjust=[-4,-8,-5];
 const targetH=heights[i];
 const bottomY=visualTop+bottomAdjust[i];
 return drawArchiveImageByHeight(im,ev.x,bottomY,targetH,solved?.98:.90,solved);
}
function drawArchiveRevealFx(i,ev,fx){
 if(fx<=0)return;
 const im=archiveFxImgs[Math.min(i,2)];
 if(!im)return;
 const host=archiveEvidenceHost(ev);
 const visualTop=host?(host.y+platformVisualFootOffset(host)):590;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return;
 const targetW=[210,235,220][i];
 const targetH=targetW*(ih/iw);
 const alpha=Math.min(.78,fx*.78);
 ctx.save();
 ctx.globalCompositeOperation="screen";
 ctx.globalAlpha=alpha;
 ctx.shadowColor="rgba(255,223,145,.92)";
 ctx.shadowBlur=20;
 ctx.drawImage(im,ev.x-targetW/2,visualTop-targetH*.78,targetW,targetH);
 ctx.restore();
}
function drawArchiveDeduction(){
 if(!archiveSolved)return;
 const im=archiveFxImgs[3];
 if(im){
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(iw&&ih){
     const targetW=1040,targetH=targetW*(ih/iw);
     const pulse=.52+.08*Math.sin(p.anim*1.45);
     ctx.save();
     ctx.globalCompositeOperation="screen";
     ctx.globalAlpha=pulse;
     ctx.shadowColor="rgba(239,205,118,.65)";
     ctx.shadowBlur=16;
     ctx.drawImage(im,5480-targetW/2,392,targetW,targetH);
     ctx.restore();
   }
 }else{
   ctx.strokeStyle="rgba(231,199,113,.42)";ctx.lineWidth=2;ctx.setLineDash([7,8]);
   ctx.beginPath();ctx.moveTo(5005,438);ctx.quadraticCurveTo(5380,400,5760,438);ctx.stroke();
   ctx.beginPath();ctx.moveTo(5760,438);ctx.lineTo(6005,438);ctx.stroke();
   ctx.setLineDash([]);
 }
 ctx.save();ctx.textAlign="center";
 ctx.fillStyle="rgba(238,211,143,.86)";
 ctx.shadowColor="rgba(231,197,111,.42)";ctx.shadowBlur=7;
 ctx.font="italic 11px Georgia";
 ctx.fillText("os nomes seguiram adiante",5680,404);
 ctx.restore();
}
function drawArchiveEvidence(){
 if(!prototypeEndPlayed)return;
 const pc=p.x+p.w/2;
 ctx.save();ctx.translate(-cam,0);

 drawArchiveEnvironment();

 story.archiveEvidence.forEach((ev,i)=>{
   const solved=archiveEvidence[i],guardClear=archiveGuardDefeated(i);
   const x=ev.x,pulse=.5+.5*Math.sin(p.anim*2.1+i*.8),fx=Math.min(1,archiveRevealFx[i]/1.2);
   const art=drawArchiveEvidenceAsset(i,ev,solved);
   if(!art)drawArchiveEvidenceFallback(i,x,solved);

   // Leitura de gameplay fica acima da arte, sem pedestal genérico.
   if(solved){
     ctx.save();ctx.textAlign="center";
     ctx.fillStyle="rgba(240,215,150,"+(.82+pulse*.08)+")";
     ctx.shadowColor="rgba(226,191,102,.45)";ctx.shadowBlur=7;
     ctx.font="700 9px Georgia";
     ctx.fillText("PROVA REGISTRADA",x,art?art.y-8:451);
     ctx.restore();
   }else if(Math.abs(pc-x)<150){
     const labelY=art?art.y-8:451;
     ctx.save();ctx.textAlign="center";
     ctx.fillStyle=guardClear?"rgba(238,220,166,.94)":"rgba(187,169,128,.74)";
     ctx.shadowColor="rgba(0,0,0,.7)";ctx.shadowBlur=4;
     ctx.font="700 9px Georgia";
     ctx.fillText(guardClear?ev.prompt:"A PROVA ESTÁ SOB ATAQUE",x,labelY);
     ctx.restore();
   }

   drawArchiveRevealFx(i,ev,fx);
 });

 drawArchiveDeduction();
 ctx.restore();
}

function drawBridgeAtmosAsset(im,cx,bottomY,targetW,alpha=.7,flip=false,screen=false){
 if(!im)return null;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return null;
 const w=targetW,h=ih*(w/iw),x=cx-w/2,y=bottomY-h;
 ctx.save();
 ctx.globalAlpha=alpha;
 if(screen)ctx.globalCompositeOperation="screen";
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(im,0,y,w,h)}
 else ctx.drawImage(im,x,y,w,h);
 ctx.restore();
 return {x,y,w,h};
}
function drawNobodyBridgeAtmosphere(){
 if(!archiveSolved||cam+W<5980||cam>8030)return;
 ctx.save();ctx.translate(-cam,0);

 // Arquitetura quebrada reforça a altura sem alterar colisão.
 drawBridgeAtmosAsset(bridgeAtmosImgs[4],6335,620,205,.54,false,false);
 drawBridgeAtmosAsset(bridgeAtmosImgs[2],6575,526,285,.58,false,false);
 drawBridgeAtmosAsset(bridgeAtmosImgs[3],7165,570,235,.54,false,false);
 drawBridgeAtmosAsset(bridgeAtmosImgs[4],7475,620,178,.38,true,false);
 drawBridgeAtmosAsset(bridgeAtmosImgs[5],7740,575,320,.34,false,false);

 ctx.restore();
}
function drawNobodyBridgeFog(){
 if(!bridgeFearPlayed||cam+W<6000||cam>8020)return;
 ctx.save();ctx.translate(-cam,0);

 // Névoa final em camadas. Pequeno deslocamento mantém a ponte viva sem parecer um filtro retangular.
 const drift=Math.sin(bridgeFogClock*.42)*42;
 const bank=bridgeAtmosImgs[0],column=bridgeAtmosImgs[1];
 drawBridgeAtmosAsset(bank,6660+drift,645,690,.34,false,false);
 drawBridgeAtmosAsset(bank,7480-drift*.55,630,640,.28,true,false);
 drawBridgeAtmosAsset(column,6960+Math.sin(bridgeFogClock*.31)*24,650,240,.24,false,false);
 drawBridgeAtmosAsset(column,7665-Math.sin(bridgeFogClock*.27)*18,645,210,.18,true,false);

 // As plataformas prestes a desaparecer recebem apenas uma bruma localizada.
 for(const q of platforms){
   if(!q.unstable||(q.lightTimer||0)>0)continue;
   const fade=1-bridgePlatformAlpha(q);
   if(fade<=.06)continue;
   if(bank)drawBridgeAtmosAsset(bank,q.x+q.w/2,q.y+56,q.w*1.72,Math.min(.34,.10+fade*.28),q.bridgeId==="bridge-b",false);
 }

 ctx.restore();
}
function drawBridgeIdentityPlate(){
 if(!bridgeFearPlayed)return;
 const x=7830,ground=590;
 let index=0;

 if(bridgeCrossedPlayed){
   index=3; // a estrada falhou e apagou o registro
 }else if(bridgeNameGlitchPlayed){
   // Durante a conversa, o J aparece e desaparece sem texto de Canvas.
   index=(Math.floor(p.anim*3.2)%3===1)?3:2;
 }else if(pilgrimBridgeDone||p.x>7700){
   index=1;
 }

 const im=bridgeRegisterImgs[index];
 ctx.save();ctx.translate(-cam,0);
 if(im){
   const glow=index===1||index===2;
   if(glow){ctx.shadowColor="rgba(236,195,92,.68)";ctx.shadowBlur=index===2?24:15}
   drawPropByHeight(im,x,ground,226,index===0?.82:.96,false);
 }else{
   // Fallback antigo só existe se os novos PNGs não carregarem.
   ctx.strokeStyle="#5f533f";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x,498);ctx.stroke();
   ctx.fillStyle="#302f2b";ctx.fillRect(x-68,466,136,48);
   ctx.strokeStyle="rgba(143,119,77,.8)";ctx.lineWidth=2;ctx.strokeRect(x-68,466,136,48);
   if(index===2){
     ctx.fillStyle="rgba(246,208,112,.94)";ctx.font="700 14px Georgia";ctx.textAlign="center";
     ctx.fillText("J...",x,496);
   }
 }
 ctx.restore();
}
function plazaEchoGuardDefeated(i){
 const id=plazaEchoGuards[i];
 const e=enemies.find(v=>v.id===id);
 return !e||e.defeated||e.state==="dead"||e.state==="dissolve";
}
function drawPlazaImageFit(im,cx,cy,maxW,maxH,alpha=1,tilt=0,screen=false){
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const scale=Math.min(maxW/iw,maxH/ih);
 const w=iw*scale,h=ih*scale;
 ctx.save();
 ctx.translate(cx,cy);
 ctx.rotate(tilt);
 ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
 if(screen)ctx.globalCompositeOperation="screen";
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,-w/2,-h/2,w,h);
 ctx.restore();
 return true;
}
function plazaVisualGroundY(x){
 return 590+visualFootOffsetAt(x,590,42);
}

const visibleBottomPadCache=new WeakMap();
function visibleBottomPadRatio(im){
 if(!im)return 0;
 if(visibleBottomPadCache.has(im))return visibleBottomPadCache.get(im);
 let ratio=0;
 try{
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   if(iw&&ih){
     const maxW=220,scale=Math.min(1,maxW/iw);
     const sw=Math.max(24,Math.round(iw*scale)),sh=Math.max(24,Math.round(ih*scale));
     const cv=document.createElement("canvas");cv.width=sw;cv.height=sh;
     const cx=cv.getContext("2d",{willReadFrequently:true});
     cx.clearRect(0,0,sw,sh);cx.drawImage(im,0,0,sw,sh);
     const data=cx.getImageData(0,0,sw,sh).data;
     const need=Math.max(3,Math.floor(sw*.018));
     let last=sh-1;
     outer:for(let y=sh-1;y>=0;y--){
       let solid=0;
       for(let x=0;x<sw;x++){
         if(data[(y*sw+x)*4+3]>30&&++solid>=need){last=y;break outer}
       }
     }
     ratio=Math.max(0,Math.min(.22,(sh-1-last)/sh));
   }
 }catch(_){ratio=0}
 visibleBottomPadCache.set(im,ratio);
 return ratio;
}
function visibleBottomPadPx(im,targetH,maxPx=30){
 return Math.min(maxPx,targetH*visibleBottomPadRatio(im));
}
function drawPlazaImageBottom(im,cx,bottomY,targetH,alpha=1,flip=false,screen=false){
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const w=iw*(targetH/ih),x=cx-w/2;
 const visiblePad=visibleBottomPadPx(im,targetH,30);
 const y=bottomY-targetH+visiblePad;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
 if(screen)ctx.globalCompositeOperation="screen";
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(im,0,y,w,targetH)}
 else ctx.drawImage(im,x,y,w,targetH);
 ctx.restore();
 return true;
}
function plazaEchoGuardDefeated(i){
 const id=plazaEchoGuards[i];
 const e=enemies.find(v=>v.id===id);
 return !e||e.defeated||e.state==="dead"||e.state==="dissolve";
}
function drawStolenNamePlate(x,y,w=74,h=24,alpha=.72,tilt=0,imageIndex=null){
 const idx=imageIndex==null
   ?Math.abs(Math.floor(w*3+h*7))%Math.max(1,plazaNameplateImgs.length)
   :Math.abs(imageIndex)%Math.max(1,plazaNameplateImgs.length);
 const im=plazaNameplateImgs[idx];
 if(im&&drawPlazaImageFit(im,x,y,w,Math.max(h,18),alpha,tilt,false))return true;

 // Fallback simples apenas se o PNG falhar.
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.globalAlpha=alpha;
 ctx.fillStyle="#302d27";ctx.strokeStyle="#8d7650";ctx.lineWidth=2;
 ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);
 ctx.fillStyle="rgba(210,188,134,.28)";
 ctx.fillRect(-w*.32,-1,w*.64,2);ctx.fillRect(-w*.24,5,w*.38,2);
 ctx.restore();
 return false;
}
function drawStolenNamesPlazaAtmosphere(){
 if(!bridgeCrossedPlayed||cam+W<7820||cam>9300)return;
 ctx.save();ctx.translate(-cam,0);

 // A Praça parece um depósito público de identidades confiscadas.
 drawPlazaImageBottom(plazaAtmosImgs[1],7995,plazaVisualGroundY(7995),188,.46,false,false);
 drawPlazaImageBottom(plazaAtmosImgs[4],8215,plazaVisualGroundY(8215),176,.38,false,false);
 drawPlazaImageBottom(plazaAtmosImgs[2],8495,plazaVisualGroundY(8495),164,.34,false,false);
 drawPlazaImageBottom(plazaAtmosImgs[3],8710,plazaVisualGroundY(8710)-35,160,.32,false,false);
 drawPlazaImageBottom(plazaAtmosImgs[5],8995,plazaVisualGroundY(8995),208,.42,false,false);

 ctx.restore();
}
function drawPlazaEchoFx(i,x,on){
 const fx=Math.min(1,plazaEchoFx[i]/2.4);
 const pulse=.5+.5*Math.sin(p.anim*2.4+i*.8);

 if(on){
   // Memória continua respirando depois de ouvida.
   drawPlazaImageFit(plazaEchoFxImgs[1],x,470,155,210,.12+.07*pulse,0,true);
   drawPlazaImageFit(plazaEchoFxImgs[2],x,474,170,170,.08+.05*pulse,0,true);
 }
 if(fx<=0)return;

 const reveal=Math.min(1,fx*1.65);
 const finish=Math.max(0,1-Math.abs(fx-.28)/.28);
 drawPlazaImageFit(plazaEchoFxImgs[0],x,485,205,225,.66*reveal,0,true);
 drawPlazaImageFit(plazaEchoFxImgs[1],x,470,190,240,.56*reveal,0,true);
 drawPlazaImageFit(plazaEchoFxImgs[2],x,470,185,190,.44*reveal,0,true);
 if(finish>0)drawPlazaImageFit(plazaEchoFxImgs[3],x,490,230,230,.42*finish,0,true);
}
function drawPlazaNameGate(){
 if(!stolenPlazaPlayed)return;
 const heard=plazaEchoes.filter(Boolean).length;
 const idx=plazaSolved?3:Math.min(2,heard);
 const im=plazaNameGateImgs[idx];
 const gx=8880;
 if(im){
   const glow=idx>0?.08+.05*Math.sin(p.anim*2.1):0;
   const gy=plazaVisualGroundY(gx);
   if(glow>0)drawPlazaImageBottom(im,gx,gy,338,glow,false,true);
   drawPlazaImageBottom(im,gx,gy,338,plazaSolved?.88:.96,false,false);
   return;
 }
 // Fallback de segurança.
 ctx.save();ctx.strokeStyle="rgba(115,96,62,.75)";ctx.lineWidth=4;
 ctx.strokeRect(gx-65,310,130,280);ctx.restore();
}
function drawStolenNamesPlaza(){
 if(!bridgeCrossedPlayed)return;
 const pc=p.x+p.w/2;
 ctx.save();ctx.translate(-cam,0);

 // As oito placas agora são objetos únicos, não retângulos genéricos.
 const plateSeed=[
   [8030,345,-.08],[8140,310,.06],[8260,365,-.04],[8385,300,.09],
   [8510,350,-.07],[8625,315,.05],[8750,370,-.10],[8820,325,.08]
 ];
 plateSeed.forEach((a,i)=>{
   const drift=plazaSolved&&collectorGlimpseTimer>0?Math.min(85,(6.5-collectorGlimpseTimer)*14):0;
   const bob=Math.sin(p.anim*1.35+i)*4.2;
   const px=a[0]+drift,py=a[1]+bob;
   ctx.save();
   ctx.strokeStyle="rgba(103,88,61,.44)";ctx.lineWidth=1.5;
   ctx.beginPath();ctx.moveTo(px,a[1]-82);ctx.lineTo(px,py-30);ctx.stroke();
   ctx.restore();
   drawStolenNamePlate(px,py,104,72,.76,a[2],i);
 });

 // Três relicários: dormente enquanto o eco está preso, desperto depois da Luz.
 story.plazaEchoes?.forEach((ev,i)=>{
   const on=plazaEchoes[i],clear=plazaEchoGuardDefeated(i);
   const x=ev.x;
   const im=plazaEchoImgs[i]?.[on?1:0]||plazaEchoImgs[i]?.[0];
   const heights=[205,205,218];
   if(im){
     if(on){
       ctx.save();ctx.shadowColor="rgba(238,202,112,.68)";ctx.shadowBlur=22;
       drawPlazaImageBottom(im,x,plazaVisualGroundY(x),heights[i],.96,false,false);
       ctx.restore();
     }else{
       drawPlazaImageBottom(im,x,plazaVisualGroundY(x),heights[i],clear?.90:.72,false,false);
     }
   }else{
     const gy=plazaVisualGroundY(x);
     ctx.save();ctx.strokeStyle=on?"#e4c57b":"#6c6049";ctx.lineWidth=2;
     ctx.beginPath();ctx.ellipse(x,gy-33,68,18,0,0,Math.PI*2);ctx.stroke();ctx.restore();
   }

   drawPlazaEchoFx(i,x,on);

   // Só a instrução de gameplay continua como texto; a memória em si vive na arte e no diálogo.
   if(!on&&Math.abs(pc-x)<165){
     ctx.save();
     ctx.fillStyle=clear?"rgba(246,221,158,.96)":"rgba(185,168,126,.82)";
     ctx.font="700 10px Georgia";ctx.textAlign="center";
     ctx.shadowColor="rgba(0,0,0,.95)";ctx.shadowBlur=5;
     ctx.fillText(clear?"F · OUVIR O ECO":"O ECO ESTÁ SOB VIGILÂNCIA",x,382);
     ctx.restore();
   }else if(on){
     ctx.save();
     ctx.fillStyle="rgba(241,216,149,.83)";ctx.font="700 9px Georgia";ctx.textAlign="center";
     ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=4;
     ctx.fillText(ev.short,x,382);
     ctx.restore();
   }
 });

 drawPlazaNameGate();

 // Quando os três ecos se completam, um sigilo muito sutil confirma a ruptura entre nome e pessoa.
 if(plazaSolved&&plazaEchoFxImgs[3]){
   const a=.05+.025*Math.sin(p.anim*1.8);
   drawPlazaImageFit(plazaEchoFxImgs[3],8735,455,250,250,a,0,true);
 }

 ctx.restore();
}
function drawCollectorGlimpse(){
 if(collectorGlimpseTimer<=0)return;
 const x=9080,y=590;
 const fade=Math.min(1,collectorGlimpseTimer/1.2);
 const im=plazaAtmosImgs[0];

 ctx.save();ctx.translate(-cam,0);
 if(im){
   const pulse=.74+.06*Math.sin(p.anim*1.7);
   ctx.save();
   ctx.shadowColor="rgba(0,0,0,.92)";ctx.shadowBlur=24;
   drawPlazaImageBottom(im,x,y,330,.82*fade*pulse,false,false);
   ctx.restore();

   // Névoa baixa preserva a ideia de que ainda não vemos o Coletor por inteiro.
   const g=ctx.createLinearGradient(0,430,0,600);
   g.addColorStop(0,"rgba(175,176,162,0)");
   g.addColorStop(.74,"rgba(175,176,162,.08)");
   g.addColorStop(1,"rgba(175,176,162,.24)");
   ctx.fillStyle=g;ctx.globalAlpha=fade;ctx.fillRect(x-185,420,370,180);
 }else{
   // Silhueta mínima de fallback.
   ctx.globalAlpha=.78*fade;ctx.fillStyle="#111310";
   ctx.beginPath();ctx.moveTo(x-86,y);ctx.lineTo(x-62,y-176);ctx.quadraticCurveTo(x,y-290,x+62,y-176);ctx.lineTo(x+86,y);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}

function releaseCollectorPlate(index){
 const angles=[-2.35,-1.9,-1.35,-.85,-.35];
 const a=angles[Math.max(0,Math.min(angles.length-1,index))];
 bossReleasedPlates.push({
   x:bossX+(index%2?28:-28),y:430+index*13,
   vx:Math.cos(a)*145,vy:Math.sin(a)*145-55,
   rot:(index%2?1:-1)*.8,life:2.6,maxLife:2.6,plateIndex:index
 });
}
function spawnCollectorNameProjectile(){
 const sx=bossX+(bossDir<0?-48:48),sy=bossAct===1?405:455;
 const tx=p.x+p.w/2,ty=p.y+p.h*.48;
 const dx=tx-sx,dy=ty-sy,len=Math.max(1,Math.hypot(dx,dy));
 const speed=255;
 bossProjectiles.push({x:sx,y:sy,vx:dx/len*speed,vy:dy/len*speed,w:42,h:16,life:4.2,rot:0,dead:false,plateIndex:Math.floor(bossAnimClock*2)%5});
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
 bossState="intro";bossStateTimer=0;bossAttackClock=1.05;bossAnimClock=0;bossPendingArmorFinish=false;bossPendingPhysicalFinish=false;bossTransitionTimer=0;bossProjectiles=[];bossReleasedPlates=[];
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
 bossPendingArmorFinish=false;bossPendingPhysicalFinish=false;bossTransitionTimer=0;
 bossProjectiles=[];
 for(const q of platforms)if(q.bossBreakable)q.broken=false;
 banner("ATO II · O HOMEM SOB OS NOMES");
 say("Sem a armadura, o Coletor ficou menor — e muito mais rápido.");save();
}
function finishCollectorArmor(){
 if(bossState==="transition"||bossState==="transitionDialogue"||bossAct!==1)return;
 bossState="transition";bossTransitionTimer=COLLECTOR_TRANSITION_DURATION;
 bossProjectiles=[];bossInv=0;p.vx=0;
 banner("OS NOMES CAEM");
 say("A forma monumental do Coletor começa a desabar.");
 save();
}
function finishCollectorTransformation(){
 if(bossState!=="transition"||bossAct!==1)return;
 bossState="transitionDialogue";bossTransitionTimer=0;p.vx=0;save();
 dialogue.open(story.collectorArmorBreak,()=>{
   setTimeout(()=>dialogue.open(story.collectorActTwo,()=>beginCollectorActTwo()),220);
 });
}
function finishCollectorPhysical(){
 if(bossAct!==2)return;
 bossAct=3;bossHp=0;bossState="exhausted";bossStateTimer=0;bossProjectiles=[];bossInv=0;bossPendingPhysicalFinish=false;p.vx=0;
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
 if(bellObtained)return;
 bellObtained=true;bellGiftPresented=true;bellAcquireFx=1.65;
 memoryPulse=Math.max(memoryPulse,1.65);
 playPhase4BellSfx();
 if(!replayMode)localStorage.setItem(BELL_KEY,"yes");
 banner("ITEM · SINO SEM INSCRIÇÃO");
 say("O sino toca sem chamar um nome — e alguma coisa na memória de Jack responde.");
 save();
}
function finishPhase4Progress(){
 if(phase4Complete)return;
 phase4Complete=true;epilogueStep=5;epilogueRunning=false;memoryPulse=2;syncPhase4Music(true);
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
function presentUninscribedBell(){
 epilogueRunning=true;epilogueStep=2;bellGiftPresented=true;p.vx=0;
 input.left=input.right=input.down=input.run=false;input.jump=false;
 save();
 dialogue.open(story.bellGift,()=>{
   banner("SINO SEM INSCRIÇÃO");
   say("Aproxime-se do sino e pressione E para recebê-lo.");
   epilogueRunning=false;save();
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
     memoryPulse=.9;
   });return;
 }
 if(epilogueStep===2){
   if(!bellGiftPresented){presentUninscribedBell();return}
   if(!bellObtained)return;
   epilogueStep=3;save();
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
 if(bossState==="intro"||bossState==="transition"||bossState==="transitionDialogue")return d<330;
 if(bossInv>0)return d<330;

 if(bossAct===1&&d<315){
   bossInv=.86;memoryPulse=1.25;
   const released=5-bossArmor;
   releaseCollectorPlate(released);
   bossArmor=Math.max(0,bossArmor-1);
   bossState="lightHit";bossStateTimer=.42;bossAttackHit=false;
   bossPendingArmorFinish=bossArmor<=0;
   banner("NOME LIBERADO · "+(5-bossArmor)+"/5");
   if(bossArmor>0)say("Uma placa se soltou. O Coletor tenta proteger o que resta.");
   save();return true;
 }
 if(bossAct===2&&d<245){
   bossInv=.78;bossHp=Math.max(0,bossHp-1);memoryPulse=1.0;
   bossX=Math.max(10770,Math.min(11125,bossX+(bossX<pc?-34:34)));
   bossState="lightHit";bossStateTimer=.72;bossAttackHit=false;
   bossPendingPhysicalFinish=bossHp<=0;
   banner("LUZ · "+bossHp+"/5");
   if(bossPendingPhysicalFinish)say("A última resistência cede. O homem sob os nomes já não consegue avançar.");
   else say("A Luz atravessou o que restou da coleção.");
   save();return true;
 }
 return false;
}
function updateCollectorBoss(dt){
 updateCollectorParticles(dt);
 bossAnimClock+=dt;
 bossInv=Math.max(0,bossInv-dt);
 if(!bossStarted||bossResolved)return;
 if(bossState==="transition"){
   bossTransitionTimer=Math.max(0,bossTransitionTimer-dt);
   if(bossTransitionTimer<=0)finishCollectorTransformation();
   return;
 }
 if(dialogue.active)return;

 if(bossAct===1){
   bossDir=(p.x+p.w/2)<bossX?-1:1;
   if(bossState==="idle"){
     bossAttackClock-=dt;
     if(bossAttackClock<=0){
       bossState="windup";bossStateTimer=.44;bossAttackHit=false;
     }
   }else if(bossState==="windup"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){bossState="throw";bossStateTimer=.48;bossAttackHit=false}
   }else if(bossState==="throw"){
     bossStateTimer-=dt;
     if(!bossAttackHit&&bossStateTimer<=.31){
       bossAttackHit=true;spawnCollectorNameProjectile();
     }
     if(bossStateTimer<=0){bossState="recover";bossStateTimer=.34}
   }else if(bossState==="recover"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){bossState="idle";bossAttackClock=1.05+(bossArmor*.06)}
   }else if(bossState==="lightHit"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){bossState="protect";bossStateTimer=.34}
   }else if(bossState==="protect"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){
       if(bossPendingArmorFinish){bossPendingArmorFinish=false;finishCollectorArmor()}
       else{bossState="idle";bossAttackClock=.78}
     }
   }
   return;
 }

 if(bossAct===2){
   const pc=p.x+p.w/2;
   if(bossState==="idle"){
     bossDir=pc<bossX?-1:1;
     const dist=Math.abs(pc-bossX);
     if(dist>82)bossX+=bossDir*58*dt;
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
   }else if(bossState==="lightHit"){
     bossStateTimer-=dt;
     if(bossStateTimer<=0){
       if(bossPendingPhysicalFinish){bossPendingPhysicalFinish=false;finishCollectorPhysical()}
       else{bossState="idle";bossAttackClock=.82}
     }
   }
 }
}
function drawCollectorBossProcedural(){
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
function collectorAct1Image(){
 if(bossState==="idle")return collectorAct1Imgs[Math.floor(bossAnimClock*2.2)%2]||collectorMasterImgs[0];
 if(bossState==="windup")return collectorAct1Imgs[bossStateTimer>.22?2:3]||collectorMasterImgs[0];
 if(bossState==="throw"){
   const q=1-Math.max(0,bossStateTimer)/.48;
   return collectorAct1Imgs[q<.34?4:(q<.68?5:6)]||collectorMasterImgs[0];
 }
 if(bossState==="recover")return collectorAct1Imgs[7]||collectorMasterImgs[0];
 if(bossState==="lightHit"){
   const q=1-Math.max(0,bossStateTimer)/.42;
   return collectorReactionImgs[q<.34?0:(q<.68?1:2)]||collectorMasterImgs[0];
 }
 if(bossState==="protect"){
   const q=1-Math.max(0,bossStateTimer)/.34;
   return collectorReactionImgs[q<.5?3:4]||collectorMasterImgs[0];
 }
 return collectorMasterImgs[0];
}
function collectorTransitionProgress(){
 if(bossState==="transitionDialogue")return 1;
 return Math.max(0,Math.min(1,1-(bossTransitionTimer/COLLECTOR_TRANSITION_DURATION)));
}
function collectorTransitionImage(){
 const q=collectorTransitionProgress();
 const cuts=[.12,.25,.38,.56,.72,.88];
 const idx=q<cuts[0]?0:q<cuts[1]?1:q<cuts[2]?2:q<cuts[3]?3:q<cuts[4]?4:q<cuts[5]?5:6;
 return collectorTransitionImgs[idx]||collectorMasterImgs[idx>=5?1:0];
}
function collectorTransitionTargetH(){
 const hs=[278,270,258,244,232,224,218];
 const q=collectorTransitionProgress();
 const cuts=[.12,.25,.38,.56,.72,.88];
 const idx=q<cuts[0]?0:q<cuts[1]?1:q<cuts[2]?2:q<cuts[3]?3:q<cuts[4]?4:q<cuts[5]?5:6;
 return hs[idx];
}
function collectorAct2Image(){
 if(bossState==="lightHit"){
   const q=1-Math.max(0,bossStateTimer)/.72;
   return collectorAct2Imgs[q<.34?9:(q<.68?10:11)]||collectorMasterImgs[1];
 }
 if(bossState==="windup")return collectorAct2Imgs[5]||collectorMasterImgs[1];
 if(bossState==="dash"){
   const q=1-Math.max(0,bossStateTimer)/.58;
   return collectorAct2Imgs[q<.5?6:7]||collectorMasterImgs[1];
 }
 if(bossState==="recover")return collectorAct2Imgs[8]||collectorMasterImgs[1];
 if(bossState==="idle"){
   const moving=Math.abs((p.x+p.w/2)-bossX)>82;
   if(moving)return collectorAct2Imgs[2+(Math.floor(bossAnimClock*9)%3)]||collectorMasterImgs[1];
   return collectorAct2Imgs[Math.floor(bossAnimClock*2.2)%2]||collectorMasterImgs[1];
 }
 return collectorMasterImgs[1];
}
function drawCollectorPng(im,sx,feet,targetH,flip=false,alpha=1){
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const w=iw*(targetH/ih),x=-w/2,y=feet-targetH;
 ctx.save();ctx.translate(sx,0);ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(flip){ctx.scale(-1,1);ctx.drawImage(im,x,y,w,targetH)}
 else ctx.drawImage(im,x,y,w,targetH);
 ctx.restore();return true;
}
function drawCollectorPlatePng(im,x,y,targetW,alpha=1,rot=0){
 if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 if(!iw||!ih)return false;
 const h=ih*(targetW/iw);
 ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,-targetW/2,-h/2,targetW,h);ctx.restore();return true;
}
function drawCollectorBoss(){
 if(!bossStarted)return;
 const transitionVisual=bossAct===1&&(bossState==="transition"||bossState==="transitionDialogue");
 const bodyIm=transitionVisual?collectorTransitionImage():(bossAct===1?collectorAct1Image():(bossAct===2?collectorAct2Image():collectorMasterImgs[2]));
 if(!bodyIm){drawCollectorBossProcedural();return}

 const sx=bossX-cam,resolved=bossResolved;
 const footFix=visualFootOffsetAt(bossX,590,40);
 const feet=590+footFix;
 const targetH=transitionVisual?collectorTransitionTargetH():(bossAct===1?278:(bossAct===2?218:176));
 const flip=bossDir>0;
 const flash=bossInv>0&&Math.floor(bossInv*18)%2===0;

 drawGroundShadow(sx,feet+2,bossAct===1?62:(bossAct===2?43:36),7,bossAct===1?.31:.25);
 ctx.save();
 if(flash){ctx.globalAlpha=.9;ctx.shadowColor="rgba(242,213,139,.95)";ctx.shadowBlur=28}
 ctx.restore();
 drawCollectorPng(bodyIm,sx,feet,targetH,flip,resolved?.68:1);

 // Cinco placas externas acompanham a armadura real: 5 → 4 → 3 → 2 → 1 → 0.
 if(bossAct===1&&bossArmor>0){
   const pos=[[-42,-174,-.08],[35,-160,.07],[-32,-128,.05],[38,-111,-.06],[0,-82,.02]];
   const firstReleased=5-bossArmor;
   for(let i=firstReleased;i<5;i++){
     const im=collectorArmorImgs[i];if(!im)continue;
     const px=sx+(flip?-pos[i][0]:pos[i][0]),py=feet+pos[i][1];
     drawCollectorPlatePng(im,px,py,i===4?58:54,.96,flip?-pos[i][2]:pos[i][2]);
   }
 }

 if(bossAct===3&&!resolved){
   ctx.save();ctx.fillStyle="rgba(242,218,154,.95)";ctx.font="700 11px Georgia";ctx.textAlign="center";
   ctx.fillText("E · RECONHECER",sx,feet-targetH-18);ctx.restore();
 }
 if(resolved){
   ctx.save();ctx.fillStyle="rgba(229,207,149,.78)";ctx.font="italic 10px Georgia";ctx.textAlign="center";
   ctx.fillText("RECONHECIDO",sx,feet-targetH-14);ctx.restore();
 }

 // Placas libertadas usam os próprios assets do Lote 4.
 for(const r of bossReleasedPlates){
   const a=Math.max(0,r.life/r.maxLife),im=collectorArmorImgs[r.plateIndex];
   if(!drawCollectorPlatePng(im,r.x-cam,r.y,66,a,r.rot))
     drawStolenNamePlate(r.x-cam,r.y,62,20,a,r.rot);
 }
 // Projéteis também são placas reais.
 for(const pr of bossProjectiles){
   const im=collectorArmorImgs[pr.plateIndex];
   if(!drawCollectorPlatePng(im,pr.x-cam,pr.y,58,.94,pr.rot))
     drawStolenNamePlate(pr.x-cam,pr.y,pr.w,pr.h,.9,pr.rot);
 }

 if(!resolved&&bossState!=="transition"&&bossState!=="transitionDialogue"){
   ctx.save();ctx.textAlign="center";ctx.fillStyle="rgba(12,13,12,.78)";ctx.fillRect(W/2-205,102,410,52);
   ctx.strokeStyle="rgba(181,151,91,.65)";ctx.lineWidth=2;ctx.strokeRect(W/2-205,102,410,52);
   ctx.fillStyle="#dfc27a";ctx.font="700 12px Georgia";
   ctx.fillText("O COLETOR DE NOMES · ATO "+bossAct,W/2,122);
   const val=bossAct===1?bossArmor:(bossAct===2?bossHp:1),max=bossAct===1?5:(bossAct===2?5:1);
   ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(W/2-160,134,320,8);
   ctx.fillStyle="#c6aa68";ctx.fillRect(W/2-160,134,320*(val/max),8);
   ctx.restore();
 }
}


function drawUninscribedBell(x,y,scale=1,alpha=1,glowing=false){
 const im=glowing?(bellGlowImg||bellNormalImg):bellNormalImg;
 if(im){
   ctx.save();
   if(glowing){ctx.shadowColor="rgba(238,181,61,.72)";ctx.shadowBlur=22}
   drawPropByHeight(im,x,y+44*scale,92*scale,alpha);
   ctx.restore();
   return;
 }
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
 ctx.shadowColor=glowing?"rgba(245,184,58,.9)":"rgba(235,202,117,.45)";ctx.shadowBlur=glowing?18:9;
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

 // The bell is now a real story item: presented, collected, then carried by Jack.
 if(epilogueStep===2&&bellGiftPresented&&!bellObtained){
   const bx=BELL_WORLD_X,by=BELL_WORLD_Y;
   const near=Math.abs((p.x+p.w/2)-bx)<170;
   const pulse=.55+.18*Math.sin(p.anim*3.2);
   const g=ctx.createRadialGradient(bx,by-42,8,bx,by-42,near?82:62);
   g.addColorStop(0,"rgba(235,202,117,"+(near?.22:.11)+")");g.addColorStop(1,"rgba(235,202,117,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by-42,near?82:62,0,Math.PI*2);ctx.fill();
   drawUninscribedBell(bx,by,1.05,.96,false);
   ctx.fillStyle=near?"rgba(255,225,151,.98)":"rgba(225,205,154,.76)";
   ctx.font="700 11px Georgia";ctx.textAlign="center";
   ctx.shadowColor="rgba(0,0,0,.95)";ctx.shadowBlur=5;
   ctx.fillText(near?"E · RECEBER":"SINO SEM INSCRIÇÃO",bx,by-118-pulse*3);
 }
 if(bellAcquireFx>0){
   const t=1-bellAcquireFx/1.65;
   const alpha=Math.max(0,Math.min(1,bellAcquireFx/.45));
   const bx=p.x+p.w/2,by=p.y-42-Math.sin(Math.min(1,t)*Math.PI)*36;
   const g=ctx.createRadialGradient(bx,by,6,bx,by,94);
   g.addColorStop(0,"rgba(255,222,121,"+(.42*alpha)+")");g.addColorStop(1,"rgba(255,180,51,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,94,0,Math.PI*2);ctx.fill();
   drawUninscribedBell(bx,by,.78,alpha,true);
 }

 // The recurring door returns only as memory: no handle, no destination revealed.
 if(epilogueStep===3||epilogueStep===4){
   const x=11105,y=312;
   const pulse=.72+.18*Math.sin(p.anim*2);
   if(memoryDoorImg){
     ctx.save();
     ctx.shadowColor="rgba(229,184,67,.86)";ctx.shadowBlur=28;
     drawPropByHeight(memoryDoorImg,x,590,304,pulse);
     ctx.restore();
   }else{
     ctx.strokeStyle="rgba(232,202,124,"+pulse+")";ctx.lineWidth=4;
     ctx.shadowColor="#e1bd66";ctx.shadowBlur=22;
     ctx.strokeRect(x-54,y,108,278);
     ctx.setLineDash([7,7]);ctx.globalAlpha=.5;
     ctx.strokeRect(x-42,y+15,84,248);ctx.setLineDash([]);
     ctx.globalAlpha=.18;ctx.fillStyle="#e4c477";ctx.fillRect(x-50,y+4,100,270);
   }
   ctx.globalAlpha=.82;ctx.fillStyle="#e7cf91";ctx.font="italic 10px Georgia";ctx.textAlign="center";
   ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=5;
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
   drawUninscribedBell(W-181,116,.55,.9,true);
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
 drawNobodyBridgeAtmosphere();
 drawStolenNamesPlazaAtmosphere();
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
 p.vx=0;
 doorRevealFx=1.35;
 memoryPulse=Math.max(memoryPulse,.72);
 dialogue.open(story.door,()=>{
   doorOpened=true;
   doorRevealFx=2.2;
   memoryPulse=1.6;
   banner("A CHAVE LEMBROU A PORTA");
   say("A passagem existe enquanto a memória da chave permanecer acesa.");
   save();
 });
}
function interact(){
 if(!running||dialogue.active)return;
 markPlayerAction();
 const pc=p.x+p.w/2;
 if(bossResolved&&epilogueStep===2&&bellGiftPresented&&!bellObtained){
   const d=Math.abs(pc-BELL_WORLD_X);
   if(d>145){say("O Sino sem Inscrição espera alguns passos adiante.");return}
   p.vx=0;
   grantUninscribedBell();
   epilogueStep=3;epilogueRunning=true;save();
   setTimeout(()=>{
     epilogueRunning=false;
     runPhase4Epilogue();
   },950);
   return;
 }
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

 if(e.kind==="ashHound"){
   const motion=Math.abs(e.vx||0);
   const rate=e.state==="chase"?Math.max(7.2,motion/24):
     (e.state==="patrol"?Math.max(4.4,motion/18):1.45);
   e.animClock=(e.animClock||0)+dt*rate;
 }

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
 syncPhase4Music();
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
 bellAcquireFx=Math.max(0,bellAcquireFx-dt);
 doorRevealFx=Math.max(0,doorRevealFx-dt);
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
 if(collectorApproachPlayed&&!arenaEdgePlayed&&p.x+p.w>10495&&pilgrimX<10325){
   p.x=10495-p.w;p.vx=Math.min(0,p.vx);
   if(gateMsg<=0){say("A Peregrina vem logo atrás. Jack espera antes da entrada.");gateMsg=1.5}
 }
 if(arenaEdgePlayed&&!bossStarted&&!bossResolved&&p.x+p.w>10705&&pilgrimX<10512){
   p.x=10705-p.w;p.vx=Math.min(0,p.vx);
   if(gateMsg<=0){say("A Peregrina para diante da arena. Jack espera até ela estar segura.");gateMsg=1.5}
 }
 if(bossStarted&&!bossResolved&&p.x>10480&&p.x<10685){
   p.x=10685;p.vx=Math.max(0,p.vx);
   if(gateMsg<=0){say("A arena fechou atrás de Jack.");gateMsg=1.6}
 }

 p.y+=p.vy*dt;p.on=false;
 for(const q of platforms){
   if(q.broken||!bridgePlatformSolid(q))continue;
   const footX=p.x+p.w/2;
   if(!platformSupportsFoot(q,footX))continue;
   if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){
     p.y=q.y-p.h;p.vy=0;p.on=true;
   }
 }
 if(p.y>780){
   playerLife--;syncHud();
   const wasBridge=p.x>6200&&p.x<7900;
   const wasPlazaCrack=plazaCrackContainsX(p.x+p.w/2);
   if(playerLife<=0)respawn(
     wasBridge?"A Ponte dos Ninguém apagou o chão — o último marco guardou os passos de Jack.":
     wasPlazaCrack?"A Praça rachou sob Jack — o Marco da Praça guardou seus passos.":
     "A estrada tentou apagar Jack."
   );
   else{
     const cp=checkpoints.find(q=>q.id===activeCheckpoint);
     p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;
     if(wasBridge){bridgeFogClock=0;for(const q of platforms)if(q.unstable)q.lightTimer=0}
     say((
       wasBridge?"A névoa apagou a plataforma sob Jack. ":
       wasPlazaCrack?"O piso rachado cedeu sob Jack. ":
       "Um passo desapareceu na névoa. "
     )+playerLife+"/3.");
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
   dialogue.open(story.bridgeFear,()=>{banner("PONTE DOS NINGUÉM");say("Ela não perdeu o medo. Mesmo assim, vai atravessar.");save()})
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
 }else if(collectorApproachPlayed&&!arenaEdgePlayed&&p.x>10420&&pilgrimX>=10320){
   arenaEdgePlayed=true;p.vx=0;pilgrimMode="wait";
   dialogue.open(story.arenaEdge,()=>{
     banner("DIANTE DA CASA DO COLETOR");
     // Depois de "Eu volto", ela caminha os últimos passos e para fora da arena.
     pilgrimMode="walk";save();
   })
 }else if(arenaEdgePlayed&&!bossStarted&&!bossResolved&&p.x>10720&&pilgrimX>=10512&&!pilgrimTerrainJump.active){
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
   const epilogueObjective=epilogueStep===2&&bellGiftPresented&&!bellObtained
     ?"EPÍLOGO: aproxime-se do Sino sem Inscrição e pressione E · RECEBER."
     :[
       "EPÍLOGO: o Coletor está soltando os nomes.",
       "EPÍLOGO: a Peregrina decide se continuará esperando pelo próprio nome.",
       "EPÍLOGO: a Peregrina tem algo para entregar a Jack.",
       "EPÍLOGO: o primeiro toque do sino chamou uma memória de Jack.",
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
 drawBackdrop();
 drawWorld();
 drawJack();
 // Ponte dos Ninguém recebe a mesma composição em primeiro plano usada na Fase 1.
 // Assim Jack parece caminhar dentro da ponte, atrás da borda frontal, não sobre um PNG plano.
 drawNobodyBridgeForegrounds();
 drawMemoryLight();
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
 ui.intro.hidden=true;running=true;last=performance.now();markPlayerAction();syncPhase4Music(true);requestAnimationFrame(loop);
 if(phase4Complete){setTimeout(()=>{if(ui.prototype)ui.prototype.hidden=false},420);return}
 if(!introPlayed){introPlayed=true;setTimeout(()=>dialogue.open(story.opening,()=>{say("A Chave de Madeira de Mara começou a aquecer.");save()}),300)}
};
document.getElementById("phase4Continue")?.addEventListener("click",()=>ui.prototype.hidden=true);
document.getElementById("phase4Menu")?.addEventListener("click",()=>location.href="../index.html#fases");
document.getElementById("phase4Replay")?.addEventListener("click",()=>{location.href="phase4.html?replay=1&new=1"});

function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
addEventListener("pagehide",()=>{save();stopPhase4Music()});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){
   save();
   phase4MusicChannels.forEach(a=>a.pause());
 }else if(running&&phase4MusicEnabled){
   const active=phase4MusicChannels[phase4MusicActiveChannel];
   if(phase4MusicKey&&active.src)active.play().catch(()=>syncPhase4Music(true));
   else syncPhase4Music(true);
 }
});
syncHud();draw();
})();