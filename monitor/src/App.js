import './App.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useHistory } from "react-router-dom";
import State from "./helpers/react/State.js";

import copy from 'copy-to-clipboard';
import _Mqtt from "./modules/_Mqtt.js";

import QRCode from "qrcode.react";
import urls from './urls';


function App() {
  let { script_id } = useParams();

  // let [rooms, rooms.set] = useState({});
  const rooms = new State({});
  const initialized = new State(false);
  const [mqtt, setMqtt] = new useState(false);

  const [QRData, setQRData] = useState(false);

  const openQR = useCallback(({ game_url }) => {
    setQRData({ game_url })
  }, [])

  const closeQR = useCallback(() => {
    setQRData(false)

  }, [])

  useEffect(async () => {
    let _mqtt = new _Mqtt();
    await _mqtt.connect(urls.socket, true, true);
    console.log('connect???', _mqtt);
    setMqtt(_mqtt);
  }, [])
  /* const [rooms, rooms.set] = useState({});
  let r_rooms = useRef({}); */
  // get active games

  /*   useEffect(() => {
      console.log('rooms changed ', rooms);
    }, [rooms.state]) */

  useEffect(async () => {
    if (!mqtt) return;
    if (!initialized.state) {
      initialized.set(true);
      console.log('url ', `${urls.fetch}/api/room/getRooms/${script_id}`);
      let _rooms = await fetch(`${urls.fetch}/api/room/getRooms/${script_id}`);

      _rooms = await _rooms.json();
      console.log('initializing? ', _rooms);

      if (!_rooms) return;
      Object.entries(_rooms).forEach(([room_id, room]) => {
        //console.log(room);
        // monitor({ room_id, roles: room.roles });
      })

      mqtt.subscribe(`/createRoom/${script_id}`, (message, topic) => {
        console.log("CREATE ROOM!!!");
        let { room_id, roles, script_id } = JSON.parse(message);
        console.log(`/createRoom/${script_id}`, JSON.parse(message))

        addRoom({ room_id, roles, script_id });
      });

      rooms.set(_rooms);
    }
  }, [script_id, rooms, mqtt])

  const addRoom = useCallback(({ room_id, roles, script_id }) => {
    let _rooms = { ...rooms.get() };
    console.log(_rooms);

    rooms.set({ ..._rooms, [room_id]: { roles, script_id } });
  }, [rooms.state])








  return (
    <div className="App">
      {
        mqtt ?
          Object.entries(rooms.state).map(([room_id, room]) =>
            <Room mqtt={mqtt} script_id={script_id} rooms={rooms} key={room_id} room={room} room_id={room_id} openQR={openQR}></Room>
          ) : null
      }
      {QRData ? <QR data={QRData} closeQR={closeQR}></QR> : null}
    </div>
  );
}

function QR({ data, closeQR }) {
  useEffect(() => {
    console.log(closeQR);
  }, [])
  return <div>
    <div className='qr'>
      <span style={{ width: '100%', textAlign: 'center', display: 'inline-block' }}>
        {data.game_url}

        <QRCode value={data.game_url}></QRCode>

      </span>

    </div>
    <div onClick={closeQR} className='close'></div>
  </div>
}

function Room({ mqtt, script_id, rooms, room, room_id, openQR }) {
  const deleteRoom = useCallback(async () => {
    let response = await fetch(`${urls.fetch}/api/room/delete/${room_id}`);
    if (!response) return;
    let _rooms = { ...rooms.get() };
    delete _rooms[room_id];
    rooms.set(_rooms);

  }, [rooms.state])

  const restartRoom = useCallback(async () => {
    let shouldRestart = window.confirm('are you sure you want to restart the game?');
    if (!shouldRestart) return;
    let response = await fetch(`${urls.fetch}/api/room/restart/${room_id}`);
    if (!response) return;
  }, [rooms.state])

  const updateRoom = useCallback(async (e) => {
    try {
      let shouldUpdate = window.confirm('are you sure you want to update the game?');
      if (!shouldUpdate) return;
      let response = await fetch(`${urls.fetch}/api/room/update/${room_id}/${script_id}`);
      response = await response.json();
      console.log(response);
      if (!response.success) {
        console.error(response.errors);
      } else {
        e.target.innerHTML = 'script updated!';
        setTimeout(() => {
          e.target.innerHTML = 'update script';
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    }


  }, [rooms.state])


  const openCombo = useCallback(() => {
    window.open(`${urls.editor}/test/${room_id}`)
  }, [])

  var monitor = useCallback(({ room_id, roles }) => {
    const update = ({ room_id, role_url, state }) => {
      let _rooms = rooms.get();
      if (!_rooms[room_id]) {
        console.error(_rooms, room_id, role_url, state);
        return;
      }


      const roles = _rooms[room_id].roles;
      // const role = roles[role_url];


      let new_state = {
        ..._rooms,
        [room_id]: {
          ..._rooms[room_id],
          roles: {
            ...roles, [role_url]:
            {
              ..._rooms[room_id].roles[role_url],
              ...state
            }
          }
        }
      }
      rooms.set(new_state)
    }
    if (!roles) return;
    Object.entries(roles).forEach(([role_url, role]) => {
      if (!role) return;
      mqtt.subscribe(`/monitor/${room_id}/${role_url}/card`, (message, topic) => {
        let card = JSON.parse(message);
        update({ room_id, role_url, state: { card } })
      })
      mqtt.subscribe(`/monitor/${room_id}/${role_url}/status`, (message, topic) => {
        try {
          let status = JSON.parse(message);
          console.log(role_url, status);
          update({ room_id, role_url, state: status })
        } catch (e) {
          console.error(e, message);
        }
      })
      mqtt.subscribe(`/monitor/${room_id}/${role_url}/ping`, (message, topic) => {
        try {
          const ping = JSON.parse(message);
          console.log('receive ping', room_id, role_url);
          update({ room_id, role_url, state: ping })
        } catch (e) {
          console.error(e, message);
        }

      })
    })




    mqtt.subscribe(`/${room_id}/#`, (message, topic) => {
      message = JSON.parse(message);
    })
  }, [rooms.state]);

  useEffect(() => {
    monitor({ room_id, roles: room.roles })
  }, [])

  return (
    <div className='room'>
      <div className='top'>
        <div>
          <h1>id: {room_id} </h1>
        </div>
        <button onClick={deleteRoom}>delete</button>
        <button onClick={restartRoom}>restart</button>
        <button onClick={updateRoom}>update script</button>

        <button onClick={openCombo}>combo</button>
      </div>

      <div className='roles'>
        {
          room && room.roles ?
            Object.entries(room.roles).sort((a, b) => a[1].name - b[1].name).map(([role_url, role]) => {
              //console.log('entries rooom.roles', room, role_url, role);
              return <Role mqtt={mqtt} room_id={room_id} key={role_url} role_url={role_url} role={role} openQR={openQR}></Role>

            }
            ) : null
        }
      </div>
    </div>
  )
}

// create active game and add to visualization
function Role({ room_id, role, role_url, openQR, mqtt }) {
  let r_url = useRef();

  const openLink = useCallback(() => {
    window.open(r_url.current)
  }, [])

  const copyLink = useCallback((e) => {
    copy(r_url.current);
    e.target.innerHTML = 'copied!';
    setTimeout(() => { e.target.innerHTML = 'copy' }, 1000);
  }, [])

  const forcedSwipe = useCallback((e) => {
    console.log('ok?');
    let shouldSwipe = window.confirm('are you sure u want to force a swipe?');
    if (!shouldSwipe) return;
    mqtt.send(`/${room_id}/${role.role_id}/forcedSwipe`, 'true');
  }, [mqtt])

  const forcedRefresh = useCallback((e) => {
    console.log('ok?');
    let shouldRestart = window.confirm('are you sure u want to force a refresh?');
    if (!shouldRestart) return;
    mqtt.send(`/${room_id}/${role.role_id}/restart`, 'true');
  }, [mqtt])

  useEffect(() => {
    console.log('room_id is ', room_id);
    r_url.current = `${urls.play}/${room_id}${role_url}`;
  }, [])

  return <div className='role' style={{ border: `1px solid ${role.status === 'connected' ? 'green' : role.status === 'finished' ? 'blue' : 'red'}` }}>
    {role ? <>
      <div className='marginBottom'>
        <div className='row'><label>role</label><span>{role.name}</span></div>
        <div className='row'><label>status</label> <span style={{ color: role.status === 'connected' ? 'green' : role.status === 'finished' ? 'blue' : 'red' }}>{role.status ? role.status : 'never connected'}</span></div>
        {
          role.status === 'connected' ?
            <div className='row'>
              <label>ping</label>
              <span style={{ color: role.ping === 'error' ? 'red' : 'black' }}>{role.ping ? `${role.ping}ms` : null}</span>
            </div> : null
        }
      </div>

      <div className='marginBottom instruction'>
        <div className='row'><label>card</label></div>
        <div className='row'><label className='margin'>type</label> {role.card ? <span className='italic'>{role.card.type}</span> : null}</div>
        <div className='row'><label className='margin'>text</label> {role.card && role.card.type !== 'video' ? <span>{role.card.text}</span> : null}</div>
      </div>

      <div className='flex role_buttons'>
        <button onClick={openLink}>open </button>
        <button onClick={copyLink}>copy</button>
        <button onClick={() => { openQR({ url: r_url.current, game_url: room_id + role_url }) }}>qr</button>

      </div><br></br>
      <div className='flex'>
        <button onClick={forcedSwipe}>swipe</button>
        <button onClick={forcedRefresh}>refresh</button>
      </div>


    </> : null
    }
  </div>

}

export default App;
