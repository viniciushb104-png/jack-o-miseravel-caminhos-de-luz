(()=>{"use strict";
const c=document.getElementById("game"),x=c.getContext("2d"),W=1280,H=720,WORLD=7600,G=1500;
const ui={obj:document.querySelector("#objective strong"),health:document.getElementById("healthValue"),banner:document.getElementById("sectionBanner"),msg:document.getElementById("message"),intro:document.getElementById("intro")};
const dialogueRoot=document.getElementById("dialogue"),dialogue=new window.DialogueSystem(dialogueRoot);
const journey=window.JackJourney||null,urlParams=new URLSearchParams(location.search),journeyMode=urlParams.get("journey")==="1",replayMode=urlParams.get("replay")==="1",forceNewRun=urlParams.get("new")==="1";
const SAVE_KEY="jack-phase3-save",CHECKPOINT_KEY="jack-phase3-checkpoint";
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
let maraRun={active:false,x:2275,targetX:2275,groundY:590,onDone:null};
let maraMet=!!loadedSave?.maraMet;
let portraitsSolved=!!loadedSave?.portraitsSolved;
let portraitChoices=Array.isArray(loadedSave?.portraitChoices)&&loadedSave.portraitChoices.length===3?loadedSave.portraitChoices.map(v=>Math.max(0,Math.min(2,Number(v)||0))):[0,0,0];
let voicesSolved=!!loadedSave?.voicesSolved;
let voiceStep=Math.max(0,Math.min(3,Number(loadedSave?.voiceStep)||0));
let jackEchoPlayed=!!loadedSave?.jackEchoPlayed;
let motherTreeScene=!!loadedSave?.motherTreeScene;
let archiveSolved=!!loadedSave?.archiveSolved;
let archiveChoice=Math.max(0,Math.min(2,Number(loadedSave?.archiveChoice)||0));
let archiveSeen=Array.isArray(loadedSave?.archiveSeen)?loadedSave.archiveSeen.slice(0,3).map(Boolean):[false,false,false];
let bossPrelude=!!loadedSave?.bossPrelude;
let bossActive=!!loadedSave?.bossActive,bossAct=Math.max(0,Math.min(3,Number(loadedSave?.bossAct)||0)),bossStep=Math.max(0,Number(loadedSave?.bossStep)||0),bossComplete=!!loadedSave?.bossComplete,finalePlayed=!!loadedSave?.finalePlayed;
let bossCooldown=0,bossPulse=0;
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
   maraMet,portraitsSolved,portraitChoices:[...portraitChoices],
   voicesSolved,voiceStep,jackEchoPlayed,motherTreeScene,archiveSolved,archiveChoice,archiveSeen:[...archiveSeen],bossPrelude,bossActive,bossAct,bossStep,bossComplete,finalePlayed,savedAt:Date.now()
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

const dialogueAssetsReady=Promise.all([jackPortraitReady,maraDialogueReady]).then(([jackFrames,maraSheet])=>{
 dialogue.setAssets({
   jack:{frames:jackFrames},
   mara:maraSheet?{sheet:maraSheet}:null
 });
});

const phase3DialogueFrameReady=img("../assets/game/phase3/ui/phase3-dialogue-frame.png").catch(()=>null);
const memoryLeavesReady=Promise.all(
 Array.from({length:6},(_,i)=>img("../assets/game/phase3/fx/memory-leaves/memory-leaf-"+String(i+1).padStart(2,"0")+".png"))
).then(images=>{memoryLeafImages.splice(0,memoryLeafImages.length,...images);return images}).catch(()=>[]);
window.__PHASE_ASSETS_READY=Promise.allSettled([
 jackStartupReady,dialogueAssetsReady,maraSpriteReady,maraRunReady,forestBackgroundReady,motherTreeBackgroundReady,phase3DialogueFrameReady,memoryLeavesReady
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
 if(!portraitsSolved)return {x:2275,groundY:590,frame:maraMet?3:0};
 if(!voicesSolved)return {x:4020,groundY:590,frame:4};
 return {x:5575,groundY:590,frame:5};
}
function startMaraRun(fromX,toX,onDone){
 // A corrida narrativa precisa começar dentro da área que o jogador está vendo.
 // Caso Mara estivesse estacionada num ponto antigo do mapa, trazemos o início
 // para logo à frente de Jack em vez de animá-la fora da câmera.
 const visibleStart=Math.min(toX-150,Math.max(fromX,p.x+p.w+82));
 maraRun.active=true;maraRun.x=visibleStart;maraRun.targetX=toX;maraRun.groundY=590;
 maraRun.onDone=typeof onDone==="function"?onDone:null;
}
function updateMaraRun(dt){
 if(!maraRun.active)return;
 const dir=Math.sign(maraRun.targetX-maraRun.x)||1;
 maraRun.x+=dir*285*dt;
 if((dir>0&&maraRun.x>=maraRun.targetX)||(dir<0&&maraRun.x<=maraRun.targetX)){
   maraRun.x=maraRun.targetX;maraRun.active=false;
   const done=maraRun.onDone;maraRun.onDone=null;if(done)done();
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

function drawPortraitPuzzleWorld(){
 if(!maraMet)return;
 const names=story.portraitPuzzle.names;
 story.portraitPuzzle.entries.forEach((q,i)=>{
   const selected=names[portraitChoices[i]],ok=selected===q.correct,lit=memoryLight>0;
   x.save();x.translate(q.x,0);
   if(lit){
     const glow=x.createRadialGradient(0,410,10,0,410,120);
     glow.addColorStop(0,"rgba(234,211,121,.28)");glow.addColorStop(1,"rgba(104,148,89,0)");
     x.fillStyle=glow;x.beginPath();x.arc(0,410,120,0,Math.PI*2);x.fill();
   }
   x.strokeStyle=ok?"#c9c87a":"#8b6b3b";x.lineWidth=7;
   x.beginPath();x.moveTo(-58,535);x.quadraticCurveTo(-82,445,-48,360);x.quadraticCurveTo(0,325,48,360);x.quadraticCurveTo(82,445,58,535);x.stroke();
   x.fillStyle="#111912";x.fillRect(-48,365,96,122);
   x.strokeStyle=lit?"#e8c76e":"#6f6042";x.lineWidth=4;x.strokeRect(-48,365,96,122);
   x.globalAlpha=lit?1:.22;x.fillStyle=ok?"#c9d78a":"#d0b873";
   x.beginPath();x.arc(0,418,25,0,Math.PI*2);x.fill();x.fillRect(-18,445,36,26);x.globalAlpha=1;
   x.fillStyle=ok?"#263d25":"#241b14";x.fillRect(-78,500,156,34);
   x.strokeStyle=ok?"#a7c274":"#876a3f";x.lineWidth=2;x.strokeRect(-78,500,156,34);
   x.fillStyle="#f5dfaa";x.font="700 12px Georgia";x.textAlign="center";x.textBaseline="middle";x.fillText(selected,0,517);
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
   if(i===2){x.beginPath();x.arc(-8,451,13,0,Math.PI*2);x.stroke();x.fillRect(4,447,34,8);x.fillRect(28,447,7,18)}
   x.shadowBlur=0;x.fillStyle="#efe0ad";x.font="700 11px Georgia";x.textAlign="center";x.fillText(["CARTA","MELODIA","CHAVE"][i],0,515);
   x.restore();
 });
 x.save();x.fillStyle="rgba(10,14,11,.78)";x.fillRect(5460,330,500,58);x.strokeStyle="#8f784b";x.strokeRect(5460,330,500,58);
 x.fillStyle="#ead9a3";x.font="italic 17px Georgia";x.textAlign="center";x.fillText(story.archivePuzzle.prompt,5710,365);x.restore();
}
function drawRootGate(xPos,open){
 if(open)return;
 x.save();x.translate(xPos,0);x.strokeStyle="#513923";x.lineCap="round";
 for(let i=-3;i<=3;i++){
   x.lineWidth=12-Math.abs(i);
   x.beginPath();x.moveTo(i*10,590);x.quadraticCurveTo(i*22-18,470,i*8,340);x.quadraticCurveTo(i*20+15,280,i*15,220);x.stroke();
 }
 x.fillStyle="#9d6f31";for(let j=0;j<5;j++){x.beginPath();x.arc((j-2)*18,315-j*17,4,0,Math.PI*2);x.fill()}
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
 const all=story.portraitPuzzle.entries.every((q,i)=>names[portraitChoices[i]]===q.correct);
 if(!all)return;
 portraitsSolved=true;voiceStep=0;
 banner("MEMÓRIA RECONSTRUÍDA — OS RETRATOS");
 p.vx=0;save();
 dialogue.open(story.dialogues.portraitsSolved,()=>{
   say("Mara correu em direção ao Lago das Vozes.");
   startMaraRun(2275,4020,()=>{banner("MARA CHEGOU AO LAGO DAS VOZES");save()});
   save();
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
     say("Mara correu para o Arquivo das Raízes.");
     startMaraRun(4020,5575,()=>{banner("MARA CHEGOU AO ARQUIVO DAS RAÍZES");save()});
     save();
   }),360);
 });
}


function startBoss(){
 if(bossActive||bossComplete)return;
 bossActive=true;bossAct=1;bossStep=0;bossPulse=1.4;p.vx=0;
 banner(story.boss.name+" — "+story.boss.acts[0].title);
 dialogue.open(story.dialogues.bossAwakening,()=>{say("ATO I: ilumine o Arquivista três vezes. Cada luz liberta um rosto em vez de feri-lo.");save()});
 save();
}
function advanceBossWithLight(){
 if(!bossActive||bossComplete||bossCooldown>0)return false;
 bossCooldown=.65;bossPulse=1;
 if(bossAct===1){
   bossStep++;
   say(["Lívia foi lembrada pelo pão que repartiu.","Tomás foi lembrado pelo que restaurou.","Celina foi lembrada pela música que deixou."][Math.min(2,bossStep-1)]);
   if(bossStep>=3){bossAct=2;bossStep=0;p.vx=0;dialogue.open(story.dialogues.bossAct2,()=>{banner(story.boss.acts[1].title);say("Repita a sequência aprendida no Lago: I → II → III.");save()})}
   save();return true;
 }
 if(bossAct===2){
   const expected=[1,2,0][bossStep],zones=[7160,6960,7360],pc=p.x+p.w/2;
   const chosen=zones.map((z,i)=>({i,d:Math.abs(z-pc)})).sort((a,b)=>a.d-b.d)[0];
   if(chosen.d>125){say("Aproxime-se de um dos três ecos antes de usar a Luz.");return true}
   if(chosen.i!==expected){bossStep=0;banner("AS VOZES SE EMBARALHARAM");say("O Arquivista misturou os ecos. Recomece a sequência.");save();return true}
   bossStep++;say("Eco reconhecido — "+bossStep+"/3.");
   if(bossStep>=3){bossAct=3;bossStep=0;p.vx=0;dialogue.open(story.dialogues.bossAct3,()=>{banner(story.boss.acts[2].title);say("Não ataque. Caminhe com Mara até o coração e use E.");save()})}
   save();return true;
 }
 return false;
}
function finishBoss(){
 if(!bossActive||bossAct!==3||bossComplete)return;
 bossActive=false;bossComplete=true;bossPulse=2;p.vx=0;
 dialogue.open(story.dialogues.bossLight,()=>dialogue.open(story.finale.maraRelease,()=>{
   banner("AS FOLHAS VOLTARAM A CAIR");
   dialogue.open(story.finale.jackRevelation,()=>dialogue.open(story.finale.epilogue,()=>{
     finalePlayed=true;banner("MEMÓRIA RECUPERADA — MARA ROWAN");
     say("Jack segue adiante. A pergunta sobre seu próprio caminho permanece.");
     save();
   }));
 }));
 save();
}
function drawMotherTreeAndBoss(){
 if(!motherTreeScene&&p.x<6000)return;
 x.save();
 // protótipo da Árvore-Mãe: será substituído pela arte final sem mudar a lógica.
 x.translate(7040,0);
 x.strokeStyle="#44301f";x.lineCap="round";
 for(let i=-5;i<=5;i++){x.lineWidth=22-Math.abs(i)*1.5;x.beginPath();x.moveTo(i*24,590);x.quadraticCurveTo(i*42,390,i*26,165);x.stroke()}
 x.fillStyle="#70502b";x.beginPath();x.arc(0,205,135,0,Math.PI*2);x.fill();
 if(bossActive&&!bossComplete){
   const pulse=1+Math.sin(p.anim*4)*.04;
   x.save();x.scale(pulse,pulse);
   x.shadowColor="rgba(231,196,102,.5)";x.shadowBlur=22+bossPulse*18;
   x.fillStyle="#211c17";x.beginPath();x.ellipse(0,395,88,145,0,0,Math.PI*2);x.fill();
   x.strokeStyle="#80643b";x.lineWidth=13;
   for(let i=-3;i<=3;i++){x.beginPath();x.moveTo(i*18,500);x.quadraticCurveTo(i*45,390,i*26,285);x.stroke()}
   x.fillStyle="#e1c36d";x.beginPath();x.arc(0,390,20+bossPulse*5,0,Math.PI*2);x.fill();x.restore();
   x.fillStyle="#f1dda0";x.font="700 15px Georgia";x.textAlign="center";
   x.fillText("PROTÓTIPO — "+story.boss.name,0,110);
   x.fillText(story.boss.acts[Math.max(0,bossAct-1)].title,0,135);
 }
 x.restore();
 if(bossActive&&bossAct===2){
   [6960,7160,7360].forEach((z,i)=>{x.save();x.translate(z,0);x.strokeStyle="#a4b887";x.lineWidth=4;x.beginPath();x.arc(0,505,34,0,Math.PI*2);x.stroke();x.fillStyle="#ead792";x.font="700 15px Georgia";x.textAlign="center";x.fillText(["II","I","III"][i],0,510);x.restore()});
 }
}
function tryInteract(){
 if(!running||dialogue.active)return;
 lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;
 const pc=p.x+p.w/2,m=maraWorldState();
 if(bossActive&&bossAct===3&&pc>6900){finishBoss();return}
 if(voicesSolved&&!archiveSolved&&pc>5440&&pc<5980){
   const xs=[5525,5705,5885],near=xs.map((z,i)=>({i,d:Math.abs(z-pc)})).sort((a,b)=>a.d-b.d)[0];
   archiveChoice=near.i;archiveSeen[near.i]=true;
   const item=story.archivePuzzle.entries[near.i];
   if(!archiveSeen.every(Boolean)){say(item.title+" — "+item.memory+" ("+archiveSeen.filter(Boolean).length+"/3 lembranças ouvidas)");save();return}
   p.vx=0;archiveSolved=true;banner("MEMÓRIA NÃO APAGADA — LIBERTADA");
   dialogue.open([
     {speaker:"MARA ROWAN",portrait:"mara",expression:3,text:"Qual delas devemos apagar, Jack? A carta? A melodia? A chave?"},
     {speaker:"JACK",portrait:"jack",expression:1,text:"Essa é a pergunta errada."},
     {speaker:"MARA ROWAN",portrait:"mara",expression:3,text:"Como assim?"},
     {speaker:"JACK",portrait:"jack",expression:5,text:"Não precisamos escolher o que deve ser esquecido. Precisamos deixar que siga adiante."},
     {speaker:"MARA ROWAN",portrait:"mara",expression:5,text:"Deixar ir... sem fingir que nunca existiu."},
     {speaker:"JACK",portrait:"jack",expression:2,text:"Finalmente uma porta que abre sem eu precisar arrombá-la."}
   ],()=>{say("As raízes soltaram o caminho para a Árvore-Mãe.");startMaraRun(5575,6380,()=>save());save()});
   save();return;
 }
 if(!maraRun.active&&Math.abs(pc-m.x)<120){
   if(!maraMet){
     maraMet=true;p.vx=0;
     dialogue.open(story.dialogues.maraMeeting,()=>{
       say("Os retratos respondem à Luz. F revela a lembrança; E troca o nome.");
       // Primeira saída de Mara: ela conduz Jack até o começo do Bosque dos Retratos.
       startMaraRun(2275,2700,()=>{banner("BOSQUE DOS RETRATOS");save()});
       save();
     });
     return;
   }
   if(!portraitsSolved){say("Mara: Ilumine cada retrato e devolva a ele o nome que pertence àquela história.");return}
   if(!voicesSolved){say("Mara: As três vozes formavam uma única frase. A Luz ainda consegue separá-las.");return}
   say("Mara: A Árvore-Mãe está adiante. Eu consigo sentir as raízes tentando nos ouvir.");return;
 }
 if(maraMet&&!portraitsSolved){
   const hit=nearestPuzzleEntry(story.portraitPuzzle.entries);
   if(hit){
     portraitChoices[hit.i]=(portraitChoices[hit.i]+1)%story.portraitPuzzle.names.length;
     say(hit.q.title+" — "+story.portraitPuzzle.names[portraitChoices[hit.i]]);
     finishPortraitPuzzle();save();return;
   }
 }
 if(portraitsSolved&&!voicesSolved){
   const hit=nearestPuzzleEntry(story.voicePuzzle.entries,145);
   if(hit){activateVoice(hit.i);return}
 }
 say("Nada aqui respondeu ao toque.");
}

function updateNarrativeTriggers(){
 if(dialogue.active)return;
 if(!maraMet&&p.x>2160){
   maraMet=true;p.vx=0;
   dialogue.open(story.dialogues.maraMeeting,()=>{say("Os retratos respondem à Luz. F revela a lembrança; E troca o nome.");startMaraRun(2275,2700,()=>{banner("BOSQUE DOS RETRATOS");save()});save()});
   return;
 }
 if(voicesSolved&&archiveSolved&&!motherTreeScene&&p.x>6000){
   motherTreeScene=true;p.vx=0;
   dialogue.open(story.dialogues.motherTree,()=>{
     bossPrelude=true;
     banner("ÁRVORE-MÃE — O CORAÇÃO DAS RAÍZES");
     ui.obj.textContent="A presença nas raízes despertou. Entre no Coração das Raízes.";
     save();
     setTimeout(()=>{if(!dialogue.active)startBoss()},300);
   });
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
   if(hit){say("Memória — "+hit.q.clue);return}
 }
 if(portraitsSolved&&!voicesSolved){
   const hit=nearestPuzzleEntry(story.voicePuzzle.entries,175);
   if(hit){say('Eco — “'+hit.q.fragment+'”');return}
 }
 say("A lanterna recorda um caminho que já não existe.");
}

function update(dt){
 if(dialogue.active){lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;p.vx*=.72;p.anim+=dt;return}
 const idleNow=!input.left&&!input.right&&!input.down&&!input.jump&&!input.run&&p.attack<=0;
 if(idleNow){
   idleTime=(performance.now()-lastPlayerAction)/1000;
   if(idleTime>=8&&p.on){
     if(!waitSitActive){waitSitActive=true;waitSitFrame=0;waitSitClock=0}
     waitSitClock+=dt;
     if(waitSitClock>=.38){
       waitSitClock=0;
       if(waitSitFrame<10)waitSitFrame++;
       else waitSitFrame=7;
     }
   }
 }else{lastPlayerAction=performance.now();idleTime=0;waitSitClock=0;waitSitFrame=0;waitSitActive=false}
 memoryLight=Math.max(0,memoryLight-dt);memoryPulse=Math.max(0,memoryPulse-dt);p.attack=Math.max(0,p.attack-dt);gateMessageCooldown=Math.max(0,gateMessageCooldown-dt);bossCooldown=Math.max(0,bossCooldown-dt);bossPulse=Math.max(0,bossPulse-dt);updateMaraRun(dt);
 p.coyote=p.on?.12:Math.max(0,p.coyote-dt);
 if(input.jump){p.buffer=.14;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
 const speed=input.down?90:(input.run?325:228),dir=(input.right?1:0)-(input.left?1:0);
 p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
 if(p.buffer>0&&p.coyote>0&&!input.down){p.vy=-575;p.on=false;p.coyote=0;p.buffer=0}
 p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));
 if(!portraitsSolved&&p.x+p.w>3740){p.x=3740-p.w;p.vx=Math.min(0,p.vx);if(gateMessageCooldown<=0){say("As raízes seguram o caminho. Os três retratos ainda não estão completos.");gateMessageCooldown=2}}
 if(portraitsSolved&&!voicesSolved&&p.x+p.w>5200){p.x=5200-p.w;p.vx=Math.min(0,p.vx);if(gateMessageCooldown<=0){say("O lago não abre passagem enquanto a voz de Mara continuar fragmentada.");gateMessageCooldown=2}}
 if(voicesSolved&&!archiveSolved&&p.x+p.w>6000){p.x=6000-p.w;p.vx=Math.min(0,p.vx);if(gateMessageCooldown<=0){say("As raízes recusam a passagem. O Arquivo ainda guarda algo que precisa ser deixado ir.");gateMessageCooldown=2}}
 if(bossActive&&p.x<6650){p.x=6650;p.vx=Math.max(0,p.vx)}
 if(bossActive&&p.x+p.w>7540){p.x=7540-p.w;p.vx=Math.min(0,p.vx)}
 p.y+=p.vy*dt;p.on=false;
 const solids=plats.concat(memoryLight>0?memoryPlats:[]);
 for(const q of solids){
   if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}
 }
 if(p.y>780){playerLife--;syncHud();if(playerLife<=0)respawn("As raízes devolveram Jack ao último ponto de luz.");else{const cp=checkpoints.find(z=>z.id===activeCheckpoint);p.x=cp?cp.respawnX:120;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;say("O Bosque engoliu um passo — "+playerLife+"/3 luzes.");}}
 updateCheckpoint();updateNarrativeTriggers();
 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.35))-cam)*Math.min(1,dt*5);
 let si=0;for(let i=0;i<sections.length;i++)if(p.x>=sections[i].x)si=i;if(si!==section){section=si;banner(sections[si].n)}
 if(p.x>980&&p.x<1480)ui.obj.textContent="Use a Luz para caminhar sobre uma lembrança do caminho.";
 else if(!maraMet&&p.x>=1480)ui.obj.textContent="Siga as folhas até a mulher que espera junto às raízes.";
 else if(maraMet&&!portraitsSolved&&p.x>=2500)ui.obj.textContent="F revela a lembrança de cada retrato. E troca o nome da placa.";
 else if(portraitsSolved&&!voicesSolved&&p.x>=3900)ui.obj.textContent="Ouça os três ecos com F e monte a frase de Mara usando E.";
 else if(voicesSolved&&!archiveSolved)ui.obj.textContent="Arquivo das Raízes: aproxime-se das lembranças e pressione E. A resposta não é apagar.";
 else if(archiveSolved&&!motherTreeScene)ui.obj.textContent="O caminho foi liberado. Siga Mara até a Árvore-Mãe.";
 else if(bossActive&&bossAct===1)ui.obj.textContent="ATO I — OS ROSTOS: use F três vezes para libertar as memórias presas.";
 else if(bossActive&&bossAct===2)ui.obj.textContent="ATO II — AS VOZES: aproxime-se dos ecos e use F na ordem aprendida no Lago.";
 else if(bossActive&&bossAct===3)ui.obj.textContent="ATO III — OS NOMES: avance até o coração e pressione E. Não destrua.";
 else if(bossComplete&&!finalePlayed)ui.obj.textContent="A Árvore-Mãe está libertando o que guardou.";
 else if(finalePlayed)ui.obj.textContent="O caminho de Mara terminou. O de Jack continua.";
 else if(motherTreeScene)ui.obj.textContent="Entre no Coração das Raízes.";
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
 const dt=.016;
 for(const l of leaves){
   l.sy-=l.speed*dt;
   l.sx+=Math.sin(p.anim*.55+l.phase)*.32+l.drift*dt;
   l.rot+=l.spin*dt;
   if(l.sy<-55){l.sy=H+35+Math.random()*130;l.sx=Math.random()*W;l.imageIndex=Math.floor(Math.random()*6)}
   if(l.sx<-65)l.sx=W+45;if(l.sx>W+65)l.sx=-45;

   const im=memoryLeafImages[l.imageIndex];
   if(!im)continue;
   const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
   const scale=l.depth<.58?.72:(l.depth>.9?1.18:1);
   const h=l.size*2.15*scale,w=h*(iw/ih);
   x.save();
   x.translate(l.sx,l.sy);
   x.rotate(l.rot+Math.sin(p.anim*.8+l.phase)*.16);
   x.globalAlpha=l.depth<.58?.34:(l.depth>.9?.82:.58);
   if(l.depth>.9){x.shadowColor="rgba(232,178,78,.22)";x.shadowBlur=7}
   x.drawImage(im,-w/2,-h/2,w,h);
   x.restore();
 }
}

function drawWorld(){
 x.save();x.translate(-cam,0);
 // chão e plataformas normais
 for(const q of plats){
   x.fillStyle=q.h>100?"#263024":"#394133";x.fillRect(q.x,q.y,q.w,q.h);
   x.fillStyle="#81704a";x.fillRect(q.x,q.y,q.w,6);
   x.fillStyle="#182019";for(let px=q.x+18;px<q.x+q.w;px+=44)x.fillRect(px,q.y+18,16,Math.min(42,q.h-18));
 }
 // plataformas-memória
 for(const q of memoryPlats){
   const visible=memoryLight>0;
   x.save();x.globalAlpha=visible?.78:.07;x.fillStyle=visible?"#b9d6a6":"#536252";x.shadowColor=visible?"#d7e8b4":"transparent";x.shadowBlur=visible?18:0;
   x.fillRect(q.x,q.y,q.w,q.h);x.fillStyle=visible?"#f0d995":"#596456";x.fillRect(q.x,q.y,q.w,4);x.restore();
 }
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
 drawRootGate(3740,portraitsSolved);
 drawRootGate(5200,voicesSolved);
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
 drawBackdrop();drawLeaves();drawWorld();drawJack();drawMemoryLight();
}

function bindHold(id,key){const b=document.getElementById(id);["pointerdown","pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>input[key]=ev==="pointerdown"))}
bindHold("leftBtn","left");bindHold("rightBtn","right");bindHold("downBtn","down");
document.getElementById("jumpBtn")?.addEventListener("pointerdown",()=>{lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;input.jump=true});
document.getElementById("lightBtn")?.addEventListener("pointerdown",useMemoryLight);
document.getElementById("interactBtn")?.addEventListener("pointerdown",tryInteract);
addEventListener("keydown",e=>{if(dialogue.active)return;lastPlayerAction=performance.now();idleTime=0;waitSitActive=false;waitSitFrame=0;if(["ArrowLeft","a","A"].includes(e.key))input.left=true;if(["ArrowRight","d","D"].includes(e.key))input.right=true;if(["ArrowDown","s","S"].includes(e.key))input.down=true;if(e.key==="Shift")input.run=true;if(e.code==="Space"){input.jump=true;e.preventDefault()}if(["f","F"].includes(e.key))useMemoryLight();if(["e","E"].includes(e.key))tryInteract()});
addEventListener("keyup",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=false;if(["ArrowRight","d","D"].includes(e.key))input.right=false;if(["ArrowDown","s","S"].includes(e.key))input.down=false;if(e.key==="Shift")input.run=false});

document.getElementById("startGame").onclick=()=>{
 if(journeyMode&&!replayMode)journey?.advanceTo(3);
 ui.intro.hidden=true;running=true;last=performance.now();requestAnimationFrame(loop);
 setTimeout(()=>{if(!introLorePlayed){introLorePlayed=true;dialogue.open(opening,()=>{say("A lanterna iluminou algo que não existe mais. Pressione F para revelar memórias do caminho.");save()})}},420);
};
function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
addEventListener("pagehide",save);document.addEventListener("visibilitychange",()=>{if(document.hidden)save()});
syncHud();draw();
})();