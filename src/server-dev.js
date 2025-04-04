const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { GAME_CONFIG } = require('./constants/gameConfig');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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
          revelarVotos: false
        });
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
        life: GAME_CONFIG.LIFE.MAX // Adiciona vida inicial
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

        // Se foi kill NESTA TRANSIÇÃO, adiciona nomes e TIPO DA ARMA ao payload
        if (isKill) {
          payload.attackerName = participanteAtacante.nome;
          payload.targetName = participanteAlvo.nome;
          payload.weaponType = objectType;
          console.log(`[${codigo}] KILL EVENT (Transição): ${payload.attackerName} eliminou ${payload.targetName} com ${payload.weaponType}`);
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
      
      if (participante) {
        participante.jaVotou = true;
        participante.valorVotado = voto;
        
        io.to(codigo).emit('votoRecebido', { 
          usuario: participante,
          voto 
        });
        
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
        participante.life = GAME_CONFIG.LIFE.MAX; // Restaura a vida ao máximo
      }
      
      io.to(codigo).emit('votacaoReiniciada');
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