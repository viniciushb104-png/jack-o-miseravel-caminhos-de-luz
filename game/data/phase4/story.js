window.PHASE4_STORY=Object.freeze({
  title:"A Estrada dos Esquecidos",
  theme:"Ser esquecido não significa nunca ter existido.",

  opening:Object.freeze([
    {speaker:"JACK",portrait:"jack",expression:1,text:"As folhas voltaram a cair. Isso é novo."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Minha lanterna também parou de apontar para trás. Não sei se gosto disso."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"...uma parede?"},
    {speaker:"JACK",portrait:"jack",expression:3,text:"Sem porta. Sem fechadura. Claro."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Mara, espero que você soubesse o que estava me dando."}
  ]),

  door:Object.freeze([
    {speaker:"JACK",portrait:"jack",expression:3,text:"A chave está quente."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Não tem fechadura."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Uma chave para uma porta que desapareceu. Finalmente alguma coisa simples."},
    {speaker:"???",text:"A estrada lembra."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Então vamos ver o que ela esqueceu."}
  ]),

  pilgrimMeeting:Object.freeze([
    {speaker:"PEREGRINA",text:"Você ainda tem um nome?"},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Tenho alguns. A maioria não é educada."},
    {speaker:"PEREGRINA",text:"Eu tinha um."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Tinha?"},
    {speaker:"PEREGRINA",text:"Eu sabia quando cheguei aqui."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Então encontramos."},
    {speaker:"PEREGRINA",text:"E se ele não estiver mais aqui?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Tudo deixa algum rastro."},
    {speaker:"PEREGRINA",text:"Você acredita nisso?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Preciso acreditar em alguma coisa."},
    {speaker:"PEREGRINA",text:"Então eu vou com você."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Tem certeza? Eu costumo encontrar problemas."},
    {speaker:"PEREGRINA",text:"Ficar parada também não está me devolvendo nada."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Essa parte eu entendo."}
  ]),

  tracesSolved:Object.freeze([
    {speaker:"PEREGRINA",text:"Não é meu nome."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Não."},
    {speaker:"PEREGRINA",text:"Mas eu voltei. Ajudei alguém a atravessar... e depois voltei outra vez."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Sozinha."},
    {speaker:"PEREGRINA",text:"Eu estava com medo."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"E foi mesmo assim."},
    {speaker:"PEREGRINA",text:"Então isso também era eu?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Era uma coisa que você fez. Às vezes é um lugar melhor para começar do que uma placa."},
    {speaker:"PEREGRINA",text:"Talvez eu não tenha perdido tudo."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Já é mais do que esta estrada queria deixar."}
  ]),

  prototypeEnd:Object.freeze([
    {speaker:"PEREGRINA",text:"As placas daqui estão vazias."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Não vazias. Mexidas."},
    {speaker:"PEREGRINA",text:"Você vê diferença?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Esquecimento costuma deixar ausência. Isto deixou marcas."},
    {speaker:"PEREGRINA",text:"Então procuramos as marcas."},
    {speaker:"JACK",portrait:"jack",expression:4,text:"E, com sorte, descobrimos quem teve tanto trabalho para escondê-las."}
  ]),

  archiveEvidence:Object.freeze([
    Object.freeze({
      x:5005,title:"PROVA I · O RECORTE",short:"RECORTE",
      prompt:"E · EXAMINAR PÁGINA RECORTADA",
      text:"A página está inteira, exceto pela faixa exata onde deveria estar o nome.",
      dialogue:Object.freeze([
        {speaker:"PEREGRINA",text:"O resto da página continua aqui."},
        {speaker:"JACK",portrait:"jack",expression:1,text:"Data, endereço, observações... tudo."},
        {speaker:"PEREGRINA",text:"Menos o nome."},
        {speaker:"JACK",portrait:"jack",expression:5,text:"Esquecimento não usa régua."},
        {speaker:"PEREGRINA",text:"Alguém recortou só o que identificava a pessoa."}
      ])
    }),
    Object.freeze({
      x:5380,title:"PROVA II · AS MARCAS",short:"PLACAS",
      prompt:"E · EXAMINAR SUPORTES VAZIOS",
      text:"Os suportes ainda têm parafusos tortos e contornos limpos onde placas foram arrancadas.",
      dialogue:Object.freeze([
        {speaker:"PEREGRINA",text:"Há dezenas de espaços iguais."},
        {speaker:"JACK",portrait:"jack",expression:1,text:"E os parafusos foram forçados para fora."},
        {speaker:"PEREGRINA",text:"Por que alguém levaria placas sem levar os registros?"},
        {speaker:"JACK",portrait:"jack",expression:1,text:"Porque não queria apagar histórias."},
        {speaker:"PEREGRINA",text:"Queria os nomes."}
      ])
    }),
    Object.freeze({
      x:5760,title:"PROVA III · O INVENTÁRIO",short:"INVENTÁRIO",
      prompt:"E · EXAMINAR INVENTÁRIO",
      text:"Um inventário enumera nomes removidos como itens recebidos. Nenhum deles está marcado como destruído.",
      dialogue:Object.freeze([
        {speaker:"PEREGRINA",text:"Isto diz 'recebido'."},
        {speaker:"JACK",portrait:"jack",expression:1,text:"Não 'apagado'. Não 'perdido'."},
        {speaker:"PEREGRINA",text:"Recebido por quem?"},
        {speaker:"???",text:"NOMES NÃO DEVEM DESAPARECER."},
        {speaker:"JACK",portrait:"jack",expression:4,text:"Ah. Então alguém resolveu guardá-los."},
        {speaker:"PEREGRINA",text:"Sem perguntar a ninguém."}
      ])
    })
  ]),

  archiveSolved:Object.freeze([
    {speaker:"PEREGRINA",text:"Primeiro recortaram os nomes. Depois arrancaram as placas. Depois registraram a chegada deles."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Isto não é um lugar que esqueceu."},
    {speaker:"PEREGRINA",text:"É um lugar de onde alguém está recolhendo nomes."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"E levando todos para a mesma direção."},
    {speaker:"PEREGRINA",text:"A estrada depois do arquivo."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Ótimo. Agora temos um ladrão, uma trilha e péssimas intenções."},
    {speaker:"???",text:"NENHUM NOME SERÁ PERDIDO."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Isso não soa como ameaça."},
    {speaker:"PEREGRINA",text:"Talvez seja pior. Soa como justificativa."}
  ]),

  bridgeFear:Object.freeze([
    {speaker:"PEREGRINA",text:"Eu não gosto dessa ponte."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Ela também não parece gostar de nós."},
    {speaker:"PEREGRINA",text:"Não. É a altura."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Você lembra que tinha medo?"},
    {speaker:"PEREGRINA",text:"Meu corpo lembra."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Medo também é um rastro."},
    {speaker:"PEREGRINA",text:"Isso deveria me consolar?"},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Não particularmente. Mas significa que ainda é seu."}
  ]),

  bridgeNameGlitch:Object.freeze([
    {speaker:"PEREGRINA",text:"Jack... essa placa acendeu quando você passou."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Ela devia registrar quem atravessou."},
    {speaker:"PEREGRINA",text:"Está tentando escrever alguma coisa."},
    {speaker:"JACK",portrait:"jack",expression:3,text:"J..."},
    {speaker:"PEREGRINA",text:"Sumiu."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Tente outra vez."},
    {speaker:"PEREGRINA",text:"Não fui eu."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Eu sei."},
    {speaker:"PEREGRINA",text:"A estrada também não consegue lembrar você?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Parece que ela está tentando esquecer a pessoa errada."}
  ]),

  bridgeCrossed:Object.freeze([
    {speaker:"PEREGRINA",text:"Eu ainda estou com medo."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Ótimo."},
    {speaker:"PEREGRINA",text:"Ótimo?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Você teve medo e atravessou mesmo assim. Eu guardaria essa parte."},
    {speaker:"PEREGRINA",text:"Talvez eu tenha feito isso antes."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Então seus pés lembram mais de você do que as placas."}
  ]),

  stolenPlaza:Object.freeze([
    {speaker:"PEREGRINA",text:"Essas placas... todas parecem familiares."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Talvez porque tenham sido arrancadas do mesmo lugar que os registros."},
    {speaker:"PEREGRINA",text:"E se uma delas for minha?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Então seu nome pode estar aqui."},
    {speaker:"PEREGRINA",text:"E eu?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Você está aqui comigo. Não confunda as duas coisas."},
    {speaker:"PEREGRINA",text:"Tem vozes entre as placas."},
    {speaker:"JACK",portrait:"jack",expression:4,text:"Então vamos ouvir antes que alguém resolva catalogá-las também."}
  ]),

  plazaEchoes:Object.freeze([
    Object.freeze({
      x:8125,title:"ECO I · O PÃO",short:"CHEIRO DE PÃO",
      text:"Uma voz lembra o cheiro de pão antes do amanhecer, mas nenhuma placa reage a ela.",
      dialogue:Object.freeze([
        {speaker:"VOZ",text:"Eu gostava do cheiro de pão antes do amanhecer."},
        {speaker:"PEREGRINA",text:"Eu... conheço esse cheiro."},
        {speaker:"JACK",portrait:"jack",expression:1,text:"Conhecer não significa que a voz seja sua."},
        {speaker:"PEREGRINA",text:"E nenhuma placa respondeu."},
        {speaker:"JACK",portrait:"jack",expression:5,text:"Então alguém separou a lembrança do nome."}
      ])
    }),
    Object.freeze({
      x:8440,title:"ECO II · A RISADA",short:"UMA RISADA",
      text:"A voz recorda alguém rindo quando ela ficava brava. O nome correspondente continua impossível de identificar.",
      dialogue:Object.freeze([
        {speaker:"VOZ",text:"Alguém sempre ria quando eu ficava brava."},
        {speaker:"PEREGRINA",text:"Eu lembro disso."},
        {speaker:"JACK",portrait:"jack",expression:3,text:"Desta vez você tem certeza?"},
        {speaker:"PEREGRINA",text:"Não. Só tenho certeza da sensação."},
        {speaker:"JACK",portrait:"jack",expression:5,text:"Talvez seja exatamente isso que ele não consegue guardar numa placa."}
      ])
    }),
    Object.freeze({
      x:8740,title:"ECO III · A TEMPESTADE",short:"UMA MÃO NA TEMPESTADE",
      text:"Uma voz lembra ter segurado a mão de alguém durante uma tempestade. O nome continua em outro lugar.",
      dialogue:Object.freeze([
        {speaker:"VOZ",text:"Eu segurei uma mão durante uma tempestade. Não soltei até passar."},
        {speaker:"PEREGRINA",text:"Essa memória é minha."},
        {speaker:"JACK",portrait:"jack",expression:1,text:"Como sabe?"},
        {speaker:"PEREGRINA",text:"Não sei o nome de ninguém nela. Mas lembro do medo na mão da outra pessoa."},
        {speaker:"JACK",portrait:"jack",expression:5,text:"Então ele ficou com o rótulo. Você ficou com a parte que aconteceu."}
      ])
    })
  ]),

  plazaSolved:Object.freeze([
    {speaker:"PEREGRINA",text:"As vozes continuam aqui. As placas também. Mas não estão juntas."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Ele não está guardando pessoas."},
    {speaker:"PEREGRINA",text:"Está guardando nomes."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Como se possuir o nome fosse possuir quem viveu."},
    {speaker:"PEREGRINA",text:"E se meu nome estiver no meio deles?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Ainda será seu para escolher. Não dele."}
  ]),

  collectorGlimpse:Object.freeze([
    {speaker:"???",text:"NOMES SÃO O QUE RESTA QUANDO TODO O RESTO DESAPARECE."},
    {speaker:"PEREGRINA",text:"Ele está ali."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Só parte dele."},
    {speaker:"???",text:"EU OS GUARDEI QUANDO NINGUÉM MAIS GUARDOU."},
    {speaker:"JACK",portrait:"jack",expression:4,text:"Guardar não costuma exigir arrancar."},
    {speaker:"???",text:"VOCÊ AINDA CARREGA UM NOME. NÃO ENTENDERIA."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Engraçado. A estrada acabou de discordar de você."}
  ]),

  collectorApproach:Object.freeze([
    {speaker:"PEREGRINA",text:"Se ele tiver meu nome..."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Você decide o que fazer com ele."},
    {speaker:"PEREGRINA",text:"E se eu quiser de volta?"},
    {speaker:"JACK",portrait:"jack",expression:4,text:"Então pegamos de volta."},
    {speaker:"PEREGRINA",text:"E se eu descobrir que não preciso dele?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Então continuamos andando."}
  ]),

  arenaEdge:Object.freeze([
    {speaker:"PEREGRINA",text:"Você vai entrar sozinho?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Só até descobrir o que existe lá dentro."},
    {speaker:"PEREGRINA",text:"Isso é o que pessoas imprudentes dizem antes de fazer alguma coisa imprudente."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Ótimo. Você está recuperando o senso crítico."},
    {speaker:"PEREGRINA",text:"Jack."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Eu volto."}
  ]),

  collectorBossIntro:Object.freeze([
    {speaker:"COLETOR",text:"VOCÊ ENTROU NUM LUGAR ONDE NENHUM NOME PRECISA MORRER."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Curioso. Eles parecem presos."},
    {speaker:"COLETOR",text:"PRESOS? EU OS SALVEI."},
    {speaker:"JACK",portrait:"jack",expression:4,text:"Você arrancou nomes de pessoas que ainda estavam usando eles."},
    {speaker:"COLETOR",text:"PESSOAS DESAPARECEM. NOMES PODEM PERMANECER."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Então vamos descobrir o que sobra quando você larga alguns."}
  ]),

  collectorArmorBreak:Object.freeze([
    {speaker:"COLETOR",text:"PARE. ELES SERÃO ESQUECIDOS."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Você não sabe disso."},
    {speaker:"COLETOR",text:"SEM ELES, NÃO SOBRA NADA."},
    {speaker:"PEREGRINA",text:"Então por que ainda consigo ver você?"},
    {speaker:"COLETOR",text:"..."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Acho que chegamos à parte que a sua coleção não consegue responder."}
  ]),

  collectorActTwo:Object.freeze([
    {speaker:"COLETOR",text:"DEVOLVA-OS."},
    {speaker:"JACK",portrait:"jack",expression:4,text:"Eles nunca foram seus."},
    {speaker:"COLETOR",text:"EU OS MANTIVE VIVOS."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Você manteve etiquetas vivas. As pessoas continuaram sem você."}
  ]),

  collectorExhausted:Object.freeze([
    {speaker:"COLETOR",text:"NÃO..."},
    {speaker:"COLETOR",text:"SEM OS NOMES..."},
    {speaker:"PEREGRINA",text:"Ele ficou menor."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Não. Agora estamos vendo o tamanho que sempre esteve ali."},
    {speaker:"COLETOR",text:"SE NINGUÉM DISSER MEU NOME... O QUE SOBRA?"}
  ]),

  collectorRecognized:Object.freeze([
    {speaker:"JACK",portrait:"jack",expression:5,text:"Você."},
    {speaker:"COLETOR",text:"..."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Antes do nome. Depois dele. Você."},
    {speaker:"PEREGRINA",text:"Então ser lembrado não é ser possuído por uma palavra."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Parece que não."},
    {speaker:"COLETOR",text:"EU NÃO SEI O QUE FAZER SEM ELES."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Pode começar soltando o que nunca foi seu."}
  ]),

  collectorRelease:Object.freeze([
    {speaker:"COLETOR",text:"SE EU SOLTAR OS NOMES... ELES PODEM DESAPARECER."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Também podem voltar para quem quiser carregá-los."},
    {speaker:"COLETOR",text:"E OS QUE NINGUÉM RECLAMAR?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Continuam tendo pertencido a alguém."},
    {speaker:"PEREGRINA",text:"Você não precisa possuir uma coisa para admitir que ela existiu."},
    {speaker:"COLETOR",text:"...ENTÃO EU POSSO SOLTAR."}
  ]),

  pilgrimChoice:Object.freeze([
    {speaker:"PEREGRINA",text:"Talvez meu nome esteja no meio deles."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Pode estar."},
    {speaker:"PEREGRINA",text:"Passei tanto tempo esperando que ele me dissesse quem eu era."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"E agora?"},
    {speaker:"PEREGRINA",text:"Agora eu lembro que voltei. Amparei alguém. Tive medo. Atravessei."},
    {speaker:"PEREGRINA",text:"Se um dia eu quiser meu nome de volta, eu procuro."},
    {speaker:"PEREGRINA",text:"Mas não vou continuar parada esperando por ele."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Parece um bom jeito de continuar existindo."}
  ]),

  bellGift:Object.freeze([
    {speaker:"PEREGRINA",text:"Antes de ir... eu acordei nesta estrada com isto no bolso."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Um sino."},
    {speaker:"PEREGRINA",text:"Sem nome. Sem inscrição. Mesmo assim, ainda toca."},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Estamos criando um padrão."},
    {speaker:"PEREGRINA",text:"Fique com ele."},
    {speaker:"PEREGRINA",text:"Se encontrar alguém que esqueceu para onde estava indo... chame."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Mesmo sem saber o nome?"},
    {speaker:"PEREGRINA",text:"Principalmente."}
  ]),

  jackPromiseMemory:Object.freeze([
    {speaker:"???",text:"Você prometeu."},
    {speaker:"JACK",portrait:"jack",expression:3,text:"..."},
    {speaker:"MEMÓRIA DE JACK",text:"Eu volto."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Eu disse isso."},
    {speaker:"PEREGRINA",text:"Para quem?"},
    {speaker:"JACK",portrait:"jack",expression:3,text:"Ainda não lembro."},
    {speaker:"???",text:"Encontre o caminho de volta."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Pelo menos agora sei o que prometi."}
  ]),

  phase4Farewell:Object.freeze([
    {speaker:"PEREGRINA",text:"Vai esperar essa porta abrir?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Não."},
    {speaker:"PEREGRINA",text:"Mesmo sem saber para onde ela leva?"},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Esperar parado não ajudou nenhum de nós até agora."},
    {speaker:"PEREGRINA",text:"Então eu sigo por aqui."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"E eu continuo pela estrada."},
    {speaker:"PEREGRINA",text:"Sem saber onde termina?"},
    {speaker:"JACK",portrait:"jack",expression:2,text:"Nunca pareceu ser requisito."}
  ]),

  traceReveals:Object.freeze([
    Object.freeze([
      {speaker:"PEREGRINA",text:"Essas pegadas chegam até a vala..."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"E dão meia-volta."},
      {speaker:"PEREGRINA",text:"Por quê?"},
      {speaker:"JACK",portrait:"jack",expression:5,text:"Talvez quem deixou isso aqui tenha percebido que alguém ficou para trás."}
    ]),
    Object.freeze([
      {speaker:"PEREGRINA",text:"Agora são duas pessoas."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Uma delas mancava. A outra reduziu o passo."},
      {speaker:"PEREGRINA",text:"Ela estava sustentando a pessoa ferida."},
      {speaker:"JACK",portrait:"jack",expression:5,text:"Não precisamos do nome dela para saber disso."}
    ]),
    Object.freeze([
      {speaker:"PEREGRINA",text:"A segunda trilha segue para longe..."},
      {speaker:"JACK",portrait:"jack",expression:1,text:"Mas estas pegadas voltam."},
      {speaker:"PEREGRINA",text:"Sozinhas."},
      {speaker:"JACK",portrait:"jack",expression:5,text:"Mais fundas na lama. Mais cansadas. E na direção do perigo."},
      {speaker:"PEREGRINA",text:"Eu conheço esse medo."}
    ])
  ]),

  traces:Object.freeze([
    Object.freeze({
      x:3520,title:"Rastro I",memoryLabel:"VOLTOU",
      text:"Pegadas chegam à vala, param... e retornam para buscar alguém que ficou para trás."
    }),
    Object.freeze({
      x:3910,title:"Rastro II",memoryLabel:"AMPAROU",
      text:"Duas trilhas seguem juntas. Uma manca; a outra reduz o passo e a sustenta."
    }),
    Object.freeze({
      x:4300,title:"Rastro III",memoryLabel:"VOLTOU DE NOVO",
      text:"A pessoa ferida segue para longe. As mesmas pegadas retornam sozinhas, mais profundas na lama."
    })
  ]),

  sections:Object.freeze([
    Object.freeze({x:0,name:"A PORTA QUE NÃO EXISTE"}),
    Object.freeze({x:1050,name:"ESTRADA SEM PLACAS"}),
    Object.freeze({x:2150,name:"POVOADO SEM NOMES"}),
    Object.freeze({x:3250,name:"CAMPO DAS PEGADAS"}),
    Object.freeze({x:4700,name:"ARQUIVO RASURADO"}),
    Object.freeze({x:6100,name:"PONTE DOS NINGUÉM"}),
    Object.freeze({x:7900,name:"PRAÇA DOS NOMES ROUBADOS"}),
    Object.freeze({x:9300,name:"CASA DO COLETOR"}),
    Object.freeze({x:10600,name:"ARENA DO COLETOR"})
  ])
});