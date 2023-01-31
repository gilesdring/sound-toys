import { getImageCoordinates } from "./image-readers/helpers.ts";

interface PositionCursorConfig {
  field: HTMLElement;
  border: number;
}

export class PositionCursor {
  x!: number;
  y!: number;
  field: HTMLElement;
  border: number;

  active: boolean;
  enabled: boolean;
  constructor(config: PositionCursorConfig) {
    const { field, border = 0 } = config;
    this.field = field;
    this.border = border;

    this.active = false;
    this.enabled = false;
    this.registerHandlers();
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  activate() {
    this.active = true;
    dispatchEvent(
      new CustomEvent("cursorActivated", {
        detail: {
          cursor: this,
        },
      }),
    );
  }
  deactivate() {
    this.active = false;
    dispatchEvent(
      new CustomEvent("cursorDeactivated", {
        detail: {
          cursor: this,
        },
      }),
    );
  }
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.refresh();
  }
  refresh() {
    dispatchEvent(
      new CustomEvent("cursorMoved", {
        detail: { cursor: this },
      }),
    );
  }
  positionHandler(e: Event) {
    if (!this.active || !this.enabled) return;
    e.preventDefault();
    const coordinates = getImageCoordinates(e);
    if (coordinates === undefined) return;
    const { scaledX: x, scaledY: y, aspect } = coordinates;
    if (x < this.border || x >= 1 - this.border || y < (this.border / aspect) || y >= 1 - (this.border / aspect)) return;
    this.setPosition(x, y);
  }
  registerHandlers() {
    this.field.addEventListener("mousedown", (e) => {
      this.activate();
      this.positionHandler(e);
    });
    this.field.addEventListener("mousemove", (e) => this.positionHandler(e));
    this.field.addEventListener("mouseup", (e) => {
      this.positionHandler(e);
      this.deactivate();
    });
    this.field.addEventListener("touchstart", () => this.active = true);
    this.field.addEventListener("touchmove", (e) => this.positionHandler(e));
    this.field.addEventListener("touchend", () => this.active = false);
  }
}
