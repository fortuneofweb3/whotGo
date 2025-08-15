# Whot Go! - File Structure Documentation

A modern multiplayer card game built with React, Solana blockchain integration, and the Honeycomb Protocol. This document explains the project's file and directory structure.

## 📁 Project Structure Overview

```
whotgo/
├── src/                          # Source code directory
│   ├── components/               # React components
│   │   ├── Game.jsx             # Main game component
│   │   ├── popups/              # Modal popup components
│   │   ├── BadgeNotification.jsx # Achievement notifications
│   │   ├── ErrorBoundary.jsx    # Error handling component
│   │   ├── LottieConfetti.jsx   # Animation component
│   │   ├── ProfileCreationStatus.jsx # Profile creation UI
│   │   └── WalletProvider.jsx   # Wallet connection provider
│   ├── utils/                   # Utility functions and helpers
│   │   ├── cardSVG.js          # Card SVG generation
│   │   ├── deck.js             # Deck creation and shuffling
│   │   ├── gameUtils.js        # Game logic utilities
│   │   ├── honeycombBadges.js  # Badge system management
│   │   ├── profile.js          # User profile management
│   │   └── soundEffects.js     # Audio system management
│   ├── assets/                  # Static assets
│   │   └── confetti-celebration.json # Lottie animation data
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Main application styles
│   ├── firebase.js             # Firebase configuration
│   ├── index.css               # Global styles
│   └── index.jsx               # Application entry point
├── public/                      # Public static assets
│   ├── assets/                 # Public assets
│   │   ├── sounds/            # Audio files
│   │   │   └── effects/       # Sound effect files
│   │   └── Confetti Celebration.lottie # Lottie animation
│   ├── favicon.svg            # Site favicon
│   ├── manifest.json          # PWA manifest
│   └── output.css             # Compiled CSS
├── functions/                   # Firebase Cloud Functions
│   ├── index.js               # Functions entry point
│   └── package.json           # Functions dependencies
├── tools/                       # Development tools
│   ├── checkBraces.cjs        # Code validation tool
│   ├── checkBraces.js         # Brace checking utility
│   └── convert-favicon.html   # Favicon conversion tool
├── docs/                        # Documentation files
├── .env files                  # Environment configuration
├── package.json                # Project dependencies
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite build configuration
├── firebase.json               # Firebase configuration
├── netlify.toml                # Netlify deployment config
├── vercel.json                 # Vercel deployment config
└── README.md                   # This file
```

## 🔧 Core Files Explanation

### Main Application Files

**`src/App.jsx`** - Main application component
- Handles game state management
- Manages user authentication and wallet connection
- Coordinates between Firebase and Honeycomb Protocol
- Controls game flow and navigation

**`src/index.jsx`** - Application entry point
- Initializes React application
- Sets up wallet adapters and providers
- Configures global error boundaries

**`src/firebase.js`** - Firebase configuration
- Database connection setup
- Authentication configuration
- Cloud functions integration

### Component Structure

**`src/components/Game.jsx`** - Core game component
- Renders the main game interface
- Handles card animations and interactions
- Manages game state and player actions
- Coordinates with multiplayer functionality

**`src/components/popups/`** - Modal popup components
- `AchievementPopup.jsx` - Achievement display
- `GameLogPopup.jsx` - Game history viewer
- `GameModePopup.jsx` - Game mode selection
- `HelpPopup.jsx` - Game rules and help
- `LeaderboardPopup.jsx` - Player rankings
- `ProfilePopup.jsx` - User profile management
- `RoundEndPopup.jsx` - Round completion screen
- `SettingsPopup.jsx` - Game settings
- `SyncPopup.jsx` - Data synchronization
- `WhotShapePopup.jsx` - WHOT card shape selection

### Utility Functions

**`src/utils/profile.js`** - User profile management
- Honeycomb Protocol integration
- Profile creation and updates
- Blockchain transaction handling
- SOL balance management

**`src/utils/honeycombBadges.js`** - Achievement system
- Badge condition checking
- Achievement unlocking logic
- Progress tracking
- Badge claiming functionality

**`src/utils/soundEffects.js`** - Audio system
- Sound effect management
- Background music control
- Volume and pitch control
- Audio file loading and caching

**`src/utils/deck.js`** - Card deck management
- Deck creation and validation
- Card shuffling algorithms
- Card uniqueness checking
- Special card handling

**`src/utils/gameUtils.js`** - Game logic utilities
- Player position calculations
- Visual mapping functions
- Game state validation
- Animation position helpers

**`src/utils/cardSVG.js`** - Card rendering
- SVG card generation
- Card visual representation
- Shape and number rendering
- Card styling utilities

### Configuration Files

**`package.json`** - Project dependencies and scripts
- React and Vite configuration
- Solana wallet adapters
- Firebase SDK
- Development tools

**`tailwind.config.js`** - CSS framework configuration
- Custom color schemes
- Responsive breakpoints
- Component styling
- Animation configurations

**`vite.config.js`** - Build tool configuration
- Development server setup
- Build optimization
- Asset handling
- Environment variables

**`firebase.json`** - Firebase project configuration
- Hosting settings
- Database rules
- Cloud functions
- Security configurations

## 🎮 Game Architecture

### State Management
- **Local State**: React hooks for UI state
- **Firebase**: Real-time game data and user profiles
- **Honeycomb**: On-chain achievements and badges
- **LocalStorage**: User preferences and session data

### Data Flow
1. **User Authentication**: Wallet connection → Profile creation
2. **Game Initialization**: Deck creation → Player setup → Game start
3. **Gameplay**: Card actions → State updates → Animation triggers
4. **Multiplayer**: Firebase sync → Real-time updates → Player coordination
5. **Achievements**: Progress tracking → Badge unlocking → Blockchain updates

### Component Hierarchy
```
App.jsx
├── WalletProvider
├── Game (when playing)
│   ├── Player Cards
│   ├── Opponent Cards
│   ├── Play Pile
│   ├── Market Deck
│   └── Game Controls
├── Popups (modals)
└── Navigation
```

## 🔗 External Dependencies

### Blockchain
- **Solana Web3.js**: Blockchain interaction
- **Wallet Adapter**: Multi-wallet support
- **Honeycomb Protocol**: User profiles and achievements

### Backend
- **Firebase Realtime Database**: Game state storage
- **Firebase Functions**: Serverless backend
- **Firebase Hosting**: Application deployment

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling framework
- **Lucide React**: Icon library

### Audio & Animation
- **Lottie**: Animation library
- **Custom Audio System**: Sound management

## 🚀 Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start dev server: `npm run dev`
5. Connect Solana wallet
6. Test game functionality

### Building for Production
1. Build application: `npm run build`
2. Deploy to Firebase: `firebase deploy`
3. Verify deployment
4. Test production functionality

### Code Organization
- **Components**: Reusable UI elements
- **Utils**: Business logic and helpers
- **Assets**: Static files and resources
- **Config**: Build and deployment settings

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `Game.jsx`, `AchievementPopup.jsx`)
- **Utilities**: camelCase (e.g., `soundEffects.js`, `gameUtils.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `BADGE_CRITERIA`)
- **Functions**: camelCase (e.g., `createDeck`, `shuffleDeck`)
- **CSS Classes**: kebab-case (e.g., `game-container`, `card-animation`)

## 🔍 Key Features by File

### Game Logic
- **`Game.jsx`**: Main game mechanics and UI
- **`deck.js`**: Card deck management
- **`gameUtils.js`**: Game state utilities

### Blockchain Integration
- **`profile.js`**: Honeycomb Protocol integration
- **`honeycombBadges.js`**: Achievement system
- **`WalletProvider.jsx`**: Wallet connection

### Audio System
- **`soundEffects.js`**: Complete audio management
- **`public/assets/sounds/`**: Audio files

### User Interface
- **`App.jsx`**: Application shell and navigation
- **`popups/`**: Modal dialogs and overlays
- **`BadgeNotification.jsx`**: Achievement notifications

This structure provides a clear separation of concerns, making the codebase maintainable and scalable for future development.
