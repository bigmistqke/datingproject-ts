import { styled } from 'solid-styled-components';


export default function Prompt({ text, onSubmit }) {
  const Prompt = styled('div')`
        position: absolute;
        width: 90%;
        left: 5%;
        top: 5%;
        /* elevation: 10; */
        background: white;
        /* margin-left: -50%; */
    `

  const Buttons = styled('div')`
        flex-direction: row;
        width: 100%;
        /* background: red; */
        display: flex;
        justify-content: space-around;
        align-items: stretch;
        flex: 1;

    `
  const Button = styled('button')`
        background:lightgrey;
        align-self: stretch;
        flex:1;
        margin: 5px;
    `

  const Text = styled('span')`
        text-align: center;
    `

  return (
    <Prompt>
      <span>{text}</span>
      <Buttons>
        <Button onPress={() => onSubmit(true)}><span>yes</span></Button>
        <Button onPress={() => onSubmit(false)}><span>no</span></Button>

      </Buttons>
    </Prompt>
  )
}