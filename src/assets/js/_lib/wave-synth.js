import { audioContext } from "./audio-subsystem.js";

export class WaveSynth {
  constructor() {
    this.gainNode = audioContext.createGain();
    this.limiter = audioContext.createDynamicsCompressor();
    this.limiter.attack.value = 0.05;
    this.limiter.release.value = 0.1;
    this.gainNode.connect(audioContext.destination);
    this.limiter.connect(this.gainNode);

    this.playbackRateAdjustment = 1;
    this.fullGain = 0.1;
    this.setGain(this.fullGain);
    this.playing = false;
    addEventListener("bufferUpdated", (e) => {
      if (e.detail.buffer !== this.buffer) return;
      if (this.playing) this.loadWavetable();
    });
  }

  setWavetable(wave) {
    const cycles = 1;
    this.buffer = audioContext.createBuffer(
      2,
      wave.length * cycles,
      audioContext.sampleRate,
    );
    this.playbackRateAdjustment = wave.length / audioContext.sampleRate;

    function* gen() {
      let step = 0;
      while (true) {
        yield wave[step % wave.length];
        step++;
      }
    }
    for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
      // This gives us the actual array that contains the data
      const nowBuffering = this.buffer.getChannelData(channel);
      const waveform = gen();
      for (let i = 0; i < this.buffer.length; i++) {
        nowBuffering[i] = waveform.next().value;
      }
    }
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

    const pitch = this.source?.getPitch()
    console.log(pitch);

    const createSource = (buffer, rampTime, pitch = 0) => {
      const wave = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      wave.buffer = buffer;
      // Set playback rate
      wave.playbackRate.value = pitch;
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
        setPitch: (pitch) => wave.playbackRate.value = pitch,
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
      this.source.setPitch(frequency * this.playbackRateAdjustment);
    }
  }
  setGain(gain) {
    this.gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
  }
  stop() {
    this.setGain(0);
  }
}
