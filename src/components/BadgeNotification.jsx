import React, { useState, useEffect } from 'react';
import { Award, X } from 'lucide-react';

const BadgeNotification = ({ badges, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (badges && badges.length > 0) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [badges, onClose]);

  if (!badges || badges.length === 0) return null;

  const getBadgeIcon = (badgeIndex) => {
    const icons = {
      0: '🏆', // First Victory
      1: '🎯', // Card Master
      2: '⚔️', // Shadow Warrior
      3: '🧠', // Strategic Mind
      4: '💯', // Century Club
      5: '🌟', // Ultimate Champion
      6: '👑', // Legendary Player
      7: '💎'  // Whot Grandmaster
    };
    return icons[badgeIndex] || '🏅';
  };

  return (
    <div className={`fixed top-4 right-4 z-[200] transition-all duration-500 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-gradient-to-r from-[#80142C] to-[#4a0c1a] rounded-xl p-6 shadow-2xl border-2 border-[#FFD700] max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Award className="text-[#FFD700] w-6 h-6" />
            <h3 className="text-white font-bold text-lg">Badge Unlocked!</h3>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 500);
            }}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-3 bg-black bg-opacity-30 rounded-lg p-3">
              <span className="text-2xl">{getBadgeIcon(badge.index)}</span>
              <div className="flex-1">
                <h4 className="text-white font-semibold">{badge.name}</h4>
                <p className="text-gray-300 text-sm">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-[#FFD700] text-sm font-medium">
            🎉 Achievement unlocked! Click "Claim Badge" in the Achievements menu to claim your reward on-chain!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BadgeNotification;
