export default function getColorFromHue(hue) {
  return `hsl(${parseInt(hue)}, 100%, ${25 + (hue % 20)}%)`;
}