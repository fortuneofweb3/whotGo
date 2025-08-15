// Optimized Sound Effects Manager with lazy loading and performance improvements
class SoundEffectsManager {
  constructor() {
    this.sounds = new Map();
    this.isEnabled = true;
    this.volume = 0.49;
    this.isInitialized = false;
    this.isPreloaded = false;
    this.gameMusicVolume = 0.3;
    this.fadeInterval = null;
    this.audioContext = null;
    this.playPitchVariations = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    
    // Sound file paths - using relative paths for better compatibility
    this.soundFiles = {
      play: './assets/sounds/effects/Play.wav',
      market: './assets/sounds/effects/Market.wav',
      shuffle: './assets/sounds/effects/Shuffle.wav',
      special: './assets/sounds/effects/Special.wav',
      background: './assets/sounds/effects/Main.mp3',
      gameMusic: './assets/sounds/effects/Game.mp3',
      click: './assets/sounds/effects/Click.mp3',
      back: './assets/sounds/effects/Back.mp3',
      end: './assets/sounds/effects/End.mp3'
    };

    // Priority sounds that should be loaded first
    this.prioritySounds = ['click', 'play', 'market'];
    
    // Initialize audio context lazily
    this.initAudioContext();
  }

  // Initialize Web Audio API context for better performance
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to HTML5 Audio');
      this.audioContext = null;
    }
  }

  // Preload priority sounds immediately
  async preloadPrioritySounds() {
    if (this.isPreloaded) return;
    
    const loadPromises = this.prioritySounds.map(soundName => 
      this.loadSound(soundName, true)
    );
    
    try {
      await Promise.allSettled(loadPromises);
      console.log('Priority sounds preloaded');
    } catch (error) {
      console.warn('Failed to preload some priority sounds:', error);
    }
  }

  // Load all sounds when user starts playing
  async preloadAllSounds() {
    if (this.isPreloaded) return;
    
    console.log('Preloading all sounds...');
    const loadPromises = Object.keys(this.soundFiles).map(soundName => 
      this.loadSound(soundName, false)
    );
    
    try {
      await Promise.allSettled(loadPromises);
      this.isPreloaded = true;
      console.log('All sounds preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload some sounds:', error);
      this.isPreloaded = true; // Mark as preloaded anyway
    }
  }

  // Load individual sound with error handling
  async loadSound(soundName, isPriority = false) {
    if (this.sounds.has(soundName)) return;

    const path = this.soundFiles[soundName];
    if (!path) {
      console.warn(`Unknown sound: ${soundName}`);
      return;
    }

    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        audio.preload = isPriority ? 'auto' : 'metadata';
        audio.volume = this.volume;
        
        // Set up event listeners
        const onLoad = () => {
          this.sounds.set(soundName, audio);
          resolve();
        };
        
        const onError = (error) => {
          console.warn(`Failed to load sound: ${soundName}`, error);
          resolve(); // Resolve anyway to not block other sounds
        };
        
        audio.addEventListener('canplaythrough', onLoad, { once: true });
        audio.addEventListener('error', onError, { once: true });
        
        // Start loading
        audio.src = path;
        
        // Timeout for loading
        setTimeout(() => {
          if (!this.sounds.has(soundName)) {
            console.warn(`Sound loading timeout: ${soundName}`);
            resolve();
          }
        }, 5000);
        
      } catch (error) {
        console.warn(`Failed to create audio for: ${soundName}`, error);
        resolve();
      }
    });
  }

  // Optimized play method with better error handling
  play(soundName, options = {}) {
    if (!this.isEnabled) return;

    const audio = this.sounds.get(soundName);
    if (!audio) {
      // Try to load the sound on demand for non-priority sounds
      if (!this.prioritySounds.includes(soundName)) {
        this.loadSound(soundName).then(() => {
          this.play(soundName, options);
        });
      }
      return;
    }

    try {
      // Reset audio state
      audio.currentTime = 0;
      audio.volume = options.volume || this.volume;
      
      // Apply pitch variation if specified
      if (options.pitch) {
        audio.playbackRate = options.pitch;
      } else {
        audio.playbackRate = 1.0;
      }
      
      // Play the sound
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound: ${soundName}`, error);
          // Try to reinitialize audio context if suspended
          if (error.name === 'NotAllowedError' && this.audioContext) {
            this.audioContext.resume().then(() => {
              this.play(soundName, options);
            });
          }
        });
      }
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }

  // Initialize sounds after user interaction
  async initializeAfterUserInteraction() {
    if (this.isInitialized) return;
    
    try {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Preload priority sounds
      await this.preloadPrioritySounds();
      
      this.isInitialized = true;
      console.log('Sound system initialized');
    } catch (error) {
      console.warn('Failed to initialize sound system:', error);
      this.isInitialized = true; // Mark as initialized anyway
    }
  }

  // Game-specific sound methods
  playCardPlay() {
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
    this.play('click', { volume: 1.0 });
  }

  playBack() {
    this.play('back', { volume: 1.0 });
  }

  playEnd() {
    const endAudio = this.sounds.get('end');
    if (!endAudio) return;
    
    endAudio.currentTime = 0;
    endAudio.volume = 0.7;
    
    endAudio.play().catch(error => {
      console.warn('Failed to play end sound:', error);
    });
    
    // Fade out effect
    setTimeout(() => {
      if (endAudio && !endAudio.paused) {
        this.fadeOutAudio(endAudio, 3000);
      }
    }, 1000);
  }

  // Optimized fade out method
  fadeOutAudio(audio, duration) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = audio.volume;
    const fadeSteps = 30;
    const volumeStep = startVolume / fadeSteps;
    const stepInterval = duration / fadeSteps;
    
    this.fadeInterval = setInterval(() => {
      if (audio && !audio.paused) {
        audio.volume = Math.max(0, audio.volume - volumeStep);
        if (audio.volume <= 0) {
          audio.pause();
          audio.currentTime = 0;
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      } else {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepInterval);
  }

  // Game Music Methods
  startGameMusic() {
    const gameAudio = this.sounds.get('gameMusic');
    if (!gameAudio) {
      console.warn('Game music not loaded');
      return;
    }

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    gameAudio.volume = 0;
    gameAudio.loop = true;
    
    gameAudio.play().then(() => {
      this.fadeInAudio(gameAudio, this.gameMusicVolume, 2000);
    }).catch(error => {
      console.warn('Failed to start game music:', error);
    });
  }

  stopGameMusic() {
    const gameAudio = this.sounds.get('gameMusic');
    if (!gameAudio) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    this.fadeOutAudio(gameAudio, 1000);
  }

  // Optimized fade in method
  fadeInAudio(audio, targetVolume, duration) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    let volume = 0;
    const fadeSteps = 40;
    const volumeStep = targetVolume / fadeSteps;
    const stepInterval = duration / fadeSteps;
    
    this.fadeInterval = setInterval(() => {
      volume += volumeStep;
      volume = Math.min(targetVolume, volume);
      audio.volume = volume;
      
      if (volume >= targetVolume) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepInterval);
  }

  // Utility methods
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
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

  isGameMusicPlaying() {
    const gameAudio = this.sounds.get('gameMusic');
    return gameAudio && !gameAudio.paused;
  }

  // Performance monitoring
  getSoundStats() {
    return {
      loadedSounds: this.sounds.size,
      isInitialized: this.isInitialized,
      isPreloaded: this.isPreloaded,
      totalSounds: Object.keys(this.soundFiles).length
    };
  }
}

// Create singleton instance
const soundEffects = new SoundEffectsManager();

// Export the playSoundEffect object for compatibility
export const playSoundEffect = {
  normalPlay: () => soundEffects.playCardPlay(),
  specialPlay: () => soundEffects.playSpecialCard(),
  shuffle: () => soundEffects.playShuffle(),
  deal: () => soundEffects.playMarketDraw(),
  market: () => soundEffects.playMarketDraw(),
  background: () => soundEffects.playBackground(),
  click: () => soundEffects.playClick(),
  back: () => soundEffects.playBack(),
  end: () => soundEffects.playEnd()
};

export default soundEffects;
