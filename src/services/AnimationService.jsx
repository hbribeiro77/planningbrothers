// Arquivo de serviço para gerenciar animações

// --- Início Lógica de Áudio com Volume ---
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
const audioBuffers = {}; // Cache para buffers de áudio decodificados
let isLoading = {}; 

const loadSound = (soundPath) => {
  if (!audioContext) return Promise.resolve(null);
  if (audioBuffers[soundPath]) return Promise.resolve(audioBuffers[soundPath]);
  if (isLoading[soundPath]) {
    return new Promise(resolve => setTimeout(() => resolve(loadSound(soundPath)), 100));
  }
  isLoading[soundPath] = true;

  console.log(`[Audio] Carregando: ${soundPath}`);
  return fetch(soundPath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.arrayBuffer();
    })
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      console.log(`[Audio] Carregado: ${soundPath}`);
      audioBuffers[soundPath] = audioBuffer;
      delete isLoading[soundPath];
      return audioBuffer;
    })
    .catch(error => {
      console.error(`[Audio] Erro ao carregar ${soundPath}:`, error);
      delete isLoading[soundPath];
      return null;
    });
};

const playSound = async (soundPath, volume = 1.0) => {
  // Log para verificar o volume recebido ANTES da condição de mute
  console.log(`[playSound] Checking mute condition. Received volume: ${volume} (type: ${typeof volume})`); // Log 4
  if (!audioContext || volume <= 0) {
    console.log(`[playSound] Muting/Skipping sound. volume=${volume}, audioContext=${!!audioContext}`);
    return; // Mudo ou sem contexto, não faz nada
  }

  try {
    const buffer = await loadSound(soundPath);
    if (!buffer) return; 

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
  } catch (error) {
    console.error(`[playSound] Erro ao tocar ${soundPath}:`, error);
  }
};
// --- Fim Lógica de Áudio com Volume ---

export class AnimationService {
  /**
   * Cria e mostra uma explosão em um elemento
   */
  static showExplosionInAvatar(element, userId, volume) {
    if (!element) return;

    playSound('/audio/beat.wav', volume);

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

    // *** RESTAURAR LÓGICA ORIGINAL ***
    if (isDodge) { // Verificar esquiva primeiro
      damageNumber.textContent = 'Errou!';
      damageNumber.className = 'damage-number damage-dodge'; // Classe específica para esquiva
    } else if (isCritical) { // Senão, verificar crítico
      damageNumber.textContent = 'CRITICAL!';
      damageNumber.className = 'damage-number damage-critical';
      displayTime = 1200; // Tempo maior para crítico
    } else { // Senão, exibir dano normal
      damageNumber.textContent = `-${damage}`;
      damageNumber.className = 'damage-number';
    }
    // *** FIM DA RESTAURAÇÃO ***
    
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