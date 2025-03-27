import '@mantine/core/styles.css'; // Importa os estilos do Mantine
import { Inter } from 'next/font/google';
import { MantineProvider, ColorSchemeScript } from '@mantine/core'; // Importa o Provider e o Script

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Meu App Next.js com Mantine',
  description: 'Criado com Next.js e Mantine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        <ColorSchemeScript /> {/* Necessário para gerenciamento de tema (claro/escuro) */}
      </head>
      <body className={inter.className}>
        <MantineProvider defaultColorScheme="auto"> {/* Envolve a aplicação com o Provider */}
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}