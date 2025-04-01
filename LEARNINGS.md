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