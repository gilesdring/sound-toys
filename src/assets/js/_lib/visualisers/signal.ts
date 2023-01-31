export function visualize({
  id,
  analyser,
  displayType = "waveform",
}: { id: string; analyser: AnalyserNode; displayType: string }) {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  if (!canvas) throw new Error("Oscilloscope not defined");
  const canvasCtx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!canvasCtx) throw new Error("Oscilloscope canvas context not found");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  if (displayType === "waveform") {
    canvas.classList.remove("spectrum");
    analyser.fftSize = 4096;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    const draw = function () {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(0, 255, 0)";
      canvasCtx.beginPath();

      const sliceWidth = WIDTH * 3 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * HEIGHT / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
        if (x > WIDTH) break;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  } else if (displayType == "spectrum") {
    canvas.classList.add("spectrum");
    analyser.fftSize = 256;
    const bufferLengthAlt = analyser.frequencyBinCount;
    console.log(bufferLengthAlt);
    const dataArrayAlt = new Uint8Array(bufferLengthAlt);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const drawAlt = function () {
      requestAnimationFrame(drawAlt);

      analyser.getByteFrequencyData(dataArrayAlt);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLengthAlt; i++) {
        const barHeight = dataArrayAlt[i];

        canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };

    drawAlt();
  } else if (displayType == "off") {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = "red";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}
