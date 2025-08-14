import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAllBadges, getBadgeProgress, BADGE_CONDITIONS, claimSpecificBadge } from '../../utils/honeycombBadges';
import { getUserProfile } from '../../utils/profile';

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
        
        // Get all Honeycomb badges with earned status
        const honeycombBadges = await getAllBadges(publicKey);
        
        // Create unified achievements list
        const unified = [];
        
        // Add Firebase achievements (if they exist and are not duplicates)
        if (firebaseAchievements && firebaseAchievements.length > 0) {
          firebaseAchievements.forEach(fbAchievement => {
            // Find corresponding Honeycomb badge
            const honeycombBadge = honeycombBadges.find(hb => hb.index === fbAchievement.id - 1);
            
            unified.push({
              id: fbAchievement.id,
              index: fbAchievement.id - 1, // Convert to Honeycomb index
              name: fbAchievement.name,
              description: fbAchievement.description,
              icon: fbAchievement.icon,
              reward: fbAchievement.reward,
              unlocked: fbAchievement.unlocked || (honeycombBadge?.earned || false),
              claimed: fbAchievement.claimed || (honeycombBadge?.earned || false),
              earned: honeycombBadge?.earned || fbAchievement.unlocked || false,
              earnedAt: honeycombBadge?.earnedAt || null,
              source: 'unified'
            });
          });
        } else {
          // If no Firebase achievements, use Honeycomb badges
          honeycombBadges.forEach(badge => {
            unified.push({
              id: badge.index + 1,
              index: badge.index,
              name: badge.name,
              description: badge.description,
              icon: getBadgeIcon(badge.index),
              reward: getBadgeReward(badge.index),
              unlocked: badge.earned,
              claimed: badge.earned,
              earned: badge.earned,
              earnedAt: badge.earnedAt,
              source: 'honeycomb'
            });
          });
        }
        
        setUnifiedAchievements(unified);
      } catch (error) {
        console.error('Error loading unified achievements:', error);
        // Fallback to Firebase achievements only
        if (firebaseAchievements && firebaseAchievements.length > 0) {
          const fallback = firebaseAchievements.map(fb => ({
            id: fb.id,
            index: fb.id - 1,
            name: fb.name,
            description: fb.description,
            icon: fb.icon,
            reward: fb.reward,
            unlocked: fb.unlocked,
            claimed: fb.claimed,
            earned: fb.unlocked,
            earnedAt: null,
            source: 'firebase'
          }));
          setUnifiedAchievements(fallback);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUnifiedAchievements();
  }, [publicKey, firebaseAchievements]);

  const getBadgeIcon = (badgeIndex) => {
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
    return icons[badgeIndex] || '🏅';
  };

  const getBadgeReward = (badgeIndex) => {
    const rewards = {
      0: '100 XP',  // First Victory
      1: '200 XP',  // Card Master
      2: '500 XP',  // Shadow Warrior
      3: '1200 XP', // Strategic Mind
      4: '1500 XP', // Century Club
      5: '2000 XP', // Ultimate Champion
      6: '3000 XP', // Legendary Player
      7: '5000 XP'  // Whot Grandmaster
    };
    return rewards[badgeIndex] || '100 XP';
  };

  const getProgressInfo = (achievement) => {
    // Use Honeycomb profile for progress if available, otherwise use Firebase profile
    const profile = honeycombProfile || firebaseProfile;
    if (!profile) return null;
    
    const progress = getBadgeProgress(profile, achievement.index);
    if (!progress) return null;
    
    return {
      current: progress.current,
      target: progress.target,
      percentage: progress.percentage,
      label: progress.label
    };
  };

  const handleClaimBadge = async (badgeIndex) => {
    if (!publicKey || !wallet || !signMessage) {
      console.error('Wallet not connected for claiming badge');
      return;
    }

    setClaimingBadge(badgeIndex);
    
    try {
      console.log(`Claiming badge ${badgeIndex}...`);
      
      const result = await claimSpecificBadge({
        publicKey,
        wallet,
        signMessage,
        badgeIndex,
        currentUser: firebaseProfile
      });
      
      if (result.success) {
        console.log(`Successfully claimed badge ${badgeIndex}`);
        
        // Refresh the achievements list
        const updatedAchievements = unifiedAchievements.map(achievement => 
          achievement.index === badgeIndex 
            ? { ...achievement, claimed: true, earned: true }
            : achievement
        );
        setUnifiedAchievements(updatedAchievements);
        
        // Refresh Honeycomb profile
        const profile = await getUserProfile(publicKey);
        setHoneycombProfile(profile);
        
      } else {
        console.error(`Failed to claim badge ${badgeIndex}:`, result.error);
        alert(`Failed to claim badge: ${result.error}`);
      }
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
                           <span className="text-3xl mr-3">{achievement.icon}</span>
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
                           <span className="text-xs text-gray-400">{achievement.reward}</span>
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
                               onClick={() => handleClaimBadge(achievement.index)}
                               disabled={claimingBadge === achievement.index}
                               className="px-3 py-1 text-xs bg-[#80142C] text-white hover:bg-[#a01d39] disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {claimingBadge === achievement.index ? 'Claiming...' : 'Claim Badge'}
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