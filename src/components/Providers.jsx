'use client';

import { SocketProvider } from '@/contexts/SocketContext';
import { MantineProvider } from '@mantine/core';

export function Providers({ children }) {
  return (
    <MantineProvider defaultColorScheme="light">
      <SocketProvider>
        {children}
      </SocketProvider>
    </MantineProvider>
  );
} 