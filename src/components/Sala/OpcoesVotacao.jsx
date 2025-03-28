import { Group, Paper, Button } from '@mantine/core';
import CartaVotacao from '../Carta/Votacao';
import { useState, useEffect } from 'react';

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
    <Paper withBorder p="sm" radius="md">
      <Group position="center" spacing="xs">
        {opcoesDeVoto.map((valor) => (
          <CartaVotacao
            key={valor}
            valor={valor}
            selecionada={valor === valorSelecionado}
            onClick={() => handleSelecao(valor)}
          />
        ))}
      </Group>
    </Paper>
  );
} 