import { Box, Progress } from '@mantine/core';

export function LifeBar({ currentLife = 100, maxLife = 100 }) {
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
        zIndex: 1
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