const GAME_CONFIG = {
  // Configurações de vida
  LIFE: {
    MAX: 100, // Vida máxima inicial
    MIN: 0,   // Vida mínima
  },

  // Configurações de dano
  DAMAGE: {
    KEYBOARD: 5, // Dano causado pelo teclado
  },

  // Configurações de tempo
  TIMING: {
    LIFE_BAR_DURATION: 3000, // Tempo em ms que a barra de vida fica visível após receber dano
  },

  // Configurações de animação
  ANIMATION: {
    LIFE_BAR_FADE_DURATION: 300, // Tempo em ms da animação de fade da barra de vida
  }
};

module.exports = { GAME_CONFIG }; 