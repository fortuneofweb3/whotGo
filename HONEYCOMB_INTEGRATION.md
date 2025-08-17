# Honeycomb Protocol Integration for "Whot Go!"

This document outlines the complete integration of the Honeycomb Protocol into the "Whot Go!" card game, enabling on-chain user profiles, achievements, and Web3 functionality.

## Overview

The Honeycomb Protocol integration provides:
- **On-chain user profiles** with custom data fields and profile management
- **Achievement badges** that are permanently recorded on Solana
- **Real-time badge tracking** and progress monitoring
- **Seamless wallet integration** for Web3 functionality
- **Profile login and authentication** system
- **Profile updating and management** capabilities

## Project Configuration

### Network Information
The "Whot Go!" project is deployed on **Honeynet**, a Solana test network provided by Honeycomb Protocol:

- **Network**: Honeynet (Solana test network)
- **RPC Endpoint**: `https://rpc.test.honeycombprotocol.com`
- **API Endpoint**: `https://edge.test.honeycombprotocol.com/`
- **Status**: Active and verified on-chain

### Project Address
```
FJ96yFfdiKfmmHTqxpKuYnaroLMWHNCYxjNFmvn8Ut7c
```
- **Type**: Program-derived address (PDA)
- **Purpose**: Main project identifier for "Whot Go!"
- **Network**: Honeynet test network
- **Created**: Via `create-project-server.js`
- **Transaction**: `21P7JD7oaf9GACAAqq3i9N3pFZLqxrUUiWZvKovs6yoCydebzcJzTFCXkL5ZG1qn4xwxfz8rE32Ryzjie7J6WbyM`

### Profiles Tree Address
```
CcCvQWcjZpkgNAZChq2o2DRT1WonSN2RyBg6F6Wq9M4U
```
- **Type**: Merkle tree for storing user profiles
- **Purpose**: Efficient storage and retrieval of user data
- **Network**: Honeynet test network
- **Created**: Via `create-profiles-tree.js`
- **Transaction**: `4AJXAvacKZhTKmTwx2ahYXsbBcjLFqRdT2od5YU3FmRDnFeGepe1oD5LL6tVZMRJA9nD362HU2MsnxXHfYSg5sVt`

## Profile Management System

### Profile Creation
Following the official Honeycomb documentation, user profiles are created with:
- **Profile Identity**: "main" (primary profile)
- **User Info**: name, bio, profile picture
- **Custom Data Fields**: game statistics and achievements
- **On-chain Storage**: permanently stored on Solana

### Profile Login/Authentication
- **Wallet-based Authentication**: Users authenticate via their Solana wallet
- **Profile Retrieval**: Existing profiles are automatically loaded
- **Fallback System**: Firebase fallback if Honeycomb is unavailable

### Profile Updates
- **Real-time Updates**: Profile data updates in real-time
- **Custom Data Management**: Game statistics and achievements
- **Profile Info Updates**: Username, bio, and profile picture
- **Transaction Signing**: All updates require wallet approval

## Achievement System

### Achievement Definitions

The game features a comprehensive achievement system with automatic unlocking and XP rewards:

| Achievement ID | Name | Description | XP Reward | Unlock Condition |
|----------------|------|-------------|-----------|------------------|
| `first_win` | First Victory | Win your first game | 50 XP | Win 1 game |
| `card_master` | Card Master | Play 100 cards | 100 XP | Play 100 cards total |
| `perfect_win` | Perfect Win | Win without losing any cards | 200 XP | Win with 0 cards lost |
| `streak_master` | Streak Master | Win 5 games in a row | 150 XP | Achieve 5-game win streak |
| `century_club` | Century Club | Play 100 games | 300 XP | Complete 100 games |
| `ultimate_champion` | Ultimate Champion | Win 50 games | 500 XP | Win 50 games total |
| `legendary_player` | Legendary Player | Reach level 25 | 1000 XP | Reach level 25 |
| `whot_grandmaster` | Whot Grandmaster | Unlock all achievements | 2000 XP | Unlock all other achievements |

### XP System
- **Base Game XP**: 10 XP per game played, 25 XP per game won
- **Achievement XP**: Bonus XP for unlocking achievements
- **Level Calculation**: Level = Math.floor(XP / 100) + 1
- **Progress Tracking**: Real-time progress monitoring for all achievements

## Implementation Details

### Core Files

#### 1. `src/utils/profile.js`
Complete Honeycomb profile management including:
- **Client initialization** with real project addresses
- **User profile creation** and management
- **Profile login and authentication**
- **Profile updating and info management**
- **Badge claiming** functionality
- **Profile data updates**

#### 2. `src/utils/achievementService.js`
Achievement management system including:
- **Achievement definitions and conditions**
- **XP calculation and level management**
- **Progress tracking and monitoring**
- **Automatic achievement unlocking**
- **Game statistics integration**

#### 3. `src/components/popups/AchievementPopup.jsx`
Updated achievement display with:
- **Real-time badge loading**
- **Progress visualization**
- **On-chain status indicators**

#### 4. `src/components/popups/ProfilePopup.jsx`
Enhanced profile management with:
- **Profile info editing** (username, bio)
- **Honeycomb integration** for profile updates
- **Real-time profile synchronization**

#### 5. `src/components/BadgeNotification.jsx`
New notification component for:
- **Real-time badge earned notifications**
- **Animated display**
- **Auto-dismiss functionality**

### Key Functions

#### Profile Management
```javascript
// Create new user profile
await createUserProfile({ publicKey, wallet, username });

// Login to existing profile
const loginResult = await loginUserProfile(publicKey);

// Check if profile exists
const exists = await checkUserProfileExists(publicKey);

// Update profile data
await updateUserProfile({ publicKey, wallet, profileData });

// Update profile info (username, bio, pfp)
await updateProfileInfo({ publicKey, wallet, username, bio, pfp });

// Get user profile
const profile = await getUserProfile(publicKey);
```

#### Achievement System
```javascript
// Update user stats and achievements
const result = await updateUserStatsAndAchievements(user, gameData, isWinner);

// Get achievement progress
const progress = getAchievementProgress(achievementId, userData);

// Check if user has achievement
const hasAchievement = user.achievements.includes(achievementId);

// Calculate level from XP
const level = calculateLevel(user.xp);

// Get game XP reward
const xpReward = getGameXPReward(isWinner, roundsPlayed, cardsPlayed);
```

### Game Integration

The Honeycomb system is integrated into the game flow:

1. **User Initialization**: Automatic profile creation/login on wallet connection
2. **Game End**: Automatically calculates XP and checks for new achievements
3. **Statistics Update**: Updates on-chain profile data with XP and achievements
4. **Achievement Notification**: Shows real-time achievement unlock notifications
5. **Progress Tracking**: Monitors achievement progress in real-time
6. **Profile Management**: Users can edit their profile info
7. **Data Synchronization**: XP and achievements flow from Honeycomb to Firebase

## Configuration

### Environment Variables
```env
# Honeycomb API endpoints (Honeynet test network)
HONEYCOMB_API_URL="https://edge.test.honeycombprotocol.com/"
HONEYCOMB_RPC_URL="https://rpc.test.honeycombprotocol.com/"

# Project addresses (created on Honeynet)
HONEYCOMB_PROJECT_ADDRESS="FJ96yFfdiKfmmHTqxpKuYnaroLMWHNCYxjNFmvn8Ut7c"
HONEYCOMB_PROFILES_TREE_ADDRESS="CcCvQWcjZpkgNAZChq2o2DRT1WonSN2RyBg6F6Wq9M4U"
```

### Network Configuration
The "Whot Go!" project is deployed on **Honeynet**, which is a Solana test network provided by Honeycomb Protocol:

- **Network**: Honeynet (Solana test network)
- **RPC Endpoint**: `https://rpc.test.honeycombprotocol.com`
- **API Endpoint**: `https://edge.test.honeycombprotocol.com/`
- **Purpose**: All blockchain interactions, project creation, and badge management

### Dependencies
```json
{
  "@honeycomb-protocol/edge-client": "0.0.7-beta.15",
  "@solana/web3.js": "^1.95.3",
  "@solana/wallet-adapter-react": "^0.15.35"
}
```

## Usage Examples

### Creating a New User Profile
```javascript
import { createUserProfile } from './utils/profile';

const newUser = await createUserProfile({
  publicKey: wallet.publicKey,
  wallet: wallet,
  username: "Player123"
});
```

### Logging In to Existing Profile
```javascript
import { loginUserProfile } from './utils/profile';

const loginResult = await loginUserProfile(publicKey);
if (loginResult.exists) {
  console.log('Profile loaded:', loginResult.profile);
} else {
  console.log('No profile found, create new one');
}
```

### Updating Profile Information
```javascript
import { updateProfileInfo } from './utils/profile';

await updateProfileInfo({
  publicKey,
  wallet,
  username: "NewUsername",
  bio: "Updated bio",
  pfp: "https://example.com/avatar.png"
});
```

### Checking Achievements
```javascript
import { ACHIEVEMENT_DEFINITIONS, getAchievementProgress } from './utils/achievementService';

ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
  const progress = getAchievementProgress(achievement.id, userData);
  console.log(`${achievement.name}: ${progress.current}/${progress.target}`);
});
```

### Updating Game Statistics and Achievements
```javascript
import { updateUserStatsAndAchievements } from './utils/achievementService';

const gameData = {
  roundsPlayed: 5,
  totalCardsPlayed: 25
};

const result = await updateUserStatsAndAchievements(user, gameData, true);

if (result.newlyUnlockedAchievements.length > 0) {
  console.log('New achievements unlocked:', result.newlyUnlockedAchievements);
  console.log('Total XP earned:', result.xpEarned);
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **Network Failures**: Graceful fallback to mock implementation
2. **Wallet Disconnection**: Automatic reconnection handling
3. **Transaction Failures**: Retry mechanisms and user feedback
4. **Data Validation**: Input sanitization and validation
5. **Profile Not Found**: Automatic profile creation
6. **Honeycomb Unavailable**: Firebase fallback system

## Security Considerations

1. **Transaction Signing**: All on-chain operations require wallet approval
2. **Data Validation**: Server-side validation of all profile updates
3. **Rate Limiting**: Protection against spam and abuse
4. **Privacy**: User data is stored on-chain with appropriate access controls
5. **Wallet Security**: All operations require user wallet approval

## Testing

### Development Mode
- Uses mock implementation for testing
- Simulates profile creation and badge earning without on-chain transactions
- Provides detailed logging for debugging

### Production Mode
- Full on-chain integration
- Real transaction signing and submission
- Live profile tracking and badge verification

## Data Flow Architecture

### Honeycomb ↔ Firebase Synchronization

The system implements a sophisticated data flow between Honeycomb Protocol and Firebase:

#### **Honeycomb → Firebase (XP & Achievements)**
- **XP Data**: User XP and level calculated from Honeycomb platform data
- **Achievements**: Achievement unlock status and progress from Honeycomb
- **Profile Data**: User profile information and statistics

#### **Firebase → Honeycomb (Game Statistics)**
- **Game Stats**: Games played, games won, win streaks, etc.
- **Custom Data**: Game-specific statistics and metrics
- **User Activity**: Last active timestamps and session data

#### **Game Flow Integration**
1. **Game Completion**: `updateUserStatsAndAchievements()` calculates XP and achievements
2. **Honeycomb Update**: Server-side update to Honeycomb platform data
3. **Firebase Sync**: Updated data flows to Firebase for real-time access
4. **UI Updates**: Achievement popups and progress indicators

### Server-Side Operations

All Honeycomb updates use server-side operations with admin keypair:
- **No Client Authentication**: Uses project authority for all updates
- **Secure Transactions**: All updates signed with admin keypair
- **Automatic Retries**: Built-in retry mechanisms for failed transactions
- **Error Handling**: Comprehensive error handling and fallbacks

## Future Enhancements

1. **Additional Achievement Types**: More complex achievement conditions
2. **Social Features**: Profile sharing and leaderboards
3. **NFT Integration**: Profile NFTs and collectible achievements
4. **Cross-Game Integration**: Profiles that work across multiple games
5. **Profile Verification**: Additional verification mechanisms
6. **Profile Analytics**: Detailed profile statistics and insights

## Support

For technical support or questions about the Honeycomb integration:
- Check the [Honeycomb Protocol documentation](https://docs.honeycombprotocol.com/)
- Review the transaction logs on Solana Explorer
- Monitor the browser console for detailed error messages

## License

This integration follows the same license as the main "Whot Go!" project.
