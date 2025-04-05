'use client';

import { useState, useEffect } from 'react';
import { Box, Notification, useMantineTheme } from '@mantine/core';
import { IconSkull } from '@tabler/icons-react';

const NOTIFICATION_DURATION = 5000; // ms
const ENTRANCE_ANIMATION_DURATION = 300; // ms
const EXIT_ANIMATION_DURATION = 600; // ms

export function KillFeedDisplay({ lastKillInfo }) {
  const theme = useMantineTheme(); // Hook para acessar o tema
  const [killFeed, setKillFeed] = useState([]); // Array de { id, title, message, isExiting }

  useEffect(() => {
    if (lastKillInfo) {
      const uniqueId = `${lastKillInfo.timestamp}-${Math.random().toString(36).substring(2, 9)}`;
      
      const newNotification = {
        id: uniqueId, 
        title: lastKillInfo.killTitle, 
        message: lastKillInfo.message, 
        isExiting: false // Inicia sem estado de saída
      };
      
      console.log("[KillFeedDisplay] Adicionando:", newNotification.id);
      setKillFeed(prevFeed => [...prevFeed, newNotification]);

      // 1. Agenda o início da animação de SAÍDA (definindo isExiting = true)
      const exitTimer = setTimeout(() => {
        console.log("[KillFeedDisplay] Iniciando saída de:", uniqueId);
        setKillFeed(prevFeed => 
          prevFeed.map(n => n.id === uniqueId ? { ...n, isExiting: true } : n)
        );
      // Usar a duração CORRETA para iniciar a animação de saída
      }, NOTIFICATION_DURATION - EXIT_ANIMATION_DURATION);

      // 2. Agenda a REMOÇÃO COMPLETA do item do array
      const removeTimer = setTimeout(() => {
        console.log("[KillFeedDisplay] Removendo completamente:", uniqueId);
        setKillFeed(prevFeed => prevFeed.filter(n => n.id !== uniqueId)); 
      }, NOTIFICATION_DURATION);
      
      // IMPORTANTE: NÃO ter limpeza neste useEffect
    }
  }, [lastKillInfo]); 

  // Efeito para limpeza geral ao desmontar (opcional, mas boa prática)
  useEffect(() => {
    return () => {
      // Se houvesse timers para limpar explicitamente, seria aqui.
      // console.log("KillFeedDisplay desmontando.");
    };
  }, []);

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1050, 
        display: 'flex',
        flexDirection: 'column-reverse', // Empilha de baixo para cima
        alignItems: 'flex-end',
        gap: '10px' // Espaço entre notificações
      }}
    >
      {/* Mapeia o array killFeed e usa DIV wrapper para animação CSS */}
      {killFeed.map((notification) => {
        return (
          <div 
            key={notification.id}
            className={`killfeed-notification ${notification.isExiting ? 'exiting' : 'entering'}`}
            style={{
              borderRadius: theme.radius.sm, 
            }}
          >
            <Notification 
              icon={<IconSkull size="1.2rem" />} 
              title={notification.title} 
              withCloseButton={false}
              padding="xs" 
              styles={(theme) => ({
                root: {
                  backgroundColor: theme.white,
                  border: `1px solid ${theme.colors.gray[2]}`, 
                  minWidth: '300px',
                },
                title: {
                   color: theme.colors.blue[8], 
                },
                 description: {
                   color: theme.colors.gray[8], 
                 },
              })}
            >
              {notification.message}
            </Notification>
          </div>
        );
      })}
    </Box>
  );
} 