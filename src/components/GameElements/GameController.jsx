import { useState, useEffect, useRef } from 'react';
import { Switch, Tooltip, ActionIcon, Drawer, Stack, Text, Group, TextInput, Button, SimpleGrid } from '@mantine/core';
import { IconSettings, IconKeyboard, IconVolume, IconBellRinging, IconMessageChatbot } from '@tabler/icons-react';
import { KeyboardThrower } from './KeyboardThrower';
import { usePvpStatus } from '@/contexts/PvpContext';

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
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [keyboardKey, setKeyboardKey] = useState(0);
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
    setSoundEnabled(event.currentTarget.checked);
    setKeyboardKey(prev => prev + 1);
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
        key={keyboardKey}
        enabled={pvpStatus} 
        socket={socket}
        codigoSala={codigoSala}
        currentUser={currentUser}
        soundEnabled={soundEnabled}
      />

      <Drawer
        opened={drawerOpened}
        onClose={handleDrawerClose}
        title="Configurações do Jogo"
        position="right"
        size="sm"
      >
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
              <IconVolume size={16} style={{ marginRight: 4 }} />
              Som
            </Text>
            <Switch
              size="sm"
              checked={soundEnabled}
              onChange={handleToggleSound}
            />
          </Group>

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
      </Drawer>
    </div>
  );
} 