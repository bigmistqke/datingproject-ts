import React from 'react';
import { NormalCard } from "./CardTemplates";
import getNextCardIndex from "../helpers/getNextCardIndex"

function decodeSingleQuotes(text) {
    return text.replace(/&#039;/g, "'");
}

const VisibleCards = ({ instructions, index_instructions }) => {
    const getCard = (instruction, visible) => {
        return <NormalCard /* key={data.card_id} */
            style={{ zIndex: instruction.instruction_order_role }}
            canSwipe={true} text={instruction.text}
            type={instruction.type}
            flip={visible}
            swipeAction={() => { swipeAction(instruction) }}
        ></NormalCard>;
    }

    const getVisibleCards = () => {
        if (!instructions) { return false }
        let visibleCards = [];
        console.log(instructions);
        instructions.map(function (instruction, i) {
            if (i > (index_instructions + 3)) return;
            let visible = false;
            if (i === index_instructions && (!prev_instruction_ids || prev_instruction_ids.length === 0)) visible = true;
            visibleCards.push(getCard(instruction, visible));

        });
        return visibleCards;
    }

    return <div>{getVisibleCards()}</div>
}

export default VisibleCards;