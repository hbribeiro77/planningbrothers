'use client';

import { useEffect, useState } from 'react';
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
  Center
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { useSocket } from '@/contexts/SocketContext';

import Mesa from '@/components/Mesa/Mesa';
import OpcoesVotacao from '@/components/Sala/OpcoesVotacao';

export default function SalaPage() {
  const socket = useSocket();
  const params = useParams();
  const searchParams = useSearchParams();
  const codigoSala = params.codigo;
  const nomeUsuario = searchParams.get('nome') || 'Anônimo';
  
  // Estados da sala
  const [participantes, setParticipantes] = useState([]);
  const [revelarVotos, setRevelarVotos] = useState(false);
  const [meuVoto, setMeuVoto] = useState(null);
  const [salaURL, setSalaURL] = useState('');
  const [modoObservador, setModoObservador] = useState(false);
  const [conectado, setConectado] = useState(false);
  
  // Conectar à sala quando o componente montar
  useEffect(() => {
    if (!socket) return;

    // Configurar URL da sala
    setSalaURL(`${window.location.origin}/sala/${codigoSala}`);
    
    // Entrar na sala
    socket.emit('entrarSala', { 
      codigo: codigoSala, 
      usuario: {
        nome: nomeUsuario,
        isObservador: modoObservador
      }
    });

    // Receber atualizações de participantes
    socket.on('atualizarParticipantes', (participantesAtualizados) => {
      setParticipantes(participantesAtualizados);
      setConectado(true);
    });

    // Receber votos
    socket.on('votoRecebido', ({ usuario, voto }) => {
      setParticipantes(prev => prev.map(p => 
        p.nome === usuario.nome 
          ? { ...p, jaVotou: true, valorVotado: voto }
          : p
      ));
    });

    // Revelar votos
    socket.on('votosRevelados', () => {
      setRevelarVotos(true);
    });

    // Nova rodada
    socket.on('votacaoReiniciada', () => {
      setRevelarVotos(false);
      setMeuVoto(null);
    });

    // Modo observador alterado
    socket.on('modoObservadorAlterado', ({ usuario, isObservador }) => {
      setParticipantes(prev => prev.map(p => 
        p.nome === usuario.nome 
          ? { ...p, isObservador }
          : p
      ));
    });

    return () => {
      socket.off('atualizarParticipantes');
      socket.off('votoRecebido');
      socket.off('votosRevelados');
      socket.off('votacaoReiniciada');
      socket.off('modoObservadorAlterado');
    };
  }, [socket, codigoSala, nomeUsuario, modoObservador]);

  // Funções de manipulação de eventos
  const handleVotar = (valor) => {
    if (!socket || modoObservador) return;
    
    socket.emit('votar', { 
      codigo: codigoSala, 
      usuario: { nome: nomeUsuario }, 
      voto: valor 
    });
    setMeuVoto(valor);
  };

  const handleCancelarVoto = () => {
    if (!socket || modoObservador) return;
    
    socket.emit('cancelarVoto', { codigo: codigoSala });
    setMeuVoto(null);
  };

  const handleRevelarVotos = () => {
    if (!socket) return;
    socket.emit('revelarVotos', codigoSala);
  };

  const handleNovaRodada = () => {
    if (!socket) return;
    socket.emit('reiniciarVotacao', codigoSala);
  };

  const toggleModoObservador = () => {
    if (!socket) return;
    
    const novoModo = !modoObservador;
    setModoObservador(novoModo);
    
    socket.emit('alternarModoObservador', {
      codigo: codigoSala,
      usuario: { nome: nomeUsuario },
      isObservador: novoModo
    });
  };

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

  // Resto do código de renderização...
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Sala {codigoSala}</Title>
        <Group>
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
      </Group>

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