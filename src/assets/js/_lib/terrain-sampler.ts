import { normalise } from "./util/array.ts";
import { rgbaToLuma } from "./util/colour.ts";
import { circle } from "./util/shape.ts";

interface TerrainSamplerConfig {
  image: HTMLImageElement;
}

export class TerrainSampler {
  image: HTMLImageElement;
  size!: [number, number];
  imageData!: ImageData;
  samples: number;
  sampling: boolean;
  sampleData!: number[];

  constructor(config: TerrainSamplerConfig) {
    this.image = config.image;
    this.samples = 2048;
    this.sampling = false;

    this.image.addEventListener('load', () => {
      this.setBuffer();
    });
  }
  private setBuffer() {
    const { naturalWidth: width, naturalHeight: height } = this.image;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const aspect = width / height;
    const maxWidth = Math.sqrt(16777216 * aspect);

    canvas.width = Math.min(width, Math.floor(maxWidth));
    canvas.height = Math.min(height, Math.floor(maxWidth / aspect));
    ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    this.size = [canvas.width, canvas.height];
    this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  sampleWaveform({ x, y, r }: { x: number, y: number, r: number }) {
    if (this.sampling) return
    this.sampling = true;

    const scaledX = x * this.size[0];
    const scaledY = y * this.size[1];
    const scaledR = r * this.size[0];

    const samplePoints = circle(scaledX, scaledY, scaledR, this.samples).map(c => c.map(Math.round) as [number, number]);

    const getLumaAtCoordinates = ([x, y]: [number, number]) => {
      if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) throw new Error('Coordinate out of bounds');
      const i = (x + y * this.imageData.width) * 4;
      return rgbaToLuma(Array.from(this.imageData.data.slice(i, i + 4)) as [number, number, number, number]);
    };
    this.sampleData = normalise(samplePoints.map(getLumaAtCoordinates));
    dispatchEvent(new CustomEvent('waveChanged', {
      detail: {
        sampler: this
      }
    }));
    this.sampling = false;
  }
}