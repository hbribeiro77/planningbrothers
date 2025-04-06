import { Paper, Text, Badge, useMantineTheme } from '@mantine/core';
import { IconEye, IconSkull } from '@tabler/icons-react';
import { LifeBar } from '../GameElements/LifeBar';
// Importar constantes e o novo ícone
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA, isAccessory } from '@/constants/itemsData';
import VestIcon from '../Icons/VestIcon'; // << Importar novo componente

export default function CartaParticipante({ 
  participante,
  revelarVotos = false,
}) {
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
    equippedAccessory = null // << Obter estado equipado
  } = participante || {};

  // Obter dados do item equipado
  const equippedItemData = equippedAccessory ? ITEMS_DATA[equippedAccessory] : null;
  // Verifica se o item equipado é um acessório (para decidir se mostra o VestIcon)
  const showAccessory = equippedItemData && isAccessory(equippedAccessory);
  // Obter as cores do item equipado (ou defaults)
  const accessoryMainColor = showAccessory ? equippedItemData.mainColor : undefined;
  const accessoryDarkColor = showAccessory ? equippedItemData.darkColor : undefined;

  const isDead = life <= 0;

  return (
    <Paper
      shadow="sm"
      p="xs"
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
        justifyContent: 'center',
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
        overflow: 'hidden',
      }}
    >
      {!isObservador && <LifeBar currentLife={life} maxLife={maxLife} avatarId={id} />}

      {/* Ícone do Acessório Equipado (como componente React) */}
      {showAccessory && (
        <VestIcon 
          mainColor={accessoryMainColor}
          darkColor={accessoryDarkColor}
          style={{
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140%', // Manter tamanho ajustado
            height: 'auto',
            opacity: 0.8, // Manter opacidade
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {isModerador && (
        <Badge 
          size="xs" 
          color="blue" 
          radius="sm" 
          style={{ position: 'absolute', top: 2, right: 2, zIndex: 2 }}
        >
          M
        </Badge>
      )}
      
      {isObservador && (
        <Badge 
          size="xs" 
          color="teal" 
          radius="sm" 
          style={{ position: 'absolute', top: 2, left: 2, zIndex: 2 }}
          leftSection={<IconEye size={10} />}
        >
          O
        </Badge>
      )}
      
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
      
      <Text 
        fw={500} 
        ta="center" 
        size="xs" 
        style={{ 
          marginBottom: 5, 
          fontSize: '0.75rem',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {nome}
      </Text>
      
      {jaVotou && revelarVotos && !isObservador && (
        <Text fw={700} size="md" c={isDark ? 'blue.4' : 'blue'} style={{ position: 'relative', zIndex: 3 }}>
          {valorVotado === "?" ? "?" : valorVotado}
        </Text>
      )}
      
      {jaVotou && !revelarVotos && !isObservador && (
        <Text size="xs" c="dimmed" style={{ fontSize: '0.75rem', position: 'relative', zIndex: 3 }}>
          Votou
        </Text>
      )}
      
      {!jaVotou && !isObservador && (
        <Text size="xs" c="dimmed" style={{ fontSize: '0.75rem', position: 'relative', zIndex: 3 }}>
          ...
        </Text>
      )}
      
      {isObservador && (
        <IconEye size={16} color={isDark ? '#2d5640' : '#20c997'} style={{ opacity: 0.7, position: 'relative', zIndex: 3 }} />
      )}
    </Paper>
  );
} 