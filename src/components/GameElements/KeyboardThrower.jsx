import { useEffect, useRef } from 'react';
import { useLifeBar } from '@/contexts/LifeBarContext';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { ITEMS_DATA, KEYBOARD_ID } from '@/constants/itemsData';
import { AnimationService } from '@/services/AnimationService';
import '@/styles/animations.css';

/**
 * Controla os arremessos (todas as armas) e os efeitos de jogo que chegam pelo socket:
 * carimbo, Note 7, xis.
 *
 * O servidor é quem valida o arremesso e resolve o dano ao fim do tempo de voo;
 * aqui só animamos (o atacante anima na hora, os outros quando o servidor avisa).
 */
export function KeyboardThrower({
  enabled = false,
  socket,
  codigoSala,
  currentUser,
  volume
}) {
  const { showLifeBarTemporarily } = useLifeBar();

  // Refs com o valor mais recente (os listeners são registrados uma vez só)
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  AnimationService.setVolume(volume); // pros sons das ações (arma, acessório, lanche...)
  const meuNomeRef = useRef(currentUser.nome);
  meuNomeRef.current = currentUser.nome;
  const meuIdRef = useRef(currentUser.id);
  meuIdRef.current = currentUser.id;
  const currentLifeRef = useRef(currentUser.life);
  currentLifeRef.current = currentUser.life;
  const armaRef = useRef(KEYBOARD_ID);
  armaRef.current = currentUser.selectedWeapon || KEYBOARD_ID;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const ammoRef = useRef({});
  ammoRef.current = currentUser.ammo || {};

  const ultimoArremessoRef = useRef(0);
  const ultimoAvisoRef = useRef(0);
  const metralhadoraRef = useRef(null); // intervalo do disparo automático
  // Projéteis em voo por alvo: o impacto (ou a esquiva) só é desenhado quando o servidor responde
  const emVooRef = useRef(new Map()); // alvoId -> [{ weaponId, direcao, ts }]

  const getCard = (id) => document.querySelector(`.carta-participante[data-id="${id}"]`);
  const getMinerador = (id) => document.querySelector(`.minerador-alvo[data-owner-id="${id}"]`);
  const getChefe = () => document.querySelector('.chefe-eproc:not(.chefe-saindo)');

  // Anima o voo + impacto de um arremesso no card alvo
  const animarArremesso = (element, alvoId, weaponId, chaveFila = alvoId) => {
    if (!element) return;
    const arma = ITEMS_DATA[weaponId] || ITEMS_DATA[KEYBOARD_ID];
    const voo = arma.flightMs || 400;
    const tamanho = arma.projectileSize || 35;
    const direcao = Math.random() < 0.5 ? 'left' : 'right';

    // Só força relative se o elemento estiver estático (minerador e EPROC já são absolute via CSS)
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
    element.style.overflow = 'visible';

    const projetilId = AnimationService.createFlyingKeyboard(element, direcao, arma.projectileSvg, tamanho, voo);
    if (element.classList.contains('minerador-alvo') || element.classList.contains('chefe-eproc')) {
      const projetil = document.getElementById(`keyboard-${projetilId}`);
      if (projetil) {
        projetil.style.left = `calc(50% - ${tamanho / 2}px)`;
        projetil.style.top = `calc(50% - ${tamanho / 2}px)`;
      }
    }
    const fila = emVooRef.current.get(chaveFila) || [];
    fila.push({ weaponId, direcao, ts: Date.now() });
    emVooRef.current.set(chaveFila, fila.slice(-10));

    setTimeout(() => document.getElementById(`keyboard-${projetilId}`)?.remove(), voo);
  };

  // Resultado do servidor para um arremesso: impacto de verdade ou esquiva
  const desenharResultado = ({ targetId, isDodge }, element = getCard(targetId), chaveFila = targetId) => {
    if (!element) return;
    const fila = (emVooRef.current.get(chaveFila) || []).filter(v => Date.now() - v.ts < 3000);
    const voo = fila.shift();
    emVooRef.current.set(chaveFila, fila);
    const arma = ITEMS_DATA[voo?.weaponId] || ITEMS_DATA[KEYBOARD_ID];
    const direcao = voo?.direcao || 'left';
    const tamanho = arma.projectileSize || 35;

    if (isDodge) {
      AnimationService.showDodge(element, direcao, arma.projectileSvg, tamanho, volumeRef.current);
      return;
    }
    AnimationService.makeAvatarShake(element);
    AnimationService.showExplosionInAvatar(element, targetId, volumeRef.current);
    AnimationService.createRicochetKeyboard(element, direcao, arma.projectileSvg, tamanho);
    if (chaveFila === targetId) showLifeBarTemporarily(targetId);
  };

  const avisar = (targetElement, fn) => {
    const agora = Date.now();
    if (agora - ultimoAvisoRef.current < 800) return;
    ultimoAvisoRef.current = agora;
    fn();
  };

  // Tenta arremessar no card (ou no Note 7 que caiu do meu lado).
  // Retorna false se não deu (morto, sem munição, alvo inválido).
  const tentarArremessar = (targetElement) => {
    if (!targetElement || !document.body.contains(targetElement)) return false;
    const bombId = targetElement.dataset?.bombId || null;
    const ehChefe = targetElement.classList.contains('chefe-eproc');
    const donoMinerador = targetElement.dataset?.ownerId || null;
    const targetId = (bombId || ehChefe) ? null : (donoMinerador || targetElement.getAttribute('data-id'));
    if (!bombId && !ehChefe && (!targetId || targetId === meuIdRef.current)) return false;
    // Minerador já quebrado: não gasta arremesso/munição
    if (donoMinerador && targetElement.classList.contains('minerador-quebrado')) {
      avisar(targetElement, () => AnimationService.showFloatingText(targetElement, 'Já tá quebrado 💀', 'damage-dead-attack', 900));
      return true;
    }

    // Morto não ataca (o servidor também bloqueia)
    if (typeof currentLifeRef.current === 'number' && currentLifeRef.current <= GAME_CONFIG.LIFE.MIN) {
      avisar(targetElement, () => {
        const ownElement = getCard(meuIdRef.current);
        AnimationService.showDeadAttackFeedback(targetElement, ownElement, volumeRef.current);
      });
      return false;
    }

    const weaponId = armaRef.current;
    const arma = ITEMS_DATA[weaponId] || ITEMS_DATA[KEYBOARD_ID];
    const agora = Date.now();

    // Arma com munição vazia (o servidor já troca pro teclado, isso cobre a janela até a atualização chegar)
    if (arma.ammo && (ammoRef.current[weaponId] || 0) <= 0) {
      avisar(targetElement, () => {
        AnimationService.showFloatingText(targetElement, '📭 Acabou! Faça carga no cartório', 'damage-dead-attack', 1200);
      });
      return false;
    }
    // Desconta localmente já (a metralhadora/cliques rápidos não esperam o servidor)
    const descontarMunicao = () => {
      if (arma.ammo) ammoRef.current = { ...ammoRef.current, [weaponId]: (ammoRef.current[weaponId] || 0) - 1 };
    };
    if (agora - ultimoArremessoRef.current < (arma.cooldownMs || 0)) {
      // Armas lentas avisam que estão recarregando
      if ((arma.cooldownMs || 0) >= 1000) {
        avisar(targetElement, () => {
          const restante = Math.ceil(((arma.cooldownMs || 0) - (agora - ultimoArremessoRef.current)) / 1000);
          AnimationService.showFloatingText(targetElement, `⏳ recarregando (${restante}s)`, 'damage-dead-attack', 900);
        });
      }
      return true; // continua "segurando" mas sem disparar
    }
    ultimoArremessoRef.current = agora;
    descontarMunicao();

    if (bombId) {
      // Voo curto (200ms, igual ao servidor) até o celular; o impacto vem pelo 'bombHit'
      const vooBomba = 200;
      const direcao = Math.random() < 0.5 ? 'left' : 'right';
      const tamanho = Math.round((arma.projectileSize || 35) * 0.8);
      const projetilId = AnimationService.createFlyingKeyboard(targetElement, direcao, arma.projectileSvg, tamanho, vooBomba);
      // Sem posição explícita ele cai depois da imagem (no "pé" do celular): centraliza
      const projetil = document.getElementById(`keyboard-${projetilId}`);
      if (projetil) {
        projetil.style.left = `calc(50% - ${tamanho / 2}px)`;
        projetil.style.top = `calc(50% - ${tamanho / 2}px)`;
      }
      setTimeout(() => document.getElementById(`keyboard-${projetilId}`)?.remove(), vooBomba);
      socket?.emit('throwObject', { codigo: codigoSala, bombId });
      return true;
    }
    if (ehChefe) {
      animarArremesso(targetElement, 'eproc', weaponId, 'chefe');
      socket?.emit('throwObject', { codigo: codigoSala, alvoChefe: true });
      return true;
    }
    if (donoMinerador) {
      animarArremesso(targetElement, targetId, weaponId, `m:${targetId}`);
      socket?.emit('throwObject', { codigo: codigoSala, toUser: targetId, alvoMinerador: true });
      return true;
    }
    animarArremesso(targetElement, targetId, weaponId);
    socket?.emit('throwObject', { codigo: codigoSala, toUser: targetId });
    return true;
  };

  const pararMetralhadora = () => {
    if (metralhadoraRef.current) {
      clearInterval(metralhadoraRef.current);
      metralhadoraRef.current = null;
    }
  };

  // ---- Eventos vindos do servidor ----
  useEffect(() => {
    if (!socket) return;

    const onThrow = ({ fromUser, toUser, objectType, alvoMinerador, alvoChefe }) => {
      if (fromUser === meuIdRef.current) return; // o atacante já animou localmente
      if (alvoChefe) { const el = getChefe(); if (el) animarArremesso(el, 'eproc', objectType, 'chefe'); return; }
      if (alvoMinerador) animarArremesso(getMinerador(toUser), toUser, objectType, `m:${toUser}`);
      else animarArremesso(getCard(toUser), toUser, objectType);
    };

    // Resultado de um ataque no minerador
    const onMinerHit = ({ ownerId, damage, isCritical, isDodge, broken }) => {
      const el = getMinerador(ownerId);
      if (!el) return;
      if (broken) {
        emVooRef.current.get(`m:${ownerId}`)?.shift();
        AnimationService.showFloatingText(el, 'Já tá quebrado 💀', 'damage-dead-attack', 900);
        return;
      }
      desenharResultado({ targetId: ownerId, isDodge }, el, `m:${ownerId}`);
      AnimationService.showDamageNumber(el, damage, isCritical, isDodge);
    };
    // Contagem da explosão: o dono escuta o bipe acelerando
    let bipeMinerador = null;
    const pararBipe = () => { if (bipeMinerador) { clearInterval(bipeMinerador); bipeMinerador = null; } };
    const onMinerCountdown = ({ ownerId, fuseMs }) => {
      if (ownerId !== meuIdRef.current) return;
      pararBipe();
      const fim = Date.now() + fuseMs;
      let ultimo = 0;
      bipeMinerador = setInterval(() => {
        const resta = fim - Date.now();
        if (resta <= 0) return pararBipe();
        const passo = resta > 2500 ? 500 : 200;
        if (Date.now() - ultimo >= passo) {
          ultimo = Date.now();
          AnimationService.beep(volumeRef.current, resta > 2500 ? 900 : 1400);
        }
      }, 50);
    };
    const onMinerCountdownCancelled = ({ ownerId }) => {
      if (ownerId === meuIdRef.current) { pararBipe(); AnimationService.sfx('alivio'); }
      AnimationService.showFloatingText(getMinerador(ownerId), 'Ufa! 😅', 'damage-dodge', 1200);
    };
    const onMinerExploded = ({ ownerId }) => {
      if (ownerId === meuIdRef.current) pararBipe();
      AnimationService.explodeMiner(getMinerador(ownerId), getCard(ownerId), volumeRef.current);
    };

    // ---- Chefe EPROC ----
    const onBossHit = ({ damage, isCritical, blocked }) => {
      const el = getChefe();
      if (!el) return;
      if (blocked) {
        emVooRef.current.get('chefe')?.shift();
        AnimationService.showFloatingText(el, blocked === 'foradoar' ? '🔌 Fora do ar' : '⏳ Carregando...', 'damage-dodge', 700);
        return;
      }
      // Tremida/explosão no "miolo" (o lado de fora está andando pela mesa)
      desenharResultado({ targetId: 'eproc', isDodge: false }, el.querySelector('.chefe-inner') || el, 'chefe');
      AnimationService.showDamageNumber(el, damage, false, false);
      if (isCritical) AnimationService.showFloatingText(el, 'CRÍTICO x2!', 'damage-critical', 900);
    };
    const onBossAttack = ({ tipo, alvos }) => {
      const texto = tipo === 'sessao' ? '⌛ Sessão expirada!' : '💥 Erro 500';
      alvos.forEach((id, i) => setTimeout(() => {
        const card = getCard(id);
        if (!card) return;
        AnimationService.makeAvatarShake(card);
        AnimationService.showExplosionInAvatar(card, id, i === 0 ? volumeRef.current : 0);
        AnimationService.showFloatingText(card, texto, 'damage-critical', 1300);
        showLifeBarTemporarily(id);
      }, i * 60));
      const el = getChefe()?.querySelector('.chefe-inner');
      if (el) { el.classList.remove('chefe-atacando'); void el.offsetWidth; el.classList.add('chefe-atacando'); }
    };
    const onBossDefeated = () => {
      const el = getChefe() || document.querySelector('.chefe-eproc');
      if (el) AnimationService.showExplosionInAvatar(el, null, volumeRef.current);
      // Festa! Confete na tela de todo mundo + fanfarra
      setTimeout(() => {
        AnimationService.confetti();
        AnimationService.sfx('vitoria');
      }, 350);
    };

    // ---- Itens caídos ----
    const onDropSpawned = (d) => {
      const item = ITEMS_DATA[d.itemId];
      if (!item) return;
      const origem = d.origemId === 'eproc' ? document.querySelector('.mesa-planning') : getCard(d.origemId);
      AnimationService.spawnDrop(origem, { ...d, iconSvgPath: item.iconSvgPath, nome: item.name, naMesa: d.origemId === 'eproc' });
    };
    const onDropExpired = ({ dropId }) => AnimationService.removeDrop(dropId);
    const onDropPicked = ({ dropId, pickerId, quantidade, moedas }) => {
      if (pickerId === meuIdRef.current) {
        if (quantidade > 0) AnimationService.sfx('item');
        if (moedas > 0) setTimeout(() => AnimationService.sfx('moeda'), quantidade > 0 ? 300 : 0);
      }
      const partes = [];
      if (quantidade > 0) partes.push('Embolsou! 🎁');
      if (moedas > 0) partes.push(`+${moedas} 🪙`);
      AnimationService.removeDrop(dropId, { card: getCard(pickerId), texto: partes.join(' ') });
    };

    const onMinerRepaired = ({ ownerId }) => {
      if (ownerId === meuIdRef.current) AnimationService.sfx('conserto');
      AnimationService.showFloatingText(getMinerador(ownerId), '+2 🔧', 'damage-heal', 700);
    };

    // Carimbo e Note 7 têm animação própria; aqui só os arremessos
    const onDamage = (data) => {
      // Enjoo: mostra a barra de vida de quem está passando mal pra todo mundo
      if (data.isPoison) { showLifeBarTemporarily(data.targetId); return; }
      if (data.isCounter) return;
      desenharResultado(data);
    };

    const onCounter = ({ type, toId }) => {
      if (type === 'carimbo') AnimationService.showCarimbo(getCard(toId), volumeRef.current);
    };

    const onBombPlanted = ({ bombId, victimId, fuseMs, vida, vidaMax }) => {
      AnimationService.plantBomb(getCard(victimId), {
        bombId,
        fuseMs,
        vida,
        vidaMax,
        isMine: victimId === meuIdRef.current,
        volume: volumeRef.current,
      });
    };
    const onBombHit = (dados) => AnimationService.hitBomb(dados.bombId, { ...dados, volume: volumeRef.current });

    const onBombDefused = ({ bombId }) => AnimationService.defuseBomb(bombId);
    const onBombExploded = ({ bombId }) => AnimationService.explodeBomb(bombId, volumeRef.current);

    const onItemUsed = ({ userId, itemId, heal, spoiled }) => {
      const card = getCard(userId);
      if (userId === meuIdRef.current) AnimationService.sfx(itemId === 'garrafa_agua' ? 'beber' : 'comer');
      if (spoiled) {
        AnimationService.showFloatingText(card, '🤢 Maionese estragada!', 'damage-poison', 1800);
      } else if (card && heal > 0) {
        AnimationService.showHeal(card, heal, itemId === 'garrafa_agua' ? '💧' : '🍔');
      }
      showLifeBarTemporarily(userId);
    };
    const onPoisonCured = ({ userId, byWater }) => {
      AnimationService.showFloatingText(getCard(userId), byWater ? '💧 Curou o enjoo!' : 'Passou o enjoo 😮‍💨', 'damage-heal', 1500);
    };

    // Cartório: aviso sobre o card de quem foi fazer carga (todo mundo vê)
    const onReloadStarted = ({ userId, eprocFora, durationMs }) => {
      const texto = eprocFora
        ? `⚠️ Eproc tá fora! (${Math.round(durationMs / 1000)}s)`
        : '🏛️ Fazendo carga no cartório...';
      AnimationService.showFloatingText(getCard(userId), texto, eprocFora ? 'damage-critical' : 'damage-dodge', 2200);
    };
    const onReloadDone = ({ userId }) => {
      AnimationService.showFloatingText(getCard(userId), '📜 Carga completa!', 'damage-heal', 1800);
    };

    socket.on('throwObject', onThrow);
    socket.on('minerHit', onMinerHit);
    socket.on('minerRepaired', onMinerRepaired);
    socket.on('dropSpawned', onDropSpawned);
    const onItemPurchased = ({ playerName }) => { if (playerName === meuNomeRef.current) AnimationService.sfx('compra'); };
    socket.on('itemPurchased', onItemPurchased);
    socket.on('bossHit', onBossHit);
    socket.on('bossAttack', onBossAttack);
    socket.on('bossDefeated', onBossDefeated);
    socket.on('dropExpired', onDropExpired);
    socket.on('dropPicked', onDropPicked);
    socket.on('minerCountdown', onMinerCountdown);
    socket.on('minerCountdownCancelled', onMinerCountdownCancelled);
    socket.on('minerExploded', onMinerExploded);
    socket.on('damageReceived', onDamage);
    socket.on('reloadStarted', onReloadStarted);
    socket.on('reloadDone', onReloadDone);
    socket.on('counterAttack', onCounter);
    socket.on('bombPlanted', onBombPlanted);
    socket.on('bombDefused', onBombDefused);
    socket.on('bombHit', onBombHit);
    socket.on('bombExploded', onBombExploded);
    socket.on('itemUsed', onItemUsed);
    socket.on('poisonCured', onPoisonCured);

    return () => {
      socket.off('throwObject', onThrow);
      socket.off('minerHit', onMinerHit);
      socket.off('minerRepaired', onMinerRepaired);
      socket.off('dropSpawned', onDropSpawned);
      socket.off('itemPurchased', onItemPurchased);
      socket.off('bossHit', onBossHit);
      socket.off('bossAttack', onBossAttack);
      socket.off('bossDefeated', onBossDefeated);
      socket.off('dropExpired', onDropExpired);
      socket.off('dropPicked', onDropPicked);
      socket.off('minerCountdown', onMinerCountdown);
      socket.off('minerCountdownCancelled', onMinerCountdownCancelled);
      socket.off('minerExploded', onMinerExploded);
      pararBipe();
      socket.off('damageReceived', onDamage);
      socket.off('reloadStarted', onReloadStarted);
      socket.off('reloadDone', onReloadDone);
      socket.off('counterAttack', onCounter);
      socket.off('bombPlanted', onBombPlanted);
      socket.off('bombDefused', onBombDefused);
      socket.off('bombHit', onBombHit);
      socket.off('bombExploded', onBombExploded);
      socket.off('itemUsed', onItemUsed);
      socket.off('poisonCured', onPoisonCured);
    };
  }, [socket, codigoSala]);

  // ---- Entrada do jogador (clique / segurar) ----
  useEffect(() => {
    if (!enabled) return;

    const armaAtualEhAutomatica = () => !!ITEMS_DATA[armaRef.current]?.autoFire;
    // Alvo pela posição real do dedo/mouse. No celular o navegador "ajusta" o toque pro elemento
    // que ele acha mais clicável (e o card ganhava do minerador), então não confiamos só no e.target.
    // Prioridade: Note 7 que caiu do meu lado > minerador > card.
    const dentro = (el, x, y) => {
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const acharAlvo = (e) => {
      const x = e.clientX, y = e.clientY;
      const noPonto = (sel) => [...document.querySelectorAll(sel)].find(el => dentro(el, x, y));
      return noPonto('.drop-item:not(.drop-pego):not(.drop-sumindo)') || noPonto('.note7-mine') || noPonto('.chefe-eproc:not(.chefe-saindo)')
        || noPonto('.minerador-alvo') || e.target.closest?.('.carta-participante');
    };
    // Clicou num item caído: tenta pegar (o servidor decide quem foi o primeiro)
    const pegarDrop = (el) => {
      if (typeof currentLifeRef.current === 'number' && currentLifeRef.current <= GAME_CONFIG.LIFE.MIN) {
        avisar(el, () => AnimationService.showFloatingText(el, '💀 Morto não junta nada!', 'damage-dead-attack', 1000));
        return;
      }
      socket?.emit('pickupDrop', { codigo: codigoSala, dropId: el.dataset.dropId });
    };
    const meuMinerador = (e) => {
      const alvo = acharAlvo(e);
      return alvo?.classList.contains('minerador-meu') ? alvo : null;
    };
    // Toque: tudo é resolvido no pointerdown; o click "ajustado" que vem depois é ignorado
    let ignorarCliqueAte = 0;

    // Dono clicou no próprio minerador: conserta (independe da arma)
    const consertar = (el) => {
      if (typeof currentLifeRef.current === 'number' && currentLifeRef.current <= GAME_CONFIG.LIFE.MIN) {
        avisar(el, () => AnimationService.showFloatingText(el, '💀 Morto não conserta!', 'damage-dead-attack', 1000));
        return;
      }
      socket?.emit('repairMiner', { codigo: codigoSala });
    };

    // Armas normais: um arremesso por clique
    const handleClick = (e) => {
      if (Date.now() < ignorarCliqueAte) return;
      const alvoClique = acharAlvo(e);
      if (alvoClique?.classList.contains('drop-item')) { e.preventDefault(); pegarDrop(alvoClique); return; }
      const meu = meuMinerador(e);
      if (meu) { e.preventDefault(); consertar(meu); return; }
      if (!enabledRef.current || armaAtualEhAutomatica()) return;
      const card = acharAlvo(e);
      if (!card) return;
      e.preventDefault();
      tentarArremessar(card);
    };

    // Metralhadora: dispara ao apertar e continua enquanto segurar
    const handlePointerDown = (e) => {
      const toque = e.pointerType === 'touch' || e.pointerType === 'pen';
      if (toque) {
        const alvo = acharAlvo(e);
        if (!alvo) return;
        ignorarCliqueAte = Date.now() + 700;
        e.preventDefault();
        if (alvo.classList.contains('drop-item')) { pegarDrop(alvo); return; }
        if (alvo.classList.contains('minerador-meu')) { consertar(alvo); return; }
        if (!enabledRef.current) return;
        // Arma normal no toque: um arremesso por toque
        if (!armaAtualEhAutomatica()) { tentarArremessar(alvo); return; }
      }
      if (!enabledRef.current || !armaAtualEhAutomatica() || meuMinerador(e)) return;
      const card = acharAlvo(e);
      if (!card || card.classList.contains('drop-item')) return;
      e.preventDefault();
      pararMetralhadora();
      if (!tentarArremessar(card)) return;
      const cadencia = ITEMS_DATA[armaRef.current]?.cooldownMs || 150;
      metralhadoraRef.current = setInterval(() => {
        // Trocou de arma no meio? Para.
        if (!armaAtualEhAutomatica() || !document.body.contains(card)) return pararMetralhadora();
        if (!tentarArremessar(card)) pararMetralhadora();
      }, cadencia);
    };

    const preventSelection = (e) => {
      if (e.target?.closest?.('.carta-participante')) e.preventDefault();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', pararMetralhadora);
    document.addEventListener('pointercancel', pararMetralhadora);
    window.addEventListener('blur', pararMetralhadora);
    document.addEventListener('mousedown', preventSelection);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('contextmenu', preventSelection);

    return () => {
      pararMetralhadora();
      document.removeEventListener('click', handleClick);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', pararMetralhadora);
      document.removeEventListener('pointercancel', pararMetralhadora);
      window.removeEventListener('blur', pararMetralhadora);
      document.removeEventListener('mousedown', preventSelection);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('contextmenu', preventSelection);
    };
  }, [enabled, socket, codigoSala]);

  return null;
}
