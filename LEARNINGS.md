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