import { createSignal, For, Show } from 'solid-js'
import { styled } from 'solid-styled-components'
import { useStore } from '../managers/Store'

export default function ProgressBars() {
  const [uploaders, setUploaders] = createSignal({})
  const [state] = useStore()

  const ProgressBar = styled('div')`
    display: inline-block;
    background: white;
    border-radius: 15px;
    height: 16pt;
    line-height: 16pt;
    font-size: 8pt;
    position: relative;
    margin: 4px;
    margin-right: 0px;
    width: 150px;
    overflow: hidden;
    background: var(--light-grey);
    border: 1px solid white;

    & > span {
      position: absolute;
      height: 100%;
      left: 0px;
      top: 0px;
    }
    & > span:first-child {
      position: relative;
      z-index: 1;
      color: black;
      margin-top: 1px;
      padding-left: 15px;
      padding-right: 15px;
    }
    & > span:last-child {
      background: var(--darker-grey);
      position: absolute;
      top: 0px;
      bottom: 0px;
      left: 0px;
      width: 0%;
      transition: width 0.5s;
    }
  `

  const ProgressBars = styled('div')`
    position: absolute;
    z-index: 10;
    bottom: 0px;
    width: 100%;
    line-height: 24pt;
    height: 24pt;
    white-space: nowrap;
  `

  return (
    <Show when={Object.keys(state.editor.uploaders).length != 0}>
      <ProgressBars>
        <For each={Object.values(state.editor.uploaders)}>
          {uploader => (
            <ProgressBar class="progress">
              <span>
                {uploader.instruction_id} : {uploader.state}
              </span>
              <Show when={uploader.progress}>
                <span
                  style={{ width: `${uploader.progress.percentage}%` }}
                />
              </Show>
            </ProgressBar>
          )}
        </For>
      </ProgressBars>
    </Show>
  )
}
