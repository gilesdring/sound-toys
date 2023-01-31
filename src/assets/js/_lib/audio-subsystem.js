export const audioContext =
  new (window.AudioContext || window.webkitAudioContext)();

export const pause = () => audioContext.suspend();
export const resume = () => audioContext.resume();
