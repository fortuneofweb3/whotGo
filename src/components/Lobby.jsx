import React, { useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../firebase';
import { ArrowLeft, Users, Plus } from 'lucide-react';

const Lobby = ({ rooms, setRooms, createRoom, joinRoom, setGameState, currentUser }) => {
  useEffect(() => {
    const roomsRef = ref(db, 'rooms');
    const unsubscribe = onValue(roomsRef, snapshot => {
      if (snapshot.exists()) {
        const roomsData = snapshot.val();
        const roomsList = Object.keys(roomsData).map(roomId => ({
          id: roomId,
          ...roomsData[roomId]
        }));
        setRooms(roomsList.filter(room => room.status === 'waiting'));
      } else {
        setRooms([]);
      }
    });
    return () => unsubscribe();
  }, [setRooms]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#000000] p-4 fade-in">
      <div className="absolute top-4 left-4 z-30">
        <button onClick={() => setGameState('menu')} className="text-white hover:text-red-300 transition-colors duration-200">
          <ArrowLeft size={window.innerWidth < 768 ? 18 : 24} />
        </button>
      </div>
      <div className="bg-black p-6 rounded-2xl border-2 border-[#80142C] max-w-4xl w-full scale-in">
        <div className="bg-[#80142C] p-4 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Multiplayer Lobby</h2>
          <div className="mb-6">
            <button
              onClick={createRoom}
              disabled={!currentUser}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${currentUser ? 'bg-[#80142C] hover:bg-[#4a0c1a]' : 'bg-gray-600 cursor-not-allowed'} text-white`}
            >
              <Plus size={20} />
              Create New Room
            </button>
            {!currentUser && (
              <div className="mt-2 text-center text-yellow-400 text-sm">
                Please connect your wallet first to create or join rooms
              </div>
            )}
          </div>
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="text-center text-gray-400 italic">
                {!currentUser 
                  ? "Connect your wallet to see available rooms or create your own!"
                  : "No rooms available. Create one to start playing!"
                }
              </div>
            ) : (
              rooms.map(room => (
                <div key={room.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{room.ownerUsername}'s Room</h3>
                    <p className="text-sm text-gray-300">
                      Players: {Object.keys(room.players || {}).length}/{room.maxPlayers} • Status: {room.status}
                    </p>
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={!currentUser || Object.keys(room.players || {}).length >= room.maxPlayers}
                    className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${currentUser && Object.keys(room.players || {}).length < room.maxPlayers ? 'bg-[#80142C] hover:bg-[#4a0c1a] text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                  >
                    <Users size={16} className="inline mr-2" />
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;