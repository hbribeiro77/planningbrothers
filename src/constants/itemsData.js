// Remover require do componente React
// const VestIcon = require('../components/Icons/VestIcon'); 

const COLETE_DPE_ID = 'vest';
const COLETE_BLUE_ID = 'vest_blue';
const KEYBOARD_ID = 'keyboard'; // << ID para a arma padrão
const NINJA_TRAINING_ID = 'ninja_training'; // <<< NOVO ID
const MANIFESTO_ID = 'manifesto_comunista'; // <<< ID para o novo item
const MEDALHA_ID = 'medalha_5_anos'; // <<< ID para a medalha
const BITCOIN_MINER_ID = 'bitcoin_miner'; // <<< ID para o minerador
const PROCESSO_ID = 'processo_fisico';
const TECLADO_MECANICO_ID = 'teclado_mecanico';
const XIS_ID = 'xis_phade';
const AGUA_ID = 'garrafa_agua';
const CARIMBO_ID = 'carimbo_indeferido';
const NOTE7_ID = 'galaxy_note7';
const FIREWALL_ID = 'firewall_minerador';
const ANTIVIRUS_ID = 'antivirus_minerador';
const PLACA_VIDEO_ID = 'placa_video_minerador';

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
    // Arremesso
    cooldownMs: 150,           // intervalo mínimo entre arremessos (validado no servidor)
    flightMs: 400,             // tempo de voo até o impacto (o servidor resolve o dano ao final)
    projectileSvg: '/images/game-objects/keyboard.svg',
  },
  [PROCESSO_ID]: {
    name: 'Processo Físico',
    price: 10,
    type: 'weapon',
    displayOrder: 2,
    description: 'Três volumes de autos amarrados com barbante. Quando acerta, dói. 25 processos por carga; acabou, tem que fazer carga no cartório.',
    iconSvgPath: '/images/game-objects/processo.svg',
    iconName: 'IconBook2',
    iconColor: 'orange',
    baseDamageFixed: 0,
    baseDamageDice: '2d20',
    criticalChance: 0.05,
    attackBonusFixed: 0,
    attackBonusDice: null,
    defenseFixed: 0,
    defenseDice: null,
    cooldownMs: 250,
    flightMs: 400,
    // Munição: acabou, tem que fazer carga no cartório
    ammo: 25,
    reloadMs: 6000,
    reloadFailChance: 0.15,    // "Eproc tá fora": a carga demora o dobro
    projectileSvg: '/images/game-objects/processo.svg',
    projectileSize: 46,
  },
  [TECLADO_MECANICO_ID]: {
    name: 'Teclado Mecânico',
    price: 10,
    type: 'weapon',
    displayOrder: 3,
    description: 'Clack clack clack! Segure o clique (ou o dedo) no alvo para disparar sem parar.',
    iconSvgPath: '/images/game-objects/teclado_mecanico.svg',
    iconName: 'IconKeyboardShow',
    iconColor: 'grape',
    baseDamageFixed: 0,
    baseDamageDice: '1d4',
    criticalChance: 0,
    allowCritical: false,      // metralhadora não dá crítico (crítico = morte instantânea)
    attackBonusFixed: 0,
    attackBonusDice: null,
    defenseFixed: 0,
    defenseDice: null,
    autoFire: true,
    cooldownMs: 150,
    flightMs: 300,
    projectileSvg: '/images/game-objects/teclado_mecanico.svg',
    projectileSize: 28,
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
    description: 'Gere renda passiva automaticamente! +1 moeda a cada 10 segundos. Tem 80 de vida: os outros podem atacar ele, e quebrado não minera. Clique nele pra consertar (+2 por clique). Se zerar, explode em 5s e mata o dono, a menos que ele conserte a tempo!',
    iconName: 'IconCurrencyBitcoin',
    iconColor: 'orange',
    minerLife: 80,
    repairPerClick: 2,
    explodeFuseMs: 5000, // zerou a vida: contagem até explodir (e matar o dono)
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

  // --- UPGRADES DO MINERADOR (precisa ter o minerador) ---
  [FIREWALL_ID]: {
    name: 'Firewall',
    price: 5,
    type: 'upgrade',
    requires: BITCOIN_MINER_ID,
    displayOrder: 121,
    description: 'Upgrade do minerador: +2 de defesa contra ataques.',
    iconName: 'IconShieldLock',
    iconColor: 'red',
    minerDefense: 2,
  },
  [ANTIVIRUS_ID]: {
    name: 'Antivírus',
    price: 5,
    type: 'upgrade',
    requires: BITCOIN_MINER_ID,
    displayOrder: 122,
    description: 'Upgrade do minerador: 20% de chance de esquivar dos ataques.',
    iconName: 'IconVirusOff',
    iconColor: 'green',
    minerDodge: 0.2,
  },
  [PLACA_VIDEO_ID]: {
    name: 'Placa de Vídeo',
    price: 10,
    type: 'upgrade',
    requires: BITCOIN_MINER_ID,
    displayOrder: 123,
    description: 'Upgrade do minerador: gera moeda na metade do tempo (a cada 5s).',
    iconName: 'IconCpu',
    iconColor: 'violet',
    minerIntervalMultiplier: 0.5,
  },

  // --- CONTRA-ATAQUES (comprados em pacote; cada disparo gasta 1 carga) ---
  [CARIMBO_ID]: {
    name: 'Carimbo INDEFERIDO',
    price: 5,
    type: 'counter',
    packSize: 10,
    maxStack: 30,
    displayOrder: 130,
    description: 'Pacote com 10 carimbos. Ao levar dano, 30% de chance de carimbar INDEFERIDO na testa de quem atacou (1d6). Cada carimbo usado gasta 1.',
    iconSvgPath: '/images/game-objects/carimbo.svg',
    iconName: 'IconRubberStamp',
    iconColor: 'red',
    resumo: '30% de chance de carimbar INDEFERIDO na testa de quem te atacou. Dano 1d6.',
    piada: 'Sem direito a recurso.',
    counterType: 'carimbo',
    counterChance: 0.3,
    counterDice: '1d6',
  },
  [NOTE7_ID]: {
    name: 'Galaxy Note 7',
    price: 5,
    type: 'counter',
    packSize: 5,
    maxStack: 15,
    displayOrder: 140,
    description: 'Pacote com 5 celulares. Ao levar dano, 30% de chance de mandar um celular com a bateria pegando fogo em quem atacou. O celular tem 25 de vida: se o cara não destruir ele a tempo (3s), explode (3d6, 50% de crítico).',
    iconSvgPath: '/images/game-objects/note7.svg',
    iconName: 'Note7Icon',
    iconColor: '#1a1b1e', // celular preto (fica branco no azul quando ativo, como os outros)
    resumo: '30% de chance de jogar um Note 7 em quem te atacou. Dano 3d6, 50% de crítico.',
    piada: 'Proibido em avião, liberado na planning. 🔥',
    counterType: 'bomba',
    counterChance: 0.3,
    bombDice: '3d6',
    bombLife: 25,
    criticalChance: 0.5,
    fuseMs: 3000,
  },

  // --- CONSUMÍVEIS (somem ao usar; dá pra ter vários) ---
  [XIS_ID]: {
    name: 'Xis do P.H.ade',
    price: 5,
    type: 'consumable',
    maxStack: 9,
    displayOrder: 50,
    description: 'O xis mais respeitado da firma. Recupera 50 de vida. Mas cuidado, a maionese pode estar estragada... E não esquece: Morto não come.',
    iconSvgPath: '/images/game-objects/xis.svg',
    iconName: 'IconBurger',
    iconColor: 'orange',
    healAmount: 50,
    spoilChance: 0.2,
    poisonDamagePerTick: 10,
    poisonTicks: 5,
    poisonTickMs: 1000,
  },
  [AGUA_ID]: {
    name: 'Garrafa de Água',
    price: 1,
    type: 'consumable',
    maxStack: 10,
    displayOrder: 51,
    description: 'Recupera 10 de vida. Passando mal com a maionese? 5 garrafas e você fica bom.',
    iconSvgPath: '/images/game-objects/agua.svg',
    iconName: 'IconBottle',
    iconColor: 'blue',
    healAmount: 10,
    curesPoisonAfter: 5,
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
  PROCESSO_ID,
  TECLADO_MECANICO_ID,
  XIS_ID,
  AGUA_ID,
  CARIMBO_ID,
  NOTE7_ID,
  FIREWALL_ID,
  ANTIVIRUS_ID,
  PLACA_VIDEO_ID,
  ITEMS_DATA,
  // Remover export do mapeamento
  // AVATAR_COMPONENTS: AVATAR_COMPONENTS 
}; 