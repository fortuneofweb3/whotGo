// SVG Templates Cache - Preload all templates for better performance
const SVG_TEMPLATES_CACHE = new Map();

// Preload all SVG templates when the module is imported
const preloadSVGTemplates = () => {
  const templates = {
    '●': (num) => `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
      <g>
        <g>
          <path fill="#F4F4F2" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
            c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
        </g>
        <rect x="14.4" y="18" fill="none" width="27.8" height="27.3"/>
        <rect x="137.4" y="209.4" fill="none" width="27.8" height="27.3"/>
        <circle fill="#7D1228" cx="97.8" cy="127.8" r="57.2"/>
        <circle fill="#7D1228" cx="23.6" cy="54.5" r="9.3"/>
        <circle fill="#7D1228" cx="155.1" cy="198.2" r="9.3"/>
        <text transform="matrix(1 0 0 1 15.942 31.6153)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
        <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
      </g>
      </svg>
    `,
    '✚': (num) => `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
      <g>
        <g>
          <path fill="#F4F4F2" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
            c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
        </g>
        <rect x="14.4" y="18" fill="none" width="27.8" height="27.3"/>
        <rect x="137.4" y="209.4" fill="none" width="27.8" height="27.3"/>
        <g>
          <rect x="17.9" y="91.9" fill="#7D1228" width="153.3" height="52.3"/>
          <rect x="68.4" y="45.3" fill="#7D1228" width="52.3" height="153.3"/>
        </g>
        <g>
          <rect x="10.3" y="49.4" fill="#7D1228" width="21.3" height="7.3"/>
          <rect x="17.3" y="42.9" fill="#7D1228" width="7.3" height="21.3"/>
        </g>
        <g>
          <rect x="144.4" y="200" fill="#7D1228" width="21.3" height="7.3"/>
          <rect x="151.4" y="193.5" fill="#7D1228" width="7.3" height="21.3"/>
        </g>
        <text transform="matrix(1 0 0 1 13.2988 34.2585)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
        <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
      </g>
      </svg>
    `,
    '■': (num) => `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
      <g>
        <g>
          <path fill="#F4F4F2" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
            c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
        </g>
        <rect x="14.4" y="18" fill="none" width="27.8" height="27.3"/>
        <rect x="137.4" y="209.4" fill="none" width="27.8" height="27.3"/>
        <rect x="33.1" y="67.9" fill="#7D1228" width="121.1" height="121.1"/>
        <rect x="11.9" y="45.3" fill="#7D1228" width="21.2" height="18.5"/>
        <rect x="144.5" y="195.5" fill="#7D1228" width="21.2" height="18.5"/>
        <text transform="matrix(1 0 0 1 13.2988 34.2585)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
        <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
      </g>
      </svg>
    `,
    '▲': (num) => `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
      <g>
        <g>
          <path fill="#F4F4F2" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
            c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
        </g>
        <rect x="14.4" y="18" fill="none" width="27.8" height="27.3"/>
        <rect x="137.4" y="209.4" fill="none" width="27.8" height="27.3"/>
        <g transform="translate(40, 75) scale(2)">
          <polygon stroke="#791026" points="25, 0, 0, 48, 50, 48" fill-opacity="null" stroke-opacity="null" stroke-width="2" fill="#791026"/>
        </g>
        <g transform="translate(13, 42) scale(0.4)">
          <polygon stroke="#791026" points="25, 0, 0, 48, 50, 48" fill-opacity="null" stroke-opacity="null" stroke-width="5" fill="#791026"/>
        </g>
        <g transform="translate(166.5, 210) scale(0.4) rotate(180)">
          <polygon stroke="#791026" points="25, 0, 0, 48, 50, 48" fill-opacity="null" stroke-opacity="null" stroke-width="5" fill="#791026"/>
        </g>
        <text transform="matrix(1 0 0 1 13.2988 34.2585)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
        <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
      </g>
      </svg>
    `,
    '★': (num) => `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
      <g>
        <g>
          <path fill="#F4F4F2" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
            c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
        </g>
        <rect x="14.4" y="18" fill="none" width="27.8" height="27.3"/>
        <rect x="137.4" y="209.4" fill="none" width="27.8" height="27.3"/>
        <polygon fill="#7D1228" points="93.6,56.9 114.5,99.2 161.2,106 127.4,138.9 135.4,185.4 93.6,163.5 51.9,185.4 59.8,138.9 26.1,106
          72.8,99.2 "/>
        <polygon fill="#7D1228" points="21,37.8 24.1,44 31,45.1 26,50 27.2,56.9 21,53.6 14.8,56.9 16,50 10.9,45.1 17.9,44 "/>
        <polygon fill="#7D1228" points="155.1,192.3 158.2,198.6 165.1,199.6 160.1,204.5 161.3,211.4 155.1,208.2 148.9,211.4 150,204.5
          145,199.6 152,198.6 "/>
        <text transform="matrix(1 0 0 1 13.2988 34.2585)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
        <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#791026" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">${num}</text>
      </g>
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
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
    <g>
      <path fill="white" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
        c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
      <text transform="matrix(1 0 0 1 15.942 31.6153)" fill="#7D1228" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">20</text>
      <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#7D1228" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">20</text>
      <text x="93.15" y="120" font-family="Pacifico, cursive" font-size="32px" font-weight="bold" fill="#7D1228" text-anchor="middle" dominant-baseline="middle">Whot</text>
      <text x="93.15" y="140" font-family="Pacifico, cursive" font-size="32px" font-weight="bold" fill="#7D1228" text-anchor="middle" dominant-baseline="middle" transform="rotate(180 93.15 140)">Whot</text>
    </g>
    </svg>
  `);

  // Pre-generate card back
  SVG_TEMPLATES_CACHE.set('card-back', `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
    <g>
      <path fill="#7D1228" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
        c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
      <text x="93.15" y="120" font-family="Pacifico, cursive" font-size="32px" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">Whot</text>
      <text x="93.15" y="140" font-family="Pacifico, cursive" font-size="32px" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" transform="rotate(180 93.15 140)">Whot</text>
    </g>
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
      const firstWhotY = "110";
      const secondWhotY = "150";
      return `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 186.3 255.5" style="enable-background:new 0 0 186.3 255.5;" xml:space="preserve">
        <g>
          <path fill="white" stroke="#000000" d="M182.9,237.7c0,7.8-6.3,14.2-14.2,14.2H18.5c-7.8,0-14.2-6.3-14.2-14.2V16.6c0-7.8,6.3-14.2,14.2-14.2h150.2
            c7.8,0,14.2,6.3,14.2,14.2V237.7z"/>
          <text transform="matrix(1 0 0 1 15.942 31.6153)" fill="#7D1228" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">20</text>
          <text transform="matrix(1 0 0 1 147.3851 236.655)" fill="#7D1228" font-family="Helvetica, Arial, sans-serif" font-size="26.9039px">20</text>
          <text x="93.15" y="${firstWhotY}" font-family="Pacifico, cursive" font-size="32px" font-weight="bold" fill="#7D1228" text-anchor="middle" dominant-baseline="middle">Whot</text>
          <text x="93.15" y="${secondWhotY}" font-family="Pacifico, cursive" font-size="32px" font-weight="bold" fill="#7D1228" text-anchor="middle" dominant-baseline="middle" transform="rotate(180 93.15 ${secondWhotY})">Whot</text>
          <text x="93.15" y="180" font-family="Helvetica, Arial, sans-serif" font-size="36px" font-weight="bold" fill="#7D1228" text-anchor="middle" dominant-baseline="middle">${card.chosenShape}</text>
        </g>
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
