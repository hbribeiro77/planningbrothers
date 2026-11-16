import { Group, Paper, Text, Box } from '@mantine/core';
import CartaVotacao from '../Carta/Votacao';
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { InventoryDisplay } from '../GameElements/InventoryDisplay';

export default function OpcoesVotacao({ 
  onVotar, 
  onCancelarVoto, 
  meuVoto = null,
  currentUser,
  onToggleEquip,
  onSelectWeapon,
  onUseItem,
  onReloadWeapon,
  onSelectCounter
}) {
  const [valorSelecionado, setValorSelecionado] = useState(null);
  const isMobile = useMediaQuery('(max-width: 48em)');
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
      {/* Computador: cartas e inventário lado a lado. Celular: um embaixo do outro. */}
      <Group
        justify={isMobile ? 'center' : 'flex-start'}
        align="flex-start"
        gap="lg"
        wrap={isMobile ? 'wrap' : 'nowrap'}
      >
        <Box style={{ flex: isMobile ? '1 1 100%' : '0 0 auto', minWidth: 0 }}>
          <Text size="sm" fw={500} c="dimmed" ta="center" mb="xs">Sua Estimativa:</Text>
          <Group
            justify="center"
            gap="xs"
            wrap={isMobile ? 'nowrap' : 'wrap'}
            style={isMobile ? { overflowX: 'auto', paddingBottom: 4 } : undefined}
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

        {/* O inventário vem logo depois das cartas */}
        <Box style={{ flex: '0 1 auto', minWidth: 0, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <InventoryDisplay 
            currentUser={currentUser} 
            onToggleEquip={onToggleEquip}
            onSelectWeapon={onSelectWeapon}
            onUseItem={onUseItem}
            onReloadWeapon={onReloadWeapon}
            onSelectCounter={onSelectCounter}
          />
        </Box>
      </Group>
    </Paper>
  );
} 