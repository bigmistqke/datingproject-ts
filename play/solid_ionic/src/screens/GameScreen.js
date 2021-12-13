import { createMemo, For, Show } from "solid-js";

import Card from "../components/Card";
// import Card from "../components/Card";
// import CardComposition from "../components/card/CardComposition";

import { styled } from 'solid-styled-components';
import Swipe from "../components/Swipe";
import { useStore } from "../store/Store";


function Game({ design, instructions }) {
  const [state, actions] = useStore();

  const waitYourTurn = (reason) => {
    if (!reason) {
      return;
    }
    try {
      Vibration.vibrate(200);
    } catch (e) { console.error(e) }
  };

  const Overlay = styled("div")`
        position: absolute;
        top: 25%;
        left: 50%;
        /* transform: translate(-50%, -50%); */
        color: rgb(71, 70, 70);
        box-shadow: 0px 0px 50px rgba(0, 0, 0, 0.096);
        background: rgb(239, 240, 240);
        font-family: Arial Rounded MT Bold;
        border-radius: 50px;
        padding-left: 37.5px;
        padding-right: 37.5px;
        padding-top: 25px;
        padding-bottom: 25px;
        line-height: 21pt;
        font-size: 16pt;
        z-index: 10;
        text-align: center;
        &.hidden{
            display: none
        }
    `;

  const End = styled("span")`
        font-size: 5px;
        font-family: arial_rounded;
        color: #03034e;
        background: transparent;
        border: none;
        width: 70%;
        text-align: center;
    `;


  const visible_instructions = createMemo(() =>
    state.instructions.slice(0,
      state.instructions.length < 10 ?
        state.instructions.length :
        10
    ).reverse(),
    [state.instructions]
  )


  const Game = () => <>
    {/* <Overlay ref={r_overlay} onClick={hideOverlay} className='overlay hidden'>
      <span>Wait Your Turn</span>
    </Overlay> */}
    <div className="Cards">
      <For each={visible_instructions}>{(instruction, i) =>
        <Card
          key={instruction.instruction_id}
          onSwipe={() => actions.swipe(instruction)}
          canSwipe={i === (instructions.length - 1)}
          margin={visible_instructions.length - i - 1}
          instruction={instruction}
        ></Card>
      }</For>
      <Show when={instructions.length < 2}>
        <End className='centered uiText'>The End</End>
      </Show>
    </div>
  </>

  return Game()
}

export default Game