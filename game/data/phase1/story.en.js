if(localStorage.getItem("jack-language")==="en"){
window.PHASE1_STORY = {
  id:"halloween-1",
  title:"The Houses of the Lost",
  subtitle:"The House That Stayed Lit",
  worldWidth:11000,
  soul:"Eleanor",
  states:{
    metEleanor:"jack-phase1-met-eleanor",memoryKey:"jack-phase1-memory-key",memoryStorm:"jack-phase1-memory-storm",
    memoryFamily:"jack-phase1-memory-family",memoryCandle:"jack-phase1-memory-candle",memoryLetter:"jack-phase1-memory-letter",
    checkpoint:"jack-phase1-checkpoint",bossDefeated:"jack-phase1-boss-defeated",eleanorSaved:"jack-phase1-eleanor-saved"
  },
  sections:[
    {id:"village",name:"1. Village Entrance",start:0,end:1500,background:"village"},
    {id:"orchard",name:"2. Pumpkin Orchard",start:1500,end:3200,background:"forest"},
    {id:"cemetery",name:"3. Cemetery of Candles",start:3200,end:5000,background:"forest"},
    {id:"bridges",name:"4. Bridges of the Lost",start:5000,end:7000,background:"memoryBridge"},
    {id:"ruins",name:"5. Ruins of Memory",start:7000,end:8800,background:"memoryBridge"},
    {id:"arena",name:"6. Guardian's Arena",start:8800,end:11000,background:"bellTower"}
  ],
  memories:[
    {id:"key",title:"The Key",x:2320,y:405,state:"memoryKey",dialogue:"memoryKey"},
    {id:"storm",title:"The Storm",x:3550,y:455,state:"memoryStorm",dialogue:"memoryStorm"},
    {id:"family",title:"The Family Portrait",x:4550,y:400,state:"memoryFamily",dialogue:"memoryFamily"},
    {id:"candle",title:"The Last Candle",x:7480,y:425,state:"memoryCandle",dialogue:"memoryCandle"},
    {id:"letter",title:"We Never Forgot You",x:8200,y:410,state:"memoryLetter",dialogue:"memoryLetter"}
  ],
  objectives:{
    beforeMeeting:"Follow the only lit house and find whoever is still waiting.",
    findMemories:"Recover Eleanor's memories",
    goRuins:"Follow the lights to the Ruins of Memory.",
    goArena:"The memories are complete. Find whoever imprisoned them.",
    defeatBoss:"Use the lantern's Light against the Spectral Guardian.",
    completed:"Eleanor found the Path of Light."
  }
};}