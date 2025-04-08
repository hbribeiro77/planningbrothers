import React, { useState } from 'react';
import { Stack, Group, Text, Tooltip, ActionIcon, Divider, Box } from '@mantine/core';
import { IconKeyboard, IconShirt, IconStar, IconMask } from '@tabler/icons-react';
import { usePvpStatus } from '@/contexts/PvpContext';
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA, KEYBOARD_ID } from '@/constants/itemsData';

// Mapa de ícones para acessórios
const accessoryIconMap = {
  IconShirt: IconShirt,
  IconKeyboard: IconKeyboard,
  IconStar: IconStar,
  IconMask: IconMask,
  // Adicionar outros mapeamentos aqui conforme necessário
};

// Helper para formatar atributos do item para o Tooltip
function formatItemAttributes(itemData) {
  if (!itemData) return '';
  const attributes = [];
  // Arma
  if (itemData.baseDamageFixed) attributes.push(`Dano Fixo: ${itemData.baseDamageFixed}`);
  if (itemData.baseDamageDice) attributes.push(`Dano Dado: ${itemData.baseDamageDice}`);
  if (itemData.criticalChance) attributes.push(`Crítico: ${itemData.criticalChance * 100}%`);
  // Acessório
  if (itemData.attackBonusFixed) attributes.push(`Atq Fixo: +${itemData.attackBonusFixed}`);
  if (itemData.attackBonusDice) attributes.push(`Atq Dado: +${itemData.attackBonusDice}`);
  if (itemData.defenseFixed) attributes.push(`Def Fixo: +${itemData.defenseFixed}`);
  if (itemData.defenseDice) attributes.push(`Def Dado: +${itemData.defenseDice}`);
  if (itemData.dodgeChance) attributes.push(`Esquiva: ${itemData.dodgeChance * 100}%`);
  
  // Adiciona a descrição principal se houver e outros atributos também
  let tooltipLabel = itemData.name || 'Item Desconhecido';
  if (itemData.description) {
    tooltipLabel += `\n${itemData.description}`; // Usa \n para quebra de linha no tooltip
  }
  // Junta os atributos formatados, se houver
  if (attributes.length > 0) {
      tooltipLabel += `\n(${attributes.join(', ')})`;
  }
  return tooltipLabel;
}

export function InventoryDisplay({ 
  currentUser, 
  onToggleEquip
}) {
  const { pvpStatus } = usePvpStatus();
  
  const [armaSelecionada, setArmaSelecionada] = useState(KEYBOARD_ID);
  const armasDisponiveis = [{ id: 'keyboard', nome: 'Teclado', icon: IconKeyboard }];
  const userAccessories = currentUser?.inventory?.filter(itemId => ITEMS_DATA[itemId]?.type === 'accessory') || [];
  const equippedAccessories = currentUser?.equippedAccessories || [];
  
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
            {armasDisponiveis.map((arma) => {
              const armaData = ITEMS_DATA[arma.id];
              // Formata o label do Tooltip para a arma
              const tooltipLabel = pvpStatus 
                ? formatItemAttributes(armaData)
                : "Seleção desativada (Modo PVP desligado)";
              
              return (
                <Tooltip 
                  key={arma.id} 
                  label={tooltipLabel}
                  openDelay={300}
                  multiline // Permite múltiplas linhas no tooltip
                  w={220} // Define uma largura para o tooltip
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
              );
            })}
          </Group>
        </Stack>

        <Divider orientation="vertical" />

        <Stack align="center" spacing="xs">
          <Text size="sm" weight={500} c="dimmed">Acessórios:</Text>
          <Group position="center" spacing="xs" style={{ minHeight: 42 }}>
            {userAccessories.map((itemId) => {
              const itemData = ITEMS_DATA[itemId];
              if (!itemData) return null;
              
              // Formata o label do Tooltip para o acessório
              const tooltipLabel = formatItemAttributes(itemData);
              
              const isSelected = equippedAccessories.includes(itemId);
              
              const isClickable = isAccessoryClickable(itemId);
              
              const iconRenderColor = isSelected ? '#fff' : itemData.iconColor || 'gray';
              
              // <<< Usar mapa para obter o componente de ícone
              const AccessoryIconComponent = accessoryIconMap[itemData.iconName];
              
              return (
                <Tooltip 
                  key={itemId} 
                  label={tooltipLabel}
                  openDelay={300}
                  multiline // Permite múltiplas linhas
                  w={220} // Define uma largura
                >
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
                          alt={itemData.name || itemId} 
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