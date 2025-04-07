const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { GAME_CONFIG } = require('./constants/gameConfig');
const { ITEMS_DATA, KEYBOARD_ID } = require('./constants/itemsData');

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

      // Primeiro adiciona o usuário à sala
      salaAtual.participantes.set(socket.id, {
        ...usuario,
        id: socket.id,
        jaVotou: false,
        valorVotado: null,
        isModerador,
        keyboardMode: isModerador ? true : false, // Define o keyboardMode inicial
        life: GAME_CONFIG.LIFE.MAX, // Adiciona vida inicial
        customKillSignatures: [],
        score: 0,
        kills: 0, // <-- Inicializa kills
        inventory: [KEYBOARD_ID], // <<< INICIALIZAR COM TECLADO
        equippedAccessory: null, // <<<< Novo estado para acessório equipado
      });

      // Se não for o primeiro participante, copia o modo PVP do moderador
      if (!isModerador) {
        const moderador = Array.from(salaAtual.participantes.values()).find(p => p.isModerador);
        if (moderador) {
          const participante = salaAtual.participantes.get(socket.id);
          participante.keyboardMode = moderador.keyboardMode;
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
      const { codigo, fromUserId, targetId, objectType, attackDirection } = data;
      
      console.log(`[${codigo}] Evento 'attack' recebido: fromUserId=${fromUserId}, targetId=${targetId}, objectType=${objectType}, direction=${attackDirection}`);
      
      if (!salas.has(codigo)) return;
      
      const sala = salas.get(codigo);
      const participanteAlvo = Array.from(sala.participantes.values())
        .find(p => p.id === targetId);
      const participanteAtacante = sala.participantes.get(fromUserId);

      const nomeAlvoLog = participanteAlvo ? participanteAlvo.nome : 'NÃO ENCONTRADO';
      const nomeAtacanteLog = participanteAtacante ? participanteAtacante.nome : 'NÃO ENCONTRADO';

      if (participanteAlvo && participanteAtacante && fromUserId !== targetId) {
        
        // --- INÍCIO: Verificação de Esquiva (Dodge) ---
        const targetEquippedId = participanteAlvo.equippedAccessory;
        const targetAccessoryData = targetEquippedId ? ITEMS_DATA[targetEquippedId] : null;
        const dodgeChance = targetAccessoryData?.dodgeChance || 0;

        if (dodgeChance > 0 && Math.random() < dodgeChance) {
          console.log(`[${codigo}] *** ATAQUE ESQUIVADO por ${nomeAlvoLog} (Item: ${targetEquippedId})! ***`);

          // Emitir evento indicando a esquiva (sem dano)
          io.to(codigo).emit('damageReceived', {
            targetId: targetId,
            damage: 0, 
            currentLife: participanteAlvo.life, // Vida não muda
            isCritical: false,
            isDodge: true, // <<< Nova flag indicando esquiva
            attackDirection: attackDirection // << INCLUIR DIREÇÃO AQUI
          });
          
          return; // Interrompe o processamento do ataque
        }
        // --- FIM: Verificação de Esquiva (Dodge) ---
        
        // --- Obter Dados da Arma --- 
        const weaponData = ITEMS_DATA[objectType];
        if (!weaponData || weaponData.type !== 'weapon') {
          console.warn(`[${codigo}] Tipo de objeto inválido ou não é arma: ${objectType}`);
          return; // Ignora se não for uma arma válida
        }
        
        // --- Calcular Poder de Ataque Total ---
        const baseDamageFixed = weaponData.baseDamageFixed || 0;
        const baseDamageRolled = rollDice(weaponData.baseDamageDice);
        console.log(`[${codigo}] Arma '${objectType}': ${baseDamageFixed} fixo + ${baseDamageRolled} (rolado de ${weaponData.baseDamageDice})`);

        let attackerBonusFixed = 0;
        let attackerBonusRolled = 0;
        const attackerEquippedId = participanteAtacante.equippedAccessory;
        const attackerAccessoryData = attackerEquippedId ? ITEMS_DATA[attackerEquippedId] : null;
        if (attackerAccessoryData && attackerAccessoryData.type === 'accessory') { // Verifica se é acessório
          attackerBonusFixed = attackerAccessoryData.attackBonusFixed || 0;
          attackerBonusRolled = rollDice(attackerAccessoryData.attackBonusDice);
          console.log(`[${codigo}] Atacante ${nomeAtacanteLog} acessório '${attackerEquippedId}': +${attackerBonusFixed} fixo, +${attackerBonusRolled} (rolado de ${attackerAccessoryData.attackBonusDice})`);
        } else {
          console.log(`[${codigo}] Atacante ${nomeAtacanteLog} sem acessório de bônus de ataque.`);
        }
        const totalAttackPower = baseDamageFixed + baseDamageRolled + attackerBonusFixed + attackerBonusRolled;
        console.log(`[${codigo}] Poder de Ataque Total: ${totalAttackPower}`);

        // --- Calcular Dano (Considerando Crítico da Arma) ---
        let finalDamage = 0;
        let isCriticalHit = false;
        const critChance = weaponData.criticalChance || 0; // << Pega chance de crítico da ARMA

        if (Math.random() < critChance) {
          isCriticalHit = true;
          finalDamage = participanteAlvo.life; 
          console.log(`[${codigo}] *** CRITICAL HIT pela arma ${objectType}! ***`);
        } else {
          // Calcular Defesa Total do Alvo
          let targetDefenseFixed = 0;
          let targetDefenseRolled = 0;
          const targetEquippedId = participanteAlvo.equippedAccessory;
          const targetAccessoryData = targetEquippedId ? ITEMS_DATA[targetEquippedId] : null;
          if (targetAccessoryData && targetAccessoryData.type === 'accessory') { // Verifica se é acessório
            targetDefenseFixed = targetAccessoryData.defenseFixed || 0;
            targetDefenseRolled = rollDice(targetAccessoryData.defenseDice);
            console.log(`[${codigo}] Alvo ${nomeAlvoLog} acessório '${targetEquippedId}': +${targetDefenseFixed} fixa, +${targetDefenseRolled} (rolada de ${targetAccessoryData.defenseDice})`);
          } else {
            console.log(`[${codigo}] Alvo ${nomeAlvoLog} sem acessório de defesa.`);
          }
          const totalDefense = targetDefenseFixed + targetDefenseRolled;
          console.log(`[${codigo}] Defesa Total do Alvo: ${totalDefense}`);

          // Calcular Dano Normal
          finalDamage = Math.max(0, totalAttackPower - totalDefense);
          console.log(`[${codigo}] Dano Normal calculado: ${totalAttackPower} (ataque) - ${totalDefense} (defesa) = ${finalDamage}`);
        }
        
        // --- Aplicar Dano e Verificar Kill ---
        const vidaAntes = participanteAlvo.life;
        participanteAlvo.life = Math.max(GAME_CONFIG.LIFE.MIN, vidaAntes - finalDamage);
        const vidaDepois = participanteAlvo.life;
        console.log(`[${codigo}] Vida de ${nomeAlvoLog} atualizada de ${vidaAntes} para: ${vidaDepois} (dano sofrido: ${finalDamage}, crítico: ${isCriticalHit})`);
        
        const isKill = vidaDepois <= GAME_CONFIG.LIFE.MIN && vidaAntes > GAME_CONFIG.LIFE.MIN;

        const payload = {
          targetId: targetId,
          damage: finalDamage, 
          currentLife: vidaDepois,
          isCritical: isCriticalHit,
          isDodge: false, // <<< Indicar que não houve esquiva
          attackDirection: attackDirection // << INCLUIR DIREÇÃO AQUI
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
          participanteAtacante.score = (participanteAtacante.score || 0) + pointsForKill;
          participanteAtacante.kills = (participanteAtacante.kills || 0) + 1;
          console.log(`[${codigo}] KILL EVENT... (Crítico: ${isCriticalHit})`);
        } else if (vidaDepois <= GAME_CONFIG.LIFE.MIN) {
           console.log(`[${codigo}] Dano aplicado em ${nomeAlvoLog}, que já estava com vida <= ${GAME_CONFIG.LIFE.MIN}.`);
        }

        io.to(codigo).emit('damageReceived', payload);
        io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));

      } else {
          // Log caso atacante seja igual ao alvo ou participantes não encontrados
          if (fromUserId === targetId) {
              console.warn(`[${codigo}] Tentativa de dano onde atacante (${fromUserId}) é igual ao alvo (${targetId}). Evento ignorado.`);
          } else {
              console.warn(`[${codigo}] Atacante (${fromUserId}) ou Alvo (${targetId}) não encontrado(s). Evento ignorado.`);
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
          participante.score = (participante.score || 0) + 10;
          console.log(`[${codigo}] Score de ${participante.nome} atualizado para: ${participante.score} (+10 voto revelado)`);
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

    // --- Listener para Equipar/Desequipar Acessório ---
    socket.on('toggleEquipAccessory', ({ codigo, itemId }) => {
      if (!salas.has(codigo)) return;
      const sala = salas.get(codigo);
      const participante = sala.participantes.get(socket.id);

      // Verifica se participante existe, se o item é um acessório válido, e se o participante possui o item
      if (participante && isAccessory(itemId) && participante.inventory?.includes(itemId)) {
        // Se o item clicado já está equipado, desequipa.
        if (participante.equippedAccessory === itemId) {
          participante.equippedAccessory = null;
          console.log(`[${codigo}] ${participante.nome} desequipou ${itemId}`);
        } 
        // Se um item diferente ou nenhum item estava equipado, equipa o NOVO item.
        else {
          participante.equippedAccessory = itemId;
          console.log(`[${codigo}] ${participante.nome} equipou ${itemId}`);
        }
        
        // Notifica todos sobre a mudança no estado do participante
        io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));
      } else {
        console.warn(`[${codigo}] Participante ${socket.id} tentou equipar item inválido (${itemId}) ou não encontrado no inventário.`);
      }
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

        // --- Lógica de Auto-Equipar --- 
        // Conta quantos acessórios o participante tem AGORA
        const currentAccessoryCount = participante.inventory.filter(isAccessory).length;
        
        // Se o item comprado é um acessório E é o único acessório que ele possui,
        // equipa automaticamente.
        if (isAccessory(itemId) && currentAccessoryCount === 1) {
          participante.equippedAccessory = itemId;
          console.log(`[${codigo}] ${participante.nome} equipou automaticamente ${itemId} por ser o único acessório.`);
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