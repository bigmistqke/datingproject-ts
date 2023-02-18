export default function getRandomHue(index: number) {
  return ((index * 785) / Math.PI).toString()
}
