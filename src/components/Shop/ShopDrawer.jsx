import { Drawer, Text, Title, Card, Group, Button, Badge } from '@mantine/core';
import { IconShirt, IconCoin } from '@tabler/icons-react';

// Definir informações do item
const shopItems = [
  {
    id: 'vest',
    name: 'Colete DPE',
    description: 'Um leve aumento na sua moral (e estilo).',
    price: 1,
    icon: IconShirt,
  },
  // Adicionar mais itens aqui no futuro
];

// Modificar para receber currentUser
export default function ShopDrawer({ opened, onClose, currentUser, onBuyItem }) { 
  
  // Encontrar o item "Colete" (poderia ser mais genérico no futuro)
  const vestItem = shopItems.find(item => item.id === 'vest');

  if (!vestItem) return null; // Caso o item não exista

  const userScore = currentUser?.score || 0;
  const userInventory = currentUser?.inventory || []; // Garantir que seja um array
  const hasVest = userInventory.includes(vestItem.id);
  const canAfford = userScore >= vestItem.price;

  const handleBuyClick = () => {
    console.log(`Tentando comprar: ${vestItem.id}`);
    // Chamar a função passada por prop (que emitirá o evento)
    if (onBuyItem) {
      onBuyItem(vestItem.id, vestItem.price);
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

      {/* Card do Item */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <vestItem.icon size={24} />
            <Title order={5}>{vestItem.name}</Title>
          </Group>
          {hasVest && <Badge color="green">Adquirido</Badge>} 
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          {vestItem.description}
        </Text>

        <Group justify="space-between" align="center">
          <Group gap={5}>
             <IconCoin size={16} /> 
             <Text fw={500}>{vestItem.price}</Text>
          </Group>
          <Button 
            variant="light" 
            color="blue" 
            radius="md"
            onClick={handleBuyClick}
            disabled={hasVest || !canAfford}
            title={hasVest ? "Você já possui este item" : !canAfford ? "Moedas insuficientes" : "Comprar item"}
          >
            {hasVest ? "Equipado" : "Comprar"}
          </Button>
        </Group>
      </Card>

      {/* Espaço para mais itens no futuro */}

    </Drawer>
  );
} 