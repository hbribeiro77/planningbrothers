import { Paper, Text } from '@mantine/core';

export default function CartaVotacao({ valor, selecionada, onClick, disabled = false }) {
  return (
    <Paper
      shadow={selecionada ? "lg" : "sm"}
      p="xs"
      radius="md"
      withBorder
      style={{
        width: 50,
        height: 75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        backgroundColor: selecionada ? '#f0f9ff' : 'white',
        transform: selecionada ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s ease',
        borderColor: selecionada ? '#228be6' : undefined,
        borderWidth: selecionada ? 2 : 1,
        opacity: disabled && !selecionada ? 0.6 : 1,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <Text size={valor === '?' ? 22 : 26} fw={700} c={selecionada ? '#228be6' : 'inherit'}>
        {valor}
      </Text>
    </Paper>
  );
} 