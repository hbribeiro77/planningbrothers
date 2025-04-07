import React, { useState } from 'react';
import { Stack, Group, Text, Tooltip, ActionIcon, Divider, Box } from '@mantine/core';
import { IconKeyboard, IconShirt, IconHandNinja, IconStar, IconMask } from '@tabler/icons-react';
import { usePvpStatus } from '@/contexts/PvpContext';
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA } from '@/constants/itemsData';

// <<< Criar Mapa de Ícones (mesmo mapa)
const accessoryIconMap = {
  IconShirt: IconShirt,
  IconHandNinja: IconHandNinja,
  IconKeyboard: IconKeyboard,
  IconStar: IconStar,
  IconMask: IconMask,
  // Adicionar outros mapeamentos aqui conforme necessário
};

export function InventoryDisplay({ 
  currentUser, 
  onToggleEquip
}) {
  const { pvpStatus } = usePvpStatus();
  
  const [armaSelecionada, setArmaSelecionada] = useState('keyboard');
  const armasDisponiveis = [{ id: 'keyboard', nome: 'Teclado', icon: IconKeyboard }];
  const userAccessories = currentUser?.inventory?.filter(itemId => ITEMS_DATA[itemId]?.type === 'accessory') || [];
  
  const isAccessoryClickable = (itemId) => 
    ITEMS_DATA[itemId]?.type === 'accessory' && userAccessories.includes(itemId);

  const handleSelecionarArma = (armaId) => {
    console.log("Seleção de arma (futuro):", armaId);
  };

  return (
    <Box>
      <Group align="flex-start" spacing="lg">
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

        <Divider orientation="vertical" />

        <Stack align="center" spacing="xs">
          <Text size="sm" weight={500} c="dimmed">Acessórios:</Text>
          <Group position="center" spacing="xs" style={{ minHeight: 42 }}>
            {userAccessories.map((itemId) => {
              const itemData = ITEMS_DATA[itemId];
              if (!itemData) return null;
              
              const itemName = itemData.name || itemId;
              const accessoryColor = itemData.iconColor || 'gray';
              
              const isSelected = currentUser?.equippedAccessory === itemId;
              
              const isClickable = isAccessoryClickable(itemId);
              
              const iconRenderColor = isSelected ? '#fff' : accessoryColor;
              
              // <<< Usar mapa para obter o componente de ícone
              const AccessoryIconComponent = accessoryIconMap[itemData.iconName];
              
              return (
                <Tooltip key={itemId} label={itemName} openDelay={300}>
                  <ActionIcon
                    variant={isSelected ? 'filled' : 'outline'} 
                    color={isSelected ? 'blue' : 'gray'}
                    size="lg"
                    disabled={!isClickable}
                    onClick={() => isClickable && onToggleEquip(itemId)}
                  >
                    {
                      itemData.iconSvgPath ? (
                        // <<< Renderizar IMG se houver caminho SVG
                        <img 
                          src={itemData.iconSvgPath}
                          alt={itemName} 
                          style={{ 
                            width: 20, // Ajustar tamanho para ActionIcon
                            height: 20, 
                            // Adicionar filtro? (considerar fundo do ActionIcon)
                            // filter: isSelected ? 'brightness(0) invert(1)' : (theme.colorScheme === 'dark' ? 'invert(1)' : 'none'),
                          }}
                        />
                      ) : (
                        // <<< Lógica anterior com accessoryIconMap se NÃO houver SVG
                        (() => {
                          const AccessoryIconComponent = accessoryIconMap[itemData.iconName];
                          return AccessoryIconComponent && <AccessoryIconComponent size={20} color={iconRenderColor} />;
                        })()
                      )
                    }
                    {/* Placeholder se não encontrar SVG nem Ícone Mapeado */}
                    {!itemData.iconSvgPath && !accessoryIconMap[itemData.iconName] && itemData.iconName && (
                      <Text size="xs" c="dimmed">?</Text>
                    )}
                  </ActionIcon>
                </Tooltip>
              );
            })}
            {userAccessories.length === 0 && (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Nenhum</Text>
            )}
          </Group>
        </Stack>
      </Group>
    </Box>
  );
} 