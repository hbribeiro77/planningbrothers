import { Drawer, Text, Title, Card, Group, Button, Badge, SimpleGrid, ActionIcon, Tooltip } from '@mantine/core';
import { IconShoppingCart, IconCoin, IconShirt, IconHandNinja, IconKeyboard, IconStar, IconMask } from '@tabler/icons-react';
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA } from '@/constants/itemsData';
import { useMantineTheme } from '@mantine/core';

// <<< Criar Mapa de Ícones
const iconMap = {
  IconShirt: IconShirt,
  IconHandNinja: IconHandNinja,
  IconKeyboard: IconKeyboard,
  IconStar: IconStar,
  IconMask: IconMask,
  // Adicionar outros mapeamentos aqui conforme necessário
};

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

      <SimpleGrid cols={1}>
        {/* Mapear sobre os itens da loja */}
        {shopItems.map((item) => {
          const hasItem = userInventory.includes(item.id);
          const canAfford = userScore >= item.price;
          const itemColor = item.iconColor || theme.primaryColor;

          return (
            <Card key={item.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  {
                    item.iconSvgPath ? (
                      // <<< Renderizar IMG se houver caminho SVG
                      <img 
                        src={item.iconSvgPath}
                        alt={item.name} 
                        style={{ 
                          width: 24, 
                          height: 24, 
                          // Adicionar filtro para cor/inversão se necessário
                          // filter: theme.colorScheme === 'dark' ? 'invert(1)' : 'none', 
                        }}
                      />
                    ) : (
                      // <<< Lógica anterior com iconMap se NÃO houver SVG
                      (() => {
                        const ItemIconComponent = iconMap[item.iconName]; 
                        return ItemIconComponent && <ItemIconComponent size={24} color={itemColor} />; 
                      })()
                    )
                  }
                  {/* Placeholder se nenhum ícone for encontrado */}
                  {!item.iconSvgPath && !iconMap[item.iconName] && item.iconName && (
                    <Text size="xs" c="dimmed">?</Text>
                  )}
                  <Title order={5}>{item.name}</Title>
                </Group>
                {(item.id === 'keyboard' || hasItem) && <Badge color="green">Adquirido</Badge>} 
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                {item.description || 'Sem descrição.'} 
              </Text>

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
                  disabled={item.id === 'keyboard' || hasItem || !canAfford}
                  title={item.id === 'keyboard' ? "Arma padrão" : hasItem ? "Você já possui este item" : !canAfford ? "Moedas insuficientes" : "Comprar item"}
                >
                  {item.id === 'keyboard' ? "Padrão" : (hasItem ? "Adquirido" : "Comprar")} 
                </Button>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Drawer>
  );
} 