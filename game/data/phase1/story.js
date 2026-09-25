window.PHASE1_STORY = {
  id: "halloween-1",
  title: "As Casas dos Perdidos",
  subtitle: "A Casa que Continuava Acesa",
  soul: "Eleanor",
  states: {
    metEleanor: "jack-phase1-met-eleanor",
    memoryKey: "jack-phase1-memory-key",
    memoryStorm: "jack-phase1-memory-storm",
    memoryCandle: "jack-phase1-memory-candle",
    eleanorSaved: "jack-phase1-eleanor-saved"
  },
  memories: [
    { id: "key", title: "A Chave", x: 1660, y: 460 },
    { id: "storm", title: "A Tempestade", x: 3380, y: 405 },
    { id: "candle", title: "A Última Vela", x: 4700, y: 490 }
  ],
  objectives: {
    beforeMeeting: "Siga a única luz acesa da vila.",
    findMemories: "Encontre as memórias de Eleanor — 0/3.",
    returnToEleanor: "Volte para Eleanor.",
    completed: "Eleanor encontrou o Caminho de Luz."
  }
};