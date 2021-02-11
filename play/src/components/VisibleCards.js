import React, { useEffect } from 'react';
import { NormalCard } from "./CardTemplates";
import getNextCardIndex from "../helpers/getNextCardIndex"

function decodeSingleQuotes(text) {
    return text.replace(/&#039;/g, "'");
}

const VisibleCards = ({ instructions, index_instructions }) => {
    const getCard = (instruction, visible, i) => {
        return <NormalCard /* key={data.card_id} */
            style={{ zIndex: i }}
            canSwipe={true} text={instruction.text}
            type={instruction.type}
            flip={visible}
            swipeAction={() => { console.log(instruction) }}
        ></NormalCard>;
    }

    useEffect(() => {
        console.log(instructions);
    })

    const getVisibleCards = () => {
        console.log('instructions');
        if (!instructions) { return false }
        let visibleCards = [];
        console.log(instructions);
        instructions.map(function (instruction, i) {
            // if (i > (index_instructions + 3)) return;
            let visible = false;
            console.log(instruction);
            if (i === index_instructions) visible = true;
            visibleCards.push(getCard(instruction, visible, i));

        });
        return visibleCards;
    }



    return <div>{
        instructions ? [...instructions].reverse().map(function (instruction, i) {
            // if (i > (index_instructions + 3)) return;
            let visible = false;
            console.log(instruction);
            if (i === (instructions.length - 1) + index_instructions) visible = true;
            return <NormalCard
                style={{ zIndex: i }}
                canSwipe={true}
                text={instruction.text}
                type={instruction.type}
                flip={visible}
                swipeAction={() => { console.log(instruction) }}
            ></NormalCard>;
        }) : null
    }
    </div>
}

export default VisibleCards;