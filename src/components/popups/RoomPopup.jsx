import React, { useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../firebase';
import { ArrowLeft, Users, Play } from 'lucide-react';

const RoomPopup = ({ currentRoom, currentUser, gameCountdown, setGameCountdown, toggleReady, startGameCountdown, leaveRoom }) => {
  useEffect(() => {
    if (!currentRoom || !currentUser) return;
    const roomRef = ref(db, `rooms/${currentRoom.id}`);
    const unsubscribe = onValue(roomRef, snapshot => {
      if (snapshot.exists()) {
        const updatedRoom = { id: currentRoom.id, ...snapshot.val() };
        if (updatedRoom.status === 'playing') {
          setGameCountdown(null);
        } else if (updatedRoom.countdown !== undefined) {
          setGameCountdown(updatedRoom.countdown);
        }
      } else {
        leaveRoom();
      }
    });
    return () => unsubscribe();
  }, [currentRoom, currentUser, setGameCountdown, leaveRoom]);

  // Countdown is now driven by server (room owner), we only display the value

  const isOwner = !!currentUser && currentUser.id === currentRoom?.ownerId;
  const players = Object.values(currentRoom?.players || {});
  const allReady = players.length >= 2 && players.every(p => p.ready || p.id === currentRoom.ownerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={leaveRoom}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-black rounded-xl">
          <div className="p-8 bg-[#80142C] rounded-t-xl">
            <button onClick={leaveRoom} className="absolute top-4 left-4 text-white hover:text-gray-300 transition-all duration-300">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-white">
                {currentRoom?.ownerUsername}'s Arena
              </h1>
              <div className="text-gray-200 text-lg tracking-wider">
                Waiting for Players
              </div>
            </div>
            
            {/* Room Info */}
            <div className="bg-black p-6 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="w-8 h-8 bg-blue-600 flex items-center justify-center mr-3 rounded-lg text-white text-sm">
                    👥
                  </span>
                  Room Status
                </h2>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{players.length}/{currentRoom?.maxPlayers || 4}</div>
                  <div className="text-sm text-gray-300">Players</div>
                </div>
              </div>
              
              {gameCountdown !== null && (
                <div className="bg-yellow-600 p-4 rounded-lg text-center mb-4">
                  <div className="text-2xl font-bold text-white">Game Starting In</div>
                  <div className="text-4xl font-bold text-white">{gameCountdown}s</div>
                </div>
              )}
            </div>

            {/* Players List */}
            <div className="bg-black p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-600 flex items-center justify-center mr-3 rounded-lg text-white text-sm">
                  🎮
                </span>
                Players
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#80142C] rounded-full flex items-center justify-center">
                        <Users size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{player.username}</div>
                        {player.id === currentRoom.ownerId && (
                          <div className="text-yellow-400 text-sm">Room Owner</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        player.id === currentRoom.ownerId 
                          ? 'bg-green-600 text-white' 
                          : player.ready 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                      }`}>
                        {player.id === currentRoom.ownerId ? 'Ready' : player.ready ? 'Ready' : 'Waiting'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {isOwner ? (
                <button
                  onClick={startGameCountdown}
                  disabled={players.length < 2 || !allReady || gameCountdown !== null}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                    players.length >= 2 && allReady && gameCountdown === null 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play size={20} />
                  Start Battle
                </button>
              ) : (
                <button
                  onClick={toggleReady}
                  disabled={gameCountdown !== null}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                    gameCountdown === null 
                      ? 'bg-[#80142C] hover:bg-[#4a0c1a] text-white' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentUser && currentRoom?.players?.[currentUser.id]?.ready ? 'Unready' : 'Ready'}
                </button>
              )}
              <button 
                onClick={leaveRoom} 
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all duration-200"
              >
                Leave Arena
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-200 italic">
                {players.length < 2 ? 'Waiting for more players to join...' : allReady ? 'All players ready! Owner can start the game.' : 'Waiting for players to ready up...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPopup;