# Halloween V — Layout R1

Este documento registra a arquitetura jogável oficial da Fase 5.

## Princípio

A fase foi reconstruída para que a própria arquitetura conte a jornada de Jack:

1. Estrada estável
2. Vila em blocos
3. Relógios em composição simétrica
4. Jardim contínuo e contemplativo
5. Cidade fragmentada e teatral
6. Caminho da Promessa em ascensão suave
7. Sala de Espelhos com arena clara e legível

A física continua em `game/phase5.js`.

---

## 5A — A Estrada que Volta · 0–1700

- chão contínuo em y=590
- pequeno relevo: x=520, y=555, w=180
- pequena ruína: x=1050, y=540, w=190
- gate: x=1660
- checkpoint: x=1580
- objetivo: chegar ao bloqueio e voltar

A área prioriza caminhada e narrativa. Saltos são opcionais.

## 5B — As Casas sem Espera · 1700–3500

Chão:
- 1700–2180
- 2270–2800
- 2890–3500

Plataformas:
- varanda esquerda: x=1940 y=500 w=180
- poço: x=2440 y=475 w=210
- varanda direita: x=3100 y=500 w=190

Lanternas:
- 1840
- 2140
- 2500
- 2860
- 3260

A vila usa dois gaps curtos e três níveis arquitetônicos.

## 5C — O Relógio sem Ontem · 3500–5350

Chão:
- 3500–3970
- 4060–4800
- 4890–5350

Pedestais:
- espelho esquerdo: x=3660 y=500
- espelho central: x=4210 y=455
- espelho direito: x=4730 y=500

Espelhos:
- x=3750
- x=4300
- x=4820

O grande relógio continua em torno de x=4450.

## 5D — Jardim das Coisas Guardadas · 5350–7350

- chão contínuo em y=590
- sem saltos obrigatórios durante o transporte das memórias

Objetos e memoriais:
- CARTA: 5480 → 5730
- CHAVE: 6100 → 6360
- RETRATO: 6780 → 7080

Espelhos de combate:
- 5670 → Portador de Cinzas em 5900
- 6740 → Portador de Cinzas em 6900

## 5E — A Cidade sem Jack · 7350–9500

Chão:
- 7350–8050
- 8140–8750
- 8840–9500

Estações:
- ESPEROU: x=7640, plataforma y=505
- CONTINUOU: x=8170, plataforma y=470
- DEIXOU IR: x=8580, plataforma y=510
- ATRAVESSOU: x=9050, plataforma y=470

O rótulo MISERÁVEL permanece no final da praça.

## 5F — A Encruzilhada da Promessa · 9500–10850

Ascensão ritual:
- 9500–9820: y=570
- 9820–10110: y=550
- 10110–10400: y=530
- 10400–10690: y=510
- 10690–10850: y=500

Marcas:
- 9680 — VOCÊ PROMETEU
- 9970 — EU VOLTO
- 10250 — ENCONTRE O CAMINHO DE VOLTA
- 10550 — PARA TODOS ELES

Checkpoint final:
- x=10700 — A PENÚLTIMA LANTERNA

## 5G — A Última Lanterna · 10850–12600

Arena:
- chão contínuo em y=590
- plataforma esquerda: x=11080 y=500 w=220
- plataforma central: x=11620 y=540 w=240
- plataforma direita: x=12020 y=500 w=220

Boss:
- centro: x=11740

Ato I:
- 11150 MENTIROSO
- 11450 COVARDE
- 12030 AVARENTO
- 12330 MISERÁVEL

Ato II:
- 11150 ESPERAR · luz direta
- 11450 CONTINUAR · luz refletida
- 12030 DEIXAR IR · luz direta
- 12330 ATRAVESSAR · luz refletida

Espelhos:
- x=11340 → CONTINUAR
- x=12190 → ATRAVESSAR

Última Lanterna:
- x=12420

Depois do boss não existem inimigos, puzzles ou saltos obrigatórios.

---

## Regras técnicas do R1

- checkpoints só avançam; não podem regredir
- o Caminho da Promessa usa degraus de 20 px, permitindo subida natural
- o Jardim não possui gaps obrigatórios
- espelhos do boss têm alcance contextual menor para não capturarem as lições de luz direta
- inimigos seguem o chão do setor, não saltam instantaneamente para plataformas elevadas
- autosave é limitado a intervalos, em vez de gravar localStorage a cada frame
- o input de pulo deixa de ficar armazenado indefinidamente no ar
