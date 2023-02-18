import { createEffect, JSX, JSXElement, onMount } from 'solid-js'

import './Map.css'

import dragHelper from '../utils/dragHelper'

import { useStore } from '../managers/Store'
import { Vector } from '../managers/types'

function Map(props: { children: JSXElement | JSXElement[] }) {
  const [state, actions] = useStore()

  let map

  const select = ({ e, coords }: { e: MouseEvent; coords: Vector }) => {
    let selectionBox = {
      width: (e.clientX - coords.x) / actions.getZoom(),
      height: (e.clientY - coords.y) / actions.getZoom(),
      top: (coords.y - actions.getOrigin().y) / actions.getZoom(),
      left: (coords.x - actions.getOrigin().x) / actions.getZoom(),
    }

    actions.setSelectionBox(selectionBox)
  }

  const move = (e: MouseEvent, coords: Vector) => {
    let origin_delta = {
      x: e.clientX - coords.x,
      y: e.clientY - coords.y,
    }
    actions.setOrigin({
      x: Math.floor(state.editor.navigation.origin.x + origin_delta.x),
      y: Math.floor(state.editor.navigation.origin.y + origin_delta.y),
    })
  }

  const processNavigation = async (e: MouseEvent) => {
    if (!(e.target as HTMLElement).classList.contains('map-container'))
      return
    if (e.buttons === 2) return
    let coords = { x: e.clientX, y: e.clientY }
    let now = performance.now()

    // actions.setBool("isTranslating", true);

    await dragHelper(e => {
      now = performance.now()
      if (state.editor.bools.isShiftPressed) {
        select({ e, coords })
      } else {
        move(e, coords)
        coords = {
          x: e.clientX,
          y: e.clientY,
        }
      }
    })

    actions.setSelectionBox(undefined)
  }

  const createNode = async (e: MouseEvent) => {
    e.preventDefault()

    let type = (await actions.openPrompt({
      type: 'options',
      header: 'create a new node',
      data: {
        options: ['instruction'],
      },
    })) as 'instruction'

    if (!type) return

    const position = {
      x:
        (e.clientX - state.editor.navigation.origin.x) /
        state.editor.navigation.zoom,
      y:
        (e.clientY - state.editor.navigation.origin.y) /
        state.editor.navigation.zoom,
    }
    actions.addNode({ position, type })
  }

  const scrollMap = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (state.editor.bools.isCtrlPressed) {
      actions.offsetZoom(e.deltaY * 0.001)
    } else {
      actions.offsetOrigin({ x: e.deltaX * -1, y: e.deltaY * -1 })
    }
  }

  return (
    <div
      class="map-container"
      onMouseDown={processNavigation}
      onContextMenu={createNode}
      onWheel={scrollMap}
    >
      <div
        class={`map ${
          state.editor.navigation.zoomedOut ? 'zoomedOut' : ''
        }`}
        ref={map}
        style={{
          transform: `translateX(${state.editor.navigation.origin.x}px) translateY(${state.editor.navigation.origin.y}px)`,
        }}
      >
        <div
          class="zoom"
          style={{ transform: `scale(${state.editor.navigation.zoom})` }}
        >
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default Map
