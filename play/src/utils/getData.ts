async function getData(url = '') {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
    });
    return response;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export default getData;
