import "@mantine/core/styles.css";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from '@/components/Providers';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

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
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ overflow: 'hidden' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
