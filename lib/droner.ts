import { CoreSynth } from "./core-synth.ts";

export interface DroneController {
  stop: () => void;
  move: (freq: number, time?: number) => void;
}

export class Droner extends CoreSynth {
  private createOsc() {
    const osc = this.context.createOscillator();
    osc.type = "sine";
    return osc;
  }
  add(freq: number): DroneController {
    const osc = this.createOsc();
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    osc.connect(this.bus);
    osc.start();
    return {
      stop() {
        osc.stop();
        osc.disconnect();
      },
      move(target, time = 0.1) {
        osc.frequency.linearRampToValueAtTime(
          target,
          osc.context.currentTime + time,
        );
      },
    };
  }
}
