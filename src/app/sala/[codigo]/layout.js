'use client';

import { SocketProvider } from '@/contexts/SocketContext';

export default function SalaLayout({ children }) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
} 