const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

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

      salaAtual.participantes.set(socket.id, {
        ...usuario,
        id: socket.id,
        jaVotou: false,
        valorVotado: null,
        isModerador
      });
      
      io.to(codigo).emit('atualizarParticipantes', 
        Array.from(salaAtual.participantes.values())
      );
    });
    
    // Arremessar objeto (eventos de gamificação)
    socket.on('throwObject', (data) => {
      const { codigo, fromUser, toUser, objectType } = data;
      
      if (!salas.has(codigo)) return;
      
      // Repassar o evento para todos os participantes da sala
      io.to(codigo).emit('throwObject', {
        fromUser,
        toUser,
        objectType
      });
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