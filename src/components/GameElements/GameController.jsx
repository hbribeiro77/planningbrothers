import { useState, useEffect, useRef } from 'react';
import { Switch, Tooltip, ActionIcon, Drawer, Stack, Text, Group, TextInput, Button, SimpleGrid, Slider, ScrollArea } from '@mantine/core';
import { IconSettings, IconKeyboard, IconVolume, IconVolumeOff, IconBellRinging, IconMessageChatbot } from '@tabler/icons-react';
import { KeyboardThrower } from './KeyboardThrower';
import { usePvpStatus } from '@/contexts/PvpContext';
import { ITEMS_DATA, BITCOIN_MINER_ID } from '@/constants/itemsData.js';
import { GAME_CONFIG } from '@/constants/gameConfig.js';

const MAX_KILL_MESSAGE_LENGTH = 50;
const MAX_SIGNATURES = 3;

// Array com placeholders sugeridos para as assinaturas
const signaturePlaceholders = [
  'Eliminação!', // Usando o padrão como sugestão 1
  'Até a próxima!', // Sugestão 2
  'GG!' // Sugestão 3 (Good Game)
];

export function GameController({ 
  socket,
  codigoSala,
  currentUser,
  armaSelecionada,
  onFlashEnabledChange
}) {
  const { pvpStatus, togglePvpStatus } = usePvpStatus();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(GAME_CONFIG.SOUND.DEFAULT_VOLUME);
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [signatures, setSignatures] = useState(Array(MAX_SIGNATURES).fill(''));
  const [originalSignatures, setOriginalSignatures] = useState(Array(MAX_SIGNATURES).fill(''));
  const isModerator = currentUser?.isModerator;

  useEffect(() => {
    const currentSignatures = currentUser?.customKillSignatures;
    let initialSignatures;
    let sendInitialPlaceholders = false;
    
    if (Array.isArray(currentSignatures) && currentSignatures.length > 0) {
      console.log("[GameController] Usando assinaturas salvas:", currentSignatures);
      initialSignatures = Array(MAX_SIGNATURES).fill('').map((_, index) => 
        currentSignatures[index] || ''
      );
    } else {
      console.log("[GameController] Usando placeholders como valor inicial.");
      initialSignatures = [...signaturePlaceholders];
      while (initialSignatures.length < MAX_SIGNATURES) {
        initialSignatures.push('');
      }
      initialSignatures = initialSignatures.slice(0, MAX_SIGNATURES);
      sendInitialPlaceholders = true;
    }
    
    setSignatures(initialSignatures);
    setOriginalSignatures(initialSignatures);
    
    if (sendInitialPlaceholders && socket) {
        const placeholdersToSend = initialSignatures
            .map(sig => (sig || "").trim().slice(0, MAX_KILL_MESSAGE_LENGTH))
            .filter(sig => sig !== "");
            
        console.log(`[GameController] Enviando placeholders iniciais para o servidor:`, placeholdersToSend);
        socket.emit('setCustomKillSignatures', { 
            codigo: codigoSala,
            signatures: placeholdersToSend 
        });
    }
    
  }, [currentUser?.customKillSignatures, socket, codigoSala]);

  useEffect(() => {
    if (onFlashEnabledChange) {
      onFlashEnabledChange(flashEnabled);
    }
  }, [flashEnabled, onFlashEnabledChange]);

  const handleToggleSound = (event) => {
    const isEnabled = event.currentTarget.checked;
    console.log(`[GameController] handleToggleSound: Setting soundEnabled to ${isEnabled}`);
    setSoundEnabled(isEnabled);
    if (isEnabled && volumeLevel === 0) {
      setVolumeLevel(GAME_CONFIG.SOUND.DEFAULT_VOLUME);
    }
  };

  const handleVolumeChange = (value) => {
    setVolumeLevel(value);
    if (value > 0 && !soundEnabled) {
      setSoundEnabled(true);
    }
    if (value === 0 && soundEnabled) {
      setSoundEnabled(false);
    }
  };

  const handleToggleFlash = (event) => {
    const isEnabled = event.currentTarget.checked;
    setFlashEnabled(isEnabled);
  };

  const handleSignatureChange = (index, value) => {
    const newSignatures = [...signatures];
    newSignatures[index] = value;
    setSignatures(newSignatures);
  };

  const handleDrawerClose = () => {
    setDrawerOpened(false);
    
    const signaturesToSend = signatures
      .map(sig => (sig || "").trim().slice(0, MAX_KILL_MESSAGE_LENGTH))
      .filter(sig => sig !== "");
      
    const originalToSend = originalSignatures
      .map(sig => (sig || "").trim().slice(0, MAX_KILL_MESSAGE_LENGTH))
      .filter(sig => sig !== "");
      
    const hasChanged = JSON.stringify(signaturesToSend) !== JSON.stringify(originalToSend);

    if (hasChanged) {
      if (socket) {
        console.log(`[GameController] Emitindo setCustomKillSignatures:`, signaturesToSend);
        socket.emit('setCustomKillSignatures', { 
          codigo: codigoSala,
          signatures: signaturesToSend
        });
        setOriginalSignatures(signatures.map(s => s.trim().slice(0, MAX_KILL_MESSAGE_LENGTH)));
      } else {
        console.error("Socket não está conectado para enviar assinaturas customizadas.");
      }
    } else {
      console.log("[GameController] Nenhuma mudança nas assinaturas detectada.");
    }
  };
  
  const effectiveVolume = soundEnabled ? volumeLevel : 0;
  console.log(`[GameController] Render: soundEnabled=${soundEnabled}, volumeLevel=${volumeLevel}, effectiveVolume=${effectiveVolume}`);

  // <<< INÍCIO: LÓGICA DO MINERADOR DE BITCOIN >>>
  useEffect(() => {
    let intervalId = null;

    const startMinerInterval = () => {
      // Verifica se currentUser, equippedAccessories e o socket existem e estão conectados
      if (!currentUser || !currentUser.equippedAccessories || !socket || !socket.connected) {
        // console.log('[Minerador] Condições não atendidas para iniciar (usuário, acessórios equipados ou socket).');
        return; // Não inicia se faltar algo
      }

      // Verifica se o minerador está na lista de acessórios equipados
      const hasMiner = currentUser.equippedAccessories.includes(BITCOIN_MINER_ID);
      // console.log(`[Minerador] Usuário ${currentUser.id} tem minerador equipado? ${hasMiner}`);

      if (hasMiner) {
        const minerData = ITEMS_DATA[BITCOIN_MINER_ID];
        const intervalMs = minerData?.intervaloGeracaoMs || 10000; // Padrão de 10s
        const pontos = minerData?.pontosPorIntervalo || 1; // Padrão de 1 ponto

        console.log(`[Minerador] Iniciando intervalo para ${currentUser.id} a cada ${intervalMs}ms para gerar ${pontos} ponto(s).`);

        intervalId = setInterval(() => {
          console.log(`[Minerador] Emitindo generate_passive_income para ${currentUser.id}`);
          // Envia evento para o servidor gerar os pontos
          socket.emit('generate_passive_income', {
            userId: currentUser.id,
            codigoSala: codigoSala
          });
        }, intervalMs);

      } else {
         // console.log(`[Minerador] Usuário ${currentUser.id} não tem o minerador equipado.`);
         // Limpa o intervalo se o minerador foi desequipado
         if (intervalId) {
            console.log(`[Minerador] Limpando intervalo ${intervalId} porque o minerador foi desequipado.`);
            clearInterval(intervalId);
            intervalId = null;
         }
      }
    };

    // Limpa o intervalo anterior ao iniciar um novo ciclo do useEffect
    if (intervalId) {
      console.log(`[Minerador] Limpando intervalo ${intervalId} antes de reavaliar.`);
      clearInterval(intervalId);
      intervalId = null;
    }

    // Inicia a verificação e o intervalo, se aplicável
    startMinerInterval();

    // Função de limpeza: Limpa o intervalo quando o componente desmonta ou as dependências mudam
    return () => {
      if (intervalId) {
        console.log(`[Minerador] Limpando intervalo ${intervalId} na desmontagem/atualização.`);
        clearInterval(intervalId);
        intervalId = null; // Garante que o ID seja zerado
      }
    };

    // Dependências: Reavalia quando o usuário (e seus acessórios equipados) ou o socket mudam.
  }, [currentUser, socket, codigoSala]);
  // <<< FIM: LÓGICA DO MINERADOR DE BITCOIN >>>

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <Tooltip label="Configurações do jogo">
        <ActionIcon 
          variant="light" 
          color="blue" 
          onClick={() => setDrawerOpened(true)}
        >
          <IconSettings size={16} />
        </ActionIcon>
      </Tooltip>
      
      <KeyboardThrower
        enabled={pvpStatus} 
        socket={socket}
        codigoSala={codigoSala}
        currentUser={currentUser}
        volume={effectiveVolume}
      />

      <Drawer
        opened={drawerOpened}
        onClose={handleDrawerClose}
        title="Configurações do Jogo"
        position="right"
        size="sm"
        styles={{ body: { height: 'calc(100% - 60px)', overflow: 'hidden' } }}
      >
        <ScrollArea h="100%" scrollbarSize={0}>
          <Stack>
            <Text size="sm" c="dimmed">
              Ajuste as configurações do jogo
            </Text>

            <Group position="apart" mt="md">
              <Text size="sm" c="dimmed">
                <IconKeyboard size={16} style={{ marginRight: 4 }} />
                Modo PVP
              </Text>
              <Switch
                size="sm"
                checked={pvpStatus} 
                onChange={(event) => togglePvpStatus(event.currentTarget.checked)}
              />
            </Group>

            <Group position="apart" mt="md">
              <Text size="sm" c="dimmed">
                {soundEnabled ? <IconVolume size={16} style={{ marginRight: 4 }} /> : <IconVolumeOff size={16} style={{ marginRight: 4 }} />}
                Som (Mute)
              </Text>
              <Switch
                size="sm"
                checked={soundEnabled}
                onChange={handleToggleSound}
              />
            </Group>

            <Slider
              mt={5}
              label={(value) => `${Math.round(value * 100)}%`}
              step={0.01}
              min={0}
              max={1}
              value={volumeLevel}
              onChange={handleVolumeChange}
              marks={[
                   { value: 0, label: 'Mudo' },
                   { value: 0.5, label: '50%' },
                   { value: 1, label: '100%' },
               ]}
              thumbChildren={soundEnabled ? <IconVolume size={12} /> : <IconVolumeOff size={12}/>}
              color={soundEnabled ? "blue" : "gray"} 
              style={{ width: '90%', margin: 'auto' }}
            />

            <Group position="apart" mt="md">
              <Text size="sm" c="dimmed">
                <IconBellRinging size={16} style={{ marginRight: 4 }} /> 
                Piscada ao Sofrer Dano (Morto)
              </Text>
              <Switch
                size="sm"
                checked={flashEnabled}
                onChange={handleToggleFlash}
              />
            </Group>

            <Text size="sm" fw={500} mt="lg">Assinaturas de Eliminação</Text>
            <Text size="xs" c="dimmed" mb="xs">
              Mensagens aleatórias que aparecem quando você elimina alguém. (Máx: {MAX_KILL_MESSAGE_LENGTH} caracteres cada)
            </Text>
            {signatures.map((signature, index) => (
              <TextInput
                key={index}
                placeholder={signaturePlaceholders[index] || `Assinatura ${index + 1}`}
                leftIcon={<IconMessageChatbot size={16} />}
                value={signature}
                onChange={(event) => handleSignatureChange(index, event.currentTarget.value)}
                maxLength={MAX_KILL_MESSAGE_LENGTH}
              />
            ))}
          </Stack>
        </ScrollArea>
      </Drawer>
    </div>
  );
} 