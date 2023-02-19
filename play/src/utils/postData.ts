export default async function postData(url = '', data = {}, type = 'json') {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: type === 'json' ? JSON.stringify(data) : data,
  });

  if (response.status === 200 && type === 'json') {
    try {
      return await response.json();
    } catch (e) {
      return response;
    }
  }
  if (response.status !== 200) {
    console.error('ERROR', response);
    return false;
  }
  return response;
}
