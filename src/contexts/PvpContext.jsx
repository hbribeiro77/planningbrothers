import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// 1. Criar o Contexto
const PvpContext = createContext();

// 2. Criar o Provedor (Provider)
export function PvpProvider({ children, socket, currentUserData, codigoSala, participantes }) {
  // Inicializa como null para forçar a busca do estado correto
  const [pvpStatus, setPvpStatus] = useState(null); 
  const [initialStatusSet, setInitialStatusSet] = useState(false);

  // Efeito para definir o estado inicial ou sincronizar com dados do servidor
  useEffect(() => {
    let statusToSet = null;

    // 1. Tenta usar currentUserData.keyboardMode se disponível
    if (currentUserData?.keyboardMode !== undefined) {
      console.log("PvpProvider (Init/Sync): Usando currentUserData.keyboardMode:", currentUserData.keyboardMode);
      statusToSet = currentUserData.keyboardMode;
    } 
    // 2. Se não disponível E AINDA NÃO DEFINIU o status inicial, tenta pegar de outro participante
    else if (!initialStatusSet && participantes && participantes.length > 1) {
      // Encontra o primeiro outro participante que TENHA a propriedade keyboardMode definida
      const outroParticipante = participantes.find(p => p.id !== currentUserData?.id && p.keyboardMode !== undefined);
      if (outroParticipante) {
        console.log("PvpProvider (Init): Pegando status de outro participante:", outroParticipante.keyboardMode);
        statusToSet = outroParticipante.keyboardMode;
      }
    }

    // Se conseguimos determinar um status (ou ele mudou em currentUserData)
    if (statusToSet !== null) {
      // Atualiza o estado do contexto apenas se for diferente ou se for a definição inicial
      if (pvpStatus !== statusToSet || !initialStatusSet) {
         console.log(`PvpProvider: Definindo status PVP para ${statusToSet} (era ${pvpStatus}, inicial: ${!initialStatusSet})`);
        setPvpStatus(statusToSet);
        if (!initialStatusSet) {
          setInitialStatusSet(true); // Marca que o status inicial foi definido
        }
      }
    } 
    // 3. Se NADA foi encontrado e é a configuração inicial, usa true como fallback
    else if (!initialStatusSet) {
      console.log("PvpProvider (Init): Fallback para 'true'");
      setPvpStatus(true);
      setInitialStatusSet(true); // Marca que o status inicial foi definido
    }

  // Depende de todos os dados relevantes
  }, [currentUserData, participantes, pvpStatus, initialStatusSet]);

  // Efeito para ouvir mudanças de outros jogadores via socket
  useEffect(() => {
    if (!socket || !initialStatusSet) return; // Só ouve depois que o estado inicial está definido

    const handleFunModeChange = (data) => {
      const newRemoteStatus = data.enabled;
      console.log('PvpProvider: Recebeu mudança remota de modo diversão:', data);
      if (pvpStatus !== newRemoteStatus) {
        setPvpStatus(newRemoteStatus);
      }
    };

    socket.on('funModeChanged', handleFunModeChange);

    return () => {
      socket.off('funModeChanged', handleFunModeChange);
    };
  }, [socket, pvpStatus, initialStatusSet]);

  // Função para alternar o status PVP (chamada pelo GameController)
  const togglePvpStatus = useCallback((newStatus) => {
    // Só permite alternar se o estado inicial já foi definido
    if (!initialStatusSet) {
      console.warn("PvpProvider: Tentativa de alternar PVP antes da inicialização completa.");
      return;
    }
    setPvpStatus(newStatus);
    if (socket && codigoSala) {
      console.log('PvpProvider: Emitindo mudança de modo diversão:', { codigo: codigoSala, enabled: newStatus });
      socket.emit('funModeChanged', {
        codigo: codigoSala,
        enabled: newStatus
      });
    } else {
      console.error("PvpProvider: Socket ou codigoSala não disponível para emitir evento.");
    }
  }, [socket, codigoSala, initialStatusSet]);

  // Sempre fornecer o valor atual, mesmo que pvpStatus seja null inicialmente
  const value = {
    pvpStatus,
    togglePvpStatus
  };

  return (
    <PvpContext.Provider value={value}>
      {children}
    </PvpContext.Provider>
  );
}

// 4. Hook customizado para consumir o contexto
export function usePvpStatus() {
  const context = useContext(PvpContext);
  if (context === undefined) {
    throw new Error('usePvpStatus deve ser usado dentro de um PvpProvider');
  }
  return context;
} 