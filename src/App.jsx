import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ref, push, set, onValue, off, update, remove, serverTimestamp, onDisconnect, get } from 'firebase/database';
import { db, functions as fbFunctions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { createUserProfile, createUserProfileWithSOLManagement, checkUserProfileExists, checkUserProfileExistsWithRetry, testHoneycombConnection, testRPCConnection, ensureWalletHasSOL, loginUserProfile, updateUserProfile, updateUserProfileWithSOLManagement, updateProfileInfo, checkProjectExists, getApiStatus, syncFirebaseToHoneycomb, executeTransactionWithSOLRetry } from './utils/profile';
import { updateGameStats, checkUnlockableBadges, claimSpecificBadge, claimSpecificBadgeWithSOLManagement } from './utils/honeycombBadges';
import Game from './components/Game';
import AchievementPopup from './components/popups/AchievementPopup';
import GameLogPopup from './components/popups/GameLogPopup';
import BadgeNotification from './components/BadgeNotification';
import SyncPopup from './components/popups/SyncPopup';
import ProfileCreationStatus from './components/ProfileCreationStatus';
import RoundEndPopup from './components/popups/RoundEndPopup';
import EliminatedPopup from './components/popups/EliminatedPopup';

import ProfilePopup from './components/popups/ProfilePopup';
import LeaderboardPopup from './components/popups/LeaderboardPopup';
import SettingsPopup from './components/popups/SettingsPopup';
import GameModePopup from './components/popups/GameModePopup';
import HelpPopup from './components/popups/HelpPopup';
import Confetti from 'react-confetti';
import { createDeck, shuffleDeck } from './utils/deck';
import { getCardSVGContent, getCardBackSVG } from './utils/cardSVG';
import soundEffects, { playSoundEffect } from './utils/soundEffects';
import { ensurePlayersArray } from './utils/gameUtils';
import { ArrowLeft, ChevronRight, Play, Settings, Award, Shield, Wifi, Bot, X, Users, Plus, Crown, Clock } from 'lucide-react';
import './App.css';

const App = () => {
  const MAX_VISIBLE_AI_CARDS = 3;
  
  // Page styles for different game states
  const pageStyles = {
    landing: {
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%)',
      fontFamily: "'Courier New', 'Liberation Mono', monospace"
    },
    menu: {
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%)',
      fontFamily: "'Courier New', 'Liberation Mono', monospace"
    },
    game: {
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%)',
      perspective: '1000px',
      fontFamily: "'Courier New', 'Liberation Mono', monospace"
    }
  };
  
  // Animation types for card movements
  const ANIMATION_TYPES = {
    OPPONENT_PLAY: 'opponent-play',
    OPPONENT_DRAW: 'opponent-draw',
    PLAYER_PLAY: 'player-play',
    PLAYER_DRAW: 'player-draw',
    DEALING: 'dealing'
  };

  // Performance optimization: Memoize expensive calculations
  const memoizedCardAnimation = useRef({});
  const lastAnimationTime = useRef(0);
  const animationFrameId = useRef(null);
  
  // Load initial state from localStorage with error handling
  const getInitialState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`whotgo_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [currentCard, setCurrentCard] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [gameState, setGameState] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameCountdown, setGameCountdown] = useState(null);
  const lastRoomGameDataRef = useRef(null);
  const [turnTimer, setTurnTimer] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [dealtCountsByPlayer, setDealtCountsByPlayer] = useState([]);
  const [playPileRevealed, setPlayPileRevealed] = useState(false);

  const [activePopup, setActivePopup] = useState(null);
  const [pendingWhotCard, setPendingWhotCard] = useState(null);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [marketCardPositions, setMarketCardPositions] = useState([]);
  const [needNewMarketPositions, setNeedNewMarketPositions] = useState(false);
  const [playPileCardPositions, setPlayPileCardPositions] = useState({});
  const [playerScrollIndex, setPlayerScrollIndex] = useState(0);
  const [lastGameActivity, setLastGameActivity] = useState(null);
  const gameTimeoutRef = useRef(null);
  const [maxVisiblePlayerCards, setMaxVisiblePlayerCards] = useState(6);
  const [showDeckView, setShowDeckView] = useState(false);
  const [isPlayerActionInProgress, setIsPlayerActionInProgress] = useState(false);
  const [isAITurnInProgress, setIsAITurnInProgress] = useState(false);
  const [isAnyAnimationInProgress, setIsAnyAnimationInProgress] = useState(false);
  const isAnimationInProgressRef = useRef(false);
  const [showEliminatedPopup, setShowEliminatedPopup] = useState(false);
  const [showRoundEndPopup, setShowRoundEndPopup] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);
  const [unlockableBadges, setUnlockableBadges] = useState([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileCreationError, setProfileCreationError] = useState(null);
  const [honeycombProfileExists, setHoneycombProfileExists] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isAirdroppingSOL, setIsAirdroppingSOL] = useState(false);

  const [showGameLog, setShowGameLog] = useState(false);
  const [selectedLogRound, setSelectedLogRound] = useState(1);
  const [animationPositions, setAnimationPositions] = useState({});
  const [, setPlayPilePositions] = useState([]);
  
  // Save state to localStorage with error handling
  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(`whotgo_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  };

  // Clear localStorage when returning to menu or on reload
  const clearGameState = () => {
    // Stop game music if playing
    soundEffects.stopGameMusic();
    
    // Start background music when clearing game state
    soundEffects.startBackgroundMusic();
    
    // Clear all game-related localStorage items
    localStorage.removeItem('whotgo_gameState');
    localStorage.removeItem('whotgo_currentUser');
    localStorage.removeItem('whotgo_currentRoom');
    localStorage.removeItem('whotgo_gameCountdown');
    localStorage.removeItem('whotgo_turnTimer');
    localStorage.removeItem('whotgo_gameData');
    localStorage.removeItem('whotgo_lastGameActivity');
    localStorage.removeItem('whotgo_playerScrollIndex');
    localStorage.removeItem('whotgo_showWhotChoice');
    localStorage.removeItem('whotgo_pendingWhotCard');
    localStorage.removeItem('whotgo_activePopup');
    localStorage.removeItem('whotgo_isPlayerActionInProgress');
    localStorage.removeItem('whotgo_isAITurnInProgress');
    localStorage.removeItem('whotgo_isAnyAnimationInProgress');
    

  };

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible again - check if we need to restore state
        if (gameState === 'game' && gameData) {
                  // We're in a game, make sure the state is properly restored
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameState, gameData]);

  // Check if multiplayer room still exists and handle reconnection
  const checkAndReconnectToRoom = async (roomId) => {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);
      
              if (roomSnapshot.exists()) {
          const roomData = roomSnapshot.val();
          // Check if current user is still in the room
          if (roomData.players && roomData.players[currentUser?.id]) {
            setCurrentRoom({ ...roomData, id: roomId });
            return true;
          } else {
            clearGameState();
            setGameState('menu');
            return false;
          }
        } else {
          clearGameState();
          setGameState('menu');
          return false;
        }
    } catch (error) {
      console.error('Error checking room status:', error);
      clearGameState();
      setGameState('menu');
      return false;
    }
  };

  // Clear any saved game state on app start to prevent auto-restoration
  useEffect(() => {
    // Clear game state on app initialization to always start fresh
    clearGameState();
    
    // Force reset all game-related state to ensure clean start
    setGameData(null);
    setGameState('landing');
    setCurrentRoom(null);
    setGameCountdown(null);
    setTurnTimer(null);
    setLastGameActivity(null);
    

    
    // Also clear on page reload/refresh
    const handleBeforeUnload = () => {
      clearGameState();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Run only once on mount

  // Update last activity timestamp when game actions occur
  const updateGameActivity = () => {
    setLastGameActivity(Date.now());
  };

  // Clear game after 5 minutes of inactivity (only for multiplayer games)
  useEffect(() => {
    if (!gameData || gameState !== 'game') {
      // Clear timeout if not in game
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
        gameTimeoutRef.current = null;
      }
      return;
    }

    // Only set timeout for multiplayer games (when currentRoom exists)
    // AI games should never timeout
    if (!currentRoom) {
      // Clear timeout for AI games
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
        gameTimeoutRef.current = null;
      }
      return;
    }

    // Start/restart timeout when multiplayer game is active
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
    }

    gameTimeoutRef.current = setTimeout(() => {

      
      // Clear the game state (only for multiplayer)
      leaveRoom();
      
      // Clear all game-related state
      clearGameState();
      setGameData(null);
      setGameState('menu');
      setLastGameActivity(null);
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
        gameTimeoutRef.current = null;
      }
    };
  }, [gameData, gameState, lastGameActivity, currentRoom]);

  // Initialize player deck positions
  const initializePlayerPositions = () => {
    const screenWidth = window.innerWidth;
    const positions = {
      playPile: {
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% - ${screenWidth < 768 ? '54px' : screenWidth < 1024 ? '72px' : '90px'}), -50%)`
      },
      market: {
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${screenWidth < 768 ? '54px' : screenWidth < 1024 ? '72px' : '90px'}), -50%)`
      },
      playerDecks: {
        0: {
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        },
        1: {
          left: '-120px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)'
        },
        2: {
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        },
        3: {
          right: '-120px',
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)'
        }
      },
      animationStarts: {
        0: {
          top: 'calc(100vh + 200px)',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0
        },
        1: {
          left: '-200px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0
        },
        2: {
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0
        },
        3: {
          left: 'calc(100% + 200px)',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0
        }
      },
      drawEnds: {
        0: {
          top: 'calc(100vh - 120px)',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 1
        },
        1: {
          left: '-120px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 1
        },
        2: {
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 1
        },
        3: {
          right: '-120px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 1
        }
      }
    };
    setAnimationPositions(positions);
  };
  
  const [adminCardsRevealed, setAdminCardsRevealed] = useState(false);
  const [adminMarketRevealed, setAdminMarketRevealed] = useState(false);
  const [showAdminDeckOverview, setShowAdminDeckOverview] = useState(false);
  
  // Initialize player positions on component mount
  useEffect(() => {
    initializePlayerPositions();
  }, []);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [syncPopupData, setSyncPopupData] = useState(null);
  const [musicVolume, setMusicVolume] = useState(75);
  const [soundVolume, setSoundVolume] = useState(85);
  const [showHelp, setShowHelp] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Handle music transitions between game states - instant transitions
  useEffect(() => {
    if (gameState === 'game') {
      // Stop background music and start game music instantly
      soundEffects.stopAllMusic();
      soundEffects.startGameMusic();
    } else if (gameState === 'menu') {
      // Stop game music and start background music instantly
      soundEffects.stopAllMusic();
      soundEffects.startBackgroundMusic();
    }
  }, [gameState]);

  // Simplified music management using sound effects system
  const startBackgroundMusic = () => {
    soundEffects.startBackgroundMusic();
  };

  const stopBackgroundMusic = () => {
    soundEffects.stopBackgroundMusic();
  };

  const updateMusicVolume = (newVolume) => {
    // Volume is managed by sound effects system
  };
  

  const [confettiActive, setConfettiActive] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const confettiCanvasRef = useRef(null);
  const marketCardPositionsRef = useRef([]);
  const playPilePositionsRef = useRef([]);
  const { publicKey, connected, signTransaction, signMessage, wallet } = useWallet();
  const ADMIN_WALLET = 'DtdnqvRddQspZvRV5SJX2DeqxmLYef7Hqn9LFK9LioJS';
  const isAdmin = publicKey?.toBase58() === ADMIN_WALLET;

  const cards = [
    { shape: '●', number: '1', color: '#80142c' },
    { shape: '▲', number: '7', color: '#a01d39' },
    { shape: '✚', number: '13', color: '#661123' },
    { shape: '■', number: '10', color: '#550f1e' },
    { shape: '🔥', number: 'WHOT', color: '#4a0c1a' }
  ];

  useEffect(() => {
    const calculateMaxCards = () => {
      const screenWidth = window.innerWidth;
      const cardWidth = screenWidth < 768 ? 72 : screenWidth < 1024 ? 100 : 130;
      const availableWidth = screenWidth - 400;
      const cardSpacing = 6;
      const maxCards = Math.max(3, Math.floor(availableWidth / (cardWidth + cardSpacing)));
      setMaxVisiblePlayerCards(Math.min(maxCards, 7));
      const positions = {
        playPile: {
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% - ${screenWidth < 768 ? '54px' : screenWidth < 1024 ? '72px' : '90px'}), -50%)`
        },
        market: {
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${screenWidth < 768 ? '54px' : screenWidth < 1024 ? '72px' : '90px'}), -50%)`
        },
        playerDecks: {
          0: {
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          1: {
            left: '-120px',
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)'
          },
          2: {
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          3: {
            right: '-120px',
            top: '50%',
            transform: 'translateY(-50%) rotate(90deg)'
          }
        },
        animationStarts: {
          0: {
            top: 'calc(100vh + 200px)',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0
          },
          1: {
            left: '-200px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0
          },
          2: {
            top: '-200px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0
          },
          3: {
            left: 'calc(100% + 200px)',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0
          }
        },
        drawEnds: {
          0: {
            top: 'calc(100vh - 120px)',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 1
          },
          1: {
            left: '-120px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 1
          },
          2: {
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 1
          },
          3: {
            left: 'calc(100% + 120px)',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 1
          }
        }
      };
      setAnimationPositions(positions);
    };
    calculateMaxCards();
    window.addEventListener('resize', calculateMaxCards);
    return () => window.removeEventListener('resize', calculateMaxCards);
  }, []);

  // Optimized landing page card animation with requestAnimationFrame
  useEffect(() => {
    setIsVisible(true);
    
    if (gameState === 'landing') {
      let animationId;
      let lastTime = 0;
      const animationDuration = 2000; // 2 seconds per card
      
      const animate = (currentTime) => {
        if (currentTime - lastTime >= animationDuration) {
          setCurrentCard(prev => (prev + 1) % cards.length);
          lastTime = currentTime;
        }
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [gameState, cards.length]);

  // Simple wallet connection effect - just check if profile exists, no delays
  useEffect(() => {
    if (connected && publicKey) {
  
      setIsCheckingProfile(true);
      
      // Simple check - if profile doesn't exist, we'll handle it when user clicks Start Playing
      checkUserProfileExists(publicKey, currentUser).then(result => {
        
        setHoneycombProfileExists(result.exists);
        setIsCheckingProfile(false);
        
        // Check if user needs to be created
        if (result.needsCreation) {
  
          // We'll handle profile creation when user clicks "Start Playing"
        }
        
        // Check if data sync is needed - only show if there's a significant mismatch
        if (result.exists && result.needsSync && currentUser) {
  
          
          // Check if we've already shown the sync popup recently for this user
          const lastSyncTime = localStorage.getItem(`sync_popup_${currentUser.id}`);
          const now = Date.now();
          const timeSinceLastSync = lastSyncTime ? now - parseInt(lastSyncTime) : Infinity;
          
          // Only show sync popup if it's been more than 1 hour since last shown
          if (timeSinceLastSync > 3600000) { // 1 hour in milliseconds
            setSyncPopupData({
              firebaseData: currentUser,
              honeycombProfile: result.profile
            });
            setShowSyncPopup(true);
            localStorage.setItem(`sync_popup_${currentUser.id}`, now.toString());
    } else {
    
          }
        }
      }).catch(error => {

        setHoneycombProfileExists(false);
        setIsCheckingProfile(false);
      });
    } else {
      
      setHoneycombProfileExists(false);
      setIsCheckingProfile(false);
    }
  }, [connected, publicKey, currentUser]);

  // Debug useEffect to monitor honeycombProfileExists changes
  useEffect(() => {
  
  }, [honeycombProfileExists]);

  // Initialize user when wallet connects (always fetch from both Firebase and Honeycomb)
  useEffect(() => {

    
    if (publicKey && connected && wallet && signMessage) {
      const walletAddress = publicKey.toBase58();

      initializeUserFromBothSources(walletAddress);
    } else if (!publicKey) {

      setCurrentUser(null);
      setAchievements([]);
      setLeaderboardData([]);
      setHoneycombProfileExists(false);
    }
  }, [publicKey, connected, wallet, signMessage]);

  // Firebase real-time user data sync (always active when user exists)
  useEffect(() => {
    if (currentUser?.id) {
      const userRef = ref(db, `users/${currentUser.id}`);
      const unsubscribe = onValue(userRef, snapshot => {
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          
          // Merge Firebase data with current user data
          const updatedUserData = {
            ...currentUser,
            ...firebaseData,
            id: currentUser.id // Ensure ID doesn't change
          };
          
          // Only update if data actually changed
          if (JSON.stringify(updatedUserData) !== JSON.stringify(currentUser)) {
            setCurrentUser(updatedUserData);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser?.id]);

  /**
   * Clean up inactive rooms to prevent database bloat
   */
  const cleanupInactiveRooms = async () => {
    try {
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      
      if (!snapshot.exists()) {
        return;
      }
      
      const roomsData = snapshot.val();
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      const sixHoursAgo = now - (6 * 60 * 60 * 1000);
      
      const roomsToDelete = [];
      
      Object.keys(roomsData).forEach(roomId => {
        const room = roomsData[roomId];
        const roomCreatedAt = room.createdAt || 0;
        const lastActivity = room.lastActivity || roomCreatedAt;
        
        // Check if room is older than 6 hours
        if (roomCreatedAt < sixHoursAgo) {
          roomsToDelete.push(roomId);
          return;
        }
        
        // Check if room is stuck in starting phase for more than 5 minutes
        if (room.status === 'waiting' && lastActivity < fiveMinutesAgo) {
          roomsToDelete.push(roomId);
          return;
        }
        
        // Check if room is in countdown but no activity for 5+ minutes
        if (room.status === 'countdown' && lastActivity < fiveMinutesAgo) {
          roomsToDelete.push(roomId);
          return;
        }
        
        // Check if room is in playing but no activity for 5+ minutes
        if (room.status === 'playing' && lastActivity < fiveMinutesAgo) {
          roomsToDelete.push(roomId);
          return;
        }
      });
      
      // Delete inactive rooms
      if (roomsToDelete.length > 0) {
        const deletePromises = roomsToDelete.map(roomId => {
          const roomRef = ref(db, `rooms/${roomId}`);
          return remove(roomRef);
        });
        
        await Promise.all(deletePromises);
      }
      
    } catch (error) {
      console.error('Error during room cleanup:', error);
    }
  };

  // Set up room cleanup interval (runs every 2 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupInactiveRooms, 2 * 60 * 1000);
    
    // Run initial cleanup after 30 seconds
    const initialCleanup = setTimeout(cleanupInactiveRooms, 30 * 1000);
    
    return () => {
      clearInterval(cleanupInterval);
      clearTimeout(initialCleanup);
    };
  }, []);

  useEffect(() => {
    const roomsRef = ref(db, 'rooms');
    const unsubscribe = onValue(roomsRef, snapshot => {
      if (snapshot.exists()) {
        const roomsData = snapshot.val();
        if (roomsData) {
        const roomsList = Object.keys(roomsData).map(roomId => ({
          id: roomId,
          ...roomsData[roomId]
        })).filter(room => room.status === 'waiting' || room.status === 'countdown');
        setRooms(roomsList);
        } else {
          setRooms([]);
        }
      } else {
        setRooms([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize leaderboard with real-time updates
  useEffect(() => {
    if (currentUser) {
      initializeAchievements(currentUser);
      
      // Set up real-time leaderboard listener
      const lbRef = ref(db, 'leaderboard/users');
      const unsubscribe = onValue(lbRef, snapshot => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          if (snapshotData) {
            const data = Object.values(snapshotData);
            
            const sorted = data
              .sort((a, b) => (b.xp || 0) - (a.xp || 0)) // Sort by XP (highest first)
              .map((u, index) => ({
                rank: index + 1,
                name: (currentUser && u.id === currentUser.id) ? 'You' : (u.username || u.id),
                wins: u.gamesWon || 0,
                games: u.gamesPlayed || 0,
                winRate: u.gamesPlayed > 0 ? ((u.gamesWon || 0) / u.gamesPlayed * 100).toFixed(1) : '0.0',
                level: u.level || calculateLevel(u.xp || 0).level,
                xp: u.xp || 0
              }));
            
            setLeaderboardData(sorted);
          } else {
            setLeaderboardData([]);
          }
        } else {
          setLeaderboardData([]);
        }
      });
      
      return () => unsubscribe();
    } else {
      setAchievements([]);
      setLeaderboardData([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentRoom) {
      const roomRef = ref(db, `rooms/${currentRoom.id}`);
      const unsubscribe = onValue(roomRef, snapshot => {
        if (snapshot.exists()) {
          const roomData = {
            id: currentRoom.id,
            ...snapshot.val()
          };
          
          // Ensure current user is still in the room before updating
          if (roomData.players && currentUser && !roomData.players[currentUser.id]) {
            console.warn('Current user no longer in room players list, leaving room');
            leaveRoom();
            return;
          }
          
          setCurrentRoom(roomData);
          if (roomData.status === 'countdown' && roomData.countdown !== undefined) {
            setGameCountdown(roomData.countdown);
          } else {
            setGameCountdown(null);
          }
            if (roomData.status === 'playing' && roomData.gameData) {
            const newGameData = roomData.gameData;
            
            // Update gameData immediately - animations will be handled separately
            setGameData(newGameData);
            stopBackgroundMusic();
            setGameState('game');
            
            // Handle dealingCards phase transition (only for AI games)
            if (newGameData.gamePhase === 'dealingCards' && !currentRoom) {
              // Change game phase to playing immediately since cards are already dealt
              const updatedGameData = {
                ...newGameData,
                gamePhase: 'playing',
                lastAction: 'Game started!'
              };
              setGameData(updatedGameData);
              stopBackgroundMusic();
              setGameState('game');
              return; // Don't continue with the old data
            }
            
            // Only update gameData if no animations were triggered
            setGameData(newGameData);
            stopBackgroundMusic();
            setGameState('game');
            
            // Handle round end data for all players
            if (newGameData.gamePhase === 'roundEnd' && newGameData.roundEndData && !roundEndData) {
              setRoundEndData(newGameData.roundEndData);
              setTimeout(() => {
                setShowRoundEndPopup(true);
                setTimeout(() => startConfetti(), 200);
              }, 2500);
            }
          }
        } else {
          setCurrentRoom(null);
          setGameState('menu');
        }
      });
      return () => off(roomRef, 'value', unsubscribe);
    }
  }, [currentRoom?.id, currentUser, animationPositions]);



  // Listen for ready players in multiplayer
  useEffect(() => {
    if (currentRoom && gameData?.gamePhase === 'roundEnd') {

    }
  }, [currentRoom, gameData?.gamePhase]);

  // Stop game music when game ends
  useEffect(() => {
    if (gameData?.gamePhase === 'gameEnd') {
      
      soundEffects.stopGameMusic();
    }
  }, [gameData?.gamePhase]);



  // Initialize user from both Firebase and Honeycomb sources
  const initializeUserFromBothSources = async walletAddress => {
    try {
  
      
      // First, try to get data from both sources simultaneously
      const [firebaseData, honeycombData] = await Promise.allSettled([
        getFirebaseUserData(walletAddress),
        getHoneycombUserData(walletAddress)
      ]);
      

      
      let userData = null;
      let dataSource = 'none';
      
             // Firebase is the primary storage - only use Honeycomb for new users
      if (firebaseData.status === 'fulfilled' && firebaseData.value) {
        // User exists in Firebase - use Firebase as primary source
        userData = firebaseData.value;
        dataSource = 'firebase';
  
        
        // Only sync to Honeycomb if wallet is connected and user has Honeycomb profile
        if (honeycombData.status === 'fulfilled' && honeycombData.value && honeycombData.value.honeycombProfile) {
    
          dataSource = 'firebase_with_honeycomb_sync';
        }
      } else if (honeycombData.status === 'fulfilled' && honeycombData.value) {
        // User exists in Honeycomb but not Firebase - this is a new user
        userData = honeycombData.value;
        dataSource = 'honeycomb_only';
  
      }
      
      if (userData) {
        // Ensure user data has all required fields
        const levelData = calculateLevel(userData.xp || 0);
        const completeUserData = {
          id: walletAddress,
          username: userData.username || `Player${Math.floor(Math.random() * 10000)}`,
          xp: userData.xp || 0,
          level: levelData.level,
          currentLevelXP: levelData.currentLevelXP,
          xpNeededForNext: levelData.xpNeededForNext,
          gamesPlayed: userData.gamesPlayed || 0,
          gamesWon: userData.gamesWon || 0,
          currentWinStreak: userData.currentWinStreak || 0,
          bestWinStreak: userData.bestWinStreak || 0,
          totalCardsPlayed: userData.totalCardsPlayed || 0,
          perfectWins: userData.perfectWins || 0,
          achievementsUnlocked: userData.achievementsUnlocked || [],
          claimedAchievements: userData.claimedAchievements || [],
          honeycombProfile: userData.honeycombProfile,
          createdAt: userData.createdAt || Date.now(),
          lastActive: Date.now()
        };
        
  
        setCurrentUser(completeUserData);
        setHoneycombProfileExists(!!userData.honeycombProfile);
        initializeAchievements(completeUserData);
        
        // Sync data to both sources if needed
        await syncUserDataToBothSources(completeUserData, dataSource);
        
        // Deferred Honeycomb syncing - sync any pending game stats
        if (publicKey && wallet && signMessage && completeUserData) {
          try {
                    // Check if there are any pending stats to sync
        const pendingStats = completeUserData.pendingHoneycombSync;
        if (pendingStats) {
          await updateGameStats({
            publicKey,
            wallet,
            signMessage,
            gameResult: pendingStats.gameResult,
            gameStats: pendingStats.gameStats,
            currentUser: completeUserData
          });
          // Clear pending sync
          update(ref(db, `users/${walletAddress}`), { pendingHoneycombSync: null });
        }
          } catch (error) {
            console.error('❌ Error syncing pending stats to Honeycomb:', error);
          }
        }
        
        return completeUserData;
      } else {
        // No existing data found, create new user
  
        return await createNewUser(walletAddress);
      }
      
    } catch (error) {
      console.error('❌ Error initializing user from both sources:', error);
      throw error;
    }
  };

  // Get user data from Firebase
  const getFirebaseUserData = async (walletAddress) => {
    try {
      const userRef = ref(db, `users/${walletAddress}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return { id: walletAddress, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching Firebase user data:', error);
      return null;
    }
  };

  // Get user data from Honeycomb
  const getHoneycombUserData = async (walletAddress) => {
    try {
      if (!publicKey || !wallet || !signMessage) {
        return null;
      }
      
      const loginResult = await loginUserProfile(publicKey);
      if (loginResult.exists && loginResult.profile) {
        const levelData = calculateLevel(loginResult.profile.xp || 0);
        return {
          id: walletAddress,
          username: loginResult.profile.username,
          xp: loginResult.profile.xp,
          level: levelData.level,
          currentLevelXP: levelData.currentLevelXP,
          xpNeededForNext: levelData.xpNeededForNext,
          gamesPlayed: loginResult.profile.gamesPlayed,
          gamesWon: loginResult.profile.gamesWon,
          currentWinStreak: loginResult.profile.currentWinStreak,
          bestWinStreak: loginResult.profile.bestWinStreak,
          totalCardsPlayed: loginResult.profile.totalCardsPlayed,
          perfectWins: loginResult.profile.perfectWins,
          achievementsUnlocked: loginResult.profile.badges?.map(b => b.badgeCriteria) || [],
          claimedAchievements: loginResult.profile.badges?.map(b => b.badgeCriteria) || [],
          honeycombProfile: loginResult.profile,
          createdAt: loginResult.profile.createdAt,
          lastActive: loginResult.profile.lastActive
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching Honeycomb user data:', error);
      return null;
    }
  };

  // Sync user data to both Firebase and Honeycomb
  const syncUserDataToBothSources = async (userData, currentSource) => {
    try {
  
      
      // Always sync to Firebase (especially important for honeycomb_only case)
      const userRef = ref(db, `users/${userData.id}`);
      const sanitizedUserData = removeUndefinedValues(userData);
      await set(userRef, {
        ...sanitizedUserData,
        lastActive: serverTimestamp()
      });
      
      
      // Sync to Honeycomb based on data source
      if (publicKey && wallet && signMessage && connected) {

        
        if (currentSource === 'firebase_with_honeycomb_sync') {
          // Sync Firebase data to Honeycomb (Firebase is primary)
          try {
            await updateUserProfileWithSOLManagement(
              publicKey,
              wallet,
              signMessage,
              {
                username: userData.username,
                xp: userData.xp,
                gamesPlayed: userData.gamesPlayed,
                gamesWon: userData.gamesWon,
                totalCardsPlayed: userData.totalCardsPlayed,
                perfectWins: userData.perfectWins,
                currentWinStreak: userData.currentWinStreak,
                bestWinStreak: userData.bestWinStreak
              }
            );

          } catch (honeycombError) {
            console.warn('⚠️ Failed to sync Firebase data to Honeycomb:', honeycombError.message);
          }
        } else if (currentSource === 'honeycomb_only') {
          // New user from Honeycomb - no need to sync back since we just synced to Firebase

        } else if (currentSource === 'new') {
          // Brand new user - no Honeycomb profile yet, so no sync needed

        }
      } else {

      }
      
      // Update leaderboard
      await updateLeaderboardEntry(userData);
      
    } catch (error) {
      console.error('❌ Error syncing user data:', error);
    }
  };

  // Create new user in both Firebase and Honeycomb
  const createNewUser = async (walletAddress) => {
    try {
  
      
      // Try to create Honeycomb profile first
      let honeycombProfile = null;
      if (publicKey && wallet && signMessage) {
        try {
          honeycombProfile = await createUserProfileWithSOLManagement(
            publicKey,
            wallet,
            signMessage,
            `Player${Math.floor(Math.random() * 10000)}`
          );
      
        } catch (honeycombError) {
          console.warn('⚠️ Failed to create Honeycomb profile:', honeycombError.message);
        }
      }
      
      // Create Firebase user data
      const levelData = calculateLevel(0);
      const newUserData = {
        id: walletAddress,
        username: honeycombProfile?.username || `Player${Math.floor(Math.random() * 10000)}`,
        xp: 0,
        level: levelData.level,
        currentLevelXP: levelData.currentLevelXP,
        xpNeededForNext: levelData.xpNeededForNext,
        gamesPlayed: 0,
        gamesWon: 0,
        currentWinStreak: 0,
        bestWinStreak: 0,
        totalCardsPlayed: 0,
        perfectWins: 0,
        achievementsUnlocked: [],
        claimedAchievements: [],
        honeycombProfile: honeycombProfile,
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      
      // Sync to both sources
      await syncUserDataToBothSources(newUserData, 'new');
      
  
      setCurrentUser(newUserData);
      setHoneycombProfileExists(!!honeycombProfile);
      initializeAchievements(newUserData);
      
      return newUserData;
      
    } catch (error) {
      console.error('❌ Error creating new user:', error);
      throw error;
    }
  };

  const initializeUser = async walletAddress => {
    try {
  
      
              // Check if wallet is connected for Honeycomb integration
        if (publicKey && wallet) {
        
        // Ensure wallet is properly connected and has required methods
        if (!wallet?.connected || !wallet?.signAllTransactions || !signMessage) {
  
          throw new Error('Wallet not properly connected');
        }
        
        try {
          // Debug: Check API status
          const apiStatus = getApiStatus();

          
          // Debug: Check if project exists
          const projectExists = await checkProjectExists();

          
          // First, try to login to existing Honeycomb profile
          const loginResult = await loginUserProfile(publicKey);
          
          if (loginResult.exists && loginResult.profile) {

            
            // Convert Honeycomb profile to app format
            const levelData = calculateLevel(loginResult.profile.xp || 0);
            const userData = {
              id: walletAddress,
              username: loginResult.profile.username,
              xp: loginResult.profile.xp,
              level: levelData.level,
              currentLevelXP: levelData.currentLevelXP,
              xpNeededForNext: levelData.xpNeededForNext,
              gamesPlayed: loginResult.profile.gamesPlayed,
              gamesWon: loginResult.profile.gamesWon,
              currentWinStreak: loginResult.profile.currentWinStreak,
              bestWinStreak: loginResult.profile.bestWinStreak,
              totalCardsPlayed: loginResult.profile.totalCardsPlayed,
              perfectWins: loginResult.profile.perfectWins,
              achievementsUnlocked: loginResult.profile.badges?.map(b => b.badgeCriteria) || [],
              claimedAchievements: loginResult.profile.badges?.map(b => b.badgeCriteria) || [],
              createdAt: loginResult.profile.createdAt,
              lastActive: loginResult.profile.lastActive,
              honeycombProfile: loginResult.profile
            };
            
            setCurrentUser(userData);
            initializeAchievements(userData);
            
            // Also update Firebase for compatibility
            const userRef = ref(db, `users/${walletAddress}`);
            await set(userRef, userData);
            
            return;
          } else {

            
            // Create new Honeycomb profile
            setIsCreatingProfile(true);
            setProfileCreationError(null);
            
            try {
              const newHoneycombProfile = await createUserProfileWithSOLManagement(
                publicKey, 
                wallet,
                signMessage,
                `Player${Math.floor(Math.random() * 10000)}`
              );
              
              if (newHoneycombProfile.success) {

                
                // Check if this is a mock profile
                if (newHoneycombProfile.isMock) {

                }
                
                // Create app user data
                const levelData = calculateLevel(0);
                const newUser = {
                  id: walletAddress,
                  username: newHoneycombProfile.username,
                  xp: newHoneycombProfile.xp,
                  level: levelData.level,
                  currentLevelXP: levelData.currentLevelXP,
                  xpNeededForNext: levelData.xpNeededForNext,
                  gamesPlayed: newHoneycombProfile.gamesPlayed,
                  gamesWon: newHoneycombProfile.gamesWon,
                  currentWinStreak: 0,
                  bestWinStreak: 0,
                  totalCardsPlayed: 0,
                  perfectWins: 0,
                  achievementsUnlocked: [],
                  claimedAchievements: [],
                  createdAt: newHoneycombProfile.createdAt,
                  lastActive: newHoneycombProfile.lastActive,
                  honeycombProfile: newHoneycombProfile,
                  isMockProfile: newHoneycombProfile.isMock || false
                };
                
                setCurrentUser(newUser);
                initializeAchievements(newUser);
                
                // Also update Firebase for compatibility
                const userRef = ref(db, `users/${walletAddress}`);
                await set(userRef, newUser);
                
                // Update leaderboard with new user data
                const leaderboardRef = ref(db, `leaderboard/users/${walletAddress}`);
                const leaderboardData = {
                  id: walletAddress,
                  username: newUser.username,
                  xp: newUser.xp,
                  level: newUser.level,
                  gamesPlayed: newUser.gamesPlayed,
                  gamesWon: newUser.gamesWon,
                  winRate: newUser.gamesPlayed > 0 ? (newUser.gamesWon / newUser.gamesPlayed * 100) : 0,
                  totalCardsPlayed: newUser.totalCardsPlayed,
                  perfectWins: newUser.perfectWins,
                  currentWinStreak: newUser.currentWinStreak,
                  bestWinStreak: newUser.bestWinStreak,
                  lastActive: serverTimestamp()
                };
                await set(leaderboardRef, leaderboardData);
            
                
                return;
              }
            } catch (honeycombError) {
              console.error('❌ Honeycomb profile creation failed:', honeycombError);
              setProfileCreationError(honeycombError.message || 'Failed to create profile');
              
              // If it's a user rejection, don't fall back to Firebase
              if (honeycombError.message && honeycombError.message.includes('cancelled')) {
            
                return;
              }
            } finally {
              setIsCreatingProfile(false);
            }
          }
        } catch (honeycombError) {
          console.error('❌ Honeycomb integration failed:', honeycombError);
          // Continue to Firebase fallback
          }
        }
      
      // Fallback to Firebase-only user
  
      const userRef = ref(db, `users/${walletAddress}`);
      const unsubscribe = onValue(userRef, async snapshot => {
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          const levelData = calculateLevel(firebaseData.xp || 0);
          const userData = {
            id: walletAddress,
            ...firebaseData,
            level: levelData.level,
            currentLevelXP: levelData.currentLevelXP,
            xpNeededForNext: levelData.xpNeededForNext,
            totalCardsPlayed: firebaseData.totalCardsPlayed || 0,
            perfectWins: firebaseData.perfectWins || 0,
            currentWinStreak: firebaseData.currentWinStreak || 0,
            bestWinStreak: firebaseData.bestWinStreak || 0
          };
          setCurrentUser(userData);
          initializeAchievements(userData);
          await update(userRef, {
            lastActive: serverTimestamp(),
            level: levelData.level,
            currentLevelXP: levelData.currentLevelXP,
            xpNeededForNext: levelData.xpNeededForNext,
            totalCardsPlayed: firebaseData.totalCardsPlayed || 0,
            perfectWins: firebaseData.perfectWins || 0,
            currentWinStreak: firebaseData.currentWinStreak || 0,
            bestWinStreak: firebaseData.bestWinStreak || 0
          });
          
          // Update leaderboard with user data
          const leaderboardRef = ref(db, `leaderboard/users/${walletAddress}`);
          const leaderboardData = {
            id: walletAddress,
            username: userData.username,
            xp: userData.xp,
            level: userData.level,
            gamesPlayed: userData.gamesPlayed,
            gamesWon: userData.gamesWon,
            winRate: userData.gamesPlayed > 0 ? (userData.gamesWon / userData.gamesPlayed * 100) : 0,
            totalCardsPlayed: userData.totalCardsPlayed || 0,
            perfectWins: userData.perfectWins || 0,
            currentWinStreak: userData.currentWinStreak || 0,
            bestWinStreak: userData.bestWinStreak || 0,
            lastActive: serverTimestamp()
          };
          await set(leaderboardRef, leaderboardData);
      
        } else {
          const levelData = calculateLevel(0);
          const newUserData = {
            id: walletAddress,
            username: `Player${Math.floor(Math.random() * 10000)}`,
            xp: 0,
            level: levelData.level,
            currentLevelXP: levelData.currentLevelXP,
            xpNeededForNext: levelData.xpNeededForNext,
            gamesPlayed: 0,
            gamesWon: 0,
            totalCardsPlayed: 0,
            perfectWins: 0,
            currentWinStreak: 0,
            bestWinStreak: 0,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
          };
          setCurrentUser(newUserData);
          initializeAchievements(newUserData);
          await set(userRef, newUserData);
          
          // Update leaderboard with new user data
          const leaderboardRef = ref(db, `leaderboard/users/${walletAddress}`);
          const leaderboardData = {
            id: walletAddress,
            username: newUserData.username,
            xp: newUserData.xp,
            level: newUserData.level,
            gamesPlayed: newUserData.gamesPlayed,
            gamesWon: newUserData.gamesWon,
            winRate: newUserData.gamesPlayed > 0 ? (newUserData.gamesWon / newUserData.gamesPlayed * 100) : 0,
            totalCardsPlayed: newUserData.totalCardsPlayed || 0,
            perfectWins: newUserData.perfectWins || 0,
            currentWinStreak: newUserData.currentWinStreak || 0,
            bestWinStreak: newUserData.bestWinStreak || 0,
            lastActive: serverTimestamp()
          };
          await set(leaderboardRef, leaderboardData);
      
        }
        onDisconnect(userRef).update({
          lastActive: serverTimestamp()
        });
      });
      return unsubscribe;
  } catch (error) {
      console.error('Error initializing user:', error);
      const levelData = calculateLevel(0);
      setCurrentUser({
        id: walletAddress,
        username: `Player${Math.floor(Math.random() * 10000)}`,
        xp: 0,
        level: levelData.level,
        currentLevelXP: levelData.currentLevelXP,
        xpNeededForNext: levelData.xpNeededForNext,
        gamesPlayed: 0,
        gamesWon: 0,
        totalCardsPlayed: 0,
        perfectWins: 0,
        currentWinStreak: 0,
        bestWinStreak: 0
      });
    }
  };

  const initializeAchievements = userData => {
    if (!userData) return;
    const userXP = userData?.xp || 0;
    const userGamesPlayed = userData?.gamesPlayed || 0;
    const userGamesWon = userData?.gamesWon || 0;
    const userLevel = calculateLevel(userXP).level;
    const userPerfectWins = userData?.perfectWins || 0;
    const userTotalCardsPlayed = userData?.totalCardsPlayed || 0;
    
    // Get Honeycomb badges from Firebase if available
    const honeycombBadges = userData?.honeycombBadges || [];
    
    // Match the BADGE_CRITERIA constants from honeycombBadges.js
    const achievementsList = [
      { id: 0, name: 'First Victory', description: 'Win your first game', unlocked: userGamesWon >= 1, claimed: honeycombBadges.some(b => b.index === 0), icon: '🏆', reward: '100 XP' },
      { id: 1, name: 'Card Master', description: 'Master all card types', unlocked: userTotalCardsPlayed >= 100, claimed: honeycombBadges.some(b => b.index === 1), icon: '🎯', reward: '200 XP' },
      { id: 2, name: 'Shadow Warrior', description: 'Win a game without losing a life', unlocked: userPerfectWins >= 1, claimed: honeycombBadges.some(b => b.index === 2), icon: '⚔️', reward: '500 XP' },
      { id: 3, name: 'Strategic Mind', description: 'Win 10 games with strategic plays', unlocked: userGamesWon >= 10, claimed: honeycombBadges.some(b => b.index === 3), icon: '🧠', reward: '1200 XP' },
      { id: 4, name: 'Century Club', description: 'Play 100 games', unlocked: userGamesPlayed >= 100, claimed: honeycombBadges.some(b => b.index === 4), icon: '💯', reward: '1500 XP' },
      { id: 5, name: 'Ultimate Champion', description: 'Win 50 games', unlocked: userGamesWon >= 50, claimed: honeycombBadges.some(b => b.index === 5), icon: '🌟', reward: '2000 XP' },
      { id: 6, name: 'Legendary Player', description: 'Reach level 50', unlocked: userLevel >= 50, claimed: honeycombBadges.some(b => b.index === 6), icon: '👑', reward: '3000 XP' },
      { id: 7, name: 'Whot Grandmaster', description: 'Achieve all other badges', unlocked: honeycombBadges.length >= 7, claimed: honeycombBadges.some(b => b.index === 7), icon: '💎', reward: '5000 XP' }
    ];
    setAchievements(achievementsList);
  };

  // Sync Firebase data to Honeycomb
  const handleSyncToHoneycomb = async () => {

    
    if (!syncPopupData || !publicKey || !wallet || !signMessage) {
      console.error('❌ Missing required data for sync');
      return;
    }
    
    try {

      
      const result = await syncFirebaseToHoneycomb(
        publicKey,
        syncPopupData.firebaseData,
        wallet,
        signMessage
      );
      
      if (result.success) {

        setShowSyncPopup(false);
        setSyncPopupData(null);
        
        // Wait a moment for Honeycomb data to be updated

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh profile check
        const profileResult = await checkUserProfileExists(publicKey, syncPopupData.firebaseData);
        setHoneycombProfileExists(profileResult.exists);
      } else {
        console.error('❌ Sync failed:', result.error);
        // You could show an error message here
      }
    } catch (error) {
      console.error('❌ Error during sync:', error);
    }
  };



  // Update leaderboard entry
  const updateLeaderboardEntry = async (userData) => {
    try {
      const leaderboardRef = ref(db, `leaderboard/users/${userData.id}`);
      const leaderboardData = {
        id: userData.id,
        username: userData.username,
        xp: userData.xp,
        level: userData.level,
        gamesPlayed: userData.gamesPlayed,
        gamesWon: userData.gamesWon,
        winRate: userData.gamesPlayed > 0 ? (userData.gamesWon / userData.gamesPlayed * 100) : 0,
        totalCardsPlayed: userData.totalCardsPlayed,
        perfectWins: userData.perfectWins,
        currentWinStreak: userData.currentWinStreak,
        bestWinStreak: userData.bestWinStreak,
        lastActive: serverTimestamp()
      };
      await set(leaderboardRef, leaderboardData);

    } catch (error) {
      console.error('❌ Error updating leaderboard entry:', error);
    }
  };



  const updateUsername = async (newUsernameValue, newBioValue = null) => {
    if (!currentUser || !newUsernameValue.trim()) return;
    try {

      
      const updateData = { username: newUsernameValue.trim() };
      
      // Also update bio if provided
      if (newBioValue !== null) {
        updateData.bio = newBioValue.trim();
      }
      
      // Update Firebase
      const userRef = ref(db, `users/${currentUser.id}`);
      await update(userRef, updateData);

      
      // Update Honeycomb if wallet is connected
      if (publicKey && wallet && signMessage) {
        try {
          await updateProfileInfo({
            publicKey,
            wallet,
            signMessage,
            username: newUsernameValue.trim(),
            bio: newBioValue !== null ? newBioValue.trim() : currentUser.bio || ''
          });

        } catch (honeycombError) {
          console.error('❌ Failed to update Honeycomb username:', honeycombError);
        }
      }
      
      // Update local state
      setCurrentUser(prev => ({ 
        ...prev, 
        username: newUsernameValue.trim(),
        ...(newBioValue !== null && { bio: newBioValue.trim() })
      }));
      
      // Update leaderboard
      await updateLeaderboardEntry({
        ...currentUser,
        username: newUsernameValue.trim(),
        ...(newBioValue !== null && { bio: newBioValue.trim() })
      });
      
      setIsEditingUsername(false);
      setNewUsername('');

    } catch (error) {
      console.error('❌ Error updating username:', error);
    }
  };

  const claimAchievement = async (achievementId) => {
    if (!currentUser) return;
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.unlocked || achievement.claimed) return;
    
    try {
  
      
      // Claim badge in Honeycomb if wallet is connected
      if (publicKey && wallet && signMessage) {
        try {
          await claimBadge({
            publicKey,
            wallet,
            signMessage,
            badgeCriteria: achievementId
          });
          
  
          
          // Update local achievement state
          setAchievements(prev => prev.map(a => 
            a.id === achievementId ? { ...a, claimed: true } : a
          ));
          
          // Refresh user profile to get updated XP from claimed badge
          if (publicKey) {
            try {
              const loginResult = await loginUserProfile(publicKey);
              if (loginResult.exists && loginResult.profile) {
                const levelData = calculateLevel(loginResult.profile.xp || 0);
                const updatedUserData = {
                  ...currentUser,
                  xp: loginResult.profile.xp,
                  level: levelData.level,
                  currentLevelXP: levelData.currentLevelXP,
                  xpNeededForNext: levelData.xpNeededForNext,
                  claimedAchievements: loginResult.profile.badges?.map(b => b.badgeCriteria) || []
                };
                
                setCurrentUser(updatedUserData);
                
                // Update Firebase with new data
                const userRef = ref(db, `users/${currentUser.id}`);
                await update(userRef, {
                  xp: loginResult.profile.xp,
                  level: levelData.level,
                  currentLevelXP: levelData.currentLevelXP,
                  xpNeededForNext: levelData.xpNeededForNext,
                  claimedAchievements: loginResult.profile.badges?.map(b => b.badgeCriteria) || []
                });
                
                // Update leaderboard with new XP and level
                const leaderboardRef = ref(db, `leaderboard/users/${currentUser.id}`);
                await update(leaderboardRef, {
                  xp: loginResult.profile.xp,
                  level: levelData.level
                });
                
        
              }
            } catch (error) {
              console.error('❌ Error refreshing user profile after claiming:', error);
            }
          }
          
        } catch (error) {
          console.error(`❌ Error claiming achievement in Honeycomb: ${achievementId}`, error);
          
          // Fallback to Firebase function if Honeycomb fails
      const claimFn = httpsCallable(fbFunctions, 'claimAchievement');
      await claimFn({ userId: currentUser.id, achievementId });
          
      // Refresh user profile snapshot and update level data
      const userRef = ref(db, `users/${currentUser.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        const levelData = calculateLevel(firebaseData.xp || 0);
        const updatedUserData = {
          id: currentUser.id,
          ...firebaseData,
          level: levelData.level,
          currentLevelXP: levelData.currentLevelXP,
          xpNeededForNext: levelData.xpNeededForNext
        };
        setCurrentUser(updatedUserData);
        // Update Firebase with new level data
        await update(userRef, {
          level: levelData.level,
          currentLevelXP: levelData.currentLevelXP,
          xpNeededForNext: levelData.xpNeededForNext
        });
            
            // Update leaderboard with new level data
            const leaderboardRef = ref(db, `leaderboard/users/${currentUser.id}`);
            await update(leaderboardRef, {
              level: levelData.level
            });
            
    
      }
      setAchievements(prev => prev.map(a => a.id === achievementId ? { ...a, claimed: true } : a));
        }
      } else {
        // Fallback to Firebase function if no wallet
        const claimFn = httpsCallable(fbFunctions, 'claimAchievement');
        await claimFn({ userId: currentUser.id, achievementId });
        
        // Refresh user profile snapshot and update level data
        const userRef = ref(db, `users/${currentUser.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          const levelData = calculateLevel(firebaseData.xp || 0);
          const updatedUserData = {
            id: currentUser.id,
            ...firebaseData,
            level: levelData.level,
            currentLevelXP: levelData.currentLevelXP,
            xpNeededForNext: levelData.xpNeededForNext
          };
          setCurrentUser(updatedUserData);
          // Update Firebase with new level data
          await update(userRef, {
            level: levelData.level,
            currentLevelXP: levelData.currentLevelXP,
            xpNeededForNext: levelData.xpNeededForNext
          });
          
          // Update leaderboard with new level data
          const leaderboardRef = ref(db, `leaderboard/users/${currentUser.id}`);
          await update(leaderboardRef, {
            level: levelData.level
          });
          
  
        }
        setAchievements(prev => prev.map(a => a.id === achievementId ? { ...a, claimed: true } : a));
      }
      
  
      
    } catch (error) {
      console.error('❌ Error claiming achievement:', error);
    }
  };

  const calculateLevel = (xp) => {
    let totalXPNeeded = 0;
    let level = 1;
    while (level <= 100) {
      const xpForThisLevel = 100 + (level - 1) * 150 + Math.floor((level - 1) / 10) * 500;
      if (totalXPNeeded + xpForThisLevel > xp) {
        break;
      }
      totalXPNeeded += xpForThisLevel;
      level++;
    }
    return {
      level: Math.min(level, 100),
      currentLevelXP: xp - totalXPNeeded,
      xpNeededForNext: level <= 100 ? 100 + level * 150 + Math.floor(level / 10) * 500 : 0,
      totalXP: xp
    };
  };

  const getXPFromGame = (won, roundsPlayed, cardsPlayed) => {
    let baseXP = 50;
    if (won) baseXP += 100;
    baseXP += roundsPlayed * 25;
    baseXP += Math.floor(cardsPlayed / 5) * 10;
    return baseXP;
  };

  // Check for unlockable achievements based on user stats
  const checkAndUnlockAchievements = async (userData) => {
    if (!publicKey) return;
    

    
    try {
      // Check for unlockable badges using the Honeycomb badge system
      const unlockableBadges = await checkUnlockableBadges({
        publicKey,
        stats: userData,
        currentUser: userData
      });
      
      if (unlockableBadges.length > 0) {
    
        
        // Show achievement popup for unlockable badges
        setAchievementPopupData({
          achievements: unlockableBadges.map(badge => ({
            id: badge.index,
            title: badge.name,
            description: badge.description,
            unlocked: true,
            claimed: false // Ready to be claimed manually
          }))
        });
        setShowAchievementPopup(true);
      }
      
    } catch (error) {
      console.error('❌ Error checking unlockable achievements:', error);
    }
  };



    // Comprehensive game tracking and statistics update with bidirectional sync
  const updateGameStatistics = async (gameData, isWinner, gameMode = 'ai') => {
    if (!currentUser) {
      return null;
    }



    // Calculate game statistics
    const roundsPlayed = gameData.roundNumber || 1;
    // Each game gives 5 "cards" for achievement tracking
    const cardsPlayed = 5;
    const perfectWin = isWinner && roundsPlayed === 1;
    const xpEarned = getXPFromGame(isWinner, roundsPlayed, cardsPlayed);

    // Prepare update data
    const updateData = {
      gamesPlayed: (currentUser.gamesPlayed || 0) + 1,
      gamesWon: isWinner ? (currentUser.gamesWon || 0) + 1 : (currentUser.gamesWon || 0),
      xp: (currentUser.xp || 0) + xpEarned,
      currentWinStreak: isWinner ? (currentUser.currentWinStreak || 0) + 1 : 0,
      bestWinStreak: isWinner ? Math.max((currentUser.currentWinStreak || 0) + 1, currentUser.bestWinStreak || 0) : (currentUser.bestWinStreak || 0),
      totalCardsPlayed: (currentUser.totalCardsPlayed || 0) + cardsPlayed,
      lastActive: serverTimestamp()
    };

    // Add perfect wins tracking
    if (perfectWin) {
      updateData.perfectWins = (currentUser.perfectWins || 0) + 1;
    }

    // Calculate new level data
    const newXP = updateData.xp;
    const levelData = calculateLevel(newXP);
    const updatedUserData = {
      ...currentUser,
      ...updateData,
      level: levelData.level,
      currentLevelXP: levelData.currentLevelXP,
      xpNeededForNext: levelData.xpNeededForNext
    };

    // Update Firebase
    try {
      const userRef = ref(db, `users/${currentUser.id}`);
      const firebaseUpdateData = {
        ...updateData,
        level: levelData.level,
        currentLevelXP: levelData.currentLevelXP,
        xpNeededForNext: levelData.xpNeededForNext
      };
      
      await update(userRef, firebaseUpdateData);
  
    } catch (error) {
      console.error('❌ Error updating Firebase stats:', error);
    }

    // Update Honeycomb if wallet is connected
    if (publicKey && wallet && signMessage) {
      try {
        const honeycombGameStats = {
          xp: xpEarned,
          cardsPlayed: cardsPlayed,
          perfectWin: perfectWin,
          gameMode: gameMode,
          roundsPlayed: roundsPlayed
        };

        // Store pending Honeycomb sync data for later
        const pendingSyncData = {
          gameResult: isWinner ? 'win' : 'loss',
          gameStats: honeycombGameStats,
          timestamp: Date.now()
        };
        
        // Update Firebase with pending sync data
        await update(ref(db, `users/${currentUser.id}`), {
          pendingHoneycombSync: pendingSyncData
        });
        

      } catch (error) {
        console.error('❌ Error in deferred Honeycomb sync:', error);
      }
    }

    // Update leaderboard
    await updateLeaderboardEntry(updatedUserData);

    // Update local state
    setCurrentUser(updatedUserData);




    return updatedUserData;
  };

  const startConfetti = () => {
    setConfettiActive(true);
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#80142C', '#a01d39', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.1
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.rotation += particle.rotationSpeed;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation * Math.PI / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
        if (particle.y > canvas.height + 50) {
          particles.splice(index, 1);
        }
      });
      if (particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        setConfettiActive(false);
      }
    };
    animate();
  };

  const createDeck = () => {
    const deck = [];
    let cardIdCounter = 0;
    const cardDefinitions = [
      { shape: '●', numbers: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14] },
      { shape: '▲', numbers: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14] },
      { shape: '✚', numbers: [1, 2, 3, 5, 7, 10, 11, 13, 14] },
      { shape: '■', numbers: [1, 2, 3, 5, 7, 10, 11, 13, 14] },
      { shape: '★', numbers: [1, 2, 3, 4, 5, 7, 8] }
    ];
    const createdCards = new Map();
    cardDefinitions.forEach(({ shape, numbers }) => {
      numbers.forEach(number => {
        const cardKey = `${shape}-${number}`;
        if (createdCards.has(cardKey)) {
          console.error(`CRITICAL ERROR: Attempted to create duplicate card: ${cardKey}`);
          throw new Error(`Duplicate card creation attempted: ${cardKey}`);
        }
        const card = { shape, number, id: `unique-${shape}-${number}-${Date.now()}-${cardIdCounter++}` };
        if (number === 1) card.special = 'holdon';
        else if (number === 2) card.special = 'pick2';
        else if (number === 14) card.special = 'generalmarket';
        createdCards.set(cardKey, true);
        deck.push(card);
      });
    });
    for (let i = 0; i < 5; i++) {
      deck.push({ shape: '🔥', number: 'WHOT', id: `whot-${i}-${Date.now()}-${cardIdCounter++}`, special: 'whot' });
    }
    const regularCards = deck.filter(card => card.special !== 'whot');
    const cardKeys = regularCards.map(card => `${card.shape}-${card.number}`);
    const uniqueKeys = new Set(cardKeys);
    if (cardKeys.length !== uniqueKeys.size) {
      console.error('CRITICAL: Duplicate cards found in deck after creation!');
      
      const duplicates = cardKeys.filter((key, index) => cardKeys.indexOf(key) !== index);
      console.error('Duplicate cards found:', [...new Set(duplicates)]);
      throw new Error('Deck creation failed - duplicate cards detected');
    }
    
    return deck;
  };

  const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };



  const startDealingAnimation = async (deckToDeal, players, cardsPerPlayer) => {
    // Safety check to prevent map operations on undefined data
    if (!deckToDeal || !players || !Array.isArray(players) || players.length === 0) {
      console.error('❌ Invalid parameters for dealing animation:', { deckToDeal, players, cardsPerPlayer });
      setIsAnyAnimationInProgress(false);
      return;
    }
    

    
    setIsAnyAnimationInProgress(true);
    const totalCardsToDistribute = players.length * cardsPerPlayer;
    
    for (let i = 0; i < totalCardsToDistribute; i++) {
      const currentPlayerIndex = i % players.length;
      const currentPlayer = players[currentPlayerIndex];
      const cardToDeal = deckToDeal[i];
      
      let visualPlayerIndex = currentPlayerIndex;
      if (currentRoom && gameData) {
        const mapping = getVisualPlayerMapping(currentRoom, currentUser);
        visualPlayerIndex = mapping.actualToVisual[currentPlayerIndex] !== undefined ? mapping.actualToVisual[currentPlayerIndex] : currentPlayerIndex;
      }
      
      // Use the same animation logic as draw cards
      const animatingCard = {
        ...cardToDeal,
        id: `dealing-${Date.now()}-${i}`,
        startPos: {
          ...getTopMarketCardPosition(),
          position: 'fixed',
          zIndex: 1000
        },
        endPos: {
          ...animationPositions.drawEnds[visualPlayerIndex],
          opacity: 0,
          position: 'fixed',
          zIndex: 1000
        },
        isPlayerCard: false
      };
      
      setAnimatingCards(prev => [...prev, animatingCard]);
      
            // Play the 'deal' sound effect immediately
      playSoundEffect.deal();
      
      // Start animation with staggered timing
      setTimeout(() => {
        setAnimatingCards(prev => prev.filter(c => c.id !== animatingCard.id));
        
        // Update the game state immediately after animation completes
        setGameData(prevData => {
          // Safety check to prevent map operations on undefined data
          if (!prevData || !prevData.players || !Array.isArray(prevData.players)) {
            console.error('❌ Invalid game data during dealing animation:', prevData);
            return prevData;
          }
          
          const newData = { ...prevData };
          const updatedPlayers = newData.players.map(p => ({ ...p, cards: [...p.cards] }));
          const actualPlayerIndex = updatedPlayers.findIndex(p => p.id === currentPlayer.id);
          if (actualPlayerIndex !== -1 && !updatedPlayers[actualPlayerIndex].eliminated) {
            updatedPlayers[actualPlayerIndex].cards.push(cardToDeal);
          }
          return {
            ...newData,
            players: updatedPlayers,
            drawPile: deckToDeal.slice(i + 1)
          };
        });
      }, 450); // 50% slower animation duration
      
      // Stagger the next card to start when this one is 50% through
      if (i < totalCardsToDistribute - 1) {
        await new Promise(resolve => setTimeout(resolve, 225)); // 50% of 450ms
      }
    }
    const remainingDeck = deckToDeal.slice(totalCardsToDistribute);
    if (remainingDeck.length > 0) {
      const playCard = remainingDeck[0];

      const endPosition = getPlayPilePosition(0, false);
      setPlayPileCardPositions(prev => ({
        ...prev,
        [0]: endPosition
      }));
      const playPileCard = {
        ...playCard,
        id: `dealing-play-${Date.now()}`,
        startPos: {
          ...getTopMarketCardPosition(),
          position: 'fixed',
          zIndex: 1000
        },
        endPos: {
          ...animationPositions.playPile,
          transform: `${animationPositions.playPile.transform} ${endPosition.transform}`,
          zIndex: endPosition.zIndex,
          position: 'fixed'
        },
        isPlayerCard: true
      };
      setAnimatingCards(prev => [...prev, playPileCard]);
      playSoundEffect.deal();
      await new Promise(resolve => {
        setTimeout(() => {
          setAnimatingCards(prev => prev.filter(c => c.id !== playPileCard.id));
          const initialCardEffects = {};
          let specialMessage = '';
          if (playCard.special === 'whot') {
            const shapes = ['●', '▲', '✚', '■', '★'];
            playCard.chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
            specialMessage = ` - Auto-chosen shape: ${playCard.chosenShape}`;
          }
          setGameData(prevData => {
            // Safety check to prevent map operations on undefined data
            if (!prevData) {
              console.error('❌ Invalid game data during dealing animation (play pile):', prevData);
              return prevData;
            }
            
            const newData = {
              ...prevData,
              playPile: [playCard],
              drawPile: remainingDeck.slice(1),
              gamePhase: 'playing',
              lastAction: prevData.roundNumber === 1 ? `Game started - ${playCard.number}${playCard.shape} played${specialMessage}` : `Round ${prevData.roundNumber}`,
              ...initialCardEffects,
              generalMarketDrawCount: initialCardEffects.generalMarketActive ? 0 : undefined,

              gameLog: {
                ...prevData.gameLog,
                [prevData.roundNumber]: prevData.roundNumber === 1 ? [...(prevData.gameLog[1] || []), `Initial card: ${playCard.number}${playCard.shape} placed on table${specialMessage}`] : [...(prevData.gameLog[prevData.roundNumber] || []), `Round ${prevData.roundNumber} begins`]
              }
            };
            if (newData.players[newData.currentPlayer].isAI) {
              setTimeout(() => {
                setIsAITurnInProgress(true);
                setTimeout(async () => {
                  if (!isAnyAnimationInProgress) {
                    await aiTurn({ ...newData });
                  }
                }, 1000);
              }, 500);
            }
            return newData;
          });
          resolve();
        }, 1000); // Increased delay for smoother play pile animation
      });
    }
    setIsAnyAnimationInProgress(false);
  };

  const animateDrawCards = async (gameDataToUse, player, count, isPending = false, isGeneral = false) => {
    setIsAnyAnimationInProgress(true);
    for (let i = 0; i < count; i++) {
      if (gameDataToUse.drawPile.length <= 1) {
        reshuffleMarket(gameDataToUse);
      }
      if (gameDataToUse.drawPile.length === 0) break;
      const drawnCard = gameDataToUse.drawPile[gameDataToUse.drawPile.length - 1];
      gameDataToUse.drawPile = gameDataToUse.drawPile.slice(0, -1);
      player.cards = [...player.cards, drawnCard];
      const players = ensurePlayersArray(gameDataToUse.players);
      const playerActualIndex = players.findIndex(p => p.id === player.id);
      let visualPlayerIndex = playerActualIndex;
      if (currentRoom) {
        const mapping = getVisualPlayerMapping(currentRoom, currentUser);
        visualPlayerIndex = mapping.actualToVisual[playerActualIndex] !== undefined ? mapping.actualToVisual[playerActualIndex] : playerActualIndex;
      }
      const animatingCard = {
        ...drawnCard,
        id: `draw-${Date.now()}-${i}`,
        startPos: {
          ...getTopMarketCardPosition(),
          position: 'fixed',
          zIndex: 1000
        },
        endPos: {
          ...animationPositions.drawEnds[visualPlayerIndex],
          opacity: 0,
          position: 'fixed',
          zIndex: 1000
        },
        isPlayerCard: false
      };
      setAnimatingCards(prev => [...prev, animatingCard]);
      // Play market sound immediately when card starts drawing
      playSoundEffect.market();
      await new Promise(resolve => {
        setTimeout(() => {
          setAnimatingCards(prev => prev.filter(c => c.id !== animatingCard.id));
          resolve();
        }, 1000); // Increased delay for smoother draw animation
      });
      await new Promise(resolve => setTimeout(resolve, 150)); // Increased pause between draw animations
    }
          const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    if (player.id === currentUserActualIndex || !currentRoom && player.id === 0) {
      const newTotal = player.cards.length;
      if (newTotal > maxVisiblePlayerCards) setPlayerScrollIndex(newTotal - maxVisiblePlayerCards);
      setIsPlayerActionInProgress(false);
    }
    // Only set log messages for AI games
    // Multiplayer handles logging separately to avoid conflicts
    if (!currentRoom) {
      gameDataToUse.lastAction = isPending ? `${player.name.split(' ')[0]} - pick${count}` : isGeneral ? `${player.name.split(' ')[0]} - market` : `${player.name.split(' ')[0]} - market`;
      gameDataToUse.gameLog = {
        ...gameDataToUse.gameLog,
        [gameDataToUse.roundNumber]: [...(gameDataToUse.gameLog[gameDataToUse.roundNumber] || []), isPending ? `${player.name} drew ${count} card${count > 1 ? 's' : ''} (penalty)` : isGeneral ? `${player.name} drew ${count} card${count > 1 ? 's' : ''} (general market)` : `${player.name} drew ${count} card${count > 1 ? 's' : ''} from market`]
      };
    }
    if (isPending) gameDataToUse.pendingPickCount = 0;
    
    // Only update game state and call nextTurn for AI games
    // Multiplayer handles state updates and turn transitions separately
    if (!currentRoom) {
      setGameData({
        ...gameDataToUse
      });
      setIsAnyAnimationInProgress(false);
      nextTurn(gameDataToUse);
    } else {
      // For multiplayer, just mark animation as complete
      // The calling function (drawMultiplayerCard) will handle state updates
      setIsAnyAnimationInProgress(false);
    }
    
    // Return the updated game data for multiplayer
    return gameDataToUse;
  };

  const reshuffleMarket = gameData => {
    if (gameData.playPile.length <= 1) return;
    const topCard = gameData.playPile[gameData.playPile.length - 1];
    const cardsToShuffle = gameData.playPile.slice(0, -1);
    gameData.drawPile = shuffleDeck(cardsToShuffle);
    gameData.playPile = [topCard];
    playSoundEffect.shuffle();
    const topCardPosition = playPileCardPositions[gameData.playPile.length - 1] || getPlayPilePosition(0, false);
    playPilePositionsRef.current = [playPilePositionsRef.current[gameData.playPile.length - 1] || {
      transform: 'translate(0px, 0px) rotate(0deg)',
      zIndex: 30
    }];
    setPlayPileCardPositions({
      0: topCardPosition
    });
    setNeedNewMarketPositions(true);
    gameData.lastAction += ' (Market reshuffled)';
    gameData.gameLog = {
      ...gameData.gameLog,
      [gameData.roundNumber]: [...(gameData.gameLog[gameData.roundNumber] || []), 'Market deck was reshuffled from played cards']
    };
  };



  const canPlayCard = (card, topCard) => {
    if (!card) return false;
    if (card.special === 'whot') return true;
    if (!topCard) return false;
    return card.shape === topCard.shape || card.number === topCard.number;
  };

  const isCardPlayable = (card, topCard) => {
    if (card.special === 'whot') return true;
    if (!topCard) {
      return false;
    }
    if (topCard.chosenShape) {
      return card.shape === topCard.chosenShape;
    }
    return card.shape === topCard.shape || card.number === topCard.number;
  };

  const hasPlayableCardsOutsideRange = () => {
    if (!gameData) return {
      left: false,
      right: false
    };
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    if (gameData.currentPlayer !== currentUserActualIndex) return {
      left: false,
      right: false
    };
    const player = players[currentUserActualIndex];
    const topCard = gameData.playPile[gameData.playPile.length - 1];
    const leftCards = (player.cards || []).slice(0, playerScrollIndex);
    const hasPlayableLeft = leftCards.some(card => isCardPlayable(card, topCard));
    const rightCards = (player.cards || []).slice(playerScrollIndex + maxVisiblePlayerCards);
    const hasPlayableRight = rightCards.some(card => isCardPlayable(card, topCard));
    return {
      left: hasPlayableLeft,
      right: hasPlayableRight
    };
  };

  const scrollPlayerCards = direction => {
    if (!gameData) return;
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    const playerCards = players[currentUserActualIndex]?.cards || players[0].cards;
    const maxScroll = Math.max(0, playerCards.length - maxVisiblePlayerCards);
    if (direction === 'left') {
      setPlayerScrollIndex(Math.max(0, playerScrollIndex - 1));
    } else if (direction === 'right') {
      setPlayerScrollIndex(Math.min(maxScroll, playerScrollIndex + 1));
    }
  };

  const getCardsPerPlayer = playerCount => {
    if (playerCount === 4) {
      return 6;
    }
    if (playerCount === 3) {
      return 9;
    }
    if (playerCount === 2) {
      return 12;
    }
    return 6;
  };

  const getVisualPlayerMapping = (currentRoomParam, currentUserParam) => {
    // For single-player games (no currentRoom), use default mapping
    if (!currentRoomParam || !gameData) {
      return {
        visualToActual: [0, 1, 2, 3],
        actualToVisual: {
          0: 0,
          1: 1,
          2: 2,
          3: 3
        }
      };
    }
    
    // Convert room players object to array
    const playersArray = ensurePlayersArray(currentRoomParam.players);
    
    const currentUserIndex = playersArray.findIndex(p => p.id === currentUserParam?.id);
    
    if (currentUserIndex === -1) {
      console.warn('Current user not found in room players:', {
        currentUserId: currentUserParam?.id,
        playerIds: playersArray.map(p => p.id)
      });
      return {
        visualToActual: [0, 1, 2, 3],
        actualToVisual: {
          0: 0,
          1: 1,
          2: 2,
          3: 3
        }
      };
    }
    
    const actualToVisual = {};
    const visualToActual = {};
    
    // Map actual player indices to visual positions
    for (let i = 0; i < playersArray.length; i++) {
      const visualIndex = (i - currentUserIndex + playersArray.length) % playersArray.length;
      actualToVisual[i] = visualIndex;
      visualToActual[visualIndex] = i;
    }
    
    return { actualToVisual, visualToActual };
  };

  const getTopMarketCardPosition = () => {
    const screenWidth = window.innerWidth;
    return {
      top: '50%',
      left: '50%',
      transform: `translate(calc(-50% + ${screenWidth < 768 ? '54px' : screenWidth < 1024 ? '72px' : '90px'}), -50%)`
    };
  };

  const getPlayPilePosition = (cardIndex = null, storePosition = true) => {
    cardIndex = cardIndex === null ? 0 : cardIndex;
    while (playPilePositionsRef.current.length <= cardIndex) {
      const randomX = (Math.random() - 0.5) * 8;
      const randomY = (Math.random() - 0.5) * 8;
      const randomRotate = (Math.random() - 0.5) * 15;
      playPilePositionsRef.current.push({
        transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`,
        zIndex: 30 + playPilePositionsRef.current.length
      });
    }
    const cardPosition = playPilePositionsRef.current[cardIndex];
    const relativeCardStyle = {
      transform: cardPosition.transform,
      zIndex: cardPosition.zIndex
    };
    if (storePosition) {
      setPlayPileCardPositions(prev => ({
        ...prev,
        [cardIndex]: relativeCardStyle
      }));
    }
    return relativeCardStyle;
  };

  const getExactCardPosition = (playerIndex, cardIndex, totalCards, clampToVisible = true) => {
    const cardWidth = window.innerWidth < 768 ? 72 : window.innerWidth < 1024 ? 100 : 130;
    const cardSpacing = 6;
    const maxVisibleCards = playerIndex === 0 ? maxVisiblePlayerCards : MAX_VISIBLE_AI_CARDS;
    
    if (clampToVisible && playerIndex === 0) {
      const clampedIndex = Math.max(0, Math.min(cardIndex - playerScrollIndex, maxVisibleCards - 1));
      return {
        transform: `translateX(${clampedIndex * (cardWidth + cardSpacing)}px)`,
        zIndex: clampedIndex
      };
    }
    
    return {
      transform: `translateX(${cardIndex * (cardWidth + cardSpacing)}px)`,
      zIndex: cardIndex
    };
  };

  const getNextPlayer = gameData => {
    const nextPlayers = ensurePlayersArray(gameData.players);
    let nextPlayer = gameData.currentPlayer;
    let playersToSkip = gameData.skipNextPlayer ? 1 : 0;
    do {
      nextPlayer = (nextPlayer + 1) % nextPlayers.length;
    } while (nextPlayers[nextPlayer].eliminated);
    while (playersToSkip > 0) {
      do {
        nextPlayer = (nextPlayer + 1) % nextPlayers.length;
      } while (nextPlayers[nextPlayer].eliminated);
      playersToSkip--;
    }
    return nextPlayer;
  };

  const nextTurn = gameData => {
    const turnPlayers = ensurePlayersArray(gameData.players);
    let nextPlayer = gameData.currentPlayer;
    let playersToSkip = gameData.skipNextPlayer ? 1 : 0;
    do {
      nextPlayer = (nextPlayer + 1) % turnPlayers.length;
    } while (turnPlayers[nextPlayer].eliminated);
    while (playersToSkip > 0) {
      do {
        nextPlayer = (nextPlayer + 1) % turnPlayers.length;
      } while (turnPlayers[nextPlayer].eliminated);
      playersToSkip--;
    }
    gameData.currentPlayer = nextPlayer;
    gameData.skipNextPlayer = false;
    if (gameData.generalMarketActive && nextPlayer === gameData.generalMarketOriginatorId) {
      gameData.generalMarketActive = false;
      gameData.generalMarketOriginatorId = null;
      gameData.lastAction += ' General Market effect ends.';
      gameData.gameLog = {
        ...gameData.gameLog,
        [gameData.roundNumber]: [...(gameData.gameLog[gameData.roundNumber] || []), 'General Market effect ended - all players have drawn']
      };
    }
    setGameData({ ...gameData });
    const gamePlayers = ensurePlayersArray(gameData.players);
    if (gamePlayers[nextPlayer].isAI) {
      setTimeout(() => {
        setIsAITurnInProgress(true);
        setTimeout(async () => {
          if (!isAnyAnimationInProgress) {
            await aiTurn({ ...gameData });
          }
        }, 1000);
      }, 500);
    }
  };

  const endRound = gameData => {
    const gamePlayers = ensurePlayersArray(gameData.players);
    const activePlayers = gamePlayers.filter(p => !p.eliminated);
    const playersWithTotals = activePlayers.map(p => ({
      ...p,
      cardTotal: calculateCardTotal(p.cards),
      cardCount: p.cards.length
    }));
    let maxTotal = Math.max(...playersWithTotals.map(p => p.cardTotal));
    const playersWithMaxTotal = playersWithTotals.filter(p => p.cardTotal === maxTotal);
    const eliminatedPlayer = playersWithMaxTotal[Math.floor(Math.random() * playersWithMaxTotal.length)];
    const roundWinner = (playersWithTotals || []).find(p => p.cardTotal === Math.min(...(playersWithTotals || []).map(p => p.cardTotal)));
    const roundEndInfo = {
      winner: roundWinner,
      players: playersWithTotals.map(p => ({
        ...p,
        cardCount: p.cards.length,
        cardTotal: p.cardTotal,
        cards: p.cards.slice()
      })),
      eliminatedPlayer,
      maxCards: maxTotal,
      roundNumber: gameData.roundNumber
    };
    const newGameData = {
      ...gameData,
      roundEndData: roundEndInfo,
      gamePhase: 'roundEnd'
    };
    const newPlayers = ensurePlayersArray(newGameData.players);
    const eliminatedPlayerInNewData = newPlayers.find(p => p.id === eliminatedPlayer.id);
    if (eliminatedPlayerInNewData) {
      eliminatedPlayerInNewData.eliminated = true;
    }
    newGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
    const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
    newGameData.gameLog[newGameData.roundNumber] = [...currentRoundLog, `Round ${newGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${maxTotal} total card points`];
    const remainingPlayers = newPlayers.filter(p => !p.eliminated);
    if (remainingPlayers.length <= 1) {
      newGameData.gamePhase = 'gameEnd';
      const finalWinner = remainingPlayers.length > 0 ? remainingPlayers[0] : roundWinner;
      newGameData.winner = finalWinner;
      newGameData.lastAction = `${finalWinner.name.split(' ')[0]} wins!`;
      newGameData.gameLog[newGameData.roundNumber + 1] = [`GAME OVER: ${finalWinner.name} wins the game!`];
      // Statistics already updated in handleRoundEnd
      setTimeout(() => {
        startConfetti();
      }, 1000);
    } else {
      newGameData.roundNumber++;
      setTimeout(() => {
        const deck = createDeck();
        const shuffledNewDeck = shuffleDeck(deck);
        const remainingPlayers = newPlayers.filter(p => !p.eliminated);
        const cardsPerPlayer = getCardsPerPlayer(remainingPlayers.length);
        remainingPlayers.forEach(player => {
          player.cards = shuffledNewDeck.splice(0, cardsPerPlayer);
        });
        const newGameDataWithNewDeck = {
          ...newGameData,
          players: remainingPlayers,
          drawPile: shuffledNewDeck,
          playPile: [],
          currentPlayer: 0,
          gamePhase: 'dealingCards',
          lastAction: 'Dealing cards...',
          pendingPickCount: 0,
          generalMarketActive: false,
          generalMarketOriginatorId: null,
          skipNextPlayer: false,
          gameLog: {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [`Round ${newGameData.roundNumber} begins`, 'Cards dealt to all players']
          }
        };
        setGameData(newGameDataWithNewDeck);
        startDealingAnimation([...shuffledNewDeck], remainingPlayers, getCardsPerPlayer(remainingPlayers.length));
      }, 3000);
    }
    setGameData(newGameData);
  };

  const calculateCardTotal = cards => {
    return cards.reduce((total, card) => {
      if (card.special === 'whot') return total + 20;
      if (card.number === 14) return total + 14;
      if (card.number === 13) return total + 13;
      if (card.number === 12) return total + 12;
      if (card.number === 11) return total + 11;
      if (card.number === 10) return total + 10;
      if (card.number === 9) return total + 9;
      if (card.number === 8) return total + 8;
      if (card.number === 7) return total + 7;
      if (card.number === 6) return total + 6;
      if (card.number === 5) return total + 5;
      if (card.number === 4) return total + 4;
      if (card.number === 3) return total + 3;
      if (card.number === 2) return total + 2;
      if (card.number === 1) return total + 1;
      return total + card.number;
    }, 0);
  };

  const aiTurn = async gameData => {
    if (!gameData.players[gameData.currentPlayer].isAI || isAnyAnimationInProgress) {
      setIsAITurnInProgress(false);
      return;
    }
    setIsAnyAnimationInProgress(true);
    let newGameData = JSON.parse(JSON.stringify(gameData));
    const currentPlayer = newGameData.players[newGameData.currentPlayer];
    if (newGameData.pendingPickCount > 0 || newGameData.generalMarketActive && currentPlayer.id !== newGameData.generalMarketOriginatorId) {
      const count = newGameData.pendingPickCount > 0 ? newGameData.pendingPickCount : 1;
      const isPending = newGameData.pendingPickCount > 0;
      const isGeneral = newGameData.generalMarketActive && currentPlayer.id !== newGameData.generalMarketOriginatorId && !isPending;
      await animateDrawCards(newGameData, currentPlayer, count, isPending, isGeneral);
      setIsAITurnInProgress(false);
      return;
    }
    const topCard = newGameData.playPile[newGameData.playPile.length - 1];
    const playableCards = currentPlayer.cards.map((card, index) => ({
      card,
      index
    })).filter(({
      card
    }) => {
      if (!topCard) return card.special === 'whot';
      if (topCard.chosenShape) return card.special === 'whot' || card.shape === topCard.chosenShape;
      return canPlayCard(card, topCard);
    });
    if (playableCards.length > 0) {
      const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
      const cardToPlay = {
        ...randomCard.card
      };
      const currentTopCard = newGameData.playPile[newGameData.playPile.length - 1];
      let isValidPlay = false;
      if (cardToPlay.special === 'whot') {
        isValidPlay = true;
      } else if (!currentTopCard) {
        isValidPlay = false;
      } else if (currentTopCard.chosenShape) {
        isValidPlay = cardToPlay.shape === currentTopCard.chosenShape;
      } else {
        isValidPlay = cardToPlay.shape === currentTopCard.shape || cardToPlay.number === currentTopCard.number;
      }
      if (!isValidPlay) {
        console.warn(`AI ${currentPlayer.name} attempted invalid play: ${cardToPlay.number}${cardToPlay.shape} on ${currentTopCard?.number}${currentTopCard?.chosenShape || currentTopCard?.shape}`);
        await animateDrawCards(newGameData, currentPlayer, 1, false, false);
        setIsAITurnInProgress(false);
        setIsAnyAnimationInProgress(false);
        return;
      }
      const newCardRelativeStyle = getPlayPilePosition(newGameData.playPile.length, false);
      const endPosition = {
        ...animationPositions.playPile,
        transform: `${animationPositions.playPile.transform} ${newCardRelativeStyle.transform}`,
        zIndex: newCardRelativeStyle.zIndex,
        opacity: 1
      };
      const animatingCard = {
        ...cardToPlay,
        id: `animating-${Date.now()}-${randomCard.index}`,
        startPos: {
          ...animationPositions.playerDecks[currentPlayer.id],
          opacity: 1,
          position: 'fixed',
          zIndex: 1000
        },
        endPos: endPosition,
        isPlayerCard: true
      };

      setAnimatingCards(prev => [...prev, animatingCard]);
      if (cardToPlay.special === 'whot') {
        playSoundEffect.specialPlay();
      } else if (cardToPlay.special === 'pick2') {
        playSoundEffect.specialPlay();
      } else if (cardToPlay.special === 'holdon') {
        playSoundEffect.specialPlay();
      } else if (cardToPlay.special === 'generalmarket') {
        playSoundEffect.specialPlay();
      } else {
        playSoundEffect.normalPlay();
      }
      setTimeout(() => {
        currentPlayer.cards = currentPlayer.cards.filter((_, idx) => idx !== randomCard.index);
        newGameData.playPile = [...newGameData.playPile, cardToPlay];
  
        setAnimatingCards(prev => prev.filter(c => c.id !== animatingCard.id));
        
        if (cardToPlay.special === 'whot') {
          const shapes = ['●', '▲', '✚', '■', '★'];
          cardToPlay.chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
          newGameData.lastAction = `${currentPlayer.name.split(' ')[0]} - WHOT → ${cardToPlay.chosenShape}`;
          newGameData.gameLog = {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played WHOT and chose ${cardToPlay.chosenShape} as the active shape`]
          };
        } else if (cardToPlay.special === 'pick2') {
          newGameData.pendingPickCount += 2;
          newGameData.lastAction = `${currentPlayer.name.split(' ')[0]} - ${cardToPlay.number}${cardToPlay.shape} pick2`;
          newGameData.gameLog = {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${cardToPlay.number}${cardToPlay.shape} (Pick 2) - Next player must draw 2 cards`]
          };
        } else if (cardToPlay.special === 'holdon') {
          newGameData.lastAction = `${currentPlayer.name.split(' ')[0]} - ${cardToPlay.number}${cardToPlay.shape} hold`;
          newGameData.skipNextPlayer = true;
          newGameData.gameLog = {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${cardToPlay.number}${cardToPlay.shape} (Hold On) - Next player's turn skipped`]
          };
        } else if (cardToPlay.special === 'generalmarket') {
          newGameData.lastAction = `${currentPlayer.name.split(' ')[0]} - ${cardToPlay.number}${cardToPlay.shape} gen`;
          newGameData.generalMarketActive = true;
          newGameData.generalMarketOriginatorId = newGameData.currentPlayer;
          newGameData.gameLog = {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${cardToPlay.number}${cardToPlay.shape} (General Market) - All other players must draw from market`]
          };
        } else {
          newGameData.lastAction = `${currentPlayer.name.split(' ')[0]} - ${cardToPlay.number}${cardToPlay.shape}`;
          newGameData.gameLog = {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${cardToPlay.number}${cardToPlay.shape}`]
          };
        }
        
        if (currentPlayer.cards.length === 0) {
          endRound(newGameData);
          setGameData(newGameData);
          setIsAITurnInProgress(false);
          return;
        }
        setGameData(newGameData);
        setIsAITurnInProgress(false);
        setIsAnyAnimationInProgress(false);
        nextTurn(newGameData);
      }, 800);
    } else {
      await animateDrawCards(newGameData, currentPlayer, 1, false, false);
      setIsAITurnInProgress(false);
      return;
    }
  };



  const handleRoundEnd = async gameData => {
    // Play end sound when round ends
    playSoundEffect.end();
    

    
    const activePlayers = gameData.players.filter(p => !p.eliminated);
    const playersWithTotals = activePlayers.map(p => ({
      ...p,
      cardTotal: calculateCardTotal(p.cards),
      cardCount: p.cards.length
    }));
    let maxTotal = Math.max(...playersWithTotals.map(p => p.cardTotal));
    const playersWithMaxTotal = playersWithTotals.filter(p => p.cardTotal === maxTotal);
    const eliminatedPlayer = playersWithMaxTotal[Math.floor(Math.random() * playersWithMaxTotal.length)];
    const roundWinner = (playersWithTotals || []).find(p => p.cardTotal === Math.min(...(playersWithTotals || []).map(p => p.cardTotal)));
    
          // Check if this round ends the game (only one player left after elimination)
      const remainingPlayers = activePlayers.filter(p => p.id !== eliminatedPlayer.id);
      const isGameEnd = remainingPlayers.length <= 1; // 1 or fewer players left = final winner
    
    // Determine if current user is the winner of this round
    const isWinner = currentUser && roundWinner.id === currentUser.id;
    
    // Update game statistics for this round (count as a game)
    if (currentUser) {

      await updateGameStatistics(gameData, isWinner, 'ai');
    }
    
    const roundEndInfo = {
      winner: roundWinner,
      players: playersWithTotals.map(p => ({
        ...p,
        cardCount: p.cards.length,
        cardTotal: p.cardTotal,
        cards: p.cards.slice()
      })),
      eliminatedPlayer,
      maxCards: maxTotal,
      roundNumber: gameData.roundNumber,
      isGameEnd: isGameEnd
    };
    setRoundEndData(roundEndInfo);
    
    setTimeout(() => {
      setShowRoundEndPopup(true);
      setTimeout(() => startConfetti(), 200);
    }, 2500);
    
    // Auto-continue after 15 seconds
    setTimeout(() => {
      if (isGameEnd) {
        // Game is over - show winner and redirect to main menu

        setTimeout(() => {
          returnToMenu();
        }, 3000); // Give time for winner announcement
      } else {
        // Continue to next round
        handleContinueToNextRound();
      }
    }, 15000);

  // Function to handle continuing to next round (called when button is clicked)
  const handleContinueToNextRound = () => {
    console.log('🎮 handleContinueToNextRound called:', { currentRoom: !!currentRoom, roundEndData: !!roundEndData });
    
    // Handle multiplayer case
    if (currentRoom) {
      if (!roundEndData || !currentRoom) return;
      
      const eliminatedPlayer = roundEndData.eliminatedPlayer;
      const players = ensurePlayersArray(gameData.players);
      const remainingPlayers = players.filter(p => !p.eliminated && p.id !== eliminatedPlayer.id);
      
      setGameData(prevData => {
        if (!prevData) return prevData;
        
        const nextRoundGameData = JSON.parse(JSON.stringify(prevData));
        const nextPlayers = ensurePlayersArray(nextRoundGameData.players);
        const eliminatedPlayerInNewData = nextPlayers.find(p => p.id === eliminatedPlayer.id);
        if (eliminatedPlayerInNewData) {
          eliminatedPlayerInNewData.eliminated = true;
        }
        
        nextRoundGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
        nextRoundGameData.gameLog = {
          ...nextRoundGameData.gameLog,
          [nextRoundGameData.roundNumber]: [
            ...(nextRoundGameData.gameLog[nextRoundGameData.roundNumber] || []),
            `Round ${nextRoundGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${roundEndData.maxCards} total card points`
          ]
        };
        
        if (eliminatedPlayer.id === currentUser?.id) {
          setShowEliminatedPopup(true);
        }
        
        nextRoundGameData.roundNumber++;
        
        if (remainingPlayers.length <= 1) {
          // Game ends - only one player left
          nextRoundGameData.gamePhase = 'gameEnd';
          const winner = remainingPlayers.length > 0 ? remainingPlayers[0] : roundEndData.winner;
          nextRoundGameData.winner = winner;
          nextRoundGameData.lastAction = `${winner.name.split(' ')[0]} wins!`;
          nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`GAME OVER: ${winner.name} wins the game!`];
          
          // Update Firebase with game end
          update(ref(db, `rooms/${currentRoom.id}/gameData`), nextRoundGameData);
          
          // Reset room after delay
          setTimeout(() => {
            update(ref(db, `rooms/${currentRoom.id}`), {
              status: 'waiting',
              gameData: null,
              countdown: null
            });
          }, 10000);
          
          setShowRoundEndPopup(false);
          return nextRoundGameData;
        } else {
          // Continue to next round
          const newDeck = createDeck();
          const shuffledNewDeck = shuffleDeck(newDeck);
          
          // Reset all players' cards
          nextRoundGameData.players.forEach(player => {
            player.cards = [];
          });
          
          // Reset game state
          nextRoundGameData.playPile = [];
          nextRoundGameData.drawPile = shuffledNewDeck;
          nextRoundGameData.pendingPickCount = 0;
          nextRoundGameData.generalMarketActive = false;
          nextRoundGameData.generalMarketOriginatorId = null;
          nextRoundGameData.skipNextPlayer = false;
          nextRoundGameData.gamePhase = 'dealingCards';
          nextRoundGameData.lastAction = 'Dealing cards...';
          nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [
            `Round ${nextRoundGameData.roundNumber} begins with remaining players.`,
            `New deck created and shuffled.`
          ];
          
          // Set current player to first non-eliminated player
          const firstPlayerIndex = nextPlayers.findIndex(p => !p.eliminated);
          nextRoundGameData.currentPlayer = firstPlayerIndex !== -1 ? firstPlayerIndex : 0;
          
          // Update Firebase with next round data
          update(ref(db, `rooms/${currentRoom.id}/gameData`), nextRoundGameData);
          
          // Reset UI state
          setAnimatingCards([]);
          setPlayerScrollIndex(0);
          setNeedNewMarketPositions(true);
          playPilePositionsRef.current = [];
          setPlayPileCardPositions({});
          setIsAITurnInProgress(false);
          setIsPlayerActionInProgress(false);
          setIsAnyAnimationInProgress(false);
          setSelectedLogRound(nextRoundGameData.roundNumber);
          setShowRoundEndPopup(false);
          setRoundEndData(null);
          setConfettiActive(false);
          
          // Start dealing animation
          setTimeout(() => {
            const cardsPerPlayer = getCardsPerPlayer(remainingPlayers.length);
            startDealingAnimation([...shuffledNewDeck], remainingPlayers, cardsPerPlayer);
          }, 100);
          
          return nextRoundGameData;
        }
      });
      return;
    }
    
    // Handle single player case
    if (!roundEndData) {
      console.log('No roundEndData for single player continue');
      return;
    }
    
    console.log('Processing single player continue to next round');
    
    const eliminatedPlayer = roundEndData.eliminatedPlayer;
    const remainingPlayers = gameData.players.filter(p => !p.eliminated);
    
    setGameData(prevData => {
      if (!prevData) return prevData;
      const nextRoundGameData = { ...prevData };
      const eliminatedPlayerInNewData = (nextRoundGameData.players || []).find(p => p.id === eliminatedPlayer.id);
      if (eliminatedPlayerInNewData) {
        eliminatedPlayerInNewData.eliminated = true;
      }
      nextRoundGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
      nextRoundGameData.gameLog = {
        ...nextRoundGameData.gameLog,
        [nextRoundGameData.roundNumber]: [
          ...(nextRoundGameData.gameLog[nextRoundGameData.roundNumber] || []),
          `Round ${nextRoundGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${roundEndData.maxCards} total card points`
        ]
      };
      nextRoundGameData.roundNumber++;
      
      if (remainingPlayers.length <= 1) {
        nextRoundGameData.gamePhase = 'gameEnd';
        const winner = remainingPlayers.length > 0 ? remainingPlayers[0] : roundEndData.winner;
        nextRoundGameData.winner = winner;
        nextRoundGameData.lastAction = `${winner.name.split(' ')[0]} wins!`;
        nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`GAME OVER: ${winner.name} wins the game!`];
        setShowRoundEndPopup(false);
        if (currentUser) {
          const isWinner = winner.id === currentUser.id;
          const newXP = (currentUser.xp || 0) + (isWinner ? 150 : 50);
          const levelData = calculateLevel(newXP);
          
          // Update Firebase stats
          update(ref(db, `users/${currentUser.id}`), {
              gamesPlayed: (currentUser.gamesPlayed || 0) + 1,
              gamesWon: isWinner ? (currentUser.gamesWon || 0) + 1 : currentUser.gamesWon || 0,
              xp: newXP,
              level: levelData.level,
              currentLevelXP: levelData.currentLevelXP,
              xpNeededForNext: levelData.xpNeededForNext,
              currentWinStreak: isWinner ? (currentUser.currentWinStreak || 0) + 1 : 0,
              bestWinStreak: isWinner ? Math.max((currentUser.currentWinStreak || 0) + 1, currentUser.bestWinStreak || 0) : currentUser.bestWinStreak || 0,
              totalCardsPlayed: (currentUser.totalCardsPlayed || 0) + 5,
              perfectWins: isWinner && (gameData?.roundsPlayed || 1) === 1 ? (currentUser.perfectWins || 0) + 1 : currentUser.perfectWins || 0
          });
          
          // Update Honeycomb stats and check for badges
          if (publicKey && wallet) {
            const gameStats = {
              xp: isWinner ? 150 : 50,
              cardsPlayed: 5,
              perfectWin: isWinner && (gameData?.roundsPlayed || 1) === 1 // Perfect win if won in first round
            };
            
            // Handle async operation outside of setGameData callback
            updateGameStats({
              publicKey,
              wallet,
              signMessage,
              gameResult: isWinner ? 'win' : 'loss',
              gameStats,
              currentUser
            }).then(result => {
                      if (result.success && result.unlockableBadges.length > 0) {
          setUnlockableBadges(result.unlockableBadges);
  
              }
            }).catch(error => {
              console.error('Error updating Honeycomb stats:', error);
            });
          }
        }
        setTimeout(() => {
          setGameState('menu');
          setGameData(null);
        }, 10000);
        return nextRoundGameData;
      } else {

        const newDeck = createDeck();
        const shuffledNewDeck = shuffleDeck(newDeck);
        nextRoundGameData.players.forEach(player => {
          player.cards = [];
        });
        nextRoundGameData.playPile = [];
        nextRoundGameData.drawPile = shuffledNewDeck;
        const nextPlayers = ensurePlayersArray(nextRoundGameData.players);
        const firstPlayerIndex = nextPlayers.findIndex(p => !p.eliminated);
        nextRoundGameData.currentPlayer = firstPlayerIndex !== -1 ? firstPlayerIndex : 0;
        nextRoundGameData.pendingPickCount = 0;
        nextRoundGameData.generalMarketActive = false;
        nextRoundGameData.generalMarketOriginatorId = null;
        nextRoundGameData.skipNextPlayer = false;
        nextRoundGameData.gamePhase = 'dealingCards';
        nextRoundGameData.lastAction = 'Dealing cards...';
        nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`Round ${nextRoundGameData.roundNumber} begins with remaining players.`, `New deck created and shuffled.`];
        setAnimatingCards([]);
        setPlayerScrollIndex(0);
        setNeedNewMarketPositions(true);
        playPilePositionsRef.current = [];
        // play pile positions are managed in Game.jsx
        setPlayPileCardPositions({});
        setIsAITurnInProgress(false);
        setIsPlayerActionInProgress(false);
        isAnimationInProgressRef.current = false;
        setIsAnyAnimationInProgress(false);
        setSelectedLogRound(nextRoundGameData.roundNumber);
        setShowRoundEndPopup(false);
        setRoundEndData(null);
        setConfettiActive(false);
        
        setTimeout(() => {
          const cardsPerPlayer = getCardsPerPlayer(remainingPlayers.length);
          
          startDealingAnimation([...shuffledNewDeck], remainingPlayers, cardsPerPlayer);
        }, 100);
        return nextRoundGameData;
      }
    });
  };
  };

  const handleMultiplayerRoundEnd = async (gameData) => {
    try {
      // Play end sound when round ends
      playSoundEffect.end();
      
      
      
      const players = ensurePlayersArray(gameData.players);
      const activePlayers = players.filter(p => !p.eliminated);
      const playersWithTotals = activePlayers.map(p => ({
        ...p,
        cardTotal: calculateCardTotal(p.cards),
        cardCount: p.cards.length
      }));
      let maxTotal = Math.max(...playersWithTotals.map(p => p.cardTotal));
      const playersWithMaxTotal = playersWithTotals.filter(p => p.cardTotal === maxTotal);
      const eliminatedPlayer = playersWithMaxTotal[Math.floor(Math.random() * playersWithMaxTotal.length)];
      const roundWinner = (playersWithTotals || []).find(p => p.cardTotal === Math.min(...(playersWithTotals || []).map(p => p.cardTotal)));
      
      // Check if this round ends the game (only one player left after elimination)
      const remainingPlayers = activePlayers.filter(p => p.id !== eliminatedPlayer.id);
      const isGameEnd = remainingPlayers.length <= 1; // 1 or fewer players left = final winner
      
      // Determine if current user is the winner of this round
      const isWinner = currentUser && roundWinner.id === currentUser.id;
      
      // Update game statistics for this round (count as a game) for ALL players
      const allPlayers = ensurePlayersArray(gameData.players);
      for (const player of allPlayers) {
        if (player.id) { // Only update for real players, not AI
          const isPlayerWinner = roundWinner.id === player.id;

          
          // Update Firebase stats for each player
          await update(ref(db, `users/${player.id}`), {
            gamesPlayed: (player.gamesPlayed || 0) + 1,
            gamesWon: isPlayerWinner ? (player.gamesWon || 0) + 1 : (player.gamesWon || 0),
            xp: (player.xp || 0) + (isPlayerWinner ? 150 : 50),
            lastActive: Date.now()
          });
        }
      }
      
      const roundEndInfo = {
        winner: roundWinner,
        players: playersWithTotals.map(p => ({
          ...p,
          cardCount: p.cards.length,
          cardTotal: p.cardTotal,
          cards: p.cards.slice()
        })),
        eliminatedPlayer,
        maxCards: maxTotal,
        roundNumber: gameData.roundNumber,
        isGameEnd: isGameEnd
      };
      
      const newGameData = {
        ...gameData,
        roundEndData: roundEndInfo,
        gamePhase: 'roundEnd'
      };
      
      const newPlayers = ensurePlayersArray(newGameData.players);
      const eliminatedPlayerInNewData = newPlayers.find(p => p.id === eliminatedPlayer.id);
      if (eliminatedPlayerInNewData) {
        eliminatedPlayerInNewData.eliminated = true;
      }
      newGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
      const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
      newGameData.gameLog[newGameData.roundNumber] = [...currentRoundLog, `Round ${newGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${maxTotal} total card points`];
      
      // Update Firebase with round end data
      await update(ref(db, `rooms/${currentRoom.id}/gameData`), newGameData);
      
      // Show round end popup for display purposes (same as AI mode)
      setRoundEndData(roundEndInfo);
      setTimeout(() => {
        setShowRoundEndPopup(true);
        setTimeout(() => startConfetti(), 200);
      }, 2500);
      
      // Auto-continue after 15 seconds
      setTimeout(() => {
        if (isGameEnd) {
          // Game is over - show winner and redirect to menu

          setTimeout(() => {
            returnToMenu();
          }, 3000); // Give time for winner announcement
        } else {
          // Continue to next round
          handleContinueToNextRound();
        }
      }, 15000);
      
    } catch (error) {
      console.error('Error handling multiplayer round end:', error);
    }
  };





  // Function to handle continuing to next round (called when button is clicked)
  const handleContinueToNextRound = () => {
    console.log('🎮 handleContinueToNextRound called:', { currentRoom: !!currentRoom, roundEndData: !!roundEndData });
    
    // Handle multiplayer case
    if (currentRoom) {
      if (!roundEndData || !currentRoom) return;
      
      const eliminatedPlayer = roundEndData.eliminatedPlayer;
      const players = ensurePlayersArray(gameData.players);
      const remainingPlayers = players.filter(p => !p.eliminated && p.id !== eliminatedPlayer.id);
      
      setGameData(prevData => {
        if (!prevData) return prevData;
        
        const nextRoundGameData = JSON.parse(JSON.stringify(prevData));
        const nextPlayers = ensurePlayersArray(nextRoundGameData.players);
        const eliminatedPlayerInNewData = nextPlayers.find(p => p.id === eliminatedPlayer.id);
        if (eliminatedPlayerInNewData) {
          eliminatedPlayerInNewData.eliminated = true;
        }
        
        nextRoundGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
        nextRoundGameData.gameLog = {
          ...nextRoundGameData.gameLog,
          [nextRoundGameData.roundNumber]: [
            ...(nextRoundGameData.gameLog[nextRoundGameData.roundNumber] || []),
            `Round ${nextRoundGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${roundEndData.maxCards} total card points`
          ]
        };
        
        if (eliminatedPlayer.id === currentUser?.id) {
          setShowEliminatedPopup(true);
        }
        
        nextRoundGameData.roundNumber++;
        
        if (remainingPlayers.length <= 1) {
          // Game ends - only one player left
          nextRoundGameData.gamePhase = 'gameEnd';
          const winner = remainingPlayers.length > 0 ? remainingPlayers[0] : roundEndData.winner;
          nextRoundGameData.winner = winner;
          nextRoundGameData.lastAction = `${winner.name.split(' ')[0]} wins!`;
          nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`GAME OVER: ${winner.name} wins the game!`];
          
          // Update Firebase with game end
          update(ref(db, `rooms/${currentRoom.id}/gameData`), nextRoundGameData);
          
          // Reset room after delay
          setTimeout(() => {
            update(ref(db, `rooms/${currentRoom.id}`), {
              status: 'waiting',
              gameData: null,
              countdown: null
            });
          }, 10000);
          
          setShowRoundEndPopup(false);
          return nextRoundGameData;
        } else {
          // Continue to next round
          const newDeck = createDeck();
          const shuffledNewDeck = shuffleDeck(newDeck);
          
          // Reset all players' cards
          nextRoundGameData.players.forEach(player => {
            player.cards = [];
          });
          
          // Reset game state
          nextRoundGameData.playPile = [];
          nextRoundGameData.drawPile = shuffledNewDeck;
          nextRoundGameData.pendingPickCount = 0;
          nextRoundGameData.generalMarketActive = false;
          nextRoundGameData.generalMarketOriginatorId = null;
          nextRoundGameData.skipNextPlayer = false;
          nextRoundGameData.gamePhase = 'dealingCards';
          nextRoundGameData.lastAction = 'Dealing cards...';
          nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [
            `Round ${nextRoundGameData.roundNumber} begins with remaining players.`,
            `New deck created and shuffled.`
          ];
          
          // Set current player to first non-eliminated player
          const firstPlayerIndex = nextPlayers.findIndex(p => !p.eliminated);
          nextRoundGameData.currentPlayer = firstPlayerIndex !== -1 ? firstPlayerIndex : 0;
          
          // Update Firebase with next round data
          update(ref(db, `rooms/${currentRoom.id}/gameData`), nextRoundGameData);
          
          // Reset UI state
          setAnimatingCards([]);
          setPlayerScrollIndex(0);
          setNeedNewMarketPositions(true);
          playPilePositionsRef.current = [];
          setPlayPileCardPositions({});
          setIsAITurnInProgress(false);
          setIsPlayerActionInProgress(false);
          setIsAnyAnimationInProgress(false);
          setSelectedLogRound(nextRoundGameData.roundNumber);
          setShowRoundEndPopup(false);
          setRoundEndData(null);
          setConfettiActive(false);
          
          // Start dealing animation
          setTimeout(() => {
            const cardsPerPlayer = getCardsPerPlayer(remainingPlayers.length);
            startDealingAnimation([...shuffledNewDeck], remainingPlayers, cardsPerPlayer);
          }, 100);
          
          return nextRoundGameData;
        }
      });
      return;
    }
    
    // Handle single player case
    if (!roundEndData) {
      console.log('No roundEndData for single player continue');
      return;
    }
    
    console.log('Processing single player continue to next round');
    
    const eliminatedPlayer = roundEndData.eliminatedPlayer;
    const remainingPlayers = gameData.players.filter(p => !p.eliminated);
    
    setGameData(prevData => {
      if (!prevData) return prevData;
      const nextRoundGameData = { ...prevData };
      const eliminatedPlayerInNewData = (nextRoundGameData.players || []).find(p => p.id === eliminatedPlayer.id);
      if (eliminatedPlayerInNewData) {
        eliminatedPlayerInNewData.eliminated = true;
      }
      nextRoundGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
      nextRoundGameData.gameLog = {
        ...nextRoundGameData.gameLog,
        [nextRoundGameData.roundNumber]: [
          ...(nextRoundGameData.gameLog[nextRoundGameData.roundNumber] || []),
          `Round ${nextRoundGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${roundEndData.maxCards} total card points`
        ]
      };
      nextRoundGameData.roundNumber++;
      
      if (remainingPlayers.length <= 1) {
        nextRoundGameData.gamePhase = 'gameEnd';
        const winner = remainingPlayers.length > 0 ? remainingPlayers[0] : roundEndData.winner;
        nextRoundGameData.winner = winner;
        nextRoundGameData.lastAction = `${winner.name.split(' ')[0]} wins!`;
        nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`GAME OVER: ${winner.name} wins the game!`];
        setShowRoundEndPopup(false);
        if (currentUser) {
          const isWinner = winner.id === currentUser.id;
          const newXP = (currentUser.xp || 0) + (isWinner ? 150 : 50);
          const levelData = calculateLevel(newXP);
          
          // Update Firebase stats
          update(ref(db, `users/${currentUser.id}`), {
              gamesPlayed: (currentUser.gamesPlayed || 0) + 1,
              gamesWon: isWinner ? (currentUser.gamesWon || 0) + 1 : currentUser.gamesWon || 0,
              xp: newXP,
              level: levelData.level,
              currentLevelXP: levelData.currentLevelXP,
              xpNeededForNext: levelData.xpNeededForNext,
              currentWinStreak: isWinner ? (currentUser.currentWinStreak || 0) + 1 : 0,
              bestWinStreak: isWinner ? Math.max((currentUser.currentWinStreak || 0) + 1, currentUser.bestWinStreak || 0) : currentUser.bestWinStreak || 0,
              totalCardsPlayed: (currentUser.totalCardsPlayed || 0) + 5,
              perfectWins: isWinner && (gameData?.roundsPlayed || 1) === 1 ? (currentUser.perfectWins || 0) + 1 : currentUser.perfectWins || 0
          });
        }
        return nextRoundGameData;
      } else {
        const newDeck = createDeck();
        const shuffledNewDeck = shuffleDeck(newDeck);
        nextRoundGameData.players.forEach(player => {
          player.cards = [];
        });
        nextRoundGameData.playPile = [];
        nextRoundGameData.drawPile = shuffledNewDeck;
        const firstPlayerIndex = nextRoundGameData.players.findIndex(p => !p.eliminated);
        nextRoundGameData.currentPlayer = firstPlayerIndex !== -1 ? firstPlayerIndex : 0;
        nextRoundGameData.pendingPickCount = 0;
        nextRoundGameData.generalMarketActive = false;
        nextRoundGameData.generalMarketOriginatorId = null;
        nextRoundGameData.skipNextPlayer = false;
        nextRoundGameData.gamePhase = 'dealingCards';
        nextRoundGameData.lastAction = 'Dealing cards...';
        nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`Round ${nextRoundGameData.roundNumber} begins with remaining players.`, `New deck created and shuffled.`];
        setAnimatingCards([]);
        setPlayerScrollIndex(0);
        setNeedNewMarketPositions(true);
        playPilePositionsRef.current = [];
        setPlayPileCardPositions({});
        setIsAITurnInProgress(false);
        setIsPlayerActionInProgress(false);
        setIsAnyAnimationInProgress(false);
        setSelectedLogRound(nextRoundGameData.roundNumber);
        setShowRoundEndPopup(false);
        setRoundEndData(null);
        setConfettiActive(false);
        setTimeout(() => {
          const cardsPerPlayer = getCardsPerPlayer(remainingPlayers.length);
          startDealingAnimation([...shuffledNewDeck], remainingPlayers, cardsPerPlayer);
        }, 100);
        return nextRoundGameData;
      }
    });
  };

  const handleAutoPlay = async () => {
    if (!gameData || !currentRoom || !currentUser) return;
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = players.findIndex(p => p.id === (currentUser?.id));
    if (currentUserActualIndex === -1) return;
    if (gameData.currentPlayer !== currentUserActualIndex) return;
    const currentPlayerData = players[currentUserActualIndex];
    try {
      const topCard = gameData.playPile[gameData.playPile.length - 1];
      const playableCards = currentPlayerData.cards.filter(card => canPlayCard(card, topCard));
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        const cardIndex = (currentPlayerData.cards || []).findIndex(c => c.id === cardToPlay.id);
        await playMultiplayerCard(cardIndex);
      } else {
        await drawMultiplayerCard();
      }
    } catch (error) {
      console.error('Error with auto-play:', error);
    }
  };



  const createRoom = async () => {
    if (!currentUser) return;
    
    const roomRef = ref(db, 'rooms');
    const newRoomRef = push(roomRef);
    const sanitizedCurrentUser = removeUndefinedValues(currentUser);
    const roomData = {
      id: newRoomRef.key,
      ownerId: currentUser.id,
      ownerUsername: currentUser?.username || 'Unknown Player',
      players: { [currentUser.id]: { ...sanitizedCurrentUser, ready: true } },
      maxPlayers: 4,
      status: 'waiting',
      createdAt: serverTimestamp(),
      lastActive: Date.now()
    };
    
    await set(newRoomRef, roomData);
    setCurrentRoom(roomData);
    setGameState('room');
  };

  const joinRoom = async (roomId) => {
    if (!currentUser) return;
    
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) return;
    
    const roomData = roomSnapshot.val();
    if (Object.keys(roomData.players || {}).length >= roomData.maxPlayers) return;
    
    const sanitizedCurrentUser = removeUndefinedValues(currentUser);
    await update(roomRef, {
      [`players/${currentUser.id}`]: { ...sanitizedCurrentUser, ready: false },
      lastActive: Date.now()
    });
    
    setCurrentRoom({ ...roomData, id: roomId });
    setGameState('room');
  };

  const toggleReady = async () => {
    if (!currentUser || !currentRoom) return;
    
    const roomRef = ref(db, `rooms/${currentRoom.id}`);
    const currentReady = currentRoom.players?.[currentUser.id]?.ready || false;
    
    try {
      await update(roomRef, {
        [`players/${currentUser.id}/ready`]: !currentReady,
        lastActive: Date.now()
      });
    } catch (e) {
      console.error('Failed to toggle ready state:', e);
    }
  };

  const startGameCountdown = async () => {
    if (!currentRoom || currentRoom.ownerId !== currentUser?.id) return;
    
    const roomRef = ref(db, `rooms/${currentRoom.id}`);
    await update(roomRef, {
      status: 'countdown',
      countdown: 5,
      lastActive: Date.now()
    });
    // Drive countdown ticks from owner
    let secs = 5;
    const interval = setInterval(async () => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(interval);
        await startMultiplayerGame();
      } else {
        await update(roomRef, { 
          countdown: secs,
          lastActive: Date.now()
        });
      }
    }, 1000);
  };

  // Remove undefined values from objects (Firebase doesn't allow undefined)
  const removeUndefinedValues = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => removeUndefinedValues(item)).filter(item => item !== null);
    }
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  };

  // Ensure gameData has valid array structure before using or writing to Firebase
  function sanitizeGameData(input) {
    if (!input || typeof input !== 'object') return input;
    const safePlayers = Array.isArray(input.players)
      ? input.players.map(p => ({
          ...p,
          cards: Array.isArray(p?.cards) ? [...p.cards] : []
        }))
      : [];
    const safeGameData = {
      ...input,
      players: safePlayers,
      playPile: Array.isArray(input.playPile) ? [...input.playPile] : [],
      drawPile: Array.isArray(input.drawPile) ? [...input.drawPile] : [],
      gameLog: input.gameLog && typeof input.gameLog === 'object' ? input.gameLog : {}
    };
    return safeGameData;
  }



  const startMultiplayerGame = async () => {
    if (!currentRoom || !currentUser || currentUser.id !== currentRoom.ownerId) return;
    updateGameActivity(); // Track activity for timeout
    try {
      // Create and deal cards immediately like AI game, no animation
      const deck = createDeck();
      const shuffledDeck = shuffleDeck(deck);
      playSoundEffect.shuffle();
      const playersList = Object.values(currentRoom.players || {});
      const cardsPerPlayer = getCardsPerPlayer(playersList.length);
      
      const players = playersList.map((player, index) => ({
        id: player.id,
        name: player?.username || 'Unknown Player',
        cards: [],
        isAI: false,
        eliminated: false
      }));
      
      // Ensure all players have proper cards arrays
      players.forEach(player => {
        if (!Array.isArray(player.cards)) {
          player.cards = [];
        }
      });
      
      // Pre-compute final dealt hands and piles so all clients can animate locally
      const totalToDeal = players.length * cardsPerPlayer;
      const targetPlayers = players.map(p => ({ ...p, cards: [] }));
      for (let i = 0; i < totalToDeal; i++) {
        const pIdx = i % players.length;
        targetPlayers[pIdx].cards.push(shuffledDeck[i]);
      }
      const remainingAfterDeal = shuffledDeck.slice(totalToDeal);
      const initialPlayCard = remainingAfterDeal[0];
      if (initialPlayCard?.special === 'whot') {
        const shapes = ['●', '▲', '✚', '■', '★'];
        initialPlayCard.chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
      }
      const remainingDrawPile = remainingAfterDeal.slice(1);

      const initialGameData = sanitizeGameData({
        players: targetPlayers,
        playPile: initialPlayCard ? [initialPlayCard] : [],
        drawPile: remainingDrawPile,
        currentPlayer: 0,
        gamePhase: 'playing',
        roundNumber: 1,
        lastAction: `Game started - ${initialPlayCard ? `${initialPlayCard.number}${initialPlayCard.shape}` : 'Initial card'} played`,
        pendingPickCount: 0,
        generalMarketActive: false,
        generalMarketOriginatorId: null,
        cardsPerPlayer,

        gameLog: {
          1: [`Game started with ${players.length} players: ${players.map(p => p.name).join(', ')}`, 'Cards dealt to all players', `Initial card: ${initialPlayCard ? `${initialPlayCard.number}${initialPlayCard.shape}` : 'None'} placed on table`]
        }
      });

      // Save complete game state to Firebase while preserving room metadata
      const updateData = {
        status: 'playing',
        gameData: initialGameData,
        countdown: null,
        lastActive: Date.now()
      };
      
      // Only add room metadata if it exists to avoid undefined values
      if (currentRoom.players) updateData.players = removeUndefinedValues(currentRoom.players);
      if (currentRoom.name) updateData.name = currentRoom.name;
      if (currentRoom.maxPlayers) updateData.maxPlayers = currentRoom.maxPlayers;
      if (currentRoom.ownerId) updateData.ownerId = currentRoom.ownerId;
      if (currentRoom.createdAt) updateData.createdAt = currentRoom.createdAt;
      
      // Ensure we don't send undefined arrays/fields
      const safeUpdate = removeUndefinedValues(updateData);
      await update(ref(db, `rooms/${currentRoom.id}`), safeUpdate);
      
      // Reset UI states before setting game state
      setAnimatingCards([]);
      setPlayerScrollIndex(0);
      setNeedNewMarketPositions(true);
      playPilePositionsRef.current = [];
      setPlayPileCardPositions({});
      setIsAITurnInProgress(false);
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
      setSelectedLogRound(1);
      setShowRoundEndPopup(false);
      setRoundEndData(null);
      setConfettiActive(false);

                  // Stop background music when game starts
            stopBackgroundMusic();
            
            // Start game music with fade in
            soundEffects.startGameMusic();

      // Move to game state; listener will animate locally from Firebase snapshot
      setGameState('game');



    } catch (error) {
      console.error('❌ Error starting multiplayer game:', error);
    }
  };

  const playCard = async cardIndex => {
    if (!gameData || gameData.currentPlayer !== 0 || isPlayerActionInProgress || isAnyAnimationInProgress || animatingCards.length > 0) return;
    updateGameActivity(); // Track activity for timeout
    setIsPlayerActionInProgress(true);
    isAnimationInProgressRef.current = true;
    setIsAnyAnimationInProgress(true);
    const newGameData = JSON.parse(JSON.stringify(gameData));
    const player = newGameData.players[0];
    const actualCardIndex = cardIndex + playerScrollIndex;
    const card = player.cards[actualCardIndex];
    const topCard = newGameData.playPile[newGameData.playPile.length - 1];
    if (topCard.chosenShape) {
      if (card.special !== 'whot' && card.shape !== topCard.chosenShape) {
        setIsPlayerActionInProgress(false);
        isAnimationInProgressRef.current = false;
        setIsAnyAnimationInProgress(false);
        return;
      }
    } else if (!canPlayCard(card, topCard)) {
      setIsPlayerActionInProgress(false);
      isAnimationInProgressRef.current = false;
      setIsAnyAnimationInProgress(false);
      return;
    }
    // Play sound based on card type immediately
    if (card.special === 'whot' || card.special === 'pick2' || card.special === 'holdon' || card.special === 'generalmarket') {
      playSoundEffect.specialPlay();
    } else {
      playSoundEffect.normalPlay();
    }
    
    // Create animation using original logic
    const newCardRelativeStyle = getPlayPilePosition(newGameData.playPile.length, false);
    const endPosition = {
      ...animationPositions.playPile,
      transform: `${animationPositions.playPile.transform} ${newCardRelativeStyle.transform}`,
      zIndex: newCardRelativeStyle.zIndex
    };
    
    const animatingCard = {
      ...card,
      id: `animating-${Date.now()}-${actualCardIndex}`,
      startPos: getExactCardPosition(0, actualCardIndex, player.cards.length, true),
      endPos: endPosition,
      isPlayerCard: true
    };
    
    setAnimatingCards(prev => {

      return [...prev, animatingCard];
    });
    player.cards = player.cards.filter((_, idx) => idx !== actualCardIndex);
    newGameData.playPile = [...newGameData.playPile, card];
    

    const newCardsLength = player.cards.length;
    const maxScroll = Math.max(0, newCardsLength - maxVisiblePlayerCards);
    if (newCardsLength <= maxVisiblePlayerCards) {
      setPlayerScrollIndex(0);
    } else if (playerScrollIndex >= maxScroll) {
      setPlayerScrollIndex(maxScroll);
    } else if (actualCardIndex < playerScrollIndex + Math.floor(maxVisiblePlayerCards / 2)) {
      setPlayerScrollIndex(Math.max(0, playerScrollIndex - 1));
    }
    setTimeout(() => {
      setAnimatingCards(prev => prev.filter(c => c.id !== animatingCard.id));
      getPlayPilePosition(newGameData.playPile.length - 1, true);
      if (card.special === 'pick2') {
        newGameData.pendingPickCount += 2;
        newGameData.lastAction = `You - ${card.number}${card.shape} pick2`;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `You played ${card.number}${card.shape} (Pick 2) - Next player must draw 2 cards`]
        };
      } else if (card.special === 'whot') {
        setPendingWhotCard(card);
        setGameData(newGameData);
        setIsPlayerActionInProgress(false);
        isAnimationInProgressRef.current = false;
        setIsAnyAnimationInProgress(false);
        return;
      } else if (card.special === 'holdon') {
        newGameData.lastAction = `You - ${card.number}${card.shape} hold`;
        newGameData.skipNextPlayer = true;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `You played ${card.number}${card.shape} (Hold On) - Next player's turn skipped`]
        };
      } else if (card.special === 'generalmarket') {
        newGameData.lastAction = `You - ${card.number}${card.shape} gen`;
        newGameData.generalMarketActive = true;
        newGameData.generalMarketOriginatorId = 0;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `You played ${card.number}${card.shape} (General Market) - All other players must draw from market`]
        };
      } else {
        newGameData.lastAction = `You - ${card.number}${card.shape}`;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `You played ${card.number}${card.shape}`]
        };
      }
      if (player.cards.length === 0) {
        setGameData(newGameData);
        handleRoundEnd(newGameData);
        setIsPlayerActionInProgress(false);
        isAnimationInProgressRef.current = false;
        setIsAnyAnimationInProgress(false);
      } else {
        setGameData(newGameData);
        setIsPlayerActionInProgress(false);
        isAnimationInProgressRef.current = false;
        setIsAnyAnimationInProgress(false);
        if (newGameData.gamePhase === 'playing') {
          nextTurn(newGameData);
        }
      }
    }, 800);
  };

  const playMultiplayerCard = async (cardIndex) => {
    if (!gameData || !currentRoom || !currentUser || isPlayerActionInProgress) return;
    
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = players.findIndex(p => p.id === currentUser.id);
    if (currentUserActualIndex === -1) return;
    if (gameData.currentPlayer !== currentUserActualIndex) {

      return;
    }
    
    const currentPlayerData = players[currentUserActualIndex];
    const actualCardIndex = cardIndex + playerScrollIndex;
    const card = currentPlayerData.cards[actualCardIndex];
    const topCard = gameData.playPile[gameData.playPile.length - 1];
    
    if (topCard.chosenShape) {
      if (card.special !== 'whot' && card.shape !== topCard.chosenShape) return;
    } else if (!canPlayCard(card, topCard)) {
      return;
    }
    
    try {
      // Handle WHOT cards differently - show popup immediately without animation
      if (card.special === 'whot') {
        setIsPlayerActionInProgress(true);
        setPendingWhotCard(card);
        setIsPlayerActionInProgress(false);
        return;
      }
      
      // For all other cards, proceed with normal animation
      setIsPlayerActionInProgress(true);
      setIsAnyAnimationInProgress(true);
      
      const newCardRelativeStyle = getPlayPilePosition(gameData.playPile.length, false);
      const endPosition = {
        ...animationPositions.playPile,
        transform: `${animationPositions.playPile.transform} ${newCardRelativeStyle.transform}`,
        zIndex: newCardRelativeStyle.zIndex
      };
      
      const animatingCard = {
        ...card,
        id: `player-play-${Date.now()}-${actualCardIndex}`,
        startPos: getExactCardPosition(currentUserActualIndex, actualCardIndex, currentPlayerData.cards.length, true),
        endPos: endPosition,
        isPlayerCard: true,
        type: 'player-play'
      };
      
      // Start animation using the modular system
      startAnimations([animatingCard], setAnimatingCards, () => {
        getPlayPilePosition(gameData.playPile.length, true);
      });
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newGameData = {
        ...gameData
      };
      const newPlayers = [...newGameData.players];
      const currentPlayer = {
        ...newPlayers[currentUserActualIndex]
      };
      currentPlayer.cards = currentPlayer.cards.filter((_, idx) => idx !== actualCardIndex);
      newPlayers[currentUserActualIndex] = currentPlayer;
      newGameData.players = newPlayers;
      
      // Add card to play pile for all other card types
      newGameData.playPile = [...newGameData.playPile, card];
      newGameData.playPile = [...newGameData.playPile, card];
      
      const newCardsLength = currentPlayer.cards.length;
      const maxScroll = Math.max(0, newCardsLength - maxVisiblePlayerCards);
      if (newCardsLength <= maxVisiblePlayerCards) {
        setPlayerScrollIndex(0);
      } else if (playerScrollIndex >= maxScroll) {
        setPlayerScrollIndex(maxScroll);
      } else if (actualCardIndex < playerScrollIndex + Math.floor(maxVisiblePlayerCards / 2)) {
        setPlayerScrollIndex(Math.max(0, playerScrollIndex - 1));
      }
      
      if (card.special === 'pick2') {
        newGameData.pendingPickCount += 2;
        newGameData.lastAction = `${currentPlayer.name} - ${card.number}${card.shape} pick2`;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${card.number}${card.shape} (Pick 2) - Next player must draw 2 cards`]
        };
      } else if (card.special === 'holdon') {
        newGameData.lastAction = `${currentPlayer.name} - ${card.number}${card.shape} hold`;
        newGameData.skipNextPlayer = true;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${card.number}${card.shape} (Hold On) - Next player's turn skipped`]
        };
      } else if (card.special === 'generalmarket') {
        newGameData.lastAction = `${currentPlayer.name} - ${card.number}${card.shape} gen`;
        newGameData.generalMarketActive = true;
        newGameData.generalMarketOriginatorId = currentUserActualIndex;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${card.number}${card.shape} (General Market) - All other players must draw from market`]
        };
  
      } else {
        newGameData.lastAction = `${currentPlayer.name} - ${card.number}${card.shape}`;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played ${card.number}${card.shape}`]
        };
      }
      
      if (currentPlayer.cards.length === 0) {
        await handleMultiplayerRoundEnd(newGameData);
      } else {
        const nextPlayerIndex = getNextPlayer(newGameData);
        newGameData.currentPlayer = nextPlayerIndex;
        newGameData.skipNextPlayer = false;
        if (newGameData.generalMarketActive && nextPlayerIndex === newGameData.generalMarketOriginatorId) {
          newGameData.generalMarketActive = false;
          newGameData.generalMarketOriginatorId = null;
          newGameData.lastAction += ' General Market effect ends.';
          newGameData.gameLog = {
            ...newGameData.gameLog,
            [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), 'General Market effect ended - all players have drawn']
          };
        }
        // Update local state immediately for better responsiveness
        setGameData(newGameData);
        await update(ref(db, `rooms/${currentRoom.id}/gameData`), newGameData);
      }
      
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
    } catch (error) {
      console.error('Error playing multiplayer card:', error);
      setIsPlayerActionInProgress(false);
    }
  };

  const drawCard = async () => {
    if (!gameData || gameData.currentPlayer !== 0 || animatingCards.length > 0 || isPlayerActionInProgress || isAnyAnimationInProgress) return;
    updateGameActivity(); // Track activity for timeout
    setIsPlayerActionInProgress(true);
    isAnimationInProgressRef.current = true;
    setIsAnyAnimationInProgress(true);
    const newGameData = {
      ...gameData
    };
    const player = newGameData.players[0];
    const count = newGameData.pendingPickCount > 0 ? newGameData.pendingPickCount : newGameData.generalMarketActive && newGameData.currentPlayer !== newGameData.generalMarketOriginatorId ? 1 : 1;
    const isPending = newGameData.pendingPickCount > 0;
    const isGeneral = newGameData.generalMarketActive && newGameData.currentPlayer !== newGameData.generalMarketOriginatorId && !isPending;
    await animateDrawCards(newGameData, player, count, isPending, isGeneral);
  };

  const drawMultiplayerCard = async () => {
    if (!gameData || !currentRoom || isPlayerActionInProgress || isAnyAnimationInProgress || animatingCards.length > 0) return;
    updateGameActivity(); // Track activity for timeout
    
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = players.findIndex(p => p.id === (currentUser?.id));
    if (gameData.currentPlayer !== currentUserActualIndex) {

      return;
    }
    
    const currentPlayer = players[currentUserActualIndex];
    if (currentPlayer.eliminated) return;
    
    setIsPlayerActionInProgress(true);
    isAnimationInProgressRef.current = true;
    setIsAnyAnimationInProgress(true);
    
    const newGameData = JSON.parse(JSON.stringify(gameData));
    const player = newGameData.players[currentUserActualIndex];
    
    // Handle card drawing like AI game with animation
    if (newGameData.drawPile.length <= 1) {
      reshuffleMarket(newGameData);
    }
    
    if (newGameData.drawPile.length > 0) {
      const cardsToDraw = newGameData.pendingPickCount > 0 ? newGameData.pendingPickCount : 1;
      const isPending = newGameData.pendingPickCount > 0;
      const isGeneral = newGameData.generalMarketActive && newGameData.currentPlayer !== newGameData.generalMarketOriginatorId && !isPending;

      
      // Use the same animation function as AI game
      // animateDrawCards modifies the gameDataToUse object, so we need to use the returned data
      const updatedGameData = await animateDrawCards(newGameData, player, cardsToDraw, isPending, isGeneral);
      if (updatedGameData) {
        // Copy all the updated data to ensure everything is properly updated
        Object.assign(newGameData, updatedGameData);
      }
      
      // Clear pending pick count after drawing and set appropriate log messages
      if (newGameData.pendingPickCount > 0) {
        newGameData.pendingPickCount = 0;
        newGameData.lastAction = `${player.name} picked ${cardsToDraw} cards`;
        const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, `${player.name} drew ${cardsToDraw} card${cardsToDraw > 1 ? 's' : ''} (penalty)`]
        };

      } else if (isGeneral) {
        newGameData.lastAction = `${player.name} drew a card`;
        const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, `${player.name} drew 1 card (general market)`]
        };

      } else {
        newGameData.lastAction = `${player.name} drew a card`;
        const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, `${player.name} drew 1 card from market`]
        };

      }
    }
    
    // Move to next player like AI game
    const nextPlayerIndex = getNextPlayer(newGameData);
    newGameData.currentPlayer = nextPlayerIndex;
    newGameData.skipNextPlayer = false;
    
    // Check if General Market effect should end (when turn comes back to originator)
    if (newGameData.generalMarketActive && nextPlayerIndex === newGameData.generalMarketOriginatorId) {
      newGameData.generalMarketActive = false;
      newGameData.generalMarketOriginatorId = null;
      newGameData.lastAction += ' General Market effect ends.';
      newGameData.gameLog = {
        ...newGameData.gameLog,
        [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), 'General Market effect ended - all players have drawn']
      };

    }
    
    // Update local state immediately for better responsiveness
    setGameData(newGameData);
    // Update Firebase with complete state

    await update(ref(db, `rooms/${currentRoom.id}/gameData`), newGameData);
    setIsPlayerActionInProgress(false);
    isAnimationInProgressRef.current = false;
    setIsAnyAnimationInProgress(false);
  };

  const leaveRoom = async () => {
    if (!currentUser || !currentRoom) return;
    
    // Clear game timeout when leaving room
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    
    const roomRef = ref(db, `rooms/${currentRoom.id}`);
    await remove(ref(db, `rooms/${currentRoom.id}/players/${currentUser.id}`));
    
    const roomSnapshot = await get(roomRef);
    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.val();
      if (Object.keys(roomData.players || {}).length === 0) {
        await remove(roomRef);
      }
    }
    
    // Clean up localStorage
    try {
      localStorage.removeItem(`whotgo_room_${currentRoom.id}`);
      localStorage.removeItem(`whotgo_currentRoom`);
    } catch (e) {
      console.warn('Failed to clean up room data from localStorage:', e);
    }
    
    // Stop game music when leaving room
    soundEffects.stopGameMusic();
    
    setCurrentRoom(null);
    setGameState('menu');
  };

  const initializeGame = () => {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const players = [{
      id: 0,
      name: 'You',
      cards: [],
      isAI: false,
      eliminated: false
    }, {
      id: 1,
      name: 'AI Shadow',
      cards: [],
      isAI: true,
      eliminated: false
    }, {
      id: 2,
      name: 'AI Phantom',
      cards: [],
      isAI: true,
      eliminated: false
    }, {
      id: 3,
      name: 'AI Wraith',
      cards: [],
      isAI: true,
      eliminated: false
    }];
    const cardsPerPlayer = getCardsPerPlayer(players.length);

    playPilePositionsRef.current = [];
    setPlayPilePositions([]);
    setGameData({
      players,
      playPile: [],
      drawPile: shuffledDeck,
      currentPlayer: 0,
      gamePhase: 'dealingCards',
      roundNumber: 1,
      lastAction: 'Dealing cards...',
      pendingPickCount: 0,
      generalMarketActive: false,
      generalMarketOriginatorId: null,

      gameLog: {
        1: [`Game started with ${players.length} players: ${players.map(p => p.name).join(', ')}`, 'Cards dealt to all players', 'The shadow realm awaits your first move...']
      }
    });
    
    // Start game music for single-player games
    soundEffects.startGameMusic();
    
    setTimeout(() => startDealingAnimation([...shuffledDeck], players, cardsPerPlayer), 500);
  };

  const returnToMenu = () => {
    try {
  
      
    // Clear game timeout
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    
      // Stop game music when returning to menu
      soundEffects.stopGameMusic();
      
      // Start background music when returning to menu
      startBackgroundMusic();
      
      // Clear all game state first to prevent any map operations on undefined data
    setGameData(null);
      setAnimatingCards([]);
      setIsAnyAnimationInProgress(false);
      setIsPlayerActionInProgress(false);
      setIsAITurnInProgress(false);
      
      // Clear other game-related state

    setPendingWhotCard(null);
    setPlayerScrollIndex(0);
    setShowDeckView(false);
    setShowEliminatedPopup(false);
    setShowRoundEndPopup(false);
    setRoundEndData(null);
    setShowGameLog(false);
    setSelectedLogRound(1);
    setActivePopup(null);
    setLastGameActivity(null);
    setAdminCardsRevealed(false);
    setAdminMarketRevealed(false);
    setShowAdminDeckOverview(false);
    setConfettiActive(false);
    setPlayPileCardPositions({});
    marketCardPositionsRef.current = [];
    playPilePositionsRef.current = [];
    setMarketCardPositions([]);
    setNeedNewMarketPositions(false);
      
      // Clear confetti canvas
    if (confettiCanvasRef.current) {
      const ctx = confettiCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, confettiCanvasRef.current.width, confettiCanvasRef.current.height);
    }
      
      // Handle room-specific cleanup
      if (currentRoom) {
        leaveRoom();
      } else {
        setGameState('menu');
      }
      
    // Clear localStorage when explicitly returning to menu
    clearGameState();
      

    } catch (error) {
      console.error('❌ Error in returnToMenu:', error);
      // Force reset to menu state even if there's an error
      setGameState('menu');
      setGameData(null);
      setIsAnyAnimationInProgress(false);
      clearGameState();
    }
  };

  // Initialize AI game when gameState changes to 'game' without a room
  useEffect(() => {
    if (gameState === 'game' && !currentRoom && !gameData) {
      initializeGame();
    }
  }, [gameState, currentRoom, gameData]);



  // Clean up stale room data from localStorage on app startup
  useEffect(() => {
    try {
      // Remove any stale room references from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('whotgo_room_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('whotgo_currentRoom');
    } catch (e) {
      console.warn('Failed to clean up stale room data from localStorage:', e);
    }
  }, []);



  const renderContent = () => {
    if (gameState === 'landing') {
      return (
        <div className="min-h-screen flex flex-col relative overflow-y-auto" style={pageStyles.landing}>
          <div className="flex flex-col items-center justify-center min-h-screen px-4 py-0 sm:py-4 -mt-4 sm:-mt-6">
            <div className="relative w-40 h-20 xs:w-48 xs:h-24 sm:w-64 sm:h-28 md:w-80 md:h-32 lg:w-96 lg:h-36 mb-6 sm:mb-8" style={{ transform: 'scale(1.1)', transformOrigin: 'center' }}>
              {cards.map((card, index) => (
                <div
                  key={index}
                  className={`absolute sm:w-16 sm:h-20 md:w-20 md:h-28 lg:w-24 lg:h-32 rounded-lg border-2 border-black shadow-2xl transform transition-all duration-700 ${index === currentCard ? 'scale-110 z-20 rotate-0' : 'scale-95'}`}
                  style={{
                    backgroundColor: card.color,
                    width: '72px', // 50% bigger than 48px (w-12)
                    height: '96px', // 50% bigger than 64px (h-16)
                    left: `calc(50% - 36px + ${(index * 12) + Math.sin(Date.now() * 0.001 + index) * 3}px)`,
                    bottom: '0px',
                    zIndex: index === currentCard ? 20 : 10 - index,
                    opacity: index === currentCard ? 1 : 0.7,
                    transform: `scale(${index === currentCard ? 1.1 : 0.95}) rotate(${index === currentCard ? 0 : (index - 2) * 6}deg) translateY(${Math.sin(Date.now() * 0.002 + index) * 1}px)`,
                    transition: 'all 0.7s ease-in-out',
                    boxShadow: '3px 3px 0 rgba(0,0,0,0.8)'
                  }}
                >
                  <div 
                    className="flex items-center justify-center w-full h-full" 
                    dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }}
                    style={{ 
                      willChange: 'transform',
                      transform: 'translateZ(0)' // Force hardware acceleration
                    }}
                  />
                </div>
              ))}
            </div>
            <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} max-w-6xl`}>
              <div className="mb-6 sm:mb-8 md:mb-12">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 text-white relative border-4 border-black bg-[#80142C] p-2 sm:p-4 uppercase" style={{
                  fontFamily: 'Courier New, Liberation Mono, monospace',
                  textShadow: '4px 4px 0 #000000',
                  boxShadow: '8px 8px 0 rgba(0,0,0,0.8)'
                }}>
                  <span className="text-white">whot</span>
                  <span className="text-yellow-400 ml-1 sm:ml-2 md:ml-4">Go!</span>
                </h1>
                <div className="text-white text-sm sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wider uppercase" style={{
                  fontFamily: 'Courier New, Liberation Mono, monospace',
                  textShadow: '2px 2px 0 #000000'
                }}>
                  ◆ THE CLASSIC 4-PLAYER CARD GAME ◆
                </div>
              </div>
              <div className="mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-2 sm:mb-3 leading-relaxed text-gray-200">
                  Experience the <span className="text-[#80142C] font-bold">beloved classic</span> card game for everyone
                </p>
                <p className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed">
                  Strategic thinking meets fun gameplay in exciting 4-player matches with friends or AI opponents.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                <div className="flex items-center gap-1">
                  <div className="h-12 flex items-center border-3 border-black" style={{
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.8)'
                  }}>
                    <WalletMultiButton style={{ 
                      backgroundColor: '#80142C',
                      fontFamily: 'Courier New, Liberation Mono, monospace',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      border: '3px solid #000000',
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.8)'
                    }} />
                  </div>
                  <button onClick={() => {
                    playSoundEffect.click();
                    setShowHelp(true);
                  }} className="bg-[#80142C] hover:bg-[#4a0c1a] text-white w-10 h-10 sm:w-12 sm:h-12 transition-all duration-200 border-3 border-black flex items-center justify-center font-bold text-base sm:text-lg uppercase" title="Game Help & Guide" style={{
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
                    fontFamily: 'Courier New, Liberation Mono, monospace'
                  }}>
                    <span>?</span>
                  </button>
                </div>
                <button
                  disabled={!connected || isCreatingProfile || isCheckingProfile}
                  onClick={async () => {
                    playSoundEffect.click();
                    
                    if (connected && honeycombProfileExists) {
                      // Profile exists, preload all sounds and start music
                      try {
                        await soundEffects.initializeAfterUserInteraction();
                        await soundEffects.preloadAllSounds();
                        await soundEffects.preloadMusic();
                        soundEffects.startBackgroundMusic();
                        setGameState('menu');
                      } catch (error) {
                        // Still proceed to menu even if sounds fail
                        soundEffects.startBackgroundMusic();
                        setGameState('menu');
                      }
                    } else if (connected && !honeycombProfileExists) {
                      // Profile doesn't exist, create it
              
                      if (publicKey && wallet && signMessage) {
                        setIsCreatingProfile(true);
                        try {
                          const result = await createUserProfileWithSOLManagement(
                            publicKey, 
                            wallet, 
                            signMessage,
                            `Player${Math.floor(Math.random() * 10000)}`
                          );
                          if (result.success) {
                    
                            setHoneycombProfileExists(true);
                            // Initialize sounds and start music
                            try {
                              await soundEffects.initializeAfterUserInteraction();
                              await soundEffects.preloadAllSounds();
                              await soundEffects.preloadMusic();
                              soundEffects.startBackgroundMusic();
                              setGameState('menu');
                            } catch (error) {
                              // console.warn('🎵 Failed to initialize sounds:', error);
                              soundEffects.startBackgroundMusic();
                              setGameState('menu');
                            }
                          }
                        } catch (error) {
                          console.error('❌ Failed to create profile:', error);
                          // Show error message to user
                          alert(`Profile creation failed: ${error.message}. Please try again.`);
                        } finally {
                          setIsCreatingProfile(false);
                        }
                      }
                    }
                  }}
                  className={`group relative px-12 py-4 font-bold text-xl transform transition-all duration-300 overflow-hidden border-4 border-black uppercase ${connected && !isCheckingProfile && !isCreatingProfile ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  style={{
                    background: connected && !isCheckingProfile ? '#80142C' : '#4a4a4a',
                    color: '#ffffff',
                    boxShadow: connected && !isCheckingProfile ? '6px 6px 0 rgba(0,0,0,0.8)' : '6px 6px 0 rgba(74, 74, 74, 0.4)',
                    fontFamily: 'Courier New, Liberation Mono, monospace'
                  }}
                  onMouseEnter={e => {
                    if (connected && !isCheckingProfile && !isCreatingProfile) {
                      e.target.style.background = '#a01d39';
                      e.target.style.transform = 'translateY(-2px) translateX(-2px)';
                      e.target.style.boxShadow = '8px 8px 0 rgba(0,0,0,0.8)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (connected && !isCheckingProfile && !isCreatingProfile) {
                      e.target.style.background = '#80142C';
                      e.target.style.transform = 'translateY(0) translateX(0)';
                      e.target.style.boxShadow = '6px 6px 0 rgba(0,0,0,0.8)';
                    }
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {connected ? (
                      <>
                        <span>
                          {isCheckingProfile ? 'Connecting...' :
                           isCreatingProfile ? 'Creating Profile...' : 
                           honeycombProfileExists ? 'Start Playing' : 'Setup Profile'}
                        </span>
                        {!isCheckingProfile && !isCreatingProfile && (
                        <ChevronRight className="ml-3 group-hover:translate-x-1 transition-transform duration-200" size={24} />
                        )}
                      </>
                    ) : 'Connect Wallet to Play'}
                  </span>
                  
                  {connected && honeycombProfileExists && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  )}
                </button>
                <p className="text-xs sm:text-sm text-gray-400 italic max-w-sm sm:max-w-md text-center mt-3 sm:mt-4 px-2">
                  Connect your wallet and start playing the classic African card game that brings families together.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (gameState === 'rooms') {
      return (
        <div className="min-h-screen flex flex-col relative overflow-y-auto" style={pageStyles.menu}>
          <div className="flex-1 flex flex-col justify-start items-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl relative">
              <button onClick={() => {
                playSoundEffect.back();
                setGameState('menu');
              }} className="absolute -top-2 left-0 text-white hover:text-gray-300 transition-all duration-300 flex items-center group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
              </button>
              <div className="text-center mb-8 sm:mb-12 mt-12 sm:mt-16">
              </div>
              
              <div className="mb-6 sm:mb-8">
                <button 
                  onClick={() => {
                    playSoundEffect.click();
                    createRoom();
                  }} 
                  disabled={!currentUser} 
                  className="group w-full p-4 sm:p-6 bg-[#80142C] transition-all duration-200 hover:bg-[#4a0c1a] disabled:opacity-50 disabled:cursor-not-allowed border-3 border-black font-bold uppercase" 
                  style={{
                    boxShadow: '6px 6px 0 rgba(0,0,0,0.8)',
                    fontFamily: 'Courier New, Liberation Mono, monospace'
                  }}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#80142C] flex items-center justify-center border-2 border-white mr-3 sm:mr-4" style={{
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.8)'
                    }}>
                      <Plus className="text-white" size={20} />
                    </div>
                    <div className="text-center">
                      <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">Create New Room</h2>
                      <p className="text-gray-200 text-sm sm:text-base">Start your own game room</p>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="p-4 sm:p-6 border-3 border-white bg-gray-900 bg-opacity-50" style={{
                boxShadow: '6px 6px 0 rgba(0,0,0,0.8)'
              }}>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center uppercase" style={{
                  fontFamily: 'Courier New, Liberation Mono, monospace',
                  textShadow: '2px 2px 0 #000000'
                }}>
                  <Users className="mr-2 sm:mr-3" size={20} />
                  Available Rooms ({rooms.length})
                </h3>
                {rooms.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-400">
                    <Users size={40} className="mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-base sm:text-lg">No rooms available</p>
                    <p className="text-xs sm:text-sm">Create a new room to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                    {rooms.map(room => {
                      const playerCount = Object.keys(room.players || {}).length;
                      const canJoin = playerCount < room.maxPlayers && room.status === 'waiting';
                      return (
                        <div key={room.id} className="bg-gray-800 p-3 sm:p-4 border-2 border-black flex items-center justify-between" style={{
                          boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
                          fontFamily: 'Courier New, Liberation Mono, monospace'
                        }}>
                          <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#80142C] flex items-center justify-center mr-3 sm:mr-4">
                              <Crown className="text-white" size={16} />
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm sm:text-base">{room.ownerUsername}'s Room</h4>
                              <p className="text-gray-300 text-xs sm:text-sm">
                                {playerCount}/{room.maxPlayers} players
                                {room.status === 'countdown' && ` • Starting in ${room.countdown}s`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {room.status === 'countdown' && (
                              <div className="flex items-center text-yellow-400 mr-2">
                                <Clock size={16} className="mr-1" />
                                <span className="text-sm font-bold">{room.countdown}s</span>
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                playSoundEffect.click();
                                joinRoom(room.id);
                              }} 
                              disabled={!canJoin || !currentUser} 
                              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {canJoin ? 'Join' : room.status === 'countdown' ? 'Starting' : 'Full'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {!currentUser && (
                <div className="mt-6 p-4 bg-yellow-900 bg-opacity-50 border border-yellow-600">
                  <p className="text-yellow-200 text-center">
                    Connect your wallet to join or create rooms
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (gameState === 'room' && currentRoom) {
      return (
        <div className="h-full flex flex-col relative" style={{
          background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%)',
          fontFamily: "'Courier New', 'Liberation Mono', monospace"
        }}>
          <div className="flex-1 flex flex-col justify-start items-center px-4 py-8 min-h-0">
            <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl relative">
              <button onClick={() => {
                playSoundEffect.back();
                leaveRoom();
              }} className="absolute -top-2 left-0 text-white hover:text-gray-300 transition-all duration-300 flex items-center group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
              </button>
              <div className="text-center mb-12 mt-16">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                  {currentRoom.ownerUsername}'s Room
                </h1>
                <div className="text-white text-lg tracking-wider">
                  {currentRoom.status === 'waiting' && 'Waiting for Players'}
                  {currentRoom.status === 'countdown' && `Starting in ${gameCountdown}s`}
                  {currentRoom.status === 'playing' && 'Game in Progress'}
                </div>
              </div>
              
              {currentRoom.status === 'countdown' && gameCountdown && (
                <div className="mb-8 text-center">
                  <div className="text-6xl font-bold text-[#80142C] mb-4">{gameCountdown}</div>
                  <p className="text-xl text-white">Game starting...</p>
                </div>
              )}
              
              <div className="bg-gray-900 p-6 mb-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Users className="mr-3" size={24} />
                  Players ({Object.keys(currentRoom.players || {}).length}/4)
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 320px))',
                  gap: '16px',
                  justifyContent: 'center'
                }}>
                  {Object.values(currentRoom.players || {}).map(player => (
                    <div key={player.id} className="bg-gray-800 p-4 flex items-center justify-between border-2 border-gray-700">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 flex items-center justify-center mr-3 ${player.id === currentRoom.ownerId ? 'bg-yellow-600' : 'bg-gray-600'}`}>
                          {player.id === currentRoom.ownerId ? (
                            <Crown size={20} className="text-white" />
                          ) : (
                            <Users size={20} className="text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{player?.username || 'Unknown Player'}</h4>
                          <p className="text-gray-300 text-sm">
                            {player.id === currentRoom.ownerId ? 'Room Owner' : 'Player'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {player.id !== currentRoom.ownerId && (
                          <div className={`px-3 py-1 text-sm font-bold ${player.ready ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                            {player.ready ? 'Ready' : 'Not Ready'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {Array.from({ length: 4 - Object.keys(currentRoom.players || {}).length }, (_, index) => (
                    <div key={`empty-${index}`} className="bg-gray-900 p-4 border-2 border-dashed border-gray-600 flex items-center justify-center">
                      <div className="text-gray-500 text-center">
                        <Users size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for player...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                {currentUser?.id === currentRoom.ownerId ? (
                  <button 
                    onClick={() => {
                      playSoundEffect.click();
                      startGameCountdown();
                    }} 
                    disabled={Object.keys(currentRoom.players || {}).length < 2 || currentRoom.status !== 'waiting'} 
                    className="px-8 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Game
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      playSoundEffect.click();
                      toggleReady();
                    }} 
                    disabled={currentRoom.status !== 'waiting'} 
                    className={`px-8 py-3 font-bold transition-colors ${currentRoom.players[currentUser?.id]?.ready ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-green-600 text-white hover:bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {currentRoom.players[currentUser?.id]?.ready ? 'Not Ready' : 'Ready Up'}
                  </button>
                )}
                <button 
                  onClick={() => {
                    playSoundEffect.back();
                    leaveRoom();
                  }} 
                  className="px-8 py-3 bg-[#80142C] text-white font-bold hover:bg-[#4a0c1a] transition-colors"
                >
                  Leave Room
                </button>
              </div>
              
              <div className="mt-6 text-center text-gray-400">
                {currentUser?.id === currentRoom.ownerId && Object.keys(currentRoom.players || {}).length < 2 && (
                  <p>Need at least 2 players to start the game</p>
                )}
                {currentUser?.id !== currentRoom.ownerId && !currentRoom.players[currentUser?.id]?.ready && (
                  <p>Click "Ready Up" when you're ready to play</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (gameState === 'menu') {
        return (
        <div className="min-h-screen flex flex-col relative overflow-y-auto" style={pageStyles.menu}>
          <div className="flex-1 flex flex-col justify-start items-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-6xl relative">
              <button onClick={() => {
                playSoundEffect.back();
                setGameState('landing');
              }} className="absolute -top-2 left-0 text-white hover:text-gray-300 transition-all duration-300 flex items-center group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
              </button>
              <div className="text-center mb-8 sm:mb-12 mt-12 sm:mt-16">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 text-white border-4 border-black bg-[#80142C] p-2 sm:p-4 inline-block uppercase" style={{
                  fontFamily: 'Courier New, Liberation Mono, monospace',
                  textShadow: '4px 4px 0 #000000',
                  boxShadow: '8px 8px 0 rgba(0,0,0,0.8)'
                }}>
                  Main Menu
                </h1>
                <div className="text-white text-sm sm:text-lg tracking-wider font-bold uppercase" style={{
                  fontFamily: 'Courier New, Liberation Mono, monospace',
                  textShadow: '2px 2px 0 #000000'
                }}>
                  Select an Option
                </div>
              </div>
              <div className="w-full flex justify-center items-center">
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 380px))',
                  gap: '16px',
                  marginBottom: '24px',
                  maxWidth: '800px',
                  width: '100%',
                  minHeight: '250px',
                  justifyContent: 'center'
                }}>
                  <button 
                    onClick={() => {
                      playSoundEffect.click();
                      setActivePopup('battle');
                    }} 
                    disabled={!connected}
                    className={`group w-full p-6 transition-all duration-200 border-3 border-black font-bold uppercase ${connected ? 'bg-[#80142C] hover:bg-[#4a0c1a]' : 'bg-gray-600 cursor-not-allowed'}`}
                    style={{
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
                      fontFamily: 'Courier New, Liberation Mono, monospace'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#80142C] flex items-center justify-center border-2 border-white" style={{
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                      }}>
                        <Play className="text-white" size={16} />
                      </div>
                      <div className="ml-3 sm:ml-4 text-left">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Play Game</h2>
                        <p className="text-gray-200 text-xs sm:text-sm">Start a new Whot game</p>
                      </div>
                      <ChevronRight className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200" size={16} />
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      playSoundEffect.click();
                      setActivePopup('profile');
                    }} 
                    disabled={!connected}
                    className={`group w-full p-6 transition-all duration-200 border-3 border-black font-bold uppercase ${connected ? 'bg-[#80142C] hover:bg-[#4a0c1a]' : 'bg-gray-600 cursor-not-allowed'}`}
                    style={{
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
                      fontFamily: 'Courier New, Liberation Mono, monospace'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#80142C] flex items-center justify-center border-2 border-white" style={{
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                      }}>
                        <Shield className="text-white" size={16} />
                      </div>
                      <div className="ml-3 sm:ml-4 text-left">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Profile</h2>
                        <p className="text-gray-200 text-xs sm:text-sm">View your player profile</p>
                      </div>
                      <ChevronRight className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200" size={16} />
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      playSoundEffect.click();
                      setActivePopup('achievements');
                    }} 
                    disabled={!connected}
                    className={`group w-full p-6 transition-all duration-200 border-3 border-black font-bold uppercase ${connected ? 'bg-[#80142C] hover:bg-[#4a0c1a]' : 'bg-gray-600 cursor-not-allowed'}`}
                    style={{
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
                      fontFamily: 'Courier New, Liberation Mono, monospace'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#80142C] flex items-center justify-center border-2 border-white" style={{
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                      }}>
                        <Award className="text-white" size={16} />
                      </div>
                      <div className="ml-3 sm:ml-4 text-left">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Achievements</h2>
                        <p className="text-gray-200 text-xs sm:text-sm">Track your progress</p>
                      </div>
                      <ChevronRight className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200" size={16} />
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      playSoundEffect.click();
                      setActivePopup('config');
                    }} 
                    className="group w-full p-6 bg-[#80142C] transition-all duration-200 hover:bg-[#4a0c1a] border-3 border-black font-bold uppercase"
                    style={{
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
                      fontFamily: 'Courier New, Liberation Mono, monospace'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#80142C] flex items-center justify-center border-2 border-white" style={{
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                      }}>
                        <Settings className="text-white" size={16} />
                      </div>
                      <div className="ml-3 sm:ml-4 text-left">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Settings</h2>
                        <p className="text-gray-200 text-xs sm:text-sm">Adjust game preferences</p>
                      </div>
                      <ChevronRight className="ml-auto text-gray-200 group-hover:translate-x-1 transition-transform duration-200" size={16} />
                    </div>
                  </button>
                </div>
              </div>
              <div className="text-center mt-6 sm:mt-8">
                <p className="text-gray-400 italic uppercase text-xs sm:text-sm">
                    Choose an option above to get started with Whot Go!
                  </p>
              </div>
            </div>
          </div>
          {activePopup && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => {
              playSoundEffect.back();
              setActivePopup(null);
            }}>
              <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {activePopup === 'battle' && <GameModePopup 
                  onClose={() => {
                    playSoundEffect.back();
                    setActivePopup(null);
                  }}
                  onSelectMultiplayer={() => {
                    playSoundEffect.click();
                    setActivePopup(null);
                    setGameState('rooms');
                  }}
                  onSelectAI={() => {
                    playSoundEffect.click();
                    setActivePopup(null);
                    stopBackgroundMusic();
                    setGameState('game');
                  }}
                />}
                {activePopup === 'profile' && <ProfilePopup 
                  userProfile={currentUser} 
                  updateUsername={updateUsername} 
                  closePopup={() => {
                    playSoundEffect.back();
                    setActivePopup(null);
                  }}
                  onShowLeaderboard={() => {
                    playSoundEffect.click();
                    setActivePopup('leaderboards');
                  }}
                />}
                        {activePopup === 'achievements' && <AchievementPopup
          closePopup={() => {
            playSoundEffect.back();
            setActivePopup(null);
          }}
                userProfile={currentUser}
                achievements={achievements}
        />}
              {showSyncPopup && <SyncPopup
                firebaseData={syncPopupData?.firebaseData}
                honeycombProfile={syncPopupData?.honeycombProfile}
                onSync={handleSyncToHoneycomb}
                onClose={() => {
                  setShowSyncPopup(false);
                  setSyncPopupData(null);
                }}
        />}
                {activePopup === 'leaderboards' && <LeaderboardPopup 
                  leaderboardData={leaderboardData} 
                  closePopup={() => {
                    playSoundEffect.back();
                    setActivePopup(null);
                  }}
                  onBackToProfile={() => {
                    playSoundEffect.back();
                    setActivePopup('profile');
                  }}
  

                />}
                {activePopup === 'config' && <SettingsPopup 
                  musicVolume={musicVolume}
                  soundVolume={soundVolume}
                  setMusicVolume={setMusicVolume}
                  setSoundVolume={setSoundVolume}
                  closePopup={() => {
                    playSoundEffect.back();
                    setActivePopup(null);
                  }} 
                />}
              </div>
            </div>
          )}
        </div>
      );
    } else if (gameState === 'game') {
      // Check if we have valid game data
      if (gameData && Array.isArray(gameData.players) && gameData.players.length > 0 && gameData.players.every(p => Array.isArray(p.cards))) {
        return <Game gameData={gameData} currentUser={currentUser} isAdmin={isAdmin} adminCardsRevealed={adminCardsRevealed} adminMarketRevealed={adminMarketRevealed} setAdminCardsRevealed={setAdminCardsRevealed} setAdminMarketRevealed={setAdminMarketRevealed} showAdminDeckOverview={showAdminDeckOverview} setShowAdminDeckOverview={setShowAdminDeckOverview} playCard={playCard} playMultiplayerCard={playMultiplayerCard} drawCard={drawCard} drawMultiplayerCard={drawMultiplayerCard} showDeckView={showDeckView} setShowDeckView={setShowDeckView} showGameLog={showGameLog} setShowGameLog={setShowGameLog} currentRoom={currentRoom} turnTimer={turnTimer} animatingCards={animatingCards} setAnimatingCards={setAnimatingCards} playerScrollIndex={playerScrollIndex} setPlayerScrollIndex={setPlayerScrollIndex} maxVisiblePlayerCards={maxVisiblePlayerCards} playPileCardPositions={playPileCardPositions} marketCardPositions={marketCardPositions} animationPositions={animationPositions} isPlayerActionInProgress={isPlayerActionInProgress} isAnyAnimationInProgress={isAnyAnimationInProgress} setPlayPileCardPositions={setPlayPileCardPositions} setMarketCardPositions={setMarketCardPositions} setIsPlayerActionInProgress={setIsPlayerActionInProgress} setIsAnyAnimationInProgress={setIsAnyAnimationInProgress} returnToMenu={returnToMenu} setGameData={setGameData} startDealingAnimation={startDealingAnimation} handleMultiplayerRoundEnd={handleMultiplayerRoundEnd} handleRoundEnd={handleRoundEnd} />;
      } else {
        // Show loading state while game data is being set up
        return (
          <div className="h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-xl mb-2">Starting game...</div>
              <div className="text-sm text-gray-400">Please wait</div>
            </div>
          </div>
        );
      }
    } else {
      // Safe fallback to avoid blank screen if state is inconsistent
      return (
        <div className="h-full flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-xl mb-2">Loading...</div>
            <div className="text-sm text-gray-400">Please wait</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <style jsx>{`
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          height: 100% !important;
          overflow: hidden !important;
          font-family: 'Courier New', 'Liberation Mono', monospace !important;
        }
        * {
          box-sizing: border-box;
          outline: none !important;
          border: none !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Courier New', 'Liberation Mono', monospace !important;
        }
        *:focus {
          outline: none !important;
          border: none !important;
        }
        button:focus,
        input:focus,
        select:focus,
        textarea:focus,
        div:focus {
          outline: none !important;
          border: none !important;
        }
        button, input, select, textarea, div {
          outline: none !important;
          border: none !important;
        }
        /* Card Game Animations */
        .card-animation {
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        @keyframes cardDeal {
          from {
            transform: var(--start-transform, translate(0, 0)) translateZ(0);
            opacity: 1;
          }
          to {
            transform: var(--end-transform, translate(0, 0)) translateZ(0);
            opacity: 1;
          }
        }
        /* Page Transitions */
        .page-transition {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }
        .page-enter {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        .page-enter-active {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        .page-exit {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        .page-exit-active {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        /* Card-like transitions */
        .card-flip {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .card-flip:hover {
          transform: rotateY(5deg) rotateX(5deg) scale(1.05);
        }
        /* Retro terminal button styling */
        button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          transform: translateZ(0);
          font-family: 'Courier New', 'Liberation Mono', monospace !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          border: 3px solid #000000 !important;
          box-shadow: 4px 4px 0 rgba(0,0,0,0.8) !important;
        }
        button:hover {
          transform: translateY(-1px) translateX(-1px);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.8) !important;
          filter: brightness(1.1);
        }
        button:active {
          transform: translateY(2px) translateX(2px);
          box-shadow: 2px 2px 0 rgba(0,0,0,0.8) !important;
        }
        /* Modal/Popup card-like animations */
        .modal-enter {
          opacity: 0;
          transform: scale(0.8) rotateY(-10deg);
        }
        .modal-enter-active {
          opacity: 1;
          transform: scale(1) rotateY(0deg);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fade-in {
          animation: fadeInModal 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .scale-in {
          animation: scaleInCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeInModal {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
        }
        @keyframes scaleInCard {
          from {
            opacity: 0;
            transform: scale(0.8) rotateY(-15deg) rotateX(10deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateY(0deg) rotateX(0deg);
          }
        }
        /* Retro card hover effects */
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          border: 2px solid #000000 !important;
          box-shadow: 3px 3px 0 rgba(0,0,0,0.8) !important;
        }
        .card-hover:hover {
          transform: translateY(-2px) translateX(-2px);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.8) !important;
        }
        /* Smooth state transitions */
        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .deck-scroll-transition {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Interactive element enhancements */
        .interactive:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        /* Card stack effect */
        .card-stack {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-stack:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 
            0 5px 15px rgba(0, 0, 0, 0.2),
            0 10px 25px rgba(128, 20, 44, 0.1),
            0 15px 35px rgba(128, 20, 44, 0.05);
        }
        /* Round end popup animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        /* Enhanced confetti and celebration effects */
        .celebration-pause {
          animation: celebrationGlow 2s ease-in-out;
        }
        @keyframes celebrationGlow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.3) contrast(1.1);
          }
        }
        /* Volume Slider Styles */
        .slider {
          --slider-width: 100%;
          --slider-height: 6px;
          --slider-bg: rgb(82, 82, 82);
          --slider-border-radius: 999px;
          --level-color: #80142C;
          --level-transition-duration: .1s;
          --icon-margin: 15px;
          --icon-color: var(--slider-bg);
          --icon-size: 25px;
        }
        .slider {
          cursor: pointer;
          display: inline-flex;
          flex-direction: row-reverse;
          align-items: center;
        }
        .slider .volume {
          display: inline-block;
          vertical-align: top;
          margin-right: var(--icon-margin);
          color: var(--icon-color);
          width: var(--icon-size);
          height: auto;
        }
        .slider .level {
          appearance: none;
          width: var(--slider-width);
          height: var(--slider-height);
          background: var(--slider-bg);
          overflow: hidden;
          border-radius: var(--slider-border-radius);
          transition: height var(--level-transition-duration);
          cursor: inherit;
        }
        .slider .level::-webkit-slider-thumb {
          appearance: none;
          width: 0;
          height: 0;
          box-shadow: -200px 0 0 200px var(--level-color);
        }
        .slider:hover .level {
          height: calc(var(--slider-height) * 2);
        }
        /* Custom Scrollbar Styles */
        * {
          scrollbar-width: thin;
          scrollbar-color: #80142C #2a2a2a;
        }
        /* Webkit browsers (Chrome, Safari, Edge) */
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        *::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #80142C, #4a0c1a);
          border-radius: 3px;
          border: none;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #a01d39, #661123);
        }
        *::-webkit-scrollbar-corner {
          background: #1a1a1a;
        }
        /* Special styling for main containers */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(26, 26, 26, 0.8);
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #80142C, #4a0c1a);
          border-radius: 4px;
          box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.1);
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a01d39, #661123);
          box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.2);
        }
        /* Horizontal scrollbars */
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(26, 26, 26, 0.8);
          border-radius: 3px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #80142C, #4a0c1a);
          border-radius: 3px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #a01d39, #661123);
        }
      `}</style>
      {renderContent()}
      {showGameLog && gameData && <GameLogPopup gameData={gameData} selectedLogRound={selectedLogRound} setSelectedLogRound={setSelectedLogRound} closePopup={() => setShowGameLog(false)} />}
              {showRoundEndPopup && roundEndData && <RoundEndPopup 
          roundEndData={roundEndData} 
          onContinue={handleContinueToNextRound}
          isMultiplayer={!!currentRoom}
          currentUser={currentUser}
          remainingPlayers={gameData?.players?.filter(p => !p.eliminated) || []}
        />}
      {showEliminatedPopup && <EliminatedPopup setShowEliminatedPopup={setShowEliminatedPopup} returnToMenu={returnToMenu} />}

      {showHelp && <HelpPopup closePopup={() => setShowHelp(false)} />}
      {confettiActive && <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-[110]" style={{ width: '100vw', height: '100vh' }} />}
      
      <BadgeNotification
        badges={unlockableBadges}
        onClose={() => setUnlockableBadges([])}
      />
      <ProfileCreationStatus 
        isCreating={isCreatingProfile}
        error={profileCreationError}
        onRetry={() => {
          setProfileCreationError(null);
          // Re-trigger profile creation
          if (publicKey && wallet) {
            initializeUser(publicKey.toBase58());
          }
        }}
      />
    </div>
  );
};

export default App;