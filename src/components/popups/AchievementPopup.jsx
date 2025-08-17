import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserProfile } from '../../utils/profileClient.js';
import { 
  ACHIEVEMENT_DEFINITIONS, 
  getAchievementProgress, 
  getAchievementName, 
  getAchievementDescription,
  hasAchievement 
} from '../../utils/achievementService.js';

const AchievementPopup = ({ closePopup, userProfile: firebaseProfile, achievements: firebaseAchievements }) => {
  const { publicKey, wallet, signMessage } = useWallet();
  const [unifiedAchievements, setUnifiedAchievements] = useState([]);
  const [honeycombProfile, setHoneycombProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingBadge, setClaimingBadge] = useState(null);

  useEffect(() => {
    const loadUnifiedAchievements = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get Honeycomb user profile
        const profile = await getUserProfile(publicKey);
        setHoneycombProfile(profile);
        
        // Create unified achievements list using the new achievement system
        const unified = [];
        
        // Combine Firebase profile data with Honeycomb data
        const userStats = {
          ...firebaseProfile,
          ...(profile || {}),
          achievementsUnlocked: (profile?.achievements || []).length
        };
        
        // Use the new achievement definitions
        ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
          const isUnlocked = hasAchievement(userStats, achievement.id);
          const progress = getAchievementProgress(achievement.id, userStats);
          
          unified.push({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            unlocked: isUnlocked,
            claimed: isUnlocked, // Achievements are auto-claimed
            earned: isUnlocked,
            earnedAt: null,
            progress: progress,
            xpReward: achievement.xpReward,
            source: 'honeycomb'
          });
        });
        
        setUnifiedAchievements(unified);
      } catch (error) {
        console.error('Error loading unified achievements:', error);
        // Fallback to basic achievement list
        const fallback = ACHIEVEMENT_DEFINITIONS.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          unlocked: false,
          claimed: false,
          earned: false,
          earnedAt: null,
          progress: { current: 0, target: 1, percentage: 0 },
          xpReward: achievement.xpReward,
          source: 'fallback'
        }));
        setUnifiedAchievements(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadUnifiedAchievements();
  }, [publicKey, firebaseAchievements]);

  // Helper functions for achievement display
  const getAchievementIcon = (achievementId) => {
    const icons = {
      0: '🏆', // First Victory
      1: '🎯', // Card Master
      2: '⚔️', // Shadow Warrior
      3: '🧠', // Strategic Mind
      4: '💯', // Century Club
      5: '🌟', // Ultimate Champion
      6: '👑', // Legendary Player
      7: '💎'  // Whot Grandmaster
    };
    return icons[achievementId] || '🏅';
  };

  const getProgressInfo = (achievement) => {
    // Use the progress data from the achievement object
    if (achievement.progress) {
      const labels = {
        0: 'Games Won',
        1: 'Cards Played', 
        2: 'Perfect Wins',
        3: 'Games Won',
        4: 'Games Played',
        5: 'Games Won',
        6: 'Level',
        7: 'Achievements Unlocked'
      };
      
      return {
        current: achievement.progress.current,
        target: achievement.progress.target,
        percentage: achievement.progress.percentage,
        label: labels[achievement.id] || 'Progress'
      };
    }
    
    return null;
  };

  const handleClaimBadge = async (achievementId) => {
    if (!publicKey) {
      console.error('Wallet not connected for claiming achievement');
      return;
    }

    setClaimingBadge(achievementId);
    
    try {
      // Find the achievement to get its reward
      const achievement = unifiedAchievements.find(a => a.id === achievementId);
      if (!achievement) {
        throw new Error('Achievement not found');
      }

      // Use the new achievement system
      const { updatePlatformData } = await import('../../utils/profileClient.js');
      
      await updatePlatformData({
        publicKey: publicKey,
        achievements: [achievementId],
        xp: achievement.xpReward,
        customData: {}
      });
      
      // Refresh the achievements list
      const updatedAchievements = unifiedAchievements.map(a => 
        a.id === achievementId
          ? { ...a, claimed: true, earned: true }
          : a
      );
      setUnifiedAchievements(updatedAchievements);
      
      // Refresh Honeycomb profile
      const profile = await getUserProfile(publicKey);
      setHoneycombProfile(profile);
      
      alert(`🎉 Achievement "${achievement.name}" claimed successfully! +${achievement.reward} XP`);
      
    } catch (error) {
      console.error(`Error claiming badge ${badgeIndex}:`, error);
      alert(`Error claiming badge: ${error.message}`);
    } finally {
      setClaimingBadge(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 fade-in" onClick={closePopup}>
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in" onClick={e => e.stopPropagation()}>
          <div className="retro-popup-content">
            <div className="p-8 retro-title">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 retro-loading mx-auto mb-4"></div>
                <p className="text-white text-lg uppercase">Loading Achievements...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="bg-black">
                                                                                                   <div className="p-8 bg-[#80142C]">
          <div className="text-center mb-10">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <span onClick={closePopup} className="text-white text-2xl cursor-pointer">×</span>
            </div>
          <h1 className="text-4xl font-bold mb-2 text-white uppercase">
            Achievements
          </h1>
          <div className="text-gray-200 text-lg tracking-wider uppercase">
            Complete Challenges & Earn Rewards
          </div>
          {(honeycombProfile || firebaseProfile) && (
            <div className="mt-4 text-sm text-gray-300">
              <span className="mr-4">Level: {(honeycombProfile || firebaseProfile).level}</span>
              <span className="mr-4">XP: {(honeycombProfile || firebaseProfile).xp}</span>
              <span className="mr-4">Games: {(honeycombProfile || firebaseProfile).gamesPlayed}</span>
              <span>Wins: {(honeycombProfile || firebaseProfile).gamesWon}</span>
            </div>
          )}
        </div>
        <div className="max-w-4xl mx-auto">
               {/* Unified Achievements Section */}
               {unifiedAchievements && unifiedAchievements.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                   {unifiedAchievements.map(achievement => {
                     const progress = getProgressInfo(achievement);
                     
                     return (
                       <div key={achievement.id} className={`p-4 retro-achievement ${
                         achievement.earned 
                           ? 'unlocked' 
                           : 'opacity-60'
                       }`}>
                         <div className="flex items-center mb-3">
                           <span className="text-3xl mr-3">{getAchievementIcon(achievement.id)}</span>
                           <div className="flex-1">
                             <h3 className="text-lg font-bold text-white">{achievement.name}</h3>
                             <p className="text-sm text-gray-300">{achievement.description}</p>
                           </div>
                           {achievement.earned && (
                             <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                           )}
                         </div>
                         
                         {progress && !achievement.earned && (
                           <div className="mb-3">
                             <div className="flex justify-between text-xs text-gray-400 mb-1">
                               <span>{progress.label}</span>
                               <span>{progress.current}/{progress.target}</span>
                             </div>
                                                        <div className="w-full retro-progress h-2">
                             <div 
                               className="retro-progress-fill h-2 transition-all duration-300"
                               style={{ width: `${progress.percentage}%` }}
                             ></div>
                           </div>
                           </div>
                         )}
                         
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-gray-400">{achievement.xpReward} XP</span>
                           {achievement.earned ? (
                             <div className="flex items-center">
                               <span className="text-xs text-green-400 mr-2">✓ Earned</span>
                               {achievement.earnedAt && (
                                 <span className="text-xs text-gray-500">
                                   {new Date(achievement.earnedAt * 1000).toLocaleDateString()}
                                 </span>
                               )}
                             </div>
                           ) : achievement.unlocked && !achievement.claimed ? (
                             <button
                               onClick={() => handleClaimBadge(achievement.id)}
                               disabled={claimingBadge === achievement.id}
                               className="px-3 py-1 text-xs bg-[#80142C] text-white hover:bg-[#a01d39] disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {claimingBadge === achievement.id ? 'Claiming...' : 'Claim Achievement'}
                             </button>
                           ) : (
                             <span className="text-xs text-gray-500">🔒 Locked</span>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}

               {/* No achievements message */}
               {(!unifiedAchievements || unifiedAchievements.length === 0) && (
                 <div className="text-center py-8">
                   <div className="text-6xl mb-4">🏆</div>
                   <h3 className="text-xl font-bold text-white mb-2 uppercase">No Achievements Yet</h3>
                   <p className="text-gray-300 uppercase">Start playing games to unlock achievements!</p>
                 </div>
               )}
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-200 italic uppercase">
            Complete challenges to unlock achievements and earn rewards!
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p className="uppercase">Powered by Firebase & Honeycomb Protocol</p>
            <p className="text-xs mt-1 uppercase">Syncs across both platforms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementPopup;