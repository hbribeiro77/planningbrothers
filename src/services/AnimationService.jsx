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
   * Mostra o número de dano ou texto crítico em um elemento
   */
  static showDamageNumber(element, damage, isCritical = false) {
    if (!element) return;

    const damageNumber = document.createElement('div');
    
    if (isCritical) {
      damageNumber.textContent = 'CRITICAL!';
      damageNumber.className = 'damage-number damage-critical';
    } else {
      damageNumber.textContent = `-${damage}`;
      damageNumber.className = 'damage-number';
    }
    
    damageNumber.style.position = 'absolute';
    damageNumber.style.left = `50%`;
    damageNumber.style.top = `40%`;
    damageNumber.style.transform = 'translate(-50%, -100%)';
    damageNumber.style.pointerEvents = 'none';
    damageNumber.style.zIndex = '10';
    
    element.appendChild(damageNumber);

    const displayTime = isCritical ? 1200 : 800;

    setTimeout(() => {
      if (damageNumber.parentNode) {
          damageNumber.remove();
      }
    }, displayTime);
  }

  /**
   * Cria e mostra um teclado voador
   */
  static createFlyingKeyboard(element, direction) {
    if (!element) return null;

    const animationId = Date.now().toString();
    
    const keyboardDiv = document.createElement('div');
    keyboardDiv.id = `keyboard-${animationId}`;
    keyboardDiv.className = `keyboard-flying keyboard-flying-${direction}`;
    
    const keyboardImg = document.createElement('img');
    keyboardImg.src = '/images/game-objects/keyboard.svg';
    keyboardImg.alt = 'Teclado';
    keyboardImg.className = 'keyboard-image';
    
    keyboardDiv.appendChild(keyboardImg);
    element.appendChild(keyboardDiv);

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
} 