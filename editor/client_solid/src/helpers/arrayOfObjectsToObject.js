export default function arrayOfObjectsToObject(array, key) {
  let object = {};
  array.forEach((element) => {
    object[element[key]] = element;
  });
  return object;
}
