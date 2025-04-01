import { useState } from 'react';
import { Switch, Tooltip } from '@mantine/core';
import { KeyboardThrower } from './KeyboardThrower';

export function GameController({ 
  socket,
  codigoSala,
  currentUser
}) {
  const [keyboardMode, setKeyboardMode] = useState(false);
  
  const handleToggleKeyboardMode = (event) => {
    setKeyboardMode(event.currentTarget.checked);
  };
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Tooltip label={keyboardMode ? 'Clique em um participante para arremessar um teclado' : 'Ativar modo diversão'}>
        <Switch
          size="sm"
          onLabel="ON"
          offLabel="OFF"
          checked={keyboardMode}
          onChange={handleToggleKeyboardMode}
          label="Modo Diversão"
        />
      </Tooltip>
      
      <KeyboardThrower
        enabled={keyboardMode}
        socket={socket}
        codigoSala={codigoSala}
        currentUser={currentUser}
      />
    </div>
  );
} 