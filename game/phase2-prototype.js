(()=>{"use strict";
const c=document.getElementById("game"),x=c.getContext("2d"),W=1280,H=720,WORLD=9200,G=1500;
const ui={obj:document.querySelector("#objective strong"),gear:document.getElementById("gearValue"),banner:document.getElementById("sectionBanner"),msg:document.getElementById("message"),intro:document.getElementById("intro")};
const input={left:false,right:false,run:false,jump:false,down:false};let running=false,last=performance.now(),cam=0,camY=0,jack=null,light=0,cool=0,section=-1;
const dialogue=new window.DialogueSystem(document.getElementById("dialogue"));
const interactPrompt=document.getElementById("interactPrompt");
const urlParams=new URLSearchParams(location.search),journey=window.JackJourney||null,journeyMode=urlParams.get("journey")==="1",replayMode=urlParams.get("replay")==="1",forceNewRun=urlParams.get("new")==="1",SAVE_KEY="jack-phase2-save";
if(replayMode)journey?.beginReplay(2,[SAVE_KEY]);
if(forceNewRun){localStorage.removeItem(SAVE_KEY);const keptMode=journeyMode?"?journey=1":(replayMode?"?replay=1":"");history.replaceState(null,"",location.pathname+keptMode)}
let loadedSave=null;if(journeyMode&&!replayMode){try{loadedSave=JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch(e){loadedSave=null}}
let ameliaMet=false, introLorePlayed=false, gearLore=[false,false,false], finalLorePlayed=false,bossUnlocked=false,bossActive=false;const puzzles={sinos:false,janelas:false,sombras:false};let towerMechanism=false;
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
]};
function openDialogue(lines,onComplete){input.left=input.right=input.down=false;p.vx=0;dialogue.open(lines,onComplete)}
function nearAmelia(){return p.x>2460&&p.x<2760&&p.y>390}
function solvedCount(){return Object.values(puzzles).filter(Boolean).length}
function allRequired(){return gears.every(g=>g.got)&&Object.values(puzzles).every(Boolean)&&towerMechanism}
function interact(){if(dialogue.active){dialogue.advance();return}if(nearAmelia()){ameliaMet=true;openDialogue(lore.amelia);return}
if(p.x>7680&&p.x<8060&&p.y<-350){if(!allRequired()){say("SELO DO TOPO: "+solvedCount()+"/3 enigmas · "+gears.filter(g=>g.got).length+"/3 engrenagens · mecanismo "+(towerMechanism?"ativo":"pendente"));return}
if(!finalLorePlayed){finalLorePlayed=true;openDialogue(lore.tower,()=>{bossUnlocked=true;bossActive=true;say("O ÚLTIMO MINUTO DESPERTOU");});}}}
const p={x:120,y:470,w:46,h:86,vx:0,vy:0,dir:1,on:false,coyote:0,buffer:0,anim:0,attack:0};
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
const enemies=[{x:780,y:548,a:620,b:970,d:1},{x:2320,y:548,a:2070,b:2850,d:1},{x:4680,y:548,a:4480,b:5300,d:1},{x:6100,y:548,a:5750,b:6500,d:1}];
const gears=[{x:1870,y:385,n:"ENGRENAGEM DAS HORAS",got:false},{x:4240,y:450,n:"ENGRENAGEM DOS MINUTOS",got:false},{x:6750,y:450,n:"ENGRENAGEM DO AMANHECER",got:false}];
const bells=[{x:3320,y:545,id:0,on:false},{x:3650,y:545,id:1,on:false},{x:4020,y:545,id:2,on:false}];let bellStep=0;
const windows=[{x:4620,y:390,on:false},{x:4910,y:320,on:false},{x:5200,y:390,on:false}];let windowStep=0;
const shadowSeals=[{x:5850,y:455,on:false},{x:6250,y:375,on:false},{x:6640,y:455,on:false}];let shadowStep=0;
const towerSeals=[{x:7850,y:55,on:false},{x:8350,y:-185,on:false}];let towerStep=0;
const sections=[{x:0,n:"ESTRADA DAS LANTERNAS MORTAS"},{x:1100,n:"VILA BAIXA"},{x:1980,n:"PRAÇA DAS 4:13"},{x:3150,n:"DISTRITO DOS SINOS"},{x:4380,n:"JANELAS APAGADAS"},{x:5600,n:"CAMINHO DA TORRE"},{x:7200,n:"A TORRE DAS 4:13"}];
if(loadedSave){
  p.x=Number.isFinite(loadedSave.x)?loadedSave.x:p.x;p.y=Number.isFinite(loadedSave.y)?loadedSave.y:p.y;p.dir=loadedSave.dir===-1?-1:1;
  ameliaMet=!!loadedSave.ameliaMet;introLorePlayed=!!loadedSave.introLorePlayed;finalLorePlayed=!!loadedSave.finalLorePlayed;bossUnlocked=!!loadedSave.bossUnlocked;bossActive=!!loadedSave.bossActive;towerMechanism=!!loadedSave.towerMechanism;
  if(Array.isArray(loadedSave.gears))gears.forEach((g,i)=>g.got=!!loadedSave.gears[i]);
  if(loadedSave.puzzles)Object.keys(puzzles).forEach(k=>puzzles[k]=!!loadedSave.puzzles[k]);
  if(Array.isArray(loadedSave.bells))bells.forEach((z,i)=>z.on=!!loadedSave.bells[i]);
  if(Array.isArray(loadedSave.windows))windows.forEach((z,i)=>z.on=!!loadedSave.windows[i]);
  if(Array.isArray(loadedSave.shadows))shadowSeals.forEach((z,i)=>z.on=!!loadedSave.shadows[i]);
  if(Array.isArray(loadedSave.towerSeals))towerSeals.forEach((z,i)=>z.on=!!loadedSave.towerSeals[i]);
  if(Array.isArray(loadedSave.enemies))enemies.forEach((e,i)=>e.dead=!!loadedSave.enemies[i]);
  if(Array.isArray(loadedSave.gearLore))gearLore=loadedSave.gearLore.map(Boolean).slice(0,3);
  bellStep=Number(loadedSave.bellStep)||0;windowStep=Number(loadedSave.windowStep)||0;shadowStep=Number(loadedSave.shadowStep)||0;towerStep=Number(loadedSave.towerStep)||0;
  ui.gear.textContent=gears.filter(z=>z.got).length+"/3";
}
function img(src){return new Promise((r,j)=>{const i=new Image;i.onload=()=>r(i);i.onerror=j;i.src=src+"?v=p2proto1"})}
img("../assets/game/phase1/sprites-hd/jack-atlas-hd.png").then(i=>jack=i).catch(()=>{});
const jackPortraitFiles=["jack-00-neutral.png","jack-01-serious.png","jack-02-smirk.png","jack-03-surprised.png","jack-04-determined.png","jack-05-resolved.png"];
const ameliaPortraitFiles=["amelia-00-neutral.png","amelia-01-cansada.png","amelia-02-triste.png","amelia-03-surpresa.png","amelia-04-irritada.png","amelia-05-culpada.png","amelia-06-chorando.png","amelia-07-abatida.png","amelia-08-assustada.png","amelia-09-sorriso-suave.png"];
Promise.all([
  Promise.allSettled(jackPortraitFiles.map(f=>img("../assets/game/phase1/portraits-hd/"+f))),
  Promise.allSettled(ameliaPortraitFiles.map(f=>img("../assets/game/phase2/portraits-hd/"+f)))
]).then(([jackRs,ameliaRs])=>dialogue.setAssets({
  jack:{frames:jackRs.map(r=>r.status==="fulfilled"?r.value:null)},
  amelia:{frames:ameliaRs.map(r=>r.status==="fulfilled"?r.value:null)}
}));
function say(s){ui.msg.textContent=s;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),1800)}
function banner(s){ui.banner.textContent=s;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),1500)}
let saveClock=0;
function saveJourney(){
  if(!journeyMode||replayMode||!journey?.isActive()||journey.currentPhase()!==2)return;
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    x:p.x,y:p.y,dir:p.dir,ameliaMet,introLorePlayed,gearLore,finalLorePlayed,bossUnlocked,bossActive,towerMechanism,
    gears:gears.map(g=>!!g.got),puzzles:{...puzzles},bells:bells.map(z=>!!z.on),windows:windows.map(z=>!!z.on),
    shadows:shadowSeals.map(z=>!!z.on),towerSeals:towerSeals.map(z=>!!z.on),enemies:enemies.map(e=>!!e.dead),
    bellStep,windowStep,shadowStep,towerStep,savedAt:Date.now()
  }));
}
function lightUse(){if(cool>0)return;cool=.55;light=.48;p.attack=.48;reveal.forEach(q=>{if(Math.abs((q.x+q.w/2)-(p.x+p.w/2))<310)q.t=3});bells.forEach(b=>{if(Math.abs(b.x-p.x)<120){const order=[1,0,2];if(b.id===order[bellStep]){b.on=true;bellStep++;say("Sino correto: "+bellStep+"/3");if(bellStep===3){puzzles.sinos=true;say("ENIGMA DOS SINOS CONCLUÍDO") }}else{bells.forEach(z=>z.on=false);bellStep=0;say("A sequência se perdeu no silêncio...")}}});
const touchSeq=(arr,stepName,order,finish)=>{for(const z of arr){if(Math.abs(z.x-p.x)<125&&Math.abs(z.y-p.y)<145&&!z.on){let step=stepName==="window"?windowStep:stepName==="shadow"?shadowStep:towerStep;if(z===arr[order[step]]){z.on=true;if(stepName==="window")windowStep++;else if(stepName==="shadow")shadowStep++;else towerStep++;const ns=step+1;if(ns===order.length)finish();else say("Selo correto: "+ns+"/"+order.length)}else{arr.forEach(a=>a.on=false);if(stepName==="window")windowStep=0;else if(stepName==="shadow")shadowStep=0;else towerStep=0;say("A ordem se desfez...")}}}};
touchSeq(windows,"window",[0,2,1],()=>{puzzles.janelas=true;say("ENIGMA DAS JANELAS CONCLUÍDO")});
touchSeq(shadowSeals,"shadow",[1,0,2],()=>{puzzles.sombras=true;say("ENIGMA DAS SOMBRAS CONCLUÍDO")});
touchSeq(towerSeals,"tower",[0,1],()=>{towerMechanism=true;say("MECANISMO DA TORRE CONCLUÍDO")});
enemies.forEach(e=>{if(Math.abs(e.x-p.x)<180)e.dead=true})}
function bind(id,key){const b=document.getElementById(id);["pointerdown","pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>input[key]=ev==="pointerdown"))}
bind("leftBtn","left");bind("rightBtn","right");bind("downBtn","down");document.getElementById("jumpBtn").addEventListener("pointerdown",()=>input.jump=true);document.getElementById("lightBtn").addEventListener("pointerdown",lightUse);document.getElementById("interactBtn").addEventListener("pointerdown",interact);interactPrompt.addEventListener("click",interact);
addEventListener("keydown",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=true;if(["ArrowRight","d","D"].includes(e.key))input.right=true;if(["ArrowDown","s","S"].includes(e.key))input.down=true;if(e.key==="Shift")input.run=true;if(e.code==="Space"){input.jump=true;e.preventDefault()}if(["f","F"].includes(e.key))lightUse();if(["e","E"].includes(e.key))interact()});
addEventListener("keyup",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=false;if(["ArrowRight","d","D"].includes(e.key))input.right=false;if(["ArrowDown","s","S"].includes(e.key))input.down=false;if(e.key==="Shift")input.run=false});
const startGameBtn=document.getElementById("startGame");if(loadedSave&&journeyMode&&!replayMode){startGameBtn.textContent="✦ CONTINUAR JORNADA";const introCopy=ui.intro.querySelector("span");if(introCopy)introCopy.textContent="A lanterna guardou seu caminho pela Vila sem Amanhecer."}startGameBtn.onclick=()=>{if(journeyMode&&!replayMode)journey?.advanceTo(2);ui.intro.hidden=true;running=true;last=performance.now();requestAnimationFrame(loop);setTimeout(()=>{if(!introLorePlayed){introLorePlayed=true;openDialogue(lore.arrival)}},450)};
function update(dt){if(dialogue.active){p.vx*=.7;cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.36))-cam)*Math.min(1,dt*5);camY+=((p.x>7150?Math.min(0,p.y-390):0)-camY)*Math.min(1,dt*4);p.anim+=dt;interactPrompt.hidden=true;return}cool=Math.max(0,cool-dt);light=Math.max(0,light-dt);p.attack=Math.max(0,p.attack-dt);reveal.forEach(q=>q.t=Math.max(0,q.t-dt));p.coyote=p.on?.12:Math.max(0,p.coyote-dt);if(input.jump){p.buffer=.14;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
const speed=input.down?95:(input.run?335:235),dir=(input.right?1:0)-(input.left?1:0);p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
if(p.buffer>0&&p.coyote>0){p.vy=-575;p.on=false;p.coyote=0;p.buffer=0}p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.on=false;
const solids=plats.concat(reveal.filter(q=>q.t>0));for(const q of solids){if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}}
if(p.y>760){p.x=Math.max(80,p.x-380);p.y=430;p.vy=0;say("Jack retorna à última rua segura.");}
enemies.forEach(e=>{if(e.dead)return;e.x+=e.d*70*dt;if(e.x<e.a||e.x>e.b)e.d*=-1});
gears.forEach((g,gi)=>{if(!g.got&&Math.abs(g.x-p.x)<70&&Math.abs(g.y-p.y)<120){g.got=true;say(g.n+" RECUPERADA");ui.gear.textContent=gears.filter(z=>z.got).length+"/3";if(!gearLore[gi]){gearLore[gi]=true;setTimeout(()=>openDialogue(lore.gears[gi]),250)}}});
interactPrompt.hidden=!(nearAmelia()||(p.x>7680&&p.x<8060&&p.y<-350&&!bossActive));
let si=0;for(let i=0;i<sections.length;i++)if(p.x>=sections[i].x)si=i;if(si!==section){section=si;banner(sections[si].n)}
ui.obj.textContent=!ameliaMet&&p.x<3150?"Encontre a relojoeira da praça e descubra por que tudo parou às 4:13.":(!gears.every(g=>g.got)||solvedCount()<3?"Engrenagens "+gears.filter(z=>z.got).length+"/3 · Enigmas "+solvedCount()+"/3 — use a Luz e observe as pistas.":(!towerMechanism?"Os 3 enigmas foram resolvidos. Suba a Torre e ative os 2 selos temporais com a Luz.":(!bossActive?"Tudo foi resolvido. Suba ao selo no topo da Torre.":"O ÚLTIMO MINUTO — protótipo da arena final desbloqueado.")));
cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.36))-cam)*Math.min(1,dt*5);camY+=((p.x>7150?Math.min(0,p.y-390):0)-camY)*Math.min(1,dt*4);p.anim+=dt;saveClock+=dt;if(saveClock>=.75){saveClock=0;saveJourney()}}
function drawJack(){const py=p.y-camY;if(!jack){x.fillStyle="#eee";x.fillRect(p.x-cam,py,p.w,p.h);return}const A=window.JACK_ANIMATIONS,arr=p.attack>0?A.animations.attack:(!p.on?(p.vy<-80?A.animations.jumpRise:A.animations.jumpFall):(Math.abs(p.vx)>35?(input.run?A.animations.run:A.animations.walk):A.animations.idle));const fps=input.run?12:9,idx=arr[Math.floor(p.anim*fps)%arr.length],sx=(idx%8)*320,sy=Math.floor(idx/8)*320,rw=190,rh=190,dx=p.x-cam+p.w/2-rw/2,dy=py-132;if(p.dir<0){x.save();x.translate(dx+rw,0);x.scale(-1,1);x.drawImage(jack,sx,sy,320,320,0,dy,rw,rh);x.restore()}else x.drawImage(jack,sx,sy,320,320,dx,dy,rw,rh)}
function draw(){const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#061024");gr.addColorStop(.65,"#17132b");gr.addColorStop(1,"#27131d");x.fillStyle=gr;x.fillRect(0,0,W,H);x.fillStyle="#e7d4b0";x.globalAlpha=.35;for(let i=0;i<18;i++){const px=((i*431-cam*.12)%1500+1500)%1500;x.fillRect(px,80+(i*71)%220,2,2)}x.globalAlpha=1;
x.save();x.translate(-cam,-camY);x.fillStyle="#17131b";for(let bx=250;bx<WORLD;bx+=430){const h=150+(bx%170);x.fillRect(bx,590-h,260,h);x.fillStyle="#5a321d";for(let wy=590-h+35;wy<550;wy+=60){x.fillRect(bx+35,wy,28,38);x.fillRect(bx+150,wy,28,38)}x.fillStyle="#17131b"}
// Torre protótipo: cilindro central e anéis arquitetônicos para comunicar a subida em espiral.
x.fillStyle="#0c0b12";x.fillRect(7350,-520,1200,1110);x.strokeStyle="#62442e";x.lineWidth=12;x.strokeRect(7350,-520,1200,1110);
for(let ty=-440;ty<520;ty+=160){x.strokeStyle="#38291f";x.lineWidth=5;x.beginPath();x.ellipse(7950,ty,520,78,0,0,Math.PI*2);x.stroke()}
x.fillStyle="#d0a65b";x.font="bold 26px Georgia";x.fillText("4:13",7910,-455);
for(const q of plats){x.fillStyle=q.y<560?"#4a3b38":"#30252a";x.fillRect(q.x,q.y,q.w,q.h);x.fillStyle="#75604b";x.fillRect(q.x,q.y,q.w,7)}
for(const q of reveal){if(q.t>0){x.globalAlpha=Math.min(1,q.t*2);x.fillStyle="#b7eaff";x.fillRect(q.x,q.y,q.w,q.h);x.globalAlpha=1}}
// Marcadores dos enigmas obrigatórios.
for(const z of windows){x.fillStyle=z.on?"#ffe7a1":"#402d45";x.fillRect(z.x,z.y,44,58);x.strokeStyle="#c88b35";x.strokeRect(z.x,z.y,44,58)}
for(const z of shadowSeals){x.fillStyle=z.on?"#b9eaff":"#171b2c";x.beginPath();x.arc(z.x,z.y,20,0,Math.PI*2);x.fill();x.strokeStyle="#78a5bb";x.stroke()}
for(const z of towerSeals){x.fillStyle=z.on?"#fff0a8":"#512c65";x.beginPath();x.arc(z.x,z.y,22,0,Math.PI*2);x.fill();x.strokeStyle="#d0a65b";x.stroke()}
x.fillStyle=allRequired()?"#e9c35e":"#4d344d";x.fillRect(7725,-480,300,70);x.strokeStyle="#d0a65b";x.lineWidth=4;x.strokeRect(7725,-480,300,70);x.fillStyle="#fff0b0";x.font="bold 14px Georgia";x.fillText(allRequired()?"SELO ABERTO — AÇÃO":"SELO FECHADO — "+solvedCount()+"/3 · TORRE "+(towerMechanism?"✓":"○"),7780,-438);
if(bossActive){x.fillStyle="#1a0a18";x.fillRect(7550,-650,900,170);x.strokeStyle="#e19a36";x.lineWidth=6;x.strokeRect(7550,-650,900,170);x.fillStyle="#f0b04c";x.font="bold 30px Georgia";x.fillText("O ÚLTIMO MINUTO",7850,-560);x.fillStyle="#c9a56b";x.fillRect(7730,-525,540,12);x.fillStyle="#ffdf83";x.fillRect(7730,-525,540,12)}
// Amélia provisória na praça: marcador visual até criarmos o sprite oficial.
x.save();x.translate(2620,505);x.fillStyle="#39273d";x.fillRect(-18,0,36,78);x.fillStyle="#d8c3ad";x.beginPath();x.arc(0,-13,19,0,Math.PI*2);x.fill();x.fillStyle="#b7a8b8";x.fillRect(-18,-30,36,8);x.fillStyle="#d9b65c";x.fillRect(16,22,24,6);x.fillStyle="#f0cf76";x.font="12px Georgia";x.fillText("AMÉLIA",-30,100);x.restore();
for(const e of enemies){if(e.dead)continue;x.fillStyle="#d56a20";x.beginPath();x.arc(e.x,e.y,24,0,Math.PI*2);x.fill();x.fillStyle="#ffe099";x.fillRect(e.x-11,e.y-5,6,6);x.fillRect(e.x+5,e.y-5,6,6)}
for(const b of bells){x.fillStyle=b.on?"#ffe099":"#8d693d";x.beginPath();x.moveTo(b.x,b.y-45);x.lineTo(b.x-22,b.y);x.lineTo(b.x+22,b.y);x.closePath();x.fill()}
for(const g of gears){if(g.got)continue;x.save();x.translate(g.x,g.y);x.rotate(p.anim);x.strokeStyle="#ffd36b";x.lineWidth=8;x.beginPath();x.arc(0,0,24,0,Math.PI*2);x.stroke();for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.fillStyle="#ffd36b";x.fillRect(20,-5,13,10)}x.restore()}
x.restore();drawJack();if(light>0){x.globalAlpha=Math.min(1,light*4);const rg=x.createRadialGradient(p.x-cam+p.w/2,p.y-camY+25,10,p.x-cam+p.w/2,p.y-camY+25,220);rg.addColorStop(0,"#fff6b8aa");rg.addColorStop(1,"#9beaff00");x.fillStyle=rg;x.beginPath();x.arc(p.x-cam+p.w/2,p.y-camY+25,220,0,Math.PI*2);x.fill();x.globalAlpha=1}
x.fillStyle="#ffe099";x.font="15px Georgia";x.fillText("4:13",W-62,H-24);
if(p.x>7150){x.fillStyle="#ffe099";x.font="13px Georgia";x.fillText("SUBIDA DA TORRE — siga as plataformas ao redor do relógio",28,H-24)}
x.fillStyle="#ffe099";x.font="12px Georgia";x.fillText("ENIGMAS "+solvedCount()+"/3 · TORRE "+(towerMechanism?"✓":"○"),W-230,H-24)}
function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}addEventListener("pagehide",saveJourney);document.addEventListener("visibilitychange",()=>{if(document.hidden)saveJourney()});draw();
})();