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
  Badge
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

import Mesa from '@/components/Mesa/Mesa';
import OpcoesVotacao from '@/components/Sala/OpcoesVotacao';

export default function SalaPage() {
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
  
  // Mock de participantes para demonstração
  useEffect(() => {
    // Em uma implementação real, isto seria substituído pela conexão Socket.io
    const participantesIniciais = [
      { nome: nomeUsuario, jaVotou: false, valorVotado: null, isModerador: true, isObservador: false },
      { nome: 'João', jaVotou: true, valorVotado: '3', isObservador: false },
      { nome: 'Maria', jaVotou: false, valorVotado: null, isObservador: false },
      { nome: 'Pedro', jaVotou: true, valorVotado: '2', isObservador: false },
    ];
    
    setParticipantes(participantesIniciais);
    setSalaURL(`${window.location.origin}/sala/${codigoSala}`);
  }, [nomeUsuario, codigoSala]);
  
  // Função para lidar com o voto do usuário atual
  const handleVotar = (valor) => {
    setMeuVoto(valor);
    // Atualiza o estado do usuário na lista de participantes
    setParticipantes(prev => prev.map(p => 
      p.nome === nomeUsuario 
        ? { ...p, jaVotou: true, valorVotado: valor } 
        : p
    ));
    
    // Em uma implementação real, enviaria o voto via Socket.io
  };
  
  // Função para cancelar o voto do usuário
  const handleCancelarVoto = () => {
    setMeuVoto(null);
    // Atualiza o estado do usuário na lista de participantes
    setParticipantes(prev => prev.map(p => 
      p.nome === nomeUsuario 
        ? { ...p, jaVotou: false, valorVotado: null } 
        : p
    ));
    
    // Em uma implementação real, enviaria o cancelamento via Socket.io
  };
  
  // Função para revelar todos os votos
  const handleRevelarVotos = () => {
    setRevelarVotos(true);
    // Em uma implementação real, enviaria o comando via Socket.io
  };
  
  // Função para iniciar nova rodada
  const handleNovaRodada = () => {
    setRevelarVotos(false);
    setMeuVoto(null);
    
    // Reseta os votos de todos os participantes
    setParticipantes(prev => prev.map(p => ({
      ...p,
      jaVotou: false,
      valorVotado: null
    })));
    
    // Em uma implementação real, enviaria o comando via Socket.io
  };
  
  // Toggle entre modo observador e participante
  const toggleModoObservador = () => {
    const novoModo = !modoObservador;
    
    // Se estava participando e passa a observar, cancela o voto
    if (novoModo && meuVoto) {
      handleCancelarVoto();
    }
    
    // Atualiza o estado do usuário na lista de participantes
    setParticipantes(prev => prev.map(p => 
      p.nome === nomeUsuario 
        ? { ...p, isObservador: novoModo } 
        : p
    ));
    
    setModoObservador(novoModo);
  };
  
  // Verifica se todos já votaram
  const todosVotaram = participantes.every(p => p.jaVotou);
  
  // Verifica se o usuário atual é o moderador
  const souModerador = participantes.find(p => p.nome === nomeUsuario)?.isModerador;
  
  return (
    <Container size="lg" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '10px 15px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Group position="apart" mb="xs">
        <div>
          <Group align="center">
            <Title order={3}>Sala: {codigoSala}</Title>
            <CopyButton value={salaURL} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copiado!' : 'Copiar link da sala'} withArrow>
                  <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Text c="dimmed" size="sm">Compartilhe o código com sua equipe</Text>
        </div>
        
        <Group>
          <Button 
            size="xs" 
            variant={modoObservador ? "filled" : "outline"}
            color={modoObservador ? "teal" : "gray"}
            onClick={toggleModoObservador}
          >
            {modoObservador ? "Observando" : "Modo Observador"}
          </Button>
          
          <Badge size="md" variant="filled" color="blue">
            Participantes: {participantes.length}
          </Badge>
        </Group>
      </Group>
      
      {/* Botão de Nova Rodada com posicionamento responsivo */}
      {souModerador && revelarVotos && (
        <div style={{ 
          position: 'absolute',
          top: '18%',
          transform: 'translateY(-50%)',
          left: 0,
          right: 0,
          zIndex: 50,
          textAlign: 'center',
          padding: '0 15px'
        }}>
          <Button 
            color="blue" 
            size="md"
            onClick={handleNovaRodada}
          >
            Iniciar Nova Rodada
          </Button>
        </div>
      )}
      
      <div style={{ 
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '45vh',
        minHeight: '380px',
        maxHeight: 480,
        transform: 'translateY(-50%)',
        padding: '0 15px'
      }}>
        <Mesa 
          participantes={participantes} 
          revelarVotos={revelarVotos} 
          onRevelarVotos={handleRevelarVotos}
        />
      </div>
      
      {/* Área inferior com controles - posicionada com porcentagem da viewport */}
      <div style={{ 
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        padding: '0 15px'
      }}>
        {!modoObservador && (
          <OpcoesVotacao 
            onVotar={handleVotar}
            onCancelarVoto={handleCancelarVoto}
            votoConfirmado={meuVoto}
            revelarVotos={revelarVotos}
          />
        )}
        
        {modoObservador && (
          <Paper withBorder p="sm" radius="md" bg="rgba(240, 255, 245, 0.5)">
            <Group position="center">
              <Text size="sm" c="dimmed" fw={500}>Você está no modo observador</Text>
            </Group>
          </Paper>
        )}
      </div>
    </Container>
  );
} 