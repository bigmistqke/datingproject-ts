import { createEffect, createSignal, createMemo, Show } from "solid-js";

import Tweener from "../helpers/tweener.js";
import { useStore } from '../store/Store.js';
import CardRenderer from './card/CardRenderer';
import VideoRenderer from './card/VideoRenderer.js';

import Swipe from './Swipe.js';

const Card = (props) => {
  const [, actions] = useStore();
  const [countdown, setCountdown] = createSignal(props.instruction.timespan);
  let countdown_interval = false;
  const tweener = new Tweener();

  const rotation_ref = useRef(new Animated.Value(1)).current;
  const rotation = rotation_ref.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })
  const inversed_rotation = rotation_ref.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  })

  // const flip = false;

  const flip = createMemo(() => {
    return props.instruction.prev_instruction_ids.length === 0
  }
    , [props.instruction.prev_instruction_ids]
  )



  createEffect(() => {
    if (!flip) return;
    tweener.tweenTo(1, 0, 125,
      (alpha) => rotation_ref.setValue(alpha)
    );
  }, [flip])



  createEffect(() => {
    if (flip && props.timespan && !countdown_interval.current) {
      let start = performance.now();
      countdown_interval.current = setInterval(() => {
        let delta = (performance.now() - start) / 1000;
        const c = props.timespan - delta;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdown_ref.current);
          actions.swipe(props.instruction);
        }
      }, 1000 / 30)
    }
  }, [flip, props.timespan])

  let can_swipe = createMemo(() => {
    if (!flip) return false;
    if (props.instruction.timespan && props.instruction.countdown !== 0) return false;
    return true;
  }, [props.instruction]);

  return (<>
    <Swipe
      setWaitYourTurn={props.setWaitYourTurn}
      onSwipe={() => actions.swipe(props.instruction)}
      can_swipe={can_swipe}
      margin={props.margin}
    >
      <Show when={flip}>
        <Animated.View
          style={{
            position: 'absolute',
            left: (Dimensions.get('window').width - parseInt(actions.getCardSize().width)) / 2,
            top: (Dimensions.get('window').height - parseInt(actions.getCardSize().height)) / 4,
            height: parseInt(actions.getCardSize().height),
            width: parseInt(actions.getCardSize().width),
            backfaceVisibility: 'hidden',
            transform: [{ rotateY: rotation }]
          }}
        >
          <Show when={props.instruction.type !== 'video'}>
            <CardRenderer
              countdown={countdown()}
              {...props}
            ></CardRenderer>
          </Show>
          <Show when={props.instruction.type === 'video'}>
            <VideoRenderer
              url={props.instruction.text}
              {...props}
            ></VideoRenderer>
          </Show>
        </Animated.View>
      </Show>

      <Animated.View
        style={{

          height: parseInt(actions.getCardSize().height),
          width: parseInt(actions.getCardSize().width),
          left: (Dimensions.get('window').width - parseInt(actions.getCardSize().width)) / 2,
          top: (Dimensions.get('window').height - parseInt(actions.getCardSize().height)) / 4,
          borderRadius: parseInt(actions.getBorderRadius() * 10),
          backgroundColor: 'blue',
          backfaceVisibility: 'hidden',
          transform: [{ rotateY: inversed_rotation }]
        }}
      >
        <CardRenderer {...props} instruction={{ type: "back" }}></CardRenderer>
      </Animated.View>
    </Swipe>
  </>
  );
}



export default Card