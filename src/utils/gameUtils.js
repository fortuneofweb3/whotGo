// Game utility functions for Whot game

// Get play pile position for a card
export const getPlayPilePosition = (index, updatePositions = false) => {
  // This function should be implemented based on your existing logic
  // For now, returning a basic position
  return {
    transform: `translate(-50%, -50%) rotate(${index * 2}deg)`,
    zIndex: 1000 + index
  };
};

// Get top market card position
export const getTopMarketCardPosition = () => {
  const screenWidth = window.innerWidth;
  return {
    top: '50%',
    left: '50%',
    transform: `translate(calc(-50% + ${screenWidth < 768 ? '54px' : screenWidth < 1024 ? '72px' : '90px'}), -50%)`
  };
};

// Get exact card position for player cards
export const getExactCardPosition = (playerIndex, cardIndex, totalCards, isPlayer = false) => {
  // This function should be implemented based on your existing logic
  // For now, returning a basic position
  return {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };
};

// Get visual player mapping
export const getVisualPlayerMapping = (currentRoom, currentUser) => {
  if (!currentRoom) return { actualToVisual: {}, visualToActual: {} };
  
  // Convert room players object to array
  const roomPlayers = currentRoom.players || {};
  const playersArray = Object.values(roomPlayers);
  
  if (!Array.isArray(playersArray)) {
    console.warn('Room players is not an array:', roomPlayers);
    return { actualToVisual: {}, visualToActual: {} };
  }
  
  const currentUserIndex = playersArray.findIndex(p => p.id === currentUser?.id);
  
  if (currentUserIndex === -1) {
    console.warn('Current user not found in room players:', {
      currentUserId: currentUser?.id,
      playerIds: playersArray.map(p => p.id)
    });
    return { actualToVisual: {}, visualToActual: {} };
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
