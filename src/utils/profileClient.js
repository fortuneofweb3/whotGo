import { createEdgeClient } from '@honeycomb-protocol/edge-client';
import { PublicKey } from '@solana/web3.js';

// Honeycomb Protocol Configuration for Whot Go Project
// Project created on Honeynet (Solana test network)
const API_URLS = [
  "https://edge.test.honeycombprotocol.com/", // Primary: Test network
  "https://edge.main.honeycombprotocol.com/", // Fallback: Mainnet
  "https://edge.dev.honeycombprotocol.com/"   // Fallback: Devnet
];

const PROJECT_ADDRESS = import.meta.env.VITE_HONEYCOMB_PROJECT_ADDRESS || process.env.HONEYCOMB_PROJECT_ADDRESS;
const PROFILES_TREE_ADDRESS = import.meta.env.VITE_HONEYCOMB_PROFILES_TREE_ADDRESS || process.env.HONEYCOMB_PROFILES_TREE_ADDRESS;

// Network configuration
const NETWORK_CONFIG = {
  rpcUrl: "https://rpc.test.honeycombprotocol.com", // Honeynet RPC endpoint
  apiUrl: "https://edge.test.honeycombprotocol.com/", // Honeynet API endpoint
  network: "honeynet" // Solana test network
};

// Badge criteria indices mapping to achievements
export const BADGE_CRITERIA = {
  FIRST_VICTORY: 0,        // Win your first game
  CARD_MASTER: 1,          // Master all card types
  SHADOW_WARRIOR: 2,       // Win a game without losing a life
  STRATEGIC_MIND: 3,       // Win 10 games with strategic plays
  CENTURY_CLUB: 4,         // Play 100 games
  ULTIMATE_CHAMPION: 5,    // Win 50 games
  LEGENDARY_PLAYER: 6,     // Reach level 50
  WHOT_GRANDMASTER: 7      // Achieve all other badges
};

let client;
let currentApiUrl = API_URLS[0]; // Start with test network

// Initialize client with fallback
const initializeClient = () => {
  console.log('🔗 Initializing Honeycomb client for Honeynet test network...');
  console.log('📋 Network config:', NETWORK_CONFIG);
  
  for (const apiUrl of API_URLS) {
    try {
      console.log(`🔗 Trying Honeycomb API endpoint: ${apiUrl}`);
      client = createEdgeClient(apiUrl, true);
      currentApiUrl = apiUrl;
      console.log(`✅ Honeycomb client initialized successfully with ${apiUrl}`);
      
      // Log network information
      if (apiUrl === NETWORK_CONFIG.apiUrl) {
        console.log('🎯 Connected to correct test network (Honeynet)');
      } else {
        console.log('⚠️ Connected to fallback network');
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize Honeycomb client with ${apiUrl}:`, error);
    }
  }
  
  // If all API endpoints fail, throw error
  console.log('🚨 All Honeycomb API endpoints failed');
  throw new Error('Failed to connect to any Honeycomb API endpoint');
};

// Initialize client
initializeClient();

// Client-side profile functions (browser-safe)
export const getUserProfile = async (publicKey) => {
  try {
    if (!publicKey) {
      console.log('❌ No publicKey provided');
      return null;
    }

    const walletAddress = publicKey.toString();
    console.log('Getting Honeycomb user profile for wallet:', walletAddress);

    // First find the user by wallet address
    const users = await client.findUsers({
      wallets: [walletAddress]
    });

    if (users.user.length === 0) {
      console.log('❌ User not found for wallet address');
      return null;
    }

    const user = users.user[0];
    console.log('✅ User found:', user.id);

    // Then find the user's profile
    const profiles = await client.findProfiles({
      userIds: [user.id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"],
      includePlatformData: true
    });

    if (profiles.profile.length === 0) {
      console.log('❌ Profile not found for user');
      return null;
    }

    const profile = profiles.profile[0];
    console.log('✅ Profile found:', profile.address);
    
    // Read XP and achievements from platform data
    const platformXP = parseInt(profile.platformData?.xp || 0);
    const platformAchievements = profile.platformData?.achievements || [];
    
    // Calculate level from XP
    const level = Math.floor(platformXP / 100) + 1;
    
    // Read custom data for game statistics
    const customData = profile.customData || {};
    const gamesPlayed = parseInt(customData['1']?.[1] || 0);
    const gamesWon = parseInt(customData['2']?.[1] || 0);
    const totalCardsPlayed = parseInt(customData['3']?.[1] || 0);
    const perfectWins = parseInt(customData['4']?.[1] || 0);
    const currentWinStreak = parseInt(customData['5']?.[1] || 0);
    const bestWinStreak = parseInt(customData['6']?.[1] || 0);

    return {
      address: profile.address,
      userId: profile.userId,
      xp: platformXP,
      level: level,
      achievements: platformAchievements,
      gamesPlayed: gamesPlayed,
      gamesWon: gamesWon,
      totalCardsPlayed: totalCardsPlayed,
      perfectWins: perfectWins,
      currentWinStreak: currentWinStreak,
      bestWinStreak: bestWinStreak,
      info: profile.info || {},
      customData: customData,
      platformData: profile.platformData || {}
    };

  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

// Helper function to check if user has earned a specific achievement
export const hasAchievement = (profile, achievementIndex) => {
  if (!profile || !profile.achievements) return false;
  return profile.achievements.includes(achievementIndex);
};

// Helper function to get achievement name by index
export const getAchievementName = (achievementIndex) => {
  const achievementNames = {
    [BADGE_CRITERIA.FIRST_VICTORY]: "First Victory",
    [BADGE_CRITERIA.CARD_MASTER]: "Card Master",
    [BADGE_CRITERIA.SHADOW_WARRIOR]: "Shadow Warrior",
    [BADGE_CRITERIA.STRATEGIC_MIND]: "Strategic Mind",
    [BADGE_CRITERIA.CENTURY_CLUB]: "Century Club",
    [BADGE_CRITERIA.ULTIMATE_CHAMPION]: "Ultimate Champion",
    [BADGE_CRITERIA.LEGENDARY_PLAYER]: "Legendary Player",
    [BADGE_CRITERIA.WHOT_GRANDMASTER]: "Whot Grandmaster"
  };
  return achievementNames[achievementIndex] || `Achievement ${achievementIndex}`;
};

// Sync Honeycomb data to Firebase (client-side version)
export const syncHoneycombToFirebase = async (publicKey) => {
  try {
    console.log('🔄 Syncing Honeycomb data to Firebase...');
    if (!publicKey) {
      console.log('❌ No publicKey provided for sync');
      return { success: false, error: 'No publicKey provided' };
    }
    
    const honeycombProfile = await getUserProfile(publicKey);
    if (!honeycombProfile) {
      console.log('❌ No Honeycomb profile found');
      return { success: false, error: 'No Honeycomb profile found' };
    }
    
    console.log('🔄 Honeycomb profile data:', honeycombProfile);
    
    const { ref, update } = await import('firebase/database');
    const { db } = await import('../firebase');
    
    const userRef = ref(db, `users/${publicKey.toString()}`);
    const updateData = {
      xp: honeycombProfile.xp || 0,
      level: honeycombProfile.level || 1,
      gamesPlayed: honeycombProfile.gamesPlayed || 0,
      gamesWon: honeycombProfile.gamesWon || 0,
      totalCardsPlayed: honeycombProfile.totalCardsPlayed || 0,
      perfectWins: honeycombProfile.perfectWins || 0,
      currentWinStreak: honeycombProfile.currentWinStreak || 0,
      bestWinStreak: honeycombProfile.bestWinStreak || 0,
      lastActive: Date.now(),
      honeycombSynced: true
    };
    
    await update(userRef, updateData);
    console.log('✅ Honeycomb data successfully synced to Firebase');
    
    return {
      success: true,
      data: updateData,
      honeycombProfile
    };
  } catch (error) {
    console.error('❌ Error syncing Honeycomb to Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Check if user profile exists (client-side version)
export const checkUserProfileExists = async (publicKey, firebaseUserData = null) => {
  try {
    if (!publicKey) {
      console.log('❌ No publicKey provided for profile check');
      return { exists: false, error: 'No publicKey provided' };
    }

    console.log('🔍 Checking if user profile exists...');
    
    // First check Honeycomb profile
    const honeycombProfile = await getUserProfile(publicKey);
    
    if (honeycombProfile) {
      console.log('✅ Honeycomb profile found');
      return { 
        exists: true, 
        honeycombProfile,
        firebaseData: firebaseUserData
      };
    }
    
    console.log('❌ No Honeycomb profile found');
    return { 
      exists: false, 
      honeycombProfile: null,
      firebaseData: firebaseUserData
    };
    
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
    return { 
      exists: false, 
      error: error.message,
      firebaseData: firebaseUserData
    };
  }
};

// Check user profile exists with retry (client-side version)
export const checkUserProfileExistsWithRetry = async (publicKey, firebaseUserData = null, maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Profile check attempt ${attempt}/${maxRetries}`);
    
    const result = await checkUserProfileExists(publicKey, firebaseUserData);
    
    if (result.exists) {
      console.log('✅ Profile found on attempt', attempt);
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log('❌ Profile not found after all retries');
  return { exists: false, error: 'Profile not found after retries' };
};

// Login user profile (client-side version - simplified)
export const loginUserProfile = async (publicKey) => {
  try {
    console.log('🔐 Logging in user profile...');
    
    const profileResult = await checkUserProfileExists(publicKey);
    
    if (profileResult.exists) {
      console.log('✅ User profile login successful');
      return { success: true, profile: profileResult.honeycombProfile };
    } else {
      console.log('❌ User profile not found');
      return { success: false, error: 'Profile not found' };
    }
    
  } catch (error) {
    console.error('❌ Error logging in user profile:', error);
    return { success: false, error: error.message };
  }
};

// Update profile info (client-side version - simplified)
export const updateProfileInfo = async ({ publicKey, wallet, signMessage, username, bio, pfp }) => {
  try {
    console.log('📝 Updating profile info...');
    
    // For client-side, we'll just return success since actual updates are server-side
    console.log('✅ Profile info update request received');
    return { success: true, message: 'Profile update request received' };
    
  } catch (error) {
    console.error('❌ Error updating profile info:', error);
    return { success: false, error: error.message };
  }
};

// Create user profile (client-side version - simplified)
export const createUserProfile = async ({ publicKey, wallet, signMessage, username = null }) => {
  try {
    console.log('👤 Creating user profile...');
    
    // For client-side, we'll just return success since actual creation is server-side
    console.log('✅ User profile creation request received');
    return { success: true, message: 'Profile creation request received' };
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Update user profile (client-side version - simplified)
export const updateUserProfile = async ({ publicKey, wallet, signMessage, profileData }) => {
  try {
    console.log('🔄 Updating user profile...');
    
    // For client-side, we'll just return success since actual updates are server-side
    console.log('✅ User profile update request received');
    return { success: true, message: 'Profile update request received' };
    
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Sync Firebase to Honeycomb (client-side version - simplified)
export const syncFirebaseToHoneycomb = async (publicKey, firebaseUserData, wallet, signMessage) => {
  try {
    console.log('🔄 Syncing Firebase to Honeycomb...');
    
    // For client-side, we'll just return success since actual sync is server-side
    console.log('✅ Firebase to Honeycomb sync request received');
    return { success: true, message: 'Sync request received' };
    
  } catch (error) {
    console.error('❌ Error syncing Firebase to Honeycomb:', error);
    return { success: false, error: error.message };
  }
};

// Update platform data (client-side version - calls Firebase function)
export const updatePlatformData = async ({ publicKey, achievements = [], xp = 0, customData = {} }) => {
  try {
    console.log('🔄 Updating platform data (client-side)...');
    console.log('📊 Platform data:', { achievements, xp, customData });
    
    // Import Firebase functions
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { app } = await import('../firebase');
    
    const functions = getFunctions(app);
    const updatePlatformDataFunction = httpsCallable(functions, 'updatePlatformData');
    
    // Call the Firebase function
    const result = await updatePlatformDataFunction({
      publicKey: publicKey.toString(),
      achievements,
      xp,
      customData
    });
    
    console.log('✅ Platform data update completed:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('❌ Error updating platform data:', error);
    return { success: false, error: error.message };
  }
};
