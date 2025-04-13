import { useEffect, useState, useCallback } from 'react';
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
  const [lastKillInfo, setLastKillInfo] = useState(null);
  const [lastDamageInfoForAnimation, setLastDamageInfoForAnimation] = useState(null);

  // Conectar à sala quando o componente montar
  useEffect(() => {
    if (!socket) return;

    // Configurar URL da sala
    setSalaURL(`${window.location.origin}/sala/${codigoSala}?convite=true`);

    // Obter token e browser
    const { token, browserName } = getOrCreateToken();

    // Entrar na sala
    socket.emit(SOCKET_EVENTS.ENTRAR_SALA, { 
      codigo: codigoSala, 
      usuario: {
        nome: nomeUsuario,
        isObservador: modoObservador,
        token,
        browserName
      }
    });

    // Receber erro de entrada
    socket.on('erroEntrada', ({ mensagem }) => {
      setErroEntrada(mensagem);
      setConectado(false);
    });

    // Receber atualizações de participantes
    socket.on(SOCKET_EVENTS.ATUALIZAR_PARTICIPANTES, (participantesAtualizados) => {
      console.log('Recebeu atualizarParticipantes:', participantesAtualizados);
      setParticipantes(participantesAtualizados);
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
      socket.off('erroEntrada');
      socket.off(SOCKET_EVENTS.ATUALIZAR_PARTICIPANTES);
      socket.off(SOCKET_EVENTS.VOTO_RECEBIDO);
      socket.off(SOCKET_EVENTS.VOTOS_REVELADOS);
      socket.off(SOCKET_EVENTS.VOTACAO_REINICIADA);
      socket.off(SOCKET_EVENTS.MODO_OBSERVADOR_ALTERADO);
    };
  }, [socket, codigoSala, nomeUsuario]);

  // NOVO useEffect para gerenciar o listener de damageReceived
  useEffect(() => {
    if (!socket) return;

    const handleDamageReceived = (data) => {
      console.log('Evento damageReceived recebido no HOOK:', data);
      // Desestruturar payload, incluindo weaponType e killTitle
      const { targetId, damage, currentLife, isCritical, isDodge, attackerName, targetName, weaponType, killTitle } = data;
      
      let currentUserWasTarget = false;

      setParticipantes(prev => {
        const currentUserId = prev.find(p => p.nome === nomeUsuario)?.id;
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

      // Se for um evento de kill (tem attackerName e targetName)
      if (attackerName && targetName && killTitle) { 
        console.log(`KILL registrado: ${killTitle} - ${attackerName} -> ${targetName} com ${weaponType}`);
        setLastKillInfo({ 
          attackerName,
          targetName,
          weaponType, 
          killTitle,
          timestamp: Date.now() 
        });
      }
      
      // ATUALIZA O NOVO ESTADO para acionar a animação no componente
      // Inclui um ID único para garantir que o useEffect no componente sempre dispare
      setLastDamageInfoForAnimation({ 
          targetId, 
          damage, 
          isCritical, 
          isDodge, 
          timestamp: Date.now() // Garante nova referência
      });
    };

    socket.on('damageReceived', handleDamageReceived);

    return () => {
      socket.off('damageReceived', handleDamageReceived);
    };

  }, [socket, nomeUsuario]);

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
    lastKillInfo,
    lastDamageInfoForAnimation
  };
} 