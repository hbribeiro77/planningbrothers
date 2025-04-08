// Remover require do componente React
// const VestIcon = require('../components/Icons/VestIcon'); 

const COLETE_DPE_ID = 'vest';
const COLETE_BLUE_ID = 'vest_blue';
const KEYBOARD_ID = 'keyboard'; // << ID para a arma padrão
const NINJA_TRAINING_ID = 'ninja_training'; // <<< NOVO ID

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
    displayOrder: 1, // << Ordem de exibição
    description: 'Ataque base: 1d6. Chance de Crítico: 5%.',
    iconName: 'IconKeyboard', // << Adicionar nome do ícone
    iconColor: 'blue', // << Adicionar cor (exemplo)
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
    equipSlot: 'body', // << Slot Exclusivo para Corpo
    displayOrder: 10, // << Ordem de exibição
    description: 'Defesa Fixa: +1.',
    iconName: 'IconShirt', 
    iconColor: DPE_GREEN,
    mainColor: DPE_GREEN,
    darkColor: DPE_GREEN_DARK,
    defenseFixed: 1, 
    defenseDice: null, 
    attackBonusFixed: 0, 
    attackBonusDice: null,
    avatarVisual: { // Objeto de configuração visual
      type: 'component',
      componentName: 'VestIcon',
      props: { // Props específicas para o componente VestIcon
         mainColor: DPE_GREEN,
         darkColor: DPE_GREEN_DARK,
      },
      style: { // Estilos movidos de Participante.jsx
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '145%',
        height: 'auto',
        opacity: 1,
        pointerEvents: 'none',
        zIndex: 5,
      }
    }
  },
  [COLETE_BLUE_ID]: { 
    name: 'Colete Blue', 
    price: 1, 
    type: 'accessory',
    equipSlot: 'body', // << Slot Exclusivo para Corpo
    displayOrder: 11, // << Ordem de exibição
    description: 'Defesa Fixa: +1.',
    iconName: 'IconShirt', 
    iconColor: BLUE_MAIN,
    mainColor: BLUE_MAIN,
    darkColor: BLUE_DARK,
    defenseFixed: 1, 
    defenseDice: null, 
    attackBonusFixed: 0, 
    attackBonusDice: null,
    avatarVisual: { // Objeto de configuração visual
      type: 'component',
      componentName: 'VestIcon',
      props: { // Props específicas para o componente VestIcon
         mainColor: BLUE_MAIN,
         darkColor: BLUE_DARK,
      },
      style: { // Mesmos estilos do outro colete
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '145%',
        height: 'auto',
        opacity: 1,
        pointerEvents: 'none',
        zIndex: 5,
      }
    }
  },
  [NINJA_TRAINING_ID]: {
    name: 'Treinamento Ninja',
    price: 2, // Preço exemplo
    type: 'accessory',
    equipSlot: 'headband', // << Slot Separado/Não Exclusivo com 'body'
    displayOrder: 20, // << Ordem de exibição
    description: 'Aumenta sua perícia. Bônus de Ataque Fixo: +1. Chance de Esquiva: 40%.',
    iconSvgPath: '/images/game-objects/ninja_mask.svg', // Usado no inventário/loja
    defenseFixed: 0,
    defenseDice: null, 
    attackBonusFixed: 1, // << Bônus de Ataque
    attackBonusDice: null,
    dodgeChance: 0.4, // <<< Adicionar chance de esquiva (40%)
    avatarVisual: { // Objeto de configuração visual para a faixa
      type: 'svg',
      path: '/images/game-objects/ninja_faixa.svg', // <<< Caminho para o SVG da faixa
      style: { // Estilo para o SVG da faixa (exemplo)
        position: 'absolute',
        top: '80%', // Ajustado para talvez ficar na testa
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120%', // Ajustar conforme necessário
        height: 'auto',
        opacity: 0.9,
        pointerEvents: 'none',
        zIndex: 4, // Acima do colete
      }
    }
  },
  // Adicionar outros acessórios aqui com seu equipSlot
};

// Helper para identificar tipos (se necessário, mas talvez não mais)
// const isAccessory = (itemId) => ITEMS_DATA[itemId]?.type === 'accessory'; 
// const isWeapon = (itemId) => ITEMS_DATA[itemId]?.type === 'weapon';

// Usar module.exports para compatibilidade com server-dev.js
module.exports = {
  COLETE_DPE_ID,
  COLETE_BLUE_ID,
  KEYBOARD_ID,
  NINJA_TRAINING_ID, 
  ITEMS_DATA,
  // Remover export do mapeamento
  // AVATAR_COMPONENTS: AVATAR_COMPONENTS 
}; 