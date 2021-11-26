import { audioContext } from './audio-subsystem';

export class WaveSynth {
  constructor() {
    this.gainNode = audioContext.createGain();
    this.limiter = audioContext.createDynamicsCompressor();
    this.limiter.attack.value = 0.25;
    this.gainNode.connect(audioContext.destination);
    this.limiter.connect(this.gainNode);

    this.playbackRateAdjustment = 1;
    this.fullGain = 0.1;
    this.setGain(this.fullGain);
  }

  setWavetable(wave) {
    const cycles = 1;
    this.buffer = audioContext.createBuffer(2, wave.length * cycles, audioContext.sampleRate);
    this.playbackRateAdjustment = wave.length / audioContext.sampleRate;

    function* gen() {
      let step = 0;
      while (true) {
        yield wave[step % wave.length];
        step++;
      }
    }
    for (var channel = 0; channel < this.buffer.numberOfChannels; channel++) {
      // This gives us the actual array that contains the data
      var nowBuffering = this.buffer.getChannelData(channel);
      const waveform = gen();
      for (var i = 0; i < this.buffer.length; i++) {
        nowBuffering[i] = waveform.next().value;
      }
    }
  }

  loadWavetable() {
    const rampTime = 0.5;

    const createSource = (buffer, rampTime) => {
      const wave = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      wave.buffer = buffer;
      // Turn on looping
      wave.loop = true;
      // Connect source to gain.
      wave.connect(gainNode);
      // Connect gain to destination.
      gainNode.connect(this.gainNode);
      gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + rampTime)
      wave.start();
      return {
        setPitch: (pitch) => wave.playbackRate.value = pitch,
        fadeOut: () => {
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + rampTime);
          setTimeout(() => {
            wave.stop();
            wave.disconnect();
          }, rampTime * 1000);
        },
      };
    }
    const oldSource = this.source;
    this.source = createSource(this.buffer, rampTime);
    if (oldSource) oldSource.fadeOut();
  }

  play() {
    this.setGain(this.fullGain);
    this.loadWavetable();
    return this;
  }
  setPitch(frequency) {
    this.source.setPitch(frequency * this.playbackRateAdjustment);
  }
  setGain(gain) {
    this.gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
  }
  stop() {
    this.setGain(0);
  }
}
