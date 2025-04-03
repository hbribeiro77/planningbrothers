import { useState } from 'react';
import { Stack, Group, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconKeyboard } from '@tabler/icons-react';
import { usePvpStatus } from '@/contexts/PvpContext';

// Remover prop keyboardMode
export function InventoryDisplay() {
  // Consumir o contexto
  const { pvpStatus } = usePvpStatus();
  
  const [armaSelecionada, setArmaSelecionada] = useState('keyboard');
  const inventario = [{ id: 'keyboard', nome: 'Teclado', icon: IconKeyboard }];

  const handleSelecionarArma = (armaId) => {
    console.log("Seleção de arma (futuro):", armaId);
  };

  return (
    <Stack align="center" spacing="xs">
      <Text size="sm" weight={500} c="dimmed">Arma:</Text>
      <Group position="center" spacing="xs">
        {inventario.map((arma) => (
          <Tooltip 
            key={arma.id} 
            label={pvpStatus ? arma.nome : "Seleção desativada (Modo PVP desligado)"}
            openDelay={300}
          >
            <ActionIcon
              variant={armaSelecionada === arma.id ? 'filled' : 'light'}
              color={armaSelecionada === arma.id ? 'blue' : 'gray'}
              size="lg"
              onClick={() => handleSelecionarArma(arma.id)}
              disabled={!pvpStatus}
            >
              <arma.icon size={20} />
            </ActionIcon>
          </Tooltip>
        ))}
      </Group>
    </Stack>
  );
} 