import { createContext, useContext, useState } from 'react';
import { GAME_CONFIG } from '@/constants/gameConfig';

const LifeBarContext = createContext();

export function LifeBarProvider({ children }) {
  const [showLifeBar, setShowLifeBar] = useState(false);
  const [targetAvatarId, setTargetAvatarId] = useState(null);

  const showLifeBarTemporarily = (avatarId) => {
    setTargetAvatarId(avatarId);
    setShowLifeBar(true);
    setTimeout(() => {
      setShowLifeBar(false);
      setTargetAvatarId(null);
    }, 3000);
  };

  return (
    <LifeBarContext.Provider value={{ showLifeBar, targetAvatarId, showLifeBarTemporarily }}>
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