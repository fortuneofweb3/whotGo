// Sound Effects Manager for Whot Game
class SoundEffectsManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.49; // Reduced by 30% from 0.7 to 0.49
    this.isInitialized = false;
    this.playPitchVariations = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3]; // 6 different pitch variations
    this.gameMusicVolume = 0.3; // Lower volume for game music
    this.fadeInterval = null;
    // Load sounds asynchronously
    this.loadSounds().catch(error => {
      console.warn('Failed to load sounds in constructor:', error);
    });
  }

  async loadSounds() {
    const soundFiles = {
      play: '/assets/sounds/effects/Play.wav',
      market: '/assets/sounds/effects/Market.wav',
      shuffle: '/assets/sounds/effects/Shuffle.wav',
      special: '/assets/sounds/effects/Special.wav',
      background: '/assets/sounds/effects/Main.mp3',
      gameMusic: '/assets/sounds/effects/Game.mp3',
      click: '/assets/sounds/effects/Click.mp3',
      back: '/assets/sounds/effects/Back.mp3',
      end: '/assets/sounds/effects/End.mp3'
    };

    console.log('🎵 Loading sound files...');
    const loadPromises = [];
    
    for (const [name, path] of Object.entries(soundFiles)) {
      const loadPromise = new Promise((resolve) => {
        try {
          const audio = new Audio(path);
          audio.preload = 'auto';
          audio.volume = this.volume;
          
          // Handle successful load
          audio.addEventListener('canplaythrough', () => {
            this.sounds[name] = audio;
            console.log(`🎵 Loaded sound: ${name}`);
            resolve();
          }, { once: true });
          
          // Handle load error
          audio.addEventListener('error', (error) => {
            console.warn(`Failed to load sound: ${name}`, error);
            resolve(); // Resolve anyway to not block other sounds
          }, { once: true });
          
        } catch (error) {
          console.warn(`Failed to create audio for: ${name}`, error);
          resolve(); // Resolve anyway to not block other sounds
        }
      });
      
      loadPromises.push(loadPromise);
    }
    
    // Wait for all sounds to load (or fail gracefully)
    await Promise.all(loadPromises);
    console.log('🎵 Sound loading complete. Loaded sounds:', Object.keys(this.sounds));
  }

  play(soundName, options = {}) {
    console.log(`🎵 Attempting to play sound: ${soundName}, enabled: ${this.isEnabled}, loaded: ${!!this.sounds[soundName]}, initialized: ${this.isInitialized}`);
    if (!this.isEnabled || !this.sounds[soundName]) {
      console.log(`Sound ${soundName} not enabled or not loaded`);
      return;
    }

    // If not initialized yet, try to initialize on first play
    if (!this.isInitialized) {
      console.log(`Sound ${soundName} not initialized yet, attempting to initialize...`);
      this.initializeAfterUserInteraction().then(() => {
        // Retry playing the sound after initialization
        this.play(soundName, options);
      }).catch(error => {
        console.warn(`Failed to initialize sounds for ${soundName}:`, error);
      });
      return;
    }

    try {
      const audio = this.sounds[soundName];
      audio.volume = options.volume || this.volume;
      
      // Reset audio to beginning and ensure it's ready to play
      audio.currentTime = 0;
      
      // Clone the audio to allow overlapping sounds
      const clonedAudio = audio.cloneNode();
      clonedAudio.volume = audio.volume;
      clonedAudio.currentTime = 0;
      
      // Apply pitch variation if specified
      if (options.pitch) {
        clonedAudio.playbackRate = options.pitch;
      }
      
      console.log(`Attempting to play sound: ${soundName}${options.pitch ? ` with pitch ${options.pitch}` : ''}`);
      clonedAudio.play().catch(error => {
        console.warn(`Failed to play cloned sound: ${soundName}`, error);
        // Try to play the original audio as fallback
        audio.play().catch(fallbackError => {
          console.warn(`Fallback also failed for sound: ${soundName}`, fallbackError);
          // Try to reinitialize audio context if it's suspended
          if (fallbackError.name === 'NotAllowedError' || fallbackError.name === 'NotSupportedError') {
            console.log('Audio context may be suspended, attempting to reinitialize...');
            this.isInitialized = false;
            this.initializeAfterUserInteraction().then(() => {
              this.play(soundName, options);
            });
          }
        });
      });
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }

  playDeal() {
    this.play('market'); // Using market.wav instead of deal.wav
  }

  playCardPlay() {
    // Randomly select one of the 5 pitch variations
    const randomPitch = this.playPitchVariations[Math.floor(Math.random() * this.playPitchVariations.length)];
    this.play('play', { pitch: randomPitch });
  }

  playMarketDraw() {
    this.play('market');
  }

  playSpecialCard() {
    this.play('special');
  }

  playShuffle() {
    this.play('shuffle');
  }

  playBackground() {
    this.play('background');
  }

  playClick() {
    this.play('click', { volume: 1.0 }); // Maximum volume for click sounds
  }

  playBack() {
    this.play('back', { volume: 1.0 }); // Maximum volume for back sounds
  }

  playEnd() {
    const endAudio = this.sounds.end;
    if (!endAudio) return;
    
    // Reset and play the end sound
    endAudio.currentTime = 0;
    endAudio.volume = 0.7;
    endAudio.play().catch(error => {
      console.warn('Failed to play end sound:', error);
    });
    
    // Fade out the sound over 3 seconds after it starts playing
    setTimeout(() => {
      if (endAudio && !endAudio.paused) {
        const fadeOutDuration = 3000; // 3 seconds
        const fadeSteps = 60; // 60 steps over 3 seconds
        const volumeStep = endAudio.volume / fadeSteps;
        const stepInterval = fadeOutDuration / fadeSteps;
        
        const fadeInterval = setInterval(() => {
          if (endAudio && !endAudio.paused) {
            endAudio.volume = Math.max(0, endAudio.volume - volumeStep);
            if (endAudio.volume <= 0) {
              endAudio.pause();
              endAudio.currentTime = 0;
              clearInterval(fadeInterval);
            }
          } else {
            clearInterval(fadeInterval);
          }
        }, stepInterval);
      }
    }, 1000); // Start fade out after 1 second
  }

  // Play multiple sounds with delay (for pick 2, etc.)
  playMultiple(soundName, count = 1, delay = 100) {
    if (!this.isEnabled) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.play(soundName);
      }, i * delay);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(audio => {
      audio.volume = this.volume;
    });
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  isSoundEnabled() {
    return this.isEnabled;
  }

  isSoundReady() {
    return this.isEnabled && this.isInitialized;
  }

  // Initialize sounds after user interaction (required by some browsers)
  async initializeAfterUserInteraction() {
    if (this.isInitialized) {
      return; // Already initialized
    }
    
    console.log('Initializing sounds after user interaction...');
    
    try {
      // Preload all audio files to ensure they're downloaded and ready
      const preloadPromises = [];
      
      for (const [name, audio] of Object.entries(this.sounds)) {
        if (audio && name !== 'background') {
          // Set volume to 0 to prevent any sound during preloading
          audio.volume = 0;
          
          // Create a promise that resolves when the audio is loaded
          const preloadPromise = new Promise((resolve) => {
            if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
              resolve();
            } else {
              audio.addEventListener('canplaythrough', () => resolve(), { once: true });
              audio.addEventListener('error', (e) => {
                console.warn(`Failed to preload sound: ${name}`, e);
                resolve(); // Resolve anyway to not block other sounds
              }, { once: true });
            }
          });
          
          preloadPromises.push(preloadPromise);
        }
      }
      
      // Wait for all audio files to be preloaded (or fail gracefully)
      await Promise.all(preloadPromises);
      
      // Restore volumes
      for (const [name, audio] of Object.entries(this.sounds)) {
        if (audio && name !== 'background') {
          audio.volume = this.volume;
        }
      }
      
      this.isInitialized = true;
      console.log('Sounds preloaded successfully (all audio files downloaded and ready)');
    } catch (error) {
      console.warn('Failed to preload some sounds:', error);
      // Still mark as initialized so we can try to play sounds
      this.isInitialized = true;
    }
  }

  // Game Music Methods
  startGameMusic() {
    if (!this.sounds.gameMusic) {
      console.warn('Game music not loaded');
      return;
    }

    const gameAudio = this.sounds.gameMusic;
    
    // Stop any existing fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Set volume to 0 and start playing
    gameAudio.volume = 0;
    gameAudio.loop = true;
    
    gameAudio.play().then(() => {
      console.log('🎵 Game music started, beginning fade in...');
      
      // Fade in the music over 2 seconds
      let volume = 0;
      const targetVolume = this.gameMusicVolume;
      const fadeDuration = 2000; // 2 seconds
      const fadeSteps = 40; // 40 steps over 2 seconds
      const volumeStep = targetVolume / fadeSteps;
      const stepInterval = fadeDuration / fadeSteps;
      
      this.fadeInterval = setInterval(() => {
        volume += volumeStep;
        // Ensure volume doesn't exceed target due to floating-point precision
        volume = Math.min(targetVolume, volume);
        gameAudio.volume = volume;
        
        if (volume >= targetVolume) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          console.log('🎵 Game music fade in complete');
        }
      }, stepInterval);
    }).catch(error => {
      console.warn('Failed to start game music:', error);
    });
  }

  stopGameMusic() {
    if (!this.sounds.gameMusic) {
      return;
    }

    const gameAudio = this.sounds.gameMusic;
    
    // Stop any existing fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Fade out the music over 1 second
    const currentVolume = gameAudio.volume;
    const fadeDuration = 1000; // 1 second
    const fadeSteps = 20; // 20 steps over 1 second
    const volumeStep = currentVolume / fadeSteps;
    const stepInterval = fadeDuration / fadeSteps;
    
    this.fadeInterval = setInterval(() => {
      // Ensure volume doesn't go below 0 due to floating-point precision
      const newVolume = Math.max(0, gameAudio.volume - volumeStep);
      gameAudio.volume = newVolume;
      
      if (newVolume <= 0) {
        gameAudio.volume = 0;
        gameAudio.pause();
        gameAudio.currentTime = 0;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        console.log('🎵 Game music stopped');
      }
    }, stepInterval);
  }

  isGameMusicPlaying() {
    return this.sounds.gameMusic && !this.sounds.gameMusic.paused;
  }
}

// Create a singleton instance
const soundEffects = new SoundEffectsManager();

// Export the playSoundEffect object for compatibility
export const playSoundEffect = {
  normalPlay: () => soundEffects.playCardPlay(),
  specialPlay: () => soundEffects.playSpecialCard(),
  shuffle: () => soundEffects.playShuffle(),
  deal: () => soundEffects.playDeal(),
  market: () => soundEffects.playMarketDraw(),
  background: () => soundEffects.playBackground(),
  click: () => soundEffects.playClick(),
  back: () => soundEffects.playBack(),
  end: () => soundEffects.playEnd()
};

export default soundEffects;
