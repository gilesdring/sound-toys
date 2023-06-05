import { SimpleAudioNode } from "../util/simple-audio-node.ts";

interface CrossFaderOptions {
  time: number;
}

interface CrossFadable {
  source: SimpleAudioNode;
  fader: GainNode;
}

export class CrossFader {
  private time: number;
  readonly context: AudioContext;
  private current?: CrossFadable;
  private previous?: CrossFadable;
  private bus: GainNode;

  constructor(context: AudioContext, options: CrossFaderOptions) {
    this.context = context;
    this.time = options?.time || 1;
    this.bus = context.createGain();
    this.bus.gain.setValueAtTime(1, 0);
  }

  get active() {
    return this.previous !== undefined;
  }

  set source(source: SimpleAudioNode) {
    if (this.active) return;
    if (this.current) {
      this.previous = this.current;
      this.previous.fader.gain.setValueAtTime(this.previous.fader.gain.value, this.context.currentTime);
      this.previous.fader.gain.linearRampToValueAtTime(0, this.context.currentTime + this.time);
      setTimeout(() => {
        if (this.previous) {
          this.previous?.source.stop();
          this.previous?.source.disconnect();
          delete this.previous;
        }
      }, this.time * 1000);
    }
    this.current = {
      source,
      fader: this.context.createGain(),
    };
    this.current.source.connect(this.current.fader);
    this.current.fader.gain.setValueAtTime(0, this.context.currentTime);
    this.current.fader.gain.linearRampToValueAtTime(1, this.context.currentTime + this.time);
    this.current.fader.connect(this.bus);
    this.current.source.start();
  }

  connect(destinationNode: AudioNode) {
    return this.bus.connect(destinationNode);
  }

  fadeOut() {
    this.current?.fader.gain.setValueAtTime(this.current.fader.gain.value, this.context.currentTime);
    this.current?.fader.gain.linearRampToValueAtTime(0, this.context.currentTime + this.time);
  }
}