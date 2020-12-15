
import React, { useEffect, useState, useRef } from 'react';
import {NormalCard} from "./CardTemplates";
import getNextCardIndex from "../helpers/getNextCardIndex"

function EndCards({script, scriptIndex, roleId}){
    let endCard = (script, scriptIndex, roleId) => {
        if(!script || script.length == 1){return null};
        let nextIndex = getNextCardIndex(script, scriptIndex);
        if(!nextIndex || nextIndex < scriptIndex){
            let flip = (scriptIndex == (script.length - 1)) ? true : false;
            return <NormalCard canPlay={true} data={{type: "wait", text: "the end"}} zIndex="0" flip={flip} swipeAction={()=>{console.log("the end!")}}></NormalCard>;
        }else{
            return null;
        }
    }

    return <div>{endCard(script, scriptIndex, roleId)}</div>
}

export default EndCards;