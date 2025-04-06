import { useState } from 'react';
import { Stack, Group, Text, Tooltip, ActionIcon, Divider, Box } from '@mantine/core';
import { IconKeyboard, IconShirt } from '@tabler/icons-react';
import { usePvpStatus } from '@/contexts/PvpContext';

// Definição dos acessórios conhecidos e seus ícones
const accessoryIcons = {
  vest: IconShirt,
  // Adicionar outros acessórios aqui
};

// Definição dos dados dos itens (nome para o tooltip)
// TODO: Mover para um arquivo de constantes compartilhado (e.g., src/constants/itemsData.js)
const itemsData = {
  vest: { 
    name: 'Colete DPE', 
    // outras props se necessário, como descrição, etc.
  },
  // Adicionar outros itens aqui
};

const COLETE_DPE_ID = 'vest'; // << Usar ID constante

export function InventoryDisplay({ 
  currentUser, 
  onToggleEquip
}) {
  const { pvpStatus } = usePvpStatus();
  
  const [armaSelecionada, setArmaSelecionada] = useState('keyboard');
  const armasDisponiveis = [{ id: 'keyboard', nome: 'Teclado', icon: IconKeyboard }];
  // Obter acessórios do inventário do currentUser passado via prop
  const userAccessories = currentUser?.inventory?.filter(itemId => accessoryIcons[itemId]) || [];
  
  // Acessório clicável SE tiver exatamente um E ele for o Colete DPE
  const isColeteDPEClicable = userAccessories.length === 1 && userAccessories[0] === COLETE_DPE_ID;

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
              const itemName = itemsData[itemId]?.name || itemId; 
              
              // Verifica se ESTE item é o Colete DPE
              const isThisColeteDPE = itemId === COLETE_DPE_ID;
              
              // Está selecionado SE este for o Colete DPE E ele estiver equipado no currentUser
              const isSelected = isThisColeteDPE && currentUser?.equippedAccessory === COLETE_DPE_ID;
              
              // Define se ESTE ícone específico é clicável (é Colete DPE e o único acessório)
              const isClickable = isColeteDPEClicable && isThisColeteDPE;
              
              return (
                <Tooltip key={itemId} label={itemName} openDelay={300}>
                  <ActionIcon
                    variant={isSelected ? 'filled' : 'outline'} 
                    color={isSelected ? 'blue' : 'gray'} // << Mudar para 'blue' quando selecionado
                    size="lg"
                    disabled={!isClickable} 
                    onClick={() => isClickable && onToggleEquip(itemId)} // Chama onToggleEquip SÓ se clicável
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