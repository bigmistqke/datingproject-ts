import paper from "paper";
import React, { useEffect, useRef } from 'react';



const BubbleCanvas = (props, ref) => {

    const chooseCard = () => {
        switch (props.type) {
            case "think":
                return <div></div>
            case "say":
                return <div></div>

            case "do":
                return <div></div>
                break;
            case "wait":
                return <div></div>
                break;
            case "empty":
                return <div></div>
                break;
            case "back":
                return <div></div>
                break;
            default:
                return <div></div>
                break;
        }

    }



    return (<div>
        {
            chooseCard()
        }
    </div>)

}

export default BubbleCanvas;