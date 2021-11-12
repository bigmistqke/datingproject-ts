import styled from 'styled-components/native';
import React from 'react';


export default function Prompt({ text, onSubmit }) {
    const Prompt = styled.View`
        position: absolute;
        width: 90%;
        left: 5%;
        top: 5%;
        elevation: 10;
        background: white;
        /* margin-left: -50%; */
    `

    const Buttons = styled.View`
        flex-direction: row;
        width: 100%;
        /* background: red; */
        display: flex;
        justify-content: space-around;
        align-items: stretch;
        flex: 1;

    `
    const Button = styled.TouchableOpacity`
        background:lightgrey;
        align-self: stretch;
        flex:1;
        margin: 5px;
    `

    const Text = styled.Text`
        text-align: center;
    `

    return (
        <Prompt>
            <Text>{text}</Text>
            <Buttons>
                <Button onPress={() => onSubmit(true)}><Text>yes</Text></Button>
                <Button onPress={() => onSubmit(false)}><Text>no</Text></Button>

            </Buttons>
        </Prompt>
    )
}