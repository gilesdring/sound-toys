export const audioContext =
  new (window.AudioContext || window.webkitAudioContext)({
    latencyHint: 'interactive',
  });

export const pause = () => audioContext.suspend();
export const resume = () => audioContext.resume();
