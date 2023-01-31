export function getImageCoordinates(e: Event) {
  if (!e.target) return;
  const shape = e.target.getBoundingClientRect();
  const xPos = e.clientX || e.touches[0].clientX;
  const yPos = e.clientY || e.touches[0].clientY;
  const x = Math.floor(xPos - shape.left);
  const y = Math.floor(yPos - shape.top);

  return {
    x,
    y,
    scaledX: x / shape.width,
    scaledY: y / shape.height,
  };
}
