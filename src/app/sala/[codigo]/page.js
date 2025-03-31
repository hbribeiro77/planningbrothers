'use client';

import { useState, useEffect } from 'react';
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
  Loader,
  Center,
  Box
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

import Mesa from '@/components/Mesa/Mesa';
import OpcoesVotacao from '@/components/Sala/OpcoesVotacao';
import { useSalaSocket } from '@/hooks/useSalaSocket';
import FormularioEntrada, { LOCALSTORAGE_NOME_KEY } from '@/components/Auth/FormularioEntrada';

// Componente que pede o nome do usuário - mantém a aparência original
function PedirNome({ codigoSala, nomeSugerido, onNomeDefinido }) {
  return (
    <Container size="sm" py="xl">
      <Center my={30}>
        <Title order={1} size="h2" ta="center">
          Sala {codigoSala}
        </Title>
      </Center>
      
      <Paper withBorder shadow="md" p={30} radius="md">
        <FormularioEntrada
          titulo="Entre nesta Sala de Planning Poker"
          codigoSalaFixo={codigoSala}
          mostrarCriarSala={false}
          mostrarEntrarSala={true}
          textoBotaoEntrar="Entrar nesta Sala"
          nomeInicial={nomeSugerido}
          onSalvarNome={onNomeDefinido}
        />
      </Paper>
    </Container>
  );
}

// Componente da sala - só renderizado quando temos nome definido
function SalaConteudo({ codigoSala, nomeUsuario }) {
  // Estados para controlar a sessão
  const [sessaoId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [conexaoDuplicada, setConexaoDuplicada] = useState(false);
  
  // Aqui chamamos o hook com os parâmetros finais
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

  // Filtra participantes para remover duplicatas do mesmo nome
  // Mantém apenas a primeira ocorrência de cada nome
  const filtrarParticipantesUnicos = (participantes) => {
    const nomesVistos = new Set();
    return participantes.filter(participante => {
      // Se já vimos este nome antes, ignoramos este participante
      if (nomesVistos.has(participante.nome)) {
        return false;
      }
      // Caso contrário, marcamos o nome como visto e mantemos o participante
      nomesVistos.add(participante.nome);
      return true;
    });
  };

  // Lista de participantes sem duplicatas
  const participantesUnicos = filtrarParticipantesUnicos(participantes);

  // Verifica se este é o primeiro acesso ou uma janela duplicada
  useEffect(() => {
    if (conectado) {
      // Cria chave específica para o usuário nesta sala
      const salaUserKey = `planning_brothers_sala_${codigoSala}_${nomeUsuario}`;
      
      // Verifica se já existe uma sessão ativa para este usuário nesta sala
      const sessaoAtiva = localStorage.getItem(salaUserKey);
      
      if (!sessaoAtiva) {
        // Primeira conexão deste usuário nesta sala - registra esta sessão
        localStorage.setItem(salaUserKey, sessaoId);
      } else if (sessaoAtiva !== sessaoId) {
        // Já existe sessão e não é esta - indica tentativa de conexão duplicada
        setConexaoDuplicada(true);
      }
      
      // Limpa a sessão quando o componente desmontar
      return () => {
        // Apenas limpar se for a nossa sessão
        const sessaoAtual = localStorage.getItem(salaUserKey);
        if (sessaoAtual === sessaoId) {
          localStorage.removeItem(salaUserKey);
        }
      };
    }
  }, [conectado, codigoSala, nomeUsuario, sessaoId]);

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

  // Se detectamos que esta é uma tentativa de conexão duplicada
  if (conexaoDuplicada) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Paper withBorder shadow="md" p={30} radius="md" mt="xl" style={{ textAlign: 'center' }}>
            <Title order={3} mb="md">Você já está nesta sala</Title>
            <Text mb="md">Você já está participando desta sala em outra janela ou aba.</Text>
            <Text size="sm" c="dimmed" mb="xl">Apenas uma conexão ativa é recomendada para evitar problemas de sincronização durante as votações.</Text>
            
            <Group justify="center">
              <Button 
                variant="light" 
                component="a" 
                href="/"
              >
                Voltar para o início
              </Button>
              <Button 
                color="blue"
                component="a" 
                href={`/sala/${codigoSala}`}
              >
                Tentar novamente
              </Button>
            </Group>
          </Paper>
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
          participantes={participantesUnicos}
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

// Componente principal da página
export default function SalaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codigoSala = params.codigo;
  const nomeSugerido = searchParams.get('nome') || '';
  
  // Estado para controlar o nome do usuário
  const [nomeUsuario, setNomeUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verificar se já temos o nome no localStorage ou na URL
  useEffect(() => {
    // Primeiro verificamos se já existe um nome salvo
    const nomeSalvo = localStorage.getItem(LOCALSTORAGE_NOME_KEY);
    
    if (nomeSalvo) {
      // Se tem nome salvo, usa ele
      setNomeUsuario(nomeSalvo);
    } else if (nomeSugerido) {
      // Se tem nome na URL, salva e usa ele
      localStorage.setItem(LOCALSTORAGE_NOME_KEY, nomeSugerido);
      setNomeUsuario(nomeSugerido);
    }
    
    // Independentemente do resultado, não estamos mais carregando
    setCarregando(false);
  }, [nomeSugerido]); // Executa apenas na montagem e se nomeSugerido mudar

  // Callback quando o nome for informado e salvo pelo FormularioEntrada
  const handleNomeDefinido = (nome) => {
    setNomeUsuario(nome);
  };

  // Se estamos carregando, mostra um loader
  if (carregando) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="md" />
      </Center>
    );
  }

  // Se não temos nome definido, mostra formulário para pedir nome
  if (!nomeUsuario) {
    return (
      <PedirNome 
        codigoSala={codigoSala} 
        nomeSugerido={nomeSugerido} 
        onNomeDefinido={handleNomeDefinido} 
      />
    );
  }

  // Se chegou aqui, temos o nome definido
  return <SalaConteudo codigoSala={codigoSala} nomeUsuario={nomeUsuario} />;
} 