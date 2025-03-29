'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Container, Center, Loader, Text } from '@mantine/core';
import { supabase } from '../lib/supabase';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initConnection = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Inicializando Socket.io...');
          const socketInstance = io('http://localhost:3000', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling']
          });

          socketInstance.on('connect', () => {
            console.log('Cliente Socket.io conectado com ID:', socketInstance.id);
            setSocket(socketInstance);
            setError(null);
          });

          socketInstance.on('connect_error', (err) => {
            console.error('Erro de conexão Socket.io:', err);
            setError('Erro ao conectar com o servidor. Tente recarregar a página.');
          });

          socketInstance.on('disconnect', (reason) => {
            console.log('Cliente Socket.io desconectado. Motivo:', reason);
          });

          return () => {
            socketInstance.disconnect();
          };
        } else {
          console.log('Inicializando Supabase Realtime...');
          const channel = supabase.channel('planning-room', {
            config: {
              broadcast: { self: true }
            }
          });

          channel
            .on('broadcast', { event: 'vote' }, ({ payload }) => {
              console.log('Voto recebido:', payload);
            })
            .on('broadcast', { event: 'reveal' }, ({ payload }) => {
              console.log('Votos revelados:', payload);
            })
            .on('broadcast', { event: 'restart' }, ({ payload }) => {
              console.log('Votação reiniciada:', payload);
            });

          await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Conectado ao Supabase Realtime');
              setSocket(channel);
              setError(null);
            }
          });

          return () => {
            channel.unsubscribe();
          };
        }
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