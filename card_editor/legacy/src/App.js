import './App.css';
import React, { memo, useEffect, useCallback, useState, useRef } from 'react';
import uniqid from 'uniqid';

import RightPanel from "./components/RightPanel.js"
import BottomPanel from "./components/BottomPanel.js"

import CardContainer from "./components/CardContainer.js"
import Guides from "./components/Guides.js"
import Rulers from "./components/Rulers.js"
import ResizeHandles from "./components/ResizeHandles.js"
import BlurBorder from "./components/BlurBorder.js"

import CardElement from "./components/CardElement.js"

import ImageUploader from "./managers/ImageUploader.js";
import postData from "./helpers/postData.js"



import Store from "./helpers/react/Store.js"
import State from "./helpers/react/State.js"
import Designs from "./state/Designs.js"
import Viewport from "./state/Viewport.js"
import { useHistory, useParams } from 'react-router-dom';


const isDev = window.location.href.indexOf('localhost') != -1;

window._url = {
  mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
  fetch: isDev ? "https://fetch.datingproject.net/test" : "https://fetch.datingproject.net",
  play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
}

function App() {
  const { card_id } = useParams();

  const [card_dim, setcard_dim] = useState({})
  const [shouldSnap, setShouldSnap] = useState(true);
  const r_pressedKeys = useRef({ shift: [], alt: [] })
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);

  const r_uploader = useRef(new ImageUploader({ card_id }));

  const r_loremIpsum = useRef(['A week ago, when I returned home from doing my weekly groceries, I passed a theatre, ...'])

  const guides = new Store();
  guides.locked = new State(false);
  guides.hidden = new State(false);
  const viewport = new Viewport();

  const designs = new Designs();

  const shouldAddTextType = new State(false);

  const getCards = useCallback(async () => {
    let result = await fetch(`${window._url.fetch}/api/design/get/${card_id}`);
    result = await result.json();
    if (!result) return;
    Object.entries(result.designs).forEach(([type, data]) => {
      designs.archive({ data, type });
    });
    // console.log(designs.getFocusedDesign());
    viewport.updateAll(designs.getFocusedDesign());
  }, []);

  const saveCards = useCallback(() => {
    let designs_state = designs.archive({ data: viewport.state });
    postData(`${window._url.fetch}/api/card/save/${card_id}`, { ...designs_state })
  }, [designs, viewport]);


  const keyDown = e => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      r_pressedKeys.current.shift = [e.code, ...r_pressedKeys.current.shift];
      setShiftPressed(true);
    }
    if (e.code === 'AltLeft' || e.code === 'AltLeft') {
      r_pressedKeys.current.alt = [e.code, ...r_pressedKeys.current.alt];
      setAltPressed(true);
    }
  }
  const keyUp = e => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      r_pressedKeys.current.shift = r_pressedKeys.current.shift.filter(key => key !== e.code)
      if (r_pressedKeys.current.shift.length == 0)
        setShiftPressed(false)
    }
    if (e.code === 'AltLeft' || e.code === 'AltLeft') {
      r_pressedKeys.current.alt = r_pressedKeys.current.alt.filter(key => key !== e.code)
      if (r_pressedKeys.current.alt.length == 0)
        setAltPressed(false);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
  }, [])

  useEffect(async () => {
    getCards()
  }, [card_id])



  const updateCardDim = (dim) => {
    setcard_dim(dim);
  }

  useEffect(() => {
    //console.log(designs);
  }, [designs])

  const uploadImage = (e) => {
    e.preventDefault();

    let position = {
      x: (e.clientX - card_dim.x) / card_dim.width * 100,
      y: (e.clientY - card_dim.y) / card_dim.height * 100,
    }

    var file = e.dataTransfer.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function ({ target }) {
      let img = new Image();
      img.onload = async function () {
        let element = {
          type: 'image',
          src: target.result,
          origin: position,
          dim: {
            width: 25,
            height: this.height / this.width * 25 * (card_dim.width / card_dim.height)
          },
          locked: false,
          z: Object.values(viewport.state).length,
        }
        let element_id = uniqid();
        viewport.update(element_id, element);
        let uploaded = await r_uploader.current.process({ file, element_id });
        if (!uploaded.success) return;
        element.src = uploaded.url.replace('./', '');
        viewport.update(element_id, element);
      }
      img.src = target.result;
    }
    reader.readAsDataURL(file);
  }

  const dragOver = (e) => {
    console.log("DRAGGING OVER!!!!");
    e.preventDefault();
  }
  const changeType = (type) => {
    designs.archive({ data: viewport.state });
    viewport.updateAll(designs.changeType({ type }));
  }

  useEffect(() => {
    console.log("INITIALIZE");
  }, [])

  return (
    <div className="app flex-container" onDragOver={dragOver} onDrop={uploadImage}>
      <button onClick={saveCards}></button>
      <div className='card-container' onMouseDown={() => { viewport.focus(false) }}>
        <Rulers
          card_dim={card_dim}
          guides={guides}
          shouldSnap={shouldSnap}
        ></Rulers>
        <CardContainer
          shouldSnap={shouldSnap}
          card_dim={card_dim}
          guides={guides}
          updateCardDim={updateCardDim}
          shiftPressed={shiftPressed}
          viewport={viewport}
          shouldAddTextType={shouldAddTextType}
        >
          <div className='viewport'>
            {
              Object.entries(viewport.state).map(([id, element]) =>
                <CardElement
                  key={id}
                  id={id}
                  element={element}
                  card_dim={card_dim}
                  viewport={viewport}
                  guides={guides}
                  shouldSnap={shouldSnap}
                  shiftPressed={shiftPressed}
                  altPressed={altPressed}
                  loremIpsum={r_loremIpsum.current}
                  typeInFocus={designs.typeInFocus}
                >
                  {
                    id === viewport.elementInFocus.state ?
                      <ResizeHandles
                        id={id}
                        el={element}
                        guides={guides}
                        card_dim={card_dim}
                        viewport={viewport}
                        shiftPressed={shiftPressed}
                        altPressed={altPressed}

                      ></ResizeHandles> :
                      !viewport.blurredBorder.state ? null :
                        <BlurBorder></BlurBorder>
                  }
                </CardElement>
              )
            }
          </div>
          {
            !guides.hidden.state ?
              <Guides
                card_dim={card_dim}
                guides={guides}
                shouldSnap={shouldSnap}
              ></Guides> :
              null
          }

        </CardContainer>

        <BottomPanel
          changeType={changeType}
          typeInFocus={designs.typeInFocus}
        ></BottomPanel>
      </div>

      <RightPanel
        guides={guides}
        viewport={viewport}
        card_dim={card_dim}
        shouldAddTextType={shouldAddTextType}
        changeType={changeType}
      ></RightPanel>
    </div>
  );
}

export default App;
