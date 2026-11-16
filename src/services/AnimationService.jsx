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
/**
 * Som sintetizado de "ação negada" (uón-uón descendente), sem precisar de arquivo de áudio.
 */
const playDeniedSound = (volume = 1.0) => {
  if (!audioContext || volume <= 0) return;
  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    const t0 = audioContext.currentTime;
    // Duas notas descendentes, estilo "trombone triste"
    [[311, 277, 0], [262, 196, 0.22]].forEach(([freqIni, freqFim, atraso]) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freqIni, t0 + atraso);
      osc.frequency.exponentialRampToValueAtTime(freqFim, t0 + atraso + 0.2);
      gain.gain.setValueAtTime(0.0001, t0 + atraso);
      gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + atraso + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + atraso + 0.2);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(t0 + atraso);
      osc.stop(t0 + atraso + 0.22);
    });
  } catch (error) {
    console.error('[playDeniedSound] Erro:', error);
  }
};
/** Som sintetizado de "carimbada" (pancada grave e curta). */
const playStampSound = (volume = 1.0) => {
  if (!audioContext || volume <= 0) return;
  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    const t0 = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.15);
    gain.gain.setValueAtTime(Math.max(volume * 1.5, 0.0002), t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  } catch (error) {
    console.error('[playStampSound] Erro:', error);
  }
};

/** Bip de alerta do celular prestes a explodir. */
const playBeep = (volume = 1.0, freq = 1200) => {
  if (!audioContext || volume <= 0) return;
  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    const t0 = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(Math.max(volume, 0.0002), t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(t0);
    osc.stop(t0 + 0.1);
  } catch (error) {
    console.error('[playBeep] Erro:', error);
  }
};

/** "Fuuu" de esquiva: ruído passando por um filtro que varre do grave pro agudo. */
const playWhoosh = (volume = 1.0) => {
  if (!audioContext || volume <= 0) return;
  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    const t0 = audioContext.currentTime;
    const dur = 0.28;
    const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * dur), audioContext.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
    const fonte = audioContext.createBufferSource();
    fonte.buffer = buffer;
    const filtro = audioContext.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 1.2;
    filtro.frequency.setValueAtTime(400, t0);
    filtro.frequency.exponentialRampToValueAtTime(2400, t0 + dur);
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume * 1.2, 0.0002), t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    fonte.connect(filtro);
    filtro.connect(gain);
    gain.connect(audioContext.destination);
    fonte.start(t0);
    fonte.stop(t0 + dur);
  } catch (error) {
    console.error('[playWhoosh] Erro:', error);
  }
};


// ---------- Efeitos sonoros das ações (sintetizados, sem arquivo) ----------
let volumeAtual = 0;

/** Nota simples com envelope. */
const tom = (freq, inicio, dur, { tipo = 'sine', volume = 1, freqFim = null } = {}) => {
  const t0 = audioContext.currentTime + inicio;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqFim) osc.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

/** Rajada de ruído filtrado (clack, mordida, zíper...). */
const ruido = (inicio, dur, { volume = 1, filtro = 'bandpass', freq = 2000, freqFim = null, q = 1 } = {}) => {
  const t0 = audioContext.currentTime + inicio;
  const buffer = audioContext.createBuffer(1, Math.max(1, Math.floor(audioContext.sampleRate * dur)), audioContext.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
  const fonte = audioContext.createBufferSource();
  fonte.buffer = buffer;
  const f = audioContext.createBiquadFilter();
  f.type = filtro;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0);
  if (freqFim) f.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(Math.max(volume, 0.0002), t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  fonte.connect(f);
  f.connect(gain);
  gain.connect(audioContext.destination);
  fonte.start(t0);
  fonte.stop(t0 + dur);
};

const EFEITOS = {
  // Pegou item do chão: plim-plim subindo
  item: (v) => { tom(988, 0, 0.12, { volume: v }); tom(1319, 0.08, 0.12, { volume: v }); tom(1760, 0.16, 0.22, { volume: v * 0.8 }); },
  // Moedas extras
  moeda: (v) => { tom(1568, 0, 0.08, { tipo: 'square', volume: v * 0.4 }); tom(2093, 0.07, 0.18, { tipo: 'square', volume: v * 0.4 }); },
  // Selecionou arma: clack-clack de engatilhar
  arma: (v) => {
    ruido(0, 0.05, { volume: v * 1.4, freq: 3000, q: 2 });
    tom(220, 0, 0.06, { tipo: 'square', volume: v * 0.5, freqFim: 110 });
    ruido(0.09, 0.07, { volume: v * 1.6, freq: 1800, q: 3 });
    tom(330, 0.09, 0.08, { tipo: 'square', volume: v * 0.5, freqFim: 150 });
  },
  // Comeu: três mordidas crocantes
  comer: (v) => { [0, 0.16, 0.32].forEach(t => ruido(t, 0.09, { volume: v * 1.5, filtro: 'highpass', freq: 1500 })); },
  // Bebeu: goles (bolha descendo)
  beber: (v) => { [0, 0.22, 0.44].forEach(t => tom(500, t, 0.14, { volume: v * 0.9, freqFim: 180 })); },
  // Equipou acessório: zíper subindo + clique
  acessorio: (v) => { ruido(0, 0.22, { volume: v, freq: 800, freqFim: 5000, q: 4 }); tom(880, 0.22, 0.08, { volume: v * 0.6 }); },
  // Tirou acessório: zíper descendo
  desequipar: (v) => { ruido(0, 0.22, { volume: v, freq: 5000, freqFim: 700, q: 4 }); tom(440, 0.22, 0.08, { volume: v * 0.5 }); },
  // Trocou contra-ataque: clique duplo
  troca: (v) => { tom(660, 0, 0.06, { tipo: 'triangle', volume: v }); tom(990, 0.07, 0.09, { tipo: 'triangle', volume: v }); },
  // Vitória: fanfarra curta (tã-tã-tã-tãããã)
  vitoria: (v) => {
    [[523, 0, 0.12], [659, 0.13, 0.12], [784, 0.26, 0.12], [1047, 0.39, 0.6]].forEach(([f, t, d]) => {
      tom(f, t, d, { tipo: 'triangle', volume: v * 0.8 });
      tom(f / 2, t, d, { tipo: 'square', volume: v * 0.25 });
    });
  },
  // Vida cheia: arroto (grave, tremido)
  cheio: (v) => {
    const t0 = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    const gain = audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t0);
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.45);
    lfo.frequency.value = 28; // o "tremido" do arroto
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const filtro = audioContext.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 600;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(v * 1.6, 0.0002), t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(filtro);
    filtro.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(t0); lfo.start(t0);
    osc.stop(t0 + 0.5); lfo.stop(t0 + 0.5);
  },
  // Ação negada (ex.: morto tentando comer)
  negado: (v) => playDeniedSound(v),
  // Conserto do minerador: chave inglesa batendo no metal (tim-tlec), com leve variação
  conserto: (v) => {
    const f = 1700 + Math.random() * 500;
    ruido(0, 0.03, { volume: v * 1.4, freq: 5000, q: 3 });
    tom(f, 0, 0.12, { tipo: 'triangle', volume: v * 0.7 });
    tom(f * 1.5, 0, 0.08, { tipo: 'sine', volume: v * 0.35 });
    ruido(0.07, 0.04, { volume: v, freq: 2500, q: 4 });
  },
  // Salvou o minerador da explosão: acorde subindo
  alivio: (v) => { [523, 659, 784].forEach((f, i) => tom(f, i * 0.08, 0.25, { tipo: 'sine', volume: v * 0.7 })); },
  // Comprou: ka-ching
  compra: (v) => {
    ruido(0, 0.06, { volume: v * 1.2, freq: 4000, q: 2 });
    [1319, 1661, 1976].forEach((f, i) => tom(f, 0.06 + i * 0.05, 0.35, { tipo: 'triangle', volume: v * 0.6 }));
  },
};

const tocarEfeito = (nome) => {
  const efeito = EFEITOS[nome];
  if (!audioContext || !efeito || volumeAtual <= 0) return;
  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    efeito(volumeAtual);
  } catch (error) {
    console.error(`[sfx:${nome}] Erro:`, error);
  }
};

// Itens caídos na tela: dropId -> { el, card, timers }
const dropsNaTela = new Map();
// Ícone de quem não tem SVG
const DROP_EMOJI = {
  vest: '🦺', vest_blue: '🦺', manifesto_comunista: '📕', medalha_5_anos: '🏅',
  firewall_minerador: '🧱', antivirus_minerador: '🛡️', placa_video_minerador: '🎮',
};

// Celulares (Note 7) na tela: bombId -> { wrapper, intervalo, card }
const bombasNaTela = new Map();
// --- Fim Lógica de Áudio com Volume ---

export class AnimationService {
  /** Texto flutuante genérico sobre um card. */
  static showFloatingText(element, text, extraClass = '', durationMs = 1200) {
    if (!element) return;
    const el = document.createElement('div');
    el.textContent = text;
    el.className = `damage-number floating-text ${extraClass}`;
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '10%';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '12';
    el.style.whiteSpace = 'nowrap';
    element.appendChild(el);
    setTimeout(() => el.remove(), durationMs);
  }

  /**
   * Esquiva: o card dá um passinho pro lado, o projétil passa reto e some.
   * Sem tremida, explosão ou som de pancada.
   */
  static showDodge(element, direction, imgSrc = '/images/game-objects/keyboard.svg', sizePx = 35, volume) {
    if (!element) return;
    playWhoosh(volume);

    // Veio da esquerda -> desvia pra direita (e vice-versa)
    const classe = direction === 'left' ? 'dodge-step-right' : 'dodge-step-left';
    element.classList.remove('dodge-step-right', 'dodge-step-left');
    void element.offsetWidth;
    element.classList.add(classe);
    setTimeout(() => element.classList.remove(classe), 450);

    // Projétil passando reto, por fora do card
    const rect = element.getBoundingClientRect();
    const passa = document.createElement('img');
    passa.src = imgSrc;
    passa.alt = '';
    passa.className = `dodge-pass dodge-pass-${direction}`;
    passa.style.width = `${sizePx}px`;
    passa.style.height = `${sizePx}px`;
    passa.style.left = `${rect.left + rect.width / 2 - sizePx / 2}px`;
    passa.style.top = `${rect.top + rect.height / 2 - sizePx / 2}px`;
    document.body.appendChild(passa);
    setTimeout(() => passa.remove(), 500);
  }

  /** Item caído ao lado do card de quem morreu. Clicar/tocar é tratado no KeyboardThrower. */
  static spawnDrop(card, { dropId, itemId, quantidade, restanteMs, iconSvgPath, nome, naMesa = false }) {
    if (!card || dropsNaTela.has(dropId)) return;
    if (card.style.position !== 'relative' && card.style.position !== 'absolute') card.style.position = 'relative';
    card.style.overflow = 'visible';
    const jaNoCard = [...dropsNaTela.values()].filter(d => d.card === card).length;

    const el = document.createElement('div');
    el.className = 'drop-item';
    el.dataset.dropId = dropId;
    el.title = `${nome} — clique pra pegar!`;
    // Espalha quando caem vários no mesmo card (ex.: upgrades do minerador)
    if (naMesa) {
      // Loot do chefe: espalhado pela mesa
      el.style.left = `${62 + (jaNoCard % 4) * 9}%`;
      el.style.bottom = `${12 + Math.floor(jaNoCard / 4) * 30}%`;
      el.style.setProperty('--drop-x', '-50%');
    } else {
      el.style.setProperty('--drop-x', `${-115 - jaNoCard * 95}%`);
    }
    if (iconSvgPath) {
      const img = document.createElement('img');
      img.src = iconSvgPath;
      img.alt = nome;
      img.draggable = false;
      el.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'drop-emoji';
      span.textContent = DROP_EMOJI[itemId] || '🎁';
      el.appendChild(span);
    }
    if (quantidade > 1) {
      const badge = document.createElement('span');
      badge.className = 'drop-qtd';
      badge.textContent = `x${quantidade}`;
      el.appendChild(badge);
    }
    card.appendChild(el);

    // Pisca nos últimos 3s
    const timers = [setTimeout(() => el.classList.add('drop-acabando'), Math.max(0, restanteMs - 3000))];
    timers.push(setTimeout(() => AnimationService.removeDrop(dropId), restanteMs + 2000)); // segurança
    dropsNaTela.set(dropId, { el, card, timers });
  }

  /** Some (expirou) ou foi embolsado (sobe e mostra o que a pessoa ganhou). */
  static removeDrop(dropId, embolso) {
    const d = dropsNaTela.get(dropId);
    if (!d) return;
    d.timers.forEach(clearTimeout);
    dropsNaTela.delete(dropId);
    if (embolso) {
      d.el.classList.add('drop-pego');
      if (embolso.card) AnimationService.showFloatingText(embolso.card, embolso.texto, 'damage-heal', 1300);
      setTimeout(() => d.el.remove(), 450);
    } else {
      d.el.classList.add('drop-sumindo');
      setTimeout(() => d.el.remove(), 400);
    }
  }

  /** Volume atual do jogo (o KeyboardThrower mantém atualizado). */
  static setVolume(v) {
    volumeAtual = typeof v === 'number' ? v : 0;
  }

  /** Efeito sonoro de ação: item, moeda, arma, comer, beber, acessorio, desequipar, troca, compra. */
  static sfx(nome) {
    tocarEfeito(nome);
  }

  /** Chuva de confete na tela inteira (vitória contra o chefe). */
  static confetti({ quantidade = 140, duracaoMs = 4500 } = {}) {
    if (typeof document === 'undefined') return;
    const cores = ['#ff6b6b', '#ffd43b', '#51cf66', '#339af0', '#cc5de8', '#ff922b', '#20c997', '#f06595'];
    const camada = document.createElement('div');
    camada.className = 'confete-camada';
    const largura = window.innerWidth;
    for (let i = 0; i < quantidade; i++) {
      const c = document.createElement('span');
      c.className = `confete confete-${i % 3}`;
      c.style.left = `${Math.random() * largura}px`;
      c.style.background = cores[i % cores.length];
      c.style.setProperty('--deriva', `${(Math.random() - 0.5) * 240}px`);
      c.style.setProperty('--giro', `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`);
      c.style.animationDuration = `${2.2 + Math.random() * 2}s`;
      c.style.animationDelay = `${Math.random() * 1.2}s`;
      camada.appendChild(c);
    }
    document.body.appendChild(camada);
    setTimeout(() => camada.remove(), duracaoMs + 1500);
  }

  static beep(volume, freq) {
    playBeep(volume, freq);
  }

  /** O minerador explodiu: estouro nele e no card do dono (o minerador pisca e some via CSS). */
  static explodeMiner(minerEl, cardEl, volume) {
    if (minerEl) {
      AnimationService.showExplosionInAvatar(minerEl, null, volume);
      AnimationService.showFloatingText(minerEl, 'BOOM! 💥', 'damage-critical', 1400);
    }
    if (cardEl) {
      AnimationService.makeAvatarShake(cardEl);
      setTimeout(() => AnimationService.showExplosionInAvatar(cardEl, null, volume), 120);
    }
  }

  /**
   * Texto flutuante em cima de qualquer elemento (ex.: botão do inventário), sem depender
   * do elemento ter position/overflow: usa posição fixa na tela.
   */
  static showFloatingTextOver(element, text, extraClass = '', durationMs = 1200) {
    if (!element) return;
    const r = element.getBoundingClientRect();
    const el = document.createElement('div');
    el.textContent = text;
    el.className = `damage-number floating-text ${extraClass}`;
    el.style.position = 'fixed';
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top - 22}px`;
    el.style.pointerEvents = 'none';
    el.style.zIndex = '2000';
    el.style.whiteSpace = 'nowrap';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), durationMs);
  }

  /** Cura (ex.: comeu um xis). */
  static showHeal(element, amount, emoji = '🍔') {
    AnimationService.showFloatingText(element, `+${amount} ${emoji}`, 'damage-heal', 1300);
  }

  /** Contra-ataque do carimbo: o carimbo cai no card e deixa a marca INDEFERIDO. */
  static showCarimbo(element, volume) {
    if (!element) return;
    const stamp = document.createElement('img');
    stamp.src = '/images/game-objects/carimbo.svg';
    stamp.className = 'carimbo-drop';
    element.appendChild(stamp);

    setTimeout(() => {
      stamp.remove();
      playStampSound(volume);
      AnimationService.makeAvatarShake(element);
      const mark = document.createElement('div');
      mark.textContent = 'INDEFERIDO';
      mark.className = 'carimbo-mark';
      element.appendChild(mark);
      setTimeout(() => mark.remove(), 1800);
    }, 300);
  }

  /**
   * Note 7 caindo no card da vítima. Para a própria vítima o celular é clicável (desarma).
   */
  static plantBomb(element, { bombId, isMine, fuseMs = 3000, vida = 25, vidaMax = 25, volume }) {
    if (!element || bombasNaTela.has(bombId)) return;

    const wrapper = document.createElement('div');
    wrapper.className = `note7-bomb${isMine ? ' note7-mine' : ''}`;
    wrapper.dataset.bombId = bombId;
    const img = document.createElement('img');
    img.src = '/images/game-objects/note7.svg';
    img.alt = 'Celular pegando fogo';
    const contador = document.createElement('span');
    contador.className = 'note7-countdown';
    // Barrinha de vida do celular
    const barra = document.createElement('div');
    barra.className = 'note7-life';
    const preenchimento = document.createElement('div');
    preenchimento.className = 'note7-life-fill';
    preenchimento.style.width = `${Math.max(0, (vida / vidaMax) * 100)}%`;
    barra.appendChild(preenchimento);
    wrapper.appendChild(img);
    wrapper.appendChild(contador);
    wrapper.appendChild(barra);
    if (isMine) {
      const dica = document.createElement('span');
      dica.className = 'note7-hint';
      dica.textContent = 'DESTRÓI ELE!';
      wrapper.appendChild(dica);
    }

    const fim = Date.now() + fuseMs;
    const atualizar = () => {
      const restante = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
      contador.textContent = restante > 0 ? `${restante}` : '💥';
    };
    atualizar();
    let ultimoBip = 0;
    const intervalo = setInterval(() => {
      atualizar();
      const restanteMs = fim - Date.now();
      // Bipa mais rápido conforme o pavio acaba (só para a vítima, para não ensurdecer a sala)
      const passo = restanteMs > 1500 ? 500 : 200;
      if (isMine && Date.now() - ultimoBip > passo) {
        ultimoBip = Date.now();
        playBeep(volume, restanteMs > 1500 ? 1000 : 1500);
      }
    }, 100);

    // O celular fica fora do card (à esquerda): não pode ser cortado
    if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
    element.style.overflow = 'visible';
    element.appendChild(wrapper);
    bombasNaTela.set(bombId, { wrapper, intervalo, card: element, preenchimento });

    // Segurança: some sozinho se nenhum evento chegar
    setTimeout(() => AnimationService.removeBomb(bombId), fuseMs + 3000);
  }

  static removeBomb(bombId) {
    const b = bombasNaTela.get(bombId);
    if (!b) return null;
    clearInterval(b.intervalo);
    bombasNaTela.delete(bombId);
    return b;
  }

  /** Pancada no celular: atualiza a barrinha, treme e mostra o dano. */
  static hitBomb(bombId, { damage, vida, vidaMax, isCritical, volume }) {
    const b = bombasNaTela.get(bombId);
    if (!b) return;
    b.preenchimento.style.width = `${Math.max(0, (vida / vidaMax) * 100)}%`;
    b.wrapper.classList.remove('note7-hit');
    void b.wrapper.offsetWidth; // reinicia a animação
    b.wrapper.classList.add('note7-hit');
    // Mesmo impacto de quando acerta um card: explosãozinha + som
    AnimationService.showExplosionInAvatar(b.wrapper, null, volume);
    AnimationService.showFloatingText(b.wrapper, isCritical ? `CRÍTICO! -${damage}` : `-${damage}`, `note7-damage${isCritical ? ' damage-critical' : ''}`, 800);
  }

  /** Vítima destruiu o celular a tempo: ele sai voando. */
  static defuseBomb(bombId) {
    const b = AnimationService.removeBomb(bombId);
    if (!b) return;
    b.wrapper.classList.add('note7-thrown');
    AnimationService.showFloatingText(b.card, 'Celular destruído! 😅', 'damage-dodge', 1200);
    setTimeout(() => b.wrapper.remove(), 600);
  }

  /** Pavio acabou: explosão. */
  static explodeBomb(bombId, volume) {
    const b = AnimationService.removeBomb(bombId);
    if (!b) return;
    b.wrapper.remove();
    AnimationService.makeAvatarShake(b.card);
    AnimationService.showExplosionInAvatar(b.card, null, volume);
  }

  /**
   * Feedback quando um jogador morto tenta arremessar: som de negação,
   * mensagem flutuante sobre o alvo e tremida no próprio avatar.
   */
  static showDeadAttackFeedback(targetElement, ownElement, volume) {
    playDeniedSound(volume);

    if (targetElement) {
      const msg = document.createElement('div');
      msg.textContent = '💀 Morto não joga teclado!';
      msg.className = 'damage-number damage-dead-attack';
      msg.style.position = 'absolute';
      msg.style.left = '50%';
      msg.style.top = '10%';
      msg.style.pointerEvents = 'none';
      msg.style.zIndex = '10';
      msg.style.whiteSpace = 'nowrap';
      targetElement.appendChild(msg);
      setTimeout(() => msg.remove(), 1200);
    }

    if (ownElement) AnimationService.makeAvatarShake(ownElement);
  }

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

    if (isDodge) { 
      damageNumber.textContent = 'Esquivou! 💨';
      damageNumber.className = 'damage-number damage-dodge';
    } else if (isCritical) { 
      damageNumber.textContent = 'CRITICAL!';
      damageNumber.className = 'damage-number damage-critical';
      displayTime = 1200;
    } else { // Dano normal (incluindo 0)
      damageNumber.textContent = damage === 0 ? '0' : `-${damage}`;
      damageNumber.className = 'damage-number';
      if (damage === 0) {
          damageNumber.classList.add('damage-zero'); // Opcional: classe para estilizar o zero
      }
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
  static createFlyingKeyboard(element, direction, imgSrc = '/images/game-objects/keyboard.svg', sizePx = 35, durationMs = 400) {
    if (!element) return null;

    const animationId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const keyboardDiv = document.createElement('div');
    keyboardDiv.id = `keyboard-${animationId}`;
    keyboardDiv.className = `keyboard-flying keyboard-flying-${direction}`;
    keyboardDiv.style.width = `${sizePx}px`;
    keyboardDiv.style.height = `${sizePx}px`;
    keyboardDiv.style.animationDuration = `${durationMs}ms`;

    const keyboardImg = document.createElement('img');
    keyboardImg.src = imgSrc;
    keyboardImg.alt = 'Teclado';
    keyboardImg.className = 'keyboard-image';
    
    keyboardDiv.appendChild(keyboardImg);
    element.appendChild(keyboardDiv);

    return animationId;
  }

  /**
   * Cria e mostra um teclado ricocheteando
   */
  static createRicochetKeyboard(element, direction, imgSrc = '/images/game-objects/keyboard.svg', sizePx = 35) {
    if (!element) return;

    const ricochetId = `ricochet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const rect = element.getBoundingClientRect();

    const ricochetDiv = document.createElement('div');
    ricochetDiv.id = ricochetId;
    ricochetDiv.className = `keyboard-ricochet keyboard-ricochet-${direction}`;

    ricochetDiv.style.position = 'fixed';
    ricochetDiv.style.width = `${sizePx}px`;
    ricochetDiv.style.height = `${sizePx}px`;
    ricochetDiv.style.left = `${rect.left + rect.width/2 - sizePx/2}px`;
    ricochetDiv.style.top = `${rect.top + rect.height/2 - sizePx/2}px`;

    const ricochetImg = document.createElement('img');
    ricochetImg.src = imgSrc;
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