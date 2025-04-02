import { Paper, Text, Badge, useMantineTheme } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { LifeBar } from '../GameElements/LifeBar';

export default function CartaParticipante({ 
  nome, 
  jaVotou = false, 
  valorVotado = null, 
  revelarVotos = false,
  isModerador = false,
  isObservador = false,
  id,
  life = 100,
  maxLife = 100
}) {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

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
      }}
    >
      {/* Barra de vida */}
      {!isObservador && <LifeBar currentLife={life} maxLife={maxLife} avatarId={id} />}

      {isModerador && (
        <Badge 
          size="xs" 
          color="blue" 
          radius="sm" 
          style={{ position: 'absolute', top: 2, right: 2 }}
        >
          M
        </Badge>
      )}
      
      {isObservador && (
        <Badge 
          size="xs" 
          color="teal" 
          radius="sm" 
          style={{ position: 'absolute', top: 2, left: 2 }}
          leftSection={<IconEye size={10} />}
        >
          O
        </Badge>
      )}
      
      <Text fw={500} ta="center" size="xs" style={{ marginBottom: 5, fontSize: '0.75rem' }}>
        {nome}
      </Text>
      
      {jaVotou && revelarVotos && !isObservador && (
        <Text fw={700} size="md" c={isDark ? 'blue.4' : 'blue'}>
          {valorVotado === "?" ? "?" : valorVotado}
        </Text>
      )}
      
      {jaVotou && !revelarVotos && !isObservador && (
        <Text size="xs" c="dimmed" style={{ fontSize: '0.75rem' }}>
          Votou
        </Text>
      )}
      
      {!jaVotou && !isObservador && (
        <Text size="xs" c="dimmed" style={{ fontSize: '0.75rem' }}>
          ...
        </Text>
      )}
      
      {isObservador && (
        <IconEye size={16} color={isDark ? '#2d5640' : '#20c997'} style={{ opacity: 0.7 }} />
      )}
    </Paper>
  );
} 