export default function arrayOfObjectsToObject<
  T extends Record<string, any>,
  U extends T[],
>(array: U, key: keyof T) {
  let object: Record<string, T> = {}
  array.forEach(element => {
    object[element[key]] = element
  })
  return object
}
