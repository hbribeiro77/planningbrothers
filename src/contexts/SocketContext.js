'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Container, Center, Loader, Text } from '@mantine/core';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initConnection = async () => {
      try {
        console.log('Inicializando Socket.io...');
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
          reconnection: true,
          reconnectionAttempts: Infinity, // ✅ Tentar para sempre
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,   // ✅ Máximo 10s entre tentativas
          randomizationFactor: 0.5,      // ✅ Randomização para evitar thundering herd
          timeout: 20000,                // ✅ Timeout de 20s para conexão inicial
          transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
          console.log('✅ Cliente Socket.io conectado com ID:', socketInstance.id);
          setSocket(socketInstance);
          setError(null);
          
          // ✅ Emitir evento customizado para notificar componentes sobre reconexão
          window.dispatchEvent(new CustomEvent('socket-reconnected', { 
            detail: { socketId: socketInstance.id } 
          }));
        });

        socketInstance.on('connect_error', (err) => {
          console.error('❌ Erro de conexão Socket.io:', err);
          setError('Tentando reconectar... Verifique sua conexão com a internet.');
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('🔌 Cliente Socket.io desconectado. Motivo:', reason);
          
          // ✅ Só mostrar erro se for desconexão inesperada
          if (reason === 'io server disconnect') {
            setError('Servidor desconectou a sessão. Recarregue a página.');
          } else if (reason === 'transport close' || reason === 'transport error') {
            setError('Conexão perdida. Tentando reconectar...');
          }
        });

        // ✅ Evento quando está tentando reconectar
        socketInstance.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔄 Tentativa de reconexão #${attemptNumber}`);
          setError(`Tentando reconectar... (tentativa ${attemptNumber})`);
        });

        // ✅ Evento quando conseguiu reconectar
        socketInstance.on('reconnect', (attemptNumber) => {
          console.log(`✅ Reconectado após ${attemptNumber} tentativas`);
          setError(null);
        });

        // ✅ Evento quando falhou ao reconectar (não vai acontecer com Infinity attempts)
        socketInstance.on('reconnect_failed', () => {
          console.error('❌ Falha total na reconexão');
          setError('Não foi possível reconectar. Recarregue a página.');
        });

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Erro ao inicializar conexão:', error);
        setError('Erro ao conectar com o servidor. Tente recarregar a página.');
      }
    };

    initConnection();
  }, []);

  if (error) {
    return (
      <Container size="lg" style={{ height: '100vh' }}>
        <Center style={{ height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Text color="red" mb="md">{error}</Text>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#228be6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Recarregar Página
            </button>
          </div>
        </Center>
      </Container>
    );
  }

  if (!socket) {
    return (
      <Container size="lg" style={{ height: '100vh' }}>
        <Center style={{ height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" mb="md" />
            <Text>Inicializando...</Text>
          </div>
        </Center>
      </Container>
    );
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket deve ser usado dentro de SocketProvider');
  }
  return socket;
} 