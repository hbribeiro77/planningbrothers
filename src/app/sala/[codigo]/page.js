'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
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
  Notification,
  Badge,
  Drawer
} from '@mantine/core';
import { IconCopy, IconCheck, IconX, IconKeyboard, IconCoin, IconSkull, IconShoppingCart, IconSettings, IconKeyboardOff, IconEye, IconEyeOff, IconVolume, IconVolumeOff, IconMessageCircle, IconColorSwatch, IconShirt, IconStar, IconSwords } from '@tabler/icons-react';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { ITEMS_DATA } from '@/constants/itemsData';

import Mesa from '@/components/Mesa/Mesa';
import OpcoesVotacao from '@/components/Sala/OpcoesVotacao';
import { useSalaSocket } from '@/hooks/useSalaSocket';
import { useSalaUiEffects } from '@/hooks/useSalaUiEffects';
import { useKeepAlive } from '@/hooks/useKeepAlive';
import FormularioEntrada, { LOCALSTORAGE_NOME_KEY } from '@/components/Auth/FormularioEntrada';
import { GameController } from '@/components/GameElements/GameController';
import { InventoryDisplay } from '@/components/GameElements/InventoryDisplay';
import { KillFeedDisplay } from '@/components/GameElements/KillFeedDisplay';
import { LifeBarProvider } from '@/contexts/LifeBarContext';
import { PvpProvider, PvpContext } from '@/contexts/PvpContext';
import ShopDrawer from '@/components/Shop/ShopDrawer';
import { AnimationService } from '@/services/AnimationService';
import ConnectionIndicator from '@/components/ConnectionStatus/ConnectionIndicator';

// Mover a definição para fora para poder usar no useEffect
const accessoryIcons = {
  vest: IconShirt,
  // Adicionar outros acessórios aqui
};

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
  // Mover useDisclosure para o topo, junto com outros hooks
  const [shopOpened, { open: openShop, close: closeShop }] = useDisclosure(false);
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
    lastKillInfo,
    lastDamageInfoForAnimation,
    lastFeedEvent
  } = useSalaSocket(codigoSala, nomeUsuario);

  const currentUser = participantes.find(p => p.nome === nomeUsuario) || { id: '', nome: nomeUsuario, score: 0, kills: 0, inventory: [], equippedAccessory: null };
  const currentUserScore = currentUser.score || 0;
  const currentUserKills = currentUser.kills || 0;

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

  // ✅ Sistema de keep-alive para manter conexão ativa (otimizado para Render)
  const { isActive, forcePing } = useKeepAlive({
    enabled: conectado, // Só ativar quando conectado à sala
    pingInterval: 20000,     // ✅ 20s quando ativo (bem menor que 50s do Render)
    inactiveInterval: 30000, // ✅ 30s quando inativo (ainda menor que 50s)
    activityTimeout: 120000  // 2min para considerar inativo
  });

  // --- Lógica de formatação da mensagem do Kill Feed --- 
  // RENOMEADO e MODIFICADO para lidar com diferentes tipos de evento
  const formattedLastFeedEvent = useMemo(() => {
    if (!lastFeedEvent) return null;

    const { type, timestamp, eventId } = lastFeedEvent;
    let title = 'Evento';
    let message = '';
    let icon = null;
    let color = 'blue'; // Cor padrão

    if (type === 'kill') {
        const { attackerName, targetName, weaponType, killTitle } = lastFeedEvent;
        title = killTitle || DEFAULT_KILL_TITLE; // Usa o título recebido ou padrão
        color = 'red'; // Cor para kills
        let weaponIcon = null;
        if (weaponType === 'keyboard') {
          weaponIcon = <IconKeyboard size="1.1rem" style={{ marginRight: '5px' }} />;
        } else if (weaponType === 'eproc') {
          weaponIcon = <img src="/images/game-objects/eproc.svg" alt="EPROC" style={{ width: 18, height: 18, marginRight: 5, verticalAlign: 'middle' }} />;
        } else if (ITEMS_DATA[weaponType]?.iconSvgPath) {
          weaponIcon = (
            <img
              src={ITEMS_DATA[weaponType].iconSvgPath}
              alt={ITEMS_DATA[weaponType].name}
              style={{ width: 18, height: 18, marginRight: 5, verticalAlign: 'middle' }}
            />
          );
        }
        // Adicionar mais ícones de armas aqui...
        message = (
          <>
            {attackerName} {weaponIcon} {targetName}!
          </>
        );
        icon = <IconSkull size="1.2rem" />; // Ícone para kill
    } else if (type === 'luckyStrike') {
        const { playerName, reward } = lastFeedEvent;
        title = 'Lucky Strike!';
        color = 'yellow'; // Cor para sorte
        message = (
          <>
            {playerName} minerou {reward} moedas!
          </>
        );
        icon = <IconStar size="1.2rem" />; // Ícone para lucky strike (Ex: estrela)
    } else if (type === 'bossMode') {
        const { byName, enabled } = lastFeedEvent;
        title = enabled ? 'Chefe de fase ligado ⚔️' : 'Chefe de fase desligado';
        color = enabled ? 'green' : 'blue';
        message = enabled
          ? <>{byName} ligou o chefe de fase: ele pode aparecer no consenso ou na divergência alta.</>
          : <>{byName} desligou o chefe de fase.</>;
        icon = <IconSwords size="1.2rem" />;
    } else if (type === 'bossSpawned') {
        title = 'O EPROC caiu na mesa!';
        color = 'red';
        message = <>{lastFeedEvent.motivo === 'consenso' ? 'Consenso' : 'Divergência'} demais travou o sistema. Derruba ele antes que ele caia sozinho!</>;
        icon = <img src="/images/game-objects/eproc.svg" alt="" style={{ width: 22, height: 22 }} />;
    } else if (type === 'bossDefeated') {
        const { mvpName, mvpDano, lastHitName, recompensas = [] } = lastFeedEvent;
        title = 'EPROC derrubado! 🏆';
        color = 'green';
        message = (
          <>
            MVP: <b>{mvpName}</b> ({mvpDano} de dano) · último golpe: <b>{lastHitName}</b>
            <br />
            {recompensas.map(r => `${r.nome} +${r.moedas}`).join(' · ')}
          </>
        );
        icon = <img src="/images/game-objects/eproc.svg" alt="" style={{ width: 22, height: 22 }} />;
    } else if (type === 'bossCrashed') {
        title = 'O EPROC caiu sozinho 💤';
        color = 'blue';
        message = <>Como sempre. Ninguém ganhou moeda, só sobrou 1 item na mesa.</>;
        icon = <img src="/images/game-objects/eproc.svg" alt="" style={{ width: 22, height: 22 }} />;
    } else if (type === 'dropPicked') {
        const { pickerName, ownerName, itemId, quantidade, moedas } = lastFeedEvent;
        const item = ITEMS_DATA[itemId];
        if (item) {
          const deQuem = pickerName === ownerName ? 'que tinha deixado cair' : `de ${ownerName}`;
          title = 'Achado não é roubado!';
          color = 'green';
          const nomeItem = <b>{quantidade > 1 ? `${quantidade}x ` : ''}{item.name}</b>;
          message = quantidade > 0
            ? <>{pickerName} embolsou {nomeItem} {deQuem}{moedas > 0 ? ` (+${moedas} moedas do que não cabia)` : ''}</>
            : <>{pickerName} pegou <b>{item.name}</b> {deQuem}, mas já tinha: vendeu por {moedas} moedas</>;
          icon = item.iconSvgPath
            ? <img src={item.iconSvgPath} alt="" style={{ width: 20, height: 20 }} />
            : <IconShoppingCart size="1.2rem" />;
        }
    } else if (type === 'spoiledFood') {
        const { playerName } = lastFeedEvent;
        title = 'Maionese estragada! 🤢';
        color = 'green';
        message = <>{playerName} comeu um xis com maionese estragada e tá passando mal!</>;
        icon = <img src="/images/game-objects/xis.svg" alt="" style={{ width: 20, height: 20 }} />;
    } else if (type === 'minerDestroyed') {
        const { attackerName, ownerName } = lastFeedEvent;
        title = 'Minerador quebrado!';
        color = 'red';
        message = <>{attackerName} quebrou o minerador de {ownerName} ⛏️💥</>;
        icon = <IconSkull size="1.2rem" />;
    } else if (type === 'purchase') {
        const { playerName, itemId, quantidade } = lastFeedEvent;
        const item = ITEMS_DATA[itemId];
        if (item) {
          title = 'Compra na lojinha!';
          color = 'green';
          message = (
            <>
              {playerName} comprou{' '}
              {item.iconSvgPath && (
                <img src={item.iconSvgPath} alt="" style={{ width: 18, height: 18, verticalAlign: 'middle', margin: '0 3px' }} />
              )}
              <b>{quantidade > 1 ? `${quantidade}x ` : ''}{item.name}</b>
            </>
          );
          icon = <IconShoppingCart size="1.2rem" />;
        }
    }
    // Adicionar mais tipos de evento aqui (ex: 'itemBought', 'levelUp', etc.)

    // Retorna null se não for um tipo conhecido ou não tiver mensagem
    if (!message) return null;

    return {
      type,
      eventId, // Passa o eventId para a key
      timestamp,
      title,
      message, // Corpo da mensagem já formatado com JSX
      icon, // Ícone JSX
      color // Cor da notificação
    };
  }, [lastFeedEvent]);
  // -----------------------------------------------------

  const telaEstreita = useMediaQuery('(max-width: 48em)');

  const handleNovaRodadaComAnimacao = () => {
    console.log("PULSE: Nova Rodada");
    triggerPulse();
    handleNovaRodada(); 
  };

  const botaoNovaRodada = (
    <Button color="blue" size="sm" onClick={handleNovaRodadaComAnimacao} className="nova-rodada-transition">
      Nova Rodada
    </Button>
  );

  const toggleModoObservadorComAnimacao = () => {
    console.log("PULSE: Toggle Modo Observador");
    triggerPulse();
    originalToggleModoObservador();
  };

  const handleFlashEnabledChange = (isEnabled) => {
    console.log("SalaConteudo: Recebeu mudança na configuração de piscada:", isEnabled);
    setIsFlashEffectEnabled(isEnabled);
  };

  // NOVA FUNÇÃO para emitir evento para o servidor
  const handleToggleEquipAccessory = useCallback((itemId) => {
    if (!socket) {
      console.error("Socket não conectado, não é possível equipar/desequipar.");
      return;
    }
    if (!itemId) {
        console.warn("Tentativa de equipar/desequipar item nulo.");
        // Se clicar no selecionado, o InventoryDisplay deve passar null?
        // A lógica atual no servidor trata isso: se equipar null ou item diferente, equipa o novo.
        // Se equipar o mesmo, desequipa. Mas o clique deve sempre mandar o itemId.
        // Ajustaremos o InventoryDisplay para sempre enviar o itemId.
        return;
    }
    
    console.log(`[UI] Emitindo toggleEquipAccessory: { itemId: ${itemId} }`);
    // Zíper subindo (equipar) ou descendo (tirar)
    AnimationService.sfx(currentUser?.equippedAccessories?.includes(itemId) ? 'desequipar' : 'acessorio');
    socket.emit('toggleEquipAccessory', { 
      codigo: codigoSala,
      itemId: itemId
    });
  }, [socket, codigoSala, currentUser?.equippedAccessories]);

  // Trocar a arma ativa
  const handleSelectWeapon = useCallback((weaponId) => {
    AnimationService.sfx('arma');
    socket?.emit('selectWeapon', { codigo: codigoSala, weaponId });
  }, [socket, codigoSala]);

  // Usar consumível (ex.: comer um xis)
  const handleUseItem = useCallback((itemId) => {
    socket?.emit('useItem', { codigo: codigoSala, itemId });
  }, [socket, codigoSala]);

  // Escolher o contra-ataque ativo (só um por vez)
  const handleSelectCounter = useCallback((itemId) => {
    AnimationService.sfx('troca');
    socket?.emit('selectCounter', { codigo: codigoSala, itemId });
  }, [socket, codigoSala]);

  // Fazer carga no cartório (recarregar arma com munição)
  const handleReloadWeapon = useCallback((weaponId) => {
    socket?.emit('reloadWeapon', { codigo: codigoSala, weaponId });
  }, [socket, codigoSala]);

  // --- Função para lidar com a compra de itens ---
  const handleBuyItem = useCallback((itemId, itemPrice) => {
    if (!socket) {
      console.error("Socket não conectado, não é possível comprar.");
      return;
    }
    if (!currentUser || !currentUser.id) {
      console.error("Usuário atual não encontrado, não é possível comprar.");
      return;
    }
    console.log(`[UI] Emitindo evento buyItem: { userId: ${currentUser.id}, itemId: ${itemId}, itemPrice: ${itemPrice} }`);
    socket.emit('buyItem', { 
      codigo: codigoSala, // Lembre-se de usar 'codigo'
      itemId: itemId,      // ID do item
      itemPrice: itemPrice // Preço (para validação no backend)
    });
    // Idealmente, fechar o drawer ou dar um feedback visual aqui
    // closeShop(); // Opcional: fechar a loja após tentar comprar
  }, [socket, codigoSala, currentUser?.id]); // Incluir currentUser.id nas dependências
  // ----------------------------------------------

  // NOVO useEffect para reagir à mudança no lastDamageInfoForAnimation e mostrar o número
  useEffect(() => {
    if (!lastDamageInfoForAnimation) return;

    const { targetId, damage, isCritical, isDodge, isCorpseHit, isPoison } = lastDamageInfoForAnimation;

    // Cutucão em defunto: sem número de dano (a piscada/tremida já acontecem por outros caminhos)
    if (isCorpseHit) return;

    const targetElement = document.querySelector(`.carta-participante[data-user-id="${targetId}"]`);

    // *** CONDIÇÃO AJUSTADA PARA INCLUIR DANO ZERO ***
    let shouldShowAnimation = false;
    // Mostrar animação se: Dano > 0 OU Crítico OU Esquiva OU Dano == 0 (e não crítico/esquiva)
    if (isCritical) {
        shouldShowAnimation = true;
    } else if (isDodge) {
        shouldShowAnimation = true;
    } else if (damage >= 0) { // <<< Inclui dano 0 aqui
        shouldShowAnimation = true;
    } 

    // Enjoo da maionese: número verde, todo mundo vê
    if (targetElement && isPoison) {
      AnimationService.showFloatingText(targetElement, `-${damage} 🤢`, 'damage-poison', 900);
      return;
    }

    if (targetElement && shouldShowAnimation) {
      AnimationService.showDamageNumber(targetElement, damage, isCritical, isDodge);
    } else if (targetElement) {
    } else {
      console.warn(`[Cliente/Animation] Avatar para targetId=${targetId} não encontrado.`);
    }

  }, [lastDamageInfoForAnimation]);

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
          
          <Group justify="flex-start" align="center" mb="md" gap="xs" style={{ position: 'relative' }}>
            <Title order={1}>Sala {codigoSala}</Title>
            <CopyButton value={salaURL}>
              {({ copied, copy }) => (
                <Tooltip 
                  label={<Text size="xs">{copied ? 'Link copiado!' : 'Copiar link da sala'}</Text>}
                  position="bottom"
                  withArrow
                >
                  <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            
            {/* --- Modo Observador (destacado quando ligado) --- */}
            <Tooltip
              label={modoObservador ? 'Sair do modo observador (voltar a votar)' : 'Modo observador (só assistir, sem votar)'}
              position="bottom"
              withArrow
            >
              <ActionIcon
                variant={modoObservador ? 'light' : 'default'}
                color="blue"
                onClick={toggleModoObservadorComAnimacao}
                aria-label={modoObservador ? 'Sair do modo observador' : 'Modo observador'}
              >
                {modoObservador ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </ActionIcon>
            </Tooltip>

            {/* ✅ Indicador de Status de Conexão */}
            <ConnectionIndicator isActive={isActive} onForcePing={forcePing} />
            {/* Nova Rodada centralizada na linha do topo (só aparece depois de revelar os votos) */}
            {!telaEstreita && (
              <Box
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  visibility: revelarVotos ? 'visible' : 'hidden',
                  zIndex: 1,
                }}
              >
                {botaoNovaRodada}
              </Box>
            )}

            {/* Controles à direita (Placar Pessoal + Configurações) */}
            <Group ml="auto" spacing="xs" align="center" wrap="nowrap">
              {/* --- Botão da Loja --- */}
              <ActionIcon variant="default" size="lg" title="Abrir Loja" onClick={openShop}>
                <IconShoppingCart size="1.1rem" />
              </ActionIcon>
              {/* ------------------- */}

              {/* --- Placar Pessoal: Kills --- */} 
              <Badge 
                size="lg" 
                variant="light" // Usar light para consistência?
                color="red" 
                radius="sm"
                leftSection={<IconSkull size={14} />}
              >
                {currentUserKills}
              </Badge>
              {/* -------------------------- */}

              {/* --- Placar Pessoal: Pontos --- */} 
              <Badge 
                size="lg" 
                variant="light" 
                color="yellow" 
                radius="sm"
                leftSection={<IconCoin size={14} />}
              >
                {currentUserScore}
              </Badge>
              {/* -------------------------- */}

              <GameController 
                socket={socket}
                codigoSala={codigoSala}
                currentUser={currentUser} 
                armaSelecionada={armaSelecionada}
                onFlashEnabledChange={handleFlashEnabledChange}
              />
            </Group>
          </Group>

          {/* Celular: Nova Rodada fica numa linha própria (no topo não cabe) */}
          {telaEstreita && (
            <Box mb={0} style={{ display: 'flex', justifyContent: 'center', visibility: revelarVotos ? 'visible' : 'hidden' }}>
              {botaoNovaRodada}
            </Box>
          )}

          <Paper 
            shadow="sm" 
            px="md" py="xs"
            mb="lg"
            style={pulseAnimation}
            className="nova-rodada-transition"
          >
            <Mesa 
              participantes={participantes}
              revelarVotos={revelarVotos}
              currentUser={currentUser}
              socket={socket}
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
              currentUser={currentUser}
              onToggleEquip={handleToggleEquipAccessory}
              onSelectWeapon={handleSelectWeapon}
              onUseItem={handleUseItem}
              onReloadWeapon={handleReloadWeapon}
              onSelectCounter={handleSelectCounter}
              style={{
                opacity: entradaAnimada ? 1 : 0,
                transform: entradaAnimada ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                transitionDelay: '0.2s'
              }}
            />
          )}
        </Container>

        {/* Overlay da Piscada (agora vermelho) */}
        {isFlashing && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 0, 0, 0.5)', // << Mudar para vermelho
            zIndex: 1001, // Pode manter ou ajustar se necessário
            pointerEvents: 'none',
          }} />
        )}

        {/* --- Renderiza o componente KillFeedDisplay --- */}
        <KillFeedDisplay lastFeedEvent={formattedLastFeedEvent} />
        {/* --- FIM KillFeedDisplay --- */}

        {/* Renderizar o Drawer da Loja, passando currentUser e onBuyItem */}
        <ShopDrawer 
          opened={shopOpened} 
          onClose={closeShop} 
          currentUserScore={currentUserScore}
          currentUserInventory={currentUser.inventory || []}
          currentUser={currentUser}
          onBuyItem={handleBuyItem} 
        />

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