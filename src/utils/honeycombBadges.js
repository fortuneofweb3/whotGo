import { claimBadge, getUserProfile, hasBadge, getBadgeName, BADGE_CRITERIA, executeTransactionWithAutoFunding } from './profile';

// Badge achievement conditions and tracking
export const BADGE_CONDITIONS = {
  [BADGE_CRITERIA.FIRST_VICTORY]: {
    name: "First Victory",
    description: "Win your first game",
    condition: (stats) => stats.gamesWon >= 1,
    checkOnGameEnd: true
  },
  [BADGE_CRITERIA.CARD_MASTER]: {
    name: "Card Master", 
    description: "Master all card types",
    condition: (stats) => stats.cardsPlayed >= 100, // Simplified condition
    checkOnGameEnd: true
  },
  [BADGE_CRITERIA.SHADOW_WARRIOR]: {
    name: "Shadow Warrior",
    description: "Win a game without losing a life",
    condition: (stats) => stats.perfectWins >= 1,
    checkOnGameEnd: true
  },
  [BADGE_CRITERIA.STRATEGIC_MIND]: {
    name: "Strategic Mind",
    description: "Win 10 games with strategic plays",
    condition: (stats) => stats.gamesWon >= 10,
    checkOnGameEnd: true
  },
  [BADGE_CRITERIA.CENTURY_CLUB]: {
    name: "Century Club",
    description: "Play 100 games",
    condition: (stats) => stats.gamesPlayed >= 100,
    checkOnGameEnd: true
  },
  [BADGE_CRITERIA.ULTIMATE_CHAMPION]: {
    name: "Ultimate Champion",
    description: "Win 50 games",
    condition: (stats) => stats.gamesWon >= 50,
    checkOnGameEnd: true
  },
  [BADGE_CRITERIA.LEGENDARY_PLAYER]: {
    name: "Legendary Player",
    description: "Reach level 50",
    condition: (stats) => stats.level >= 50,
    checkOnGameEnd: false // Check on level up
  },
  [BADGE_CRITERIA.WHOT_GRANDMASTER]: {
    name: "Whot Grandmaster",
    description: "Achieve all other badges",
    condition: (stats, profile) => {
      if (!profile || !profile.badges) return false;
      const earnedBadges = profile.badges.length;
      return earnedBadges >= 7; // All badges except this one
    },
    checkOnGameEnd: true
  }
};

// Check for unlockable badges based on current stats (doesn't claim them)
export const checkUnlockableBadges = async ({ publicKey, stats, currentUser = null }) => {
  try {
    console.log('Checking for unlockable badge achievements...');
    
    // Get current user profile
    const profile = await getUserProfile(publicKey);
    if (!profile) {
      console.log('No profile found, skipping badge check');
      return [];
    }
    
    const unlockableBadges = [];
    
    // Check each badge condition
    for (const [badgeIndex, badgeInfo] of Object.entries(BADGE_CONDITIONS)) {
      const index = parseInt(badgeIndex);
      
      // Skip if already earned
      if (hasBadge(profile, index)) {
        continue;
      }
      
      // Check if condition is met
      const conditionMet = badgeInfo.condition(stats, profile);
      
      if (conditionMet) {
        console.log(`Badge condition met for ${badgeInfo.name} - ready to claim`);
        
        unlockableBadges.push({
          index,
          name: badgeInfo.name,
          description: badgeInfo.description,
          condition: badgeInfo.condition
        });
      }
    }
    
    return unlockableBadges;
  } catch (error) {
    console.error('Error checking unlockable badges:', error);
    return [];
  }
};

// Manually claim a specific badge
export const claimSpecificBadge = async ({ publicKey, wallet, signMessage, badgeIndex, currentUser = null }) => {
  try {
    console.log(`Claiming badge ${badgeIndex}...`);
    
    // Claim the badge on-chain
    const result = await claimBadge({ publicKey, wallet, signMessage, badgeIndex });
    
    if (result.success) {
      console.log(`Successfully claimed badge: ${badgeIndex}`);
      
      // Update Firebase if currentUser is provided
      if (currentUser) {
        try {
          const { ref, update } = await import('firebase/database');
          const { db } = await import('../firebase');
          
          const userRef = ref(db, `users/${currentUser.id}`);
          const currentBadges = currentUser.honeycombBadges || [];
          const badgeInfo = BADGE_CONDITIONS[badgeIndex];
          const updatedBadges = [...currentBadges, {
            index: badgeIndex,
            name: badgeInfo?.name || `Badge ${badgeIndex}`,
            description: badgeInfo?.description || '',
            earnedAt: Date.now()
          }];
          
          await update(userRef, {
            honeycombBadges: updatedBadges,
            lastActive: Date.now()
          });
          
          console.log(`Updated Firebase with claimed badge: ${badgeIndex}`);
        } catch (firebaseError) {
          console.error('Failed to update Firebase with claimed badge:', firebaseError);
        }
      }
      
      return { success: true, badgeIndex };
    }
    
    return { success: false, error: 'Failed to claim badge' };
  } catch (error) {
    console.error(`Failed to claim badge ${badgeIndex}:`, error);
    return { success: false, error: error.message };
  }
};

// Update game statistics and check for badges
export const updateGameStats = async ({ publicKey, wallet, signMessage, gameResult, gameStats, currentUser = null }) => {
  try {
    console.log('Updating game statistics...');
    
    // Get current profile
    const profile = await getUserProfile(publicKey);
    if (!profile) {
      console.log('No profile found, cannot update stats');
      return { success: false, unlockableBadges: [] };
    }
    
    // Calculate new stats
    const newStats = {
      gamesPlayed: profile.gamesPlayed + 1,
      gamesWon: profile.gamesWon + (gameResult === 'win' ? 1 : 0),
      xp: profile.xp + (gameStats?.xp || 0),
      level: profile.level,
      cardsPlayed: profile.cardsPlayed + (gameStats?.cardsPlayed || 0),
      perfectWins: profile.perfectWins + (gameStats?.perfectWin ? 1 : 0)
    };
    
    // Calculate new level based on XP
    newStats.level = Math.floor(newStats.xp / 100) + 1;
    
    // Update profile with new stats
    const { updateUserProfile } = await import('./profile');
    await updateUserProfile({
      publicKey,
      wallet,
      signMessage,
      profileData: newStats
    });
    
    // Check for unlockable badges (but don't claim them automatically)
    const unlockableBadges = await checkUnlockableBadges({
      publicKey,
      stats: newStats,
      currentUser
    });
    
    return {
      success: true,
      newStats,
      unlockableBadges
    };
  } catch (error) {
    console.error('Error updating game stats:', error);
    return { success: false, unlockableBadges: [] };
  }
};

// Get all available badges with earned status
export const getAllBadges = async (publicKey) => {
  try {
    const profile = await getUserProfile(publicKey);
    if (!profile) return [];
    
    return Object.entries(BADGE_CONDITIONS).map(([index, badgeInfo]) => ({
      index: parseInt(index),
      name: badgeInfo.name,
      description: badgeInfo.description,
      earned: hasBadge(profile, parseInt(index)),
      earnedAt: profile.badges?.find(b => b.badgeCriteria === parseInt(index))?.createdAt
    }));
  } catch (error) {
    console.error('Error getting all badges:', error);
    return [];
  }
};

// Check if user has earned a specific badge
export const checkBadgeEarned = async (publicKey, badgeIndex) => {
  try {
    const profile = await getUserProfile(publicKey);
    if (!profile) return false;
    
    return hasBadge(profile, badgeIndex);
  } catch (error) {
    console.error('Error checking badge earned:', error);
    return false;
  }
};

// Get badge progress for badges that have progress tracking
export const getBadgeProgress = (stats, badgeIndex) => {
  const conditions = {
    [BADGE_CRITERIA.STRATEGIC_MIND]: {
      current: stats.gamesWon || 0,
      target: 10,
      label: 'Games Won'
    },
    [BADGE_CRITERIA.CENTURY_CLUB]: {
      current: stats.gamesPlayed || 0,
      target: 100,
      label: 'Games Played'
    },
    [BADGE_CRITERIA.ULTIMATE_CHAMPION]: {
      current: stats.gamesWon || 0,
      target: 50,
      label: 'Games Won'
    },
    [BADGE_CRITERIA.LEGENDARY_PLAYER]: {
      current: stats.level || 1,
      target: 50,
      label: 'Level'
    }
  };
  
  const progress = conditions[badgeIndex];
  if (!progress) return null;
  
  return {
    ...progress,
    percentage: Math.min((progress.current / progress.target) * 100, 100)
  };
};
