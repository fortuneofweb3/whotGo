import React from 'react';
import { getCardSVGContent } from '../../utils/cardSVG';

const RoundEndPopup = ({ roundEndData, onContinue, isMultiplayer = false, currentUser, remainingPlayers = [] }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] opacity-0 p-8" style={{ animation: 'fadeIn 0.6s ease-out forwards' }}>
      <div className="bg-gray-900 p-6 border-2 border-[#80142C] max-w-4xl max-h-[80vh] opacity-0 transform scale-95" style={{ animation: 'scaleInCard 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards' }}>
        <div className="bg-[#80142C] p-4">
          {/* Header */}
          <div className="text-center mb-4 opacity-0 transform translateY-8" style={{ animation: 'fadeInUp 0.8s ease-out 1s forwards' }}>
            <h1 className="text-2xl font-bold text-white mb-1">Round {roundEndData.roundNumber} Complete!</h1>
            <div className="text-lg text-gray-200">
              🏆 {roundEndData.winner.name} wins the round!
            </div>
          </div>

          {/* Player Results */}
          <div className="space-y-2 mb-4">
            {roundEndData.players.map((player, index) => {
              const isEliminated = player.id === roundEndData.eliminatedPlayer.id;
              const baseDelay = 1.8 + index * 0.4;
              return (
                <div key={player.id} className={`bg-gray-800 p-3 flex flex-col space-y-2 opacity-0 transform translateY-4 ${isEliminated ? 'border-2 border-red-500' : ''}`} style={{ animation: `fadeInUp 0.6s ease-out ${baseDelay}s forwards` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.2}s forwards` }}>
                      {player.name}
                    </span>
                    <div className="flex items-center">
                      <div className="text-right mr-3">
                        <div className="text-xs text-gray-400 opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.25}s forwards` }}>
                          Total:
                        </div>
                        <span className={`text-xl font-bold opacity-0 ${player.cardTotal === roundEndData.maxCards ? 'text-red-400' : 'text-green-400'}`} style={{ animation: `bounceIn 0.6s ease-out ${baseDelay + 0.4}s forwards` }}>
                          {player.cardTotal}
                        </span>
                      </div>
                      <div className="text-right mr-2">
                        <div className="text-xs text-gray-400 opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.3}s forwards` }}>
                          Cards:
                        </div>
                        <span className="text-lg font-bold text-white opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.35}s forwards` }}>
                          {player.cardCount}
                        </span>
                      </div>
                      {isEliminated && (
                        <div className="ml-2 text-2xl opacity-0" style={{ animation: `bounceIn 0.8s ease-out ${baseDelay + 1.2}s forwards` }}>
                          ❌
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remaining Cards */}
                  <div className="flex items-center flex-wrap gap-1 mt-2">
                    <span className="text-xs text-gray-400 opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.6}s forwards` }}>
                      Cards:
                    </span>
                    {player.cards.slice(0, 8).map((card, cardIndex) => (
                      <div key={cardIndex} className="w-8 h-10 opacity-0 transform scale-90 hover:scale-105 transition-transform duration-200" style={{ animation: `fadeIn 0.3s ease-out ${baseDelay + 0.8 + cardIndex * 0.05}s forwards, scaleIn 0.3s ease-out ${baseDelay + 0.8 + cardIndex * 0.05}s forwards` }}>
                        <div className="w-full h-full border border-gray-300 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }} />
                      </div>
                    ))}
                    {player.cards.length > 8 && (
                      <span className="text-xs text-gray-400 opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.8}s forwards` }}>
                        +{player.cards.length - 8} more
                      </span>
                    )}
                    {player.cards.length === 0 && (
                      <span className="text-green-400 font-bold text-xs opacity-0" style={{ animation: `fadeIn 0.4s ease-out ${baseDelay + 0.8}s forwards` }}>
                        🎉 NO CARDS LEFT!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Elimination Info */}
          <div className="text-center opacity-0 transform translateY-4" style={{ animation: `fadeInUp 0.8s ease-out ${2.2 + roundEndData.players.length * 0.4}s forwards` }}>
            <div className="text-sm text-red-400 mb-1">
              Player with highest card total ({roundEndData.maxCards} points) is eliminated:
            </div>
            <div className="text-lg font-bold text-red-400 opacity-0" style={{ animation: `bounceIn 0.6s ease-out ${2.4 + roundEndData.players.length * 0.4}s forwards` }}>
              {roundEndData.eliminatedPlayer.name}
            </div>
          </div>

          {/* Continue Button - Only for single player */}
          {!isMultiplayer && (
            <div className="text-center mt-6 opacity-0" style={{ animation: `fadeIn 0.5s ease-out ${2.8 + roundEndData.players.length * 0.4}s forwards` }}>
              <button
                onClick={onContinue}
                className="bg-gradient-to-r from-[#80142C] to-[#4a0c1a] hover:from-[#4a0c1a] hover:to-[#80142C] text-white font-bold py-3 px-8 border-2 border-[#80142C] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Continue to Next Round
              </button>
            </div>
          )}
          
          {/* Multiplayer Auto-Continue Message */}
          {isMultiplayer && (
            <div className="text-center mt-6 opacity-0" style={{ animation: `fadeIn 0.5s ease-out ${2.8 + roundEndData.players.length * 0.4}s forwards` }}>
              <div className="text-sm text-gray-300">
                Next round will start automatically in 10 seconds...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundEndPopup;