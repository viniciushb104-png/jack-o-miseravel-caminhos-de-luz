(()=>{
"use strict";

const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const W=1280,H=720,WORLD=12600,G=1500,FLOOR=590;
const story=window.PHASE5_STORY;
if(!story)throw new Error("PHASE5_STORY não carregou.");
const journey=window.JackJourney||null;
const qs=new URLSearchParams(location.search);
const journeyMode=qs.get("journey")==="1",replayMode=qs.get("replay")==="1",forceNew=qs.get("new")==="1";
const SAVE_KEY="jack-phase5-save",CP_KEY="jack-phase5-checkpoint",COMPLETE_KEY="jack-phase5-complete";

const ui={
 obj:document.querySelector("#objective strong"),
 health:document.getElementById("healthValue"),
 banner:document.getElementById("sectionBanner"),
 msg:document.getElementById("message"),
 intro:document.getElementById("intro"),
 complete:document.getElementById("phase5Prototype")
};
const dialogue=new window.DialogueSystem(document.getElementById("dialogue"));

const SECTIONS=Object.freeze([
 {id:"return",name:"A ESTRADA QUE VOLTA",start:0,end:1700},
 {id:"houses",name:"AS CASAS SEM ESPERA",start:1700,end:3500},
 {id:"clock",name:"O RELÓGIO SEM ONTEM",start:3500,end:5350},
 {id:"garden",name:"O JARDIM DAS COISAS GUARDADAS",start:5350,end:7350},
 {id:"city",name:"A CIDADE SEM JACK",start:7350,end:9500},
 {id:"promise",name:"A ENCRUZILHADA DA PROMESSA",start:9500,end:10850},
 {id:"final",name:"A ÚLTIMA LANTERNA",start:10850,end:12600}
]);

const GROUND=Object.freeze([
 // R2 · uma linha de chão dominante. Cada capítulo é um espaço legível,
 // sem buracos decorativos entre os elementos do próprio enigma.
 {x1:0,x2:1700,y:590,section:"return"},
 {x1:1700,x2:3500,y:590,section:"houses"},
 {x1:3500,x2:5350,y:590,section:"clock"},
 {x1:5350,x2:7350,y:590,section:"garden"},
 {x1:7350,x2:9500,y:590,section:"city"},

 // A Promessa sobe em apenas três patamares de 20 px: ascensão perceptível,
 // mas sem transformar o trecho numa escadaria visualmente ruidosa.
 {x1:9500,x2:9950,y:580,section:"promise"},
 {x1:9950,x2:10400,y:560,section:"promise"},
 {x1:10400,x2:10850,y:540,section:"promise"},

 // A arena final volta a uma linha de chão única; o boss ganha três palcos claros.
 {x1:10850,x2:12600,y:590,section:"final"}
]);

const PLATFORMS=Object.freeze([
 // 5C · cada espelho tem um pedestal físico exatamente sob o sprite.
 {id:"clock-mirror-left",x:3620,y:520,w:260,h:22,section:"clock"},
 {id:"clock-mirror-center",x:4160,y:500,w:280,h:22,section:"clock"},
 {id:"clock-mirror-right",x:4690,y:520,w:260,h:22,section:"clock"},

 // 5E · as quatro marcas ficam integralmente sobre seus próprios palcos.
 {id:"city-waited",x:7520,y:530,w:240,h:22,section:"city"},
 {id:"city-continued",x:8050,y:515,w:250,h:22,section:"city"},
 {id:"city-let-go",x:8460,y:530,w:250,h:22,section:"city"},
 {id:"city-crossed",x:8930,y:515,w:250,h:22,section:"city"},

 // 5G · três massas apenas: acusação esquerda, confronto central e resolução direita.
 // Todos os sigilos, lições e espelhos agora pertencem fisicamente a um desses palcos.
 {id:"boss-left",x:11000,y:520,w:540,h:22,section:"final"},
 {id:"boss-center",x:11540,y:545,w:400,h:22,section:"final"},
 {id:"boss-right",x:11940,y:520,w:560,h:22,section:"final"}
]);

const GATES=[
 {x:1660,flag:()=>returnOpened&&roadMonologueCompleted},
 {x:3470,flag:()=>housesSolved},
 {x:5320,flag:()=>clockSolved},
 {x:7320,flag:()=>gardenSolved},
 {x:9470,flag:()=>citySolved},
 {x:10820,flag:()=>promiseSolved}
];

const CHECKPOINTS=Object.freeze([
 {id:"return",x:1580,respawnX:1510,require:()=>returnOpened,name:"MARCO DO RETORNO"},
 {id:"clock",x:5200,respawnX:5110,require:()=>clockSolved,name:"RELÓGIO DO AGORA"},
 {id:"garden",x:7180,respawnX:7090,require:()=>gardenSolved,name:"LANTERNA DAS COISAS DEIXADAS"},
 {id:"city",x:9360,respawnX:9270,require:()=>citySolved,name:"MARCO SEM NOME"},
 {id:"promise",x:10700,respawnX:10640,require:()=>promiseSolved,name:"A PENÚLTIMA LANTERNA"}
]);

const housesLamps=[
 {x:1840,type:"path",on:true},{x:2140,type:"wait",on:true},{x:2500,type:"wait",on:true},
 {x:2860,type:"path",on:true},{x:3260,type:"wait",on:true}
];

const clockMirrors=[
 {x:3750,y:520,targetX:4020,targetY:385,node:0,range:185},
 {x:4300,y:500,targetX:4560,targetY:385,node:1,range:185},
 {x:4820,y:520,targetX:5060,targetY:385,node:2,range:185}
];

const gardenItems=[
 {id:"letter",x:5480,memorialX:5730,title:"CARTA"},
 {id:"key",x:6100,memorialX:6360,title:"CHAVE"},
 {id:"portrait",x:6780,memorialX:7080,title:"RETRATO"}
];

const gardenMirrors=[
 {x:5670,y:520,targetX:5900,targetY:545,garden:true,range:170},
 {x:6740,y:520,targetX:6900,targetY:545,garden:true,range:170}
];

const cityMarks=[
 {x:7640,label:"ESPEROU"},{x:8170,label:"CONTINUOU"},
 {x:8580,label:"DEIXOU IR"},{x:9050,label:"ATRAVESSOU"}
];
const cityAshMirror={x:8845,y:520,targetX:9000,targetY:545,garden:true,range:135};

const promiseAltars=[
 {x:9680,label:"VOCÊ PROMETEU"},{x:9970,label:"EU VOLTO"},
 {x:10250,label:"ENCONTRE O CAMINHO DE VOLTA"},{x:10550,label:"PARA TODOS ELES"}
];

const bossSigils=[
 {x:11150,label:"MENTIROSO"},{x:11450,label:"COVARDE"},
 {x:12030,label:"AVARENTO"},{x:12330,label:"MISERÁVEL"}
];
const bossLessons=[
 {x:11150,label:"ESPERAR",mode:"direct"},
 {x:11450,label:"CONTINUAR",mode:"reflected"},
 {x:12030,label:"DEIXAR IR",mode:"direct"},
 {x:12330,label:"ATRAVESSAR",mode:"reflected"}
];
const bossMirrors=[
 {x:11340,y:520,targetX:11450,targetY:500,lesson:1,range:145},
 {x:12190,y:520,targetX:12330,targetY:500,lesson:3,range:145}
];

let state={
 returnOpened:false,roadBlockedSeen:false,roadMonologueCompleted:false,
 housesSolved:false,clockSolved:false,gardenSolved:false,citySolved:false,promiseSolved:false,
 housesLamps:null,clockCharged:[],gardenPlaced:[],cityMarks:[],promiseStep:0,
 sectionSeen:[],deadEnemies:[],activeCheckpoint:"",
 bossStarted:false,bossAct:0,bossSigils:[],bossLessons:[],bossContinued:false,bossResolved:false,
 phase5Complete:false,px:150,py:480
};
if(forceNew){
 try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CP_KEY)}catch(_){}
}
if(!forceNew){
 try{
  const raw=localStorage.getItem(SAVE_KEY);
  if(raw)Object.assign(state,JSON.parse(raw));
 }catch(_){}
}
let roadMonologueCompleted=!!state.roadMonologueCompleted;
let returnOpened=!!state.returnOpened&&roadMonologueCompleted,roadBlockedSeen=!!state.roadBlockedSeen;
// Saves produzidos antes da trava narrativa não podem colocar Jack no Enigma 2
// sem que o monólogo do retorno tenha sido concluído nesta lógica.
if(!roadMonologueCompleted)returnOpened=false;
let housesSolved=!!state.housesSolved,clockSolved=!!state.clockSolved,gardenSolved=!!state.gardenSolved,
    citySolved=!!state.citySolved,promiseSolved=!!state.promiseSolved;
if(Array.isArray(state.housesLamps))state.housesLamps.forEach((v,i)=>{if(housesLamps[i])housesLamps[i].on=!!v});
const clockCharged=new Set(state.clockCharged||[]);
const gardenPlaced=new Set(state.gardenPlaced||[]);
const cityLit=new Set(state.cityMarks||[]);
let carriedItem=state.carriedItem||"";
let promiseStep=Number(state.promiseStep)||0;
const sectionSeen=new Set(state.sectionSeen||[]);
const deadEnemies=new Set(state.deadEnemies||[]);
let activeCheckpoint=state.activeCheckpoint||localStorage.getItem(CP_KEY)||"";
let bossStarted=!!state.bossStarted,bossAct=Number(state.bossAct)||0;
const bossSigilLit=new Set(state.bossSigils||[]);
const bossLessonLit=new Set(state.bossLessons||[]);
let bossContinued=!!state.bossContinued,bossResolved=!!state.bossResolved;
// COMPLETE_KEY é uma conquista permanente (troféu 5/5), não o estado da partida atual.
// Em replay/new game ela continua salva no perfil, mas NÃO deve pular a fase para a tela final.
let phase5Complete=(!forceNew&&!replayMode)&&(
 !!state.phase5Complete||localStorage.getItem(COMPLETE_KEY)==="yes"
);

const p={x:Number(state.px)||150,y:Number(state.py)||480,w:44,h:86,vx:0,vy:0,on:false,dir:1,anim:0,attack:0,inv:0};
let life=3,cam=0,running=false,last=performance.now(),sectionIndex=-1,lightPulse=0,lightCooldown=0;
let reflectedFx=[],hazards=[],shots=[],enemyDissolves=[],messageTimer=0,bannerTimer=0,bossShotCd=1.2,ending=false,autosaveTimer=0;
let roadOpenFxStartedAt=0;
let checkpointActivation={id:"",startedAt:0,duration:900};
const input={left:false,right:false,down:false,jump:false,run:false};

const atlas=new Image();atlas.src="../assets/game/phase1/sprites-hd/jack-atlas-hd.png";
let atlasReady=false;
const JA=window.JACK_ANIMATIONS||null;
let jackFrameOverrides={};

function buildCleanJackFrame(image,frame,eraseRects=[]){
 const cfg=window.JACK_ANIMATIONS;
 const cell=cfg?.cell||320,cols=cfg?.cols||8;
 const cv=document.createElement("canvas");
 cv.width=cell;cv.height=cell;
 const cx=cv.getContext("2d");
 const col=frame%cols,row=Math.floor(frame/cols);
 cx.clearRect(0,0,cell,cell);
 cx.drawImage(image,col*cell,row*cell,cell,cell,0,0,cell,cell);
 eraseRects.forEach(([rx,ry,rw,rh])=>cx.clearRect(rx,ry,rw,rh));
 return cv;
}
function buildJackFrameOverrides(image){
 // Mesma limpeza testada nas Fases 1, 2 e 3.
 // 25: remove resíduo lateral da célula vizinha.
 // 26: remove o boot/pé que aparece acima da cabeça quando Jack ergue a lanterna.
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
atlas.onload=()=>{
 atlasReady=true;
 jackFrameOverrides=buildJackFrameOverrides(atlas);
};

// Retratos HD do Jack: mesma família visual usada nos diálogos das outras fases.
const JACK_DIALOGUE_FILES=Object.freeze([
 "jack-00-neutral.png",
 "jack-01-serious.png",
 "jack-02-smirk.png",
 "jack-03-surprised.png",
 "jack-04-determined.png",
 "jack-05-resolved.png"
]);
function loadPhase5Image(src){
 return new Promise((resolve,reject)=>{
  const im=new Image();
  im.onload=()=>resolve(im);
  im.onerror=reject;
  im.src=src;
 });
}
const jackDialogueReady=Promise.allSettled(
 JACK_DIALOGUE_FILES.map(file=>loadPhase5Image("../assets/game/phase1/portraits-hd/"+file+"?v=1"))
).then(results=>{
 const frames=results.map(r=>r.status==="fulfilled"?r.value:null);
 dialogue.setAssets({jack:{frames}});
 return frames;
});
// ---------------------------------------------------------------------------
// FASE 5 · SOMBRA DE RETORNO
// Sprites individuais do Lote 1. Mantemos cada frame separado para permitir
// animação, substituição pontual e carregamento progressivo sem atlas gigante.
// ---------------------------------------------------------------------------
const SHADOW_RETURN_FILES=Object.freeze({
 idle:[
  "../assets/game/phase5/enemies/shadow-return/shadow-return-idle-01.png?v=1",
  "../assets/game/phase5/enemies/shadow-return/shadow-return-idle-02.png?v=1",
  "../assets/game/phase5/enemies/shadow-return/shadow-return-idle-03.png?v=1"
 ],
 move:[
  "../assets/game/phase5/enemies/shadow-return/shadow-return-move-01.png?v=1",
  "../assets/game/phase5/enemies/shadow-return/shadow-return-move-02.png?v=1",
  "../assets/game/phase5/enemies/shadow-return/shadow-return-move-03.png?v=1"
 ],
 attack:[
  "../assets/game/phase5/enemies/shadow-return/shadow-return-attack-01.png?v=1"
 ],
 hit:[
  "../assets/game/phase5/enemies/shadow-return/shadow-return-hit-01.png?v=1",
  "../assets/game/phase5/enemies/shadow-return/shadow-return-hit-02.png?v=1"
 ],
 dissolve:[
  "../assets/game/phase5/enemies/shadow-return/shadow-return-dissolve-01.png?v=1"
 ]
});
const shadowReturnSprites={idle:[],move:[],attack:[],hit:[],dissolve:[]};
const shadowReturnReady=[];
Object.entries(SHADOW_RETURN_FILES).forEach(([state,files])=>{
 files.forEach((src,index)=>{
  const im=new Image();
  shadowReturnSprites[state][index]=im;
  shadowReturnReady.push(new Promise(resolve=>{
   im.onload=()=>resolve(im);
   im.onerror=()=>resolve(null);
  }));
  im.src=src;
 });
});
const shadowReturnAssetsReady=Promise.allSettled(shadowReturnReady);

// ---------------------------------------------------------------------------
// FASE 5 · TESTEMUNHA CEGA
// Lote 2: criatura flutuante que "testemunha" sem ver e marca o chão à distância.
// ---------------------------------------------------------------------------
const WITNESS_BLIND_FILES=Object.freeze({
 idle:[
  "../assets/game/phase5/enemies/witness-blind/witness-blind-idle-01.png?v=1",
  "../assets/game/phase5/enemies/witness-blind/witness-blind-idle-02.png?v=1",
  "../assets/game/phase5/enemies/witness-blind/witness-blind-idle-03.png?v=1"
 ],
 float:[
  "../assets/game/phase5/enemies/witness-blind/witness-blind-float-01.png?v=1",
  "../assets/game/phase5/enemies/witness-blind/witness-blind-float-02.png?v=1"
 ],
 attack:[
  "../assets/game/phase5/enemies/witness-blind/witness-blind-attack-01.png?v=1",
  "../assets/game/phase5/enemies/witness-blind/witness-blind-attack-02.png?v=1",
  "../assets/game/phase5/enemies/witness-blind/witness-blind-attack-03.png?v=1"
 ],
 hit:[
  "../assets/game/phase5/enemies/witness-blind/witness-blind-hit-01.png?v=1"
 ],
 dissolve:[
  "../assets/game/phase5/enemies/witness-blind/witness-blind-dissolve-01.png?v=1"
 ]
});
const witnessBlindSprites={idle:[],float:[],attack:[],hit:[],dissolve:[]};
const witnessBlindReady=[];
Object.entries(WITNESS_BLIND_FILES).forEach(([state,files])=>{
 files.forEach((src,index)=>{
  const im=new Image();
  witnessBlindSprites[state][index]=im;
  witnessBlindReady.push(new Promise(resolve=>{
   im.onload=()=>resolve(im);
   im.onerror=()=>resolve(null);
  }));
  im.src=src;
 });
});
const witnessBlindAssetsReady=Promise.allSettled(witnessBlindReady);

// ---------------------------------------------------------------------------
// FASE 5 · REPETIDOR
// Lote 3: criatura agressiva que copia a direção do movimento e entra em dash.
// ---------------------------------------------------------------------------
const REPEATER_FILES=Object.freeze({
 idle:[
  "../assets/game/phase5/enemies/repeater/repeater-idle-01.png?v=1",
  "../assets/game/phase5/enemies/repeater/repeater-idle-02.png?v=1",
  "../assets/game/phase5/enemies/repeater/repeater-idle-03.png?v=1"
 ],
 run:[
  "../assets/game/phase5/enemies/repeater/repeater-run-01.png?v=1",
  "../assets/game/phase5/enemies/repeater/repeater-run-02.png?v=1"
 ],
 dash:[
  "../assets/game/phase5/enemies/repeater/repeater-dash-01.png?v=1",
  "../assets/game/phase5/enemies/repeater/repeater-dash-02.png?v=1"
 ],
 attack:[
  "../assets/game/phase5/enemies/repeater/repeater-attack-01.png?v=1"
 ],
 hit:[
  "../assets/game/phase5/enemies/repeater/repeater-hit-01.png?v=1"
 ],
 dissolve:[
  "../assets/game/phase5/enemies/repeater/repeater-dissolve-01.png?v=1"
 ]
});
const repeaterSprites={idle:[],run:[],dash:[],attack:[],hit:[],dissolve:[]};
const repeaterReady=[];
Object.entries(REPEATER_FILES).forEach(([state,files])=>{
 files.forEach((src,index)=>{
  const im=new Image();
  repeaterSprites[state][index]=im;
  repeaterReady.push(new Promise(resolve=>{
   im.onload=()=>resolve(im);
   im.onerror=()=>resolve(null);
  }));
  im.src=src;
 });
});
const repeaterAssetsReady=Promise.allSettled(repeaterReady);

// ---------------------------------------------------------------------------
// FASE 5 · LANTERNA DE VIGÍLIA
// Checkpoint narrativo: apagado quando inativo, acendimento em 3 estágios e
// abóbora iluminada quando é o ponto de retorno atual.
// ---------------------------------------------------------------------------
const PHASE5_CHECKPOINT_FILES=Object.freeze({
 off:"../assets/game/phase5/checkpoints/phase5-checkpoint-off.png?v=1",
 on:"../assets/game/phase5/checkpoints/phase5-checkpoint-on.png?v=1",
 activate:[
  "../assets/game/phase5/checkpoints/phase5-checkpoint-activate-01.png?v=1",
  "../assets/game/phase5/checkpoints/phase5-checkpoint-activate-02.png?v=1",
  "../assets/game/phase5/checkpoints/phase5-checkpoint-activate-03.png?v=1"
 ],
 glow:"../assets/game/phase5/checkpoints/phase5-checkpoint-glow-variant.png?v=1"
});
const phase5CheckpointImgs={off:null,on:null,activate:[],glow:null};
const phase5CheckpointReady=[];
function loadCheckpointAsset(key,src,index=null){
 const im=new Image();
 if(index===null)phase5CheckpointImgs[key]=im;
 else phase5CheckpointImgs[key][index]=im;
 phase5CheckpointReady.push(new Promise(resolve=>{
  im.onload=()=>resolve(im);
  im.onerror=()=>resolve(null);
 }));
 im.src=src;
}
loadCheckpointAsset("off",PHASE5_CHECKPOINT_FILES.off);
loadCheckpointAsset("on",PHASE5_CHECKPOINT_FILES.on);
PHASE5_CHECKPOINT_FILES.activate.forEach((src,i)=>loadCheckpointAsset("activate",src,i));
loadCheckpointAsset("glow",PHASE5_CHECKPOINT_FILES.glow);
const phase5CheckpointAssetsReady=Promise.allSettled(phase5CheckpointReady);

const PHASE5_BACKGROUND_FILES=Object.freeze({
 return:"../assets/game/phase5/backgrounds/01-village-carnival/phase5-village-halloween-01.png",
 houses:"../assets/game/phase5/backgrounds/01-village-carnival/phase5-village-carnival-02.png",
 clock:"../assets/game/phase5/backgrounds/02-clocks-reflections/phase5-clock-reflection-01.png",
 garden:"../assets/game/phase5/backgrounds/02-clocks-reflections/phase5-clock-reflection-03.png",
 city:"../assets/game/phase5/backgrounds/01-village-carnival/phase5-village-carnival-03.png",
 promise:"../assets/game/phase5/backgrounds/02-clocks-reflections/phase5-clock-reflection-02.png",
 final:"../assets/game/phase5/backgrounds/03-boss-mirror-hall/phase5-boss-mirror-hall-01.png"
});
const phase5BackgroundImgs={};
const phase5BackgroundReady={};
const phase5BackgroundPromises={};
Object.entries(PHASE5_BACKGROUND_FILES).forEach(([key,src])=>{
 const im=new Image();
 phase5BackgroundImgs[key]=im;
 phase5BackgroundReady[key]=false;
 phase5BackgroundPromises[key]=new Promise(resolve=>{
  im.onload=()=>{phase5BackgroundReady[key]=true;resolve(im)};
  im.onerror=()=>{phase5BackgroundReady[key]=false;resolve(null)};
 });
 im.src=src+"?v=phase5-bg-1";
});

/* --------------------------------------------------------------------------
   HALLOWEEN V · SISTEMA VISUAL DE PLATAFORMAS
   A física continua usando GROUND/PLATFORMS. As artes abaixo vestem essa
   geometria sem alterar colisão, puzzles ou checkpoints.
   -------------------------------------------------------------------------- */
const PHASE5_ROAD_PUZZLE_FILES=Object.freeze({
 seal:"../assets/game/phase5/puzzles/P5-2A-estrada-volta/phase5-road-blocked-seal.png",
 glow:"../assets/game/phase5/puzzles/P5-2A-estrada-volta/phase5-road-blocked-seal-glow.png",
 wave1:"../assets/game/phase5/puzzles/P5-2A-estrada-volta/phase5-bell-call-wave-01.png",
 wave2:"../assets/game/phase5/puzzles/P5-2A-estrada-volta/phase5-bell-call-wave-02.png",
 arrow:"../assets/game/phase5/puzzles/P5-2A-estrada-volta/phase5-return-arrow-light.png",
 open:"../assets/game/phase5/puzzles/P5-2A-estrada-volta/phase5-return-path-open-fx.png"
});
const phase5RoadPuzzleImgs={};
const phase5RoadPuzzlePromises={};
Object.entries(PHASE5_ROAD_PUZZLE_FILES).forEach(([key,src])=>{
 const im=new Image();
 phase5RoadPuzzleImgs[key]=im;
 phase5RoadPuzzlePromises[key]=new Promise(resolve=>{
  im.onload=()=>resolve(im);
  im.onerror=()=>resolve(null);
 });
 im.src=src+"?v=1";
});
function roadPuzzleImg(key){
 const im=phase5RoadPuzzleImgs[key];
 return im&&im.complete&&im.naturalWidth?im:null;
}
function drawRoadAssetBottom(key,cx,bottom,w,alpha=1,flip=false){
 const im=roadPuzzleImg(key);
 if(!im)return false;
 const h=w*(im.naturalHeight/im.naturalWidth);
 ctx.save();
 ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(flip){
  ctx.translate(cx,0);ctx.scale(-1,1);
  ctx.drawImage(im,-w/2,bottom-h,w,h);
 }else{
  ctx.drawImage(im,cx-w/2,bottom-h,w,h);
 }
 ctx.restore();
 return true;
}

const PHASE5_PLATFORM_FILES=Object.freeze({
 return:[
  "../assets/game/phase5/platforms/5A-estrada-retorno/phase5-5a-01-plataforma-outono-lanternas.png",
  "../assets/game/phase5/platforms/5A-estrada-retorno/phase5-5a-02-plataforma-outono-ruinas.png",
  "../assets/game/phase5/platforms/5A-estrada-retorno/phase5-5a-03-ruinas-flutuantes-luar-outono.png",
  "../assets/game/phase5/platforms/5A-estrada-retorno/phase5-5a-04-plataforma-outono-halloween.png",
  "../assets/game/phase5/platforms/5A-estrada-retorno/phase5-5a-05-plataforma-flutuante-iluminada.png",
  "../assets/game/phase5/platforms/5A-estrada-retorno/phase5-5a-06-ponte-outono-lanternas-abobora.png"
 ],
 houses:[
  "../assets/game/phase5/platforms/5B-vila-janelas/phase5-5b-01-plataforma-medieval-outono-iluminada.png",
  "../assets/game/phase5/platforms/5B-vila-janelas/phase5-5b-02-plataforma-pedra-outonal-lanternas.png",
  "../assets/game/phase5/platforms/5B-vila-janelas/phase5-5b-03-ponte-rustica-halloween-outono.png",
  "../assets/game/phase5/platforms/5B-vila-janelas/phase5-5b-04-plataforma-poco-halloween.png",
  "../assets/game/phase5/platforms/5B-vila-janelas/phase5-5b-05-plataforma-flutuante-gotica-outono.png",
  "../assets/game/phase5/platforms/5B-vila-janelas/phase5-5b-06-plataforma-outono-sombrio.png"
 ],
 clock:[
  "../assets/game/phase5/platforms/5C-relogios-reflexos/phase5-5c-01-plataforma-relogio-outono.png",
  "../assets/game/phase5/platforms/5C-relogios-reflexos/phase5-5c-02-plataforma-espelho-lunar.png",
  "../assets/game/phase5/platforms/5C-relogios-reflexos/phase5-5c-03-plataforma-engrenagens-outono.png",
  "../assets/game/phase5/platforms/5C-relogios-reflexos/phase5-5c-04-plataforma-relogio-dourado.png",
  "../assets/game/phase5/platforms/5C-relogios-reflexos/phase5-5c-05-plataforma-tempo-fraturado.png",
  "../assets/game/phase5/platforms/5C-relogios-reflexos/phase5-5c-06-plataforma-flutuante-outono.png"
 ],
 garden:[
  "../assets/game/phase5/platforms/5D-jardim-memorias/phase5-5d-01-trilha-memorial-principal.png",
  "../assets/game/phase5/platforms/5D-jardim-memorias/phase5-5d-02-altar-memorial-pequeno.png",
  "../assets/game/phase5/platforms/5D-jardim-memorias/phase5-5d-03-plataforma-raizes-flores-secas.png",
  "../assets/game/phase5/platforms/5D-jardim-memorias/phase5-5d-04-pedestal-de-oferta.png",
  "../assets/game/phase5/platforms/5D-jardim-memorias/phase5-5d-05-ponte-curta-jardim.png",
  "../assets/game/phase5/platforms/5D-jardim-memorias/phase5-5d-06-saida-contemplativa.png"
 ],
 city:[
  "../assets/game/phase5/platforms/5E-cidade-rotulos/phase5-5e-01-chao-principal-praca.png",
  "../assets/game/phase5/platforms/5E-cidade-rotulos/phase5-5e-02-plataforma-bases-placas.png",
  "../assets/game/phase5/platforms/5E-cidade-rotulos/phase5-5e-03-plataforma-moldura-correntes.png",
  "../assets/game/phase5/platforms/5E-cidade-rotulos/phase5-5e-04-passarela-rachada-praca.png",
  "../assets/game/phase5/platforms/5E-cidade-rotulos/phase5-5e-05-pequeno-palco-confronto.png",
  "../assets/game/phase5/platforms/5E-cidade-rotulos/phase5-5e-06-transicao-caminho-final.png"
 ],
 promise:[
  "../assets/game/phase5/platforms/5F-caminho-promessa/phase5-5f-01-caminho-principal-promessa.png",
  "../assets/game/phase5/platforms/5F-caminho-promessa/phase5-5f-02-plataforma-sigilo-promessa.png",
  "../assets/game/phase5/platforms/5F-caminho-promessa/phase5-5f-03-plato-circular-flutuante.png",
  "../assets/game/phase5/platforms/5F-caminho-promessa/phase5-5f-04-passarela-lanternas.png",
  "../assets/game/phase5/platforms/5F-caminho-promessa/phase5-5f-05-aproximacao-final-escadaria.png"
 ],
 final:[
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-01-chao-principal-arena.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-02-plataforma-lateral-esquerda.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-03-plataforma-lateral-direita.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-04-plato-central-selo.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-05-passarela-circense.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-06-base-espelho-pedestal.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-07-plataforma-quebrada.png",
  "../assets/game/phase5/platforms/5G-sala-espelhos-final/phase5-5g-08-limiar-ultima-lanterna.png"
 ],
 shared:[
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-01-ponte-outonal-encantada.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-02-plataforma-outono-decorada.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-03-plataforma-luz-outono.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-04-limiar-outono-ruinas.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-05-plataforma-flutuante-outono.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-06-ponte-cristal-mistico.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-07-plataforma-halloween-flutuante.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-08-plataforma-outono.png",
  "../assets/game/phase5/platforms/5Z-shared/phase5-5z-09-guirlanda-roxa-dourada.png"
 ]
});

const phase5PlatformCache=new Map();
function phase5PlatformKey(section,index){return section+":"+index}
function loadPhase5Platform(section,index){
 const list=PHASE5_PLATFORM_FILES[section]||[];
 const src=list[index];
 if(!src)return Promise.resolve(null);
 const key=phase5PlatformKey(section,index);
 const cached=phase5PlatformCache.get(key);
 if(cached?.promise)return cached.promise;
 const im=new Image();
 const entry={img:im,ready:false,promise:null};
 entry.promise=new Promise(resolve=>{
  im.onload=()=>{entry.ready=true;resolve(entry)};
  im.onerror=()=>{entry.ready=false;resolve(null)};
 });
 phase5PlatformCache.set(key,entry);
 im.src=src+"?v=1";
 return entry.promise;
}
function ensurePhase5PlatformSection(section){
 const list=PHASE5_PLATFORM_FILES[section]||[];
 return Promise.allSettled(list.map((_,i)=>loadPhase5Platform(section,i)));
}
function ensurePhase5PlatformWindow(index){
 const ids=[];
 for(const n of [index-1,index,index+1]){
  if(n>=0&&n<SECTIONS.length)ids.push(SECTIONS[n].id);
 }
 ids.forEach(id=>ensurePhase5PlatformSection(id));
 // Mantém no máximo a vizinhança imediata em memória.
 for(const [key,entry] of phase5PlatformCache){
  const sec=key.split(":")[0];
  if(!ids.includes(sec)&&sec!=="shared"){
   try{entry.img.src=""}catch(_){}
   phase5PlatformCache.delete(key);
  }
 }
}
function phase5PlatformImage(section,index){
 const entry=phase5PlatformCache.get(phase5PlatformKey(section,index));
 return entry?.ready?entry.img:null;
}
function drawPhase5PlatformArt(section,index,x,top,w,surface=.42,alpha=1,visualScale=1,clipToWidth=true){
 const im=phase5PlatformImage(section,index);
 if(!im||!im.naturalWidth||!im.naturalHeight)return false;
 const drawW=w*visualScale;
 const h=drawW*(im.naturalHeight/im.naturalWidth);
 const drawX=x+(w-drawW)/2;
 // R2.2 · a colisão continua exatamente em "top", mas a pintura sobe alguns
 // pixels para a borda visível encontrar a sola do Jack e eliminar o efeito
 // de flutuação provocado pelas margens transparentes dos PNGs.
 const visualLift=10;
 ctx.save();
 if(clipToWidth){
  ctx.beginPath();
  ctx.rect(x,0,w,H);
  ctx.clip();
 }
 ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,drawX,top-h*surface-visualLift,drawW,h);
 ctx.restore();
 return true;
}

const PHASE5_GROUND_ART=Object.freeze([
 // R2 · poucas peças grandes, escala quase 1:1 e leitura horizontal contínua.
 // A arte veste a colisão; nunca cria uma "plataforma fantasma" fora dela.
 {s:"return",i:0,x:0,w:570,scale:1.08},
 {s:"return",i:3,x:570,w:570,scale:1.08},
 {s:"return",i:5,x:1140,w:560,scale:1.08},

 {s:"houses",i:0,x:1700,w:600,scale:1.08},
 {s:"houses",i:1,x:2300,w:600,scale:1.08},
 {s:"houses",i:2,x:2900,w:600,scale:1.08},

 {s:"clock",i:0,x:3500,w:620,scale:1.06},
 {s:"clock",i:2,x:4120,w:615,scale:1.06},
 {s:"clock",i:3,x:4735,w:615,scale:1.06},

 {s:"garden",i:0,x:5350,w:670,scale:1.06},
 {s:"garden",i:2,x:6020,w:665,scale:1.06},
 {s:"garden",i:5,x:6685,w:665,scale:1.06},

 {s:"city",i:0,x:7350,w:720,scale:1.06},
 {s:"city",i:1,x:8070,w:715,scale:1.06},
 {s:"city",i:5,x:8785,w:715,scale:1.06},

 {s:"promise",i:0,x:9500,w:450,scale:1.10},
 {s:"promise",i:3,x:9950,w:450,scale:1.10},
 {s:"promise",i:4,x:10400,w:450,scale:1.10},

 {s:"final",i:1,x:10850,w:585,scale:1.04,surface:.38},
 {s:"final",i:0,x:11435,w:580,scale:1.04,surface:.38},
 {s:"final",i:7,x:12015,w:585,scale:1.04,surface:.38}
]);

const PHASE5_ELEVATED_ART=Object.freeze([
 // R2.1 · sprite e hitbox usam a mesma largura física.
 {p:0,s:"clock",i:1,scale:1.00},
 {p:1,s:"clock",i:4,scale:1.00},
 {p:2,s:"clock",i:1,scale:1.00},

 {p:3,s:"city",i:2,scale:1.00},
 {p:4,s:"city",i:4,scale:1.00},
 {p:5,s:"city",i:2,scale:1.00},
 {p:6,s:"city",i:4,scale:1.00},

 {p:7,s:"final",i:1,scale:1.00,surface:.38},
 {p:8,s:"final",i:3,scale:1.00,surface:.36},
 {p:9,s:"final",i:2,scale:1.00,surface:.38}
]);

// Elementos utilitários do lote 5Z usados como acabamento de transição.
const PHASE5_SHARED_DECOR=Object.freeze([]);

// O lote 5Z é utilitário: carregamos somente as quatro peças usadas agora.

const initialPlatformReady=ensurePhase5PlatformSection("return");
window.__PHASE_ASSETS_READY=Promise.allSettled([
 jackDialogueReady,
 phase5BackgroundPromises.return,
 initialPlatformReady,
 phase5RoadPuzzlePromises.seal,
 phase5RoadPuzzlePromises.wave1,
 shadowReturnAssetsReady,
 witnessBlindAssetsReady,
 repeaterAssetsReady,
 phase5CheckpointAssetsReady
]);

const PHASE5_MUSIC=Object.freeze({
 return:{src:"../assets/audio/phase5/phase5-01-o-sino-chama-para-tras.mp3?v=1",volume:.40},
 houses:{src:"../assets/audio/phase5/phase5-02-casas-que-ainda-esperam.mp3?v=1",volume:.40},
 clock:{src:"../assets/audio/phase5/phase5-03-o-relogio-sem-ontem.mp3?v=1",volume:.40},
 garden:{src:"../assets/audio/phase5/phase5-04-aquilo-que-nao-precisa-ser-carregado.mp3?v=1",volume:.40},
 city:{src:"../assets/audio/phase5/phase5-05-a-cidade-sem-jack.mp3?v=1",volume:.42},
 promise:{src:"../assets/audio/phase5/phase5-06-para-todos-eles.mp3?v=1",volume:.40},
 final:{src:"../assets/audio/phase5/phase5-06-para-todos-eles.mp3?v=1",volume:.40},
 boss1:{src:"../assets/audio/phase5/phase5-07-o-que-voce-fez.mp3?v=1",volume:.47},
 boss2:{src:"../assets/audio/phase5/phase5-08-o-que-voce-faz-depois.mp3?v=1",volume:.47},
 finale:{src:"../assets/audio/phase5/phase5-09-a-ultima-lanterna.mp3?v=1",volume:.43}
});
const ambient=new Audio();
ambient.loop=true;ambient.preload="metadata";ambient.volume=.40;
let musicOn=localStorage.getItem("jack-phase5-music-muted")!=="1";
let phase5MusicKey="",phase5MusicFadeToken=0;
const musicBtn=document.getElementById("phase5MusicToggle");

function desiredPhase5Music(){
 if(ending||phase5Complete||bossResolved)return "finale";
 if(bossStarted){
  if(bossAct>=2)return "boss2";
  return "boss1";
 }
 const id=currentSection().id;
 return PHASE5_MUSIC[id]?id:"return";
}
function fadeAmbientTo(target,duration=520,pauseAtEnd=false,token=phase5MusicFadeToken){
 const from=ambient.volume,started=performance.now();
 const tick=now=>{
  if(token!==phase5MusicFadeToken)return;
  const q=Math.min(1,(now-started)/Math.max(1,duration));
  const eased=q*(2-q);
  ambient.volume=from+(target-from)*eased;
  if(q<1)requestAnimationFrame(tick);
  else{
   ambient.volume=target;
   if(pauseAtEnd&&target<=.001)ambient.pause();
  }
 };
 requestAnimationFrame(tick);
}
function setPhase5Music(key,immediate=false){
 const cfg=PHASE5_MUSIC[key];
 if(!cfg||key===phase5MusicKey)return;
 phase5MusicKey=key;
 const token=++phase5MusicFadeToken;
 const swap=()=>{
  if(token!==phase5MusicFadeToken)return;
  ambient.pause();
  ambient.src=cfg.src;
  ambient.loop=true;
  ambient.currentTime=0;
  ambient.muted=!musicOn;
  ambient.volume=immediate?cfg.volume:0;
  ambient.load();
  if(running&&musicOn){
   ambient.play().then(()=>{
    if(!immediate)fadeAmbientTo(cfg.volume,760,false,token);
   }).catch(()=>{});
  }
 };
 if(immediate||ambient.paused||!running){
  swap();
 }else{
  fadeAmbientTo(0,380,true,token);
  setTimeout(swap,400);
 }
}
function syncPhase5Music(immediate=false){
 setPhase5Music(desiredPhase5Music(),immediate);
}
function syncMusic(){
 ambient.muted=!musicOn;
 if(musicBtn){
  musicBtn.setAttribute("aria-pressed",String(!musicOn));
  musicBtn.querySelector("b").textContent=musicOn?"♫":"×";
 }
}
musicBtn?.addEventListener("click",()=>{
 musicOn=!musicOn;
 localStorage.setItem("jack-phase5-music-muted",musicOn?"0":"1");
 syncMusic();
 if(musicOn&&running){
  syncPhase5Music(true);
  const cfg=PHASE5_MUSIC[phase5MusicKey]||PHASE5_MUSIC.return;
  ambient.volume=cfg.volume;
  ambient.play().catch(()=>{});
 }else ambient.pause();
});
syncMusic();

function banner(t){
 ui.banner.textContent=t;ui.banner.classList.add("show");clearTimeout(bannerTimer);
 bannerTimer=setTimeout(()=>ui.banner.classList.remove("show"),1800);
}
function say(t){
 ui.msg.textContent=t;ui.msg.classList.add("show");clearTimeout(messageTimer);
 messageTimer=setTimeout(()=>ui.msg.classList.remove("show"),2400);
}
function phase5JackExpression(line){
 const speaker=(line?.speaker||"").toUpperCase();
 const text=(line?.text||"").toUpperCase();
 if(speaker==="MEMÓRIA DE JACK")return 1; // sério
 if(/INFELIZMENTE|VOCABULÁRIO|BOA NOTÍCIA|DESCONFIADO|CANSADO/.test(text))return 2; // ironia
 if(/SURPRESA|QUE\?|QUEM\?|PARA QUEM|ENTÃO PARA QUEM/.test(text))return 3; // surpresa
 if(/CONTINUAR|AGORA|ESSA PARTE NÃO|EU NÃO VOU|É O BASTANTE|VENHA PARA A LUZ/.test(text))return 4; // determinado
 if(/FINALMENTE|SEI COMO|ACHEI QUE|TALVEZ|NADA DISSO|EU FUI MUITAS COISAS/.test(text))return 5; // resolvido/reflexivo
 if(/EU SEI|JÁ FUI|TAMBÉM|EU DISSE ISSO|PASSEI TEMPO DEMAIS/.test(text))return 1;
 return 0;
}
function phase5DialogueLines(lines){
 if(!Array.isArray(lines))return lines;
 return lines.map(line=>{
  if(!line||line.portrait)return line;
  const speaker=(line.speaker||"").toUpperCase();
  if(speaker==="JACK"||speaker==="MEMÓRIA DE JACK"){
   return {...line,portrait:"jack",expression:phase5JackExpression(line)};
  }
  return line;
 });
}
function openLines(lines,cb){
 input.left=input.right=input.down=input.run=false;p.vx=0;
 dialogue.open(phase5DialogueLines(lines),cb);
}
function save(){
 const data={
  returnOpened,roadBlockedSeen,roadMonologueCompleted,housesSolved,clockSolved,gardenSolved,citySolved,promiseSolved,
  housesLamps:housesLamps.map(v=>v.on),clockCharged:[...clockCharged],gardenPlaced:[...gardenPlaced],
  cityMarks:[...cityLit],carriedItem,promiseStep,sectionSeen:[...sectionSeen],deadEnemies:[...deadEnemies],
  activeCheckpoint,bossStarted,bossAct,bossSigils:[...bossSigilLit],bossLessons:[...bossLessonLit],
  bossContinued,bossResolved,phase5Complete,px:p.x,py:p.y
 };
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));if(activeCheckpoint)localStorage.setItem(CP_KEY,activeCheckpoint)}catch(_){}
}
function sectionFor(x){for(let i=0;i<SECTIONS.length;i++)if(x>=SECTIONS[i].start&&x<SECTIONS[i].end)return i;return SECTIONS.length-1}
function currentSection(){return SECTIONS[Math.max(0,sectionFor(p.x+p.w/2))]}
function objective(){
 const id=currentSection().id;
 if(id==="return"){
  if(!roadBlockedSeen)return "Siga a estrada até onde a névoa permitir.";
  if(!roadMonologueCompleted)return "O sino chama para trás. Volte pelo caminho que acabou de percorrer.";
  if(!returnOpened)return "Escute Jack até o fim. Só então a estrada poderá mudar.";
  return "O caminho mudou. Atravesse o Marco do Retorno.";
 }
 if(id==="houses"&&!housesSolved)return "Apague as 3 lanternas que mantêm janelas esperando. Preserve as 2 que iluminam a estrada.";
 if(id==="clock"&&!clockSolved)return "Use F junto aos 3 espelhos para impedir o mecanismo de voltar a ONTEM.";
 if(id==="garden"&&!gardenSolved)return carriedItem?"Leve o objeto ao memorial indicado e pressione E.":"Deposite CARTA, CHAVE e RETRATO nos memoriais. Guardar tudo impede continuar.";
 if(id==="city"&&!citySolved)return "Ilumine as 4 marcas de ações e enfrente o rótulo MISERÁVEL.";
 if(id==="promise"&&!promiseSolved)return "Aproxime-se das quatro marcas da promessa e pressione E, na ordem em que chamam.";
 if(id==="final"){
  if(!bossStarted)return "Entre na escuridão e encontre a Última Lanterna.";
  if(bossAct===1)return "ATO I · Ilumine e RECONHEÇA as quatro acusações. Não apague o passado.";
  if(bossAct===2)return "ATO II · Acenda as quatro lições. Duas exigem LUZ REFLETIDA.";
  if(bossAct===3&&!bossContinued)return "ATO III · Aproxime-se de O Miserável e pressione E · CONTINUAR.";
  if(bossResolved)return "A Última Lanterna está adiante. Aproxime-se e pressione E.";
 }
 return "Continue pela estrada.";
}
function syncHud(){
 ui.health.textContent=Array.from({length:3},(_,i)=>i<life?"♥":"♡").join(" ");
 ui.obj.textContent=objective();
}

function groundAt(x){
 for(const r of GROUND)if(x>=r.x1&&x<=r.x2)return r;
 return null;
}
function groundYAt(x){
 return groundAt(x)?.y??FLOOR;
}
function surfaceYAt(x){
 let y=groundYAt(x);
 for(const q of PLATFORMS){
  if(x>=q.x&&x<=q.x+q.w)y=Math.min(y,q.y);
 }
 return y;
}
function pointOnGround(x){return !!groundAt(x)}
function platformAtFoot(cx,bottom,oldBottom){
 let best=null;
 for(const q of PLATFORMS){
  if(cx<q.x||cx>q.x+q.w)continue;
  if(oldBottom<=q.y+8&&bottom>=q.y){if(!best||q.y<best.y)best=q}
 }
 return best;
}
function gateCollision(oldX){
 for(const g of GATES){
  if(g.flag())continue;
  // O primeiro gate continua fisicamente ativo. Só o desenho genérico dele
  // é ocultado, porque o selo P5-2A assume a representação visual.
  const oldR=oldX+p.w,newR=p.x+p.w;
  if(oldR<=g.x&&newR>g.x){p.x=g.x-p.w;p.vx=0;return}
  if(oldX>=g.x+18&&p.x<g.x+18){p.x=g.x+18;p.vx=0;return}
 }
}
function checkpointAllowed(cp){return !cp.require||cp.require()}
function updateCheckpoint(){
 const pc=p.x+p.w/2;
 const activeIndex=CHECKPOINTS.findIndex(v=>v.id===activeCheckpoint);
 for(let i=0;i<CHECKPOINTS.length;i++){
  const cp=CHECKPOINTS[i];
  if(i<=activeIndex||!checkpointAllowed(cp))continue;
  if(Math.abs(pc-cp.x)<78&&Math.abs((p.y+p.h)-surfaceYAt(pc))<105){
   activeCheckpoint=cp.id;
   checkpointActivation={id:cp.id,startedAt:performance.now(),duration:900};
   life=3;
   banner(cp.name+" · ACESO");
   say("A estrada guardará este passo.");
   save();syncHud();break;
  }
 }
}
function respawn(){
 const cp=CHECKPOINTS.find(v=>v.id===activeCheckpoint);
 life=Math.max(0,life-1);
 if(life<=0){life=3;say("A estrada devolveu Jack ao último marco.")}
 else say("A escuridão alcançou Jack. "+life+"/3.");
 p.x=cp?cp.respawnX:150;
 p.y=groundYAt(p.x)-p.h-8;
 p.vx=p.vy=0;p.inv=1.2;shots.length=0;hazards.length=0;save();syncHud();
}

function makeEnemy(id,kind,x,minX,maxX,hp,label){
 return {id,kind,x,y:0,minX,maxX,hp,maxHp:hp,label,dir:-1,vx:0,cd:.7,t:0,hit:0,attackFx:0,dashFx:0};
}
const enemies=[
 makeEnemy("shadow-1","shadow",980,720,1400,2,"SOMBRA DE RETORNO"),

 makeEnemy("witness-1","witness",2050,1840,2160,2,"TESTEMUNHA CEGA"),
 makeEnemy("accuser-1","accuser",3320,3180,3440,3,"MENTIROSO"),

 makeEnemy("repeater-1","repeater",3870,3600,3960,2,"REPETIDOR"),
 makeEnemy("repeater-2","repeater",4620,4360,4740,2,"REPETIDOR"),
 makeEnemy("accuser-2","accuser",5150,4970,5280,3,"COVARDE"),

 makeEnemy("ash-1","ash",5900,5650,6050,3,"PORTADOR DE CINZAS"),
 makeEnemy("witness-2","witness",6420,6200,6600,2,"TESTEMUNHA CEGA"),
 makeEnemy("ash-2","ash",6900,6760,7060,3,"PORTADOR DE CINZAS"),
 makeEnemy("accuser-3","accuser",7200,7080,7290,3,"AVARENTO"),

 makeEnemy("shadow-2","shadow",7700,7420,7980,2,"SOMBRA DE RETORNO"),
 makeEnemy("witness-3","witness",8250,8170,8330,2,"TESTEMUNHA CEGA"),
 makeEnemy("repeater-3","repeater",8600,8480,8700,3,"REPETIDOR"),
 makeEnemy("ash-3","ash",9000,8880,9160,3,"PORTADOR DE CINZAS"),
 makeEnemy("accuser-4","accuser",9320,9200,9440,4,"MISERÁVEL")
].filter(e=>!deadEnemies.has(e.id));;

function enemyActive(e){
 const x=e.x;
 if(x<1700)return true;
 if(x<3500)return returnOpened;
 if(x<5350)return housesSolved;
 if(x<7350)return clockSolved;
 if(x<9500)return gardenSolved;
 return true;
}
function enemyGroundY(e){
 return groundAt(e.x)?.y??FLOOR;
}
function hurtPlayer(sourceX){
 if(p.inv>0||phase5Complete)return;
 life--;p.inv=1.0;p.vx=p.x<sourceX?-260:260;p.vy=-300;
 say("A escuridão atingiu Jack — "+life+"/3.");
 if(life<=0)setTimeout(respawn,180);
 syncHud();
}
function killEnemy(e){
 if(e.kind==="shadow"){
  enemyDissolves.push({kind:"shadow",x:e.x,y:e.y,dir:e.vx<0?-1:1,t:.48,maxT:.48});
 }
 if(e.kind==="witness"){
  enemyDissolves.push({kind:"witness",x:e.x,y:e.y,dir:e.vx<0?-1:1,t:.62,maxT:.62});
 }
 if(e.kind==="repeater"){
  enemyDissolves.push({kind:"repeater",x:e.x,y:e.y,dir:e.vx<0?-1:1,t:.56,maxT:.56});
 }
 deadEnemies.add(e.id);e.dead=true;banner(e.label+" · DISSIPADO");
 if(e.id==="accuser-4")checkCitySolved();
 save();
}
function damageEnemy(e,reflected=false){
 if(e.dead||e.hit>0)return false;
 if(e.kind==="ash"&&!reflected){e.hit=.18;say("A lanterna apagada absorveu a Luz. Tente refletir o facho.");return true}
 e.hp--;e.hit=.24;e.x+=p.dir*24;
 if(e.hp<=0)killEnemy(e);
 return true;
}
function updateEnemies(dt){
 const pc=p.x+p.w/2;
 for(const e of enemies){
  if(e.dead||!enemyActive(e))continue;
  e.cd=Math.max(0,e.cd-dt);e.hit=Math.max(0,e.hit-dt);e.attackFx=Math.max(0,e.attackFx-dt);e.dashFx=Math.max(0,e.dashFx-dt);e.t+=dt;
  const dx=pc-e.x,ad=Math.abs(dx),sg=Math.sign(dx)||1;
  e.y=enemyGroundY(e);

  if(e.kind==="shadow"){
   const looking=Math.sign(e.x-pc)===p.dir;
   e.vx=looking?-sg*75:sg*(ad<330?150:85);
  }else if(e.kind==="witness"){
   e.vx=(ad<330?0:e.dir*28);
   if(e.x<e.minX){e.x=e.minX;e.dir=1}if(e.x>e.maxX){e.x=e.maxX;e.dir=-1}
   if(ad<330&&e.cd<=0){
    e.attackFx=.54;
    hazards.push({x:pc,t:1.35,arm:.58});e.cd=2.15;
   }
  }else if(e.kind==="repeater"){
   if(e.cd<=0&&ad<430){
    e.vx=(Math.sign(p.vx)||sg)*210;
    e.dashFx=.48;
    e.cd=1.35;
   }else e.vx*=.94;
  }else{
   e.vx=sg*(e.kind==="accuser"?70:55);
  }

  e.x+=e.vx*dt;
  if(e.x<e.minX){e.x=e.minX;e.dir=1}if(e.x>e.maxX){e.x=e.maxX;e.dir=-1}
  if(ad<58&&Math.abs((p.y+p.h)-e.y)<110&&e.cd<=.25){
   e.attackFx=.28;
   hurtPlayer(e.x);e.cd=.9;
  }
 }
 for(const fx of enemyDissolves)fx.t-=dt;
 enemyDissolves=enemyDissolves.filter(fx=>fx.t>0);
 for(const h of hazards){
  h.t-=dt;h.arm-=dt;
  if(h.arm<=0&&h.t>0&&Math.abs(pc-h.x)<42&&p.y+p.h>520){hurtPlayer(h.x);h.t=0}
 }
 hazards=hazards.filter(h=>h.t>0);
}

function lineDistance(px,py,x1,y1,x2,y2){
 const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1;
 const c1=vx*wx+vy*wy,c2=vx*vx+vy*vy;
 const t=Math.max(0,Math.min(1,c2?c1/c2:0));
 const dx=px-(x1+vx*t),dy=py-(y1+vy*t);return Math.hypot(dx,dy);
}
function allClockCharged(){return clockMirrors.every(m=>clockCharged.has(m.node))}
function checkClockSolved(){
 if(clockSolved||!allClockCharged())return;
 clockSolved=true;banner("AGORA");openLines(story.clockSolved,save);save();
}
function checkHousesSolved(){
 const ok=housesLamps.every(v=>v.type==="wait"?!v.on:v.on);
 if(housesSolved||!ok)return;
 housesSolved=true;banner("AS CASAS PARARAM DE ESPERAR");openLines(story.housesSolved,save);save();
}
function checkGardenSolved(){
 if(gardenSolved||gardenPlaced.size<gardenItems.length)return;
 gardenSolved=true;carriedItem="";banner("NADA PRECISA CONTINUAR PRESO");openLines(story.gardenSolved,save);save();
}
function checkCitySolved(){
 if(citySolved||cityLit.size<cityMarks.length||!deadEnemies.has("accuser-4"))return;
 citySolved=true;banner("A PORTA RECONHECEU O CAMINHO");openLines(story.citySolved,save);save();
}

function nearestMirror(){
 const pc=p.x+p.w/2,pcy=p.y+p.h/2;
 const list=[...clockMirrors,...bossMirrors,...gardenMirrors,cityAshMirror];
 let best=null,bd=999;
 for(const m of list){
  const d=Math.hypot(m.x-pc,(m.y-pcy)*.8);
  const reach=m.range||220;
  if(d<reach&&d<bd){best=m;bd=d}
 }
 return best;
}
function useLight(){
 if(dialogue.active||lightCooldown>0||phase5Complete)return;
 lightCooldown=.32;lightPulse=.36;p.attack=.42;
 const pc=p.x+p.w/2,pcy=p.y+p.h*.48;
 const mirror=nearestMirror();
 if(mirror){
  reflectedFx.push({x1:pc,y1:pcy,x2:mirror.x,y2:mirror.y,x3:mirror.targetX,y3:mirror.targetY,t:.35});
  if(Number.isFinite(mirror.node)&&currentSection().id==="clock"){
   clockCharged.add(mirror.node);banner("REFLEXO "+clockCharged.size+"/3");checkClockSolved();save();
  }
  if(Number.isFinite(mirror.lesson)&&bossAct===2){
   bossLessonLit.add(mirror.lesson);banner("LIÇÃO "+bossLessonLit.size+"/4");checkBossActTwo();save();
  }
  for(const e of enemies){
   if(e.dead||!enemyActive(e))continue;
   if(lineDistance(e.x,e.y-45,mirror.x,mirror.y,mirror.targetX,mirror.targetY)<75)damageEnemy(e,true);
  }
  return;
 }
 const radius=carriedItem?190:245;
 for(const e of enemies){
  if(e.dead||!enemyActive(e))continue;
  const dx=e.x-pc,dy=(e.y-45)-pcy;
  if(Math.hypot(dx,dy*.75)<radius&&(Math.sign(dx)===p.dir||Math.abs(dx)<70))damageEnemy(e,false);
 }
 if(currentSection().id==="city"){
  cityMarks.forEach((m,i)=>{
   if(Math.abs(m.x-pc)<radius&&!cityLit.has(i)){cityLit.add(i);banner(m.label);save()}
  });
  checkCitySolved();
 }
 if(bossAct===1){
  bossSigils.forEach((s,i)=>{
   if(Math.abs(s.x-pc)<radius&&!bossSigilLit.has(i)){
    bossSigilLit.add(i);banner("RECONHECIDO · "+s.label);save();
   }
  });
  checkBossActOne();
 }
 if(bossAct===2){
  bossLessons.forEach((s,i)=>{
   if(s.mode==="direct"&&Math.abs(s.x-pc)<radius&&!bossLessonLit.has(i)){
    bossLessonLit.add(i);banner("LIÇÃO · "+s.label);save();
   }
  });
  checkBossActTwo();
 }
}
function checkBossActOne(){
 if(bossAct!==1||bossSigilLit.size<4)return;
 bossAct=2;shots.length=0;banner("ATO II · O QUE VOCÊ FEZ DEPOIS");
 openLines(story.bossActTwo,()=>{bossShotCd=1.1;save()});save();
}
function checkBossActTwo(){
 if(bossAct!==2||bossLessonLit.size<4)return;
 bossAct=3;shots.length=0;banner("ATO III · QUEM CONTINUA");
 openLines(story.bossActThree,save);save();
}

function interact(){
 if(dialogue.active||phase5Complete)return;
 const pc=p.x+p.w/2;

 if(currentSection().id==="houses"&&!housesSolved){
  let best=null,bd=999;
  housesLamps.forEach(l=>{const d=Math.abs(l.x-pc);if(d<70&&d<bd){best=l;bd=d}});
  if(best){
   best.on=!best.on;
   if(best.type==="path"&&!best.on)say("Essa luz aponta para a estrada. Talvez não seja essa.");
   else say(best.on?"A lanterna voltou a acender.":"A espera se apagou sem apagar a memória.");
   checkHousesSolved();save();return;
  }
 }

 if(currentSection().id==="garden"&&!gardenSolved){
  if(carriedItem){
   const item=gardenItems.find(v=>v.id===carriedItem);
   if(item&&Math.abs(item.memorialX-pc)<85){
    gardenPlaced.add(item.id);banner(item.title+" · DEIXADO EM MEMÓRIA");carriedItem="";checkGardenSolved();save();return;
   }
  }else{
   const item=gardenItems.find(v=>!gardenPlaced.has(v.id)&&Math.abs(v.x-pc)<75);
   if(item){carriedItem=item.id;banner(item.title+" · CARREGADO");say("O peso reduz o salto e a Luz.");save();return}
  }
 }

 if(currentSection().id==="promise"&&!promiseSolved){
  const a=promiseAltars[promiseStep];
  if(a&&Math.abs(a.x-pc)<90){
   const idx=promiseStep;promiseStep++;
   banner(a.label);
   openLines(story.promisePieces[idx],()=>{
    if(promiseStep>=4&&!promiseSolved){
     promiseSolved=true;banner("A PROMESSA FOI LEMBRADA");openLines(story.promiseSolved,save);
    }else save();
   });
   save();return;
  }
 }

 if(bossAct===3&&!bossContinued&&Math.abs(pc-11740)<120){
  bossContinued=true;bossResolved=true;banner("CONTINUAR");
  openLines(story.bossContinue,save);save();return;
 }

 if(bossResolved&&Math.abs(pc-12420)<115){
  completePhase();return;
 }
}

function updateRoadStory(){
 if(!roadMonologueCompleted&&p.x+p.w>1660){
  p.x=1660-p.w;
  p.vx=0;
 }
 const pc=p.x+p.w/2;
 if(!roadBlockedSeen&&pc>1450){
  roadBlockedSeen=true;banner("A ESTRADA RECUSA O PASSO");openLines(story.roadBlocked,save);save();
 }
 if(roadBlockedSeen&&!roadMonologueCompleted&&pc<280){
  banner("O CAMINHO EXISTIA PARA TRÁS");
  openLines(story.roadTurn,()=>{
   // ENIGMA 1: voltar não basta. O monólogo precisa terminar.
   // Só o callback final do diálogo autoriza a abertura do caminho.
   roadMonologueCompleted=true;
   returnOpened=true;
   roadOpenFxStartedAt=performance.now();
   save();
   syncHud();
  });
  save();
 }
}
function sectionIntro(idx){
 const id=SECTIONS[idx].id;if(sectionSeen.has(id))return;
 sectionSeen.add(id);save();
 const map={houses:story.housesIntro,clock:story.clockIntro,garden:story.gardenIntro,city:story.cityIntro};
 if(map[id])setTimeout(()=>{if(!dialogue.active)openLines(map[id],save)},260);
}
function startBoss(){
 if(bossStarted||p.x<10980)return;
 bossStarted=true;bossAct=bossAct||1;banner("O MISERÁVEL");
 openLines(story.bossIntro,()=>{bossShotCd=.8;save()});save();
}
function updateBoss(dt){
 if(!bossStarted||bossResolved||bossAct===3)return;
 bossShotCd-=dt;
 if(bossShotCd<=0&&!dialogue.active){
  const bx=11740,by=385,pc=p.x+p.w/2,pcy=p.y+p.h/2;
  const dx=pc-bx,dy=pcy-by,d=Math.max(1,Math.hypot(dx,dy));
  const speed=bossAct===2?330:275;
  shots.push({x:bx,y:by,vx:dx/d*speed,vy:dy/d*speed,r:12,t:5});
  bossShotCd=bossAct===2?.78:1.08;
 }
 for(const s of shots){
  s.x+=s.vx*dt;s.y+=s.vy*dt;s.t-=dt;
  if(Math.hypot(s.x-(p.x+p.w/2),s.y-(p.y+p.h/2))<30){hurtPlayer(s.x);s.t=0}
 }
 shots=shots.filter(s=>s.t>0&&s.x>10800&&s.x<12650&&s.y>80&&s.y<680);
}
function completePhase(){
 if(ending||phase5Complete)return;
 ending=true;p.vx=0;input.left=input.right=input.run=false;
 syncPhase5Music();
 banner("A ÚLTIMA LANTERNA");
 openLines(story.finale,()=>{
  phase5Complete=true;ending=false;
  if(!replayMode){
   localStorage.setItem(COMPLETE_KEY,"yes");
   localStorage.setItem("jack-phase5-completed-at",String(Date.now()));
   journey?.finishJourney();
  }
  save();banner("CAMINHOS DE LUZ · CONCLUÍDO");
  setTimeout(()=>{if(ui.complete)ui.complete.hidden=false},700);
 });
}

function update(dt){
 syncPhase5Music();
 if(dialogue.active||phase5Complete){syncHud();return}
 p.anim+=dt;p.attack=Math.max(0,p.attack-dt);p.inv=Math.max(0,p.inv-dt);
 lightPulse=Math.max(0,lightPulse-dt);lightCooldown=Math.max(0,lightCooldown-dt);

 const speed=(carriedItem?145:205)*(input.run?1.28:1);
 let move=(input.right?1:0)-(input.left?1:0);
 p.vx=move*speed;if(move)p.dir=move;
 if(input.jump&&p.on){p.vy=carriedItem?-560:-650;p.on=false;input.jump=false}
 p.vy+=G*dt;
 const oldX=p.x,oldY=p.y,oldBottom=oldY+p.h;
 p.x+=p.vx*dt;p.x=Math.max(0,Math.min(WORLD-p.w,p.x));gateCollision(oldX);
 p.y+=p.vy*dt;p.on=false;

 const cx=p.x+p.w/2,bottom=p.y+p.h;
 const plat=platformAtFoot(cx,bottom,oldBottom);
 const ground=groundAt(cx);
 if(plat&&p.vy>=0){
  p.y=plat.y-p.h;p.vy=0;p.on=true;
 }else if(ground&&oldBottom<=ground.y+24&&bottom>=ground.y&&p.vy>=0){
  // +24 permite subir naturalmente os degraus de 20 px da Promessa.
  p.y=ground.y-p.h;p.vy=0;p.on=true;
 }

 if(p.y>760){respawn();return}

 updateRoadStory();
 const si=sectionFor(cx);
 if(si!==sectionIndex){
  sectionIndex=si;
  ensurePhase5PlatformWindow(si);
  banner(SECTIONS[si].name);
  sectionIntro(si);
 }
 updateCheckpoint();
 updateEnemies(dt);
 startBoss();
 updateBoss(dt);

 for(const fx of reflectedFx)fx.t-=dt;
 reflectedFx=reflectedFx.filter(f=>f.t>0);

 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.38))-cam)*Math.min(1,dt*6);
 syncHud();
 autosaveTimer-=dt;
 if(autosaveTimer<=0){autosaveTimer=.75;save()}
}

function drawBackgroundCover(im,alpha=1,pan=0,zoom=1.04){
 if(!im||!im.complete||!(im.naturalWidth||im.width))return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const scale=Math.max(W/iw,H/ih)*zoom;
 const dw=iw*scale,dh=ih*scale;
 const overflowX=Math.max(0,dw-W),overflowY=Math.max(0,dh-H);
 const clamped=Math.max(0,Math.min(1,pan));
 const dx=-overflowX*clamped;
 const dy=-overflowY*.48;
 ctx.save();
 ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,dx,dy,dw,dh);
 ctx.restore();
 return true;
}
function phase5BackgroundState(){
 const px=p.x+p.w/2;
 const idx=Math.max(0,Math.min(SECTIONS.length-1,sectionFor(px)));
 const sec=SECTIONS[idx],span=Math.max(1,sec.end-sec.start);
 const progress=Math.max(0,Math.min(1,(px-sec.start)/span));
 const transitionStart=.86;
 let next=null,blend=0;
 if(idx<SECTIONS.length-1&&progress>transitionStart){
   next=SECTIONS[idx+1];
   blend=(progress-transitionStart)/(1-transitionStart);
   blend=blend*blend*(3-2*blend);
 }
 return {sec,next,progress,blend};
}
function drawBackdrop(){
 const bg=phase5BackgroundState();
 const sec=bg.sec.id;
 const palettes={
  return:["#071015","#152027","#302c2c"],
  houses:["#0a0e12","#1d1820","#3a2823"],
  clock:["#080b12","#16152a","#3b2736"],
  garden:["#07100c","#14231a","#28351f"],
  city:["#080b0e","#171a1f","#302b2e"],
  promise:["#07090b","#11151a","#29211d"],
  final:["#020304","#09090b","#17120f"]
 };
 const pal=palettes[sec]||palettes.return;
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,pal[0]);g.addColorStop(.6,pal[1]);g.addColorStop(1,pal[2]);
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

 const primary=phase5BackgroundImgs[sec];
 const basePan=.16+bg.progress*.68;
 const drew=drawBackgroundCover(primary,1,basePan,sec==="final"?1.02:1.055);
 if(bg.next&&bg.blend>0){
   const nextIm=phase5BackgroundImgs[bg.next.id];
   drawBackgroundCover(nextIm,bg.blend,.12+bg.blend*.20,bg.next.id==="final"?1.02:1.055);
 }

 // Mantém Jack, inimigos e plataformas legíveis sobre cenários muito detalhados.
 const floorShade=ctx.createLinearGradient(0,300,0,H);
 floorShade.addColorStop(0,"rgba(3,4,5,0)");
 floorShade.addColorStop(.52,sec==="final"?"rgba(3,3,4,.08)":"rgba(3,4,5,.05)");
 floorShade.addColorStop(1,sec==="final"?"rgba(3,3,4,.42)":"rgba(3,4,5,.34)");
 ctx.fillStyle=floorShade;ctx.fillRect(0,0,W,H);

 // Encruzilhada: o panorama surreal permanece, mas recua para a revelação da promessa.
 if(sec==="promise"){
   ctx.fillStyle="rgba(8,8,9,.18)";ctx.fillRect(0,0,W,H);
 }

 // Vignette cinematográfica bem leve.
 const vg=ctx.createRadialGradient(W*.5,H*.48,H*.18,W*.5,H*.48,W*.72);
 vg.addColorStop(.58,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.31)");
 ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);

 if(!drew){
   ctx.save();ctx.globalAlpha=.18;ctx.fillStyle="#d8c27c";
   for(let i=0;i<28;i++){const x=(i*173-cam*.12)%1380,y=80+(i*97)%360;ctx.fillRect(x,y,2,2)}
   ctx.restore();
 }
}
function drawGround(){
 ctx.save();ctx.translate(-cam,0);

 // R2.2 · GROUND é apenas colisão. Não desenhamos mais retângulos físicos:
 // o jogador vê somente os sprites de chão/plataforma.
 // Chão artístico por capítulo, alinhado à altura física de cada trecho.
 for(const a of PHASE5_GROUND_ART){
  const top=groundYAt(a.x+a.w*.5);
  drawPhase5PlatformArt(a.s,a.i,a.x,top,a.w,a.surface??.42,1,a.scale??1.4,true);
 }

 // Plataformas elevadas mantêm exatamente os hitboxes originais.
 for(const a of PHASE5_ELEVATED_ART){
  const q=PLATFORMS[a.p];
  if(!q)continue;
  const drew=drawPhase5PlatformArt(a.s,a.i,q.x,q.y,q.w,a.surface??.42,1,a.scale??1,true);
  // Sem fallback geométrico visível: a hitbox permanece ativa, mas invisível.
  // Se a arte ainda estiver carregando, a plataforma não exibe um bloco artificial.
 }

 // Lote 5Z: peças de acabamento nos grandes limiares narrativos.
 for(const d of PHASE5_SHARED_DECOR){
  const top=Number.isFinite(d.top)?d.top:groundYAt(d.x+d.w*.5);
  drawPhase5PlatformArt("shared",d.i,d.x,top,d.w,d.surface,d.alpha,1.15,false);
 }

 ctx.restore();
}
function drawGates(){
 ctx.save();ctx.translate(-cam,0);
 for(const g of GATES){
  if(g.flag())continue;
  if(g.x===1660)continue; // colisão permanece; o selo P5-2A é o visual oficial.
  ctx.strokeStyle="rgba(216,188,112,.38)";ctx.lineWidth=3;
  const gy=groundYAt(g.x);
  ctx.beginPath();ctx.moveTo(g.x,260);ctx.lineTo(g.x,gy);ctx.stroke();
  for(let y=290;y<gy;y+=42){ctx.fillStyle="rgba(216,188,112,.18)";ctx.fillRect(g.x-22,y,44,3)}
 }
 ctx.restore();
}
function drawCheckpointImage(im,gy,alpha=1,scale=1){
 if(!im||!im.complete||!(im.naturalWidth||im.width))return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const h=245*scale,w=h*(iw/ih);
 ctx.save();
 ctx.globalAlpha=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,-w*.5,-h+8,w,h);
 ctx.restore();
 return true;
}
function drawCheckpoint(cp){
 const isActive=cp.id===activeCheckpoint;
 const gy=groundYAt(cp.x);
 const now=performance.now();
 const activating=isActive&&checkpointActivation.id===cp.id&&
  now-checkpointActivation.startedAt<checkpointActivation.duration;

 ctx.save();ctx.translate(cp.x-cam,gy);

 let drew=false;
 if(activating){
  const age=now-checkpointActivation.startedAt;
  const seq=phase5CheckpointImgs.activate;
  const frame=Math.min(seq.length-1,Math.floor(age/(checkpointActivation.duration/Math.max(1,seq.length))));
  drew=drawCheckpointImage(seq[frame],gy,1,1);
 }else if(isActive){
  // Glow atrás da peça principal: respira lentamente, sem virar um clarão.
  const glow=phase5CheckpointImgs.glow;
  if(glow&&glow.complete&&(glow.naturalWidth||glow.width)){
   const pulse=.22+.08*(.5+.5*Math.sin(now/520));
   drawCheckpointImage(glow,gy,pulse,1.04);
  }
  drew=drawCheckpointImage(phase5CheckpointImgs.on,gy,1,1);
 }else{
  drew=drawCheckpointImage(phase5CheckpointImgs.off,gy,.96,1);
 }

 // Fallback caso algum asset ainda esteja carregando.
 if(!drew){
  ctx.fillStyle="#30281c";ctx.fillRect(-6,-105,12,105);
  ctx.fillStyle=isActive?"#f0b94d":"#55442d";
  ctx.shadowColor=isActive?"#f0a83c":"transparent";ctx.shadowBlur=isActive?22:0;
  ctx.beginPath();ctx.arc(0,-116,24,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
 }

 // Pequena identificação diegética apenas no ponto ativo.
 if(isActive&&!activating){
  ctx.fillStyle="rgba(238,207,126,.82)";
  ctx.font="700 10px Georgia";ctx.textAlign="center";
  ctx.fillText(cp.name,0,-250);
 }
 ctx.restore();
}
function drawSectionProps(){
 const sec=currentSection().id;ctx.save();ctx.translate(-cam,0);
 if(sec==="return"){
  const now=performance.now();
  const pc=p.x+p.w/2;

  // Antes do encontro, a estrada permanece limpa: o selo só se revela
  // quando Jack descobre que a névoa está recusando a passagem.
  if(roadBlockedSeen&&!returnOpened){
   const pulse=.78+Math.sin(now/360)*.14;

   // Aura atrás do selo.
   drawRoadAssetBottom("glow",1600,FLOOR+12,570,.46*pulse);

   // Selo físico/narrativo da estrada. Ele substitui o antigo portão genérico.
   drawRoadAssetBottom("seal",1600,FLOOR+8,455,.97);

   // O sino não aparece como objeto: sua chamada visual vem de trás de Jack.
   // As duas ondas respiram em ritmos diferentes para sugerir eco.
   const wavePulse1=.48+.25*(.5+.5*Math.sin(now/430));
   const wavePulse2=.30+.22*(.5+.5*Math.sin(now/610+1.2));
   const guideX=Math.max(360,pc-235);
   drawRoadAssetBottom("wave1",guideX,FLOOR-18,390,wavePulse1,true);
   drawRoadAssetBottom("wave2",Math.max(250,pc-430),FLOOR-30,470,wavePulse2,true);

   // Indicação diegética: aparece apenas depois que a fala do bloqueio começou.
   const arrowA=.52+.30*(.5+.5*Math.sin(now/320));
   drawRoadAssetBottom("arrow",Math.max(300,pc-155),FLOOR-12,245,arrowA,true);
  }

  // Quando Jack volta, a abertura é uma lembrança visual curta, não um portal permanente.
  if(returnOpened&&roadOpenFxStartedAt>0){
   const age=(now-roadOpenFxStartedAt)/1000;
   if(age<1.8){
    const t=Math.max(0,Math.min(1,age/1.8));
    const a=Math.sin(Math.PI*t)*.95;
    const w=500+180*t;
    // O caminho se reorganiza onde Jack está olhando, para que a revelação seja visível.
    drawRoadAssetBottom("open",Math.max(340,pc+120),FLOOR+28,w,a);
   }else{
    roadOpenFxStartedAt=0;
   }
  }
 }
 if(sec==="houses"){
  // As casas agora pertencem ao panorama final; em primeiro plano ficam apenas
  // as cinco lanternas que fazem parte do enigma.
  housesLamps.forEach((l,i)=>{
   const gy=surfaceYAt(l.x);
   ctx.fillStyle="#332718";ctx.fillRect(l.x-4,gy-90,8,90);
   ctx.fillStyle=l.on?(l.type==="path"?"#e7c064":"#e28b49"):"#302a24";
   ctx.shadowColor=l.on?"#d89a48":"transparent";ctx.shadowBlur=l.on?18:0;
   ctx.beginPath();ctx.arc(l.x,gy-98,14,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   ctx.fillStyle="rgba(240,225,180,.7)";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(l.type==="path"?"ESTRADA":"JANELA",l.x,gy-125);
  });
 }
 if(sec==="clock"){
  const cx=4450,cy=330;ctx.strokeStyle="#8a744c";ctx.lineWidth=12;ctx.beginPath();ctx.arc(cx,cy,150,0,Math.PI*2);ctx.stroke();
  ["ANTES","ONTEM","AGORA","DEPOIS"].forEach((t,i)=>{const a=-Math.PI/2+i*Math.PI/2;ctx.fillStyle=t==="AGORA"&&clockSolved?"#f0ca70":"#95856b";ctx.font="700 16px Georgia";ctx.textAlign="center";ctx.fillText(t,cx+Math.cos(a)*205,cy+Math.sin(a)*185)});
  const hand=clockSolved?0:Math.sin(performance.now()/450)*1.3;ctx.strokeStyle="#e0b85b";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(hand-Math.PI/2)*105,cy+Math.sin(hand-Math.PI/2)*105);ctx.stroke();
  clockMirrors.forEach(m=>drawMirror(m,clockCharged.has(m.node)));
 }
 if(sec==="garden"){
  ctx.strokeStyle="#34412e";ctx.lineWidth=14;for(let x=5450;x<7300;x+=310){ctx.beginPath();ctx.moveTo(x,FLOOR);ctx.quadraticCurveTo(x-45,440,x+20,340);ctx.stroke()}
  gardenItems.forEach(it=>{
   const iy=groundYAt(it.x),my=groundYAt(it.memorialX);
   if(!gardenPlaced.has(it.id)&&carriedItem!==it.id){
    ctx.fillStyle="#b79a63";ctx.fillRect(it.x-18,iy-52,36,30);ctx.fillStyle="#ead595";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(it.title,it.x,iy-65);
   }
   ctx.strokeStyle=gardenPlaced.has(it.id)?"#d3b567":"#655a44";ctx.lineWidth=3;ctx.strokeRect(it.memorialX-34,my-70,68,70);
  });
  gardenMirrors.forEach(m=>drawMirror(m,false));
 }
 if(sec==="city"){
  // Fachadas, parque e circo já estão no cenário final; mantemos apenas
  // as quatro marcas jogáveis da identidade de Jack.
  cityMarks.forEach((m,i)=>{
   const gy=surfaceYAt(m.x);
   ctx.strokeStyle=cityLit.has(i)?"#e3c66e":"#5a5144";ctx.lineWidth=3;ctx.strokeRect(m.x-62,gy-70,124,46);
   ctx.fillStyle=cityLit.has(i)?"#ead58d":"#786d58";ctx.font="700 11px Georgia";ctx.textAlign="center";ctx.fillText(m.label,m.x,gy-42);
  });
  drawMirror(cityAshMirror,false);
 }
 if(sec==="promise"){
  ctx.strokeStyle="rgba(184,153,91,.3)";ctx.lineWidth=5;
  const promiseGround=groundYAt(10100);
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(10100,promiseGround);ctx.lineTo(10100+i*440,260);ctx.stroke()}
  promiseAltars.forEach((a,i)=>{
   const gy=groundYAt(a.x),on=i<promiseStep;
   ctx.fillStyle=on?"#d9b65f":"#3f392f";ctx.fillRect(a.x-4,gy-90,8,90);
   ctx.beginPath();ctx.arc(a.x,gy-98,17,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=on?"#efd48b":"#776a54";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(a.label,a.x,gy-135);
  });
 }
 if(sec==="final"){
  drawBossScene();
 }
 ctx.restore();
}
function drawMirror(m,charged){
 ctx.save();ctx.translate(m.x,m.y);ctx.rotate(-.22);
 ctx.fillStyle="#251f1b";ctx.fillRect(-8,-48,16,48);
 ctx.fillStyle=charged?"rgba(244,215,139,.75)":"rgba(174,187,184,.35)";ctx.strokeStyle="#8a7654";ctx.lineWidth=4;ctx.fillRect(-30,-92,60,52);ctx.strokeRect(-30,-92,60,52);
 ctx.restore();
}
function drawBossScene(){
 const bx=11740;
 // A Sala de Espelhos é o próprio palco narrativo do boss.
 // Apenas um véu sutil concentra a leitura no centro sem esconder a arte.
 const veil=ctx.createLinearGradient(10850,0,12600,0);
 veil.addColorStop(0,"rgba(0,0,0,.20)");
 veil.addColorStop(.48,"rgba(0,0,0,.10)");
 veil.addColorStop(1,"rgba(0,0,0,.22)");
 ctx.fillStyle=veil;ctx.fillRect(10850,180,1750,410);
 if(!bossStarted)return;
 ctx.save();ctx.translate(bx,460);
 ctx.fillStyle=bossAct===3?"#1e1d1a":"#0b0b0c";ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=28;
 ctx.beginPath();ctx.moveTo(-70,80);ctx.lineTo(-45,-105);ctx.quadraticCurveTo(0,-190,45,-105);ctx.lineTo(70,80);ctx.closePath();ctx.fill();
 ctx.fillStyle="#32281d";ctx.fillRect(-45,-62,90,16);ctx.fillStyle="#c6a75d";ctx.font="700 12px Georgia";ctx.textAlign="center";ctx.fillText("MISERÁVEL",0,-50);ctx.restore();
 if(bossAct===1){
  bossSigils.forEach((s,i)=>{const gy=surfaceYAt(s.x);ctx.strokeStyle=bossSigilLit.has(i)?"#e5c369":"#6d2f2f";ctx.lineWidth=3;ctx.strokeRect(s.x-55,gy-70,110,48);ctx.fillStyle="#cdb57a";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(s.label,s.x,gy-40)});
 }
 if(bossAct===2){
  bossLessons.forEach((s,i)=>{const gy=surfaceYAt(s.x);ctx.strokeStyle=bossLessonLit.has(i)?"#ead073":"#63594a";ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,gy-55,28,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#d8c08a";ctx.font="9px Georgia";ctx.textAlign="center";ctx.fillText(s.label,s.x,gy-12)});
  bossMirrors.forEach(m=>drawMirror(m,bossLessonLit.has(m.lesson)));
 }
 if(bossAct===3&&!bossContinued){
  ctx.fillStyle="#f0d488";ctx.font="700 14px Georgia";ctx.textAlign="center";ctx.fillText("E · CONTINUAR",bx,315);
 }
 if(bossResolved){
  const lx=12420,gy=surfaceYAt(lx);
  ctx.fillStyle="#e8ba4f";ctx.shadowColor="#e6a43d";ctx.shadowBlur=35;ctx.beginPath();ctx.arc(lx,gy-92,30,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle="#f0d78e";ctx.font="700 13px Georgia";ctx.textAlign="center";ctx.fillText("A ÚLTIMA LANTERNA",lx,gy-137);
 }
}
function shadowReturnFrame(e){
 if(e.hit>0){
  const seq=shadowReturnSprites.hit;
  return seq[Math.min(seq.length-1,Math.floor((.24-e.hit)*11))]||seq[0];
 }
 if(e.attackFx>0)return shadowReturnSprites.attack[0];
 const moving=Math.abs(e.vx)>18;
 const seq=moving?shadowReturnSprites.move:shadowReturnSprites.idle;
 const fps=moving?8.5:3.2;
 return seq[Math.floor(e.t*fps)%Math.max(1,seq.length)];
}
function drawShadowReturnSprite(e){
 const im=shadowReturnFrame(e);
 if(!im||!im.complete||!(im.naturalWidth||im.width))return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 // Sprite alto e legível, mas com os pés presos ao mesmo chão da hitbox.
 const targetH=190,targetW=targetH*(iw/ih);
 const facing=e.vx<0?-1:1;
 ctx.save();
 ctx.translate(0,0);
 if(facing<0){
  ctx.scale(-1,1);
  ctx.drawImage(im,-targetW/2,-targetH,targetW,targetH);
 }else{
  ctx.drawImage(im,-targetW/2,-targetH,targetW,targetH);
 }
 ctx.restore();
 return true;
}
function drawShadowDissolves(){
 for(const fx of enemyDissolves){
  if(fx.kind!=="shadow")continue;
  const seq=shadowReturnSprites.dissolve,im=seq[0];
  if(!im||!im.complete||!(im.naturalWidth||im.width))continue;
  const q=Math.max(0,Math.min(1,fx.t/fx.maxT));
  const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
  const h=190,w=h*(iw/ih);
  ctx.save();ctx.translate(fx.x,fx.y);
  ctx.globalAlpha=q;
  if(fx.dir<0){ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h)}
  else ctx.drawImage(im,-w/2,-h,w,h);
  ctx.restore();
 }
}
function witnessBlindFrame(e){
 if(e.hit>0)return witnessBlindSprites.hit[0];
 if(e.attackFx>0){
  const seq=witnessBlindSprites.attack;
  const elapsed=.54-e.attackFx;
  return seq[Math.min(seq.length-1,Math.floor(elapsed*7))]||seq[0];
 }
 const moving=Math.abs(e.vx)>5;
 const seq=moving?witnessBlindSprites.float:witnessBlindSprites.idle;
 const fps=moving?4.2:2.7;
 return seq[Math.floor(e.t*fps)%Math.max(1,seq.length)];
}
function drawWitnessBlindSprite(e){
 const im=witnessBlindFrame(e);
 if(!im||!im.complete||!(im.naturalWidth||im.width))return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const h=205,w=h*(iw/ih);
 const facing=e.vx<0?-1:1;
 const bob=Math.sin(e.t*2.4)*4;
 ctx.save();
 ctx.translate(0,bob-10);
 if(facing<0){ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h)}
 else ctx.drawImage(im,-w/2,-h,w,h);
 ctx.restore();
 return true;
}
function drawWitnessDissolves(){
 for(const fx of enemyDissolves){
  if(fx.kind!=="witness")continue;
  const im=witnessBlindSprites.dissolve[0];
  if(!im||!im.complete||!(im.naturalWidth||im.width))continue;
  const q=Math.max(0,Math.min(1,fx.t/fx.maxT));
  const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
  const h=205,w=h*(iw/ih);
  ctx.save();ctx.translate(fx.x,fx.y-10);ctx.globalAlpha=q;
  if(fx.dir<0){ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h)}
  else ctx.drawImage(im,-w/2,-h,w,h);
  ctx.restore();
 }
}
function repeaterFrame(e){
 if(e.hit>0)return repeaterSprites.hit[0];
 if(e.attackFx>0)return repeaterSprites.attack[0];
 if(e.dashFx>0){
  const seq=repeaterSprites.dash;
  const elapsed=.48-e.dashFx;
  return seq[Math.min(seq.length-1,Math.floor(elapsed*6))]||seq[0];
 }
 if(Math.abs(e.vx)>45){
  const seq=repeaterSprites.run;
  return seq[Math.floor(e.t*7)%Math.max(1,seq.length)];
 }
 const seq=repeaterSprites.idle;
 return seq[Math.floor(e.t*2.8)%Math.max(1,seq.length)];
}
function drawRepeaterSprite(e){
 const im=repeaterFrame(e);
 if(!im||!im.complete||!(im.naturalWidth||im.width))return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const h=195,w=h*(iw/ih);
 const facing=e.vx<0?-1:1;
 ctx.save();
 ctx.translate(0,-4);
 if(facing<0){ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h)}
 else ctx.drawImage(im,-w/2,-h,w,h);
 ctx.restore();
 return true;
}
function drawRepeaterDissolves(){
 for(const fx of enemyDissolves){
  if(fx.kind!=="repeater")continue;
  const im=repeaterSprites.dissolve[0];
  if(!im||!im.complete||!(im.naturalWidth||im.width))continue;
  const q=Math.max(0,Math.min(1,fx.t/fx.maxT));
  const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
  const h=195,w=h*(iw/ih);
  ctx.save();ctx.translate(fx.x,fx.y-4);ctx.globalAlpha=q;
  if(fx.dir<0){ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h)}
  else ctx.drawImage(im,-w/2,-h,w,h);
  ctx.restore();
 }
}
function drawEnemies(){
 ctx.save();ctx.translate(-cam,0);
 drawShadowDissolves();
 drawWitnessDissolves();
 drawRepeaterDissolves();
 for(const e of enemies){
  if(e.dead||!enemyActive(e))continue;
  const y=e.y,hit=e.hit>0;
  ctx.save();ctx.translate(e.x,y);ctx.globalAlpha=hit?.72:1;
  if(e.kind==="shadow"){
   if(!drawShadowReturnSprite(e)){
    ctx.fillStyle="rgba(25,24,30,.82)";ctx.beginPath();ctx.ellipse(0,-58,28,62,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#d8d0bb";ctx.fillRect(-5,-82,4,4);ctx.fillRect(7,-82,4,4);
   }
  }else if(e.kind==="witness"){
   if(!drawWitnessBlindSprite(e)){
    ctx.fillStyle="#282621";ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(-20,-88);ctx.lineTo(0,-122);ctx.lineTo(20,-88);ctx.lineTo(34,0);ctx.closePath();ctx.fill();ctx.strokeStyle="#8b7857";ctx.strokeRect(-22,-82,44,20);
   }
  }else if(e.kind==="repeater"){
   if(!drawRepeaterSprite(e)){
    ctx.strokeStyle="#9d8760";ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,-62,27,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(0,-2);ctx.moveTo(0,-24);ctx.lineTo(-24,-2);ctx.moveTo(0,-24);ctx.lineTo(24,-2);ctx.stroke();
   }
  }else if(e.kind==="ash"){
   ctx.fillStyle="#34312d";ctx.fillRect(-36,-74,72,74);ctx.fillStyle="#171717";ctx.beginPath();ctx.arc(0,-88,28,0,Math.PI*2);ctx.fill();ctx.fillStyle="#5f5440";ctx.fillRect(20,-58,32,42);
  }else{
   ctx.fillStyle="#171414";ctx.beginPath();ctx.moveTo(-42,0);ctx.lineTo(-30,-105);ctx.lineTo(0,-145);ctx.lineTo(30,-105);ctx.lineTo(42,0);ctx.closePath();ctx.fill();
   ctx.fillStyle="#5e312b";ctx.fillRect(-48,-92,96,26);ctx.fillStyle="#d9c18a";ctx.font="700 10px Georgia";ctx.textAlign="center";ctx.fillText(e.label,0,-74);
  }
  ctx.restore();
 }
 ctx.restore();
}
function drawHazards(){
 ctx.save();ctx.translate(-cam,0);
 hazards.forEach(h=>{ctx.strokeStyle=h.arm>0?"rgba(184,91,76,.35)":"rgba(232,112,80,.85)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,568,32,0,Math.PI*2);ctx.stroke()});
 shots.forEach(s=>{ctx.fillStyle="#d6a85c";ctx.shadowColor="#d27647";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0});
 ctx.restore();
}
function jackFrame(){
 if(!JA)return 0;
 const a=JA.animations;
 if(p.attack>0){const seq=a.attack;return seq[Math.floor((.42-p.attack)*10)%seq.length]}
 if(!p.on){if(p.vy<-220)return a.jumpRise[0];if(p.vy<100)return a.jumpApex[0];return a.jumpFall[0]}
 const sp=Math.abs(p.vx);
 if(sp>18){const seq=input.run?a.run:a.walk,fps=input.run?12:9;return seq[Math.floor(p.anim*fps)%seq.length]}
 return a.idle[Math.floor(p.anim*2.4)%a.idle.length];
}
function drawJack(){
 const cx=p.x-cam+p.w/2,ground=p.y+p.h;
 ctx.save();ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*12)%2?.4:1;
 ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(cx,ground+3,19,5,0,0,Math.PI*2);ctx.fill();
 if(atlasReady&&JA){
  const f=jackFrame(),cell=JA.cell,cols=JA.cols,sx=(f%cols)*cell,sy=Math.floor(f/cols)*cell;
  const h=170,w=170,dx=cx-w/2,dy=ground-h+10;
  const cleanFrame=jackFrameOverrides[f];
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  if(p.dir<0){
   ctx.translate(dx+w,0);ctx.scale(-1,1);
   if(cleanFrame)ctx.drawImage(cleanFrame,0,0,cleanFrame.width,cleanFrame.height,0,dy,w,h);
   else ctx.drawImage(atlas,sx,sy,cell,cell,0,dy,w,h);
  }else{
   if(cleanFrame)ctx.drawImage(cleanFrame,0,0,cleanFrame.width,cleanFrame.height,dx,dy,w,h);
   else ctx.drawImage(atlas,sx,sy,cell,cell,dx,dy,w,h);
  }
 }else{
  ctx.fillStyle="#2b2b27";ctx.fillRect(cx-18,ground-76,36,76);ctx.fillStyle="#d18f35";ctx.beginPath();ctx.arc(cx,ground-92,23,0,Math.PI*2);ctx.fill();
 }
 if(carriedItem){
  ctx.fillStyle="#d0af6b";ctx.fillRect(cx+22*p.dir-10,ground-100,20,18);
 }
 ctx.restore();
}
function drawLight(){
 const pc=p.x-cam+p.w/2,pcy=p.y+p.h*.5;
 if(lightPulse>0){
  const a=lightPulse/.36;ctx.save();ctx.globalCompositeOperation="screen";
  const g=ctx.createRadialGradient(pc,pcy,10,pc,pcy,260);g.addColorStop(0,"rgba(255,225,140,"+(.55*a)+")");g.addColorStop(1,"rgba(255,225,140,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(pc,pcy,260,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 ctx.save();ctx.translate(-cam,0);ctx.globalCompositeOperation="screen";
 reflectedFx.forEach(f=>{const a=f.t/.35;ctx.strokeStyle="rgba(255,224,145,"+(.72*a)+")";ctx.lineWidth=5;ctx.shadowColor="#efc76b";ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.lineTo(f.x3,f.y3);ctx.stroke()});
 ctx.restore();
}
function draw(){
 drawBackdrop();drawGround();drawSectionProps();
 CHECKPOINTS.forEach(drawCheckpoint);drawGates();drawHazards();drawEnemies();drawJack();drawLight();
}

function onKeyDown(e){
 if(["ArrowLeft","a","A"].includes(e.key))input.left=true;
 if(["ArrowRight","d","D"].includes(e.key))input.right=true;
 if(["ArrowDown","s","S"].includes(e.key))input.down=true;
 if(e.key==="Shift")input.run=true;
 if(["ArrowUp","w","W"," "].includes(e.key)){input.jump=true;e.preventDefault()}
 if(["f","F"].includes(e.key))useLight();
 if(["e","E"].includes(e.key))interact();
}
function onKeyUp(e){
 if(["ArrowLeft","a","A"].includes(e.key))input.left=false;
 if(["ArrowRight","d","D"].includes(e.key))input.right=false;
 if(["ArrowDown","s","S"].includes(e.key))input.down=false;
 if(["ArrowUp","w","W"," "].includes(e.key))input.jump=false;
 if(e.key==="Shift")input.run=false;
}
addEventListener("keydown",onKeyDown);addEventListener("keyup",onKeyUp);

function bindHold(id,key){
 const el=document.getElementById(id);if(!el)return;
 const down=e=>{e.preventDefault();input[key]=true},up=e=>{e.preventDefault();input[key]=false};
 el.addEventListener("pointerdown",down);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("pointerleave",up);
}
bindHold("leftBtn","left");bindHold("rightBtn","right");bindHold("downBtn","down");
{
 const jumpBtn=document.getElementById("jumpBtn");
 if(jumpBtn){
  jumpBtn.addEventListener("pointerdown",e=>{e.preventDefault();input.jump=true});
  const clearJump=e=>{e.preventDefault();input.jump=false};
  jumpBtn.addEventListener("pointerup",clearJump);
  jumpBtn.addEventListener("pointercancel",clearJump);
  jumpBtn.addEventListener("pointerleave",clearJump);
 }
}
document.getElementById("lightBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();useLight()});
document.getElementById("interactBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();interact()});

document.getElementById("startGame").onclick=()=>{
 if(journeyMode&&!replayMode)journey?.advanceTo(5);
 ui.intro.hidden=true;running=true;last=performance.now();
 syncPhase5Music(true);
 if(musicOn){
  const cfg=PHASE5_MUSIC[phase5MusicKey]||PHASE5_MUSIC.return;
  ambient.volume=cfg.volume;
  ambient.play().catch(()=>{});
 }
 if(phase5Complete){setTimeout(()=>{if(ui.complete)ui.complete.hidden=false},350)}
 else if(!sectionSeen.has("opening")){sectionSeen.add("opening");setTimeout(()=>openLines(story.opening,save),260)}
 requestAnimationFrame(loop);
};
document.getElementById("phase5Replay")?.addEventListener("click",()=>{location.href="phase5.html?replay=1&new=1"});
document.getElementById("phase5Menu")?.addEventListener("click",()=>{location.href="../index.html#memorias"});

function loop(t){
 if(!running)return;
 const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop);
}
addEventListener("pagehide",()=>{save();ambient.pause()});
document.addEventListener("visibilitychange",()=>{if(document.hidden){save();ambient.pause()}else if(running&&musicOn)ambient.play().catch(()=>{})});

syncHud();draw();
})();