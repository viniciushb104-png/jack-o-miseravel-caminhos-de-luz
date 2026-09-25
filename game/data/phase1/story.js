window.PHASE1_STORY = {
  id: "halloween-1",
  title: "As Casas dos Perdidos",
  subtitle: "A Casa que Continuava Acesa",
  worldWidth: 11000,
  soul: "Eleanor",
  states: {
    metEleanor: "jack-phase1-met-eleanor",
    memoryKey: "jack-phase1-memory-key",
    memoryStorm: "jack-phase1-memory-storm",
    memoryFamily: "jack-phase1-memory-family",
    memoryCandle: "jack-phase1-memory-candle",
    memoryLetter: "jack-phase1-memory-letter",
    checkpoint: "jack-phase1-checkpoint",
    bossDefeated: "jack-phase1-boss-defeated",
    eleanorSaved: "jack-phase1-eleanor-saved"
  },
  sections: [
    { id:"village",  name:"1. Entrada da Vila",       start:0,    end:1500 },
    { id:"orchard",  name:"2. Pomar das Abóboras",   start:1500, end:3200 },
    { id:"cemetery", name:"3. Cemitério das Velas",  start:3200, end:5000 },
    { id:"bridges",  name:"4. Pontes dos Perdidos",  start:5000, end:7000 },
    { id:"ruins",    name:"5. Ruínas da Memória",    start:7000, end:8800 },
    { id:"arena",    name:"6. Arena da Guardiã",     start:8800, end:11000 }
  ],
  memories: [
    { id:"key",    title:"A Chave",              x:2320, y:405, state:"memoryKey",    dialogue:"memoryKey" },
    { id:"storm",  title:"A Tempestade",         x:3550, y:455, state:"memoryStorm",  dialogue:"memoryStorm" },
    { id:"family", title:"O Retrato da Família", x:4550, y:400, state:"memoryFamily", dialogue:"memoryFamily" },
    { id:"candle", title:"A Última Vela",        x:7480, y:425, state:"memoryCandle", dialogue:"memoryCandle" },
    { id:"letter", title:"Nunca Esquecemos Você",x:8200, y:410, state:"memoryLetter", dialogue:"memoryLetter" }
  ],
  objectives: {
    beforeMeeting: "Siga a única casa iluminada e encontre quem ainda espera.",
    findMemories: "Recupere as memórias de Eleanor",
    goRuins: "Siga as luzes até as Ruínas da Memória.",
    goArena: "As memórias estão completas. Encontre quem as aprisionou.",
    defeatBoss: "Use a Luz da lanterna contra a Guardiã Espectral.",
    completed: "Eleanor encontrou o Caminho de Luz."
  }
};