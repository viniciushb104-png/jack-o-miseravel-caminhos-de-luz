(()=>{"use strict";
const c=document.getElementById("game"),x=c.getContext("2d"),W=1280,H=720,WORLD=7200,G=1500;
const ui={obj:document.querySelector("#objective strong"),gear:document.getElementById("gearValue"),banner:document.getElementById("sectionBanner"),msg:document.getElementById("message"),intro:document.getElementById("intro")};
const input={left:false,right:false,run:false,jump:false,down:false};let running=false,last=performance.now(),cam=0,jack=null,light=0,cool=0,section=-1;
const p={x:120,y:470,w:46,h:86,vx:0,vy:0,dir:1,on:false,coyote:0,buffer:0,anim:0,attack:0};
const plats=[
{x:0,y:590,w:1100,h:130},{x:1160,y:590,w:760,h:130},{x:1350,y:505,w:260,h:32},{x:1660,y:440,w:230,h:32},
{x:1980,y:590,w:1100,h:130},{x:2160,y:500,w:260,h:32},{x:2520,y:430,w:260,h:32},{x:2860,y:500,w:220,h:32},
{x:3150,y:590,w:1150,h:130},{x:3340,y:500,w:220,h:32},{x:3700,y:430,w:240,h:32},{x:4070,y:500,w:220,h:32},
{x:4380,y:590,w:1150,h:130},{x:4550,y:500,w:220,h:32},{x:4890,y:430,w:230,h:32},{x:5250,y:500,w:250,h:32},
{x:5600,y:590,w:1600,h:130},{x:5820,y:500,w:260,h:32},{x:6200,y:420,w:260,h:32},{x:6580,y:500,w:260,h:32}];
const reveal=[{x:1010,y:505,w:150,h:28,t:0},{x:3030,y:475,w:120,h:28,t:0},{x:4260,y:455,w:120,h:28,t:0}];
const enemies=[{x:780,y:548,a:620,b:970,d:1},{x:2320,y:548,a:2070,b:2850,d:1},{x:4680,y:548,a:4480,b:5300,d:1},{x:6100,y:548,a:5750,b:6500,d:1}];
const gears=[{x:1870,y:385,n:"ENGRENAGEM DAS HORAS",got:false},{x:4240,y:450,n:"ENGRENAGEM DOS MINUTOS",got:false},{x:6750,y:450,n:"ENGRENAGEM DO AMANHECER",got:false}];
const bells=[{x:3320,y:545,id:0,on:false},{x:3650,y:545,id:1,on:false},{x:4020,y:545,id:2,on:false}];let bellStep=0;
const sections=[{x:0,n:"ESTRADA DAS LANTERNAS MORTAS"},{x:1100,n:"VILA BAIXA"},{x:1980,n:"PRAÇA DAS 4:13"},{x:3150,n:"DISTRITO DOS SINOS"},{x:4380,n:"JANELAS APAGADAS"},{x:5600,n:"CAMINHO DA TORRE"}];
function img(src){return new Promise((r,j)=>{const i=new Image;i.onload=()=>r(i);i.onerror=j;i.src=src+"?v=p2proto1"})}
img("../assets/game/phase1/sprites-hd/jack-atlas-hd.png").then(i=>jack=i).catch(()=>{});
function say(s){ui.msg.textContent=s;ui.msg.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>ui.msg.classList.remove("show"),1800)}
function banner(s){ui.banner.textContent=s;ui.banner.classList.add("show");clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove("show"),1500)}
function lightUse(){if(cool>0)return;cool=.55;light=.48;p.attack=.48;reveal.forEach(q=>{if(Math.abs((q.x+q.w/2)-(p.x+p.w/2))<310)q.t=3});bells.forEach(b=>{if(Math.abs(b.x-p.x)<120){const order=[1,0,2];if(b.id===order[bellStep]){b.on=true;bellStep++;say("Sino correto: "+bellStep+"/3");if(bellStep===3)say("A sequência abriu o caminho.")}else{bells.forEach(z=>z.on=false);bellStep=0;say("A sequência se perdeu no silêncio...")}}});enemies.forEach(e=>{if(Math.abs(e.x-p.x)<180)e.dead=true})}
function bind(id,key){const b=document.getElementById(id);["pointerdown","pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>input[key]=ev==="pointerdown"))}
bind("leftBtn","left");bind("rightBtn","right");bind("downBtn","down");document.getElementById("jumpBtn").addEventListener("pointerdown",()=>input.jump=true);document.getElementById("lightBtn").addEventListener("pointerdown",lightUse);
addEventListener("keydown",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=true;if(["ArrowRight","d","D"].includes(e.key))input.right=true;if(["ArrowDown","s","S"].includes(e.key))input.down=true;if(e.key==="Shift")input.run=true;if(e.code==="Space"){input.jump=true;e.preventDefault()}if(["f","F"].includes(e.key))lightUse()});
addEventListener("keyup",e=>{if(["ArrowLeft","a","A"].includes(e.key))input.left=false;if(["ArrowRight","d","D"].includes(e.key))input.right=false;if(["ArrowDown","s","S"].includes(e.key))input.down=false;if(e.key==="Shift")input.run=false});
document.getElementById("startGame").onclick=()=>{ui.intro.hidden=true;running=true;last=performance.now();requestAnimationFrame(loop)};
function update(dt){cool=Math.max(0,cool-dt);light=Math.max(0,light-dt);p.attack=Math.max(0,p.attack-dt);reveal.forEach(q=>q.t=Math.max(0,q.t-dt));p.coyote=p.on?.12:Math.max(0,p.coyote-dt);if(input.jump){p.buffer=.14;input.jump=false}else p.buffer=Math.max(0,p.buffer-dt);
const speed=input.down?95:(input.run?335:235),dir=(input.right?1:0)-(input.left?1:0);p.vx+=((dir*speed)-p.vx)*Math.min(1,dt*12);if(dir)p.dir=dir;
if(p.buffer>0&&p.coyote>0){p.vy=-575;p.on=false;p.coyote=0;p.buffer=0}p.vy+=G*dt;const oldY=p.y;p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.on=false;
const solids=plats.concat(reveal.filter(q=>q.t>0));for(const q of solids){if(p.x+p.w>q.x&&p.x<q.x+q.w&&oldY+p.h<=q.y+8&&p.y+p.h>=q.y&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.on=true}}
if(p.y>760){p.x=Math.max(80,p.x-380);p.y=430;p.vy=0;say("Jack retorna à última rua segura.");}
enemies.forEach(e=>{if(e.dead)return;e.x+=e.d*70*dt;if(e.x<e.a||e.x>e.b)e.d*=-1});
gears.forEach(g=>{if(!g.got&&Math.abs(g.x-p.x)<70&&Math.abs(g.y-p.y)<120){g.got=true;say(g.n+" RECUPERADA");ui.gear.textContent=gears.filter(z=>z.got).length+"/3"}});
let si=0;for(let i=0;i<sections.length;i++)if(p.x>=sections[i].x)si=i;if(si!==section){section=si;banner(sections[si].n)}
ui.obj.textContent=gears.filter(z=>z.got).length<3?"Encontre as três engrenagens e use a Luz para revelar caminhos.":"As três engrenagens respondem. Alcance a Torre do Relógio.";
cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.36))-cam)*Math.min(1,dt*5);p.anim+=dt;}
function drawJack(){if(!jack){x.fillStyle="#eee";x.fillRect(p.x-cam,p.y,p.w,p.h);return}const A=window.JACK_ANIMATIONS,arr=p.attack>0?A.animations.attack:(!p.on?(p.vy<-80?A.animations.jumpRise:A.animations.jumpFall):(Math.abs(p.vx)>35?(input.run?A.animations.run:A.animations.walk):A.animations.idle));const fps=input.run?12:9,idx=arr[Math.floor(p.anim*fps)%arr.length],sx=(idx%8)*320,sy=Math.floor(idx/8)*320,rw=190,rh=190,dx=p.x-cam+p.w/2-rw/2,dy=p.y-132;if(p.dir<0){x.save();x.translate(dx+rw,0);x.scale(-1,1);x.drawImage(jack,sx,sy,320,320,0,dy,rw,rh);x.restore()}else x.drawImage(jack,sx,sy,320,320,dx,dy,rw,rh)}
function draw(){const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#061024");gr.addColorStop(.65,"#17132b");gr.addColorStop(1,"#27131d");x.fillStyle=gr;x.fillRect(0,0,W,H);x.fillStyle="#e7d4b0";x.globalAlpha=.35;for(let i=0;i<18;i++){const px=((i*431-cam*.12)%1500+1500)%1500;x.fillRect(px,80+(i*71)%220,2,2)}x.globalAlpha=1;
x.save();x.translate(-cam,0);x.fillStyle="#17131b";for(let bx=250;bx<WORLD;bx+=430){const h=150+(bx%170);x.fillRect(bx,590-h,260,h);x.fillStyle="#5a321d";for(let wy=590-h+35;wy<550;wy+=60){x.fillRect(bx+35,wy,28,38);x.fillRect(bx+150,wy,28,38)}x.fillStyle="#17131b"}
for(const q of plats){x.fillStyle=q.y<560?"#4a3b38":"#30252a";x.fillRect(q.x,q.y,q.w,q.h);x.fillStyle="#75604b";x.fillRect(q.x,q.y,q.w,7)}
for(const q of reveal){if(q.t>0){x.globalAlpha=Math.min(1,q.t*2);x.fillStyle="#b7eaff";x.fillRect(q.x,q.y,q.w,q.h);x.globalAlpha=1}}
for(const e of enemies){if(e.dead)continue;x.fillStyle="#d56a20";x.beginPath();x.arc(e.x,e.y,24,0,Math.PI*2);x.fill();x.fillStyle="#ffe099";x.fillRect(e.x-11,e.y-5,6,6);x.fillRect(e.x+5,e.y-5,6,6)}
for(const b of bells){x.fillStyle=b.on?"#ffe099":"#8d693d";x.beginPath();x.moveTo(b.x,b.y-45);x.lineTo(b.x-22,b.y);x.lineTo(b.x+22,b.y);x.closePath();x.fill()}
for(const g of gears){if(g.got)continue;x.save();x.translate(g.x,g.y);x.rotate(p.anim);x.strokeStyle="#ffd36b";x.lineWidth=8;x.beginPath();x.arc(0,0,24,0,Math.PI*2);x.stroke();for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.fillStyle="#ffd36b";x.fillRect(20,-5,13,10)}x.restore()}
x.restore();drawJack();if(light>0){x.globalAlpha=Math.min(1,light*4);const rg=x.createRadialGradient(p.x-cam+p.w/2,p.y+25,10,p.x-cam+p.w/2,p.y+25,220);rg.addColorStop(0,"#fff6b8aa");rg.addColorStop(1,"#9beaff00");x.fillStyle=rg;x.beginPath();x.arc(p.x-cam+p.w/2,p.y+25,220,0,Math.PI*2);x.fill();x.globalAlpha=1}
x.fillStyle="#ffe099";x.font="15px Georgia";x.fillText("4:13",W-62,H-24)}
function loop(t){if(!running)return;const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}draw();
})();