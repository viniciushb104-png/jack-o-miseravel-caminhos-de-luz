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
 [0,2190],[2280,2800],[2890,4200],[4300,4800],[4900,5950],
 [6050,6650],[6750,8050],[8150,8700],[8800,12600]
]);
const PLATFORMS=Object.freeze([
 {x:2050,y:505,w:170,h:22},{x:2440,y:455,w:190,h:22},{x:3160,y:500,w:190,h:22},
 {x:3820,y:475,w:180,h:22},{x:4450,y:425,w:190,h:22},{x:5050,y:485,w:170,h:22},
 {x:5660,y:490,w:190,h:22},{x:6270,y:430,w:200,h:22},{x:6910,y:485,w:180,h:22},
 {x:7730,y:465,w:180,h:22},{x:8370,y:420,w:190,h:22},{x:9040,y:475,w:200,h:22}
]);

const GATES=[
 {x:1660,flag:()=>returnOpened},
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
 {id:"promise",x:10720,respawnX:10620,require:()=>promiseSolved,name:"A PENÚLTIMA LANTERNA"}
]);

const housesLamps=[
 {x:1840,type:"path",on:true},{x:2140,type:"wait",on:true},{x:2500,type:"wait",on:true},
 {x:2860,type:"path",on:true},{x:3260,type:"wait",on:true}
];
const clockMirrors=[
 {x:3750,y:520,targetX:4020,targetY:385,node:0},
 {x:4300,y:520,targetX:4560,targetY:385,node:1},
 {x:4820,y:520,targetX:5060,targetY:385,node:2}
];
const gardenItems=[
 {id:"letter",x:5510,memorialX:5690,title:"CARTA"},
 {id:"key",x:6110,memorialX:6290,title:"CHAVE"},
 {id:"portrait",x:6800,memorialX:7040,title:"RETRATO"}
];
const cityMarks=[
 {x:7560,label:"ESPEROU"},{x:8200,label:"CONTINUOU"},
 {x:8600,label:"DEIXOU IR"},{x:9150,label:"ATRAVESSOU"}
];
const promiseAltars=[
 {x:9710,label:"VOCÊ PROMETEU"},{x:9990,label:"EU VOLTO"},
 {x:10280,label:"ENCONTRE O CAMINHO DE VOLTA"},{x:10580,label:"PARA TODOS ELES"}
];
const bossSigils=[
 {x:11160,label:"MENTIROSO"},{x:11420,label:"COVARDE"},
 {x:12050,label:"AVARENTO"},{x:12320,label:"MISERÁVEL"}
];
const bossLessons=[
 {x:11210,label:"ESPERAR",mode:"direct"},
 {x:11550,label:"CONTINUAR",mode:"reflected"},
 {x:11960,label:"DEIXAR IR",mode:"direct"},
 {x:12250,label:"ATRAVESSAR",mode:"reflected"}
];
const bossMirrors=[
 {x:11420,y:520,targetX:11550,targetY:500,lesson:1},
 {x:12120,y:520,targetX:12250,targetY:500,lesson:3}
];

let state={
 returnOpened:false,roadBlockedSeen:false,
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
let returnOpened=!!state.returnOpened,roadBlockedSeen=!!state.roadBlockedSeen;
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
let phase5Complete=!!state.phase5Complete||localStorage.getItem(COMPLETE_KEY)==="yes";

const p={x:Number(state.px)||150,y:Number(state.py)||480,w:44,h:86,vx:0,vy:0,on:false,dir:1,anim:0,attack:0,inv:0};
let life=3,cam=0,running=false,last=performance.now(),sectionIndex=-1,lightPulse=0,lightCooldown=0;
let reflectedFx=[],hazards=[],shots=[],messageTimer=0,bannerTimer=0,bossShotCd=1.2,ending=false;
const input={left:false,right:false,down:false,jump:false,run:false};

const atlas=new Image();atlas.src="../assets/game/phase1/sprites-hd/jack-atlas-hd.png";
let atlasReady=false;atlas.onload=()=>atlasReady=true;
const JA=window.JACK_ANIMATIONS||null;

const ambient=new Audio("../assets/audio/phase4/phase4-road-continues-finale.mp3?v=1");
ambient.loop=true;ambient.preload="metadata";ambient.volume=.38;
let musicOn=localStorage.getItem("jack-phase5-music-muted")!=="1";
const musicBtn=document.getElementById("phase5MusicToggle");
function syncMusic(){
 ambient.muted=!musicOn;
 if(musicBtn){
  musicBtn.setAttribute("aria-pressed",String(!musicOn));
  musicBtn.querySelector("b").textContent=musicOn?"♫":"×";
 }
}
musicBtn?.addEventListener("click",()=>{
 musicOn=!musicOn;localStorage.setItem("jack-phase5-music-muted",musicOn?"0":"1");syncMusic();
 if(musicOn&&running)ambient.play().catch(()=>{});
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
function openLines(lines,cb){
 input.left=input.right=input.down=input.run=false;p.vx=0;
 dialogue.open(lines,cb);
}
function save(){
 const data={
  returnOpened,roadBlockedSeen,housesSolved,clockSolved,gardenSolved,citySolved,promiseSolved,
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
  if(!returnOpened)return "O sino chama para trás. Volte pelo caminho que acabou de percorrer.";
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

function pointOnGround(x){
 for(const r of GROUND)if(x>=r[0]&&x<=r[1])return true;
 return false;
}
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
  const oldR=oldX+p.w,newR=p.x+p.w;
  if(oldR<=g.x&&newR>g.x){p.x=g.x-p.w;p.vx=0;return}
  if(oldX>=g.x+18&&p.x<g.x+18){p.x=g.x+18;p.vx=0;return}
 }
}
function checkpointAllowed(cp){return !cp.require||cp.require()}
function updateCheckpoint(){
 const pc=p.x+p.w/2;
 for(const cp of CHECKPOINTS){
  if(cp.id===activeCheckpoint||!checkpointAllowed(cp))continue;
  if(Math.abs(pc-cp.x)<78&&p.y+p.h>520){
   activeCheckpoint=cp.id;life=3;banner(cp.name+" · ACESO");say("A chama guardará este retorno.");save();syncHud();break;
  }
 }
}
function respawn(){
 const cp=CHECKPOINTS.find(v=>v.id===activeCheckpoint);
 life=Math.max(0,life-1);
 if(life<=0){life=3;say("A estrada devolveu Jack ao último marco.")}
 else say("A escuridão alcançou Jack. "+life+"/3.");
 p.x=cp?cp.respawnX:150;p.y=470;p.vx=p.vy=0;p.inv=1.2;shots.length=0;hazards.length=0;save();syncHud();
}

function makeEnemy(id,kind,x,minX,maxX,hp,label){
 return {id,kind,x,y:0,minX,maxX,hp,maxHp:hp,label,dir:-1,vx:0,cd:.7,t:0,hit:0};
}
const enemies=[
 makeEnemy("shadow-1","shadow",980,650,1450,2,"SOMBRA DE RETORNO"),
 makeEnemy("witness-1","witness",2050,1840,2260,2,"TESTEMUNHA CEGA"),
 makeEnemy("accuser-1","accuser",3320,3180,3440,3,"MENTIROSO"),
 makeEnemy("repeater-1","repeater",3900,3650,4170,2,"REPETIDOR"),
 makeEnemy("repeater-2","repeater",4630,4380,4860,2,"REPETIDOR"),
 makeEnemy("accuser-2","accuser",5150,4970,5280,3,"COVARDE"),
 makeEnemy("ash-1","ash",5840,5500,6000,3,"PORTADOR DE CINZAS"),
 makeEnemy("witness-2","witness",6420,6150,6650,2,"TESTEMUNHA CEGA"),
 makeEnemy("ash-2","ash",6880,6740,7080,3,"PORTADOR DE CINZAS"),
 makeEnemy("accuser-3","accuser",7200,7050,7300,3,"AVARENTO"),
 makeEnemy("shadow-2","shadow",7700,7420,8000,2,"SOMBRA DE RETORNO"),
 makeEnemy("witness-3","witness",8260,8080,8480,2,"TESTEMUNHA CEGA"),
 makeEnemy("repeater-3","repeater",8680,8500,8840,3,"REPETIDOR"),
 makeEnemy("ash-3","ash",9000,8860,9180,3,"PORTADOR DE CINZAS"),
 makeEnemy("accuser-4","accuser",9320,9180,9440,4,"MISERÁVEL")
].filter(e=>!deadEnemies.has(e.id));

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
 for(const q of PLATFORMS)if(e.x>=q.x&&e.x<=q.x+q.w)return q.y;
 return FLOOR;
}
function hurtPlayer(sourceX){
 if(p.inv>0||phase5Complete)return;
 life--;p.inv=1.0;p.vx=p.x<sourceX?-260:260;p.vy=-300;
 say("A escuridão atingiu Jack — "+life+"/3.");
 if(life<=0)setTimeout(respawn,180);
 syncHud();
}
function killEnemy(e){
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
  e.cd=Math.max(0,e.cd-dt);e.hit=Math.max(0,e.hit-dt);e.t+=dt;
  const dx=pc-e.x,ad=Math.abs(dx),sg=Math.sign(dx)||1;
  e.y=enemyGroundY(e);

  if(e.kind==="shadow"){
   const looking=Math.sign(e.x-pc)===p.dir;
   e.vx=looking?-sg*75:sg*(ad<330?150:85);
  }else if(e.kind==="witness"){
   e.vx=(ad<330?0:e.dir*28);
   if(e.x<e.minX){e.x=e.minX;e.dir=1}if(e.x>e.maxX){e.x=e.maxX;e.dir=-1}
   if(ad<330&&e.cd<=0){
    hazards.push({x:pc,t:1.35,arm:.58});e.cd=2.15;
   }
  }else if(e.kind==="repeater"){
   if(e.cd<=0&&ad<430){e.vx=(Math.sign(p.vx)||sg)*210;e.cd=1.35}
   else e.vx*=.94;
  }else{
   e.vx=sg*(e.kind==="accuser"?70:55);
  }

  e.x+=e.vx*dt;
  if(e.x<e.minX){e.x=e.minX;e.dir=1}if(e.x>e.maxX){e.x=e.maxX;e.dir=-1}
  if(ad<58&&Math.abs((p.y+p.h)-e.y)<110&&e.cd<=.25){hurtPlayer(e.x);e.cd=.9}
 }
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
 const list=[...clockMirrors,...bossMirrors,
  {x:5730,y:520,targetX:5840,targetY:520,garden:true},
  {x:6710,y:520,targetX:6880,targetY:520,garden:true},
  {x:8920,y:520,targetX:9000,targetY:520,garden:true}
 ];
 let best=null,bd=999;
 for(const m of list){
  const d=Math.hypot(m.x-pc,(m.y-pcy)*.8);
  if(d<220&&d<bd){best=m;bd=d}
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

 if(bossResolved&&Math.abs(pc-12410)<115){
  completePhase();return;
 }
}

function updateRoadStory(){
 const pc=p.x+p.w/2;
 if(!roadBlockedSeen&&pc>1450){
  roadBlockedSeen=true;banner("A ESTRADA RECUSA O PASSO");openLines(story.roadBlocked,save);save();
 }
 if(roadBlockedSeen&&!returnOpened&&pc<280){
  returnOpened=true;banner("O CAMINHO EXISTIA PARA TRÁS");openLines(story.roadTurn,save);save();
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
 if(plat&&p.vy>=0){p.y=plat.y-p.h;p.vy=0;p.on=true}
 else if(pointOnGround(cx)&&oldBottom<=FLOOR+9&&bottom>=FLOOR&&p.vy>=0){p.y=FLOOR-p.h;p.vy=0;p.on=true}

 if(p.y>760){respawn();return}

 updateRoadStory();
 const si=sectionFor(cx);
 if(si!==sectionIndex){sectionIndex=si;banner(SECTIONS[si].name);sectionIntro(si)}
 updateCheckpoint();
 updateEnemies(dt);
 startBoss();
 updateBoss(dt);

 for(const fx of reflectedFx)fx.t-=dt;
 reflectedFx=reflectedFx.filter(f=>f.t>0);

 cam+=(Math.max(0,Math.min(WORLD-W,p.x-W*.38))-cam)*Math.min(1,dt*6);
 syncHud();save();
}

function drawBackdrop(){
 const sec=currentSection().id;
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
 ctx.save();ctx.globalAlpha=.18;ctx.fillStyle="#d8c27c";
 for(let i=0;i<28;i++){const x=(i*173-cam*.12)%1380,y=80+(i*97)%360;ctx.fillRect(x,y,2,2)}
 ctx.restore();
}
function drawGround(){
 ctx.save();ctx.translate(-cam,0);
 for(const r of GROUND){
  const x=r[0],w=r[1]-r[0];
  ctx.fillStyle="#161713";ctx.fillRect(x,FLOOR,w,140);
  ctx.fillStyle="#544a38";ctx.fillRect(x,FLOOR,w,5);
  ctx.strokeStyle="rgba(10,8,6,.65)";ctx.lineWidth=3;
  for(let xx=x+60;xx<x+w;xx+=120){ctx.beginPath();ctx.moveTo(xx,FLOOR+8);ctx.lineTo(xx-24,FLOOR+48);ctx.stroke()}
 }
 for(const q of PLATFORMS){
  ctx.fillStyle="#26251f";ctx.fillRect(q.x,q.y,q.w,q.h);
  ctx.fillStyle="#8d7952";ctx.fillRect(q.x,q.y,q.w,4);
 }
 ctx.restore();
}
function drawGates(){
 ctx.save();ctx.translate(-cam,0);
 for(const g of GATES){
  if(g.flag())continue;
  ctx.strokeStyle="rgba(216,188,112,.38)";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(g.x,260);ctx.lineTo(g.x,FLOOR);ctx.stroke();
  for(let y=290;y<FLOOR;y+=42){ctx.fillStyle="rgba(216,188,112,.18)";ctx.fillRect(g.x-22,y,44,3)}
 }
 ctx.restore();
}
function drawCheckpoint(cp){
 const lit=cp.id===activeCheckpoint||checkpointAllowed(cp)&&CHECKPOINTS.indexOf(cp)<=CHECKPOINTS.findIndex(v=>v.id===activeCheckpoint);
 ctx.save();ctx.translate(cp.x-cam,FLOOR);
 ctx.fillStyle="#30281c";ctx.fillRect(-6,-105,12,105);
 ctx.fillStyle=lit?"#f0b94d":"#55442d";ctx.shadowColor=lit?"#f0a83c":"transparent";ctx.shadowBlur=lit?22:0;
 ctx.beginPath();ctx.arc(0,-116,24,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#17100c";ctx.fillRect(-8,-124,16,5);ctx.fillRect(-13,-114,26,4);
 ctx.restore();
}
function drawSectionProps(){
 const sec=currentSection().id;ctx.save();ctx.translate(-cam,0);
 if(sec==="return"){
  ctx.fillStyle="rgba(180,190,190,.09)";for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(260+i*220,530,170,36,0,0,Math.PI*2);ctx.fill()}
  if(roadBlockedSeen&&!returnOpened){ctx.fillStyle="#d4bc72";ctx.font="700 20px Georgia";ctx.fillText("←",260,420)}
 }
 if(sec==="houses"){
  for(let i=0;i<5;i++){
   const x=1760+i*350;ctx.fillStyle="#171418";ctx.fillRect(x,315,240,275);
   ctx.fillStyle="rgba(237,185,80,.18)";ctx.fillRect(x+42,360,56,72);ctx.fillRect(x+142,360,56,72);
   ctx.fillStyle="#09090a";ctx.fillRect(x+92,470,58,120);
  }
  housesLamps.forEach((l,i)=>{
   ctx.fillStyle="#332718";ctx.fillRect(l.x-4,500,8,90);
   ctx.fillStyle=l.on?(l.type==="path"?"#e7c064":"#e28b49"):"#302a24";
   ctx.shadowColor=l.on?"#d89a48":"transparent";ctx.shadowBlur=l.on?18:0;
   ctx.beginPath();ctx.arc(l.x,492,14,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   ctx.fillStyle="rgba(240,225,180,.7)";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(l.type==="path"?"ESTRADA":"JANELA",l.x,465);
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
   if(!gardenPlaced.has(it.id)&&carriedItem!==it.id){
    ctx.fillStyle="#b79a63";ctx.fillRect(it.x-18,538,36,30);ctx.fillStyle="#ead595";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(it.title,it.x,525);
   }
   ctx.strokeStyle=gardenPlaced.has(it.id)?"#d3b567":"#655a44";ctx.lineWidth=3;ctx.strokeRect(it.memorialX-34,520,68,70);
  });
  [{x:5730,targetX:5840},{x:6710,targetX:6880}].forEach(m=>drawMirror({x:m.x,y:520,targetX:m.targetX,targetY:520},false));
 }
 if(sec==="city"){
  for(let x=7420,i=0;x<9460;x+=280,i++){ctx.fillStyle="#17191b";ctx.fillRect(x,300,210,290);ctx.strokeStyle="#6f6656";ctx.strokeRect(x+22,335,166,55);ctx.fillStyle="#84755f";ctx.font="11px Georgia";ctx.textAlign="center";ctx.fillText(i%2?"RUA DE ALGUÉM":"NOME REGISTRADO",x+105,368)}
  cityMarks.forEach((m,i)=>{
   ctx.strokeStyle=cityLit.has(i)?"#e3c66e":"#5a5144";ctx.lineWidth=3;ctx.strokeRect(m.x-62,520,124,46);
   ctx.fillStyle=cityLit.has(i)?"#ead58d":"#786d58";ctx.font="700 11px Georgia";ctx.textAlign="center";ctx.fillText(m.label,m.x,548);
  });
 }
 if(sec==="promise"){
  ctx.strokeStyle="rgba(184,153,91,.3)";ctx.lineWidth=5;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(10100,FLOOR);ctx.lineTo(10100+i*440,260);ctx.stroke()}
  promiseAltars.forEach((a,i)=>{
   const on=i<promiseStep;ctx.fillStyle=on?"#d9b65f":"#3f392f";ctx.fillRect(a.x-4,500,8,90);
   ctx.beginPath();ctx.arc(a.x,492,17,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=on?"#efd48b":"#776a54";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(a.label,a.x,455);
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
 ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(10850,180,1750,410);
 if(!bossStarted)return;
 ctx.save();ctx.translate(bx,500);
 ctx.fillStyle=bossAct===3?"#1e1d1a":"#0b0b0c";ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=28;
 ctx.beginPath();ctx.moveTo(-70,80);ctx.lineTo(-45,-105);ctx.quadraticCurveTo(0,-190,45,-105);ctx.lineTo(70,80);ctx.closePath();ctx.fill();
 ctx.fillStyle="#32281d";ctx.fillRect(-45,-62,90,16);ctx.fillStyle="#c6a75d";ctx.font="700 12px Georgia";ctx.textAlign="center";ctx.fillText("MISERÁVEL",0,-50);ctx.restore();
 if(bossAct===1){
  bossSigils.forEach((s,i)=>{ctx.strokeStyle=bossSigilLit.has(i)?"#e5c369":"#6d2f2f";ctx.lineWidth=3;ctx.strokeRect(s.x-55,505,110,48);ctx.fillStyle="#cdb57a";ctx.font="10px Georgia";ctx.textAlign="center";ctx.fillText(s.label,s.x,535)});
 }
 if(bossAct===2){
  bossLessons.forEach((s,i)=>{ctx.strokeStyle=bossLessonLit.has(i)?"#ead073":"#63594a";ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,525,28,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#d8c08a";ctx.font="9px Georgia";ctx.textAlign="center";ctx.fillText(s.label,s.x,575)});
  bossMirrors.forEach(m=>drawMirror(m,bossLessonLit.has(m.lesson)));
 }
 if(bossAct===3&&!bossContinued){
  ctx.fillStyle="#f0d488";ctx.font="700 14px Georgia";ctx.textAlign="center";ctx.fillText("E · CONTINUAR",bx,315);
 }
 if(bossResolved){
  const lx=12410;ctx.fillStyle="#e8ba4f";ctx.shadowColor="#e6a43d";ctx.shadowBlur=35;ctx.beginPath();ctx.arc(lx,470,30,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle="#f0d78e";ctx.font="700 13px Georgia";ctx.textAlign="center";ctx.fillText("A ÚLTIMA LANTERNA",lx,425);
 }
}
function drawEnemies(){
 ctx.save();ctx.translate(-cam,0);
 for(const e of enemies){
  if(e.dead||!enemyActive(e))continue;
  const y=e.y,hit=e.hit>0;
  ctx.save();ctx.translate(e.x,y);ctx.globalAlpha=hit?.45:1;
  if(e.kind==="shadow"){
   ctx.fillStyle="rgba(25,24,30,.82)";ctx.beginPath();ctx.ellipse(0,-58,28,62,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d8d0bb";ctx.fillRect(-5,-82,4,4);ctx.fillRect(7,-82,4,4);
  }else if(e.kind==="witness"){
   ctx.fillStyle="#282621";ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(-20,-88);ctx.lineTo(0,-122);ctx.lineTo(20,-88);ctx.lineTo(34,0);ctx.closePath();ctx.fill();ctx.strokeStyle="#8b7857";ctx.strokeRect(-22,-82,44,20);
  }else if(e.kind==="repeater"){
   ctx.strokeStyle="#9d8760";ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,-62,27,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(0,-2);ctx.moveTo(0,-24);ctx.lineTo(-24,-2);ctx.moveTo(0,-24);ctx.lineTo(24,-2);ctx.stroke();
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
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  if(p.dir<0){ctx.translate(dx+w,0);ctx.scale(-1,1);ctx.drawImage(atlas,sx,sy,cell,cell,0,dy,w,h)}
  else ctx.drawImage(atlas,sx,sy,cell,cell,dx,dy,w,h);
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
 if(e.key==="Shift")input.run=false;
}
addEventListener("keydown",onKeyDown);addEventListener("keyup",onKeyUp);

function bindHold(id,key){
 const el=document.getElementById(id);if(!el)return;
 const down=e=>{e.preventDefault();input[key]=true},up=e=>{e.preventDefault();input[key]=false};
 el.addEventListener("pointerdown",down);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("pointerleave",up);
}
bindHold("leftBtn","left");bindHold("rightBtn","right");bindHold("downBtn","down");
document.getElementById("jumpBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();input.jump=true});
document.getElementById("lightBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();useLight()});
document.getElementById("interactBtn")?.addEventListener("pointerdown",e=>{e.preventDefault();interact()});

document.getElementById("startGame").onclick=()=>{
 if(journeyMode&&!replayMode)journey?.advanceTo(5);
 ui.intro.hidden=true;running=true;last=performance.now();
 if(musicOn)ambient.play().catch(()=>{});
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