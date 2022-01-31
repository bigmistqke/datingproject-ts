const isDev = false;
const urls = {
  mqtt: isDev ? "socket.datingproject.net/mqtt" : "socket.datingproject.net/mqtt",
  fetch: isDev
    ? /* "https://fetch.datingproject.net/test" */ "http://localhost:8079"
    : "https://fetch.datingproject.net/test",
  play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
  monitor: isDev
    ? "https://monitor.datingproject.net"
    : "https://monitor.datingproject.net",
};

export default urls;