import { createContext, useContext, useState } from 'react';
import { GAME_CONFIG } from '@/constants/gameConfig';

const LifeBarContext = createContext();

export function LifeBarProvider({ children }) {
  const [showLifeBar, setShowLifeBar] = useState(false);

  const showLifeBarTemporarily = () => {
    setShowLifeBar(true);
    setTimeout(() => {
      setShowLifeBar(false);
    }, GAME_CONFIG.TIMING.LIFE_BAR_DURATION);
  };

  return (
    <LifeBarContext.Provider value={{ showLifeBar, showLifeBarTemporarily }}>
      {children}
    </LifeBarContext.Provider>
  );
}

export function useLifeBar() {
  const context = useContext(LifeBarContext);
  if (!context) {
    throw new Error('useLifeBar deve ser usado dentro de um LifeBarProvider');
  }
  return context;
} 