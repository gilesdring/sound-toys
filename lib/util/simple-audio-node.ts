export interface SimpleAudioNode {
  start: () => void;
  stop: () => void;
  connect: (destinationNode: AudioNode) => AudioNode;
  disconnect: () => void;
}