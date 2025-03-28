import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket já está em execução');
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  // Armazenar salas e participantes
  const salas = {};

  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    // Entrar na sala
    socket.on('entrarSala', ({ codigo, usuario }) => {
      socket.join(codigo);
      
      // Inicializar sala se não existir
      if (!salas[codigo]) {
        salas[codigo] = {
          participantes: [],
          revelarVotos: false
        };
      }
      
      // Verificar se o usuário já existe na sala (pelo nome)
      const usuarioExistente = salas[codigo].participantes.find(p => p.nome === usuario.nome);
      
      if (usuarioExistente) {
        // Atualizar o ID do socket para o usuário existente
        usuarioExistente.id = socket.id;
        usuarioExistente.isObservador = usuario.isObservador;
        
        // Se reconectar, garantir que o status de moderador seja mantido
        console.log(`Usuário ${usuario.nome} já existe na sala ${codigo}. Atualizando socket ID.`);
        
        // Enviar lista atualizada para todos na sala
        io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
        socket.emit('statusSala', {
          revelarVotos: salas[codigo].revelarVotos
        });
        return;
      }
      
      // Adicionar novo participante (primeiro usuário vira moderador)
      const isModerador = salas[codigo].participantes.length === 0;
      console.log(`Adicionando usuário ${usuario.nome} à sala ${codigo}. Moderador: ${isModerador}`);
      
      const novoParticipante = {
        id: socket.id,
        nome: usuario.nome,
        jaVotou: false,
        valorVotado: null,
        isModerador,
        isObservador: usuario.isObservador
      };
      
      salas[codigo].participantes.push(novoParticipante);
      
      // Enviar lista atualizada para todos na sala
      io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
      socket.emit('statusSala', {
        revelarVotos: salas[codigo].revelarVotos
      });
    });
    
    // Votar
    socket.on('votar', ({ codigo, usuario, voto }) => {
      if (!salas[codigo]) return;
      
      // Atualizar voto do participante pelo socket.id
      const participante = salas[codigo].participantes.find(p => p.id === socket.id);
      if (participante) {
        console.log(`Usuário ${participante.nome} votou ${voto} na sala ${codigo}`);
        participante.jaVotou = true;
        participante.valorVotado = voto;
        
        // Enviar lista atualizada para todos na sala
        io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
        io.to(codigo).emit('votoRecebido', { usuario: participante, voto });
      } else {
        console.log(`Erro: Não foi possível encontrar o participante com socket ID ${socket.id} na sala ${codigo}`);
      }
    });
    
    // Cancelar voto
    socket.on('cancelarVoto', ({ codigo, usuario }) => {
      if (!salas[codigo]) return;
      
      // Atualizar voto do participante
      const participante = salas[codigo].participantes.find(p => p.id === socket.id);
      if (participante) {
        participante.jaVotou = false;
        participante.valorVotado = null;
        
        // Enviar lista atualizada para todos na sala
        io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
      }
    });
    
    // Revelar votos
    socket.on('revelarVotos', (codigo) => {
      if (!salas[codigo]) return;
      
      salas[codigo].revelarVotos = true;
      io.to(codigo).emit('votosRevelados');
    });
    
    // Nova rodada
    socket.on('reiniciarVotacao', (codigo) => {
      if (!salas[codigo]) return;
      
      salas[codigo].revelarVotos = false;
      
      // Resetar votos de todos os participantes
      salas[codigo].participantes.forEach(p => {
        p.jaVotou = false;
        p.valorVotado = null;
      });
      
      io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
      io.to(codigo).emit('votacaoReiniciada');
    });
    
    // Toggle modo observador
    socket.on('alternarModoObservador', ({ codigo, usuario, isObservador }) => {
      if (!salas[codigo]) return;
      
      // Atualizar status do participante
      const participante = salas[codigo].participantes.find(p => p.id === socket.id);
      if (participante) {
        participante.isObservador = isObservador;
        
        // Se virou observador, cancela o voto
        if (isObservador && participante.jaVotou) {
          participante.jaVotou = false;
          participante.valorVotado = null;
        }
        
        // Enviar lista atualizada para todos na sala
        io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
        io.to(codigo).emit('modoObservadorAlterado', { usuario: participante, isObservador });
      }
    });
    
    // Desconexão
    socket.on('disconnect', () => {
      // Remover participante de todas as salas
      Object.keys(salas).forEach(codigo => {
        const index = salas[codigo].participantes.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          const era_moderador = salas[codigo].participantes[index].isModerador;
          salas[codigo].participantes.splice(index, 1);
          
          // Se não há mais participantes, remover a sala
          if (salas[codigo].participantes.length === 0) {
            delete salas[codigo];
            return;
          }
          
          // Se o moderador saiu, passar o papel para outro
          if (era_moderador && salas[codigo].participantes.length > 0) {
            salas[codigo].participantes[0].isModerador = true;
          }
          
          // Enviar lista atualizada para todos na sala
          io.to(codigo).emit('atualizarParticipantes', salas[codigo].participantes);
        }
      });
    });
  });

  console.log('Socket.io inicializado');
  res.end();
};

export default SocketHandler; 