import { IconShirt } from '@tabler/icons-react'; // Apenas IconShirt necessário agora

export const COLETE_DPE_ID = 'vest';
export const COLETE_BLUE_ID = 'vest_blue';

// Definir cores principais e escuras
const DPE_GREEN = '#2e8b57';
const DPE_GREEN_DARK = '#1e6e3c';
const BLUE_MAIN = '#228be6'; // Exemplo: Mantine Blue 6
const BLUE_DARK = '#1c7ed6'; // Exemplo: Mantine Blue 7

export const ITEMS_DATA = {
  [COLETE_DPE_ID]: { 
    name: 'Colete DPE', 
    price: 1, 
    icon: IconShirt, 
    iconColor: DPE_GREEN,
    mainColor: DPE_GREEN, // Cor para o componente SVG
    darkColor: DPE_GREEN_DARK, // Cor escura para o componente SVG
    // svgPath: '/images/game-objects/vest.svg' // << REMOVER
  },
  [COLETE_BLUE_ID]: { 
    name: 'Colete Blue', 
    price: 1, 
    icon: IconShirt, 
    iconColor: BLUE_MAIN,
    mainColor: BLUE_MAIN, // Cor para o componente SVG
    darkColor: BLUE_DARK, // Cor escura para o componente SVG
    // svgPath: '/images/game-objects/vest.svg' // << REMOVER
  },
  // Adicionar outros itens aqui
};

// Helper para identificar acessórios, pode ser mais elaborado no futuro (ex: type: 'accessory')
export const isAccessory = (itemId) => itemId === COLETE_DPE_ID || itemId === COLETE_BLUE_ID;

// Mapeamento apenas de ícones (não mais necessário se usarmos itemsData diretamente)
// export const accessoryIcons = { ... }; 