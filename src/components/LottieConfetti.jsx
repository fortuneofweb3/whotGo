import React, { useRef, useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const LottieConfetti = ({ isActive, onComplete }) => {
  const lottieRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isActive && !isPlaying) {
      setIsPlaying(true);
      
      // Start the animation
      if (lottieRef.current) {
        lottieRef.current.play();
        
        // Set duration and timing
        const duration = 4000; // 4 seconds total
        const fadeOutStart = 3000; // Start fade out at 3 seconds
        
        // Fade out effect
        setTimeout(() => {
          if (lottieRef.current) {
            const animation = lottieRef.current;
            let opacity = 1;
            const fadeInterval = setInterval(() => {
              opacity -= 0.05;
              if (opacity <= 0) {
                opacity = 0;
                clearInterval(fadeInterval);
                setIsPlaying(false);
                if (onComplete) onComplete();
              }
              // Apply opacity to the animation container
              if (animation.container) {
                animation.container.style.opacity = opacity;
              }
            }, 50); // Fade out over 1 second
          }
        }, fadeOutStart);
        
        // Complete callback
        setTimeout(() => {
          setIsPlaying(false);
          if (onComplete) onComplete();
        }, duration);
      }
    }
  }, [isActive, isPlaying, onComplete]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[110] flex items-center justify-center"
      style={{ 
        background: 'transparent',
        width: '100vw',
        height: '100vh'
      }}
    >
      <Lottie
        ref={lottieRef}
        src="/assets/Confetti Celebration.lottie"
        loop={false}
        autoplay={false}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        onComplete={() => {
          setIsPlaying(false);
          if (onComplete) onComplete();
        }}
      />
    </div>
  );
};

export default LottieConfetti;
