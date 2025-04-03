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