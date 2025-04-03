import { useState, useEffect } from 'react';
import { Switch, Tooltip, ActionIcon, Drawer, Stack, Text, Group } from '@mantine/core';
import { IconSettings, IconKeyboard, IconVolume } from '@tabler/icons-react';
import { KeyboardThrower } from './KeyboardThrower';
import { usePvpStatus } from '@/contexts/PvpContext';

export function GameController({ 
  socket,
  codigoSala,
  currentUser,
  armaSelecionada
}) {
  const { pvpStatus, togglePvpStatus } = usePvpStatus();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keyboardKey, setKeyboardKey] = useState(0);

  const handleToggleSound = (event) => {
    setSoundEnabled(event.currentTarget.checked);
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
        enabled={pvpStatus} 
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
              checked={pvpStatus} 
              onChange={(event) => togglePvpStatus(event.currentTarget.checked)}
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