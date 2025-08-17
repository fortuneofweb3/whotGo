# Badge Creation Script

This script creates badge criteria on-chain for the Whot Go! project using the Honeycomb Protocol.

## Prerequisites

1. **Project Authority Private Key**: You need the private key of the wallet that has authority over the project
2. **Node.js**: Make sure you have Node.js installed
3. **Dependencies**: All required dependencies should be installed

## How to Run

### Method 1: Using npm script (Recommended)

```bash
# Set your private key as an environment variable
export HONEYCOMB_PRIVATE_KEY="your_private_key_here"

# Run the badge creation script
npm run create-badges
```

### Method 2: Direct node command

```bash
# Run with private key as command line argument
node scripts/createBadges.js "your_private_key_here"
```

### Method 3: Using environment variable

```bash
# Set environment variable
export HONEYCOMB_PRIVATE_KEY="your_private_key_here"

# Run the script
node scripts/createBadges.js
```

## What the Script Does

1. **Initializes Honeycomb Client**: Creates a client with your private key for server-side operations
2. **Creates Badge Criteria**: Creates all 8 badge criteria on-chain:
   - First Victory (index 0)
   - Card Master (index 1)
   - Shadow Warrior (index 2)
   - Strategic Mind (index 3)
   - Century Club (index 4)
   - Ultimate Champion (index 5)
   - Legendary Player (index 6)
   - Whot Grandmaster (index 7)
3. **Provides Results**: Shows which badges were created successfully and which failed

## Security Notes

⚠️ **Important**: Never commit your private key to version control!

- Use environment variables for private keys
- Keep your private key secure
- Only run this script on a secure machine
- The private key should be for the project authority wallet

## Expected Output

```
🏗️ Starting badge creation process...
🔍 Project details: { projectAddress: 'FJ96yFfdiKfmmHTqxpKuYnaroLMWHNCYxjNFmvn8Ut7c', rpcUrl: 'https://rpc.test.honeycombprotocol.com' }
✅ Honeycomb client initialized for server-side operations
🚀 Starting badge criteria creation for all badges...
🏗️ Creating badge criteria for badge 0: First Victory
✅ Badge criteria transaction created for First Victory
🏗️ Creating badge criteria for badge 1: Card Master
✅ Badge criteria transaction created for Card Master
...

📊 Final Results:
✅ Successfully created: 8 badges
❌ Failed to create: 0 badges

✅ Created badges:
  - First Victory (index: 0)
  - Card Master (index: 1)
  - Shadow Warrior (index: 2)
  - Strategic Mind (index: 3)
  - Century Club (index: 4)
  - Ultimate Champion (index: 5)
  - Legendary Player (index: 6)
  - Whot Grandmaster (index: 7)

🎉 Badge creation process completed!
```

## After Creating Badges

Once the badges are created, you can test them in the browser:

1. **Test the badge system**:
   ```javascript
   testBadgeSystem()
   ```

2. **Test badge claiming**:
   ```javascript
   testBadgeClaiming()
   ```

## Troubleshooting

- **"Private key is required"**: Make sure you're providing the private key
- **"Failed to create badge criteria"**: Check if you have project authority permissions
- **"Transaction failed"**: Ensure you have enough SOL for transaction fees
