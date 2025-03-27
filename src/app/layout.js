import '@mantine/core/styles.css';
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { MantineProvider, ColorSchemeScript } from '@mantine/core';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Planning Brothers - Planning Poker",
  description: "Aplicação de Planning Poker colaborativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-mantine-color-scheme="light" style={{ overflow: 'hidden' }}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ overflow: 'hidden' }}>
        <MantineProvider defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
