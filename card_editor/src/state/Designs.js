import { useState, useRef } from 'react';
import Store from "../helpers/react/Store.js"
import State from "../helpers/react/State.js"

const Designs = function () {
    Store.call(this);

    const typeInFocus = new State('do');
    this.typeInFocus = typeInFocus.state;

    this.changeType = ({ type }) => {
        typeInFocus.update(type);
        return { ...this.state[type] };
    }

    this.getFocusedDesign = () => {
        return this.state[this.typeInFocus];
    }

    this.archive = ({ type, data }) => {
        // if(!type) type =
        type = type ? type : this.typeInFocus;
        this.update(type, data);
        console.log(this.state);
        return this.state;
    }
}

export default Designs
