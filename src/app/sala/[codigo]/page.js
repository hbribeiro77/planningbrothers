'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Box,
  Notification
} from '@mantine/core';
import { IconCopy, IconCheck, IconX, IconSkull, IconKeyboard } from '@tabler/icons-react';

import Mesa from '@/components/Mesa/Mesa';
import OpcoesVotacao from '@/components/Sala/OpcoesVotacao';
import { useSalaSocket } from '@/hooks/useSalaSocket';
import { useSalaUiEffects } from '@/hooks/useSalaUiEffects';
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
  const [armaSelecionada, setArmaSelecionada] = useState('keyboard');
  const [isFlashEffectEnabled, setIsFlashEffectEnabled] = useState(true); 

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
    toggleModoObservador: originalToggleModoObservador,
    socket,
    lastDamageTimestamp,
    lastKillInfo
  } = useSalaSocket(codigoSala, nomeUsuario);

  const currentUser = participantes.find(p => p.nome === nomeUsuario) || { id: '', nome: nomeUsuario };

  const shouldShowAttentionOverlay = currentUser?.life <= 0 && 
                                     !currentUser?.isObservador && 
                                     !currentUser?.jaVotou;

  const { 
    entradaAnimada, 
    isPulsing, 
    isFlashing, 
    triggerPulse 
  } = useSalaUiEffects(
    conectado,
    revelarVotos,
    lastDamageTimestamp,
    isFlashEffectEnabled,
    shouldShowAttentionOverlay
  );

  // --- Kill Feed como Array ---
  const [killFeed, setKillFeed] = useState([]); // Agora é um array

  // Efeito para adicionar notificações de eliminação
  useEffect(() => {
    if (lastKillInfo) {
      // Gera ID único, mensagem e determina o ícone da arma
      const uniqueId = `${lastKillInfo.timestamp}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Escolher o ícone da arma
      let weaponIcon = null;
      if (lastKillInfo.weaponType === 'keyboard') {
        weaponIcon = <IconKeyboard size="1.1rem" style={{ marginRight: '5px' }} />;
      } // Adicionar else if para outras armas aqui...
      
      // Monta a mensagem (pode ser um fragmento JSX agora)
      const notificationMessage = (
        <>
          {lastKillInfo.attackerName} {weaponIcon} {lastKillInfo.targetName}!
        </>
      );

      const newNotification = {
        id: uniqueId, 
        message: notificationMessage // Armazena o JSX da mensagem
      };
      
      console.log("KILL FEED: Adicionando:", newNotification);
      
      // Adiciona a nova notificação ao array
      setKillFeed(prevFeed => [...prevFeed, newNotification]);

      // Agenda a remoção
      setTimeout(() => {
        setKillFeed(prevFeed => prevFeed.filter(n => n.id !== uniqueId)); 
        console.log("KILL FEED: Removendo:", uniqueId);
      }, 5000);
    }
  }, [lastKillInfo]);

  // Opcional, mas recomendado: Limpeza geral ao desmontar o componente
  useEffect(() => {
    // Este effect não faz nada na montagem/atualização, 
    // mas sua função de limpeza será chamada quando SalaConteudo for desmontado.
    // Isso evita potenciais warnings de state update em componente desmontado,
    // embora os timers individuais devam funcionar corretamente.
    // Nota: Isso limparia timers que ainda não dispararam se o usuário SAIR da sala.
    const killFeedTimeouts = []; // Precisaríamos armazenar os IDs dos timers se quiséssemos fazer isso.
                                 // Por simplicidade e dado que o problema principal é outro, vamos omitir por agora.
                                 // A remoção da limpeza no effect [lastKillInfo] é o ponto crucial.
    return () => {
      // console.log("SalaConteudo desmontando - limpar timers pendentes se necessário");
      // Código para limpar timers pendentes iria aqui, se gerenciados externamente.
    };
  }, []); // Array vazio para rodar limpeza apenas no unmount

  const handleNovaRodadaComAnimacao = () => {
    console.log("PULSE: Nova Rodada");
    triggerPulse();
    handleNovaRodada(); 
  };

  const toggleModoObservadorComAnimacao = () => {
    console.log("PULSE: Toggle Modo Observador");
    triggerPulse();
    originalToggleModoObservador();
  };

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

  const pulseAnimation = {
    animation: isPulsing ? 'pulseEffect 0.8s ease-out' : 'none'
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
              onClick={toggleModoObservadorComAnimacao}
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
            style={pulseAnimation}
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

        {/* --- Container para empilhar as notificações --- */}
        <Box
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1050, 
            display: 'flex',
            flexDirection: 'column-reverse', // Empilha de baixo para cima
            alignItems: 'flex-end',
            gap: '10px' // Espaço entre notificações
          }}
        >
          {/* Mapeia o array killFeed e renderiza cada notificação */}
          {killFeed.map((notification, index) => (
            <Notification 
              key={notification.id} 
              icon={<IconSkull size="1.2rem" />} 
              color="red" 
              title="Eliminação!"
              withCloseButton={false}
              styles={{
                root: {
                  minWidth: '300px',
                  textAlign: 'center' 
                }
              }}
            >
              {/* Renderiza a mensagem (que agora pode ser JSX com o ícone) */}
              {notification.message}
            </Notification>
          ))}
        </Box>

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