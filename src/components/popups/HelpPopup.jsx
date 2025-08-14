import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { playSoundEffect } from '../../utils/soundEffects';

const HelpPopup = ({ closePopup }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={() => {
      playSoundEffect.back();
      closePopup();
    }}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900">
                                                                                       <div className="p-8 bg-[#80142C]">
             <div className="text-center mb-10">
                               <div className="flex justify-between items-center mb-4">
                  <div></div>
                  <span onClick={() => {
                    playSoundEffect.back();
                    closePopup();
                  }} className="text-white text-2xl cursor-pointer">×</span>
                </div>
              <h1 className="text-4xl font-bold mb-2 text-white">
                Game Guide & Rules
              </h1>
              <div className="text-gray-200 text-lg tracking-wider">
                Everything You Need to Know
              </div>
            </div>
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Basic Rules */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-600 flex items-center justify-center mr-3 text-white text-sm">📚</span>
                  Basic Rules
                </h3>
                <div className="text-gray-300 space-y-3">
                  <p><strong>Objective:</strong> Be the first player to play all your cards to win the round.</p>
                  <p><strong>Setup:</strong> 4 players start with 6 cards each. One card is dealt to start the play pile.</p>
                  <p><strong>Playing:</strong> Match the top card by either <strong>shape</strong> or <strong>number</strong>.</p>
                  <p><strong>Drawing:</strong> If you can't play, draw from the market (deck) until you can play or pass.</p>
                  <p><strong>Elimination:</strong> When a round ends, the player(s) with the most cards are eliminated.</p>
                  <p><strong>Victory:</strong> The last player remaining wins the entire game!</p>
                </div>
              </div>

              {/* Special Cards */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-600 flex items-center justify-center mr-3 text-white text-sm">✨</span>
                  Special Cards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-yellow-400 mb-2">🔥 WHOT Card</h4>
                    <p>Can be played on any card. Choose the next shape when played.</p>
                  </div>
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-[#80142C] mb-2">2 - Pick Two</h4>
                    <p>Next player must draw 2 cards from the market.</p>
                  </div>
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-blue-400 mb-2">1 - Hold On</h4>
                    <p>Next player's turn is skipped entirely.</p>
                  </div>
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-green-400 mb-2">14 - General Market</h4>
                    <p>ALL other players must draw 1 card from market.</p>
                  </div>
                </div>
              </div>

              {/* Card Shapes & Numbers */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-600 flex items-center justify-center mr-3 text-white text-sm">🔷</span>
                  Card Shapes & Numbers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                  <div>
                    <h4 className="font-bold text-white mb-3">Available Shapes:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center"><span className="text-2xl mr-3">●</span> Circle</div>
                      <div className="flex items-center"><span className="text-2xl mr-3">▲</span> Triangle</div>
                      <div className="flex items-center"><span className="text-2xl mr-3">✚</span> Cross</div>
                      <div className="flex items-center"><span className="text-2xl mr-3">■</span> Square</div>
                      <div className="flex items-center"><span className="text-2xl mr-3">★</span> Star</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-3">Number Distribution:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Circles & Triangles:</strong> 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14</div>
                      <div><strong>Crosses & Squares:</strong> 1, 2, 3, 5, 7, 10, 11, 13, 14</div>
                      <div><strong>Stars:</strong> 1, 2, 3, 4, 5, 7, 8</div>
                      <div><strong>WHOT:</strong> 5 special cards</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* XP & Progress System */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-yellow-600 flex items-center justify-center mr-3 text-white text-sm">⭐</span>
                  XP & Progress System
                </h3>
                <div className="space-y-4 text-gray-300">
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-yellow-400 mb-2">How to Earn XP:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>Playing a game:</strong> 50 XP base</li>
                      <li>• <strong>Winning a game:</strong> +100 XP bonus</li>
                      <li>• <strong>Surviving rounds:</strong> +25 XP per round</li>
                      <li>• <strong>Playing cards:</strong> +10 XP per 5 cards played</li>
                      <li>• <strong>Claiming achievements:</strong> 100-5000 XP each</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-blue-400 mb-2">Level System (1-100):</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>Progressive XP Requirements:</strong> Each level needs more XP than the last</li>
                      <li>• <strong>Level 1-10:</strong> 100-1600 XP per level</li>
                      <li>• <strong>Level 11-50:</strong> 1750-6000 XP per level</li>
                      <li>• <strong>Level 51-100:</strong> 6500-14000+ XP per level</li>
                      <li>• <strong>Max Level 100:</strong> Ultimate bragging rights!</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800 p-4">
                    <h4 className="font-bold text-green-400 mb-2">Achievements & Rewards:</h4>
                    <p className="text-sm">Complete specific challenges to unlock achievements worth hundreds or thousands of XP. From first victories to legendary milestones!</p>
                  </div>
                </div>
              </div>

              {/* Pro Tips & Strategy */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-orange-600 flex items-center justify-center mr-3 text-white text-sm">💡</span>
                  Pro Tips & Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
                  <div className="space-y-2">
                    <p><strong>• Save WHOT cards</strong> for when you're stuck or for strategic shape changes</p>
                    <p><strong>• Watch opponents' cards</strong> to predict what they might play</p>
                    <p><strong>• Use special cards wisely</strong> - timing is everything</p>
                    <p><strong>• Count cards</strong> to know what's still in play</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>• Play high numbers early</strong> when you have multiple options</p>
                    <p><strong>• Keep variety</strong> in shapes to avoid being stuck</p>
                    <p><strong>• Last card advantage</strong> - plan your final moves carefully</p>
                    <p><strong>• General Market timing</strong> can eliminate opponents quickly</p>
                  </div>
                </div>
              </div>

              {/* Game Controls */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-red-600 flex items-center justify-center mr-3 text-white text-sm">🎮</span>
                  Game Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
                  <div className="space-y-2">
                    <p><strong>• Click cards to play</strong> them (if valid)</p>
                    <p><strong>• Click market deck</strong> to draw cards</p>
                    <p><strong>• Use scroll arrows</strong> to navigate your hand</p>
                    <p><strong>• Grid icon</strong> opens full deck view</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>• Red glow on market</strong> means you must draw</p>
                    <p><strong>• Playable cards</strong> are highlighted</p>
                    <p><strong>• Red dots</strong> show playable cards outside view</p>
                    <p><strong>• Game log</strong> tracks all moves</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => {
                playSoundEffect.click();
                closePopup();
              }} className="px-8 py-3 bg-[#80142C] text-white font-bold hover:bg-[#4a0c1a] transition-colors">
                Start Playing!
              </button>
              <p className="text-gray-200 italic mt-4">
                Master the ancient game of Whot and climb the legendary ranks!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPopup;