// import { IconShirt } from '@tabler/icons-react'; // Apenas IconShirt necessário agora

const COLETE_DPE_ID = 'vest';
const COLETE_BLUE_ID = 'vest_blue';
const KEYBOARD_ID = 'keyboard'; // << ID para a arma padrão

// Definir cores principais e escuras
const DPE_GREEN = '#2e8b57';
const DPE_GREEN_DARK = '#1e6e3c';
const BLUE_MAIN = '#228be6'; // Exemplo: Mantine Blue 6
const BLUE_DARK = '#1c7ed6'; // Exemplo: Mantine Blue 7

const ITEMS_DATA = {
  // --- ARMAS ---
  [KEYBOARD_ID]: { 
    name: 'Teclado Padrão', 
    price: 0, // Arma inicial
    type: 'weapon', // << Tipo Arma
    baseDamageFixed: 0, // << Dano base fixo
    baseDamageDice: '1d6', // << Dano base em dado
    criticalChance: 0.05, // << Chance de crítico da arma (5%)
    // Armas geralmente não dão bônus passivos, mas a estrutura permite
    attackBonusFixed: 0,
    attackBonusDice: null,
    defenseFixed: 0,
    defenseDice: null,
  },
  // Adicionar outras armas aqui (ex: mouse, caneta...)

  // --- ACESSÓRIOS ---
  [COLETE_DPE_ID]: { 
    name: 'Colete DPE', 
    price: 1, 
    type: 'accessory', // << Tipo Acessório
    iconName: 'IconShirt', 
    iconColor: DPE_GREEN,
    mainColor: DPE_GREEN,
    darkColor: DPE_GREEN_DARK,
    defenseFixed: 1, 
    defenseDice: null, 
    attackBonusFixed: 0, 
    attackBonusDice: null,
    // Acessórios podem modificar crítico no futuro?
    // criticalChanceModifier: 0,
  },
  [COLETE_BLUE_ID]: { 
    name: 'Colete Blue', 
    price: 1, 
    type: 'accessory',
    iconName: 'IconShirt', 
    iconColor: BLUE_MAIN,
    mainColor: BLUE_MAIN,
    darkColor: BLUE_DARK,
    defenseFixed: 1, 
    defenseDice: null, 
    attackBonusFixed: 0, 
    attackBonusDice: null,
  },
  // Adicionar outros acessórios aqui
};

// Helper para identificar tipos (se necessário, mas talvez não mais)
// const isAccessory = (itemId) => ITEMS_DATA[itemId]?.type === 'accessory'; 
// const isWeapon = (itemId) => ITEMS_DATA[itemId]?.type === 'weapon';

module.exports = { 
  COLETE_DPE_ID, 
  COLETE_BLUE_ID, 
  KEYBOARD_ID,
  ITEMS_DATA, 
  // isAccessory // Remover se não usado no servidor
}; 