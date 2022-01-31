const isDev = false;
const urls = {
  socket: isDev ? "socket.datingproject.net/mqtt" : "socket.datingproject.net/mqtt",
  fetch: isDev
    ? "https://fetch.datingproject.net/test"/*  "http://localhost:8079" */
    : "https://fetch.datingproject.net/test",
  play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
  editor: isDev ? "http://localhost:3000" : "https://script.datingproject.net",
  monitor: isDev
    ? "http://localhost:3004"
    : "https://monitor.datingproject.net",
};

export default urls;