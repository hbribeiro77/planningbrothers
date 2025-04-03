import { Group, Paper, Text, Box } from '@mantine/core';
import CartaVotacao from '../Carta/Votacao';
import { useState, useEffect } from 'react';
import { InventoryDisplay } from '../GameElements/InventoryDisplay';

export default function OpcoesVotacao({ 
  onVotar, 
  onCancelarVoto, 
  meuVoto = null
}) {
  const [valorSelecionado, setValorSelecionado] = useState(null);
  const opcoesDeVoto = ['1', '2', '3', '4', '5', '?'];
  
  // Atualiza o valor selecionado quando o voto mudar
  useEffect(() => {
    setValorSelecionado(meuVoto);
  }, [meuVoto]);
  
  const handleSelecao = (valor) => {
    // Se clicar na mesma carta que já está selecionada, cancela o voto
    if (valor === valorSelecionado) {
      setValorSelecionado(null);
      onCancelarVoto();
      return;
    }
    
    // Caso contrário, seleciona a nova carta e confirma o voto
    setValorSelecionado(valor);
    onVotar(valor);
  };
  
  return (
    <Paper withBorder p="md" radius="md" mt="xl">
      <Group 
        position="apart" 
        align="baseline" 
        spacing="lg"
        sx={(theme) => ({
          [`@media (max-width: ${theme.breakpoints.sm})`]: {
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xl,
          },
        })}
      >
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Text size="sm" weight={500} c="dimmed" ta="center" mb="xs">Sua Estimativa:</Text>
          <Group 
            position="center" 
            spacing="xs"
            sx={(theme) => ({
              [`@media (max-width: ${theme.breakpoints.sm})`]: {
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: `calc(${theme.spacing.xs} / 2)`,
                alignItems: 'center',
              },
            })}
          >
            {opcoesDeVoto.map((valor) => (
              <CartaVotacao
                key={valor}
                valor={valor}
                selecionada={valor === valorSelecionado}
                onClick={() => handleSelecao(valor)}
              />
            ))}
          </Group>
        </Box>

        <InventoryDisplay />
      </Group>
    </Paper>
  );
} 