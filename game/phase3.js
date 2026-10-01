(()=>{"use strict";
const c=document.getElementById("game"),x=c.getContext("2d"),W=1280,H=720,WORLD=7600,G=1500;
const ui={obj:document.querySelector("#objective strong"),health:document.getElementById("healthValue"),banner:document.getElementById("sectionBanner"),msg:document.getElementById("message"),intro:document.getElementById("intro")};
const phase3CompleteRoot=document.getElementById("phase3Complete"),phase3ReplayBtn=document.getElementById("phase3Replay"),phase3MenuBtn=document.getElementById("phase3Menu"),phase3NextBtn=document.getElementById("phase3Next");
const dialogueRoot=document.getElementById("dialogue"),dialogue=new window.DialogueSystem(dialogueRoot);
const journey=window.JackJourney||null,urlParams=new URLSearchParams(location.search),journeyMode=urlParams.get("journey")==="1",replayMode=urlParams.get("replay")==="1",forceNewRun=urlParams.get("new")==="1";
const SAVE_KEY="jack-phase3-save",CHECKPOINT_KEY="jack-phase3-checkpoint",MARA_WOOD_KEY="jack-item-mara-wood-key";
const phase3Music={
 forest:new Audio("../assets/phase3/audio/music/phase3-memory-forest-theme.mp3"),
 motherTree:new Audio("../assets/phase3/audio/music/phase3-mother-tree-theme.mp3"),
 archivist:new Audio("../assets/phase3/audio/music/phase3-archivist-theme.mp3")
};
Object.values(phase3Music).forEach(a=>{a.loop=true;a.preload="auto";a.volume=0});
let activeMusic=null,musicFadeTimer=0;
function fadeMusicTo(name,target=.58,duration=900){
 const next=phase3Music[name];if(!next||activeMusic===next)return;
 const prev=activeMusic;activeMusic=next;
 try{next.currentTime=Math.max(0,next.currentTime||0);next.play().catch(()=>{})}catch(_){}
 const start=performance.now(),fromNext=next.volume,fromPrev=prev?.volume||0;
 cancelAnimationFrame(musicFadeTimer);
 const tick=(now)=>{
   const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t);
   next.volume=fromNext+(target-fromNext)*ease;
   if(prev)prev.volume=fromPrev*(1-ease);
   if(t<1)musicFadeTimer=requestAnimationFrame(tick);
   else if(prev){prev.pause();prev.volume=0}
 };
 musicFadeTimer=requestAnimationFrame(tick);
}
function stopPhase3Music(){
 cancelAnimationFrame(musicFadeTimer);
 Object.values(phase3Music).forEach(a=>{a.pause();a.volume=0});
 activeMusic=null;
}
if(replayMode)journey?.beginReplay(3,[SAVE_KEY,CHECKPOINT_KEY]);
if(forceNewRun){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CHECKPOINT_KEY)}
let loadedSave=null;if(journeyMode&&!replayMode){try{loadedSave=JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch(_){loadedSave=null}}
const story=window.PHASE3_STORY;
if(!story)throw new Error("PHASE3_STORY não carregou.");

const input={left:false,right:false,down:false,run:false,jump:false};
let running=false,last=performance.now(),cam=0,jack=null,jackFrameOverrides={},introLorePlayed=!!loadedSave?.introLorePlayed,section=-1;
let idleTime=0,waitSitFrame=0,waitSitClock=0,waitSitActive=false,waitSitImages=[];
let lastPlayerAction=performance.now();
let memoryLight=0,memoryPulse=0,playerLife=Math.max(1,Math.min(3,Number(loadedSave?.playerLife)||3));
let activeCheckpoint=loadedSave?.activeCheckpoint||localStorage.getItem(CHECKPOINT_KEY)||"";
let maraSpriteSheet=null,maraRunSheet=null,forestBackground=null,motherTreeBackground=null;
const motherTreeSprites={idle:null,awakened:null,corrupted:null,restored:null};
const motherTreeFragments=[];
let motherTreeFragmentCurrent=-1,motherTreeFragmentPrevious=-1,motherTreeFragmentBlend=1;

// Memórias Suspensas: relíquias menores que orbitam a Árvore-Mãe.
// Carregamento é tardio para não pesar o início da fase.
const motherTreeSuspendedMemories=Array(9).fill(null);
let motherTreeSuspendedLoadStarted=false;
const motherTreeSuspendedFiles=[
 "mother-tree-suspended-memory-letter-01.png",
 "mother-tree-suspended-memory-nameplate-01.png",
 "mother-tree-suspended-memory-nameplate-02.png",
 "mother-tree-suspended-memory-portrait-01.png",
 "mother-tree-suspended-memory-portrait-02.png",
 "mother-tree-suspended-memory-crystal-01-mother-tree.png",
 "mother-tree-suspended-memory-crystal-02-lake-of-voices.png",
 "mother-tree-suspended-memory-crystal-03-jack-pumpkin.png",
 "mother-tree-suspended-memory-fx-01-golden-swirl.png"
];

const suspendedMemoryOrbits=[
 // Mara — cartas e nomes próximos do tronco.
 {image:0,angle:.25,speed:.105,rx:138,ry:62,lift:-182,h:72,alpha:.73,rot:.052},
 {image:1,angle:2.28,speed:-.078,rx:152,ry:68,lift:-113,h:64,alpha:.66,rot:.045},
 {image:2,angle:4.22,speed:.071,rx:162,ry:72,lift:-52,h:68,alpha:.66,rot:.050},
 // Bosque — retratos e cristais numa órbita um pouco maior.
 {image:3,angle:1.12,speed:.056,rx:218,ry:96,lift:-168,h:78,alpha:.66,rot:.042},
 {image:4,angle:3.46,speed:-.049,rx:235,ry:101,lift:-66,h:74,alpha:.62,rot:.040},
 {image:5,angle:5.08,speed:.043,rx:248,ry:108,lift:-126,h:76,alpha:.61,rot:.038},
 {image:6,angle:2.72,speed:-.040,rx:265,ry:112,lift:-12,h:72,alpha:.58,rot:.036},
 // Jack — memória intrusa, propositalmente rara e discreta.
 {image:7,angle:5.72,speed:.030,rx:292,ry:122,lift:-88,h:84,alpha:.72,rot:.032},
 // Aura geral, sempre atrás da árvore.
 {image:8,angle:.0,speed:.018,rx:0,ry:0,lift:-104,h:390,alpha:.115,rot:.018,fx:true}
];

const archivistSprites={base:[],attacks:[],faces:[],voices:[],heart:[],release:[]};
let maraRun={active:false,x:2275,targetX:2275,groundY:590,onDone:null};
// Posição narrativa persistente da Mara. Evita que ela volte ao ponto inicial
// quando uma animação/efeito (como a Luz da Memória) força um novo redraw.
let maraSettledX=Number.isFinite(loadedSave?.maraSettledX)
 ? loadedSave.maraSettledX
 : (loadedSave?.motherTreeScene||loadedSave?.approachTreePlayed?6680
   : loadedSave?.archiveSolved?6380
   : loadedSave?.voicesSolved?5575
   : loadedSave?.portraitsSolved?4020
   : loadedSave?.maraMet?2700
   : 2275);
let maraMet=!!loadedSave?.maraMet;
let portraitsSolved=!!loadedSave?.portraitsSolved;
let portraitChoices=Array.isArray(loadedSave?.portraitChoices)&&loadedSave.portraitChoices.length===3?loadedSave.portraitChoices.map(v=>Math.max(0,Math.min(2,Number(v)||0))):[0,1,2];
let portraitRevealed=Array.isArray(loadedSave?.portraitRevealed)&&loadedSave.portraitRevealed.length===3?loadedSave.portraitRevealed.slice(0,3).map(Boolean):(portraitsSolved?[true,true,true]:[false,false,false]);
const portraitPulse=[0,0,0],portraitWrong=[0,0,0];
let voicesSolved=!!loadedSave?.voicesSolved;
let voiceStep=Math.max(0,Math.min(3,Number(loadedSave?.voiceStep)||0));
let jackEchoPlayed=!!loadedSave?.jackEchoPlayed;
let firstWhisperPlayed=!!loadedSave?.firstWhisperPlayed;
let portraitMemoryProofPlayed=!!loadedSave?.portraitMemoryProofPlayed;
let maraJackSuspicionPlayed=!!loadedSave?.maraJackSuspicionPlayed;
let archiveKeyReactionPlayed=!!loadedSave?.archiveKeyReactionPlayed;
let approachTreePlayed=!!loadedSave?.approachTreePlayed;
let motherTreeScene=!!loadedSave?.motherTreeScene;
let archiveSolved=!!loadedSave?.archiveSolved;
let archiveChoice=Math.max(0,Math.min(2,Number(loadedSave?.archiveChoice)||0));
let archiveSeen=Array.isArray(loadedSave?.archiveSeen)?loadedSave.archiveSeen.slice(0,3).map(Boolean):[false,false,false];
let bossPrelude=!!loadedSave?.bossPrelude;
let bossActive=!!loadedSave?.bossActive,bossAct=Math.max(0,Math.min(3,Number(loadedSave?.bossAct)||0)),bossStep=Math.max(0,Number(loadedSave?.bossStep)||0),bossComplete=!!loadedSave?.bossComplete,finalePlayed=!!loadedSave?.finalePlayed;
let bossFirstStrike=!!loadedSave?.bossFirstStrike;
let bossFacesSeen=Array.isArray(loadedSave?.bossFacesSeen)?loadedSave.bossFacesSeen.slice(0,3).map(Boolean):[false,false,false];
let maraBossX=Number.isFinite(loadedSave?.maraBossX)?loadedSave.maraBossX:6700;
let bossCooldown=0,bossPulse=0,bossReleaseT=0;
let endingSequenceActive=false;
const bossFacePositions=[6780,7010,7270],bossRootPositions=[6795,6915,7005];
let gateMessageCooldown=0;
const p={x:Number.isFinite(loadedSave?.x)?loadedSave.x:120,y:Number.isFinite(loadedSave?.y)?loadedSave.y:470,w:46,h:86,vx:0,vy:0,dir:loadedSave?.dir===-1?-1:1,on:false,coyote:0,buffer:0,anim:0,attack:0};

const opening=[
 {speaker:"JACK",portrait:"jack",expression:1,text:"Quatro e quatorze. Engraçado... o mundo continuou."},
 {speaker:"JACK",portrait:"jack",expression:1,text:"Então por que minha lanterna está apontando para trás?"},
 {speaker:"JACK",portrait:"jack",expression:3,text:"E desde quando folhas caem para o céu?"},
 {speaker:"???",portrait:null,text:"Algumas coisas não caem, Jack. Elas voltam."},
 {speaker:"JACK",portrait:"jack",expression:2,text:"Ótimo. Uma floresta que responde. Isso sempre termina bem."}
];

const sections=[
 {x:0,n:"ESTRADA DE 4:14"},
 {x:1150,n:"O LIMIAR DAS RAÍZES"},
 {x:2550,n:"BOSQUE DOS RETRATOS"},
 {x:4100,n:"LAGO DAS VOZES"},
 {x:5480,n:"ARQUIVO DAS RAÍZES"},
 {x:6200,n:"CAMINHO DA ÁRVORE-MÃE"},
 {x:6750,n:"O CORAÇÃO DAS RAÍZES"}
];

const plats=[
 {x:0,y:590,w:1080,h:130},
 {x:1480,y:590,w:900,h:130},
 {x:2700,y:590,w:980,h:130},
 {x:4100,y:590,w:3500,h:130},
 {x:520,y:500,w:250,h:30},
 {x:1760,y:485,w:260,h:30},
 {x:3000,y:500,w:240,h:30},
 {x:3420,y:430,w:260,h:30},
 {x:4440,y:490,w:250,h:30}
];
const memoryPlats=[
 {x:1100,y:535,w:155,h:24},
 {x:1295,y:495,w:165,h:24},
 {x:2390,y:525,w:145,h:24},
 {x:2550,y:480,w:145,h:24},
 {x:3680,y:505,w:180,h:24},
 {x:3880,y:460,w:170,h:24}
];
const checkpoints=[
 {id:"threshold",x:2100,groundY:590,respawnX:2040,respawnY:504,name:"Árvore da Primeira Lembrança"},
 {id:"lake",x:4240,groundY:590,respawnX:4185,respawnY:504,name:"Salgueiro das Vozes"},
 {id:"archive",x:5580,groundY:590,respawnX:5525,respawnY:504,name:"Raiz do Arquivo"}
];

const memoryLeafImages=[];
const phase3PlatformImages=[null,null,null,null];
const rootGateSprites=[null,null,null,null];
const portraitPuzzleImages={
 livia:{dormant:null,awakened:null,remembered:null},
 tomas:{dormant:null,awakened:null,remembered:null},
 celina:{dormant:null,awakened:null,remembered:null}
};
const portraitPuzzleBases={motherTree:null,archivist:null};
let portraitPuzzleAssetsLoadStarted=false;
const rootGateProgress={
 portraits:portraitsSolved?1:0,
 voices:voicesSolved?1:0,
 archive:archiveSolved?1:0
};
let maraWoodKeyImage=null,maraWoodKeyGlowImage=null;
const leaves=Array.from({length:46},(_,i)=>({
 sx:Math.random()*W,sy:Math.random()*H,
 speed:18+Math.random()*46,drift:(Math.random()-.5)*26,
 size:14+Math.random()*22,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*1.15,
 phase:Math.random()*Math.PI*2,depth:.38+Math.random()*.72,
 imageIndex:i%6
}));

function say(t){ui.msg.textContent=t;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),2700)}
function banner(t){ui.banner.textContent=t;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),2100)}
function syncHud(){ui.health.textContent="♥ ".repeat(playerLife).trim()||"♡"}

function save(){
 if(!journeyMode||replayMode||!journey?.isActive()||journey.currentPhase()!==3)return;
 localStorage.setItem(SAVE_KEY,JSON.stringify({
   x:p.x,y:p.y,dir:p.dir,playerLife,activeCheckpoint,introLorePlayed,
   maraMet,portraitsSolved,portraitChoices:[...portraitChoices],portraitRevealed:[...portraitRevealed],
   voicesSolved,voiceStep,jackEchoPlayed,firstWhisperPlayed,portraitMemoryProofPlayed,maraJackSuspicionPlayed,archiveKeyReactionPlayed,approachTreePlayed,motherTreeScene,
   archiveSolved,archiveChoice,archiveSeen:[...archiveSeen],bossPrelude,bossActive,bossAct,bossStep,bossComplete,finalePlayed,bossFirstStrike,bossFacesSeen:[...bossFacesSeen],maraBossX,maraSettledX,savedAt:Date.now()
 }));
}
function respawn(msg){
 const cp=checkpoints.find(z=>z.id===activeCheckpoint);
 p.x=cp?cp.respawnX:120;p.y=cp?cp.respawnY:470;p.vx=0;p.vy=0;p.on=false;playerLife=3;syncHud();save();if(msg)say(msg);
}
function updateCheckpoint(){
 const pc=p.x+p.w/2,feet=p.y+p.h;
 for(const cp of checkpoints){
   if(activeCheckpoint===cp.id)continue;
   if(Math.abs(pc-cp.x)<130&&Math.abs(feet-cp.groundY)<115){
     activeCheckpoint=cp.id;localStorage.setItem(CHECKPOINT_KEY,cp.id);playerLife=3;syncHud();
     banner("RAIZ DE LUZ — CHECKPOINT");
     say(cp.name+" guardou este caminho.");
     save();
   }
 }
}

function img(src){return new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src+"?v=phase3-1"})}
function buildCleanJackFrame(image,frame,eraseRects=[]){
 const cfg=window.JACK_ANIMATIONS,cell=cfg?.cell||320,cols=cfg?.cols||8,cv=document.createElement("canvas");cv.width=cell;cv.height=cell;
 const cx=cv.getContext("2d"),col=frame%cols,row=Math.floor(frame/cols);cx.drawImage(image,col*cell,row*cell,cell,cell,0,0,cell,cell);eraseRects.forEach(r=>cx.clearRect(...r));return cv;
}
function buildJackFrameOverrides(image){
 // Mesma limpeza já testada nas Fases 1 e 2:
 // frame 25 remove resíduo lateral; frame 26 remove o boot/pé de uma célula vizinha
 // que invade a área acima da cabeça quando Jack ergue a lanterna.
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
const jackStartupReady=img("../assets/game/phase1/sprites-hd/jack-atlas-hd.png").then(i=>{jack=i;jackFrameOverrides=buildJackFrameOverrides(i)}).catch(()=>{});
// Optional 11-frame seated wait animation. Individual PNGs; never blocks phase startup.
const waitSitFiles=Array.from({length:11},(_,i)=>"../assets/sprites/jack/wait-sit/jack-wait-"+String(i+1).padStart(2,"0")+".png");
waitSitFiles.forEach((src,i)=>img(src).then(im=>waitSitImages[i]=im).catch(()=>{}));

// Retratos HD oficiais de Jack + folha 3x2 de Mara.
const jackPortraitFiles=[
 "jack-00-neutral.png",
 "jack-01-serious.png",
 "jack-02-smirk.png",
 "jack-03-surprised.png",
 "jack-04-determined.png",
 "jack-05-resolved.png"
];
const jackPortraitReady=Promise.allSettled(
 jackPortraitFiles.map(file=>img("../assets/game/phase1/portraits-hd/"+file))
).then(results=>results.map(r=>r.status==="fulfilled"?r.value:null));

const maraDialogueReady=img("../assets/game/phase3/mara/dialogue/mara-dialogue-sheet.png").catch(()=>null);
const maraSpriteReady=img("../assets/game/phase3/mara/sprites/mara-sprite-sheet.png").then(im=>{maraSpriteSheet=im;return im}).catch(()=>null);
const maraRunReady=img("../assets/game/phase3/mara/sprites/mara-run-sheet.png").then(im=>{maraRunSheet=im;return im}).catch(()=>null);
const forestBackgroundReady=img("../assets/phase3/backgrounds/phase3-memory-forest-bg.png").then(im=>{forestBackground=im;return im}).catch(()=>null);
const motherTreeBackgroundReady=img("../assets/phase3/backgrounds/phase3-mother-tree-area-bg.png").then(im=>{motherTreeBackground=im;return im}).catch(()=>null);
const motherTreeSpriteReady=Promise.allSettled([
 img("../assets/phase3/mother-tree/mother-tree-idle.png").then(im=>{motherTreeSprites.idle=im;return im}),
 img("../assets/phase3/mother-tree/mother-tree-awakened.png").then(im=>{motherTreeSprites.awakened=im;return im}),
 img("../assets/phase3/mother-tree/mother-tree-corrupted.png").then(im=>{motherTreeSprites.corrupted=im;return im}),
 img("../assets/phase3/mother-tree/mother-tree-restored.png").then(im=>{motherTreeSprites.restored=im;return im})
]);

const motherTreeFragmentFiles=[
 "mother-tree-fragment-01-mara-archive.png",
 "mother-tree-fragment-02-mara-roots.png",
 "mother-tree-fragment-03-mara-letters.png",
 "mother-tree-fragment-04-memory-portraits.png",
 "mother-tree-fragment-05-lake-of-voices.png",
 "mother-tree-fragment-06-jack-pumpkin.png"
];
// Carrega desde o início, mas não bloqueia o preloader: estes fragmentos só são usados perto do fim da fase.
motherTreeFragmentFiles.forEach((file,i)=>{
 img("../assets/game/phase3/mother-tree/fragments/"+file)
   .then(im=>{motherTreeFragments[i]=im})
   .catch(()=>{motherTreeFragments[i]=null});
});

const archivistVisualSets=[
 ["base","archivist-base-"],
 ["attacks","archivist-attack-"],
 ["faces","archivist-faces-"],
 ["voices","archivist-voices-"],
 ["heart","archivist-heart-"],
 ["release","archivist-release-"]
];
const archivistVisualsReady=Promise.allSettled(
 archivistVisualSets.flatMap(([folder,prefix])=>
   Array.from({length:3},(_,i)=>
     img("../assets/game/phase3/boss/archivist/"+folder+"/"+prefix+String(i+1).padStart(2,"0")+".png")
       .then(im=>({folder,im}))
   )
 )
).then(results=>{
 results.forEach(r=>{if(r.status==="fulfilled")archivistSprites[r.value.folder].push(r.value.im)});
 return archivistSprites;
});

const archivistPortraitFiles=[
 "archivist-dialogue-01-awake.png",
 "archivist-dialogue-02-faces.png",
 "archivist-dialogue-03-heart.png",
 "archivist-dialogue-04-release.png"
];
// Retratos de diálogo do Arquivista Eterno.
 // 0 = awake / despertar
 // 1 = faces / rostos e vozes
 // 2 = heart / coração exposto
 // 3 = release / libertação
const archivistDialogueReady=Promise.allSettled(
 archivistPortraitFiles.map(file=>img("../assets/game/phase3/boss/archivist/dialogue/"+file))
).then(results=>results.map(r=>r.status==="fulfilled"?r.value:null));

const dialogueAssetsReady=Promise.all([jackPortraitReady,maraDialogueReady,motherTreeSpriteReady,archivistDialogueReady]).then(([jackFrames,maraSheet,_treeReady,archivistFrames])=>{
 dialogue.setAssets({
   jack:{frames:jackFrames},
   mara:maraSheet?{sheet:maraSheet}:null,
   motherTree:{frames:[motherTreeSprites.idle,motherTreeSprites.awakened||motherTreeSprites.restored]},
   archivist:{frames:archivistFrames}
 });
});

const phase3DialogueFrameReady=img("../assets/game/phase3/ui/phase3-dialogue-frame.png").catch(()=>null);
const memoryLeavesReady=Promise.all(
 Array.from({length:6},(_,i)=>img("../assets/game/phase3/fx/memory-leaves/memory-leaf-"+String(i+1).padStart(2,"0")+".png"))
).then(images=>{memoryLeafImages.splice(0,memoryLeafImages.length,...images);return images}).catch(()=>[]);
const phase3PlatformsReady=Promise.all(
 Array.from({length:4},(_,i)=>img("../assets/game/phase3/platforms/phase3-platform-roots-"+String(i+1).padStart(2,"0")+".png"))
).then(images=>{
 images.forEach((im,i)=>{phase3PlatformImages[i]=im});
 return images;
}).catch(()=>[]);

function ensurePortraitPuzzleAssets(){
 if(portraitPuzzleAssetsLoadStarted)return;
 portraitPuzzleAssetsLoadStarted=true;
 const jobs=[
   ["livia","dormant","../assets/game/phase3/portrait-puzzle/livia/phase3-portrait-livia-01-dormant.png"],
   ["livia","awakened","../assets/game/phase3/portrait-puzzle/livia/phase3-portrait-livia-02-awakened.png"],
   ["livia","remembered","../assets/game/phase3/portrait-puzzle/livia/phase3-portrait-livia-03-remembered.png"],
   ["tomas","dormant","../assets/game/phase3/portrait-puzzle/tomas/phase3-portrait-tomas-01-dormant.png"],
   ["tomas","awakened","../assets/game/phase3/portrait-puzzle/tomas/phase3-portrait-tomas-02-awakened.png"],
   ["tomas","remembered","../assets/game/phase3/portrait-puzzle/tomas/phase3-portrait-tomas-03-remembered.png"],
   ["celina","dormant","../assets/game/phase3/portrait-puzzle/celina/phase3-portrait-celina-01-dormant.png"],
   ["celina","awakened","../assets/game/phase3/portrait-puzzle/celina/phase3-portrait-celina-02-awakened.png"],
   ["celina","remembered","../assets/game/phase3/portrait-puzzle/celina/phase3-portrait-celina-03-remembered.png"]
 ];
 jobs.forEach(([who,state,src])=>img(src).then(im=>{portraitPuzzleImages[who][state]=im}).catch(()=>{}));
 img("../assets/game/phase3/portrait-puzzle/bases/phase3-portrait-base-mother-tree.png")
   .then(im=>{portraitPuzzleBases.motherTree=im}).catch(()=>{});
 img("../assets/game/phase3/portrait-puzzle/bases/phase3-portrait-base-archivist.png")
   .then(im=>{portraitPuzzleBases.archivist=im}).catch(()=>{});
}

// Portões vivos do Bosque. Carregam em segundo plano para não pesar ainda mais
// o preloader inicial; existe fallback procedural se algum PNG ainda não chegou.
Promise.allSettled(
 Array.from({length:4},(_,i)=>{
   const files=[
     "phase3-root-gate-01-closed.png",
     "phase3-root-gate-02-opening-glow.png",
     "phase3-root-gate-03-half-open.png",
     "phase3-root-gate-04-open.png"
   ];
   return img("../assets/game/phase3/root-gates/"+files[i]).then(im=>{rootGateSprites[i]=im;return im});
 })
);
 // Item permanente de Mara. Carrega sem bloquear o início da fase.
img("../assets/game/phase3/items/mara-wood-key.png").then(im=>{maraWoodKeyImage=im}).catch(()=>{});
img("../assets/game/phase3/items/mara-wood-key-glow.png").then(im=>{maraWoodKeyGlowImage=im}).catch(()=>{});
window.__PHASE_ASSETS_READY=Promise.allSettled([
 jackStartupReady,dialogueAssetsReady,maraSpriteReady,maraRunReady,forestBackgroundReady,motherTreeBackgroundReady,motherTreeSpriteReady,archivistVisualsReady,phase3DialogueFrameReady,memoryLeavesReady,phase3PlatformsReady
]).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));

function jackSequenceFrame(seq,fps){return seq[Math.floor(p.anim*fps)%seq.length]}
function currentJackFrame(){
 const cfg=window.JACK_ANIMATIONS,anims=cfg?.animations;if(!anims)return 0;
 // A Luz da Memória usa a animação oficial de Jack levantando a lanterna.
 // Ela tem prioridade sobre caminhada, pulo e agachar, como nas fases anteriores.
 if(p.attack>0&&anims.attack?.length){
   const duration=cfg.timing?.attackDuration||.48;
   const progress=Math.max(0,Math.min(.999,(duration-p.attack)/duration));
   const seq=anims.attack;
   return seq[Math.min(seq.length-1,Math.floor(progress*seq.length))];
 }
 if(!p.on){if(p.vy<-360)return anims.jumpStart[0];if(p.vy<-90)return anims.jumpRise[0];if(p.vy<120)return anims.jumpApex[0];return anims.jumpFall[0]}
 if(input.down)return anims.crouch[0];
 const speed=Math.abs(p.vx);if(speed>=18){if(input.run&&speed>170)return jackSequenceFrame(anims.run,cfg.timing?.runFps||12);return jackSequenceFrame(anims.walk,cfg.timing?.walkFps||9)}
 return jackSequenceFrame(anims.idle,cfg.timing?.idleFps||2.4);
}
function drawJack(){
 if(waitSitActive&&!dialogue.active){
   const im=waitSitImages[waitSitFrame];
   if(im){
     const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
     // Individual assets share a transparent canvas. Calibrate their canvas to the
     // gameplay Jack instead of treating the whole PNG as Jack's body height.
     // Frames 01–05 already match gameplay Jack. From frame 06 onward the
     // seated drawings occupy less of their transparent canvas, so compensate only
     // those frames instead of changing the good opening poses.
     const seated=waitSitFrame>=5;
     // Frames 06–11 need a little more scale and a lower baseline because the
     // character occupies less of their transparent source canvas.
     const targetH=seated?222:164,targetW=iw*(targetH/ih);
     const groundY=p.y+p.h+(seated?22:2);
     const dx=p.x-cam+p.w/2-targetW/2,dy=groundY-targetH;
     x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
     if(p.dir<0){x.translate(dx+targetW,0);x.scale(-1,1);x.drawImage(im,0,dy,targetW,targetH)}
     else x.drawImage(im,dx,dy,targetW,targetH);
     x.restore();return;
   }
 }
 if(p.on){x.save();x.globalAlpha=.2;x.fillStyle="#020704";x.beginPath();x.ellipse(p.x-cam+p.w/2,p.y+p.h+1,18,3.3,0,0,Math.PI*2);x.fill();x.restore()}
 if(!jack){x.fillStyle="#eee";x.fillRect(p.x-cam,p.y,p.w,p.h);return}
 const cfg=window.JACK_ANIMATIONS||{},idx=currentJackFrame(),cell=cfg.cell||320,cols=cfg.cols||8,sx=(idx%cols)*cell,sy=Math.floor(idx/cols)*cell;
 const rw=cfg.render?.width||190,rh=cfg.render?.height||190,dx=p.x-cam+p.w/2-rw/2,dy=p.y+p.h/2+(cfg.render?.offsetY??-132),clean=jackFrameOverrides[idx];
 x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
 if(p.dir<0){x.translate(dx+rw,0);x.scale(-1,1);if(clean)x.drawImage(clean,0,0,clean.width,clean.height,0,dy,rw,rh);else x.drawImage(jack,sx,sy,cell,cell,0,dy,rw,rh)}
 else{if(clean)x.drawImage(clean,0,0,clean.width,clean.height,dx,dy,rw,rh);else x.drawImage(jack,sx,sy,cell,cell,dx,dy,rw,rh)}
 x.restore();
}

function maraWorldState(){
 if(maraRun.active)return {x:maraRun.x,groundY:maraRun.groundY,run:true};
 if(bossActive)return {x:maraBossX,groundY:590,frame:bossAct===3?0:5};
 if(motherTreeScene||bossComplete)return {x:6680,groundY:590,frame:bossComplete?1:5};
 if(archiveSolved&&approachTreePlayed)return {x:maraSettledX,groundY:590,frame:5};
 if(archiveSolved)return {x:maraSettledX,groundY:590,frame:5};
 if(!portraitsSolved)return {x:maraSettledX,groundY:590,frame:maraMet?3:0};
 if(!voicesSolved)return {x:maraSettledX,groundY:590,frame:4};
 return {x:maraSettledX,groundY:590,frame:5};
}
function startMaraRun(fromX,toX,onDone){
 // A corrida narrativa precisa começar dentro da área que o jogador está vendo.
 // Usa a posição persistente atual como referência para nunca "ressuscitar"
 // um ponto antigo da Mara durante transições ou redraws.
 const narrativeStart=Number.isFinite(maraSettledX)?maraSettledX:fromX;
 const visibleStart=Math.min(toX-150,Math.max(narrativeStart,p.x+p.w+82));
 maraRun.active=true;maraRun.x=visibleStart;maraRun.targetX=toX;maraRun.groundY=590;
 maraRun.onDone=typeof onDone==="function"?onDone:null;
}
function updateMaraRun(dt){
 if(!maraRun.active)return;
 const dir=Math.sign(maraRun.targetX-maraRun.x)||1;
 maraRun.x+=dir*285*dt;
 if((dir>0&&maraRun.x>=maraRun.targetX)||(dir<0&&maraRun.x<=maraRun.targetX)){
   maraRun.x=maraRun.targetX;
   maraSettledX=maraRun.targetX;
   maraRun.active=false;
   const done=maraRun.onDone;maraRun.onDone=null;
   save();
   if(done)done();
 }
}
function drawMaraWorld(){
 const m=maraWorldState();
 if(m.run&&maraRunSheet){
   const cols=4,rows=2,iw=maraRunSheet.naturalWidth||maraRunSheet.width,ih=maraRunSheet.naturalHeight||maraRunSheet.height;
   const cw=iw/cols,ch=ih/rows,idx=Math.floor(p.anim*11)%8,sx=(idx%cols)*cw,sy=Math.floor(idx/cols)*ch;
   const rh=174,rw=rh*(cw/ch),dx=m.x-rw/2,dy=m.groundY-rh+2;
   x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
   x.drawImage(maraRunSheet,sx,sy,cw,ch,dx,dy,rw,rh);x.restore();return;
 }
 if(!maraSpriteSheet)return;
 const cols=3,rows=2,iw=maraSpriteSheet.naturalWidth||maraSpriteSheet.width,ih=maraSpriteSheet.naturalHeight||maraSpriteSheet.height;
 const cw=iw/cols,ch=ih/rows,idx=m.frame%6,sx=(idx%cols)*cw,sy=Math.floor(idx/cols)*ch;
 const rh=178,rw=rh*(cw/ch),dx=m.x-rw/2,dy=m.groundY-rh;
 x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
 x.drawImage(maraSpriteSheet,sx,sy,cw,ch,dx,dy,rw,rh);
 x.restore();
}

function drawPortraitMemoryGlyph(i,revealed,ok){
 if(!revealed)return;
 const breathe=1+Math.sin(p.anim*2+i*.9)*.04;
 x.save();x.scale(breathe,breathe);
 x.strokeStyle=ok?"#f1dc91":"#d2ba78";x.fillStyle=ok?"rgba(244,218,137,.32)":"rgba(207,184,120,.22)";
 x.lineWidth=3;x.lineCap="round";x.lineJoin="round";

 if(i===0){
   // Lívia — a janela e o pão repartido.
   x.strokeRect(-24,-21,48,42);
   x.beginPath();x.moveTo(0,-21);x.lineTo(0,21);x.moveTo(-24,0);x.lineTo(24,0);x.stroke();
   x.beginPath();x.ellipse(0,31,21,9,0,0,Math.PI*2);x.fill();x.stroke();
   x.beginPath();x.moveTo(-9,27);x.quadraticCurveTo(0,20,9,27);x.stroke();
 }else if(i===1){
   // Tomás — um brinquedo quebrado voltando a funcionar.
   x.beginPath();x.arc(-13,12,10,0,Math.PI*2);x.arc(15,12,10,0,Math.PI*2);x.stroke();
   x.beginPath();x.moveTo(-23,3);x.lineTo(-15,-17);x.lineTo(14,-17);x.lineTo(25,3);x.closePath();x.stroke();
   x.beginPath();x.arc(0,-3,8,0,Math.PI*2);x.stroke();
   for(let a=0;a<6;a++){const ang=a*Math.PI/3;x.beginPath();x.moveTo(Math.cos(ang)*8,-3+Math.sin(ang)*8);x.lineTo(Math.cos(ang)*14,-3+Math.sin(ang)*14);x.stroke()}
 }else{
   // Celina — o violino que quebrava o silêncio do Bosque.
   x.beginPath();x.ellipse(-5,7,11,17,-.15,0,Math.PI*2);x.ellipse(7,-8,9,14,.15,0,Math.PI*2);x.stroke();
   x.beginPath();x.moveTo(3,-20);x.lineTo(15,-40);x.lineTo(21,-38);x.lineTo(10,-17);x.stroke();
   x.beginPath();x.moveTo(-18,28);x.quadraticCurveTo(6,5,25,-26);x.stroke();
   x.font="700 16px Georgia";x.textAlign="center";x.fillText("♪",29,-20);x.fillText("♪",-27,-14);
 }
 x.restore();
}

function portraitKeyForIndex(i){
 return ["livia","tomas","celina"][i]||"livia";
}
function portraitVisualState(i,q,names){
 const selected=names[portraitChoices[i]];
 if(portraitRevealed[i]&&selected===q.correct)return "remembered";
 if(portraitRevealed[i])return "awakened";
 return "dormant";
}
function drawPortraitSuspended(i,q,state){
 const key=portraitKeyForIndex(i);
 const art=portraitPuzzleImages[key]?.[state]||null;
 const base=state==="remembered"?portraitPuzzleBases.motherTree:portraitPuzzleBases.archivist;
 if(!art||!base)return false;

 const biw=base.naturalWidth||base.width,bih=base.naturalHeight||base.height;
 const aiw=art.naturalWidth||art.width,aih=art.naturalHeight||art.height;

 // Calibração para os três altares caberem lado a lado entre x=2700 e x=3680.
 const baseH=352,baseW=biw*(baseH/bih);
 const baseY=590-baseH;
 const artH=214,artW=aiw*(artH/aih);
 const hangY=292+Math.sin(p.anim*1.1+i*.8)*1.7;
 const artX=-artW/2;

 x.save();
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";

 // Base/altar atrás do retrato.
 x.drawImage(base,-baseW/2,baseY,baseW,baseH);

 // Duas pequenas correntes orgânicas fazem o quadro parecer realmente pendurado.
 const hookY=baseY+62,hookSpread=Math.min(42,artW*.25);
 x.strokeStyle=state==="remembered"?"rgba(224,190,102,.82)":"rgba(132,103,70,.82)";
 x.lineWidth=2.2;
 for(const side of [-1,1]){
   const hx=side*hookSpread;
   x.beginPath();x.moveTo(hx,hookY);
   for(let s=0;s<4;s++){
     const yy=hookY+s*10,xx=hx+Math.sin(p.anim*1.2+s+i)*1.2;
     x.lineTo(xx,yy+9);
   }
   x.stroke();
 }

 // Retrato por cima da base.
 if(state==="awakened"){
   x.shadowColor="rgba(238,204,106,.52)";x.shadowBlur=14;
 }else if(state==="remembered"){
   x.shadowColor="rgba(244,219,129,.78)";x.shadowBlur=22;
 }
 x.drawImage(art,artX,hangY,artW,artH);
 x.shadowBlur=0;

 // O texto entra na placa que já existe dentro da própria arte.
 const selected=story.portraitPuzzle.names[portraitChoices[i]];
 const label=state==="dormant"?"NOME ESQUECIDO":selected;
 const labelY=hangY+artH*.842;
 x.fillStyle=state==="remembered"?"#fff0b3":(state==="awakened"?"#f2dda8":"#9b8c70");
 x.font="700 9px Georgia";x.textAlign="center";x.textBaseline="middle";
 x.shadowColor="rgba(0,0,0,.85)";x.shadowBlur=3;
 x.fillText(label,0,labelY);
 x.shadowBlur=0;

 x.restore();
 return true;
}

function drawPortraitPuzzleWorld(){
 if(!maraMet)return;
 ensurePortraitPuzzleAssets();
 const names=story.portraitPuzzle.names;

 story.portraitPuzzle.entries.forEach((q,i)=>{
   const selected=names[portraitChoices[i]],ok=selected===q.correct,revealed=portraitRevealed[i],lit=memoryLight>0;
   const state=portraitVisualState(i,q,names);
   const shake=portraitWrong[i]>0?Math.sin(p.anim*42+i)*5*portraitWrong[i]:0;
   const pulse=Math.min(1,portraitPulse[i]);
   const sway=Math.sin(p.anim*1.25+i*.8)*1.5;

   x.save();x.translate(q.x+shake,sway);

   // Aura: a memória adormecida quase não respira; awakened e remembered permanecem vivas.
   if(lit||revealed||ok){
     const radius=132+pulse*24+Math.sin(p.anim*2+i)*5;
     const glow=x.createRadialGradient(0,402,8,0,402,radius);
     const glowAlpha=ok?.45:(revealed?.27:.15);
     glow.addColorStop(0,"rgba(240,215,126,"+(glowAlpha+pulse*.17)+")");
     glow.addColorStop(1,"rgba(104,148,89,0)");
     x.fillStyle=glow;x.beginPath();x.arc(0,402,radius,0,Math.PI*2);x.fill();
   }

   const artReady=drawPortraitSuspended(i,q,state);

   // Fallback procedural: se algum PNG ainda estiver carregando, o puzzle continua legível e jogável.
   if(!artReady){
     x.strokeStyle=ok?"#d6ca77":(revealed?"#a8874a":"#705838");x.lineWidth=7;
     x.beginPath();x.moveTo(-58,535);x.quadraticCurveTo(-82,445,-48,360);x.quadraticCurveTo(0,325,48,360);x.quadraticCurveTo(82,445,58,535);x.stroke();
     x.fillStyle=revealed?"rgba(18,29,20,.94)":"rgba(8,13,10,.96)";x.fillRect(-48,365,96,122);
     x.strokeStyle=ok?"#efd47e":(lit||revealed?"#c9aa61":"#5d5038");x.lineWidth=4;x.strokeRect(-48,365,96,122);
     x.save();x.translate(0,422);drawPortraitMemoryGlyph(i,revealed,ok);x.restore();
     x.fillStyle=ok?"#29452a":(revealed?"#2d2719":"#1b1712");x.fillRect(-78,500,156,34);
     x.strokeStyle=ok?"#bfd17b":(revealed?"#a7864f":"#655339");x.lineWidth=2;x.strokeRect(-78,500,156,34);
     x.fillStyle=revealed?"#f5dfaa":"#8d8064";x.font="700 12px Georgia";x.textAlign="center";x.textBaseline="middle";
     x.fillText(revealed?selected:"NOME ESQUECIDO",0,517);
   }

   // Partículas independentes da arte reforçam que a memória está sendo reanimada pela lanterna.
   if(revealed){
     const particleY=405;
     for(let k=0;k<7;k++){
       const a=p.anim*.72+k*Math.PI/3.5+i*.7,r=72+(k%2)*14;
       x.globalAlpha=.25+.18*Math.sin(p.anim*2+k);
       x.fillStyle=ok?"#f3dc87":"#cab570";
       x.beginPath();x.arc(Math.cos(a)*r,particleY+Math.sin(a)*r*.62,1.6+(k%2),0,Math.PI*2);x.fill();
     }
     x.globalAlpha=1;
   }

   // Instrução fica junto ao pedestal, sem cobrir a placa artística do retrato.
   x.textAlign="center";x.textBaseline="middle";
   if(ok){
     x.fillStyle="#efd67d";x.font="700 10px Georgia";x.fillText("LEMBRADO",0,566);
   }else if(revealed){
     x.fillStyle="#c2af80";x.font="italic 9px Georgia";x.fillText("E · trocar nome",0,566);
   }else{
     x.fillStyle="#96a889";x.font="italic 9px Georgia";x.fillText("F · despertar memória",0,566);
   }

   x.restore();
 });
}

function drawVoicePuzzleWorld(){
 if(!portraitsSolved)return;
 const order=story.voicePuzzle.order,activated=new Set(order.slice(0,voiceStep));
 story.voicePuzzle.entries.forEach((q,i)=>{
   const on=activated.has(i),lit=memoryLight>0;
   x.save();x.translate(q.x,0);
   const glow=x.createRadialGradient(0,455,8,0,455,on?105:70);
   glow.addColorStop(0,on?"rgba(242,218,126,.55)":"rgba(153,190,132,.30)");
   glow.addColorStop(1,"rgba(90,130,82,0)");x.fillStyle=glow;x.beginPath();x.arc(0,455,on?105:70,0,Math.PI*2);x.fill();
   x.strokeStyle=on?"#e4ca76":"#6f8767";x.lineWidth=5;x.beginPath();x.moveTo(0,580);x.quadraticCurveTo(-28,525,0,490);x.quadraticCurveTo(30,455,0,410);x.stroke();
   x.fillStyle=on?"#f3d888":"#91b488";x.globalAlpha=lit||on?1:.5;x.beginPath();x.arc(0,400,18,0,Math.PI*2);x.fill();x.globalAlpha=1;
   x.fillStyle="#d8c989";x.font="700 13px Georgia";x.textAlign="center";x.fillText(["I","II","III"][i],0,455);
   x.restore();
 });
}

function drawArchivePuzzleWorld(){
 if(!voicesSolved||archiveSolved)return;
 const items=story.archivePuzzle.entries;
 const xs=[5525,5705,5885];
 items.forEach((it,i)=>{
   const px=xs[i],active=archiveChoice===i;
   x.save();x.translate(px,0);
   if(active){x.shadowColor="rgba(231,202,113,.65)";x.shadowBlur=20}
   x.strokeStyle=active?"#d8bd72":"#796344";x.lineWidth=4;
   x.beginPath();x.moveTo(0,590);x.quadraticCurveTo(-20,535,0,475);x.stroke();
   x.fillStyle=active?"#d7c37d":"#786c4f";
   if(i===0){x.fillRect(-27,442,54,36);x.strokeRect(-27,442,54,36)}
   if(i===1){x.beginPath();x.arc(0,455,25,0,Math.PI*2);x.fill();x.strokeRect(-7,420,14,25)}
   if(i===2){
     const keyIm=(memoryLight>0&&maraWoodKeyGlowImage)||maraWoodKeyImage;
     if(keyIm){
       const iw=keyIm.naturalWidth||keyIm.width,ih=keyIm.naturalHeight||keyIm.height;
       const dh=112,dw=iw*(dh/ih);
       x.save();
       x.globalAlpha=archiveSeen[2]?1:.9;
       x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
       if(memoryLight>0){x.shadowColor="rgba(241,205,102,.85)";x.shadowBlur=28}
       x.drawImage(keyIm,-dw/2,392,dw,dh);
       x.restore();
     }else{
       x.beginPath();x.arc(-8,451,13,0,Math.PI*2);x.stroke();x.fillRect(4,447,34,8);x.fillRect(28,447,7,18);
     }
   }
   x.shadowBlur=0;x.fillStyle="#efe0ad";x.font="700 11px Georgia";x.textAlign="center";x.fillText(["CARTA","MELODIA","CHAVE"][i],0,515);
   x.restore();
 });
 x.save();x.fillStyle="rgba(10,14,11,.78)";x.fillRect(5460,330,500,58);x.strokeStyle="#8f784b";x.strokeRect(5460,330,500,58);
 x.fillStyle="#ead9a3";x.font="italic 17px Georgia";x.textAlign="center";x.fillText(story.archivePuzzle.prompt,5710,365);x.restore();
}
function updateRootGateAnimations(dt){
 const targets={
   portraits:portraitsSolved?1:0,
   voices:voicesSolved?1:0,
   archive:archiveSolved?1:0
 };
 for(const key of Object.keys(rootGateProgress)){
   const target=targets[key];
   if(rootGateProgress[key]<target)rootGateProgress[key]=Math.min(target,rootGateProgress[key]+dt*1.35);
 }
}
function rootGatePassable(key){
 return rootGateProgress[key]>=.86;
}
function drawRootGate(xPos,progress){
 const pgr=Math.max(0,Math.min(1,progress));
 let frame=0;
 if(pgr>.18)frame=1;
 if(pgr>.47)frame=2;
 if(pgr>.76)frame=3;

 const im=rootGateSprites[frame];
 if(!im){
   // Fallback antigo enquanto os PNGs carregam.
   if(pgr>=.86)return;
   x.save();x.translate(xPos,0);x.strokeStyle="#513923";x.lineCap="round";
   for(let i=-3;i<=3;i++){
     x.lineWidth=12-Math.abs(i);
     x.beginPath();x.moveTo(i*10,590);x.quadraticCurveTo(i*22-18,470,i*8,340);x.quadraticCurveTo(i*20+15,280,i*15,220);x.stroke();
   }
   x.fillStyle="#9d6f31";
   for(let j=0;j<5;j++){x.beginPath();x.arc((j-2)*18,315-j*17,4,0,Math.PI*2);x.fill()}
   x.restore();
   return;
 }

 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const dh=455,dw=iw*(dh/ih);
 const dy=590-dh;

 x.save();
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
 if(pgr>0&&pgr<1){
   x.shadowColor="rgba(240,190,72,.62)";
   x.shadowBlur=18+Math.sin(p.anim*5)*5;
 }
 x.drawImage(im,xPos-dw/2,dy,dw,dh);
 x.restore();
}

function nearestPuzzleEntry(entries,range=135){
 const pc=p.x+p.w/2;let best=null,bestD=Infinity;
 entries.forEach((q,i)=>{const d=Math.abs(q.x-pc);if(d<range&&d<bestD){best={q,i,d};bestD=d}});
 return best;
}

function finishPortraitPuzzle(){
 if(portraitsSolved)return;
 const names=story.portraitPuzzle.names;
 const all=story.portraitPuzzle.entries.every((q,i)=>portraitRevealed[i]&&names[portraitChoices[i]]===q.correct);
 if(!all)return;
 portraitsSolved=true;voiceStep=0;portraitMemoryProofPlayed=true;
 banner("MEMÓRIA RECONSTRUÍDA — OS RETRATOS");
 p.vx=0;save();
 dialogue.open(story.dialogues.portraitsSolved,()=>{
   memoryPulse=1.15;
   dialogue.open(story.dialogues.portraitMemoryProof,()=>{
     say("Mara correu em direção ao Lago das Vozes.");
     startMaraRun(2275,4020,()=>{banner("MARA CHEGOU AO LAGO DAS VOZES");save()});
     save();
   });
 });
}

function activateVoice(i){
 if(voicesSolved)return;
 if(memoryLight<=0){say("O eco está abafado. Use a Luz da Memória antes de tocá-lo.");return}
 const expected=story.voicePuzzle.order[voiceStep];
 if(i!==expected){
   voiceStep=0;banner("AS VOZES SE EMBARALHARAM");
   say("A frase se perdeu na água. Recomece pelo primeiro fragmento.");save();return;
 }
 voiceStep++;
 say("Fragmento "+voiceStep+"/3 — "+story.voicePuzzle.entries[i].fragment);
 if(voiceStep<story.voicePuzzle.order.length){save();return}
 voicesSolved=true;banner("MEMÓRIA RECONSTRUÍDA — A VOZ DE MARA");p.vx=0;save();
 dialogue.open(story.dialogues.voicesSolved,()=>{
   jackEchoPlayed=true;memoryPulse=1.2;banner("UMA MEMÓRIA QUE NÃO PERTENCE AO BOSQUE");
   setTimeout(()=>dialogue.open(story.dialogues.jackMemoryLeak,()=>{
     maraJackSuspicionPlayed=true;
     dialogue.open(story.dialogues.maraStudiesJack,()=>{
       say("Mara correu para o Arquivo das Raízes.");
       startMaraRun(4020,5575,()=>{banner("MARA CHEGOU AO ARQUIVO DAS RAÍZES");save()});
       save();
     });
   }),360);
 });
}

function startBoss(){
 if(bossActive||bossComplete)return;
 fadeMusicTo("archivist",.64,760);
 bossActive=true;bossAct=1;bossStep=0;bossPulse=1.6;bossFirstStrike=false;bossFacesSeen=[false,false,false];maraBossX=6700;p.vx=0;
 banner(story.boss.name+" — "+story.boss.acts[0].title);
 say("A ordem ganhou corpo. Tente usar a Luz no Arquivista.");
 save();
}
function advanceBossWithLight(){
 if(!bossActive||bossComplete||bossCooldown>0)return false;
 bossCooldown=.58;bossPulse=1.25;
 const pc=p.x+p.w/2;

 if(bossAct===1){
   if(!bossFirstStrike){
     bossFirstStrike=true;bossPulse=2.4;
     dialogue.open(story.dialogues.bossFirstStrike,()=>{
       banner(story.boss.acts[0].title);
       say("Procure os três rostos presos ao redor do Arquivista e ilumine cada um.");
       save();
     });
     save();return true;
   }
   const nearest=bossFacePositions.map((z,i)=>({i,d:Math.abs(z-pc)})).sort((a,b)=>a.d-b.d)[0];
   if(nearest.d>145){say("A Luz toca o corpo do Arquivista, mas ele se recompõe. Procure um rosto preso.");return true}
   if(bossFacesSeen[nearest.i]){say("Esse rosto já foi reconhecido. Há outras memórias presas.");return true}
   bossFacesSeen[nearest.i]=true;
   const lines=[
     "Lívia foi lembrada pelo pão que repartiu.",
     "Tomás foi lembrado pelo que restaurou.",
     "Celina foi lembrada pela música que deixou."
   ];
   say(lines[nearest.i]);memoryPulse=1.1;
   if(bossFacesSeen.every(Boolean)){
     p.vx=0;
     dialogue.open(story.dialogues.bossAct1Solved,()=>{
       bossAct=2;bossStep=0;
       dialogue.open(story.dialogues.bossAct2,()=>{
         banner(story.boss.acts[1].title);
         say("Repita a sequência aprendida no Lago. A ordem dos ecos ainda importa.");
         save();
       });
     });
   }
   save();return true;
 }

 if(bossAct===2){
   const expected=[1,2,0][bossStep],zones=[7160,6960,7360];
   const chosen=zones.map((z,i)=>({i,d:Math.abs(z-pc)})).sort((a,b)=>a.d-b.d)[0];
   if(chosen.d>125){say("Aproxime-se de um dos três ecos antes de usar a Luz.");return true}
   if(chosen.i!==expected){
     bossStep=0;banner("AS VOZES SE EMBARALHARAM");
     say("O Arquivista misturou os ecos. Recomece a frase de Mara.");save();return true;
   }
   bossStep++;say("Eco reconhecido — "+bossStep+"/3.");
   if(bossStep>=3){
     p.vx=0;
     dialogue.open(story.dialogues.bossAct2Solved,()=>{
       bossAct=3;bossStep=0;maraBossX=6700;
       dialogue.open(story.dialogues.bossAct3,()=>{
         banner(story.boss.acts[2].title);
         say("Abra caminho para Mara: aproxime-se da raiz que bloqueia a passagem e use F.");
         save();
       });
     });
   }
   save();return true;
 }

 if(bossAct===3){
   if(maraRun.active){say("Mara está avançando. Mantenha o caminho aberto.");return true}
   if(bossStep>=bossRootPositions.length){say("O coração da ordem está exposto. Aproxime-se e pressione E.");return true}
   const rootX=bossRootPositions[bossStep];
   if(Math.abs(rootX-pc)>150){say("A Luz precisa alcançar a raiz que bloqueia Mara.");return true}
   bossStep++;
   bossPulse=1.7;memoryPulse=1.1;
   const targets=[6815,6935,7025],target=targets[Math.min(targets.length-1,bossStep-1)];
   startMaraRun(maraBossX,target,()=>{maraBossX=target;banner("MARA AVANÇOU — "+bossStep+"/"+bossRootPositions.length);save()});
   say("A raiz soltou uma memória. Mara pode avançar.");
   save();return true;
 }
 return false;
}
function grantMaraWoodKey(announce=false){
 const firstTime=localStorage.getItem(MARA_WOOD_KEY)!=="yes";
 localStorage.setItem(MARA_WOOD_KEY,"yes");
 if(firstTime&&announce)banner("ITEM DA JORNADA — CHAVE DE MADEIRA DE MARA");
 return firstTime;
}
function unlockPhase3(){
 const firstClear=localStorage.getItem("jack-phase3-complete")!=="yes";
 localStorage.setItem("jack-phase3-complete","yes");
 // Compatibilidade: concluir a Fase 3 significa que Mara entregou a chave.
 grantMaraWoodKey(false);
 if(firstClear)localStorage.setItem("jack-phase3-clear-count",String(Number(localStorage.getItem("jack-phase3-clear-count")||0)+1));
 return firstClear;
}
function showPhase3Complete(){
 fadeMusicTo("motherTree",.48,1100);
 const firstClear=unlockPhase3();
 finalePlayed=true;endingSequenceActive=false;
 banner(firstClear?"MEMÓRIA RECUPERADA — MARA ROWAN":"MEMÓRIA REVIVIDA — MARA ROWAN");
 say(firstClear?"O troféu de Mara foi adicionado às Memórias.":"O Bosque das Memórias foi atravessado novamente.");
 // Grave o final da Fase 3 antes de mover a Jornada para a próxima fase.
 save();
 journey?.unlockPhase(4);
 if(journeyMode&&!replayMode)journey?.advanceTo(4);
 setTimeout(()=>{if(phase3CompleteRoot)phase3CompleteRoot.hidden=false},700);
}
function finishBoss(){
 if(!bossActive||bossAct!==3||bossComplete||bossStep<bossRootPositions.length)return;
 const pc=p.x+p.w/2;
 if(pc<6950){say("Aproxime-se do coração da ordem.");return}
 endingSequenceActive=true;p.vx=0;
 dialogue.open(story.dialogues.bossLight,()=>dialogue.open(story.finale.maraRelease,()=>{
   bossActive=false;bossComplete=true;bossReleaseT=3.2;bossPulse=2.8;
   fadeMusicTo("motherTree",.52,1200);
   banner("A PRIMEIRA FOLHA CAIU");
   save();
   // O silêncio depois do boss é parte da resolução: nenhuma fala por alguns instantes.
   setTimeout(()=>{
     dialogue.open(story.finale.epilogue,()=>{
       grantMaraWoodKey(true);
       dialogue.open(story.finale.jackRevelation,()=>{
         dialogue.open(story.finale.finalExchange,showPhase3Complete);
       });
     });
   },2200);
 }));
 save();
}

function resumeFinaleAfterReload(){
 if(!bossComplete||finalePlayed)return false;
 // Se o jogador saiu depois da libertação do Arquivista, mas antes do fim do
 // epílogo, o save contém bossComplete=true e finalePlayed=false.
 // Retomamos a partir do primeiro diálogo pós-boss sem refazer a batalha.
 endingSequenceActive=true;
 bossActive=false;
 p.vx=0;p.vy=0;
 fadeMusicTo("motherTree",.52,700);
 banner("A PRIMEIRA FOLHA CAIU");
 say("A lanterna retomou a última lembrança do Bosque.");
 setTimeout(()=>{
   if(finalePlayed)return;
   dialogue.open(story.finale.epilogue,()=>{
     grantMaraWoodKey(true);
     dialogue.open(story.finale.jackRevelation,()=>{
       dialogue.open(story.finale.finalExchange,showPhase3Complete);
     });
   });
 },500);
 return true;
}

function drawCycleFailures(){
 if(!archiveSolved||bossComplete)return;
 // O caminho final mostra o problema antes da Árvore-Mãe explicá-lo:
 // flor, carta e folha tentam concluir seus ciclos e são puxadas de volta.
 const t=p.anim;
 x.save();
 x.translate(6260,0);
 const flowerPhase=(Math.sin(t*2.4)+1)/2;
 x.strokeStyle="#6f845d";x.lineWidth=4;x.beginPath();x.moveTo(0,590);x.lineTo(0,520);x.stroke();
 x.fillStyle="rgba(202,165,102,"+(0.35+flowerPhase*.65)+")";
 for(let i=0;i<6;i++){const a=i*Math.PI/3;x.beginPath();x.ellipse(Math.cos(a)*15,510+Math.sin(a)*10,10,5,a,0,Math.PI*2);x.fill()}
 x.fillStyle="#d6c18b";x.font="italic 12px Georgia";x.textAlign="center";x.fillText("floresce · murcha · volta",0,620);

 x.translate(170,0);
 x.fillStyle="rgba(225,211,166,.82)";x.fillRect(-42,450,84,62);
 x.fillStyle="#574a34";x.font="12px Georgia";x.textAlign="left";
 const letters="ADEUS".slice(0,1+Math.floor((t*2)%5));
 x.fillText(letters,-31,482);
 x.fillStyle="#d6c18b";x.textAlign="center";x.fillText("a despedida nunca termina",0,620);

 x.translate(170,0);
 const leafY=500-Math.abs(Math.sin(t*1.8))*70;
 x.save();x.translate(0,leafY);x.rotate(t*.7);x.fillStyle="#c18b43";x.beginPath();x.ellipse(0,0,12,22,.35,0,Math.PI*2);x.fill();x.restore();
 x.fillStyle="#d6c18b";x.textAlign="center";x.fillText("a folha tenta cair",0,620);
 x.restore();
}

function ensureMotherTreeSuspendedMemories(){
 if(motherTreeSuspendedLoadStarted)return;
 motherTreeSuspendedLoadStarted=true;
 motherTreeSuspendedFiles.forEach((file,i)=>{
   img("../assets/game/phase3/mother-tree/suspended-memories/"+file)
     .then(im=>{motherTreeSuspendedMemories[i]=im})
     .catch(()=>{motherTreeSuspendedMemories[i]=null});
 });
}

function jackSuspendedMemoryFocus(){
 if(!dialogue.active)return false;
 const line=dialogue.lines?.[dialogue.index];
 if(!line)return false;
 if(dialogue.lines===story.dialogues.motherTree){
   const text=String(line.text||"");
   return /não é minha|raízes em você|não toque nelas|caminho de volta/i.test(text);
 }
 return false;
}

function drawMotherTreeSuspendedMemories(treeX,groundY,layer="back"){
 if(!motherTreeSuspendedLoadStarted)return;
 // Antes da conversa, elas já existem como ruído da prisão; durante a cena ganham força.
 const proximity=Math.max(0,Math.min(1,(p.x-5950)/520));
 if(proximity<=0&&!motherTreeScene)return;

 const t=p.anim;
 const centerY=groundY-272;
 const jackFocus=jackSuspendedMemoryFocus();
 const phaseAlpha=bossComplete?.34:(bossActive?.56:(motherTreeScene?1:.54+.42*proximity));
 const speedMul=bossComplete?.16:(bossActive?1.18:1);

 suspendedMemoryOrbits.forEach((item,i)=>{
   const im=motherTreeSuspendedMemories[item.image];
   if(!im)return;

   if(item.fx){
     if(layer!=="back")return;
     const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
     const dh=item.h*(1+Math.sin(t*.72)*.025),dw=iw*(dh/ih);
     x.save();
     x.translate(treeX,centerY+item.lift);
     x.rotate(t*item.speed*speedMul);
     x.globalAlpha=item.alpha*phaseAlpha*(bossActive?.55:1);
     x.globalCompositeOperation="screen";
     x.shadowColor="rgba(246,194,82,.32)";
     x.shadowBlur=22;
     x.drawImage(im,-dw/2,-dh/2,dw,dh);
     x.restore();
     return;
   }

   const a=item.angle+t*item.speed*speedMul;
   const depth=Math.sin(a);
   const itemLayer=depth<0?"back":"front";
   if(itemLayer!==layer)return;

   // Quando a memória de Jack não está sendo evocada, ela quase se perde entre as demais.
   let specialMul=1;
   if(item.image===7)specialMul=jackFocus?1.18:.22;

   const bob=Math.sin(t*.92+i*1.31)*5;
   const px=treeX+Math.cos(a)*item.rx;
   const py=centerY+item.lift+Math.sin(a)*item.ry+bob;
   const depthScale=.88+(depth+1)*.085;
   const dh=item.h*depthScale*(item.image===7&&jackFocus?1.12:1);
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,dw=iw*(dh/ih);

   x.save();
   x.translate(px,py);
   x.rotate(Math.sin(t*.63+i)*item.rot+Math.cos(a)*.035);
   x.globalAlpha=item.alpha*phaseAlpha*specialMul*(layer==="back"?.76:1);
   x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";

   if(item.image===7&&jackFocus){
     x.shadowColor="rgba(255,195,73,.88)";
     x.shadowBlur=28+Math.sin(t*5)*6;
   }else{
     x.shadowColor="rgba(233,182,74,.34)";
     x.shadowBlur=9;
   }
   x.drawImage(im,-dw/2,-dh/2,dw,dh);
   x.restore();
 });
}

function drawMotherTreeAndBoss(){
 if(!motherTreeScene&&p.x<6000)return;

 let state="idle";
 if(bossComplete)state="restored";
 else if(bossActive)state="corrupted";
 else if(motherTreeScene)state="awakened";

 const im=motherTreeSprites[state]||motherTreeSprites.idle;
 const treeX=7040,groundY=590;

 // Camada traseira: cartas, placas, retratos e cristais passam por trás dos galhos.
 drawMotherTreeSuspendedMemories(treeX,groundY,"back");

 if(im){
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   const baseH=585;
   const pulse=(state==="awakened"||state==="restored")?1+Math.sin(p.anim*1.8)*.008:1;
   const dh=baseH*pulse,dw=iw*(dh/ih);
   const dx=treeX-dw/2,dy=groundY-dh+5;
   x.save();x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
   if(state==="restored"){x.shadowColor="rgba(247,219,137,.52)";x.shadowBlur=28+Math.sin(p.anim*2)*8}
   else if(state==="awakened"){x.shadowColor="rgba(224,181,92,.28)";x.shadowBlur=18}
   else if(state==="corrupted"){x.shadowColor="rgba(150,53,96,.30)";x.shadowBlur=18}
   x.drawImage(im,dx,dy,dw,dh);x.restore();
 }

 // Camada frontal: completa a órbita e dá a sensação de relíquias realmente circulando o tronco.
 drawMotherTreeSuspendedMemories(treeX,groundY,"front");

 if(bossPrelude&&!bossActive&&!bossComplete){
   // Durante o nascimento do Arquivista, as Memórias Suspensas reais convergem
   // para o centro. Isso substitui os antigos quadrados-placeholder.
   ensureMotherTreeSuspendedMemories();
   const t=p.anim;
   const relicIds=[0,1,2,3,4,5,6,7,0,4];

   x.save();x.translate(treeX,360);
   relicIds.forEach((imageId,i)=>{
     const im=motherTreeSuspendedMemories[imageId];
     if(!im)return;

     const a=t*(.34+(i%3)*.075)+i*(Math.PI*2/relicIds.length);
     const r=96+(i%4)*25;
     const px=Math.cos(a)*r;
     const py=Math.sin(a)*r*.62;
     const depth=(Math.sin(a)+1)/2;

     const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
     const dh=(imageId===7?72:56)*(0.88+depth*.18);
     const dw=iw*(dh/ih);

     x.save();
     x.translate(px,py);
     x.rotate(-a*.22+Math.sin(t*.7+i)*.055);
     x.globalAlpha=(imageId===7?.46:.68)*(0.78+depth*.22);
     x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
     x.shadowColor=imageId===7?"rgba(255,192,72,.72)":"rgba(232,182,79,.42)";
     x.shadowBlur=imageId===7?22:12;
     x.drawImage(im,-dw/2,-dh/2,dw,dh);
     x.restore();
   });

   // A espiral dourada dá a sensação de que as lembranças estão sendo puxadas
   // pela ordem antiga de Mara, sem encobrir a Árvore-Mãe.
   const swirl=motherTreeSuspendedMemories[8];
   if(swirl){
     const iw=swirl.naturalWidth||swirl.width,ih=swirl.naturalHeight||swirl.height;
     const dh=250,dw=iw*(dh/ih);
     x.save();
     x.rotate(-t*.12);
     x.globalAlpha=.12+.035*Math.sin(t*2.2);
     x.globalCompositeOperation="screen";
     x.shadowColor="rgba(246,196,91,.34)";
     x.shadowBlur=20;
     x.drawImage(swirl,-dw/2,-dh/2,dw,dh);
     x.restore();
   }
   x.restore();
 }

 const showingBoss=(bossActive&&!bossComplete)||(bossComplete&&bossReleaseT>0);
 if(showingBoss){
   let pool=archivistSprites.base,idx=0,labelState="base";

   if(bossComplete&&bossReleaseT>0){
     pool=archivistSprites.release;
     const progress=Math.max(0,Math.min(.999,(3.2-bossReleaseT)/3.2));
     idx=Math.min(2,Math.floor(progress*3));
     labelState="release";
   }else if(bossAct===3&&bossStep>=bossRootPositions.length){
     pool=archivistSprites.heart;
     idx=Math.floor(p.anim*1.45)%Math.max(1,pool.length);
     labelState="heart";
   }else if(bossPulse>1.35&&archivistSprites.attacks.length){
     pool=archivistSprites.attacks;
     idx=Math.floor(p.anim*5)%archivistSprites.attacks.length;
     labelState="attack";
   }else if(bossAct===2){
     pool=archivistSprites.voices;
     idx=Math.floor(p.anim*1.15)%Math.max(1,pool.length);
     labelState="voices";
   }else if(bossAct===1&&bossFirstStrike){
     pool=archivistSprites.faces;
     idx=Math.min(Math.max(0,pool.length-1),bossFacesSeen.filter(Boolean).length);
     labelState="faces";
   }

   if(!pool?.length)pool=archivistSprites.base;
   const bossIm=pool?.[Math.min(idx,Math.max(0,pool.length-1))]||archivistSprites.base[0];

   if(bossIm){
     const iw=bossIm.naturalWidth||bossIm.width,ih=bossIm.naturalHeight||bossIm.height;
     const releaseAlpha=bossComplete?Math.max(0,Math.min(1,bossReleaseT/3.2)):1;
     const breathing=1+Math.sin(p.anim*(labelState==="heart"?3.3:1.7))*(labelState==="heart"?.018:.007);
     const baseH=labelState==="release"?520:(labelState==="heart"?530:500);
     const dh=baseH*breathing,dw=iw*(dh/ih);
     const dx=treeX-dw/2,dy=groundY-dh+9;
     x.save();
     x.globalAlpha=releaseAlpha;
     x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
     x.shadowColor=labelState==="heart"||labelState==="release"?"rgba(248,214,122,.72)":"rgba(218,176,87,.38)";
     x.shadowBlur=(labelState==="heart"?38:20)+bossPulse*8;
     x.drawImage(bossIm,dx,dy,dw,dh);
     x.restore();
   }else{
     // Fallback mínimo se algum PNG falhar: não deixa o combate invisível.
     x.save();x.translate(treeX,0);x.strokeStyle="#725137";x.lineWidth=18;x.lineCap="round";
     x.beginPath();x.moveTo(-55,540);x.quadraticCurveTo(-35,410,0,260);x.quadraticCurveTo(35,410,55,540);x.stroke();
     x.fillStyle="#e2c36d";x.beginPath();x.arc(0,395,22+bossPulse*4,0,Math.PI*2);x.fill();x.restore();
   }

   x.save();x.fillStyle="#f1dda0";x.font="700 15px Georgia";x.textAlign="center";
   x.fillText(story.boss.name,treeX,92);
   if(bossActive)x.fillText(story.boss.acts[Math.max(0,bossAct-1)].title,treeX,118);
   x.restore();
 }
 if(bossActive&&bossAct===1&&bossFirstStrike){
   bossFacePositions.forEach((z,i)=>{
     const seen=bossFacesSeen[i];
     x.save();x.translate(z,0);
     x.shadowColor=seen?"rgba(239,214,132,.62)":"rgba(95,74,49,.35)";x.shadowBlur=seen?22:8;
     x.strokeStyle=seen?"#e3ca82":"#8a7048";x.lineWidth=4;x.strokeRect(-35,420,70,86);
     x.fillStyle=seen?"rgba(225,201,128,.34)":"rgba(19,20,17,.72)";x.fillRect(-31,424,62,78);
     x.fillStyle="#ead9a3";x.font="700 11px Georgia";x.textAlign="center";x.fillText(["LÍVIA","TOMÁS","CELINA"][i],0,530);x.restore();
   });
 }

 if(bossActive&&bossAct===2){
   [6960,7160,7360].forEach((z,i)=>{
     x.save();x.translate(z,0);x.shadowColor="rgba(157,193,136,.42)";x.shadowBlur=16;
     x.strokeStyle="#a4b887";x.lineWidth=4;x.beginPath();x.arc(0,505,34,0,Math.PI*2);x.stroke();
     x.fillStyle="#ead792";x.font="700 15px Georgia";x.textAlign="center";x.fillText(["II","I","III"][i],0,510);x.restore();
   });
 }

 if(bossActive&&bossAct===3){
   for(let i=bossStep;i<bossRootPositions.length;i++){
     const z=bossRootPositions[i];x.save();x.translate(z,0);x.strokeStyle="#6f4d31";x.lineCap="round";
     for(let k=-2;k<=2;k++){x.lineWidth=10-Math.abs(k);x.beginPath();x.moveTo(k*9,590);x.quadraticCurveTo(k*18-18,520,k*8,425);x.stroke()}
     x.fillStyle="#d5b66b";x.beginPath();x.arc(0,420,5,0,Math.PI*2);x.fill();x.restore();
   }
   if(bossStep>=bossRootPositions.length){
     x.save();x.translate(treeX,0);x.shadowColor="rgba(246,216,130,.8)";x.shadowBlur=36;
     x.strokeStyle="#f0d58d";x.lineWidth=4;x.beginPath();x.arc(0,397,42+Math.sin(p.anim*3)*5,0,Math.PI*2);x.stroke();x.restore();
   }
 }
}

function tryInteract(){
 if(!running||dialogue.active||endingSequenceActive)return;
 lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;
 const pc=p.x+p.w/2,m=maraWorldState();

 if(bossActive&&bossAct===3){
   if(bossStep<bossRootPositions.length){say("Ainda há raízes entre Mara e o coração. Use a Luz para abrir o caminho.");return}
   finishBoss();return;
 }

 if(voicesSolved&&!archiveSolved&&pc>5440&&pc<5980){
   const xs=[5525,5705,5885],near=xs.map((z,i)=>({i,d:Math.abs(z-pc)})).sort((a,b)=>a.d-b.d)[0];
   archiveChoice=near.i;archiveSeen[near.i]=true;
   const item=story.archivePuzzle.entries[near.i];

   if(near.i===2&&!archiveKeyReactionPlayed){
     archiveKeyReactionPlayed=true;p.vx=0;
     dialogue.open(story.dialogues.archiveKey,()=>{say(item.title+" — "+item.memory);save()});
     save();return;
   }

   if(!archiveSeen.every(Boolean)){
     say(item.title+" — "+item.memory+" ("+archiveSeen.filter(Boolean).length+"/3 lembranças ouvidas)");
     save();return;
   }

   p.vx=0;archiveSolved=true;banner("MEMÓRIA NÃO APAGADA — LIBERTADA");
   dialogue.open(story.dialogues.archiveSolved,()=>{
     say("As raízes soltaram o caminho para a Árvore-Mãe.");
     startMaraRun(5575,6380,()=>save());save();
   });
   save();return;
 }

 if(!maraRun.active&&Math.abs(pc-m.x)<120){
   if(!maraMet){
     maraMet=true;p.vx=0;
     dialogue.open(story.dialogues.maraMeeting,()=>{
       say("Os retratos respondem à Luz. F revela a lembrança; E troca o nome.");
       startMaraRun(2275,2700,()=>{banner("BOSQUE DOS RETRATOS");save()});save();
     });
     return;
   }
   if(!portraitsSolved){say("Mara: Ilumine cada retrato e devolva a ele o nome que pertence àquela história.");return}
   if(!voicesSolved){say("Mara: As três vozes formavam uma única frase. A Luz ainda consegue separá-las.");return}
   if(!archiveSolved){say("Mara: O Arquivo não quer apagar nada. Talvez estejamos fazendo a pergunta errada.");return}
   if(!motherTreeScene){say("Mara: A Árvore-Mãe está adiante. E acho que ela já sabe que estamos chegando.");return}
   say("Mara: Não posso desfazer o passado. Mas posso escolher o que faço com ele agora.");return;
 }

 if(maraMet&&!portraitsSolved){
   const hit=nearestPuzzleEntry(story.portraitPuzzle.entries);
   if(hit){
     if(!portraitRevealed[hit.i]){
       portraitWrong[hit.i]=.7;
       say("A placa está presa às raízes. Primeiro desperte a lembrança com F.");
       return;
     }
     portraitChoices[hit.i]=(portraitChoices[hit.i]+1)%story.portraitPuzzle.names.length;
     const chosen=story.portraitPuzzle.names[portraitChoices[hit.i]];
     const correct=chosen===hit.q.correct;
     portraitPulse[hit.i]=correct?1.6:.75;
     if(correct){
       banner("NOME DEVOLVIDO — "+chosen);
       say(hit.q.title+" reconheceu "+chosen+".");
     }else{
       portraitWrong[hit.i]=.85;
       say("A placa range. "+chosen+" não pertence a esta lembrança.");
     }
     finishPortraitPuzzle();save();return;
   }
 }
 if(portraitsSolved&&!voicesSolved){
   const hit=nearestPuzzleEntry(story.voicePuzzle.entries,145);
   if(hit){activateVoice(hit.i);return}
 }
 say("Nada aqui respondeu ao toque.");
}

function motherTreeFragmentTarget(){
 if(!dialogue.active||dialogue.lines!==story.dialogues.motherTree)return -1;
 const i=dialogue.index;
 // Mara: arquivo, cartas e raízes.
 if(i>=6&&i<=7)return 0;
 if(i>=8&&i<=12)return 2;
 if(i>=13&&i<=17)return 1;
 // Bosque: rostos guardados e vozes repetidas.
 if(i>=18&&i<=21)return 3;
 if(i>=22&&i<=24)return 4;
 // A memória intrusa: Jack, sua abóbora e um caminho que ele evita lembrar.
 if(i>=25&&i<=29)return 5;
 return -1;
}

function updateMotherTreeFragmentState(dt){
 const target=motherTreeFragmentTarget();
 if(target!==motherTreeFragmentCurrent){
   motherTreeFragmentPrevious=motherTreeFragmentCurrent;
   motherTreeFragmentCurrent=target;
   motherTreeFragmentBlend=0;
 }
 motherTreeFragmentBlend=Math.min(1,motherTreeFragmentBlend+dt*2.8);
}

function drawFragmentImage(im,cx,cy,targetH,alpha,rotation=0){
 if(!im||alpha<=0)return;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const dh=targetH,dw=iw*(dh/ih);
 x.save();
 x.translate(cx,cy);
 x.rotate(rotation);
 x.globalAlpha=alpha;
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
 x.shadowColor="rgba(243,190,70,.62)";
 x.shadowBlur=24;
 x.drawImage(im,-dw/2,-dh/2,dw,dh);
 x.restore();
}

function drawMotherTreeFragments(){
 if(!dialogue.active||dialogue.lines!==story.dialogues.motherTree)return;
 const target=motherTreeFragmentCurrent;
 if(target<0&&motherTreeFragmentPrevious<0)return;

 const t=p.anim;
 x.save();
 // Escurece delicadamente o mundo para as lembranças parecerem projetadas pela Árvore.
 const shade=x.createRadialGradient(W*.60,H*.36,80,W*.60,H*.36,650);
 shade.addColorStop(0,"rgba(38,28,14,.08)");
 shade.addColorStop(1,"rgba(2,7,5,.48)");
 x.fillStyle=shade;x.fillRect(0,0,W,H);

 const blend=motherTreeFragmentBlend;
 if(motherTreeFragmentPrevious>=0&&motherTreeFragmentPrevious!==target){
   drawFragmentImage(
     motherTreeFragments[motherTreeFragmentPrevious],
     W*.61,H*.37,430*(1-blend*.08),
     Math.max(0,(1-blend)*.72),
     Math.sin(t*.7)*.012
   );
 }

 if(target>=0){
   const isJack=target===5;
   if(!isJack){
     // Pequenos estilhaços acumulados: o passado de Mara literalmente cerca a conversa.
     const minis=[
       [0,W*.18,H*.27,185,-.055],
       [1,W*.34,H*.18,150,.045],
       [2,W*.84,H*.23,165,.06],
       [3,W*.91,H*.48,145,-.05],
       [4,W*.18,H*.52,155,.04]
     ];
     minis.forEach(([id,cx,cy,h,r])=>{
       if(id===target||!motherTreeFragments[id])return;
       const a=.13+Math.sin(t*1.4+id)*.025;
       drawFragmentImage(motherTreeFragments[id],cx,cy+Math.sin(t*.9+id)*5,h,a,r);
     });
   }else{
     // O fragmento de Jack interrompe a sequência: os demais recuam e a luz pulsa.
     const flash=.08+.08*Math.max(0,Math.sin(t*4.8));
     x.fillStyle="rgba(238,177,65,"+flash+")";x.fillRect(0,0,W,H);
   }

   const bob=Math.sin(t*.85)*5;
   drawFragmentImage(
     motherTreeFragments[target],
     W*.62,H*.36+bob,
     isJack?515:475,
     .82*blend,
     Math.sin(t*.62)*.009
   );

   // Partículas de memória sem criar assets extras.
   x.globalCompositeOperation="screen";
   for(let i=0;i<18;i++){
     const a=t*.28+i*.87,r=170+(i%6)*31;
     const px=W*.62+Math.cos(a)*r,py=H*.35+Math.sin(a*1.17)*r*.42;
     const radius=1.2+(i%3)*.8;
     x.globalAlpha=.18+.18*Math.sin(t*1.5+i)*.5+.09;
     x.fillStyle=isJack?"#ffd36c":"#e8c879";
     x.beginPath();x.arc(px,py,radius,0,Math.PI*2);x.fill();
   }
 }
 x.restore();
}

function updateNarrativeTriggers(){
 if(dialogue.active||endingSequenceActive)return;

 if(!firstWhisperPlayed&&p.x>1240){
   firstWhisperPlayed=true;p.vx=0;memoryPulse=.8;
   dialogue.open(story.dialogues.firstWhisper,()=>save());return;
 }

 if(!maraMet&&p.x>2160){
   maraMet=true;p.vx=0;
   dialogue.open(story.dialogues.maraMeeting,()=>{
     say("Os retratos respondem à Luz. F revela a lembrança; E troca o nome.");
     startMaraRun(2275,2700,()=>{banner("BOSQUE DOS RETRATOS");save()});save();
   });
   return;
 }

 if(archiveSolved&&!approachTreePlayed&&p.x>6170){
   approachTreePlayed=true;p.vx=0;memoryPulse=1.05;
   dialogue.open(story.dialogues.approachTree,()=>{say("Adiante, nada consegue terminar.");startMaraRun(6380,6680,()=>save());save()});return;
 }

 if(archiveSolved&&approachTreePlayed&&!motherTreeScene&&p.x>6500){
   motherTreeScene=true;p.vx=0;maraBossX=6680;
   ensureMotherTreeSuspendedMemories();
   fadeMusicTo("motherTree",.56,1100);
   banner("ÁRVORE-MÃE — O CORAÇÃO DAS RAÍZES");
   dialogue.open(story.dialogues.motherTree,()=>{
     bossPrelude=true;memoryPulse=1.4;save();
     dialogue.open(story.dialogues.bossBirth,()=>{
       startBoss();
     });
   });
   return;
 }
}

function useMemoryLight(){
 if(dialogue.active)return;
 lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;waitSitFrame=0;
 const duration=window.JACK_ANIMATIONS?.timing?.attackDuration||.48;
 p.attack=duration;
 memoryLight=3.25;memoryPulse=.65;
 if(advanceBossWithLight())return;

 if(maraMet&&!portraitsSolved){
   const hit=nearestPuzzleEntry(story.portraitPuzzle.entries,175);
   if(hit){
     const first=!portraitRevealed[hit.i];
     portraitRevealed[hit.i]=true;
     portraitPulse[hit.i]=first?1.7:1.0;
     memoryPulse=Math.max(memoryPulse,first?1.05:.72);
     if(first)banner("LEMBRANÇA DESPERTA — "+hit.q.title.toUpperCase());
     say("Memória — "+hit.q.clue);
     save();return;
   }
 }
 if(portraitsSolved&&!voicesSolved){
   const hit=nearestPuzzleEntry(story.voicePuzzle.entries,175);
   if(hit){say('Eco — “'+hit.q.fragment+'”');return}
 }
 say("A lanterna recorda um caminho que já não existe.");
}

function update(dt){
 if((maraMet||p.x>2180)&&!portraitPuzzleAssetsLoadStarted)ensurePortraitPuzzleAssets();
 updateRootGateAnimations(dt);
 updateMotherTreeFragmentState(dt);
 if((p.x>5550||motherTreeScene)&&!motherTreeSuspendedLoadStarted)ensureMotherTreeSuspendedMemories();
 bossReleaseT=Math.max(0,bossReleaseT-dt);
 if(endingSequenceActive&&!dialogue.active){
   p.vx=0;p.vy=0;p.anim+=dt;
   cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.35))-cam)*Math.min(1,dt*4);
   return;
 }
 if(dialogue.active){
   lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;p.vx*=.72;p.anim+=dt;
   cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.35))-cam)*Math.min(1,dt*4);
   return;
 }
 const idleNow=!input.left&&!input.right&&!input.down&&!input.jump&&!input.run&&p.attack<=0;
 if(idleNow){
   idleTime=(performance.now()-lastPlayerAction)/1000;
   if(idleTime>=8&&p.on){
     if(!waitSitActive){waitSitActive=true;waitSitFrame=0;waitSitClock=0}
     waitSitClock+=dt;
     if(waitSitClock>=.38){waitSitClock=0;if(waitSitFrame<10)waitSitFrame++;else waitSitFrame=7}
   }
 }else{lastPlayerAction=performance.now();idleTime=0;waitSitClock=0;waitSitFrame=0;waitSitActive=false}

 memoryLight=Math.max(0,memoryLight-dt);memoryPulse=Math.max(0,memoryPulse-dt);p.attack=Math.max(0,p.attack-dt);
 for(let i=0;i<3;i++){portraitPulse[i]=Math.max(0,portraitPulse[i]-dt*1.8);portraitWrong[i]=Math.max(0,portraitWrong[i]-dt*2.6)}
 gateMessageCooldown=Math.max(0,gateMessageCooldown-dt);bossCooldown=Math.max(0,bossCooldown-dt);bossPulse=Math.max(0,bossPulse-dt);
 updateMaraRun(dt);

 p.coyote=p.on?.12:Math.max(0,p.coyote-dt);
 if(input.jump){p.buffer=.14;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
 const speed=input.down?90:(input.run?325:228),dir=(input.right?1:0)-(input.left?1:0);
 p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
 if(p.buffer>0&&p.coyote>0&&!input.down){p.vy=-575;p.on=false;p.coyote=0;p.buffer=0}

 p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));
 if(!rootGatePassable("portraits")&&p.x+p.w>3740){
   p.x=3740-p.w;p.vx=Math.min(0,p.vx);
   if(gateMessageCooldown<=0){
     say(portraitsSolved?"As raízes estão abrindo o caminho...":"As raízes seguram o caminho. Os três retratos ainda não estão completos.");
     gateMessageCooldown=2;
   }
 }
 if(portraitsSolved&&!rootGatePassable("voices")&&p.x+p.w>5200){
   p.x=5200-p.w;p.vx=Math.min(0,p.vx);
   if(gateMessageCooldown<=0){
     say(voicesSolved?"O portão do Lago está despertando...":"O lago não abre passagem enquanto a voz de Mara continuar fragmentada.");
     gateMessageCooldown=2;
   }
 }
 if(voicesSolved&&!rootGatePassable("archive")&&p.x+p.w>6000){
   p.x=6000-p.w;p.vx=Math.min(0,p.vx);
   if(gateMessageCooldown<=0){
     say(archiveSolved?"O Arquivo está soltando suas raízes...":"As raízes recusam a passagem. O Arquivo ainda guarda algo que precisa ser deixado ir.");
     gateMessageCooldown=2;
   }
 }

 if(bossActive&&p.x<6650){p.x=6650;p.vx=Math.max(0,p.vx)}
 if(bossActive&&p.x+p.w>7540){p.x=7540-p.w;p.vx=Math.min(0,p.vx)}
 if(bossActive&&bossAct===3&&bossStep<bossRootPositions.length){
   const rootX=bossRootPositions[bossStep];
   if(p.x+p.w>rootX-16){p.x=rootX-16-p.w;p.vx=Math.min(0,p.vx)}
 }

 p.y+=p.vy*dt;p.on=false;
 const solids=plats.concat(memoryLight>0?memoryPlats:[]);
 for(const q of solids){
   if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}
 }

 if(p.y>780){
   playerLife--;syncHud();
   if(playerLife<=0)respawn("As raízes devolveram Jack ao último ponto de luz.");
   else{
     const cp=checkpoints.find(z=>z.id===activeCheckpoint);
     p.x=cp?cp.respawnX:120;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;
     say("O Bosque engoliu um passo — "+playerLife+"/3 luzes.");
   }
 }

 updateCheckpoint();updateNarrativeTriggers();
 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.35))-cam)*Math.min(1,dt*5);
 let si=0;for(let i=0;i<sections.length;i++)if(p.x>=sections[i].x)si=i;if(si!==section){section=si;banner(sections[si].n)}

 if(p.x>980&&p.x<1480)ui.obj.textContent="Use a Luz para caminhar sobre uma lembrança do caminho.";
 else if(!maraMet&&p.x>=1480)ui.obj.textContent="Siga as folhas até a mulher que espera junto às raízes.";
 else if(maraMet&&!portraitsSolved&&p.x>=2500)ui.obj.textContent="BOSQUE DOS RETRATOS: F desperta a lembrança. Leia a história e use E para devolver o nome correto.";
 else if(portraitsSolved&&!voicesSolved&&p.x>=3900)ui.obj.textContent="Ouça os três ecos com F e monte a frase de Mara usando E.";
 else if(voicesSolved&&!archiveSolved)ui.obj.textContent="Arquivo das Raízes: examine carta, melodia e chave com E. Nenhuma precisa ser apagada.";
 else if(archiveSolved&&!approachTreePlayed)ui.obj.textContent="Siga Mara. Observe o que acontece com as coisas que tentam terminar.";
 else if(archiveSolved&&!motherTreeScene)ui.obj.textContent="O ciclo está quebrado. Alcance a Árvore-Mãe.";
 else if(bossPrelude&&!bossActive&&!bossComplete)ui.obj.textContent="As memórias estão se reunindo. A antiga ordem de Mara ganhou forma.";
 else if(bossActive&&bossAct===1&&!bossFirstStrike)ui.obj.textContent="ATO I — OS ROSTOS: use a Luz no Arquivista e descubra por que ele não pode ser vencido pela força.";
 else if(bossActive&&bossAct===1)ui.obj.textContent="ATO I — OS ROSTOS: aproxime-se de Lívia, Tomás e Celina e use F para reconhecê-los.";
 else if(bossActive&&bossAct===2)ui.obj.textContent="ATO II — AS VOZES: reconheça os ecos na mesma sequência aprendida no Lago.";
 else if(bossActive&&bossAct===3&&bossStep<bossRootPositions.length)ui.obj.textContent="ATO III — A ESCOLHA: ilumine a raiz à frente de Mara para abrir o caminho.";
 else if(bossActive&&bossAct===3)ui.obj.textContent="O coração da ordem está exposto. Aproxime-se e pressione E.";
 else if(bossComplete&&!finalePlayed)ui.obj.textContent="Pela primeira vez, as folhas estão caindo para o chão.";
 else if(finalePlayed)ui.obj.textContent="O caminho de Mara terminou. O de Jack continua.";
 else if(motherTreeScene)ui.obj.textContent="Escute a Árvore-Mãe.";
 else ui.obj.textContent="Siga as folhas que caem para o céu.";

 p.anim+=dt;saveClock+=dt;if(saveClock>2.5){saveClock=0;save()}
}
let saveClock=0;

function drawCoverImage(im,alpha=1,offsetX=0){
 if(!im)return;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const scale=Math.max(W/iw,H/ih),dw=iw*scale,dh=ih*scale;
 x.save();x.globalAlpha=alpha;x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
 x.drawImage(im,(W-dw)/2+offsetX,(H-dh)/2,dw,dh);x.restore();
}
function drawBackdrop(){
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#071318");g.addColorStop(.5,"#16251d");g.addColorStop(1,"#2c251a");x.fillStyle=g;x.fillRect(0,0,W,H);
 // Cenário oficial do Bosque das Memórias, com parallax muito leve.
 if(forestBackground)drawCoverImage(forestBackground,1,-((cam*.035)%36));
 // A arte da Árvore-Mãe entra gradualmente no último trecho para não haver corte seco.
 if(motherTreeBackground){
   const blend=Math.max(0,Math.min(1,(cam-5350)/700));
   if(blend>0)drawCoverImage(motherTreeBackground,blend,-((cam*.018)%20));
 }
 // Vignette/fog mantém Jack legível sobre as duas pinturas.
 const fog=x.createLinearGradient(0,390,0,H);fog.addColorStop(0,"rgba(10,18,13,0)");fog.addColorStop(1,"rgba(8,14,10,.24)");x.fillStyle=fog;x.fillRect(0,390,W,H);
 const vg=x.createRadialGradient(W/2,H/2,220,W/2,H/2,760);vg.addColorStop(.55,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.26)");x.fillStyle=vg;x.fillRect(0,0,W,H);
}

function drawLeaves(){
 const dt=.016,down=bossComplete;
 for(const l of leaves){
   l.sy+=(down?1:-1)*l.speed*dt;
   l.sx+=Math.sin(p.anim*.55+l.phase)*.32+l.drift*dt;
   l.rot+=l.spin*dt*(down?.72:1);
   if(!down&&l.sy<-55){l.sy=H+35+Math.random()*130;l.sx=Math.random()*W;l.imageIndex=Math.floor(Math.random()*6)}
   if(down&&l.sy>H+65){l.sy=-35-Math.random()*140;l.sx=Math.random()*W;l.imageIndex=Math.floor(Math.random()*6)}
   if(l.sx<-65)l.sx=W+45;if(l.sx>W+65)l.sx=-45;

   const im=memoryLeafImages[l.imageIndex];
   if(!im)continue;
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   const scale=l.depth<.58?.72:(l.depth>.9?1.18:1);
   const h=l.size*2.15*scale,w=h*(iw/ih);
   x.save();x.translate(l.sx,l.sy);x.rotate(l.rot+Math.sin(p.anim*.8+l.phase)*.16);
   x.globalAlpha=l.depth<.58?.34:(l.depth>.9?.82:.58);
   if(l.depth>.9){x.shadowColor=down?"rgba(243,211,125,.30)":"rgba(232,178,78,.22)";x.shadowBlur=7}
   x.drawImage(im,-w/2,-h/2,w,h);x.restore();
 }
}
const phase3PlatformSurface=[.305,.285,.335,.285];

function drawPhase3PlatformSprite(q,isMemory=false,variant=0){
 const im=phase3PlatformImages[isMemory?3:Math.max(0,Math.min(2,variant))];
 if(!im){
   // Fallback: mantém o chão legível caso algum PNG falhe.
   x.save();
   x.globalAlpha=isMemory?(memoryLight>0?.72:.07):1;
   x.fillStyle=isMemory?"#657a5d":(q.h>100?"#263024":"#394133");
   x.fillRect(q.x,q.y,q.w,q.h);
   x.fillStyle=isMemory?"#d8c879":"#81704a";
   x.fillRect(q.x,q.y,q.w,Math.min(6,q.h));
   x.restore();
   return;
 }

 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
 const idx=isMemory?3:Math.max(0,Math.min(2,variant));
 const surfaceFrac=phase3PlatformSurface[idx]||.30;

 // Plataformas de chão muito longas são formadas por trechos, evitando esticar
 // a pintura por milhares de pixels. As elevadas usam um único sprite.
 const ground=q.h>100;
 const idealPieceW=ground?Math.min(720,Math.max(500,q.w*.62)):Math.max(q.w+34,235);
 const pieces=ground?Math.max(1,Math.ceil(q.w/idealPieceW)):1;
 const pieceW=q.w/pieces;

 for(let i=0;i<pieces;i++){
   // Alterna 01/02/03 no chão para o Bosque não parecer uma textura repetida.
   const useIdx=isMemory?3:(ground?(variant+i)%3:idx);
   const pieceIm=phase3PlatformImages[useIdx]||im;
   const piw=pieceIm.naturalWidth||pieceIm.width,pih=pieceIm.naturalHeight||pieceIm.height;
   const visualW=ground?pieceW+16:q.w+34;
   const visualH=visualW*(pih/piw);
   const surf=phase3PlatformSurface[useIdx]||.30;
   const drawX=(ground?q.x+i*pieceW:q.x)-((visualW-(ground?pieceW:q.w))/2);
   const drawY=q.y-visualH*surf;

   x.save();
   x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
   if(isMemory){
     const visible=memoryLight>0;
     x.globalAlpha=visible?.92:.065;
     x.shadowColor=visible?"rgba(235,215,132,.72)":"transparent";
     x.shadowBlur=visible?24:0;
     if(visible)x.globalCompositeOperation="screen";
   }
   x.drawImage(pieceIm,drawX,drawY,visualW,visualH);
   x.restore();
 }
}

function drawWorld(){
 x.save();x.translate(-cam,0);

 // Plataformas oficiais do Bosque. A colisão continua sendo a dos arrays
 // plats/memoryPlats; os PNGs substituem apenas os antigos retângulos.
 plats.forEach((q,i)=>{
   const variant=q.h>100?(i%3):((i+1)%3);
   drawPhase3PlatformSprite(q,false,variant);
 });

 // Plataformas-memória usam a quarta arte, mais luminosa, e continuam
 // praticamente invisíveis até Jack erguer a Luz da Memória.
 memoryPlats.forEach(q=>drawPhase3PlatformSprite(q,true,3));

 // checkpoint procedural
 for(const cp of checkpoints){
   const lit=activeCheckpoint===cp.id;x.save();x.translate(cp.x,cp.groundY);
   if(lit){const gr=x.createRadialGradient(0,-115,12,0,-115,130);gr.addColorStop(0,"rgba(240,201,92,.32)");gr.addColorStop(1,"rgba(89,130,80,0)");x.fillStyle=gr;x.beginPath();x.arc(0,-115,130,0,Math.PI*2);x.fill()}
   x.strokeStyle=lit?"#d0ac5d":"#65725d";x.lineWidth=9;x.beginPath();x.moveTo(0,0);x.lineTo(-6,-125);x.stroke();
   x.lineWidth=6;x.beginPath();x.moveTo(-5,-90);x.lineTo(-48,-132);x.moveTo(-4,-72);x.lineTo(45,-116);x.stroke();
   x.fillStyle=lit?"#f0ce72":"#39463a";x.beginPath();x.arc(-48,-132,10,0,Math.PI*2);x.fill();x.beginPath();x.arc(45,-116,10,0,Math.PI*2);x.fill();x.restore();
 }
 drawPortraitPuzzleWorld();
 drawVoicePuzzleWorld();
 drawArchivePuzzleWorld();
 drawCycleFailures();
 drawRootGate(3740,rootGateProgress.portraits);
 drawRootGate(5200,rootGateProgress.voices);
 drawRootGate(6000,rootGateProgress.archive);
 drawMotherTreeAndBoss();
 drawMaraWorld();
 x.restore();
}

function drawMemoryLight(){
 if(memoryLight<=0&&memoryPulse<=0)return;
 const alpha=Math.min(.32,.08+memoryLight*.045+memoryPulse*.28),cx=p.x-cam+p.w/2,cy=p.y+p.h*.5;
 const gr=x.createRadialGradient(cx,cy,25,cx,cy,245);gr.addColorStop(0,"rgba(239,219,143,"+alpha+")");gr.addColorStop(.55,"rgba(143,190,125,"+(alpha*.55)+")");gr.addColorStop(1,"rgba(77,112,72,0)");
 x.fillStyle=gr;x.beginPath();x.arc(cx,cy,245,0,Math.PI*2);x.fill();
}

function draw(){
 drawBackdrop();drawLeaves();drawWorld();drawJack();drawMemoryLight();drawMotherTreeFragments();
}

function bindHold(id,key){const b=document.getElementById(id);["pointerdown","pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>input[key]=ev==="pointerdown"))}
bindHold("leftBtn","left");bindHold("rightBtn","right");bindHold("downBtn","down");
document.getElementById("jumpBtn")?.addEventListener("pointerdown",()=>{lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;input.jump=true});
document.getElementById("lightBtn")?.addEventListener("pointerdown",useMemoryLight);
document.getElementById("interactBtn")?.addEventListener("pointerdown",tryInteract);
addEventListener("keydown",e=>{if(dialogue.active)return;lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;waitSitFrame=0;if(["ArrowLeft","a","A"].includes(e.key))input.left=true;if(["ArrowRight","d","D"].includes(e.key))input.right=true;if(["ArrowDown","s","S"].includes(e.key))input.down=true;if(e.key==="Shift")input.run=true;if(e.code==="Space"){input.jump=true;e.preventDefault()}if(["f","F"].includes(e.key))useMemoryLight();if(["e","E"].includes(e.key))tryInteract()});
addEventListener("keyup",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=false;if(["ArrowRight","d","D"].includes(e.key))input.right=false;if(["ArrowDown","s","S"].includes(e.key))input.down=false;if(e.key==="Shift")input.run=false});

const startGameBtn=document.getElementById("startGame");
if(loadedSave&&journeyMode&&!replayMode){
 startGameBtn.textContent="✦ CONTINUAR JORNADA";
 const introCopy=ui.intro.querySelector("span");if(introCopy)introCopy.textContent="A lanterna guardou seu caminho pelo Bosque das Memórias.";
}
startGameBtn.onclick=()=>{
 if(journeyMode&&!replayMode)journey?.advanceTo(3);
 fadeMusicTo(bossActive&&!bossComplete?"archivist":(motherTreeScene||bossComplete?"motherTree":"forest"),.56,700);
 ui.intro.hidden=true;running=true;last=performance.now();requestAnimationFrame(loop);
 setTimeout(()=>{
   if(finalePlayed){grantMaraWoodKey(false);if(phase3CompleteRoot)phase3CompleteRoot.hidden=false;return}
   if(bossComplete){resumeFinaleAfterReload();return}
   if(!introLorePlayed){introLorePlayed=true;dialogue.open(opening,()=>{say("A lanterna iluminou algo que não existe mais. Pressione F para revelar memórias do caminho.");save()})}
 },420);
};
phase3ReplayBtn?.addEventListener("click",()=>{
 try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CHECKPOINT_KEY)}catch(_){}
 location.href="phase3.html?replay=1&new=1";
});
phase3MenuBtn?.addEventListener("click",()=>{location.href="../index.html#fases"});
phase3NextBtn?.addEventListener("click",()=>{
 if(journeyMode&&!replayMode)journey?.advanceTo(4);
 location.href="phase4.html"+(journeyMode&&!replayMode?"?journey=1":"?from=phase3");
});
function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
addEventListener("pagehide",()=>{save();stopPhase3Music()});document.addEventListener("visibilitychange",()=>{if(document.hidden){save();Object.values(phase3Music).forEach(a=>a.pause())}else if(running&&activeMusic){activeMusic.play().catch(()=>{})}});
syncHud();draw();
})();