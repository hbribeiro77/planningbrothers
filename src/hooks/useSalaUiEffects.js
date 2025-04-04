import { useState, useEffect, useCallback } from 'react';

/**
 * Hook customizado para gerenciar os efeitos visuais locais da UI da Sala.
 * @param {boolean} conectado - Status de conexão (para animação de entrada).
 * @param {boolean} revelarVotos - Status de revelação de votos (para pulso).
 * @param {number} lastDamageTimestamp - Timestamp do último dano recebido (para piscada).
 * @param {boolean} isFlashEffectEnabled - Se o efeito de piscada está habilitado.
 * @param {boolean} shouldShowAttentionOverlay - Se o overlay vermelho está ativo.
 * @returns {{ entradaAnimada: boolean, isPulsing: boolean, isFlashing: boolean, triggerPulse: () => void }}
 */
export function useSalaUiEffects(
  conectado,
  revelarVotos,
  lastDamageTimestamp,
  isFlashEffectEnabled,
  shouldShowAttentionOverlay
) {
  // Estados dos efeitos
  const [entradaAnimada, setEntradaAnimada] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Função helper para disparar a animação de pulso
  const triggerPulse = useCallback(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => {
      setIsPulsing(false);
    }, 800); // Duração da animação pulseEffect
    // Não precisa retornar cleanup, pois queremos que termine normalmente.
  }, []);

  // Animar entrada na sala
  useEffect(() => {
    if (conectado) {
      const timer = setTimeout(() => {
        setEntradaAnimada(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [conectado]);

  // Efeito para disparar pulso ao REVELAR votos
  useEffect(() => {
    if (revelarVotos === true) {
      console.log("PULSE (Hook): Votos Revelados");
      triggerPulse();
    }
  }, [revelarVotos, triggerPulse]);

  // Efeito para ATIVAR a piscada baseado no timestamp de dano
  useEffect(() => {
    if (lastDamageTimestamp === 0) return;

    // A condição de "morto" precisa ser recalculada aqui ou passada?
    // Por simplicidade, vamos assumir que se o timestamp mudou e o overlay
    // de atenção está ativo, foi um hit relevante.
    // Idealmente, a condição exata (vida<=0 etc) deveria ser passada, 
    // mas vamos tentar com shouldShowAttentionOverlay por ora.
    if (shouldShowAttentionOverlay && isFlashEffectEnabled) {
      console.log("FLASH (Hook): Timestamp de dano recebido mudou enquanto overlay ativo E EFEITO HABILITADO, piscando.");
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lastDamageTimestamp, isFlashEffectEnabled, shouldShowAttentionOverlay]); 

  // Efeito para DESATIVAR piscada se overlay vermelho sumir
  useEffect(() => {
    if (!shouldShowAttentionOverlay && isFlashing) {
      console.log("Overlay vermelho sumiu, garantindo que piscada (hook) está desligada.");
      setIsFlashing(false);
    }
  }, [shouldShowAttentionOverlay, isFlashing]);

  // Retorna os estados e a função necessários para a UI
  return {
    entradaAnimada,
    isPulsing,
    isFlashing,
    triggerPulse,
  };
} 