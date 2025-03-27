# Planning Brothers - Aplicação de Planning Poker

## Visão Geral

Planning Brothers é uma aplicação web para a realização de sessões de Planning Poker em equipes ágeis. O Planning Poker é uma técnica de estimativa usada em metodologias ágeis, onde os membros da equipe avaliam o esforço necessário para implementar user stories usando cartas com valores numéricos.

A aplicação permite:
- Participar de uma sala de Planning Poker com vários membros
- Votar em histórias usando cartas numeradas de 1 a 5 e "?"
- Revelar os votos de todos os participantes simultaneamente
- Ver estatísticas como média, moda e nível de consenso
- Alternar entre modo participante e modo observador
- Iniciar novas rodadas de votação

## Tecnologias Utilizadas

- **Frontend**: React, Next.js 14+
- **UI**: Mantine v7
- **Ícones**: Tabler Icons
- **Estilização**: CSS-in-JS via Mantine

## Estrutura do Projeto

```
src/
├── app/                     # Estrutura de páginas Next.js
│   ├── globals.css          # Estilos globais
│   ├── layout.js            # Layout principal da aplicação
│   ├── page.js              # Página inicial (formulário de entrada)
│   └── sala/[codigo]/page.js # Página da sala de Planning Poker
├── components/              # Componentes reutilizáveis
│   ├── Carta/               # Componentes relacionados às cartas
│   │   └── Participante.jsx # Card que representa um participante
│   │   └── Votacao.jsx      # Carta de voto (não incluída no commit)
│   ├── Mesa/                # Componentes da mesa de Planning Poker
│   │   └── Mesa.jsx         # Mesa central onde os votos são exibidos
│   └── Sala/                # Componentes específicos da sala
│       └── OpcoesVotacao.jsx # Opções de voto do usuário
```

## Principais Componentes

### `page.js` (Página Inicial)
Formulário simples que solicita o nome do usuário e código da sala antes de entrar na sessão de Planning Poker.

### `sala/[codigo]/page.js`
Componente principal que gerencia o estado da aplicação:
- Lista de participantes e seus votos
- Estado de revelação dos votos
- Voto do usuário atual
- Modo observador
- Funções para votar, cancelar voto, revelar votos e iniciar nova rodada

### `Mesa/Mesa.jsx`
Renderiza a mesa central com:
- Distribuição de participantes em volta da mesa
- Tabela de resultados quando os votos são revelados
- Estatísticas (média, moda, consenso)
- Botão para revelar votos

### `Carta/Participante.jsx`
Representa um participante na mesa:
- Exibe o nome do participante
- Indica se já votou ou não
- Mostra o valor votado (quando revelado)
- Identifica moderadores com um badge "M"
- Identifica observadores com um badge "O" e um ícone de olho

### `Sala/OpcoesVotacao.jsx`
Exibe as opções de votação para o usuário:
- Cartas com valores de 1 a 5 e "?"
- Permite selecionar e cancelar o voto
- Esconde-se quando o usuário está no modo observador

## Fluxo de Dados

1. O usuário entra com nome e código da sala
2. A página da sala é carregada com os participantes iniciais
3. Os participantes votam clicando nas cartas
4. O moderador revela os votos quando todos votaram
5. Estatísticas são calculadas e exibidas na mesa
6. O moderador pode iniciar uma nova rodada

## Funcionalidades Especiais

### Modo Observador
- Permite que usuários observem a sessão sem participar da votação
- Ativado/desativado através do botão "Modo Observador"
- Participantes em modo observador são identificados visualmente

### Layout Responsivo
- Interface se adapta a diferentes tamanhos de tela
- Elementos se redimensionam proporcionalmente
- Distribuição adequada dos participantes em torno da mesa

## Como Executar o Projeto

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Execute o servidor de desenvolvimento: `npm run dev`
4. Acesse `http://localhost:3000` no navegador

## Estado Atual e Limitações

Este projeto é um protótipo funcional com dados simulados. Em uma implementação completa, seria necessário:

- Implementar a comunicação em tempo real via Socket.io
- Adicionar persistência de dados com um backend
- Implementar autenticação de usuários
- Desenvolver funcionalidades adicionais como histórico de sessões

## Notas de Implementação

- O layout foi otimizado para evitar scrollbars, criando uma experiência de aplicativo
- A mesa se ajusta automaticamente ao número de participantes
- As interações são intuitivas, como clicar na mesma carta para cancelar o voto 