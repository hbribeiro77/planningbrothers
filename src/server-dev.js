const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const rooms = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('entrarSala', ({ codigo, usuario }) => {
      console.log(`Cliente ${socket.id} tentando entrar na sala ${codigo}`, usuario);
      
      socket.join(codigo);
      
      if (!rooms.has(codigo)) {
        console.log(`Criando nova sala ${codigo}`);
        rooms.set(codigo, {
          participants: new Map(),
          votes: new Map(),
          revealed: false,
          moderador: usuario.nome
        });
      }

      const room = rooms.get(codigo);
      room.participants.set(usuario.nome, {
        ...usuario,
        socketId: socket.id,
        jaVotou: false,
        valorVotado: null,
        isModerador: usuario.nome === room.moderador
      });

      console.log(`Sala ${codigo} atualizada:`, {
        participantsCount: room.participants.size,
        participants: Array.from(room.participants.values())
      });

      io.to(codigo).emit('atualizarParticipantes', 
        Array.from(room.participants.values())
      );
    });

    socket.on('votar', ({ codigo, usuario, voto }) => {
      const room = rooms.get(codigo);
      if (room && room.participants.has(usuario.nome)) {
        const participant = room.participants.get(usuario.nome);
        participant.jaVotou = voto !== null;
        participant.valorVotado = voto;
        
        io.to(codigo).emit('votoRecebido', {
          usuario,
          voto,
          jaVotou: voto !== null
        });
      }
    });

    socket.on('cancelarVoto', ({ codigo, usuario }) => {
      const room = rooms.get(codigo);
      if (room && room.participants.has(usuario.nome)) {
        const participant = room.participants.get(usuario.nome);
        participant.jaVotou = false;
        participant.valorVotado = null;
        
        io.to(codigo).emit('votoRecebido', {
          usuario,
          voto: null
        });
      }
    });

    socket.on('revelarVotos', (codigo) => {
      const room = rooms.get(codigo);
      if (room) {
        io.to(codigo).emit('votosRevelados');
      }
    });

    socket.on('reiniciarVotacao', (codigo) => {
      const room = rooms.get(codigo);
      if (room) {
        for (const participant of room.participants.values()) {
          participant.jaVotou = false;
          participant.valorVotado = null;
          
          io.to(codigo).emit('votoRecebido', {
            usuario: { nome: participant.nome },
            voto: null,
            jaVotou: false
          });
        }
        
        io.to(codigo).emit('votacaoReiniciada');
      }
    });

    socket.on('alternarModoObservador', ({ codigo, usuario, isObservador }) => {
      const room = rooms.get(codigo);
      if (room && room.participants.has(usuario.nome)) {
        const participant = room.participants.get(usuario.nome);
        participant.isObservador = isObservador;
        
        if (isObservador) {
          participant.jaVotou = false;
          participant.valorVotado = null;
        }
        
        io.to(codigo).emit('modoObservadorAlterado', {
          usuario,
          isObservador
        });
        
        io.to(codigo).emit('atualizarParticipantes', 
          Array.from(room.participants.values())
        );
      }
    });

    socket.on('disconnecting', () => {
      for (const [codigo, room] of rooms.entries()) {
        for (const [nome, participant] of room.participants.entries()) {
          if (participant.socketId === socket.id) {
            room.participants.delete(nome);
            
            if (room.participants.size === 0) {
              rooms.delete(codigo);
            } else {
              io.to(codigo).emit('atualizarParticipantes', 
                Array.from(room.participants.values())
              );
            }
          }
        }
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Servidor Socket.io rodando em http://localhost:${PORT}`);
  });
}); 