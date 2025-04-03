import { useState, useEffect, useRef } from 'react';
import { Box, Image } from '@mantine/core';
import { useLifeBar } from '@/contexts/LifeBarContext';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { AnimationService } from '@/services/AnimationService';
import '@/styles/animations.css';

export function KeyboardThrower({ 
  enabled = false,
  socket, 
  codigoSala, 
  currentUser,
  soundEnabled
}) {
  const [explodingAvatars, setExplodingAvatars] = useState([]);
  const [flyingKeyboards, setFlyingKeyboards] = useState([]);
  const { showLifeBarTemporarily } = useLifeBar();

  // Adiciona listener para o evento throwObject
  useEffect(() => {
    if (!socket) return;

    const handleThrowObject = (data) => {
      const { fromUser, toUser, objectType } = data;
      // Ignora o evento se o remetente for o próprio usuário
      if (fromUser === currentUser.id) return;
      
      if (objectType === 'keyboard') {
        // Encontra o elemento do avatar alvo usando data-id
        const targetElement = document.querySelector(`[data-id="${toUser}"]`);
        if (targetElement) {
          throwKeyboardAtAvatar(targetElement, toUser);
        }
      }
    };

    socket.on('throwObject', handleThrowObject);

    return () => {
      socket.off('throwObject', handleThrowObject);
    };
  }, [socket, currentUser.id]);

  // Função para adicionar teclado voador e explosão a um avatar
  const throwKeyboardAtAvatar = (element, userId) => {
    if (!element) return;
    
    // Escolhe uma direção aleatória
    const attackDirection = Math.random() < 0.5 ? 'left' : 'right';
    
    // Cria IDs únicos para esta animação
    const animationId = Date.now().toString();
    
    // Imprime informações sobre o avatar para debug
    console.log("Avatar alvo:", element);
    console.log("Avatar dimensions:", element.offsetWidth, element.offsetHeight);
    console.log("Avatar position:", element.getBoundingClientRect());
    
    // Armazena a posição original do elemento
    const originalPosition = element.style.position;
    const originalOverflow = element.style.overflow;
    
    // Adiciona estilo de posição relativa ao avatar e garante que seja visível
    if (element.style.position !== 'relative' && element.style.position !== 'absolute') {
      element.style.position = 'relative';
    }
    element.style.overflow = 'visible';
    
    // Cria o teclado voador usando o serviço de animação
    const keyboardId = AnimationService.createFlyingKeyboard(element, attackDirection);
    
    // Rastreia teclados em voo
    setFlyingKeyboards(prev => [...prev, { id: animationId, element, userId, direction: attackDirection }]);
    
    // Quando a animação do teclado terminar, mostre a explosão e o ricochete
    setTimeout(() => {
      // Remove o teclado original
      const keyboardElement = document.getElementById(`keyboard-${keyboardId}`);
      if (keyboardElement) {
        keyboardElement.remove();
      }
      
      // Adiciona efeito de tremor ao avatar e mostra a explosão simultaneamente
      AnimationService.makeAvatarShake(element);
      AnimationService.showExplosionInAvatar(element, userId, soundEnabled);
      
      // Adiciona efeito de ricochete imediatamente no mesmo instante
      AnimationService.createRicochetKeyboard(element, attackDirection);
      
      // Remove da lista de teclados em voo
      setFlyingKeyboards(prev => prev.filter(item => item.id !== animationId));

      // Mostra a barra de vida do avatar atingido
      showLifeBarTemporarily(userId);

      // Mostra o número de dano
      AnimationService.showDamageNumber(element, GAME_CONFIG.DAMAGE.KEYBOARD);

      // Emite o evento de dano após a animação
      if (socket) {
        socket.emit('damage', {
          codigo: codigoSala,
          targetId: userId,
          damage: GAME_CONFIG.DAMAGE.KEYBOARD
        });
      }
    }, 400);
  };

  // Manipulador de cliques
  const handleClick = (e) => {
    if (!enabled) return;
    
    // Encontra o elemento carta-participante mais próximo
    const targetElement = e.target.closest('.carta-participante');
    if (!targetElement) return;

    // Não permitir cliques no próprio usuário
    const targetId = targetElement.getAttribute('data-id');
    if (!targetId || targetId === currentUser.id) return;
    
    console.log("Avatar clicado:", targetId);
    
    // Previne qualquer ação padrão que possa ocorrer, como seleção de texto
    e.preventDefault();
    
    // Lança teclado no avatar
    throwKeyboardAtAvatar(targetElement, targetId);
    
    // Envia evento para outros participantes via socket.io
    if (socket) {
      // Primeiro envia o evento de arremesso para iniciar a animação
      socket.emit('throwObject', {
        codigo: codigoSala,
        fromUser: currentUser.id,
        toUser: targetId,
        objectType: 'keyboard'
      });

      // Depois da animação, emite o evento de dano
      setTimeout(() => {
        socket.emit('applyDamage', {
          codigo: codigoSala,
          fromUser: currentUser.id,
          toUser: targetId,
          objectType: 'keyboard'
        });
      }, 400); // Tempo da animação
    }
  };
  
  // Usando useEffect para adicionar e remover event listeners
  useEffect(() => {
    if (enabled) {
      document.addEventListener('click', handleClick);
      
      // Prevenir comportamento padrão de seleção de texto
      const preventSelection = (e) => {
        // Verifica se o target é um elemento e tem o método closest
        if (e.target && typeof e.target.closest === 'function') {
          if (e.target.closest('.carta-participante')) {
            e.preventDefault();
          }
        } else if (e.target) {
          // Alternativa: verifica se o target ou algum pai tem a classe carta-participante
          let element = e.target;
          while (element) {
            if (element.classList && element.classList.contains('carta-participante')) {
              e.preventDefault();
              break;
            }
            element = element.parentElement;
          }
        }
      };
      
      // Adiciona event listeners para prevenir seleção
      document.addEventListener('mousedown', preventSelection);
      document.addEventListener('selectstart', preventSelection);
      
      // Socket listener para receber eventos de outros usuários
      if (socket) {
        return () => {
          document.removeEventListener('click', handleClick);
          document.removeEventListener('mousedown', preventSelection);
          document.removeEventListener('selectstart', preventSelection);
        };
      }
      
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('mousedown', preventSelection);
        document.removeEventListener('selectstart', preventSelection);
      };
    }
  }, [enabled, socket, codigoSala, currentUser.id]);
  
  return null;
} 