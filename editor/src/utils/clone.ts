export default function <T>(x: T) {
  return JSON.parse(JSON.stringify(x)) as T
}
