import React from 'react';
import { ArrowLeft, Shield, Clock, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { update, ref } from 'firebase/database';
import { createDeck, shuffleDeck } from '../utils/deck';
import { ensurePlayersArray } from '../utils/gameUtils';
import { db } from '../firebase';
import WhotShapePopup from './popups/WhotShapePopup';
import RoundEndPopup from './popups/RoundEndPopup';
import EliminatedPopup from './popups/EliminatedPopup';
import LottieConfetti from './LottieConfetti';
import { playSoundEffect } from '../utils/soundEffects';
import { getCardSVGContent, getCardBackSVG } from '../utils/cardSVG';


const MAX_VISIBLE_AI_CARDS = 3;

const Game = ({
  gameData,
  currentUser,
  isAdmin,
  adminCardsRevealed,
  adminMarketRevealed,
  setAdminCardsRevealed,
  setAdminMarketRevealed,
  showAdminDeckOverview,
  setShowAdminDeckOverview,
  playCard,
  playMultiplayerCard,
  drawCard,
  drawMultiplayerCard,
  showDeckView,
  setShowDeckView,
  showGameLog,
  setShowGameLog,
  currentRoom,
  turnTimer,
  animatingCards,
  setAnimatingCards,
  playerScrollIndex,
  setPlayerScrollIndex,
  maxVisiblePlayerCards,
  playPileCardPositions,
  marketCardPositions,
  animationPositions,
  isPlayerActionInProgress,
  isAnyAnimationInProgress,
  setPlayPileCardPositions,
  setMarketCardPositions,
  setIsPlayerActionInProgress,
  setIsAnyAnimationInProgress,
  returnToMenu,
  setGameData,
  startDealingAnimation,
  handleMultiplayerRoundEnd,
  handleRoundEnd
}) => {
  // Safety check - if gameData is missing or invalid, show loading
  if (!gameData || !Array.isArray(gameData.players) || gameData.players.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-xl mb-2">Loading game...</div>
          <div className="text-sm text-gray-400">Please wait</div>
        </div>
      </div>
    );
  }

  // Ensure all players have proper cards arrays
  gameData.players.forEach(player => {
    if (!Array.isArray(player.cards)) {
      player.cards = [];
    }
  });

  // Ensure other critical arrays exist
  if (!Array.isArray(gameData.playPile)) gameData.playPile = [];
  if (!Array.isArray(gameData.drawPile)) gameData.drawPile = [];
  if (!Array.isArray(animatingCards)) animatingCards = [];
  
  // Deep clone gameData to ensure we don't mutate the original
  const safeGameData = {
    ...gameData,
    players: gameData.players.map(player => ({
      ...player,
      cards: Array.isArray(player.cards) ? [...player.cards] : []
    })),
    playPile: Array.isArray(gameData.playPile) ? [...gameData.playPile] : [],
    drawPile: Array.isArray(gameData.drawPile) ? [...gameData.drawPile] : []
  };

  const isDealingPhase = gameData.gamePhase === 'dealingCards';

  const playPilePositionsRef = React.useRef([]);
  const marketCardPositionsRef = React.useRef([]);
  const [roundEndData, setRoundEndData] = React.useState(null);
  const [showRoundEndPopup, setShowRoundEndPopup] = React.useState(false);
  const [showEliminatedPopup, setShowEliminatedPopup] = React.useState(false);
  const [confettiActive, setConfettiActive] = React.useState(false);
  const [isAITurnInProgress, setIsAITurnInProgress] = React.useState(false);
  const [needNewMarketPositions, setNeedNewMarketPositions] = React.useState(false);
  const [selectedLogRound, setSelectedLogRound] = React.useState(1);
  const [playPilePositions, setPlayPilePositions] = React.useState([]);
  const dealtCountsByPlayer = React.useMemo(() => {
    // Read from parent via props if passed in future; fallback to zero reveal
    return [];
  }, []);
  const [showWhotChoice, setShowWhotChoice] = React.useState(false);
  const [pendingWhotCard, setPendingWhotCard] = React.useState(null);
  const players = ensurePlayersArray(gameData.players);
  const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
  const isCurrentUserTurn = gameData.currentPlayer === currentUserActualIndex;
  
  React.useEffect(() => {
    if (gameData && gameData.drawPile && needNewMarketPositions) {
      if (marketCardPositionsRef.current.length === 0) {
        const positions = Array.from({
          length: 8
        }, (_, index) => {
          const randomX = (Math.random() - 0.5) * 8;
          const randomY = (Math.random() - 0.5) * 8;
          const randomRotate = (Math.random() - 0.5) * 15;
          return {
            transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`,
            zIndex: index
          };
        });
        marketCardPositionsRef.current = positions;
        setMarketCardPositions(positions);
      } else {
        setMarketCardPositions(marketCardPositionsRef.current);
      }
      setNeedNewMarketPositions(false);
    }
  }, [gameData?.drawPile, needNewMarketPositions]);
  
  React.useEffect(() => {
    if (gameData && gameData.gamePhase === 'dealingCards') {
      setAnimatingCards([]);
      setPlayerScrollIndex(0);
      setNeedNewMarketPositions(true);
      playPilePositionsRef.current = [];
      setPlayPilePositions([]);
      setPlayPileCardPositions({});
      setIsAITurnInProgress(false);
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
      setSelectedLogRound(gameData.roundNumber);
      setShowRoundEndPopup(false);
      setRoundEndData(null);
      // Confetti will be handled by LottieConfetti component
    }
  }, [gameData?.gamePhase, gameData?.roundNumber]);

  // Animation handling is now done in App.jsx to avoid duplicates
  // This component only handles rendering and UI interactions
  
  const getVisualPlayerMapping = () => {
    if (!currentRoom || !gameData || !currentUser) {
      return { visualToActual: [0, 1, 2, 3], actualToVisual: { 0: 0, 1: 1, 2: 2, 3: 3 } };
    }
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = players.findIndex(p => p.id === (currentUser?.id));
    if (currentUserActualIndex === -1) {
      return { visualToActual: [0, 1, 2, 3], actualToVisual: { 0: 0, 1: 1, 2: 2, 3: 3 } };
    }
    const totalPlayers = players.length;
    const visualToActual = [];
    const actualToVisual = {};
    visualToActual[0] = currentUserActualIndex;
    actualToVisual[currentUserActualIndex] = 0;
    for (let i = 1; i < totalPlayers; i++) {
      const actualIndex = (currentUserActualIndex + i) % totalPlayers;
      visualToActual[i] = actualIndex;
      actualToVisual[actualIndex] = i;
    }
    return { visualToActual, actualToVisual };
  };

  const getExactCardPosition = (playerIndex, cardIndex, totalCards, clampToVisible = true) => {
    if (!animationPositions.playerDecks) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    let visualPlayerIndex = playerIndex;
    if (currentRoom && gameData) {
      const mapping = getVisualPlayerMapping();
      visualPlayerIndex = mapping.actualToVisual[playerIndex] !== undefined ? mapping.actualToVisual[playerIndex] : playerIndex;
    }
    const basePosition = animationPositions?.playerDecks?.[visualPlayerIndex] || { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const cardWidth = window.innerWidth < 768 ? 72 : window.innerWidth < 1024 ? 100 : 130;
    const cardSpacing = 6;
    if (visualPlayerIndex === 0) {
      const effectiveCardIndex = clampToVisible ? Math.max(0, Math.min(cardIndex, totalCards - 1)) : cardIndex;
      const totalHandWidth = totalCards * cardWidth + (totalCards - 1) * cardSpacing;
      const startX = (window.innerWidth - totalHandWidth) / 2;
      const cardX = startX + effectiveCardIndex * (cardWidth + cardSpacing);
      return { position: 'fixed', left: `${cardX}px`, bottom: basePosition.bottom, transform: basePosition.transform || '' };
    } else if (visualPlayerIndex === 1) {
      const effectiveCardIndex = clampToVisible ? Math.min(cardIndex, MAX_VISIBLE_AI_CARDS - 1) : cardIndex;
      const cardY = window.innerHeight / 2 - (MAX_VISIBLE_AI_CARDS * cardWidth + (MAX_VISIBLE_AI_CARDS - 1) * cardSpacing) / 2 + effectiveCardIndex * (cardWidth + cardSpacing);
      return { position: 'fixed', left: basePosition.left, top: `${cardY}px`, transform: basePosition.transform || '' };
    } else if (visualPlayerIndex === 2) {
      const effectiveCardIndex = clampToVisible ? Math.min(cardIndex, MAX_VISIBLE_AI_CARDS - 1) : cardIndex;
      const cardX = window.innerWidth / 2 - (MAX_VISIBLE_AI_CARDS * cardWidth + (MAX_VISIBLE_AI_CARDS - 1) * cardSpacing) / 2 + effectiveCardIndex * (cardWidth + cardSpacing);
      return { position: 'fixed', left: `${cardX}px`, top: basePosition.top, transform: basePosition.transform || '' };
    } else if (visualPlayerIndex === 3) {
      const effectiveCardIndex = clampToVisible ? Math.min(cardIndex, MAX_VISIBLE_AI_CARDS - 1) : cardIndex;
      const cardY = window.innerHeight / 2 - (MAX_VISIBLE_AI_CARDS * cardWidth + (MAX_VISIBLE_AI_CARDS - 1) * cardSpacing) / 2 + effectiveCardIndex * (cardWidth + cardSpacing);
      return { position: 'fixed', right: basePosition.right, top: `${cardY}px`, transform: basePosition.transform || '' };
    }
    return basePosition;
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



  const getMarketCardPosition = index => {
    return marketCardPositions[index] || { transform: 'translate(0px, 0px) rotate(0deg)', zIndex: index };
  };

  const getTopMarketCardPosition = () => {
    if (!animationPositions?.market) {
      const offset = window.innerWidth < 768 ? '54px' : window.innerWidth < 1024 ? '72px' : '90px';
      return { top: '50%', left: '50%', transform: `translate(calc(-50% + ${offset}), -50%)` };
    }
    const topCardIndex = Math.min(gameData?.drawPile?.length || 0, 8) - 1;
    if (topCardIndex < 0) {
      return animationPositions?.market || { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const cardPosition = getMarketCardPosition(topCardIndex);
          return { ...(animationPositions?.market || { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }), transform: `${animationPositions?.market?.transform || 'translate(-50%, -50%)'} ${cardPosition.transform}` };
  };



  // shuffleDeck imported from utils/deck

  const getXPFromGame = (won, roundsPlayed, cardsPlayed) => {
    let baseXP = 50;
    if (won) baseXP += 100;
    baseXP += roundsPlayed * 25;
    baseXP += Math.floor(cardsPlayed / 5) * 10;
    return baseXP;
  };

  const getCardsPerPlayer = playerCount => {
    if (playerCount === 4) return 6;
    if (playerCount === 3) return 9;
    if (playerCount === 2) return 12;
    return 6;
  };

  const nextTurn = gameData => {
    if (!gameData?.players?.length) return;
    let nextPlayer = gameData.currentPlayer;
    let playersToSkip = gameData.skipNextPlayer ? 1 : 0;
    do {
      nextPlayer = (nextPlayer + 1) % gameData.players.length;
    } while (gameData.players[nextPlayer]?.eliminated);
    while (playersToSkip > 0) {
      do {
        nextPlayer = (nextPlayer + 1) % gameData.players.length;
      } while (gameData.players[nextPlayer]?.eliminated);
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
    setGameData({
      ...gameData
    });
    if (gameData.players[nextPlayer]?.isAI) {
      setIsAITurnInProgress(true);
      setTimeout(async () => {
        if (!isAnyAnimationInProgress) {
          await aiTurn({
            ...gameData,
            currentPlayer: nextPlayer
          });
        }
      }, 1000);
    }
  };

  // createDeck imported from utils/deck



  const startConfetti = () => {
    setConfettiActive(true);
  };

  const calculateCardTotal = cards => {
    return cards.reduce((total, card) => {
      if (card.number === 'WHOT') return total + 20;
      return total + parseInt(card.number);
    }, 0);
  };

  const endRound = gameData => {
    const activePlayers = gameData.players.filter(p => !p.eliminated);
    const playersWithTotals = activePlayers.map(p => ({
      ...p,
      cardTotal: calculateCardTotal(p.cards || []),
      cardCount: (p.cards || []).length
    }));
    let maxTotal = Math.max(...playersWithTotals.map(p => p.cardTotal));
    const playersWithMaxTotal = playersWithTotals.filter(p => p.cardTotal === maxTotal);
    const eliminatedPlayer = playersWithMaxTotal[Math.floor(Math.random() * playersWithMaxTotal.length)];
          const roundWinner = (playersWithTotals || []).find(p => p.cardTotal === Math.min(...(playersWithTotals || []).map(p => p.cardTotal)));
    const roundEndInfo = {
      winner: roundWinner,
      players: playersWithTotals.map(p => ({
        ...p,
        cardCount: (p.cards || []).length,
        cardTotal: p.cardTotal,
        cards: (p.cards || []).slice()
      })),
      eliminatedPlayer,
      maxCards: maxTotal,
      roundNumber: gameData.roundNumber
    };
    setRoundEndData(roundEndInfo);
    // Start confetti immediately
    startConfetti();
    setTimeout(() => {
      setShowRoundEndPopup(true);
    }, 2500);
    setTimeout(() => {
      setGameData(prevData => {
        const nextRoundGameData = JSON.parse(JSON.stringify(prevData));
        const eliminatedPlayerInNewData = (nextRoundGameData.players || []).find(p => p.id === eliminatedPlayer.id);
        if (eliminatedPlayerInNewData) {
          eliminatedPlayerInNewData.eliminated = true;
        }
        nextRoundGameData.lastAction = `${eliminatedPlayer.name.split(' ')[0]} eliminated`;
        const currentRoundLog = nextRoundGameData.gameLog[nextRoundGameData.roundNumber] || [];
        nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [...currentRoundLog, `Round ${nextRoundGameData.roundNumber}: ${eliminatedPlayer.name} eliminated with ${maxTotal} total card points`];
        if (eliminatedPlayer.id === 0) {
          setShowEliminatedPopup(true);
        }
        nextRoundGameData.roundNumber++;
        const remainingPlayers = nextRoundGameData.players.filter(p => !p.eliminated);
        if (remainingPlayers.length <= 1) {
          nextRoundGameData.gamePhase = 'gameEnd';
          const winner = remainingPlayers.length > 0 ? remainingPlayers[0] : roundWinner;
          nextRoundGameData.winner = winner;
          nextRoundGameData.lastAction = `${winner.name.split(' ')[0]} wins!`;
          nextRoundGameData.gameLog[nextRoundGameData.roundNumber] = [`GAME OVER: ${winner.name} wins the game!`];
          setShowRoundEndPopup(false);
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
          return nextRoundGameData;
        }
      });
    }, 10000);
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
        const mapping = getVisualPlayerMapping();
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
        }, 800);
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
          const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    if (player.id === currentUserActualIndex || !currentRoom && player.id === 0) {
      const newTotal = (player.cards || []).length;
      if (newTotal > maxVisiblePlayerCards) setPlayerScrollIndex(newTotal - maxVisiblePlayerCards);
      setIsPlayerActionInProgress(false);
    }
    gameDataToUse.lastAction = isPending ? `${player.name.split(' ')[0]} - pick${count}` : isGeneral ? `${player.name.split(' ')[0]} - market` : `${player.name.split(' ')[0]} - market`;
    gameDataToUse.gameLog = {
      ...gameDataToUse.gameLog,
      [gameDataToUse.roundNumber]: [...(gameDataToUse.gameLog[gameDataToUse.roundNumber] || []), isPending ? `${player.name} drew ${count} card${count > 1 ? 's' : ''} (penalty)` : isGeneral ? `${player.name} drew ${count} card${count > 1 ? 's' : ''} (general market)` : `${player.name} drew ${count} card${count > 1 ? 's' : ''} from market`]
    };
    if (isPending) gameDataToUse.pendingPickCount = 0;
    setGameData({
      ...gameDataToUse
    });
    setIsAnyAnimationInProgress(false);
    nextTurn(gameDataToUse);
  };

  const aiTurn = async gameData => {
    if (!gameData?.players?.[gameData.currentPlayer]?.isAI || isAnyAnimationInProgress) {
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
    const playableCards = (currentPlayer.cards || []).map((card, index) => ({
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
        zIndex: newCardRelativeStyle.zIndex
      };
      const animatingCard = {
        ...cardToPlay,
        id: `animating-${Date.now()}-${randomCard.index}`,
        startPos: {
          ...animationPositions.animationStarts[currentPlayer.id],
          opacity: 1,
          position: 'fixed',
          zIndex: 1000
        },
        endPos: endPosition,
        isPlayerCard: true
      };
      setAnimatingCards(prev => [...prev, animatingCard]);
      
      // Play sound effect based on card type
      if (cardToPlay.special === 'whot' || cardToPlay.special === 'pick2' || cardToPlay.special === 'holdon' || cardToPlay.special === 'generalmarket') {
        playSoundEffect.specialPlay();
      } else {
        playSoundEffect.normalPlay();
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      currentPlayer.cards = (currentPlayer.cards || []).filter((_, idx) => idx !== randomCard.index);
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
      if ((currentPlayer.cards || []).length === 0) {
          // Play end sound when game ends
  playSoundEffect.end();
        // Use appropriate round end handler based on game mode
        if (currentRoom) {
          await handleMultiplayerRoundEnd(newGameData);
        } else {
          await handleRoundEnd(newGameData);
        }
      } else {
        setGameData(newGameData);
        setIsAITurnInProgress(false);
        setIsAnyAnimationInProgress(false);
        nextTurn(newGameData);
      }
    } else {
      await animateDrawCards(newGameData, currentPlayer, 1, false, false);
      setIsAITurnInProgress(false);
      return;
    }
  };

  const reshuffleMarket = (gameData) => {
    if ((gameData.playPile || []).length <= 1) return;
    const topCard = (gameData.playPile || []).length > 0 ? gameData.playPile[gameData.playPile.length - 1] : null;
    if (!topCard) return;
    const cardsToShuffle = (gameData.playPile || []).slice(0, -1);
    gameData.drawPile = shuffleDeck(cardsToShuffle);
    gameData.playPile = [topCard];
    
    // Play shuffle sound effect
    playSoundEffect.shuffle();
    const topCardPosition = playPileCardPositions[(gameData.playPile || []).length - 1] || getPlayPilePosition(0, false);
    playPilePositionsRef.current = [playPilePositionsRef.current[(gameData.playPile || []).length - 1] || {
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

  const scrollPlayerCards = direction => {
    if (!gameData) return;
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    const playerCards = (players[currentUserActualIndex]?.cards || players[0]?.cards || []);
    const maxScroll = Math.max(0, playerCards.length - maxVisiblePlayerCards);
    if (direction === 'left') {
      setPlayerScrollIndex(Math.max(0, playerScrollIndex - 1));
    } else if (direction === 'right') {
      setPlayerScrollIndex(Math.min(maxScroll, playerScrollIndex + 1));
    }
  };

  const isCardPlayable = (card, topCard) => {
    if (card.special === 'whot') return true;
    if (!topCard) return false;
    if (topCard.chosenShape) return card.shape === topCard.chosenShape;
    return card.shape === topCard.shape || card.number === topCard.number;
  };

  const canPlayCard = (card, topCard) => {
    if (!card) return false;
    if (card.special === 'whot') return true;
    if (!topCard) {
      return false;
    }
    return card.shape === topCard.shape || card.number === topCard.number;
  };

  const getNextPlayer = gameData => {
    if (!gameData?.players?.length) return 0;
    let nextPlayer = gameData.currentPlayer;
    let playersToSkip = gameData.skipNextPlayer ? 1 : 0;
    do {
      nextPlayer = (nextPlayer + 1) % gameData.players.length;
    } while (gameData.players[nextPlayer]?.eliminated);
    while (playersToSkip > 0) {
      do {
        nextPlayer = (nextPlayer + 1) % gameData.players.length;
      } while (gameData.players[nextPlayer]?.eliminated);
      playersToSkip--;
    }
    return nextPlayer;
  };



  const chooseWhotShape = async shape => {
    console.log('🎯 chooseWhotShape called', {
      shape,
      hasPendingWhotCard: !!pendingWhotCard,
      isPlayerActionInProgress,
      isAnyAnimationInProgress,
      showWhotChoice
    });
    
    if (!pendingWhotCard || isPlayerActionInProgress || isAnyAnimationInProgress) {
      console.log('chooseWhotShape blocked by guard clause');
      return;
    }
    
    setIsPlayerActionInProgress(true);
    setIsAnyAnimationInProgress(true);
    
    try {
    
    const newGameData = {
      ...gameData
    };
    const whotCard = {
      ...pendingWhotCard,
      chosenShape: shape
    };
    
    // Remove the card from player's hand first
    const players = ensurePlayersArray(newGameData.players);
    const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    const currentPlayer = newGameData.players[currentUserActualIndex];
    
    // Find and remove the WHOT card from player's hand
    const cardIndex = currentPlayer.cards.findIndex(c => c.id === pendingWhotCard.id);
    if (cardIndex !== -1) {
      currentPlayer.cards = currentPlayer.cards.filter((_, idx) => idx !== cardIndex);
    }
    
    // Create animation for the WHOT card
    const newCardRelativeStyle = getPlayPilePosition((newGameData.playPile || []).length, false);
    const endPosition = {
      ...animationPositions.playPile,
      transform: `${animationPositions.playPile.transform} ${newCardRelativeStyle.transform}`,
      zIndex: newCardRelativeStyle.zIndex
    };
    
    const animatingCard = {
      ...whotCard,
      id: `whot-play-${Date.now()}`,
      startPos: getExactCardPosition(currentUserActualIndex, cardIndex, currentPlayer.cards.length + 1, true),
      endPos: endPosition,
      isPlayerCard: true,
      type: 'whot-play'
    };
    
    // Start animation
    setAnimatingCards(prev => [...(prev || []), animatingCard]);
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Remove animation and add card to play pile
    setAnimatingCards(prev => (prev || []).filter(c => c.id !== animatingCard.id));
    getPlayPilePosition((newGameData.playPile || []).length, true);
    
    // Add the WHOT card to the play pile with the chosen shape
    newGameData.playPile = [...(newGameData.playPile || []), whotCard];
    if (currentRoom) {
      const players = ensurePlayersArray(gameData.players);
      const currentUserActualIndex = players.findIndex(p => p.id === (currentUser?.id));
      const currentPlayer = newGameData.players?.[currentUserActualIndex];
      newGameData.lastAction = `${currentPlayer.name} - WHOT → ${shape}`;
      newGameData.gameLog = {
        ...newGameData.gameLog,
        [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `${currentPlayer.name} played WHOT and chose ${shape} as the active shape`]
      };
      setShowWhotChoice(false);
      setPendingWhotCard(null);
      if (currentPlayer.cards.length === 0) {
        // Play end sound when game ends
        playSoundEffect.end();
        // Use appropriate round end handler based on game mode
        if (currentRoom) {
          await handleMultiplayerRoundEnd(newGameData);
        } else {
          await handleRoundEnd(newGameData);
        }
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
        // Update local state for better responsiveness
        setGameData(newGameData);
        await update(ref(db, `rooms/${currentRoom.id}/gameData`), newGameData);
      }
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
    } else {
      newGameData.lastAction = `You - WHOT → ${shape}`;
      newGameData.gameLog = {
        ...newGameData.gameLog,
        [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `You played WHOT and chose ${shape} as the active shape`]
      };
      setShowWhotChoice(false);
      setPendingWhotCard(null);
      if (newGameData.players[0].cards.length === 0) {
        // Play end sound when game ends
        playSoundEffect.end();
        handleRoundEnd(newGameData);
      } else {
        nextTurn(newGameData);
      }
      setGameData(newGameData);
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
    }
    } catch (error) {
      console.error('Error in chooseWhotShape:', error);
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
      setShowWhotChoice(false);
      setPendingWhotCard(null);
    }
  };

  const hasPlayableCardsOutsideRange = () => {
    if (!gameData) return { left: false, right: false };
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
    if (gameData.currentPlayer !== currentUserActualIndex) return { left: false, right: false };
    const player = players[currentUserActualIndex];
    if (!player) return { left: false, right: false };
    const topCard = gameData.playPile?.[gameData.playPile.length - 1];
    const leftCards = (player.cards || []).slice(0, playerScrollIndex);
    const hasPlayableLeft = leftCards.some(card => isCardPlayable(card, topCard));
    const rightCards = (player.cards || []).slice(playerScrollIndex + maxVisiblePlayerCards);
    const hasPlayableRight = rightCards.some(card => isCardPlayable(card, topCard));
    return { left: hasPlayableLeft, right: hasPlayableRight };
  };

  const handlePlayCard = async (cardIndex, clickPosition) => {
    if (!gameData || gameData.gamePhase !== 'playing' || gameData.currentPlayer !== 0 || isPlayerActionInProgress || isAnyAnimationInProgress || (animatingCards || []).length > 0) return;
    setIsPlayerActionInProgress(true);
    setIsAnyAnimationInProgress(true);
    const newGameData = JSON.parse(JSON.stringify(gameData));
    const player = newGameData.players[0];
    const actualCardIndex = cardIndex + playerScrollIndex;
    const card = player.cards[actualCardIndex];
    const topCard = (newGameData.playPile || []).length > 0 ? newGameData.playPile[newGameData.playPile.length - 1] : null;
    const newCardRelativeStyle = getPlayPilePosition((newGameData.playPile || []).length, false);
    if (topCard && topCard.chosenShape) {
      if (card.special !== 'whot' && card.shape !== topCard.chosenShape) {
        setIsPlayerActionInProgress(false);
        setIsAnyAnimationInProgress(false);
        return;
      }
    } else if (!canPlayCard(card, topCard)) {
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
      return;
    }
    const endPosition = {
      ...animationPositions.playPile,
      transform: `${animationPositions.playPile.transform} ${newCardRelativeStyle.transform}`,
      zIndex: newCardRelativeStyle.zIndex
    };
    const animatingCard = {
      ...card,
      id: `animating-${Date.now()}-${actualCardIndex}`,
      startPos: clickPosition ? {
        top: `${clickPosition.y}px`,
        left: `${clickPosition.x}px`,
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        zIndex: 1000
      } : getExactCardPosition(0, actualCardIndex, (player.cards || []).length, true),
      endPos: endPosition,
      isPlayerCard: true
    };
    setAnimatingCards(prev => [...(prev || []), animatingCard]);
    
    // Play sound effect based on card type
    if (card.special === 'whot' || card.special === 'pick2' || card.special === 'holdon' || card.special === 'generalmarket') {
      playSoundEffect.specialPlay();
    } else {
      playSoundEffect.normalPlay();
    }
    
    player.cards = (player.cards || []).filter((_, idx) => idx !== actualCardIndex);
    newGameData.playPile = [...(newGameData.playPile || []), card];
    const newCardsLength = (player.cards || []).length;
    const maxScroll = Math.max(0, newCardsLength - maxVisiblePlayerCards);
    if (newCardsLength <= maxVisiblePlayerCards) {
      setPlayerScrollIndex(0);
    } else if (playerScrollIndex >= maxScroll) {
      setPlayerScrollIndex(maxScroll);
    } else if (actualCardIndex < playerScrollIndex + Math.floor(maxVisiblePlayerCards / 2)) {
      setPlayerScrollIndex(Math.max(0, playerScrollIndex - 1));
    }
    setTimeout(() => {
      getPlayPilePosition((newGameData.playPile || []).length - 1, true);
      setAnimatingCards(prev => (prev || []).filter(c => c.id !== animatingCard.id));
      if (card.special === 'pick2') {
        newGameData.pendingPickCount += 2;
        newGameData.lastAction = `You - ${card.number}${card.shape} pick2`;
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...(newGameData.gameLog[newGameData.roundNumber] || []), `You played ${card.number}${card.shape} (Pick 2) - Next player must draw 2 cards`]
        };
      } else if (card.special === 'whot') {
        setPendingWhotCard(card);
        setShowWhotChoice(true);
        setGameData(newGameData);
        setIsPlayerActionInProgress(false);
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
      if ((player.cards || []).length === 0) {
        setGameData(newGameData);
        handleRoundEnd(newGameData);
        setIsPlayerActionInProgress(false);
        setIsAnyAnimationInProgress(false);
      } else {
        setGameData(newGameData);
        setIsPlayerActionInProgress(false);
        setIsAnyAnimationInProgress(false);
        if (newGameData.gamePhase === 'playing') {
          nextTurn(newGameData);
        }
      }
    }, 800);
  };

  const handleDrawCard = async () => {
    if (!gameData || gameData.gamePhase !== 'playing' || gameData.currentPlayer !== 0 || (animatingCards || []).length > 0 || isPlayerActionInProgress || isAnyAnimationInProgress) return;
    setIsPlayerActionInProgress(true);
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

  const handlePlayMultiplayerCard = async (cardIndex, clickPosition) => {
    if (!gameData || !currentRoom || !currentUser || isPlayerActionInProgress) return;
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = players.findIndex(p => p.id === (currentUser?.id));
    if (currentUserActualIndex === -1) return;
    if (gameData.currentPlayer !== currentUserActualIndex) return;
    const currentPlayerData = players[currentUserActualIndex];
    const actualCardIndex = cardIndex + playerScrollIndex;
    const card = currentPlayerData.cards[actualCardIndex];
    const topCard = (gameData.playPile || []).length > 0 ? gameData.playPile[gameData.playPile.length - 1] : null;
    if (topCard && topCard.chosenShape) {
      if (card.special !== 'whot' && card.shape !== topCard.chosenShape) return;
    } else if (!canPlayCard(card, topCard)) {
      return;
    }
    try {
      // Handle WHOT cards differently - show popup without animation
      if (card.special === 'whot') {
        console.log('WHOT card clicked, showing popup');
        setIsPlayerActionInProgress(true);
        setPendingWhotCard(card);
        setShowWhotChoice(true);
        setIsPlayerActionInProgress(false);
        return;
      }
      
      // For all other cards, proceed with normal animation
      setIsPlayerActionInProgress(true);
      setIsAnyAnimationInProgress(true);
      const newCardRelativeStyle = getPlayPilePosition((gameData.playPile || []).length, false);
      const endPosition = {
        ...animationPositions.playPile,
        transform: `${animationPositions.playPile.transform} ${newCardRelativeStyle.transform}`,
        zIndex: newCardRelativeStyle.zIndex
      };
      const animatingCard = {
        ...card,
        id: `animating-${Date.now()}-${actualCardIndex}`,
        startPos: clickPosition ? {
          top: `${clickPosition.y}px`,
          left: `${clickPosition.x}px`,
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
          zIndex: 1000
        } : getExactCardPosition(currentUserActualIndex, actualCardIndex, (currentPlayerData.cards || []).length, true),
        endPos: endPosition,
        isPlayerCard: true
      };
      setAnimatingCards(prev => [...(prev || []), animatingCard]);
      
      // Play sound based on card type
      if (card.special === 'pick2' || card.special === 'holdon' || card.special === 'generalmarket') {
        playSoundEffect.specialPlay();
      } else {
        playSoundEffect.normalPlay();
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnimatingCards(prev => (prev || []).filter(c => c.id !== animatingCard.id));
      getPlayPilePosition((gameData.playPile || []).length, true);
      const newGameData = {
        ...gameData
      };
      const newPlayers = [...newGameData.players];
      const currentPlayer = {
        ...newPlayers[currentUserActualIndex]
      };
      currentPlayer.cards = (currentPlayer.cards || []).filter((_, idx) => idx !== actualCardIndex);
      newPlayers[currentUserActualIndex] = currentPlayer;
      newGameData.players = newPlayers;
      newGameData.playPile = [...(newGameData.playPile || []), card];
      const newCardsLength = (currentPlayer.cards || []).length;
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
      if ((currentPlayer.cards || []).length === 0) {
        // Play end sound when game ends
        playSoundEffect.end();
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
        await update(ref(db, `rooms/${currentRoom.id}`), {
          gameData: newGameData,
          lastActivity: Date.now()
        });
      }
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
    } catch (error) {
      console.error('Error playing multiplayer card:', error);
      setIsPlayerActionInProgress(false);
    }
  };

  const handleDrawMultiplayerCard = async () => {
    console.log('🔍 handleDrawMultiplayerCard called', {
      hasGameData: !!gameData,
      hasCurrentRoom: !!currentRoom,
      hasCurrentUser: !!currentUser,
      isPlayerActionInProgress,
      isAnyAnimationInProgress,
      showWhotChoice,
      pendingWhotCard: !!pendingWhotCard
    });
    
    if (!gameData || !currentRoom || !currentUser || isPlayerActionInProgress) {
      console.log('handleDrawMultiplayerCard blocked by guard clause');
      return;
    }
    const players = ensurePlayersArray(gameData.players);
    const currentUserActualIndex = players.findIndex(p => p.id === (currentUser?.id));
    if (currentUserActualIndex === -1) return;
    if (gameData.currentPlayer !== currentUserActualIndex) return;
    try {
      setIsPlayerActionInProgress(true);
      setIsAnyAnimationInProgress(true);
      const newGameData = {
        ...gameData
      };
      const count = newGameData.pendingPickCount > 0 ? newGameData.pendingPickCount : 1;
      const isPending = newGameData.pendingPickCount > 0;
      const isGeneral = newGameData.generalMarketActive && newGameData.currentPlayer !== newGameData.generalMarketOriginatorId && !isPending;
      const currentPlayer = {
        ...newGameData.players[currentUserActualIndex]
      };
      for (let i = 0; i < count; i++) {
        if (newGameData.drawPile.length <= 1) {
          reshuffleMarket(newGameData);
        }
        if (newGameData.drawPile.length === 0) break;
        const drawnCard = newGameData.drawPile[newGameData.drawPile.length - 1];
        newGameData.drawPile = newGameData.drawPile.slice(0, -1);
        currentPlayer.cards = [...currentPlayer.cards, drawnCard];
        const mapping = getVisualPlayerMapping();
        const visualPlayerIndex = mapping.actualToVisual[currentUserActualIndex] !== undefined ? mapping.actualToVisual[currentUserActualIndex] : currentUserActualIndex;
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
        
        // Play market sound when card starts drawing
        playSoundEffect.market();
        
        await new Promise(resolve => {
          setTimeout(() => {
            setAnimatingCards(prev => prev.filter(c => c.id !== animatingCard.id));
            resolve();
          }, 800);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const newPlayers = [...newGameData.players];
      newPlayers[currentUserActualIndex] = currentPlayer;
      newGameData.players = newPlayers;
      newGameData.pendingPickCount = 0;
      newGameData.lastAction = `${currentPlayer.name} - drew ${count} card${count > 1 ? 's' : ''}`;
      
      // Add draw action to game log
      const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
      
      if (isPending) {
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, `${currentPlayer.name} drew ${count} card${count > 1 ? 's' : ''} (penalty)`]
        };
      } else if (isGeneral) {
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, `${currentPlayer.name} drew ${count} card${count > 1 ? 's' : ''} (general market)`]
        };
      } else {
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, `${currentPlayer.name} drew ${count} card${count > 1 ? 's' : ''} from market`]
        };
      }
      const newTotal = currentPlayer.cards.length;
      if (newTotal > maxVisiblePlayerCards) {
        setPlayerScrollIndex(newTotal - maxVisiblePlayerCards);
      }
      const nextPlayerIndex = getNextPlayer(newGameData);
      newGameData.currentPlayer = nextPlayerIndex;
      
      // Check if General Market effect should end when turn comes back to originator
      if (newGameData.generalMarketActive && nextPlayerIndex === newGameData.generalMarketOriginatorId) {
        newGameData.generalMarketActive = false;
        newGameData.generalMarketOriginatorId = null;
        newGameData.lastAction += ' General Market effect ends.';
        const currentRoundLog = newGameData.gameLog[newGameData.roundNumber] || [];
        newGameData.gameLog = {
          ...newGameData.gameLog,
          [newGameData.roundNumber]: [...currentRoundLog, 'General Market effect ended - all players have drawn']
        };
      }
      await update(ref(db, `rooms/${currentRoom.id}`), {
        gameData: newGameData,
        lastActivity: Date.now()
      });
      setIsPlayerActionInProgress(false);
      setIsAnyAnimationInProgress(false);
    } catch (error) {
      console.error('Error drawing multiplayer card:', error);
      setIsPlayerActionInProgress(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%)', perspective: '1000px' }}>
      <div className="fixed top-4 left-4 z-30">
        <button onClick={() => {
          playSoundEffect.back();
          returnToMenu();
        }} className="text-white hover:text-red-300 transition-colors duration-200">
          <ArrowLeft size={window.innerWidth < 768 ? 18 : 24} />
        </button>
      </div>
      {isAdmin && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
          <button onClick={() => {
            playSoundEffect.click();
            setAdminCardsRevealed(!adminCardsRevealed);
          }} className={`px-3 py-2 text-xs font-bold transition-all duration-200 ${adminCardsRevealed ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`} title="Toggle opponent card visibility">
            {adminCardsRevealed ? 'Hide Opponent Cards' : 'Reveal Opponent Cards'}
          </button>
          <button onClick={() => {
            playSoundEffect.click();
            setAdminMarketRevealed(!adminMarketRevealed);
          }} className={`px-3 py-2 text-xs font-bold transition-all duration-200 ${adminMarketRevealed ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`} title="Toggle market card visibility">
            {adminMarketRevealed ? 'Hide Market Cards' : 'Reveal Market Cards'}
          </button>
          <button onClick={() => {
            playSoundEffect.click();
            setShowAdminDeckOverview(true);
          }} className="px-3 py-2 text-xs font-bold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700" title="View all card distributions">
            View All Cards
          </button>
        </div>
      )}
      <div className={`fixed top-4 right-4 z-30 text-white flex ${window.innerWidth < 768 ? 'gap-2' : 'gap-3'}`} style={{ transform: 'scale(0.75)', transformOrigin: 'top right' }}>
        <div className={`bg-gray-900 bg-opacity-60 ${window.innerWidth < 768 ? 'p-2' : 'p-3'} border border-gray-600 flex items-center justify-center ${window.innerWidth < 768 ? 'min-w-[40px]' : 'min-w-[60px]'}`}>
          <div className={`${window.innerWidth < 768 ? 'text-lg' : 'text-2xl'} font-bold`}>
            {(() => {
                if (isDealingPhase) return '?';
                if (!(gameData.playPile || []).length) return '?';
                const topCard = (gameData.playPile || [])[gameData.playPile.length - 1];
              if (!topCard) return '?';
              if (topCard.chosenShape) {
                return topCard.chosenShape;
              }
              return topCard.shape === '🔥' ? '?' : topCard.shape;
            })()}
          </div>
        </div>
        <button onClick={() => {
          playSoundEffect.click();
          setShowGameLog(true);
        }} className={`bg-gray-900 bg-opacity-60 ${window.innerWidth < 768 ? 'p-2' : 'p-3'} border border-gray-600 hover:bg-opacity-80 transition-all duration-200 cursor-pointer`} title="Click to view game log">
          <div className={`${window.innerWidth < 768 ? 'text-xs' : 'text-sm'}`}>
            {window.innerWidth < 768 ? `R${gameData.roundNumber}` : `Round ${gameData.roundNumber}`}
          </div>
          <div className={`${window.innerWidth < 768 ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
            {gameData.lastAction}
          </div>
          {gameData.generalMarketActive && (
            <div className={`${window.innerWidth < 768 ? 'text-[10px]' : 'text-xs'} text-yellow-400 mt-1`}>
              General Market Active
            </div>
          )}
        </button>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20" style={{ transform: `translate(calc(-50% - ${window.innerWidth < 768 ? '54px' : window.innerWidth < 1024 ? '72px' : '90px'}), -50%)` }}>
        <div className={`relative ${window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]'}`}>
          {!isDealingPhase && (gameData.playPile || []).length > 0 ? (
            (gameData.playPile || []).map((card, cardIndex) => {
              const position = playPileCardPositions[cardIndex] || getPlayPilePosition(cardIndex, false);
              return (
                <div
                  key={`pile-${card.id}-${cardIndex}`}
                  className={`absolute ${window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]'} shadow-2xl`}
                  style={{ transform: position.transform || 'translateZ(0)', zIndex: position.zIndex || 30 + cardIndex, top: '0px', left: '0px', position: 'absolute' }}
                >
                  <div className="h-full flex flex-col items-center justify-center text-white font-bold">
                    <div className="flex items-center justify-center w-full h-full" dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-600">
              <div className="text-gray-500 text-xs text-center">
                {isDealingPhase ? 'Dealing...' : 'Play<br />Pile'}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 z-20" style={{ transform: `translate(calc(-50% + ${window.innerWidth < 768 ? '54px' : window.innerWidth < 1024 ? '72px' : '90px'}), -50%)` }}>
        <div className={`relative ${window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]'} ${(() => {
          const players = ensurePlayersArray(gameData.players);
          const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
          const isCurrentUserTurn = gameData.currentPlayer === currentUserActualIndex;
                      const shouldGlow = !isAnyAnimationInProgress && isCurrentUserTurn && (gameData.pendingPickCount > 0 || gameData.generalMarketActive && gameData.currentPlayer !== gameData.generalMarketOriginatorId || gameData.pendingPickCount === 0 && !gameData.generalMarketActive && (() => {
            const currentUserPlayer = players[currentUserActualIndex];
            if (!currentUserPlayer) return false;
            const topCard = (gameData.playPile || []).length > 0 ? gameData.playPile[gameData.playPile.length - 1] : null;
            if (!topCard) return false;
            const playableCards = (currentUserPlayer.cards || []).filter(card => {
              if (topCard && topCard.chosenShape) return card.special === 'whot' || card.shape === topCard.chosenShape;
              return canPlayCard(card, topCard);
            });
            return playableCards.length === 0;
          })());
          return shouldGlow ? 'animate-pulse' : '';
        })()}`} style={{
          filter: (() => {
            const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
            const isCurrentUserTurn = gameData.currentPlayer === currentUserActualIndex;
            const shouldGlow = isCurrentUserTurn && (gameData.pendingPickCount > 0 || gameData.generalMarketActive && gameData.currentPlayer !== gameData.generalMarketOriginatorId || gameData.pendingPickCount === 0 && !gameData.generalMarketActive && (() => {
              const currentUserPlayer = players[currentUserActualIndex];
              if (!currentUserPlayer) return false;
              const topCard = (gameData.playPile || []).length > 0 ? gameData.playPile[gameData.playPile.length - 1] : null;
              if (!topCard) return false;
              const playableCards = (currentUserPlayer.cards || []).filter(card => {
                if (topCard && topCard.chosenShape) return card.special === 'whot' || card.shape === topCard.chosenShape;
                return canPlayCard(card, topCard);
              });
              return playableCards.length === 0;
            })());
            return shouldGlow ? 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 25px rgba(239, 68, 68, 0.4))' : 'none';
          })()
        }}>
          {Array.from({ length: Math.min((gameData.drawPile || []).length, 8) }, (_, index) => (
            <div
              key={index}
              className={`absolute ${window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]'} shadow-2xl ${index === Math.min((gameData.drawPile || []).length, 8) - 1 && (animatingCards || []).length === 0 && !isPlayerActionInProgress ? 'hover:scale-105 cursor-pointer' : ''}`}
              style={{ ...getMarketCardPosition(index) }}
              onClick={() => {
                console.log('🎯 Market card clicked', {
                  isTopCard: index === Math.min((gameData.drawPile || []).length, 8) - 1,
                  noAnimatingCards: (animatingCards || []).length === 0,
                  notPlayerActionInProgress: !isPlayerActionInProgress,
                  notAnyAnimationInProgress: !isAnyAnimationInProgress,
                  showWhotChoice,
                  pendingWhotCard: !!pendingWhotCard
                });
                
                if (index === Math.min((gameData.drawPile || []).length, 8) - 1 && (animatingCards || []).length === 0 && !isPlayerActionInProgress && !isAnyAnimationInProgress) {
                  if (currentRoom) {
                    handleDrawMultiplayerCard();
                  } else {
                    handleDrawCard();
                  }
                }
              }}
            >
              <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: isAdmin && adminMarketRevealed && (gameData.drawPile || []).length > 0 && (gameData.drawPile || [])[(gameData.drawPile || []).length - 1 - index] ? getCardSVGContent((gameData.drawPile || [])[(gameData.drawPile || []).length - 1 - index]) : getCardBackSVG() }} />
            </div>
          ))}
          {(!gameData.drawPile || (gameData.drawPile || []).length === 0) && (
            <div className={`${window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]'} border-2 border-dashed border-gray-600 flex items-center justify-center`}>
              <div className="text-gray-500 text-xs text-center">Empty</div>
            </div>
          )}
        </div>
      </div>
      {(roundEndData || gameData.roundEndData) && !showRoundEndPopup && gameData.gamePhase === 'roundEnd' && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[95] celebration-pause">
          <div className="text-center text-white scale-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Round Complete!</h2>
            <p className="text-xl text-gray-200">Preparing results...</p>
          </div>
        </div>
      )}
      {animatingCards.map(card => {
        const startPos = card.startPos || {};
        const endPos = card.endPos || {};
        const initialStyle = {
          transform: startPos.transform || 'translateZ(0)',
          opacity: startPos.opacity !== undefined ? startPos.opacity : 1,
          zIndex: 70
        };
        if (startPos.top !== undefined) {
          initialStyle.top = startPos.top;
          initialStyle.bottom = 'auto';
        } else if (startPos.bottom !== undefined) {
          initialStyle.bottom = startPos.bottom;
          initialStyle.top = 'auto';
        } else {
          initialStyle.top = 'auto';
          initialStyle.bottom = 'auto';
        }
        if (startPos.left !== undefined) {
          initialStyle.left = startPos.left;
          initialStyle.right = 'auto';
        } else if (startPos.right !== undefined) {
          initialStyle.right = startPos.right;
          initialStyle.left = 'auto';
        } else {
          initialStyle.left = 'auto';
          initialStyle.right = 'auto';
        }
        return (
          <div
            key={card.id}
            className={`fixed ${window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]'} card-animation`}
            style={initialStyle}
            ref={el => {
              if (el) {
                // Small delay to ensure initial position is rendered
                setTimeout(() => {
                  el.style.transform = endPos.transform || 'translateZ(0)';
                  el.style.opacity = endPos.opacity !== undefined ? endPos.opacity : 1;
                  el.style.top = endPos.top || '';
                  el.style.bottom = endPos.bottom || '';
                  el.style.left = endPos.left || '';
                  el.style.right = endPos.right || '';
                }, 10);
              }
            }}
          >
            <div className="h-full flex flex-col items-center justify-center text-white font-bold">
              <div className="flex items-center justify-center w-full h-full" dangerouslySetInnerHTML={{ __html: card.isPlayerCard ? getCardSVGContent(card) : getCardBackSVG() }} />
            </div>
          </div>
        );
      })}
      {(gameData.players || []).map((player, playerIndex) => {
        const mapping = getVisualPlayerMapping();
        const visualPlayerIndex = currentRoom ? mapping.actualToVisual[playerIndex] !== undefined ? mapping.actualToVisual[playerIndex] : playerIndex : playerIndex;
        const isCurrentPlayer = !isAnyAnimationInProgress && gameData.currentPlayer === playerIndex;
        const pos = animationPositions?.playerDecks?.[visualPlayerIndex] || { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
        const maxVisibleCards = visualPlayerIndex === 0 ? maxVisiblePlayerCards : MAX_VISIBLE_AI_CARDS;
        const cardSpacing = 6;
        const players = ensurePlayersArray(gameData.players);
        const isCurrentUserPlayer = currentRoom ? playerIndex === players.findIndex(p => p.id === currentUser?.id) : playerIndex === 0;
        const currentUserActualIndex = currentRoom ? players.findIndex(p => p.id === currentUser?.id) : 0;
        const isCurrentUserTurn = gameData.currentPlayer === currentUserActualIndex;
         // During dealing, progressively reveal cards: own cards face-up, opponent cards as backs
         let baseVisible = isCurrentUserPlayer ? (player.cards || []).slice(playerScrollIndex, playerScrollIndex + maxVisibleCards) : (player.cards || []).slice(0, maxVisibleCards);
         if (isDealingPhase) {
             // During dealing phase, show cards that have already been dealt
  // The animation system handles the flying cards, but we should show the cards that have arrived
           baseVisible = isCurrentUserPlayer ? (player.cards || []).slice(playerScrollIndex, playerScrollIndex + maxVisibleCards) : (player.cards || []).slice(0, maxVisibleCards);
         }
         const visibleCards = baseVisible;
        const cardDimensions = window.innerWidth < 768 ? 'w-[72px] h-[100px]' : window.innerWidth < 1024 ? 'w-[100px] h-36' : 'w-[130px] h-[172px]';
        const topCard = (gameData.playPile || []).length > 0 ? gameData.playPile[gameData.playPile.length - 1] : null;
        const canPlayerPlay = !isAnyAnimationInProgress && gameData.currentPlayer === playerIndex && !isPlayerActionInProgress;
        const playableOutsideRange = isCurrentUserPlayer ? hasPlayableCardsOutsideRange() : { left: false, right: false };
        return (
          <div key={player.id} className={`absolute ${isCurrentPlayer ? 'z-20' : 'z-10'}`} style={{ ...pos, filter: isCurrentPlayer ? 'brightness(1.2)' : 'brightness(0.8)' }}>
            {player.eliminated ? (
              <div className="absolute text-white bg-red-600 px-3 py-1 rounded-lg font-bold text-sm z-50" style={{ 
                left: visualPlayerIndex === 1 ? '-60px' : visualPlayerIndex === 3 ? 'auto' : '50%', 
                right: visualPlayerIndex === 3 ? '-60px' : 'auto',
                top: '50%', 
                transform: visualPlayerIndex === 1 ? 'translateY(-50%) rotate(-90deg)' : visualPlayerIndex === 3 ? 'translateY(-50%) rotate(90deg)' : 'translate(-50%, -50%)'
              }}>
                ELIMINATED
              </div>
            ) : (
              <>
                <div className={`flex items-center player-cards-container deck-scroll-transition ${visualPlayerIndex === 0 ? 'smooth-transition' : ''}`} style={{ gap: `${cardSpacing}px`, width: visualPlayerIndex !== 0 ? `${(MAX_VISIBLE_AI_CARDS + 1) * (window.innerWidth < 768 ? 72 : window.innerWidth < 1024 ? 100 : 130) + MAX_VISIBLE_AI_CARDS * cardSpacing}px` : 'auto', height: visualPlayerIndex !== 0 ? `${window.innerWidth < 768 ? 100 : window.innerWidth < 1024 ? 144 : 172}px` : 'auto' }}>
                  {isCurrentUserPlayer && (
                    <button
                      onClick={() => playerScrollIndex > 0 && scrollPlayerCards('left')}
                      disabled={playerScrollIndex <= 0}
                      className={`${window.innerWidth < 768 ? 'w-8 h-12' : 'w-10 h-14'} ${playerScrollIndex > 0 ? 'bg-gradient-to-r from-[#80142C] to-[#4a0c1a]' : 'bg-gradient-to-r from-gray-700 to-gray-600'} flex flex-col items-center justify-center text-white smooth-transition z-30 mr-2 shadow-lg border-2 ${playerScrollIndex > 0 ? 'border-[#80142C]' : 'border-gray-500'} relative ${playerScrollIndex <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {playableOutsideRange.left && playerScrollIndex > 0 && <div className="absolute top-1 right-1 w-3 h-3 bg-[#80142C] rounded-full border-2 border-gray-900 animate-ping"></div>}
                      {playableOutsideRange.left && playerScrollIndex > 0 && <div className="absolute top-1 right-1 w-3 h-3 bg-[#80142C] rounded-full border-2 border-gray-900"></div>}
                      <ChevronLeft size={window.innerWidth < 768 ? 12 : 16} />
                      <span className={`${window.innerWidth < 768 ? 'text-[8px]' : 'text-[10px]'} font-bold`}>{playerScrollIndex}</span>
                    </button>
                  )}
                                      {(visibleCards || []).map((card, cardIndex) => {
                    const canPlayAnyCard = isCurrentUserPlayer && isCurrentUserTurn && canPlayerPlay && gameData.pendingPickCount === 0 && !(gameData.generalMarketActive && gameData.currentPlayer !== gameData.generalMarketOriginatorId) && !isAnyAnimationInProgress;
                    const isThisCardPlayable = canPlayAnyCard && isCardPlayable(card, topCard);
                    return (
                      <div
                        key={`${card.id}-${cardIndex}`}
                        className={`${cardDimensions} shadow-lg smooth-transition ${isThisCardPlayable ? 'cursor-pointer' : ''}`}
                        style={{ 
                          backgroundColor: isCurrentUserPlayer ? 'transparent' : '#2a2a2a', 
                          zIndex: cardIndex, 
                          transform: 'none', 
                          opacity: isCurrentUserPlayer ? (isThisCardPlayable || !canPlayAnyCard ? 1 : 0.4) : 1,
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        onClick={(e) => {
                          if (isThisCardPlayable && isCurrentUserPlayer && isCurrentUserTurn) {
                            // Prevent default to avoid any unwanted behaviors
                            e.preventDefault();
                            e.stopPropagation();
                            
                            if (currentRoom) {
                              const clickX = e.clientX || e.touches?.[0]?.clientX || 0;
                              const clickY = e.clientY || e.touches?.[0]?.clientY || 0;
                              handlePlayMultiplayerCard(cardIndex, { x: clickX, y: clickY });
                            } else {
                              // Get the exact click position relative to the viewport
                              const clickX = e.clientX || e.touches?.[0]?.clientX || 0;
                              const clickY = e.clientY || e.touches?.[0]?.clientY || 0;
                              handlePlayCard(cardIndex, { x: clickX, y: clickY });
                            }
                          }
                        }}
                        onTouchStart={(e) => {
                          // Prevent zoom on double tap
                          e.preventDefault();
                        }}
                      >
                        <div className="h-full flex flex-col items-center justify-center text-white font-bold relative">
                          <div className="flex items-center justify-center w-full h-full" dangerouslySetInnerHTML={{ __html:
                            isCurrentUserPlayer
                              ? getCardSVGContent(card)
                              : (isDealingPhase ? getCardBackSVG() : (isAdmin && adminCardsRevealed ? getCardSVGContent(card) : getCardBackSVG()))
                          }} />
                          {card.special && (isCurrentUserPlayer || (isAdmin && adminCardsRevealed && !isDealingPhase)) && (
                            <div className="absolute bottom-1 text-xs bg-gray-900 bg-opacity-70 px-1">
                              {card.special === 'holdon' && 'HOLD'}
                              {card.special === 'pick2' && 'P2'}
                              {card.special === 'generalmarket' && 'GM'}
                              {card.special === 'whot' && 'WHOT'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {visualPlayerIndex !== 0 && (
                    <div className={`${cardDimensions} bg-gray-700 shadow-lg flex items-center justify-center text-gray-400 text-sm font-bold`} style={{ zIndex: maxVisibleCards + 1, opacity: (player.cards || []).length > maxVisibleCards ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
                      +{Math.max(0, (player.cards || []).length - maxVisibleCards)}
                    </div>
                  )}
                  {isCurrentUserPlayer && (
                    <button
                      onClick={() => (player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards && scrollPlayerCards('right')}
                      disabled={!((player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards)}
                      className={`${window.innerWidth < 768 ? 'w-8 h-12' : 'w-10 h-14'} ${(player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards ? 'bg-gradient-to-r from-[#80142C] to-[#4a0c1a]' : 'bg-gradient-to-r from-gray-700 to-gray-600'} flex flex-col items-center justify-center text-white smooth-transition z-30 ml-2 shadow-lg border-2 ${(player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards ? 'border-[#80142C]' : 'border-gray-500'} relative ${!((player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {playableOutsideRange.right && (player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards && <div className="absolute top-1 right-1 w-3 h-3 bg-[#80142C] rounded-full border-2 border-gray-900 animate-ping"></div>}
                      {playableOutsideRange.right && (player.cards || []).length > maxVisiblePlayerCards && playerScrollIndex < (player.cards || []).length - maxVisiblePlayerCards && <div className="absolute top-1 right-1 w-3 h-3 bg-[#80142C] rounded-full border-2 border-gray-900"></div>}
                      <ChevronRight size={window.innerWidth < 768 ? 12 : 16} />
                      <span className={`${window.innerWidth < 768 ? 'text-[8px]' : 'text-[10px]'} font-bold`}>{Math.max(0, (player.cards || []).length - (playerScrollIndex + maxVisiblePlayerCards))}</span>
                    </button>
                  )}
                </div>
                <div className={`text-white ${window.innerWidth < 768 ? 'text-xs' : 'text-sm'} mt-1 font-bold ${isCurrentPlayer ? 'text-[#b8869d]' : ''} flex items-center justify-center`} style={{ textAlign: visualPlayerIndex === 1 ? 'left' : visualPlayerIndex === 3 ? 'right' : 'center' }}>
                  <span>{window.innerWidth < 768 ? `${player.name.split(' ')[0]} (${(player.cards || []).length})` : `${player.name} (${(player.cards || []).length})`}</span>
                  {isCurrentUserPlayer && (
                    <button onClick={() => setShowDeckView(true)} className={`ml-2 ${window.innerWidth < 768 ? 'w-4 h-4' : 'w-5 h-5'} bg-gray-700 rounded-full flex items-center justify-center text-white smooth-transition shadow-sm rounded-full`} title="View Full Deck">
                      <Grid size={window.innerWidth < 768 ? 8 : 10} />
                    </button>
                  )}
                  {currentRoom && isCurrentUserTurn && playerIndex === currentUserActualIndex && !isAnyAnimationInProgress && (
                    <div className={`ml-2 flex items-center ${window.innerWidth < 768 ? 'text-[10px]' : 'text-xs'}`}>
                      <span className="text-[#80142C] font-bold">{window.innerWidth < 768 ? '●' : 'Your Turn'}</span>
                      {turnTimer !== null && (
                        <div className="ml-2 flex items-center text-yellow-400">
                          <Clock size={12} className="mr-1" />
                          <span className="font-bold">{turnTimer}s</span>
                        </div>
                      )}
                    </div>
                  )}
                  {!currentRoom && isCurrentPlayer && playerIndex === 0 && !isAnyAnimationInProgress && (
                    <span className={`ml-1 ${window.innerWidth < 768 ? 'text-[10px]' : 'text-xs'} text-[#80142C] font-bold`}>{window.innerWidth < 768 ? '●' : 'Your Turn'}</span>
                  )}
                  {isAnyAnimationInProgress && gameData.currentPlayer === playerIndex && (
        <span className={`ml-1 ${window.innerWidth < 768 ? 'text-[10px]' : 'text-xs'} text-yellow-400 animate-pulse`}>{window.innerWidth < 768 ? '⏸' : '(Wait...)'}</span>
                  )}
                  {isCurrentUserPlayer && gameData.generalMarketActive && gameData.currentPlayer !== gameData.generalMarketOriginatorId && (
                    <span className={`ml-1 ${window.innerWidth < 768 ? 'text-[8px]' : 'text-[10px]'} text-yellow-300`}>(General Market Active)</span>
                  )}
                  {(player.cards || []).length === 1 && (
                    <span className={`ml-1 ${window.innerWidth < 768 ? 'text-[10px]' : 'text-xs'} text-yellow-300`}>{window.innerWidth < 768 ? '!' : '(Last Card!)'}</span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
      {showDeckView && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] fade-in">
          <div className="bg-gray-900 p-6 border-2 border-[#80142C] max-w-6xl max-h-[80vh] overflow-y-auto scale-in">
            <div className="bg-[#80142C] p-4">
                                                                                                                           <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Your Full Deck ({(gameData.players?.[0]?.cards || []).length} cards)</h2>
                    <span onClick={() => setShowDeckView(false)} className="text-white text-2xl cursor-pointer">×</span>
                  </div>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {(gameData.players?.[0]?.cards || []).map((card, index) => {
                  const canPlayAnyCard = gameData.currentPlayer === 0 && gameData.pendingPickCount === 0 && !(gameData.generalMarketActive && gameData.currentPlayer !== gameData.generalMarketOriginatorId) && !isPlayerActionInProgress;
                  const topCard = (gameData.playPile || []).length > 0 ? gameData.playPile[gameData.playPile.length - 1] : null;
                  const isPlayable = canPlayAnyCard && isCardPlayable(card, topCard);
                  return (
                    <div
                      key={`deck-${card.id}-${index}`}
                      className={`w-16 h-22 shadow-lg smooth-transition ${isPlayable ? 'cursor-pointer border-2 border-[#80142C]' : 'opacity-60'}`}
                      onClick={() => {
                        if (isPlayable) {
                          const actualIndex = index - playerScrollIndex;
                          if (actualIndex >= 0 && actualIndex < maxVisiblePlayerCards) {
                            handlePlayCard(actualIndex);
                          } else {
                            setPlayerScrollIndex(Math.max(0, Math.min(index - Math.floor(maxVisiblePlayerCards / 2), ((gameData.players?.[0]?.cards || []).length) - maxVisiblePlayerCards)));
                            setTimeout(() => {
                              const newIndex = index - Math.max(0, Math.min(index - Math.floor(maxVisiblePlayerCards / 2), ((gameData.players?.[0]?.cards || []).length) - maxVisiblePlayerCards));
                              handlePlayCard(newIndex);
                            }, 100);
                          }
                          setShowDeckView(false);
                        }
                      }}
                    >
                      <div className="h-full flex flex-col items-center justify-center text-white font-bold relative">
                        <div className="flex items-center justify-center w-full h-full text-xs" dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }} />
                        {card.special && (
                          <div className="absolute bottom-0 text-[8px] bg-gray-900 bg-opacity-70 px-1">
                            {card.special === 'holdon' && 'HOLD'}
                            {card.special === 'pick2' && 'P2'}
                            {card.special === 'generalmarket' && 'GM'}
                            {card.special === 'whot' && 'WHOT'}
                          </div>
                        )}
                        {isPlayable && <div className="absolute top-0 right-0 w-2 h-2 bg-[#80142C] rounded-full"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => {
                  playSoundEffect.back();
                  setShowDeckView(false);
                }} className="px-6 py-2 bg-[#80142C] text-white smooth-transition font-bold hover:bg-[#4a0c1a]">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showWhotChoice && <WhotShapePopup selectShape={chooseWhotShape} closePopup={() => setShowWhotChoice(false)} />}
      {showRoundEndPopup && roundEndData && <RoundEndPopup roundEndData={roundEndData} isMultiplayer={!!currentRoom} currentUser={currentUser} />}
      {showEliminatedPopup && <EliminatedPopup setShowEliminatedPopup={setShowEliminatedPopup} returnToMenu={returnToMenu} />}
      {showAdminDeckOverview && isAdmin && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] fade-in">
          <div className="bg-gray-900 p-6 border-2 border-[#80142C] max-w-7xl max-h-[90vh] overflow-y-auto scale-in">
            <div className="bg-[#80142C] p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Admin - All Card Distributions</h2>
                <span onClick={() => {
                  playSoundEffect.back();
                  setShowAdminDeckOverview(false);
                }} className="text-white text-2xl cursor-pointer">×</span>
              </div>
              <div className="space-y-6">
                {/* Play Pile */}
                <div className="bg-gray-900 p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <span className="w-6 h-6 bg-green-600 flex items-center justify-center mr-2 text-xs">P</span>
                    Play Pile ({(gameData.playPile || []).length} cards)
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {(gameData.playPile || []).length === 0 ? (
                      <span className="text-gray-400 italic">Empty</span>
                    ) : (
                      (gameData.playPile || []).map((card, index) => (
                        <div key={`play-pile-${index}`} className="w-12 h-16 shadow-lg" title={`${card.number}${card.shape}${card.chosenShape ? ` (chosen: ${card.chosenShape})` : ''}`}>
                          <div className="flex items-center justify-center w-full h-full text-[8px]" dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Market Deck */}
                <div className="bg-gray-900 p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-600 flex items-center justify-center mr-2 text-xs">M</span>
                    Market Deck ({(gameData.drawPile || []).length} cards)
                  </h3>
                  <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-1 max-h-48 overflow-y-auto">
                    {(gameData.drawPile || []).length === 0 ? (
                      <span className="text-gray-400 italic col-span-full">Empty</span>
                    ) : (
                      (gameData.drawPile || []).map((card, index) => (
                        <div key={`market-${index}`} className="w-10 h-14 shadow" title={`${card.number}${card.shape}`}>
                          <div className="flex items-center justify-center w-full h-full text-[6px]" dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Player Cards */}
                {(gameData.players || []).map((player, playerIndex) => (
                  <div key={player.id} className="bg-gray-900 p-4">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                      <span className={`w-6 h-6 flex items-center justify-center mr-2 text-xs ${player.eliminated ? 'bg-red-600' : gameData.currentPlayer === playerIndex ? 'bg-yellow-600' : 'bg-gray-600'}`}>
                        {playerIndex + 1}
                      </span>
                      {player.name} ({(player.cards || []).length} cards)
                      {player.eliminated && <span className="ml-2 text-red-400 text-sm">[ELIMINATED]</span>}
                      {gameData.currentPlayer === playerIndex && !isAnyAnimationInProgress && <span className="ml-2 text-yellow-400 text-sm">[CURRENT TURN]</span>}
                    </h3>
                    <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-14 gap-1 max-h-32 overflow-y-auto">
                      {(player.cards || []).length === 0 ? (
                        <span className="text-gray-400 italic col-span-full">No cards</span>
                      ) : (
                        (player.cards || []).map((card, cardIndex) => (
                          <div key={`player-${player.id}-${cardIndex}`} className="w-10 h-14 shadow" title={`${card.number}${card.shape}${card.special ? ` (${card.special})` : ''}`}>
                            <div className="flex items-center justify-center w-full h-full text-[6px]" dangerouslySetInnerHTML={{ __html: getCardSVGContent(card) }} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <LottieConfetti 
        isActive={confettiActive} 
        onComplete={() => setConfettiActive(false)} 
      />
    </div>
  );
};

export default Game;