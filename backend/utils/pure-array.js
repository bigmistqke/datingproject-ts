

const array_push = (arr, el) => [...arr, el];
const array_insert = (arr, index, el) => [...arr.slice(0, index), el, ...arr.slice(index)]
const array_insert_after_element = (arr, el, other_el) =>
  array_insert(arr, arr.indexOf(other_el), el)

const array_remove = (arr, index) => {
  if (parseInt(index) !== index || index < 0) return arr
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}
const array_remove_element = (arr, el) => {
  const index = arr.indexOf(el);
  return index === -1 ? arr : array_remove(arr, index)
}
const array_shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

module.exports = {
  array_push,
  array_insert,
  array_insert_after_element,
  array_remove,
  array_remove_element,
  array_shuffle
}