// Conditional imports for Node.js vs Browser environment
let dotenv, bs58, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, Keypair;

// Only load Node.js modules in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment
  dotenv = await import('dotenv');
  const bs58Module = await import('bs58');
  bs58 = bs58Module.default || bs58Module;
  const web3 = await import('@solana/web3.js');
  Connection = web3.Connection;
  LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL;
  PublicKey = web3.PublicKey;
  Transaction = web3.Transaction;
  SystemProgram = web3.SystemProgram;
  Keypair = web3.Keypair;
  
  // Load environment variables
  dotenv.config();
} else {
  // Browser environment - use browser-compatible imports
  const web3 = await import('@solana/web3.js');
  PublicKey = web3.PublicKey;
  // Other web3 imports will be loaded as needed
}

import { createEdgeClient } from '@honeycomb-protocol/edge-client';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers.js';

// Load environment variables at the top
dotenv.config();

// Honeycomb Protocol Configuration for Whot Go Project
// Project created on Honeynet (Solana test network)
const API_URLS = [
  "https://edge.test.honeycombprotocol.com/", // Primary: Test network
  "https://edge.main.honeycombprotocol.com/", // Fallback: Mainnet
  "https://edge.dev.honeycombprotocol.com/"   // Fallback: Devnet
];

const PROJECT_ADDRESS = process.env.HONEYCOMB_PROJECT_ADDRESS || import.meta?.env?.VITE_HONEYCOMB_PROJECT_ADDRESS;
const PROFILES_TREE_ADDRESS = process.env.HONEYCOMB_PROFILES_TREE_ADDRESS || import.meta?.env?.VITE_HONEYCOMB_PROFILES_TREE_ADDRESS;

// Network configuration
const NETWORK_CONFIG = {
  rpcUrl: "https://rpc.test.honeycombprotocol.com", // Honeynet RPC endpoint
  apiUrl: "https://edge.test.honeycombprotocol.com/", // Honeynet API endpoint
  network: "honeynet" // Solana test network
};

// Badge criteria indices mapping to achievements
const BADGE_CRITERIA = {
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

// Function to check if project exists
export const checkProjectExists = async () => {
  try {
    console.log('Checking if project exists...');
    console.log('Project address:', PROJECT_ADDRESS);
    console.log('Current API endpoint:', currentApiUrl);
    
      // Try to find the project (simple way to check if it exists)
  // Debug API call for troubleshooting
    const result = await client.findUsers({
      wallets: ['dummy'] // Use dummy wallet to test connection
    });
    
    console.log('Project check result:', result);
    return true;
  } catch (error) {
    console.error('Project check failed:', error);
    return false;
  }
};

// Function to get current API status
export const getApiStatus = () => {
  return {
    currentApiUrl,
    isMock: client === createMockClient(),
    projectAddress: PROJECT_ADDRESS,
    profilesTreeAddress: PROFILES_TREE_ADDRESS,
    networkConfig: NETWORK_CONFIG,
    isCorrectNetwork: currentApiUrl === NETWORK_CONFIG.apiUrl
  };
};

// Helper function to get the proper wallet adapter
const getWalletAdapter = (wallet) => {
  // Use the adapter if available, otherwise use the wallet itself
  return wallet.adapter || wallet;
};

/**
 * Create a new user profile following Honeycomb Protocol documentation
 */
export const createUserProfile = async ({ publicKey, wallet, signMessage, username = null }) => {
  try {
    // Validate required wallet methods
    if (!publicKey || !wallet || !signMessage) {
      console.error('❌ Invalid wallet parameters:', { 
        hasPublicKey: !!publicKey, 
        hasWallet: !!wallet, 
        hasSignMessage: !!signMessage,
        walletType: wallet?.constructor?.name,
        walletAdapter: wallet?.adapter?.name
      });
      throw new Error('Missing required wallet methods (publicKey, wallet, signMessage)');
    }

    // Validate wallet connection and required methods
    const hasSignAllTransactions = wallet.signAllTransactions || wallet.adapter?.signAllTransactions;
    const isConnected = wallet.connected || wallet.adapter?.connected;
    
    if (!isConnected || !hasSignAllTransactions) {
      console.error('❌ Wallet not properly connected:', {
        walletConnected: wallet.connected,
        adapterConnected: wallet.adapter?.connected,
        hasSignAllTransactions: !!wallet.signAllTransactions,
        adapterHasSignAllTransactions: !!wallet.adapter?.signAllTransactions,
        walletAdapter: wallet?.adapter?.name,
        walletType: wallet?.constructor?.name,
        adapterMethods: wallet.adapter ? Object.getOwnPropertyNames(wallet.adapter) : null
      });
      throw new Error('Wallet not properly connected or missing signAllTransactions method');
    }

    // Ensure wallet has SOL for transaction fees
    console.log('💰 Ensuring wallet has SOL for transaction fees...');
    const airdropPerformed = await ensureWalletHasSOL(publicKey, 0.01);
    
    if (airdropPerformed) {
      console.log('💰 Waiting 2 seconds for airdrop to settle...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const walletAddress = publicKey.toBase58();
    const displayName = username || `Player${Math.floor(Math.random() * 10000)}`;
    
    console.log('👤 Creating Honeycomb user profile...');
    console.log('🌐 Using API endpoint:', currentApiUrl);
    console.log('📋 Project configured');
    console.log('🌐 Network:', NETWORK_CONFIG.network);
    console.log('🔗 RPC configured');
    console.log('🔗 Client initialized:', !!client);
    console.log('🔗 Client methods:', client ? Object.getOwnPropertyNames(client) : 'No client');
    
    if (!client) {
      throw new Error('Honeycomb client not initialized');
    }
    
    if (!client.createNewUserWithProfileTransaction) {
      throw new Error('Honeycomb client missing createNewUserWithProfileTransaction method');
    }
    
    // For new user creation, we don't need authentication
    // Authentication is only required for existing users
    console.log('🔐 Creating new user - no authentication required');
    let accessToken = null;
    
    // Create new user with profile using Honeycomb Protocol
    // Following the official documentation pattern
    console.log('📝 Creating profile transaction...');
    console.log('📋 Transaction parameters configured');
    
    const transactionParams = {
      project: PROJECT_ADDRESS,
      wallet: walletAddress,
      payer: walletAddress,
      profileIdentity: "main", // Main profile identity
      userInfo: {
        name: displayName,
        bio: "Whot Go! Player - Join the ultimate card game experience!",
        pfp: "https://whotgo.com/default-avatar.png" // Default avatar
      },
      customData: {
        add: {
          xp: ["0"],
          gamesPlayed: ["0"],
          gamesWon: ["0"],
          lastActive: [Date.now().toString()],
          totalCardsPlayed: ["0"],
          perfectWins: ["0"],
          currentWinStreak: ["0"],
          bestWinStreak: ["0"]
        }
      }
    };
    
    console.log('📝 Calling createNewUserWithProfileTransaction...');
    
    let apiResponse;
    try {
      console.log('📝 About to call createNewUserWithProfileTransaction...');
      apiResponse = await client.createNewUserWithProfileTransaction(transactionParams);
          console.log('📝 API response received');
    console.log('📝 API response type:', typeof apiResponse);
    console.log('📝 API response keys:', apiResponse ? Object.keys(apiResponse) : 'null/undefined');
    } catch (apiError) {
      console.error('❌ API call failed:', apiError);
      console.error('❌ API error details:', {
        message: apiError.message,
        name: apiError.name,
        graphqlErrors: apiError.graphQLErrors,
        networkError: apiError.networkError
      });
      throw apiError;
    }
    
    console.log('📝 Checking API response structure...');
    console.log('📝 apiResponse exists:', !!apiResponse);
    console.log('📝 Transaction data exists:', !!(apiResponse && apiResponse.createNewUserWithProfileTransaction));
    
    if (!apiResponse || !apiResponse.createNewUserWithProfileTransaction) {
      console.error('❌ Invalid API response structure:', apiResponse);
      throw new Error('Invalid response from Honeycomb API: missing createNewUserWithProfileTransaction');
    }
    
    // The API returns the transaction data directly, not nested under 'tx'
    const txResponse = apiResponse.createNewUserWithProfileTransaction;
    
    console.log('📝 Transaction response exists:', !!txResponse);
    console.log('📝 Transaction response type:', typeof txResponse);
    console.log('📝 Transaction response keys:', txResponse ? Object.keys(txResponse) : 'null/undefined');
    
    if (!txResponse) {
      console.error('❌ Missing transaction data in response:', apiResponse.createNewUserWithProfileTransaction);
      throw new Error('Invalid response from Honeycomb API: missing transaction data');
    }
    
    console.log('✅ Profile transaction created, requesting wallet signature...');
    
    // Sign and send the transaction - this will prompt the user to approve
    const walletAdapter = getWalletAdapter(wallet);
    console.log('🔐 Using wallet adapter for transaction');
    console.log('🔐 Adapter name:', walletAdapter.name);
    console.log('🔐 Connected:', walletAdapter.connected);
    console.log('🔐 Has required methods:', {
      signAllTransactions: !!walletAdapter.signAllTransactions,
      signTransaction: !!walletAdapter.signTransaction,
      signMessage: !!walletAdapter.signMessage
    });
    
    console.log('🔐 Transaction data ready for signing');
    console.log('🔐 Transaction type:', typeof txResponse);
    console.log('🔐 Transaction keys:', txResponse ? Object.keys(txResponse) : null);
    
    // Wrap transaction in object format expected by sendClientTransactions
    const transactionObject = {
      transaction: txResponse.transaction,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight
    };
    
    console.log('🔐 Transaction object prepared for profile creation:', {
      hasTransaction: !!transactionObject.transaction,
      hasBlockhash: !!transactionObject.blockhash,
      hasLastValidBlockHeight: !!transactionObject.lastValidBlockHeight
    });
    
    const response = await sendClientTransactions(client, walletAdapter, transactionObject);
    console.log('✅ Honeycomb user profile created successfully');
    console.log('📋 Transaction response type:', typeof response);
    console.log('📋 Transaction response keys:', response ? Object.keys(response) : null);
    
    // Handle bundle response format
    let transactionSignature = null;
    let profileAddress = null;
    
    if (Array.isArray(response) && response.length > 0) {
      // Bundle response format
      console.log('📦 Bundle response detected');
      const bundleResponse = response[0];
      
      if (bundleResponse && bundleResponse.responses && Array.isArray(bundleResponse.responses)) {
        console.log('📦 Bundle responses count:', bundleResponse.responses.length);
        
        // Look for the actual transaction response
        for (const resp of bundleResponse.responses) {
          if (resp && resp.signature) {
            transactionSignature = resp.signature;
            console.log('✅ Found transaction signature in bundle');
          }
          if (resp && resp.profileAddress) {
            profileAddress = resp.profileAddress;
            console.log('✅ Found profile address in bundle');
          }
        }
      }
    } else if (response && response.signature) {
      // Direct response format
      transactionSignature = response.signature;
      profileAddress = response.profileAddress;
      console.log('✅ Direct transaction signature found');
      console.log('✅ Direct profile address found');
    }
    
    // Verify the transaction was successful
    if (transactionSignature) {
      console.log('✅ Transaction signature confirmed');
      console.log('✅ Profile address confirmed');
    } else {
      console.error('❌ Transaction response missing signature');
      console.error('❌ Response structure available for debugging');
    }
    
    return {
      success: true,
      username: displayName,
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
      address: profileAddress || null, // Use 'address' to match the expected field name
      profileAddress: profileAddress || null,
      transactionSignature: transactionSignature || null
    };
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    
    // Log the full error for debugging
    console.error('❌ Full error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      graphqlErrors: error.graphQLErrors,
      networkError: error.networkError
    });
    
    // Check if it's a "User not found" error - this means the wallet needs to be registered
    if (error.message && error.message.includes('User not found')) {
      console.error('🚨 User not found error detected. This means the wallet needs to be registered with Honeycomb.');
      console.error('Please contact Honeycomb support to register wallet:', walletAddress);
      throw new Error(`Wallet ${walletAddress} needs to be registered with Honeycomb. Please contact support.`);
    }
    
    // Check if it's a "Project not found" error
    if (error.message && error.message.includes('Project not found')) {
      console.error('🚨 Project not found error detected. This could mean:');
      console.error('1. The project was created on a different network (should be Honeynet)');
      console.error('2. The project address is incorrect');
      console.error('3. The API endpoint is wrong (should be test.honeycombprotocol.com)');
      console.error('4. The project needs to be created first on Honeynet');
      console.error('5. Network connectivity issues with Honeynet');
      
      console.log('🔍 Expected configuration:');
      console.log('   Network: Honeynet (Solana test network)');
      console.log('   API URL: https://edge.test.honeycombprotocol.com/');
      console.log('   RPC URL: https://rpc.test.honeycombprotocol.com');
      console.log('   Project:', PROJECT_ADDRESS);
      
      // Try to reinitialize with different API endpoint
      console.log('🔄 Attempting to reinitialize with different API endpoint...');
      const reinitialized = initializeClient();
      
      if (reinitialized && currentApiUrl !== API_URLS[0]) {
        console.log('🔄 Reinitialized with different endpoint, retrying...');
        throw new Error('Project not found on any Honeycomb endpoint. Please verify project configuration.');
      }
    }
    
    // Check if it's a wallet rejection error
    if (error.message && error.message.includes('User rejected')) {
      console.log('❌ User rejected the transaction');
      throw new Error('Profile creation was cancelled by user');
    }
    
    // Check if it's a network/connection error
    if (error.message && (error.message.includes('Network') || error.message.includes('connection'))) {
      console.error('🌐 Network connection error:', error.message);
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    // For any other error, throw it
    console.error('❌ Unexpected error during profile creation:', error.message);
    throw error;
  }
};

/**
 * Authenticate user with Honeycomb Protocol
 */
export const loginUserProfile = async (publicKey) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('Logging in Honeycomb user profile for:', walletAddress);
    
    // Find the user by wallet address
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      console.log('No user found for wallet:', walletAddress);
      return { exists: false, profile: null };
    }
    
    const user = users.user[0];
    
    // Get user's profile in our project
    const profiles = await client.findProfiles({
      userIds: [user.id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"],
      includeProof: true
    });
    
    if (profiles.profile.length === 0) {
      console.log('No profile found for user');
      return { exists: false, profile: null };
    }
    
    const profile = profiles.profile[0];
    
    // Extract custom data from profile
    const customData = {};
    if (profile.customData) {
      console.log('🔍 Profile customData structure:', {
        type: typeof profile.customData,
        isArray: Array.isArray(profile.customData),
        keys: profile.customData ? Object.keys(profile.customData) : null,
        value: profile.customData
      });
      
      if (Array.isArray(profile.customData)) {
        // Handle array format: [[key, value], [key, value], ...]
        profile.customData.forEach(([key, value]) => {
          customData[key] = value;
        });
      } else if (typeof profile.customData === 'object') {
        // Handle object format with numeric keys where values are arrays: {0: [key, value], 1: [key, value], ...}
        Object.values(profile.customData).forEach((entry) => {
          if (Array.isArray(entry) && entry.length === 2) {
            const [key, value] = entry;
            customData[key] = value;
          }
        });
      }
    }
    
    // Debug: Log the full profile structure to understand badges
    console.log('🔍 Full profile structure from Honeycomb:', profile);
    console.log('🔍 Profile badges property:', profile.badges);
    console.log('🔍 Profile badges type:', typeof profile.badges);
    console.log('🔍 Profile badges length:', profile.badges ? profile.badges.length : 'null/undefined');
    console.log('🔍 Profile platformData:', profile.platformData);
    console.log('🔍 Profile platformData.achievements:', profile.platformData?.achievements);
    console.log('🔍 Profile platformData.achievements type:', typeof profile.platformData?.achievements);
    console.log('🔍 Profile platformData.achievements length:', profile.platformData?.achievements ? profile.platformData.achievements.length : 'null/undefined');
    
    // Check all possible badge locations
    console.log('🔍 All profile properties:', Object.keys(profile));
    console.log('🔍 Profile proof:', profile.proof);
    console.log('🔍 Profile tree_id:', profile.tree_id);
    console.log('🔍 Profile userId:', profile.userId);
    console.log('🔍 Profile user:', profile.user);
    
    // Try to get badges from different possible locations
    let badges = [];
    
    // Check if badges are stored in platformData.achievements
    if (profile.platformData?.achievements && Array.isArray(profile.platformData.achievements)) {
      badges = profile.platformData.achievements;
      console.log('🔍 Found badges in platformData.achievements:', badges);
    }
    // Check if badges are stored in a badges property
    else if (profile.badges && Array.isArray(profile.badges)) {
      badges = profile.badges;
      console.log('🔍 Found badges in profile.badges:', badges);
    }
    // Check if badges are stored in proof
    else if (profile.proof && profile.proof.badges) {
      badges = profile.proof.badges;
      console.log('🔍 Found badges in profile.proof.badges:', badges);
    }
    // Check if badges are stored in customData
    else if (profile.customData && profile.customData.badges) {
      badges = profile.customData.badges;
      console.log('🔍 Found badges in profile.customData.badges:', badges);
    }
    
    console.log('🔍 Final badges array:', badges);
    
    const userProfile = {
      id: profile.userId?.toString() || walletAddress, // Use userId if available, fallback to wallet address
      address: profile.address,
      username: profile.info?.name || 'Unknown Player',
      bio: profile.info?.bio || '',
      pfp: profile.info?.pfp || '',
      // Only sync fields that both Firebase and Honeycomb have
      xp: parseInt(customData.xp || '0'),
      gamesPlayed: parseInt(customData.gamesPlayed || '0'),
      gamesWon: parseInt(customData.gamesWon || '0'),
      lastActive: parseInt(customData.lastActive || '0'),
      totalCardsPlayed: parseInt(customData.totalCardsPlayed || '0'),
      perfectWins: parseInt(customData.perfectWins || '0'),
      currentWinStreak: parseInt(customData.currentWinStreak || '0'),
      bestWinStreak: parseInt(customData.bestWinStreak || '0'),
      badges: badges
    };
    
    console.log('User profile logged in successfully:', userProfile);
    return { exists: true, profile: userProfile };
  } catch (error) {
    console.error('Error logging in user profile:', error);
    return { exists: false, profile: null };
  }
};

// Check if Honeycomb profile data is consistent with Firebase data
const checkProfileDataConsistency = async (honeycombProfile, firebaseUserData) => {
  try {
    console.log('🔄 Comparing Honeycomb profile with Firebase data...');
    
    // Extract relevant data from Honeycomb profile
    const honeycombData = {};
    const firebaseData = firebaseUserData || {};
    
    // Parse custom data from Honeycomb profile
    if (honeycombProfile?.customData) {
      console.log('🔍 Honeycomb customData structure:', {
        type: typeof honeycombProfile.customData,
        isArray: Array.isArray(honeycombProfile.customData),
        value: honeycombProfile.customData
      });
      
      if (Array.isArray(honeycombProfile.customData)) {
        // Handle array format: [[key, value], [key, value], ...]
        honeycombProfile.customData.forEach(([key, value]) => {
          honeycombData[key] = value;
        });
      } else if (typeof honeycombProfile.customData === 'object') {
        // Handle object format with numbered keys: {0: [key, value], 1: [key, value], ...}
        Object.values(honeycombProfile.customData).forEach((item) => {
          if (Array.isArray(item) && item.length === 2) {
            const [key, value] = item;
            honeycombData[key] = value;
          }
        });
      }
    }
    
    // Also check info fields
    if (honeycombProfile?.info) {
      honeycombData.username = honeycombProfile.info.name;
    }
    

    
    // Check key fields that should be synced - only check fields that both Firebase and Honeycomb have
    const fieldsToCheck = [
      'username',
      'xp',
      'gamesPlayed',
      'gamesWon',
      'totalCardsPlayed',
      'perfectWins',
      'currentWinStreak',
      'bestWinStreak'
    ];
    
    let needsUpdate = false;
    const missingFields = [];
    
    for (const field of fieldsToCheck) {
      const firebaseValue = firebaseData[field];
      const honeycombValue = honeycombData[field];
      
      // Convert both values to strings for comparison (Honeycomb stores everything as strings)
      const firebaseString = firebaseValue?.toString();
      const honeycombString = honeycombValue?.toString();
      
      // Only flag as mismatch if there's a significant difference
      if (firebaseValue !== undefined && firebaseValue !== null && 
          (honeycombValue === undefined || honeycombValue === null)) {
        // Missing field in Honeycomb - this is a real mismatch
        needsUpdate = true;
        missingFields.push(field);

      } else if (firebaseValue !== undefined && honeycombValue !== undefined) {
        // Both have values, check for significant differences
        const firebaseNum = parseFloat(firebaseString) || 0;
        const honeycombNum = parseFloat(honeycombString) || 0;
        
        // For numeric fields, only flag if difference is significant (>5% or >10 points)
        if (field === 'xp' || field === 'gamesPlayed' || field === 'gamesWon' || 
            field === 'totalCardsPlayed' || field === 'perfectWins' || 
            field === 'currentWinStreak' || field === 'bestWinStreak') {
          const difference = Math.abs(firebaseNum - honeycombNum);
          const percentDifference = firebaseNum > 0 ? (difference / firebaseNum) * 100 : 0;
          
          if (difference > 10 || percentDifference > 5) {
            needsUpdate = true;
            missingFields.push(field);

          }
        } else if (firebaseString !== honeycombString) {
          // For non-numeric fields, any difference is significant
          needsUpdate = true;
          missingFields.push(field);

        }
      }
    }
    

    
    return needsUpdate;
  } catch (error) {
    console.error('❌ Error checking data consistency:', error);
    return true; // Assume needs update if we can't check
  }
};

// Sync Firebase data to Honeycomb profile
export const syncFirebaseToHoneycomb = async (publicKey, firebaseUserData, wallet, signMessage) => {
  try {
    console.log('🔄 Syncing Firebase data to Honeycomb...');
    console.log('🔄 Parameters received:', {
      publicKey: publicKey ? 'present' : 'missing',
      firebaseUserData: firebaseUserData ? 'present' : 'missing',
      wallet: wallet ? 'present' : 'missing',
      signMessage: signMessage ? 'present' : 'missing'
    });
    
    // Validate required parameters
    if (!publicKey) {
      console.log('❌ No publicKey provided for sync');
      return { success: false, error: 'No publicKey provided' };
    }
    
    if (!firebaseUserData) {
      console.log('❌ No Firebase data provided for sync');
      return { success: false, error: 'No Firebase data provided' };
    }
    
    if (!wallet || !signMessage) {
      console.log('❌ No wallet or signMessage provided for sync');
      return { success: false, error: 'No wallet or signMessage provided' };
    }
    
    // Prepare update data - only sync fields that both Firebase and Honeycomb have
    const updateData = {
      username: firebaseUserData.username || '',
      xp: firebaseUserData.xp || 0,
      gamesPlayed: firebaseUserData.gamesPlayed || 0,
      gamesWon: firebaseUserData.gamesWon || 0,
      totalCardsPlayed: firebaseUserData.totalCardsPlayed || 0,
      perfectWins: firebaseUserData.perfectWins || 0,
      currentWinStreak: firebaseUserData.currentWinStreak || 0,
      bestWinStreak: firebaseUserData.bestWinStreak || 0
    };
    
    console.log('🔄 Update data to sync:', updateData);
    
    // Update Honeycomb profile
    const result = await updateUserProfile({
      publicKey,
      wallet,
      signMessage,
      profileData: updateData
    });
    
    if (result.success) {
      console.log('✅ Firebase data successfully synced to Honeycomb');
      return { success: true };
    } else {
      console.error('❌ Failed to sync Firebase data to Honeycomb:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error syncing Firebase to Honeycomb:', error);
    return { success: false, error: error.message };
  }
};

// Sync Honeycomb data to Firebase
export const syncHoneycombToFirebase = async (publicKey) => {
  try {
    console.log('🔄 Syncing Honeycomb data to Firebase...');
    
    if (!publicKey) {
      console.log('❌ No publicKey provided for sync');
      return { success: false, error: 'No publicKey provided' };
    }
    
    // Get Honeycomb profile
    const honeycombProfile = await getUserProfile(publicKey);
    if (!honeycombProfile) {
      console.log('❌ No Honeycomb profile found');
      return { success: false, error: 'No Honeycomb profile found' };
    }
    
    console.log('🔄 Honeycomb profile data:', honeycombProfile);
    
    // Import Firebase functions
    const { ref, update } = await import('firebase/database');
    const { db } = await import('../firebase');
    
    // Get current Firebase user data
    const userRef = ref(db, `users/${publicKey.toString()}`);
    
    // Prepare update data from Honeycomb
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
    
    // Update Firebase
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

/**
 * Check if user profile exists and sync data if needed
 */
export const checkUserProfileExists = async (publicKey, firebaseUserData = null) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    // Find the user by wallet address
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      return { exists: false, needsSync: false, profile: null, needsCreation: true };
    }
    
    const userId = users.user[0].id;
    
    // Check if user has a profile in our project
    const profiles = await client.findProfiles({
      userIds: [userId],
      projects: [PROJECT_ADDRESS],
      identities: ["main"]
    });
    
    const exists = profiles.profile.length > 0;
    
    // If profile exists and we have Firebase data, check for data consistency
    if (exists && firebaseUserData) {
      const profile = profiles.profile[0];
      
      // Check if Honeycomb profile has all the data from Firebase
      const needsUpdate = await checkProfileDataConsistency(profile, firebaseUserData);
      
      if (needsUpdate) {
        return { exists: true, needsSync: true, profile };
      }
    }
    
    return { exists, needsSync: false, profile: exists ? profiles.profile[0] : null };
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      graphqlErrors: error.graphQLErrors,
      networkError: error.networkError
    });
    return { exists: false, needsSync: false, profile: null };
  }
};

// App wallet configuration for SOL transfers
const APP_WALLET_CONFIG = {
  publicKey: process.env.VITE_FEE_PAYER_PUBLIC_KEY || import.meta?.env?.VITE_FEE_PAYER_PUBLIC_KEY || null,
  privateKey: process.env.VITE_FEE_PAYER_PRIVATE_KEY || import.meta?.env?.VITE_FEE_PAYER_PRIVATE_KEY || null
};

/**
 * Ensure wallet has sufficient SOL balance with automatic airdrop
 */
export const ensureWalletHasSOL = async (publicKey, minSOL = 0.0049) => {
  try {
    // Connect to Honeynet RPC
    const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
    
    // Get current balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    if (solBalance >= minSOL) {
      return { success: true, method: 'none', balance: solBalance };
    }
    
    // Use app wallet to send SOL (skipping web3.js airdrop)
    try {
      console.log('🏦 Attempting app wallet transfer...');
      
      console.log('🔍 APP_WALLET_CONFIG debug:', {
        hasPublicKey: !!APP_WALLET_CONFIG.publicKey,
        hasPrivateKey: !!APP_WALLET_CONFIG.privateKey,
        publicKeyValue: APP_WALLET_CONFIG.publicKey,
        privateKeyValue: APP_WALLET_CONFIG.privateKey ? '***HIDDEN***' : 'NOT SET'
      });
      
      if (!APP_WALLET_CONFIG.publicKey || !APP_WALLET_CONFIG.privateKey) {
        throw new Error('App wallet configuration missing');
      }
      
      const appWalletPublicKey = new PublicKey(APP_WALLET_CONFIG.publicKey);
      const appWalletPrivateKey = bs58.decode(APP_WALLET_CONFIG.privateKey);
      const appWalletKeypair = Keypair.fromSecretKey(appWalletPrivateKey);
      
      // Check app wallet balance
      const appWalletBalance = await connection.getBalance(appWalletPublicKey);
      const appWalletSolBalance = appWalletBalance / LAMPORTS_PER_SOL;
      
      console.log('🏦 App wallet balance:', appWalletSolBalance.toFixed(4), 'SOL');
      
      if (appWalletSolBalance < 0.01) {
        throw new Error('App wallet has insufficient balance for transfer');
      }
      
      // Create transfer transaction
      const transferAmount = 0.005 * LAMPORTS_PER_SOL; // 0.005 SOL (slightly more than minimum 0.0049)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: appWalletPublicKey,
          toPubkey: publicKey,
          lamports: transferAmount,
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = appWalletPublicKey;
      
      // Sign and send transaction
      transaction.sign(appWalletKeypair);
      const transferSignature = await connection.sendRawTransaction(transaction.serialize());
      
      // Wait for confirmation
      const transferConfirmation = await connection.confirmTransaction(transferSignature, 'confirmed');
      
      if (transferConfirmation.value && transferConfirmation.value.err) {
        throw new Error(`App wallet transfer failed: ${JSON.stringify(transferConfirmation.value.err)}`);
      }
      
      // Verify balance increased
      const finalBalance = await connection.getBalance(publicKey);
      const finalSolBalance = finalBalance / LAMPORTS_PER_SOL;
      
      console.log('✅ App wallet transfer successful!');
      console.log('💰 Balance increased from', solBalance.toFixed(4), 'to', finalSolBalance.toFixed(4), 'SOL');
      
      return { 
        success: true, 
        method: 'app_wallet', 
        balance: finalSolBalance, 
        signature: transferSignature 
      };
      
    } catch (appWalletError) {
      console.error('❌ App wallet transfer failed:', appWalletError.message);
      throw new Error(`All SOL funding methods failed: ${appWalletError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Enhanced SOL management failed:', error);
    throw error;
  }
};

// Automatic transaction retry with SOL management
export const executeTransactionWithSOLRetry = async (transactionFunction, publicKey, maxRetries = 3) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Transaction attempt ${attempt}/${maxRetries}`);
      
      // Execute the transaction
      const result = await transactionFunction();
      console.log('✅ Transaction successful on attempt', attempt);
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Transaction attempt ${attempt} failed:`, error.message);
      
      // Check if it's an insufficient SOL error
      const isInsufficientSOL = error.message && (
        error.message.includes('insufficient') ||
        error.message.includes('Insufficient') ||
        error.message.includes('0x1') || // Solana insufficient funds error code
        error.message.includes('lamports')
      );
      
      if (isInsufficientSOL && attempt < maxRetries) {
        console.log('💰 Insufficient SOL detected, attempting automatic airdrop...');
        
        try {
          // Ensure wallet has SOL
          const solResult = await ensureWalletHasSOL(publicKey, 0.005);
          
          if (solResult.success) {
            console.log('✅ SOL funding successful, retrying transaction...');
            // Wait a moment for the transaction to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue; // Retry the transaction
          }
        } catch (solError) {
          console.error('❌ SOL funding failed:', solError.message);
        }
      }
      
      // If not insufficient SOL or SOL funding failed, don't retry
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting 3 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  console.error(`❌ Transaction failed after ${maxRetries} attempts`);
  throw lastError;
};

/**
 * Create user profile with automatic SOL management
 */
export const createUserProfileWithSOLManagement = async (publicKey, wallet, signMessage, displayName) => {
  console.log('🚀 Enhanced profile creation with SOL management...');
  
  // First, ensure wallet has SOL
  try {
    const solResult = await ensureWalletHasSOL(publicKey, 0.005);
    console.log('💰 SOL management result:', solResult);
  } catch (solError) {
    console.error('❌ SOL management failed:', solError.message);
    throw new Error(`Failed to ensure sufficient SOL balance: ${solError.message}`);
  }
  
  // Execute profile creation with automatic retry
  return await executeTransactionWithSOLRetry(
    () => createUserProfile({ publicKey, wallet, signMessage, username: displayName }),
    publicKey,
    3
  );
};

/**
 * Update user profile with automatic SOL management
 */
export const updateUserProfileWithSOLManagement = async (publicKey, wallet, signMessage, updates) => {
  
  
  // Validate parameters
  if (!publicKey) {
    throw new Error('publicKey is required for profile update');
  }
  if (!wallet) {
    throw new Error('wallet is required for profile update');
  }
  if (!signMessage) {
    throw new Error('signMessage is required for profile update');
  }
  
  const result = await executeTransactionWithSOLRetry(
    () => updateUserProfile({ publicKey, wallet, signMessage, profileData: updates }),
    publicKey,
    3
  );
  
  // If the result indicates failure, throw an error to maintain backward compatibility
  if (result && result.success === false) {
    throw new Error(result.error || 'Failed to update Honeycomb profile');
  }
  
  return result;
};

/**
 * Claim badge with automatic SOL management
 */
export const claimBadgeWithSOLManagement = async (publicKey, wallet, signMessage, badgeIndex) => {
  console.log('🚀 Enhanced badge claiming with SOL management...');
  
  // Validate parameters
  if (!publicKey) {
    throw new Error('publicKey is required for badge claiming');
  }
  if (!wallet) {
    throw new Error('wallet is required for badge claiming');
  }
  if (!signMessage) {
    throw new Error('signMessage is required for badge claiming');
  }
  
  return await executeTransactionWithSOLRetry(
    () => claimBadge({ publicKey, wallet, signMessage, badgeIndex }),
    publicKey,
    3
  );
};

/**
 * Test Honeycomb API connection and configuration
 */
export const testHoneycombConnection = async () => {
  try {
    console.log('🔧 Testing Honeycomb API connection...');
    console.log('🔧 Project address:', PROJECT_ADDRESS);
    console.log('🔧 API endpoint:', 'https://edge.test.honeycombprotocol.com/');
    
    // Verify basic API connectivity
    const global = await client.findGlobal();
    console.log('🔧 Global data:', global);
    
    // Verify project existence
    const projects = await client.findProjects({ projects: [PROJECT_ADDRESS] });
    console.log('🔧 Project data:', {
      projectCount: projects?.project?.length || 0,
      projects: projects?.project || []
    });
    
    return true;
  } catch (error) {
    console.error('❌ Honeycomb API connection test failed:', error);
    return false;
  }
};

/**
 * Test RPC connection and airdrop functionality
 */
export const testRPCConnection = async () => {
  try {
    console.log('🔧 Testing RPC connection...');
    const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
    
    // Verify basic RPC connectivity
    const slot = await connection.getSlot();
    console.log('🔧 Current slot:', slot);
    
    // Verify airdrop endpoint availability
    try {
      // Create a test public key
      const testKey = new PublicKey('11111111111111111111111111111111');
      const airdropSignature = await connection.requestAirdrop(testKey, 1000000); // 0.001 SOL
      console.log('🔧 Airdrop endpoint is working, test signature:', airdropSignature);
    } catch (airdropError) {
      console.warn('⚠️ Airdrop endpoint test failed (this might be expected):', airdropError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ RPC connection test failed:', error);
    return false;
  }
};

/**
 * Check profile existence with retry mechanism for newly created profiles
 */
export const checkUserProfileExistsWithRetry = async (publicKey, firebaseUserData = null, maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await checkUserProfileExists(publicKey, firebaseUserData);
    
    if (result.exists) {
      return result;
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return { exists: false, needsSync: false, profile: null };
};

/**
 * Update user profile following Honeycomb Protocol documentation
 */
export const updateUserProfile = async ({ publicKey, wallet, signMessage, profileData }) => {
  try {
    if (!publicKey) {
      throw new Error('publicKey is required for profile update');
    }
    if (!wallet) {
      throw new Error('wallet is required for profile update');
    }
    if (!signMessage) {
      throw new Error('signMessage is required for profile update');
    }
    
    const walletAddress = publicKey.toBase58();
    
    // Validate wallet connection
    const isConnected = wallet.connected || wallet.adapter?.connected;
    if (!isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    // Authenticate with Honeycomb first
    let accessToken = null;
    try {
      const { authRequest: { message: authRequest } } = await client.authRequest({
        wallet: walletAddress
      });
      const encodedMessage = new TextEncoder().encode(authRequest);
      const signedMessage = await signMessage(encodedMessage);
      const signature = bs58.encode(signedMessage);
      
      const { authConfirm } = await client.authConfirm({
        wallet: walletAddress,
        signature
      });
      accessToken = authConfirm.accessToken;
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      // Don't throw error, just return failure - this allows the app to continue with Firebase-only mode
      return { 
        success: false, 
        error: `Authentication failed: ${authError.message}. Please ensure your wallet is registered with Honeycomb.`,
        address: null
      };
    }
    
    // Find the user's profile
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      return { 
        success: false, 
        error: 'User not found in Honeycomb',
        address: null
      };
    }
    
    const profiles = await client.findProfiles({
      userIds: [users.user[0].id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"]
    });
    
    if (profiles.profile.length === 0) {
      return { 
        success: false, 
        error: 'Profile not found in Honeycomb',
        address: null
      };
    }
    
    const profile = profiles.profile[0];
    
    // Prepare update data following official docs pattern
    const updateData = {
      profile: profile.address,
      payer: walletAddress
    };
    
    // Update profile info if provided
    if (profileData.username || profileData.bio || profileData.pfp) {
      updateData.info = {
        name: profileData.username || profile.info?.name,
        bio: profileData.bio || profile.info?.bio,
        pfp: profileData.pfp || profile.info?.pfp
      };
    }
    
    // Update custom data if provided - only sync fields that both Firebase and Honeycomb have
    if (profileData.xp !== undefined || profileData.gamesPlayed !== undefined || 
        profileData.gamesWon !== undefined || profileData.totalCardsPlayed !== undefined ||
        profileData.perfectWins !== undefined || profileData.currentWinStreak !== undefined ||
        profileData.bestWinStreak !== undefined) {
      updateData.customData = {
        add: []
      };
      
      if (profileData.xp !== undefined) updateData.customData.add.push(["xp", profileData.xp.toString()]);
      if (profileData.gamesPlayed !== undefined) updateData.customData.add.push(["gamesPlayed", profileData.gamesPlayed.toString()]);
      if (profileData.gamesWon !== undefined) updateData.customData.add.push(["gamesWon", profileData.gamesWon.toString()]);
      if (profileData.totalCardsPlayed !== undefined) updateData.customData.add.push(["totalCardsPlayed", profileData.totalCardsPlayed.toString()]);
      if (profileData.perfectWins !== undefined) updateData.customData.add.push(["perfectWins", profileData.perfectWins.toString()]);
      if (profileData.currentWinStreak !== undefined) updateData.customData.add.push(["currentWinStreak", profileData.currentWinStreak.toString()]);
      if (profileData.bestWinStreak !== undefined) updateData.customData.add.push(["bestWinStreak", profileData.bestWinStreak.toString()]);
      
      // Always update lastActive
      updateData.customData.add.push(["lastActive", Date.now().toString()]);
    }
    
    // Create and send update transaction
    const updateResponse = await client.createUpdateProfileTransaction(updateData, {
      fetchOptions: {
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      }
    });
    
    console.log('Update transaction response:', updateResponse);
    console.log('Transaction response structure:', {
      hasCreateUpdateProfileTransaction: !!updateResponse?.createUpdateProfileTransaction,
      hasTransaction: !!updateResponse?.createUpdateProfileTransaction?.transaction,
      hasBlockhash: !!updateResponse?.createUpdateProfileTransaction?.blockhash,
      hasLastValidBlockHeight: !!updateResponse?.createUpdateProfileTransaction?.lastValidBlockHeight,
      transactionLength: updateResponse?.createUpdateProfileTransaction?.transaction?.length || 0
    });
    
    // Check if the response has the expected structure
    if (!updateResponse?.createUpdateProfileTransaction?.transaction) {
      console.error('Invalid transaction response structure:', updateResponse);
      throw new Error('Failed to create update transaction');
    }
    
    const txResponse = updateResponse.createUpdateProfileTransaction.transaction;
    
    console.log('📝 Transaction data prepared:', {
      hasTransaction: !!txResponse,
      transactionLength: txResponse?.length || 0,
      transactionType: typeof txResponse
    });
    
    // Sign and send the transaction
    const walletAdapter = getWalletAdapter(wallet);
    console.log('📝 Wallet adapter prepared:', {
      hasWalletAdapter: !!walletAdapter,
      adapterType: walletAdapter?.constructor?.name,
      hasSignAllTransactions: !!(walletAdapter?.signAllTransactions)
    });
    
    // Wrap transaction in object format expected by sendClientTransactions
    const transactionObject = {
      transaction: txResponse,
      blockhash: updateResponse.createUpdateProfileTransaction.blockhash,
      lastValidBlockHeight: updateResponse.createUpdateProfileTransaction.lastValidBlockHeight
    };
    
    console.log('📝 Transaction object prepared:', {
      hasTransaction: !!transactionObject.transaction,
      hasBlockhash: !!transactionObject.blockhash,
      hasLastValidBlockHeight: !!transactionObject.lastValidBlockHeight
    });
    
    const response = await sendClientTransactions(client, walletAdapter, transactionObject);
    console.log('✅ Honeycomb profile updated successfully:', response);
    
    return { 
      success: true, 
      response,
      address: profile.address // Include the profile address in the response
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Retrieve user profile data
 */
export const getUserProfile = async (publicKey) => {
  try {
    const walletAddress = publicKey.toBase58();
    console.log('Getting Honeycomb user profile for:', walletAddress);
    
    // Find the user first
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      console.log('No user found for wallet:', walletAddress);
      return null;
    }
    
    // Get user's profile in our project
    const profiles = await client.findProfiles({
      userIds: [users.user[0].id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"],
      includeProof: true,
      includePlatformData: true
    });
    
    if (profiles.profile.length === 0) {
      console.log('No profile found for user');
      return null;
    }
    
    const profile = profiles.profile[0];
    
    // COMPREHENSIVE DEBUGGING: Log the entire profile structure
    console.log('🔍 FULL PROFILE STRUCTURE DEBUG:');
    console.log('🔍 Profile object type:', typeof profile);
    console.log('🔍 Profile object keys:', Object.keys(profile));
    console.log('🔍 Profile object:', JSON.stringify(profile, null, 2));
    
    // Check for badges in all possible locations
    console.log('🔍 CHECKING ALL POSSIBLE BADGE LOCATIONS:');
    console.log('🔍 profile.badges:', profile.badges);
    console.log('🔍 profile.proof:', profile.proof);
    console.log('🔍 profile.platformData:', profile.platformData);
    console.log('🔍 profile.customData:', profile.customData);
    console.log('🔍 profile.info:', profile.info);
    console.log('🔍 profile.user:', profile.user);
    
    // Check if there are any nested objects that might contain badges
    if (profile.proof) {
      console.log('🔍 profile.proof keys:', Object.keys(profile.proof));
      console.log('🔍 profile.proof.badges:', profile.proof.badges);
      console.log('🔍 profile.proof.achievements:', profile.proof.achievements);
    }
    
    if (profile.platformData) {
      console.log('🔍 profile.platformData keys:', Object.keys(profile.platformData));
      console.log('🔍 profile.platformData.badges:', profile.platformData.badges);
      console.log('🔍 profile.platformData.achievements:', profile.platformData.achievements);
    }
    
    if (profile.customData) {
      console.log('🔍 profile.customData keys:', Object.keys(profile.customData));
      console.log('🔍 profile.customData.badges:', profile.customData.badges);
      console.log('🔍 profile.customData.achievements:', profile.customData.achievements);
    }
    
    // Extract custom data from profile
    const customData = {};
    if (profile.customData) {
      console.log('🔍 Profile customData structure:', {
        type: typeof profile.customData,
        isArray: Array.isArray(profile.customData),
        keys: profile.customData ? Object.keys(profile.customData) : null,
        value: profile.customData
      });
      
      if (Array.isArray(profile.customData)) {
        // Handle array format: [[key, value], [key, value], ...]
        profile.customData.forEach(([key, value]) => {
          customData[key] = value;
        });
      } else if (typeof profile.customData === 'object') {
        // Handle object format with numeric keys where values are arrays: {0: [key, value], 1: [key, value], ...}
        Object.values(profile.customData).forEach((entry) => {
          if (Array.isArray(entry) && entry.length === 2) {
            const [key, value] = entry;
            customData[key] = value;
          }
        });
      }
    }
    
    // Get XP and achievements from platform data (not custom data)
    const platformXP = parseInt(profile.platformData?.xp || 0);
    const platformAchievements = profile.platformData?.achievements || [];
    
    console.log('🔍 Platform data analysis:', {
      hasPlatformData: !!profile.platformData,
      platformXP: platformXP,
      platformAchievements: platformAchievements,
      platformDataKeys: profile.platformData ? Object.keys(profile.platformData) : null
    });
    
    // Use platform data for XP and achievements
    const xp = platformXP;
    const achievements = platformAchievements;
    const level = Math.floor(xp / 100) + 1;
    
    return {
      id: profile.id,
      address: profile.address,
      username: profile.info?.name || 'Unknown Player',
      bio: profile.info?.bio || '',
      pfp: profile.info?.pfp || '',
      xp: xp, // Use platform data XP
      level: level, // Calculate level from platform XP
      gamesPlayed: parseInt(customData.gamesPlayed || '0'),
      gamesWon: parseInt(customData.gamesWon || '0'),
      createdAt: parseInt(customData.createdAt || '0'),
      lastActive: parseInt(customData.lastActive || '0'),
      totalCardsPlayed: parseInt(customData.totalCardsPlayed || '0'),
      perfectWins: parseInt(customData.perfectWins || '0'),
      currentWinStreak: parseInt(customData.currentWinStreak || '0'),
      bestWinStreak: parseInt(customData.bestWinStreak || '0'),
      achievements: achievements // Use platform data achievements
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Profile management functions
export const updateProfileInfo = async ({ publicKey, wallet, signMessage, username, bio, pfp }) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('Updating profile info for:', walletAddress);
    
    // Authenticate with Honeycomb first
    console.log('🔐 Authenticating with Honeycomb...');
    let accessToken = null;
    try {
      const { authRequest: { message: authRequest } } = await client.authRequest({
        wallet: walletAddress
      });
      console.log('📝 Auth request received, signing message...');
      const encodedMessage = new TextEncoder().encode(authRequest);
      const signedMessage = await signMessage(encodedMessage);
      const signature = bs58.encode(signedMessage);
      
      console.log('✅ Message signed, confirming authentication...');
      const { authConfirm } = await client.authConfirm({
        wallet: walletAddress,
        signature
      });
      console.log('✅ Authentication confirmed');
      accessToken = authConfirm.accessToken;
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      throw new Error(`Authentication failed: ${authError.message}. Please ensure your wallet is registered with Honeycomb.`);
    }
    
    // Find the user's profile
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      throw new Error('User not found');
    }
    
    const profiles = await client.findProfiles({
      userIds: [users.user[0].id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"]
    });
    
    if (profiles.profile.length === 0) {
      throw new Error('Profile not found');
    }
    
    const profile = profiles.profile[0];
    
    // Update profile info
    console.log('📝 Creating update profile transaction...');
    const apiResponse = await client.createUpdateProfileTransaction({
      profile: profile.address,
      payer: walletAddress,
      info: {
        name: username || profile.info?.name,
        bio: bio || profile.info?.bio,
        pfp: pfp || profile.info?.pfp
      }
    }, {
      fetchOptions: {
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      }
    });
    
    console.log('📝 Update transaction API response received');
    console.log('📝 API response type:', typeof apiResponse);
    console.log('📝 API response keys:', apiResponse ? Object.keys(apiResponse) : 'null/undefined');
    
    if (!apiResponse || !apiResponse.createUpdateProfileTransaction) {
      console.error('❌ Invalid API response structure:', apiResponse);
      throw new Error('Invalid response from Honeycomb API: missing createUpdateProfileTransaction');
    }
    
    // The API returns the transaction data directly, not nested under 'tx'
    const txResponse = apiResponse.createUpdateProfileTransaction;
    
    console.log('📝 Transaction response exists:', !!txResponse);
    console.log('📝 Transaction response type:', typeof txResponse);
    console.log('📝 Transaction response keys:', txResponse ? Object.keys(txResponse) : 'null/undefined');
    
    if (!txResponse) {
      console.error('❌ Missing transaction data in response:', apiResponse.createUpdateProfileTransaction);
      throw new Error('Invalid response from Honeycomb API: missing transaction data');
    }
    
    // Sign and send the transaction
    const walletAdapter = getWalletAdapter(wallet);
    
    // Wrap transaction in object format expected by sendClientTransactions
    const transactionObject = {
      transaction: txResponse.transaction,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight
    };
    
    console.log('📝 Transaction object prepared for profile info update:', {
      hasTransaction: !!transactionObject.transaction,
      hasBlockhash: !!transactionObject.blockhash,
      hasLastValidBlockHeight: !!transactionObject.lastValidBlockHeight
    });
    
    const response = await sendClientTransactions(client, walletAdapter, transactionObject);
    console.log('Profile info updated successfully');
    
    return { 
      success: true, 
      response,
      address: profile.address // Include the profile address in the response
    };
  } catch (error) {
    console.error('Error updating profile info:', error);
    throw error;
  }
};

// Badge claiming function
export const claimBadge = async ({ publicKey, wallet, signMessage, badgeIndex }) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('Claiming Honeycomb badge:', badgeIndex, 'for wallet:', walletAddress);
    
    // Authenticate with Honeycomb first
    console.log('🔐 Authenticating with Honeycomb...');
    let accessToken = null;
    try {
      const { authRequest: { message: authRequest } } = await client.authRequest({
        wallet: walletAddress
      });
      console.log('📝 Auth request received, signing message...');
      const encodedMessage = new TextEncoder().encode(authRequest);
      const signedMessage = await signMessage(encodedMessage);
      const signature = bs58.encode(signedMessage);
      
      console.log('✅ Message signed, confirming authentication...');
      const { authConfirm } = await client.authConfirm({
        wallet: walletAddress,
        signature
      });
      console.log('✅ Authentication confirmed');
      accessToken = authConfirm.accessToken;
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      throw new Error(`Authentication failed: ${authError.message}. Please ensure your wallet is registered with Honeycomb.`);
    }
    
    // Find the user's profile
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      throw new Error('User not found');
    }
    
    const profiles = await client.findProfiles({
      userIds: [users.user[0].id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"]
    });
    
    if (profiles.profile.length === 0) {
      throw new Error('Profile not found');
    }
    
    const profile = profiles.profile[0];
    
    // ENHANCED DEBUGGING: Log all parameters being sent
    console.log('🔍 BADGE CLAIMING PARAMETERS:');
    console.log('🔍 payer:', walletAddress);
    console.log('🔍 projectAddress:', PROJECT_ADDRESS);
    console.log('🔍 profileAddress:', profile.address);
    console.log('🔍 criteriaIndex:', badgeIndex);
    console.log('🔍 proof:', "Public");
    console.log('🔍 accessToken:', accessToken ? 'Present' : 'Missing');
    
    // Claim the badge criteria
    console.log('📝 Creating claim badge transaction...');
    const apiResponse = await client.createClaimBadgeCriteriaTransaction({
      args: {
        payer: walletAddress,
        projectAddress: PROJECT_ADDRESS,
        profileAddress: profile.address,
        criteriaIndex: badgeIndex,
        proof: "Public"
      }
    }, {
      fetchOptions: {
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      }
    });
    
    console.log('📝 Claim badge API response received');
    console.log('📝 API response type:', typeof apiResponse);
    console.log('📝 API response keys:', apiResponse ? Object.keys(apiResponse) : 'null/undefined');
    
    if (!apiResponse || !apiResponse.createClaimBadgeCriteriaTransaction) {
      console.error('❌ Invalid API response structure:', apiResponse);
      throw new Error('Invalid response from Honeycomb API: missing createClaimBadgeCriteriaTransaction');
    }
    
    // The API returns the transaction data directly, not nested under 'tx'
    const txResponse = apiResponse.createClaimBadgeCriteriaTransaction;
    
    console.log('📝 Transaction response exists:', !!txResponse);
    console.log('📝 Transaction response type:', typeof txResponse);
    console.log('📝 Transaction response keys:', txResponse ? Object.keys(txResponse) : 'null/undefined');
    
    if (!txResponse) {
      console.error('❌ Missing transaction data in response:', apiResponse.createClaimBadgeCriteriaTransaction);
      throw new Error('Invalid response from Honeycomb API: missing transaction data');
    }
    
    // ENHANCED DEBUGGING: Log transaction details
    console.log('🔍 TRANSACTION DETAILS:');
    console.log('🔍 Transaction exists:', !!txResponse.transaction);
    console.log('🔍 Blockhash exists:', !!txResponse.blockhash);
    console.log('🔍 LastValidBlockHeight exists:', !!txResponse.lastValidBlockHeight);
    console.log('🔍 Transaction length:', txResponse.transaction ? txResponse.transaction.length : 'N/A');
    
    // Sign and send the transaction
    const walletAdapter = getWalletAdapter(wallet);
    
    // Wrap transaction in object format expected by sendClientTransactions
    const transactionObject = {
      transaction: txResponse.transaction,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight
    };
    
    console.log('🔐 Transaction object prepared for badge claim:', {
      hasTransaction: !!transactionObject.transaction,
      hasBlockhash: !!transactionObject.blockhash,
      hasLastValidBlockHeight: !!transactionObject.lastValidBlockHeight
    });
    
    console.log('🚀 Sending transaction to Honeycomb...');
    const response = await sendClientTransactions(client, walletAdapter, transactionObject);
    console.log('✅ Transaction sent successfully');
    
    // ENHANCED DEBUGGING: Log response details
    console.log('🔍 TRANSACTION RESPONSE:');
    console.log('🔍 Response type:', typeof response);
    console.log('🔍 Response keys:', response ? Object.keys(response) : 'null/undefined');
    console.log('🔍 Response:', response);
    
    // Handle response format
    let transactionSignature = null;
    
    if (Array.isArray(response) && response.length > 0) {
      // Bundle response format
      console.log('📦 Bundle response detected');
      const bundleResponse = response[0];
      
      console.log('🔍 BUNDLE RESPONSE DETAILS:');
      console.log('🔍 Bundle response type:', typeof bundleResponse);
      console.log('🔍 Bundle response keys:', bundleResponse ? Object.keys(bundleResponse) : 'null/undefined');
      console.log('🔍 Bundle response:', bundleResponse);
      
      if (bundleResponse && bundleResponse.responses && Array.isArray(bundleResponse.responses)) {
        console.log('📦 Bundle responses count:', bundleResponse.responses.length);
        
        // Look for the actual transaction response
        for (let i = 0; i < bundleResponse.responses.length; i++) {
          const resp = bundleResponse.responses[i];
          console.log(`🔍 Response ${i} type:`, typeof resp);
          console.log(`🔍 Response ${i} keys:`, resp ? Object.keys(resp) : 'null/undefined');
          console.log(`🔍 Response ${i}:`, resp);
          
          if (resp && resp.signature) {
            transactionSignature = resp.signature;
            console.log('✅ Found transaction signature in bundle');
          }
          if (resp && resp.profileAddress) {
            console.log('✅ Found profile address in bundle');
          }
        }
      } else {
        console.log('🔍 Bundle response structure:');
        console.log('🔍 Has responses property:', !!bundleResponse.responses);
        console.log('🔍 Responses is array:', Array.isArray(bundleResponse.responses));
        console.log('🔍 Full bundle response structure:', JSON.stringify(bundleResponse, null, 2));
      }
    } else if (response && response.signature) {
      // Direct response format
      transactionSignature = response.signature;
      console.log('✅ Direct transaction signature found');
    }
    
    console.log('🔍 Final transaction signature:', transactionSignature);
    
    if (!transactionSignature) {
      console.error('❌ No transaction signature found in response');
      throw new Error('Transaction failed: no signature returned');
    }
    
    console.log('Honeycomb badge claimed successfully');
    
    return { success: true, badgeIndex, response, transactionSignature };
  } catch (error) {
    console.error('Error claiming badge:', error);
    throw error;
  }
};

// Function to verify if a badge was actually claimed
export const verifyBadgeClaim = async (publicKey, wallet, signMessage, badgeIndex) => {
  try {
    const walletAddress = publicKey.toBase58();
    console.log(`🔍 Verifying badge claim for badge ${badgeIndex}...`);
    
    // Authenticate with Honeycomb first
    console.log('🔐 Authenticating with Honeycomb...');
    let accessToken = null;
    try {
      const { authRequest: { message: authRequest } } = await client.authRequest({
        wallet: walletAddress
      });
      console.log('📝 Auth request received, signing message...');
      const encodedMessage = new TextEncoder().encode(authRequest);
      const signedMessage = await signMessage(encodedMessage);
      const signature = bs58.encode(signedMessage);
      
      console.log('✅ Message signed, confirming authentication...');
      const { authConfirm } = await client.authConfirm({
        wallet: walletAddress,
        signature
      });
      console.log('✅ Authentication confirmed');
      accessToken = authConfirm.accessToken;
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    // Find the user's profile
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      throw new Error('User not found');
    }
    
    const profiles = await client.findProfiles({
      userIds: [users.user[0].id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"],
      includeProof: true
    });
    
    if (profiles.profile.length === 0) {
      throw new Error('Profile not found');
    }
    
    const profile = profiles.profile[0];
    
    // Try to create a claim transaction for the same badge
    // If it fails with a specific error, it means the badge was already claimed
    console.log(`🔍 Attempting to claim badge ${badgeIndex} again to check if already claimed...`);
    
    try {
      const testClaimResponse = await client.createClaimBadgeCriteriaTransaction({
        args: {
          payer: walletAddress,
          projectAddress: PROJECT_ADDRESS,
          profileAddress: profile.address,
          criteriaIndex: badgeIndex,
          proof: "Public"
        }
      }, {
        fetchOptions: {
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        }
      });
      
      console.log('❌ Badge was NOT claimed - claim transaction succeeded again');
      return {
        claimed: false,
        reason: 'Badge claim transaction succeeded again, indicating it was not previously claimed'
      };
      
    } catch (error) {
      console.log('✅ Badge WAS claimed - claim transaction failed as expected');
      console.log('🔍 Error details:', error.message);
      
      // Check if the error indicates the badge was already claimed
      if (error.message.includes('already claimed') || 
          error.message.includes('already exists') ||
          error.message.includes('duplicate')) {
        return {
          claimed: true,
          reason: 'Badge was already claimed (confirmed by duplicate claim error)'
        };
      } else {
        return {
          claimed: false,
          reason: `Badge claim failed with unexpected error: ${error.message}`
        };
      }
    }
    
  } catch (error) {
    console.error('Error verifying badge claim:', error);
    return {
      claimed: false,
      reason: `Verification failed: ${error.message}`    };
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

// Export badge criteria for use in other components
export { BADGE_CRITERIA };

// Platform data update function using project authority (server-side)
export const updatePlatformData = async ({ publicKey, achievements = [], xp = 0, customData = {} }) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('🔄 Updating platform data for wallet:', walletAddress);
    console.log('📊 Platform data:', { achievements, xp, customData });
    
    // Check if admin keypair is configured
    if (!APP_WALLET_CONFIG.publicKey || !APP_WALLET_CONFIG.privateKey) {
      throw new Error('Admin keypair not configured. Please set VITE_FEE_PAYER_PUBLIC_KEY and VITE_FEE_PAYER_PRIVATE_KEY environment variables.');
    }
    
    // Create admin keypair from environment variables
    const adminPublicKey = new PublicKey(APP_WALLET_CONFIG.publicKey);
    const adminPrivateKey = bs58.decode(APP_WALLET_CONFIG.privateKey);
    const adminKeypair = Keypair.fromSecretKey(adminPrivateKey);
    
    // First find the user by wallet address
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    if (users.user.length === 0) {
      throw new Error('User not found for wallet address');
    }
    
    const user = users.user[0];
    console.log('✅ User found:', user.id);
    
    // Then find the user's profile
    const profiles = await client.findProfiles({
      userIds: [user.id],
      projects: [PROJECT_ADDRESS],
      identities: ["main"]
    });
    
    if (profiles.profile.length === 0) {
      throw new Error('Profile not found for user');
    }
    
    const profile = profiles.profile[0];
    const profileAddress = profile.address;
    console.log('✅ Profile found:', profileAddress);
    console.log('📊 Current platform data:', profile.platformData);
    
    // Prepare platform data update using the correct structure from Honeycomb docs
    const platformData = {};
    
    // Add XP using the proper Honeycomb platform data system
    if (xp > 0) {
      platformData.addXp = xp;
    }
    
    // Add achievements using the proper Honeycomb platform data system
    if (achievements.length > 0) {
      platformData.addAchievements = achievements;
    }
    
    // Add custom data for game statistics (separate from XP/achievements)
    if (Object.keys(customData).length > 0) {
      platformData.custom = {
        add: Object.entries(customData).map(([key, value]) => [key, value.toString()])
      };
    }
    
    console.log('📝 Creating platform data update transaction...');
    console.log('📊 Platform data structure:', platformData);
    console.log('📋 Profile address:', profileAddress);
    console.log('📋 Authority:', adminKeypair.publicKey.toString());
    
    // Create transaction using project authority (admin keypair) - FIXED: Use profile address directly
    const apiResponse = await client.createUpdatePlatformDataTransaction({
      profile: profileAddress, // Use the profile address directly, not wallet address
      authority: adminKeypair.publicKey.toString(), // Use project authority
      platformData
    });
    
    if (!apiResponse || !apiResponse.createUpdatePlatformDataTransaction) {
      throw new Error('Invalid response from Honeycomb API: missing createUpdatePlatformDataTransaction');
    }
    
    const txResponse = apiResponse.createUpdatePlatformDataTransaction;
    
    if (!txResponse) {
      throw new Error('Invalid response from Honeycomb API: missing transaction data');
    }
    
    console.log('✅ Transaction created successfully');
    
    // Create a proper wallet adapter for Honeycomb that handles VersionedTransaction
    const adminWalletAdapter = {
      publicKey: adminKeypair.publicKey,
      connected: true,
      signAllTransactions: async (transactions) => {
        console.log('🔐 Signing transactions:', transactions.length);
        
        // Sign each transaction with the admin keypair
        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];
          console.log(`📝 Signing transaction ${i + 1}/${transactions.length}`);
          
          // Check if it's a VersionedTransaction (which is what Honeycomb uses)
          if (transaction.constructor.name === 'VersionedTransaction') {
            console.log('✅ Transaction is a VersionedTransaction');
            transaction.sign([adminKeypair]);
          } else if (transaction.partialSign) {
            console.log('✅ Transaction has partialSign method');
            transaction.partialSign(adminKeypair);
          } else if (transaction.sign) {
            console.log('✅ Transaction has sign method');
            transaction.sign(adminKeypair);
          } else {
            console.log('⚠️ Unknown transaction type, trying to sign anyway...');
            // Try to add the keypair as a signer
            if (transaction.signatures) {
              transaction.signatures.push(adminKeypair.publicKey.toBytes());
            }
          }
        }
        
        return transactions;
      }
    };
    
    // Use sendClientTransactions with the admin keypair
    const response = await sendClientTransactions(client, adminWalletAdapter, txResponse);
    
    console.log('✅ Transaction sent via Honeycomb client:', response);
    
    // Check for success
    if (response && response.length > 0) {
      const bundle = response[0];
      if (bundle.responses && bundle.responses.length > 0) {
        const txResponse = bundle.responses[0];
        
        if (txResponse.error) {
          throw new Error(`Transaction failed: ${txResponse.error}`);
        } else if (txResponse.signature) {
          console.log('✅ Transaction successful!');
          console.log('📋 Signature:', txResponse.signature);
        }
      }
    }
    
    console.log('✅ Platform data updated successfully');
    return { success: true, achievements, xp, response: { success: true } };
    
  } catch (error) {
    console.error('Error updating platform data:', error);
    throw error;
  }
};

// Debug function to check available client methods
export const debugClientMethods = async () => {
  try {
    console.log('🔍 Available client methods:', Object.keys(client));
    
    // Filter for badge-related methods
    const badgeMethods = Object.keys(client).filter(key => 
      key.toLowerCase().includes('badge') || 
      key.toLowerCase().includes('claim') ||
      key.toLowerCase().includes('proof')
    );
    console.log('🔍 Badge-related methods:', badgeMethods);
    
    // Filter for find-related methods
    const findMethods = Object.keys(client).filter(key => 
      key.toLowerCase().includes('find')
    );
    console.log('🔍 Find-related methods:', findMethods);
    
    return {
      allMethods: Object.keys(client),
      badgeMethods: badgeMethods,
      findMethods: findMethods
    };
  } catch (error) {
    console.error('Error debugging client methods:', error);
    return null;
  }
};


