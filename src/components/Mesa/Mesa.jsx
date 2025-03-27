import { Box, Paper, Group, Stack, Text, Flex, Badge, Title, Button } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import CartaParticipante from '../Carta/Participante';

export default function Mesa({ 
  participantes = [], 
  revelarVotos = false,
  onRevelarVotos = () => {}, // Nova prop para receber a função de revelar votos
}) {
  // Distribui os participantes acima e abaixo da mesa, horizontalmente
  const posicionarParticipantes = () => {
    // Determina número de participantes
    const numParticipantes = participantes.length;
    
    // Divide os participantes entre as partes superior e inferior
    const meio = Math.ceil(numParticipantes / 2);
    
    // Faz a distribuição nas partes superior e inferior apenas
    return {
      superior: participantes.slice(0, meio),
      inferior: participantes.slice(meio),
      esquerdo: [],
      direito: []
    };
  };
  
  // Cálculo das estatísticas
  const calcularEstatisticas = () => {
    // Contagem dos votos
    const votosContagem = {};
    participantes.forEach(p => {
      if (p.valorVotado) {
        votosContagem[p.valorVotado] = (votosContagem[p.valorVotado] || 0) + 1;
      }
    });
    
    // Moda (valor mais votado)
    const votosMaisComuns = Object.entries(votosContagem)
      .sort((a, b) => b[1] - a[1]);
    const moda = votosMaisComuns.length > 0 ? votosMaisComuns[0][0] : 'N/A';
    
    // Média (excluindo os votos '?')
    const votosNumericos = participantes
      .filter(p => p.valorVotado && p.valorVotado !== '?')
      .map(p => parseInt(p.valorVotado, 10));
    
    const media = votosNumericos.length > 0 
      ? (votosNumericos.reduce((sum, val) => sum + val, 0) / votosNumericos.length).toFixed(1)
      : 'N/A';
    
    // Diversidade de votos
    const diversidade = Object.keys(votosContagem).length;
    
    // Consenso (mais de 70% dos votos são iguais)
    const totalVotos = participantes.filter(p => p.jaVotou).length;
    const consenso = votosMaisComuns.length > 0 && 
      (votosMaisComuns[0][1] / totalVotos) > 0.7;
    
    return {
      moda,
      media,
      consenso,
      diversidade,
      totalVotos,
      votosMaisComuns
    };
  };
  
  // Cálculo do tamanho da mesa baseado no número de participantes
  const calcularTamanhoMesa = () => {
    // Ajusta a largura baseada no número de participantes
    // Mais participantes = mesa mais larga
    const numParticipantes = participantes.length;
    const larguraMin = 55;
    const larguraMax = 85;
    
    // Aumenta a largura com base no número de participantes
    const ajusteLargura = Math.min(numParticipantes * 1.5, 25);
    const larguraCalculada = Math.min(Math.max(larguraMin, larguraMin + ajusteLargura), larguraMax);
    
    return {
      largura: `${larguraCalculada}%`,
      altura: 'clamp(150px, 45%, 50%)' // Altura relativa com mínimo adequado
    };
  };
  
  const lados = posicionarParticipantes();
  const estatisticas = calcularEstatisticas();
  const tamanhoMesa = calcularTamanhoMesa();
  
  // Verificar se existe um moderador entre os participantes
  const moderador = participantes.find(p => p.isModerador);
  
  // Verificar quantos participantes já votaram
  const votosRealizados = participantes.filter(p => p.jaVotou).length;
  const totalParticipantes = participantes.length;
  const todosVotaram = votosRealizados === totalParticipantes && totalParticipantes > 0;
  
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        radius="md"
        p={10}
        withBorder
        bg="#e7f5ff"
        style={{
          width: '100%',
          maxWidth: '90vw',
          height: '45vh',
          minHeight: '380px',
          maxHeight: '45vh',
          position: 'relative',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto' // Centralizar horizontalmente
        }}
      >
        {/* Layout com posições absolutas */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Mesa */}
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: tamanhoMesa.largura,
              height: 'clamp(150px, 45%, 50%)',
              minHeight: '150px',
              backgroundColor: '#1c7ed6',
              borderRadius: 8,
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 10,
              zIndex: 1
            }}
          >
            {/* Conteúdo da mesa sempre com a mesma altura */}
            <Flex direction="column" align="center" justify="center" style={{ width: '100%', height: '100%' }}>
              {!revelarVotos ? (
                /* Área vazia quando não está revelando votos */
                <div></div>
              ) : (
                /* Conteúdo dos resultados */
                <>
                  <Text c="white" fw={700} size="md" mb={3}>Resultados</Text>
                  
                  {/* Distribuição de votos */}
                  <Flex gap={5} mb={5} wrap="wrap" justify="center">
                    {['1', '2', '3', '4', '5', '?'].map(valor => {
                      const votantes = participantes.filter(p => p.valorVotado === valor);
                      const quantidade = votantes.length;
                      
                      return (
                        <Paper 
                          key={valor} 
                          withBorder 
                          p={3}
                          radius="sm"
                          style={{
                            width: 30,
                            height: 40,
                            textAlign: 'center',
                            backgroundColor: quantidade > 0 ? '#e7f5ff' : 'rgba(255, 255, 255, 0.8)',
                            borderColor: quantidade > 0 ? '#228be6' : undefined,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text fw={700} size="sm" style={{ fontSize: '0.85rem' }}>{valor}</Text>
                          <Text size="xs" c={quantidade > 0 ? 'blue' : 'dimmed'} fw={quantidade > 0 ? 700 : 400}>
                            {quantidade}
                          </Text>
                        </Paper>
                      );
                    })}
                  </Flex>
                  
                  <Flex gap="xs" mb={3} wrap="wrap" justify="center">
                    <Paper p={5} radius="md" style={{ textAlign: 'center', minWidth: 70 }}>
                      <Text fw={500} size="xs" style={{ fontSize: '0.75rem' }}>Moda</Text>
                      <Text fw={700} size="md">{estatisticas.moda}</Text>
                    </Paper>
                    
                    <Paper p={5} radius="md" style={{ textAlign: 'center', minWidth: 70 }}>
                      <Text fw={500} size="xs" style={{ fontSize: '0.75rem' }}>Média</Text>
                      <Text fw={700} size="md">{estatisticas.media}</Text>
                    </Paper>
                  </Flex>
                  
                  {estatisticas.consenso ? (
                    <Badge size="sm" color="green" variant="filled">Consenso</Badge>
                  ) : estatisticas.diversidade >= 3 ? (
                    <Badge size="sm" color="red" variant="filled">Alta Divergência</Badge>
                  ) : (
                    <Badge size="sm" color="yellow" variant="filled">Divergência Moderada</Badge>
                  )}
                </>
              )}
            </Flex>
          </Box>
          
          {/* Botão de revelar votos como elemento independente sobreposto à mesa */}
          {!revelarVotos && moderador && votosRealizados > 0 && (
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
                pointerEvents: 'auto'
              }}
            >
              <Button 
                color="green" 
                size="sm"
                leftSection={<IconCheck size={16} />}
                onClick={onRevelarVotos}
              >
                Revelar Votos
              </Button>
            </Box>
          )}
          
          {/* Participantes - Parte superior */}
          <div
            style={{ 
              position: 'absolute',
              top: 10,
              left: '5%',
              right: '5%',
              width: '90%',
              display: 'flex',
              justifyContent: 'space-evenly',
              flexWrap: 'wrap',
              gap: 'clamp(15px, 3vw, 30px)',
              padding: '0 25px',
              zIndex: 10
            }}
          >
            {lados.superior.map((participante, idx) => (
              <CartaParticipante
                key={`top-${idx}`}
                nome={participante.nome}
                jaVotou={participante.jaVotou}
                valorVotado={participante.valorVotado}
                revelarVotos={revelarVotos}
                isModerador={participante.isModerador}
                isObservador={participante.isObservador}
              />
            ))}
          </div>
          
          {/* Participantes - Parte inferior */}
          <div
            style={{ 
              position: 'absolute',
              bottom: 10,
              left: '5%',
              right: '5%',
              width: '90%',
              display: 'flex',
              justifyContent: 'space-evenly',
              flexWrap: 'wrap',
              gap: 'clamp(15px, 3vw, 30px)',
              padding: '0 25px',
              zIndex: 10
            }}
          >
            {lados.inferior.map((participante, idx) => (
              <CartaParticipante
                key={`bottom-${idx}`}
                nome={participante.nome}
                jaVotou={participante.jaVotou}
                valorVotado={participante.valorVotado}
                revelarVotos={revelarVotos}
                isModerador={participante.isModerador}
                isObservador={participante.isObservador}
              />
            ))}
          </div>
        </div>
      </Paper>
    </div>
  );
}
