import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { SOCKET_EVENTS } from '@/constants/socketEvents';
import { getOrCreateToken } from '@/utils/browserToken';

export function useSalaSocket(codigoSala, nomeUsuario) {
  const socket = useSocket();
  
  // Estados da sala
  const [participantes, setParticipantes] = useState([]);
  const [revelarVotos, setRevelarVotos] = useState(false);
  const [meuVoto, setMeuVoto] = useState(null);
  const [salaURL, setSalaURL] = useState('');
  const [modoObservador, setModoObservador] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erroEntrada, setErroEntrada] = useState(null);
  const [lastDamageTimestamp, setLastDamageTimestamp] = useState(null);
  const [lastFeedEvent, setLastFeedEvent] = useState(null);
  const [lastDamageInfoForAnimation, setLastDamageInfoForAnimation] = useState(null);

  // NOVO: Ref para nomeUsuario para usar no listener sem adicionar como dependência do useEffect
  const nomeUsuarioRef = useRef(nomeUsuario);
  useEffect(() => {
    nomeUsuarioRef.current = nomeUsuario;
  }, [nomeUsuario]);

  // >>> REGISTRO DE IDs DE EVENTOS PROCESSADOS <<<
  const processedDamageEventIds = useRef(new Set());

  // ✅ Função para entrar na sala (reutilizável)
  const entrarNaSala = useCallback(() => {
    if (!socket) return;

    console.log('🚪 Entrando na sala:', codigoSala, 'como:', nomeUsuario);

    // Configurar URL da sala
    setSalaURL(`${window.location.origin}/sala/${codigoSala}?convite=true`);

    // Obter token e browser
    const { token, browserName, tabId } = getOrCreateToken();

    // Entrar na sala
    socket.emit(SOCKET_EVENTS.ENTRAR_SALA, {
      codigo: codigoSala,
      usuario: {
        nome: nomeUsuario,
        isObservador: modoObservador,
        token,
        browserName,
        tabId,
        isReconnection: socket.recovered || false // ✅ Indica se é reconexão
      }
    });
  }, [socket, codigoSala, nomeUsuario, modoObservador]);

  // Conectar à sala quando o componente montar
  useEffect(() => {
    if (!socket) return;

    entrarNaSala();

    // Ao reconectar (queda de rede), o socket ganha novo ID: precisa entrar de novo na sala.
    // O servidor reconhece o token/aba e devolve o mesmo participante (score, itens, voto).
    const handleReconectar = () => {
      console.log('🔄 Socket reconectado! Re-entrando na sala...');
      entrarNaSala();
    };
    socket.on('connect', handleReconectar);

    // Receber erro de entrada
    socket.on('erroEntrada', ({ mensagem }) => {
      setErroEntrada(mensagem);
      setConectado(false);
    });

    // Receber atualizações de participantes
    socket.on(SOCKET_EVENTS.ATUALIZAR_PARTICIPANTES, (participantesAtualizados) => {
      console.log('Recebeu atualizarParticipantes:', participantesAtualizados);
      setParticipantes(participantesAtualizados);
      // Sincroniza o próprio voto com o servidor (ex.: após F5 o estado local se perde)
      const eu = participantesAtualizados.find(p => p.id === socket.id);
      if (eu) setMeuVoto(eu.jaVotou ? eu.valorVotado : null);
      setConectado(true);
      setErroEntrada(null);
    });

    // Receber votos
    socket.on(SOCKET_EVENTS.VOTO_RECEBIDO, ({ usuario, voto, jaVotou }) => {
      setParticipantes(prev => prev.map(p => 
        p.nome === usuario.nome 
          ? { ...p, jaVotou, valorVotado: voto }
          : p
      ));
    });

    // Revelar votos
    socket.on(SOCKET_EVENTS.VOTOS_REVELADOS, () => {
      setRevelarVotos(true);
    });

    // Nova rodada
    socket.on(SOCKET_EVENTS.VOTACAO_REINICIADA, () => {
      setRevelarVotos(false);
      setMeuVoto(null);
    });

    // Modo observador alterado
    socket.on(SOCKET_EVENTS.MODO_OBSERVADOR_ALTERADO, ({ usuario, isObservador }) => {
      console.log('Cliente recebeu modoObservadorAlterado:', { usuario, isObservador });
      
      setParticipantes(prev => {
        console.log('Participantes antes da atualização:', prev);
        
        const participantesAtualizados = prev.map(p => {
          const deveAtualizar = p.nome === usuario.nome;
          console.log('Verificando participante:', p.nome, 'vs', usuario.nome, 'resultado:', deveAtualizar);
          
          return deveAtualizar
            ? { ...p, isObservador }
            : p;
        });
        
        console.log('Participantes após atualização:', participantesAtualizados);
        return participantesAtualizados;
      });
    });

    return () => {
      socket.off('connect', handleReconectar);
      socket.off('erroEntrada');
      socket.off(SOCKET_EVENTS.ATUALIZAR_PARTICIPANTES);
      socket.off(SOCKET_EVENTS.VOTO_RECEBIDO);
      socket.off(SOCKET_EVENTS.VOTOS_REVELADOS);
      socket.off(SOCKET_EVENTS.VOTACAO_REINICIADA);
      socket.off(SOCKET_EVENTS.MODO_OBSERVADOR_ALTERADO);
    };
  }, [socket, codigoSala, nomeUsuario]);

  // useEffect para gerenciar listeners de eventos de JOGO (Damage, Lucky Strike)
  useEffect(() => {
    if (!socket) return;

    // --- Listener Damage Received ---
    const handleDamageReceived = (data) => {
      // >>> VERIFICAR SE EVENTO JÁ FOI PROCESSADO <<<
      if (!data.eventId || processedDamageEventIds.current.has(data.eventId)) {
        console.log('[DEBUG Client Hook] Ignorando evento damageReceived duplicado ou sem ID:', data.eventId);
        return; // Ignora evento duplicado ou sem ID
      }
      // >>> ADICIONAR ID AO REGISTRO <<<
      processedDamageEventIds.current.add(data.eventId);
      // Limpeza periódica do Set para não crescer indefinidamente (opcional mas bom)
      if (processedDamageEventIds.current.size > 100) {
          const oldIds = Array.from(processedDamageEventIds.current).slice(0, 50);
          oldIds.forEach(id => processedDamageEventIds.current.delete(id));
      }

      // console.log('Evento damageReceived recebido no HOOK:', data); // Manter? É útil.
      const { eventId, targetId, damage, currentLife, isCritical, isDodge, attackerName, targetName, weaponType, killTitle } = data;
      
      let currentUserWasTarget = false;

      setParticipantes(prev => {
        // USA O REF AQUI:
        const currentUserId = prev.find(p => p.nome === nomeUsuarioRef.current)?.id;
        return prev.map(p => {
          if (p.id === targetId) {
            if (p.id === currentUserId) {
              currentUserWasTarget = true;
            }
            return { ...p, life: currentLife }; // Atualiza vida
          } 
          return p;
        })
      });

      // Atualiza timestamp se o user atual foi alvo
      if (currentUserWasTarget) {
        console.log("Damage received by current user, updating timestamp.");
        setLastDamageTimestamp(Date.now());
      }

      // Se for um evento de kill (tem killTitle)
      if (killTitle && attackerName && targetName) { // Adicionada verificação de attacker/targetName aqui também
        console.log(`KILL registrado: ${killTitle} - ${attackerName} -> ${targetName} com ${weaponType}`);
        // RENOMEADO e ADICIONADO TIPO: Define o evento do feed como tipo 'kill'
        setLastFeedEvent({
          type: 'kill', // <<< TIPO
          eventId: eventId, // Passar eventId também
          attackerName,
          targetName,
          weaponType,
          killTitle,
          timestamp: Date.now()
        });
      }

      // Atualiza estado para animação de dano
      setLastDamageInfoForAnimation({
          eventId: eventId,
          targetId,
          damage,
          isCritical,
          isDodge,
          isCorpseHit: !!data.isCorpseHit,
          timestamp: Date.now()
      });
    };

    // --- Listener Lucky Strike Notification ---
    const handleLuckyStrike = (data) => {
        // Poderíamos adicionar verificação de ID de evento aqui também se necessário
        console.log(`LUCKY STRIKE recebido: Jogador ${data.playerName} ganhou ${data.reward}`);
        // RENOMEADO e ADICIONADO TIPO: Define o evento do feed como tipo 'luckyStrike'
        setLastFeedEvent({
            type: 'luckyStrike', // <<< TIPO
            ...data // Inclui eventId, playerName, reward, timestamp
        });
    };

    // Registrar listeners
    socket.on('damageReceived', handleDamageReceived);
    socket.on('luckyStrikeNotification', handleLuckyStrike); // <<< REGISTRA NOVO LISTENER

    // Limpeza
    return () => {
      socket.off('damageReceived', handleDamageReceived);
      socket.off('luckyStrikeNotification', handleLuckyStrike); // <<< LIMPA NOVO LISTENER
    };

    // ✅ Listener para reconexão automática
    const handleSocketReconnected = () => {
      console.log('🔄 Socket reconectado! Re-entrando na sala...');
      setTimeout(() => {
        entrarNaSala();
      }, 1000); // Aguardar 1s para estabilizar
    };

    // ✅ Adicionar listener para evento customizado de reconexão
    window.addEventListener('socket-reconnected', handleSocketReconnected);

    // Cleanup
    return () => {
      // Remover todos os listeners
      socket.off('erroEntrada');
      socket.off(SOCKET_EVENTS.ATUALIZAR_PARTICIPANTES);
      socket.off(SOCKET_EVENTS.VOTO_RECEBIDO);
      socket.off(SOCKET_EVENTS.VOTOS_REVELADOS);
      socket.off(SOCKET_EVENTS.VOTACAO_REINICIADA);
      socket.off(SOCKET_EVENTS.MODO_OBSERVADOR_ALTERADO);
      socket.off('throwObjectAnimation');
      socket.off('damageReceived');
      socket.off('funModeChanged');
      socket.off('luckyStrikeNotification');
      window.removeEventListener('socket-reconnected', handleSocketReconnected);
    };

  }, [socket, entrarNaSala]); // ✅ Adicionar entrarNaSala nas dependências

  // Funções de manipulação de eventos
  const handleVotar = useCallback((valor) => {
    if (!socket || modoObservador) return;
    
    socket.emit(SOCKET_EVENTS.VOTAR, {
      codigo: codigoSala, 
      usuario: { nome: nomeUsuario }, 
      voto: valor 
    });
    setMeuVoto(valor);
  }, [socket, codigoSala, nomeUsuario, modoObservador]);

  const handleCancelarVoto = useCallback(() => {
    if (!socket || modoObservador) return;
    
    socket.emit(SOCKET_EVENTS.CANCELAR_VOTO, {
      codigo: codigoSala,
      usuario: { nome: nomeUsuario }
    });
    setMeuVoto(null);
  }, [socket, codigoSala, nomeUsuario, modoObservador]);

  const handleRevelarVotos = useCallback(() => {
    if (!socket) return;
    socket.emit(SOCKET_EVENTS.REVELAR_VOTOS, codigoSala);
  }, [socket, codigoSala]);

  const handleNovaRodada = useCallback(() => {
    if (!socket) return;
    socket.emit(SOCKET_EVENTS.REINICIAR_VOTACAO, codigoSala);
  }, [socket, codigoSala]);

  const toggleModoObservador = useCallback(() => {
    if (!socket) return;
    
    const novoModo = !modoObservador;
    setModoObservador(novoModo);
    
    // Encontrar o usuário atual entre os participantes
    const meuParticipante = participantes.find(p => p.nome === nomeUsuario);
    console.log('toggleModoObservador - participante encontrado:', meuParticipante, 'nome:', nomeUsuario);
    
    socket.emit(SOCKET_EVENTS.ALTERNAR_MODO_OBSERVADOR, {
      codigo: codigoSala,
      usuario: meuParticipante || { nome: nomeUsuario },
      isObservador: novoModo
    });
  }, [socket, codigoSala, nomeUsuario, participantes, modoObservador]);

  return {
    participantes,
    revelarVotos,
    meuVoto,
    salaURL,
    modoObservador,
    conectado,
    erroEntrada,
    handleVotar,
    handleCancelarVoto,
    handleRevelarVotos,
    handleNovaRodada,
    toggleModoObservador,
    socket,
    lastDamageTimestamp,
    lastFeedEvent,
    lastDamageInfoForAnimation
  };
} 