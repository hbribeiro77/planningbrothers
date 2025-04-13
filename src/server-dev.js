const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { GAME_CONFIG } = require('./constants/gameConfig');
const { ITEMS_DATA, KEYBOARD_ID, MANIFESTO_ID, MEDALHA_ID } = require('./constants/itemsData');

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

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Entrar em uma sala
    socket.on('entrarSala', ({ codigo, usuario }) => {
      // Verifica se já existe alguém com este token/browser na sala
      const sala = salas.get(codigo);
      if (sala) {
        const participanteExistente = Array.from(sala.participantes.values())
          .find(p => p.token === usuario.token && p.browserName === usuario.browserName);
          
        if (participanteExistente) {
          // Se já existe uma sessão deste navegador na sala, rejeita a conexão
          socket.emit('erroEntrada', {
            mensagem: 'Você já está conectado nesta sala em outra aba/janela deste navegador'
          });
          return;
        }
      }
      
      // Se não existe, permite a entrada
      socket.join(codigo);
      
      if (!salas.has(codigo)) {
        salas.set(codigo, {
          participantes: new Map(),
          moderadorId: null,
          revelarVotos: false,
          pvpAtivo: false, // Adiciona estado PVP inicial para a sala
          // Adiciona mais estados da sala se necessário
        });
        console.log(`Sala ${codigo} criada por ${usuario.nome}`);
      }
      
      const salaAtual = salas.get(codigo);
      const isModerador = salaAtual.participantes.size === 0;

      // Verifica se o usuário já está na sala (reconexão?)
      let participanteExistente = null;
      if (salaAtual.participantes) {
          participanteExistente = Array.from(salaAtual.participantes.values()).find(p => p.browserToken === usuario.browserToken && p.nome === usuario.nome);
      }
      
      if (participanteExistente) {
          // Atualizar o socket ID do participante existente
          // Remover a entrada antiga pelo socket.id antigo (se houver)
          for (let [oldSocketId, p] of salaAtual.participantes.entries()) {
              if (p.browserToken === usuario.browserToken && p.nome === usuario.nome && oldSocketId !== socket.id) {
                  salaAtual.participantes.delete(oldSocketId);
                  break;
              }
          }
          // Adiciona com o novo socket.id, mantendo o estado
          salaAtual.participantes.set(socket.id, { ...participanteExistente, id: socket.id });
          console.log(`[${codigo}] Usuário ${usuario.nome} reconectou com socket ID ${socket.id}`);
          
      } else {
          // Primeiro adiciona o usuário à sala (Novo Participante)
          salaAtual.participantes.set(socket.id, {
              ...usuario,
              id: socket.id,
              jaVotou: false,
              valorVotado: null,
              isModerador,
              keyboardMode: isModerador ? true : false,
              life: GAME_CONFIG.LIFE.MAX, 
              customKillSignatures: [],
              score: 0,
              kills: 0, 
              inventory: [KEYBOARD_ID], 
              // ALTERADO: Usar array para múltiplos acessórios
              equippedAccessories: [], 
          });
          console.log(`[${codigo}] Usuário ${usuario.nome} entrou na sala com socket ID ${socket.id}`);

          // Se não for o primeiro, copia o modo PVP do moderador
          if (!isModerador) {
              const moderador = Array.from(salaAtual.participantes.values()).find(p => p.isModerador);
              if (moderador) {
                  const participanteNovo = salaAtual.participantes.get(socket.id);
                  participanteNovo.keyboardMode = moderador.keyboardMode;
              }
          }
      }
      
      io.to(codigo).emit('atualizarParticipantes', 
        Array.from(salaAtual.participantes.values())
      );
    });
    
    // Arremessar objeto (eventos de gamificação)
    socket.on('throwObject', (data) => {
      const { codigo, fromUser, toUser, objectType } = data;
      
      if (!salas.has(codigo)) return;

      // Apenas repassa o evento para iniciar a animação
      io.to(codigo).emit('throwObject', {
        fromUser,
        toUser,
        objectType
      });
    });

    // Aplicar dano após a animação
    socket.on('attack', (data) => {
      const { codigo, fromUserId, targetId, objectType } = data;
      
      if (!salas.has(codigo)) {
        console.warn(`[${codigo}] Sala não encontrada para o evento attack. Abortando.`);
        return;
      }
      
      const sala = salas.get(codigo);
      const participanteAlvo = Array.from(sala.participantes.values())
        .find(p => p.id === targetId);
      const participanteAtacante = sala.participantes.get(fromUserId);

      if (participanteAlvo && participanteAtacante && fromUserId !== targetId) {
        
        // --- INÍCIO: Verificação de Esquiva (Dodge) --- CORRECTED ---
        let highestDodgeChance = 0;
        let dodgingItemName = null;
        let totalDodgeChanceBonus = 0; 
        // Itera sobre TODOS os itens no INVENTÁRIO do alvo para bônus passivos
        for (const itemId of participanteAlvo.inventory || []) { 
          const itemData = ITEMS_DATA[itemId];
          if (itemData && itemData.type === 'accessory') {
            // Encontra a maior chance base de esquiva APENAS se equipado
            if (participanteAlvo.equippedAccessories?.includes(itemId) && itemData.dodgeChance && itemData.dodgeChance > highestDodgeChance) {
                highestDodgeChance = itemData.dodgeChance;
                dodgingItemName = itemData.name;
            }
            // Acumula bônus de esquiva de todos os itens no inventário
            totalDodgeChanceBonus += (itemData.dodgeChanceBonus || 0);
          }
        }

        const finalDodgeChance = highestDodgeChance + totalDodgeChanceBonus;

        if (finalDodgeChance > 0 && Math.random() < finalDodgeChance) {
          console.log(`[${codigo}] *** ATAQUE ESQUIVADO por ${participanteAlvo.nome} (Item Base: ${dodgingItemName || 'Nenhum'}, Chance Base: ${highestDodgeChance * 100}%, Bônus Total: ${totalDodgeChanceBonus * 100}%, Final: ${finalDodgeChance * 100}%)! ***`);
          
          // >>> ADICIONAR CRIAÇÃO E INCLUSÃO DO ID ÚNICO AO EVENTO AQUI <<< 
          const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          io.to(codigo).emit('damageReceived', {
            eventId: eventId, // <<< Incluir ID no payload
            targetId: targetId,
            damage: 0, 
            currentLife: participanteAlvo.life,
            isCritical: false,
            isDodge: true 
          });
          return; // Interrompe o processamento do ataque
        }
        // --- FIM: Verificação de Esquiva (Dodge) ---
        
        // --- Obter Dados da Arma --- (sem alteração)
        const weaponData = ITEMS_DATA[objectType];
        if (!weaponData || weaponData.type !== 'weapon') {
          console.warn(`[${codigo}] Tipo de objeto inválido ou não é arma: ${objectType}`);
          return;
        }
        
        // --- Calcular Poder de Ataque Total --- CORRECTED ---
        const baseDamageFixed = weaponData.baseDamageFixed || 0;
        const baseDamageRolled = rollDice(weaponData.baseDamageDice);
        console.log(`[${codigo}] Arma '${objectType}': ${baseDamageFixed} fixo + ${baseDamageRolled} (rolado de ${weaponData.baseDamageDice})`);

        let totalAttackerBonusFixed = 0;
        let totalAttackerBonusRolled = 0;
        // Itera sobre TODOS os acessórios do atacante
        for (const equippedId of participanteAtacante.equippedAccessories || []) {
            const accessoryData = ITEMS_DATA[equippedId];
            if (accessoryData && accessoryData.type === 'accessory') {
                const bonusFixo = accessoryData.attackBonusFixed || 0;
                const bonusDado = rollDice(accessoryData.attackBonusDice);
                totalAttackerBonusFixed += bonusFixo;
                totalAttackerBonusRolled += bonusDado;
                if (bonusFixo !== 0 || accessoryData.attackBonusDice) {
                   console.log(`[${codigo}] Atacante ${participanteAtacante.nome} acessório '${equippedId}': +${bonusFixo} fixo, +${bonusDado} (rolado de ${accessoryData.attackBonusDice})`);
                }
            }
        }
        console.log(`[${codigo}] Atacante ${participanteAtacante.nome} Bônus Total Acessórios: +${totalAttackerBonusFixed} fixo, +${totalAttackerBonusRolled} rolado`);
        
        const totalAttackPower = baseDamageFixed + baseDamageRolled + totalAttackerBonusFixed + totalAttackerBonusRolled;
        console.log(`[${codigo}] Poder de Ataque Total: ${totalAttackPower}`);

        // --- Calcular Dano (Considerando Crítico da Arma) --- CORRECTED DEFENSE ---
        let finalDamage = 0;
        let isCriticalHit = false;
        const critChanceBase = weaponData.criticalChance || 0;
        let totalCritChanceBonus = 0; 

        // Acumula bônus de crítico dos acessórios no INVENTÁRIO do ATACANTE
        for (const itemId of participanteAtacante.inventory || []) {
          const itemData = ITEMS_DATA[itemId];
          if (itemData && itemData.type === 'accessory') {
            totalCritChanceBonus += (itemData.criticalChanceBonus || 0);
          }
        }

        const finalCritChance = critChanceBase + totalCritChanceBonus;

        if (finalCritChance > 0 && Math.random() < finalCritChance) {
          isCriticalHit = true;
          finalDamage = participanteAlvo.life; // Dano crítico ignora defesa
          console.log(`[${codigo}] *** CRITICAL HIT pela arma ${objectType}! (Chance Base: ${critChanceBase * 100}%, Bônus Total: ${totalCritChanceBonus * 100}%, Final: ${finalCritChance * 100}%) ***`);
        } else {
          // Calcular Defesa Total do Alvo
          let totalTargetDefenseFixed = 0;
          let totalTargetDefenseRolled = 0;
          // Itera sobre TODOS os acessórios do alvo
          for (const equippedId of participanteAlvo.equippedAccessories || []) {
              const accessoryData = ITEMS_DATA[equippedId];
              if (accessoryData && accessoryData.type === 'accessory') {
                  const defFixa = accessoryData.defenseFixed || 0;
                  const defDado = rollDice(accessoryData.defenseDice);
                  totalTargetDefenseFixed += defFixa;
                  totalTargetDefenseRolled += defDado;
                  if (defFixa !== 0 || accessoryData.defenseDice) {
                     console.log(`[${codigo}] Alvo ${participanteAlvo.nome} acessório '${equippedId}': +${defFixa} fixa, +${defDado} (rolada de ${accessoryData.defenseDice})`);
                  }
              }
          }
          console.log(`[${codigo}] Alvo ${participanteAlvo.nome} Defesa Total Acessórios: +${totalTargetDefenseFixed} fixa, +${totalTargetDefenseRolled} rolada`);
          
          const totalDefense = totalTargetDefenseFixed + totalTargetDefenseRolled;
          console.log(`[${codigo}] Defesa Total do Alvo: ${totalDefense}`);

          // Calcular Dano Normal
          finalDamage = Math.max(0, totalAttackPower - totalDefense);
          console.log(`[${codigo}] Dano Normal calculado: ${totalAttackPower} (ataque) - ${totalDefense} (defesa) = ${finalDamage}`);
        }
        
        // --- Aplicar Dano e Verificar Kill --- (sem alteração aqui)
        const vidaAntes = participanteAlvo.life;
        participanteAlvo.life = Math.max(GAME_CONFIG.LIFE.MIN, vidaAntes - finalDamage);
        const vidaDepois = participanteAlvo.life;
        console.log(`[${codigo}] Vida de ${participanteAlvo.nome} atualizada de ${vidaAntes} para: ${vidaDepois} (dano sofrido: ${finalDamage}, crítico: ${isCriticalHit})`);
        
        const isKill = vidaDepois <= GAME_CONFIG.LIFE.MIN && vidaAntes > GAME_CONFIG.LIFE.MIN;

        // >>> ADICIONAR ID ÚNICO AO EVENTO <<<
        const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const payload = {
          eventId: eventId, // <<< Incluir ID no payload
          targetId: targetId,
          damage: finalDamage, 
          currentLife: vidaDepois,
          isCritical: isCriticalHit,
          isDodge: false // <<< Indicar que não houve esquiva
        };

        if (isKill) {
          const signatures = participanteAtacante.customKillSignatures;
          let killTitle = DEFAULT_KILL_TITLE;
          if (Array.isArray(signatures) && signatures.length > 0) {
            const validSignatures = signatures.filter(s => typeof s === 'string' && s.trim() !== '');
            if (validSignatures.length > 0) {
              const randomIndex = Math.floor(Math.random() * validSignatures.length);
              killTitle = validSignatures[randomIndex];
            }
          }
          payload.attackerName = participanteAtacante.nome;
          payload.targetName = participanteAlvo.nome;
          payload.weaponType = objectType; 
          payload.killTitle = killTitle;
          
          const pointsForKill = GAME_CONFIG.POINTS.KILL || 0;
          let finalPointsForKill = pointsForKill;

          // Verificar se o atacante possui o Manifesto Comunista
          if (participanteAtacante.inventory?.includes(MANIFESTO_ID)) {
            const multiplier = ITEMS_DATA[MANIFESTO_ID]?.scoreMultiplier || 1;
            finalPointsForKill *= multiplier;
            console.log(`[${codigo}] Aplicando multiplicador (${multiplier}x) do Manifesto. Pontos por kill: ${finalPointsForKill}`);
          }

          participanteAtacante.score = (participanteAtacante.score || 0) + finalPointsForKill;
          participanteAtacante.kills = (participanteAtacante.kills || 0) + 1;
          console.log(`[${codigo}] KILL EVENT... (Crítico: ${isCriticalHit})`);
        } else if (vidaDepois <= GAME_CONFIG.LIFE.MIN) {
           console.log(`[${codigo}] Dano aplicado em ${participanteAlvo.nome}, que já estava com vida <= ${GAME_CONFIG.LIFE.MIN}.`);
        }

        io.to(codigo).emit('damageReceived', payload);
        
        io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));

      } else {
          // Log caso atacante seja igual ao alvo ou participantes não encontrados
          if (fromUserId === targetId) {
              console.warn(`[${codigo}] Tentativa de dano onde atacante (${fromUserId}) é igual ao alvo (${targetId}). Evento ignorado.`);
          } else {
              console.warn(`[${codigo}] Atacante (${fromUserId}, Nome=${participanteAtacante.nome}) ou Alvo (${targetId}, Nome=${participanteAlvo.nome}) não encontrado(s) ou inválido. Evento ignorado.`);
          }
          // Não faz nada se o atacante for igual ao alvo ou se algum participante não foi encontrado
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
        io.to(codigo).emit('atualizarParticipantes', 
          Array.from(sala.participantes.values())
        );
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
        
        io.to(codigo).emit('atualizarParticipantes', 
          Array.from(sala.participantes.values())
        );
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
      if (participantesAtualizados) {
          io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));
      }

      // Depois, emitir evento específico de votos revelados
      io.to(codigo).emit('votosRevelados');
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
        // NÃO resetar participante.score
        // NÃO resetar participante.kills <-- Garantir que não reseta kills
      }
      
      io.to(codigo).emit('votacaoReiniciada');
      // Atualiza participantes com vida/voto resetado, mas score mantido
      io.to(codigo).emit('atualizarParticipantes', 
        Array.from(sala.participantes.values())
      );
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
        
        io.to(codigo).emit('atualizarParticipantes', 
          Array.from(sala.participantes.values())
        );
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
        io.to(codigo).emit('atualizarParticipantes', 
          Array.from(sala.participantes.values())
        );
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
        io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));
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
      io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));
    });
    // --- Fim do Listener Equipar/Desequipar ---

    // --- Listener para Compra de Item ---
    socket.on('buyItem', ({ codigo, userId, itemId, itemPrice }) => {
      console.log(`[Server] Recebido buyItem: user=${userId}, item=${itemId}, price=${itemPrice}, sala=${codigo}`);
      if (!salas.has(codigo)) {
        console.log(`[Server] buyItem falhou: Sala ${codigo} não encontrada.`);
        return; // Sala não existe
      }

      const sala = salas.get(codigo);
      const participante = Array.from(sala.participantes.values()).find(p => p.id === userId);

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
        io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));
        console.log(`[Server] Emitido atualizarParticipantes para sala ${codigo} após compra.`);

      } catch (error) {
        console.error(`[Server] Erro ao processar compra para ${userId}:`, error);
      }
    });
    // -------------------------------------

    // Desconexão
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
      
      for (const [codigo, sala] of salas.entries()) {
        if (sala.participantes.has(socket.id)) {
          const participante = sala.participantes.get(socket.id);
          const eraModerador = participante.isModerador;
          
          sala.participantes.delete(socket.id);
          
          if (sala.participantes.size === 0) {
            salas.delete(codigo);
            continue;
          }
          
          if (eraModerador) {
            const novoModerador = sala.participantes.values().next().value;
            if (novoModerador) {
              novoModerador.isModerador = true;
            }
          }
          
          io.to(codigo).emit('atualizarParticipantes', 
            Array.from(sala.participantes.values())
          );
        }
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