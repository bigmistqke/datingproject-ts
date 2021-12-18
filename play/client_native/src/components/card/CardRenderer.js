import CardCompositor from './CardComposition';

import { useStore } from '../../store/Store';
import React, { useState, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import createStore from '../../createStore';



const CardRenderer = React.memo(props => {
  const [, actions] = useStore();

  const CardContainer = styled.View`
    position: absolute;
    /* transform: translate(-50%, -50%); */
    /* position: relative; */
    /* overflow: hidden; */
    left: 50%;
    top: 50%;
    background: transparent;
    elevation: 10;
    /* box-shadow: 0px 0px 50px lightgrey; */

    /* overflow: hidden; */
    z-index: 5;
  `;


  return (
    useMemo(() =>
      <>
        <CardContainer
          className="CardContainer"
          style={{
            position: "relative",
            flex: 1,
            height: actions.getCardSize().height,
            width: actions.getCardSize().width,
            borderRadius: 0.05 * actions.getCardSize().height,
            transform: [
              { translateY: actions.getCardSize().height * -0.5 },
              { translateX: actions.getCardSize().width * -0.5 }
            ],

            // 'border-radius': state.design ? '125px' : 0,
          }}>
          {/* <View className="viewport"> */}
          <CardCompositor
            modes={{
              timed: props.instruction.timespan,
              choice: props.text && props.text.length > 0
            }}
            {...props}
          ></CardCompositor>
          {/* </View> */}
        </CardContainer>
      </>
    )

  );
}, (prev, next) => {
  return prev.canSwipe === next.canSwipe
});

export default CardRenderer;
