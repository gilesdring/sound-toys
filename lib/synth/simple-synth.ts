import { Analysable } from "../analysable.ts";
import { CoreSynth, SynthOptions } from "../core-synth.ts";

export class SimpleSynth extends CoreSynth implements Analysable {
  private osc?: OscillatorNode;

  constructor(options: Partial<SynthOptions>) {
    super(options);
  }
  set freq(f: number) {
    if (!this.osc) return;
    this.osc.frequency.exponentialRampToValueAtTime(
      f,
      this.context.currentTime + this.portamento,
    );
  }
  get active() {
    return typeof this.osc !== 'undefined';
  }
  start() {
    if (this.osc) return;
    this.osc = this.context.createOscillator();
    this.osc.type = "sine";
    this.osc.connect(this.bus);
    this.osc.start();
  }
  stop() {
    if (!this.osc) return;
    this.osc.stop();
    this.osc.disconnect();
    this.osc = undefined;
  }
  get analyser(): AnalyserNode {
    const analyser = this.context.createAnalyser();
    this.master.connect(analyser);
    return analyser;
  }
}
