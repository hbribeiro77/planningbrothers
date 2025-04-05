import { useState } from 'react';
import { Stack, Group, Text, Tooltip, ActionIcon, Divider, Box } from '@mantine/core';
import { IconKeyboard, IconShirt } from '@tabler/icons-react';
import { usePvpStatus } from '@/contexts/PvpContext';

// Definição dos acessórios conhecidos e seus ícones
const accessoryIcons = {
  vest: IconShirt,
  // Adicionar outros acessórios aqui
};

export function InventoryDisplay({ currentUser }) {
  const { pvpStatus } = usePvpStatus();
  
  const [armaSelecionada, setArmaSelecionada] = useState('keyboard');
  const armasDisponiveis = [{ id: 'keyboard', nome: 'Teclado', icon: IconKeyboard }];
  // Obter acessórios do inventário do currentUser passado via prop
  const userAccessories = currentUser?.inventory?.filter(itemId => accessoryIcons[itemId]) || [];

  const handleSelecionarArma = (armaId) => {
    console.log("Seleção de arma (futuro):", armaId);
  };

  return (
    // Usar Box para agrupar armas e acessórios lado a lado
    <Box>
      <Group align="flex-start" spacing="lg">
        {/* Seção Armas */}
        <Stack align="center" spacing="xs">
          <Text size="sm" weight={500} c="dimmed">Arma:</Text>
          <Group position="center" spacing="xs">
            {armasDisponiveis.map((arma) => (
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

        {/* Divisor Vertical - Renderizar sempre para manter layout */}
        <Divider orientation="vertical" />

        {/* --- Seção Acessórios - Renderizar sempre --- */}
        <Stack align="center" spacing="xs">
          <Text size="sm" weight={500} c="dimmed">Acessórios:</Text>
          <Group position="center" spacing="xs" style={{ minHeight: 42 }}>
            {userAccessories.map((itemId) => {
              const AccessoryIcon = accessoryIcons[itemId];
              const itemName = itemId; // Usar o ID como nome por enquanto
              return (
                <Tooltip key={itemId} label={itemName} openDelay={300}>
                  <ActionIcon
                    variant="outline"
                    color="gray"
                    size="lg"
                    disabled
                  >
                    <AccessoryIcon size={20} />
                  </ActionIcon>
                </Tooltip>
              );
            })}
            {userAccessories.length === 0 && (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Nenhum</Text>
            )}
          </Group>
        </Stack>
        {/* --------------------------- */}
      </Group>
    </Box>
  );
} 