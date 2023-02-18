async function getData(url = '', type = 'json') {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    })

    if (type === 'json') return await response.json()

    return response
  } catch (e) {
    console.error(e)
    return false
  }
}

export default getData
