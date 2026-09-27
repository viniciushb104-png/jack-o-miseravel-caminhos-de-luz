(()=>{"use strict";
const c=document.getElementById("game"),x=c.getContext("2d"),W=1280,H=720,WORLD=9200,G=1500;
const ui={obj:document.querySelector("#objective strong"),gear:document.getElementById("gearValue"),banner:document.getElementById("sectionBanner"),msg:document.getElementById("message"),intro:document.getElementById("intro")};
const input={left:false,right:false,run:false,jump:false,down:false};let running=false,last=performance.now(),cam=0,camY=0,jack=null,jackFrameOverrides={},ameliaMap={},light=0,cool=0,section=-1;
const dialogueRoot=document.getElementById("dialogue");
const dialogue=new window.DialogueSystem(dialogueRoot);
const phaseAudio=new window.GameAudio({
  tracks:{
    village:"../assets/audio/phase2/phase2-village-413.mp3",
    tower:"../assets/audio/phase2/phase2-clock-tower.mp3",
    boss:"../assets/audio/phase2/phase2-boss-last-minute.mp3"
  },
  trackLabels:{
    village:"4:13 — A Vila sem Amanhecer",
    tower:"Engrenagens das 4:13 — A Torre sem Tempo",
    boss:"O Último Minuto — A Sombra de Amélia"
  },
  initialTrack:"village",
  storagePrefix:"jack-phase2-audio",
  volume:0.56,
  duckRatio:0.28
});
phaseAudio.bindToggle(document.getElementById("musicToggle"));
phaseAudio.bindDialogue(dialogueRoot);
phaseAudio.bindNowPlaying(document.getElementById("musicBanner"));
let phase2MusicState="village";
const interactPrompt=document.getElementById("interactPrompt");
const clockCutsceneRoot=document.getElementById("phase2ClockCutscene");
const clockCutsceneVideo=document.getElementById("phase2ClockVideo");
const clockCutsceneSkip=document.getElementById("phase2ClockSkip");
const clockCutscenePlay=document.getElementById("phase2ClockPlay");
const urlParams=new URLSearchParams(location.search),journey=window.JackJourney||null,journeyMode=urlParams.get("journey")==="1",replayMode=urlParams.get("replay")==="1",forceNewRun=urlParams.get("new")==="1",SAVE_KEY="jack-phase2-save",CHECKPOINT_KEY="jack-phase2-checkpoint";
if(replayMode)journey?.beginReplay(2,[SAVE_KEY,CHECKPOINT_KEY]);
if(forceNewRun){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CHECKPOINT_KEY);const keptMode=journeyMode?"?journey=1":(replayMode?"?replay=1":"");history.replaceState(null,"",location.pathname+keptMode)}
let loadedSave=null;if(journeyMode&&!replayMode){try{loadedSave=JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch(e){loadedSave=null}}
let ameliaMet=false, introLorePlayed=false, gearLore=[false,false,false], finalLorePlayed=false,bossUnlocked=false,bossActive=false,bossDefeated=false,clockCutsceneSeen=false,endingSequenceActive=false;const puzzles={sinos:false,janelas:false,sombras:false};let towerMechanism=false;
const arenaPlats=[{x:7580,y:-480,w:250,h:24},{x:7860,y:-565,w:250,h:24},{x:7200,y:-650,w:1700,h:60}];
const boss={x:8360,y:-770,hp:10,maxHp:10,dir:-1,t:0,shot:1.55,invuln:0,spawn:0,cast:0,animT:0};
const bossShots=[];let playerLife=3,playerHit=0;
const ameliaShadowAssets={dialogue:[],transform:[],boss:[],effects:[],map:[]};
const shadowCutscene={active:false,t:0,cue:0};
let checkpointArt={off:null,on:null};
let activeCheckpoint=localStorage.getItem(CHECKPOINT_KEY)||"";
let checkpointProgressSnapshot=null;
const PHASE2_CHECKPOINTS=Object.freeze([
  {id:"village",rank:1,name:"Relógio Congelado",x:5315,groundY:590,respawnX:5135,respawnY:504,renderH:300},
  {id:"tower",rank:2,name:"Lanterna da Torre",x:7355,groundY:590,respawnX:7205,respawnY:504,renderH:300},
  // Equivalente à Última Lanterna da Fase 1: fica no topo, imediatamente antes do chefe.
  {id:"preboss",rank:3,name:"Última Lanterna das 4:13",x:7825,groundY:-395,respawnX:7740,respawnY:-481,renderH:210}
]);
function checkpointRank(id){const cp=PHASE2_CHECKPOINTS.find(z=>z.id===id);return cp?cp.rank:0}
function checkpointIsLit(cp){return checkpointRank(activeCheckpoint)>=cp.rank}
function currentCheckpointRespawn(){
  const cp=PHASE2_CHECKPOINTS.find(z=>z.id===activeCheckpoint);
  return cp?{x:cp.respawnX,y:cp.respawnY}:{x:120,y:470};
}
function respawnAtCheckpoint(message){
  restoreCheckpointProgress();
  const r=currentCheckpointRespawn();
  p.x=r.x;p.y=r.y;p.vx=0;p.vy=0;p.on=false;playerHit=.45;
  saveJourney();
  if(message)say(message);
}
function captureCheckpointProgress(){
  checkpointProgressSnapshot={
    ameliaMet:!!ameliaMet,introLorePlayed:!!introLorePlayed,
    gearLore:gearLore.map(Boolean),gears:gears.map(g=>!!g.got),
    puzzles:{...puzzles},bells:bells.map(z=>!!z.on),
    windows:windows.map(z=>!!z.on),shadows:shadowSeals.map(z=>!!z.on),
    towerSeals:towerSeals.map(z=>!!z.on),enemies:enemies.map(e=>!!e.dead),
    bellStep,windowStep,shadowStep,towerStep,towerMechanism:!!towerMechanism
  };
}
function restoreCheckpointProgress(){
  const s=checkpointProgressSnapshot;if(!s)return;
  ameliaMet=!!s.ameliaMet;introLorePlayed=!!s.introLorePlayed;
  if(Array.isArray(s.gearLore))gearLore=s.gearLore.map(Boolean).slice(0,3);
  if(Array.isArray(s.gears))gears.forEach((g,i)=>g.got=!!s.gears[i]);
  if(s.puzzles)Object.keys(puzzles).forEach(k=>puzzles[k]=!!s.puzzles[k]);
  if(Array.isArray(s.bells))bells.forEach((z,i)=>z.on=!!s.bells[i]);
  if(Array.isArray(s.windows))windows.forEach((z,i)=>z.on=!!s.windows[i]);
  if(Array.isArray(s.shadows))shadowSeals.forEach((z,i)=>z.on=!!s.shadows[i]);
  if(Array.isArray(s.towerSeals))towerSeals.forEach((z,i)=>z.on=!!s.towerSeals[i]);
  if(Array.isArray(s.enemies))enemies.forEach((e,i)=>e.dead=!!s.enemies[i]);
  bellStep=Number(s.bellStep)||0;windowStep=Number(s.windowStep)||0;
  shadowStep=Number(s.shadowStep)||0;towerStep=Number(s.towerStep)||0;
  towerMechanism=!!s.towerMechanism;
  ui.gear.textContent=gears.filter(z=>z.got).length+"/3";
}
function updateCheckpoints(){
  const px=p.x+p.w/2,feet=p.y+p.h;
  for(const cp of PHASE2_CHECKPOINTS){
    if(checkpointIsLit(cp))continue;
    if(Math.abs(px-cp.x)<175&&Math.abs(feet-cp.groundY)<135){
      activeCheckpoint=cp.id;
      localStorage.setItem(CHECKPOINT_KEY,activeCheckpoint);
      captureCheckpointProgress();
      playerLife=3;
      banner("LUZ ANCORADA — CHECKPOINT ATIVADO");
      say(cp.name+" aceso. A abóbora guardará seu retorno.");
      saveJourney();
      break;
    }
  }
}
const lore={
arrival:[
{speaker:"JACK",portrait:"jack",expression:1,text:"Outra vila. Outra noite. E nenhum sinal do amanhecer."},
{speaker:"JACK",portrait:"jack",expression:2,text:"Curioso... até os relógios quebrados daqui conseguiram concordar: 4:13."},
{speaker:"???",text:"Não toque nos relógios, forasteiro. Eles já dão trabalho suficiente parados."}
],
amelia:[
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:1,text:"Você não é daqui."},
{speaker:"JACK",portrait:"jack",expression:2,text:"Foi a lanterna que denunciou ou o fato de eu ainda estar andando para algum lugar?"},
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:0,text:"Sou Amélia Vesper. Relojoeira. Quando eu consertar o relógio da praça, o sol vai nascer."},
{speaker:"JACK",portrait:"jack",expression:1,text:"Há quanto tempo está tentando?"},
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:2,text:"Desde ontem."},
{speaker:"JACK",portrait:"jack",expression:3,text:"E quando foi ontem?"},
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:5,text:"... Encontre as três engrenagens. Horas. Minutos. Amanhecer. Depois conversamos."}
],
gears:[
[{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:5,text:"A Engrenagem das Horas... ainda estava aqui."},{speaker:"JACK",portrait:"jack",expression:1,text:"Você fala dela como quem esperava que tivesse desaparecido."}],
[{speaker:"JACK",portrait:"jack",expression:1,text:"Minutos. Engraçado como poucos deles podem mudar uma vida inteira."},{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:4,text:"Não filosofe com peças de relógio, Jack."}],
[{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:8,text:"A Engrenagem do Amanhecer..."},{speaker:"JACK",portrait:"jack",expression:1,text:"Você não parece feliz por eu ter encontrado."},{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:4,text:"Leve-a até a Torre. Agora."}]
],
tower:[
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:8,text:"Pare. Não coloque as três peças no mecanismo."},
{speaker:"JACK",portrait:"jack",expression:1,text:"Você nunca quis consertar o relógio."},
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:6,text:"Eu só precisava de mais cinco minutos naquela noite."},
{speaker:"JACK",portrait:"jack",expression:1,text:"E desde então mantém todo mundo preso nesses cinco minutos."},
{speaker:"AMÉLIA VESPER",portrait:"amelia",expression:7,text:"Se pudesse voltar à pior noite da sua vida... não voltaria?"},
{speaker:"JACK",portrait:"jack",expression:5,text:"Toda noite."},
{speaker:"JACK",portrait:"jack",expression:1,text:"Mas uma lanterna não serve para apagar o que aconteceu. Serve para enxergar o caminho depois."}
],
shadowReveal:[
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:0,text:"Jack... afaste-se. Eu consigo sentir as 4:13 outra vez."},
{speaker:"JACK",portrait:"jack",expression:3,text:"Amélia? O que está acontecendo com a sua sombra?"},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:1,text:"Não é o relógio que está preso naquela noite. Sou eu."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:1,text:"Eu segurei aquele instante com tanta força... que ele aprendeu a me segurar também."},
{speaker:"JACK",portrait:"jack",expression:4,text:"Então solte."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:5,text:"Eu não sei se consigo."}
],
shadowBorn:[
{speaker:"SOMBRA DE AMÉLIA",portrait:"ameliaShadow",expression:0,text:"Cinco minutos... só mais cinco minutos..."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:4,text:"Não escute. Isso é tudo o que eu não consegui deixar ir."},
{speaker:"JACK",portrait:"jack",expression:4,text:"Então eu não vou lutar contra você."},
{speaker:"JACK",portrait:"jack",expression:5,text:"Vou lutar contra o minuto que te prendeu."}
],
clockPrelude:[
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:0,text:"Jack... ele ainda está parado."},
{speaker:"JACK",portrait:"jack",expression:1,text:"Então talvez esteja esperando você deixá-lo continuar."}
],
final414:[
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:2,text:"Então... era só deixar o minuto passar."},
{speaker:"JACK",portrait:"jack",expression:5,text:"Não. Era aceitar que ele já tinha passado."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:6,text:"Quatro e quatorze..."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:8,text:"Eu tinha esquecido que existia um minuto depois."},
{speaker:"JACK",portrait:"jack",expression:5,text:"Sempre existe."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:7,text:"E agora?"},
{speaker:"JACK",portrait:"jack",expression:5,text:"Agora você vive nele."},
{speaker:"AMÉLIA VESPER",portrait:"ameliaFinal",expression:9,text:"... Então eu vou tentar."}
]};
function openDialogue(lines,onComplete){
  input.left=input.right=input.down=false;p.vx=0;
  const bossPortrait=Array.isArray(lines)&&lines.some(line=>line?.portrait==="ameliaReveal"||line?.portrait==="ameliaFinal"||line?.portrait==="ameliaShadow");
  dialogueRoot.classList.toggle("amelia-boss-dialogue",bossPortrait);
  dialogue.open(lines,()=>{
    dialogueRoot.classList.remove("amelia-boss-dialogue");
    if(onComplete)onComplete();
  });
}
function finishClockCutscene(){
  clockPreludeVisualActive=false;
  dialogueRoot.classList.remove("clock-prelude");
  if(!clockCutsceneRoot||clockCutsceneRoot.hidden)return;
  clockCutsceneVideo?.pause();
  clockCutsceneRoot.classList.remove("is-playing");
  clockCutsceneRoot.hidden=true;
  if(clockCutscenePlay)clockCutscenePlay.hidden=true;
  clockCutsceneSeen=true;
  phase2MusicState="tower";
  phaseAudio.switchTrack("tower",{fadeOut:0,fadeIn:1300});
  banner("4:14 — O PRÓXIMO MINUTO");
  saveJourney();
  openDialogue(lore.final414,()=>{
    endingSequenceActive=false;
    say("4:14. Pela primeira vez, a vila tem um minuto depois.");
    saveJourney();
  });
}
function playClockCutscene(){
  clockPreludeVisualActive=false;
  dialogueRoot.classList.remove("clock-prelude");
  endingSequenceActive=true;
  input.left=input.right=input.down=false;
  p.vx=0;p.vy=0;
  phaseAudio.fadeOut(650);
  if(!clockCutsceneRoot||!clockCutsceneVideo){
    clockCutsceneSeen=true;endingSequenceActive=false;saveJourney();return;
  }
  clockCutsceneRoot.hidden=false;
  clockCutsceneRoot.classList.add("is-playing");
  if(clockCutscenePlay)clockCutscenePlay.hidden=true;
  try{clockCutsceneVideo.currentTime=0}catch(_){}
  const attempt=clockCutsceneVideo.play();
  if(attempt&&typeof attempt.catch==="function"){
    attempt.catch(()=>{
      if(clockCutscenePlay)clockCutscenePlay.hidden=false;
    });
  }
}
function startClockEnding(){
  if(clockCutsceneSeen)return;
  clockPreludeVisualActive=true;
  dialogueRoot.classList.add("clock-prelude");
  endingSequenceActive=true;
  input.left=input.right=input.down=false;
  p.vx=0;p.vy=0;
  phase2MusicState="tower";
  phaseAudio.switchTrack("tower",{fadeOut:900,fadeIn:900});
  banner("O ÚLTIMO MINUTO FOI DISSIPADO");
  openDialogue(lore.clockPrelude,playClockCutscene);
}
clockCutsceneVideo?.addEventListener("ended",finishClockCutscene);
clockCutsceneVideo?.addEventListener("error",()=>{
  if(clockCutsceneRoot&&!clockCutsceneRoot.hidden&&clockCutscenePlay){
    clockCutscenePlay.hidden=false;
    clockCutscenePlay.textContent="CONTINUAR SEM A CUTSCENE";
  }
});
clockCutsceneSkip?.addEventListener("click",finishClockCutscene);
clockCutscenePlay?.addEventListener("click",()=>{
  if(clockCutscenePlay)clockCutscenePlay.hidden=true;
  const attempt=clockCutsceneVideo?.play();
  if(attempt&&typeof attempt.catch==="function")attempt.catch(()=>finishClockCutscene());
});
function desiredPhase2Track(){
  if(bossActive&&!bossDefeated)return "boss";
  if(p.x>7150||bossUnlocked||shadowCutscene.active)return "tower";
  return "village";
}
function syncPhase2Music(options={}){
  if(!phaseAudio.started)return;
  const next=desiredPhase2Track();
  if(next===phase2MusicState)return;
  phase2MusicState=next;
  phaseAudio.switchTrack(next,{fadeOut:options.fadeOut??900,fadeIn:options.fadeIn??1050});
}
function activateShadowBoss(){
  shadowCutscene.active=false;bossUnlocked=true;bossActive=true;bossDefeated=false;boss.hp=boss.maxHp;boss.t=0;boss.shot=1.55;boss.spawn=1.25;boss.cast=0;boss.animT=0;playerLife=3;playerHit=0;bossShots.length=0;
  // Entrar na luta sempre ancora a Última Lanterna. Assim a morte nunca manda Jack de volta pela fase inteira.
  if(checkpointRank(activeCheckpoint)<checkpointRank("preboss")){
    activeCheckpoint="preboss";
    localStorage.setItem(CHECKPOINT_KEY,activeCheckpoint);
    captureCheckpointProgress();
  }
  saveJourney();
  phase2MusicState="boss";
  phaseAudio.switchTrack("boss",{fadeOut:650,fadeIn:750});
  banner("SOMBRA DE AMÉLIA — O ÚLTIMO MINUTO");say("A dor das 4:13 tomou forma. Use a LUZ para libertá-la.");
}
function startShadowCutscene(){
  finalLorePlayed=true;bossUnlocked=true;bossActive=false;bossDefeated=false;shadowCutscene.active=true;shadowCutscene.t=0;shadowCutscene.cue=0;
  input.left=input.right=input.down=false;p.vx=0;p.vy=0;banner("A SOMBRA DAS 4:13");
}
function nearAmelia(){
  const ameliaX=2638,ameliaGround=430;
  const playerCenter=p.x+p.w/2,playerFeet=p.y+p.h;
  return Math.abs(playerCenter-ameliaX)<155&&Math.abs(playerFeet-ameliaGround)<125&&!shadowCutscene.active&&!bossActive;
}
function solvedCount(){return Object.values(puzzles).filter(Boolean).length}
function allRequired(){return gears.every(g=>g.got)&&Object.values(puzzles).every(Boolean)&&towerMechanism}
function nearTopSeal(){
  const center=p.x+p.w/2,midY=p.y+p.h/2;
  return center>7550&&center<8200&&midY<-285;
}
function interact(){
  if(dialogue.active){dialogue.advance();return}
  if(nearAmelia()){ameliaMet=true;openDialogue(lore.amelia);return}
  if(!nearTopSeal()||bossActive||bossDefeated||shadowCutscene.active)return;
  if(!allRequired()){
    say("SELO DO TOPO: "+solvedCount()+"/3 enigmas · "+gears.filter(g=>g.got).length+"/3 engrenagens · mecanismo "+(towerMechanism?"ativo":"pendente"));
    return;
  }
  // Sempre permite recuperar a sequência se um save/reload interrompeu o diálogo anterior.
  bossUnlocked=false;
  openDialogue(lore.tower,()=>openDialogue(lore.shadowReveal,startShadowCutscene));
}
const checkpointStart=currentCheckpointRespawn();
const p={x:checkpointStart.x,y:checkpointStart.y,w:46,h:86,vx:0,vy:0,dir:1,on:false,coyote:0,buffer:0,anim:0,attack:0};
const plats=[
{x:0,y:590,w:1100,h:130},{x:1160,y:590,w:760,h:130},{x:1350,y:505,w:260,h:32},{x:1660,y:440,w:230,h:32},
{x:1980,y:590,w:1100,h:130},{x:2160,y:500,w:260,h:32},{x:2520,y:430,w:260,h:32},{x:2860,y:500,w:220,h:32},
{x:3150,y:590,w:1150,h:130},{x:3340,y:500,w:220,h:32},{x:3700,y:430,w:240,h:32},{x:4070,y:500,w:220,h:32},
{x:4380,y:590,w:1150,h:130},{x:4550,y:500,w:220,h:32},{x:4890,y:430,w:230,h:32},{x:5250,y:500,w:250,h:32},
{x:5600,y:590,w:1600,h:130},{x:5820,y:500,w:260,h:32},{x:6200,y:420,w:260,h:32},{x:6580,y:500,w:260,h:32},
{x:7200,y:590,w:2000,h:130},
{x:7420,y:505,w:260,h:30},{x:7760,y:430,w:250,h:30},{x:8110,y:350,w:245,h:30},{x:8460,y:270,w:240,h:30},{x:8120,y:190,w:240,h:30},{x:7770,y:110,w:240,h:30},{x:7420,y:30,w:250,h:30},
{x:7760,y:-55,w:260,h:30},{x:8120,y:-140,w:260,h:30},{x:8460,y:-225,w:260,h:30},{x:8110,y:-310,w:280,h:30},{x:7700,y:-395,w:300,h:30}];
const reveal=[{x:1010,y:505,w:150,h:28,t:0},{x:3030,y:475,w:120,h:28,t:0},{x:4260,y:455,w:120,h:28,t:0},{x:8290,y:-65,w:150,h:28,t:0},{x:7560,y:-300,w:150,h:28,t:0}];
const enemyAssets={};
const ENEMY_SPRITES={
  raven:{src:"../assets/game/phase2/enemies/raven/raven-dead-minute.png",cols:4,rows:3,scale:112,anchorY:10},
  specter:{src:"../assets/game/phase2/enemies/specter/specter-413.png",cols:4,rows:3,scale:138,anchorY:12},
  bell:{src:"../assets/game/phase2/enemies/bell-ringer/bell-ringer.png",cols:4,rows:3,scale:150,anchorY:4},
  watcher:{src:"../assets/game/phase2/enemies/window-watcher/window-watcher.png",cols:4,rows:3,scale:118,anchorY:5},
  sentinel:{src:"../assets/game/phase2/enemies/clock-sentinel/clock-sentinel.png",cols:4,rows:3,scale:164,anchorY:4}
};
const enemies=[
  {type:"raven",x:760,y:430,a:610,b:1020,d:1,hp:1,maxHp:1,speed:92,phase:0},
  {type:"raven",x:1510,y:355,a:1280,b:1810,d:-1,hp:1,maxHp:1,speed:105,phase:1.7},
  {type:"specter",x:2280,y:500,a:2050,b:2470,d:1,hp:2,maxHp:2,speed:54,phase:.8},
  {type:"specter",x:2920,y:455,a:2700,b:3070,d:-1,hp:2,maxHp:2,speed:58,phase:2.4},
  {type:"bell",x:3440,y:548,a:3240,b:3650,d:1,hp:2,maxHp:2,speed:42,phase:.3},
  {type:"bell",x:4040,y:548,a:3890,b:4230,d:-1,hp:2,maxHp:2,speed:44,phase:1.1},
  {type:"watcher",x:4700,y:548,a:4470,b:4970,d:1,hp:1,maxHp:1,speed:118,phase:2.1},
  {type:"watcher",x:5260,y:548,a:5050,b:5480,d:-1,hp:1,maxHp:1,speed:126,phase:.6},
  {type:"watcher",x:6030,y:548,a:5750,b:6370,d:1,hp:1,maxHp:1,speed:132,phase:1.4},
  {type:"sentinel",x:6820,y:548,a:6530,b:7090,d:-1,hp:3,maxHp:3,speed:38,phase:.4},
  {type:"sentinel",x:7480,y:463,a:7360,b:7660,d:1,hp:3,maxHp:3,speed:34,phase:2.8}
];
const enemyProjectiles=[];
const gears=[{x:1870,y:385,n:"ENGRENAGEM DAS HORAS",got:false},{x:4240,y:450,n:"ENGRENAGEM DOS MINUTOS",got:false},{x:6750,y:450,n:"ENGRENAGEM DO AMANHECER",got:false}];
// A ordem física é propositalmente embaralhada. A solução narrativa continua 0→1→2→3.
const bells=[
  {x:3265,y:600,id:2,on:false,title:"AMÉLIA RELOJOEIRA"},
  {x:3565,y:600,id:0,on:false,title:"AMÉLIA CRIANÇA"},
  {x:3865,y:600,id:3,on:false,title:"AMÉLIA E A TORRE"},
  {x:4165,y:600,id:1,on:false,title:"AMÉLIA APRENDIZ"}
];let bellStep=0;
const bellAssets={bases:[],animated:[]};
const bellAnim={ringing:-1,t:0,wrong:-1,wrongT:0};
const bellSfx=new Audio("../assets/game/phase2/audio/sfx/soundreality-bell-fx-410608.mp3");
bellSfx.preload="auto";bellSfx.volume=1;
function playBellSfx(){try{bellSfx.pause();bellSfx.currentTime=0;const q=bellSfx.play();if(q&&q.catch)q.catch(()=>{});}catch(e){}}
const bellLore=[
  "Uma infância antes das 4:13.",
  "O tempo virou ofício.",
  "A aprendiz tornou-se relojoeira.",
  "E então veio a Torre."
];
const windows=[{x:4620,y:390,on:false},{x:4910,y:320,on:false},{x:5200,y:390,on:false}];let windowStep=0;
const shadowSeals=[{x:5850,y:455,on:false},{x:6250,y:375,on:false},{x:6640,y:455,on:false}];let shadowStep=0;
const towerSeals=[{x:7850,y:55,on:false},{x:8350,y:-185,on:false}];let towerStep=0;
const sections=[{x:0,n:"ESTRADA DAS LANTERNAS MORTAS"},{x:1100,n:"VILA BAIXA"},{x:1980,n:"PRAÇA DAS 4:13"},{x:3150,n:"DISTRITO DOS SINOS"},{x:4380,n:"JANELAS APAGADAS"},{x:5600,n:"CAMINHO DA TORRE"},{x:7200,n:"A TORRE DAS 4:13"}];
if(loadedSave){
  if(typeof loadedSave.activeCheckpoint==="string"&&PHASE2_CHECKPOINTS.some(z=>z.id===loadedSave.activeCheckpoint)){activeCheckpoint=loadedSave.activeCheckpoint;localStorage.setItem(CHECKPOINT_KEY,activeCheckpoint)}
  p.x=Number.isFinite(loadedSave.x)?loadedSave.x:p.x;p.y=Number.isFinite(loadedSave.y)?loadedSave.y:p.y;p.dir=loadedSave.dir===-1?-1:1;
  ameliaMet=!!loadedSave.ameliaMet;introLorePlayed=!!loadedSave.introLorePlayed;finalLorePlayed=!!loadedSave.finalLorePlayed;bossUnlocked=!!loadedSave.bossUnlocked;bossActive=!!loadedSave.bossActive;bossDefeated=!!loadedSave.bossDefeated;clockCutsceneSeen=!!loadedSave.clockCutsceneSeen;towerMechanism=!!loadedSave.towerMechanism;
  playerLife=Math.max(1,Math.min(3,Number(loadedSave.playerLife)||3));boss.hp=Math.max(0,Math.min(boss.maxHp,Number.isFinite(Number(loadedSave.bossHp))?Number(loadedSave.bossHp):boss.maxHp));
  if(Array.isArray(loadedSave.gears))gears.forEach((g,i)=>g.got=!!loadedSave.gears[i]);
  if(loadedSave.puzzles)Object.keys(puzzles).forEach(k=>puzzles[k]=!!loadedSave.puzzles[k]);
  if(Array.isArray(loadedSave.bells))bells.forEach((z,i)=>z.on=!!loadedSave.bells[i]);
  if(Array.isArray(loadedSave.windows))windows.forEach((z,i)=>z.on=!!loadedSave.windows[i]);
  if(Array.isArray(loadedSave.shadows))shadowSeals.forEach((z,i)=>z.on=!!loadedSave.shadows[i]);
  if(Array.isArray(loadedSave.towerSeals))towerSeals.forEach((z,i)=>z.on=!!loadedSave.towerSeals[i]);
  if(Array.isArray(loadedSave.enemies))enemies.forEach((e,i)=>e.dead=!!loadedSave.enemies[i]);
  if(Array.isArray(loadedSave.gearLore))gearLore=loadedSave.gearLore.map(Boolean).slice(0,3);
  bellStep=Number(loadedSave.bellStep)||0;windowStep=Number(loadedSave.windowStep)||0;shadowStep=Number(loadedSave.shadowStep)||0;towerStep=Number(loadedSave.towerStep)||0;
  if(loadedSave.checkpointProgressSnapshot&&typeof loadedSave.checkpointProgressSnapshot==="object")checkpointProgressSnapshot=loadedSave.checkpointProgressSnapshot;
  ui.gear.textContent=gears.filter(z=>z.got).length+"/3";
}
// Recuperação de progresso: evita soft-lock em saves feitos durante diálogos/cutscenes
// e corrige flags antigas quando os próprios elementos da fase já estão concluídos.
// Normaliza o puzzle dos sinos após reload/save antigo: somente as memórias
// anteriores ao passo atual podem permanecer acesas.
bellStep=Math.max(0,Math.min(4,Number(bellStep)||0));
if(bellStep>=4||bells.every(z=>z.on)){
  bellStep=4;puzzles.sinos=true;bells.forEach(z=>z.on=true);
}else{
  puzzles.sinos=false;
  bells.forEach(z=>z.on=z.id<bellStep);
}
if(windowStep>=3||windows.every(z=>z.on)){windowStep=3;puzzles.janelas=true}
if(shadowStep>=3||shadowSeals.every(z=>z.on)){shadowStep=3;puzzles.sombras=true}
if(towerStep>=2||towerSeals.every(z=>z.on)){towerStep=2;towerMechanism=true}
if(activeCheckpoint&&!checkpointProgressSnapshot)captureCheckpointProgress();
if(finalLorePlayed&&!bossActive&&!bossDefeated){
  finalLorePlayed=false;
  bossUnlocked=false;
}
function img(src){return new Promise((r,j)=>{const i=new Image;i.onload=()=>r(i);i.onerror=j;i.src=src+(src.includes("?")?"&":"?")+"v=p2jackfix2"})}
const enemyFrames={};
function cropEnemyCell(image,cfg,col,row){
  const sw=Math.floor(image.naturalWidth/cfg.cols),sh=Math.floor(image.naturalHeight/cfg.rows);
  const sx=col*sw,sy=row*sh;
  const cell=document.createElement("canvas");cell.width=sw;cell.height=sh;
  const cc=cell.getContext("2d",{willReadFrequently:true});cc.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
  let data;try{data=cc.getImageData(0,0,sw,sh).data}catch(_){return cell}
  let minX=sw,minY=sh,maxX=-1,maxY=-1;
  for(let yy=0;yy<sh;yy+=2)for(let xx=0;xx<sw;xx+=2){
    if(data[(yy*sw+xx)*4+3]>20){minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy)}
  }
  if(maxX<0)return cell;
  const pad=8;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(sw-1,maxX+pad);maxY=Math.min(sh-1,maxY+pad);
  const out=document.createElement("canvas");out.width=maxX-minX+1;out.height=maxY-minY+1;
  out.getContext("2d").drawImage(cell,minX,minY,out.width,out.height,0,0,out.width,out.height);
  return out;
}
Object.entries(ENEMY_SPRITES).forEach(([key,cfg])=>{
  img(cfg.src).then(image=>{
    enemyAssets[key]=image;enemyFrames[key]=[];
    for(let row=0;row<cfg.rows;row++)for(let col=0;col<cfg.cols;col++)enemyFrames[key].push(cropEnemyCell(image,cfg,col,row));
  }).catch(()=>{enemyAssets[key]=null;enemyFrames[key]=[]});
});
const ENEMY_ANIMS={
  raven:{move:[0,1,2,3,2,1],attack:[4,5,6,5],hit:[8],fps:7},
  specter:{move:[0,1,2,3],attack:[4,5,6,5],hit:[8],fps:5},
  bell:{move:[0,1,2,3],attack:[4,5,6,5],hit:[8],fps:4},
  watcher:{move:[0,1,2,3,2,1],attack:[4,5,6,5],hit:[8],fps:7},
  sentinel:{move:[0,1,2,3],attack:[4,5,6,5],hit:[8],fps:4}
};
function enemyFrameIndex(e){
  const def=ENEMY_ANIMS[e.type]||ENEMY_ANIMS.raven,dist=Math.abs((p.x+p.w/2)-e.x);
  const seq=e.hitT>0?def.hit:(dist<215?def.attack:def.move);
  return seq[Math.floor((p.anim+(e.phase||0))*def.fps)%seq.length]||0;
}
function drawEnemy(e){
  if(e.dead)return;
  const cfg=ENEMY_SPRITES[e.type],sprite=(enemyFrames[e.type]||[])[enemyFrameIndex(e)];
  const bob=e.type==="raven"?Math.sin(p.anim*5.2+(e.phase||0))*8:e.type==="specter"?Math.sin(p.anim*3.1+(e.phase||0))*6:0;
  if(!sprite){x.save();x.fillStyle="#26172e";x.strokeStyle="#d69b43";x.lineWidth=3;x.beginPath();x.arc(e.x,e.y-35+bob,28,0,Math.PI*2);x.fill();x.stroke();x.restore();return}
  const ratio=sprite.width/Math.max(1,sprite.height),dh=cfg.scale,dw=dh*ratio,dy=e.y-dh+cfg.anchorY+bob;
  x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  if(e.hitT>0){x.globalAlpha=.74+Math.sin(p.anim*28)*.16;x.shadowColor="#ffe18a";x.shadowBlur=16}
  if(e.d<0){x.translate(e.x,0);x.scale(-1,1);x.drawImage(sprite,-dw/2,dy,dw,dh)}
  else x.drawImage(sprite,e.x-dw/2,dy,dw,dh);
  x.restore();
}
function hurtJackFromEnemy(e){
  if(playerHit>0||bossActive||bossDefeated)return;
  playerLife=Math.max(0,playerLife-1);playerHit=1.15;
  p.vx=p.x<e.x?-235:235;p.vy=-285;
  if(playerLife<=0){
    playerLife=3;
    respawnAtCheckpoint("As 4:13 engoliram Jack por um instante. A lanterna reacendeu seu caminho.");
  }else say("A distorção temporal atingiu Jack — "+playerLife+"/3 luzes.");
}
function updateEnemies(dt){
  for(const e of enemies){
    if(e.dead)continue;
    e.hitT=Math.max(0,(e.hitT||0)-dt);
    const pc=p.x+p.w/2,dist=pc-e.x;
    let speed=e.speed||60;
    if(e.type==="watcher"&&Math.abs(dist)<310){e.d=Math.sign(dist)||e.d;speed*=1.5}
    else if(e.type==="specter"&&Math.abs(dist)<360){e.d=Math.sign(dist)||e.d;speed*=.72}
    else if(e.type==="raven"&&Math.abs(dist)<300){e.d=Math.sign(dist)||e.d;speed*=1.28}
    e.x+=e.d*speed*dt;
    if(e.x<e.a){e.x=e.a;e.d=1}else if(e.x>e.b){e.x=e.b;e.d=-1}
    const vertical=e.type==="raven"?120:e.type==="specter"?105:78;
    if(Math.abs(dist)<46&&Math.abs((p.y+p.h/2)-(e.y-35))<vertical)hurtJackFromEnemy(e);
  }
}
function buildCleanJackFrame(img,frame,eraseRects=[]){
  const cfg=window.JACK_ANIMATIONS,cell=cfg?.cell||320,cols=cfg?.cols||8;
  const canvas=document.createElement("canvas");canvas.width=cell;canvas.height=cell;
  const cx=canvas.getContext("2d"),col=frame%cols,row=Math.floor(frame/cols);
  cx.clearRect(0,0,cell,cell);
  cx.drawImage(img,col*cell,row*cell,cell,cell,0,0,cell,cell);
  eraseRects.forEach(([rx,ry,rw,rh])=>cx.clearRect(rx,ry,rw,rh));
  return canvas;
}
function buildJackFrameOverrides(img){
  // O atlas mestre tem invasões entre as células 25/26.
  // A mesma limpeza usada na Fase 1 remove o resíduo e o "pé na cabeça".
  return {
    25:buildCleanJackFrame(img,25,[[260,0,60,320]]),
    26:buildCleanJackFrame(img,26,[[126,0,76,82],[126,82,54,30],[202,0,28,32]])
  };
}
img("../assets/game/phase1/sprites-hd/jack-atlas-hd.png").then(i=>{jack=i;jackFrameOverrides=buildJackFrameOverrides(i)}).catch(()=>{});
const phase2Backgrounds={village1:null,village2:null,village3:null,tower:null};
[
  ["village1","phase2-bg-01-estrada-vila.png"],
  ["village2","phase2-bg-02-praca-vila.png"],
  ["village3","phase2-bg-03-caminho-torre.png"],
  ["tower","phase2-bg-04-interior-torre.png"]
].forEach(([key,file])=>{
  img("../assets/game/phase2/backgrounds-hd/"+file).then(i=>phase2Backgrounds[key]=i).catch(()=>{});
});
const environmentSprites={village:{},tower:{}};
let clockDialogueSprite=null,clockPreludeVisualActive=false;
const villagePlatformFiles=[
  "vila-plataforma-longa-baixa.png","vila-plataforma-longa-folhas.png","vila-plataforma-longa-ruinas.png",
  "vila-plataforma-media-folhas.png","vila-plataforma-media-vinhas.png","vila-plataforma-curta-a.png",
  "vila-plataforma-curta-b.png","vila-plataforma-curta-vinhas.png","vila-plataforma-ruina-grande.png",
  "vila-barraca-plataforma.png","vila-plataforma-telhado.png"
];
const towerPlatformFiles=[
  "torre-plataforma-correntes.png","torre-plataforma-larga-engrenagem.png",
  "torre-passarela-grade.png","torre-plataforma-colunas.png"
];
Promise.allSettled(villagePlatformFiles.map(f=>img("../assets/game/phase2/environment-sprites/vila/plataformas/"+f)))
  .then(rs=>rs.forEach((r,i)=>{if(r.status==="fulfilled")environmentSprites.village[villagePlatformFiles[i]]=r.value}));
Promise.allSettled(towerPlatformFiles.map(f=>img("../assets/game/phase2/environment-sprites/torre/plataformas/"+f)))
  .then(rs=>rs.forEach((r,i)=>{if(r.status==="fulfilled")environmentSprites.tower[towerPlatformFiles[i]]=r.value}));
img("../assets/game/phase2/environment-sprites/torre/decoracao/clock-413-dialogue.png").then(i=>clockDialogueSprite=i).catch(()=>{});
img("../assets/game/phase2/checkpoints/checkpoint-phase2-off.png").then(i=>checkpointArt.off=i).catch(()=>{});
img("../assets/game/phase2/checkpoints/checkpoint-phase2-on.png").then(i=>checkpointArt.on=i).catch(()=>{});
[
  ["bases",["base-sino-01.png","base-sino-02.png","base-sino-03.png","base-sino-04.png"]],
  ["animated",["sino-01-amelia-crianca.png?v=4","sino-02-amelia-aprendiz.png?v=5","sino-03-amelia-relojoeira.png?v=4","sino-04-amelia-torre.png?v=4"]]
].forEach(([folder,files])=>{
  Promise.allSettled(files.map(file=>img("../assets/game/phase2/puzzles/bells/"+folder+"/"+file)))
    .then(rs=>bellAssets[folder]=rs.map(r=>r.status==="fulfilled"?r.value:null));
});
const ameliaMapFiles=["neutral","feliz","triste","surpresa","irritada","cansada","assustada"];
Promise.allSettled(ameliaMapFiles.map(n=>img("../assets/game/phase2/amelia-sprites/amelia-map-"+n+".png")))
  .then(rs=>rs.forEach((r,i)=>{if(r.status==="fulfilled")ameliaMap[ameliaMapFiles[i]]=r.value}));
const revealDialogueFiles=["amelia-dialogue-00-neutra.png","amelia-dialogue-01-feliz.png","amelia-dialogue-02-triste.png","amelia-dialogue-03-irritada.png","amelia-dialogue-04-surpresa.png","amelia-dialogue-05-assustada.png","amelia-dialogue-06-determinada.png","amelia-dialogue-07-chorando.png"];
const ameliaFinalPortraitFiles=["amelia-final-01-preocupada.png","amelia-final-02-dor-conflito.png","amelia-final-03-surpresa-realizacao.png","amelia-final-04-determinada.png","amelia-final-05-sombria.png","amelia-final-06-fragil-arrependida.png","amelia-final-07-esperanca-414.png","amelia-final-08-alivio.png","amelia-final-09-reflexiva.png","amelia-final-10-serena-final.png"];
const shadowDialoguePortraitFile="amelia-shadow-dialogue.png";
const transformFiles=["amelia-transform-00-surpresa.png","amelia-transform-01-recua.png","amelia-transform-02-perde-equilibrio.png","amelia-transform-03-cai-joelhos.png","amelia-transform-04-no-chao-inicio.png","amelia-transform-05-no-chao-dor-1.png","amelia-transform-06-no-chao-dor-2.png","amelia-transform-07-grito.png","amelia-transform-08-lanterna-cai.png","amelia-transform-09-primeiras-sombras.png","amelia-transform-10-sombras-envolvem.png","amelia-transform-11-transformacao-1.png","amelia-transform-12-transformacao-2.png"];
const shadowBossFiles=["amelia-shadow-boss-00-idle.png","amelia-shadow-boss-01-walk-1.png","amelia-shadow-boss-02-walk-2.png","amelia-shadow-boss-03-ataque-1.png","amelia-shadow-boss-04-ataque-2.png","amelia-shadow-boss-05-ataque-3.png","amelia-shadow-boss-06-magia.png","amelia-shadow-boss-07-dano.png","amelia-shadow-boss-08-transicao.png"];
const shadowEffectFiles=["effect-00-lanterna-caida.png","effect-01-sombra-1.png","effect-02-sombra-2.png","effect-03-sombra-3.png","effect-04-circulo-magico.png","effect-05-engrenagens.png","effect-06-petalas.png","effect-07-relogio.png","effect-08-brilhos.png"];
const shadowMapFiles=["amelia-map-00-idle.png","amelia-map-01-walk-left-1.png","amelia-map-02-walk-left-2.png","amelia-map-03-walk-right-1.png","amelia-map-04-walk-right-2.png"];
Promise.allSettled(transformFiles.map(f=>img("../assets/game/phase2/amelia-shadow-v2/transformation/"+f)))
  .then(rs=>ameliaShadowAssets.transform=rs.map(r=>r.status==="fulfilled"?r.value:null));
Promise.allSettled(shadowBossFiles.map(f=>img("../assets/game/phase2/amelia-shadow-v2/boss/"+f)))
  .then(rs=>ameliaShadowAssets.boss=rs.map(r=>r.status==="fulfilled"?r.value:null));
Promise.allSettled(shadowEffectFiles.map(f=>img("../assets/game/phase2/amelia-shadow-v2/effects/"+f)))
  .then(rs=>ameliaShadowAssets.effects=rs.map(r=>r.status==="fulfilled"?r.value:null));
Promise.allSettled(shadowMapFiles.map(f=>img("../assets/game/phase2/amelia-shadow-v2/map/"+f)))
  .then(rs=>ameliaShadowAssets.map=rs.map(r=>r.status==="fulfilled"?r.value:null));
const jackPortraitFiles=["jack-00-neutral.png","jack-01-serious.png","jack-02-smirk.png","jack-03-surprised.png","jack-04-determined.png","jack-05-resolved.png"];
const ameliaPortraitFiles=["amelia-00-neutral.png","amelia-01-cansada.png","amelia-02-triste.png","amelia-03-surpresa.png","amelia-04-irritada.png","amelia-05-culpada.png","amelia-06-chorando.png","amelia-07-abatida.png","amelia-08-assustada.png","amelia-09-sorriso-suave.png"];
Promise.all([
  Promise.allSettled(jackPortraitFiles.map(f=>img("../assets/game/phase1/portraits-hd/"+f))),
  Promise.allSettled(ameliaPortraitFiles.map(f=>img("../assets/game/phase2/portraits-hd/"+f))),
  Promise.allSettled(revealDialogueFiles.map(f=>img("../assets/game/phase2/amelia-shadow-v2/dialogue/"+f))),
  Promise.allSettled(ameliaFinalPortraitFiles.map(f=>img("../assets/game/phase2/amelia-sprites/final-dialogue/"+f))),
  Promise.allSettled([shadowDialoguePortraitFile].map(f=>img("../assets/game/phase2/amelia-shadow-v2/dialogue/"+f)))
]).then(([jackRs,ameliaRs,revealRs,finalRs,shadowDialogueRs])=>{
  const normalAmelia=ameliaRs.map(r=>r.status==="fulfilled"?r.value:null);
  ameliaShadowAssets.dialogue=revealRs.map(r=>r.status==="fulfilled"?r.value:null);
  dialogue.setAssets({
    jack:{frames:jackRs.map(r=>r.status==="fulfilled"?r.value:null)},
    amelia:{frames:normalAmelia},
    ameliaReveal:{frames:ameliaShadowAssets.dialogue.some(Boolean)?ameliaShadowAssets.dialogue:normalAmelia},
    ameliaFinal:{frames:finalRs.map(r=>r.status==="fulfilled"?r.value:null)},
    ameliaShadow:{frames:shadowDialogueRs.map(r=>r.status==="fulfilled"?r.value:null)}
  });
});
function say(s){ui.msg.textContent=s;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),1800)}
function banner(s){ui.banner.textContent=s;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),1500)}
let saveClock=0;
function saveJourney(){
  if(!journeyMode||replayMode||!journey?.isActive()||journey.currentPhase()!==2)return;
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    x:p.x,y:p.y,dir:p.dir,activeCheckpoint,ameliaMet,introLorePlayed,gearLore,finalLorePlayed,bossUnlocked,bossActive,bossDefeated,clockCutsceneSeen,towerMechanism,playerLife,bossHp:boss.hp,
    gears:gears.map(g=>!!g.got),puzzles:{...puzzles},bells:bells.map(z=>!!z.on),windows:windows.map(z=>!!z.on),
    shadows:shadowSeals.map(z=>!!z.on),towerSeals:towerSeals.map(z=>!!z.on),enemies:enemies.map(e=>!!e.dead),
    bellStep,windowStep,shadowStep,towerStep,checkpointProgressSnapshot,savedAt:Date.now()
  }));
}
function resetBossAttempt(){
  playerLife=3;
  boss.hp=boss.maxHp;
  boss.x=8360;boss.y=-770;boss.dir=-1;boss.t=0;boss.shot=1.55;boss.spawn=2.15;boss.cast=0;boss.animT=0;boss.invuln=0;
  bossShots.length=0;
  input.left=input.right=input.down=input.run=false;
  p.attack=0;p.buffer=0;
  respawnAtCheckpoint("A Última Lanterna reacendeu Jack. O Último Minuto recuperou toda a força.");
  playerHit=1.65;
  cam=Math.max(0,Math.min(WORLD-W,p.x-W*.36));
  camY=p.x>7150?Math.min(0,p.y-390):0;
  phase2MusicState="boss";
  saveJourney();
}
function lightUse(){if(cool>0)return;cool=.55;light=.48;p.attack=.48;
if(bossActive&&!bossDefeated&&boss.invuln<=0&&Math.hypot(boss.x-(p.x+p.w/2),boss.y-(p.y+30))<315){
  boss.hp=Math.max(0,boss.hp-1);boss.invuln=.32;boss.dir*=-1;say("A LUZ rompe o tempo: "+boss.hp+"/"+boss.maxHp);
  if(boss.hp<=0){
    bossDefeated=true;bossActive=false;bossShots.length=0;
    // A vitória sobre o boss não conclui Halloween II: primeiro vem o encerramento narrativo.
    // O desbloqueio definitivo ficará para depois da futura cutscene da vila + diálogo final.
    saveJourney();
    setTimeout(startClockEnding,420);
  }
}
reveal.forEach(q=>{if(Math.abs((q.x+q.w/2)-(p.x+p.w/2))<310)q.t=3});
if(!puzzles.sinos){
  const pc=p.x+p.w/2;
  const b=bells.find(z=>Math.abs(z.x-pc)<125);
  if(b&&bellAnim.ringing<0&&bellAnim.wrongT<=0){
    bellAnim.ringing=b.id;bellAnim.t=.58;playBellSfx();
    if(b.id===bellStep){
      b.on=true;bellStep++;
      if(bellStep===4){
        puzzles.sinos=true;
        banner("MEMÓRIA RECONSTRUÍDA — OS SINOS");
        say(bellLore[b.id]+"  Memória 4/4 — Antes daquela noite, Amélia também contava as horas para o amanhã.");
      }else{
        say(bellLore[b.id]+"  Memória "+bellStep+"/4");
      }
    }else{
      bellAnim.wrong=b.id;bellAnim.wrongT=.72;
      bells.forEach(z=>z.on=false);bellStep=0;
      say("A memória se perdeu no silêncio... recomece pela infância.");
    }
    saveJourney();
  }
}
const touchSeq=(arr,stepName,order,finish)=>{for(const z of arr){if(Math.abs(z.x-p.x)<125&&Math.abs(z.y-p.y)<145&&!z.on){let step=stepName==="window"?windowStep:stepName==="shadow"?shadowStep:towerStep;if(z===arr[order[step]]){z.on=true;if(stepName==="window")windowStep++;else if(stepName==="shadow")shadowStep++;else towerStep++;const ns=step+1;if(ns===order.length)finish();else say("Selo correto: "+ns+"/"+order.length)}else{arr.forEach(a=>a.on=false);if(stepName==="window")windowStep=0;else if(stepName==="shadow")shadowStep=0;else towerStep=0;say("A ordem se desfez...")}}}};
touchSeq(windows,"window",[0,2,1],()=>{puzzles.janelas=true;say("ENIGMA DAS JANELAS CONCLUÍDO")});
touchSeq(shadowSeals,"shadow",[1,0,2],()=>{puzzles.sombras=true;say("ENIGMA DAS SOMBRAS CONCLUÍDO")});
touchSeq(towerSeals,"tower",[0,1],()=>{towerMechanism=true;say("MECANISMO DA TORRE CONCLUÍDO")});
for(const e of enemies){
  if(e.dead)continue;
  const dist=Math.hypot(e.x-(p.x+p.w/2),(e.y-35)-(p.y+p.h/2));
  if(dist<225){
    e.hp=Math.max(0,(e.hp??e.maxHp??1)-1);e.hitT=.34;e.d=p.x<e.x?1:-1;
    if(e.hp<=0){
      e.dead=true;
      say(({raven:"CORVO DO MINUTO MORTO",specter:"ESPECTRO DAS 4:13",bell:"SINEIRO SEM HORA",watcher:"VIGIA DAS JANELAS",sentinel:"SENTINELA DO RELÓGIO"}[e.type]||"DISTORÇÃO")+" DISSIPADO PELA LUZ");
    }
  }
}
saveJourney();
}
function bind(id,key){const b=document.getElementById(id);["pointerdown","pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>input[key]=ev==="pointerdown"))}
bind("leftBtn","left");bind("rightBtn","right");bind("downBtn","down");document.getElementById("jumpBtn").addEventListener("pointerdown",()=>input.jump=true);document.getElementById("lightBtn").addEventListener("pointerdown",lightUse);document.getElementById("interactBtn").addEventListener("pointerdown",interact);interactPrompt.addEventListener("click",interact);
addEventListener("keydown",e=>{if(endingSequenceActive&&!dialogue.active)return;if(["ArrowLeft","a","A"].includes(e.key))input.left=true;if(["ArrowRight","d","D"].includes(e.key))input.right=true;if(["ArrowDown","s","S"].includes(e.key))input.down=true;if(e.key==="Shift")input.run=true;if(e.code==="Space"){input.jump=true;e.preventDefault()}if(["f","F"].includes(e.key))lightUse();if(["e","E"].includes(e.key))interact()});
addEventListener("keyup",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=false;if(["ArrowRight","d","D"].includes(e.key))input.right=false;if(["ArrowDown","s","S"].includes(e.key))input.down=false;if(e.key==="Shift")input.run=false});
const startGameBtn=document.getElementById("startGame");if(loadedSave&&journeyMode&&!replayMode){startGameBtn.textContent="✦ CONTINUAR JORNADA";const introCopy=ui.intro.querySelector("span");if(introCopy)introCopy.textContent="A lanterna guardou seu caminho pela Vila sem Amanhecer."}startGameBtn.onclick=()=>{if(journeyMode&&!replayMode)journey?.advanceTo(2);phase2MusicState=desiredPhase2Track();phaseAudio.start(phase2MusicState);ui.intro.hidden=true;running=true;last=performance.now();requestAnimationFrame(loop);setTimeout(()=>{if(bossDefeated&&!clockCutsceneSeen){startClockEnding();return}if(!introLorePlayed){introLorePlayed=true;openDialogue(lore.arrival)}},450)};
function update(dt){syncPhase2Music();if(endingSequenceActive&&!dialogue.active){p.vx=0;p.vy=0;p.anim+=dt;interactPrompt.hidden=true;return}if(dialogue.active){p.vx*=.7;cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.36))-cam)*Math.min(1,dt*5);camY+=((p.x>7150?Math.min(0,p.y-390):0)-camY)*Math.min(1,dt*4);p.anim+=dt;interactPrompt.hidden=true;return}
if(shadowCutscene.active){
  shadowCutscene.t+=dt;p.vx=0;p.vy=0;p.anim+=dt;interactPrompt.hidden=true;
  cam+=(Math.max(0,Math.min(WORLD-W,8050-W*.52))-cam)*Math.min(1,dt*3.2);
  camY+=(-890-camY)*Math.min(1,dt*3.2);
  if(shadowCutscene.t>=2.55&&shadowCutscene.cue<1){shadowCutscene.cue=1;say("AMÉLIA: AAAAAH!")}
  if(shadowCutscene.t>=5.55&&shadowCutscene.cue<2){shadowCutscene.cue=2;banner("A SOMBRA SE DESPRENDE DE AMÉLIA")}
  if(shadowCutscene.t>=7.15){shadowCutscene.active=false;openDialogue(lore.shadowBorn,activateShadowBoss)}
  return
}
cool=Math.max(0,cool-dt);light=Math.max(0,light-dt);p.attack=Math.max(0,p.attack-dt);bellAnim.t=Math.max(0,bellAnim.t-dt);bellAnim.wrongT=Math.max(0,bellAnim.wrongT-dt);if(bellAnim.t<=0)bellAnim.ringing=-1;if(bellAnim.wrongT<=0)bellAnim.wrong=-1;reveal.forEach(q=>q.t=Math.max(0,q.t-dt));p.coyote=p.on?.12:Math.max(0,p.coyote-dt);if(input.jump){p.buffer=.14;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
const speed=input.down?95:(input.run?335:235),dir=(input.right?1:0)-(input.left?1:0);p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
if(p.buffer>0&&p.coyote>0&&!input.down){p.vy=-575;p.on=false;p.coyote=0;p.buffer=0}p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.on=false;
const solids=plats.concat((bossUnlocked||bossActive||bossDefeated)?arenaPlats:[],reveal.filter(q=>q.t>0));for(const q of solids){if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}}
updateCheckpoints();
if(p.y>760){
  if(bossActive&&!bossDefeated)resetBossAttempt();
  else respawnAtCheckpoint(activeCheckpoint?"A abóbora reacende o caminho de Jack.":"Jack retorna ao início da Vila sem Amanhecer.");
}
updateEnemies(dt);
boss.invuln=Math.max(0,boss.invuln-dt);playerHit=Math.max(0,playerHit-dt);
if(bossActive&&!bossDefeated){
  p.x=Math.max(7225,Math.min(8870-p.w,p.x));
  boss.t+=dt;boss.animT+=dt;boss.spawn=Math.max(0,boss.spawn-dt);boss.cast=Math.max(0,boss.cast-dt);
  boss.y=-770+Math.sin(boss.t*1.7)*8;

  if(boss.spawn<=0){
    boss.shot-=dt;
    const preparing=boss.shot<=.72;
    // O Último Minuto continua ameaçador, mas agora anuncia melhor cada ataque.
    // A velocidade cresce devagar para a dificuldade vir da leitura, não de projéteis injustos.
    if(!preparing&&boss.cast<=0){
      boss.x+=boss.dir*(64+Math.min(30,boss.t*.75))*dt;
      if(boss.x<7600){boss.x=7600;boss.dir=1;boss.animT=0}
      if(boss.x>8560){boss.x=8560;boss.dir=-1;boss.animT=0}
    }
    if(boss.shot<=0&&boss.cast<=0){
      boss.cast=.34;
      boss.shot=Math.max(1.02,1.68-boss.t*.006);
      const tx=p.x+p.w/2,ty=p.y+p.h/2,dx=tx-boss.x,dy=ty-boss.y,len=Math.hypot(dx,dy)||1,speed=235+Math.min(70,boss.t*1.35);
      const muzzleX=boss.x+boss.dir*62,muzzleY=boss.y-12;
      bossShots.push({x:muzzleX,y:muzzleY,vx:dx/len*speed,vy:dy/len*speed,r:12,life:5});
    }
  }
  for(let i=bossShots.length-1;i>=0;i--){
    const s=bossShots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(s.life<=0){bossShots.splice(i,1);continue}
    if(playerHit<=0&&Math.abs(s.x-(p.x+p.w/2))<s.r+p.w*.42&&Math.abs(s.y-(p.y+p.h/2))<s.r+p.h*.42){
      bossShots.splice(i,1);
      playerLife--;
      playerHit=1.15;
      if(playerLife<=0){
        // IMPORTANTE: zerar bossShots dentro deste for e continuar iterando causava
        // acesso a um projétil já apagado no frame seguinte, lançando erro e congelando o jogo.
        resetBossAttempt();
        break;
      }else{
        // Um acerto comum só causa recuo e invulnerabilidade curta — não teleporta Jack.
        p.vx=p.x<boss.x?-220:220;
        p.vy=-255;
        say("O tempo atingiu Jack — "+playerLife+"/3 luzes restantes.");
      }
    }
  }
}else if(bossShots.length)bossShots.length=0;
gears.forEach((g,gi)=>{if(!g.got&&Math.abs(g.x-p.x)<70&&Math.abs(g.y-p.y)<120){g.got=true;say(g.n+" RECUPERADA");ui.gear.textContent=gears.filter(z=>z.got).length+"/3";if(!gearLore[gi]){gearLore[gi]=true;setTimeout(()=>openDialogue(lore.gears[gi]),250)}}});
interactPrompt.hidden=!(nearAmelia()||(nearTopSeal()&&!bossActive&&!bossDefeated&&!shadowCutscene.active));
let si=0;for(let i=0;i<sections.length;i++)if(p.x>=sections[i].x)si=i;if(si!==section){section=si;banner(sections[si].n)}
if(bossDefeated)ui.obj.textContent=clockCutsceneSeen?"4:14 — O relógio voltou a andar. A vila ainda espera pelo amanhecer.":"O Último Minuto foi dissipado. O relógio ainda espera pelo próximo minuto.";
else if(bossActive)ui.obj.textContent="BOSS: SOMBRA DE AMÉLIA — O ÚLTIMO MINUTO. Desvie e use F / LUZ para romper a prisão das 4:13.";
else if(!ameliaMet&&p.x<3150)ui.obj.textContent="Encontre a relojoeira da praça e descubra por que tudo parou às 4:13.";
else if(!gears.every(g=>g.got)||solvedCount()<3)ui.obj.textContent="Engrenagens "+gears.filter(z=>z.got).length+"/3 · Enigmas "+solvedCount()+"/3 — use a Luz e observe as pistas.";
else if(!towerMechanism)ui.obj.textContent="Os 3 enigmas foram resolvidos. Suba a Torre e ative os 2 selos temporais com a Luz.";
else ui.obj.textContent="Tudo foi resolvido. Aproxime-se do selo no topo da Torre e pressione E / AÇÃO para chamar Amélia.";
cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.36))-cam)*Math.min(1,dt*5);camY+=((p.x>7150?Math.min(0,p.y-390):0)-camY)*Math.min(1,dt*4);p.anim+=dt;saveClock+=dt;if(saveClock>=.75){saveClock=0;saveJourney()}}
function jackSequenceFrame(sequence,fps){
  if(!sequence?.length)return 0;
  return sequence[Math.floor(p.anim*fps)%sequence.length];
}
function currentJackFrame(){
  const cfg=window.JACK_ANIMATIONS,anims=cfg?.animations;
  if(!anims)return 0;
  if(p.attack>0){
    const duration=cfg.timing?.attackDuration||.48;
    const progress=Math.max(0,Math.min(.999,(duration-p.attack)/duration));
    const seq=anims.attack;
    return seq[Math.min(seq.length-1,Math.floor(progress*seq.length))];
  }
  if(playerHit>.72&&anims.hurt?.length)return anims.hurt[0];
  if(!p.on){
    if(p.vy<-360)return anims.jumpStart[0];
    if(p.vy<-90)return anims.jumpRise[0];
    if(p.vy<120)return anims.jumpApex[0];
    return anims.jumpFall[0];
  }
  if(input.down){
    if(Math.abs(p.vx)>18&&anims.crouchMove?.length)return jackSequenceFrame(anims.crouchMove,5);
    return anims.crouch[0];
  }
  const speed=Math.abs(p.vx);
  if(speed>=18){
    if(input.run&&speed>170)return jackSequenceFrame(anims.run,cfg.timing?.runFps||12);
    return jackSequenceFrame(anims.walk,cfg.timing?.walkFps||9);
  }
  return jackSequenceFrame(anims.idle,cfg.timing?.idleFps||2.4);
}
function drawJack(){
  const py=p.y-camY;
  if(p.on){
    x.save();x.globalAlpha=.18;x.fillStyle="#05030a";
    x.beginPath();x.ellipse(p.x-cam+p.w/2,py+p.h+1,18,3.2,0,0,Math.PI*2);x.fill();x.restore();
  }
  if(!jack){x.fillStyle="#eee";x.fillRect(p.x-cam,py,p.w,p.h);return}
  const cfg=window.JACK_ANIMATIONS||{},idx=currentJackFrame();
  const cell=cfg.cell||320,cols=cfg.cols||8;
  const sx=(idx%cols)*cell,sy=Math.floor(idx/cols)*cell;
  const rw=cfg.render?.width||190,rh=cfg.render?.height||190;
  const dx=p.x-cam+p.w/2-rw/2,dy=py+p.h/2+(cfg.render?.offsetY??-132);
  const cleanFrame=jackFrameOverrides[idx];
  x.save();
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  if(p.dir<0){
    x.translate(dx+rw,0);x.scale(-1,1);
    if(cleanFrame)x.drawImage(cleanFrame,0,0,cleanFrame.width,cleanFrame.height,0,dy,rw,rh);
    else x.drawImage(jack,sx,sy,cell,cell,0,dy,rw,rh);
  }else{
    if(cleanFrame)x.drawImage(cleanFrame,0,0,cleanFrame.width,cleanFrame.height,dx,dy,rw,rh);
    else x.drawImage(jack,sx,sy,cell,cell,dx,dy,rw,rh);
  }
  x.restore();
}

function ameliaMapMood(){
  if(bossDefeated)return "feliz";
  if(finalLorePlayed||bossActive)return "assustada";
  const found=gears.filter(g=>g.got).length;
  if(!ameliaMet)return "cansada";
  if(found===0)return "neutral";
  if(found===1)return "triste";
  if(found===2)return "cansada";
  return "assustada";
}
function drawAmelia(){
  const mood=ameliaMapMood(),sprite=ameliaMap[mood]||ameliaMap.neutral;
  const cx=2638,ground=430,bob=Math.sin(p.anim*2.25)*2;
  x.save();
  x.globalAlpha=.35;x.fillStyle="#000";x.beginPath();x.ellipse(cx,ground-2,48,12,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
  if(sprite){
    const size=180;
    x.drawImage(sprite,cx-size/2,ground-size+bob,size,size);
  }else{
    x.fillStyle="#39273d";x.fillRect(cx-18,ground-78,36,78);
    x.fillStyle="#d8c3ad";x.beginPath();x.arc(cx,ground-91,19,0,Math.PI*2);x.fill();
  }
  if(nearAmelia()&&!dialogue.active){
    x.fillStyle="#ffe7a1";x.strokeStyle="#6e3b20";x.lineWidth=3;
    x.beginPath();x.arc(cx,ground-188+bob,17,0,Math.PI*2);x.fill();x.stroke();
    x.fillStyle="#2a1720";x.font="bold 15px Georgia";x.textAlign="center";x.fillText("E",cx,ground-183+bob);x.textAlign="left";
  }
  x.fillStyle="#f0cf76";x.font="bold 12px Georgia";x.textAlign="center";x.fillText("AMÉLIA",cx,ground+19);x.textAlign="left";
  x.restore();
}
function drawAssetBottom(img,cx,ground,targetH,alpha=1){
  if(!img)return false;
  const iw=img.naturalWidth||img.width||1,ih=img.naturalHeight||img.height||1,w=targetH*(iw/ih);
  x.save();x.globalAlpha=alpha;x.drawImage(img,cx-w/2,ground-targetH,w,targetH);x.restore();return true;
}
function drawPhase2Checkpoints(){
  for(const cp of PHASE2_CHECKPOINTS){
    const lit=checkpointIsLit(cp),sprite=lit?checkpointArt.on:checkpointArt.off;
    if(cp.x<cam-520||cp.x>cam+W+520)continue;
    x.save();
    if(lit){
      const pulse=.84+Math.sin(p.anim*4+cp.x*.002)*.1;
      const glow=x.createRadialGradient(cp.x-45,cp.groundY-145,20,cp.x-45,cp.groundY-145,180);
      glow.addColorStop(0,"rgba(255,190,70,"+(.24*pulse)+")");
      glow.addColorStop(.55,"rgba(255,112,30,"+(.11*pulse)+")");
      glow.addColorStop(1,"rgba(255,80,20,0)");
      x.fillStyle=glow;x.beginPath();x.arc(cp.x-45,cp.groundY-145,180,0,Math.PI*2);x.fill();
    }
    if(sprite){
      const iw=sprite.naturalWidth||sprite.width||1,ih=sprite.naturalHeight||sprite.height||1;
      const h=cp.renderH,w=h*(iw/ih);
      x.drawImage(sprite,cp.x-w/2,cp.groundY-h,w,h);
    }else{
      x.fillStyle=lit?"#d8872c":"#2a2030";x.fillRect(cp.x-90,cp.groundY-190,180,190);
      x.fillStyle=lit?"#ffd36d":"#17121a";x.beginPath();x.arc(cp.x,cp.groundY-55,38,0,Math.PI*2);x.fill();
    }
    x.fillStyle=lit?"#ffe7a1":"#9d8b9f";x.font="bold 12px Georgia";x.textAlign="center";
    x.fillText(lit?"CHECKPOINT ACESO":"CHECKPOINT APAGADO",cp.x,cp.groundY+20);x.textAlign="left";
    x.restore();
  }
}
function drawShadowCutscene(){
  if(!shadowCutscene.active)return;
  const t=shadowCutscene.t,frames=ameliaShadowAssets.transform,effects=ameliaShadowAssets.effects,bossFrames=ameliaShadowAssets.boss;
  const frameDur=.42,transformEnd=frames.length?frames.length*frameDur:5.46;
  const cx=8050,ground=-650,step=Math.min(12,Math.floor(t/frameDur));
  const shake=t>2.45?Math.sin(t*42)*Math.min(9,(t-2.45)*2.4):0;
  x.save();x.translate(shake,0);

  const darkness=Math.min(.72,t/6*.72);
  x.globalAlpha=darkness;x.fillStyle="#170516";x.beginPath();x.arc(cx,ground-130,155+t*28,0,Math.PI*2);x.fill();x.globalAlpha=1;

  if(t<transformEnd){
    const sprite=frames[step]||ameliaShadowAssets.map[0]||ameliaMap.assustada||ameliaMap.cansada;
    const h=step<=2?220:(step<=8?255:310);
    drawAssetBottom(sprite,cx,ground,h);

    if(step>=8&&effects.length){
      const ei=Math.min(3,Math.max(1,step-7)),fx=effects[ei];
      if(fx){x.save();x.globalAlpha=.42;drawAssetBottom(fx,cx+25,ground+5,245,.42);x.restore()}
    }
    if(step===7){
      x.save();x.globalAlpha=.18+.12*Math.sin(t*30);x.fillStyle="#ff5578";x.beginPath();x.arc(cx,ground-150,155,0,Math.PI*2);x.fill();x.restore();
    }
  }else{
    // A Amélia continua caída: quem se ergue é a sombra.
    const sep=Math.min(1,(t-transformEnd)/1.45);
    const fallen=frames[6]||frames[5]||ameliaShadowAssets.map[0];
    const shadow=bossFrames[8]||bossFrames[0];
    drawAssetBottom(fallen,cx-155,ground,235);
    if(effects[3])drawAssetBottom(effects[3],cx+95,ground+8,250,.52);
    if(shadow)drawAssetBottom(shadow,cx+145,ground,225+sep*155);
    else{x.globalAlpha=.55;x.fillStyle="#4b123e";x.beginPath();x.arc(cx+145,ground-135,85+sep*75,0,Math.PI*2);x.fill();x.globalAlpha=1}
  }

  if(t>2.35&&t<3.65){
    x.fillStyle="#fff0c0";x.font="bold 26px Georgia";x.textAlign="center";x.fillText("AAAAAH!",cx,ground-310);x.textAlign="left";
  }
  x.fillStyle="#ffe2a0";x.font="bold 15px Georgia";x.textAlign="center";
  x.fillText(t<transformEnd?"AMÉLIA VESPER":"A SOMBRA SE DESPRENDE",cx,ground+30);x.textAlign="left";
  x.restore();
}
function drawTowerAmelia(){
  if(shadowCutscene.active||!bossUnlocked||(!bossActive&&!bossDefeated))return;
  const fallen=ameliaShadowAssets.transform[6]||ameliaShadowAssets.transform[5];
  if(!fallen)return;
  drawAssetBottom(fallen,8830,-650,215,bossDefeated?1:.82);
  x.save();x.fillStyle="#e9cf86";x.font="bold 12px Georgia";x.textAlign="center";x.fillText(bossDefeated?"AMÉLIA — LIVRE":"AMÉLIA",8830,-624);x.textAlign="left";x.restore();
}
function clamp01(v){return Math.max(0,Math.min(1,v))}
function smooth01(a,b,v){const t=clamp01((v-a)/(b-a));return t*t*(3-2*t)}
function drawBackdropCover(image,focusX=.5,cropTop=0,alpha=1){
  if(!image||alpha<=0)return;
  const iw=image.naturalWidth||image.width||1,ih=image.naturalHeight||image.height||1;
  const sy=Math.max(0,Math.min(ih-1,cropTop)),usableH=Math.max(1,ih-sy);
  const targetAspect=W/H,sourceAspect=iw/usableH;
  let sx=0,sw=iw,sh=usableH;
  if(sourceAspect>targetAspect){
    sw=usableH*targetAspect;
    sx=(iw-sw)*clamp01(focusX);
  }else{
    sh=iw/targetAspect;
  }
  x.save();x.imageSmoothingEnabled=true;x.globalAlpha=alpha;
  x.drawImage(image,sx,sy,sw,sh,0,0,W,H);
  x.restore();
}
function drawPhase2Backdrop(){
  const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#061024");gr.addColorStop(.65,"#17132b");gr.addColorStop(1,"#27131d");x.fillStyle=gr;x.fillRect(0,0,W,H);

  // Três quadros estáveis: não deslizam com a câmera. Só fazem crossfade lento
  // quando Jack muda de distrito, evitando a sensação de vertigem do panorama móvel.
  const pos=p.x+p.w/2;
  const mix12=smooth01(1700,2250,pos),mix23=smooth01(4550,5200,pos);
  let a1=1-mix12,a2=mix12*(1-mix23),a3=mix23;
  if(!phase2Backgrounds.village1&&!phase2Backgrounds.village2&&!phase2Backgrounds.village3)return;
  drawBackdropCover(phase2Backgrounds.village1,.24,0,a1);
  drawBackdropCover(phase2Backgrounds.village2,.48,20,a2);
  drawBackdropCover(phase2Backgrounds.village3,.63,50,a3);

  const shade=x.createLinearGradient(0,0,0,H);
  shade.addColorStop(0,"rgba(5,4,18,.06)");
  shade.addColorStop(.64,"rgba(7,5,16,.13)");
  shade.addColorStop(1,"rgba(3,2,8,.42)");
  x.fillStyle=shade;x.fillRect(0,0,W,H);
}
const TOWER_INTERIOR=Object.freeze({cx:8050,bottom:720,h:2150});
function drawTowerInterior(){
  const image=phase2Backgrounds.tower;
  if(!image)return;
  const iw=image.naturalWidth||image.width||1,ih=image.naturalHeight||image.height||1;
  const h=TOWER_INTERIOR.h,w=h*(iw/ih),left=TOWER_INTERIOR.cx-w/2,top=TOWER_INTERIOR.bottom-h;
  x.save();x.imageSmoothingEnabled=true;
  x.drawImage(image,left,top,w,h);
  // Um véu discreto mantém Jack, selos e plataformas legíveis sobre a pintura.
  const veil=x.createLinearGradient(left,top,left+w,top);
  veil.addColorStop(0,"rgba(5,3,10,.18)");veil.addColorStop(.5,"rgba(5,3,10,.02)");veil.addColorStop(1,"rgba(5,3,10,.18)");
  x.fillStyle=veil;x.fillRect(left,top,w,h);x.restore();
}
function drawClockGear(cx,cy,r,alpha=.72){
  x.save();x.globalAlpha=alpha;x.strokeStyle="#9b6a35";x.lineWidth=Math.max(2,r*.16);
  x.beginPath();x.arc(cx,cy,r*.62,0,Math.PI*2);x.stroke();
  x.lineWidth=Math.max(2,r*.12);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(cx+Math.cos(a)*r*.62,cy+Math.sin(a)*r*.62);x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);x.stroke()}
  x.fillStyle="#3a2725";x.beginPath();x.arc(cx,cy,r*.2,0,Math.PI*2);x.fill();x.restore();
}
function drawClockChain(cx,cy,links=4){
  x.save();x.strokeStyle="#725039";x.lineWidth=3;x.globalAlpha=.72;
  for(let i=0;i<links;i++){x.beginPath();x.ellipse(cx,cy+i*12,5,8,i%2?Math.PI/2:0,0,Math.PI*2);x.stroke()}
  x.restore();
}
function drawFallbackPlatform(q,tower=false){
  x.save();
  x.fillStyle=tower?"#2b2025":(q.y<560?"#4a3b38":"#30252a");x.fillRect(q.x,q.y,q.w,Math.max(30,q.h));
  x.fillStyle=tower?"#b27a3a":"#75604b";x.fillRect(q.x,q.y,q.w,7);
  x.restore();
}
// Mede o recorte opaco e, principalmente, a linha visual onde a pedra/madeira
// realmente começa. A colisão continua em q.y, mas agora o sprite é ancorado
// nessa mesma linha. Isso elimina os trechos em que Jack parecia caminhar no ar
// por causa das margens transparentes diferentes de cada PNG.
const platformSpriteMetaCache=new WeakMap();
function platformSpriteMeta(image){
  if(!image)return null;
  const cached=platformSpriteMetaCache.get(image);if(cached)return cached;
  const iw=image.naturalWidth||image.width||1,ih=image.naturalHeight||image.height||1;
  const cw=Math.max(1,Math.min(320,iw)),ch=Math.max(1,Math.min(260,ih));
  const cv=document.createElement("canvas");cv.width=cw;cv.height=ch;
  const cx=cv.getContext("2d",{willReadFrequently:true});
  let meta={sx:0,sy:0,sw:iw,sh:ih,surfaceRatio:.08};
  try{
    cx.clearRect(0,0,cw,ch);cx.drawImage(image,0,0,cw,ch);
    const data=cx.getImageData(0,0,cw,ch).data;
    let minX=cw,minY=ch,maxX=-1,maxY=-1;
    const rowCount=new Uint16Array(ch);
    for(let yy=0;yy<ch;yy++)for(let xx=0;xx<cw;xx++){
      const a=data[(yy*cw+xx)*4+3];
      if(a>38){
        rowCount[yy]++;
        if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;
        if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;
      }
    }
    if(maxX>=minX&&maxY>=minY){
      const opaqueW=Math.max(1,maxX-minX+1);
      let surface=minY;
      // Ignora folhas, correntes, pontas e ornamentos isolados acima da plataforma:
      // a superfície precisa ter massa horizontal por algumas linhas seguidas.
      const needed=Math.max(8,Math.floor(opaqueW*.24));
      for(let yy=minY;yy<=maxY;yy++){
        let solidRows=0;
        for(let k=0;k<4&&yy+k<=maxY;k++)if(rowCount[yy+k]>=needed)solidRows++;
        if(solidRows>=3){surface=yy;break}
      }
      const padX=Math.max(0,Math.floor(cw*.008));
      minX=Math.max(0,minX-padX);maxX=Math.min(cw-1,maxX+padX);
      const sx=minX/cw*iw,sy=minY/ch*ih,sw=(maxX-minX+1)/cw*iw,sh=(maxY-minY+1)/ch*ih;
      meta={sx,sy,sw,sh,surfaceRatio:Math.max(0,Math.min(.55,(surface-minY)/Math.max(1,maxY-minY+1)))};
    }
  }catch(_){}
  platformSpriteMetaCache.set(image,meta);return meta;
}
function platformUnderlay(q,tower=false){
  // A caixa de colisão existe só na física. Visualmente ela é 100% invisível:
  // Jack parece caminhar diretamente sobre os sprites do cenário.
}
function drawPlatformSprite(image,q,targetH,extraW=18,tower=false){
  if(!image)return false;
  const m=platformSpriteMeta(image),drawW=q.w+extraW,ratio=m.sh/m.sw;
  const drawH=Math.max(targetH*.72,Math.min(targetH*1.32,drawW*ratio));
  const dx=q.x-extraW/2;
  // O desenho pode ter folhas/correntes acima do piso. Mantemos essa decoração,
  // mas a linha física q.y recebe sempre a massa da plataforma por baixo.
  const dy=q.y-m.surfaceRatio*drawH-3;
  x.save();
  x.beginPath();
  x.rect(q.x-extraW,q.y-36,q.w+extraW*2,Math.max(q.h+52,drawH+48));
  x.clip();
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  x.drawImage(image,m.sx,m.sy,m.sw,m.sh,dx,dy,drawW,drawH);
  x.restore();
  return true;
}
function drawTiledGround(image,q,targetH,tower=false){
  if(!image)return false;
  const m=platformSpriteMeta(image);
  const tileW=Math.max(245,targetH*(m.sw/m.sh)),overlap=20,step=tileW-overlap;
  const dy=q.y-m.surfaceRatio*targetH-3;
  x.save();
  x.beginPath();
  x.rect(q.x-10,q.y-38,q.w+20,Math.max(q.h+56,targetH+50));
  x.clip();
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  for(let px=q.x-8;px<q.x+q.w+8;px+=step){
    const w=Math.min(tileW,q.x+q.w+14-px);
    if(w<35)break;
    const sourceW=m.sw*(w/tileW);
    x.drawImage(image,m.sx,m.sy,sourceW,m.sh,px,dy,w,targetH);
  }
  x.restore();return true;
}
function drawTowerPathCabinRoofMask(q){
  if(q.x!==6200||q.y!==420)return false;
  const a=environmentSprites.village;
  const cabin=a["vila-barraca-plataforma.png"];
  const roof=a["vila-plataforma-telhado.png"];

  // 1) preserva/desenha a cabana inteira.
  if(cabin){
    const iw=cabin.naturalWidth||cabin.width||1,ih=cabin.naturalHeight||cabin.height||1;
    const targetW=390,targetH=targetW*(ih/iw);
    x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
    x.drawImage(cabin,q.x+q.w/2-targetW/2,q.y-targetH+46,targetW,targetH);
    x.restore();
  }

  // 2) o telhado é desenhado POR CIMA, alinhado à linha de colisão.
  // Assim Jack pisa no telhado sem substituir/apagar o corpo da cabana.
  if(roof){
    const m=platformSpriteMeta(roof);
    const drawW=330,drawH=Math.max(92,drawW*(m.sh/m.sw));
    const dx=q.x+q.w/2-drawW/2;
    const dy=q.y-m.surfaceRatio*drawH-3;
    x.save();
    x.beginPath();x.rect(q.x-48,q.y-80,q.w+96,150);x.clip();
    x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
    x.drawImage(roof,m.sx,m.sy,m.sw,m.sh,dx,dy,drawW,drawH);
    x.restore();
  }
  return !!(cabin||roof);
}
function villageSpriteFor(q,index){
  const a=environmentSprites.village;
  if(q.h>=100)return a["vila-plataforma-longa-baixa.png"]||a["vila-plataforma-longa-folhas.png"];

  const names=[
    "vila-plataforma-media-folhas.png","vila-plataforma-media-vinhas.png",
    "vila-plataforma-longa-ruinas.png","vila-plataforma-curta-vinhas.png",
    "vila-plataforma-ruina-grande.png","vila-plataforma-curta-a.png","vila-plataforma-curta-b.png"
  ];
  return a[names[index%names.length]]||a["vila-plataforma-media-folhas.png"];
}
function towerSpriteFor(q,index){
  const a=environmentSprites.tower;
  if(q.h>=100)return a["torre-plataforma-larga-engrenagem.png"]||a["torre-plataforma-correntes.png"];
  const names=["torre-plataforma-correntes.png","torre-plataforma-larga-engrenagem.png","torre-passarela-grade.png"];
  return a[names[index%names.length]]||a["torre-plataforma-correntes.png"];
}
function drawPhasePlatform(q,index){
  const tower=q.x>=7200;
  if(tower){
    const sprite=towerSpriteFor(q,index);
    if(q.h>=100){
      if(!drawTiledGround(sprite,q,108,true))drawFallbackPlatform(q,true);
    }else if(!drawPlatformSprite(sprite,q,105,24,true))drawFallbackPlatform(q,true);
    return;
  }
  // Cabana do Caminho da Torre: corpo inteiro + telhado como máscara da plataforma.
  // Não deixar a rotina genérica substituir a construção pelo recorte do telhado.
  if(q.x===6200&&q.y===420){
    if(!drawTowerPathCabinRoofMask(q))drawFallbackPlatform(q,false);
    return;
  }
  const sprite=villageSpriteFor(q,index);
  if(q.h>=100){
    if(!drawTiledGround(sprite,q,96,false))drawFallbackPlatform(q,false);
  }else if(!drawPlatformSprite(sprite,q,92,22,false))drawFallbackPlatform(q,false);
}
function drawArenaPlatform(q,index){
  const sprite=towerSpriteFor(q,index+2);
  if(q.w>650){
    if(!drawTiledGround(sprite,q,112,true))drawFallbackPlatform(q,true);
  }else if(!drawPlatformSprite(sprite,q,108,24,true))drawFallbackPlatform(q,true);
}
function drawClockPreludeVisual(){
  if(!clockPreludeVisualActive||!dialogue.active||!clockDialogueSprite)return;
  // O mostrador protótipo da arena já está em (8050,-860).
  // O novo PNG entra por cima dele no MESMO lugar, preservando o cenário da fase.
  const iw=clockDialogueSprite.naturalWidth||clockDialogueSprite.width||1;
  const ih=clockDialogueSprite.naturalHeight||clockDialogueSprite.height||1;
  const targetH=505;
  const scale=targetH/ih;
  const dw=iw*scale,dh=ih*scale;
  const cx=8050,cy=-860;
  const pulse=.96+Math.sin(p.anim*1.85)*.025;

  x.save();
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  const glow=x.createRadialGradient(cx,cy,40,cx,cy,310);
  glow.addColorStop(0,"rgba(255,190,82,"+(.15*pulse)+")");
  glow.addColorStop(.58,"rgba(188,94,31,"+(.055*pulse)+")");
  glow.addColorStop(1,"rgba(18,7,26,0)");
  x.fillStyle=glow;x.beginPath();x.arc(cx,cy,310,0,Math.PI*2);x.fill();
  x.globalAlpha=.99;
  x.drawImage(clockDialogueSprite,cx-dw/2,cy-dh/2,dw,dh);
  x.restore();
}
function draw(){drawPhase2Backdrop();x.fillStyle="#e7d4b0";x.globalAlpha=.22;for(let i=0;i<18;i++){const px=((i*431-cam*.12)%1500+1500)%1500;x.fillRect(px,80+(i*71)%220,2,2)}x.globalAlpha=1;
x.save();x.translate(-cam,-camY);
// O interior da Torre é um plano do próprio mundo: fica à frente do fundo da fase
// e recebe exatamente o mesmo deslocamento vertical das plataformas durante a subida.
drawTowerInterior();
plats.forEach((q,i)=>drawPhasePlatform(q,i));
drawPhase2Checkpoints();
if(bossUnlocked||bossActive||bossDefeated){
  // Arena protótipo no topo: um grande mostrador quebrado sustentado por engrenagens.
  x.save();x.globalAlpha=.24;x.fillStyle="#9a3b25";x.beginPath();x.arc(8050,-860,255,0,Math.PI*2);x.fill();x.globalAlpha=1;
  x.strokeStyle="#d18b35";x.lineWidth=10;x.beginPath();x.arc(8050,-860,210,0,Math.PI*2);x.stroke();
  for(let i=0;i<12;i++){const a=i*Math.PI/6;x.beginPath();x.moveTo(8050+Math.cos(a)*175,-860+Math.sin(a)*175);x.lineTo(8050+Math.cos(a)*205,-860+Math.sin(a)*205);x.stroke()}
  x.strokeStyle="#f0c264";x.lineWidth=8;x.beginPath();x.moveTo(8050,-860);x.lineTo(7980,-940);x.moveTo(8050,-860);x.lineTo(8145,-835);x.stroke();x.restore();
  arenaPlats.forEach((q,i)=>drawArenaPlatform(q,i));
  for(let gx=7290;gx<8840;gx+=150)drawClockGear(gx,-624,24,.58);
}
for(let ri=0;ri<reveal.length;ri++){
  const q=reveal[ri];if(q.t<=0)continue;
  x.save();
  const alpha=Math.min(1,q.t*2);
  x.globalAlpha=alpha;
  x.shadowColor="#9beaff";x.shadowBlur=16;
  drawPhasePlatform(q,ri+97);
  x.restore();
}
// Marcadores dos enigmas obrigatórios.
for(const z of windows){x.fillStyle=z.on?"#ffe7a1":"#402d45";x.fillRect(z.x,z.y,44,58);x.strokeStyle="#c88b35";x.strokeRect(z.x,z.y,44,58)}
for(const z of shadowSeals){x.fillStyle=z.on?"#b9eaff":"#171b2c";x.beginPath();x.arc(z.x,z.y,20,0,Math.PI*2);x.fill();x.strokeStyle="#78a5bb";x.stroke()}
for(const z of towerSeals){x.fillStyle=z.on?"#fff0a8":"#512c65";x.beginPath();x.arc(z.x,z.y,22,0,Math.PI*2);x.fill();x.strokeStyle="#d0a65b";x.stroke()}
x.fillStyle=allRequired()?"#e9c35e":"#4d344d";x.fillRect(7725,-480,300,70);x.strokeStyle="#d0a65b";x.lineWidth=4;x.strokeRect(7725,-480,300,70);x.fillStyle="#fff0b0";x.font="bold 14px Georgia";x.fillText(allRequired()?"SELO ABERTO — AÇÃO":"SELO FECHADO — "+solvedCount()+"/3 · TORRE "+(towerMechanism?"✓":"○"),7780,-438);
if(bossActive&&!bossDefeated){
  let bi=0;
  if(boss.spawn>0)bi=8;
  else if(boss.invuln>0)bi=7;
  else if(boss.cast>0)bi=6;
  else if(boss.shot<=.72){
    const wind=Math.max(0,Math.min(.719,.72-boss.shot));
    bi=3+Math.min(2,Math.floor(wind/.24));
  }else{
    const walkCycle=Math.floor(boss.animT/0.15)%4;
    bi=[0,1,0,2][walkCycle];
  }
  const bs=ameliaShadowAssets.boss[bi]||ameliaShadowAssets.boss[0];
  if(bs){
    // Âncora fixa no chão visual: todos os quadros mantêm o mesmo centro e escala.
    // O único movimento vertical é uma respiração mínima; sem pulos entre frames.
    const size=344;
    const breathe=(boss.spawn>0||boss.cast>0||boss.invuln>0)?0:Math.sin(boss.t*2.2)*2;
    const drawY=boss.y-size/2+breathe;
    x.save();
    x.globalAlpha=boss.invuln>0?.62:1;
    if(boss.dir<0){
      x.translate(boss.x,0);x.scale(-1,1);x.drawImage(bs,-size/2,drawY,size,size);
    }else x.drawImage(bs,boss.x-size/2,drawY,size,size);
    x.restore();

    // Telegraph de ataque: a luz cresce antes do projétil sair, sincronizada aos 3 frames.
    if(boss.spawn<=0&&boss.invuln<=0&&boss.shot<=.72&&boss.cast<=0){
      const charge=Math.max(0,Math.min(1,(.72-boss.shot)/.72));
      const orbX=boss.x+boss.dir*68,orbY=boss.y-10;
      x.save();x.globalAlpha=.18+charge*.52;x.fillStyle="#ff5b9d";x.beginPath();x.arc(orbX,orbY,10+charge*24,0,Math.PI*2);x.fill();
      x.globalAlpha=.55+charge*.45;x.fillStyle="#ffd978";x.beginPath();x.arc(orbX,orbY,5+charge*9,0,Math.PI*2);x.fill();x.restore();
    }
  }else{
    // Fallback até os sprites da sombra serem enviados.
    x.save();x.translate(boss.x,boss.y);const pulse=1+Math.sin(boss.t*5)*.05;x.scale(pulse,pulse);
    x.globalAlpha=boss.invuln>0?.48:.22;x.fillStyle="#a9477c";x.beginPath();x.arc(0,0,92,0,Math.PI*2);x.fill();x.globalAlpha=1;
    x.fillStyle="#17101d";x.strokeStyle="#e3a34a";x.lineWidth=9;x.beginPath();x.arc(0,0,66,0,Math.PI*2);x.fill();x.stroke();
    x.strokeStyle="#f2cf79";x.lineWidth=4;for(let i=0;i<12;i++){const a=i*Math.PI/6;x.beginPath();x.moveTo(Math.cos(a)*48,Math.sin(a)*48);x.lineTo(Math.cos(a)*59,Math.sin(a)*59);x.stroke()}
    x.strokeStyle="#ffdf8b";x.lineWidth=7;x.beginPath();x.moveTo(0,0);x.lineTo(-22,-35);x.moveTo(0,0);x.lineTo(43,12);x.stroke();
    x.fillStyle="#d96b35";x.beginPath();x.arc(-25,-6,7,0,Math.PI*2);x.arc(25,-6,7,0,Math.PI*2);x.fill();x.fillStyle="#f6c85f";x.font="bold 14px Georgia";x.textAlign="center";x.fillText("4:13",0,94);x.restore();
  }
}
if(bossDefeated){x.fillStyle="#f3d98a";x.globalAlpha=.75;x.font="bold 18px Georgia";x.fillText("O tempo voltou a respirar.",7940,-760);x.globalAlpha=1}
for(const s of bossShots){x.globalAlpha=.22;x.fillStyle="#c95b9a";x.beginPath();x.arc(s.x,s.y,s.r*2.1,0,Math.PI*2);x.fill();x.globalAlpha=1;x.fillStyle="#ffcf72";x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fill();x.strokeStyle="#7b315f";x.stroke()}
// Amélia Vesper oficial e sua revelação no topo da torre.
drawAmelia();drawShadowCutscene();drawTowerAmelia();
for(const e of enemies)drawEnemy(e);
for(const b of bells){
  const ringing=bellAnim.ringing===b.id&&bellAnim.t>0;
  const wrong=bellAnim.wrong===b.id&&bellAnim.wrongT>0;
  // A base acompanha a posição física embaralhada; o sino acompanha a memória (id).
  const physicalIndex=bells.indexOf(b);
  const base=bellAssets.bases[b.id];
  const bell=bellAssets.animated[b.id];
  const baseH=252,bellH=116;
  if(base)drawAssetBottom(base,b.x,b.y,baseH,wrong?.72:1);

  // Ponto de suspensão dentro do vão do arco.
  // As bases físicas 3 e 4 têm elementos cenográficos mais altos; nelas o sino sobe
  // e fica um pouco menor para não invadir as estátuas/decorações.
  // O gancho não está exatamente no mesmo ponto dentro de cada arte-base.
  // Estes offsets seguem a BASE FÍSICA (não o id narrativo do sino), para o aro
  // superior realmente pender do gancho desenhado em cada arco.
  // Coordenadas medidas diretamente nos quatro PNGs das bases, levando em conta
  // largura/altura e recortes transparentes diferentes de cada arquivo.
  const baseHook=[
    {dx:19,dy:0},
    {dx:-6,dy:0},
    {dx:20,dy:-15},
    {dx:7,dy:-13}
  ][b.id];
  // Microajuste por POSIÇÃO FÍSICA: encaixa o aro do sino exatamente
  // na corrente desenhada da base. Bases 1 e 3 permanecem intocadas.
  const physicalHookFine=b.x===3565?{dx:7,dy:-8}:b.x===4165?{dx:6,dy:-10}:{dx:0,dy:0};
  const bellX=b.x+baseHook.dx+physicalHookFine.dx;
  const pivotY=b.y-184+baseHook.dy+physicalHookFine.dy;
  const localBellH=bellH;
  if(b.on){
    const pulse=.82+Math.sin(p.anim*4.2+b.id)*.12;
    const glow=x.createRadialGradient(bellX,pivotY+55,8,bellX,pivotY+55,88);
    glow.addColorStop(0,"rgba(255,230,135,"+(.5*pulse)+")");
    glow.addColorStop(.5,"rgba(255,174,58,"+(.22*pulse)+")");
    glow.addColorStop(1,"rgba(255,128,25,0)");
    x.fillStyle=glow;x.beginPath();x.arc(bellX,pivotY+55,88,0,Math.PI*2);x.fill();
  }
  if(bell){
    const iw=bell.naturalWidth||bell.width||1,ih=bell.naturalHeight||bell.height||1;
    const bw=localBellH*(iw/ih);
    let angle=0;
    if(ringing){
      const elapsed=.58-bellAnim.t;
      // Uma única badalada: sai do centro, vai a um lado, cruza ao outro e volta ao repouso.
      const u=Math.max(0,Math.min(1,elapsed/.58));
      angle=Math.sin(u*Math.PI*2)*Math.sin(u*Math.PI)*.19;
    }
    x.save();
    x.translate(bellX,pivotY);
    x.rotate(angle);
    x.globalAlpha=wrong?.72:1;
    // O topo do PNG fica no pivô; apenas o sino gira, nunca a base.
    x.drawImage(bell,-bw/2,0,bw,localBellH);
    x.restore();
  }
}
for(const g of gears){if(g.got)continue;x.save();x.translate(g.x,g.y);x.rotate(p.anim);x.strokeStyle="#ffd36b";x.lineWidth=8;x.beginPath();x.arc(0,0,24,0,Math.PI*2);x.stroke();for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.fillStyle="#ffd36b";x.fillRect(20,-5,13,10)}x.restore()}
drawClockPreludeVisual();x.restore();drawJack();if(light>0){x.globalAlpha=Math.min(1,light*4);const rg=x.createRadialGradient(p.x-cam+p.w/2,p.y-camY+25,10,p.x-cam+p.w/2,p.y-camY+25,220);rg.addColorStop(0,"#fff6b8aa");rg.addColorStop(1,"#9beaff00");x.fillStyle=rg;x.beginPath();x.arc(p.x-cam+p.w/2,p.y-camY+25,220,0,Math.PI*2);x.fill();x.globalAlpha=1}
if(bossActive&&!bossDefeated){
  x.fillStyle="#120b17dd";x.fillRect(W/2-285,92,570,54);x.strokeStyle="#d3923b";x.lineWidth=3;x.strokeRect(W/2-285,92,570,54);
  x.fillStyle="#f3d184";x.font="bold 15px Georgia";x.textAlign="center";x.fillText("SOMBRA DE AMÉLIA — O ÚLTIMO MINUTO",W/2,111);x.textAlign="left";
  x.fillStyle="#4a2637";x.fillRect(W/2-245,120,490,12);x.fillStyle="#e0a64e";x.fillRect(W/2-245,120,490*(boss.hp/boss.maxHp),12);
  x.fillStyle="#ffe099";x.font="bold 14px Georgia";x.fillText("LUZ "+("✦".repeat(playerLife))+" · F para atacar de perto",28,111);
}
x.fillStyle="#ffe099";x.font="15px Georgia";x.fillText("4:13",W-62,H-24);
if(p.x>7150){x.fillStyle="#ffe099";x.font="13px Georgia";x.fillText(bossActive?"ARENA — desvie dos disparos e aproxime-se para usar a LUZ":"SUBIDA DA TORRE — siga as plataformas ao redor do relógio",28,H-24)}
x.fillStyle="#ffe099";x.font="12px Georgia";x.fillText("ENIGMAS "+solvedCount()+"/3 · TORRE "+(towerMechanism?"✓":"○"),W-230,H-24)}
function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}addEventListener("pagehide",saveJourney);document.addEventListener("visibilitychange",()=>{if(document.hidden){saveJourney();phaseAudio.pause()}else if(running)phaseAudio.resume()});draw();
})();