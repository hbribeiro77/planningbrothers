'use client';

import { Container, Paper, Title, Text, Center } from '@mantine/core';
import FormularioEntrada from '@/components/Auth/FormularioEntrada';

export default function Home() {
  return (
    <Container size="sm" py="xl">
      <Center my={50}>
        <Title order={1} size="h1" ta="center" fw={900}>
          Planning Brothers
        </Title>
      </Center>
      
      <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
        <FormularioEntrada 
          titulo="Crie uma Sala de Planning Poker"
          mostrarCriarSala={true}
          mostrarEntrarSala={false}
        />
      </Paper>
      
      <Text c="dimmed" size="sm" ta="center" mt={30}>
        Aplicação para facilitar Planning Poker em equipes ágeis.
      </Text>
    </Container>
  );
}
