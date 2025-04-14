'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Notification, useMantineTheme } from '@mantine/core';
import { IconSkull } from '@tabler/icons-react';

const NOTIFICATION_DURATION = 5000; // ms
const ENTRANCE_ANIMATION_DURATION = 300; // ms
const EXIT_ANIMATION_DURATION = 600; // ms

export function KillFeedDisplay({ lastFeedEvent }) {
  const theme = useMantineTheme();
  const [killFeed, setKillFeed] = useState([]);
  const removalTimers = useRef({});
  const finalRemovalTimers = useRef({});

  useEffect(() => {
    if (lastFeedEvent) {
      const uniqueId = lastFeedEvent.eventId;
      
      if (killFeed.some(n => n.id === uniqueId)) {
          console.warn(`[KillFeedDisplay] Tentativa de adicionar evento duplicado: ${uniqueId}`);
          return;
      }
      
      const newNotification = {
        id: uniqueId, 
        title: lastFeedEvent.title, 
        message: lastFeedEvent.message, 
        icon: lastFeedEvent.icon,
        color: lastFeedEvent.color,
        isExiting: false
      };
      
      console.log(`[KillFeedDisplay] Adicionando: ${uniqueId}, Tipo: ${lastFeedEvent.type}`);
      setKillFeed(prevFeed => [...prevFeed, newNotification]);

      clearTimeout(removalTimers.current[uniqueId]);
      clearTimeout(finalRemovalTimers.current[uniqueId]);

      removalTimers.current[uniqueId] = setTimeout(() => {
        console.log(`[KillFeedDisplay] Iniciando processo de saída para ${uniqueId}`);
        setKillFeed(prev =>
          prev.map(n => n.id === uniqueId ? { ...n, isExiting: true } : n)
        );

        finalRemovalTimers.current[uniqueId] = setTimeout(() => {
          console.log(`[KillFeedDisplay] Removendo ${uniqueId} do estado`);
          setKillFeed(prev => prev.filter(n => n.id !== uniqueId));
          delete removalTimers.current[uniqueId];
          delete finalRemovalTimers.current[uniqueId];
        }, EXIT_ANIMATION_DURATION);

      }, NOTIFICATION_DURATION);

    }
  }, [lastFeedEvent]);

  useEffect(() => {
      return () => {
          console.log("[KillFeedDisplay] Limpando todos os timers ao desmontar.");
          Object.values(removalTimers.current).forEach(clearTimeout);
          Object.values(finalRemovalTimers.current).forEach(clearTimeout);
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
        flexDirection: 'column-reverse',
        alignItems: 'flex-end',
        gap: '10px'
      }}
    >
      {killFeed.map((notification) => {
        let titleColor, iconColor, descriptionColor, bgColor, borderColor;
        if (notification.color === 'green') {
          titleColor = theme.colors.green[8];
          iconColor = theme.colors.green[8];
          descriptionColor = theme.colors.gray[8];
          bgColor = theme.white;
          borderColor = theme.colors.gray[2];
        } else {
          titleColor = theme.colors.blue[8];
          iconColor = titleColor;
          descriptionColor = theme.colors.gray[8];
          bgColor = theme.white;
          borderColor = theme.colors.gray[2];
        }

        return (
          <div 
            key={notification.id}
            className={`killfeed-notification ${notification.isExiting ? 'exiting' : 'entering'}`}
            style={{
              borderRadius: theme.radius.sm, 
            }}
          >
            <Notification 
              icon={notification.icon || <IconSkull size="1.2rem" />}
              title={notification.title} 
              withCloseButton={false}
              padding="xs" 
              styles={(theme) => ({
                root: {
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`, 
                  minWidth: '250px',
                },
                title: {
                   color: titleColor, 
                },
                 description: {
                   color: descriptionColor, 
                 },
                 icon: {
                    color: iconColor,
                 }
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