import { useState, useEffect, useRef } from 'react';
import { Box, Image } from '@mantine/core';

// Estilo CSS global para o click overlay, explosão e teclado
const GLOBAL_STYLES = `
@keyframes collision-effect {
  0% { transform: scale(0.1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 0.9; }
  100% { transform: scale(1) rotate(360deg); opacity: 0; }
}

@keyframes keyboard-flying {
  0% { transform: translateX(-120vw) translateY(0) rotate(15deg); opacity: 1; }
  95% { transform: translateX(0) translateY(0) rotate(15deg); opacity: 1; }
  100% { transform: translateX(0) translateY(0) rotate(15deg); opacity: 0; }
}

@keyframes keyboard-ricochet {
  0% { transform: translateX(0) translateY(0) rotate(15deg); opacity: 1; }
  25% { transform: translateX(-40px) translateY(-40px) rotate(-90deg); opacity: 1; }
  50% { transform: translateX(-80px) translateY(-20px) rotate(-180deg); opacity: 1; }
  75% { transform: translateX(-130px) translateY(10px) rotate(-270deg); opacity: 0.8; }
  100% { transform: translateX(-170px) translateY(20px) rotate(-360deg); opacity: 0; }
}

@keyframes avatar-shake {
  0% { transform: translate(0, 0) rotate(0deg); }
  10% { transform: translate(-5px, -5px) rotate(-2deg); }
  20% { transform: translate(5px, 0) rotate(2deg); }
  30% { transform: translate(-5px, 5px) rotate(-2deg); }
  40% { transform: translate(5px, 5px) rotate(2deg); }
  50% { transform: translate(-5px, -5px) rotate(-1deg); }
  60% { transform: translate(5px, 0) rotate(1deg); }
  70% { transform: translate(-3px, 5px) rotate(-1deg); }
  80% { transform: translate(3px, -5px) rotate(1deg); }
  90% { transform: translate(-1px, 3px) rotate(0deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.shake-effect {
  animation: avatar-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
  transform-origin: center;
}

.explosion-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10000;
}

.explosion-image {
  width: 150%;
  height: 150%;
  object-fit: contain;
  animation: collision-effect 0.25s ease-out;
}

.keyboard-flying {
  position: absolute;
  width: 35px;
  height: 35px;
  z-index: 9999;
  pointer-events: none;
  animation: keyboard-flying 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.keyboard-ricochet {
  position: absolute;
  width: 35px;
  height: 35px;
  z-index: 9998;
  pointer-events: none;
  animation: keyboard-ricochet 0.4s cubic-bezier(0.14, 0.7, 0.8, 1) forwards;
}

.keyboard-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(1.3) saturate(0.8);
}

/* Prevenção de seleção de texto */
.carta-participante, 
.carta-participante * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: pointer;
}
`;

export function KeyboardThrower({ 
  enabled = false,
  socket, 
  codigoSala, 
  currentUser
}) {
  const [explodingAvatars, setExplodingAvatars] = useState([]);
  const [flyingKeyboards, setFlyingKeyboards] = useState([]);

  // Adiciona o estilo de prevenção de seleção de texto na montagem
  useEffect(() => {
    if (enabled) {
      // Aplica estilos globais para prevenção de seleção de texto
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .carta-participante, .carta-participante * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          cursor: pointer !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [enabled]);

  // Função para adicionar teclado voador e explosão a um avatar
  const throwKeyboardAtAvatar = (element, userId) => {
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
    
    // Cria o contêiner do teclado voador
    const keyboardDiv = document.createElement('div');
    keyboardDiv.id = `keyboard-${animationId}`;
    keyboardDiv.className = 'keyboard-flying';
    
    // Cria a imagem do teclado
    const keyboardImg = document.createElement('img');
    keyboardImg.src = '/images/game-objects/keyboard.svg';
    keyboardImg.alt = 'Teclado';
    keyboardImg.className = 'keyboard-image';
    
    // Adiciona a imagem ao contêiner
    keyboardDiv.appendChild(keyboardImg);
    
    // Adiciona o teclado ao avatar
    element.appendChild(keyboardDiv);
    
    // Rastreia teclados em voo
    setFlyingKeyboards(prev => [...prev, { id: animationId, element, userId }]);
    
    // Quando a animação do teclado terminar, mostre a explosão e o ricochete
    setTimeout(() => {
      // Remove o teclado original
      const keyboardElement = document.getElementById(`keyboard-${animationId}`);
      if (keyboardElement) {
        keyboardElement.remove();
      }
      
      // Adiciona efeito de tremor ao avatar e mostra a explosão simultaneamente
      makeAvatarShake(element);
      showExplosionInAvatar(element, userId);
      
      // Adiciona efeito de ricochete imediatamente no mesmo instante
      createRicochetKeyboard(element);
      
      // Remove da lista de teclados em voo
      setFlyingKeyboards(prev => prev.filter(item => item.id !== animationId));
    }, 400); // Tempo ainda mais reduzido da animação do teclado
  };

  // Função para criar o teclado ricocheteando
  const createRicochetKeyboard = (element) => {
    // Gera um ID único para o teclado ricocheteando
    const ricochetId = `ricochet-${Date.now()}`;
    
    // Obtém a posição do avatar para posicionar o ricochete corretamente
    const rect = element.getBoundingClientRect();
    
    // Cria o contêiner do teclado ricocheteando
    const ricochetDiv = document.createElement('div');
    ricochetDiv.id = ricochetId;
    ricochetDiv.className = 'keyboard-ricochet';
    
    // Posiciona o ricochete absolutamente em relação ao body, mas começando na posição do avatar
    ricochetDiv.style.position = 'fixed';
    ricochetDiv.style.left = `${rect.left + rect.width/2 - 17.5}px`; // Centraliza o teclado
    ricochetDiv.style.top = `${rect.top + rect.height/2 - 17.5}px`;
    
    // Cria a imagem do teclado
    const ricochetImg = document.createElement('img');
    ricochetImg.src = '/images/game-objects/keyboard.svg';
    ricochetImg.alt = 'Teclado Ricocheteando';
    ricochetImg.className = 'keyboard-image';
    
    // Adiciona a imagem ao contêiner
    ricochetDiv.appendChild(ricochetImg);
    
    // Adiciona o ricochete ao body (não ao avatar, para permitir movimento livre)
    document.body.appendChild(ricochetDiv);
    
    // Remove o ricochete após a animação terminar
    setTimeout(() => {
      const ricochetElement = document.getElementById(ricochetId);
      if (ricochetElement) {
        ricochetElement.remove();
      }
    }, 400); // Duração ainda mais reduzida da animação de ricochete
  };

  // Função para fazer o avatar tremer após impacto
  const makeAvatarShake = (element) => {
    if (!element) return;
    
    // Se o avatar já tiver a classe de tremor, remove primeiro para resetar a animação
    element.classList.remove('shake-effect');
    
    // Força um reflow para garantir que a animação seja aplicada novamente
    void element.offsetWidth;
    
    // Adiciona a classe de tremor
    element.classList.add('shake-effect');
    
    // Remove a classe após a animação terminar
    setTimeout(() => {
      element.classList.remove('shake-effect');
    }, 400); // Duração ainda mais reduzida da animação de tremor
  };

  // Função para mostrar explosão dentro do avatar
  const showExplosionInAvatar = (element, userId) => {
    if (!element) return;
    
    // Cria um ID único para esta explosão
    const explosionId = Date.now().toString();
    
    // Cria o contêiner da explosão com um ID único
    const explosionDiv = document.createElement('div');
    explosionDiv.id = `explosion-${explosionId}`;
    explosionDiv.className = 'explosion-overlay';
    
    // Cria a imagem da explosão
    const explosionImg = document.createElement('img');
    explosionImg.src = '/images/game-objects/collision.svg';
    explosionImg.alt = 'Explosion';
    explosionImg.className = 'explosion-image';
    
    // Adiciona a imagem ao contêiner
    explosionDiv.appendChild(explosionImg);
    
    // Adiciona a explosão ao avatar
    element.appendChild(explosionDiv);
    
    // Rastreia quais avatares têm explosões ativas
    setExplodingAvatars(prev => [...prev, { id: explosionId, element, userId }]);
    
    // Remove a explosão após o tempo da animação
    setTimeout(() => {
      const explosionElement = document.getElementById(`explosion-${explosionId}`);
      if (explosionElement) {
        explosionElement.remove();
      }
      
      // Remove o avatar da lista de explosões ativas
      setExplodingAvatars(prev => prev.filter(item => item.id !== explosionId));
    }, 250); // Duração ainda mais reduzida da explosão
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
        const handleIncomingThrow = (data) => {
          if (data.toUser === currentUser.id) {
            // Somos o alvo do arremesso
            const ourElement = document.querySelector(`.carta-participante[data-id="${currentUser.id}"]`);
            if (ourElement) {
              // Adiciona teclado e explosão ao nosso avatar
              throwKeyboardAtAvatar(ourElement, currentUser.id);
            }
          }
        };
        
        socket.on('throwObject', handleIncomingThrow);
        
        return () => {
          document.removeEventListener('click', handleClick);
          document.removeEventListener('mousedown', preventSelection);
          document.removeEventListener('selectstart', preventSelection);
          socket.off('throwObject', handleIncomingThrow);
        };
      }
      
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('mousedown', preventSelection);
        document.removeEventListener('selectstart', preventSelection);
      };
    }
  }, [enabled, socket, codigoSala, currentUser.id]);
  
  return (
    <>
      {/* Estilos globais */}
      <style>{GLOBAL_STYLES}</style>
    </>
  );
} 