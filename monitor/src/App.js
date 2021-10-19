import './App.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useHistory } from "react-router-dom";
import State from "./helpers/react/State.js";

import copy from 'copy-to-clipboard';
import _Mqtt from "./modules/_Mqtt.js";

import QRCode from "qrcode.react";



function App() {
  let { script_id } = useParams();

  // let [rooms, rooms.set] = useState({});
  const rooms = new State({});
  const initialized = new State(false);
  const [mqtt, setMqtt] = new useState(false);

  const [QRData, setQRData] = useState(false);

  const openQR = useCallback(({ url, role_id }) => {
    setQRData({ url, role_id })
  }, [])

  const closeQR = useCallback(() => {
    setQRData(false)

  }, [])

  useEffect(async () => {
    let _mqtt = await new _Mqtt(window._url.mqtt, true, window.location.protocol.indexOf('https') != -1);
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
      let _rooms = await fetch(`${window._url.fetch}/api/room/getRooms/${script_id}`);
      _rooms = await _rooms.json();
      if (!_rooms) return;
      Object.entries(_rooms).forEach(([room_url, room]) => {
        //console.log(room);
        // monitor({ room_url, roles: room.roles });
      })

      mqtt.subscribe(`/createRoom/${script_id}`, (message, topic) => {
        let { room_url, roles, script_id } = JSON.parse(message);
        console.log(`/createRoom/${script_id}`, room_url, roles, script_id)

        addRoom({ room_url, roles, script_id });
      });

      rooms.set(_rooms);
    }
  }, [script_id, rooms, mqtt])

  const addRoom = useCallback(({ room_url, roles, script_id }) => {
    let _rooms = { ...rooms.get() };
    console.log(_rooms);

    rooms.set({ ..._rooms, [room_url]: { roles, script_id } });
  }, [rooms.state])








  return (
    <div className="App">
      {
        mqtt ?
          Object.entries(rooms.state).map(([room_url, room]) =>
            <Room mqtt={mqtt} script_id={script_id} rooms={rooms} key={room_url} room={room} room_url={room_url} openQR={openQR}></Room>
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
        {data.role_id}

        <QRCode value={data.url}></QRCode>

      </span>

    </div>
    <div onClick={closeQR} className='close'></div>
  </div>
}

function Room({ mqtt, script_id, rooms, room, room_url, openQR }) {
  const deleteRoom = useCallback(async () => {
    let response = await fetch(`${window._url.fetch}/api/room/delete/${room_url}`);
    if (!response) return;
    let _rooms = { ...rooms.get() };
    delete _rooms[room_url];
    rooms.set(_rooms);

  }, [rooms.state])

  const restartRoom = useCallback(async () => {
    let shouldRestart = window.confirm('are you sure you want to restart the game?');
    if (!shouldRestart) return;
    let response = await fetch(`${window._url.fetch}/api/room/restart/${room_url}`);
    if (!response) return;
  }, [rooms.state])

  const updateRoom = useCallback(async (e) => {
    try {
      let shouldUpdate = window.confirm('are you sure you want to update the game?');
      if (!shouldUpdate) return;
      let response = await fetch(`${window._url.fetch}/api/room/update/${room_url}/${script_id}`);
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
    window.open(`${window._url.editor}/test/${room_url}`)
  }, [])

  var monitor = useCallback(({ room_url, roles }) => {
    const update = ({ room_url, role_url, state }) => {
      let _rooms = rooms.get();
      if (!_rooms[room_url]) {
        console.error(_rooms, room_url, role_url, state);
        return;
      }


      const roles = _rooms[room_url].roles;
      // const role = roles[role_url];


      let new_state = {
        ..._rooms,
        [room_url]: {
          ..._rooms[room_url],
          roles: {
            ...roles, [role_url]:
            {
              ..._rooms[room_url].roles[role_url],
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
      mqtt.subscribe(`/monitor/${room_url}/${role_url}/card`, (message, topic) => {
        let card = JSON.parse(message);
        update({ room_url, role_url, state: { card } })
      })
      mqtt.subscribe(`/monitor/${room_url}/${role_url}/status`, (message, topic) => {
        try {
          let status = JSON.parse(message);
          console.log(role_url, status);
          update({ room_url, role_url, state: status })
        } catch (e) {
          console.error(e, message);
        }
      })
      mqtt.subscribe(`/monitor/${room_url}/${role_url}/ping`, (message, topic) => {
        try {
          const ping = JSON.parse(message);
          console.log('receive ping');
          update({ room_url, role_url, state: ping })
        } catch (e) {
          console.error(e, message);
        }

      })
    })




    mqtt.subscribe(`/${room_url}/#`, (message, topic) => {
      message = JSON.parse(message);
    })
  }, [rooms.state]);

  useEffect(() => {
    monitor({ room_url, roles: room.roles })
  }, [])

  return (
    <div className='room'>
      <div className='top'>
        <div>
          <h1>id: {room_url} </h1>
        </div>
        <button onClick={deleteRoom}>delete</button>
        <button onClick={restartRoom}>restart</button>
        <button onClick={updateRoom}>update script</button>

        <button onClick={openCombo}>combo</button>
      </div>

      <div className='roles'>
        {
          room && room.roles ?
            Object.entries(room.roles).sort((a, b) => a[1].role_id - b[1].role_id).map(([role_url, role]) => {
              //console.log('entries rooom.roles', room, role_url, role);
              return <Role mqtt={mqtt} room_url={room_url} key={role_url} role_url={role_url} role={role} openQR={openQR}></Role>

            }
            ) : null
        }
      </div>
    </div>
  )
}

// create active game and add to visualization
function Role({ room_url, role, role_url, openQR, mqtt }) {
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
    mqtt.send(`/${room_url}/${role.role_id}/forcedSwipe`, 'true');
  }, [mqtt])

  const forcedRefresh = useCallback((e) => {
    console.log('ok?');
    let shouldRestart = window.confirm('are you sure u want to force a refresh?');
    if (!shouldRestart) return;
    mqtt.send(`/${room_url}/${role.role_id}/restart`, 'true');
  }, [mqtt])

  useEffect(() => {
    console.log('room_url is ', room_url);
    r_url.current = `${window._url.play}/${room_url}${role_url}`;
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
        <button onClick={() => { openQR({ url: r_url.current, role_id: role.role_id }) }}>qr</button>

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
