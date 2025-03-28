import { Inter } from 'next/font/google';
import "@mantine/core/styles.css";
import "./globals.css";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Planning Brothers',
  description: 'Aplicação para Planning Poker em equipes ágeis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-mantine-color-scheme="light" style={{ overflow: 'hidden' }}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className} style={{ overflow: 'hidden' }}>
        <MantineProvider>
          <Providers>
            {children}
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
