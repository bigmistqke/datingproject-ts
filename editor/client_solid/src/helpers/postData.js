export default async function postData(url = '', data = {}, type = "json") {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: type === 'json' ? JSON.stringify(data) : data
  });

  console.log("RESPONSE,", response);

  if (type === "json")
    return await response.json();

  return response;
}