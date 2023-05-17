import { Analysable } from "./analysable.ts";
import { CoreSynth } from "./core-synth.ts";

export class SimpleSynth extends CoreSynth implements Analysable {
  private osc?: OscillatorNode;
  private playing;
  private portamento;
  constructor({ portamento } = { portamento: 0.2 }) {
    super();
    this.playing = false;
    this.portamento = portamento;
  }
  set freq(f: number) {
    if (!this.osc) return;
    this.osc.frequency.exponentialRampToValueAtTime(
      f,
      this.context.currentTime + this.portamento,
    );
  }
  set gain(g: number) {
    this.master.gain.exponentialRampToValueAtTime(
      g,
      this.context.currentTime + +this.portamento,
    );
  }
  get active() {
    return this.playing;
  }
  start() {
    this.osc = this.context.createOscillator();
    this.osc.type = "sine";
    this.osc.connect(this.bus);
    this.osc.start();
    this.playing = true;
  }
  stop() {
    if (!this.osc) return;
    this.osc.stop();
    this.osc.disconnect();
    this.osc = undefined;
    this.playing = false;
  }
  get analyser(): AnalyserNode {
    const analyser = this.context.createAnalyser();
    this.master.connect(analyser);
    return analyser;
  }
}
