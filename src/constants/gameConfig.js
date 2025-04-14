const GAME_CONFIG = {
  // Configurações de vida
  LIFE: {
    MAX: 100, // Vida máxima inicial
    MIN: 0,   // Vida mínima
  },

  // Configurações de Pontos
  POINTS: {
    KILL: 1, // Pontos por kill (exemplo)
    VOTE_REVEALED: 10, // Pontos por ter o voto revelado na rodada
    // Adicionar outras pontuações aqui
  },

  // Configurações de tempo
  TIMING: {
    LIFE_BAR_DURATION: 3000, // Tempo em ms que a barra de vida fica visível após receber dano
  },

  // Configurações de animação
  ANIMATION: {
    LIFE_BAR_FADE_DURATION: 300, // Tempo em ms da animação de fade da barra de vida
  },

  // Configurações de som
  SOUND: {
    DEFAULT_VOLUME: 0.3, // Volume padrão inicial (0 a 1)
  },
};

module.exports = { GAME_CONFIG }; 