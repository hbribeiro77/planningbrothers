'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Container, Center, Loader, Text } from '@mantine/core';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let socketInstance;

    const initSocket = () => {
      try {
        console.log('Inicializando cliente Socket.io...');
        
        // Usa a URL da Vercel em produção ou localhost em desenvolvimento
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? 'https://planningbrothers.vercel.app'
          : 'http://localhost:3000';
        
        socketInstance = io(socketUrl, {
          path: '/api/socketio',
          addTrailingSlash: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling'],
          forceNew: true,
          timeout: 10000
        });

        socketInstance.on('connect', () => {
          console.log('Cliente Socket.io conectado');
          setSocket(socketInstance);
          setError(null);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Erro de conexão Socket.io:', err);
          setError('Erro ao conectar com o servidor. Tente recarregar a página.');
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('Cliente Socket.io desconectado:', reason);
          if (reason === 'io server disconnect') {
            socketInstance.connect();
          }
        });

        socketInstance.on('reconnect', (attemptNumber) => {
          console.log('Reconectado ao Socket.io após', attemptNumber, 'tentativas');
          setError(null);
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
          console.log('Tentativa de reconexão', attemptNumber);
        });

        socketInstance.on('error', (error) => {
          console.error('Erro no Socket.io:', error);
          setError('Ocorreu um erro na conexão. Tente recarregar a página.');
        });

      } catch (error) {
        console.error('Erro ao inicializar Socket.io:', error);
        setError('Não foi possível inicializar o servidor. Tente recarregar a página.');
      }
    };

    initSocket();

    return () => {
      if (socketInstance) {
        console.log('Desconectando Socket.io...');
        socketInstance.disconnect();
      }
    };
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