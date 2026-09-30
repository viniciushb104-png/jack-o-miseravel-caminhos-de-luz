window.PHASE3_STORY=Object.freeze({
  title:"O Bosque das Memórias",
  theme:"Lembrar não é conservar tudo intacto para sempre.",

  dialogues:Object.freeze({
    maraMeeting:Object.freeze([
      {speaker:"MARA ROWAN",portrait:"mara",expression:0,text:"Não pise nas raízes claras. Elas não são apenas raízes. São caminhos que alguém ainda se recusa a esquecer."},
      {speaker:"JACK",portrait:"jack",expression:2,text:"Ótimo. Uma floresta que dá instruções depois de começar a andar ao contrário."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:1,text:"Mara Rowan. Eu guardo nomes, cartas, vozes... tudo o que não deveria desaparecer."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Tudo?"},
      {speaker:"MARA ROWAN",portrait:"mara",expression:4,text:"Quando uma pessoa é esquecida, ela morre de novo."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Já vi o que acontece quando alguém tenta apagar o passado. Não significa que o contrário seja melhor."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"Três retratos adiante perderam seus nomes. Isso nunca aconteceu."},
      {speaker:"JACK",portrait:"jack",expression:3,text:"Então o Bosque está esquecendo?"},
      {speaker:"MARA ROWAN",portrait:"mara",expression:4,text:"Não. O Bosque nunca esquece."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Foi isso que me preocupou."}
    ]),

    portraitsSolved:Object.freeze([
      {speaker:"MARA ROWAN",portrait:"mara",expression:3,text:"Lívia. Tomás. Celina... eu sabia todos os detalhes."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Sabia os nomes."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"Eu também sabia o resto."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Então por que precisou da minha lanterna?"},
      {speaker:"MARA ROWAN",portrait:"mara",expression:4,text:"Porque o Bosque misturou as placas."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Ou porque você guardou tanto que as pessoas começaram a virar fichas."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:5,text:"No lago há vozes. Eu as cataloguei há muitos anos."},
      {speaker:"JACK",portrait:"jack",expression:5,text:"Então vamos descobrir se ainda parecem pessoas."}
    ]),

    voicesSolved:Object.freeze([
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"Essa voz..."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"É sua."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:3,text:"Eu disse isso?"},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Você guardava histórias para que ninguém desaparecesse."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:5,text:"...e esqueci onde a minha começava."},
      {speaker:"JACK",portrait:"jack",expression:5,text:"É difícil encontrar um caminho quando passamos a vida inteira olhando para trás."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"Você fala como se soubesse."},
      {speaker:"JACK",portrait:"jack",expression:2,text:"Eu tenho uma lanterna que aponta para trás. Faça as contas."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:1,text:"Ainda sabe fazer piada."},
      {speaker:"JACK",portrait:"jack",expression:2,text:"É uma memória que pretendo conservar."}
    ]),

    jackMemoryLeak:Object.freeze([
      {speaker:"???",text:"Você prometeu."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Não."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"Jack?"},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Não foi você."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:3,text:"O Bosque mostrou uma lembrança sua?"},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Mostrou uma porta. Só isso."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"O Bosque não escolhe o que devolve."},
      {speaker:"JACK",portrait:"jack",expression:4,text:"Então está na hora de ele aprender a ter limites."}
    ]),

    motherTree:Object.freeze([
      {speaker:"MARA ROWAN",portrait:"mara",expression:4,text:"Mais adiante fica a Árvore-Mãe. Eu nunca deixei ninguém entrar."},
      {speaker:"JACK",portrait:"jack",expression:2,text:"Então deve ser exatamente onde precisamos ir."},
      {speaker:"MARA ROWAN",portrait:"mara",expression:2,text:"Há alguma coisa dentro dela repetindo a mesma ordem."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Qual ordem?"},
      {speaker:"MARA ROWAN",portrait:"mara",expression:5,text:"Não deixe nada ser esquecido."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Ordens simples costumam causar os problemas mais complicados."}
    ])
  }),

  portraitPuzzle:Object.freeze({
    names:Object.freeze(["CELINA MOUR","LÍVIA VALE","TOMÁS BRIAR"]),
    entries:Object.freeze([
      Object.freeze({
        x:2920,
        title:"Retrato da Janela",
        clue:"Ela deixava pão quente na janela de quem passava fome.",
        correct:"LÍVIA VALE"
      }),
      Object.freeze({
        x:3230,
        title:"Retrato da Oficina",
        clue:"Ele consertava brinquedos que ninguém mais queria.",
        correct:"TOMÁS BRIAR"
      }),
      Object.freeze({
        x:3535,
        title:"Retrato do Silêncio",
        clue:"Ela tocava violino quando o bosque ficava silencioso demais.",
        correct:"CELINA MOUR"
      })
    ])
  }),

  voicePuzzle:Object.freeze({
    order:Object.freeze([1,2,0]),
    entries:Object.freeze([
      Object.freeze({x:5000,fragment:"...e esqueci onde a minha começava."}),
      Object.freeze({x:4380,fragment:"Eu guardava histórias..."}),
      Object.freeze({x:4690,fragment:"...para que ninguém desaparecesse..."})
    ])
  })
});