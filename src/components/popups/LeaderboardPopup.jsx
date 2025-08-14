import React from 'react';

const LeaderboardPopup = ({ leaderboardData, closePopup, onBackToProfile, onDebugUpdate, onTestAirdrop }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={closePopup}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900">
                                                                                       <div className="p-8 bg-[#80142C]">
             <div className="text-center mb-10">
                               <div className="flex justify-between items-center mb-4">
                  {onBackToProfile && (
                    <span onClick={onBackToProfile} className="text-white text-2xl cursor-pointer">←</span>
                  )}
                  {!onBackToProfile && <div></div>}
                  <span onClick={closePopup} className="text-white text-2xl cursor-pointer">×</span>
                </div>
              <h1 className="text-4xl font-bold mb-2 text-white">
                Leaderboards
              </h1>
              <div className="text-gray-200 text-lg tracking-wider">
                Top Players
              </div>
            </div>
            <div className="bg-gray-900">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-white">
                                     <thead className="sticky top-0 bg-gray-900 text-white">
                     <tr>
                       <th className="text-left py-4 px-4 font-bold">Rank</th>
                       <th className="text-left py-4 px-4 font-bold">Player</th>
                       <th className="text-left py-4 px-4 font-bold">XP</th>
                       <th className="text-left py-4 px-4 font-bold">Wins</th>
                     </tr>
                   </thead>
                  <tbody>
                    {leaderboardData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-400 italic">
                          No leaderboard data available
                        </td>
                      </tr>
                    ) : (
                      leaderboardData.map((player, index) => (
                        <tr key={index} className={`border-b border-gray-600 hover:bg-gray-800 ${player.name === 'You' ? 'bg-gray-800' : ''}`}>
                          <td className="py-4 px-4">
                            <span className="font-bold text-lg">
                              #{player.rank}
                              {player.rank === 1 && <span className="ml-1">👑</span>}
                              {player.rank === 2 && <span className="ml-1">🥈</span>}
                              {player.rank === 3 && <span className="ml-1">🥉</span>}
                            </span>
                          </td>
                                                     <td className="py-4 px-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                                 {player.profilePicture ? (
                                   <img 
                                     src={player.profilePicture} 
                                     alt="Profile" 
                                     className="w-full h-full object-cover"
                                     onError={(e) => {
                                       e.target.style.display = 'none';
                                       e.target.nextSibling.style.display = 'flex';
                                     }}
                                   />
                                 ) : (
                                   <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-sm">
                                     👤
                                   </div>
                                 )}
                                 <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-sm" style={{ display: 'none' }}>
                                   👤
                                 </div>
                               </div>
                               <div>
                                 <div className={`font-bold text-lg ${player.name === 'You' ? 'text-white' : 'text-white'}`}>
                                   {player.name}
                                 </div>
                               </div>
                             </div>
                           </td>
                                                   <td className="py-4 px-4">
                           <div className="font-bold text-xl">{player.xp}</div>
                           <div className="text-sm text-gray-200">Level {player.level}</div>
                         </td>
                         <td className="py-4 px-4">
                           <div className="font-bold text-xl">{player.wins}</div>
                           <div className="text-sm text-gray-200">{player.games} battles</div>
                         </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-200 italic">
                Compete with other players to climb the rankings and earn your place at the top.
              </p>
              {onDebugUpdate && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={onDebugUpdate}
                    className="px-4 py-2 bg-[#80142C] text-white hover:bg-[#a01d39] text-sm"
                  >
                    🔧 Debug: Update My Leaderboard Entry
                  </button>
                  {onTestAirdrop && (
                    <button
                      onClick={onTestAirdrop}
                      className="px-4 py-2 bg-[#80142C] text-white hover:bg-[#a01d39] text-sm block w-full"
                    >
                                             🧪 Test Wallet Funding
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPopup;