import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Dimensions, Animated } from 'react-native';
import styled from 'styled-components/native';
import Video from 'react-native-video';
import Tweener from "../helpers/tweener.js";
import { useStore } from '../Store.js';
import CardRenderer from './card/CardRenderer';
// import { SvgXml } from 'react-native-svg';

const Card = (props) => {
  const [state, { getCardSize }] = useStore();



  const tweener = useRef(new Tweener()).current;


  const rotateY = useRef(new Animated.Value(1)).current;
  const rotateY_ref = rotateY.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })
  const rotateY_back_ref = rotateY.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  })

  const flipCard = useCallback(() => {
    console.log("flip it", props);
    tweener.tweenTo(1, 0, 250,
      (alpha) => rotateY.setValue(alpha)
    );
  }, [])

  useEffect(() => {
    if (!props.flip) return;
    flipCard();
  }, [props.flip])

  useEffect(() => {
    console.log(rotateY_ref);
  }, [rotateY]);

  const Instruction = styled.Text`
        font-size: 50px;
        font-family: "arial_rounded";   
        color:white;
        text-align: center;
    `;



  const Card = styled.View`
        position: absolute;
       
        background: red;
        elevation: 10;
        /* backface-visibility: hidden; */
        pointer-events: none;
    `;

  const Test = styled.View`
    & .st0{
      fill:#49247F;
    }
  `

  return (<>
    <Animated.View
      style={{
        // position: 'absolute',
        height: getCardSize().height,
        width: getCardSize().width,
        borderRadius: 0.05 * getCardSize().height,
        backgroundColor: 'yellow',
        elevation: 10,
        backfaceVisibility: 'hidden',
        pointerEvents: 'none',
        // transform: [{ rotateY: rotateY_ref }]
      }}
    >
      <CardRenderer {...props}></CardRenderer>
    </Animated.View>



    {/*  <Animated.View
      style={{
        position: 'relative',
        height: getCardSize().height,
        width: getCardSize().width,
        borderRadius: 0.05 * getCardSize().height,
        backgroundColor: 'black',
        elevation: 10,
        // backfaceVisibility: 'hidden',
        pointerEvents: 'none',
        // overflow: 'hidden',
        // transform: [{ rotateY: rotateY_back_ref }]
      }}
    >
      <CardRenderer {...props}></CardRenderer>
    </Animated.View> */}
  </>

  );
}


export default Card