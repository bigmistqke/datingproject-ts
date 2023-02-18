export default function getColorFromHue(hue: number) {
  return `hsl(${hue}, 100%, ${25 + (hue % 20)}%)`
}
