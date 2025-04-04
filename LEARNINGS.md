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