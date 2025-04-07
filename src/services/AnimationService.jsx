// Arquivo de serviço para gerenciar animações
export class AnimationService {
  /**
   * Cria e mostra uma explosão em um elemento
   */
  static showExplosionInAvatar(element, userId, soundEnabled) {
    if (!element) return;

    if (soundEnabled) {
      const audio = new Audio('/audio/beat.wav');
      audio.play().catch(error => console.log('Erro ao tocar som:', error));
    }

    const explosionId = Date.now().toString();
    
    const explosionDiv = document.createElement('div');
    explosionDiv.id = `explosion-${explosionId}`;
    explosionDiv.className = 'explosion-overlay';
    explosionDiv.style.zIndex = '20';
    
    const explosionImg = document.createElement('img');
    explosionImg.src = '/images/game-objects/collision.svg';
    explosionImg.alt = 'Explosion';
    explosionImg.className = 'explosion-image';
    
    explosionDiv.appendChild(explosionImg);
    element.appendChild(explosionDiv);
    
    setTimeout(() => {
      const explosionElement = document.getElementById(`explosion-${explosionId}`);
      if (explosionElement) {
        explosionElement.remove();
      }
    }, 250);

    return explosionId;
  }

  /**
   * Faz um elemento tremer
   */
  static makeAvatarShake(element) {
    if (!element) return;
    
    element.classList.remove('shake-effect');
    void element.offsetWidth;
    element.classList.add('shake-effect');
    
    setTimeout(() => {
      element.classList.remove('shake-effect');
    }, 400);
  }

  /**
   * Mostra o número de dano, texto crítico ou esquiva em um elemento
   */
  static showDamageNumber(element, damage, isCritical = false, isDodge = false) {
    if (!element) return;

    const damageNumber = document.createElement('div');
    damageNumber.style.position = 'absolute';
    damageNumber.style.left = `50%`;
    damageNumber.style.top = `40%`;
    damageNumber.style.transform = 'translate(-50%, -100%)';
    damageNumber.style.pointerEvents = 'none';
    damageNumber.style.zIndex = '10';

    let displayTime = 800; // Tempo padrão

    if (isDodge) { // Verificar esquiva primeiro
      damageNumber.textContent = 'Errou!';
      damageNumber.className = 'damage-number damage-dodge'; // Classe específica para esquiva
      // Poderia ter um tempo de exibição diferente para esquiva, se desejado
      // displayTime = 1000;
    } else if (isCritical) { // Senão, verificar crítico
      damageNumber.textContent = 'CRITICAL!';
      damageNumber.className = 'damage-number damage-critical';
      displayTime = 1200; // Tempo maior para crítico
    } else { // Senão, exibir dano normal
      damageNumber.textContent = `-${damage}`;
      damageNumber.className = 'damage-number';
    }
    
    element.appendChild(damageNumber);

    setTimeout(() => {
      if (damageNumber.parentNode) {
          damageNumber.remove();
      }
    }, displayTime);
  }

  /**
   * Cria e mostra um teclado voador
   */
  static createFlyingKeyboard(element, direction, targetId) {
    if (!element) return null;

    const animationId = Date.now().toString();
    
    const keyboardDiv = document.createElement('div');
    keyboardDiv.id = `keyboard-${animationId}`;
    // NÃO aplicar classe de animação ainda
    keyboardDiv.className = `keyboard-flying`; // Classe base apenas
    keyboardDiv.setAttribute('data-target-id', targetId);
    
    // Define todos os estilos ANTES de adicionar ao DOM
    keyboardDiv.style.position = 'fixed';
    keyboardDiv.style.zIndex = '10'; 
    keyboardDiv.style.pointerEvents = 'none'; 
    // Começar invisível
    keyboardDiv.style.opacity = '0';

    const rect = element.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;
    
    keyboardDiv.style.left = `${targetCenterX - 17.5}px`; 
    keyboardDiv.style.top = `${targetCenterY - 17.5}px`; 
    
    const keyboardImg = document.createElement('img');
    keyboardImg.src = '/images/game-objects/keyboard.svg';
    keyboardImg.alt = 'Teclado';
    keyboardImg.className = 'keyboard-image';
    keyboardDiv.appendChild(keyboardImg);
    
    // Adiciona ao body (ainda invisível e sem animação)
    document.body.appendChild(keyboardDiv);

    // Força reflow (opcional, mas pode ajudar em alguns casos)
    // void keyboardDiv.offsetWidth;

    // No próximo quadro de animação, adiciona a classe de animação
    requestAnimationFrame(() => {
        // A animação CSS (keyboard-flying-left/right) deve começar com opacity: 1
        keyboardDiv.classList.add(`keyboard-flying-${direction}`);
        // Remove a opacidade 0 inline para permitir que a animação controle
        keyboardDiv.style.opacity = ''; 
    });

    return animationId;
  }

  /**
   * Cria e mostra um teclado ricocheteando
   */
  static createRicochetKeyboard(element, direction) {
    if (!element) return;

    const ricochetId = `ricochet-${Date.now()}`;
    const rect = element.getBoundingClientRect();
    
    const ricochetDiv = document.createElement('div');
    ricochetDiv.id = ricochetId;
    ricochetDiv.className = `keyboard-ricochet keyboard-ricochet-${direction}`;
    ricochetDiv.style.position = 'fixed';
    ricochetDiv.style.zIndex = '15';
    ricochetDiv.style.left = `${rect.left + rect.width/2 - 17.5}px`;
    ricochetDiv.style.top = `${rect.top + rect.height/2 - 17.5}px`;
    
    const ricochetImg = document.createElement('img');
    ricochetImg.src = '/images/game-objects/keyboard.svg';
    ricochetImg.alt = 'Teclado Ricocheteando';
    ricochetImg.className = 'keyboard-image';
    
    ricochetDiv.appendChild(ricochetImg);
    document.body.appendChild(ricochetDiv);
    
    setTimeout(() => {
      const ricochetElement = document.getElementById(ricochetId);
      if (ricochetElement) {
        ricochetElement.remove();
      }
    }, 400);

    return ricochetId;
  }

  /**
   * Cria e mostra um teclado atravessando (para esquiva)
   */
  static createPassingKeyboard(element, direction) {
    if (!element) return;

    const passThroughId = `pass-through-${Date.now()}`;
    const rect = element.getBoundingClientRect();
    
    const passThroughDiv = document.createElement('div');
    passThroughDiv.id = passThroughId;
    // Aplicar classe para animação de atravessar e direção
    passThroughDiv.className = `keyboard-pass-through keyboard-pass-through-${direction}`; 
    
    passThroughDiv.style.position = 'fixed';
    passThroughDiv.style.zIndex = '10'; // zIndex similar ao teclado voador
    // Posição inicial ligeiramente sobreposta ao centro do avatar
    passThroughDiv.style.left = `${rect.left + rect.width/2 - 17.5}px`; 
    passThroughDiv.style.top = `${rect.top + rect.height/2 - 17.5}px`;
    
    const passThroughImg = document.createElement('img');
    passThroughImg.src = '/images/game-objects/keyboard.svg';
    passThroughImg.alt = 'Teclado Atravessando';
    passThroughImg.className = 'keyboard-image'; // Reutilizar estilo da imagem
    
    passThroughDiv.appendChild(passThroughImg);
    document.body.appendChild(passThroughDiv);
    
    // Remover após a animação (ex: 500ms)
    // Ajustar tempo conforme a duração da animação CSS
    setTimeout(() => {
      const passThroughElement = document.getElementById(passThroughId);
      if (passThroughElement) {
        passThroughElement.remove();
      }
    }, 500);

    return passThroughId;
  }
} 