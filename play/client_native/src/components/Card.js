import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Dimensions, Animated } from 'react-native';
import styled from 'styled-components/native';
import Video from 'react-native-video';
import Tweener from "../helpers/tweener.js";

const Card = (props) => {
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
        height: ${props.card_dimensions.y}px;
        width: ${props.card_dimensions.x}px;
        border-radius: ${0.05 * props.card_dimensions.y}px;
        background: red;
        elevation: 10;
        backface-visibility: hidden;
        pointer-events: none;
    `;

    return (<>
        <Animated.View
            style={{
                position: 'absolute',
                height: props.card_dimensions.y,
                width: props.card_dimensions.x,
                borderRadius: 0.05 * props.card_dimensions.y,
                backgroundColor: 'red',
                elevation: 10,
                backfaceVisibility: 'hidden',
                pointerEvents: 'none',
                transform: [{ rotateY: rotateY_ref }]
            }}
        ><Instruction>{props.text}</Instruction></Animated.View>
        <Animated.View
            style={{
                position: 'absolute',
                height: props.card_dimensions.y,
                width: props.card_dimensions.x,
                borderRadius: 0.05 * props.card_dimensions.y,
                backgroundColor: 'black',
                elevation: 10,
                backfaceVisibility: 'hidden',
                pointerEvents: 'none',
                transform: [{ rotateY: rotateY_back_ref }]
            }}
        ><Instruction>back</Instruction></Animated.View>
    </>

    );
}


export default Card