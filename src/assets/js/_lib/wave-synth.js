import { bufferFactory } from "../../../../lib/util/buffer-factory.ts";
import { audioContext } from "./audio-subsystem.js";
import { WaveOscillatorNode } from "../../../../lib/node/wave-oscillator-node.ts";

export class WaveSynth {
  constructor() {
    this.gainNode = audioContext.createGain();
    this.limiter = audioContext.createDynamicsCompressor();

    this.limiter.threshold.setValueAtTime(-0.5, audioContext.currentTime);
    this.limiter.knee.setValueAtTime(0.0, audioContext.currentTime);
    this.limiter.attack.setValueAtTime(0.001, audioContext.currentTime);
    this.limiter.ratio.setValueAtTime(20.0, audioContext.currentTime);
    this.limiter.release.setValueAtTime(0.1, audioContext.currentTime);

    this.gainNode.connect(this.limiter);
    this.limiter.connect(audioContext.destination);
    
    this.requestedPitch = 110;
    this.fullGain = 0.1;
    this.setGain(this.fullGain);
    this.playing = false;
    addEventListener("bufferUpdated", (e) => {
      if (e.detail.buffer !== this.buffer) return;
      if (this.playing) this.loadWavetable();
    });
  }

  setWavetable(wave) {
    this.buffer = bufferFactory({ samples: wave });

    dispatchEvent(
      new CustomEvent("bufferUpdated", {
        detail: {
          buffer: this.buffer,
        },
      }),
    );
  }
  getAnalyser() {
    const analyser = audioContext.createAnalyser();
    this.gainNode.connect(analyser);
    return analyser;
  }

  getBuffer() {
    return this.buffer;
  }

  loadWavetable() {
    const rampTime = 0.2;

    const createSource = (buffer, rampTime, pitch) => {
      const wave = new WaveOscillatorNode(audioContext);
      const gainNode = audioContext.createGain();
      wave.buffer = buffer;
      wave.frequency = pitch;
      // Connect source to gain.
      wave.connect(gainNode);
      // Connect gain to destination.
      gainNode.connect(this.gainNode);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        1,
        audioContext.currentTime + rampTime,
      );
      wave.start();
      return {
        fadeOut: () => {
          gainNode.gain.linearRampToValueAtTime(
            0.00,
            audioContext.currentTime + rampTime,
          );
          setTimeout(() => {
            wave.stop();
            wave.disconnect();
          }, rampTime * 1000);
        },
        get wave() {
          return wave;
        }
      };
    };
    const oldSource = this.source;
    if (oldSource) oldSource.fadeOut();
    this.source = createSource(this.buffer, rampTime, this.requestedPitch);
  }

  play() {
    this.playing = true;
    this.loadWavetable();
    return this;
  }
  setPitch(frequency) {
    this.requestedPitch = frequency;
    if (this.source) {
      this.source.wave.frequency = frequency;
    }
  }
  setGain(gain, when = 0.01) {
    this.gainNode.gain.linearRampToValueAtTime(
      gain,
      audioContext.currentTime + when,
    );
  }
  stop() {
    this.source?.fadeOut();
    this.setGain(0);
  }
  fadeOut(decay = 0.5) {
    this.setGain(0, decay);
  }
}
