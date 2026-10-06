(() => {
  const STORAGE_KEY='jack-language';
  const SUPPORTED=['pt-BR','en','es','fr','zh-CN','ko','ja'];
  const currentLang=()=>SUPPORTED.includes(localStorage.getItem(STORAGE_KEY))?localStorage.getItem(STORAGE_KEY):'pt-BR';
  const BASE=()=>currentLang()!=='pt-BR';

  const exact={
    // Shared UI
    'CAMINHOS DE LUZ':'PATHS OF LIGHT','VIDA':'LIFE','MÚSICA':'MUSIC','LUZ':'LIGHT','AÇÃO':'ACTION',
    'OBJETIVO':'OBJECTIVE','CONTROLES':'CONTROLS','CONVERSAR':'TALK','INTERAGIR':'INTERACT','PULAR':'JUMP',
    'PAUSA':'PAUSE','PAUSAR':'PAUSE','CONTINUAR':'CONTINUE','RECOMEÇAR':'RESTART','VOLTAR':'BACK',
    'JOGAR NOVAMENTE':'PLAY AGAIN','REJOGAR HALLOWEEN IV':'REPLAY HALLOWEEN IV','REJOGAR HALLOWEEN V':'REPLAY HALLOWEEN V',
    'PRÓXIMA FASE':'NEXT CHAPTER','MEMÓRIA':'MEMORY','MEMÓRIAS':'MEMORIES','FRAGMENTO':'FRAGMENT','FRAGMENTOS':'FRAGMENTS',
    'CONQUISTA DESBLOQUEADA':'ACHIEVEMENT UNLOCKED','♫ AGORA TOCANDO':'♫ NOW PLAYING',
    'ILUMINANDO O CAMINHO...':'LIGHTING THE PATH...','OUVINDO AS RAÍZES...':'LISTENING TO THE ROOTS...',
    'PROCURANDO OS RASTROS...':'SEARCHING FOR TRACES...','PROCURANDO O CAMINHO DE VOLTA...':'SEARCHING FOR THE WAY BACK...',
    '↻ Gire o celular para jogar na horizontal':'↻ Rotate your phone to play in landscape',
    '‹ MAPA':'‹ MAP','Voltar ao mapa':'Back to Map','⌂ VOLTAR ÀS FASES':'⌂ BACK TO CHAPTERS',
    '⌂ VOLTAR AO MENU PRINCIPAL':'⌂ BACK TO MAIN MENU',
    'Silenciar música':'Mute music','Ativar música':'Enable music','Próxima fala':'Next line',
    'Mover para a esquerda':'Move left','Mover para a direita':'Move right','Abaixar':'Crouch','Usar a luz':'Use Light',
    'Carregando caminho':'Loading path','Carregando...':'Loading...','Carregando':'Loading',
    'DISSIPADO PELA LUZ':'DISPELLED BY THE LIGHT','MEMÓRIA REVIVIDA':'MEMORY REVIVED',
    'MEMÓRIA RECONSTRUÍDA — OS SINOS':'MEMORY REBUILT — THE BELLS',
    'MEMÓRIA RECONSTRUÍDA — OS RETRATOS':'MEMORY REBUILT — THE PORTRAITS',
    'MEMÓRIA RECONSTRUÍDA — A VOZ DE MARA':'MEMORY REBUILT — MARA\'S VOICE',
    'UMA MEMÓRIA QUE NÃO PERTENCE AO BOSQUE':'A MEMORY THAT DOES NOT BELONG TO THE FOREST',
    'ITEM DA JORNADA — CHAVE DE MADEIRA DE MARA':'JOURNEY ITEM — MARA\'S WOODEN KEY',
    'MEMÓRIA RECUPERADA — MARA ROWAN':'MEMORY RECOVERED — MARA ROWAN',
    'MEMÓRIA REVIVIDA — MARA ROWAN':'MEMORY REVIVED — MARA ROWAN',
    'HALLOWEEN IV CONCLUÍDO':'HALLOWEEN IV COMPLETE','CAMINHOS DE LUZ · CONCLUÍDO':'PATHS OF LIGHT · COMPLETE',
    'SINO SEM INSCRIÇÃO':'UNINSCRIBED BELL','ITEM · SINO SEM INSCRIÇÃO':'ITEM · UNINSCRIBED BELL',
    'A ÚLTIMA LANTERNA':'THE LAST LANTERN','O MISERÁVEL':'THE MISERABLE','MISERÁVEL':'MISERABLE',
    'AGORA':'NOW','ESTRADA':'ROAD','JANELA':'WINDOW','ANTES':'BEFORE','ONTEM':'YESTERDAY','DEPOIS':'AFTER',

    // Halloween I
    'Halloween I — As Casas dos Perdidos':'Halloween I — The Houses of the Lost',
    'AS CASAS DOS PERDIDOS':'THE HOUSES OF THE LOST','AS CASAS':'THE HOUSES','DOS PERDIDOS':'OF THE LOST',
    'As Casas dos Perdidos':'The Houses of the Lost','A Guardiã da Última Lanterna':'The Guardian of the Last Lantern',
    'GUARDIÃ DA ÚLTIMA LANTERNA':'GUARDIAN OF THE LAST LANTERN',
    'Siga a única casa iluminada e encontre quem ainda espera.':'Follow the only lit house and find whoever is still waiting.',
    'A luz de Jack desperta lembranças que alguém tentou apagar.':'Jack\'s light awakens memories someone tried to erase.',
    '✦ INICIAR JORNADA':'✦ START JOURNEY','✦ O CAMINHO SE ABRIU ✦':'✦ THE PATH HAS OPENED ✦',
    'Eleanor encontrou a luz':'Eleanor found the light',
    'A primeira alma foi libertada. A conclusão fica salva — e você pode atravessar esta noite novamente quando quiser.':'The first soul has been freed. Your completion is saved — and you can cross this night again whenever you wish.',
    '✦ Prosseguir para Halloween II':'✦ Continue to Halloween II','↻ Jogar novamente':'↻ Play Again',
    'Uma Luz na Escuridão':'A Light in the Darkness','MEMÓRIA REVIVIDA':'MEMORY REVIVED',
    'A Arena da Guardiã foi aberta.':'The Guardian\'s Arena has opened.',
    'A luz está mais forte. Você encontrou alguma coisa?':'The light is stronger. Did you find something?',
    'Eu consigo sentir o caminho... mas alguma coisa ainda o bloqueia.':'I can feel the path... but something still blocks it.',
    'Ainda estou juntando as peças.':'I\'m still putting the pieces together.','Eu vou cuidar do bloqueio.':'I\'ll take care of what is blocking it.',
    'Eco dissipado pela Luz.':'Echo dispelled by the Light.','A última lanterna trouxe Jack de volta.':'The last lantern brought Jack back.',
    'Eleanor encontrou a luz · Troféu e memória adicionados ao arquivo':'Eleanor found the light · Trophy and memory added to the archive',
    'Halloween I concluído novamente':'Halloween I completed again',
    'Cinco memórias precisam iluminar este selo.':'Five memories must illuminate this seal.',
    'A lanterna guardou seu último checkpoint. Continue de onde a chama ficou acesa.':'The lantern saved your last checkpoint. Continue from where the flame remained lit.',
    '✦ CONTINUAR JORNADA':'✦ CONTINUE JOURNEY','✦ CONTINUAR REPLAY':'✦ CONTINUE REPLAY','↻ JOGAR NOVAMENTE':'↻ PLAY AGAIN',

    // Halloween II static
    'Halloween II — A Vila sem Amanhecer · Protótipo':'Halloween II — The Village Without Dawn',
    'HALLOWEEN II · PROTÓTIPO':'HALLOWEEN II','A VILA SEM AMANHECER':'THE VILLAGE WITHOUT DAWN',
    'A VILA SEM':'THE VILLAGE','AMANHECER':'WITHOUT DAWN','ENGRENAGENS':'GEARS',
    'Siga pela estrada e descubra por que a vila nunca amanhece.':'Follow the road and discover why dawn never comes to the village.',
    '4:13 — A Vila sem Amanhecer':'4:13 — The Village Without Dawn',
    'Todos os relógios marcam 4:13. Alguém ainda acredita que pode consertar aquela noite.':'Every clock reads 4:13. Someone still believes that night can be repaired.',
    '✦ ENTRAR NA VILA':'✦ ENTER THE VILLAGE','A SOMBRA DAS 4:13':'THE SHADOW OF 4:13',
    'O PRIMEIRO MINUTO':'THE FIRST MINUTE','O Primeiro Minuto':'The First Minute',
    'Halloween II · Troféu adicionado às Memórias':'Halloween II · Trophy added to Memories',
    'CAMINHOS DE LUZ · HALLOWEEN II':'PATHS OF LIGHT · HALLOWEEN II',
    '4:14 — O PRÓXIMO MINUTO':'4:14 — THE NEXT MINUTE',
    'Amélia deixou as 4:13 para trás. O caminho de Jack continua.':'Amélia left 4:13 behind. Jack\'s path continues.',
    'O que deseja fazer?':'What would you like to do?','✦ IR PARA HALLOWEEN III':'✦ GO TO HALLOWEEN III',
    'Halloween III · O Bosque das Memórias já começou a despertar.':'Halloween III · The Forest of Memories has already begun to awaken.',
    'LUZ ANCORADA — CHECKPOINT ATIVADO':'ANCHORED LIGHT — CHECKPOINT ACTIVATED',
    'Outra vila. Outra noite. E nenhum sinal do amanhecer.':'Another village. Another night. And no sign of dawn.',
    'Curioso... até os relógios quebrados daqui conseguiram concordar: 4:13.':'Funny... even the broken clocks here managed to agree: 4:13.',
    'Não toque nos relógios, forasteiro. Eles já dão trabalho suficiente parados.':'Do not touch the clocks, stranger. They are trouble enough while standing still.',
    'Você não é daqui.':'You are not from here.',
    'Foi a lanterna que denunciou ou o fato de eu ainda estar andando para algum lugar?':'Was it the lantern that gave me away, or the fact that I am still walking somewhere?',
    'Sou Amélia Vesper. Relojoeira. Quando eu consertar o relógio da praça, o sol vai nascer.':'I am Amélia Vesper. Clockmaker. When I repair the town clock, the sun will rise.',
    'Há quanto tempo está tentando?':'How long have you been trying?',
    '... Encontre as três engrenagens. Horas. Minutos. Amanhecer. Depois conversamos.':'... Find the three gears. Hours. Minutes. Dawn. Then we talk.',
    'A Engrenagem das Horas... ainda estava aqui.':'The Hour Gear... it was still here.',
    'Você fala dela como quem esperava que tivesse desaparecido.':'You speak of it like you expected it to be gone.',
    'Minutos. Engraçado como poucos deles podem mudar uma vida inteira.':'Minutes. Funny how a few of them can change an entire life.',
    'Não filosofe com peças de relógio, Jack.':'Do not philosophize with clock parts, Jack.',
    'A Engrenagem do Amanhecer...':'The Dawn Gear...',
    'Você não parece feliz por eu ter encontrado.':'You do not look happy that I found it.',
    'Leve-a até a Torre. Agora.':'Take it to the Tower. Now.',
    'Pare. Não coloque as três peças no mecanismo.':'Stop. Do not put all three pieces into the mechanism.',
    'Você nunca quis consertar o relógio.':'You never wanted to repair the clock.',
    'Eu só precisava de mais cinco minutos naquela noite.':'I only needed five more minutes that night.',
    'E desde então mantém todo mundo preso nesses cinco minutos.':'And ever since, you have kept everyone trapped inside those five minutes.',
    'Se pudesse voltar à pior noite da sua vida... não voltaria?':'If you could return to the worst night of your life... would you not?',
    'Mas uma lanterna não serve para apagar o que aconteceu. Serve para enxergar o caminho depois.':'A lantern is not meant to erase what happened. It is meant to show the path after it.',
    'Jack... afaste-se. Eu consigo sentir as 4:13 outra vez.':'Jack... step back. I can feel 4:13 again.',
    'Amélia? O que está acontecendo com a sua sombra?':'Amélia? What is happening to your shadow?',
    'Não é o relógio que está preso naquela noite. Sou eu.':'It is not the clock trapped in that night. It is me.',
    'Eu segurei aquele instante com tanta força... que ele aprendeu a me segurar também.':'I held that moment so tightly... that it learned to hold me too.',
    'Então solte.':'Then let go.','Eu não sei se consigo.':'I do not know if I can.',
    'Cinco minutos... só mais cinco minutos...':'Five minutes... just five more minutes...',
    'Não escute. Isso é tudo o que eu não consegui deixar ir.':'Do not listen. That is everything I could not let go.',
    'Então eu não vou lutar contra você.':'Then I will not fight you.',
    'Vou lutar contra o minuto que te prendeu.':'I will fight the minute that trapped you.',
    'Jack... ele ainda está parado.':'Jack... it is still stopped.',
    'Então talvez esteja esperando você deixá-lo continuar.':'Then maybe it is waiting for you to let it continue.',
    'Então... era só deixar o minuto passar.':'So... I only had to let the minute pass.',
    'Não. Era aceitar que ele já tinha passado.':'No. You had to accept that it had already passed.',
    'Eu tinha esquecido que existia um minuto depois.':'I had forgotten there was a minute after.',
    'E agora?':'And now?','Agora você vive nele.':'Now you live in it.','... Então eu vou tentar.':'... Then I will try.',
    '4:14. Pela primeira vez, a vila tem um minuto depois.':'4:14. For the first time, the village has a minute after.',
    'O ÚLTIMO MINUTO FOI DISSIPADO':'THE LAST MINUTE WAS DISPELLED','CONTINUAR SEM A CUTSCENE':'CONTINUE WITHOUT CUTSCENE',
    'SOMBRA DE AMÉLIA — O ÚLTIMO MINUTO':'AMÉLIA\'S SHADOW — THE LAST MINUTE',
    'A dor das 4:13 tomou forma. Use a LUZ para libertá-la.':'The pain of 4:13 has taken form. Use the LIGHT to free it.',
    'SELO DO TOPO:':'SUMMIT SEAL:','ENGRENAGEM DAS HORAS':'HOUR GEAR','ENGRENAGEM DOS MINUTOS':'MINUTE GEAR',
    'ENGRENAGEM DO AMANHECER':'DAWN GEAR','AMÉLIA RELOJOEIRA':'AMÉLIA THE CLOCKMAKER','AMÉLIA CRIANÇA':'YOUNG AMÉLIA',
    'AMÉLIA E A TORRE':'AMÉLIA AND THE TOWER','AMÉLIA APRENDIZ':'AMÉLIA THE APPRENTICE',
    'Uma infância antes das 4:13.':'A childhood before 4:13.','O tempo virou ofício.':'Time became a craft.','E então veio a Torre.':'And then came the Tower.',
    'Lar da Abóbora':'Pumpkin Home','Casa dos Relógios':'House of Clocks','Pedestal da Esquerda':'Left Pedestal','Pedestal da Direita':'Right Pedestal',
    'ESTRADA DAS LANTERNAS MORTAS':'ROAD OF DEAD LANTERNS','PRAÇA DAS 4:13':'4:13 SQUARE','DISTRITO DOS SINOS':'BELL DISTRICT',
    'CAMINHO DA TORRE':'TOWER PATH','A TORRE DAS 4:13':'THE TOWER OF 4:13',
    'Três lares reacenderam. A vila ainda se lembra de como era estar viva.':'Three homes are lit again. The village still remembers what it was like to be alive.',
    'Uma chama respondeu à lanterna. O primeiro lar recordou seu calor.':'A flame answered the lantern. The first home remembered its warmth.',
    'Os relógios estremeceram. O segundo lar deixou as 4:13 respirarem.':'The clocks trembled. The second home let 4:13 breathe.',
    'A vila não respondeu. Talvez os sinais tenham uma ordem...':'The village did not answer. Perhaps the signs have an order...',
    'AS SOMBRAS ENCONTRARAM O CAMINHO':'THE SHADOWS FOUND THE PATH',
    'A última sombra aponta para a Torre. O minuto perdido deixou uma trilha.':'The last shadow points to the Tower. The lost minute left a trail.',
    'A sombra central se moveu. Seu rastro aponta para a esquerda.':'The center shadow moved. Its trail points left.',
    'A segunda sombra respondeu. Agora o rastro atravessa para a direita.':'The second shadow answered. Now the trail crosses to the right.',
    'As sombras se dispersaram. Observe qual delas oferece o primeiro caminho...':'The shadows scattered. Watch which one offers the first path...',
    'Os dois selos temporais despertaram. O mecanismo do topo aguarda as três engrenagens.':'Both temporal seals awakened. The summit mechanism awaits the three gears.',
    'CORVO DO MINUTO MORTO':'CROW OF THE DEAD MINUTE','ESPECTRO DAS 4:13':'SPECTER OF 4:13','SINEIRO SEM HORA':'TIMELESS BELLRINGER',
    'VIGIA DAS JANELAS':'WINDOW WATCHER','SENTINELA DO RELÓGIO':'CLOCK SENTINEL','DISTORÇÃO':'DISTORTION',
    'O tempo voltou a respirar.':'Time began to breathe again.','AMÉLIA — LIVRE':'AMÉLIA — FREE','AMÉLIA':'AMÉLIA',
    'SUBIDA DA TORRE — siga as plataformas ao redor do relógio':'TOWER ASCENT — follow the platforms around the clock',

    // Halloween III static/gameplay
    'Halloween III — O Bosque das Memórias':'Halloween III — The Forest of Memories','O BOSQUE DAS MEMÓRIAS':'THE FOREST OF MEMORIES',
    'O BOSQUE DAS':'THE FOREST OF','MEMÓRIAS':'MEMORIES','Siga as folhas que caem para o céu.':'Follow the leaves that fall toward the sky.',
    'Algumas lembranças criam raízes profundas. Outras aprendem a crescer sobre quem tenta guardá-las.':'Some memories grow deep roots. Others learn to grow over those who try to keep them.',
    '✦ ENTRAR NO BOSQUE':'✦ ENTER THE FOREST','LUZ DA MEMÓRIA':'MEMORY LIGHT',
    'Mara aprendeu que lembrar não é manter tudo preso. Pela primeira vez, as folhas voltaram a cair.':'Mara learned that remembering does not mean keeping everything trapped. For the first time, the leaves began to fall again.',
    '“Talvez essa seja a pergunta que ainda lhe resta.”':'“Perhaps that is the question still left to you.”',
    'O caminho de Jack continua.':'Jack\'s path continues.','✦ IR PARA HALLOWEEN IV':'✦ GO TO HALLOWEEN IV',
    'Halloween IV · A Estrada dos Esquecidos foi revelada além da névoa.':'Halloween IV · The Road of the Forgotten has been revealed beyond the fog.',
    'ESTRADA DE 4:14':'ROAD FROM 4:14','O LIMIAR DAS RAÍZES':'THE ROOT THRESHOLD','BOSQUE DOS RETRATOS':'FOREST OF PORTRAITS',
    'LAGO DAS VOZES':'LAKE OF VOICES','ARQUIVO DAS RAÍZES':'ROOT ARCHIVE','CAMINHO DA ÁRVORE-MÃE':'PATH TO THE MOTHER TREE',
    'O CORAÇÃO DAS RAÍZES':'THE HEART OF THE ROOTS','Árvore da Primeira Lembrança':'Tree of the First Memory',
    'Salgueiro das Vozes':'Willow of Voices','Raiz do Arquivo':'Archive Root','RAIZ DE LUZ — CHECKPOINT':'ROOT OF LIGHT — CHECKPOINT',
    'F · despertar memória':'F · awaken memory','QUAL DESTAS LEMBRANÇAS':'WHICH OF THESE MEMORIES','CAIXA DE MÚSICA':'MUSIC BOX',
    'MEMÓRIA OUVIDA':'MEMORY HEARD','DEIXAR IR — SEM APAGAR':'LET GO — WITHOUT ERASING',
    'MEMÓRIA NÃO APAGADA — LIBERTADA':'MEMORY NOT ERASED — RELEASED',
    'As raízes soltaram o caminho para a Árvore-Mãe.':'The roots released the path to the Mother Tree.',
    'Mara ergueu a própria lanterna e seguiu em direção ao Lago das Vozes.':'Mara raised her own lantern and headed toward the Lake of Voices.',
    'MARA POUSOU NO LAGO DAS VOZES':'MARA REACHED THE LAKE OF VOICES',
    'O Eco ainda está adormecido. Use F para escutar o fragmento primeiro.':'The Echo is still asleep. Use F to hear the fragment first.',
    'A voz está desperta, mas a conexão enfraqueceu. Erga novamente a Luz da Memória.':'The voice is awake, but the connection weakened. Raise the Memory Light again.',
    'A frase se perdeu na água. Os Ecos continuam despertos — reorganize a sequência.':'The phrase was lost in the water. The Echoes remain awake — reorder the sequence.',
    'Mara correu para o Arquivo das Raízes.':'Mara ran toward the Root Archive.','MARA CHEGOU AO ARQUIVO DAS RAÍZES':'MARA REACHED THE ROOT ARCHIVE',
    'O CORAÇÃO DA ORDEM FOI EXPOSTO':'THE HEART OF THE COMMAND WAS EXPOSED',
    'A ordem ganhou corpo. Tente usar a Luz no Arquivista.':'The command took form. Try using the Light on the Archivist.',
    'Procure os três rostos presos ao redor do Arquivista e ilumine cada um.':'Find the three faces trapped around the Archivist and illuminate each one.',
    'A Luz toca o corpo do Arquivista, mas ele se recompõe. Procure um rosto preso.':'The Light touches the Archivist\'s body, but it reforms. Find a trapped face.',
    'Esse rosto já foi reconhecido. Há outras memórias presas.':'That face has already been recognized. Other memories are still trapped.',
    'Lívia foi lembrada pelo pão que repartiu.':'Lívia was remembered for the bread she shared.',
    'Tomás foi lembrado pelo que restaurou.':'Tomás was remembered for what he restored.',
    'Celina foi lembrada pela música que deixou.':'Celina was remembered for the music she left behind.',
    'Repita a sequência aprendida no Lago. A ordem dos ecos ainda importa.':'Repeat the sequence learned at the Lake. The order of the echoes still matters.',
    'O Arquivista misturou os ecos. Recomece a frase de Mara.':'The Archivist mixed the echoes. Rebuild Mara\'s phrase from the beginning.',
    'Abra caminho para Mara: aproxime-se da Raiz-Selo corrompida e use F.':'Open the path for Mara: approach the corrupted Root-Seal and use F.',
    'O coração da ordem está exposto. Aproxime-se e pressione E.':'The heart of the command is exposed. Approach it and press E.',
    'O troféu de Mara foi adicionado às Memórias.':'Mara\'s trophy was added to Memories.',
    'O Bosque das Memórias foi atravessado novamente.':'The Forest of Memories was crossed again.',
    'Use a Luz para caminhar sobre uma lembrança do caminho.':'Use the Light to walk across a memory of the path.',
    'Siga as folhas até a mulher que espera junto às raízes.':'Follow the leaves to the woman waiting by the roots.',
    'Pela primeira vez, as folhas estão caindo para o chão.':'For the first time, the leaves are falling to the ground.',
    'O caminho de Mara terminou. O de Jack continua.':'Mara\'s path has ended. Jack\'s continues.',
    'Escute a Árvore-Mãe.':'Listen to the Mother Tree.','Siga as folhas que caem para o céu.':'Follow the leaves that fall toward the sky.',

    // Halloween IV static/gameplay
    'Halloween IV — A Estrada dos Esquecidos':'Halloween IV — The Road of the Forgotten','A ESTRADA DOS ESQUECIDOS':'THE ROAD OF THE FORGOTTEN',
    'A ESTRADA DOS':'THE ROAD OF','ESQUECIDOS':'THE FORGOTTEN',
    'A chave de Mara reage à parede. Aproxime-se e pressione E.':'Mara\'s key reacts to the wall. Approach it and press E.',
    'Depois do Bosque das Memórias, Jack encontra um caminho onde até os nomes desapareceram. A chave de Mara ainda se lembra de uma porta.':'After the Forest of Memories, Jack finds a road where even names have vanished. Mara\'s key still remembers a door.',
    '✦ ENTRAR NA ESTRADA':'✦ ENTER THE ROAD','LUZ / COMBATE':'LIGHT / COMBAT','HALLOWEEN IV · CONCLUÍDO':'HALLOWEEN IV · COMPLETE',
    'A Peregrina escolheu continuar sem esperar que um nome dissesse quem ela é. O Coletor soltou o que nunca lhe pertenceu, e Jack recuperou uma parte de sua própria promessa.':'The Pilgrim chose to continue without waiting for a name to tell her who she is. The Collector released what never belonged to him, and Jack recovered part of his own promise.',
    '“Você prometeu.” — “Eu volto.”':'“You promised.” — “I\'ll come back.”','✦ ITEM OBTIDO · SINO SEM INSCRIÇÃO':'✦ ITEM OBTAINED · UNINSCRIBED BELL',
    'Se alguém esquecer para onde estava indo, chame — mesmo sem saber o nome.':'If someone forgets where they were going, call — even if you do not know the name.',
    'HALLOWEEN V DESBLOQUEADO':'HALLOWEEN V UNLOCKED','O sino chama para a última estrada desta aventura.':'The bell calls toward the final road of this adventure.',
    '✦ SEGUIR PARA A ÚLTIMA LANTERNA':'✦ FOLLOW THE LAST LANTERN',
    'Marco sem inscrição':'Uninscribed Marker','Marco do Povoado':'Settlement Marker','Marco das Pegadas':'Tracks Marker','Marco do Arquivo':'Archive Marker',
    'Marco da Praça':'Square Marker','Marco sem Nome':'Nameless Marker','A Luz abriu fissuras na rasura.':'The Light opened cracks in the redaction.',
    'CÃO DE CINZA':'ASH HOUND','CORVO DO ESQUECIMENTO':'CROW OF FORGETTING',
    'A Luz incendiou as rachaduras de cinza.':'The Light ignited the cracks of ash.',
    'As roupas caíram vazias. O pó dentro delas não tinha nome.':'The clothes fell empty. The dust inside them had no name.',
    'O corvo se rasgou em penas de papel e letras sem dono.':'The crow tore apart into paper feathers and ownerless letters.',
    'O Corvo roubou o brilho da lanterna.':'The Crow stole the lantern\'s glow.','O Cão de Cinza atravessou a guarda de Jack.':'The Ash Hound broke through Jack\'s guard.',
    'O Coletor empurrou Jack com o peso dos nomes roubados.':'The Collector struck Jack with the weight of stolen names.',
    'VOCÊ PASSOU POR AQUI':'YOU PASSED THROUGH HERE','Ela voltou. Amparou. E voltou outra vez.':'She came back. She supported someone. And she came back again.',
    'Use F perto do Coletor para libertar as placas da armadura.':'Use F near the Collector to free the plaques from his armor.',
    'Sem a armadura, o Coletor ficou menor — e muito mais rápido.':'Without the armor, the Collector became smaller — and much faster.',
    'A forma monumental do Coletor começa a desabar.':'The Collector\'s monumental form begins to collapse.',
    'A Luz não precisa feri-lo. Aproxime-se e pressione E.':'The Light does not need to hurt him. Approach and press E.',
    'O confronto terminou sem apagar quem estava por baixo dos nomes.':'The confrontation ended without erasing the person beneath the names.',
    'O sino toca sem chamar um nome — e alguma coisa na memória de Jack responde.':'The bell rings without calling a name — and something in Jack\'s memory answers.',
    'Ser esquecido não significa nunca ter existido.':'Being forgotten does not mean never having existed.',
    'Aproxime-se do sino e pressione E para recebê-lo.':'Approach the bell and press E to receive it.',
    'ELA NÃO PRECISA ESPERAR PELO NOME':'SHE DOES NOT NEED TO WAIT FOR THE NAME','MEMÓRIA · EU VOLTO':'MEMORY · I\'LL COME BACK',
    'A ESTRADA CONTINUA':'THE ROAD CONTINUES','O COLETOR DE NOMES · ATO':'THE COLLECTOR OF NAMES · ACT',
    'A chave está reagindo a alguma coisa na parede.':'The key is reacting to something in the wall.',
    'Há o contorno de uma porta, mas Jack não tem nada que se encaixe nela.':'There is the outline of a door, but Jack has nothing that fits it.',
    'A passagem existe enquanto a memória da chave permanecer acesa.':'The passage exists while the memory of the key remains lit.',
    'O Sino sem Inscrição espera alguns passos adiante.':'The Uninscribed Bell waits a few steps ahead.',
    'POVOADO SEM NOMES':'NAMELESS SETTLEMENT','OS NOMES ESTÃO SENDO COLETADOS':'THE NAMES ARE BEING COLLECTED',
    'IDENTIDADE TAMBÉM É O QUE FAZEMOS':'IDENTITY IS ALSO WHAT WE DO','NOMES NÃO SÃO PESSOAS':'NAMES ARE NOT PEOPLE',
    'PONTE DOS NINGUÉM':'BRIDGE OF NOBODIES','PRAÇA DOS NOMES ROUBADOS':'SQUARE OF STOLEN NAMES',
    'CASA DO COLETOR':'THE COLLECTOR\'S HOUSE','DIANTE DA CASA DO COLETOR':'BEFORE THE COLLECTOR\'S HOUSE',

    // Halloween V static/gameplay
    'Halloween V — A Última Lanterna':'Halloween V — The Last Lantern',
    'A ÚLTIMA':'THE LAST','LANTERNA':'LANTERN',
    'Siga a estrada. O sino sem inscrição ainda está com Jack.':'Follow the road. Jack still carries the uninscribed bell.',
    'O sino da Peregrina chama para uma estrada que Jack nunca conseguiu enxergar. Desta vez, a Luz não aponta apenas para quem está perdido.':'The Pilgrim\'s bell calls toward a road Jack was never able to see. This time, the Light points not only to those who are lost.',
    '✦ SEGUIR O SINO':'✦ FOLLOW THE BELL','LUZ / REFLETIR':'LIGHT / REFLECT',
    'Jack não apagou o passado e não recebeu uma sentença antecipada. Ele apenas deixou de permitir que o pior de sua história escrevesse sozinho tudo o que ainda pode fazer.':'Jack did not erase the past, nor did he receive an early verdict. He simply stopped allowing the worst of his story to write everything he can still become.',
    '“Ainda não. Mas finalmente sei como continuar procurando.”':'“Not yet. But I finally know how to keep looking.”',
    '✦ JORNADA 5/5':'✦ JOURNEY 5/5','A última lanterna desta aventura foi acesa. Jack continua caminhando.':'The last lantern of this adventure has been lit. Jack keeps walking.',
    '✦ VER MEMÓRIAS DA JORNADA':'✦ VIEW JOURNEY MEMORIES',
    'MARCO DO RETORNO':'MARKER OF RETURN','RELÓGIO DO AGORA':'CLOCK OF NOW','LANTERNA DAS COISAS DEIXADAS':'LANTERN OF THINGS LEFT BEHIND',
    'MARCO SEM NOME':'NAMELESS MARKER','A PENÚLTIMA LANTERNA':'THE PENULTIMATE LANTERN','VOCÊ PROMETEU':'YOU PROMISED',
    'ENCONTRE O CAMINHO DE VOLTA':'FIND THE WAY BACK','PARA TODOS ELES':'FOR ALL OF THEM',
    'Siga a estrada até onde a névoa permitir.':'Follow the road as far as the fog allows.',
    'O sino chama para trás. Volte pelo caminho que acabou de percorrer.':'The bell calls backward. Return along the path you just traveled.',
    'O caminho mudou. Atravesse o Marco do Retorno.':'The path has changed. Cross the Marker of Return.',
    'Apague as 3 lanternas que mantêm janelas esperando. Preserve as 2 que iluminam a estrada.':'Extinguish the 3 lanterns that keep windows waiting. Preserve the 2 that light the road.',
    'Use F junto aos 3 espelhos para impedir o mecanismo de voltar a ONTEM.':'Use F beside the 3 mirrors to keep the mechanism from returning to YESTERDAY.',
    'Deposite CARTA, CHAVE e RETRATO nos memoriais. Guardar tudo impede continuar.':'Place the LETTER, KEY and PORTRAIT at the memorials. Keeping everything prevents you from moving on.',
    'Ilumine as 4 marcas de ações e enfrente o rótulo MISERÁVEL.':'Illuminate the 4 marks of action and confront the label MISERABLE.',
    'Aproxime-se das quatro marcas da promessa e pressione E, na ordem em que chamam.':'Approach the four marks of the promise and press E in the order they call.',
    'Entre na escuridão e encontre a Última Lanterna.':'Enter the darkness and find the Last Lantern.',
    'ATO I · Ilumine e RECONHEÇA as quatro acusações. Não apague o passado.':'ACT I · Illuminate and RECOGNIZE the four accusations. Do not erase the past.',
    'ATO II · Acenda as quatro lições. Duas exigem LUZ REFLETIDA.':'ACT II · Light the four lessons. Two require REFLECTED LIGHT.',
    'ATO III · Aproxime-se de O Miserável e pressione E · CONTINUAR.':'ACT III · Approach The Miserable and press E · CONTINUE.',
    'A Última Lanterna está adiante. Aproxime-se e pressione E.':'The Last Lantern is ahead. Approach it and press E.',
    'Continue pela estrada.':'Continue along the road.','A chama guardará este retorno.':'The flame will preserve this return.',
    'A estrada devolveu Jack ao último marco.':'The road returned Jack to the last marker.','A escuridão alcançou Jack.':'The darkness reached Jack.',
    'SOMBRA DE RETORNO':'SHADOW OF RETURN','PORTADOR DE CINZAS':'ASH BEARER',
    'A lanterna apagada absorveu a Luz. Tente refletir o facho.':'The extinguished lantern absorbed the Light. Try reflecting the beam.',
    'AS CASAS PARARAM DE ESPERAR':'THE HOUSES STOPPED WAITING','LIÇÃO':'LESSON','ATO II · O QUE VOCÊ FEZ DEPOIS':'ACT II · WHAT YOU DID AFTER',
    'Essa luz aponta para a estrada. Talvez não seja essa.':'That light points toward the road. Maybe this is not the one.',
    'A lanterna voltou a acender.':'The lantern lit again.','A espera se apagou sem apagar a memória.':'The waiting ended without erasing the memory.',
    '· DEIXADO EM MEMÓRIA':'· LEFT IN MEMORY','A ESTRADA RECUSA O PASSO':'THE ROAD REFUSES THE STEP','O CAMINHO EXISTIA PARA TRÁS':'THE PATH EXISTED BEHIND',
    'E · CONTINUAR':'E · CONTINUE',
    // Remaining gameplay text coverage
    'A queda apagou a última luz. A lanterna trouxe Jack de volta.':'The fall extinguished the last light. The lantern brought Jack back.',
    '/3 corações restantes.':'/3 hearts remaining.',
    '♫ A Guardiã da Última Lanterna':'♫ The Guardian of the Last Lantern',
    'A luz ainda guarda seu progresso desta nova jornada.':'The light still holds the progress of this new journey.',
    'Eleanor já encontrou a luz. A história permanece salva — mas a noite pode ser atravessada outra vez.':'Eleanor has already found the light. The story remains saved — but the night can be crossed again.',

    'aceso. A abóbora guardará seu retorno.':'lit. The pumpkin will remember your return.',
    'AMÉLIA VESPER':'AMÉLIA VESPER','SOMBRA DE AMÉLIA':'AMÉLIA’S SHADOW','VILA BAIXA':'LOWER VILLAGE',
    'As 4:13 engoliram Jack por um instante. A lanterna reacendeu seu caminho.':'4:13 swallowed Jack for a moment. The lantern relit his path.',
    'A distorção temporal atingiu Jack —':'The temporal distortion hit Jack —',
    'A Vila sem Amanhecer':'The Village Without Dawn',
    'Halloween II concluído · Troféu de Amélia adicionado às Memórias':'Halloween II complete · Amélia’s trophy added to Memories',
    'Halloween II vencido novamente · Troféu já está nas Memórias':'Halloween II completed again · Trophy already in Memories',
    'A Última Lanterna reacendeu Jack. O Último Minuto recuperou toda a força.':'The Last Lantern relit Jack. The Last Minute recovered all its strength.',
    'A LUZ rompe o tempo:':'The LIGHT breaks through time:',
    'Memória 4/4 — Antes daquela noite, Amélia também contava as horas para o amanhã.':'Memory 4/4 — Before that night, Amélia also counted the hours until tomorrow.',
    'Memória':'Memory',
    'A memória se perdeu no silêncio... recomece pela infância.':'The memory was lost in silence... begin again with childhood.',
    'A TORRE RESPONDEU':'THE TOWER ANSWERED',
    'O primeiro selo despertou. A energia sobe pela Torre.':'The first seal awakened. Energy rises through the Tower.',
    'A lanterna guardou seu caminho pela Vila sem Amanhecer.':'The lantern saved your path through the Village Without Dawn.',
    'A queda apagou a última luz. A abóbora reacendeu o caminho de Jack.':'The fall extinguished the last light. The pumpkin relit Jack’s path.',
    'A queda apagou a última luz. Jack retorna ao início da Vila sem Amanhecer.':'The fall extinguished the last light. Jack returns to the beginning of the Village Without Dawn.',
    'O tempo atingiu Jack —':'Time struck Jack —',
    '4:14 — O relógio voltou a andar. A vila ainda espera pelo amanhecer.':'4:14 — The clock began moving again. The village still waits for dawn.',
    'O Último Minuto foi dissipado. O relógio ainda espera pelo próximo minuto.':'The Last Minute was dispelled. The clock still waits for the next minute.',
    'BOSS: SOMBRA DE AMÉLIA — O ÚLTIMO MINUTO. Desvie e use F / LUZ para romper a prisão das 4:13.':'BOSS: AMÉLIA’S SHADOW — THE LAST MINUTE. Dodge and use F / LIGHT to break the prison of 4:13.',
    'Encontre a relojoeira da praça e descubra por que tudo parou às 4:13.':'Find the clockmaker in the square and discover why everything stopped at 4:13.',
    '/3 — use a Luz e observe as pistas.':'/3 — use the Light and watch the clues.',
    'Os 3 enigmas foram resolvidos. Suba a Torre e ative os 2 selos temporais com a Luz.':'All 3 puzzles are solved. Climb the Tower and activate the 2 temporal seals with the Light.',
    'Tudo foi resolvido. Aproxime-se do selo no topo da Torre e pressione E / AÇÃO para chamar Amélia.':'Everything is ready. Approach the seal at the top of the Tower and press E / ACTION to call Amélia.',
    '/3 · TORRE':'/3 · TOWER',

    'PHASE3_STORY não carregou.':'PHASE3_STORY failed to load.',
    'Quatro e quatorze. Engraçado... o mundo continuou.':'Four fourteen. Funny... the world kept going.',
    'Então por que minha lanterna está apontando para trás?':'Then why is my lantern pointing backward?',
    'E desde quando folhas caem para o céu?':'And since when do leaves fall toward the sky?',
    'Algumas coisas não caem, Jack. Elas voltam.':'Some things do not fall, Jack. They return.',
    'Ótimo. Uma floresta que responde. Isso sempre termina bem.':'Great. A forest that talks back. That always ends well.',
    'guardou este caminho.':'saved this path.',
    'NOME ESQUECIDO':'FORGOTTEN NAME','E · trocar nome':'E · change name','RAIZ-SELO':'ROOT-SEAL',
    '— A LUZ ENTROU NAS FISSURAS':'— THE LIGHT ENTERED THE CRACKS','RAIZ-SELO PURIFICADA —':'ROOT-SEAL PURIFIED —',
    'Aproxime-se de um dos três ecos antes de usar a Luz.':'Approach one of the three echoes before using the Light.',
    'A Luz ainda está desfazendo a Raiz-Selo.':'The Light is still undoing the Root-Seal.',
    'Mara está avançando. Mantenha o caminho aberto.':'Mara is moving forward. Keep the path open.',
    'A Luz precisa alcançar a Raiz-Selo que bloqueia Mara.':'The Light must reach the Root-Seal blocking Mara.',
    'Aproxime-se do coração da ordem.':'Approach the heart of the command.',
    'A lanterna retomou a última lembrança do Bosque.':'The lantern returned to the Forest’s last memory.',
    'MEMÓRIA APRISIONADA':'IMPRISONED MEMORY',
    'Ainda há Raízes-Selo entre Mara e o coração. Use a Luz para purificar o caminho.':'There are still Root-Seals between Mara and the heart. Use the Light to purify the path.',
    'As raízes estão soltando a lembrança. Deixe a Luz terminar o movimento.':'The roots are releasing the memory. Let the Light finish the work.',
    'Aproxime-se de um dos relicários do Arquivo.':'Approach one of the reliquaries in the Archive.',
    'escolher o que apagar':'choose what to erase','A PERGUNTA ESTÁ ERRADA':'THE QUESTION IS WRONG',
    'As três memórias foram ouvidas. Volte a um relicário e pressione E para responder.':'All three memories have been heard. Return to a reliquary and press E to answer.',
    '/3 lembranças ouvidas)':'/3 memories heard)',
    'RELICÁRIO DESPERTO —':'RELIQUARY AWAKENED —',
    'Os retratos respondem à Luz. F revela a lembrança; E troca o nome.':'The portraits respond to the Light. F reveals the memory; E changes the name.',
    'Mara: Ilumine cada retrato e devolva a ele o nome que pertence àquela história.':'Mara: Illuminate each portrait and return the name that belongs to its story.',
    'Mara: As três vozes formavam uma única frase. A Luz ainda consegue separá-las.':'Mara: The three voices formed a single sentence. The Light can still separate them.',
    'Mara: O Arquivo não quer apagar nada. Talvez estejamos fazendo a pergunta errada.':'Mara: The Archive does not want to erase anything. Maybe we are asking the wrong question.',
    'Mara: A Árvore-Mãe está adiante. E acho que ela já sabe que estamos chegando.':'Mara: The Mother Tree is ahead. And I think she already knows we are coming.',
    'Mara: Não posso desfazer o passado. Mas posso escolher o que faço com ele agora.':'Mara: I cannot undo the past. But I can choose what I do with it now.',
    'A placa está presa às raízes. Primeiro desperte a lembrança com F.':'The plaque is bound to the roots. Awaken the memory with F first.',
    'NOME DEVOLVIDO —':'NAME RESTORED —','ÁRVORE-MÃE — O CORAÇÃO DAS RAÍZES':'MOTHER TREE — THE HEART OF THE ROOTS',
    'LEMBRANÇA DESPERTA —':'MEMORY AWAKENED —','Memória —':'Memory —',
    'ECO DESPERTO — UMA VOZ VOLTOU À SUPERFÍCIE':'ECHO AWAKENED — A VOICE RETURNED TO THE SURFACE',
    'A lanterna recorda um caminho que já não existe.':'The lantern remembers a path that no longer exists.',
    'As raízes estão abrindo o caminho...':'The roots are opening the path...',
    'As raízes seguram o caminho. Os três retratos ainda não estão completos.':'The roots hold the path. The three portraits are not complete yet.',
    'O portão do Lago está despertando...':'The Lake gate is awakening...',
    'O lago não abre passagem enquanto a voz de Mara continuar fragmentada.':'The lake will not open while Mara’s voice remains fragmented.',
    'O Arquivo está soltando suas raízes...':'The Archive is releasing its roots...',
    'As raízes recusam a passagem. O Arquivo ainda guarda algo que precisa ser deixado ir.':'The roots refuse passage. The Archive still holds something that must be let go.',
    'As raízes devolveram Jack ao último ponto de luz.':'The roots returned Jack to the last point of light.',
    'O Bosque engoliu um passo —':'The Forest swallowed a step —',
    'BOSQUE DOS RETRATOS: F desperta a lembrança. Leia a história e use E para devolver o nome correto.':'FOREST OF PORTRAITS: F awakens the memory. Read the story and use E to return the correct name.',
    'LAGO DAS VOZES: F desperta cada Eco. Escute os fragmentos e use E para reconstruir a voz de Mara na ordem correta.':'LAKE OF VOICES: F awakens each Echo. Listen to the fragments and use E to rebuild Mara’s voice in the correct order.',
    'ARQUIVO DAS RAÍZES: a pergunta estava errada. Aproxime-se de um relicário e use E para DEIXAR IR.':'ROOT ARCHIVE: the question was wrong. Approach a reliquary and use E to LET GO.',
    'ARQUIVO DAS RAÍZES: examine carta, caixa de música e chave com E. Escute as três antes de responder.':'ROOT ARCHIVE: examine the letter, music box and key with E. Hear all three before answering.',
    'Siga Mara. Observe o que acontece com as coisas que tentam terminar.':'Follow Mara. Watch what happens to things that try to end.',
    'O ciclo está quebrado. Alcance a Árvore-Mãe.':'The cycle is broken. Reach the Mother Tree.',
    'As memórias estão se reunindo. A antiga ordem de Mara ganhou forma.':'The memories are gathering. Mara’s old command has taken form.',
    'ATO I — OS ROSTOS: use a Luz no Arquivista e descubra por que ele não pode ser vencido pela força.':'ACT I — THE FACES: use the Light on the Archivist and discover why force cannot defeat him.',
    'ATO I — OS ROSTOS: aproxime-se de Lívia, Tomás e Celina e use F para reconhecê-los.':'ACT I — THE FACES: approach Lívia, Tomás and Celina and use F to recognize them.',
    'ATO II — AS VOZES: reconheça os ecos na mesma sequência aprendida no Lago.':'ACT II — THE VOICES: recognize the echoes in the same sequence learned at the Lake.',
    'ATO III — A ESCOLHA: ilumine a raiz à frente de Mara para abrir o caminho.':'ACT III — THE CHOICE: illuminate the root ahead of Mara to open the path.',
    'A lanterna iluminou algo que não existe mais. Pressione F para revelar memórias do caminho.':'The lantern illuminated something that no longer exists. Press F to reveal memories of the path.',

    'PHASE4_STORY não carregou.':'PHASE4_STORY failed to load.',
    'A Luz atravessou o vazio sob as roupas.':'The Light passed through the emptiness beneath the clothes.',
    'A lanterna revelou um vazio sob as vestes. Agora a Luz pode alcançá-lo.':'The lantern revealed an emptiness beneath the robes. Now the Light can reach it.',
    'A Luz atravessou as penas de papel.':'The Light passed through the paper feathers.',
    'A rasura mordeu a luz.':'The redaction bit into the light.',
    'A PROVA ESTÁ SOB ATAQUE':'THE EVIDENCE IS UNDER ATTACK','O ECO ESTÁ SOB VIGILÂNCIA':'THE ECHO IS UNDER WATCH',
    'Não há mais armadura para arrancar. Talvez outro gesto.':'There is no armor left to tear away. Maybe another gesture.',
    'NOME LIBERADO ·':'NAME RELEASED ·','Uma placa se soltou. O Coletor tenta proteger o que resta.':'A plaque came loose. The Collector tries to protect what remains.',
    'LUZ ·':'LIGHT ·','A última resistência cede. O homem sob os nomes já não consegue avançar.':'The last resistance gives way. The man beneath the names can no longer advance.',
    'A Luz atravessou o que restou da coleção.':'The Light passed through what remained of the collection.',
    'os nomes não sumiram — foram levados':'the names did not vanish — they were taken',
    'há marcas de remoção no arquivo':'there are removal marks in the archive',
    'O COLETOR OBSERVA DA ESTRADA':'THE COLLECTOR WATCHES FROM THE ROAD',
    'A CHAVE LEMBROU A PORTA':'THE KEY REMEMBERED THE DOOR',
    'A Peregrina seguirá Jack, mas não atravessará o mundo como uma sombra colada nele.':'The Pilgrim will follow Jack, but she will not cross the world like a shadow glued to him.',
    'A passagem para a Ponte dos Ninguém foi liberada.':'The path to the Bridge of Nobodies has opened.',
    'Nada responde aqui. Ainda.':'Nothing answers here. Yet.',
    'A Luz firmou várias partes da ponte por alguns segundos.':'The Light stabilized several parts of the bridge for a few seconds.',
    'A Luz firmou a plataforma contra a névoa.':'The Light stabilized the platform against the fog.',
    'A luz encontra marcas... mas nenhuma responde daqui.':'The light finds marks... but none respond from here.',
    'A parede não tem porta. A chave de Mara está reagindo.':'The wall has no door. Mara’s key is reacting.',
    'A estrada se perde na névoa. Há alguém esperando no povoado.':'The road disappears into the fog. Someone is waiting in the settlement.',
    'As pegadas terminam aqui. Três rastros ainda precisam ser iluminados.':'The footprints end here. Three traces still need to be illuminated.',
    'O Arquivo ainda guarda provas. Examine os registros com E.':'The Archive still holds evidence. Examine the records with E.',
    'A Peregrina ainda está atravessando. Jack espera que ela encontre o próprio passo.':'The Pilgrim is still crossing. Jack waits for her to find her own footing.',
    'As placas fecham a saída. Ainda há vozes separadas de seus nomes.':'The plaques block the exit. Voices are still separated from their names.',
    'A Peregrina vem logo atrás. Jack espera antes da entrada.':'The Pilgrim is close behind. Jack waits before the entrance.',
    'A Peregrina para diante da arena. Jack espera até ela estar segura.':'The Pilgrim stops before the arena. Jack waits until she is safe.',
    'A arena fechou atrás de Jack.':'The arena closed behind Jack.',
    'A Ponte dos Ninguém apagou o chão — o último marco guardou os passos de Jack.':'The Bridge of Nobodies erased the ground — the last marker saved Jack’s steps.',
    'A Praça rachou sob Jack — o Marco da Praça guardou seus passos.':'The Square cracked beneath Jack — the Square Marker saved his steps.',
    'A estrada tentou apagar Jack.':'The road tried to erase Jack.','A névoa apagou a plataforma sob Jack.':'The fog erased the platform beneath Jack.',
    'Um passo desapareceu na névoa.':'A step vanished into the fog.',
    'A Peregrina seguirá Jack, mas vai esperar quando o caminho pedir outra coisa.':'The Pilgrim will follow Jack, but she will wait when the path asks something else.',
    'Ela não perdeu o medo. Mesmo assim, vai atravessar.':'She has not lost her fear. She will cross anyway.',
    'A ESTRADA NÃO ESCREVEU O NOME DE JACK':'THE ROAD DID NOT WRITE JACK’S NAME',
    'UM MEDO TAMBÉM É UM RASTRO':'FEAR IS A TRACE TOO',
    'A Luz consegue alcançar as vozes depois que seus guardiões forem dissipados.':'The Light can reach the voices after their guardians are dispelled.',
    'Atravesse a Estrada sem Placas e encontre quem ainda espera.':'Cross the Road Without Signs and find whoever is still waiting.',
    'CAMPO DAS PEGADAS: use F para reconstruir as ações da Peregrina. Rastros':'FIELD OF TRACKS: use F to reconstruct the Pilgrim’s actions. Traces',
    'ARQUIVO RASURADO: as três provas apontam para a estrada adiante.':'REDACTED ARCHIVE: the three pieces of evidence point to the road ahead.',
    'ARQUIVO RASURADO: derrote os guardiões e use E nas provas. Evidências':'REDACTED ARCHIVE: defeat the guardians and use E on the evidence. Evidence',
    'PONTE DOS NINGUÉM: a névoa apaga plataformas. Use F para firmá-las enquanto desvia dos Corvos.':'BRIDGE OF NOBODIES: the fog erases platforms. Use F to stabilize them while dodging the Crows.',
    'PRAÇA DOS NOMES ROUBADOS: entre no círculo de placas.':'SQUARE OF STOLEN NAMES: enter the circle of plaques.',
    'PRAÇA DOS NOMES ROUBADOS: as vozes provaram que nome e pessoa foram separados. Siga a silhueta.':'SQUARE OF STOLEN NAMES: the voices proved that name and person were separated. Follow the silhouette.',
    'PRAÇA DOS NOMES ROUBADOS: derrote os guardiões e use F para ouvir os ecos. Vozes':'SQUARE OF STOLEN NAMES: defeat the guardians and use F to hear the echoes. Voices',
    'CASA DO COLETOR: siga com a Peregrina até a entrada da arena.':'COLLECTOR’S HOUSE: follow the Pilgrim to the arena entrance.',
    'ARENA DO COLETOR: entre e descubra o que existe sob a coleção de nomes.':'COLLECTOR’S ARENA: enter and discover what exists beneath the collection of names.',
    'HALLOWEEN IV CONCLUÍDO: o Sino sem Inscrição acompanha Jack. A estrada continua.':'HALLOWEEN IV COMPLETE: the Uninscribed Bell accompanies Jack. The road continues.',
    'EPÍLOGO: aproxime-se do Sino sem Inscrição e pressione E · RECEBER.':'EPILOGUE: approach the Uninscribed Bell and press E · RECEIVE.',
    'EPÍLOGO: o Coletor está soltando os nomes.':'EPILOGUE: the Collector is releasing the names.',
    'EPÍLOGO: a Peregrina decide se continuará esperando pelo próprio nome.':'EPILOGUE: the Pilgrim decides whether she will keep waiting for her own name.',
    'EPÍLOGO: a Peregrina tem algo para entregar a Jack.':'EPILOGUE: the Pilgrim has something to give Jack.',
    'EPÍLOGO: o primeiro toque do sino chamou uma memória de Jack.':'EPILOGUE: the bell’s first ring called one of Jack’s memories.',
    'EPÍLOGO: escolha continuar pela estrada.':'EPILOGUE: choose to continue along the road.',
    'ATO I: use F perto do Coletor para libertar 5 placas da armadura.':'ACT I: use F near the Collector to free 5 plaques from the armor.',
    'ATO II: desvie das investidas, cuidado com as plataformas quebradas e alcance o Coletor com F.':'ACT II: dodge the charges, watch the broken platforms, and reach the Collector with F.',
    'ATO III: não há mais nada para destruir. Aproxime-se e pressione E · RECONHECER.':'ACT III: there is nothing left to destroy. Approach and press E · RECOGNIZE.',
    'A Chave de Madeira de Mara começou a aquecer.':'Mara’s Wooden Key began to warm.',

    'PHASE5_STORY não carregou.':'PHASE5_STORY failed to load.',
    'Leve o objeto ao memorial indicado e pressione E.':'Take the object to the indicated memorial and press E.',
    'A escuridão atingiu Jack —':'The darkness struck Jack —',
    'LIÇÃO ·':'LESSON ·'
  };

  const phrases=[
    ['Halloween I concluído','Halloween I complete'],['Halloween II concluído','Halloween II complete'],
    ['Halloween III concluído','Halloween III complete'],['Halloween IV concluído','Halloween IV complete'],['Halloween V concluído','Halloween V complete'],
    ['Voltar ao menu','Back to Menu'],['Voltar ao mapa','Back to Map'],['Jogar novamente','Play Again'],
    ['Checkpoint ativado','Checkpoint activated'],['checkpoint ativado','checkpoint activated'],
    ['Memória encontrada','Memory Found'],['Fragmento encontrado','Fragment Found'],
    ['Use a Luz','Use the Light'],['use a Luz','use the Light'],['Use F','Use F'],
    ['A lanterna','The lantern'],['a lanterna','the lantern'],['A Luz','The Light'],['a Luz','the Light'],
    ['A estrada','The road'],['a estrada','the road'],['A névoa','The fog'],['a névoa','the fog'],
    ['A Peregrina','The Pilgrim'],['o Coletor','the Collector'],['O Coletor','The Collector'],
    ['Árvore-Mãe','Mother Tree'],['ARQUIVISTA ETERNO','ETERNAL ARCHIVIST'],['O Arquivista','The Archivist'],
    ['ainda protege esta parte do arquivo.','still protects this part of the archive.'],['mantém esta voz presa sob a vigilância.','keeps this voice trapped under watch.'],['Fase concluída','Chapter Complete'],['Próxima fase','Next Chapter']
  ];

  const original=new WeakMap();
  function lang(){return currentLang()}
  function tr(value){
    if(!BASE()||typeof value!=='string')return value;
    const code=currentLang();
    const trimmed=value.trim();
    let out=exact[trimmed]?value.replace(trimmed,exact[trimmed]):value;
    if(!exact[trimmed]) for(const [a,b] of phrases) out=out.split(a).join(b);
    if(code!=='en') out=window.JackLocale?.translateEnglish(out,code)||out;
    return out;
  }

  // Translate text drawn directly on the canvas (boss labels, puzzle signs, banners).
  if(!window.__jackCanvasI18nPatched && window.CanvasRenderingContext2D){
    window.__jackCanvasI18nPatched=true;
    const fp=CanvasRenderingContext2D.prototype.fillText;
    const sp=CanvasRenderingContext2D.prototype.strokeText;
    CanvasRenderingContext2D.prototype.fillText=function(text,...args){return fp.call(this,tr(String(text)),...args)};
    CanvasRenderingContext2D.prototype.strokeText=function(text,...args){return sp.call(this,tr(String(text)),...args)};
  }

  function translateNode(root=document.body){
    if(!root)return;
    const nodes=[];
    if(root.nodeType===Node.TEXT_NODE)nodes.push(root);
    if(root.nodeType===Node.ELEMENT_NODE||root===document.body){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
        acceptNode(n){
          if(!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
          const p=n.parentElement;
          if(!p||['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      while(walker.nextNode())nodes.push(walker.currentNode);
    }
    for(const n of nodes){
      if(!original.has(n))original.set(n,n.nodeValue);
      const src=original.get(n);
      n.nodeValue=BASE()?tr(src):src;
    }
    if(root.querySelectorAll){
      root.querySelectorAll('[aria-label],[title],[alt]').forEach(el=>{
        ['aria-label','title','alt'].forEach(attr=>{
          if(!el.hasAttribute(attr))return;
          const key='jackI18n'+attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase());
          if(!el.dataset[key])el.dataset[key]=el.getAttribute(attr);
          el.setAttribute(attr,BASE()?tr(el.dataset[key]):el.dataset[key]);
        });
      });
    }
  }

  function injectSwitcher(){
    if(document.getElementById('jackPhaseLanguage'))return;
    const box=document.createElement('div');
    box.id='jackPhaseLanguage';box.className='jack-phase-language';box.setAttribute('aria-label','Idioma / Language');
    box.innerHTML='<select id="jackPhaseLanguageSelect" aria-label="Idioma / Language"><option value="pt-BR">PT · Português</option><option value="en">EN · English</option><option value="es">ES · Español</option><option value="fr">FR · Français</option><option value="zh-CN">中文 · 简体</option><option value="ko">한국어</option><option value="ja">日本語</option></select>';
    document.body.appendChild(box);
    const select=box.querySelector('#jackPhaseLanguageSelect');
    if(select){
      select.value=lang();
      select.addEventListener('change',()=>{localStorage.setItem(STORAGE_KEY,select.value);location.reload();});
    }
  }
  function addStyle(){
    if(document.getElementById('jackPhaseLanguageStyle'))return;
    const s=document.createElement('style');s.id='jackPhaseLanguageStyle';
    s.textContent='.jack-phase-language{position:fixed;z-index:999999;top:10px;right:10px;padding:4px 6px;background:#080b12dc;border:1px solid #b97a2e88;box-shadow:0 4px 16px #0008;font-family:Georgia,"Noto Serif CJK SC","Noto Serif CJK JP","Noto Serif KR",serif}.jack-phase-language select{max-width:170px;border:0;outline:0;background:#0b1019;color:#ffe0a0;padding:6px 8px;font-weight:700;font-size:11px;cursor:pointer}';
    document.head.appendChild(s);
  }
  function init(){
    document.documentElement.lang=lang();window.JackLocale?.localizeStories(lang());addStyle();injectSwitcher();translateNode(document.body);
    if(BASE()){
      const observer=new MutationObserver(records=>records.forEach(r=>{
        if(r.type==='characterData')translateNode(r.target);
        r.addedNodes.forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE||n.nodeType===Node.TEXT_NODE)translateNode(n)});
      }));
      observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    }
  }
  window.JackGameI18n={t:tr,translateNode,getLanguage:lang,supported:SUPPORTED};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();