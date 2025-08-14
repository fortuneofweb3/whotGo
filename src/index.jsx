import React from 'react';
import ReactDOM from 'react-dom/client';
import WalletProviderComponent from './components/WalletProvider';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Buffer } from 'buffer';
import ErrorBoundary from './components/ErrorBoundary';

// Polyfill for Buffer in browser environment
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
  window.process = { env: {} };
  
  // Additional polyfills for crypto libraries
  if (!window.crypto) {
    window.crypto = window.msCrypto || {};
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <WalletProviderComponent />
  </ErrorBoundary>
);