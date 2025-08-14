import React from 'react';
import { Loader2, CheckCircle, XCircle, Wallet } from 'lucide-react';

const ProfileCreationStatus = ({ isCreating, error, onRetry }) => {
  if (!isCreating && !error) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[200]">
      <div className="bg-[#80142C] rounded-xl p-8 max-w-md mx-4 text-center">
        {isCreating && (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Creating Your Profile
            </h2>
            <p className="text-gray-200 mb-6">
              Please approve the transaction in your wallet to create your on-chain profile.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <Wallet className="w-4 h-4" />
              <span>Check your wallet for transaction approval</span>
            </div>
          </>
        )}

        {error && (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Profile Creation Failed
            </h2>
            <p className="text-gray-200 mb-6">
              {error}
            </p>
            <button
              onClick={onRetry}
              className="bg-white text-[#80142C] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCreationStatus;
