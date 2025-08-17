#!/usr/bin/env node

import createEdgeClient from '@honeycomb-protocol/edge-client';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers.js';
import { BadgesCondition } from '@honeycomb-protocol/edge-client';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// Debug imports
console.log('🔍 Debugging imports...');
console.log('createEdgeClient type:', typeof createEdgeClient);
console.log('createEdgeClient keys:', Object.keys(createEdgeClient));
console.log('createEdgeClient.default:', createEdgeClient.default);
console.log('BadgesCondition:', BadgesCondition);
console.log('Keypair type:', typeof Keypair);
console.log('bs58 type:', typeof bs58);
console.log('sendClientTransactions type:', typeof sendClientTransactions);

// Configuration
const PROJECT_ADDRESS = process.env.HONEYCOMB_PROJECT_ADDRESS;
const API_URL = 'https://edge.test.honeycombprotocol.com/';
const RPC_URL = 'https://rpc.test.honeycombprotocol.com';

// Badge definitions for Whot Go!
const BADGE_DEFINITIONS = [
  {
    index: 0,
    name: 'First Victory',
    description: 'Win your first game',
    imageUrl: 'https://whotgo.com/badges/first-victory.png'
  },
  {
    index: 1,
    name: 'Card Master',
    description: 'Master all card types',
    imageUrl: 'https://whotgo.com/badges/card-master.png'
  },
  {
    index: 2,
    name: 'Shadow Warrior',
    description: 'Win a game without losing a life',
    imageUrl: 'https://whotgo.com/badges/shadow-warrior.png'
  },
  {
    index: 3,
    name: 'Strategic Mind',
    description: 'Win 10 games with strategic plays',
    imageUrl: 'https://whotgo.com/badges/strategic-mind.png'
  },
  {
    index: 4,
    name: 'Century Club',
    description: 'Play 100 games',
    imageUrl: 'https://whotgo.com/badges/century-club.png'
  },
  {
    index: 5,
    name: 'Ultimate Champion',
    description: 'Win 50 games',
    imageUrl: 'https://whotgo.com/badges/ultimate-champion.png'
  },
  {
    index: 6,
    name: 'Legendary Player',
    description: 'Reach level 50',
    imageUrl: 'https://whotgo.com/badges/legendary-player.png'
  },
  {
    index: 7,
    name: 'Whot Grandmaster',
    description: 'Achieve all other badges',
    imageUrl: 'https://whotgo.com/badges/whot-grandmaster.png'
  }
];

/**
 * Create a mock wallet adapter for server-side operations
 */
const createMockWalletAdapter = (keypair) => {
  return {
    name: 'Server Wallet',
    connected: true,
    publicKey: keypair.publicKey,
    signTransaction: async (transaction) => {
      transaction.sign([keypair]);
      return transaction;
    },
    signAllTransactions: async (transactions) => {
      // Handle array of VersionedTransaction objects
      if (Array.isArray(transactions)) {
        transactions.forEach(tx => {
          if (tx && typeof tx.sign === 'function') {
            // VersionedTransaction.sign() expects an array of signers
            tx.sign([keypair]);
          }
        });
        return transactions;
      } else {
        // Single transaction case
        if (transactions && typeof transactions.sign === 'function') {
          transactions.sign([keypair]);
        }
        return [transactions];
      }
    },
    signMessage: async (message) => {
      // Mock message signing
      return new Uint8Array(64);
    }
  };
};

/**
 * Initialize Honeycomb client for server-side operations
 */
const initializeClient = (privateKey) => {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    
    // Create Solana connection
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Get the correct function from the import
    const clientFunction = createEdgeClient.default || createEdgeClient;
    console.log('🔧 Client function type:', typeof clientFunction);
    
    // Create edge client as per documentation
    const client = clientFunction(API_URL, true);

    console.log('✅ Honeycomb edge client initialized for server-side operations');
    console.log('🔑 Using wallet:', keypair.publicKey.toString());
    console.log('🔗 Connected to API:', API_URL);
    console.log('🔗 Connected to RPC:', RPC_URL);
    return { client, keypair, connection };
  } catch (error) {
    console.error('❌ Failed to initialize Honeycomb client:', error);
    throw error;
  }
};

/**
 * Create badge criteria for a specific badge
 */
const createBadgeCriteria = async (client, keypair, connection, badgeIndex, badgeData) => {
  try {
    console.log(`🏗️ Creating badge criteria for badge ${badgeIndex}: ${badgeData.name}`);
    
    // Debug: Check what methods are available on the client
    console.log('🔍 Available methods on client:', Object.keys(client));
    
    // Check for badge-related methods
    const badgeMethods = Object.keys(client).filter(key => key.toLowerCase().includes('badge'));
    console.log('🔍 Badge-related methods:', badgeMethods);
    
    // Check for create-related methods
    const createMethods = Object.keys(client).filter(key => key.toLowerCase().includes('create'));
    console.log('🔍 Create-related methods:', createMethods);
    
    // Check if the method exists
    if (!client.createInitializeBadgeCriteriaTransaction) {
      console.log('❌ createInitializeBadgeCriteriaTransaction method not found on client');
      console.log('🔍 Looking for alternative methods...');
      
      // Try to find any method that might create badges
      const possibleMethods = Object.keys(client).filter(key => 
        key.toLowerCase().includes('badge') && 
        (key.toLowerCase().includes('create') || key.toLowerCase().includes('new') || key.toLowerCase().includes('init'))
      );
      console.log('🔍 Possible badge creation methods:', possibleMethods);
      
      throw new Error('createInitializeBadgeCriteriaTransaction method not available on edge client');
    }
    
    // Create badge criteria transaction using the correct method from docs
    const txResponse = await client.createInitializeBadgeCriteriaTransaction({
      args: {
        authority: keypair.publicKey.toString(), // Project authority public key
        projectAddress: PROJECT_ADDRESS, // Project public key
        payer: keypair.publicKey.toString(), // Using authority as payer
        badgeIndex: badgeIndex, // Badge index as an integer
        condition: BadgesCondition.Public, // Badge condition, only Public is available for now
        startTime: 0, // Start time: 0 means start immediately
        endTime: 2147483647, // Max 32-bit signed integer (year 2038) - effectively never expires
      },
    });

    console.log(`📝 Badge criteria transaction created for ${badgeData.name}`);
    console.log(`📝 Full response type:`, typeof txResponse);
    console.log(`📝 Full response keys:`, txResponse ? Object.keys(txResponse) : 'null');
    console.log(`📝 Full response:`, JSON.stringify(txResponse, null, 2));
    
    // Extract the nested transaction data
    const transactionData = txResponse.createInitializeBadgeCriteriaTransaction;
    
    // Check if the response has the expected structure
    if (!transactionData || !transactionData.transaction) {
      console.error('❌ Transaction response is missing or invalid');
      console.error('❌ Expected structure: { createInitializeBadgeCriteriaTransaction: { transaction, blockhash, lastValidBlockHeight } }');
      throw new Error('Invalid transaction response from createInitializeBadgeCriteriaTransaction');
    }
    
    console.log(`📝 Blockhash: ${transactionData.blockhash}`);
    console.log(`📝 Last valid block height: ${transactionData.lastValidBlockHeight}`);
    
    // Create mock wallet adapter for server-side signing
    const walletAdapter = createMockWalletAdapter(keypair);
    console.log('🔐 Using mock wallet adapter for server-side signing');
    
    // Wrap transaction in object format expected by sendClientTransactions
    const transactionObject = {
      transaction: transactionData.transaction,
      blockhash: transactionData.blockhash,
      lastValidBlockHeight: transactionData.lastValidBlockHeight
    };
    
    console.log('🔐 Transaction object prepared for badge criteria creation:', {
      hasTransaction: !!transactionObject.transaction,
      hasBlockhash: !!transactionObject.blockhash,
      hasLastValidBlockHeight: !!transactionObject.lastValidBlockHeight
    });
    
    // Send the transaction using Honeycomb's sendClientTransactions
    const response = await sendClientTransactions(client, walletAdapter, transactionObject);
    console.log(`✅ Transaction sent for ${badgeData.name}`);
    
    // Handle response format
    let transactionSignature = null;
    
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
        }
      }
    } else if (response && response.signature) {
      // Direct response format
      transactionSignature = response.signature;
      console.log('✅ Direct transaction signature found');
    }
    
    console.log(`🔗 Transaction signature: ${transactionSignature}`);
    
    // Wait for confirmation
    if (transactionSignature) {
      const confirmation = await connection.confirmTransaction(transactionSignature, 'confirmed');
      console.log(`✅ Transaction confirmed for ${badgeData.name}`);
      console.log(`📊 Confirmation status:`, confirmation);
    }
    
    return {
      success: true,
      badgeIndex,
      badgeName: badgeData.name,
      transactionSignature: transactionSignature,
      blockhash: transactionData.blockhash,
      lastValidBlockHeight: transactionData.lastValidBlockHeight
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
const createAllBadgeCriteria = async (client, keypair, connection) => {
  try {
    console.log('🚀 Starting badge criteria creation for all badges...');
    
    const results = [];
    
    for (const badge of BADGE_DEFINITIONS) {
      const result = await createBadgeCriteria(client, keypair, connection, badge.index, badge);
      
      results.push({
        badgeIndex: badge.index,
        badgeName: badge.name,
        ...result
      });
      
      // Add a small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('📊 Badge criteria creation summary:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Failed to create badge criteria:', error);
    throw error;
  }
};

/**
 * Main function to create badges
 */
const main = async () => {
  try {
    console.log('🏗️ Starting badge creation process...');
    
    // Get private key from environment variable or command line argument
    const privateKey = process.env.HONEYCOMB_PRIVATE_KEY || process.argv[2];
    
    if (!privateKey) {
      console.error('❌ Private key is required!');
      console.log('Usage: node createBadges.js <private_key>');
      console.log('Or set HONEYCOMB_PRIVATE_KEY environment variable');
      process.exit(1);
    }
    
    console.log('🔍 Project details:', {
      projectAddress: PROJECT_ADDRESS,
      apiUrl: API_URL,
      rpcUrl: RPC_URL
    });
    
    // Initialize client
    const { client, keypair, connection } = initializeClient(privateKey);
    
    // Create all badge criteria
    const results = await createAllBadgeCriteria(client, keypair, connection);
    
    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 Final Results:');
    console.log(`✅ Successfully created: ${successful.length} badges`);
    console.log(`❌ Failed to create: ${failed.length} badges`);
    
    if (successful.length > 0) {
      console.log('\n✅ Created badges:');
      successful.forEach(badge => {
        console.log(`  - ${badge.badgeName} (index: ${badge.badgeIndex})`);
        console.log(`    Transaction Signature: ${badge.transactionSignature}`);
        console.log(`    Blockhash: ${badge.blockhash}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed badges:');
      failed.forEach(badge => {
        console.log(`  - ${badge.badgeName} (index: ${badge.badgeIndex}): ${badge.error}`);
      });
    }
    
    console.log('\n🎉 Badge creation process completed!');
    
  } catch (error) {
    console.error('❌ Badge creation failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
