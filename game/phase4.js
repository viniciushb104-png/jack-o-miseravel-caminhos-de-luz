(()=>{"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),W=1280,H=720,WORLD=8200,G=1500;
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
let introPlayed=!!saveData?.introPlayed,doorOpened=!!saveData?.doorOpened,pilgrimMet=!!saveData?.pilgrimMet,tracesSolved=!!saveData?.tracesSolved,prototypeEndPlayed=!!saveData?.prototypeEndPlayed;
let traces=Array.isArray(saveData?.traces)?saveData.traces.slice(0,3).map(Boolean):[false,false,false];

const p={x:Number.isFinite(saveData?.x)?saveData.x:110,y:Number.isFinite(saveData?.y)?saveData.y:470,w:46,h:86,vx:0,vy:0,dir:saveData?.dir===-1?-1:1,on:false,coyote:0,buffer:0,anim:0,attack:0,inv:0};

const platforms=[
 {x:0,y:590,w:980,h:130},
 {x:1080,y:590,w:950,h:130},
 {x:2140,y:590,w:980,h:130},
 {x:3240,y:590,w:1420,h:130},
 {x:4760,y:590,w:1200,h:130},
 {x:6070,y:590,w:980,h:130},
 {x:7160,y:590,w:1040,h:130},
 {x:520,y:500,w:220,h:26},
 {x:1300,y:485,w:210,h:26},
 {x:1730,y:430,w:190,h:26},
 {x:2800,y:475,w:230,h:26},
 {x:3730,y:485,w:210,h:26},
 {x:4470,y:440,w:180,h:26},
 {x:5150,y:470,w:220,h:26},
 {x:6500,y:465,w:240,h:26}
];

const checkpoints=[
 {id:"road",x:1870,groundY:590,respawnX:1800,respawnY:504,name:"Marco sem inscrição"},
 {id:"village",x:2910,groundY:590,respawnX:2840,respawnY:504,name:"Marco do Povoado"},
 {id:"traces",x:4580,groundY:590,respawnX:4510,respawnY:504,name:"Marco das Pegadas"}
];

const enemies=[
 {id:"eraser-1",kind:"eraser",x:1510,y:522,w:58,h:58,hp:2,maxHp:2,dir:-1,vx:0,alive:!saveData?.deadEnemies?.includes("eraser-1"),cool:0},
 {id:"eraser-2",kind:"eraser",x:4990,y:522,w:58,h:58,hp:2,maxHp:2,dir:1,vx:0,alive:!saveData?.deadEnemies?.includes("eraser-2"),cool:0},
 {id:"eraser-3",kind:"eraser",x:5450,y:522,w:58,h:58,hp:3,maxHp:3,dir:-1,vx:0,alive:!saveData?.deadEnemies?.includes("eraser-3"),cool:0}
];

function say(t){ui.msg.textContent=t;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),2600)}
function banner(t){ui.banner.textContent=t;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),1900)}
function syncHud(){ui.health.textContent="♥ ".repeat(playerLife).trim()||"♡"}
function deadEnemies(){return enemies.filter(e=>!e.alive).map(e=>e.id)}
function markPlayerAction(){
 lastPlayerAction=performance.now();
 idleTime=0;waitSitClock=0;waitSitFrame=0;waitSitActive=false;
}
function save(){
 if(!journeyMode||replayMode||!journey?.isActive()||journey.currentPhase()!==4)return;
 localStorage.setItem(SAVE_KEY,JSON.stringify({
   x:p.x,y:p.y,dir:p.dir,playerLife,activeCheckpoint,introPlayed,doorOpened,pilgrimMet,traces:[...traces],tracesSolved,prototypeEndPlayed,deadEnemies:deadEnemies(),savedAt:Date.now()
 }));
}
function respawn(msg){
 const cp=checkpoints.find(q=>q.id===activeCheckpoint);
 p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;p.on=false;p.inv=1.2;playerLife=3;syncHud();if(msg)say(msg);save();
}
function hurtPlayer(sourceX){
 if(p.inv>0)return;
 markPlayerAction();
 playerLife--;syncHud();p.inv=1.15;p.vy=-310;p.vx=(p.x<sourceX?-1:1)*260;
 if(playerLife<=0)respawn("A estrada apagou seus passos — mas a lanterna lembrou o caminho.");
 else say("A cinza mordeu a luz. "+playerLife+"/3.");
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
   ctx.fillStyle=q.h>100?"#30291f":"#4a4435";ctx.fillRect(q.x,q.y,q.w,q.h);
   ctx.fillStyle=q.h>100?"#847052":"#9b865d";ctx.fillRect(q.x,q.y,q.w,5);
   if(q.h>100){ctx.strokeStyle="rgba(30,24,18,.7)";ctx.lineWidth=3;for(let xx=q.x+45;xx<q.x+q.w;xx+=95){ctx.beginPath();ctx.moveTo(xx,q.y+8);ctx.lineTo(xx-18,q.y+42);ctx.stroke()}}
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
 const px=2580-cam;
 ctx.save();ctx.translate(px,0);
 ctx.globalAlpha=.92;ctx.fillStyle="#3e4440";ctx.beginPath();ctx.ellipse(0,455,34,60,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#181b1a";ctx.beginPath();ctx.arc(0,384,24,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#756a54";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,500);ctx.lineTo(-24,580);ctx.moveTo(18,500);ctx.lineTo(25,580);ctx.stroke();
 ctx.fillStyle="#a89570";ctx.font="italic 12px Georgia";ctx.textAlign="center";ctx.fillText(pilgrimMet?"PEREGRINA":"???",0,350);
 ctx.restore();
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
function drawEnemy(e){
 if(!e.alive)return;
 const ex=e.x-cam,cy=e.y+e.h/2;
 ctx.save();ctx.translate(ex+e.w/2,cy);
 const wob=Math.sin(p.anim*8+e.x)*4;
 ctx.shadowColor="rgba(0,0,0,.8)";ctx.shadowBlur=12;ctx.fillStyle="#111311";
 ctx.beginPath();
 for(let i=0;i<18;i++){const a=i*Math.PI*2/18,r=28+(i%2?8:0)+Math.sin(p.anim*5+i)*3;const px=Math.cos(a)*r,py=Math.sin(a)*r*.8;if(i===0)ctx.moveTo(px,py+wob);else ctx.lineTo(px,py+wob)}ctx.closePath();ctx.fill();
 ctx.strokeStyle="#776f5a";ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-18+i*12,18);ctx.lineTo(-34+i*20,38);ctx.stroke()}
 ctx.fillStyle="#d6b968";ctx.beginPath();ctx.arc(-8,-5,3,0,Math.PI*2);ctx.arc(8,-5,3,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#b9aa89";ctx.font="700 9px Georgia";ctx.textAlign="center";ctx.fillText("RASURADOR",0,-43);
 ctx.restore();
}
function drawWorld(){
 drawRoad();drawSigns();drawDoor();
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
   pilgrimMet=true;p.vx=0;dialogue.open(story.pilgrimMeeting,()=>{banner("POVOADO SEM NOMES");say("A Peregrina não lembra o nome. Procure rastros do que ela fez.");save()});return;
 }
 if(tracesSolved&&!prototypeEndPlayed&&pc>4660){
   prototypeEndPlayed=true;p.vx=0;dialogue.open(story.prototypeEnd,()=>{ui.prototype.hidden=false;save()});return;
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
 for(const e of enemies){if(!e.alive)continue;const d=Math.abs((e.x+e.w/2)-pc);if(d<best){best=d;target=e}}
 if(target&&best<205){
   target.hp--;target.cool=.35;target.vx=(target.x<pc?-1:1)*180;memoryPulse=.9;
   if(target.hp<=0){target.alive=false;banner("RASURADOR DISSIPADO");say("A tinta virou cinza. O rastro permaneceu.");}
   else say("A Luz abriu fissuras na rasura. "+target.hp+"/"+target.maxHp);
   save();return;
 }
 say("A luz encontra marcas... mas nenhuma responde daqui.");
}

function updateEnemies(dt){
 const pc=p.x+p.w/2;
 for(const e of enemies){
   if(!e.alive)continue;e.cool=Math.max(0,e.cool-dt);
   const ec=e.x+e.w/2,d=pc-ec;
   if(Math.abs(d)<420){e.dir=Math.sign(d)||e.dir;e.vx+=((e.dir*82)-e.vx)*Math.min(1,dt*4.5)}
   else e.vx*=Math.max(0,1-dt*3);
   e.x+=e.vx*dt;
   if(Math.abs(d)<54&&Math.abs((p.y+p.h)-(e.y+e.h))<100)hurtPlayer(ec);
 }
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
 p.coyote=p.on?.12:Math.max(0,p.coyote-dt);
 if(input.jump){p.buffer=.13;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
 const speed=input.down?86:(input.run?330:225),dir=(input.right?1:0)-(input.left?1:0);p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
 if(p.buffer>0&&p.coyote>0&&!input.down){p.vy=-575;p.on=false;p.buffer=0;p.coyote=0}
 p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));

 if(!doorOpened&&p.x+p.w>930){p.x=930-p.w;p.vx=Math.min(0,p.vx);if(gateMsg<=0){say("A parede não tem porta. A chave de Mara está reagindo.");gateMsg=2}}
 if(!pilgrimMet&&p.x+p.w>3130){p.x=3130-p.w;p.vx=Math.min(0,p.vx);if(gateMsg<=0){say("A estrada se perde na névoa. Há alguém esperando no povoado.");gateMsg=2}}
 if(pilgrimMet&&!tracesSolved&&p.x+p.w>4660){p.x=4660-p.w;p.vx=Math.min(0,p.vx);if(gateMsg<=0){say("As pegadas terminam aqui. Três rastros ainda precisam ser iluminados.");gateMsg=2}}

 p.y+=p.vy*dt;p.on=false;
 for(const q of platforms){if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}}
 if(p.y>780){playerLife--;syncHud();if(playerLife<=0)respawn("A estrada tentou apagar Jack.");else{const cp=checkpoints.find(q=>q.id===activeCheckpoint);p.x=cp?cp.respawnX:110;p.y=cp?cp.respawnY:470;p.vx=p.vy=0;say("Um passo desapareceu na névoa. "+playerLife+"/3.")}}
 updateCheckpoint();
 if(!pilgrimMet&&doorOpened&&p.x>2400){pilgrimMet=true;p.vx=0;dialogue.open(story.pilgrimMeeting,()=>{banner("POVOADO SEM NOMES");say("Procure rastros da Peregrina com F.");save()})}
 if(tracesSolved&&!prototypeEndPlayed&&p.x>4700){prototypeEndPlayed=true;p.vx=0;dialogue.open(story.prototypeEnd,()=>{ui.prototype.hidden=false;save()})}

 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.34))-cam)*Math.min(1,dt*5);
 let si=0;for(let i=0;i<story.sections.length;i++)if(p.x>=story.sections[i].x)si=i;if(si!==section){section=si;banner(story.sections[si].name)}
 if(!doorOpened)ui.obj.textContent="A chave de Mara reage à parede. Aproxime-se e pressione E.";
 else if(!pilgrimMet)ui.obj.textContent="Atravesse a Estrada sem Placas e encontre quem ainda espera.";
 else if(!tracesSolved)ui.obj.textContent="CAMPO DAS PEGADAS: use F para revelar três rastros da Peregrina.";
 else ui.obj.textContent="Siga a estrada. Alguém está arrancando os nomes deste lugar.";
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