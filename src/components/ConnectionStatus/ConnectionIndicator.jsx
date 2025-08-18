'use client';

import { useState, useEffect } from 'react';
import { Badge, Tooltip, Text } from '@mantine/core';
import { IconWifi, IconWifiOff, IconLoader } from '@tabler/icons-react';
import { useSocket } from '@/contexts/SocketContext';

export default function ConnectionIndicator({ isActive, onForcePing }) {
  const socket = useSocket();
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastPingTime, setLastPingTime] = useState(null);

  useEffect(() => {
    if (!socket) {
      setConnectionStatus('connecting');
      return;
    }

    const handleConnect = () => {
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    };

    const handleDisconnect = (reason) => {
      console.log('ConnectionIndicator: Desconectado:', reason);
      setConnectionStatus('disconnected');
    };

    const handleReconnectAttempt = (attemptNumber) => {
      setConnectionStatus('reconnecting');
      setReconnectAttempts(attemptNumber);
    };

    const handleReconnect = () => {
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    };

    const handleConnectError = () => {
      setConnectionStatus('error');
    };

    // ✅ Listener para pong (resposta do ping)
    const handlePong = (data) => {
      setLastPingTime(Date.now());
    };

    // Verificar estado inicial
    if (socket.connected) {
      setConnectionStatus('connected');
    }

    // Adicionar listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('pong', handlePong);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('pong', handlePong);
    };
  }, [socket]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        const timeSincePing = lastPingTime ? Math.floor((Date.now() - lastPingTime) / 1000) : null;
        const activityStatus = isActive ? 'ativo' : 'inativo';
        
        return {
          color: 'green',
          icon: <IconWifi size={14} />,
          text: 'Online',
          tooltip: `Conectado ao servidor (${activityStatus})${timeSincePing ? ` • Último ping: ${timeSincePing}s` : ''}`
        };
      case 'disconnected':
        return {
          color: 'red',
          icon: <IconWifiOff size={14} />,
          text: 'Offline',
          tooltip: 'Desconectado do servidor'
        };
      case 'reconnecting':
        return {
          color: 'yellow',
          icon: <IconLoader size={14} />,
          text: `Reconectando... (${reconnectAttempts})`,
          tooltip: `Tentando reconectar - Tentativa ${reconnectAttempts}`
        };
      case 'error':
        return {
          color: 'red',
          icon: <IconWifiOff size={14} />,
          text: 'Erro',
          tooltip: 'Erro de conexão com o servidor'
        };
      default:
        return {
          color: 'gray',
          icon: <IconLoader size={14} />,
          text: 'Conectando...',
          tooltip: 'Estabelecendo conexão com o servidor'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip 
      label={<Text size="xs">{config.tooltip}</Text>}
      position="bottom"
      withArrow
    >
      <Badge 
        size="sm" 
        variant="light" 
        color={config.color}
        leftSection={config.icon}
        style={{ cursor: 'help' }}
        onClick={onForcePing} // ✅ Permitir ping manual ao clicar
      >
        {config.text}
      </Badge>
    </Tooltip>
  );
}
