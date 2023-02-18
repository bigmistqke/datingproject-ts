const array_push = <T extends any[], U>(arr: T, el: U) => [...arr, el]

const array_insert = <T extends any[], U>(arr: T, index: number, el: U) => [
  ...arr.slice(0, index),
  el,
  ...arr.slice(index),
]
const array_insert_after_element = <T extends any[], U, V>(arr: T, el: U, other_el: V) =>
  array_insert(arr, arr.indexOf(other_el), el)

const array_remove = <T extends any[]>(arr: T, index: number) => {
  if (Math.floor(index) !== index || index < 0) return arr
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}
const array_remove_element = <T extends any[], U>(arr: T, el: U) => {
  const index = arr.indexOf(el)
  return index === -1 ? arr : array_remove(arr, index)
}
const array_shuffle = <T extends any[]>(array: T) => {
  let currentIndex = array.length
  let randomIndex: number
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
  return array
}

export {
  array_push,
  array_insert,
  array_insert_after_element,
  array_remove,
  array_remove_element,
  array_shuffle,
}
