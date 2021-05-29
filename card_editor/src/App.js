import './App.css';
import React, { memo, useEffect, useCallback, useState, useRef } from 'react';
import uniqid from 'uniqid';

import RightPanel from "./RightPanel.js"
import BottomPanel from "./BottomPanel.js"

import Card from "./Card.js"
import Guides from "./Guides.js"
import Rulers from "./Rulers.js"

import Element from "./Element.js"




const Store = function () {
  const [state, setState] = useState({});
  let r_state = useRef({});
  this.state = state;

  this.update = (id, element) => {

    r_state.current = { ...r_state.current, [id]: element }
    setState({ ...r_state.current, [id]: element });
  }
  this.delete = (id) => {
    let _state = { ...state };
    delete _state[id];
    r_state.current = _state;
    setState(_state);
  }

  this.updateAll = (_state) => {
    r_state.current = _state;
    setState(_state);
  }
}

const State = function (defaultValue) {
  const [state, setState] = useState(defaultValue);
  this.state = state;
  this.update = (value) => {
    setState(value);
  }
}


const Designs = function () {
  const [designs, setDesigns] = useState({
    action: {},
    speech: {},
    thoughts: {}
  });
  const [typeInFocus, setTypeInFocus] = useState('action');

  this.designs = designs;
  this.typeInFocus = typeInFocus;

  this.changeType = (type, archive) => {
    designs[typeInFocus] = { ...archive };
    setTypeInFocus(type);
    return { ...designs[type] };
  }
}

function App() {

  const [card_dim, setcard_dim] = useState({})
  const [shouldSnap, setShouldSnap] = useState(true);
  const r_pressedKeys = useRef({ shift: [], alt: [] })
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);

  const r_loremIpsum = useRef(['A week ago, when I returned home from doing my weekly groceries, I passed a theatre, ...'])

  const guides = new Store();
  guides.locked = new State(false);
  guides.hidden = new State(false);
  const elements = new Store();
  elements.blurredBorder = new State(true);
  elements.elementInFocus = new State(false);

  elements.focus = function (id) {
    this.elementInFocus.update(id);
  }
  /*   elements.focus = (id) => {
      Object.entries(elements.state).forEach(([_id, _element]) => {
        if (id == _id) {
          elements.update(id, { ..._element, focused: true })
        } else if (_element.focused) {
          elements.update(_id, { ..._element, focused: false })
        }
      })
    } */


  const designs = new Designs();

  const shouldAddTextType = new State(false);





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

    //console.log('upload image ', e);
    var file = e.dataTransfer.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function ({ target }) {
      //console.log(target);
      let img = new Image();
      img.onload = function () {
        // //console.log(elements.state)
        let element = {
          type: 'image',
          src: target.result,
          origin: position,
          dim: {
            width: 25,
            height: this.height / this.width * 25 * (card_dim.width / card_dim.height)
          },
          locked: false,
          z: Object.values(elements.state).length,
        }
        //console.log(element);
        elements.update(uniqid(), element);
      }
      img.src = target.result;

    }
    reader.readAsDataURL(file);

  }

  const dragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const changeType = (type) => {
    elements.updateAll(designs.changeType(type, elements.state));
  }

  return (
    <div className="app flex-container" onDragOver={dragOver} onDrop={uploadImage}>


      <div className='card-container' onMouseDown={() => { elements.focus(false) }}>
        <Rulers
          card_dim={card_dim}
          guides={guides}
          shouldSnap={shouldSnap}
        ></Rulers>

        <Card
          shouldSnap={shouldSnap}
          card_dim={card_dim}
          guides={guides}
          updateCardDim={updateCardDim}
          shiftPressed={shiftPressed}
          elements={elements}
          shouldAddTextType={shouldAddTextType}
        >
          <div className='elements'>
            {
              Object.entries(elements.state).map(([id, element]) =>
                <Element
                  key={id}
                  id={id}
                  element={element}

                  card_dim={card_dim}
                  elements={elements}
                  guides={guides}
                  shouldSnap={shouldSnap}
                  shiftPressed={shiftPressed}
                  altPressed={altPressed}
                  loremIpsum={r_loremIpsum.current}
                  typeInFocus={designs.typeInFocus}
                ></Element>
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

        </Card>

        <BottomPanel
          changeType={changeType}
          typeInFocus={designs.typeInFocus}
        ></BottomPanel>
      </div>

      <RightPanel
        guides={guides}
        elements={elements}
        card_dim={card_dim}
        shouldAddTextType={shouldAddTextType}
        changeType={changeType}
      ></RightPanel>
    </div>
  );
}

export default App;
