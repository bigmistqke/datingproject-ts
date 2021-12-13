import CardCompositor from './CardComposition';
import { useStore } from '../../store/Store';
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { styled } from 'solid-styled-components';

const CardRenderer = props => {
  const [, { getCardSize }] = useStore();

  const [modes, setModes] = createStore({
    timed: props.timespan,
    choice: false
  });

  const CardContainer = styled("div")`
    position: absolute;
    /* transform: translate(-50%, -50%); */
    /* position: relative; */
    /* overflow: hidden; */
    left: 50%;
    top: 50%;
    background: transparent;
    /* elevation: 10; */
    /* box-shadow: 0px 0px 50px lightgrey; */

    /* overflow: hidden; */
    z-index: 5;
  `;


  const formatted_text = createMemo(() => {
    let formatted_text = [{ type: 'normal', content: props.instruction.text }];
    // regex
    const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g;
    let matches = String(props.text).match(regex_for_brackets);

    if (!matches) {
      setModes('choice', false);
      return formatted_text;
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      let split = formatted_text.shift().content.split(`${matches[i]}`);

      let multi_choice = matches[i].replace('[', '').replace(']', '');
      let choices = multi_choice.split('/');

      formatted_text = [
        { type: 'normal', content: split[0] },
        { type: 'choice', content: choices },
        { type: 'normal', content: split[1] },
        ...formatted_text,
      ];
    }
    setCardState('choice', true);
    return formatted_text;
  }, [props.instruction.text]);

  return (
    <>
      <CardContainer
        className="CardContainer"
        style={{
          height: getCardSize().height,
          width: getCardSize().width,
          borderRadius: 0.05 * getCardSize().height,
          transform: [
            { translateY: getCardSize().height * -0.5 },
            { translateX: getCardSize().width * -0.5 }
          ],

          // 'border-radius': state.design ? '125px' : 0,
        }}>
        <div className="viewport">
          <CardCompositor
            formatted_text={formatted_text}
            modes={modes}
            {...props}
          ></CardCompositor>
        </div>
      </CardContainer>
    </>
  );
};

export default CardRenderer;
