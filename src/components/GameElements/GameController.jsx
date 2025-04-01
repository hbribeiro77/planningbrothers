import { useState, useEffect } from 'react';
import { Switch, Tooltip, ActionIcon, Drawer, Stack, Text, Group } from '@mantine/core';
import { IconSettings, IconKeyboard, IconVolume } from '@tabler/icons-react';
import { KeyboardThrower } from './KeyboardThrower';

export function GameController({ 
  socket,
  codigoSala,
  currentUser
}) {
  const [keyboardMode, setKeyboardMode] = useState(currentUser?.keyboardMode ?? true);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keyboardKey, setKeyboardKey] = useState(0); // Chave para forçar remontagem

  // Atualiza o keyboardMode quando o currentUser mudar
  useEffect(() => {
    if (currentUser?.keyboardMode !== undefined) {
      setKeyboardMode(currentUser.keyboardMode);
    }
  }, [currentUser?.keyboardMode]);

  // Escuta mudanças do modo diversão de outros jogadores
  useEffect(() => {
    if (!socket) return;

    const handleFunModeChange = (data) => {
      console.log('Recebeu mudança de modo diversão:', data);
      setKeyboardMode(data.enabled);
    };

    socket.on('funModeChanged', handleFunModeChange);

    return () => {
      socket.off('funModeChanged', handleFunModeChange);
    };
  }, [socket]);
  
  const handleToggleKeyboardMode = (event) => {
    const newMode = event.currentTarget.checked;
    setKeyboardMode(newMode);
    
    // Emite mudança do modo diversão para outros jogadores
    if (socket) {
      console.log('Emitindo mudança de modo diversão:', { codigoSala, enabled: newMode });
      socket.emit('funModeChanged', {
        codigo: codigoSala,
        enabled: newMode
      });
    }
  };

  const handleToggleSound = (event) => {
    setSoundEnabled(event.currentTarget.checked);
    // Força remontagem do KeyboardThrower
    setKeyboardKey(prev => prev + 1);
  };
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <Tooltip label="Configurações do jogo">
        <ActionIcon 
          variant="light" 
          color="blue" 
          onClick={() => setDrawerOpened(true)}
        >
          <IconSettings size={16} />
        </ActionIcon>
      </Tooltip>
      
      <KeyboardThrower
        key={keyboardKey}
        enabled={keyboardMode}
        socket={socket}
        codigoSala={codigoSala}
        currentUser={currentUser}
        soundEnabled={soundEnabled}
      />

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title="Configurações do Jogo"
        position="right"
        size="sm"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Ajuste as configurações do jogo
          </Text>

          <Group position="apart" mt="md">
            <Text size="sm" c="dimmed">
              <IconKeyboard size={16} style={{ marginRight: 4 }} />
              Modo PVP
            </Text>
            <Switch
              size="sm"
              checked={keyboardMode}
              onChange={handleToggleKeyboardMode}
            />
          </Group>

          <Group position="apart" mt="md">
            <Text size="sm" c="dimmed">
              <IconVolume size={16} style={{ marginRight: 4 }} />
              Som
            </Text>
            <Switch
              size="sm"
              checked={soundEnabled}
              onChange={handleToggleSound}
            />
          </Group>
        </Stack>
      </Drawer>
    </div>
  );
} 