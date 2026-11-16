const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { GAME_CONFIG } = require('./constants/gameConfig');
const { ITEMS_DATA, KEYBOARD_ID, MANIFESTO_ID, MEDALHA_ID, BITCOIN_MINER_ID } = require('./constants/itemsData');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Define o título padrão para kills
const DEFAULT_KILL_TITLE = 'Eliminação!';

const MAX_KILL_MESSAGE_LENGTH = 50; // Garante que o backend use o mesmo limite
const MAX_SIGNATURES = 3; // Limite de assinaturas

// Helper para verificar quais itens são acessórios
const isAccessory = (itemId) => itemId && ITEMS_DATA[itemId]?.type === 'accessory';

/**
 * Rola dados baseado na notação NdS (ex: '1d6', '2d4').
 * Retorna a soma dos resultados ou 0 se a notação for inválida.
 */
function rollDice(diceString) {
  if (!diceString || typeof diceString !== 'string') {
    return 0;
  }
  const match = diceString.toLowerCase().match(/^(\d+)d(\d+)$/);
  if (!match) {
    return 0; // Retorna 0 se a notação não for 'NdS'
  }

  const numDice = parseInt(match[1], 10);
  const numSides = parseInt(match[2], 10);

  if (isNaN(numDice) || isNaN(numSides) || numDice <= 0 || numSides <= 0) {
    return 0; // Dados inválidos
  }

  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * numSides) + 1;
  }
  // console.log(`[DiceRoller] Rolled ${diceString}: ${total}`); // Log opcional
  return total;
}

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Gerenciamento de salas
  const salas = new Map();

  // Tempo que um participante desconectado fica "guardado" esperando reconexão (F5, queda de rede)
  const RECONNECT_GRACE_MS = 60 * 1000;
  // Timers de remoção pendentes, chave `${codigo}:${socketId}` (fora do participante p/ não serializar)
  const remocoesPendentes = new Map();

  // Campos que nunca devem ir para os outros clientes
  const CAMPOS_PRIVADOS = ['ultimoConserto', 'token', 'tabId', 'proximaMineracao', 'ultimoArremesso'];

  function sanitizarParticipante(p, esconderVoto) {
    const copia = { ...p };
    for (const campo of CAMPOS_PRIVADOS) delete copia[campo];
    if (esconderVoto) copia.valorVotado = null;
    if (copia.minerador?.contagemFim) {
      const { contagemFim, ...resto } = copia.minerador;
      copia.minerador = { ...resto, contagemRestanteMs: Math.max(0, contagemFim - Date.now()) };
    }
    if (copia.recargas) {
      const agora = Date.now();
      copia.recargas = Object.fromEntries(Object.entries(copia.recargas).map(([id, r]) => [
        id, { restanteMs: Math.max(0, r.fimEm - agora), duracaoMs: r.duracaoMs, eprocFora: r.eprocFora },
      ]));
    }
    return copia;
  }

  /**
   * Envia a lista de participantes para a sala.
   * Antes da revelação, cada cliente só recebe o PRÓPRIO valorVotado (os outros vêm null),
   * para ninguém espiar os votos pelo DevTools.
   */
  function emitirParticipantes(codigo) {
    const sala = salas.get(codigo);
    if (!sala) return;
    const lista = Array.from(sala.participantes.values());

    if (sala.revelarVotos) {
      io.to(codigo).emit('atualizarParticipantes', lista.map(p => sanitizarParticipante(p, false)));
      return;
    }

    for (const destinatario of lista) {
      if (destinatario.desconectado) continue;
      const visao = lista.map(p => sanitizarParticipante(p, p.id !== destinatario.id));
      io.to(destinatario.id).emit('atualizarParticipantes', visao);
    }
  }

  function removerParticipanteDefinitivo(codigo, socketId) {
    remocoesPendentes.delete(`${codigo}:${socketId}`);
    const sala = salas.get(codigo);
    if (!sala) return;
    const participante = sala.participantes.get(socketId);
    if (!participante || !participante.desconectado) return; // já reconectou

    sala.participantes.delete(socketId);
    console.log(`[${codigo}] ${participante.nome} removido após ${RECONNECT_GRACE_MS / 1000}s sem reconectar.`);

    if (sala.participantes.size === 0) {
      salas.delete(codigo);
      return;
    }

    if (participante.isModerador) {
      const novoModerador = Array.from(sala.participantes.values()).find(p => !p.desconectado)
        || sala.participantes.values().next().value;
      if (novoModerador) novoModerador.isModerador = true;
    }

    emitirParticipantes(codigo);
  }

  // Calcula e aplica a renda do Minerador para um participante (chamado pelo loop do servidor)
  function minerarPara(codigo, participante) {
    const minerData = ITEMS_DATA[BITCOIN_MINER_ID];
    if (!minerData) return;

    const pontosGeradosBase = minerData.pontosPorIntervalo || 1;
    const luckyStrikeChance = minerData.luckyStrikeChance || 0;
    const luckyStrikeReward = minerData.luckyStrikeReward || 0;
    let recompensa = pontosGeradosBase;
    let wasLuckyStrike = false;

    if (luckyStrikeChance > 0 && luckyStrikeReward > 0 && Math.random() < luckyStrikeChance) {
      recompensa = luckyStrikeReward;
      wasLuckyStrike = true;
    }

    let manifestoMultiplier = 1;
    if (participante.equippedAccessories?.includes(MANIFESTO_ID)) {
      manifestoMultiplier = ITEMS_DATA[MANIFESTO_ID]?.scoreMultiplier || 1;
      recompensa *= manifestoMultiplier;
    }

    participante.score = (participante.score || 0) + recompensa;

    if (wasLuckyStrike) {
      console.log(`[Minerador][${codigo}] *** LUCKY STRIKE! *** ${participante.nome} ganhou ${recompensa} pontos! (Base: ${luckyStrikeReward}, Multiplier: ${manifestoMultiplier})`);
      io.to(codigo).emit('luckyStrikeNotification', {
        eventId: `${Date.now()}-lucky-${participante.id}`,
        playerName: participante.nome,
        reward: recompensa,
        timestamp: Date.now()
      });
    }
  }

  // Loop do Minerador: roda no servidor, então o cliente não consegue "acelerar" a mineração
  setInterval(() => {
    const minerData = ITEMS_DATA[BITCOIN_MINER_ID];
    const intervaloBase = minerData?.intervaloGeracaoMs || 10000;
    const agora = Date.now();

    for (const [codigo, sala] of salas.entries()) {
      let mudou = false;
      for (const p of sala.participantes.values()) {
        const temMinerador = p.equippedAccessories?.includes(BITCOIN_MINER_ID);
        const quebrado = p.minerador && p.minerador.vida <= 0;
        if (!temMinerador || p.desconectado || quebrado) {
          p.proximaMineracao = null; // reinicia o ciclo ao equipar/reconectar
          continue;
        }
        // Placa de vídeo: metade do tempo
        const intervalo = intervaloBase * (p.inventory?.includes('placa_video_minerador')
          ? (ITEMS_DATA.placa_video_minerador?.minerIntervalMultiplier || 1) : 1);
        if (!p.proximaMineracao) {
          p.proximaMineracao = agora + intervalo;
          continue;
        }
        if (agora >= p.proximaMineracao) {
          p.proximaMineracao = agora + intervalo;
          minerarPara(codigo, p);
          mudou = true;
        }
      }
      if (mudou) emitirParticipantes(codigo);
    }
  }, 1000);


  // ====================== COMBATE ======================
  const VIDA_MIN = GAME_CONFIG.LIFE.MIN;
  const novoEventId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Bombas (Galaxy Note 7) ativas: bombId -> { codigo, vitimaId, donoId, itemId, timer }
  const bombas = new Map();

  function multiplicadorScore(p) {
    if (p.inventory?.includes(MANIFESTO_ID)) return ITEMS_DATA[MANIFESTO_ID]?.scoreMultiplier || 1;
    return 1;
  }

  function sortearAssinatura(p) {
    const validas = (p.customKillSignatures || []).filter(s => typeof s === 'string' && s.trim() !== '');
    if (validas.length === 0) return DEFAULT_KILL_TITLE;
    return validas[Math.floor(Math.random() * validas.length)];
  }

  function armaSelecionada(p) {
    const id = p.selectedWeapon;
    if (id && ITEMS_DATA[id]?.type === 'weapon' && (id === KEYBOARD_ID || p.inventory?.includes(id))) return id;
    return KEYBOARD_ID;
  }

  /**
   * Aplica dano numa vítima, trata kill (pontos/kills/feed) e emite damageReceived.
   * `autor` pode ser undefined (ex.: dono da bomba saiu da sala) — aí não há crédito de kill.
   */
  function aplicarDano(codigo, { vitima, autor, nomeAutor, dano, isCritical = false, weaponType, killTitle, extras = {} }) {
    const vidaAntes = vitima.life;
    vitima.life = Math.max(VIDA_MIN, vidaAntes - dano);
    const isKill = vitima.life <= VIDA_MIN && vidaAntes > VIDA_MIN;

    const payload = {
      eventId: novoEventId(),
      targetId: vitima.id,
      damage: dano,
      currentLife: vitima.life,
      isCritical,
      isDodge: false,
      ...extras,
    };

    if (isKill && autor) {
      payload.attackerName = autor.nome;
      payload.targetName = vitima.nome;
      payload.weaponType = weaponType;
      payload.killTitle = killTitle || sortearAssinatura(autor);
      autor.score = (autor.score || 0) + (GAME_CONFIG.POINTS.KILL || 0) * multiplicadorScore(autor);
      autor.kills = (autor.kills || 0) + 1;
      console.log(`[${codigo}] KILL: ${autor.nome} -> ${vitima.nome} (${weaponType})`);
    } else if (isKill && nomeAutor) {
      // Morte sem jogador responsável (ex.: maionese estragada): aparece no feed, sem pontos pra ninguém
      payload.attackerName = nomeAutor;
      payload.targetName = vitima.nome;
      payload.weaponType = weaponType;
      payload.killTitle = killTitle || DEFAULT_KILL_TITLE;
      console.log(`[${codigo}] KILL: ${nomeAutor} -> ${vitima.nome} (${weaponType})`);
    }

    io.to(codigo).emit('damageReceived', payload);
    if (isKill) droparItemAoMorrer(codigo, vitima);
    return { isKill };
  }

  /** Resolve o impacto de um arremesso (chamado pelo servidor ao fim do tempo de voo). */
  function resolverAtaque(codigo, atacanteId, alvoId, weaponId) {
    const sala = salas.get(codigo);
    if (!sala) return;
    const atacante = sala.participantes.get(atacanteId);
    const alvo = sala.participantes.get(alvoId);
    if (!atacante || !alvo || atacanteId === alvoId) return;
    if (atacante.life <= VIDA_MIN) return; // morreu enquanto o objeto voava

    // Cutucão em defunto: sem dano, crítico, esquiva ou kill (mantém a piscada de atenção)
    if (alvo.life <= VIDA_MIN) {
      io.to(codigo).emit('damageReceived', {
        eventId: novoEventId(), targetId: alvoId, damage: 0, currentLife: alvo.life,
        isCritical: false, isDodge: false, isCorpseHit: true,
      });
      return;
    }

    // Esquiva: maior chance base entre acessórios EQUIPADOS + bônus de todo o inventário
    let maiorEsquiva = 0;
    let bonusEsquiva = 0;
    for (const itemId of alvo.inventory || []) {
      const item = ITEMS_DATA[itemId];
      if (!item || item.type !== 'accessory') continue;
      if (alvo.equippedAccessories?.includes(itemId) && (item.dodgeChance || 0) > maiorEsquiva) maiorEsquiva = item.dodgeChance;
      bonusEsquiva += item.dodgeChanceBonus || 0;
    }
    if (Math.random() < maiorEsquiva + bonusEsquiva) {
      io.to(codigo).emit('damageReceived', {
        eventId: novoEventId(), targetId: alvoId, damage: 0, currentLife: alvo.life,
        isCritical: false, isDodge: true,
      });
      return;
    }

    const arma = ITEMS_DATA[weaponId];
    if (!arma || arma.type !== 'weapon') return;

    // Ataque: arma + bônus dos acessórios equipados
    let ataque = (arma.baseDamageFixed || 0) + rollDice(arma.baseDamageDice);
    for (const id of atacante.equippedAccessories || []) {
      const acc = ITEMS_DATA[id];
      if (acc?.type === 'accessory') ataque += (acc.attackBonusFixed || 0) + rollDice(acc.attackBonusDice);
    }

    // Crítico (= morte instantânea): chance da arma + bônus do inventário; algumas armas não critam
    let isCritical = false;
    if (arma.allowCritical !== false) {
      let chanceCrit = arma.criticalChance || 0;
      for (const id of atacante.inventory || []) {
        const item = ITEMS_DATA[id];
        if (item?.type === 'accessory') chanceCrit += item.criticalChanceBonus || 0;
      }
      isCritical = chanceCrit > 0 && Math.random() < chanceCrit;
    }

    let dano;
    if (isCritical) {
      dano = alvo.life;
    } else {
      let defesa = 0;
      for (const id of alvo.equippedAccessories || []) {
        const acc = ITEMS_DATA[id];
        if (acc?.type === 'accessory') defesa += (acc.defenseFixed || 0) + rollDice(acc.defenseDice);
      }
      dano = Math.max(0, ataque - defesa);
    }

    aplicarDano(codigo, { vitima: alvo, autor: atacante, dano, isCritical, weaponType: weaponId });

    // Contra-ataques só quando o alvo tomou dano de verdade
    if (dano > 0) dispararContraAtaques(codigo, alvoId, atacanteId);

    emitirParticipantes(codigo);
  }

  /** Sorteia os contra-ataques do defensor contra o agressor. Contra-ataque não gera contra-ataque. */
  function dispararContraAtaques(codigo, defensorId, agressorId) {
    const sala = salas.get(codigo);
    const defensor = sala?.participantes.get(defensorId);
    if (!defensor) return;

    // Só o contra-ataque escolhido pelo jogador dispara (um por vez)
    let gastou = false;
    const ativo = contraAtaqueAtivo(defensor);
    for (const [itemId, qtd] of ativo ? [[ativo, defensor.consumables[ativo]]] : []) {
      const item = ITEMS_DATA[itemId];
      if (Math.random() >= (item.counterChance || 0)) continue;

      if (item.counterType === 'carimbo') {
        // Pequeno atraso: o carimbo cai depois do impacto (e não atropela a animação do dano original)
        setTimeout(() => {
          const s = salas.get(codigo);
          const def = s?.participantes.get(defensorId);
          const agr = s?.participantes.get(agressorId);
          if (!def || !agr || agr.life <= VIDA_MIN) return;
          io.to(codigo).emit('counterAttack', { type: 'carimbo', fromId: defensorId, toId: agressorId, eventId: novoEventId() });
          aplicarDano(codigo, {
            vitima: agr, autor: def, dano: rollDice(item.counterDice), weaponType: itemId,
            killTitle: 'INDEFERIDO!', extras: { isCounter: true },
          });
          emitirParticipantes(codigo);
        }, 450);
        defensor.consumables[itemId] = qtd - 1;
        gastou = true;
      } else if (item.counterType === 'bomba') {
        // Só gasta o celular se ele realmente foi mandado (um por vez em cada pessoa)
        if (plantarBomba(codigo, defensorId, agressorId, itemId)) {
          defensor.consumables[itemId] = qtd - 1;
          gastou = true;
        }
      }
    }
    if (gastou) {
      contraAtaqueAtivo(defensor); // acabou a carga? passa pro próximo que tiver
      emitirParticipantes(codigo);
    }
  }

  function plantarBomba(codigo, donoId, vitimaId, itemId) {
    const sala = salas.get(codigo);
    const vitima = sala?.participantes.get(vitimaId);
    const dono = sala?.participantes.get(donoId);
    if (!vitima || !dono || vitima.life <= VIDA_MIN) return false;
    // Uma bomba por vez em cada pessoa (senão metralhadora vira chuva de celular)
    for (const b of bombas.values()) if (b.codigo === codigo && b.vitimaId === vitimaId) return false;

    const item = ITEMS_DATA[itemId];
    const fuseMs = item.fuseMs || 3000;
    const bombId = novoEventId();
    // Folga de 300ms para a latência de quem está desarmando
    const timer = setTimeout(() => explodirBomba(bombId), fuseMs + 300);
    const vidaMax = item.bombLife || 25;
    bombas.set(bombId, { codigo, vitimaId, donoId, itemId, timer, vida: vidaMax, vidaMax });
    console.log(`[${codigo}] 📱 ${dono.nome} mandou um Note 7 em ${vitima.nome}`);
    io.to(codigo).emit('bombPlanted', { bombId, victimId: vitimaId, ownerName: dono.nome, fuseMs, vida: vidaMax, vidaMax });
    return true;
  }

  /** A vítima bateu no celular com a arma selecionada. Zerou a vida: celular destruído, sem explosão. */
  function baterNaBomba(bombId, atacante, weaponId) {
    const b = bombas.get(bombId);
    if (!b) return;
    const arma = ITEMS_DATA[weaponId];
    let dano = (arma.baseDamageFixed || 0) + rollDice(arma.baseDamageDice);
    for (const id of atacante.equippedAccessories || []) {
      const acc = ITEMS_DATA[id];
      if (acc?.type === 'accessory') dano += (acc.attackBonusFixed || 0) + rollDice(acc.attackBonusDice);
    }
    // Crítico da arma destrói o celular na hora
    const isCritical = arma.allowCritical !== false && Math.random() < (arma.criticalChance || 0);
    if (isCritical) dano = b.vida;
    b.vida = Math.max(0, b.vida - dano);
    io.to(b.codigo).emit('bombHit', { bombId, damage: dano, vida: b.vida, vidaMax: b.vidaMax, isCritical });
    if (b.vida <= 0) {
      clearTimeout(b.timer);
      bombas.delete(bombId);
      io.to(b.codigo).emit('bombDefused', { bombId, victimId: b.vitimaId });
    }
  }

  function explodirBomba(bombId) {
    const b = bombas.get(bombId);
    if (!b) return;
    bombas.delete(bombId);
    const sala = salas.get(b.codigo);
    if (!sala) return;
    io.to(b.codigo).emit('bombExploded', { bombId, victimId: b.vitimaId });
    const vitima = sala.participantes.get(b.vitimaId);
    if (!vitima || vitima.life <= VIDA_MIN) return;
    const dono = sala.participantes.get(b.donoId);
    const item = ITEMS_DATA[b.itemId] || {};
    // Crítico = morte instantânea, como nas armas
    const isCritical = Math.random() < (item.criticalChance || 0);
    aplicarDano(b.codigo, {
      vitima, autor: dono, dano: isCritical ? vitima.life : rollDice(item.bombDice || '3d6'), isCritical,
      weaponType: b.itemId, killTitle: 'A bateria explodiu!', extras: { isCounter: true },
    });
    emitirParticipantes(b.codigo);
  }
  // ---------- Minerador como alvo ----------
  function garantirVidaMinerador(p) {
    if (!p.inventory?.includes(BITCOIN_MINER_ID)) return null;
    const max = ITEMS_DATA[BITCOIN_MINER_ID]?.minerLife || 80;
    if (!p.minerador) p.minerador = { vida: max, max };
    return p.minerador;
  }

  /** Impacto de um arremesso no minerador de alguém (chamado ao fim do voo). */
  function resolverAtaqueMinerador(codigo, atacanteId, donoId, weaponId) {
    const sala = salas.get(codigo);
    const atacante = sala?.participantes.get(atacanteId);
    const dono = sala?.participantes.get(donoId);
    if (!atacante || !dono || atacante.life <= VIDA_MIN) return;
    const m = garantirVidaMinerador(dono);
    if (!m || !dono.equippedAccessories?.includes(BITCOIN_MINER_ID)) return;
    const base = { eventId: novoEventId(), ownerId: donoId, vida: m.vida, max: m.max };

    if (m.vida <= 0) {
      io.to(codigo).emit('minerHit', { ...base, damage: 0, broken: true });
      return;
    }
    // Antivírus: esquiva
    const esquiva = dono.inventory.includes('antivirus_minerador') ? (ITEMS_DATA.antivirus_minerador?.minerDodge || 0) : 0;
    if (Math.random() < esquiva) {
      io.to(codigo).emit('minerHit', { ...base, damage: 0, isDodge: true });
      return;
    }
    const arma = ITEMS_DATA[weaponId];
    let ataque = (arma.baseDamageFixed || 0) + rollDice(arma.baseDamageDice);
    for (const id of atacante.equippedAccessories || []) {
      const acc = ITEMS_DATA[id];
      if (acc?.type === 'accessory') ataque += (acc.attackBonusFixed || 0) + rollDice(acc.attackBonusDice);
    }
    let isCritical = false;
    if (arma.allowCritical !== false) {
      let chance = arma.criticalChance || 0;
      for (const id of atacante.inventory || []) chance += ITEMS_DATA[id]?.type === 'accessory' ? (ITEMS_DATA[id].criticalChanceBonus || 0) : 0;
      isCritical = Math.random() < chance;
    }
    // Firewall: defesa fixa
    const defesa = dono.inventory.includes('firewall_minerador') ? (ITEMS_DATA.firewall_minerador?.minerDefense || 0) : 0;
    const dano = isCritical ? m.vida : Math.max(0, ataque - defesa);
    m.vida = Math.max(0, m.vida - dano);
    const destroyed = m.vida <= 0;
    io.to(codigo).emit('minerHit', { ...base, vida: m.vida, damage: dano, isCritical, destroyed });
    if (destroyed) {
      dono.proximaMineracao = null;
      console.log(`[${codigo}] ⛏️💥 ${atacante.nome} quebrou o minerador de ${dono.nome}`);
      io.to(codigo).emit('minerDestroyed', {
        eventId: novoEventId(), attackerName: atacante.nome, ownerName: dono.nome, weaponType: weaponId, timestamp: Date.now(),
      });
      iniciarContagemMinerador(codigo, dono, atacanteId);
    }
    emitirParticipantes(codigo);
  }

  // Contagens de explosão do minerador: participante -> { timer, quebradorId }
  const contagensMinerador = new Map();

  function iniciarContagemMinerador(codigo, dono, quebradorId) {
    const m = dono.minerador;
    if (!m || contagensMinerador.has(dono)) return;
    const fuseMs = ITEMS_DATA[BITCOIN_MINER_ID]?.explodeFuseMs || 5000;
    m.contagemFim = Date.now() + fuseMs;
    // Folga de 300ms para o último clique de conserto chegar
    const timer = setTimeout(() => explodirMinerador(codigo, dono), fuseMs + 300);
    contagensMinerador.set(dono, { timer, quebradorId });
    io.to(codigo).emit('minerCountdown', { ownerId: dono.id, fuseMs });
  }

  function cancelarContagemMinerador(codigo, dono) {
    const c = contagensMinerador.get(dono);
    if (!c) return;
    clearTimeout(c.timer);
    contagensMinerador.delete(dono);
    if (dono.minerador) delete dono.minerador.contagemFim;
    io.to(codigo).emit('minerCountdownCancelled', { ownerId: dono.id });
  }

  function explodirMinerador(codigo, dono) {
    const c = contagensMinerador.get(dono);
    contagensMinerador.delete(dono);
    if (dono.minerador) delete dono.minerador.contagemFim;
    const sala = salas.get(codigo);
    if (!sala || !dono.minerador || dono.minerador.vida > 0) return;
    console.log(`[${codigo}] 💥💥 O minerador de ${dono.nome} explodiu!`);
    dono.minerador.explodiu = true; // não dá mais pra consertar
    io.to(codigo).emit('minerExploded', { ownerId: dono.id });
    // Os upgrades voam pra fora: caem todos, cada um separado
    for (const id of UPGRADES_MINERADOR) {
      if (!dono.inventory?.includes(id)) continue;
      dono.inventory = dono.inventory.filter(x => x !== id);
      criarDrop(codigo, dono, id, 1, { doMinerador: true });
    }
    // Depois de piscar na tela, o minerador some (com os upgrades). Quer de novo? Compra outro.
    setTimeout(() => {
      const upgrades = ['firewall_minerador', 'antivirus_minerador', 'placa_video_minerador'];
      dono.inventory = (dono.inventory || []).filter(id => id !== BITCOIN_MINER_ID && !upgrades.includes(id));
      dono.equippedAccessories = (dono.equippedAccessories || []).filter(id => id !== BITCOIN_MINER_ID);
      delete dono.minerador;
      dono.proximaMineracao = null;
      emitirParticipantes(codigo);
    }, 1500);
    if (dono.life > VIDA_MIN) {
      // Quem quebrou leva o kill (se ainda estiver na sala)
      const quebrador = [...sala.participantes.values()].find(p => p.id === c?.quebradorId);
      aplicarDano(codigo, {
        vitima: dono, autor: quebrador, dano: dono.life, isCritical: true, weaponType: BITCOIN_MINER_ID,
        killTitle: 'O minerador explodiu!', extras: { isCounter: true },
      });
    }
    emitirParticipantes(codigo);
  }

  // ---------- Maionese estragada (envenenamento) ----------
  // participante -> intervalo do dano
  const envenenamentos = new Map();

  function envenenar(codigo, p) {
    const xis = ITEMS_DATA.xis_phade;
    curarEnvenenamento(codigo, p, false);
    p.envenenado = { aguas: 0, ticksRestantes: xis.poisonTicks || 5 };
    io.to(codigo).emit('poisoned', { userId: p.id });
    const intervalo = setInterval(() => {
      const e = p.envenenado;
      if (!e || p.life <= VIDA_MIN) return curarEnvenenamento(codigo, p, false);
      aplicarDano(codigo, {
        vitima: p, autor: undefined, nomeAutor: xis.name, killTitle: 'Maionese estragada!',
        dano: xis.poisonDamagePerTick || 10, weaponType: 'xis_phade',
        extras: { isCounter: true, isPoison: true },
      });
      e.ticksRestantes -= 1;
      if (e.ticksRestantes <= 0 || p.life <= VIDA_MIN) curarEnvenenamento(codigo, p, false);
      else emitirParticipantes(codigo);
    }, xis.poisonTickMs || 1000);
    envenenamentos.set(p, intervalo);
  }

  /** Para o envenenamento. `curadoPelaAgua` só muda a mensagem que aparece. */
  function curarEnvenenamento(codigo, p, curadoPelaAgua) {
    const intervalo = envenenamentos.get(p);
    if (intervalo) clearInterval(intervalo);
    envenenamentos.delete(p);
    if (!p.envenenado) return;
    delete p.envenenado;
    io.to(codigo).emit('poisonCured', { userId: p.id, byWater: !!curadoPelaAgua });
    emitirParticipantes(codigo);
  }

  // ---------- Drops: quem morre deixa cair 1 item; quem clicar primeiro embolsa ----------
  const DROP_DURACAO_MS = 10000;
  const UPGRADES_MINERADOR = ['firewall_minerador', 'antivirus_minerador', 'placa_video_minerador'];
  const drops = new Map(); // dropId -> { codigo, itemId, quantidade, ammo, origemId, origemNome, expiraEm, timer }

  function publicoDrop(d, dropId) {
    return { dropId, itemId: d.itemId, quantidade: d.quantidade, origemId: d.origemId, restanteMs: Math.max(0, d.expiraEm - Date.now()) };
  }

  function criarDrop(codigo, origem, itemId, quantidade = 1, extras = {}) {
    const dropId = novoEventId();
    const d = { codigo, itemId, quantidade, origemId: origem.id, origemNome: origem.nome, expiraEm: Date.now() + DROP_DURACAO_MS, ...extras };
    d.timer = setTimeout(() => {
      if (!drops.delete(dropId)) return;
      io.to(codigo).emit('dropExpired', { dropId });
    }, DROP_DURACAO_MS);
    drops.set(dropId, d);
    io.to(codigo).emit('dropSpawned', publicoDrop(d, dropId));
  }

  /** Sorteia 1 item entre os que podem cair e tira do inventário de quem morreu. */
  function droparItemAoMorrer(codigo, vitima) {
    const opcoes = [];
    for (const [id, qtd] of Object.entries(vitima.consumables || {})) {
      const t = ITEMS_DATA[id]?.type;
      if ((t === 'consumable' || t === 'counter') && qtd > 0) opcoes.push(id);
    }
    for (const id of vitima.inventory || []) {
      const t = ITEMS_DATA[id]?.type;
      if (id === KEYBOARD_ID || id === BITCOIN_MINER_ID) continue; // nunca caem
      if (t === 'weapon' || t === 'accessory') opcoes.push(id);
    }
    if (opcoes.length === 0) return;
    const itemId = opcoes[Math.floor(Math.random() * opcoes.length)];
    const item = ITEMS_DATA[itemId];

    if (item.type === 'consumable' || item.type === 'counter') {
      // Cai metade do estoque (arredondando pra cima)
      const qtd = vitima.consumables[itemId];
      const cai = Math.ceil(qtd / 2);
      vitima.consumables[itemId] = qtd - cai;
      if (item.type === 'counter') contraAtaqueAtivo(vitima);
      criarDrop(codigo, vitima, itemId, cai);
    } else {
      vitima.inventory = vitima.inventory.filter(id => id !== itemId);
      vitima.equippedAccessories = (vitima.equippedAccessories || []).filter(id => id !== itemId);
      let ammo;
      if (item.type === 'weapon') {
        if (vitima.selectedWeapon === itemId) vitima.selectedWeapon = KEYBOARD_ID;
        ammo = vitima.recargas?.[itemId] ? 0 : (vitima.ammo?.[itemId] ?? item.ammo);
        if (vitima.recargas) delete vitima.recargas[itemId]; // cancela a carga no cartório
        if (vitima.ammo) delete vitima.ammo[itemId];
      }
      criarDrop(codigo, vitima, itemId, 1, item.ammo ? { ammo } : {});
    }
    console.log(`[${codigo}] 🎁 ${vitima.nome} deixou cair ${itemId}`);
  }

  // Quem entra/dá F5 vê os itens que já estão no chão (com um pequeno atraso pros cards renderizarem)
  function enviarDropsAtivos(socket, codigo) {
    const lista = [...drops.entries()].filter(([, d]) => d.codigo === codigo).map(([id, d]) => publicoDrop(d, id));
    if (lista.length) setTimeout(() => lista.forEach(d => socket.emit('dropSpawned', d)), 800);
  }

  const valorConversao = (item, quantidade) =>
    Math.max(1, Math.floor(((item.price || 0) / (item.packSize || 1)) * quantidade / 2));

  /** Entrega o drop pra quem pegou. Já tem (ou não pode usar)? Vira metade do preço em moedas. */
  function entregarDrop(p, d) {
    const item = ITEMS_DATA[d.itemId];
    let moedas = 0;
    let ganhou = 0;
    if (item.type === 'consumable' || item.type === 'counter') {
      p.consumables = p.consumables || {};
      const atual = p.consumables[d.itemId] || 0;
      const cabe = Math.max(0, (item.maxStack || 1) - atual);
      ganhou = Math.min(cabe, d.quantidade);
      p.consumables[d.itemId] = atual + ganhou;
      if (d.quantidade > ganhou) moedas = valorConversao(item, d.quantidade - ganhou);
      if (item.type === 'counter' && ganhou > 0 && !contraAtaqueAtivo(p)) p.selectedCounter = d.itemId;
    } else {
      const jaTem = p.inventory.includes(d.itemId);
      const naoPodeUsar = item.requires && !p.inventory.includes(item.requires);
      if (jaTem || naoPodeUsar) {
        moedas = valorConversao(item, 1);
      } else {
        ganhou = 1;
        p.inventory.push(d.itemId);
        if (item.type === 'weapon' && item.ammo) {
          p.ammo = p.ammo || {};
          p.ammo[d.itemId] = d.ammo ?? item.ammo;
        }
        // Acessório: equipa se o slot estiver livre (como na compra)
        if (item.type === 'accessory' && item.equipSlot) {
          const eq = p.equippedAccessories || [];
          const slotOcupado = item.equipSlot !== 'passive' && eq.some(id => ITEMS_DATA[id]?.equipSlot === item.equipSlot);
          if (!slotOcupado) p.equippedAccessories = [...eq, d.itemId];
        }
      }
    }
    if (moedas > 0) p.score = (p.score || 0) + moedas;
    return { ganhou, moedas };
  }


  // ====================== CHEFE: EPROC ======================
  // Aparece no consenso ou na divergência grande. Trava, cai do ar e morre sozinho depois de um tempo:
  // o desafio é matar antes. Morreu sozinho? 1 item e nenhuma moeda.
  const CHEFE = {
    vidaPorJogador: 120,
    vidaMinima: 200,
    duracaoMs: Number(process.env.BOSS_DURACAO_MS) || 60000,     // env só pra testes
    intervaloMinMs: Number(process.env.BOSS_COOLDOWN_MS ?? 180000), // entre um EPROC e outro
    travaACadaMs: [7000, 11000],
    travaDuracaoMs: 2000,
    foraDoArMs: 3000,
    recompensaPorJogador: 10,
    bonusUltimoGolpe: 5,
    itensVitoria: 3,
  };
  const LOOT_CHEFE = [
    ['xis_phade', 2], ['garrafa_agua', 3], ['carimbo_indeferido', 10], ['galaxy_note7', 5],
    ['processo_fisico', 1], ['teclado_mecanico', 1], ['xis_phade', 3], ['garrafa_agua', 5],
  ];
  const chefes = new Map();      // codigo -> chefe
  const ultimoChefe = new Map(); // codigo -> timestamp do último que apareceu
  const ORIGEM_CHEFE = { id: 'eproc', nome: 'EPROC' };
  const sorteio = (min, max) => min + Math.random() * (max - min);

  function estadoPublicoChefe(c) {
    const agora = Date.now();
    return {
      bossId: c.id, vida: c.vida, max: c.max, motivo: c.motivo, fase: c.fase,
      restanteMs: Math.max(0, c.fimEm - agora), duracaoMs: CHEFE.duracaoMs,
      travadoMs: Math.max(0, c.travadoAte - agora), travaTipo: c.travaTipo,
    };
  }

  /** Decide, na revelação, se o EPROC aparece (mesmas regras dos selos da mesa). */
  function talvezChamarChefe(codigo, sala) {
    if (chefes.has(codigo)) return;
    if (Date.now() - (ultimoChefe.get(codigo) || 0) < CHEFE.intervaloMinMs) return;
    const votos = [...sala.participantes.values()].filter(p => p.jaVotou && p.valorVotado != null).map(p => String(p.valorVotado));
    if (votos.length < 2) return;
    const contagem = {};
    votos.forEach(v => { contagem[v] = (contagem[v] || 0) + 1; });
    const maisComum = Math.max(...Object.values(contagem));
    const consenso = maisComum / votos.length > 0.7;
    const divergencia = Object.keys(contagem).length >= 3;
    if (!consenso && !divergencia) return;
    ultimoChefe.set(codigo, Date.now());
    // Deixa o resultado aparecer um pouquinho antes do sistema "cair" na mesa
    setTimeout(() => invocarChefe(codigo, consenso ? 'consenso' : 'divergencia'), 1500);
  }

  function invocarChefe(codigo, motivo) {
    const sala = salas.get(codigo);
    if (!sala || chefes.has(codigo)) return;
    const vivos = [...sala.participantes.values()].filter(p => !p.isObservador && p.life > VIDA_MIN).length;
    const max = Math.max(CHEFE.vidaMinima, CHEFE.vidaPorJogador * Math.max(1, vivos));
    const agora = Date.now();
    const c = {
      id: novoEventId(), codigo, motivo, vida: max, max, fase: 1,
      fimEm: agora + CHEFE.duracaoMs, travadoAte: 0, travaTipo: null,
      proximaTrava: agora + sorteio(...CHEFE.travaACadaMs), proximoAtaque: agora + 4000,
      foraDoArUsado: false, danos: new Map(), // participante -> dano causado
    };
    c.loop = setInterval(() => tickChefe(c), 250);
    chefes.set(codigo, c);
    console.log(`[${codigo}] 🖥️ EPROC apareceu (${motivo}) com ${max} de vida`);
    io.to(codigo).emit('bossSpawned', estadoPublicoChefe(c));
  }

  function encerrarChefe(c) {
    clearInterval(c.loop);
    chefes.delete(c.codigo);
  }

  function tickChefe(c) {
    const sala = salas.get(c.codigo);
    if (!sala) return encerrarChefe(c);
    const agora = Date.now();
    if (agora >= c.fimEm) return chefeMorreuSozinho(c);

    // Travadas periódicas: "Carregando..." (não ataca, mas apanha)
    if (agora >= c.proximaTrava && agora >= c.travadoAte) {
      c.travadoAte = agora + CHEFE.travaDuracaoMs;
      c.travaTipo = 'carregando';
      c.proximaTrava = agora + CHEFE.travaDuracaoMs + sorteio(...CHEFE.travaACadaMs);
      io.to(c.codigo).emit('bossUpdate', estadoPublicoChefe(c));
    }
    if (c.travaTipo && agora >= c.travadoAte) {
      c.travaTipo = null;
      io.to(c.codigo).emit('bossUpdate', estadoPublicoChefe(c));
    }

    // Ataques (não ataca travado)
    if (agora >= c.proximoAtaque && agora >= c.travadoAte) {
      c.proximoAtaque = agora + (c.fase === 2 ? 4000 : 5500);
      const vivos = [...sala.participantes.values()].filter(p => !p.isObservador && !p.desconectado && p.life > VIDA_MIN);
      if (vivos.length === 0) return;
      const emArea = c.fase === 2 && Math.random() < 0.5;
      const alvos = emArea ? vivos : [vivos[Math.floor(Math.random() * vivos.length)]];
      const tipo = emArea ? 'sessao' : 'erro500';
      io.to(c.codigo).emit('bossAttack', { tipo, alvos: alvos.map(p => p.id) });
      for (const p of alvos) {
        aplicarDano(c.codigo, {
          vitima: p, nomeAutor: 'EPROC', weaponType: 'eproc',
          killTitle: emArea ? 'Sessão expirada!' : 'Erro 500!',
          dano: emArea ? 8 : rollDice(c.fase === 2 ? '1d10' : '1d8') + (c.fase === 2 ? 8 : 5),
          extras: { isCounter: true, isBossAttack: true },
        });
      }
      emitirParticipantes(c.codigo);
    }
  }

  /** Impacto de um arremesso no EPROC (ao fim do voo). */
  function resolverAtaqueChefe(codigo, atacanteId, weaponId) {
    const c = chefes.get(codigo);
    const sala = salas.get(codigo);
    const atacante = sala?.participantes.get(atacanteId);
    if (!c || !atacante || atacante.life <= VIDA_MIN) return;
    const agora = Date.now();
    // Travado (carregando/fora do ar) ele não ataca, mas apanha normalmente
    const arma = ITEMS_DATA[weaponId];
    let dano = (arma.baseDamageFixed || 0) + rollDice(arma.baseDamageDice);
    for (const id of atacante.equippedAccessories || []) {
      const acc = ITEMS_DATA[id];
      if (acc?.type === 'accessory') dano += (acc.attackBonusFixed || 0) + rollDice(acc.attackBonusDice);
    }
    // No chefe, crítico é dano dobrado (não mata na hora)
    let isCritical = false;
    if (arma.allowCritical !== false) {
      let chance = arma.criticalChance || 0;
      for (const id of atacante.inventory || []) chance += ITEMS_DATA[id]?.type === 'accessory' ? (ITEMS_DATA[id].criticalChanceBonus || 0) : 0;
      isCritical = Math.random() < chance;
    }
    if (isCritical) dano *= 2;
    dano = Math.min(dano, c.vida);
    c.vida -= dano;
    c.danos.set(atacante, (c.danos.get(atacante) || 0) + dano);
    io.to(codigo).emit('bossHit', { bossId: c.id, damage: dano, isCritical, vida: c.vida, max: c.max, attackerId: atacante.id });

    // Fase 2: cai do ar uma vez e volta mais bravo
    if (c.fase === 1 && c.vida <= c.max / 2 && c.vida > 0) {
      c.fase = 2;
      c.travadoAte = agora + CHEFE.foraDoArMs;
      c.travaTipo = 'foradoar';
      c.proximoAtaque = c.travadoAte + 1000;
      io.to(codigo).emit('bossUpdate', estadoPublicoChefe(c));
    }
    if (c.vida <= 0) chefeDerrotado(c, atacante);
  }

  function soltarLoot(c, quantidade) {
    for (let i = 0; i < quantidade; i++) {
      const [itemId, qtd] = LOOT_CHEFE[Math.floor(Math.random() * LOOT_CHEFE.length)];
      const item = ITEMS_DATA[itemId];
      criarDrop(c.codigo, ORIGEM_CHEFE, itemId, qtd, item.ammo ? { ammo: item.ammo } : {});
    }
  }

  function chefeDerrotado(c, ultimo) {
    encerrarChefe(c);
    const sala = salas.get(c.codigo);
    const jogadores = [...sala.participantes.values()].filter(p => !p.isObservador).length;
    const pote = CHEFE.recompensaPorJogador * Math.max(1, jogadores);
    const total = [...c.danos.values()].reduce((a, b) => a + b, 0) || 1;
    const recompensas = [];
    let mvp = null;
    for (const [p, dano] of c.danos) {
      let moedas = Math.floor(pote * dano / total);
      if (p === ultimo) moedas += CHEFE.bonusUltimoGolpe;
      p.score = (p.score || 0) + moedas;
      recompensas.push({ nome: p.nome, dano, moedas });
      if (!mvp || dano > mvp.dano) mvp = { nome: p.nome, dano };
    }
    recompensas.sort((a, b) => b.dano - a.dano);
    console.log(`[${c.codigo}] 🏆 EPROC derrubado! MVP ${mvp?.nome}, último golpe ${ultimo.nome}`);
    io.to(c.codigo).emit('bossDefeated', {
      eventId: novoEventId(), bossId: c.id, lastHitName: ultimo.nome, mvpName: mvp?.nome, mvpDano: mvp?.dano,
      recompensas, timestamp: Date.now(),
    });
    soltarLoot(c, CHEFE.itensVitoria);
    emitirParticipantes(c.codigo);
  }

  function chefeMorreuSozinho(c) {
    encerrarChefe(c);
    console.log(`[${c.codigo}] 💤 EPROC caiu sozinho`);
    io.to(c.codigo).emit('bossCrashed', { eventId: novoEventId(), bossId: c.id, timestamp: Date.now() });
    soltarLoot(c, 1);
  }

  function enviarChefeAtivo(socket, codigo) {
    const c = chefes.get(codigo);
    if (c) setTimeout(() => socket.emit('bossSpawned', estadoPublicoChefe(c)), 600);
  }
  // ==================== FIM CHEFE ====================

  /** Avisa a sala de uma compra (aparece nas notificações). */
  function anunciarCompra(codigo, p, itemId, quantidade) {
    io.to(codigo).emit('itemPurchased', {
      eventId: novoEventId(), playerName: p.nome, itemId, quantidade, timestamp: Date.now(),
    });
  }

  /** Contra-ataque ativo: o escolhido, ou (se acabou) o primeiro que ainda tem carga. */
  function contraAtaqueAtivo(p) {
    const qtds = p.consumables || {};
    const temCarga = (id) => ITEMS_DATA[id]?.type === 'counter' && (qtds[id] || 0) > 0;
    if (temCarga(p.selectedCounter)) return p.selectedCounter;
    const outro = Object.keys(qtds).find(temCarga) || null;
    p.selectedCounter = outro;
    return outro;
  }
  // ==================== FIM COMBATE ====================

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Entrar em uma sala
    socket.on('entrarSala', ({ codigo, usuario }) => {
      if (!codigo || !usuario) return;

      if (!salas.has(codigo)) {
        salas.set(codigo, {
          participantes: new Map(),
          moderadorId: null,
          revelarVotos: false,
          pvpAtivo: false,
        });
        console.log(`Sala ${codigo} criada por ${usuario.nome}`);
      }
      const salaAtual = salas.get(codigo);

      // Já existe alguém deste navegador (mesmo token) na sala?
      const existente = Array.from(salaAtual.participantes.values())
        .find(p => p.token && p.token === usuario.token && p.browserName === usuario.browserName);

      if (existente) {
        const socketAntigo = existente.id !== socket.id ? io.sockets.sockets.get(existente.id) : null;
        const antigoAindaAtivo = !!(socketAntigo && socketAntigo.connected && !existente.desconectado);
        const mesmaAba = !!usuario.tabId && existente.tabId === usuario.tabId;

        if (antigoAindaAtivo && !mesmaAba) {
          // Outra aba de verdade
          socket.emit('erroEntrada', {
            mensagem: 'Você já está conectado nesta sala em outra aba/janela deste navegador'
          });
          return;
        }

        // Reconexão (F5, queda de rede, ou a mesma aba voltando antes do servidor perceber a queda):
        // transfere o estado completo para o novo socket.
        const chave = `${codigo}:${existente.id}`;
        if (remocoesPendentes.has(chave)) {
          clearTimeout(remocoesPendentes.get(chave));
          remocoesPendentes.delete(chave);
        }

        const idAntigo = existente.id;
        salaAtual.participantes.delete(idAntigo);
        // Reaproveita o MESMO objeto (timers pendentes, como a carga no cartório, guardam referência a ele)
        existente.id = socket.id;
        existente.nome = usuario.nome || existente.nome;
        existente.tabId = usuario.tabId || existente.tabId;
        existente.desconectado = false;
        salaAtual.participantes.set(socket.id, existente);
        socket.join(codigo);

        // Bombas pendentes passam a apontar para o novo socket
        for (const b of bombas.values()) {
          if (b.vitimaId === idAntigo) b.vitimaId = socket.id;
          if (b.donoId === idAntigo) b.donoId = socket.id;
        }
        for (const d of drops.values()) if (d.origemId === idAntigo) d.origemId = socket.id;

        if (socketAntigo && idAntigo !== socket.id) {
          // O socket velho sai da sala mas não é derrubado (evita briga entre abas duplicadas)
          socketAntigo.leave(codigo);
        }

        console.log(`[${codigo}] ${usuario.nome} reconectou (socket ${idAntigo} -> ${socket.id}) mantendo score/itens.`);
        if (salaAtual.revelarVotos) socket.emit('votosRevelados');
        emitirParticipantes(codigo);
        enviarDropsAtivos(socket, codigo);
        enviarChefeAtivo(socket, codigo);
        return;
      }

      // Novo participante
      socket.join(codigo);
      const participantesAtuais = Array.from(salaAtual.participantes.values());
      const isModerador = !participantesAtuais.some(p => p.isModerador);
      const moderador = participantesAtuais.find(p => p.isModerador);

      salaAtual.participantes.set(socket.id, {
        nome: usuario.nome,
        isObservador: !!usuario.isObservador,
        token: usuario.token,
        browserName: usuario.browserName,
        tabId: usuario.tabId,
        id: socket.id,
        jaVotou: false,
        valorVotado: null,
        isModerador,
        keyboardMode: isModerador ? true : (moderador ? moderador.keyboardMode : false),
        life: GAME_CONFIG.LIFE.MAX,
        customKillSignatures: [],
        // DEV_START_SCORE: só para testes locais (não definida em produção)
        score: Number(process.env.DEV_START_SCORE) || 0,
        kills: 0,
        inventory: [KEYBOARD_ID],
        equippedAccessories: [],
        selectedWeapon: KEYBOARD_ID,
        selectedCounter: null,
        consumables: {},
        ammo: {},
        recargas: {},
        desconectado: false,
      });
      console.log(`[${codigo}] Usuário ${usuario.nome} entrou na sala com socket ID ${socket.id}`);

      if (salaAtual.revelarVotos) socket.emit('votosRevelados');
      emitirParticipantes(codigo);
      enviarDropsAtivos(socket, codigo);
      enviarChefeAtivo(socket, codigo);
    });

    // Arremessar objeto: o servidor valida (vivo, alvo, recarga da arma), avisa a sala para animar
    // e resolve o dano sozinho ao fim do tempo de voo. O cliente não manda mais 'attack'.
    socket.on('throwObject', ({ codigo, toUser, bombId, alvoMinerador, alvoChefe } = {}) => {
      const sala = salas.get(codigo);
      if (!sala) return;
      const atacante = sala.participantes.get(socket.id);
      if (!atacante || atacante.life <= VIDA_MIN) return; // morto não ataca
      // Alvo é o Note 7 que caiu do lado do próprio card? Só a vítima pode bater nele.
      const bomba = bombId ? bombas.get(bombId) : null;
      if (bombId && (!bomba || bomba.codigo !== codigo || bomba.vitimaId !== socket.id)) return;
      const chefe = alvoChefe ? chefes.get(codigo) : null;
      if (alvoChefe && !chefe) return;
      const alvo = (bomba || chefe) ? null : sala.participantes.get(toUser);
      if (!bomba && !chefe && (!alvo || toUser === socket.id)) return;
      // Mirou no minerador do alvo (precisa ter um equipado)
      if (alvoMinerador && !alvo?.equippedAccessories?.includes(BITCOIN_MINER_ID)) return;

      const weaponId = armaSelecionada(atacante);
      const arma = ITEMS_DATA[weaponId];
      const agora = Date.now();
      // Arma com munição: não dispara no cartório nem vazia
      if (arma.ammo && (atacante.recargas?.[weaponId] || (atacante.ammo?.[weaponId] || 0) <= 0)) return;
      // Tolerância de 15% para variação de rede
      if (atacante.ultimoArremesso && agora - atacante.ultimoArremesso < (arma.cooldownMs || 0) * 0.85) return;
      atacante.ultimoArremesso = agora;

      if (arma.ammo) {
        atacante.ammo[weaponId] -= 1;
        // Acabou: volta pro teclado (o botão do processo vira "Fazer carga no cartório")
        if (atacante.ammo[weaponId] <= 0) atacante.selectedWeapon = KEYBOARD_ID;
        emitirParticipantes(codigo);
      }

      // Voo curto até o celular (o pavio é curto; a folga de 300ms do pavio cobre isso)
      if (bomba) return setTimeout(() => baterNaBomba(bombId, atacante, weaponId), 200);
      if (chefe) {
        io.to(codigo).emit('throwObject', { fromUser: socket.id, objectType: weaponId, alvoChefe: true });
        const atacanteId = socket.id;
        setTimeout(() => resolverAtaqueChefe(codigo, atacanteId, weaponId), arma.flightMs || 400);
        return;
      }

      io.to(codigo).emit('throwObject', { fromUser: socket.id, toUser, objectType: weaponId, alvoMinerador: !!alvoMinerador });
      const atacanteId = socket.id;
      if (alvoMinerador) {
        setTimeout(() => resolverAtaqueMinerador(codigo, atacanteId, toUser, weaponId), arma.flightMs || 400);
        return;
      }
      setTimeout(() => resolverAtaque(codigo, atacanteId, toUser, weaponId), arma.flightMs || 400);
    });

    // Pegar um item caído (o primeiro que clicar leva)
    socket.on('pickupDrop', ({ codigo, dropId } = {}) => {
      const p = salas.get(codigo)?.participantes.get(socket.id);
      const d = drops.get(dropId);
      if (!p || !d || d.codigo !== codigo) return;
      if (p.life <= VIDA_MIN) return; // morto não junta nada
      drops.delete(dropId);
      clearTimeout(d.timer);
      const { ganhou, moedas } = entregarDrop(p, d);
      console.log(`[${codigo}] 🎁 ${p.nome} pegou ${d.itemId} (x${ganhou}, +${moedas} moedas)`);
      io.to(codigo).emit('dropPicked', {
        eventId: novoEventId(), dropId, pickerId: p.id, pickerName: p.nome, ownerName: d.origemNome,
        itemId: d.itemId, quantidade: ganhou, moedas, timestamp: Date.now(),
      });
      emitirParticipantes(codigo);
    });

    // Consertar o próprio minerador: +2 de vida por clique
    socket.on('repairMiner', ({ codigo } = {}) => {
      const p = salas.get(codigo)?.participantes.get(socket.id);
      if (!p || p.life <= VIDA_MIN) return; // morto não conserta
      const m = garantirVidaMinerador(p);
      if (!m || m.explodiu || m.vida >= m.max) return;
      const agora = Date.now();
      if (p.ultimoConserto && agora - p.ultimoConserto < 70) return; // limite de cliques por segundo
      p.ultimoConserto = agora;
      const estavaQuebrado = m.vida <= 0;
      m.vida = Math.min(m.max, m.vida + (ITEMS_DATA[BITCOIN_MINER_ID]?.repairPerClick || 2));
      if (estavaQuebrado) {
        p.proximaMineracao = null; // volta a minerar do zero
        cancelarContagemMinerador(codigo, p); // consertou a tempo!
      }
      io.to(codigo).emit('minerRepaired', { ownerId: p.id, vida: m.vida, max: m.max });
      emitirParticipantes(codigo);
    });

    // Escolher qual contra-ataque fica ativo (só um por vez)
    socket.on('selectCounter', ({ codigo, itemId } = {}) => {
      const p = salas.get(codigo)?.participantes.get(socket.id);
      if (!p || ITEMS_DATA[itemId]?.type !== 'counter' || !(p.consumables?.[itemId] > 0)) return;
      p.selectedCounter = itemId;
      emitirParticipantes(codigo);
    });

    // Trocar de arma
    socket.on('selectWeapon', ({ codigo, weaponId } = {}) => {
      const sala = salas.get(codigo);
      const p = sala?.participantes.get(socket.id);
      if (!p || ITEMS_DATA[weaponId]?.type !== 'weapon') return;
      if (weaponId !== KEYBOARD_ID && !p.inventory?.includes(weaponId)) return;
      if (ITEMS_DATA[weaponId].ammo && (p.recargas?.[weaponId] || (p.ammo?.[weaponId] || 0) <= 0)) return;
      p.selectedWeapon = weaponId;
      emitirParticipantes(codigo);
    });

    // Fazer carga no cartório (recarregar arma com munição). Roda em segundo plano:
    // dá pra trocar de arma e continuar jogando enquanto isso.
    socket.on('reloadWeapon', ({ codigo, weaponId } = {}) => {
      const sala = salas.get(codigo);
      const p = sala?.participantes.get(socket.id);
      const arma = ITEMS_DATA[weaponId];
      if (!p || !arma?.ammo || !p.inventory?.includes(weaponId)) return;
      p.ammo = p.ammo || {};
      p.recargas = p.recargas || {};
      if (p.recargas[weaponId] || (p.ammo[weaponId] || 0) >= arma.ammo) return;

      const eprocFora = Math.random() < (arma.reloadFailChance || 0);
      const duracaoMs = (arma.reloadMs || 6000) * (eprocFora ? 2 : 1);
      p.recargas[weaponId] = { fimEm: Date.now() + duracaoMs, duracaoMs, eprocFora };
      if (p.selectedWeapon === weaponId) p.selectedWeapon = KEYBOARD_ID;

      io.to(codigo).emit('reloadStarted', { userId: p.id, weaponId, durationMs: duracaoMs, eprocFora });
      emitirParticipantes(codigo);

      setTimeout(() => {
        // `p` é o mesmo objeto mesmo se a pessoa reconectar (ver entrarSala)
        if (!p.recargas?.[weaponId]) return;
        delete p.recargas[weaponId];
        p.ammo[weaponId] = arma.ammo;
        if (!salas.has(codigo)) return;
        io.to(codigo).emit('reloadDone', { userId: p.id, weaponId });
        emitirParticipantes(codigo);
      }, duracaoMs);
    });

    // Usar consumível (ex.: Xis)
    socket.on('useItem', ({ codigo, itemId } = {}) => {
      const sala = salas.get(codigo);
      const p = sala?.participantes.get(socket.id);
      const item = ITEMS_DATA[itemId];
      if (!p || item?.type !== 'consumable') return;
      const qtd = p.consumables?.[itemId] || 0;
      if (qtd <= 0) return;

      if (item.healAmount) {
        if (p.life <= VIDA_MIN) return;           // morto não come
        // Vida cheia: não desperdiça (exceto água pra curar a maionese)
        const bebendoPraCurar = item.curesPoisonAfter && p.envenenado;
        if (p.life >= GAME_CONFIG.LIFE.MAX && !bebendoPraCurar) return;
        p.consumables[itemId] = qtd - 1;

        // Maionese estragada: não cura nada, só faz mal
        if (item.spoilChance && Math.random() < item.spoilChance) {
          io.to(codigo).emit('itemUsed', { userId: p.id, itemId, heal: 0, spoiled: true, currentLife: p.life });
          io.to(codigo).emit('spoiledFood', { eventId: novoEventId(), playerName: p.nome, itemId, timestamp: Date.now() });
          envenenar(codigo, p);
          emitirParticipantes(codigo);
          return;
        }

        const vidaAntes = p.life;
        p.life = Math.min(GAME_CONFIG.LIFE.MAX, p.life + item.healAmount);
        io.to(codigo).emit('itemUsed', { userId: p.id, itemId, heal: p.life - vidaAntes, currentLife: p.life });

        // Água conta pra curar o envenenamento
        if (bebendoPraCurar) {
          p.envenenado.aguas += 1;
          if (p.envenenado.aguas >= item.curesPoisonAfter) curarEnvenenamento(codigo, p, true);
        }
        emitirParticipantes(codigo);
      }
    });

    // Votar
    socket.on('votar', ({ codigo, usuario, voto }) => {
      if (!salas.has(codigo)) return;
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);
      
      // Verifica apenas se participante existe.
      if (participante) { 
        // Define/sobrescreve o voto e marca que votou
        participante.jaVotou = true;
        participante.valorVotado = voto;
        
        // Manter atualização completa para garantir consistência da UI
        emitirParticipantes(codigo);
      }
    });

    // Cancelar voto
    socket.on('cancelarVoto', ({ codigo }) => {
      if (!salas.has(codigo)) return;
      
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);
      
      if (participante) {
        participante.jaVotou = false;
        participante.valorVotado = null;
        
        emitirParticipantes(codigo);
      }
    });

    // Revelar votos
    socket.on('revelarVotos', (codigo) => {
      if (!salas.has(codigo)) return;
      
      const sala = salas.get(codigo);
      sala.revelarVotos = true;
      
      // --- Adicionar Pontos por Voto AQUI ---
      console.log(`[${codigo}] Revelando votos e aplicando pontos...`);
      let participantesAtualizados = false;
      for (const participante of sala.participantes.values()) {
        // Pontua apenas quem efetivamente votou nesta rodada
        if (participante.jaVotou) {
          const pointsForVote = GAME_CONFIG.POINTS.VOTE_REVEALED || 0;
          let finalPointsForVote = pointsForVote;

          // Verificar se o participante possui o Manifesto Comunista
          if (participante.inventory?.includes(MANIFESTO_ID)) {
            const multiplier = ITEMS_DATA[MANIFESTO_ID]?.scoreMultiplier || 1;
            finalPointsForVote *= multiplier;
            console.log(`[${codigo}] Aplicando multiplicador (${multiplier}x) do Manifesto para ${participante.nome}. Pontos por voto: ${finalPointsForVote}`);
          }

          participante.score = (participante.score || 0) + finalPointsForVote; // Usar constante
          console.log(`[${codigo}] Score de ${participante.nome} atualizado para: ${participante.score} (+${finalPointsForVote} voto revelado)`);
          participantesAtualizados = true;
        }
      }
      // ------------------------------------

      // Emitir atualização de participantes PRIMEIRO (com scores atualizados)
      // Sempre emite: é aqui que os votos dos outros passam a ser visíveis
      emitirParticipantes(codigo);

      // Depois, emitir evento específico de votos revelados
      io.to(codigo).emit('votosRevelados');
      talvezChamarChefe(codigo, sala);
    });

    // Reiniciar votação
    socket.on('reiniciarVotacao', (codigo) => {
      if (!salas.has(codigo)) return;
      
      const sala = salas.get(codigo);
      sala.revelarVotos = false;
      
      for (const participante of sala.participantes.values()) {
        participante.jaVotou = false;
        participante.valorVotado = null;
        participante.life = GAME_CONFIG.LIFE.MAX; // Restaura a vida
        curarEnvenenamento(codigo, participante, false);
        // NÃO resetar participante.score
        // NÃO resetar participante.kills <-- Garantir que não reseta kills
      }
      
      io.to(codigo).emit('votacaoReiniciada');
      // Atualiza participantes com vida/voto resetado, mas score mantido
      emitirParticipantes(codigo);
    });

    // Alternar modo observador
    socket.on('alternarModoObservador', ({ codigo, usuario, isObservador }) => {
      if (!salas.has(codigo)) return;
      
      console.log('Servidor recebeu alternarModoObservador:', { codigo, usuario, isObservador });
      
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);
      
      if (participante) {
        participante.isObservador = isObservador;
        
        if (isObservador && participante.jaVotou) {
          participante.jaVotou = false;
          participante.valorVotado = null;
        }
        
        console.log('Servidor enviando modoObservadorAlterado:', { 
          usuario: participante,
          isObservador 
        });
        
        io.to(codigo).emit('modoObservadorAlterado', { 
          usuario: participante,
          isObservador 
        });
        
        emitirParticipantes(codigo);
      } else {
        console.log('Participante não encontrado no servidor:', socket.id);
      }
    });

    // Modo diversão alterado
    socket.on('funModeChanged', ({ codigo, enabled }) => {
      if (!salas.has(codigo)) return;
      
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);
      
      if (participante) {
        // Atualiza o estado do modo PVP no participante
        participante.keyboardMode = enabled;
        
        // Repassar o evento para todos os participantes da sala
        io.to(codigo).emit('funModeChanged', { enabled });
        
        // Atualiza todos os participantes para refletir a mudança
        emitirParticipantes(codigo);
      }
    });

    // --- Listener para Definir MÚLTIPLAS Assinaturas --- 
    socket.on('setCustomKillSignatures', ({ codigo, signatures }) => {
      if (!salas.has(codigo)) return;
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);
      
      if (participante && Array.isArray(signatures)) {
        // Validar e limpar CADA assinatura no array
        const validatedSignatures = signatures
          .slice(0, MAX_SIGNATURES) // Limita a quantidade de assinaturas
          .map(sig => (sig || "").trim().slice(0, MAX_KILL_MESSAGE_LENGTH))
          .filter(sig => sig !== ""); // Remove strings vazias após validação
          
        participante.customKillSignatures = validatedSignatures;
        console.log(`[${codigo}] Usuário ${participante.nome} (${socket.id}) definiu customKillSignatures para:`, validatedSignatures);
        
        // Informar todos da atualização para consistência (importante para o GameController)
        emitirParticipantes(codigo);
      } else {
         console.warn(`[${codigo}] Dados inválidos ou participante não encontrado para setCustomKillSignatures.`);
      }
    });
    // --- Fim do Listener Múltiplo ---

    // --- Listener para Equipar/Desequipar Acessório (Lógica de Slot) ---
    socket.on('toggleEquipAccessory', ({ codigo, itemId }) => {
      if (!salas.has(codigo)) return;
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);
      const itemData = ITEMS_DATA[itemId]; // Dados do item sendo equipado/desequipado

      // Validações:
      if (!participante) return;
      if (!itemData || itemData.type !== 'accessory') {
        console.warn(`[${codigo}] Tentativa de equipar item inválido ou não acessório: ${itemId}`);
        return;
      }
      if (!participante.inventory?.includes(itemId)) {
        console.warn(`[${codigo}] Participante ${participante.nome} não possui o item ${itemId} no inventário.`);
        return;
      }

      const itemSlot = itemData.equipSlot; // Slot do item clicado
      const currentlyEquipped = participante.equippedAccessories || []; // Garante que é um array
      const isCurrentlyEquipped = currentlyEquipped.includes(itemId);

      let updatedEquipped = [...currentlyEquipped]; // Cria cópia para modificar

      if (isCurrentlyEquipped) {
        // --- DESEQUIPAR --- 
        updatedEquipped = updatedEquipped.filter(id => id !== itemId);
        console.log(`[${codigo}] ${participante.nome} desequipou ${itemId}`);
      } else {
        // --- EQUIPAR --- 
        // Verifica se há conflito de slot exclusivo
        if (itemSlot && itemSlot !== 'misc' && itemSlot !== 'passive') { // Considera slots nomeados como exclusivos
          const conflictingItemIndex = updatedEquipped.findIndex(equippedId => 
            ITEMS_DATA[equippedId]?.equipSlot === itemSlot
          );
          if (conflictingItemIndex !== -1) {
            const conflictingItemId = updatedEquipped[conflictingItemIndex];
            console.log(`[${codigo}] ${participante.nome} equipando ${itemId} (slot: ${itemSlot}), desequipando ${conflictingItemId} (mesmo slot).`);
            // Remove o item conflitante
            updatedEquipped.splice(conflictingItemIndex, 1);
          }
        }
        // Adiciona o novo item
        updatedEquipped.push(itemId);
        console.log(`[${codigo}] ${participante.nome} equipou ${itemId}`);
      }
      
      // Atualiza o estado do participante
      participante.equippedAccessories = updatedEquipped;
      
      // Notifica todos sobre a mudança
      emitirParticipantes(codigo);
    });
    // --- Fim do Listener Equipar/Desequipar ---

    // --- Listener para Compra de Item ---
    socket.on('buyItem', ({ codigo, itemId, itemPrice }) => {
      const userId = socket.id; // Compra sempre com o próprio saldo
      console.log(`[Server] Recebido buyItem: user=${userId}, item=${itemId}, price=${itemPrice}, sala=${codigo}`);
      if (!salas.has(codigo)) {
        console.log(`[Server] buyItem falhou: Sala ${codigo} não encontrada.`);
        return; // Sala não existe
      }

      const sala = salas.get(codigo);
      const participante = sala.participantes.get(userId);

      if (!participante) {
        console.log(`[Server] buyItem falhou: Participante ${userId} não encontrado na sala ${codigo}.`);
        return; // Participante não encontrado
      }

      const item = ITEMS_DATA[itemId]; // Busca a definição do item

      if (!item) {
        console.log(`[Server] buyItem falhou: Item ${itemId} desconhecido.`);
        return; // Item não existe na definição do servidor
      }

      // Validação crucial do preço (evita trapaça no frontend)
      if (item.price !== itemPrice) {
         console.log(`[Server] buyItem falhou: Preço inválido para ${itemId}. Esperado: ${item.price}, Recebido: ${itemPrice}`);
         // Poderia emitir um erro de volta para o usuário aqui
         return; 
      }

      // Consumíveis e contra-ataques: empilham até maxStack (contra-ataque vem em pacote)
      if (item.type === 'consumable' || item.type === 'counter') {
        participante.consumables = participante.consumables || {};
        const qtdAtual = participante.consumables[itemId] || 0;
        const max = item.maxStack || 1;
        if (qtdAtual >= max) return;
        if (participante.score < item.price) return;
        participante.score -= item.price;
        participante.consumables[itemId] = Math.min(max, qtdAtual + (item.packSize || 1));
        console.log(`[${codigo}] ${participante.nome} comprou ${itemId} (${participante.consumables[itemId]}/${max}).`);
        if (item.type === 'counter' && !contraAtaqueAtivo(participante)) participante.selectedCounter = itemId;
        anunciarCompra(codigo, participante, itemId, participante.consumables[itemId] - qtdAtual);
        emitirParticipantes(codigo);
        return;
      }

      if (item.requires && !participante.inventory.includes(item.requires)) return; // upgrade sem o item base

      if (participante.inventory.includes(itemId)) {
        console.log(`[Server] buyItem falhou: Participante ${userId} já possui o item ${itemId}.`);
        // Poderia emitir um erro/aviso de volta para o usuário
        return; // Usuário já tem o item
      }

      if (participante.score < item.price) {
        console.log(`[Server] buyItem falhou: Score insuficiente para ${userId} comprar ${itemId}. Score: ${participante.score}, Preço: ${item.price}`);
        // Poderia emitir um erro de volta para o usuário
        return; // Score insuficiente
      }

      // Todas as validações passaram! Processar a compra.
      try {
        participante.score -= item.price;
        participante.inventory.push(itemId);
        if (itemId === BITCOIN_MINER_ID) garantirVidaMinerador(participante);

        // Arma nova já fica selecionada (e carregada, se usar munição)
        if (item.type === 'weapon') {
          participante.selectedWeapon = itemId;
          if (item.ammo) {
            participante.ammo = participante.ammo || {};
            participante.ammo[itemId] = item.ammo;
          }
        }

        // --- Lógica de Auto-Equipar (AJUSTADA PARA SLOTS) --- 
        if (item.type === 'accessory' && item.equipSlot) {
          const itemSlot = item.equipSlot;
          const equippedAccessories = participante.equippedAccessories || [];
          // Verifica se já existe algum item equipado NO MESMO SLOT
          const hasItemInSlot = equippedAccessories.some(equippedId => 
             ITEMS_DATA[equippedId]?.equipSlot === itemSlot
          );
          
          // Equipa automaticamente APENAS se o slot estiver vazio
          if (!hasItemInSlot) {
            // Se o slot for exclusivo, remove qualquer outro item desse slot (segurança extra, embora não devesse ter)
            if (itemSlot && itemSlot !== 'misc' && itemSlot !== 'passive') {
                participante.equippedAccessories = equippedAccessories.filter(equippedId => ITEMS_DATA[equippedId]?.equipSlot !== itemSlot);
            }
            participante.equippedAccessories.push(itemId);
            console.log(`[${codigo}] ${participante.nome} equipou automaticamente ${itemId} (slot ${itemSlot} estava vazio).`);
          }
        }
        // --- Fim da Lógica de Auto-Equipar ---

        console.log(`[Server] Compra bem-sucedida: ${userId} comprou ${itemId} por ${item.price}. Novo score: ${participante.score}. Inventário:`, participante.inventory);

        // Notificar todos na sala sobre a atualização dos participantes (novo score e inventário)
        emitirParticipantes(codigo);
        anunciarCompra(codigo, participante, itemId, 1);
        console.log(`[Server] Emitido atualizarParticipantes para sala ${codigo} após compra.`);

      } catch (error) {
        console.error(`[Server] Erro ao processar compra para ${userId}:`, error);
      }
    });
    // --- Fim do Listener Compra de Item ---

    // Minerador: a geração agora é feita pelo loop no servidor (ver minerarPara).

    // Desconexão: não remove na hora, guarda o participante esperando reconexão
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);

      for (const [codigo, sala] of salas.entries()) {
        const participante = sala.participantes.get(socket.id);
        if (!participante) continue;

        participante.desconectado = true;
        const chave = `${codigo}:${socket.id}`;
        if (remocoesPendentes.has(chave)) clearTimeout(remocoesPendentes.get(chave));
        remocoesPendentes.set(chave, setTimeout(() => removerParticipanteDefinitivo(codigo, socket.id), RECONNECT_GRACE_MS));

        console.log(`[${codigo}] ${participante.nome} desconectou. Aguardando reconexão por ${RECONNECT_GRACE_MS / 1000}s.`);
        emitirParticipantes(codigo);
      }
    });
  });

  // Roteamento do Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Servidor rodando em http://localhost:${PORT}`);
  });
}); 