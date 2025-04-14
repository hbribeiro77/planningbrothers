'use client';

import { useState, useEffect } from 'react';
import { Box, Notification, useMantineTheme } from '@mantine/core';
import { IconSkull } from '@tabler/icons-react';

const NOTIFICATION_DURATION = 5000; // ms
const ENTRANCE_ANIMATION_DURATION = 300; // ms
const EXIT_ANIMATION_DURATION = 600; // ms

export function KillFeedDisplay({ lastFeedEvent }) {
  const theme = useMantineTheme(); // Hook para acessar o tema
  const [killFeed, setKillFeed] = useState([]); // Array de { id, title, message, icon, color, isExiting }

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

      const exitTimer = setTimeout(() => {
        setKillFeed(prevFeed => 
          prevFeed.map(n => n.id === uniqueId ? { ...n, isExiting: true } : n)
        );
      }, NOTIFICATION_DURATION - EXIT_ANIMATION_DURATION);

      const removeTimer = setTimeout(() => {
        setKillFeed(prevFeed => prevFeed.filter(n => n.id !== uniqueId)); 
      }, NOTIFICATION_DURATION);
      
      return () => {
          clearTimeout(exitTimer);
          clearTimeout(removeTimer);
      }
    }
  }, [lastFeedEvent]);

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
        const titleColor = theme.colors[notification.color] ? theme.colors[notification.color][8] : theme.colors.blue[8];
        
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
                  backgroundColor: theme.white,
                  border: `1px solid ${theme.colors.gray[2]}`, 
                  minWidth: '250px',
                },
                title: {
                   color: titleColor, 
                },
                 description: {
                   color: theme.colors.gray[8], 
                 },
                 icon: {
                    color: titleColor,
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