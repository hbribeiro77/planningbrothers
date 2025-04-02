import { Box } from '@mantine/core';
import { useLifeBar } from '@/contexts/LifeBarContext';
import { GAME_CONFIG } from '@/constants/gameConfig';

export function LifeBar({ currentLife, maxLife, avatarId }) {
  const { showLifeBar, targetAvatarId } = useLifeBar();
  
  // Calcula a porcentagem de vida
  const lifePercentage = (currentLife / maxLife) * 100;
  
  // Determina a cor da barra de vida baseada na porcentagem
  let barColor;
  if (lifePercentage > 60) {
    barColor = '#4CAF50'; // Verde
  } else if (lifePercentage > 30) {
    barColor = '#FFC107'; // Amarelo
  } else if (lifePercentage > 15) {
    barColor = '#FF9800'; // Laranja
  } else {
    barColor = '#F44336'; // Vermelho
  }

  // Só mostra a barra se showLifeBar for true e o avatarId corresponder ao targetAvatarId
  const shouldShow = showLifeBar && avatarId === targetAvatarId;

  return (
    <Box
      style={{
        position: 'absolute',
        top: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '4px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '2px',
        overflow: 'hidden',
        opacity: shouldShow ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      <Box
        style={{
          width: `${lifePercentage}%`,
          height: '100%',
          backgroundColor: barColor,
          transition: 'width 0.3s ease, background-color 0.3s ease'
        }}
      />
    </Box>
  );
} 