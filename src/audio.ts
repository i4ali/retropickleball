export class AudioManager {
  public audioContext: AudioContext;
  private musicTrackPaths: string[];
  private audioElements: { [key: number]: HTMLAudioElement } = {};
  private currentTrack: HTMLAudioElement | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.musicTrackPaths = [
      '/audio/track1.mp3',
      '/audio/track2.mp3',
      '/audio/track3.mp3'
    ];
  }

  private createSound(frequency: number, type: OscillatorType, duration: number): () => void {
    return () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  public playPaddleHit(): void {
    this.createSound(440, 'square', 0.1)();
  }

  public playPointScored(): void {
    this.createSound(880, 'sine', 0.2)();
  }

  public playWin(): void {
    // A simple ascending arpeggio
    this.createSound(523, 'sine', 0.1)();
    setTimeout(() => this.createSound(659, 'sine', 0.1)(), 100);
    setTimeout(() => this.createSound(784, 'sine', 0.1)(), 200);
    setTimeout(() => this.createSound(1046, 'sine', 0.2)(), 300);
  }

  public playLose(): void {
    // A simple descending arpeggio
    this.createSound(1046, 'sawtooth', 0.2)();
    setTimeout(() => this.createSound(784, 'sawtooth', 0.1)(), 200);
    setTimeout(() => this.createSound(659, 'sawtooth', 0.1)(), 300);
    setTimeout(() => this.createSound(523, 'sawtooth', 0.4)(), 400);
  }

  public playPowerShot(): void {
    this.createSound(660, 'triangle', 0.15)();
  }

  public setMusic(trackIndex: number): void {
    if (this.currentTrack) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
    }

    if (trackIndex > 0) {
      const pathIndex = trackIndex - 1;
      if (!this.audioElements[pathIndex]) {
        this.audioElements[pathIndex] = new Audio(this.musicTrackPaths[pathIndex]);
        this.audioElements[pathIndex].loop = true;
      }
      this.currentTrack = this.audioElements[pathIndex];
      this.currentTrack.play().catch(e => console.error("Error playing audio:", e));
    } else {
      this.currentTrack = null;
    }
  }
}
