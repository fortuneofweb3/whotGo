import React from 'react';
import { playSoundEffect } from '../../utils/soundEffects';

const GameLogPopup = ({ gameData, selectedLogRound, setSelectedLogRound, closePopup }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] fade-in" onClick={() => {
      playSoundEffect.back();
      closePopup();
    }}>
      <div className="bg-gray-900 p-6 border-2 border-[#80142C] max-w-4xl max-h-[80vh] overflow-y-auto scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-[#80142C] p-4">
                                                                                       <div className="flex justify-between items-center mb-4">
               <h2 className="text-2xl font-bold text-white">Game Log</h2>
               <span onClick={() => {
                 playSoundEffect.back();
                 closePopup();
               }} className="text-white text-2xl cursor-pointer">×</span>
             </div>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {Object.keys(gameData.gameLog).map(round => (
              <button
                key={round}
                onClick={() => {
                  playSoundEffect.click();
                  setSelectedLogRound(parseInt(round));
                }}
                className={`px-4 py-2 font-bold whitespace-nowrap transition-colors duration-200 ${selectedLogRound === parseInt(round) ? 'bg-[#80142C] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Round {round}
              </button>
            ))}
          </div>
          <div className="bg-gray-800 p-4 max-h-96 overflow-y-auto">
            {(gameData.gameLog[selectedLogRound] || []).map((log, index) => (
              <div key={index} className="text-gray-300 text-sm mb-2 border-b border-gray-700 pb-2 last:border-b-0">
                <span className="text-red-400 font-mono text-xs mr-2">{String(index + 1).padStart(2, '0')}.</span>
                {log}
              </div>
            ))}
            {(!gameData.gameLog[selectedLogRound] || gameData.gameLog[selectedLogRound].length === 0) && (
              <div className="text-gray-500 text-center py-4">No actions recorded for this round yet</div>
            )}
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => {
              playSoundEffect.back();
              closePopup();
            }} className="px-6 py-2 bg-[#80142C] text-white smooth-transition font-bold hover:bg-[#4a0c1a]">
              Close Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLogPopup;