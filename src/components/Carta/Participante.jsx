import React from 'react';
import { Paper, Text, Badge, useMantineTheme, Tooltip, Box } from '@mantine/core';
import { IconEye, IconSkull } from '@tabler/icons-react';
import { LifeBar } from '../GameElements/LifeBar'; // Manter importação
// Importar constantes e o novo ícone
import { ITEMS_DATA, KEYBOARD_ID } from '@/constants/itemsData';
// Importar o componente de ícone diretamente aqui
import VestIcon from '../Icons/VestIcon';

// Definir o mapeamento de componentes visuais aqui, onde ele é usado
const AVATAR_COMPONENTS = {
    VestIcon: VestIcon,
    // Adicionar outros mapeamentos se usar mais componentes visuais
};

// REMOVER esta função daqui
// function formatConsolidatedBonus(...) { ... }

export default function CartaParticipante({ 
  participante,
  revelarVotos = false,
}) {
  console.log(`[CartaParticipante] Recebeu participante ${participante?.nome}:`, participante);

  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  const {
    id,
    nome,
    jaVotou = false,
    valorVotado = null,
    isModerador = false,
    isObservador = false,
    life = 100,
    maxLife = 100,
    inventory = [],
    equippedAccessories = []
  } = participante || {};

  const isDead = life <= 0;

  return (
    <Paper
      shadow="sm"
      pb="xs"
      px="xs"
      pt={0}
      radius="md"
      withBorder
      className="carta-participante"
      data-id={id}
      data-user-id={id}
      data-votou={jaVotou}
      data-observador={isObservador}
      style={{
        width: 'clamp(45px, 3.5vw, 60px)',
        height: 'clamp(68px, 5vw, 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: isObservador 
          ? (isDark ? '#1f3b2c' : '#f0ffee')
          : (jaVotou 
              ? (isDark ? '#1c3f5f' : '#e7f5ff')
              : (isDark ? theme.colors.dark.card[0] : theme.white)),
        borderColor: isObservador 
          ? (isDark ? '#2d5640' : '#20c997')
          : (jaVotou 
              ? (isDark ? '#2b5580' : '#228be6')
              : undefined),
        transition: 'all 0.3s ease',
        opacity: isObservador ? 0.85 : 1,
        minHeight: 'clamp(68px, 5vw, 80px)',
        overflow: 'visible', // Necessário para a barra sair
        padding: 0,
      }}
    >
      {/* LifeBar renderizada aqui, mas estilizada em seu próprio componente */}
      {!isObservador && (
        <LifeBar 
          currentLife={life} 
          maxLife={maxLife} 
          avatarId={id} 
          // Remover estilo inline daqui, pois está no componente LifeBar
        />
      )}

      {/* Renderização dinâmica de MÚLTIPLOS acessórios (position: absolute) */}
      {equippedAccessories.map(accessoryId => {
        const itemData = ITEMS_DATA[accessoryId];
        const visualConfig = itemData?.avatarVisual;
        if (!visualConfig) return null; // Pula se não houver config visual
        
        // Retorna o elemento visual para este acessório
        return (
          <React.Fragment key={accessoryId}> {/* Usar Fragment com key */}
            {/* Caso 1: Componente React */} 
            {visualConfig.type === 'component' && visualConfig.componentName && AVATAR_COMPONENTS[visualConfig.componentName] && (
              React.createElement(AVATAR_COMPONENTS[visualConfig.componentName], {
                ...(visualConfig.props || {}),
                style: visualConfig.style 
              })
            )}

            {/* Caso 2: Imagem SVG */} 
            {visualConfig.type === 'svg' && visualConfig.path && (
              <img
                src={visualConfig.path}
                alt={itemData?.name || 'Acessório'}
                style={visualConfig.style}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Icone de Caveira (se morto - position: absolute) */}
      {isDead && (
        <IconSkull 
          size={14} 
          style={{
            position: 'absolute',
            bottom: 3,
            right: 3,
            color: theme.colors.red[7],
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))',
            zIndex: 2
          }}
        />
      )}
      
      {/* Voto / Status Votou / Observador - POSIÇÃO ABSOLUTA CENTRAL */}
      <Box 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 7,
          textAlign: 'center',
        }}
      >
        {jaVotou && revelarVotos && !isObservador && (
          <Text fw={700} size="lg" c={isDark ? 'blue.4' : 'blue'}>
            {valorVotado === "?" ? "?" : valorVotado}
          </Text>
        )}
        {jaVotou && !revelarVotos && !isObservador && (
          <Text size="xs" c="dimmed">
            Votou
          </Text>
        )}
        {!jaVotou && !isObservador && (
          <Text size="xs" c="dimmed">
            ...
          </Text>
        )}
        {isObservador && (
          <IconEye size={16} color={isDark ? '#2d5640' : '#20c997'} style={{ opacity: 0.7 }} />
        )}
      </Box>
    </Paper>
  );
} 