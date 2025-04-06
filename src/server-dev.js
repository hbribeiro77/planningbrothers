const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { GAME_CONFIG } = require('./constants/gameConfig');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Define o título padrão para kills
const DEFAULT_KILL_TITLE = 'Eliminação!';

const MAX_KILL_MESSAGE_LENGTH = 50; // Garante que o backend use o mesmo limite
const MAX_SIGNATURES = 3; // Limite de assinaturas
const COLETE_DPE_ID = 'vest'; // Definir ID constante no servidor

// Definição de itens (pode ser movida para um arquivo separado no futuro)
const itemsData = {
  [COLETE_DPE_ID]: { name: 'Colete DPE', price: 1 },
  // Adicionar mais itens aqui
};

// Helper para verificar quais itens são acessórios (simplificado por enquanto)
const isAccessory = (itemId) => itemId === COLETE_DPE_ID;

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
        inventory: [], // <<<<< ADICIONAR INVENTÁRIO INICIAL
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
    socket.on('damage', (data) => {
      // Receber objectType do payload
      const { codigo, fromUserId, targetId, damage, objectType } = data;
      
      // Log inicial para depuração (incluindo objectType)
      console.log(`[${codigo}] Evento 'damage' recebido: fromUserId=${fromUserId}, targetId=${targetId}, damage=${damage}, objectType=${objectType}`);
      
      if (!salas.has(codigo)) return;
      
      const sala = salas.get(codigo);
      const participanteAlvo = Array.from(sala.participantes.values())
        .find(p => p.id === targetId);
      const participanteAtacante = sala.participantes.get(fromUserId);

      // Log após buscar participantes
      const nomeAlvoLog = participanteAlvo ? participanteAlvo.nome : 'NÃO ENCONTRADO';
      const nomeAtacanteLog = participanteAtacante ? participanteAtacante.nome : 'NÃO ENCONTRADO';
      console.log(`[${codigo}] Participantes encontrados: Atacante=${nomeAtacanteLog} (${fromUserId}), Alvo=${nomeAlvoLog} (${targetId})`);

      // Verifica se os participantes foram encontrados E se o atacante é diferente do alvo
      if (participanteAlvo && participanteAtacante && fromUserId !== targetId) {
        const danoRecebido = damage;
        
        // Guarda a vida ANTES do dano
        const vidaAntes = participanteAlvo.life;

        // Atualiza a vida do participante
        participanteAlvo.life = Math.max(GAME_CONFIG.LIFE.MIN, participanteAlvo.life - danoRecebido);
        const vidaDepois = participanteAlvo.life;
        console.log(`[${codigo}] Vida de ${nomeAlvoLog} atualizada de ${vidaAntes} para: ${vidaDepois}`);

        // Verifica se foi uma eliminação NESTE ATAQUE ESPECÍFICO
        const isKill = vidaAntes > GAME_CONFIG.LIFE.MIN && vidaDepois <= GAME_CONFIG.LIFE.MIN;

        // Prepara o payload base do evento
        const payload = {
          targetId: targetId,
          damage: danoRecebido, 
          currentLife: vidaDepois
        };

        // Se foi kill NESTA TRANSIÇÃO, adiciona nomes, TIPO DA ARMA e TÍTULO da kill
        if (isKill) {
          // --- Seleção da Assinatura/Título ---
          const signatures = participanteAtacante.customKillSignatures;
          let killTitle = DEFAULT_KILL_TITLE; // Título padrão
          
          // Se houver assinaturas válidas no array, escolhe uma aleatoriamente
          if (Array.isArray(signatures) && signatures.length > 0) {
            const validSignatures = signatures.filter(s => typeof s === 'string' && s.trim() !== ''); // Garante que não pegue vazias por engano
            if (validSignatures.length > 0) {
              const randomIndex = Math.floor(Math.random() * validSignatures.length);
              killTitle = validSignatures[randomIndex];
            }
          }
          // --- Fim da Seleção ---
          
          payload.attackerName = participanteAtacante.nome;
          payload.targetName = participanteAlvo.nome;
          payload.weaponType = objectType; 
          payload.killTitle = killTitle; // Usa o título selecionado (aleatório ou padrão)
          
          // --- Adiciona ponto por Kill ---
          participanteAtacante.score = (participanteAtacante.score || 0) + 1;
          console.log(`[${codigo}] Score de ${participanteAtacante.nome} atualizado para: ${participanteAtacante.score} (+1 kill)`);
          // --- Incrementa Kills ---
          participanteAtacante.kills = (participanteAtacante.kills || 0) + 1;
          console.log(`[${codigo}] Kills de ${participanteAtacante.nome} atualizado para: ${participanteAtacante.kills}`);
          // -----------------------------
          
          console.log(`[${codigo}] KILL EVENT (Transição): ${killTitle} - ${payload.attackerName} eliminou ${payload.targetName} com ${payload.weaponType}`);
        } else if (vidaDepois <= GAME_CONFIG.LIFE.MIN) {
           console.log(`[${codigo}] Dano aplicado em ${nomeAlvoLog}, que já estava com vida <= ${GAME_CONFIG.LIFE.MIN}.`);
        }

        // Emite evento de dano para todos na sala
        io.to(codigo).emit('damageReceived', payload);

        // Atualiza a lista de participantes (importante para a barra de vida refletir)
        io.to(codigo).emit('atualizarParticipantes', 
          Array.from(sala.participantes.values())
        );
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

      if (participante && participante.inventory?.includes(itemId)) {
        // Se o item clicado já está equipado, desequipa.
        if (participante.equippedAccessory === itemId) {
          participante.equippedAccessory = null;
          console.log(`[${codigo}] ${participante.nome} desequipou ${itemId}`);
        } 
        // Se nenhum item está equipado ou outro item está equipado, equipa o novo item.
        else {
          // Por enquanto, só permitimos 1 acessório (o colete), então podemos simplesmente equipar.
          // No futuro, pode precisar de lógica para desequipar o anterior se houver slots.
          participante.equippedAccessory = itemId;
          console.log(`[${codigo}] ${participante.nome} equipou ${itemId}`);
        }
        
        // Notifica todos sobre a mudança no estado do participante
        io.to(codigo).emit('atualizarParticipantes', Array.from(sala.participantes.values()));
      } else {
        console.warn(`[${codigo}] Participante ${socket.id} tentou equipar item inválido (${itemId}) ou não encontrado.`);
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

      const item = itemsData[itemId]; // Busca a definição do item

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