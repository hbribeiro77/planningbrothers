'use client';

import { useState, useEffect, useRef } from 'react';
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
import { GameController } from '@/components/GameElements/GameController';
import { InventoryDisplay } from '@/components/GameElements/InventoryDisplay';
import { LifeBarProvider } from '@/contexts/LifeBarContext';
import { PvpProvider } from '@/contexts/PvpContext';

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
  // Estados da UI e animação
  const [entradaAnimada, setEntradaAnimada] = useState(false);
  const [novaRodadaAnimada, setNovaRodadaAnimada] = useState(false);
  // Adicionando de volta o estado para a arma selecionada
  const [armaSelecionada, setArmaSelecionada] = useState('keyboard');

  // Aqui chamamos o hook com os parâmetros finais
  const {
    participantes,
    revelarVotos,
    meuVoto,
    salaURL,
    modoObservador,
    conectado,
    erroEntrada,
    handleVotar,
    handleCancelarVoto,
    handleRevelarVotos,
    handleNovaRodada,
    toggleModoObservador,
    socket,
    lastDamageTimestamp
  } = useSalaSocket(codigoSala, nomeUsuario);

  // Encontrar o usuário atual entre os participantes
  const currentUser = participantes.find(p => p.nome === nomeUsuario) || { id: '', nome: nomeUsuario };

  // Encontrar os dados completos do usuário atual na lista de participantes
  // Verifica a propriedade 'life', 'isObservador' e 'jaVotou' para a condição de atenção
  const shouldShowAttentionOverlay = currentUser?.life <= 0 && 
                                     !currentUser?.isObservador && 
                                     !currentUser?.jaVotou;

  // Estado para controlar a piscada
  const [isFlashing, setIsFlashing] = useState(false);
  // NOVO estado para controlar se o efeito de flash está habilitado
  const [isFlashEffectEnabled, setIsFlashEffectEnabled] = useState(true); 

  // Efeito para ativar a piscada
  useEffect(() => {
    if (lastDamageTimestamp === 0) return;

    const isDeadOnDamage = currentUser?.life <= 0 &&
                           !currentUser?.isObservador &&
                           !currentUser?.jaVotou;

    // ADICIONAR VERIFICAÇÃO: Só pisca se o efeito estiver habilitado
    if (isDeadOnDamage && isFlashEffectEnabled) {
      console.log("FLASH: Timestamp de dano recebido mudou enquanto morto E EFEITO HABILITADO, piscando.");
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  // Adicionar isFlashEffectEnabled às dependências
  }, [lastDamageTimestamp, isFlashEffectEnabled]); 

  // Efeito para desativar piscada
  useEffect(() => {
    if (!shouldShowAttentionOverlay && isFlashing) {
      console.log("Overlay vermelho sumiu, garantindo que piscada está desligada.");
      setIsFlashing(false);
    }
  }, [shouldShowAttentionOverlay, isFlashing]);

  // Animar entrada na sala
  useEffect(() => {
    if (conectado) {
      // Pequeno delay para iniciar a animação de entrada
      const timer = setTimeout(() => {
        setEntradaAnimada(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [conectado]);

  // Animar nova rodada
  useEffect(() => {
    if (revelarVotos === false) {
      // Quando revelarVotos muda para false, significa que começou uma nova rodada
      setNovaRodadaAnimada(true);
      const timer = setTimeout(() => {
        setNovaRodadaAnimada(false);
      }, 1000); // Duração da animação
      return () => clearTimeout(timer);
    }
  }, [revelarVotos]);

  // Handler personalizado para nova rodada com animação
  const handleNovaRodadaComAnimacao = () => {
    // Iniciar a animação de nova rodada
    setNovaRodadaAnimada(true);
    // Chamar o handler original após um pequeno delay
    setTimeout(() => {
      handleNovaRodada();
    }, 500);
  };

  // NOVO Handler para receber mudança da configuração do GameController
  const handleFlashEnabledChange = (isEnabled) => {
    console.log("SalaConteudo: Recebeu mudança na configuração de piscada:", isEnabled);
    setIsFlashEffectEnabled(isEnabled);
  };

  // Se houver erro de entrada, mostra mensagem (verificar antes da conexão)
  if (erroEntrada) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Paper withBorder shadow="md" p={30} radius="md" mt="xl" style={{ textAlign: 'center' }}>
            <Title order={3} mb="md" c="orange">Não foi possível entrar na sala</Title>
            <Text mb="md" fw={500}>{erroEntrada}</Text>
            <Text c="dimmed" fs="italic" size="sm">
              Feche esta aba/janela e vá para a que já está aberta.
            </Text>
          </Paper>
        </Center>
      </Container>
    );
  }

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

  // Estilos para as animações
  const animacaoEntrada = {
    opacity: entradaAnimada ? 1 : 0,
    transform: entradaAnimada ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
  };

  const animacaoNovaRodada = {
    animation: novaRodadaAnimada ? 'pulseEffect 0.8s ease-out' : 'none'
  };

  return (
    <PvpProvider socket={socket} codigoSala={codigoSala} participantes={participantes}>
      <LifeBarProvider>
        <Container size="lg" py="xl" style={animacaoEntrada}>
          {/* Estilo global para animações */}
          <style jsx global>{`
            @keyframes pulseEffect {
              0% { transform: scale(1); }
              50% { transform: scale(1.03); }
              100% { transform: scale(1); }
            }
            
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            .nova-rodada-transition {
              transition: all 0.5s ease-out;
            }
          `}</style>
          
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
            
            {/* GameController permanece no canto */}
            <Group ml="auto" spacing="md" align="center">
              <GameController 
                socket={socket}
                codigoSala={codigoSala}
                currentUser={currentUser} 
                armaSelecionada={armaSelecionada}
                onFlashEnabledChange={handleFlashEnabledChange}
              />
            </Group>
          </Group>

          {/* Botão de Nova Rodada - sempre presente mas só visível quando necessário */}
          <Box mb="xl" style={{ display: 'flex', justifyContent: 'center', visibility: revelarVotos ? 'visible' : 'hidden' }}>
            <Button
              color="blue"
              size="sm"
              onClick={handleNovaRodadaComAnimacao}
              className="nova-rodada-transition"
            >
              Nova Rodada
            </Button>
          </Box>

          <Paper 
            shadow="sm" 
            p="md" 
            mb="xl" 
            style={animacaoNovaRodada}
            className="nova-rodada-transition"
          >
            <Mesa 
              participantes={participantes}
              revelarVotos={revelarVotos}
              onRevelarVotos={handleRevelarVotos}
              onNovaRodada={handleNovaRodadaComAnimacao}
            />
          </Paper>

          {/* Renderiza apenas OpcoesVotacao (que agora contém o InventoryDisplay) */}
          {!modoObservador && (
            <OpcoesVotacao
              meuVoto={meuVoto}
              onVotar={handleVotar}
              onCancelarVoto={handleCancelarVoto}
              style={{
                opacity: entradaAnimada ? 1 : 0,
                transform: entradaAnimada ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                transitionDelay: '0.2s'
              }}
            />
          )}
        </Container>

        {/* Overlay vermelho original (atenção) */}
        {shouldShowAttentionOverlay && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            zIndex: 1000, 
            pointerEvents: 'none',
          }} />
        )}

        {/* NOVO: Overlay branco para piscada */}
        {isFlashing && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Branco semi-transparente
            zIndex: 1001, // Acima do overlay vermelho
            pointerEvents: 'none',
            // Poderia adicionar uma animação de fade-out aqui se desejado
          }} />
        )}

      </LifeBarProvider>
    </PvpProvider>
  );
}

// Componente principal da página
export default function SalaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codigoSala = params.codigo;
  const nomeSugerido = searchParams.get('nome') || '';
  const isLinkConvite = searchParams.get('convite') === 'true'; // Indica se está entrando via link de convite
  
  // Estado para controlar o nome do usuário
  const [nomeUsuario, setNomeUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verificar se já temos o nome no localStorage ou na URL
  useEffect(() => {
    // Se estamos entrando via link de convite, não usamos o nome do localStorage
    if (isLinkConvite) {
      setCarregando(false);
      return;
    }

    // Se não é link de convite, tenta pegar do localStorage
    const nomeSalvo = localStorage.getItem(LOCALSTORAGE_NOME_KEY);
    if (nomeSalvo) {
      setNomeUsuario(nomeSalvo);
    }
    
    setCarregando(false);
  }, [isLinkConvite]); // Executa apenas na montagem e se isLinkConvite mudar

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

  // Se estamos entrando via link de convite, SEMPRE mostra o formulário
  if (isLinkConvite) {
    return (
      <PedirNome 
        codigoSala={codigoSala} 
        nomeSugerido={nomeSugerido} 
        onNomeDefinido={handleNomeDefinido} 
      />
    );
  }

  // Se não temos nome definido E não estamos entrando via link de convite, mostra formulário
  if (!nomeUsuario) {
    return (
      <PedirNome 
        codigoSala={codigoSala} 
        nomeSugerido="" 
        onNomeDefinido={handleNomeDefinido} 
      />
    );
  }

  // Se chegou aqui, temos o nome definido e não é link de convite
  return <SalaConteudo codigoSala={codigoSala} nomeUsuario={nomeUsuario} />;
} 