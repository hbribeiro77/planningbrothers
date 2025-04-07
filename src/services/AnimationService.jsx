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
    keyboardDiv.className = `keyboard-flying keyboard-flying-${direction}`;
    keyboardDiv.setAttribute('data-target-id', targetId);
    
    keyboardDiv.style.position = 'fixed';
    keyboardDiv.style.zIndex = '10';
    keyboardDiv.style.pointerEvents = 'none';

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
    
    // Forçar reflow para garantir que os estilos sejam aplicados antes da animação
    void keyboardDiv.offsetWidth; 
    
    // Adiciona ao body DEPOIS de configurar tudo e forçar reflow
    document.body.appendChild(keyboardDiv);

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
    // NÃO aplicar classe de animação ainda
    ricochetDiv.className = `keyboard-ricochet`; // Classe base apenas
    
    // Definir estilos, começando invisível
    ricochetDiv.style.position = 'fixed';
    ricochetDiv.style.zIndex = '15';
    ricochetDiv.style.left = `${rect.left + rect.width/2 - 17.5}px`;
    ricochetDiv.style.top = `${rect.top + rect.height/2 - 17.5}px`;
    ricochetDiv.style.opacity = '0';
    ricochetDiv.style.pointerEvents = 'none';
    
    const ricochetImg = document.createElement('img');
    ricochetImg.src = '/images/game-objects/keyboard.svg';
    ricochetImg.alt = 'Teclado Ricocheteando';
    ricochetImg.className = 'keyboard-image';
    ricochetDiv.appendChild(ricochetImg);

    // Adicionar ao body (invisível)
    document.body.appendChild(ricochetDiv);

    // Adicionar classe de animação no próximo frame
    requestAnimationFrame(() => {
      ricochetDiv.classList.add(`keyboard-ricochet-${direction}`);
      ricochetDiv.style.opacity = ''; // Deixar animação controlar opacidade
    });
    
    // Remover após animação CSS (forwards cuida do estado final)
    setTimeout(() => {
      const ricochetElement = document.getElementById(ricochetId);
      if (ricochetElement) {
        ricochetElement.remove();
      }
    }, 400); // Tempo da animação CSS

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
    // NÃO aplicar classe de animação ainda
    passThroughDiv.className = `keyboard-pass-through`; // Classe base apenas
    
    // Definir estilos, começando invisível
    passThroughDiv.style.position = 'fixed';
    passThroughDiv.style.zIndex = '10'; 
    passThroughDiv.style.left = `${rect.left + rect.width/2 - 17.5}px`; 
    passThroughDiv.style.top = `${rect.top + rect.height/2 - 17.5}px`;
    passThroughDiv.style.opacity = '0';
    passThroughDiv.style.pointerEvents = 'none';
    
    const passThroughImg = document.createElement('img');
    passThroughImg.src = '/images/game-objects/keyboard.svg';
    passThroughImg.alt = 'Teclado Atravessando';
    passThroughImg.className = 'keyboard-image';
    passThroughDiv.appendChild(passThroughImg);
    
    // Adicionar ao body (invisível)
    document.body.appendChild(passThroughDiv);

    // Adicionar classe de animação no próximo frame
    requestAnimationFrame(() => {
        passThroughDiv.classList.add(`keyboard-pass-through-${direction}`);
        passThroughDiv.style.opacity = ''; // Deixar animação controlar opacidade
    });
    
    // Remover após animação CSS
    setTimeout(() => {
      const passThroughElement = document.getElementById(passThroughId);
      if (passThroughElement) {
        passThroughElement.remove();
      }
    }, 400); // Usar mesma duração da animação CSS de pass-through (0.4s)

    return passThroughId;
  }
} 