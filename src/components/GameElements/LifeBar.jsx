import { Box, Progress } from '@mantine/core';
import { useLifeBar } from '@/contexts/LifeBarContext';
import { GAME_CONFIG } from '@/constants/gameConfig';

export function LifeBar({ 
  currentLife = GAME_CONFIG.LIFE.MAX, 
  maxLife = GAME_CONFIG.LIFE.MAX 
}) {
  const { showLifeBar } = useLifeBar();
  const percentage = (currentLife / maxLife) * 100;
  
  // Define a cor baseada na porcentagem de vida
  let color = 'green';
  if (percentage <= 25) color = 'red';
  else if (percentage <= 50) color = 'orange';
  else if (percentage <= 75) color = 'yellow';

  return (
    <Box 
      style={{ 
        position: 'absolute',
        top: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        zIndex: 1,
        opacity: showLifeBar ? 1 : 0,
        transition: `opacity ${GAME_CONFIG.ANIMATION.LIFE_BAR_FADE_DURATION}ms ease`
      }}
    >
      <Progress 
        value={percentage} 
        color={color}
        size="sm"
        radius="xl"
      />
    </Box>
  );
} 