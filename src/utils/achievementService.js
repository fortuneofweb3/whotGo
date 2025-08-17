// Achievement Service - Handles all achievement logic and Honeycomb integration
import { updatePlatformData } from './profile.js';

// Achievement definitions with their requirements
export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 0,
    name: 'First Victory',
    description: 'Win your first game',
    condition: (stats) => stats.gamesWon >= 1,
    xpReward: 50
  },
  {
    id: 1,
    name: 'Card Master',
    description: 'Master all card types',
    condition: (stats) => stats.totalCardsPlayed >= 100,
    xpReward: 100
  },
  {
    id: 2,
    name: 'Shadow Warrior',
    description: 'Win a game without losing a life',
    condition: (stats) => stats.perfectWins >= 1,
    xpReward: 200
  },
  {
    id: 3,
    name: 'Strategic Mind',
    description: 'Win 10 games with strategic plays',
    condition: (stats) => stats.gamesWon >= 10,
    xpReward: 300
  },
  {
    id: 4,
    name: 'Century Club',
    description: 'Play 100 games',
    condition: (stats) => stats.gamesPlayed >= 100,
    xpReward: 500
  },
  {
    id: 5,
    name: 'Ultimate Champion',
    description: 'Win 50 games',
    condition: (stats) => stats.gamesWon >= 50,
    xpReward: 1000
  },
  {
    id: 6,
    name: 'Legendary Player',
    description: 'Reach level 50',
    condition: (stats) => stats.level >= 50,
    xpReward: 2000
  },
  {
    id: 7,
    name: 'Whot Grandmaster',
    description: 'Achieve all other achievements',
    condition: (stats) => stats.achievementsUnlocked >= 7, // All except this one
    xpReward: 5000
  }
];

// Calculate level from XP
export const calculateLevel = (xp) => {
  return Math.floor(xp / 100) + 1;
};

// Get XP reward for game completion
export const getGameXPReward = (isWinner, roundsPlayed = 1, cardsPlayed = 0) => {
  let baseXP = isWinner ? 150 : 50;
  
  // Bonus for quick wins
  if (isWinner && roundsPlayed === 1) {
    baseXP += 100; // Perfect win bonus
  }
  
  // Bonus for playing many cards (showing engagement)
  if (cardsPlayed > 20) {
    baseXP += Math.min(cardsPlayed - 20, 50); // Up to 50 bonus XP
  }
  
  return baseXP;
};

// Check which achievements should be unlocked based on current stats
export const checkAchievements = (currentStats, existingAchievements = []) => {
  const newAchievements = [];
  
  ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
    // Skip if already unlocked
    if (existingAchievements.includes(achievement.id)) {
      return;
    }
    
    // Check if condition is met
    if (achievement.condition(currentStats)) {
      newAchievements.push(achievement.id);
    }
  });
  
  return newAchievements;
};

// Update user stats and achievements after a game
export const updateUserStatsAndAchievements = async (user, gameData, isWinner) => {
  try {
    // Calculate game statistics
    const roundsPlayed = gameData.roundsPlayed || 1;
    const cardsPlayed = gameData.totalCardsPlayed || 0;
    const xpEarned = getGameXPReward(isWinner, roundsPlayed, cardsPlayed);
    
    // Update user statistics
    const updatedStats = {
      gamesPlayed: (user.gamesPlayed || 0) + 1,
      gamesWon: isWinner ? (user.gamesWon || 0) + 1 : (user.gamesWon || 0),
      totalCardsPlayed: (user.totalCardsPlayed || 0) + cardsPlayed,
      perfectWins: isWinner && roundsPlayed === 1 ? (user.perfectWins || 0) + 1 : (user.perfectWins || 0),
      currentWinStreak: isWinner ? (user.currentWinStreak || 0) + 1 : 0,
      bestWinStreak: isWinner ? Math.max((user.currentWinStreak || 0) + 1, user.bestWinStreak || 0) : (user.bestWinStreak || 0),
      lastActive: Date.now().toString()
    };
    
    // Calculate new XP and level
    const newXP = (user.xp || 0) + xpEarned;
    const newLevel = calculateLevel(newXP);
    
    // Prepare stats for achievement checking
    const statsForAchievements = {
      ...updatedStats,
      xp: newXP,
      level: newLevel,
      achievementsUnlocked: (user.achievements || []).length
    };
    
    // Check for new achievements
    const newAchievements = checkAchievements(statsForAchievements, user.achievements || []);
    
    // Calculate total XP from achievements
    const achievementXP = newAchievements.reduce((total, achievementId) => {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
      return total + (achievement ? achievement.xpReward : 0);
    }, 0);
    
    // Add achievement XP to total
    const finalXP = newXP + achievementXP;
    const finalLevel = calculateLevel(finalXP);
    
    // Prepare custom data for Honeycomb
    const customData = {
      gamesPlayed: updatedStats.gamesPlayed.toString(),
      gamesWon: updatedStats.gamesWon.toString(),
      totalCardsPlayed: updatedStats.totalCardsPlayed.toString(),
      perfectWins: updatedStats.perfectWins.toString(),
      currentWinStreak: updatedStats.currentWinStreak.toString(),
      bestWinStreak: updatedStats.bestWinStreak.toString(),
      lastActive: updatedStats.lastActive
    };
    
    // Update Honeycomb platform data
    if (user.publicKey) {
      await updatePlatformData({
        publicKey: user.publicKey,
        achievements: newAchievements,
        xp: finalXP,
        customData
      });
    }
    
    // Return updated user data
    return {
      ...user,
      ...updatedStats,
      xp: finalXP,
      level: finalLevel,
      achievements: [...(user.achievements || []), ...newAchievements],
      newlyUnlockedAchievements: newAchievements,
      xpEarned: xpEarned + achievementXP,
      achievementXP
    };
    
  } catch (error) {
    console.error('Error updating user stats and achievements:', error);
    throw error;
  }
};

// Get achievement progress for display
export const getAchievementProgress = (achievementId, userStats) => {
  const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
  if (!achievement) return { current: 0, target: 0, percentage: 0 };
  
  let current = 0;
  let target = 0;
  
  switch (achievementId) {
    case 0: // First Victory
      current = userStats.gamesWon || 0;
      target = 1;
      break;
    case 1: // Card Master
      current = userStats.totalCardsPlayed || 0;
      target = 100;
      break;
    case 2: // Shadow Warrior
      current = userStats.perfectWins || 0;
      target = 1;
      break;
    case 3: // Strategic Mind
      current = userStats.gamesWon || 0;
      target = 10;
      break;
    case 4: // Century Club
      current = userStats.gamesPlayed || 0;
      target = 100;
      break;
    case 5: // Ultimate Champion
      current = userStats.gamesWon || 0;
      target = 50;
      break;
    case 6: // Legendary Player
      current = userStats.level || 1;
      target = 50;
      break;
    case 7: // Whot Grandmaster
      current = userStats.achievementsUnlocked || 0;
      target = 7;
      break;
    default:
      current = 0;
      target = 1;
  }
  
  const percentage = Math.min((current / target) * 100, 100);
  
  return { current, target, percentage };
};

// Get achievement name by ID
export const getAchievementName = (achievementId) => {
  const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
  return achievement ? achievement.name : 'Unknown Achievement';
};

// Get achievement description by ID
export const getAchievementDescription = (achievementId) => {
  const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
  return achievement ? achievement.description : 'Unknown achievement';
};

// Check if user has a specific achievement
export const hasAchievement = (user, achievementId) => {
  return user.achievements && user.achievements.includes(achievementId);
};
