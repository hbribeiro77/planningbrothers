export const SOCKET_EVENTS = {
  // Eventos de entrada/saída
  ENTRAR_SALA: 'entrarSala',
  ATUALIZAR_PARTICIPANTES: 'atualizarParticipantes',
  
  // Eventos de votação
  VOTAR: 'votar',
  VOTO_RECEBIDO: 'votoRecebido',
  CANCELAR_VOTO: 'cancelarVoto',
  REVELAR_VOTOS: 'revelarVotos',
  VOTOS_REVELADOS: 'votosRevelados',
  REINICIAR_VOTACAO: 'reiniciarVotacao',
  VOTACAO_REINICIADA: 'votacaoReiniciada',
  
  // Eventos de modo observador
  ALTERNAR_MODO_OBSERVADOR: 'alternarModoObservador',
  MODO_OBSERVADOR_ALTERADO: 'modoObservadorAlterado'
}; 