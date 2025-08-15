// Centralized deck utilities

export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createDeck = () => {
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
        // Should never happen; fail fast if it does
        throw new Error(`Duplicate card creation attempted: ${cardKey}`);
      }
      const card = { shape, number, id: `unique-${shape}-${number}-${Date.now()}-${cardIdCounter++}` };
      if (number === 1) card.special = 'holdon';
      else if (number === 2) card.special = 'pick2';
      else if (number === 14) card.special = 'generalmarket';
      createdCards.set(cardKey, card);
      deck.push(card);
    });
  });

  // Add 5 WHOT cards
  for (let i = 0; i < 5; i++) {
    deck.push({ shape: '🔥', number: 'WHOT', id: `whot-${i}-${Date.now()}-${cardIdCounter++}`, special: 'whot' });
  }

  // Validate uniqueness of regular cards
  const regularCards = deck.filter(card => card.special !== 'whot');
  const cardKeys = regularCards.map(card => `${card.shape}-${card.number}`);
  const uniqueKeys = new Set(cardKeys);
  if (cardKeys.length !== uniqueKeys.size) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      // Lightweight diagnostics in dev builds
      // eslint-disable-next-line no-console
      console.error('Duplicate cards found in deck after creation!');
    }
    throw new Error('Deck creation failed - duplicate cards detected');
  }

  if (import.meta && import.meta.env && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`Deck created successfully: ${deck.length} total cards`);
  }

  return deck;
};


