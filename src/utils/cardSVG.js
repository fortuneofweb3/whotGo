// SVG Templates Cache - Preload all templates for better performance
const SVG_TEMPLATES_CACHE = new Map();

// Simplified SVG templates that are more browser-compatible
const preloadSVGTemplates = () => {
  const templates = {
    '●': (num) => `
      <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="182" height="252" rx="8" fill="#F4F4F2" stroke="#000" stroke-width="2"/>
        <circle cx="93" cy="128" r="57" fill="#7D1228"/>
        <circle cx="23" cy="54" r="9" fill="#7D1228"/>
        <circle cx="155" cy="198" r="9" fill="#7D1228"/>
        <text x="16" y="32" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
        <text x="147" y="237" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
      </svg>
    `,
    '✚': (num) => `
      <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="182" height="252" rx="8" fill="#F4F4F2" stroke="#000" stroke-width="2"/>
        <rect x="18" y="92" width="150" height="52" fill="#7D1228"/>
        <rect x="68" y="45" width="52" height="153" fill="#7D1228"/>
        <rect x="10" y="49" width="21" height="7" fill="#7D1228"/>
        <rect x="17" y="43" width="7" height="21" fill="#7D1228"/>
        <rect x="144" y="200" width="21" height="7" fill="#7D1228"/>
        <rect x="151" y="194" width="7" height="21" fill="#7D1228"/>
        <text x="13" y="34" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
        <text x="147" y="237" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
      </svg>
    `,
    '■': (num) => `
      <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="182" height="252" rx="8" fill="#F4F4F2" stroke="#000" stroke-width="2"/>
        <rect x="33" y="68" width="121" height="121" fill="#7D1228"/>
        <rect x="12" y="45" width="21" height="19" fill="#7D1228"/>
        <rect x="145" y="196" width="21" height="19" fill="#7D1228"/>
        <text x="13" y="34" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
        <text x="147" y="237" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
      </svg>
    `,
    '▲': (num) => `
      <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="182" height="252" rx="8" fill="#F4F4F2" stroke="#000" stroke-width="2"/>
        <polygon points="93,60 33,140 153,140" fill="#791026"/>
        <polygon points="13,35 8,45 18,45" fill="#791026"/>
        <polygon points="166,200 161,210 171,210" fill="#791026"/>
        <text x="13" y="34" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
        <text x="147" y="237" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
      </svg>
    `,
    '★': (num) => `
      <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="182" height="252" rx="8" fill="#F4F4F2" stroke="#000" stroke-width="2"/>
        <polygon points="93,57 114,99 161,106 127,139 135,185 93,164 52,185 60,139 26,106 73,99" fill="#7D1228"/>
        <polygon points="21,38 24,44 31,45 26,50 27,57 21,54 15,57 16,50 11,45 18,44" fill="#7D1228"/>
        <polygon points="155,192 158,199 165,200 160,205 161,211 155,208 149,211 150,205 145,200 152,199" fill="#7D1228"/>
        <text x="13" y="34" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
        <text x="147" y="237" fill="#791026" font-family="Arial" font-size="26" font-weight="bold">${num}</text>
      </svg>
    `
  };

  // Pre-generate all possible card combinations for instant access
  const numbers = ['1', '2', '3', '4', '5', '7', '8', '10', '11', '12', '13', '14'];
  const shapes = Object.keys(templates);

  shapes.forEach(shape => {
    numbers.forEach(num => {
      const key = `${shape}-${num}`;
      SVG_TEMPLATES_CACHE.set(key, templates[shape](num));
    });
  });

  // Pre-generate Whot cards
  SVG_TEMPLATES_CACHE.set('whot-default', `
    <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="182" height="252" rx="8" fill="white" stroke="#000" stroke-width="2"/>
      <text x="16" y="32" fill="#7D1228" font-family="Arial" font-size="26" font-weight="bold">20</text>
      <text x="147" y="237" fill="#7D1228" font-family="Arial" font-size="26" font-weight="bold">20</text>
      <text x="93" y="120" font-family="Arial" font-size="32" font-weight="bold" fill="#7D1228" text-anchor="middle">Whot</text>
      <text x="93" y="140" font-family="Arial" font-size="32" font-weight="bold" fill="#7D1228" text-anchor="middle" transform="rotate(180 93 140)">Whot</text>
    </svg>
  `);

  // Pre-generate card back
  SVG_TEMPLATES_CACHE.set('card-back', `
    <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="182" height="252" rx="8" fill="#7D1228" stroke="#000" stroke-width="2"/>
      <text x="93" y="120" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle">Whot</text>
      <text x="93" y="140" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle" transform="rotate(180 93 140)">Whot</text>
    </svg>
  `);

  console.log(`SVG Templates preloaded: ${SVG_TEMPLATES_CACHE.size} templates cached`);
};

// Initialize SVG templates on module load
preloadSVGTemplates();

// Optimized card SVG content getter with caching
export const getCardSVGContent = (card) => {
  if (!card) return '';

  // Handle Whot cards
  if (card.special === 'whot' || card.shape === '🔥') {
    if (card.chosenShape) {
      // Generate Whot card with chosen shape on demand (rare case)
      return `
        <svg viewBox="0 0 186 256" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="182" height="252" rx="8" fill="white" stroke="#000" stroke-width="2"/>
          <text x="16" y="32" fill="#7D1228" font-family="Arial" font-size="26" font-weight="bold">20</text>
          <text x="147" y="237" fill="#7D1228" font-family="Arial" font-size="26" font-weight="bold">20</text>
          <text x="93" y="110" font-family="Arial" font-size="32" font-weight="bold" fill="#7D1228" text-anchor="middle">Whot</text>
          <text x="93" y="150" font-family="Arial" font-size="32" font-weight="bold" fill="#7D1228" text-anchor="middle" transform="rotate(180 93 150)">Whot</text>
          <text x="93" y="180" font-family="Arial" font-size="36" font-weight="bold" fill="#7D1228" text-anchor="middle">${card.chosenShape}</text>
        </svg>
      `;
    }
    return SVG_TEMPLATES_CACHE.get('whot-default') || '';
  }

  // Get cached template for regular cards
  const key = `${card.shape}-${card.number}`;
  return SVG_TEMPLATES_CACHE.get(key) || '';
};

// Optimized card back SVG getter
export const getCardBackSVG = () => {
  return SVG_TEMPLATES_CACHE.get('card-back') || '';
};

// Performance monitoring
export const getSVGCacheStats = () => {
  return {
    cacheSize: SVG_TEMPLATES_CACHE.size,
    isPreloaded: SVG_TEMPLATES_CACHE.size > 0
  };
};
