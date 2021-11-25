var ImageWave = (function (exports) {
  'use strict';

  /**
   * Convert an RGBA array to a luma value
   */
  const rgbaToLuma = (v) => {
    const [r, g, b, a] = v;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma;
  };

  /**
   * Normalise an array to between -1 and 1
   */
  const normalise = (a) => {
    const min = Math.min(...a);
    const amp = 2 / (Math.max(...a) - min);
    return a.map(v => amp * (v - min) - 1);
  };

  function ImageCanvas(initialImage) {
    const samples = 2048;

    let img = document.getElementById('image');
    let x;
    let y;
    let r;
    let scale;

    // let getWaveform; 
    let sampleData;

    function loadImage(fileReader) {
      img.onload = imageLoadedHandler;
      img.src = fileReader.result;
    }

    const drawWaveform = () => {
      const canvas = document.getElementById('waveform');
      canvas.width = samples;
      canvas.height = samples / 10;
      if (!sampleData) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = Math.round(samples / 500);
      ctx.strokeStyle = 'rgb(200, 245, 200)';
      ctx.beginPath();
      for (let x = 0; x < samples; x++) {
        const y = (1 - sampleData[x]) * canvas.height / 2;
        ctx.moveTo(x, canvas.height / 2);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawSelector = () => {
      const canvas = document.getElementById('source');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cursorPoints = circle(x, y, r, samples);
      ctx.lineWidth = canvas.width / 100;
      ctx.strokeStyle = 'rgb(200, 245, 200)';
      ctx.beginPath();
      for (let i = 0; i < cursorPoints.length; i++) {
        if (i === 0) ctx.moveTo(...cursorPoints[i]);
        else ctx.lineTo(...cursorPoints[i]);
      }
      ctx.closePath();
      ctx.stroke();
      return canvas;
    };

    function imageLoadedHandler() {
      x = img.width / 2;
      y = img.height / 2;
      r = img.width / 20;
      const selector = drawSelector();

      const getWaveform = prepareBuffer();
      const readWave = () => {
        const scaledX = x * scale[0];
        const scaledY = y * scale[1];
        const scaledR = r * scale[0];
        sampleData = getWaveform(scaledX, scaledY, scaledR, samples);
        drawWaveform();
        const waveChanged = new Event('waveChanged');
        window.dispatchEvent(waveChanged);
      };
      readWave();
      const positionHandler = (e) => {
        e.preventDefault();
        ({ x, y } = getImageCoordinates(e));
        drawSelector();
        readWave();
      };
      selector.onmousemove = positionHandler;
      selector.ontouchmove = positionHandler;
    }

    function getImageCoordinates(e) {
      const shape = e.target.getBoundingClientRect();
      var xPos = e.clientX || e.touches[0].clientX;
      var yPos = e.clientY || e.touches[0].clientY;
      return {
        x: Math.floor(xPos - shape.left),
        y: Math.floor(yPos - shape.top)
      }
    }

    /**
     * Load the image into the buffer for later reading of the waveform
     */
    function prepareBuffer() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const aspect = img.naturalWidth / img.naturalHeight;
      const maxWidth = Math.sqrt(16777216 * aspect);
      canvas.width = Math.min(img.naturalWidth, Math.floor(maxWidth));
      canvas.height = Math.min(img.naturalHeight, Math.floor(maxWidth / aspect));
      scale = [canvas.width / img.width, canvas.height / image.height];
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // delete canvas, ctx;

      const getLumaAtCoordinates = ([x, y]) => {
        if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return;
        const i = (x + y * imageData.width) * 4;
        return rgbaToLuma(imageData.data.slice(i, i + 4));
      };

      return function sampleWaveform(x, y, r, samples) {
        const samplePoints = circle(x, y, r, samples).map(c => c.map(Math.round));
        return normalise(samplePoints.map(getLumaAtCoordinates));
      }
    }

    function circle(x, y, r, samples = 8192) {
      const angles = Array.from(new Array(samples)).map((v, i) => 2 * Math.PI * i / samples);
      return angles.map(a => [x + r * Math.sin(a), y - r * Math.cos(a)]);
    }

    function getWave() {
      return sampleData;
    }

    drawWaveform();

    img.onload = imageLoadedHandler;
    img.src = initialImage;

    return { loadImage, getWave };
  }

  class WaveSynth {
    constructor(audioContext) {
      this.audioContext = audioContext;

      this.gainNode = this.audioContext.createGain();
      this.limiter = this.audioContext.createDynamicsCompressor();

      this.gainNode.connect(this.audioContext.destination);
      // this.limiter.connect(this.audioContext.destination);

      this.playbackRateAdjustment = 1;
      this.fullGain = 0.1;
      this.setGain(this.fullGain);
      document.addEventListener('touchend', () => this.audioContext.resume());
    }

    setWavetable(wave) {
      const cycles = 10;
      this.buffer = this.audioContext.createBuffer(2, wave.length * cycles, this.audioContext.sampleRate);
      this.playbackRateAdjustment = wave.length / this.audioContext.sampleRate;

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
      const createSource = (buffer) => {
        const wave = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        wave.buffer = buffer;
        // Turn on looping
        wave.loop = true;
        // Connect source to gain.
        wave.connect(gainNode);
        // Connect gain to destination.
        gainNode.connect(this.gainNode);
    
        return {
          wave: wave,
          gainNode: gainNode,
          start: () => wave.start(),
          setPitch: (pitch) => wave.playbackRate.value = pitch,
          fadeIn: (time) => gainNode.gain.exponentialRampToValueAtTime(1, this.audioContext.currentTime + time),
          fadeOut: (time) => {
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + time);
            setTimeout(() => {
              wave.stop();
              wave.disconnect();
            }, time * 1000);
          },
        };
      };
      const oldSource = this.source;
      this.source = createSource(this.buffer);
      
      const rampTime = 0.15;
      this.source.start();
      this.source.fadeIn(rampTime);
      if (oldSource) oldSource.fadeOut(rampTime);
    }

    play() {
      this.setGain(this.fullGain);
      this.loadWavetable();
      this.setPitch(440);
      return this;
    }
    setPitch(frequency) {
      this.source.setPitch(frequency * this.playbackRateAdjustment);
    }
    setGain(gain) {
      this.gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
    }
    stop() {
      this.setGain(0);
    }
  }

  function init({
    initialImage,
  }) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const { loadImage, getWave } = ImageCanvas(initialImage);

    const synth = new WaveSynth(audioContext);

    const setWaveform = () => {
      synth.setWavetable(getWave());
      synth.play();
      synth.setPitch(220);
    };

    window.addEventListener('waveChanged', setWaveform);
    
    document.getElementById('myFile').onchange = function (evt) {
      var tgt = evt.target || window.event.srcElement,
        files = tgt.files;
    
      // FileReader support
      if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => loadImage(fr);
        fr.readAsDataURL(files[0]);
      }
    };  
  }

  exports.init = init;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
