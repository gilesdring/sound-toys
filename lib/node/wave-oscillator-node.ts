export class WaveOscillatorNode {
  readonly context: AudioContext;
  
  private wave: AudioBufferSourceNode

  constructor(context: AudioContext) {
    this.context = context;
    this.wave = this.context.createBufferSource();
    this.setupBufferSource();
  }
  
  private setupBufferSource() {
    this.wave.loop = true;
  }
  
  set buffer(buffer: AudioBuffer | null) {
    this.wave.buffer = buffer;
  }
  get buffer() {
    return this.wave.buffer;
  }
  connect(destinationNode: AudioNode) {
    this.wave.connect(destinationNode);
  }
  set frequency(frequency: number) {
    if (this.wave && this.wave.buffer) {
      this.wave.playbackRate.setValueAtTime(
        frequency * this.wave.buffer.duration,
        this.context.currentTime
      )
    }
  }
  start() {
    if (this.wave && this.wave.buffer) {
      try {
        this.wave.start();
      } catch {
        console.warn('Already started');
      }
    }
  }
}