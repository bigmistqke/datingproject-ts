import copy from 'copy-to-clipboard'
import { createMemo, onMount, Show } from 'solid-js'
import { style } from 'solid-js/web'
// import "./Role.css";
import styles from './Role.module.css'

import urls from './urls'

export default function Role(props) {
  // let role_url;

  // const openLink = () => window.open(role_url);

  const setPlayer = function () {
    props.setRoom('players', props.role_id, ...arguments)
  }

  onMount(() => {
    props.mqtt.subscribe(`/monitor/${props.room_id}/${props.role_id}/ping`, ({ ping }, topic) => {
      setPlayer('ping', ping)
    })

    props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/current_instruction`,
      (instruction, topic) => {
        // setPlayer("instruction", instruction);
        props.setRoom('players', props.role_id, 'instruction', instruction)
      },
    )
    props.mqtt.subscribe(
      `/${props.room_id}/${props.role_id}/instruction_index`,
      ({ instruction_index }, topic) => {
        props.setRoom('players', props.role_id, 'instruction_index', instruction_index)
      },
    )
    props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/status`,
      ({ status }, topic) => {
        setPlayer('status', status)
      },
    )
    /*     props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/ping`,
      (ping, topic) => setPlayer( "status", ping)
    ); */
  })

  const copyLink = e => {
    copy(role_url)
    e.target.innerHTML = 'copied!'
    setTimeout(() => {
      e.target.innerHTML = 'copy'
    }, 1000)
  }

  const forcedSwipe = e => {
    let confirm = window.confirm('are you sure u want to force a swipe?')
    if (!confirm) return
    props.mqtt.send(`/${props.room_id}/${props.role.role_id}/forcedSwipe`, 'true')
  }

  const forcedRefresh = e => {
    let confirm = window.confirm('are you sure u want to force a refresh?')
    if (!confirm) return
    props.mqtt.send(`/${props.room_id}/${props.role.role_id}/forcedRefresh`, 'true')
  }

  const autoswipe = e => {
    let confirm = window.confirm('are you sure u want to autoswipe?')
    if (!confirm) return
    props.mqtt.send(
      `/${props.room_id}/${props.role.role_id}/autoswipe`,
      JSON.stringify({ autoswipe: !props.role.autoswipe }),
    )
    setPlayer('autoswipe', !props.role.autoswipe)
  }

  const prevs_and_roles = createMemo(() =>
    props.instructions_map && props.role.instruction && props.role.instruction.prev_instruction_ids
      ? props.role.instruction.prev_instruction_ids.map(prev_instruction_id => [
          prev_instruction_id,
          props.instructions_map[prev_instruction_id],
        ])
      : [],
  )

  return (
    <div
      style={{ position: 'relative' }}
      classList={{
        [styles.role]: true,
        [styles.connected]: props.role.status === 'connected',
        [styles.finished]: props.role.status === 'finished',
        [styles.disconnected]: props.role.status === 'disconnected',
        [styles.default]: props.role.status !== 'connected' || props.role.status !== 'disconnected',
      }}
    >
      <div class={styles.panel}>
        <Show when={props.role}>
          <Show when={props.role.autoswipe}>
            <div
              style={{
                position: 'absolute',
                right: '5px',
                top: '5px',
                background: 'rgb(0,250,0)',
                'border-radius': '50%',
                width: '20px',
                height: '20px',
              }}
            ></div>
          </Show>
          <div class={styles.top}>
            <span class={styles.name}>{props.role.name}</span>
            <span
              classList={{
                [styles.status]: true,
                [styles.connected]: props.role.status === 'connected',
                [styles.finished]: props.role.status === 'finished',
                [styles.disconnected]: props.role.status === 'disconnected',
                [styles.default]:
                  props.role.status !== 'connected' || props.role.status !== 'disconnected',
              }}
            />
          </div>
          <div class={styles.middle}>
            <span>
              {props.role.instruction_index} / {props.role.instructions_length}
            </span>
          </div>
          <div class={styles.flex}>
            <button onClick={forcedSwipe}>swipe</button>
          </div>
        </Show>
      </div>
      <div
        classList={{ [styles.panel]: true, [styles.progress]: true }}
        style={{
          height: (props.role.instruction_index / props.role.instructions_length) * 100 + '%',
        }}
      ></div>
    </div>
  )
}
