import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

/**
 * Hook para manter a conexão Socket.io ativa com heartbeat inteligente
 * @param {Object} options - Configurações do keep-alive
 * @param {number} options.pingInterval - Intervalo entre pings em ms (padrão: 25s)
 * @param {number} options.inactiveInterval - Intervalo quando inativo em ms (padrão: 60s)
 * @param {number} options.activityTimeout - Tempo para considerar inativo em ms (padrão: 2min)
 * @param {boolean} options.enabled - Se o keep-alive está ativo (padrão: true)
 */
export function useKeepAlive(options = {}) {
  const {
    pingInterval = 20000,        // ✅ 20 segundos (bem menor que 50s do Render)
    inactiveInterval = 30000,    // ✅ 30 segundos quando inativo (ainda menor que 50s)
    activityTimeout = 120000,    // 2 minutos para considerar inativo (pode manter)
    enabled = true
  } = options;

  const socket = useSocket();
  const pingIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);
  const activityTimeoutRef = useRef(null);

  // ✅ Detectar atividade do usuário
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      console.log('🟢 Usuário ativo novamente - aumentando frequência de ping');
      
      // Reiniciar com intervalo de usuário ativo
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        startPinging(pingInterval);
      }
    }

    // Resetar timeout de inatividade
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    activityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      console.log('🟡 Usuário inativo - reduzindo frequência de ping');
      
      // Reiniciar com intervalo de usuário inativo
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        startPinging(inactiveInterval);
      }
    }, activityTimeout);
  }, [pingInterval, inactiveInterval, activityTimeout]);

  // ✅ Função para iniciar pings
  const startPinging = useCallback((interval) => {
    if (!socket || !enabled) return;

    pingIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        const pingTime = Date.now();
        console.log(`💓 Enviando ping... (${isActiveRef.current ? 'ativo' : 'inativo'})`);
        
        // Enviar ping com timestamp
        socket.emit('ping', { timestamp: pingTime });
        
        // Opcional: Medir latência
        socket.once('pong', (data) => {
          const latency = Date.now() - pingTime;
          console.log(`💚 Pong recebido! Latência: ${latency}ms`);
        });
      } else {
        console.log('⚠️ Socket desconectado, pulando ping');
      }
    }, interval);
  }, [socket, enabled]);

  // ✅ Inicializar sistema de keep-alive
  useEffect(() => {
    if (!socket || !enabled) return;

    console.log('🚀 Iniciando sistema de keep-alive');
    
    // Começar com intervalo de usuário ativo
    startPinging(pingInterval);
    
    // Listeners de atividade do usuário
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];

    const handleActivity = () => updateActivity();

    // Adicionar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Listener para quando reconectar
    const handleReconnect = () => {
      console.log('🔄 Reconectado - reiniciando keep-alive');
      updateActivity(); // Considerar como atividade
      startPinging(pingInterval);
    };

    socket.on('connect', handleReconnect);

    // Cleanup
    return () => {
      console.log('🛑 Parando sistema de keep-alive');
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      socket.off('connect', handleReconnect);
    };
  }, [socket, enabled, pingInterval, startPinging, updateActivity]);

  // ✅ Função para forçar ping manual
  const forcePing = useCallback(() => {
    if (socket && socket.connected) {
      console.log('🔧 Ping manual forçado');
      socket.emit('ping', { timestamp: Date.now(), manual: true });
      updateActivity();
    }
  }, [socket, updateActivity]);

  return {
    isActive: isActiveRef.current,
    lastActivity: lastActivityRef.current,
    forcePing
  };
}
