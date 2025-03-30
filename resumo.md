# Resumo do Projeto Planning Poker

## Visão Geral
Aplicação web para facilitar sessões de Planning Poker em equipes ágeis, permitindo votação em tempo real através de WebSocket.

## Tecnologias Principais
- **Frontend**: Next.js 14, React, Mantine UI (@mantine/core, @mantine/hooks)
- **Backend**: Node.js com Express e Socket.io
- **Comunicação em Tempo Real**: Socket.io com WebSocket

## Estrutura do Projeto
```
planningbrothers/
├── src/
│   ├── app/                    # Páginas e rotas Next.js
│   │   ├── sala/              # Páginas relacionadas à sala
│   │   └── layout.js          # Layout principal
│   ├── components/            # Componentes React
│   │   ├── Mesa/             # Componentes da mesa de Planning Poker
│   │   └── ...               # Outros componentes
│   ├── contexts/             # Contextos React
│   │   └── SocketContext.js  # Gerenciamento do Socket.io
│   ├── hooks/                # Hooks personalizados
│   │   └── useSalaSocket.js  # Lógica de eventos da sala
│   ├── constants/            # Constantes e configurações
│   │   └── socketEvents.js   # Eventos do Socket.io
│   └── server-dev.js         # Servidor de desenvolvimento
├── public/                   # Arquivos estáticos
└── package.json             # Dependências e scripts
```

## Funcionalidades Principais
1. **Criação de Salas**
   - Geração de código único para cada sala
   - Interface intuitiva para criar/entrar em salas

2. **Votação em Tempo Real**
   - Sistema de votação usando Socket.io
   - Atualização instantânea dos votos
   - Revelação de votos controlada

3. **Interface do Usuário**
   - Design responsivo com Mantine UI
   - Feedback visual das ações
   - Identificação de moderador da sala
   - Modo observador para stakeholders

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

## Como Executar
1. Instalar dependências:
```bash
npm install
```

2. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

3. Acessar aplicação:
   - Abrir http://localhost:3000 no navegador

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