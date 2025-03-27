# Planejamento da Aplicação de Planning Poker

## Visão Geral
Uma aplicação web para facilitar sessões de Planning Poker em equipes ágeis, permitindo que os participantes estimem o esforço de desenvolvimento de forma colaborativa e divertida.

## Funcionalidades Principais

### 1. Gerenciamento de Sessões
- Criar novas sessões de Planning Poker
- Entrar em sessões existentes via código/link
- Definir papel (moderador/participante)

### 2. Gerenciamento de Usuários
- Entrada direta com nome (sem necessidade de cadastro)
- Representação visual dos usuários ao redor de uma mesa

### 3. Mecânica de Votação
- Seleção de cartas de 1 a 5 e carta de interrogação (?)
- Votação simultânea e oculta
- Revelação sincronizada de votos

### 4. Visualização de Resultados
- Exibição dos votos de cada participante
- Estatísticas simples dos resultados
- Destacar consenso ou divergência

## Interface do Usuário

### Tela Inicial
- Campo para digitar o nome do usuário
- Opções para criar nova sala ou entrar em sala existente
- Design minimalista

### Sala de Planning Poker

#### Conceito Visual Principal
- **Mesa Retangular** no centro da tela
- Participantes representados como "cartas" posicionadas ao redor da mesa
- Cada carta mostra o nome do participante

#### Elementos da Interface
- **Cabeçalho**: Nome da sala e código para compartilhar
- **Área da Mesa**: Visualização central com todos os participantes
- **Cartas de Voto**: Numeradas de 1 a 5 e carta "?"
- **Área de Resultados**: Visível após revelação dos votos
- **Controles do Moderador**: Nova rodada, revelar votos

#### Interações
- Animação quando um participante entra na sala
- Indicador visual de quem já votou
- Animação sincronizada na revelação das cartas
- Reorganização automática das posições quando participantes entram/saem

## Estados da Aplicação

1. **Aguardando Votação**: Cartas disponíveis, participantes podem selecionar
2. **Votação em Andamento**: Indicação de quem já votou (sem mostrar valores)
3. **Revelação**: Animação de virar as cartas, mostrar todos os votos
4. **Discussão**: Resultados visíveis, destacando consenso/divergência
5. **Nova Rodada**: Reset para o primeiro estado

## Tecnologias Sugeridas

- **Frontend**: React com Next.js (já configurado no projeto)
- **Estilização**: Mantine (conforme configuração existente)
- **Comunicação em Tempo Real**: WebSockets (Socket.io)
- **Deploy**: Vercel ou similar

## Próximos Passos

1. Criação dos componentes básicos da interface
2. Implementação da lógica de criação/entrada em salas
3. Desenvolvimento do sistema de votação
4. Implementação da visualização de resultados
5. Refinamentos visuais e melhorias na experiência do usuário 