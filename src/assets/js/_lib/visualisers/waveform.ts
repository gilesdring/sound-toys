interface displayWaveformOptions {
  data: Float32Array;
  id: string;
  cycles?: number;
  lineWidth?: number;
}

export function displayWaveform({ data, id, cycles = 4, lineWidth = 2 }: displayWaveformOptions) {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  if (!canvas) throw new Error(`Cannot find canvas with id ${id}`);
  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) throw new Error('Failed to load canvas context');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const sliceWidth = WIDTH / cycles / data.length;
  
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  canvasCtx.lineWidth = lineWidth;
  canvasCtx.strokeStyle = 'rgb(200, 245, 200)';
  canvasCtx.beginPath();

  for (let i = 0; i < data.length * cycles; i++) {
    const y = ((1 - (data[i % data.length] * 0.9))) * HEIGHT / 2;
    const x = i * sliceWidth;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    if (x > WIDTH) break;
  }
  canvasCtx.stroke();
}