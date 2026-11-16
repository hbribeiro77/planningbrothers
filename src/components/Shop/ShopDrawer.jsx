import React, { useState } from 'react';
import { Drawer, Text, Title, Card, Group, Button, Badge, SimpleGrid, ActionIcon, Tooltip } from '@mantine/core';
import { IconShoppingCart, IconCoin, IconKeyboard, IconShirt, IconStar, IconMask, IconBook, IconMedal, IconCurrencyBitcoin, IconShieldLock, IconVirusOff, IconCpu, IconBook2, IconKeyboardShow, IconRubberStamp, IconBurger, IconBottle } from '@tabler/icons-react';
import Note7Icon from '@/components/Icons/Note7Icon';
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA } from '@/constants/itemsData';
import { useMantineTheme } from '@mantine/core';

// Mapa de ícones para a loja
const iconMap = {
  IconShirt: IconShirt,
  IconKeyboard: IconKeyboard,
  IconStar: IconStar,
  IconMask: IconMask,
  IconBook: IconBook,
  IconMedal: IconMedal,
  IconCurrencyBitcoin: IconCurrencyBitcoin,
  IconShieldLock: IconShieldLock,
  IconVirusOff: IconVirusOff,
  IconCpu: IconCpu,
  IconBook2: IconBook2,
  IconKeyboardShow: IconKeyboardShow,
  IconRubberStamp: IconRubberStamp,
  Note7Icon: Note7Icon,
  IconBurger: IconBurger,
  IconBottle: IconBottle,
};

// Obter itens da loja, adicionar ID e ORDENAR por displayOrder
const shopItems = Object.entries(ITEMS_DATA)
  .map(([id, data]) => ({ ...data, id })) // Adiciona ID ao objeto do item
  .sort((itemA, itemB) => { 
    // Ordena pelos números de displayOrder. Itens sem displayOrder vão para o final.
    const orderA = itemA.displayOrder ?? Infinity;
    const orderB = itemB.displayOrder ?? Infinity;
    return orderA - orderB;
  });

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
        {/* Mapeia sobre shopItems, que agora está ORDENADO */}
        {shopItems.map((item) => {
          const isConsumable = item.type === 'consumable' || item.type === 'counter';
          const qtd = currentUser?.consumables?.[item.id] || 0;
          const maxStack = item.maxStack || 1;
          // Consumível "esgota" só ao atingir o máximo; demais itens ao possuir
          const hasItem = isConsumable ? qtd >= maxStack : userInventory.includes(item.id);
          const canAfford = userScore >= item.price;
          // Upgrade só pra quem tem o item base (ex.: minerador)
          const faltaBase = item.requires && !userInventory.includes(item.requires);
          const itemColor = item.iconColor || theme.primaryColor;

          return (
            <Card key={item.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  {
                    // Ícone de traço tem prioridade (padrão da loja); SVG só pra quem não tem
                    item.iconSvgPath && !iconMap[item.iconName] ? (
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
                {isConsumable
                  ? <Badge color={hasItem ? 'green' : 'orange'}>{qtd}/{maxStack}</Badge>
                  : (item.id === 'keyboard' || hasItem) && <Badge color="green">Adquirido</Badge>}
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
                  disabled={item.id === 'keyboard' || hasItem || !canAfford || faltaBase}
                  title=""
                >
                  <Tooltip 
                    label={(
                      <Text size="xs">
                        {item.id === 'keyboard' ? "Arma padrão" : hasItem ? (isConsumable ? `Máximo de ${maxStack}` : "Você já possui este item") : faltaBase ? `Precisa ter o ${ITEMS_DATA[item.requires]?.name}` : !canAfford ? "Moedas insuficientes" : "Comprar item"}
                      </Text>
                    )}
                    disabled={!(item.id === 'keyboard' || hasItem || !canAfford || faltaBase)}
                    position="bottom"
                    withArrow
                  >
                    <span>{item.id === 'keyboard' ? "Padrão" : (hasItem ? (isConsumable ? "Cheio" : "Adquirido") : (item.packSize ? `Comprar +${item.packSize}` : "Comprar"))}</span>
                  </Tooltip>
                </Button>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Drawer>
  );
} 