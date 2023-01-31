export function getImageCoordinates(e: Event) {
  if (!e.target) return;
  const shape = e.target.getBoundingClientRect();
  const xPos = e.clientX || e.touches[0].clientX;
  const yPos = e.clientY || e.touches[0].clientY;
  return {
    x: Math.floor(xPos - shape.left),
    y: Math.floor(yPos - shape.top),
  };
}
