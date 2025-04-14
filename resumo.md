# Resumo do Projeto Planning Poker

## Visão Geral
Aplicação web para facilitar sessões de Planning Poker em equipes ágeis, permitindo votação em tempo real através de WebSocket, com elementos de gamificação.

## Requisitos do Sistema
- Node.js 18.x ou superior
- NPM 9.x ou superior
- Navegador moderno com suporte a WebSocket

## Tecnologias Principais
- **Frontend**: 
  - Next.js 14.1.0 (LTS)
  - React 18
  - Mantine UI (@mantine/core, @mantine/hooks)
  - @tabler/icons-react (várias versões)
- **Backend**: Node.js com Express e Socket.io
- **Comunicação em Tempo Real**: Socket.io com WebSocket
- **Gerenciamento de Dependências**: NPM

## Estrutura do Projeto
```
planningbrothers/
├── src/
│   ├── app/                    # Páginas e rotas Next.js
│   │   ├── page.js            # Página inicial
│   │   ├── sala/              # Páginas relacionadas à sala
│   │   │   └── [codigo]/      # Rota dinâmica para cada sala
│   │   │       └── page.js    # Componente da página da sala
│   │   └── layout.js          # Layout principal
│   ├── components/            # Componentes React
│   │   ├── Auth/             # Componentes de autenticação
│   │   │   └── FormularioEntrada.jsx # Formulário de entrada na sala
│   │   ├── Carta/            # Componentes de carta (Votação, Participante)
│   │   │   ├── Participante.jsx # Card de Participante (Avatar + visuais de itens)
│   │   │   └── Votacao.jsx      # Card de Votação clicável
│   │   ├── GameElements/     # Componentes de gamificação
│   │   │   ├── KeyboardThrower.jsx # Sistema de arremesso de teclado
│   │   │   ├── GameController.jsx # Controlador de elementos de gamificação e configurações
│   │   │   ├── LifeBar.jsx   # Barra de vida dos participantes
│   │   │   ├── KillFeedDisplay.jsx # Exibe notificações de eliminação e eventos (Lucky Strike)
│   │   │   └── InventoryDisplay.jsx # Exibe inventário de armas e acessórios (com tooltips)
│   │   ├── Mesa/             # Componentes da mesa de Planning Poker
│   │   │   └── Mesa.jsx      # Componente principal da mesa (com tooltip de status no nome)
│   │   ├── Sala/             # Componentes da sala
│   │   │   └── OpcoesVotacao.jsx # Agrupa opções de voto e inventário
│   │   └── Shop/             # Componentes da Loja
│   │       └── ShopDrawer.jsx  # Painel lateral da loja de itens (com tooltips)
│   ├── contexts/             # Contextos React
│   │   ├── SocketContext.js  # Gerenciamento do Socket.io
│   │   ├── LifeBarContext.jsx # Gerenciamento da visibilidade da barra de vida
│   │   └── PvpContext.jsx    # Gerenciamento do estado PVP compartilhado
│   ├── hooks/                # Hooks personalizados
│   │   ├── useSalaSocket.js  # Lógica de eventos da sala
│   │   └── useSalaUiEffects.js # Lógica de efeitos visuais da sala (animações, piscada)
│   ├── constants/            # Constantes e configurações
│   │   ├── socketEvents.js   # Eventos do Socket.io (idealmente)
│   │   ├── gameConfig.js     # Configurações GERAIS do jogo (vida, PONTOS, tempos, som)
│   │   └── itemsData.js      # Dados dos ITENS (armas, acessórios) com stats, bônus e geração passiva
│   ├── services/             # Serviços da aplicação
│   │   └── AnimationService.jsx # Serviço de animações centralizado (agora .jsx)
│   ├── styles/               # Estilos CSS
│   │   └── animations.css    # Animações e efeitos visuais
│   ├── utils/                # Utilitários e funções auxiliares
│   │   └── browserToken.js   # Gerenciamento de token e identificação do navegador
│   ├── lib/                  # Bibliotecas e configurações
│   │   └── mantine/          # Configurações do Mantine UI
│   ├── pages/                # Páginas legadas (em migração)
│   └── server-dev.js         # Servidor de desenvolvimento com lógica de jogo
├── public/                   # Arquivos estáticos
│   ├── audio/                # Arquivos de áudio
│   │   └── beat.wav
│   ├── images/              # Imagens e recursos gráficos
│   │   └── game-objects/    # Recursos para elementos de gamificação
│   │       ├── keyboard.svg # Ícone de teclado para arremesso
│   │       ├── collision.svg # Efeito de explosão
│   │       ├── vest.svg      # Ícone do Colete DPE
│   │       ├── medalha.svg   # Ícone da Medalha de 5 Anos
│   │       └── minerador.svg # Ícone do Minerador de Bitcoin (NOVO)
├── .env.example             # Template de variáveis de ambiente
├── render.yaml              # Configuração de deploy no Render
└── package.json             # Dependências e scripts
```

## Funcionalidades Principais
1. **Criação de Salas**
   - Geração de código único para cada sala
   - Interface intuitiva para criar/entrar em salas
   - Sistema de convites via link para compartilhamento

2. **Votação em Tempo Real**
   - Sistema de votação usando Socket.io
   - Atualização instantânea dos votos (incluindo mudança de voto antes e após revelação)
   - Revelação de votos controlada pelo moderador
   - Exibição de estatísticas (média, moda, consenso) após revelação

3. **Interface do Usuário**
   - Design responsivo com Mantine UI
   - Feedback visual das ações (voto, dano, etc.)
   - Identificação de moderador da sala
   - Modo observador para stakeholders
   - **ATUALIZADO:** Tooltips com fontes padronizadas (`size="xs"`) em vários elementos (inventário, loja, nome do jogador na mesa, botão de copiar link).

4. **Gerenciamento de Sessão**
   - Verificação de sessão por token e navegador
   - Prevenção de sessões duplicadas do mesmo navegador
   - Identificação única de participantes
   - Fluxos diferentes para criação e convites

5. **Elementos de Gamificação** (Expandido e Refatorado)
   - **Combate PvP:**
     - Sistema de ataque (ex: arremesso de teclado) para interação (requer Modo PvP ativo).
     - Efeitos visuais de animação (voo, explosão, ricochete, tremor).
     - Sistema de vida com barra de status visual.
     - Comunicação em tempo real via WebSockets para sincronização.
     - Estado PVP compartilhado via Context API (`PvpContext`).
   - **Sistema de Itens e Combate:**
     - **Definição Centralizada (`itemsData.js`):** 
       - Armas (`type: 'weapon'`) e Acessórios (`type: 'accessory'`) definidos com atributos (dano, crítico, bônus, defesa, esquiva, **preço**).
       - **ATUALIZADO:** Acessórios possuem `equipSlot` (ex: 'body', 'headband', 'passive') para definir grupos de equipamentos e comportamento. Slots nomeados ('body', 'headband', etc.) são mutuamente exclusivos. Slots 'passive' indicam bônus aplicados a partir do inventário ou se equipados, dependendo do bônus.
       - **ATUALIZADO:** Novos atributos foram adicionados: `scoreMultiplier` (multiplica ganhos de pontos, ex: "Manifesto Comunista"), `criticalChanceBonus` e `dodgeChanceBonus` (bônus fixos adicionados à chance final, ex: "Medalha de 5 Anos").
       - **NOVO: Minerador de Bitcoin (`BITCOIN_MINER_ID`):** Item passivo (`equipSlot: 'passive'`) com atributos para geração de renda: `pontosPorIntervalo`, `intervaloGeracaoMs`, `luckyStrikeChance` (chance de 0 a 1), `luckyStrikeReward` (recompensa).
     - **Cálculo de Dano/Efeitos no Servidor:**
       - Servidor recebe `attack` (com `objectType` da arma).
       - Ataque Total: Soma do dano base da arma (fixo + dado) e dos bônus de ataque fixos/dados (`attackBonusFixed`, `attackBonusDice`) de **todos** os acessórios **EQUIPADOS** pelo atacante.
       - Defesa Total: Soma dos bônus de defesa fixos/dados (`defenseFixed`, `defenseDice`) de **todos** os acessórios **EQUIPADOS** pelo alvo.
       - **ATUALIZADO - Chance de Crítico Final:** Soma da chance base da arma (`criticalChance`) com os bônus de chance de crítico (`criticalChanceBonus`) de **todos** os acessórios no **INVENTÁRIO** do atacante.
       - **ATUALIZADO - Chance de Esquiva Final:** Soma da **maior** chance base (`dodgeChance`) entre os acessórios **EQUIPADOS** pelo alvo com os bônus de chance de esquiva (`dodgeChanceBonus`) de **todos** os acessórios no **INVENTÁRIO** do alvo.
       - Dano Final = `max(0, Ataque Total - Defesa Total)` (se não esquivou e não foi crítico).
     - **Feedback Visual:**
       - Animação de dano (número) no avatar alvo.
       - **ATUALIZADO:** Tooltip sobre o nome do avatar em `Mesa.jsx` exibe status consolidados (Ataque, Defesa, Crítico Final, Esquiva Final) calculados no cliente (a partir do inventário/equipados), com cada atributo em uma linha separada.
   - **Loja e Inventário:**
     - Loja (`ShopDrawer`) permite comprar itens definidos (e precificados) em `itemsData.js`, ordenados por `displayOrder`.
     - Inventário (`InventoryDisplay`) mostra itens possuídos.
     - **ATUALIZADO:** Tooltips nos itens da loja e do inventário exibem nome, descrição e atributos detalhados (incluindo novos bônus e multiplicador de score) com fonte padronizada.
     - Teclado padrão (`type: 'weapon'`) adicionado automaticamente.
   - **Acessórios Equipáveis (Sistema de Slots):**
     - Acessórios com `equipSlot` diferente de `'passive'` podem ser equipados/desequipados via inventário (`InventoryDisplay`).
     - Estado no servidor `equippedAccessories: string[]` armazena IDs dos itens equipados.
     - Lógica `toggleEquipAccessory` no servidor gerencia o array, respeitando os `equipSlot` exclusivos.
     - Visuais dos acessórios (definidos em `avatarVisual` no `itemsData.js`) são renderizados no avatar (`CartaParticipante`) para itens em `equippedAccessories`. Adicionado visual SVG para "Medalha de 5 Anos" e "Minerador".
     - **ATUALIZADO:** Itens com `equipSlot: 'passive'` aplicam bônus de forma mista: `scoreMultiplier`, `criticalChanceBonus`, `dodgeChanceBonus` são aplicados do **inventário**; atributos de geração passiva (como do Minerador) requerem que o item esteja **equipado**.
   - **Controles e Configurações (`GameController`):**
     - Ativação/desativação do Modo PVP.
     - Configuração de efeitos visuais/sonoros: Mute, **ATUALIZADO:** Volume (com valor inicial de `GAME_CONFIG.SOUND.DEFAULT_VOLUME`), Piscada de Dano.
     - Configuração de assinaturas de eliminação.
   - **Kill Feed e Notificações:**
     - Notificações visuais de eliminações (`damageReceived` com `killTitle`) e **NOVO:** Lucky Strikes (`luckyStrikeNotification`).
     - Usa `GAME_CONFIG.POINTS.KILL` para pontuação base de kill.
     - Exibe mensagens personalizadas (assinaturas) e o tipo de arma usada para kills.
     - **NOVO:** Notificações de Lucky Strike exibem o jogador e os pontos ganhos, com ícone de Bitcoin e cor verde.
     - O componente `KillFeedDisplay` renderiza as notificações com estilos diferenciados por tipo.
   - **Sistema de Pontuação (Score/Dinheiro):**
     - **ATUALIZADO:** Pontos ganhos por kill e por voto revelado são definidos em `src/constants/gameConfig.js` (`POINTS.KILL`, `POINTS.VOTE_REVEALED`).
     - **ATUALIZADO:** Ao ganhar pontos (kill, voto), o servidor verifica o inventário do jogador por itens com `scoreMultiplier` (ex: "Manifesto Comunista") e aplica o multiplicador aos pontos base.
     - **NOVO: Geração Passiva:** Quando o Minerador de Bitcoin está equipado, o cliente (`GameController`) envia um evento `generate_passive_income` ao servidor a cada `intervaloGeracaoMs`. O servidor valida, adiciona `pontosPorIntervalo` ao score, considerando a mecânica de Lucky Strike e o `scoreMultiplier` do Manifesto Comunista.
     - **NOVO: Lucky Strike:** Na geração passiva, há uma chance (`luckyStrikeChance` do item) de ganhar `luckyStrikeReward` pontos em vez da recompensa normal. Essa recompensa maior também é afetada pelo `scoreMultiplier`.
     - Score não é resetado entre rodadas.

## Fluxo de Dados
1. **Conexão**
   - Cliente conecta ao servidor Socket.io via WebSocket
   - Gerenciamento de reconexão automática

2. **Eventos da Sala (Socket.io)**
   - Entrada/saída de participantes (`entrarSala`, `disconnect`, `usuarioSaiu`)
   - Votação e cancelamento de votos (`votar`, `cancelarVoto`)
   - Revelação de votos (`revelarVotos`)
   - Reinício de votação (`reiniciarVotacao`)
   - Atualização de estado geral (`atualizarParticipantes`)
   - Alternância de modo observador (`alternarModoObservador`)
   - Interações de gamificação:
     - Arremesso de objeto (`throwObject`) - Apenas para sincronizar animação inicial.
     - Aplicação de ataque (`attack`) - Enviado pelo atacante com o tipo de arma.
     - Resposta de dano (`damageReceived`) - Enviado pelo servidor com dano final e flags (crítico, esquiva, kill).
     - Compra de item (`buyItem`)
     - Equipar/Desequipar acessório (`toggleEquipAccessory`)
     - Mudança de modo PvP (`funModeChanged`)
     - Definição de assinaturas (`setCustomKillSignatures`)
     - **NOVO:** Geração de renda passiva (`generate_passive_income`) - Cliente -> Servidor.
     - **NOVO:** Notificação de Lucky Strike (`luckyStrikeNotification`) - Servidor -> Cliente.

3. **Estado da Aplicação**
   - **Servidor:** Fonte única da verdade. Mantém estado da sala e dos participantes, incluindo:
     - `life`, `score`, `kills`, `inventory`, `equippedAccessories`.
     - **ATUALIZADO:** Realiza cálculos de combate e pontuação considerando bônus e multiplicadores de itens no `inventory` ou `equippedAccessories` conforme a lógica definida. Processa geração passiva, Lucky Strike e multiplicadores.
   - **Cliente:** Reflete estado do servidor. Exibe informações, itens, tooltips e animações. **ATUALIZADO:** A função `formatConsolidatedBonus` em `Mesa.jsx` recalcula status para o tooltip do nome. O `KillFeedDisplay` mostra notificações formatadas de Kills e Lucky Strikes.

## Segurança
1. **Variáveis de Ambiente**
   - Uso de `.env` para desenvolvimento
   - Configurações sensíveis não versionadas
   - Template disponível em `.env.example`

2. **Boas Práticas**
   - CORS configurado para produção
   - Validação de entrada de dados (preço, posse de item, etc.)
   - Sanitização de parâmetros
   - Gerenciamento de token por navegador

3. **Monitoramento**
   - Logs de erro em produção
   - Alertas de segurança via GitHub
   - Atualizações de dependências monitoradas

## Manutenção
1. **Versionamento**
   - Repositório Git
   - Commits semânticos
   - Branches protegidas

2. **Deploy**
   - Deploy automatizado no Render
   - Configurações via `render.yaml`
   - Rollback automático em falhas

3. **Atualizações**
   - Dependências principais em versões LTS
   - Plano de atualização para correções de segurança
   - Monitoramento de vulnerabilidades

## Como Executar

1. Configurar variáveis de ambiente:
   - Copiar `.env.example` para `.env`
   - Ajustar as variáveis conforme necessário

2. Instalar dependências:
```bash
npm install
```

3. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

4. Acessar aplicação:
   - Abrir http://localhost:3000 no navegador

## Deploy

1. **Plataforma**
   - Deploy automatizado no Render
   - Configurações definidas em `render.yaml`

2. **Variáveis de Ambiente**
   - `NODE_ENV`: production
   - `PORT`: 3000
   - `NEXT_PUBLIC_SOCKET_URL`: URL do servidor WebSocket

3. **Processo de Deploy**
   - Push para o GitHub inicia deploy automático
   - Build: `npm install && npm run build`
   - Start: `npm run start`

## Recursos de Gamificação

1. **Sistema de Arremesso e Ataque**
   - Animação fluida do objeto de ataque (ex: teclado).
   - Efeitos visuais de impacto (explosão, tremor, ricochete).
   - **ATUALIZADO:** Sistema de dano/efeito calculado no servidor:
       - Considera ataque base da arma e bônus de ataque de acessórios **equipados**.
       - Considera defesa de acessórios **equipados**.
       - Calcula chance final de crítico somando chance base da arma e bônus (`criticalChanceBonus`) de acessórios no **inventário**.
       - Calcula chance final de esquiva somando a maior chance base (`dodgeChance`) de acessório **equipado** e bônus (`dodgeChanceBonus`) de acessórios no **inventário**.
   - Exibição do valor de dano final ou "CRITICAL!"/"Errou!" no avatar atingido.

2. **Sistema de Vida e Feedback**
   - Barra de vida visual dinâmica.
   - Visibilidade da barra para todos ao receber dano.
   - Feedback visual de dano crítico.
   - Piscada vermelha na tela do jogador atingido (se condições aplicáveis).
   - Sincronização em tempo real.
   - Configurações de vida máxima e tempos em `gameConfig.js`.

3. **Sistema de Itens (Armas e Acessórios) - REVISADO**
   - Definição centralizada em `itemsData.js` (tipo, preço, stats, `equipSlot`, `displayOrder`, `avatarVisual`, **`scoreMultiplier`**, **`criticalChanceBonus`**, **`dodgeChanceBonus`**).
   - Loja (`ShopDrawer`) com itens ordenados por `displayOrder` e tooltips padronizados.
   - Inventário (`InventoryDisplay`) com tooltips detalhados por item e fonte padronizada.
   - Sistema de equipamento baseado em slots (`equipSlot`).
   - Renderização de visuais equipados no avatar (`CartaParticipante`).
   - **ATUALIZADO:** Tooltip consolidado no nome do jogador em `Mesa.jsx` mostrando status combinados (Ataque, Defesa, Crítico, Esquiva) em linhas separadas.

4. **GameController - REVISADO**
   - Interface de controle (Drawer) com opções:
     - Modo PVP (Switch)
     - Som Mute (Switch)
     - **NOVO:** Volume (Slider)
     - Efeito de Piscada (Switch)
     - Assinaturas de Kill (Inputs)
   - Consome e atualiza contextos (`PvpContext`).
   - Renderiza `KeyboardThrower` (passando volume numérico).

5. **Sistema de Configuração**
   - Arquivo centralizado `gameConfig.js`.
   - **ATUALIZADO:** Inclui `POINTS.KILL` e `POINTS.VOTE_REVEALED` para configurar ganhos de score base.
   - Ajuste fácil de parâmetros (vida, pontos, tempos, animações).

6. **Kill Feed (Notificação de Eliminação) com Assinaturas:**
   - Quando um participante finaliza outro (vida chega a 0 ou menos), uma notificação é exibida.
   - Aparece no canto inferior direito da tela.
   - **Título:** Exibe uma "assinatura" definida pelo *atacante*. O usuário pode configurar até 3 assinaturas diferentes no Drawer de Configurações (`GameController`). Se o usuário tiver assinaturas salvas, uma delas é escolhida aleatoriamente a cada eliminação. Se não tiver nenhuma salva, as sugestões padrão (`Eliminação!`, `Até a próxima!`, `GG!`) são usadas aleatoriamente.
   - **Corpo:** Mostra: `[Nome Atacante] [Ícone Arma] [Nome Alvo]!`.
   - Cada notificação dura 5 segundos.
   - Se múltiplas eliminações ocorrerem rapidamente, as notificações são empilhadas verticalmente.
   - A notificação só aparece no ataque que efetivamente causou a eliminação.
   - Implementação envolve:
       - `GameController.jsx`: Permite ao usuário configurar até 3 assinaturas customizadas (array `signatures`) e envia para o servidor via evento `setCustomKillSignatures`.
       - `KeyboardThrower.jsx`: Envia `objectType` no evento `damage`.
       - `server-dev.js`: Armazena `customKillSignatures` (array) para cada participante. No evento `damage`, se for kill, seleciona aleatoriamente uma assinatura do atacante (ou uma padrão se vazio) e a envia como `killTitle` no evento `damageReceived`.
       - `useSalaSocket.js`: Recebe `damageReceived` com `killTitle` e atualiza `lastKillInfo`.
       - **`KillFeedDisplay.jsx`**: Componente dedicado que recebe `lastKillInfo`, gerencia o estado local das notificações (array `killFeed` com `isExiting`), aplica animações CSS e renderiza as `<Notification>`.**
       - `page.js` (`SalaConteudo`): Obtém `lastKillInfo` do hook, formata a mensagem com ícone, e passa os dados formatados como prop para `<KillFeedDisplay>`. 
       - `globals.css`: Contém as definições `@keyframes` e classes CSS para as animações de entrada/saída da notificação.

7. **Placar Pessoal (Pontos e Kills):**
   - **Pontuação:** Acumulada pelo jogador.
       - **ATUALIZADO:** Ganha pontos base (`GAME_CONFIG.POINTS.KILL`) por kill e (`GAME_CONFIG.POINTS.VOTE_REVEALED`) por voto revelado.
       - **ATUALIZADO:** Pontos base são multiplicados por `scoreMultiplier` de itens no inventário (ex: Manifesto Comunista).
       - Score não é resetado.
   - **Kills:** Contagem de eliminações, não resetada.
   - **Exibição:** Kills e Pontos no canto superior direito (`page.js`).

8. **Indicador Visual de Morte:**
   - Quando a vida de um participante (incluindo observadores) chega a 0 ou menos, um ícone de caveira vermelha (`IconSkull`) é exibido no canto inferior direito do seu card (`CartaParticipante`).
   - Isso indica visualmente quem está fora de combate na rodada atual do modo PVP.
   - **Implementação:** Condição e ícone adicionados ao `CartaParticipante.jsx`.

## Próximos Passos
1. **Melhorias de UX**
   - Adicionar animações de transição
   - Melhorar feedback visual
   - Implementar modo escuro ✓
   - Expandir elementos de gamificação com novos objetos arremessáveis

2. **Funcionalidades Adicionais**
   - Histórico de votos
   - Exportação de resultados
   - Configurações personalizadas
   - Sistema de pontuação para elementos de gamificação

3. **Otimizações e Monitoramento**
   - Implementar testes automatizados
   - Monitoramento de erros em produção
   - Análise de métricas de uso
   - Otimização de performance
   - Refatoração do sistema de animações para melhor manutenção ✓
   - Centralização de estilos CSS para melhor organização ✓ 