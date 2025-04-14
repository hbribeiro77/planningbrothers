// Remover require do componente React
// const VestIcon = require('../components/Icons/VestIcon'); 

const COLETE_DPE_ID = 'vest';
const COLETE_BLUE_ID = 'vest_blue';
const KEYBOARD_ID = 'keyboard'; // << ID para a arma padrão
const NINJA_TRAINING_ID = 'ninja_training'; // <<< NOVO ID
const MANIFESTO_ID = 'manifesto_comunista'; // <<< ID para o novo item
const MEDALHA_ID = 'medalha_5_anos'; // <<< ID para a medalha
const BITCOIN_MINER_ID = 'bitcoin_miner'; // <<< ID para o minerador

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
    description: 'A ferramenta padrão do guerreiro moderno. E se pegar de quina, mata!',
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
    description: 'Feito com o melhor tecido... disponível no último pregão. Defesa Fixa: +1.',
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
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '145%',
        height: 'auto',
        opacity: 1,
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
    description: "Tecido similar ao verde, mas em um tom azul que grita 'trabalho sério'. Defesa Fixa: +1.",
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
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '145%',
        height: 'auto',
        opacity: 1,
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
        top: '75%', // Ajustado para talvez ficar na testa
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120%', // Ajustar conforme necessário
        height: 'auto',
        opacity: 0.9,
        zIndex: 4, // Acima do colete
      }
    }
  },
  // Adicionar outros acessórios aqui com seu equipSlot

  // --- ACESSÓRIOS PASSIVOS ---
  [MANIFESTO_ID]: {
    name: 'Manifesto Comunista',
    price: 5,
    type: 'accessory',
    equipSlot: 'passive', // Slot indica que não é visual e não conflita
    displayOrder: 100, // Colocar no final da loja
    description: 'Fique com todo valor do seu trabalho! Multiplica todos os ganhos de moeda por 2x.',
    iconName: 'IconBook', // Ícone de livro como exemplo
    iconColor: 'red',     // Cor vermelha
    scoreMultiplier: 2,   // <<< O multiplicador
    // Sem atributos de combate diretos
    defenseFixed: 0,
    defenseDice: null,
    attackBonusFixed: 0,
    attackBonusDice: null,
    dodgeChance: 0,
    // Sem visual no avatar
    avatarVisual: null
  },

  [MEDALHA_ID]: {
    name: 'Medalha de 5 Anos',
    price: 5, 
    type: 'accessory',
    equipSlot: 'passive', // Não visual, sempre ativo
    displayOrder: 110,
    description: 'Experiência comprovada! +2 Atq, +2 Def, +5% Crítico, +5% Esquiva.',
    iconName: 'IconMedal',
    iconColor: 'gold',
    attackBonusFixed: 2,
    defenseFixed: 2,
    criticalChanceBonus: 0.05, // Novo atributo para bônus na chance
    dodgeChanceBonus: 0.05,    // Novo atributo para bônus na chance
    // Sem dados ou outros efeitos
    baseDamageFixed: 0,
    baseDamageDice: null,
    criticalChance: 0,
    dodgeChance: 0,
    attackBonusDice: null,
    defenseDice: null,
    scoreMultiplier: 1,
    avatarVisual: { 
      type: 'svg',
      path: '/images/game-objects/medalha.svg',
      style: { 
        position: 'absolute',
        top: '2%',
        right: '25%',
        width: '45%',
        height: 'auto',
        opacity: 1,
        zIndex: 8,
      }
    }
  },

  [BITCOIN_MINER_ID]: {
    name: 'Minerador',
    price: 10,
    type: 'accessory',
    equipSlot: 'passive',
    displayOrder: 120,
    description: 'Gere renda passiva automaticamente! +1 moeda a cada 10 segundos.',
    iconName: 'IconCurrencyBitcoin',
    iconColor: 'orange',
    // Atributos de geração
    pontosPorIntervalo: 1,
    intervaloGeracaoMs: 10000,
    luckyStrikeChance: 0.01, // <<< CHANCE AQUI (1%)
    luckyStrikeReward: 100,  // <<< RECOMPENSA AQUI
    // Sem atributos de combate diretos
    scoreMultiplier: 1,
    criticalChanceBonus: 0,
    dodgeChanceBonus: 0,
    attackBonusFixed: 0,
    defenseFixed: 0,
    // Adicionar configuração visual
    avatarVisual: {
      type: 'svg',
      path: '/images/game-objects/minerador.svg',
      style: { 
        position: 'absolute',
        bottom: '-20%',
        left: '90%',
        width: '150%',
        height: 'auto',
        opacity: 1,
        zIndex: 8, 
      }
    }
  },
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
  MANIFESTO_ID, // <<< Exportar o novo ID
  MEDALHA_ID, // <<< Exportar novo ID
  BITCOIN_MINER_ID, // <<< Exportar novo ID
  ITEMS_DATA,
  // Remover export do mapeamento
  // AVATAR_COMPONENTS: AVATAR_COMPONENTS 
}; 