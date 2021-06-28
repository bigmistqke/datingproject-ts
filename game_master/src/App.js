import './App.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useHistory } from "react-router-dom";
import State from "./helpers/react/State.js";

import copy from 'copy-to-clipboard';




function App({ _mqtt }) {
  let { script_id } = useParams();

  // let [rooms, rooms.set] = useState({});
  const rooms = new State({});
  const initialized = new State(false);
  /* const [rooms, rooms.set] = useState({});
  let r_rooms = useRef({}); */
  // get active games

  /*   useEffect(() => {
      console.log('rooms changed ', rooms);
    }, [rooms.state]) */

  useEffect(async () => {
    if (!initialized.state) {
      initialized.set(true);
      let _rooms = await fetch(`${window._url.fetch}/api/room/getRooms/${script_id}`);
      _rooms = await _rooms.json();
      if (!_rooms) return;
      Object.entries(_rooms).forEach(([room_url, room]) => {
        //console.log(room);
        // monitor({ room_url, roles: room.roles });
      })

      _mqtt.subscribe(`/createRoom/${script_id}`, (message, topic) => {
        let { room_url, roles, script_id } = JSON.parse(message);
        console.log(`/createRoom/${script_id}`, room_url, roles, script_id)

        addRoom({ room_url, roles, script_id });
      });

      rooms.set(_rooms);
    }
  }, [script_id, rooms])

  const addRoom = useCallback(({ room_url, roles, script_id }) => {
    let _rooms = { ...rooms.get() };
    console.log(_rooms);

    rooms.set({ ..._rooms, [room_url]: { roles, script_id } });
  }, [rooms.state])







  function Room({ room, room_url }) {
    const deleteRoom = useCallback(async () => {
      let response = await fetch(`${window._url.fetch}/api/room/delete/${room_url}`);
      if (!response) return;
      let _rooms = { ...rooms.get() };
      delete _rooms[room_url];
      rooms.set(_rooms);

    }, [rooms.state])

    var monitor = useCallback(({ room_url, roles }) => {
      const update = ({ room_url, role_url, state }) => {
        let _rooms = rooms.get();
        if (!_rooms[room_url]) {
          console.error(_rooms, room_url, role_url, state);
          return;
        }


        const roles = _rooms[room_url].roles;
        const role = roles[role_url];


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
        _mqtt.subscribe(`/monitor/${room_url}/${role_url}/card`, (message, topic) => {
          let card = JSON.parse(message);
          update({ room_url, role_url, state: { card } })
        })
        _mqtt.subscribe(`/monitor/${room_url}/${role_url}/status`, (message, topic) => {
          try {
            let status = JSON.parse(message);
            console.log(role_url, status);
            update({ room_url, role_url, state: status })
          } catch (e) {
            console.error(e, message);
          }
        })
        _mqtt.subscribe(`/monitor/${room_url}/${role_url}/ping`, (message, topic) => {
          try {
            const ping = JSON.parse(message);
            update({ room_url, role_url, state: ping })
          } catch (e) {
            console.error(e, message);
          }

        })
      })




      _mqtt.subscribe(`/${room_url}/#`, (message, topic) => {
        message = JSON.parse(message);
      })
    }, [rooms.state]);

    useEffect(() => {
      monitor({ room_url, roles: room.roles })
    }, [])

    return (
      <div className='room'>
        <div className='top'><h1>room {script_id} {room_url} </h1> <button onClick={deleteRoom}>delete</button></div>

        <div className='roles'>
          {
            room && room.roles ?
              Object.entries(room.roles).sort((a, b) => a[1].role_id > b[1].role_id).map(([role_url, role]) => {
                //console.log('entries rooom.roles', room, role_url, role);
                return <Role key={role_url} role_url={role_url} role={role}></Role>

              }
              ) : null
          }
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {
        Object.entries(rooms.state).map(([room_url, room]) =>
          <Room key={room_url} room={room} room_url={room_url}></Room>
        )
      }
    </div>
  );
}

// create active game and add to visualization
function Role({ role, role_url }) {
  useEffect(() => {
    //console.log('role ', role_url, role, role.role_id, role.status, role.index);
  }, [role])

  return <div className='role'>
    {role ? <>
      <div className='marginBottom'>
        <div className='row'><label>role</label><span>{role.role_id}</span></div>
        <div className='row'><label>status</label> <span style={{ color: role.status === 'connected' ? 'green' : role.status === 'finished' ? 'blue' : 'red' }}>{role.status ? role.status : 'never connected'}</span></div>
        {
          role.status != 'disconnected' ?
            <div className='row'>
              <label>ping</label>
              <span style={{ color: role.ping === 'error' ? 'red' : 'black' }}>{role.ping ? role.ping : null}</span>
            </div> : null
        }
      </div>

      <div className='marginBottom'>
        <div className='row'><label>current card</label></div>
        <div className='row'><label className='margin'>type</label> {role.card ? <span>{role.card.type}</span> : null}</div>
        <div className='row'><label className='margin'>text</label> {role.card && role.card.type != 'video' ? <span>{role.card.text}</span> : null}</div>
      </div>

      <div><label>links</label></div>
      <div className='flex'><button>open </button><button>copy</button><button>qr</button></div>


    </> : null
    }
  </div >

}

export default App;
