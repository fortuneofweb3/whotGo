import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { updateProfileInfo } from '../../utils/profile';

const ProfilePopup = ({ userProfile, updateUsername, closePopup, onShowLeaderboard }) => {
  const { publicKey, wallet, signMessage } = useWallet();
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newProfilePicture, setNewProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUsername = async () => {
    if (newUsername.trim()) {
      setIsUpdating(true);
      try {
        // Update both Firebase and Honeycomb if available
        if (publicKey && wallet) {
          try {
            await updateProfileInfo({
              publicKey,
              wallet,
              signMessage,
              username: newUsername.trim(),
              bio: newBio.trim() || userProfile?.bio || '',
              pfp: newProfilePicture.trim() || userProfile?.profilePicture || ''
            });
            console.log('Profile updated on Honeycomb');
          } catch (honeycombError) {
            console.error('Failed to update Honeycomb profile:', honeycombError);
          }
        }
        
        // Always update Firebase for compatibility
        updateUsername(newUsername.trim(), newBio.trim() || userProfile?.bio || '', newProfilePicture.trim() || userProfile?.profilePicture || '');
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Use Firebase data for level progress
  const playerProgress = {
    level: userProfile?.level || 1,
    totalXP: userProfile?.xp || 0,
    currentLevelXP: userProfile?.currentLevelXP || 0,
    xpNeededForNext: userProfile?.xpNeededForNext || 100
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={closePopup}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-black">
                                                                                           <div className="p-8 bg-[#80142C]">
              <div className="text-center mb-10">
                                 <div className="flex justify-between items-center mb-4">
                   <div></div>
                   <span onClick={closePopup} className="text-white text-2xl cursor-pointer">×</span>
                 </div>
              <h1 className="text-4xl font-bold mb-2 text-white">
                Player Profile
              </h1>
              <div className="text-gray-200 text-lg tracking-wider">
                Your Game Performance
              </div>
            </div>
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Profile Picture and Info Section */}
              <div className="bg-black p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-600 flex items-center justify-center mr-3 text-white text-sm">
                    👤
                  </span>
                  Player Info
                </h2>
                
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                        {newProfilePicture ? (
                          <img 
                            src={newProfilePicture} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-2xl">
                            👤
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-white text-sm mb-2">Profile Picture URL:</label>
                        <input
                          type="url"
                          value={newProfilePicture}
                          onChange={e => setNewProfilePicture(e.target.value)}
                          className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 focus:border-[#80142C] outline-none rounded"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    
                    {/* Username */}
                    <div>
                      <label className="block text-white text-sm mb-2">Username:</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 focus:border-[#80142C] outline-none rounded"
                        placeholder={userProfile.username || 'Enter username'}
                        maxLength={20}
                      />
                    </div>
                    
                    {/* Bio */}
                    <div>
                      <label className="block text-white text-sm mb-2">Bio:</label>
                      <textarea
                        value={newBio}
                        onChange={e => setNewBio(e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 focus:border-[#80142C] outline-none rounded"
                        placeholder={userProfile.bio || 'Enter bio'}
                        maxLength={100}
                        rows={3}
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateUsername} 
                        disabled={!newUsername.trim() || isUpdating} 
                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)} 
                        className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Profile Picture Display */}
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {userProfile?.profilePicture ? (
                        <img 
                          src={userProfile.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-2xl">
                          👤
                        </div>
                      )}
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-2xl" style={{ display: 'none' }}>
                        👤
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-white">{userProfile.username || 'Player'}</span>
                        <button 
                          onClick={() => {
                            setIsEditing(true);
                            setNewUsername(userProfile.username || '');
                            setNewBio(userProfile.bio || '');
                            setNewProfilePicture(userProfile.profilePicture || '');
                          }} 
                          className="px-3 py-1 bg-[#80142C] text-white hover:bg-[#4a0c1a] transition-colors text-sm rounded"
                        >
                          Edit
                        </button>
                      </div>
                      {userProfile.bio && (
                        <div className="text-gray-300 text-sm">
                          {userProfile.bio}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Level Progress Section */}
              <div className="bg-black p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mr-3 text-white text-sm">
                    ⭐
                  </span>
                  Level Progress
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">Level {playerProgress.level}</span>
                    <span className="text-lg text-gray-300">{playerProgress.totalXP.toLocaleString()} Total XP</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-500" 
                      style={{
                        width: playerProgress.level < 100 ? `${playerProgress.currentLevelXP / playerProgress.xpNeededForNext * 100}%` : '100%'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{playerProgress.currentLevelXP.toLocaleString()} XP</span>
                    {playerProgress.level < 100 && (
                      <span>{playerProgress.xpNeededForNext.toLocaleString()} XP needed for Level {playerProgress.level + 1}</span>
                    )}
                    {playerProgress.level >= 100 && (
                      <span className="text-yellow-400 font-bold">MAX LEVEL REACHED!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-black p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gray-700 flex items-center justify-center mr-3 rounded-lg">
                    📊
                  </span>
                  Your Game Stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{userProfile.gamesPlayed || 0}</div>
                    <div className="text-gray-200 text-sm">Games Played</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{userProfile.gamesWon || 0}</div>
                    <div className="text-gray-200 text-sm">Games Won</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{userProfile.gamesPlayed > 0 ? ((userProfile.gamesWon || 0) / userProfile.gamesPlayed * 100).toFixed(1) : 0}%</div>
                    <div className="text-gray-200 text-sm">Win Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{playerProgress.level}</div>
                    <div className="text-gray-200 text-sm">Player Level</div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Button */}
              <button 
                onClick={() => {
                  closePopup();
                  if (onShowLeaderboard) {
                    onShowLeaderboard();
                  }
                }} 
                className="group w-full p-6 bg-black transition-all duration-200 hover:bg-gray-800 rounded-xl"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-700 flex items-center justify-center rounded-lg">
                    <span className="text-white text-xl">🏆</span>
                  </div>
                  <div className="ml-6 text-left">
                    <h2 className="text-xl font-bold text-white mb-1">Leaderboards</h2>
                    <p className="text-gray-200">See top players and rankings</p>
                  </div>
                  <div className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </div>
                </div>
              </button>
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-200 italic">
                Keep playing to improve your statistics and climb the leaderboards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;