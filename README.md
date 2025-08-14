# Whot Go! 🃏

A modern, multiplayer card game built with React, Solana blockchain integration, and the Honeycomb Protocol. Experience the classic Nigerian card game "Whot" with blockchain-powered achievements, leaderboards, and user profiles.

![Whot Go! Gameplay](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Solana](https://img.shields.io/badge/Solana-1.95.3-purple)
![Firebase](https://img.shields.io/badge/Firebase-12.1.0-orange)

## 🎮 Features

### Core Gameplay
- **Classic Whot Rules**: Authentic Nigerian card game experience
- **AI Opponents**: Play against intelligent computer players
- **Multiplayer Support**: Real-time multiplayer games with other players
- **Room System**: Create or join game rooms for multiplayer matches

### Blockchain Integration
- **Solana Wallet Support**: Connect with Phantom, Solflare, and other Solana wallets
- **Honeycomb Protocol**: On-chain user profiles and achievements
- **Achievement System**: Unlock badges for various accomplishments
- **XP & Leveling**: Earn experience points and level up your profile

### User Experience
- **Retro Terminal Aesthetic**: Unique visual design with terminal-inspired UI
- **Background Music**: Immersive audio experience with game-specific tracks
- **Sound Effects**: Rich audio feedback for all game actions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Social Features
- **Leaderboards**: Compete with players worldwide
- **User Profiles**: Customizable profiles with stats and achievements
- **Game History**: Track your performance over time
- **Real-time Updates**: Live updates for multiplayer games

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)
- Solana testnet SOL (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fortuneofweb3/whotGo.git
   cd whotGo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   
   # Honeycomb Protocol Configuration
   VITE_HONEYCOMB_API_URL=https://edge.test.honeycombprotocol.com/
   VITE_HONEYCOMB_PROJECT_ADDRESS=your_project_address_here
   VITE_HONEYCOMB_NETWORK=honeynet
   
   # Fee Payer Wallet Configuration (for transaction fees)
   VITE_FEE_PAYER_PUBLIC_KEY=HhEQWQdVL9wagu3tHj6vSBAR4YB9UtkuQkiHZ3cLMU1y
   VITE_FEE_PAYER_PRIVATE_KEY=Dr2kjAFqGTBANf2nn4EauNQrdeFdL4sN5ib5VjQp729A2RbLw2ogJud4ApMXsgWRAoCSMewbJVEajVFdwWyNByu
   
   # Solana RPC Configuration
   VITE_SOLANA_RPC_URL=https://rpc.test.honeycombprotocol.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001` to start playing!

## 🎯 How to Play

### Getting Started
1. **Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **Create Profile**: Set up your on-chain profile (automatic SOL airdrop for testing)
3. **Choose Game Mode**: Select AI opponent or multiplayer
4. **Start Playing**: Enjoy the classic Whot card game!

### Game Rules
- **Objective**: Be the first to play all your cards
- **Special Cards**: 
  - **Whot (Joker)**: Can be played on any card
  - **2**: Forces the next player to pick 2 cards
  - **1**: Changes the suit
- **Winning**: Play all your cards to win the round

### Earning XP & Achievements
- **Win Games**: Earn XP for each victory
- **Perfect Wins**: Bonus XP for winning without losing any cards
- **Win Streaks**: Maintain winning streaks for bonus rewards
- **Achievements**: Unlock badges for various accomplishments

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library

### Blockchain
- **Solana**: High-performance blockchain platform
- **@solana/web3.js**: Solana JavaScript API
- **@solana/wallet-adapter**: Wallet integration
- **Honeycomb Protocol**: On-chain user profiles and achievements

### Backend & Data
- **Firebase**: Real-time database, authentication, and hosting
- **Firebase Realtime Database**: Game state and user data
- **Firebase Functions**: Serverless backend functions

### Audio & Animation
- **Lottie React**: Smooth animations for confetti and effects
- **Custom Audio System**: Background music and sound effects

## 📁 Project Structure

```
whotgo/
├── src/
│   ├── components/          # React components
│   │   ├── Game.jsx        # Main game component
│   │   ├── popups/         # Modal popups
│   │   └── WalletProvider.jsx
│   ├── utils/              # Utility functions
│   │   ├── profile.js      # Honeycomb profile management
│   │   ├── soundEffects.js # Audio system
│   │   └── honeycombBadges.js
│   ├── firebase.js         # Firebase configuration
│   └── App.jsx            # Main application component
├── public/                 # Static assets
│   ├── sounds/            # Audio files
│   └── animations/        # Lottie animations
├── functions/             # Firebase functions
└── docs/                  # Documentation
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Realtime Database
3. Set up authentication (optional)
4. Add your Firebase config to environment variables

### Honeycomb Protocol
- Uses Honeycomb's testnet for development
- Automatic SOL airdrop for testing
- On-chain profile creation and management

### Solana Configuration
- Testnet for development
- Mainnet for production
- Automatic wallet detection and connection

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
npm run build
vercel --prod
```

**Important**: When deploying to Vercel, you need to add the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Honeycomb Protocol Configuration
VITE_HONEYCOMB_API_URL=https://edge.test.honeycombprotocol.com/
VITE_HONEYCOMB_PROJECT_ADDRESS=your_project_address_here
VITE_HONEYCOMB_NETWORK=honeynet

# Fee Payer Wallet Configuration (for transaction fees)
VITE_FEE_PAYER_PUBLIC_KEY=HhEQWQdVL9wagu3tHj6vSBAR4YB9UtkuQkiHZ3cLMU1y
VITE_FEE_PAYER_PRIVATE_KEY=Dr2kjAFqGTBANf2nn4EauNQrdeFdL4sN5ib5VjQp729A2RbLw2ogJud4ApMXsgWRAoCSMewbJVEajVFdwWyNByu

# Solana RPC Configuration
VITE_SOLANA_RPC_URL=https://rpc.test.honeycombprotocol.com
```

**Security Note**: The fee payer private key should be kept secure and only used for development/testing. For production, consider using a more secure key management solution.

### Netlify
```bash
npm run build
# Deploy the dist folder
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Honeycomb Protocol**: For blockchain integration and user profiles
- **Solana Foundation**: For the Solana blockchain platform
- **Firebase**: For backend services and hosting
- **React Community**: For the amazing React ecosystem

## 📞 Support

- **Discord**: Join our community [Discord Server](https://discord.gg/whotgo)
- **Email**: support@whotgo.com
- **Issues**: Report bugs on [GitHub Issues](https://github.com/fortuneofweb3/whotGo/issues)

## 🎉 Roadmap

- [ ] Mobile app (React Native)
- [ ] Tournament system
- [ ] NFT card collections
- [ ] Cross-chain support
- [ ] Advanced AI opponents
- [ ] Social features (friends, chat)

---

**Made with ❤️ by the Whot Go! Team**

*Experience the future of card gaming on the blockchain!*
