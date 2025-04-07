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
  - @tabler/icons-react 2.40.0
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
│   │   │   ├── Participante.jsx # Card de Participante (Avatar)
│   │   │   └── Votacao.jsx      # Card de Votação clicável
│   │   ├── GameElements/     # Componentes de gamificação
│   │   │   ├── KeyboardThrower.jsx # Sistema de arremesso de teclado
│   │   │   ├── GameController.jsx # Controlador de elementos de gamificação e configurações
│   │   │   ├── LifeBar.jsx   # Barra de vida dos participantes
│   │   │   ├── KillFeedDisplay.jsx # Exibe as notificações de eliminação
│   │   │   └── InventoryDisplay.jsx # Exibe inventário de armas e acessórios
│   │   ├── Mesa/             # Componentes da mesa de Planning Poker
│   │   │   └── Mesa.jsx      # Componente principal da mesa
│   │   ├── Sala/             # Componentes da sala
│   │   │   └── OpcoesVotacao.jsx # Agrupa opções de voto e inventário
│   │   └── Shop/             # Componentes da Loja
│   │       └── ShopDrawer.jsx  # Painel lateral da loja de itens
│   ├── contexts/             # Contextos React
│   │   ├── SocketContext.js  # Gerenciamento do Socket.io
│   │   ├── LifeBarContext.jsx # Gerenciamento da visibilidade da barra de vida
│   │   └── PvpContext.jsx    # Gerenciamento do estado PVP compartilhado
│   ├── hooks/                # Hooks personalizados
│   │   ├── useSalaSocket.js  # Lógica de eventos da sala
│   │   └── useSalaUiEffects.js # Lógica de efeitos visuais da sala (animações, piscada)
│   ├── constants/            # Constantes e configurações
│   │   ├── socketEvents.js   # Eventos do Socket.io (idealmente)
│   │   └── gameConfig.js     # Configurações GERAIS do jogo (vida, pontos, tempos)
│   │   └── itemsData.js      # Dados dos ITENS (armas, acessórios) com stats de combate
│   ├── services/             # Serviços da aplicação
│   │   └── AnimationService.jsx # Serviço de animações centralizado (agora .jsx)
│   ├── styles/               # Estilos CSS
│   │   └── animations.css    # Animações e efeitos visuais
│   ├── utils/                # Utilitários e funções auxiliares
│   │   └── browserToken.js   # Gerenciamento de token e identificação do navegador
│   ├── lib/                  # Bibliotecas e configurações
│   │   └── mantine/          # Configurações do Mantine UI
│   ├── pages/                # Páginas legadas (em migração)
│   └── server-dev.js         # Servidor de desenvolvimento
├── public/                   # Arquivos estáticos
│   ├── audio/                # Arquivos de áudio
│   │   └── beat.wav
│   ├── images/              # Imagens e recursos gráficos
│   │   └── game-objects/    # Recursos para elementos de gamificação
│   │       ├── keyboard.svg # Ícone de teclado para arremesso
│   │       ├── collision.svg # Efeito de explosão
│   │       └── vest.svg      # Ícone do Colete DPE
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
     - **Definição Centralizada (`itemsData.js`):** Armas (`type: 'weapon'`) e Acessórios (`type: 'accessory'`) são definidos com seus atributos:
       - **Armas:** Dano base (fixo e/ou dado - ex: `'1d6'`), chance de crítico (`criticalChance`).
       - **Acessórios:** Bônus de ataque (fixo/dado), Defesa (fixo/dado).
     - **Cálculo de Dano no Servidor:**
       - O servidor recebe o evento `attack` (com o tipo de arma usada).
       - Calcula o ataque total: (Dano base da arma + Bônus de ataque do acessório do atacante), rolando dados conforme necessário.
       - Verifica chance de crítico (da arma): Se crítico, dano = vida atual do alvo.
       - Se não crítico, calcula defesa total: (Defesa do acessório do alvo), rolando dados.
       - Dano final = `max(0, Ataque Total - Defesa Total)`.
     - **Feedback Visual:** Exibição do dano final sofrido no avatar, com indicação especial ("CRITICAL!") para acertos críticos.
   - **Loja e Inventário:**
     - Loja (`ShopDrawer`) permite comprar itens definidos em `itemsData.js` usando score.
     - Inventário (`InventoryDisplay`) mostra armas e acessórios possuídos.
     - Teclado padrão (`type: 'weapon'`) é adicionado automaticamente ao inventário inicial.
   - **Acessórios Equipáveis:**
     - Acessórios podem ser equipados/desequipados via inventário.
     - Estado `equippedAccessory` sincronizado pelo servidor.
     - Acessório equipado é exibido visualmente no avatar (`CartaParticipante`).
   - **Controles e Configurações (`GameController`):**
     - Ativação/desativação do Modo PVP.
     - Configuração de efeitos visuais/sonoros (Som, Piscada de Dano Vermelha).
     - Configuração de assinaturas de eliminação.
   - **Kill Feed (Notificação de Eliminação):**
     - Notificações visuais com pontuação (`POINTS.KILL` de `gameConfig.js`) e estatísticas (kills) atualizadas.
     - Exibe mensagens personalizadas (assinaturas) e o tipo de arma usada na eliminação.

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
     - Resposta de dano (`damageReceived`) - Enviado pelo servidor com dano final e flag de crítico.
     - Compra de item (`buyItem`)
     - Equipar/Desequipar acessório (`toggleEquipAccessory`)
     - Mudança de modo PvP (`funModeChanged`)
     - Definição de assinaturas (`setCustomKillSignatures`)

3. **Estado da Aplicação**
   - **Servidor:** Fonte única da verdade, realiza cálculos de combate (dano, crítico) com base nos dados de `itemsData.js`.
   - **Cliente:** Reflete estado do servidor, inicia animações de ataque, ouve `damageReceived` para exibir dano final/crítico.

## Segurança
1. **Variáveis de Ambiente**
   - Uso de `.env` para desenvolvimento
   - Configurações sensíveis não versionadas
   - Template disponível em `.env.example`

2. **Boas Práticas**
   - CORS configurado para produção
   - Validação de entrada de dados
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
   - Sistema de dano calculado no servidor:
     - Considera ataque base da arma (fixo + dado).
     - Considera bônus de ataque do acessório do atacante (fixo + dado).
     - Considera defesa do acessório do alvo (fixo + dado).
     - Inclui chance de acerto crítico (definida pela arma).
   - Exibição do valor de dano final ou "CRITICAL!" no avatar atingido.
   - Animações centralizadas.

2. **Sistema de Vida e Feedback**
   - Barra de vida visual dinâmica.
   - Visibilidade da barra para todos ao receber dano.
   - Feedback visual de dano crítico.
   - Piscada vermelha na tela do jogador atingido (se condições aplicáveis).
   - Sincronização em tempo real.
   - Configurações de vida máxima e tempos em `gameConfig.js`.

3. **Sistema de Itens (Armas e Acessórios)**
   - Definição centralizada em `itemsData.js` com tipos (`weapon`, `accessory`) e atributos de combate.
   - Loja para aquisição de itens.
   - Inventário para visualização e gerenciamento (equipar/desequipar acessórios).
   - Exibição visual de acessórios equipados nos avatares.

4. **GameController**
   - Componente para interação com elementos de gamificação.
   - Interface de controle (Drawer) para ativar/desativar funcionalidades como Som, Modo PVP e **Efeito de Piscada ao Sofrer Dano (Morto)**.
   - Consome e atualiza o estado PVP através do `PvpContext`.
   - Renderiza componentes como `KeyboardThrower`.

5. **Sistema de Configuração**
   - Arquivo centralizado `gameConfig.js` para todas as configurações do jogo
   - Ajuste fácil de parâmetros como vida máxima, dano e tempos
   - Separação clara entre configurações de vida, dano, tempo e animação
   - Facilidade para adicionar novos tipos de dano e objetos no futuro
   - Manutenção simplificada com todas as configurações em um único lugar

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
   *   **Pontuação:** Acumulada pelo jogador durante a sessão.
       *   `+1 ponto` por cada eliminação (`kill`) realizada.
       *   `+10 pontos` por participar da votação (concedidos ao revelar os votos da rodada).
       *   A pontuação não é resetada entre as rodadas de votação.
   *   **Kills:** Contagem de eliminações realizadas pelo jogador.
       *   Incrementada a cada eliminação realizada.
       *   A contagem não é resetada entre as rodadas de votação.
   *   **Exibição:** A contagem de Kills (ícone de caveira) e a Pontuação (ícone de moeda) do usuário atual são exibidas no canto superior direito da tela (`page.js`).
   *   **Implementação:** Lógica de incremento e persistência no `server-dev.js`; exibição no `page.js`.

8. **Indicador Visual de Morte:**
   *   Quando a vida de um participante (incluindo observadores) chega a 0 ou menos, um ícone de caveira vermelha (`IconSkull`) é exibido no canto inferior direito do seu card (`CartaParticipante.jsx`).
   *   Isso indica visualmente quem está fora de combate na rodada atual do modo PVP.
   *   **Implementação:** Condição e ícone adicionados ao `CartaParticipante.jsx`.

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