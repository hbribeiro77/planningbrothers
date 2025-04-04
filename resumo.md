# Resumo do Projeto Planning Poker

## Visão Geral
Aplicação web para facilitar sessões de Planning Poker em equipes ágeis, permitindo votação em tempo real através de WebSocket.

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
│   │   ├── GameElements/     # Componentes de gamificação
│   │   │   ├── KeyboardThrower.jsx # Sistema de arremesso de teclado
│   │   │   ├── GameController.jsx # Controlador de elementos de gamificação
│   │   │   └── LifeBar.jsx   # Barra de vida dos participantes
│   │   ├── Mesa/             # Componentes da mesa de Planning Poker
│   │   │   └── Mesa.jsx      # Componente principal da mesa
│   │   ├── Participante/     # Componentes de participante
│   │   │   └── Card.jsx      # Card de participante
│   │   └── Sala/             # Componentes da sala
│   │       └── OpcoesVotacao.jsx # Opções de votação
│   ├── contexts/             # Contextos React
│   │   ├── SocketContext.js  # Gerenciamento do Socket.io
│   │   └── LifeBarContext.jsx # Gerenciamento da visibilidade da barra de vida
│   │   └── PvpContext.jsx    # Gerenciamento do estado PVP compartilhado
│   ├── hooks/                # Hooks personalizados
│   │   └── useSalaSocket.js  # Lógica de eventos da sala
│   ├── constants/            # Constantes e configurações
│   │   ├── socketEvents.js   # Eventos do Socket.io
│   │   └── gameConfig.js     # Configurações do jogo (vida, dano, tempos)
│   ├── services/             # Serviços da aplicação
│   │   └── AnimationService.js # Serviço de animações centralizado
│   ├── styles/               # Estilos CSS
│   │   └── animations.css    # Animações e efeitos visuais
│   ├── utils/                # Utilitários e funções auxiliares
│   │   └── browserToken.js   # Gerenciamento de token e identificação do navegador
│   ├── lib/                  # Bibliotecas e configurações
│   │   └── mantine/          # Configurações do Mantine UI
│   ├── pages/                # Páginas legadas (em migração)
│   └── server-dev.js         # Servidor de desenvolvimento
├── public/                   # Arquivos estáticos
│   ├── images/              # Imagens e recursos gráficos
│   │   └── game-objects/    # Recursos para elementos de gamificação
│   │       ├── keyboard.svg # Ícone de teclado para arremesso
│   │       └── collision.svg # Efeito de explosão
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
   - Atualização instantânea dos votos
   - Revelação de votos controlada

3. **Interface do Usuário**
   - Design responsivo com Mantine UI
   - Feedback visual das ações
   - Identificação de moderador da sala
   - Modo observador para stakeholders

4. **Gerenciamento de Sessão**
   - Verificação de sessão por token e navegador
   - Prevenção de sessões duplicadas do mesmo navegador
   - Identificação única de participantes
   - Fluxos diferentes para criação e convites

5. **Elementos de Gamificação**
   - Sistema de arremesso de teclado para interação divertida entre participantes
   - Efeitos visuais de animação, explosão e ricochete
   - Feedback tátil com efeito de tremor no avatar atingido
   - Sistema de vida com barra de status visual
   - Dano baseado no tipo de objeto arremessado
   - Comunicação em tempo real via WebSockets para sincronização multiplayer
   - **Estado PVP (Modo Diversão) compartilhado via Context API (`PvpContext`)** para sincronização entre componentes.
   - `GameController` para interação com elementos de gamificação e **controle de ativação do modo PVP (via contexto)**.
   - **Configuração de efeitos visuais (Som, Piscada de Dano)** na interface do `GameController`.
   - Sistema de configuração centralizado para ajuste fácil de parâmetros do jogo
   - Barra de vida que aparece apenas quando o participante recebe dano
   - Feedback visual de dano com cores dinâmicas na barra de vida
   - **Seleção de arma desabilitada visualmente quando o modo PVP está desligado.**

## Fluxo de Dados
1. **Conexão**
   - Cliente conecta ao servidor Socket.io via WebSocket
   - Gerenciamento de reconexão automática

2. **Eventos da Sala**
   - Entrada/saída de participantes
   - Votação e cancelamento de votos
   - Revelação de votos
   - Atualização de status
   - Alternância de modo observador
   - Interações de gamificação (arremesso de objetos)

3. **Estado da Aplicação**
   - Gerenciamento via Context API (Socket.io, Barra de Vida, **Estado PVP**)
   - Persistência de estado durante a sessão

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

1. **Sistema de Arremesso de Teclado**
   - Animação fluida do teclado voando pela tela
   - Efeito de ricochete após impacto com rotação contínua
   - Feedback visual com efeito de explosão no avatar atingido
   - Animação de tremor no participante que recebe o arremesso
   - Sistema de dano baseado no tipo de objeto
   - Dano configurável via arquivo de configuração centralizado
   - Exibição do valor de dano quando um avatar é atingido
   - Animações centralizadas em um único arquivo CSS para melhor manutenção
   - Prevenção de duplicação de animações para o atacante

2. **Sistema de Vida**
   - Barra de vida visual que aparece quando um participante recebe dano
   - Visibilidade da barra de vida para todos os participantes quando um avatar é atingido
   - Dano baseado no tipo de objeto arremessado
   - Feedback visual de dano com cores dinâmicas (verde, amarelo, laranja, vermelho)
   - Sincronização em tempo real entre todos os participantes
   - Estado gerenciado pelo servidor para consistência
   - Configurações centralizadas para vida máxima, dano e tempos de animação
   - Transições suaves de visibilidade da barra de vida
   - Tempo configurável para exibição da barra de vida após receber dano

3. **Sistema de Ataque**
   - Direção aleatória de ataque (esquerda/direita)
   - Animações sincronizadas para todos os participantes
   - Efeitos visuais otimizados para evitar duplicação
   - Sistema de eventos para garantir consistência entre atacante e alvo
   - Prevenção de ataques múltiplos simultâneos
   - Feedback visual consistente para todos os participantes

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