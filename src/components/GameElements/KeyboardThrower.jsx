import { useState, useEffect, useRef, useCallback } from 'react';
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
      // Log para verificar recebimento e IDs
      console.log(`[Socket Listener] Recebeu throwObject: from=${fromUser}, to=${toUser}, currentUser=${currentUser.id}`);
      
      // Ignora o evento se o remetente for o próprio usuário
      if (fromUser === currentUser.id) {
          console.log('[Socket Listener] Ignorando evento do próprio usuário.');
          return;
      }
      
      if (objectType === 'keyboard') {
        // Encontra o elemento do avatar alvo usando data-id
        // CORREÇÃO: Usar data-user-id como no page.js
        const targetElement = document.querySelector(`.carta-participante[data-user-id="${toUser}"]`); 
        console.log(`[Socket Listener] Tentando encontrar targetElement para user ${toUser}:`, targetElement);

        if (targetElement) {
          console.log(`[Socket Listener] Chamando throwKeyboardAtAvatar para ${toUser}...`);
          // Determina a direção (poderíamos receber isso do evento original? Por ora, aleatório)
          const attackDirection = Math.random() < 0.5 ? 'left' : 'right';
          throwKeyboardAtAvatar(targetElement, toUser, attackDirection);
          console.log(`[Socket Listener] Chamada a throwKeyboardAtAvatar para ${toUser} concluída.`);
        } else {
            console.warn(`[Socket Listener] targetElement não encontrado para user ${toUser}. Animação não será exibida.`);
        }
      }
    };

    socket.on('throwObject', handleThrowObject);

    return () => {
      socket.off('throwObject', handleThrowObject);
    };
  }, [socket, currentUser.id]);

  // Função para adicionar teclado voador e explosão a um avatar
  const throwKeyboardAtAvatar = (element, userId, attackDirection) => {
    if (!element) return;
    
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
    
    // Cria o teclado voador usando o serviço de animação, passando a direção
    const keyboardId = AnimationService.createFlyingKeyboard(element, attackDirection, userId);
    
    // Rastreia teclados em voo (incluindo a direção)
    const item = { id: animationId, element, userId, direction: attackDirection }; 
    setFlyingKeyboards(prev => [...prev, item]);
    
    // Quando a animação do teclado terminar, mostre a explosão e o ricochete
    setTimeout(() => {
      // Deixar que o handleDamageReceived ou animações CSS limpem depois
      
      // Remove da lista de teclados em voo (apenas estado interno)
      setFlyingKeyboards(prev => prev.filter(i => i.id !== animationId));

      // Emitir o evento de ATAQUE (sem dano) após a animação
      if (socket) {
        socket.emit('attack', {
          codigo: codigoSala,
          targetId: userId,
          fromUserId: currentUser.id,
          objectType: 'keyboard',
          attackDirection: item.direction
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
    const attackDirection = Math.random() < 0.5 ? 'left' : 'right';
    throwKeyboardAtAvatar(targetElement, targetId, attackDirection);
    
    // Envia evento para outros participantes via socket.io
    if (socket) {
      socket.emit('throwObject', {
        codigo: codigoSala,
        fromUser: currentUser.id,
        toUser: targetId,
        objectType: 'keyboard'
      });
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