'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { 
  Container, 
  Title, 
  Text, 
  Group, 
  Button, 
  CopyButton, 
  ActionIcon, 
  Tooltip, 
  Paper,
  Badge,
  Loader,
  Center,
  Box
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

import Mesa from '@/components/Mesa/Mesa';
import OpcoesVotacao from '@/components/Sala/OpcoesVotacao';
import { useSalaSocket } from '@/hooks/useSalaSocket';

export default function SalaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codigoSala = params.codigo;
  const nomeUsuario = searchParams.get('nome') || 'Anônimo';
  
  const {
    participantes,
    revelarVotos,
    meuVoto,
    salaURL,
    modoObservador,
    conectado,
    handleVotar,
    handleCancelarVoto,
    handleRevelarVotos,
    handleNovaRodada,
    toggleModoObservador
  } = useSalaSocket(codigoSala, nomeUsuario);

  // Renderização condicional baseada no estado de conexão
  if (!conectado) {
    return (
      <Container size="lg" style={{ height: '100vh' }}>
        <Center style={{ height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" mb="md" />
            <Text>Conectando à sala...</Text>
          </div>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="flex-start" align="center" mb="xl" gap="xs">
        <Title order={1}>Sala {codigoSala}</Title>
        <CopyButton value={salaURL}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Link copiado!' : 'Copiar link da sala'}>
              <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <Button 
          variant={modoObservador ? 'light' : 'filled'}
          onClick={toggleModoObservador}
        >
          {modoObservador ? 'Sair do Modo Observador' : 'Modo Observador'}
        </Button>
      </Group>

      {/* Botão de Nova Rodada - sempre presente mas só visível quando necessário */}
      <Box mb="xl" style={{ display: 'flex', justifyContent: 'center', visibility: revelarVotos ? 'visible' : 'hidden' }}>
        <Button
          color="blue"
          size="sm"
          onClick={handleNovaRodada}
        >
          Nova Rodada
        </Button>
      </Box>

      <Paper shadow="sm" p="md" mb="xl">
        <Mesa 
          participantes={participantes}
          revelarVotos={revelarVotos}
          onRevelarVotos={handleRevelarVotos}
          onNovaRodada={handleNovaRodada}
        />
      </Paper>

      {!modoObservador && (
        <OpcoesVotacao
          meuVoto={meuVoto}
          onVotar={handleVotar}
          onCancelarVoto={handleCancelarVoto}
        />
      )}
    </Container>
  );
} 