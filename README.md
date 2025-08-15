# Whot Go! 🃏

**The Ultimate African Card Game Experience on Solana**

Whot Go! is a modern, blockchain-powered implementation of the classic African card game "Whot" (also known as "Wot" or "Wot Card"). Built on Solana with Honeycomb Protocol integration, it brings the traditional family card game into the Web3 era with multiplayer support, achievements, and on-chain profiles.

## 🎮 **What is Whot?**

Whot is a popular African card game similar to Crazy Eights, where players try to get rid of their cards by matching suits or numbers. The game features special cards with unique abilities and strategic gameplay that has been enjoyed by families across Africa for generations.

## ✨ **Key Features**

### 🃏 **Classic Gameplay**
- **Traditional Whot Rules**: Authentic African card game experience
- **Special Cards**: Hold On, Pick 2, General Market, and Whot cards with unique abilities
- **Strategic Play**: Match suits, numbers, or use special cards to outmaneuver opponents
- **Multiple Players**: Support for 2-4 players in both single-player and multiplayer modes

### 🌐 **Multiplayer Experience**
- **Real-time Gaming**: Live multiplayer matches with real opponents
- **Room System**: Create or join game rooms with customizable settings
- **Live Chat**: Communicate with other players during games
- **Match History**: Track your games and performance over time

### ⛓️ **Blockchain Integration**
- **Solana Network**: Fast, low-cost transactions on Solana blockchain
- **Honeycomb Protocol**: On-chain user profiles and achievements
- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Achievement System**: Earn badges and track progress on-chain

### 🏆 **Achievement System**
- **Game-based Badges**: Earn badges for wins, perfect games, and special plays
- **On-chain Storage**: All achievements stored securely on Solana
- **Profile System**: Create and customize your gaming profile
- **Leaderboards**: Compete with other players globally

### 🎵 **Immersive Experience**
- **Sound Effects**: Authentic card sounds and game audio
- **Animations**: Smooth card animations and visual effects
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface with retro gaming aesthetics

### 🔧 **Technical Features**
- **Firebase Integration**: Real-time game state and user data
- **Web Audio API**: Optimized sound system for mobile devices
- **SVG Rendering**: High-quality card graphics with browser compatibility
- **Performance Optimized**: Smooth gameplay even on low-end devices

## 🚀 **Getting Started**

### **Prerequisites**
- A Solana wallet (Phantom, Solflare, etc.)
- Some SOL for transaction fees (automatic airdrop provided for testing)
- Modern web browser

### **How to Play**
1. **Connect Wallet**: Connect your Solana wallet to the game
2. **Create Profile**: Set up your on-chain gaming profile
3. **Choose Mode**: Select single-player or multiplayer
4. **Start Playing**: Join a room or create your own
5. **Earn Achievements**: Complete games to earn badges and XP

### **Game Rules**
- Match cards by suit or number
- Use special cards strategically
- Be the first to get rid of all your cards
- Watch out for Whot cards - they can change the game!

## 🏗️ **Project Structure**

```
whotgo/
├── src/                          # Main source code
│   ├── components/               # React components
│   │   ├── Game.jsx             # Main game interface and multiplayer logic
│   │   ├── Lobby.jsx            # Multiplayer room management and player matching
│   │   ├── popups/              # Modal dialogs and overlays
│   │   │   ├── AchievementPopup.jsx    # Achievement display and notifications
│   │   │   ├── GameLogPopup.jsx        # Game history and log viewer
│   │   │   ├── GameModePopup.jsx       # Single-player vs multiplayer selection
│   │   │   ├── HelpPopup.jsx           # Game rules and help documentation
│   │   │   ├── LeaderboardPopup.jsx    # Player rankings and statistics
│   │   │   ├── ProfilePopup.jsx        # User profile management and settings
│   │   │   ├── RoundEndPopup.jsx       # Round completion and results screen
│   │   │   ├── SettingsPopup.jsx       # Game settings and preferences
│   │   │   ├── SyncPopup.jsx           # Data synchronization status
│   │   │   └── WhotShapePopup.jsx      # WHOT card shape selection interface
│   │   ├── BadgeNotification.jsx       # Achievement badge notifications
│   │   ├── ErrorBoundary.jsx           # Error handling and recovery
│   │   ├── LottieConfetti.jsx          # Celebration animations
│   │   ├── ProfileCreationStatus.jsx   # Profile creation progress UI
│   │   └── WalletProvider.jsx          # Solana wallet connection provider
│   ├── utils/                   # Utility functions and business logic
│   │   ├── profile.js           # Honeycomb Protocol integration and SOL airdrops
│   │   ├── soundEffects.js      # Audio system with Web Audio API
│   │   ├── cardSVG.js           # Card graphics and SVG rendering
│   │   ├── deck.js              # Card deck creation and shuffling
│   │   ├── gameUtils.js         # Game logic utilities and helpers
│   │   └── honeycombBadges.js   # Achievement system and badge unlocking logic
│   ├── assets/                  # Static assets and resources
│   │   └── confetti-celebration.json   # Lottie animation data
│   ├── App.jsx                  # Main application component and state management
│   ├── App.css                  # Global styles and responsive design
│   ├── firebase.js              # Firebase configuration and initialization
│   ├── index.css                # Base CSS styles and resets
│   └── index.jsx                # Application entry point and React initialization
├── public/                      # Public static assets
│   ├── assets/                  # Public assets directory
│   │   ├── sounds/              # Audio files and sound effects
│   │   │   └── effects/         # Individual sound effect files
│   │   └── Confetti Celebration.lottie  # Lottie animation file
│   ├── favicon.svg              # Website favicon
│   ├── manifest.json            # Progressive Web App manifest
│   └── output.css               # Compiled CSS output
├── functions/                   # Firebase Cloud Functions
│   ├── index.js                 # Server-side logic and API endpoints
│   └── package.json             # Functions dependencies
├── tools/                       # Development and build tools
│   ├── checkBraces.cjs          # Code validation and brace checking
│   ├── checkBraces.js           # Brace validation utility
│   └── convert-favicon.html     # Favicon conversion tool
├── docs/                        # Documentation and guides
├── .env files                   # Environment variables (not in repo)
├── package.json                 # Project dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── vite.config.js               # Vite build tool configuration
├── firebase.json                # Firebase project configuration
├── netlify.toml                 # Netlify deployment configuration
├── vercel.json                  # Vercel deployment configuration
└── README.md                    # This documentation file
```

### **📁 Directory Structure Explained**

#### **`src/` - Main Source Code**
The heart of the application containing all React components, utilities, and business logic.

- **`components/`**: Reusable UI components organized by functionality
  - **`Game.jsx`**: Core game interface handling card rendering, player interactions, and multiplayer synchronization
  - **`Lobby.jsx`**: Multiplayer room management, player matching, and game room creation
  - **`popups/`**: Modal dialogs for various game interactions and settings
  - **Supporting Components**: Error handling, notifications, and wallet integration

- **`utils/`**: Business logic and utility functions
  - **`profile.js`**: Honeycomb Protocol integration, SOL airdrops, and user profile management
  - **`soundEffects.js`**: Complete audio system using Web Audio API for mobile compatibility
  - **`cardSVG.js`**: Card graphics generation and SVG rendering optimization
  - **`deck.js`**: Card deck creation, shuffling, and validation
  - **`gameUtils.js`**: Game logic helpers and utility functions
  - **`honeycombBadges.js`**: Achievement system and badge unlocking logic

- **`assets/`**: Static resources like animations and configuration files

#### **`public/` - Static Assets**
Files served directly to the browser without processing.

- **`assets/sounds/`**: Audio files for game sound effects and music
- **`assets/`**: Other static resources like animations and images
- **Configuration Files**: PWA manifest, favicon, and compiled CSS

#### **`functions/` - Backend Logic**
Firebase Cloud Functions for server-side operations.

- **`index.js`**: API endpoints for game state management and user data
- **`package.json`**: Backend dependencies and configuration

#### **`tools/` - Development Utilities**
Helper scripts and tools for development and build processes.

- **Code Validation**: Brace checking and syntax validation tools
- **Asset Processing**: Favicon conversion and other asset utilities

#### **Configuration Files**
- **`package.json`**: Project dependencies, scripts, and metadata
- **`tailwind.config.js`**: CSS framework configuration and customizations
- **`vite.config.js`**: Build tool configuration and optimization settings
- **`firebase.json`**: Firebase project settings and deployment configuration
- **`netlify.toml`**: Netlify deployment settings and build commands
- **`vercel.json`**: Vercel deployment configuration (alternative hosting)

### **🔧 Key Files Explained**

#### **Core Application Files**
- **`src/App.jsx`**: Main application component managing game state, wallet connection, and navigation
- **`src/index.jsx`**: Application entry point with React initialization and provider setup
- **`src/firebase.js`**: Firebase configuration and database connection setup

#### **Game Logic Files**
- **`src/components/Game.jsx`**: Complete game interface with card rendering, animations, and multiplayer sync
- **`src/utils/deck.js`**: Card deck management including creation, shuffling, and validation
- **`src/utils/gameUtils.js`**: Game state utilities, player calculations, and helper functions

#### **Blockchain Integration**
- **`src/utils/profile.js`**: Honeycomb Protocol integration, SOL airdrops, and profile management
- **`src/utils/honeycombBadges.js`**: Achievement system with badge unlocking and progress tracking
- **`src/components/WalletProvider.jsx`**: Solana wallet connection and adapter management

#### **Audio and Graphics**
- **`src/utils/soundEffects.js`**: Complete audio system with Web Audio API for mobile optimization
- **`src/utils/cardSVG.js`**: Card graphics generation with SVG optimization and caching
- **`public/assets/sounds/`**: Audio files for game effects and background music

#### **User Interface**
- **`src/components/popups/`**: Modal dialogs for game interactions, settings, and notifications
- **`src/App.css`**: Global styles with responsive design and mobile optimizations
- **`src/components/BadgeNotification.jsx`**: Achievement notification system

### **🎮 Game Architecture Overview**

#### **Data Flow**
1. **User Authentication**: Wallet connection → Profile creation/loading
2. **Game Initialization**: Deck creation → Player setup → Game state initialization
3. **Gameplay Loop**: Card actions → State updates → Firebase sync → UI updates
4. **Multiplayer Sync**: Real-time updates via Firebase → Player coordination
5. **Achievement Tracking**: Progress monitoring → Badge unlocking → Blockchain updates

#### **State Management**
- **Local State**: React hooks for UI state and component data
- **Firebase**: Real-time game state, user profiles, and multiplayer data
- **Honeycomb Protocol**: On-chain achievements, badges, and user profiles
- **LocalStorage**: User preferences, session data, and cached information

#### **Component Hierarchy**
```
App.jsx (Main Container)
├── WalletProvider (Wallet Connection)
├── Game (Game Interface)
│   ├── Player Cards (User's hand)
│   ├── Opponent Cards (AI/Other players)
│   ├── Play Pile (Current card)
│   ├── Market Deck (Draw pile)
│   └── Game Controls (Actions)
├── Popups (Modal Dialogs)
│   ├── AchievementPopup
│   ├── SettingsPopup
│   ├── HelpPopup
│   └── Other Modals
└── Navigation (Menu System)
```

This structure provides a clear separation of concerns, making the codebase maintainable, scalable, and easy to understand for new developers joining the project.

## 🛠️ **Technology Stack**

- **Frontend**: React.js with Vite
- **Blockchain**: Solana with Honeycomb Protocol
- **Backend**: Firebase (Realtime Database, Cloud Functions)
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API
- **Graphics**: SVG with browser optimization
- **Deployment**: Netlify

## 🌍 **Live Demo**

**Play Now**: [https://whotgo.netlify.app](https://whotgo.netlify.app)

## 🤝 **Contributing**

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

## 📄 **License**

This project is licensed under the MIT License.

---

**Join the Whot Go! community and experience the future of African card gaming on the blockchain!** 🃏✨
