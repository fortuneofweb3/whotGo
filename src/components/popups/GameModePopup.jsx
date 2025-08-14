import React from 'react';
import { Wifi, Bot, ChevronRight } from 'lucide-react';

const GameModePopup = ({ onClose, onSelectMultiplayer, onSelectAI }) => {
  return (
    <div className="bg-black">
                                                           <div className="p-8 bg-[#80142C]">
          <div className="text-center mb-10">
                         <div className="flex justify-between items-center mb-4">
               <div></div>
               <span onClick={onClose} className="text-white text-2xl cursor-pointer">×</span>
             </div>
          <h1 className="text-4xl font-bold mb-2 text-white">
            Game Modes
          </h1>
          <div className="text-gray-200 text-lg tracking-wider">
            Select How You Want to Play
          </div>
        </div>
        <div className="space-y-6 max-w-2xl mx-auto">
          <button 
            onClick={onSelectMultiplayer}
            className="group w-full p-6 bg-black transition-all duration-200 hover:bg-gray-800"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-600 flex items-center justify-center">
                <Wifi className="text-white" size={24} />
              </div>
              <div className="ml-6 text-left">
                <h2 className="text-xl font-bold text-white mb-1">Online Multiplayer</h2>
                <p className="text-gray-200">Play with other players online</p>
              </div>
              <ChevronRight className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200" size={20} />
            </div>
          </button>
          <button 
            onClick={onSelectAI}
            className="group w-full p-6 bg-black transition-all duration-200 hover:bg-gray-800"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-black flex items-center justify-center">
                <Bot className="text-white" size={24} />
              </div>
              <div className="ml-6 text-left">
                <h2 className="text-xl font-bold text-white mb-1">Play vs AI</h2>
                <p className="text-gray-200">Practice against computer opponents</p>
              </div>
              <ChevronRight className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200" size={20} />
            </div>
          </button>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-200 italic">
            Select your preferred game mode to start playing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameModePopup;
