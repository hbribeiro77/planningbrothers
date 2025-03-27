'use client';

import { Button, TextInput, Stack, Title, Paper, Container, Group, Text, Center } from '@mantine/core';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  return (
    <Container size="sm" py="xl">
      <Center my={50}>
        <Title order={1} size="h1" ta="center" fw={900}>
          Planning Brothers
        </Title>
      </Center>
      
      <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
        <EntradaSala />
      </Paper>
      
      <Text c="dimmed" size="sm" ta="center" mt={30}>
        Aplicação para facilitar Planning Poker em equipes ágeis.
      </Text>
    </Container>
  );
}

function EntradaSala() {
  'use client';
  
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [codigoSala, setCodigoSala] = useState('');
  const [validando, setValidando] = useState(false);
  
  const criarNovaSala = () => {
    if (!nome) return;
    
    setValidando(true);
    
    // Gerar código aleatório para a sala
    const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Redirecionar para a sala
    setTimeout(() => {
      router.push(`/sala/${novoCodigo}?nome=${encodeURIComponent(nome)}`);
    }, 500);
  };
  
  const entrarEmSala = () => {
    if (!nome || !codigoSala) return;
    
    setValidando(true);
    
    // Redirecionar para a sala existente
    setTimeout(() => {
      router.push(`/sala/${codigoSala}?nome=${encodeURIComponent(nome)}`);
    }, 500);
  };
  
  return (
    <Stack>
      <Title order={3} ta="center">
        Entre no Planning Poker
      </Title>
      
      <TextInput
        label="Seu nome"
        placeholder="Digite seu nome"
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      
      <Group grow>
        <Button 
          color="blue" 
          onClick={criarNovaSala} 
          loading={validando}
          disabled={!nome}
        >
          Criar Nova Sala
        </Button>
      </Group>
      
      <Text ta="center" fw={500} mt="md">
        ou
      </Text>
      
      <TextInput
        label="Código da sala"
        placeholder="Digite o código da sala"
        value={codigoSala}
        onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
      />
      
      <Button
        variant="light"
        onClick={entrarEmSala}
        loading={validando}
        disabled={!nome || !codigoSala}
      >
        Entrar em Sala Existente
      </Button>
    </Stack>
  );
}
