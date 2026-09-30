(()=>{"use strict";
const c=document.getElementById("game"),x=c.getContext("2d"),W=1280,H=720,WORLD=5600,G=1500;
const ui={obj:document.querySelector("#objective strong"),health:document.getElementById("healthValue"),banner:document.getElementById("sectionBanner"),msg:document.getElementById("message"),intro:document.getElementById("intro")};
const dialogueRoot=document.getElementById("dialogue"),dialogue=new window.DialogueSystem(dialogueRoot);
const journey=window.JackJourney||null,urlParams=new URLSearchParams(location.search),journeyMode=urlParams.get("journey")==="1",replayMode=urlParams.get("replay")==="1",forceNewRun=urlParams.get("new")==="1";
const SAVE_KEY="jack-phase3-save",CHECKPOINT_KEY="jack-phase3-checkpoint";
if(replayMode)journey?.beginReplay(3,[SAVE_KEY,CHECKPOINT_KEY]);
if(forceNewRun){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CHECKPOINT_KEY)}
let loadedSave=null;if(journeyMode&&!replayMode){try{loadedSave=JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch(_){loadedSave=null}}

const input={left:false,right:false,down:false,run:false,jump:false};
let running=false,last=performance.now(),cam=0,jack=null,jackFrameOverrides={},introLorePlayed=!!loadedSave?.introLorePlayed,section=-1;
let idleTime=0,idleSpecialFrame=0,idleSpecialClock=0,idleSpecialMode="",idleSpecialImages={lantern:[],sit:[],soul:[],long:[]};
let lastPlayerAction=performance.now();
let memoryLight=0,memoryPulse=0,playerLife=Math.max(1,Math.min(3,Number(loadedSave?.playerLife)||3));
let activeCheckpoint=loadedSave?.activeCheckpoint||localStorage.getItem(CHECKPOINT_KEY)||"";
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
 {x:2550,n:"BOSQUE DAS MEMÓRIAS"},
 {x:4200,n:"TRILHA QUE SE LEMBRA"}
];

const plats=[
 {x:0,y:590,w:1080,h:130},
 {x:1480,y:590,w:900,h:130},
 {x:2700,y:590,w:980,h:130},
 {x:4100,y:590,w:1500,h:130},
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
 {id:"threshold",x:2100,groundY:590,respawnX:2040,respawnY:504,name:"Árvore da Primeira Lembrança"}
];

const leaves=Array.from({length:92},(_,i)=>({
 sx:Math.random()*W,sy:Math.random()*H,
 speed:26+Math.random()*62,drift:(Math.random()-.5)*34,
 size:3+Math.random()*6,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*1.7,
 phase:Math.random()*Math.PI*2,depth:.45+Math.random()*.75
}));

function say(t){ui.msg.textContent=t;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),2700)}
function banner(t){ui.banner.textContent=t;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),2100)}
function syncHud(){ui.health.textContent="♥ ".repeat(playerLife).trim()||"♡"}

function save(){
 if(!journeyMode||replayMode||!journey?.isActive()||journey.currentPhase()!==3)return;
 localStorage.setItem(SAVE_KEY,JSON.stringify({x:p.x,y:p.y,dir:p.dir,playerLife,activeCheckpoint,introLorePlayed,savedAt:Date.now()}));
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
const loadIdleSet=(folder,prefix,count)=>Promise.allSettled(Array.from({length:count},(_,i)=>img("../assets/sprites/jack/idle-special/"+folder+"/"+prefix+String(i+1).padStart(2,"0")+".png"))).then(rs=>rs.filter(r=>r.status==="fulfilled").map(r=>r.value));
Promise.all([
 loadIdleSet("lantern","jack-idle-lantern-",1),
 loadIdleSet("sit","jack-idle-sit-",1),
 loadIdleSet("soul","jack-idle-soul-",1),
 loadIdleSet("long-idle","jack-idle-long-idle-",7)
]).then(([lantern,sit,soul,long])=>{idleSpecialImages={lantern,sit,soul,long}}).catch(()=>{});

// Reaproveita os seis retratos HD oficiais do Jack usados nos Halloweens anteriores.
// A Fase 3 começa consistente visualmente e já fica pronta para receber Mara depois.
const jackPortraitFiles=[
 "jack-00-neutral.png",
 "jack-01-serious.png",
 "jack-02-smirk.png",
 "jack-03-surprised.png",
 "jack-04-determined.png",
 "jack-05-resolved.png"
];
const jackDialogueReady=Promise.allSettled(
 jackPortraitFiles.map(file=>img("../assets/game/phase1/portraits-hd/"+file))
).then(results=>{
 dialogue.setAssets({
   jack:{frames:results.map(r=>r.status==="fulfilled"?r.value:null)}
 });
 return results;
});

const phase3DialogueFrameReady=img("../assets/game/phase3/ui/phase3-dialogue-frame.png").catch(()=>null);
window.__PHASE_ASSETS_READY=Promise.allSettled([jackStartupReady,jackDialogueReady,phase3DialogueFrameReady]).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));

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
// Special-idle strips: crop only the artwork band (never the caption/text below).
// Scale is tuned per action because the generated figures occupy different amounts of each cell.
const IDLE_STRIPS={
 lantern:{image:0,frames:8,x:9,y:190,w:238,h:62,scale:2.18,lift:0},
 sit:{image:0,frames:8,x:9,y:204,w:238,h:45,scale:2.28,lift:0},
 soul:{image:0,frames:8,x:9,y:195,w:238,h:54,scale:2.22,lift:0},
 long:{image:4,frames:7,x:9,y:188,w:238,h:60,scale:2.20,lift:0}
};
function idleStripRect(mode,frame){
 const s=IDLE_STRIPS[mode];if(!s)return null;
 const fw=s.w/s.frames,i=frame%s.frames;
 return {imgIndex:s.image,sx:s.x+i*fw,sy:s.y,sw:fw,sh:s.h,scale:s.scale||2.2,lift:s.lift||0};
}
function drawJack(){
 if(idleSpecialMode&&!dialogue.active){
   const seq=idleSpecialImages[idleSpecialMode]||[],r=idleStripRect(idleSpecialMode,idleSpecialFrame);
   const im=r&&seq[r.imgIndex];
   if(im){
     // Draw the cropped cell at a calibrated pixel-art scale. The feet are anchored
     // to the exact gameplay collision floor (p.y+p.h), so Jack stays on platforms.
     const targetW=r.sw*r.scale,targetH=r.sh*r.scale;
     const dx=p.x-cam+p.w/2-targetW/2,feetY=p.y+p.h-r.lift,dy=feetY-targetH;
     x.save();x.imageSmoothingEnabled=false;
     if(p.dir<0){x.translate(dx+targetW,0);x.scale(-1,1);x.drawImage(im,r.sx,r.sy,r.sw,r.sh,0,dy,targetW,targetH)}
     else x.drawImage(im,r.sx,r.sy,r.sw,r.sh,dx,dy,targetW,targetH);
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

function useMemoryLight(){
 lastPlayerAction=performance.now();idleTime=0;idleSpecialMode="";idleSpecialFrame=0;
 const duration=window.JACK_ANIMATIONS?.timing?.attackDuration||.48;
 p.attack=duration;
 memoryLight=3.25;memoryPulse=.65;
 say("A lanterna recorda um caminho que já não existe.");
}

function update(dt){
 if(dialogue.active){lastPlayerAction=performance.now();idleTime=0;idleSpecialMode="";p.vx*=.72;p.anim+=dt;return}
 const idleNow=!input.left&&!input.right&&!input.down&&!input.jump&&!input.run&&p.attack<=0;
 if(idleNow){
   idleTime=(performance.now()-lastPlayerAction)/1000;
   const nextMode=idleTime>=60?"long":idleTime>=40?"soul":idleTime>=25?"sit":idleTime>=8?"lantern":"";
   if(nextMode!==idleSpecialMode){idleSpecialMode=nextMode;idleSpecialFrame=0;idleSpecialClock=0}
   const seq=idleSpecialImages[idleSpecialMode]||[];
   const strip=IDLE_STRIPS[idleSpecialMode],frameCount=seq.length&&strip?strip.frames:seq.length;
   if(idleSpecialMode&&frameCount){idleSpecialClock+=dt;if(idleSpecialClock>=.32){idleSpecialClock=0;idleSpecialFrame=(idleSpecialFrame+1)%frameCount}}
 }else{lastPlayerAction=performance.now();idleTime=0;idleSpecialClock=0;idleSpecialFrame=0;idleSpecialMode=""}
 memoryLight=Math.max(0,memoryLight-dt);memoryPulse=Math.max(0,memoryPulse-dt);p.attack=Math.max(0,p.attack-dt);
 p.coyote=p.on?.12:Math.max(0,p.coyote-dt);
 if(input.jump){p.buffer=.14;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
 const speed=input.down?90:(input.run?325:228),dir=(input.right?1:0)-(input.left?1:0);
 p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
 if(p.buffer>0&&p.coyote>0&&!input.down){p.vy=-575;p.on=false;p.coyote=0;p.buffer=0}
 p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.on=false;
 const solids=plats.concat(memoryLight>0?memoryPlats:[]);
 for(const q of solids){
   if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}
 }
 if(p.y>780){playerLife--;syncHud();if(playerLife<=0)respawn("As raízes devolveram Jack ao último ponto de luz.");else{const cp=checkpoints.find(z=>z.id===activeCheckpoint);p.x=cp?cp.respawnX:120;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;say("O Bosque engoliu um passo — "+playerLife+"/3 luzes.");}}
 updateCheckpoint();
 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.35))-cam)*Math.min(1,dt*5);
 let si=0;for(let i=0;i<sections.length;i++)if(p.x>=sections[i].x)si=i;if(si!==section){section=si;banner(sections[si].n)}
 if(p.x>980&&p.x<1480)ui.obj.textContent="Use a Luz para caminhar sobre uma lembrança do caminho.";
 else if(p.x>=1480&&p.x<2550)ui.obj.textContent="Siga as folhas. Elas estão voltando para algum lugar.";
 else if(p.x>=2550)ui.obj.textContent="Entre mais fundo no Bosque das Memórias.";
 else ui.obj.textContent="Siga as folhas que caem para o céu.";
 p.anim+=dt;saveClock+=dt;if(saveClock>2.5){saveClock=0;save()}
}
let saveClock=0;

function drawBackdrop(){
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#071318");g.addColorStop(.5,"#16251d");g.addColorStop(1,"#2c251a");x.fillStyle=g;x.fillRect(0,0,W,H);
 x.save();
 // lua pálida
 x.globalAlpha=.7;x.fillStyle="#e9ddb3";x.beginPath();x.arc(1010,135,68,0,Math.PI*2);x.fill();x.globalAlpha=1;
 // floresta distante
 for(let layer=0;layer<3;layer++){
   const speed=[.08,.17,.28][layer],base=505-layer*34;
   x.fillStyle=["#102017","#14281b","#19301f"][layer];
   const offset=-(cam*speed)%180;
   for(let i=-2;i<10;i++){
     const px=offset+i*180+(layer*43),h=185+((i*37+layer*41)%95);
     x.fillRect(px+75,base-h,16+layer*4,h);
     x.beginPath();x.moveTo(px,base-h+42);x.lineTo(px+85,base-h-54);x.lineTo(px+165,base-h+42);x.fill();
     x.beginPath();x.moveTo(px+10,base-h+95);x.lineTo(px+85,base-h+8);x.lineTo(px+160,base-h+95);x.fill();
   }
 }
 // névoa baixa
 const fog=x.createLinearGradient(0,430,0,H);fog.addColorStop(0,"rgba(194,209,170,0)");fog.addColorStop(1,"rgba(164,190,146,.13)");x.fillStyle=fog;x.fillRect(0,420,W,300);
 x.restore();
}

function drawLeaves(){
 for(const l of leaves){
   l.sy-=l.speed*.016;l.sx+=Math.sin(p.anim*.55+l.phase)*.24+l.drift*.016;l.rot+=l.spin*.016;
   if(l.sy<-25){l.sy=H+20+Math.random()*110;l.sx=Math.random()*W}
   if(l.sx<-30)l.sx=W+20;if(l.sx>W+30)l.sx=-20;
   x.save();x.translate(l.sx,l.sy);x.rotate(l.rot);x.globalAlpha=.35+.45*l.depth;
   x.fillStyle=l.depth>.9?"#d49a4b":(l.depth>.65?"#9b743b":"#70835b");
   x.beginPath();x.ellipse(0,0,l.size*1.55,l.size*.72,.18,0,Math.PI*2);x.fill();
   x.strokeStyle="#4f4b2c";x.lineWidth=.8;x.beginPath();x.moveTo(-l.size*.9,0);x.lineTo(l.size*.9,0);x.stroke();x.restore();
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
document.getElementById("jumpBtn")?.addEventListener("pointerdown",()=>{lastPlayerAction=performance.now();idleTime=0;idleSpecialMode="";input.jump=true});
document.getElementById("lightBtn")?.addEventListener("pointerdown",useMemoryLight);
addEventListener("keydown",e=>{if(dialogue.active)return;lastPlayerAction=performance.now();idleTime=0;idleSpecialMode="";idleSpecialFrame=0;if(["ArrowLeft","a","A"].includes(e.key))input.left=true;if(["ArrowRight","d","D"].includes(e.key))input.right=true;if(["ArrowDown","s","S"].includes(e.key))input.down=true;if(e.key==="Shift")input.run=true;if(e.code==="Space"){input.jump=true;e.preventDefault()}if(["f","F"].includes(e.key))useMemoryLight()});
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