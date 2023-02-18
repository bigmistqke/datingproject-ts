function dragHelper(move_callback = () => {}, end_callback = () => {}) {
  return new Promise(resolve => {
    const end = (e: MouseEvent) => {
      window.removeEventListener('pointermove', move_callback)
      window.removeEventListener('pointerup', end)
      resolve(e)
    }

    window.addEventListener('pointermove', move_callback)
    window.addEventListener('pointerup', end)
  })
}
export default dragHelper
