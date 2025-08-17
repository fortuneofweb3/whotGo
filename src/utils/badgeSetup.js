// Achievement definitions for Whot Go!
const ACHIEVEMENT_DEFINITIONS = [
  {
    index: 0,
    name: 'First Victory',
    description: 'Win your first game',
    imageUrl: 'https://whotgo.com/achievements/first-victory.png'
  },
  {
    index: 1,
    name: 'Card Master',
    description: 'Master all card types',
    imageUrl: 'https://whotgo.com/achievements/card-master.png'
  },
  {
    index: 2,
    name: 'Shadow Warrior',
    description: 'Win a game without losing a life',
    imageUrl: 'https://whotgo.com/achievements/shadow-warrior.png'
  },
  {
    index: 3,
    name: 'Strategic Mind',
    description: 'Win 10 games with strategic plays',
    imageUrl: 'https://whotgo.com/achievements/strategic-mind.png'
  },
  {
    index: 4,
    name: 'Century Club',
    description: 'Play 100 games',
    imageUrl: 'https://whotgo.com/achievements/century-club.png'
  },
  {
    index: 5,
    name: 'Ultimate Champion',
    description: 'Win 50 games',
    imageUrl: 'https://whotgo.com/achievements/ultimate-champion.png'
  },
  {
    index: 6,
    name: 'Legendary Player',
    description: 'Reach level 50',
    imageUrl: 'https://whotgo.com/achievements/legendary-player.png'
  },
  {
    index: 7,
    name: 'Whot Grandmaster',
    description: 'Achieve all other achievements',
    imageUrl: 'https://whotgo.com/achievements/whot-grandmaster.png'
  }
];

/**
 * Create badge criteria for a specific badge
 */
const createBadgeCriteria = async (client, badgeIndex, badgeData, authorityPublicKey, projectAddress) => {
  try {
    console.log(`🏗️ Creating badge criteria for badge ${badgeIndex}: ${badgeData.name}`);
    
    // Create badge criteria transaction using the correct API
    const {
      createCreateBadgeCriteriaTransaction: {
        blockhash,
        lastValidBlockHeight,
        transaction,
      },
    } = await client.createCreateBadgeCriteriaTransaction({
      args: {
        authority: authorityPublicKey, // Project authority public key
        projectAddress: projectAddress, // Project public key
        payer: authorityPublicKey, // Using authority as payer
        badgeIndex: badgeIndex, // Badge index as an integer
        condition: BadgesCondition.Public, // Badge condition, only Public is available for now
        startTime: 0, // Optional start time, UNIX timestamp
        endTime: 0, // Optional end time, UNIX timestamp
      },
    });

    console.log(`✅ Badge criteria transaction created for ${badgeData.name}`);
    return {
      success: true,
      blockhash,
      lastValidBlockHeight,
      transaction,
      badgeIndex,
      badgeName: badgeData.name
    };
  } catch (error) {
    console.error(`❌ Failed to create badge criteria for ${badgeData.name}:`, error);
    return {
      success: false,
      badgeIndex,
      badgeName: badgeData.name,
      error: error.message
    };
  }
};

/**
 * Create all badge criteria for the project
 */
const createAllBadgeCriteria = async (client, authorityPublicKey, projectAddress) => {
  try {
    console.log('🚀 Starting badge criteria creation for all badges...');
    
    const results = [];
    
    for (const badge of BADGE_DEFINITIONS) {
      const result = await createBadgeCriteria(
        client, 
        badge.index, 
        badge, 
        authorityPublicKey, 
        projectAddress
      );
      
      results.push({
        badgeIndex: badge.index,
        badgeName: badge.name,
        ...result
      });
      
      // Add a small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('📊 Badge criteria creation summary:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Failed to create badge criteria:', error);
    throw error;
  }
};

/**
 * Check if badge criteria exists by attempting to create a claim transaction
 */
const checkBadgeCriteria = async (client, badgeIndex) => {
  try {
    console.log(`🔍 Checking if badge criteria ${badgeIndex} exists...`);
    
    // Try to create a claim transaction - if it fails, the criteria doesn't exist
    const testResponse = await client.createClaimBadgeCriteriaTransaction({
      args: {
        payer: 'test', // Dummy payer for testing
        projectAddress: process.env.HONEYCOMB_PROJECT_ADDRESS || import.meta?.env?.HONEYCOMB_PROJECT_ADDRESS || 'FJ96yFfdiKfmmHTqxpKuYnaroLMWHNCYxjNFmvn8Ut7c',
        profileAddress: 'test', // Dummy profile for testing
        criteriaIndex: badgeIndex,
        proof: "Public"
      }
    });
    
    return {
      exists: true,
      response: testResponse
    };
  } catch (error) {
    console.log(`❌ Badge criteria ${badgeIndex} does not exist or is not accessible`);
    return {
      exists: false,
      error: error.message
    };
  }
};

/**
 * Check all badge criteria status
 */
const checkAllBadgeCriteria = async (client) => {
  try {
    console.log('🔍 Checking all badge criteria status...');
    
    const results = [];
    
    for (const badge of BADGE_DEFINITIONS) {
      const status = await checkBadgeCriteria(client, badge.index);
      results.push({
        badgeIndex: badge.index,
        badgeName: badge.name,
        exists: status.exists,
        error: status.error
      });
    }
    
    console.log('📊 Badge criteria status:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Failed to check badge criteria:', error);
    throw error;
  }
};

/**
 * Test achievement claiming for a specific achievement
 */
const testAchievementClaiming = async (client, wallet, signMessage, achievementIndex) => {
  try {
    console.log(`🧪 Testing achievement claiming for achievement ${achievementIndex}...`);
    
    // Import the existing achievement function from profile.js
    const { updatePlatformData } = await import('./profile.js');
    
    const result = await updatePlatformData({
      publicKey: wallet.publicKey,
      achievements: [achievementIndex],
      xp: 100 // Add some XP as well
    });
    
    return {
      success: true,
      achievementIndex: achievementIndex,
      result: result
    };
  } catch (error) {
    console.error(`❌ Failed to claim achievement ${achievementIndex}:`, error);
    return {
      success: false,
      achievementIndex: achievementIndex,
      error: error.message
    };
  }
};

/**
 * Test all achievement claiming
 */
const testAllAchievementClaiming = async (client, wallet, signMessage) => {
  try {
    console.log('🧪 Testing achievement claiming for all achievements...');
    
    const results = [];
    
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      const result = await testAchievementClaiming(client, wallet, signMessage, achievement.index);
      results.push({
        achievementIndex: achievement.index,
        achievementName: achievement.name,
        ...result
      });
      
      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 Achievement claiming test results:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Failed to test achievement claiming:', error);
    throw error;
  }
};

/**
 * Setup function to create missing badge criteria
 */
const setupBadgeCriteria = async (client, authorityPublicKey, projectAddress) => {
  try {
    console.log('🔧 Setting up badge criteria...');
    
    // First check what exists
    const status = await checkAllBadgeCriteria(client);
    
    const missingBadges = status.filter(item => !item.exists);
    
    if (missingBadges.length === 0) {
      console.log('✅ All badge criteria already exist!');
      return { success: true, message: 'All badges already exist' };
    }
    
    console.log(`📝 Found ${missingBadges.length} missing badge criteria:`, missingBadges);
    
    // Create missing badges
    const results = await createAllBadgeCriteria(client, authorityPublicKey, projectAddress);
    
    return {
      success: true,
      created: results.filter(r => r.success),
      failed: results.filter(r => !r.success)
    };
    
  } catch (error) {
    console.error('❌ Badge setup failed:', error);
    throw error;
  }
};

/**
 * Comprehensive achievement testing function
 */
const testAchievementSystem = async (client, wallet, signMessage) => {
  try {
    console.log('🔧 Testing achievement system...');
    
    console.log('🧪 Testing achievement claiming for all achievements...');
    const claimingResults = await testAllAchievementClaiming(client, wallet, signMessage);
    
    return {
      success: true,
      claimingResults: claimingResults
    };
    
  } catch (error) {
    console.error('❌ Achievement system test failed:', error);
    throw error;
  }
};

export {
  ACHIEVEMENT_DEFINITIONS,
  testAchievementClaiming,
  testAllAchievementClaiming,
  testAchievementSystem
};
