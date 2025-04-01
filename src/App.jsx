import { useState, useEffect } from 'react';
import { MantineProvider, ColorSchemeProvider, ColorScheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { GameController } from './components/GameElements/GameController';
import { GameBoard } from './components/GameElements/GameBoard';
import { GameHeader } from './components/GameElements/GameHeader';
import { GameFooter } from './components/GameElements/GameFooter';
import { GameModal } from './components/GameElements/GameModal';
import { useSocket } from './hooks/useSocket';
import { useLocalStorage } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';

function App() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [codigoSala, setCodigoSala] = useState('');
  const [participantes, setParticipantes] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  // ... resto do código existente ...

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider
        theme={{
          colorScheme,
          primaryColor: 'blue',
          defaultRadius: 'md',
        }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Notifications />
        <div className="game-container">
          <GameHeader 
            currentUser={currentUser}
            codigoSala={codigoSala}
            isHost={isHost}
            onLeaveRoom={handleLeaveRoom}
            onStartGame={handleStartGame}
            isGameStarted={isGameStarted}
            isGameFinished={isGameFinished}
            onNewGame={handleNewGame}
          />
          
          <GameBoard 
            participantes={participantes}
            currentUser={currentUser}
            isGameStarted={isGameStarted}
            isGameFinished={isGameFinished}
            gameState={gameState}
            isHost={isHost}
            onVote={handleVote}
          />

          <GameController
            socket={socket}
            codigoSala={codigoSala}
            currentUser={currentUser}
          />

          <GameFooter 
            currentUser={currentUser}
            codigoSala={codigoSala}
            isHost={isHost}
            onLeaveRoom={handleLeaveRoom}
            onStartGame={handleStartGame}
            isGameStarted={isGameStarted}
            isGameFinished={isGameFinished}
            onNewGame={handleNewGame}
          />
        </div>

        <GameModal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUser={currentUser}
          onJoinRoom={handleJoinRoom}
          onHostRoom={handleHostRoom}
        />
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App; 