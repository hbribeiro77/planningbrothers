import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '@/constants/gameConfig';

const LifeBarContext = createContext();

export function LifeBarProvider({ children }) {
  const [visibleBars, setVisibleBars] = useState({});
  const timeoutsRef = useRef({});

  const showLifeBarTemporarily = useCallback((avatarId) => {
    if (timeoutsRef.current[avatarId]) {
      clearTimeout(timeoutsRef.current[avatarId]);
    }

    setVisibleBars(prev => ({ ...prev, [avatarId]: true }));

    timeoutsRef.current[avatarId] = setTimeout(() => {
      setVisibleBars(prev => {
        const newState = { ...prev };
        delete newState[avatarId];
        return newState;
      });
      delete timeoutsRef.current[avatarId];
    }, 3000);
  }, []);

  const isBarVisible = useCallback((avatarId) => {
    return !!visibleBars[avatarId];
  }, [visibleBars]);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <LifeBarContext.Provider value={{ 
      visibleBars,
      isBarVisible,
      showLifeBarTemporarily 
    }}>
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