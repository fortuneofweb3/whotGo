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

## Badge System

### Badge Criteria (Indices 0-7)

| Index | Badge Name | Description | Transaction Signature |
|-------|------------|-------------|----------------------|
| 0 | First Victory | Win your first game | `27P8tNMzYGBaLqLLzVj94iShtFVkUQe6MRrEyg3sGY2ad78uCcsmN1rUwtwzEj7Rdh8HL1Zn4SyGSY1iz1UtU7sL` |
| 1 | Card Master | Master all card types | `5QnTvZ5otF3eXJSAYfmFAqvT6LsCfyiEmLmXb14MN8BVWXZL9S991831ziYTiGGWGtuyZ1JPWDsswRXbm7ove1HJ` |
| 2 | Shadow Warrior | Win a game without losing a life | `4K5qP3hLHJ9zpFxHcge4NtPj5L1nuAkdxJM6sZb9x4M61xdn9tuCehHEzuNgSncsxbXCFohCW6XbNSRwA4eWUFxm` |
| 3 | Strategic Mind | Win 10 games with strategic plays | `5bb67fYv8hyWe5w23bUqEMacwXEvPrE816EzjYwG2DsJkdsvJ8oPfcBRTNSCUXcx3nuBqordg6LhQWf7aoTyB74o` |
| 4 | Century Club | Play 100 games | `2ugeYYq4BYbwGtW7z7LNL7vJ62mzzWbjcFcm614kU54vsHEX49FMzgm1hMokauqyNmt1LMf2o6ZUFrLCT2jYQf8D` |
| 5 | Ultimate Champion | Win 50 games | `5QozmC6kMYqshdCECSgFFq2qTB2xAEoRGQWZcdREapRVq4e9bKA4RSb6t4B8v8taWywt8F1w2YBkMNAgJct9HLdT` |
| 6 | Legendary Player | Reach level 50 | `rzkJKEQvgTZBLvLchyfMackkSEmSa9U7dN8Leu7JgjBD19wmhcVjYeVmoa8dhf5gRf9a8vnbyTcM6tqxuHW5x2b` |
| 7 | Whot Grandmaster | Achieve all other badges | `2vwPwXSFzPhwWGP2RGZe4hmML3zu55TVJYTmVKFY5DhGbFmVkfxLmEK18y777yDPadj78zRg9pSoG69njdAFAKRg` |

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

#### 2. `src/utils/honeycombBadges.js`
Badge management system including:
- **Badge condition definitions**
- **Progress tracking**
- **Achievement checking**
- **Statistics updates**

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

#### Badge System
```javascript
// Claim a badge
await claimBadge({ publicKey, wallet, badgeIndex });

// Check badge earned status
const earned = await checkBadgeEarned(publicKey, badgeIndex);

// Get all badges with progress
const badges = await getAllBadges(publicKey);

// Update game stats and check badges
const result = await updateGameStats({ 
  publicKey, 
  wallet, 
  gameResult, 
  gameStats 
});
```

### Game Integration

The Honeycomb system is integrated into the game flow:

1. **User Initialization**: Automatic profile creation/login on wallet connection
2. **Game End**: Automatically checks for new badges
3. **Statistics Update**: Updates on-chain profile data
4. **Badge Notification**: Shows real-time achievement notifications
5. **Progress Tracking**: Monitors badge progress in real-time
6. **Profile Management**: Users can edit their profile info

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

### Checking Badges
```javascript
import { getAllBadges } from './utils/honeycombBadges';

const badges = await getAllBadges(publicKey);
badges.forEach(badge => {
  console.log(`${badge.name}: ${badge.earned ? 'Earned' : 'Locked'}`);
});
```

### Updating Game Statistics
```javascript
import { updateGameStats } from './utils/honeycombBadges';

const result = await updateGameStats({
  publicKey,
  wallet,
  gameResult: 'win',
  gameStats: {
    xp: 150,
    cardsPlayed: 25,
    perfectWin: true
  }
});

if (result.newlyEarnedBadges.length > 0) {
  console.log('New badges earned:', result.newlyEarnedBadges);
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

## Future Enhancements

1. **Additional Badge Types**: More complex achievement conditions
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
