import { SimpleAudioNode } from "../util/simple-audio-node.ts";

export class WaveOscillatorNode implements SimpleAudioNode {
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
    return this.wave.connect(destinationNode);
  }
  disconnect() {
    return this.wave.disconnect();
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
        return this.wave.start();
      } catch {
        console.warn('Already started');
      }
    }
  }
  stop() {
    if (this.wave) {
      try {
        return this.wave.stop();
      } catch {
        console.warn('Unable to stop');
      }
    }
  }
}