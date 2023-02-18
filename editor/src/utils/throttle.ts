export default function throttle(callback: () => void, delta: number) {
  let lastTime = 0
  return function () {
    let now = Date.now()
    if (now - lastTime >= delta) {
      callback()
      lastTime = now
    }
  }
}
