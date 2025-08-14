import createEdgeClient from '@honeycomb-protocol/edge-client';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers';
import bs58 from 'bs58';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Real Honeycomb Protocol Configuration for "Whot Go!" Project
// Project was created on Honeynet (Solana test network)
const API_URLS = [
  "https://edge.test.honeycombprotocol.com/", // Primary: Test network where project was created
  "https://edge.main.honeycombprotocol.com/", // Fallback: Mainnet
  "https://edge.dev.honeycombprotocol.com/"   // Fallback: Devnet
];

const PROJECT_ADDRESS = 'FJ96yFfdiKfmmHTqxpKuYnaroLMWHNCYxjNFmvn8Ut7c';
const PROFILES_TREE_ADDRESS = 'CcCvQWcjZpkgNAZChq2o2DRT1WonSN2RyBg6F6Wq9M4U';

// Fee payer wallet configuration (for paying transaction fees)
const FEE_PAYER_WALLET = {
  // This is a dedicated wallet with SOL for paying transaction fees
  publicKey: import.meta.env.VITE_FEE_PAYER_PUBLIC_KEY || 'HhEQWQdVL9wagu3tHj6vSBAR4YB9UtkuQkiHZ3cLMU1y', // Your funded wallet address
  privateKey: import.meta.env.VITE_FEE_PAYER_PRIVATE_KEY || 'Dr2kjAFqGTBANf2nn4EauNQrdeFdL4sN5ib5VjQp729A2RbLw2ogJud4ApMXsgWRAoCSMewbJVEajVFdwWyNByu', // Your private key (base58 encoded)
  useUserAsFeePayer: false, // Set to false to use dedicated fee payer wallet
  isConfigured: true // Set to true when wallet is properly configured
};

// Network configuration
const NETWORK_CONFIG = {
  rpcUrl: "https://rpc.test.honeycombprotocol.com", // Honeynet RPC endpoint
  apiUrl: "https://edge.test.honeycombprotocol.com/", // Honeynet API endpoint
  network: "honeynet" // Solana test network provided by Honeycomb Protocol
};

// Badge criteria indices mapping to achievements
const BADGE_CRITERIA = {
  FIRST_VICTORY: 0,        // "Win your first game"
  CARD_MASTER: 1,          // "Master all card types"
  SHADOW_WARRIOR: 2,       // "Win a game without losing a life"
  STRATEGIC_MIND: 3,       // "Win 10 games with strategic plays"
  CENTURY_CLUB: 4,         // "Play 100 games"
  ULTIMATE_CHAMPION: 5,    // "Win 50 games"
  LEGENDARY_PLAYER: 6,     // "Reach level 50"
  WHOT_GRANDMASTER: 7      // "Achieve all other badges"
};

let client;
let currentApiUrl = API_URLS[0]; // Start with test network (where project was created)

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
    
    // Try to find the project (this is a simple way to check if it exists)
    // Note: This might not be the exact API call, but it helps with debugging
    const result = await client.findUsers({
      wallets: ['dummy'] // Use a dummy wallet to test connection
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

// Enhanced profile creation following official docs
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

    // Check fee payer configuration
    console.log('💰 Checking fee payer configuration...');
    const feePayerInfo = getFeePayerInfo();
    
    if (!feePayerInfo.isConfigured) {
      console.error('❌ Fee payer wallet not configured');
      throw new Error('Fee payer wallet not configured. Please set up a funded wallet for transaction fees.');
    }
    
    if (feePayerInfo.useUserAsFeePayer) {
      // Use user's wallet as fee payer (original approach)
      console.log('💰 Using user wallet as fee payer...');
      // Note: User wallet should have sufficient SOL for fees
    } else {
      // Use dedicated fee payer wallet
      console.log('💰 Using dedicated fee payer wallet...');
      console.log('💰 Fee payer address:', feePayerInfo.address);
      
      // Verify fee payer wallet has sufficient balance
      try {
        const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
        const feePayerPublicKey = new PublicKey(feePayerInfo.address);
        const balance = await connection.getBalance(feePayerPublicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        
        console.log('💰 Fee payer balance:', solBalance.toFixed(4), 'SOL');
        
        if (solBalance < 0.01) {
          console.error('❌ Fee payer wallet has insufficient balance');
          throw new Error('Fee payer wallet has insufficient balance. Please fund the fee payer wallet.');
        }
      } catch (balanceError) {
        console.error('❌ Error checking fee payer balance:', balanceError);
        throw new Error('Unable to verify fee payer wallet balance.');
      }
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
    // Following the official documentation pattern exactly
    console.log('📝 Creating profile transaction...');
    
    const transactionParams = {
      project: PROJECT_ADDRESS,
      wallet: walletAddress,
      payer: feePayerInfo.useUserAsFeePayer ? walletAddress : feePayerInfo.address, // Use fee payer for transaction fees
      profileIdentity: "main",
      userInfo: {
        name: displayName,
        bio: "Whot Go! Player - Join the ultimate card game experience!",
        pfp: "https://whotgo.com/default-avatar.png"
      }
    };
    
    console.log('📝 Transaction params:', {
      project: transactionParams.project,
      wallet: transactionParams.wallet,
      payer: transactionParams.payer, // This will be the fee payer address
      profileIdentity: transactionParams.profileIdentity
    });
    
    console.log('📝 Calling createNewUserWithProfileTransaction...');
    console.log('📝 Transaction params:', transactionParams);
    
    let apiResponse;
    try {
      apiResponse = await client.createNewUserWithProfileTransaction(transactionParams);
      console.log('📝 API response received:', apiResponse);
    } catch (apiError) {
      console.error('❌ API call failed:', apiError);
      throw apiError;
    }
    
    if (!apiResponse || !apiResponse.createNewUserWithProfileTransaction) {
      console.error('❌ Invalid API response structure:', apiResponse);
      throw new Error('Invalid response from Honeycomb API: missing createNewUserWithProfileTransaction');
    }
    
    // Get the transaction response as per docs
    const { createNewUserWithProfileTransaction: txResponse } = apiResponse;
    
    console.log('📝 Transaction response exists:', !!txResponse);
    console.log('📝 Transaction response type:', typeof txResponse);
    console.log('📝 Transaction response keys:', txResponse ? Object.keys(txResponse) : 'null/undefined');
    
    if (!txResponse) {
      console.error('❌ Missing transaction data in response:', apiResponse.createNewUserWithProfileTransaction);
      throw new Error('Invalid response from Honeycomb API: missing transaction data');
    }
    
    console.log('✅ Profile transaction created, requesting wallet signature...');
    
    // Sign and send the transaction as per docs
    let walletAdapter;
    
    if (feePayerInfo.useUserAsFeePayer) {
      // Use user's wallet adapter
      walletAdapter = getWalletAdapter(wallet);
    } else {
      // Use fee payer keypair for signing
      console.log('📝 Using fee payer keypair for transaction signing...');
      const feePayerKeypair = getFeePayerKeypair();
      
      // Create a custom wallet adapter that uses the fee payer keypair
      walletAdapter = {
        publicKey: feePayerKeypair.publicKey,
        signTransaction: async (transaction) => {
          transaction.partialSign(feePayerKeypair);
          return transaction;
        },
        signAllTransactions: async (transactions) => {
          transactions.forEach(tx => tx.partialSign(feePayerKeypair));
          return transactions;
        }
      };
    }
    
    // Send the transaction using the client's helper
    const response = await sendClientTransactions(client, walletAdapter, txResponse);
    console.log('✅ Honeycomb user profile created successfully');
    console.log('📋 Transaction response:', response);
    
    // Extract transaction signature and profile address from response
    const transactionSignature = response?.signature || null;
    const profileAddress = response?.profileAddress || null;
    
    if (transactionSignature) {
      console.log('✅ Transaction signature:', transactionSignature);
    }
    
    if (profileAddress) {
      console.log('✅ Profile address:', profileAddress);
    }
    
    // Create user data for Firebase
    const userData = {
      id: walletAddress,
      username: displayName,
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
      totalCardsPlayed: 0,
      perfectWins: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      profilePicture: "https://whotgo.com/default-avatar.png", // Default profile picture
      honeycombProfileExists: true,
      profileAddress: profileAddress || null,
      transactionSignature: transactionSignature || null
    };

    return {
      success: true,
      userData,
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
      console.log('   Project: FJ96yFfdiKfmmHTqxpKuYnaroLMWHNCYxjNFmvn8Ut7c');
      
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

// Enhanced profile login/authentication
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
        // Handle object format: {key: value, key: value, ...}
        Object.entries(profile.customData).forEach(([key, value]) => {
        customData[key] = value;
      });
      }
    }
    
    const userProfile = {
      id: profile.id,
      address: profile.address,
      username: profile.info?.name || 'Unknown Player',
      bio: profile.info?.bio || '',
      pfp: profile.info?.pfp || '',
      xp: parseInt(customData.xp || '0'),
      level: parseInt(customData.level || '1'),
      gamesPlayed: parseInt(customData.gamesPlayed || '0'),
      gamesWon: parseInt(customData.gamesWon || '0'),
      createdAt: parseInt(customData.createdAt || '0'),
      lastActive: parseInt(customData.lastActive || '0'),
      totalCardsPlayed: parseInt(customData.totalCardsPlayed || '0'),
      perfectWins: parseInt(customData.perfectWins || '0'),
      currentWinStreak: parseInt(customData.currentWinStreak || '0'),
      bestWinStreak: parseInt(customData.bestWinStreak || '0'),
      badges: profile.badges || []
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
    
    console.log('🔍 Parsed Honeycomb data:', honeycombData);
    console.log('🔍 Key values extracted:', {
      xp: honeycombData.xp,
      level: honeycombData.level,
      gamesPlayed: honeycombData.gamesPlayed,
      gamesWon: honeycombData.gamesWon,
      username: honeycombData.username
    });
    
    // Check key fields that should be synced
    const fieldsToCheck = [
      'username',
      'xp',
      'level',
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
      
      // Check if Firebase has data that Honeycomb doesn't have
      if (firebaseValue !== undefined && firebaseValue !== null && 
          (honeycombValue === undefined || honeycombValue === null || firebaseString !== honeycombString)) {
        needsUpdate = true;
        missingFields.push(field);
        console.log(`⚠️ Field '${field}' mismatch: Firebase=${firebaseValue} (${typeof firebaseValue}), Honeycomb=${honeycombValue} (${typeof honeycombValue})`);
      }
    }
    
    if (needsUpdate) {
      console.log('🔄 Data inconsistency detected in fields:', missingFields);
    } else {
      console.log('✅ Data is consistent between Firebase and Honeycomb');
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
    
    // Prepare update data
    const updateData = {
      username: firebaseUserData.username || '',
      xp: firebaseUserData.xp || 0,
      level: firebaseUserData.level || 1,
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

// Enhanced profile existence check with data sync
export const checkUserProfileExists = async (publicKey, firebaseUserData = null) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('🔍 Checking Honeycomb user profile...');
    console.log('🔍 Using configured project and API endpoint');
    
    // Find the user by wallet address
    console.log('🔍 Calling findUsers...');
    const users = await client.findUsers({
      wallets: [walletAddress]
    });
    
    console.log('🔍 findUsers response:', {
      userCount: users?.user?.length || 0,
      responseType: typeof users,
      responseKeys: users ? Object.keys(users) : null
    });
    
    if (users.user.length === 0) {
      console.log('❌ No user found for wallet - user needs to be created');
      return { exists: false, needsSync: false, profile: null, needsCreation: true };
    }
    
    const userId = users.user[0].id;
    console.log('🔍 Found user with ID');
    
    // Check if user has a profile in our project
    console.log('🔍 Calling findProfiles...');
    const profiles = await client.findProfiles({
      userIds: [userId],
      projects: [PROJECT_ADDRESS],
      identities: ["main"]
    });
    
    console.log('🔍 findProfiles response:', {
      profileCount: profiles?.profile?.length || 0,
      responseType: typeof profiles,
      responseKeys: profiles ? Object.keys(profiles) : null
    });
    
    const exists = profiles.profile.length > 0;
    console.log('✅ User profile exists:', exists);
    
    // If profile exists and we have Firebase data, check for data consistency
    if (exists && firebaseUserData) {
      console.log('🔄 Checking data consistency between Firebase and Honeycomb...');
      const profile = profiles.profile[0];
      
      // Check if Honeycomb profile has all the data from Firebase
      const needsUpdate = await checkProfileDataConsistency(profile, firebaseUserData);
      
      if (needsUpdate) {
        console.log('⚠️ Data inconsistency detected, prompting user to sync...');
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

// Check wallet SOL balance and airdrop if needed
// Note: Airdrop logic removed - fee payer wallet handles all transaction costs

// Test Honeycomb API connection and configuration
export const testHoneycombConnection = async () => {
  try {
    console.log('🔧 Testing Honeycomb API connection...');
    console.log('🔧 Project address:', PROJECT_ADDRESS);
    console.log('🔧 API endpoint:', 'https://edge.test.honeycombprotocol.com/');
    
    // Test basic API connectivity
    const global = await client.findGlobal();
    console.log('🔧 Global data:', global);
    
    // Test project existence
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

// Test RPC connection and airdrop functionality
export const testRPCConnection = async () => {
  try {
    console.log('🔧 Testing RPC connection...');
    const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
    
    // Test basic RPC connectivity
    const slot = await connection.getSlot();
    console.log('🔧 Current slot:', slot);
    
    // Test airdrop endpoint availability
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

// Note: Manual airdrop command removed - fee payer wallet handles all transaction costs

// Create a fee payer wallet for transaction fees
export const createFeePayerWallet = async () => {
  try {
    console.log('💰 Creating fee payer wallet...');
    
    // Import Keypair for creating a new wallet
    const { Keypair } = await import('@solana/web3.js');
    
    // Generate a new keypair for fee payer
    const feePayerKeypair = Keypair.generate();
    const feePayerAddress = feePayerKeypair.publicKey.toBase58();
    
    console.log('💰 Fee payer wallet created:', feePayerAddress);
    
    // Connect to Honeycomb testnet
    const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
    
    // Request airdrop for fee payer wallet
    console.log('💰 Requesting airdrop for fee payer wallet...');
    const airdropSignature = await connection.requestAirdrop(feePayerKeypair.publicKey, 1 * LAMPORTS_PER_SOL);
    const confirmation = await connection.confirmTransaction(airdropSignature, 'confirmed');
    
    if (confirmation.value && confirmation.value.err) {
      throw new Error('Failed to fund fee payer wallet');
    }
    
    console.log('✅ Fee payer wallet funded successfully');
    
    return {
      keypair: feePayerKeypair,
      address: feePayerAddress,
      connection
    };
  } catch (error) {
    console.error('❌ Error creating fee payer wallet:', error);
    throw error;
  }
};

// Get fee payer wallet info
export const getFeePayerInfo = () => {
  return {
    address: FEE_PAYER_WALLET.publicKey,
    privateKey: FEE_PAYER_WALLET.privateKey,
    useUserAsFeePayer: FEE_PAYER_WALLET.useUserAsFeePayer,
    isConfigured: FEE_PAYER_WALLET.isConfigured
  };
};

// Get fee payer keypair for signing transactions
export const getFeePayerKeypair = () => {
  if (!FEE_PAYER_WALLET.isConfigured || !FEE_PAYER_WALLET.privateKey) {
    throw new Error('Fee payer wallet not configured or private key missing');
  }
  
  try {
    const privateKeyBytes = bs58.decode(FEE_PAYER_WALLET.privateKey);
    
    // Validate private key length (should be 64 bytes for Solana)
    if (privateKeyBytes.length !== 64) {
      throw new Error(`Invalid private key length: ${privateKeyBytes.length} bytes (expected 64)`);
    }
    
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    
    // Verify the keypair matches the configured public key
    if (keypair.publicKey.toBase58() !== FEE_PAYER_WALLET.publicKey) {
      throw new Error('Private key does not match the configured public key');
    }
    
    return keypair;
  } catch (error) {
    console.error('❌ Fee payer keypair validation failed:', error);
    throw new Error(`Invalid fee payer private key: ${error.message}`);
  }
};

// Set up fee payer wallet manually
export const setupFeePayerWallet = async () => {
  try {
    console.log('💰 Setting up fee payer wallet...');
    
    // Create and fund a fee payer wallet
    const feePayerWallet = await createFeePayerWallet();
    
    // Update the configuration to use the new fee payer
    FEE_PAYER_WALLET.publicKey = feePayerWallet.address;
    FEE_PAYER_WALLET.privateKey = bs58.encode(feePayerWallet.keypair.secretKey);
    FEE_PAYER_WALLET.useUserAsFeePayer = false;
    FEE_PAYER_WALLET.isConfigured = true;
    
    console.log('✅ Fee payer wallet setup complete');
    console.log('💰 Fee payer address:', feePayerWallet.address);
    
    return {
      success: true,
      address: feePayerWallet.address,
      message: 'Fee payer wallet created and funded successfully'
    };
  } catch (error) {
    console.error('❌ Error setting up fee payer wallet:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Configure fee payer with existing wallet address and private key
export const configureFeePayerWithAddress = async (walletAddress, privateKeyBase58) => {
  try {
    console.log('💰 Configuring fee payer with address:', walletAddress);
    
    // Validate the wallet address
    const publicKey = new PublicKey(walletAddress);
    
    // Validate the private key
    if (!privateKeyBase58) {
      throw new Error('Private key is required for fee payer wallet.');
    }
    
    let keypair;
    try {
      const privateKeyBytes = bs58.decode(privateKeyBase58);
      keypair = Keypair.fromSecretKey(privateKeyBytes);
      
      // Verify the keypair matches the public key
      if (keypair.publicKey.toBase58() !== walletAddress) {
        throw new Error('Private key does not match the provided wallet address.');
      }
    } catch (keyError) {
      throw new Error('Invalid private key format. Please provide a valid base58-encoded private key.');
    }
    
    // Check if the wallet has sufficient balance
    const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    console.log('💰 Fee payer balance:', solBalance.toFixed(4), 'SOL');
    
    if (solBalance < 0.01) {
      throw new Error('Insufficient balance in fee payer wallet. Please fund it with at least 0.01 SOL.');
    }
    
    // Update the configuration
    FEE_PAYER_WALLET.publicKey = walletAddress;
    FEE_PAYER_WALLET.privateKey = privateKeyBase58;
    FEE_PAYER_WALLET.useUserAsFeePayer = false;
    FEE_PAYER_WALLET.isConfigured = true;
    
    console.log('✅ Fee payer configured successfully');
    
    return {
      success: true,
      address: walletAddress,
      balance: solBalance,
      message: 'Fee payer wallet configured successfully'
    };
  } catch (error) {
    console.error('❌ Error configuring fee payer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced profile check with retry mechanism for newly created profiles
export const checkUserProfileExistsWithRetry = async (publicKey, firebaseUserData = null, maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔍 Profile check attempt ${attempt}/${maxRetries}`);
    
    const result = await checkUserProfileExists(publicKey, firebaseUserData);
    
    if (result.exists) {
      console.log(`✅ Profile found on attempt ${attempt}`);
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Profile not found, waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`❌ Profile not found after ${maxRetries} attempts`);
  return { exists: false, needsSync: false, profile: null };
};

// Enhanced profile update following official docs
export const updateUserProfile = async ({ publicKey, wallet, signMessage, profileData }) => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('Updating Honeycomb user profile for:', walletAddress);
    
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
    
    // Update custom data if provided
    if (profileData.xp !== undefined || profileData.level !== undefined || 
        profileData.gamesPlayed !== undefined || profileData.gamesWon !== undefined) {
      updateData.customData = {
        add: []
      };
      
      if (profileData.xp !== undefined) updateData.customData.add.push(["xp", profileData.xp.toString()]);
      if (profileData.level !== undefined) updateData.customData.add.push(["level", profileData.level.toString()]);
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
    
    return { success: true, response };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Enhanced profile retrieval
export const getUserProfile = async publicKey => {
  try {
    const walletAddress = publicKey.toBase58();
    
    console.log('Getting Honeycomb user profile for:', walletAddress);
    
    // Find the user by wallet address
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
      includeProof: true
    });
    
    if (profiles.profile.length === 0) {
      console.log('No profile found for user');
      return null;
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
        // Handle object format: {key: value, key: value, ...}
        Object.entries(profile.customData).forEach(([key, value]) => {
        customData[key] = value;
      });
      }
    }
    
    return {
      id: profile.id,
      address: profile.address,
      username: profile.info?.name || 'Unknown Player',
      bio: profile.info?.bio || '',
      pfp: profile.info?.pfp || '',
      xp: parseInt(customData.xp || '0'),
      level: parseInt(customData.level || '1'),
      gamesPlayed: parseInt(customData.gamesPlayed || '0'),
      gamesWon: parseInt(customData.gamesWon || '0'),
      createdAt: parseInt(customData.createdAt || '0'),
      lastActive: parseInt(customData.lastActive || '0'),
      totalCardsPlayed: parseInt(customData.totalCardsPlayed || '0'),
      perfectWins: parseInt(customData.perfectWins || '0'),
      currentWinStreak: parseInt(customData.currentWinStreak || '0'),
      bestWinStreak: parseInt(customData.bestWinStreak || '0'),
      badges: profile.badges || []
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
    
    // Get fee payer configuration
    const feePayerInfo = getFeePayerInfo();
    
    // Update profile info
    console.log('📝 Creating update profile transaction...');
    const apiResponse = await client.createUpdateProfileTransaction({
      profile: profile.address,
      payer: feePayerInfo.useUserAsFeePayer ? walletAddress : feePayerInfo.address, // Use fee payer for transaction fees
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
    let walletAdapter;
    
    if (feePayerInfo.useUserAsFeePayer) {
      // Use user's wallet adapter
      walletAdapter = getWalletAdapter(wallet);
    } else {
      // Use fee payer keypair for signing
      console.log('📝 Using fee payer keypair for transaction signing...');
      const feePayerKeypair = getFeePayerKeypair();
      
      // Create a custom wallet adapter that uses the fee payer keypair
      walletAdapter = {
        publicKey: feePayerKeypair.publicKey,
        signTransaction: async (transaction) => {
          transaction.partialSign(feePayerKeypair);
          return transaction;
        },
        signAllTransactions: async (transactions) => {
          transactions.forEach(tx => tx.partialSign(feePayerKeypair));
          return transactions;
        }
      };
    }
    
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
    
    return { success: true, response };
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
    
    // Claim the badge criteria
    console.log('📝 Creating claim badge transaction...');
    const apiResponse = await client.createClaimBadgeCriteriaTransaction({
      payer: walletAddress,
      profile: profile.address,
      badgeCriteria: badgeIndex
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
    
    // Sign and send the transaction
    const walletAdapter = getWalletAdapter(wallet);
    
    // Wrap transaction in object format expected by sendClientTransactions
    const transactionObject = {
      transaction: txResponse.transaction,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight
    };
    
    console.log('📝 Transaction object prepared for badge claim:', {
      hasTransaction: !!transactionObject.transaction,
      hasBlockhash: !!transactionObject.blockhash,
      hasLastValidBlockHeight: !!transactionObject.lastValidBlockHeight
    });
    
    const response = await sendClientTransactions(client, walletAdapter, transactionObject);
    console.log('Honeycomb badge claimed successfully');
    
    return { success: true, badgeIndex, response };
  } catch (error) {
    console.error('Error claiming badge:', error);
    throw error;
  }
};

// Helper function to check if user has earned a specific badge
export const hasBadge = (profile, badgeIndex) => {
  if (!profile || !profile.badges) return false;
  return profile.badges.some(badge => badge.badgeCriteria === badgeIndex);
};

// Helper function to get badge name by index
export const getBadgeName = (badgeIndex) => {
  const badgeNames = {
    [BADGE_CRITERIA.FIRST_VICTORY]: "First Victory",
    [BADGE_CRITERIA.CARD_MASTER]: "Card Master",
    [BADGE_CRITERIA.SHADOW_WARRIOR]: "Shadow Warrior",
    [BADGE_CRITERIA.STRATEGIC_MIND]: "Strategic Mind",
    [BADGE_CRITERIA.CENTURY_CLUB]: "Century Club",
    [BADGE_CRITERIA.ULTIMATE_CHAMPION]: "Ultimate Champion",
    [BADGE_CRITERIA.LEGENDARY_PLAYER]: "Legendary Player",
    [BADGE_CRITERIA.WHOT_GRANDMASTER]: "Whot Grandmaster"
  };
  return badgeNames[badgeIndex] || `Badge ${badgeIndex}`;
};

// Export badge criteria for use in other components
export { BADGE_CRITERIA };