import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import Video from 'react-native-video';

const Card = (props) => {



    const Instruction = styled.Text`
        font-size: 50px;
        font-family: "arial_rounded";   
        color:white;
        text-align: center;
    `;

    const Card = styled.View`
        height: ${props.card_dimensions.y}px;
        width: ${props.card_dimensions.x}px;
        border-radius: ${0.05 * props.card_dimensions.y}px;
        background: red;
        elevation: 10;
        pointer-events: none;
    `;

    return (
        <Card><Instruction>{props.text}</Instruction></Card>
    );
}


export default Card