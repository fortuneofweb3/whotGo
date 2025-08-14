import React from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { clusterApiUrl } from '@solana/web3.js';
import App from '../App';

const WalletProviderComponent = () => {
  // Configure Honeycomb RPC endpoint for Honeynet (test network)
  const endpoint = "https://rpc.test.honeycombprotocol.com"; // Using Honeycomb's Honeynet RPC
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: 'testnet' }), // Explicitly set to testnet for Honeynet
    new CoinbaseWalletAdapter()
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProviderComponent;