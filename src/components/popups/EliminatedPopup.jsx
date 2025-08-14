import React from 'react';

const EliminatedPopup = ({ setShowEliminatedPopup, returnToMenu }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] fade-in">
      <div className="text-center text-white scale-in bg-black p-8 rounded-2xl border-2 border-[#80142C]">
        <div className="bg-[#80142C] p-6 rounded-xl">
          <h1 className="text-4xl font-bold mb-4 text-white">ELIMINATED</h1>
          <p className="text-xl mb-6">You have been knocked out of the game.</p>
          <div className="flex gap-4">
            <button onClick={() => setShowEliminatedPopup(false)} className="px-8 py-3 bg-[#80142C] text-white rounded-xl smooth-transition font-bold hover:bg-[#4a0c1a]">
              Continue Watching
            </button>
            <button onClick={returnToMenu} className="px-8 py-3 bg-gray-700 text-white rounded-xl smooth-transition font-bold hover:bg-gray-600">
              Return to Arena
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EliminatedPopup;