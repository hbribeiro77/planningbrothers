import { Drawer, Text, Title, Card, Group, Button, Badge } from '@mantine/core';
import { IconCoin } from '@tabler/icons-react';
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA } from '@/constants/itemsData';
import { useMantineTheme } from '@mantine/core';

// Obter itens da loja a partir das constantes
// Filtrar para mostrar apenas itens compráveis, se necessário no futuro
const shopItems = Object.entries(ITEMS_DATA)
  // .filter(([id, data]) => data.isPurchasable) // Exemplo de filtro futuro
  .map(([id, data]) => ({ ...data, id })); // Garante que o ID está no objeto

export default function ShopDrawer({ opened, onClose, currentUser, onBuyItem }) { 
  
  const userScore = currentUser?.score || 0;
  const userInventory = currentUser?.inventory || []; // Garantir que seja um array
  const theme = useMantineTheme();

  const handleBuyClick = (itemId, itemPrice) => {
    console.log(`Tentando comprar: ${itemId}`);
    if (onBuyItem) {
      onBuyItem(itemId, itemPrice);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>Loja</Title>}
      position="right"
      padding="md"
      size="md"
      zIndex={201}
    >
      <Text c="dimmed" size="sm" mb="lg">Gaste suas moedas suadas!</Text>

      {/* Mapear sobre os itens da loja */}
      {shopItems.map((item) => {
        const hasItem = userInventory.includes(item.id);
        const canAfford = userScore >= item.price;
        const ItemIcon = item.icon; // Pega o ícone dos dados do item
        const itemColor = item.iconColor || theme.primaryColor; // Obter cor do item ou usar tema

        return (
          <Card key={item.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                {ItemIcon && <ItemIcon size={24} color={itemColor} />} 
                <Title order={5}>{item.name}</Title>
              </Group>
              {hasItem && <Badge color="green">Adquirido</Badge>} 
            </Group>

            {item.description && (
              <Text size="sm" c="dimmed" mb="md">
                {item.description}
              </Text>
            )}

            <Group justify="space-between" align="center">
              <Group gap={5}>
                 <IconCoin size={16} /> 
                 <Text fw={500}>{item.price}</Text>
              </Group>
              <Button 
                variant="light" 
                color="blue" 
                radius="md"
                onClick={() => handleBuyClick(item.id, item.price)}
                disabled={hasItem || !canAfford}
                title={hasItem ? "Você já possui este item" : !canAfford ? "Moedas insuficientes" : "Comprar item"}
              >
                {hasItem ? "Equipado" : "Comprar"} 
              </Button>
            </Group>
          </Card>
        );
      })}
      {/* Espaço para mais itens no futuro */}
    </Drawer>
  );
} 