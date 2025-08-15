// Mobile-optimized Sound Effects Manager using Web Audio API
class SoundEffectsManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.49;
    this.gameMusicVolume = 0.3;
    this.isInitialized = false;
    this.isPreloaded = false;
    this.playPitchVariations = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    
    // Audio buffers for instant playback
    this.audioBuffers = new Map();
    
    // Music tracks
    this.backgroundMusicSource = null;
    this.gameMusicSource = null;
    this.currentMusicSource = null;
    
    // Sound file paths
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

    // Priority sounds for mobile
    this.prioritySounds = ['click', 'play', 'market'];
  }

  // Initialize Web Audio API context for mobile
  async initAudioContext() {
    try {
      // Create audio context with mobile-compatible options
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100
      });
      
      // Resume context if suspended (mobile browsers often suspend)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('🎵 Audio context initialized:', this.audioContext.state);
      return true;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      return false;
    }
  }

  // Load audio file as buffer for instant playback
  async loadAudioBuffer(soundName) {
    if (this.audioBuffers.has(soundName)) return;

    const path = this.soundFiles[soundName];
    if (!path) {
      console.warn(`Unknown sound: ${soundName}`);
      return;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.audioBuffers.set(soundName, audioBuffer);
      console.log(`🎵 Buffer loaded: ${soundName}`);
    } catch (error) {
      console.warn(`Failed to load audio buffer: ${soundName}`, error);
    }
  }

  // Enhanced preloading with mobile optimization
  async preloadAllSounds() {
    if (this.isPreloaded) return;
    
    console.log('🎵 Loading audio buffers for mobile...');
    
    // Ensure audio context is ready
    if (!this.audioContext) {
      const success = await this.initAudioContext();
      if (!success) {
        console.warn('Failed to initialize audio context, sounds may not work');
        this.isPreloaded = true;
        return;
      }
    }
    
    // Load priority sounds first
    const priorityPromises = this.prioritySounds.map(soundName => 
      this.loadAudioBuffer(soundName)
    );
    
    try {
      await Promise.allSettled(priorityPromises);
      console.log('🎵 Priority buffers loaded');
    } catch (error) {
      console.warn('Failed to load priority buffers:', error);
    }
    
    // Load all other sounds
    const allPromises = Object.keys(this.soundFiles).map(soundName => 
      this.loadAudioBuffer(soundName)
    );
    
    try {
      await Promise.allSettled(allPromises);
      this.isPreloaded = true;
      console.log('🎵 All audio buffers loaded successfully');
    } catch (error) {
      console.warn('Failed to load some buffers:', error);
      this.isPreloaded = true;
    }
  }

  // Play sound using Web Audio API for instant playback
  play(soundName, options = {}) {
    if (!this.isEnabled || !this.audioContext) return;

    const audioBuffer = this.audioBuffers.get(soundName);
    if (!audioBuffer) {
      console.warn(`Audio buffer not loaded: ${soundName}`);
      return;
    }

    try {
      // Create audio source
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      // Connect nodes
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set volume
      const volume = options.volume || this.volume;
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      
      // Apply pitch variation if specified
      if (options.pitch) {
        source.playbackRate.setValueAtTime(options.pitch, this.audioContext.currentTime);
      }
      
      // Play immediately
      source.start(0);
      
      console.log(`🎵 Playing: ${soundName}`);
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error);
    }
  }

  // Initialize sounds after user interaction (mobile requirement)
  async initializeAfterUserInteraction() {
    if (this.isInitialized) return;
    
    try {
      console.log('🎵 Initializing mobile sound system...');
      
      // Initialize audio context
      const success = await this.initAudioContext();
      if (!success) {
        throw new Error('Failed to initialize audio context');
      }
      
      // Load all audio buffers
      await this.preloadAllSounds();
      
      this.isInitialized = true;
      console.log('🎵 Mobile sound system initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize sound system:', error);
      this.isInitialized = true; // Mark as initialized anyway
    }
  }

  // Preload music files specifically
  async preloadMusic() {
    console.log('🎵 Preloading music buffers...');
    
    const musicFiles = ['background', 'gameMusic'];
    const musicPromises = musicFiles.map(soundName => 
      this.loadAudioBuffer(soundName)
    );
    
    try {
      await Promise.allSettled(musicPromises);
      console.log('🎵 Music buffers preloaded');
    } catch (error) {
      console.warn('Failed to preload music buffers:', error);
    }
  }

  // Game-specific sound methods
  playCardPlay() {
    const randomPitch = this.playPitchVariations[Math.floor(Math.random() * this.playPitchVariations.length)];
    this.play('play', { pitch: randomPitch, volume: 0.8 });
  }

  playMarketDraw() {
    this.play('market', { volume: 0.7 });
  }

  playSpecialCard() {
    this.play('special', { volume: 0.8 });
  }

  playShuffle() {
    this.play('shuffle', { volume: 0.6 });
  }

  playClick() {
    this.play('click', { volume: 1.0 });
  }

  playBack() {
    this.play('back', { volume: 1.0 });
  }

  playEnd() {
    this.play('end', { volume: 0.7 });
  }

  // Music methods using Web Audio API
  startGameMusic() {
    this.stopAllMusic();
    
    const audioBuffer = this.audioBuffers.get('gameMusic');
    if (!audioBuffer) {
      console.warn('Game music buffer not loaded');
      return;
    }

    try {
      this.gameMusicSource = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      this.gameMusicSource.buffer = audioBuffer;
      this.gameMusicSource.loop = true;
      this.gameMusicSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      gainNode.gain.setValueAtTime(this.gameMusicVolume, this.audioContext.currentTime);
      
      this.gameMusicSource.start(0);
      this.currentMusicSource = this.gameMusicSource;
      
      console.log('🎵 Game music started');
    } catch (error) {
      console.warn('Failed to start game music:', error);
    }
  }

  stopGameMusic() {
    if (this.gameMusicSource) {
      try {
        this.gameMusicSource.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.gameMusicSource = null;
      if (this.currentMusicSource === this.gameMusicSource) {
        this.currentMusicSource = null;
      }
    }
  }

  startBackgroundMusic() {
    this.stopAllMusic();
    
    const audioBuffer = this.audioBuffers.get('background');
    if (!audioBuffer) {
      console.warn('Background music buffer not loaded');
      return;
    }

    try {
      this.backgroundMusicSource = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      this.backgroundMusicSource.buffer = audioBuffer;
      this.backgroundMusicSource.loop = true;
      this.backgroundMusicSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      gainNode.gain.setValueAtTime(this.gameMusicVolume * 0.7, this.audioContext.currentTime);
      
      this.backgroundMusicSource.start(0);
      this.currentMusicSource = this.backgroundMusicSource;
      
      console.log('🎵 Background music started');
    } catch (error) {
      console.warn('Failed to start background music:', error);
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusicSource) {
      try {
        this.backgroundMusicSource.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.backgroundMusicSource = null;
      if (this.currentMusicSource === this.backgroundMusicSource) {
        this.currentMusicSource = null;
      }
    }
  }

  stopAllMusic() {
    this.stopGameMusic();
    this.stopBackgroundMusic();
  }

  // Utility methods
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
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

  // Performance monitoring
  getSoundStats() {
    return {
      isInitialized: this.isInitialized,
      isPreloaded: this.isPreloaded,
      audioContextState: this.audioContext?.state || 'not_initialized',
      loadedBuffers: this.audioBuffers.size,
      totalSounds: Object.keys(this.soundFiles).length,
      gameMusicPlaying: !!this.gameMusicSource,
      backgroundMusicPlaying: !!this.backgroundMusicSource
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
  click: () => soundEffects.playClick(),
  back: () => soundEffects.playBack(),
  end: () => soundEffects.playEnd()
};

export default soundEffects;
