const isDev = true;
const urls = {
  mqtt: isDev ? "socket.datingproject.net/mqtt" : "socket.datingproject.net/mqtt",
  fetch: isDev
    ? "https://fetch.datingproject.net/test"
    : "https://fetch.datingproject.net",
  play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
  monitor: isDev
    ? "http://localhost:3004"
    : "https://monitor.datingproject.net",
};

export default urls;