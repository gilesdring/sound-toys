import { bufferFactory } from "../../../../lib/util/buffer-factory.ts";
import { audioContext } from "./audio-subsystem.js";

export class WaveSynth {
  constructor() {
    this.gainNode = audioContext.createGain();
    this.limiter = audioContext.createDynamicsCompressor();
    this.limiter.attack.value = 0.05;
    this.limiter.release.value = 0.1;
    this.gainNode.connect(audioContext.destination);
    this.limiter.connect(this.gainNode);

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
    const rampTime = 0.1;

    const pitch = this.source?.getPitch();

    const createSource = (buffer, rampTime, pitch) => {
      const wave = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      wave.buffer = buffer;
      // Set playback rate
      if (pitch) wave.playbackRate.value = pitch;
      const setPitch = (newPitch) => {
        if (!newPitch) return;
        wave.playbackRate.exponentialRampToValueAtTime(
          newPitch,
          audioContext.currentTime + 0.1,
        );
      };
      // Turn on looping
      wave.loop = true;
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
        setPitch,
        getPitch: () => wave.playbackRate.value,
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
      };
    };
    const oldSource = this.source;
    this.source = createSource(this.buffer, rampTime, pitch);
    if (oldSource) oldSource.fadeOut();
  }

  play() {
    this.playing = true;
    this.loadWavetable();
    return this;
  }
  setPitch(frequency) {
    if (this.source) {
      this.source.setPitch(frequency * this.buffer.duration);
    }
  }
  setGain(gain, when = 0.01) {
    this.gainNode.gain.linearRampToValueAtTime(
      gain,
      audioContext.currentTime + when,
    );
  }
  stop() {
    this.setGain(0);
  }
  fadeOut(decay = 0.5) {
    this.setGain(0, decay);
  }
}
