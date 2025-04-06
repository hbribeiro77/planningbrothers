import { Paper, Text, Badge, useMantineTheme } from '@mantine/core';
import { IconEye, IconSkull } from '@tabler/icons-react';
import { LifeBar } from '../GameElements/LifeBar';
// import { ITEMS } from '@/constants/items'; // << Importar constantes (quando existirem)
const COLETE_DPE_ID = 'vest'; // << Usar ID constante (simulado por enquanto)

export default function CartaParticipante({ 
  participante,
  revelarVotos = false,
  showVest = false,
  // hasVest = false, // << Prop removida, verificaremos aqui
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
    inventory = []
  } = participante || {};

  // Não precisamos mais verificar o inventário aqui
  // const hasVest = inventory.includes(COLETE_DPE_ID);

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

      {/* Ícone do Colete (renderizado condicionalmente) */}
      {showVest && (
        <img 
          src="/images/game-objects/vest.svg"
          alt="Colete DPE"
          style={{
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140%',
            height: 'auto',
            opacity: 0.6,
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