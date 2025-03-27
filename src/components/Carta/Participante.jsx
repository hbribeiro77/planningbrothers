import { Paper, Text, Badge } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';

export default function CartaParticipante({ 
  nome, 
  jaVotou = false, 
  valorVotado = null, 
  revelarVotos = false,
  isModerador = false,
  isObservador = false
}) {
  return (
    <Paper
      shadow="sm"
      p="xs"
      radius="md"
      withBorder
      style={{
        width: 'clamp(45px, 3.5vw, 60px)',
        height: 'clamp(68px, 5vw, 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: isObservador ? '#f0ffee' : (jaVotou ? '#e7f5ff' : 'white'),
        borderColor: isObservador ? '#20c997' : (jaVotou ? '#228be6' : undefined),
        transition: 'all 0.3s ease',
        opacity: isObservador ? 0.85 : 1,
      }}
    >
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
        <Text fw={700} size="md" c="#228be6">
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
        <IconEye size={16} color="#20c997" style={{ opacity: 0.7 }} />
      )}
    </Paper>
  );
} 