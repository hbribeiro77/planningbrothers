# Aprendizados do Projeto

## Sincronização de Estado entre Usuários

### Padrão de Sincronização via Socket.IO

Para sincronizar alterações feitas por um usuário com todos os outros participantes da sala:

1. **No Componente que Faz a Alteração:**
```javascript
// Emite o evento para o servidor
socket.emit('nomeDoEvento', {
  codigo: codigoSala,  // Importante: usar 'codigo' como nome do parâmetro
  // outros dados necessários
});
```

2. **No Servidor (server-dev.js e socket.js):**
```javascript
// Recebe o evento
socket.on('nomeDoEvento', ({ codigo, ...outrosDados }) => {
  if (!salas.has(codigo)) return;
  
  // Repassa para todos os participantes da sala
  io.to(codigo).emit('nomeDoEvento', { ...outrosDados });
});
```

3. **No Componente que Recebe a Atualização:**
```javascript
useEffect(() => {
  if (!socket) return;

  const handleEvento = (data) => {
    // Atualiza o estado local com os dados recebidos
  };

  socket.on('nomeDoEvento', handleEvento);

  return () => {
    socket.off('nomeDoEvento', handleEvento);
  };
}, [socket]);
```

### Pontos Importantes:
- Sempre usar `codigo` (não `codigoSala`) como nome do parâmetro ao emitir eventos
- Verificar se o socket existe antes de configurar listeners
- Limpar listeners no cleanup do useEffect
- Usar o código da sala para garantir que o evento chegue apenas aos participantes corretos

## Boas Práticas

### 1. Logging para Debug
- Adicionar logs estratégicos para monitorar o fluxo de eventos
- Exemplo:
```javascript
console.log('Emitindo evento:', { codigoSala, dados });
console.log('Recebeu evento:', data);
```

### 2. Limpeza de Event Listeners
- Sempre limpar event listeners no cleanup do useEffect
- Prevenir memory leaks e comportamentos inesperados

### 3. Verificação de Socket
- Sempre verificar se o socket existe antes de emitir ou configurar listeners
- Evitar erros quando o socket ainda não está pronto

## Estrutura de Arquivos

### Organização de Componentes
- Manter componentes relacionados próximos
- Usar pastas específicas para tipos de componentes (ex: GameElements)
- Separar lógica de negócio da apresentação

### Gerenciamento de Estado
- Usar estados locais quando possível
- Considerar Context API para estados globais
- Manter estados próximos de onde são utilizados

## Gerenciamento de Estado em Aplicações React com WebSocket

### Estado Local vs Estado Remoto
- Em aplicações multiplayer, estados que precisam ser sincronizados entre usuários devem ter o servidor como fonte única da verdade
- O estado local no cliente deve ser um reflexo do estado remoto
- Evitar inicializar estados locais com valores hardcoded quando eles precisam ser sincronizados

### Boas Práticas
- Usar o estado do `currentUser` (ou dados do servidor) para inicializar estados locais
- Implementar sincronização bidirecional:
  - Servidor → Cliente: Através de dados iniciais e eventos
  - Cliente → Servidor: Através de eventos de mudança
  - Cliente → Cliente: Através de observadores de mudanças
- Utilizar operadores de coalescência nula (`??`) para fallbacks seguros
- Manter o servidor como fonte única da verdade para estados compartilhados

### Exemplo Prático
```javascript
// Antes (problemático)
const [keyboardMode, setKeyboardMode] = useState(true);

// Depois (correto)
const [keyboardMode, setKeyboardMode] = useState(currentUser?.keyboardMode ?? true);

// Sincronização com mudanças do servidor
useEffect(() => {
  if (currentUser?.keyboardMode !== undefined) {
    setKeyboardMode(currentUser.keyboardMode);
  }
}, [currentUser?.keyboardMode]);
```

### Utilizando Estado Sincronizado Diretamente na UI

- Após receber o estado sincronizado do servidor (ex: lista de `participantes` com propriedades como `life`, `jaVotou`, `isObservador`), a lógica de exibição de componentes ou efeitos visuais específicos do cliente (como um overlay de "derrota" ou "atenção") pode ser implementada diretamente no componente que consome esse estado.
- **Exemplo:** Em vez de criar um estado local `mostrarOverlay`, a condição de renderização pode usar diretamente as propriedades do objeto do usuário atual dentro do estado sincronizado:
  ```javascript
  // Dentro do componente SalaConteudo, que recebe 'participantes' do useSalaSocket
  const currentUserData = participantes.find(p => p.nome === nomeUsuario);
  const shouldShowOverlay = currentUserData?.life <= 0 && !currentUserData?.isObservador && !currentUserData?.jaVotou;

  return (
    <>
      {/* ... outros elementos ... */}
      {shouldShowOverlay && <OverlayVermelho />}
    </>
  );
  ```
- Isso evita a necessidade de estados locais adicionais apenas para refletir informações que já estão disponíveis no estado sincronizado, simplificando o fluxo de dados no componente.

### Sincronização de Estado Visual de Itens Equipados

- **Problema:** Tentar controlar a visibilidade de um item equipado (ex: um colete no avatar) usando apenas o estado local do cliente (ex: qual item está 'selecionado' no inventário) causa inconsistências visuais. O jogador que equipa vê o item no avatar, mas os outros jogadores não, pois o estado de seleção local não é compartilhado.
- **Solução:** O estado de qual item está ativamente "equipado" para exibição visual deve ser parte do estado do participante no **servidor** (ex: `participante.equippedAccessory: string | null`).
- **Fluxo:**
    1. O cliente emite um evento (`toggleEquipAccessory`) quando o usuário clica para equipar/desequipar um item.
    2. O servidor recebe o evento, valida a ação (ex: se o jogador possui o item), atualiza o campo `participante.equippedAccessory` (com o ID do item ou `null`).
    3. O servidor emite a atualização completa do estado dos participantes (`atualizarParticipantes`) para todos na sala.
    4. **Todos** os clientes recebem a atualização. A renderização do avatar de *qualquer* participante (ex: `CartaParticipante`) verifica o `participante.equippedAccessory` daquele participante específico para decidir se mostra ou não o visual do item equipado (ex: o SVG do colete).
    5. O estado visual do inventário do *próprio* usuário (ex: cor do ícone do item) também é baseado no `currentUser.equippedAccessory` recebido do servidor.
- **Benefício:** Garante que a aparência visual dos itens equipados nos avatares seja consistente para todos os jogadores, refletindo o estado real gerenciado pelo servidor.

## Sincronização de Eventos e Animações em Multiplayer

### Padrão de Separação de Eventos de Animação e Lógica

Para garantir uma experiência fluida em jogos multiplayer com animações:

1. **Separar Eventos de Animação e Lógica:**
```javascript
// No cliente (emissor)
// Primeiro envia o evento de animação
socket.emit('throwObject', { /* dados */ });

// Depois da animação completar, emite o evento de lógica
setTimeout(() => {
  socket.emit('applyDamage', { /* dados */ });
}, duracaoAnimacao);
```

2. **No Servidor:**
```javascript
// Evento de animação apenas repassa
socket.on('throwObject', (data) => {
  io.to(codigo).emit('throwObject', data);
});

// Evento de lógica processa e atualiza estado
socket.on('applyDamage', (data) => {
  // Processa a lógica
  // Atualiza estados
  // Emite atualizações
});
```

### Pontos Importantes:
- Sincronizar a duração das animações com os eventos de lógica
- Manter o servidor como fonte única da verdade
- Usar timeouts no cliente para coordenar animações e lógica
- Garantir que o estado só é atualizado após a conclusão das animações 

## Otimização de Animações e Eventos em Multiplayer

### Prevenção de Duplicação de Animações

Para evitar que um usuário veja a mesma animação duas vezes em um jogo multiplayer:

1. **Separar Execução Local e Eventos:**
```javascript
// No componente que inicia a ação
const handleAction = () => {
  // Executa a animação localmente
  executeLocalAnimation();
  
  // Emite o evento para outros usuários
  socket.emit('actionEvent', {
    fromUser: currentUser.id,
    // outros dados
  });
};

// No listener do evento
useEffect(() => {
  const handleIncomingAction = (data) => {
    // Ignora o evento se o remetente for o próprio usuário
    if (data.fromUser === currentUser.id) return;
    
    // Executa a animação para outros usuários
    executeAnimation();
  };
  
  socket.on('actionEvent', handleIncomingAction);
  return () => socket.off('actionEvent', handleIncomingAction);
}, [socket, currentUser.id]);
```

### Pontos Importantes:
- Sempre incluir o ID do usuário remetente nos eventos
- Verificar se o remetente é o próprio usuário antes de processar eventos
- Manter a consistência visual entre todos os participantes
- Usar o ID do usuário atual para filtrar eventos locais
- Garantir que animações sejam executadas apenas uma vez por ação

### Exemplo Prático de Sistema de Ataque
```javascript
// No componente de ataque
const handleAttack = (targetId) => {
  // Executa a animação localmente
  throwKeyboardAtAvatar(targetElement, targetId);
  
  // Emite o evento para outros usuários
  socket.emit('throwObject', {
    fromUser: currentUser.id,
    toUser: targetId,
    objectType: 'keyboard'
  });
};

// No listener de eventos de ataque
useEffect(() => {
  const handleIncomingAttack = (data) => {
    // Ignora se o atacante for o próprio usuário
    if (data.fromUser === currentUser.id) return;
    
    // Executa a animação para outros usuários
    const targetElement = document.querySelector(`[data-id="${data.toUser}"]`);
    if (targetElement) {
      throwKeyboardAtAvatar(targetElement, data.toUser);
    }
  };
  
  socket.on('throwObject', handleIncomingAttack);
  return () => socket.off('throwObject', handleIncomingAttack);
}, [socket, currentUser.id]);
```

### Benefícios:
- Evita duplicação de animações para o usuário que iniciou a ação
- Mantém a consistência visual entre todos os participantes
- Reduz a carga de processamento no cliente
- Melhora a experiência do usuário com animações mais suaves
- Facilita a manutenção do código com padrões claros de implementação 

## Layout e UI

### Criando Overlays de Tela Cheia com Bibliotecas de UI

- Ao usar bibliotecas de componentes como Mantine, que frequentemente utilizam `<Container>` ou elementos similares para limitar a largura e adicionar padding ao conteúdo principal, pode ser necessário criar overlays, modais ou outros elementos que ocupem toda a tela (viewport).
- **Técnica:** Para garantir que um elemento cubra toda a tela, ele deve ser renderizado *fora* do container restritivo principal. Utilize CSS `position: fixed` com `top: 0`, `left: 0`, `right: 0`, `bottom: 0` e um `z-index` apropriado.
- **Exemplo de Estrutura:**
  ```jsx
  // Componente de Página/Layout
  return (
    <LayoutPrincipal> // Pode ter alguma estrutura base
      <Container size="lg"> // Container restritivo do Mantine
        {/* Conteúdo principal da página aqui */}
      </Container>

      {/* Overlay/Modal de tela cheia renderizado como irmão do Container */}
      {mostrarOverlay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          Conteúdo do Overlay
        </div>
      )}
    </LayoutPrincipal>
  );
  ```
- Isso garante que o overlay ignore as restrições de largura e padding do container e se expanda por toda a viewport. 

## Compartilhamento de Estado entre Componentes Irmãos/Distantes

### Problema: Sincronizar UI com Estado Interno de Componente Irmão

- **Cenário:** Um componente (ex: `InventoryDisplay` dentro de `OpcoesVotacao`) precisa reagir visualmente (ex: habilitar/desabilitar) a um estado (ex: `keyboardMode`) que é gerenciado internamente por um componente "irmão" ou distante na árvore (ex: `GameController`), cuja lógica de sincronização interna é complexa e sensível a alterações.
- **Tentativas Problemáticas:**
  - **Prop Drilling + Callback:** Tentar fazer o componente com estado (`GameController`) chamar um callback no pai (`SalaConteudo`) para que este atualize um estado próprio e passe via prop drilling para o componente alvo (`InventoryDisplay`). Isso pode quebrar a lógica interna de sincronização do componente original se o callback for adicionado incorretamente às dependências de `useEffect` ou causar renderizações inesperadas.
  - **Controle Externo:** Tentar fazer o componente pai (`SalaConteudo`) controlar o estado diretamente e passá-lo como prop para ambos os componentes (`GameController` e `InventoryDisplay`). Isso também quebra a encapsulação e a lógica interna de sincronização do componente original.

### Solução: Context API para Estado Compartilhado e Sincronizado

- **Abordagem:** Utilizar a Context API do React para criar uma fonte única da verdade para o estado compartilhado.
- **Passos:**
  1.  **Criar Contexto e Provider:** Definir um Contexto específico (ex: `PvpContext`) e um componente Provedor (ex: `PvpProvider`).
  2.  **Centralizar Estado e Lógica no Provider:** Mover o estado compartilhado (ex: `pvpStatus`) e **toda** a lógica relacionada à sua sincronização (ouvir socket, reagir a dados do servidor, emitir eventos de mudança) para dentro do `PvpProvider`.
  3.  **Envolver Componentes:** Envolver a parte da árvore de componentes que necessita do estado compartilhado com o `PvpProvider` (ex: envolver `SalaConteudo`). Passar quaisquer dependências necessárias (socket, dados do usuário, ID da sala) para o Provider via props.
  4.  **Criar Hook Customizado:** Criar um hook simples (ex: `usePvpStatus`) para facilitar o consumo do contexto.
  5.  **Consumir o Contexto:** Fazer os componentes que precisam do estado ou da função de atualização consumirem o contexto usando o hook customizado:
     - O componente que dispara a mudança (ex: `GameController`) obtém a função de atualização (`togglePvpStatus`) do contexto e a chama no evento apropriado (ex: `onChange` do Switch).
     - O componente que reage visualmente (ex: `InventoryDisplay`) obtém o estado (`pvpStatus`) do contexto e o utiliza diretamente em sua lógica de renderização (ex: no atributo `disabled`).
     - O componente que *antes* gerenciava o estado internamente (ex: `GameController`) é refatorado para remover seu estado interno e lógica de sincronização duplicada, tornando-se um consumidor do contexto.
- **Vantagens:**
  - Desacopla os componentes.
  - Cria uma fonte única e clara da verdade para o estado sincronizado.
  - Evita prop drilling complexo.
  - Preserva a lógica de sincronização original, movendo-a para um local centralizado (o Provider).
  - Permite que componentes em diferentes partes da árvore acessem o mesmo estado sincronizado.

### Atenção com Renderização Inicial no Provider

- Ao usar um Provider de Contexto que precisa buscar ou determinar um estado inicial (ex: o estado PVP ao entrar na sala), evite retornar `null` ou um loader *dentro* do Provider enquanto espera. Isso pode impedir a renderização de `children` importantes que não dependem diretamente daquele contexto específico (ex: um overlay de feedback visual renderizado pelo componente pai).
- **Solução:** O Provider deve *sempre* renderizar `<PvpContext.Provider value={value}>{children}</PvpContext.Provider>`. O `value` pode conter um estado inicial padrão ou `null` temporariamente. Os componentes *consumidores* do contexto é que devem lidar com esse estado inicial (ex: exibindo um estado padrão ou esperando que o valor real chegue). 

## Detectando Eventos Implícitos com Estado Auxiliar

### Problema: Reagir à Ocorrência de um Evento, Não Apenas à Mudança de Valor

- **Cenário:** Precisamos disparar um efeito visual (ex: piscar a tela) sempre que um evento específico ocorrer (ex: receber dano), mesmo que o estado principal afetado por esse evento não mude de forma informativa (ex: vida já era 0 e continua 0).
- **Limitação:** Um `useEffect` que depende apenas do estado principal (ex: `currentUser.life`) não será disparado se o valor não mudar.

### Solução: Estado Auxiliar como Sinalizador (Timestamp)

- **Abordagem:** Criar um estado auxiliar que sirva como um sinalizador de que o evento ocorreu.
- **Passos:**
  1.  **Criar Estado Sinalizador:** Em um local apropriado (ex: um hook customizado como `useSalaSocket`), criar um estado simples, como um timestamp: `const [lastDamageTimestamp, setLastDamageTimestamp] = useState(0);`
  2.  **Atualizar no Evento Relevante:** No listener do evento de interesse (ex: `socket.on('damageReceived', ...)`), verificar se o evento se aplica ao contexto desejado (ex: o dano foi para o usuário atual) e, se sim, atualizar o estado sinalizador com um novo valor (ex: `setLastDamageTimestamp(Date.now());`).
  3.  **Retornar o Sinalizador:** Retornar o estado sinalizador do hook ou componente onde ele foi criado.
  4.  **Depender do Sinalizador:** No componente que precisa reagir ao evento (ex: `SalaConteudo` para a piscada), fazer o `useEffect` depender da *mudança* no estado sinalizador (`useEffect(() => { ... }, [lastDamageTimestamp]);`).
  5.  **Verificar Condições Adicionais:** Dentro do `useEffect` disparado pela mudança do sinalizador, verificar quaisquer outras condições necessárias (ex: `currentUser.life <= 0`) antes de executar a ação desejada (ex: `setIsFlashing(true)`).
- **Vantagens:**
  - Permite detectar a ocorrência de eventos específicos mesmo quando o estado principal não muda.
  - Mantém a lógica de reação focada na ocorrência do evento original.

## Gerenciando Configuração de UI Local vs. Estado Compartilhado Sincronizado

### Diferença de Requisitos

- **Estado Compartilhado Sincronizado (ex: Modo PVP):**
  - Precisa ser consistente entre todos os usuários na sala.
  - Mudanças feitas por um usuário devem ser refletidas para todos.
  - Exige uma fonte única da verdade e mecanismos de sincronização (ex: WebSockets + Context API).
- **Configuração de UI Local (ex: Habilitar/Desabilitar Piscada):**
  - Afeta apenas a experiência visual de um único usuário.
  - Não precisa ser sincronizada com outros usuários.
  - Pode ter um gerenciamento de estado mais simples.

### Abordagem para Configuração Local

- **Localização do Estado:** O estado da configuração (ex: `flashEnabled`) pode residir no componente que contém o controle de UI para essa configuração (ex: `GameController` que tem o `Switch`).
- **Comunicação (se necessário):** Se outro componente precisar saber o valor dessa configuração local (ex: `SalaConteudo` precisa saber se deve ativar a piscada), a comunicação pode ser feita de forma mais direta:
  - **Callback:** O componente com o estado (`GameController`) recebe uma função de callback via props (ex: `onFlashEnabledChange`) do componente que precisa ser informado (`SalaConteudo`).
  - **Chamada do Callback:** O componente com o estado chama o callback sempre que o estado da configuração local mudar (ex: no `onChange` do Switch ou em um `useEffect` dependente do estado).
  - **Armazenamento no Destino:** O componente que recebe a informação (`SalaConteudo`) armazena o valor em seu próprio estado local (ex: `isFlashEffectEnabled`).
- **Benefícios:**
  - Evita a complexidade desnecessária da Context API para configurações puramente locais.
  - Mantém o estado próximo de onde ele é controlado.
  - Separa claramente as preocupações entre estado global sincronizado e preferências locais de UI. 

## Implementação de Funcionalidades e Depuração (Kill Feed)

### 1. Complexidade da Limpeza de `useEffect` com Operações Assíncronas

*   **Contexto:** Ao implementar notificações que desaparecem após um `setTimeout`, se o `useEffect` que agenda o timer também tiver esse timer em sua função de limpeza e depender de um estado que muda rapidamente (como `lastKillInfo`), a limpeza pode cancelar o timer da notificação anterior antes que ela desapareça.
*   **Solução:** Em cenários onde cada operação assíncrona (cada `setTimeout`) deve completar independentemente das atualizações que a desencadearam, a função de limpeza do `useEffect` que agenda a operação deve ser omitida (ou gerenciada de forma diferente, como apenas na desmontagem do componente).
*   **Aprendizado:** Entender o ciclo de vida do `useEffect`, incluindo quando sua função de limpeza é chamada (antes da próxima execução do efeito ou na desmontagem), é crucial para lidar corretamente com efeitos colaterais assíncronos, especialmente em resposta a eventos frequentes.

### 2. Validação Defensiva no Backend (Fonte Única da Verdade)

*   **Contexto:** Mesmo com validações no frontend para prevenir ações inválidas (ex: impedir clique no próprio avatar para atacar), eventos correspondentes a essas ações inválidas ainda podem chegar ao backend.
*   **Solução:** O backend deve sempre realizar suas próprias validações e verificações nos dados recebidos do cliente antes de modificar o estado ou executar lógica crítica (ex: verificar se `atacanteId !== alvoId` antes de aplicar dano).
*   **Aprendizado:** O backend é a fonte única da verdade e deve ser robusto contra dados potencialmente inválidos ou inesperados do cliente. A validação no servidor é essencial para a segurança, integridade dos dados e prevenção de comportamentos indesejados.

### 3. Rastreamento do Fluxo de Dados Fim-a-Fim

*   **Contexto:** Adicionar uma informação simples (o tipo de arma usada) a uma funcionalidade existente (notificação de kill) exigiu modificações em toda a cadeia:
    1.  **Emissão (Frontend):** Incluir o dado no evento Socket.IO.
    2.  **Recepção e Processamento (Backend):** Ler o dado, usá-lo na lógica e incluí-lo na resposta.
    3.  **Recepção e Armazenamento (Hook Frontend):** Ler o dado da resposta e armazená-lo no estado.
    4.  **Utilização (UI Frontend):** Acessar o dado do estado e usá-lo para renderização condicional.
*   **Aprendizado:** O desenvolvimento de funcionalidades em aplicações cliente-servidor requer atenção cuidadosa ao fluxo completo de dados. É importante mapear e implementar as alterações necessárias em cada camada (UI, estado do cliente, comunicação, lógica do servidor) para garantir que a informação correta esteja disponível onde e quando for necessária.

### 4. Sincronização Proativa de Valores Padrão Definidos na UI

*   **Contexto:** Ao introduzir assinaturas de kill com valores padrão sugeridos na UI (`GameController`), o backend não utilizava esses padrões, pois eles só existiam localmente no frontend até que o usuário interagisse e salvasse.
*   **Solução:** O componente frontend (`GameController`) foi modificado para, ao detectar que precisa usar os valores padrão (porque o usuário não tem valores salvos), enviar proativamente esses padrões para o servidor via evento Socket.IO (`setCustomKillSignatures`) durante sua inicialização (`useEffect`).
*   **Aprendizado:** Quando a UI define valores padrão que devem impactar a lógica centralizada no backend (fonte da verdade), é necessário um mecanismo para sincronizar esses padrões iniciais com o servidor, garantindo que o estado do servidor reflita a configuração padrão desejada desde o início, mesmo sem interação explícita do usuário para salvar.

### 5. Diferença entre Placeholders e Valores Padrão Ativos (UX)

*   **Contexto:** O usuário inicialmente esperava que as sugestões visíveis nos campos de assinatura (placeholders) fossem usadas automaticamente se os campos fossem deixados vazios.
*   **Solução:** A lógica foi ajustada para tratar as sugestões como valores padrão *ativos*: se o usuário não tem assinaturas salvas, as sugestões são carregadas nos campos *e* salvas automaticamente no servidor.
*   **Aprendizado:** É importante considerar a expectativa do usuário em relação a valores padrão e placeholders. Um placeholder é apenas uma dica visual, enquanto um valor padrão ativo deve ser funcionalmente utilizado se nenhuma outra entrada for fornecida. Alinhar o comportamento da aplicação com essa expectativa (neste caso, fazendo os placeholders agirem como padrões ativos iniciais) melhora a usabilidade.

### 6. Separação de Concerns: Animação CSS vs. Estilos de Componentes UI

*   **Contexto:** Ao tentar aplicar classes CSS de animação diretamente a um componente de biblioteca UI (`<Notification>`), encontramos conflitos que impediram a aplicação correta dos estilos de fundo da variante (`light`) do componente.
*   **Solução:** Separamos as responsabilidades envolvendo o componente `<Notification>` em um `<div>` wrapper. As classes CSS de animação foram aplicadas ao wrapper (controlando `opacity` e `transform`), enquanto o `<Notification>` interno ficou responsável apenas pela sua aparência (usando props como `variant`, `color` ou `styles` para definir `backgroundColor`, `border`, etc.).
*   **Aprendizado:** Ao integrar animações CSS customizadas com bibliotecas de componentes, pode ser necessário isolar a animação em um elemento wrapper para evitar conflitos de especificidade ou sobrescrita de estilos. Isso permite que o componente UI interno funcione como esperado, enquanto o wrapper controla a transição na tela.

### 7. Reincidência de Bugs em Refatorações e Mudanças de Abordagem

*   **Contexto:** Corrigimos um bug de timer (notificação presa) causado pela limpeza incorreta do `useEffect` ao usar `<Transition>`. Mais tarde, ao refatorar para usar animações CSS customizadas, reintroduzimos o mesmo bug por colocar a limpeza no `useEffect` errado novamente.
*   **Solução:** A solução foi a mesma em ambos os casos: remover a função de limpeza do `useEffect` que dependia do gatilho do evento (`lastKillInfo`), permitindo que os timers de cada notificação rodassem independentemente.
*   **Aprendizado:** Refatorações ou mudanças na abordagem de implementação (ex: trocar biblioteca de animação por CSS puro) carregam o risco de reintroduzir bugs já corrigidos se os padrões lógicos fundamentais não forem cuidadosamente reavaliados no novo contexto. É crucial prestar atenção especial a aspectos sensíveis como o ciclo de vida de efeitos (`useEffect`) e o gerenciamento de operações assíncronas para garantir que as correções anteriores persistam. 

## Refinamento da Lógica e Estado no Backend

1.  **Evolução do Modelo de Dados e Lógica de Eventos:**
    *   *Lição:* À medida que os requisitos da aplicação evoluem (ex: adicionar contador de `kills`, alterar o momento de conceder pontos por voto), é necessário refinar tanto o modelo de dados no servidor quanto a lógica nos manipuladores de eventos Socket.IO (`server-dev.js`).
    *   *Exemplos Técnicos:*
        *   **Extensão do Estado:** Adicionar novas propriedades (`kills`) ao objeto do participante no evento `entrarSala` e garantir sua persistência (não resetar em `reiniciarVotacao`).
        *   **Modificação da Lógica:** Remover o incremento de `score` do evento `votar` e adicioná-lo ao evento `revelarVotos`, iterando sobre os participantes para aplicar a lógica condicionalmente (`if (participante.jaVotou)`).
    *   *Padrão Reforçado:* O backend continua sendo a fonte da verdade para o estado e as regras. As alterações são feitas centralmente e depois propagadas para os clientes através de eventos de atualização (ex: `atualizarParticipantes`).

## Detalhes Técnicos de Bibliotecas (Mantine UI)

1.  **Funções Auxiliares (`theme.fn`):**
    *   *Lição:* Verificar a disponibilidade e o comportamento de funções auxiliares específicas da biblioteca (`theme.fn.variant` neste caso) na versão/configuração utilizada, pois podem não existir ou funcionar como esperado.
    *   *Alternativa Robusta:* Acessar valores diretamente da estrutura do tema (`theme.colors.red[7]`) tende a ser mais seguro e menos propenso a quebras entre versões ou configurações diferentes ao buscar cores específicas. 

## Centralização e Cálculo de Atributos de Combate (Novo)

*   **Problema:** Lógica de dano, defesa e chance de crítico estava espalhada (parte em `gameConfig.js`, parte hardcoded, parte ausente). O cliente enviava o valor do dano, criando uma vulnerabilidade.
*   **Solução Técnica:**
    1.  **Centralizar Dados:** Mover *todos* os atributos de combate (dano base fixo/dado, bônus de ataque fixo/dado, defesa fixa/dada, chance de crítico) para um único arquivo (`src/constants/itemsData.js`). Tratar armas (`type: 'weapon'`) e acessórios (`type: 'accessory'`) como itens dentro desta estrutura.
    2.  **Simplificar Config Geral:** Remover as configurações de `DAMAGE` e `COMBAT` de `src/constants/gameConfig.js`, deixando-o apenas com regras gerais (vida, pontos, etc.).
    3.  **Cálculo no Servidor:** Refatorar o listener `attack` no servidor (`src/server-dev.js`) para:
        *   Receber apenas o tipo de arma (`objectType`) do cliente.
        *   Buscar os dados da arma e acessórios relevantes em `ITEMS_DATA`.
        *   Rolar dados para componentes aleatórios (`rollDice` helper).
        *   Calcular ataque total, verificar crítico, calcular defesa total e determinar o dano final.
        *   Emitir o resultado (`damageReceived`) para os clientes.
*   **Aprendizado:** Centralizar todos os atributos que definem o comportamento de itens (armas, armaduras, etc.) em uma única fonte de dados (`itemsData.js`) e fazer o servidor (fonte da verdade) realizar todos os cálculos de regras de combate aumenta a segurança, organização, manutenibilidade e facilita a adição de novos itens/armas com comportamentos complexos.

## Compatibilidade de Módulos (CommonJS Backend vs. ESM Frontend)

*   **Problema:** O servidor Node.js (`server-dev.js`, usa `require`) falhava ao tentar importar `itemsData.js` porque este usava `export` (ESM), formato esperado pelo frontend React/Next.js (`import`).
*   **Solução Técnica:**
    1.  Converter `itemsData.js` para usar `module.exports` (CommonJS), removendo referências diretas a componentes React (como `IconShirt`) que não podem ser serializados ou requeridos pelo Node.
    2.  Adicionar um campo substituto nos dados (ex: `iconName: 'IconShirt'`).
    3.  Ajustar os componentes frontend (`ShopDrawer.jsx`, `InventoryDisplay.jsx`) para:
        *   Importar os componentes React necessários (`IconShirt`) diretamente.
        *   Ler o `iconName` dos dados e renderizar o componente correspondente condicionalmente.
*   **Aprendizado:** Em projetos full-stack com JavaScript, é vital estar ciente das diferenças entre os sistemas de módulos CommonJS (Node.js) e ES Modules (Navegador/React). Ao compartilhar arquivos de configuração/dados, pode ser necessário adotar o formato CommonJS para compatibilidade com o backend. **Isso frequentemente exige refatoração no frontend para lidar com a perda de referências diretas a funções ou componentes, como usar mapas de ícones (`iconMap`, `accessoryIconMap`) para traduzir nomes de ícones (strings) em componentes React (`IconBook`, `IconMedal`, etc.) no momento da renderização.**

## Depuração de Renderização Visual de Estado Sincronizado

*   **Problema:** Após implementar a sincronização do `equippedAccessory` via servidor, o avatar no frontend não refletia visualmente a mudança, apesar dos logs confirmarem que os dados corretos chegavam aos componentes.
*   **Soluções Investigadas e Aplicadas:**
    1.  **Propagação de Props:** Garantir que o componente pai (`Mesa.jsx`) recalculasse a distribuição dos participantes a cada renderização, usando a prop `participantes` atualizada, para que os dados corretos fossem passados para `CartaParticipante.jsx`.
    2. **Conflito de Módulos (Frontend):** Componentes do frontend (`CartaParticipante`, `InventoryDisplay`) tentavam usar uma função helper (`isAccessory`) importada de `itemsData.js` (que foi convertido para CommonJS). A solução foi remover a importação e fazer a verificação diretamente nos dados (`itemData?.type === 'accessory'`).
    3.  **Ordem de Empilhamento (CSS):** O elemento visual do acessório (`VestIcon` dentro de `CartaParticipante`) estava sendo renderizado com `z-index` inferior a outros elementos (badges, texto). Aumentar o `z-index` do acessório resolveu a sobreposição.
*   **Aprendizado:** Falhas na renderização visual de um estado que *parece* estar corretamente sincronizado podem ter múltiplas causas. É essencial depurar sistematicamente: (1) a propagação das props atualizadas na árvore de componentes, (2) a compatibilidade de importações/funções entre frontend/backend (especialmente após mudanças no sistema de módulos), e (3) fatores puramente visuais como CSS `z-index`.

## Posicionamento CSS de Elementos Dinâmicos (Números de Dano)

*   **Problema:** Um elemento (`div` com número de dano) criado dinamicamente via JavaScript e adicionado ao DOM com `position: absolute` estava aparecendo no local errado (canto da tela) em vez de sobre o elemento alvo (avatar).
*   **Solução Técnica:** Adicionar `position: relative` via CSS (ou `style` inline) ao elemento pai (`div.carta-participante`) onde o número de dano estava sendo anexado (`appendChild`).
*   **Aprendizado:** O contexto de posicionamento é fundamental para `position: absolute`. Um elemento posicionado absolutamente se alinha em relação ao ancestral posicionado mais próximo. Se nenhum ancestral tiver `position` definido (diferente de `static`), ele se alinha em relação ao `<body>` ou à viewport. Garantir que o pai direto tenha `position: relative` é a prática comum para conter elementos posicionados absolutamente dentro dele. 

## Lidando com Valores Obsoletos (Stale Closures) em Callbacks Assíncronos

*   **Problema:** Um callback agendado com `setTimeout` (ou usado em listeners de eventos) pode capturar ("fechar sobre") o valor de props ou estados que existiam no momento em que o callback foi *definido*, não no momento em que ele é *executado*. Se o valor da prop/estado mudar antes do callback rodar, ele usará o valor antigo e obsoleto, levando a bugs.
*   **Cenário Específico:** A função `throwKeyboardAtAvatar` em `KeyboardThrower.jsx` agenda um `setTimeout`. A função dentro do `setTimeout` precisa usar o valor da prop `volume` para tocar o som. No entanto, se a prop `volume` mudasse entre o clique do usuário e a execução do `setTimeout`, a função interna usaria o valor de `volume` que existia no momento do clique, ignorando a atualização e potencialmente tocando o som com volume errado ou não aplicando o mute corretamente.
*   **Solução Técnica (`useRef`):** Utilizar `useRef` para manter uma referência ao valor mais atual da prop ou estado problemático.
    1.  **Criar Ref:** `const volumeRef = useRef(volume);` (Inicializa com o valor atual da prop `volume`).
    2.  **Atualizar Ref:** Usar `useEffect` para atualizar o `.current` do ref sempre que a prop/estado mudar: 
        ```jsx
        useEffect(() => {
          volumeRef.current = volume;
        }, [volume]);
        ```
    3.  **Ler Ref no Callback:** Dentro do callback assíncrono (`setTimeout`, listener, etc.), ler o valor *atual* da referência: `const currentVolume = volumeRef.current;`. Usar este valor atual na lógica.
*   **Aprendizado:** Ao usar props ou estados dentro de callbacks assíncronos (`setTimeout`, `setInterval`, listeners de eventos adicionados em `useEffect`), esteja ciente do risco de *stale closures*. Se você precisa garantir que o callback use o valor *mais recente* da prop/estado, use `useRef` para armazenar esse valor e leia `ref.current` dentro do callback. Isso desacopla o callback do valor capturado no momento da sua definição. 

## Layout com Elementos Posicionados Absolutamente (Caso `LifeBar`)

*   **Problema:** Ao mover o Nome do participante para fora e acima do Card (`CartaParticipante`), a `LifeBar`, que era renderizada com `position: absolute; top: -10px;` dentro do Card, começou a sobrepor o Nome.
*   **Tentativas Incorretas:**
    1.  Mover a renderização da `LifeBar` para o componente pai (`Mesa.jsx`) fora do `CartaParticipante`. Isso quebrou a lógica de visibilidade da `LifeBar` (controlada por contexto e `avatarId`) e a fez aparecer em locais errados (dentro da "mesa" central).
    2.  Tentar posicionar a `LifeBar` abaixo do Card *ainda dentro* do `CartaParticipante` usando `position: absolute; bottom: -8px;`. Isso falhou porque o posicionamento absoluto é relativo ao pai posicionado mais próximo (o próprio `Paper` do Card). `bottom: -8px` a empurrava para baixo, mas ainda *dentro* do limite visual do `Paper`, não para fora dele.
*   **Solução Correta:**
    1.  **Manter Renderização no Card:** A `LifeBar` deve continuar sendo renderizada *dentro* do `CartaParticipante.jsx`, pois sua lógica de visibilidade depende do `avatarId` do participante.
    2.  **Modificar Estilo Interno da LifeBar:** A alteração de posicionamento (de `top: -10px` para `bottom: -8px`) deve ser feita *dentro* do próprio componente `LifeBar.jsx`. Isso garante que o posicionamento seja aplicado corretamente em relação ao container pai (`Paper` do `CartaParticipante`).
    3.  **Garantir `overflow: visible` no Pai:** O componente pai (`Paper` do `CartaParticipante`) precisa ter `overflow: visible` (ou não ter `overflow: hidden`) para permitir que a `LifeBar` (posicionada com `bottom` negativo) seja exibida *fora* de seus limites visuais.
*   **Aprendizado:** Ao lidar com elementos posicionados absolutamente que precisam "sair" visualmente de seus contêineres pais:
    1.  Mantenha a renderização do elemento onde sua lógica faz sentido (neste caso, `LifeBar` dentro de `CartaParticipante`).
    2.  Controle o posicionamento absoluto diretamente nos estilos do *próprio* elemento (`LifeBar.jsx`).
    3.  Certifique-se de que o contêiner pai (`CartaParticipante`) permita que o conteúdo transborde visualmente (`overflow: visible`).
    4.  Evite mover a renderização de componentes com lógica de contexto específica para locais onde o contexto não está disponível ou não faz sentido. 

## Gerenciamento de Efeitos Passivos vs. Ativos no Cálculo de Atributos (NOVO)

*   **Problema:** Como aplicar bônus de itens de forma diferenciada? Alguns bônus devem valer apenas por possuir o item (passivos), enquanto outros exigem que o item esteja equipado (ativos).
*   **Contexto:** Itens como "Manifesto Comunista" (multiplicador de score) ou "Medalha de 5 Anos" (bônus de chance de crítico/esquiva) devem conceder seus benefícios passivamente, apenas por estarem no inventário. Já bônus de ataque/defesa ou chances base (como a esquiva do "Treinamento Ninja") só fazem sentido se o item estiver ativamente equipado.
*   **Solução Técnica:**
    1.  **Identificação via `equipSlot`:** Utilizar um valor específico, como `equipSlot: 'passive'`, em `itemsData.js` para marcar itens cujos bônus são aplicados passivamente.
    2.  **Lógica de Cálculo Dupla no Servidor:** No `server-dev.js`, ao calcular atributos finais:
        *   Para bônus **passivos** (`scoreMultiplier`, `criticalChanceBonus`, `dodgeChanceBonus`): Iterar sobre o `participante.inventory` e somar/aplicar os bônus de todos os itens relevantes encontrados.
        *   Para bônus/bases **ativas** (`attackBonusFixed`, `defenseFixed`, `dodgeChance`, etc.): Iterar sobre `participante.equippedAccessories` e considerar apenas os valores dos itens efetivamente equipados.
*   **Aprendizado:** Diferenciar bônus passivos de ativos no modelo de dados (`itemsData.js`) e adaptar a lógica de cálculo no servidor para ler do `inventory` ou `equippedAccessories` conforme o tipo de bônus permite criar efeitos de itens mais ricos e flexíveis, mantendo a lógica centralizada e consistente.

## Sincronização de Tooltip de Status (Cliente vs. Servidor) (NOVO)

*   **Problema:** Como exibir informações complexas e calculadas (status consolidados do jogador) em um tooltip de forma consistente com a lógica do servidor, especialmente após mudanças nessa lógica (ex: bônus passivos lidos do inventário)?
*   **Solução Técnica (Tooltip no Nome em `Mesa.jsx`):**
    1.  **Recálculo no Cliente:** Criar/Manter uma função auxiliar no componente frontend (`formatConsolidatedBonus` em `Mesa.jsx`) que *replica* a lógica de cálculo de atributos do servidor, buscando dados em `ITEMS_DATA` e lendo `inventory` e `equippedAccessories` do participante.
    2.  **Manter Sincronia Lógica:** É **crucial** que esta função cliente seja mantida sincronizada com a lógica de cálculo do servidor. Se o servidor muda como calcula um bônus (ex: passa a ler do inventário), a função cliente *deve* ser atualizada também.
    3.  **Renderização Multiline Robusta:** Para exibir cada atributo em uma linha separada no tooltip do Mantine (`multiline`), a função cliente deve retornar um *array* de strings (cada string uma linha). O componente `Tooltip` deve então usar `.map()` na prop `label` para renderizar cada string dentro de um componente `<Text>`:
        ```jsx
        <Tooltip
          label={(
            <>
              {arrayDeStatus.map((linha, i) => <Text key={i} size="xs">{linha}</Text>)}
            </>
          )}
          // ... outras props
        />
        ```
*   **Aprendizado:** Exibir dados calculados em tooltips no cliente exige cuidado. Recalcular no cliente pode ser mais simples que passar dados complexos via props/estado, mas cria uma dependência de sincronia manual com a lógica do servidor. Usar a técnica de mapear para componentes `<Text>` é a forma mais confiável de obter formatação multiline em tooltips de bibliotecas como Mantine. 

## Depuração de Eventos e Animações Duplicadas em Tempo Real

*   **Problema:** Em cenários com múltiplos usuários interagindo rapidamente (ex: vários ataques simultâneos), observou-se que a animação de dano visual no cliente era exibida múltiplas vezes para uma única ação de ataque. O número de animações duplicadas parecia correlacionado com o número de outros jogadores na sala.
*   **Investigação Inicial (Incorreta):** A primeira hipótese foi a duplicação de listeners de eventos (`socket.on('damageReceived')`) no cliente devido a re-renderizações incorretas. Foram feitas tentativas de isolar o listener em `useEffect` com dependências mínimas.
*   **Diagnóstico Correto (Logs + Rastreamento):**
    1.  **Logs do Servidor:** Logs detalhados no servidor (`server-dev.js`) mostraram que, para um único ataque, o servidor estava processando corretamente e emitindo **apenas um** evento `damageReceived`.
    2.  **Rastreamento do Fluxo de Eventos do Cliente:** Uma análise mais profunda do fluxo de eventos no cliente (`KeyboardThrower.jsx`) revelou a causa raiz: o evento `attack` (que solicita o cálculo de dano ao servidor) estava sendo emitido não apenas pelo cliente *atacante* original, mas também por **todos** os clientes *observadores* que recebiam o evento de animação (`throwObject`). Cada cliente (atacante e observadores) executava a função `throwKeyboardAtAvatar`, que continha um `setTimeout` para sincronizar com a animação, e **dentro desse `setTimeout` todos emitiam o `attack`**.
*   **Solução Técnica:**
    1.  **Centralizar Emissão do Evento Lógico:** O evento `attack` foi removido de dentro do `setTimeout` em `throwKeyboardAtAvatar`.
    2.  **Emitir Apenas pelo Iniciador:** A emissão do `socket.emit('attack', ...)` foi movida para o manipulador de eventos original do atacante (`handleClick` em `KeyboardThrower.jsx`), garantindo que apenas o jogador que clica para atacar envie o evento de lógica ao servidor.
    3.  **Sincronização de Animação/Lógica (Ajuste Fino):** Para que a animação do número de dano (acionada pela resposta `damageReceived` do servidor) aparecesse sincronizada com a animação de colisão visual (que tem um delay), a emissão do `attack` no `handleClick` foi movida de volta para dentro do `setTimeout` de 400ms em `throwKeyboardAtAvatar`, mas com uma condição `if (isAttacker)` adicionada. A função `throwKeyboardAtAvatar` foi modificada para aceitar um parâmetro `isAttacker`, que é passado como `true` apenas quando chamado pelo `handleClick` do atacante.
*   **Aprendizado:**
    1.  **Distinguir Eventos de Animação vs. Lógica:** É fundamental separar eventos que servem apenas para sincronizar animações visuais entre clientes (ex: `throwObject`) de eventos que disparam lógica de negócio no servidor (ex: `attack`).
    2.  **Fonte Única para Eventos Lógicos:** Eventos que modificam o estado do jogo ou disparam cálculos no servidor devem ser emitidos **apenas uma vez** e pela fonte correta (geralmente, o cliente que iniciou a ação).
    3.  **Rastreamento Cuidadoso:** Depurar problemas em tempo real pode exigir rastrear o fluxo completo de eventos, desde a interação inicial do usuário até a resposta final do servidor e a reação do cliente, para identificar onde a lógica está divergindo.
    4.  **Sincronização de Timing:** Ao usar `setTimeout` para alinhar animações e lógica, certifique-se de que apenas o processo relevante (o atacante, neste caso) dispare o evento lógico após o delay. 

## Gamificação e Interação de Features (Minerador, Itens Passivos)

### 1. Centralização de Configurações é Crucial
- **Lição:** Evitar valores "mágicos" (hardcoded) no código. Configurações de itens (stats, chances, recompensas como do Lucky Strike) devem residir em `src/constants/itemsData.js`, enquanto configurações gerais do jogo (volume padrão, pontos por ação) devem estar em `src/constants/gameConfig.js`.
- **Benefício:** Facilita manutenção, balanceamento e testes. Permite ajustar o comportamento do jogo sem modificar a lógica principal.

### 2. Validação Crítica no Server-Side
- **Lição:** Embora o cliente possa iniciar lógicas (como o intervalo do Minerador), a validação final e a modificação do estado compartilhado (score, vida) *devem* ocorrer no servidor.
- **Exemplo:** O servidor *precisa* verificar se o `BITCOIN_MINER_ID` está em `participante.equippedAccessories` ao receber o evento `generate_passive_income`, mesmo que o cliente já tenha feito essa verificação.
- **Benefício:** Previne trapaças e garante a integridade do estado do jogo.

### 3. Interação entre Features Requer Cuidado
- **Lição:** Ao adicionar novas mecânicas (Lucky Strike) que interagem com existentes (Manifesto Comunista, geração base do Minerador), a ordem das operações e as interdependências devem ser cuidadosamente analisadas e implementadas.
- **Exemplo:** A refatoração da lógica `generate_passive_income` foi necessária para garantir que o multiplicador do Manifesto fosse aplicado corretamente *após* determinar se a recompensa era normal ou Lucky Strike.
- **Benefício:** Garante que as mecânicas funcionem juntas como esperado, evitando bugs de lógica.

### 4. Flexibilidade no Estado da UI para Eventos Múltiplos
- **Lição:** Componentes de UI que exibem informações de diferentes tipos de eventos (como o `KillFeedDisplay` mostrando Kills e Lucky Strikes) podem precisar de uma estrutura de estado mais genérica.
- **Exemplo:** A refatoração de `lastKillInfo` para `lastFeedEvent` (com um campo `type`) no hook `useSalaSocket` e a adaptação dos componentes consumidores (`page.js`, `KillFeedDisplay.jsx`) foram necessárias para acomodar o novo tipo de notificação.
- **Benefício:** Torna a UI mais extensível para futuros tipos de eventos sem exigir refatorações massivas a cada nova adição.

### 5. Responsabilidade Clara dos Componentes
- **Lição:** A decisão de onde colocar estados e lógicas (ex: intervalo do minerador no `GameController`, formatação do feed no `page.js`) deve considerar quais componentes têm acesso aos dados necessários (props, contexto) e qual é a responsabilidade primária de cada um (controle de jogo vs. orquestração da página).
- **Benefício:** Mantém o código organizado e facilita o rastreamento do fluxo de dados e lógica.