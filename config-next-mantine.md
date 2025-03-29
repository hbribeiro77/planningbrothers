# Configurando um Projeto Next.js com Mantine (Windows)

Este guia descreve os passos para criar um novo projeto Next.js utilizando JavaScript e a biblioteca de componentes Mantine em um ambiente Windows.

## 1. Pré-requisitos

Certifique-se de ter o Node.js e o npm (gerenciador de pacotes do Node) instalados. Verifique as versões no seu terminal (CMD ou PowerShell):

```bash
node -v
npm -v
```

Se não estiverem instalados, baixe e instale a versão LTS do Node.js em [https://nodejs.org/](https://nodejs.org/).

## 2. Criar o Projeto Next.js

1. **Navegue até a pasta desejada:**
   Use o comando `cd` no terminal para ir até o diretório onde você quer criar o projeto.
   ```bash
   cd C:\Caminho\Para\Sua\Pasta
   ```

2. **Execute o comando `create-next-app`:**
   Na pasta escolhida, rode o comando abaixo para iniciar um novo projeto Next.js na pasta atual (`.`), usando JavaScript (`--js`), ESLint (`--eslint`) e o App Router (`--app`).
   ```bash
   npx create-next-app@latest . --js --eslint --app
   ```
   Siga as instruções do instalador. Você pode optar por *não* instalar o Tailwind CSS, já que usaremos Mantine.

## 3. Instalar Mantine

Após a criação do projeto, instale as bibliotecas do Mantine e suas dependências de desenvolvimento (PostCSS):

```bash
npm install @mantine/core @mantine/hooks
npm install -D postcss postcss-preset-mantine postcss-simple-vars
```

## 4. Configurar Mantine e PostCSS

1. **Crie o arquivo `postcss.config.mjs`:**
   Na raiz do projeto (mesma pasta do `package.json`), crie um arquivo chamado `postcss.config.mjs` com o seguinte conteúdo:

   ```javascript
   export default {
     plugins: {
       'postcss-preset-mantine': {},
       'postcss-simple-vars': {
         variables: {
           'mantine-breakpoint-xs': '36em',
           'mantine-breakpoint-sm': '48em',
           'mantine-breakpoint-md': '62em',
           'mantine-breakpoint-lg': '75em',
           'mantine-breakpoint-xl': '88em',
         },
       },
     },
   };
   ```

2. **Configure o Layout Global (`app/layout.js`):**
   Edite o arquivo `app/layout.js` para importar os estilos do Mantine e configurar o `MantineProvider`:

   ```javascript
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
           <ColorSchemeScript /> {/* Necessário para gerenciamento de tema */}
         </head>
         <body className={inter.className}>
           {/* Envolve a aplicação com o Provider. defaultColorScheme="auto" adapta ao sistema */}
           <MantineProvider defaultColorScheme="auto">
             {children}
           </MantineProvider>
         </body>
       </html>
     );
   }
   ```

## 5. Rodar a Aplicação

Inicie o servidor de desenvolvimento com o comando:

```bash
npm run dev
```

Acesse a aplicação no seu navegador, geralmente em `http://localhost:3000`.

---

Com estes passos, seu ambiente Next.js + Mantine estará pronto para desenvolvimento!
