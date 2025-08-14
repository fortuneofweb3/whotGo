import React from 'react';
import { playSoundEffect } from '../../utils/soundEffects';

const SyncPopup = ({ firebaseData, honeycombProfile, onSync, onClose }) => {
  if (!firebaseData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={() => { playSoundEffect.back(); onClose(); }}>
      <div className="relative w-full max-w-2xl scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900">
          <div className="p-8 bg-[#80142C]">
            <div className="text-center mb-6">
              <div className="flex justify-between items-center mb-4">
                <div></div>
                <span onClick={() => { playSoundEffect.back(); onClose(); }} className="text-white text-2xl cursor-pointer">×</span>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-white">
                🔄 Data Sync Required
              </h1>
              <div className="text-gray-200 text-lg">
                Your Firebase data needs to be synced to Honeycomb
              </div>
            </div>
            
            <div className="bg-gray-900 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Data to Sync:</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Username:</span>
                  <span className="text-white font-mono">{firebaseData.username || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">XP:</span>
                  <span className="text-white font-mono">{firebaseData.xp || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Level:</span>
                  <span className="text-white font-mono">{firebaseData.level || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Games Played:</span>
                  <span className="text-white font-mono">{firebaseData.gamesPlayed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Games Won:</span>
                  <span className="text-white font-mono">{firebaseData.gamesWon || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Cards Played:</span>
                  <span className="text-white font-mono">{firebaseData.totalCardsPlayed || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-gray-200 text-sm">
                This will update your on-chain profile with your latest Firebase data.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => { playSoundEffect.click(); onSync(); }}
                  className="px-6 py-3 bg-[#80142C] text-white hover:bg-[#a01d39] font-bold"
                >
                  🔄 Sync to Honeycomb
                </button>
                <button
                  onClick={() => { playSoundEffect.back(); onClose(); }}
                  className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncPopup;
