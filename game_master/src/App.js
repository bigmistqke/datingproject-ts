import './App.css';
import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from "react-router-dom";

const isDev = window.location.href.indexOf('localhost') != -1;

window._url = {
  mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
  fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net"
}

function App() {
  let { script_id } = useParams();

  let [rooms, setRooms] = useState({});

  // const script_id = useParams();

  // get active games
  useEffect(async () => {
    let result = await fetch(`${window._url.fetch}/api/room/getRooms/${script_id}`);
    result = await result.json();
    if (!result) return;
    setRooms(result);
  }, [script_id])

  // create active game and add to visualization

  function Role({ role }) {
    useEffect(() => {
      console.log('role ', role);
    }, [role])

    return <div className='role'>
      <div>role: {role.role_id}</div>
      <div>status: {role.status}</div>
      <div>index: {role.index}</div>

    </div>
  }

  function Room({ room, room_url }) {
    useEffect(() => {
      console.log('room', room);
    }, [room])
    return (
      <div className='room'>
        <h1>room {script_id} {room_url}</h1>
        <div>
          <div>
            roles:
          </div>
          <div className='roles'>
            {
              Object.entries(room.roles).map(([role_url, role]) =>
                <Role key={role_url} url={role_url} role={role}></Role>
              )
            }
          </div>

        </div>

      </div>
    )
  }

  return (
    <div className="App">
      {
        Object.entries(rooms).map(([room_url, room]) =>
          <Room key={room_url} room={room} room_url={room_url}></Room>
        )
      }
    </div>
  );
}

export default App;
