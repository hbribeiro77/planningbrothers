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
│   │   ├── Mesa/             # Componentes da mesa de Planning Poker
│   │   │   └── Mesa.jsx      # Componente principal da mesa
│   │   ├── Participante/     # Componentes de participante
│   │   │   └── Card.jsx      # Card de participante
│   │   └── Sala/             # Componentes da sala
│   │       └── OpcoesVotacao.jsx # Opções de votação
│   ├── contexts/             # Contextos React
│   │   └── SocketContext.js  # Gerenciamento do Socket.io
│   ├── hooks/                # Hooks personalizados
│   │   └── useSalaSocket.js  # Lógica de eventos da sala
│   ├── constants/            # Constantes e configurações
│   │   └── socketEvents.js   # Eventos do Socket.io
│   ├── utils/                # Utilitários e funções auxiliares
│   │   └── browserToken.js   # Gerenciamento de token e identificação do navegador
│   └── server-dev.js         # Servidor de desenvolvimento
├── public/                   # Arquivos estáticos
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

3. **Estado da Aplicação**
   - Gerenciamento via Context API
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

## Próximos Passos
1. **Melhorias de UX**
   - Adicionar animações de transição
   - Melhorar feedback visual
   - Implementar modo escuro

2. **Funcionalidades Adicionais**
   - Histórico de votos
   - Exportação de resultados
   - Configurações personalizadas

3. **Otimizações e Monitoramento**
   - Implementar testes automatizados
   - Monitoramento de erros em produção
   - Análise de métricas de uso
   - Otimização de performance 